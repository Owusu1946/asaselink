import { ORPCError } from "@orpc/server";
import { and, eq, isNotNull, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@asaselink/db";
import { buyerProfiles, users } from "@asaselink/db/schema";
import { protectedProcedure } from "../index";
import { enforceRateLimit } from "../security/rate-limit";
import { requireCompanyAccess, requireCompanyPermission } from "../security/company-access";

const paymentMethod = z.enum(["MTN_MOMO", "TELECEL_CASH", "AIRTELTIGO_MONEY", "BANK_TRANSFER"]);
const uuid = z.string().uuid();
const money = z.coerce.number().positive().max(100_000_000).transform((value) => value.toFixed(2));

async function requireBuyer(clerkId: string) {
  const [buyer] = await db.select({ id: users.id }).from(users)
    .innerJoin(buyerProfiles, and(eq(buyerProfiles.userId, users.id), isNotNull(buyerProfiles.completedAt)))
    .where(and(eq(users.clerkId, clerkId), eq(users.status, "active"))).limit(1);
  if (!buyer) throw new ORPCError("FORBIDDEN", { message: "Complete your buyer profile before purchasing a plot." });
  return buyer;
}

async function requireAdmin(clerkId: string) {
  const [admin] = await db.select({ id: users.id, isAdmin: users.isAdmin }).from(users).where(and(eq(users.clerkId, clerkId), eq(users.status, "active"))).limit(1);
  if (!admin?.isAdmin) throw new ORPCError("FORBIDDEN");
  return admin;
}

function ref(prefix: string) {
  return `${prefix}-${crypto.randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase()}`;
}

function requireUserId(context: { auth?: { userId?: string | null } | null }) {
  const clerkId = context.auth?.userId;
  if (!clerkId) throw new ORPCError("UNAUTHORIZED");
  return clerkId;
}

export const paymentRouter = {
  checkout: protectedProcedure.input(z.object({ reservationReference: z.string().trim().min(4).max(32) })).handler(async ({ context, input }) => {
    const buyer = await requireBuyer(requireUserId(context));
    const result = await db.execute(sql`
      SELECT r.reference AS "reservationReference", r.type AS "reservationType", r.status AS "reservationStatus",
        CASE WHEN r.type='PAID_HOLD' THEN r.hold_fee_snapshot ELSE r.price_snapshot END AS amount,
        r.price_snapshot AS "plotPrice", r.refundable_amount_snapshot AS "refundableAmount",
        r.administrative_deduction_snapshot AS "administrativeDeduction", r.terms_snapshot AS terms,
        r.payment_deadline_at AS "paymentDeadlineAt", r.expires_at AS "expiresAt", now() AS "serverNow",
        p.plot_number AS "plotNumber", e.name AS "estateName", c.trade_name AS "companyName",
        pay.reference AS "paymentReference", pay.status AS "paymentStatus", pay.method, pay.purpose
      FROM reservations r
      JOIN plots p ON p.id=r.plot_id JOIN estates e ON e.id=p.estate_id JOIN companies c ON c.id=e.company_id
      LEFT JOIN LATERAL (
        SELECT reference, status, method, purpose FROM payments WHERE reservation_id=r.id ORDER BY created_at DESC LIMIT 1
      ) pay ON true
      WHERE r.reference=${input.reservationReference} AND r.buyer_user_id=${buyer.id}
      LIMIT 1
    `);
    const checkout = result.rows[0];
    if (!checkout) throw new ORPCError("NOT_FOUND");
    return checkout;
  }),

  initiate: protectedProcedure.input(z.object({
    reservationReference: z.string().trim().min(4).max(32),
    method: paymentMethod,
    phone: z.string().trim().regex(/^\+?[0-9]{9,15}$/).optional(),
  }).superRefine((value, ctx) => {
    if (value.method !== "BANK_TRANSFER" && !value.phone) ctx.addIssue({ code: "custom", path: ["phone"], message: "A mobile money number is required." });
  })).handler(async ({ context, input }) => {
    const clerkId = requireUserId(context);
    await enforceRateLimit(clerkId, "payment.initiate", 12);
    const buyer = await requireBuyer(clerkId);
    const reference = ref("PAY");
    const providerReference = ref("MOCK");
    const result = await db.execute(sql`
      WITH eligible AS MATERIALIZED (
        SELECT r.id, r.type, r.price_snapshot, r.hold_fee_snapshot, e.company_id
        FROM reservations r JOIN plots p ON p.id=r.plot_id JOIN estates e ON e.id=p.estate_id
        WHERE r.reference=${input.reservationReference} AND r.buyer_user_id=${buyer.id}
          AND r.status IN ('CHECKOUT_LOCKED','HOLD_PAYMENT_PENDING','PURCHASE_IN_PROGRESS') AND r.expires_at > now()
        FOR UPDATE OF r
      ), created AS (
        INSERT INTO payments (reference, reservation_id, buyer_user_id, company_id, provider, provider_reference, method, status, purpose, amount, platform_fee_amount, developer_net_amount, currency, payer_phone, payer_network)
        SELECT ${reference}, id, ${buyer.id}, company_id, 'MOCK', ${providerReference}, ${input.method}, 'INITIATED',
          CASE WHEN type='PAID_HOLD' THEN 'HOLD_FEE' ELSE 'PURCHASE' END,
          CASE WHEN type='PAID_HOLD' THEN hold_fee_snapshot ELSE price_snapshot END, 0,
          CASE WHEN type='PAID_HOLD' THEN hold_fee_snapshot ELSE price_snapshot END,
          'GHS', ${input.phone ?? null}, ${input.method === "BANK_TRANSFER" ? null : input.method}
        FROM eligible ON CONFLICT DO NOTHING
        RETURNING id, reference, reservation_id, status, method, purpose, amount, currency, created_at AS "createdAt"
      ), selected AS (
        SELECT * FROM created UNION ALL
        SELECT p.id, p.reference, p.reservation_id, p.status, p.method, p.purpose, p.amount, p.currency, p.created_at AS "createdAt"
        FROM payments p JOIN eligible e ON e.id=p.reservation_id
        WHERE p.status IN ('INITIATED','PENDING_CONFIRMATION','SUCCEEDED') AND NOT EXISTS (SELECT 1 FROM created)
        ORDER BY "createdAt" DESC LIMIT 1
      ), moved AS (
        UPDATE reservations SET status='PURCHASE_IN_PROGRESS', updated_at=now()
        WHERE id=(SELECT reservation_id FROM selected) AND type='CHECKOUT_LOCK' AND status='CHECKOUT_LOCKED'
      ), evented AS (
        INSERT INTO payment_events (payment_id, event_key, type, to_status, actor_user_id, metadata)
        SELECT id, 'payment.initiated:' || id::text, 'payment.initiated', status, ${buyer.id}, jsonb_build_object('method', method)
        FROM created ON CONFLICT (event_key) DO NOTHING
      ) SELECT id, reference, status, method, purpose, amount, currency, "createdAt" FROM selected
    `);
    const payment = result.rows[0];
    if (!payment) throw new ORPCError("CONFLICT", { message: "This reservation expired or can no longer be paid." });
    return payment;
  }),

  submitMockPayment: protectedProcedure.input(z.object({
    paymentReference: z.string().trim().min(4).max(40),
    bankTransferReference: z.string().trim().min(5).max(96).optional(),
  })).handler(async ({ context, input }) => {
    const clerkId = requireUserId(context);
    await enforceRateLimit(clerkId, "payment.mock.submit", 12);
    const buyer = await requireBuyer(clerkId);
    const eventKey = `payment.submitted:${input.paymentReference}`;
    const result = await db.execute(sql`
      WITH changed AS (
        UPDATE payments SET status='PENDING_CONFIRMATION', bank_transfer_reference=CASE WHEN method='BANK_TRANSFER' THEN ${input.bankTransferReference ?? null}::text ELSE bank_transfer_reference END, updated_at=now()
        WHERE reference=${input.paymentReference} AND buyer_user_id=${buyer.id} AND status='INITIATED'
          AND (method <> 'BANK_TRANSFER' OR ${input.bankTransferReference ?? null}::text IS NOT NULL)
        RETURNING id, reference, status, method, amount, currency
      ), evented AS (
        INSERT INTO payment_events (payment_id, event_key, type, from_status, to_status, actor_user_id)
        SELECT id, ${eventKey}, 'payment.submitted_for_verification', 'INITIATED', status, ${buyer.id} FROM changed
        ON CONFLICT (event_key) DO NOTHING
      ), outboxed AS (
        INSERT INTO outbox_events (topic, aggregate_id, payload)
        SELECT 'payment.verification_requested', id::text, jsonb_build_object('paymentId', id, 'reference', reference) FROM changed
      ) SELECT reference, status, method, amount, currency FROM changed
    `);
    const payment = result.rows[0];
    if (!payment) {
      const existing = await db.execute(sql`SELECT reference, status, method, amount, currency FROM payments WHERE reference=${input.paymentReference} AND buyer_user_id=${buyer.id} AND status IN ('PENDING_CONFIRMATION','SUCCEEDED') LIMIT 1`);
      if (existing.rows[0]) return existing.rows[0];
      throw new ORPCError("CONFLICT", { message: "Payment could not be submitted. Bank transfers require a transfer reference." });
    }
    return payment;
  }),

  listMine: protectedProcedure.handler(async ({ context }) => {
    const buyer = await requireBuyer(requireUserId(context));
    return db.execute(sql`
      SELECT pay.reference, pay.status, pay.method, pay.purpose, pay.amount, pay.currency, pay.created_at AS "createdAt", pay.confirmed_at AS "confirmedAt",
        r.reference AS "reservationReference", p.plot_number AS "plotNumber", e.name AS "estateName"
      FROM payments pay JOIN reservations r ON r.id=pay.reservation_id JOIN plots p ON p.id=r.plot_id JOIN estates e ON e.id=p.estate_id
      WHERE pay.buyer_user_id=${buyer.id} ORDER BY pay.created_at DESC LIMIT 100
    `).then((result) => result.rows);
  }),

  companySummary: protectedProcedure.input(z.object({ companyId: uuid })).handler(async ({ context, input }) => {
    await requireCompanyAccess(requireUserId(context), input.companyId);
    const balance = await db.execute(sql`
      SELECT coalesce(sum(CASE WHEN type IN ('SALE_CREDIT','ADJUSTMENT_CREDIT') AND status='AVAILABLE' THEN amount WHEN type IN ('PAYOUT_DEBIT','REFUND_DEBIT','ADJUSTMENT_DEBIT') AND status IN ('PENDING','AVAILABLE','SETTLED') THEN -amount ELSE 0 END), 0)::numeric(14,2) AS available,
        coalesce(sum(CASE WHEN type='SALE_CREDIT' AND status='PENDING' THEN amount ELSE 0 END), 0)::numeric(14,2) AS pending
      FROM company_ledger_entries WHERE company_id=${input.companyId}
    `);
    const payments = await db.execute(sql`
      SELECT pay.reference, pay.status, pay.method, pay.purpose, pay.amount, pay.developer_net_amount AS "developerNetAmount", pay.created_at AS "createdAt", pay.confirmed_at AS "confirmedAt", p.plot_number AS "plotNumber", e.name AS "estateName"
      FROM payments pay JOIN reservations r ON r.id=pay.reservation_id JOIN plots p ON p.id=r.plot_id JOIN estates e ON e.id=p.estate_id
      WHERE pay.company_id=${input.companyId} ORDER BY pay.created_at DESC LIMIT 100
    `);
    const payouts = await db.execute(sql`SELECT reference, amount, currency, status, destination_type AS "destinationType", destination, review_note AS "reviewNote", requested_at AS "requestedAt", reviewed_at AS "reviewedAt", paid_at AS "paidAt" FROM payout_requests WHERE company_id=${input.companyId} ORDER BY created_at DESC LIMIT 100`);
    return { balance: balance.rows[0], payments: payments.rows, payouts: payouts.rows };
  }),

  requestPayout: protectedProcedure.input(z.object({
    companyId: uuid,
    amount: money,
    destination: z.discriminatedUnion("type", [
      z.object({ type: z.literal("MOBILE_MONEY"), network: z.enum(["MTN_MOMO", "TELECEL_CASH", "AIRTELTIGO_MONEY"]), phone: z.string().trim().regex(/^\+?[0-9]{9,15}$/), accountName: z.string().trim().min(2).max(120) }),
      z.object({ type: z.literal("BANK_ACCOUNT"), bankName: z.string().trim().min(2).max(120), accountNumber: z.string().trim().min(6).max(34), accountName: z.string().trim().min(2).max(120) }),
    ]),
  })).handler(async ({ context, input }) => {
    const clerkId = requireUserId(context);
    await enforceRateLimit(clerkId, "payout.request", 6);
    const access = await requireCompanyPermission(clerkId, input.companyId, "finance:manage");
    const reference = ref("OUT");
    const result = await db.execute(sql`
      WITH locked AS MATERIALIZED (SELECT pg_advisory_xact_lock(hashtext(${input.companyId}))),
      balance AS MATERIALIZED (
        SELECT coalesce(sum(CASE WHEN type IN ('SALE_CREDIT','ADJUSTMENT_CREDIT') AND status='AVAILABLE' THEN amount WHEN type IN ('PAYOUT_DEBIT','REFUND_DEBIT','ADJUSTMENT_DEBIT') AND status IN ('PENDING','AVAILABLE','SETTLED') THEN -amount ELSE 0 END), 0) AS amount
        FROM company_ledger_entries, locked WHERE company_id=${input.companyId}
      ), created AS (
        INSERT INTO payout_requests (reference, company_id, requested_by_user_id, amount, currency, status, destination_type, destination)
        SELECT ${reference}, ${input.companyId}, ${access.user.id}, ${input.amount}, 'GHS', 'REQUESTED', ${input.destination.type}, ${JSON.stringify(input.destination)}::jsonb
        FROM balance WHERE amount >= ${input.amount}
        RETURNING id, reference, amount, currency, status, destination_type AS "destinationType", requested_at AS "requestedAt"
      ), ledgered AS (
        INSERT INTO company_ledger_entries (company_id, payout_request_id, type, status, amount, currency, description)
        SELECT ${input.companyId}, id, 'PAYOUT_DEBIT', 'PENDING', amount, currency, 'Payout request ' || reference FROM created
      ), audited AS (
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata)
        SELECT ${access.user.id}, 'payout.requested', 'payout_request', id::text, jsonb_build_object('reference', reference, 'amount', amount) FROM created
      ) SELECT reference, amount, currency, status, "destinationType", "requestedAt" FROM created
    `);
    if (!result.rows[0]) throw new ORPCError("CONFLICT", { message: "The payout exceeds the company’s available balance." });
    return result.rows[0];
  }),

  adminQueue: protectedProcedure.handler(async ({ context }) => {
    await requireAdmin(requireUserId(context));
    const payments = await db.execute(sql`
      SELECT pay.reference, pay.provider, pay.provider_reference AS "providerReference", pay.status, pay.method, pay.purpose, pay.amount, pay.currency,
        pay.bank_transfer_reference AS "bankTransferReference", pay.failure_reason AS "failureReason", pay.created_at AS "createdAt", pay.confirmed_at AS "confirmedAt",
        r.reference AS "reservationReference", p.plot_number AS "plotNumber", e.name AS "estateName", c.legal_name AS "companyName", u.email AS "buyerEmail"
      FROM payments pay JOIN reservations r ON r.id=pay.reservation_id JOIN plots p ON p.id=r.plot_id JOIN estates e ON e.id=p.estate_id JOIN companies c ON c.id=pay.company_id JOIN users u ON u.id=pay.buyer_user_id
      ORDER BY pay.created_at DESC LIMIT 200
    `);
    const payouts = await db.execute(sql`SELECT pr.reference, pr.amount, pr.currency, pr.status, pr.destination_type AS "destinationType", pr.destination, pr.requested_at AS "requestedAt", c.legal_name AS "companyName" FROM payout_requests pr JOIN companies c ON c.id=pr.company_id ORDER BY pr.created_at DESC LIMIT 200`);
    return { payments: payments.rows, payouts: payouts.rows };
  }),

  adminTimeline: protectedProcedure.input(z.object({ paymentReference: z.string().trim().min(4).max(40) })).handler(async ({ context, input }) => {
    await requireAdmin(requireUserId(context));
    return db.execute(sql`
      SELECT pe.type, pe.from_status AS "fromStatus", pe.to_status AS "toStatus", pe.metadata, pe.created_at AS "createdAt",
        coalesce(concat_ws(' ',u.first_name,u.last_name), u.email, 'System') AS actor
      FROM payment_events pe JOIN payments pay ON pay.id=pe.payment_id LEFT JOIN users u ON u.id=pe.actor_user_id
      WHERE pay.reference=${input.paymentReference} ORDER BY pe.created_at DESC
    `).then((result) => result.rows);
  }),

  reviewPayment: protectedProcedure.input(z.object({ paymentReference: z.string().trim().min(4).max(40), decision: z.enum(["APPROVE", "REJECT"]), reason: z.string().trim().min(5).max(500) })).handler(async ({ context, input }) => {
    const clerkId = requireUserId(context);
    await enforceRateLimit(clerkId, "admin.payment.review", 60);
    const admin = await requireAdmin(clerkId);
    const result = input.decision === "APPROVE" ? await db.execute(sql`
      WITH candidate AS MATERIALIZED (
        SELECT pay.id,pay.reference,pay.reservation_id,pay.company_id,pay.developer_net_amount,pay.currency,pay.purpose,
          r.status AS reservation_status,r.plot_id,
          pa.id AS purchase_account_id,pa.price_snapshot,
          coalesce(sum(CASE WHEN ple.status='CONFIRMED' AND ple.direction='CREDIT' THEN ple.amount WHEN ple.status='CONFIRMED' AND ple.direction='DEBIT' THEN -ple.amount ELSE 0 END),0) AS net_paid
        FROM payments pay JOIN reservations r ON r.id=pay.reservation_id JOIN plots p ON p.id=r.plot_id
        LEFT JOIN purchase_accounts pa ON pa.source_reservation_id=r.id
        LEFT JOIN purchase_ledger_entries ple ON ple.purchase_account_id=pa.id
        WHERE pay.reference=${input.paymentReference} AND pay.status='PENDING_CONFIRMATION' AND p.status='RESERVED'
        GROUP BY pay.id,r.id,pa.id
      ), paid AS (
        UPDATE payments pay SET status='SUCCEEDED',confirmed_at=now(),updated_at=now()
        FROM candidate c WHERE pay.id=c.id AND (
          (c.purpose='HOLD_FEE' AND c.reservation_status='HOLD_PAYMENT_PENDING') OR
          (c.purpose='PURCHASE' AND c.reservation_status='PURCHASE_IN_PROGRESS' AND c.purchase_account_id IS NULL) OR
          (c.purpose IN ('DEPOSIT','INSTALLMENT','BALANCE','FINAL_PAYMENT') AND c.purchase_account_id IS NOT NULL
            AND c.net_paid + c.developer_net_amount <= c.price_snapshot)
        ) RETURNING pay.id,pay.reference,pay.reservation_id,pay.company_id,pay.developer_net_amount,pay.currency,pay.purpose
      ), purchase_ledgered AS (
        INSERT INTO purchase_ledger_entries (purchase_account_id,payment_id,reservation_id,reference,type,direction,amount,actor_user_id,reason)
        SELECT c.purchase_account_id,paid.id,paid.reservation_id,'LED-'||replace(gen_random_uuid()::text,'-',''),paid.purpose,'CREDIT',paid.developer_net_amount,${admin.id},${input.reason}
        FROM paid JOIN candidate c ON c.id=paid.id WHERE paid.purpose IN ('DEPOSIT','INSTALLMENT','BALANCE','FINAL_PAYMENT')
        ON CONFLICT (payment_id,type) DO NOTHING RETURNING purchase_account_id
      ), purchase_totals AS (
        SELECT pa.id,pa.price_snapshot,
          coalesce(sum(CASE WHEN ple.status='CONFIRMED' AND ple.direction='CREDIT' THEN ple.amount WHEN ple.status='CONFIRMED' AND ple.direction='DEBIT' THEN -ple.amount ELSE 0 END),0) AS net_paid
        FROM purchase_accounts pa JOIN purchase_ledgered inserted ON inserted.purchase_account_id=pa.id
        LEFT JOIN purchase_ledger_entries ple ON ple.purchase_account_id=pa.id GROUP BY pa.id
      ), purchase_completed AS (
        UPDATE purchase_accounts pa SET status='COMPLETED',completed_at=now(),updated_at=now()
        FROM purchase_totals totals WHERE pa.id=totals.id AND totals.net_paid=totals.price_snapshot
        RETURNING pa.id,pa.source_reservation_id
      ), transitioned AS (
        UPDATE reservations r SET
          status=CASE WHEN paid.purpose='HOLD_FEE' THEN 'HELD'
            WHEN paid.purpose='PURCHASE' OR purchase_completed.id IS NOT NULL THEN 'SOLD' ELSE r.status END,
          hold_started_at=CASE WHEN paid.purpose='HOLD_FEE' THEN now() ELSE r.hold_started_at END,
          activated_at=CASE WHEN paid.purpose IN ('HOLD_FEE','PURCHASE') OR purchase_completed.id IS NOT NULL THEN now() ELSE r.activated_at END,
          expires_at=CASE WHEN paid.purpose='HOLD_FEE' THEN now()+make_interval(mins=>r.hold_duration_minutes_snapshot) ELSE r.expires_at END,
          updated_at=now()
        FROM paid LEFT JOIN purchase_completed ON purchase_completed.source_reservation_id=paid.reservation_id
        WHERE r.id=paid.reservation_id RETURNING r.id,r.reference,r.plot_id,r.status,paid.purpose
      ), sold AS (
        UPDATE plots SET status='SOLD',updated_at=now()
        WHERE id=(SELECT plot_id FROM transitioned WHERE status='SOLD') AND status='RESERVED'
      ), company_ledgered AS (
        INSERT INTO company_ledger_entries (company_id,payment_id,type,status,amount,currency,description,available_at)
        SELECT company_id,id,'SALE_CREDIT','AVAILABLE',developer_net_amount,currency,'Verified purchase payment '||reference,now()
        FROM paid WHERE purpose IN ('PURCHASE','DEPOSIT','INSTALLMENT','BALANCE','FINAL_PAYMENT') ON CONFLICT (payment_id,type) DO NOTHING
      ), evented AS (
        INSERT INTO payment_events (payment_id,event_key,type,from_status,to_status,actor_user_id,metadata)
        SELECT id,'payment.approved:'||id::text,CASE WHEN purpose='HOLD_FEE' THEN 'hold.payment_approved' ELSE 'purchase.payment_approved' END,
          'PENDING_CONFIRMATION','SUCCEEDED',${admin.id},jsonb_build_object('reason',${input.reason}::text,'purpose',purpose) FROM paid
        ON CONFLICT (event_key) DO NOTHING
      ), audited AS (
        INSERT INTO audit_logs (user_id,action,entity_type,entity_id,reason,metadata)
        SELECT ${admin.id},CASE WHEN status='SOLD' THEN 'reservation.sold' WHEN purpose='HOLD_FEE' THEN 'reservation.hold_activated' ELSE 'purchase.payment_confirmed' END,
          'reservation',id::text,${input.reason},jsonb_build_object('status',status,'purpose',purpose) FROM transitioned
      ), outboxed AS (
        INSERT INTO outbox_events (topic,aggregate_id,payload)
        SELECT CASE WHEN transitioned.status='SOLD' THEN 'purchase.completed' WHEN paid.purpose='HOLD_FEE' THEN 'reservation.hold_activated' ELSE 'purchase.payment_confirmed' END,
          transitioned.id::text,jsonb_build_object('paymentId',paid.id,'reservationId',paid.reservation_id,'reference',paid.reference,'purpose',paid.purpose)
        FROM paid JOIN transitioned ON transitioned.id=paid.reservation_id
      ) SELECT paid.reference,'SUCCEEDED' AS status,paid.purpose,transitioned.status AS "reservationStatus"
        FROM paid JOIN transitioned ON transitioned.id=paid.reservation_id
    `) : await db.execute(sql`
      WITH failed AS (
        UPDATE payments SET status='FAILED',failed_at=now(),failure_reason=${input.reason},updated_at=now()
        WHERE reference=${input.paymentReference} AND status='PENDING_CONFIRMATION'
        RETURNING id,reference,reservation_id,purpose
      ), cancelled AS (
        UPDATE reservations r SET status='CANCELLED',cancelled_at=now(),cancellation_reason=${input.reason},released_at=now(),release_reason=${input.reason},updated_at=now()
        FROM failed WHERE r.id=failed.reservation_id AND failed.purpose IN ('PURCHASE','HOLD_FEE')
        RETURNING r.id,r.plot_id,failed.purpose
      ), released AS (
        UPDATE plots SET status='AVAILABLE',updated_at=now() WHERE id=(SELECT plot_id FROM cancelled) AND status='RESERVED'
      ), evented AS (
        INSERT INTO payment_events (payment_id,event_key,type,from_status,to_status,actor_user_id,metadata)
        SELECT id,'payment.rejected:'||id::text,'payment.rejected','PENDING_CONFIRMATION','FAILED',${admin.id},jsonb_build_object('reason',${input.reason}::text,'purpose',purpose)
        FROM failed ON CONFLICT (event_key) DO NOTHING
      ), audited AS (
        INSERT INTO audit_logs (user_id,action,entity_type,entity_id,reason,metadata)
        SELECT ${admin.id},'payment.rejected','payment',id::text,${input.reason},jsonb_build_object('purpose',purpose) FROM failed
      ), outboxed AS (
        INSERT INTO outbox_events (topic,aggregate_id,payload)
        SELECT 'plot.available',plot_id::text,jsonb_build_object('plotId',plot_id) FROM cancelled
      ) SELECT reference,'FAILED' AS status,purpose FROM failed
    `);
    if (!result.rows[0]) throw new ORPCError("CONFLICT", { message: "Only payments awaiting verification can be reviewed." });
    return result.rows[0];
  }),

  reviewPayout: protectedProcedure.input(z.object({ payoutReference: z.string().trim().min(4).max(40), decision: z.enum(["MARK_PAID", "REJECT"]), reason: z.string().trim().min(5).max(500) })).handler(async ({ context, input }) => {
    const clerkId = requireUserId(context);
    await enforceRateLimit(clerkId, "admin.payout.review", 60);
    const admin = await requireAdmin(clerkId);
    const next = input.decision === "MARK_PAID" ? "PAID" : "REJECTED";
    const ledgerStatus = input.decision === "MARK_PAID" ? "SETTLED" : "REVERSED";
    const result = await db.execute(sql`
      WITH changed AS (
        UPDATE payout_requests SET status=${next}, reviewed_by_user_id=${admin.id}, review_note=${input.reason}, reviewed_at=now(), paid_at=CASE WHEN ${next}='PAID' THEN now() ELSE NULL END, updated_at=now()
        WHERE reference=${input.payoutReference} AND status='REQUESTED'
        RETURNING id, reference, status
      ), ledgered AS (
        UPDATE company_ledger_entries SET status=${ledgerStatus}, settled_at=CASE WHEN ${ledgerStatus}='SETTLED' THEN now() ELSE NULL END
        WHERE payout_request_id=(SELECT id FROM changed) AND type='PAYOUT_DEBIT'
      ), audited AS (
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, reason)
        SELECT ${admin.id}, CASE WHEN status='PAID' THEN 'payout.paid' ELSE 'payout.rejected' END, 'payout_request', id::text, ${input.reason} FROM changed
      ), outboxed AS (
        INSERT INTO outbox_events (topic, aggregate_id, payload)
        SELECT CASE WHEN status='PAID' THEN 'payout.paid' ELSE 'payout.rejected' END, id::text, jsonb_build_object('payoutId', id, 'reference', reference) FROM changed
      ) SELECT reference, status FROM changed
    `);
    if (!result.rows[0]) throw new ORPCError("CONFLICT", { message: "Only requested payouts can be reviewed." });
    return result.rows[0];
  }),
};
