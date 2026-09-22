import { ORPCError } from "@orpc/server";
import { and, eq, isNotNull, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@asaselink/db";
import { buyerProfiles, users } from "@asaselink/db/schema";
import { protectedProcedure } from "../index";
import { enforceRateLimit } from "../security/rate-limit";
import { requireCompanyAccess } from "../security/company-access";

const reference = z.string().trim().min(4).max(40);
const uuid = z.string().uuid();
const stage = z.enum(["DEPOSIT", "INSTALLMENT", "BALANCE", "FINAL_PAYMENT"]);
const method = z.enum(["MTN_MOMO", "TELECEL_CASH", "AIRTELTIGO_MONEY", "BANK_TRANSFER"]);
const money = z.coerce.number().positive().max(100_000_000).transform((value) => value.toFixed(2));

function makeReference(prefix: string) {
  return `${prefix}-${crypto.randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase()}`;
}

async function requireBuyer(clerkId: string) {
  const [buyer] = await db.select({ id: users.id }).from(users)
    .innerJoin(buyerProfiles, and(eq(buyerProfiles.userId, users.id), isNotNull(buyerProfiles.completedAt)))
    .where(and(eq(users.clerkId, clerkId), eq(users.status, "active"))).limit(1);
  if (!buyer) throw new ORPCError("FORBIDDEN", { message: "Complete your buyer profile before purchasing a plot." });
  return buyer;
}

async function requireAdmin(clerkId: string) {
  const [admin] = await db.select({ id: users.id, isAdmin: users.isAdmin }).from(users)
    .where(and(eq(users.clerkId, clerkId), eq(users.status, "active"))).limit(1);
  if (!admin?.isAdmin) throw new ORPCError("FORBIDDEN");
  return admin;
}

function clerkId(context: { auth?: { userId?: string | null } | null }) {
  const id = context.auth?.userId;
  if (!id) throw new ORPCError("UNAUTHORIZED");
  return id;
}

const totalsSql = sql`
  coalesce(sum(CASE WHEN l.status='CONFIRMED' AND l.direction='CREDIT' THEN l.amount WHEN l.status='CONFIRMED' AND l.direction='DEBIT' THEN -l.amount ELSE 0 END), 0)::numeric(14,2)
`;

export const purchaseRouter = {
  start: protectedProcedure.input(z.object({ reservationReference: reference, agreedDueAt: z.coerce.date().optional() })).handler(async ({ context, input }) => {
    const buyer = await requireBuyer(clerkId(context));
    const accountReference = makeReference("PUR");
    const ledgerReference = makeReference("LED");
    const result = await db.execute(sql`
      WITH eligible AS MATERIALIZED (
        SELECT r.id AS reservation_id, r.plot_id, r.price_snapshot, r.type, e.id AS estate_id, e.company_id,
          hold_payment.id AS hold_payment_id, hold_payment.amount AS hold_amount
        FROM reservations r JOIN plots p ON p.id=r.plot_id JOIN estates e ON e.id=p.estate_id
        LEFT JOIN LATERAL (
          SELECT id, amount FROM payments WHERE reservation_id=r.id AND purpose='HOLD_FEE' AND status='SUCCEEDED' ORDER BY confirmed_at DESC LIMIT 1
        ) hold_payment ON true
        WHERE r.reference=${input.reservationReference} AND r.buyer_user_id=${buyer.id}
          AND ((r.status='HELD' AND r.expires_at > now()) OR (r.status='CHECKOUT_LOCKED' AND r.expires_at > now()))
          AND p.status='RESERVED' FOR UPDATE OF r, p
      ), created AS (
        INSERT INTO purchase_accounts (reference, buyer_user_id, company_id, estate_id, plot_id, source_reservation_id, price_snapshot, status, agreed_due_at)
        SELECT ${accountReference}, ${buyer.id}, company_id, estate_id, plot_id, reservation_id, price_snapshot,
          'PURCHASE_IN_PROGRESS', ${input.agreedDueAt ?? null} FROM eligible
        ON CONFLICT (source_reservation_id) DO NOTHING
        RETURNING id, reference, source_reservation_id, price_snapshot, status
      ), selected AS (
        SELECT id, reference, source_reservation_id, price_snapshot, status FROM created
        UNION ALL
        SELECT pa.id, pa.reference, pa.source_reservation_id, pa.price_snapshot, pa.status
        FROM purchase_accounts pa JOIN eligible e ON e.reservation_id=pa.source_reservation_id
        WHERE NOT EXISTS (SELECT 1 FROM created) LIMIT 1
      ), hold_credit AS (
        INSERT INTO purchase_ledger_entries (purchase_account_id, payment_id, reservation_id, reference, type, direction, amount, actor_user_id, reason)
        SELECT selected.id, eligible.hold_payment_id, eligible.reservation_id, ${ledgerReference}, 'HOLD_CREDIT', 'CREDIT', eligible.hold_amount,
          ${buyer.id}, 'Paid hold applied to purchase'
        FROM selected JOIN eligible ON eligible.reservation_id=selected.source_reservation_id
        WHERE eligible.type='PAID_HOLD' AND eligible.hold_payment_id IS NOT NULL
        ON CONFLICT DO NOTHING
      ), moved AS (
        UPDATE reservations SET status='PURCHASE_IN_PROGRESS', updated_at=now()
        WHERE id=(SELECT source_reservation_id FROM selected) AND status IN ('HELD','CHECKOUT_LOCKED')
      ), audited AS (
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata)
        SELECT ${buyer.id}, 'purchase.started', 'purchase_account', id::text,
          jsonb_build_object('reference', reference, 'reservationId', source_reservation_id) FROM created
      ), outboxed AS (
        INSERT INTO outbox_events (topic, aggregate_id, payload)
        SELECT 'purchase.started', id::text, jsonb_build_object('purchaseId', id, 'reference', reference) FROM created
      ) SELECT id, reference, price_snapshot AS "priceSnapshot", status FROM selected
    `);
    if (!result.rows[0]) throw new ORPCError("CONFLICT", { message: "This hold or checkout is no longer eligible to start a purchase." });
    return result.rows[0];
  }),

  listMine: protectedProcedure.handler(async ({ context }) => {
    const buyer = await requireBuyer(clerkId(context));
    return db.execute(sql`
      SELECT pa.id, pa.reference, pa.status, pa.price_snapshot AS "priceSnapshot", pa.agreed_due_at AS "agreedDueAt",
        pa.created_at AS "createdAt", p.plot_number AS "plotNumber", e.name AS "estateName",
        ${totalsSql} AS "netPaid", greatest(pa.price_snapshot - ${totalsSql}, 0)::numeric(14,2) AS outstanding
      FROM purchase_accounts pa JOIN plots p ON p.id=pa.plot_id JOIN estates e ON e.id=pa.estate_id
      LEFT JOIN purchase_ledger_entries l ON l.purchase_account_id=pa.id
      WHERE pa.buyer_user_id=${buyer.id}
      GROUP BY pa.id,p.plot_number,e.name ORDER BY pa.created_at DESC
    `).then((result) => result.rows);
  }),

  detail: protectedProcedure.input(z.object({ purchaseReference: reference })).handler(async ({ context, input }) => {
    const buyer = await requireBuyer(clerkId(context));
    const accounts = await db.execute(sql`
      SELECT pa.id, pa.reference, pa.status, pa.price_snapshot AS "priceSnapshot", pa.currency,
        pa.agreed_due_at AS "agreedDueAt", pa.created_at AS "createdAt", p.plot_number AS "plotNumber",
        e.name AS "estateName", c.trade_name AS "companyName", r.reference AS "reservationReference",
        coalesce(sum(CASE WHEN l.type='HOLD_CREDIT' AND l.status='CONFIRMED' THEN l.amount ELSE 0 END),0)::numeric(14,2) AS "holdCredit",
        ${totalsSql} AS "netPaid", greatest(pa.price_snapshot - ${totalsSql},0)::numeric(14,2) AS outstanding,
        now() AS "serverNow"
      FROM purchase_accounts pa JOIN plots p ON p.id=pa.plot_id JOIN estates e ON e.id=pa.estate_id
      JOIN companies c ON c.id=pa.company_id JOIN reservations r ON r.id=pa.source_reservation_id
      LEFT JOIN purchase_ledger_entries l ON l.purchase_account_id=pa.id
      WHERE pa.reference=${input.purchaseReference} AND pa.buyer_user_id=${buyer.id}
      GROUP BY pa.id,p.plot_number,e.name,c.trade_name,r.reference LIMIT 1
    `);
    const account = accounts.rows[0];
    if (!account) throw new ORPCError("NOT_FOUND");
    const entries = await db.execute(sql`
      SELECT reference,type,direction,status,amount,currency,reason,created_at AS "createdAt"
      FROM purchase_ledger_entries WHERE purchase_account_id=${String(account.id)}::uuid ORDER BY created_at
    `);
    const payments = await db.execute(sql`
      SELECT reference,purpose,status,method,amount,currency,created_at AS "createdAt",confirmed_at AS "confirmedAt",failure_reason AS "failureReason"
      FROM payments WHERE reservation_id=(SELECT source_reservation_id FROM purchase_accounts WHERE id=${String(account.id)}::uuid)
        AND purpose IN ('DEPOSIT','INSTALLMENT','BALANCE','FINAL_PAYMENT') ORDER BY created_at
    `);
    return { account, entries: entries.rows, payments: payments.rows };
  }),

  initiatePayment: protectedProcedure.input(z.object({
    purchaseReference: reference, stage, amount: money, method,
    phone: z.string().trim().regex(/^\+?[0-9]{9,15}$/).optional(),
  }).superRefine((value, ctx) => {
    if (value.method !== "BANK_TRANSFER" && !value.phone) ctx.addIssue({ code: "custom", path: ["phone"], message: "A mobile money number is required." });
  })).handler(async ({ context, input }) => {
    const actor = clerkId(context);
    await enforceRateLimit(actor, "purchase.payment.initiate", 20);
    const buyer = await requireBuyer(actor);
    const paymentReference = makeReference("PAY");
    const providerReference = makeReference("MOCK");
    const result = await db.execute(sql`
      WITH locked AS MATERIALIZED (SELECT pg_advisory_xact_lock(hashtext(${input.purchaseReference}))),
      account AS MATERIALIZED (
        SELECT pa.id, pa.source_reservation_id, pa.company_id, pa.price_snapshot,
          coalesce(sum(CASE WHEN l.status='CONFIRMED' AND l.direction='CREDIT' THEN l.amount WHEN l.status='CONFIRMED' AND l.direction='DEBIT' THEN -l.amount ELSE 0 END),0) AS net_paid
        FROM purchase_accounts pa CROSS JOIN locked LEFT JOIN purchase_ledger_entries l ON l.purchase_account_id=pa.id
        WHERE pa.reference=${input.purchaseReference} AND pa.buyer_user_id=${buyer.id} AND pa.status='PURCHASE_IN_PROGRESS'
        GROUP BY pa.id
      ), created AS (
        INSERT INTO payments (reference,reservation_id,buyer_user_id,company_id,provider,provider_reference,method,status,purpose,amount,platform_fee_amount,developer_net_amount,currency,payer_phone,payer_network)
        SELECT ${paymentReference},source_reservation_id,${buyer.id},company_id,'MOCK',${providerReference},${input.method},'INITIATED',${input.stage},
          ${input.amount},0,${input.amount},'GHS',${input.phone ?? null},${input.method === "BANK_TRANSFER" ? null : input.method}
        FROM account WHERE ${input.amount}::numeric > 0 AND ${input.amount}::numeric <= price_snapshot-net_paid
        ON CONFLICT DO NOTHING
        RETURNING id,reference,status,purpose,method,amount,currency,created_at AS "createdAt"
      ), evented AS (
        INSERT INTO payment_events (payment_id,event_key,type,to_status,actor_user_id,metadata)
        SELECT id,'payment.initiated:'||id::text,'purchase.payment_initiated',status,${buyer.id},jsonb_build_object('purpose',purpose,'purchaseReference',${input.purchaseReference}::text)
        FROM created ON CONFLICT (event_key) DO NOTHING
      ) SELECT * FROM created
    `);
    if (!result.rows[0]) throw new ORPCError("CONFLICT", { message: "The amount exceeds the outstanding balance or another payment is awaiting review." });
    return result.rows[0];
  }),

  listCompany: protectedProcedure.input(z.object({ companyId: uuid })).handler(async ({ context, input }) => {
    await requireCompanyAccess(clerkId(context), input.companyId);
    return db.execute(sql`
      SELECT pa.reference,pa.status,pa.price_snapshot AS "priceSnapshot",pa.agreed_due_at AS "agreedDueAt",pa.created_at AS "createdAt",
        p.plot_number AS "plotNumber",e.name AS "estateName",u.email AS "buyerEmail",
        ${totalsSql} AS "netPaid",greatest(pa.price_snapshot-${totalsSql},0)::numeric(14,2) AS outstanding
      FROM purchase_accounts pa JOIN plots p ON p.id=pa.plot_id JOIN estates e ON e.id=pa.estate_id JOIN users u ON u.id=pa.buyer_user_id
      LEFT JOIN purchase_ledger_entries l ON l.purchase_account_id=pa.id
      WHERE pa.company_id=${input.companyId} GROUP BY pa.id,p.plot_number,e.name,u.email ORDER BY pa.created_at DESC
    `).then((result) => result.rows);
  }),

  adminList: protectedProcedure.handler(async ({ context }) => {
    await requireAdmin(clerkId(context));
    return db.execute(sql`
      SELECT pa.reference,pa.status,pa.price_snapshot AS "priceSnapshot",pa.created_at AS "createdAt",p.plot_number AS "plotNumber",
        e.name AS "estateName",c.legal_name AS "companyName",u.email AS "buyerEmail",
        ${totalsSql} AS "netPaid",greatest(pa.price_snapshot-${totalsSql},0)::numeric(14,2) AS outstanding
      FROM purchase_accounts pa JOIN plots p ON p.id=pa.plot_id JOIN estates e ON e.id=pa.estate_id JOIN companies c ON c.id=pa.company_id
      JOIN users u ON u.id=pa.buyer_user_id LEFT JOIN purchase_ledger_entries l ON l.purchase_account_id=pa.id
      GROUP BY pa.id,p.plot_number,e.name,c.legal_name,u.email ORDER BY pa.created_at DESC
    `).then((result) => result.rows);
  }),

  adminAdjustment: protectedProcedure.input(z.object({ purchaseReference: reference, direction: z.enum(["CREDIT", "DEBIT"]), amount: money, reason: z.string().trim().min(8).max(500) })).handler(async ({ context, input }) => {
    const admin = await requireAdmin(clerkId(context));
    const ledgerReference = makeReference("ADJ");
    const result = await db.execute(sql`
      WITH locked AS MATERIALIZED (SELECT pg_advisory_xact_lock(hashtext(${input.purchaseReference}))),
      account AS MATERIALIZED (
        SELECT pa.id,pa.price_snapshot,coalesce(sum(CASE WHEN l.status='CONFIRMED' AND l.direction='CREDIT' THEN l.amount WHEN l.status='CONFIRMED' AND l.direction='DEBIT' THEN -l.amount ELSE 0 END),0) AS net_paid
        FROM purchase_accounts pa CROSS JOIN locked LEFT JOIN purchase_ledger_entries l ON l.purchase_account_id=pa.id
        WHERE pa.reference=${input.purchaseReference} AND pa.status IN ('PURCHASE_IN_PROGRESS','COMPLETED','PAID') GROUP BY pa.id
      ), inserted AS (
        INSERT INTO purchase_ledger_entries (purchase_account_id,reference,type,direction,amount,actor_user_id,reason)
        SELECT id,${ledgerReference},'ADJUSTMENT',${input.direction},${input.amount},${admin.id},${input.reason}
        FROM account WHERE ${input.direction}='DEBIT' OR ${input.amount}::numeric <= price_snapshot-net_paid
        RETURNING id,purchase_account_id,reference,direction,amount
      ), audited AS (
        INSERT INTO audit_logs (user_id,action,entity_type,entity_id,reason,metadata)
        SELECT ${admin.id},'purchase.adjusted','purchase_account',purchase_account_id::text,${input.reason},jsonb_build_object('direction',direction,'amount',amount,'reference',reference) FROM inserted
      ) SELECT reference,direction,amount FROM inserted
    `);
    if (!result.rows[0]) throw new ORPCError("CONFLICT", { message: "Adjustment would over-credit the purchase or the account is not adjustable." });
    return result.rows[0];
  }),

  adminRefund: protectedProcedure.input(z.object({ purchaseReference: reference, amount: money, reason: z.string().trim().min(8).max(500) })).handler(async ({ context, input }) => {
    const admin = await requireAdmin(clerkId(context));
    const ledgerReference = makeReference("REF");
    const result = await db.execute(sql`
      WITH locked AS MATERIALIZED (SELECT pg_advisory_xact_lock(hashtext(${input.purchaseReference}))),
      account AS MATERIALIZED (
        SELECT pa.id,pa.source_reservation_id,pa.plot_id,coalesce(sum(CASE WHEN l.status='CONFIRMED' AND l.direction='CREDIT' THEN l.amount WHEN l.status='CONFIRMED' AND l.direction='DEBIT' THEN -l.amount ELSE 0 END),0) AS net_paid
        FROM purchase_accounts pa CROSS JOIN locked LEFT JOIN purchase_ledger_entries l ON l.purchase_account_id=pa.id
        WHERE pa.reference=${input.purchaseReference} AND pa.status IN ('PURCHASE_IN_PROGRESS','PAID','COMPLETED') GROUP BY pa.id
      ), refunded AS (
        INSERT INTO purchase_ledger_entries (purchase_account_id,reference,type,direction,amount,actor_user_id,reason)
        SELECT id,${ledgerReference},'REFUND','DEBIT',${input.amount},${admin.id},${input.reason} FROM account
        WHERE ${input.amount}::numeric <= net_paid RETURNING id,purchase_account_id,reference,amount
      ), reopened AS (
        UPDATE purchase_accounts SET status='REFUND_PENDING',updated_at=now() WHERE id=(SELECT purchase_account_id FROM refunded)
        RETURNING source_reservation_id,plot_id
      ), reservation_reopened AS (
        UPDATE reservations SET status='PURCHASE_IN_PROGRESS',updated_at=now() WHERE id=(SELECT source_reservation_id FROM reopened) AND status='SOLD'
      ), plot_reopened AS (
        UPDATE plots SET status='RESERVED',updated_at=now() WHERE id=(SELECT plot_id FROM reopened) AND status='SOLD'
      ), payment_refunded AS (
        UPDATE payments SET status='REFUNDED',updated_at=now() WHERE reservation_id=(SELECT source_reservation_id FROM reopened)
          AND status='SUCCEEDED' AND purpose IN ('DEPOSIT','INSTALLMENT','BALANCE','FINAL_PAYMENT')
          AND ${input.amount}::numeric=(SELECT net_paid FROM account)
      ), audited AS (
        INSERT INTO audit_logs (user_id,action,entity_type,entity_id,reason,metadata)
        SELECT ${admin.id},'purchase.refund_posted','purchase_account',purchase_account_id::text,${input.reason},jsonb_build_object('amount',amount,'reference',reference) FROM refunded
      ), outboxed AS (
        INSERT INTO outbox_events (topic,aggregate_id,payload)
        SELECT 'purchase.refund_posted',purchase_account_id::text,jsonb_build_object('purchaseId',purchase_account_id,'amount',amount,'reference',reference) FROM refunded
      ) SELECT reference,amount FROM refunded
    `);
    if (!result.rows[0]) throw new ORPCError("CONFLICT", { message: "Refund exceeds confirmed net payments or the account cannot be refunded." });
    return result.rows[0];
  }),
};
