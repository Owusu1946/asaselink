import { ORPCError } from "@orpc/server";
import { and, eq, isNotNull, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@asaselink/db";
import { buyerProfiles, users } from "@asaselink/db/schema";
import { protectedProcedure } from "../index";
import { enforceRateLimit } from "../security/rate-limit";
import { requireCompanyAccess, requireCompanyPermission } from "../security/company-access";

const uuid = z.string().uuid();

async function requireReadyBuyer(clerkId: string) {
  const [buyer] = await db
    .select({ id: users.id })
    .from(users)
    .innerJoin(
      buyerProfiles,
      and(eq(buyerProfiles.userId, users.id), isNotNull(buyerProfiles.completedAt)),
    )
    .where(and(eq(users.clerkId, clerkId), eq(users.status, "active")))
    .limit(1);
  if (!buyer)
    throw new ORPCError("FORBIDDEN", {
      message: "Complete your buyer profile before reserving a plot.",
    });
  return buyer;
}

async function requireAdmin(clerkId: string) {
  const [admin] = await db
    .select({ id: users.id, isAdmin: users.isAdmin })
    .from(users)
    .where(and(eq(users.clerkId, clerkId), eq(users.status, "active")))
    .limit(1);
  if (!admin?.isAdmin) throw new ORPCError("FORBIDDEN");
  return admin;
}

export const reservationRouter = {
  commercialTerms: protectedProcedure.handler(async ({ context }) => {
    if (!context.auth?.userId) throw new ORPCError("UNAUTHORIZED");
    const result = await db.execute(sql`
      SELECT checkout_lock_minutes AS "checkoutLockMinutes", hold_payment_window_minutes AS "holdPaymentWindowMinutes",
        hold_duration_minutes AS "holdDurationMinutes", hold_fee AS "holdFee", refund_percentage AS "refundPercentage",
        administrative_deduction AS "administrativeDeduction", terms_version AS "termsVersion", terms
      FROM reservation_commercial_settings WHERE active=true LIMIT 1
    `);
    if (!result.rows[0])
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Reservation terms are not configured.",
      });
    return result.rows[0];
  }),

  create: protectedProcedure
    .input(
      z.object({
        plotId: uuid,
        type: z.enum(["CHECKOUT_LOCK", "PAID_HOLD"]).default("CHECKOUT_LOCK"),
      }),
    )
    .handler(async ({ context, input }) => {
      const clerkId = context.auth?.userId;
      if (!clerkId) throw new ORPCError("UNAUTHORIZED");
      await enforceRateLimit(clerkId, "reservation.create", 10);
      const buyer = await requireReadyBuyer(clerkId);
      const reference = `ASL-${crypto.randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase()}`;
      const result = await db.execute(sql`
      WITH settings AS MATERIALIZED (
        SELECT * FROM reservation_commercial_settings WHERE active=true LIMIT 1
      ), claimed AS (
        UPDATE plots p SET status = 'RESERVED', updated_at = now()
        FROM estates e JOIN companies c ON c.id = e.company_id
        WHERE p.id = ${input.plotId} AND p.estate_id = e.id AND p.status = 'AVAILABLE'
          AND e.status = 'approved' AND c.status = 'approved'
        RETURNING p.id, p.price
      ), created AS (
        INSERT INTO reservations (
          reference, plot_id, buyer_user_id, type, status, price_snapshot, checkout_lock_minutes_snapshot,
          hold_duration_minutes_snapshot, hold_fee_snapshot, refund_percentage_snapshot,
          administrative_deduction_snapshot, refundable_amount_snapshot, terms_version_snapshot, terms_snapshot,
          payment_deadline_at, expires_at
        )
        SELECT ${reference}, claimed.id, ${buyer.id}, ${input.type},
          CASE WHEN ${input.type}='PAID_HOLD' THEN 'HOLD_PAYMENT_PENDING' ELSE 'CHECKOUT_LOCKED' END,
          claimed.price, settings.checkout_lock_minutes,
          CASE WHEN ${input.type}='PAID_HOLD' THEN settings.hold_duration_minutes END,
          CASE WHEN ${input.type}='PAID_HOLD' THEN settings.hold_fee END,
          CASE WHEN ${input.type}='PAID_HOLD' THEN settings.refund_percentage END,
          CASE WHEN ${input.type}='PAID_HOLD' THEN settings.administrative_deduction END,
          CASE WHEN ${input.type}='PAID_HOLD' THEN greatest(round(settings.hold_fee * settings.refund_percentage / 100, 2) - settings.administrative_deduction, 0) END,
          CASE WHEN ${input.type}='PAID_HOLD' THEN settings.terms_version END,
          CASE WHEN ${input.type}='PAID_HOLD' THEN settings.terms END,
          CASE WHEN ${input.type}='PAID_HOLD' THEN now() + make_interval(mins => settings.hold_payment_window_minutes) END,
          now() + make_interval(mins => CASE WHEN ${input.type}='PAID_HOLD' THEN settings.hold_payment_window_minutes ELSE settings.checkout_lock_minutes END)
        FROM claimed CROSS JOIN settings
        RETURNING id, reference, plot_id AS "plotId", type, status, price_snapshot AS "priceSnapshot",
          hold_fee_snapshot AS "holdFee", refundable_amount_snapshot AS "refundableAmount",
          payment_deadline_at AS "paymentDeadlineAt", expires_at AS "expiresAt"
      ), audited AS (
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata)
        SELECT ${buyer.id}, CASE WHEN type='PAID_HOLD' THEN 'reservation.hold_payment_started' ELSE 'reservation.checkout_locked' END,
          'reservation', id::text, jsonb_build_object('plotId', "plotId", 'reference', reference, 'type', type, 'status', status) FROM created
      ), outboxed AS (
        INSERT INTO outbox_events (topic, aggregate_id, payload)
        SELECT CASE WHEN type='PAID_HOLD' THEN 'reservation.hold_payment_started' ELSE 'reservation.checkout_locked' END,
          id::text, jsonb_build_object('reservationId', id, 'plotId', "plotId", 'reference', reference, 'type', type, 'status', status) FROM created
      ) SELECT * FROM created
    `);
      const reservation = result.rows[0];
      if (!reservation)
        throw new ORPCError("CONFLICT", { message: "This plot is no longer available." });
      return reservation;
    }),

  listMine: protectedProcedure.handler(async ({ context }) => {
    const clerkId = context.auth?.userId;
    if (!clerkId) throw new ORPCError("UNAUTHORIZED");
    const buyer = await requireReadyBuyer(clerkId);
    return db
      .execute(sql`
      SELECT r.id, r.reference, r.type, r.status, r.price_snapshot AS "priceSnapshot", r.hold_fee_snapshot AS "holdFee",
        r.refundable_amount_snapshot AS "refundableAmount", r.payment_deadline_at AS "paymentDeadlineAt",
        r.hold_started_at AS "holdStartedAt", r.activated_at AS "activatedAt", r.released_at AS "releasedAt",
        r.release_reason AS "releaseReason", r.expires_at AS "expiresAt",
        p.id AS "plotId", p.plot_number AS "plotNumber", e.name AS "estateName", e.slug AS "estateSlug",
        purchase.reference AS "purchaseReference"
      FROM reservations r JOIN plots p ON p.id = r.plot_id JOIN estates e ON e.id = p.estate_id
      LEFT JOIN purchase_accounts purchase ON purchase.source_reservation_id = r.id
      WHERE r.buyer_user_id = ${buyer.id} ORDER BY r.created_at DESC LIMIT 100
    `)
      .then((result) => result.rows);
  }),

  listCompany: protectedProcedure
    .input(
      z.object({
        companyId: uuid,
        status: z
          .enum([
            "ALL",
            "CHECKOUT_LOCKED",
            "HOLD_PAYMENT_PENDING",
            "HELD",
            "PURCHASE_IN_PROGRESS",
            "SOLD",
            "CANCELLED",
            "EXPIRED",
            "RELEASED",
          ])
          .default("ALL"),
        search: z.string().trim().max(100).optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      const clerkId = context.auth?.userId;
      if (!clerkId) throw new ORPCError("UNAUTHORIZED");
      await requireCompanyAccess(clerkId, input.companyId);
      const search = input.search ? `%${input.search}%` : null;
      return db
        .execute(sql`
      SELECT r.id, r.reference, r.type, r.status, r.price_snapshot AS "priceSnapshot", r.hold_fee_snapshot AS "holdFee",
        r.refundable_amount_snapshot AS "refundableAmount", r.payment_deadline_at AS "paymentDeadlineAt",
        r.hold_started_at AS "holdStartedAt", r.activated_at AS "activatedAt", r.released_at AS "releasedAt",
        r.release_reason AS "releaseReason", r.expires_at AS "expiresAt",
        r.cancelled_at AS "cancelledAt", r.cancellation_reason AS "cancellationReason", r.created_at AS "createdAt",
        p.plot_number AS "plotNumber", p.status AS "plotStatus", e.id AS "estateId", e.name AS "estateName",
        u.email AS "buyerEmail", u.first_name AS "buyerFirstName", u.last_name AS "buyerLastName", u.phone_number AS "buyerPhone",
        pay.reference AS "paymentReference", pay.status AS "paymentStatus", pay.method AS "paymentMethod", pay.created_at AS "paymentCreatedAt",
        refund.status AS "refundStatus", refund.amount AS "refundAmount"
      FROM reservations r
      JOIN plots p ON p.id=r.plot_id JOIN estates e ON e.id=p.estate_id JOIN users u ON u.id=r.buyer_user_id
      LEFT JOIN LATERAL (SELECT reference, status, method, created_at FROM payments WHERE reservation_id=r.id ORDER BY created_at DESC LIMIT 1) pay ON true
      LEFT JOIN reservation_refunds refund ON refund.reservation_id=r.id
      WHERE e.company_id=${input.companyId}
        AND (${input.status}='ALL' OR r.status=${input.status})
        AND (${search}::text IS NULL OR r.reference ILIKE ${search} OR p.plot_number ILIKE ${search} OR e.name ILIKE ${search}
          OR coalesce(u.email,'') ILIKE ${search} OR concat_ws(' ',u.first_name,u.last_name) ILIKE ${search})
      ORDER BY CASE WHEN r.status IN ('CHECKOUT_LOCKED','HOLD_PAYMENT_PENDING','HELD','PURCHASE_IN_PROGRESS') THEN 0 ELSE 1 END, r.created_at DESC LIMIT 250
    `)
        .then((result) => result.rows);
    }),

  cancelCompany: protectedProcedure
    .input(
      z.object({
        companyId: uuid,
        reference: z.string().trim().min(4).max(32),
        reason: z.string().trim().min(5).max(500),
      }),
    )
    .handler(async ({ context, input }) => {
      const clerkId = context.auth?.userId;
      if (!clerkId) throw new ORPCError("UNAUTHORIZED");
      const access = await requireCompanyPermission(clerkId, input.companyId, "reservation:manage");
      const result = await db.execute(sql`
      WITH cancelled AS (
        UPDATE reservations r SET status='CANCELLED', cancelled_at=now(), cancellation_reason=${input.reason},
          released_at=now(), release_reason=${input.reason}, updated_at=now()
        FROM plots p, estates e WHERE r.reference=${input.reference} AND r.status IN ('CHECKOUT_LOCKED','HOLD_PAYMENT_PENDING','HELD','PURCHASE_IN_PROGRESS')
          AND p.id=r.plot_id AND e.id=p.estate_id AND e.company_id=${input.companyId}
        RETURNING r.id, r.reference, r.plot_id, r.type, r.refundable_amount_snapshot, r.administrative_deduction_snapshot
      ), payments_cancelled AS (
        UPDATE payments SET status='CANCELLED', failed_at=now(), failure_reason=${input.reason}, updated_at=now()
        WHERE reservation_id=(SELECT id FROM cancelled) AND status IN ('INITIATED','PENDING_CONFIRMATION') RETURNING id
      ), payment_evented AS (
        INSERT INTO payment_events (payment_id, event_key, type, to_status, actor_user_id, metadata)
        SELECT id, 'payment.company_cancelled:' || id::text, 'payment.cancelled_by_company', 'CANCELLED', ${access.user.id}, jsonb_build_object('reason', ${input.reason}::text)
        FROM payments_cancelled ON CONFLICT (event_key) DO NOTHING
      ), refund_created AS (
        INSERT INTO reservation_refunds (reservation_id, amount, deduction, reason)
        SELECT id, refundable_amount_snapshot, administrative_deduction_snapshot, ${input.reason}
        FROM cancelled WHERE type='PAID_HOLD' AND refundable_amount_snapshot IS NOT NULL
          AND EXISTS (SELECT 1 FROM payments WHERE reservation_id=cancelled.id AND purpose='HOLD_FEE' AND status='SUCCEEDED')
        ON CONFLICT (reservation_id) DO NOTHING RETURNING id, reservation_id, amount, deduction
      ), released AS (
        UPDATE plots SET status='AVAILABLE', updated_at=now() WHERE id=(SELECT plot_id FROM cancelled) AND status='RESERVED' RETURNING id
      ), audited AS (
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, reason, metadata)
        SELECT ${access.user.id}, 'reservation.cancelled_by_company', 'reservation', id::text, ${input.reason}, jsonb_build_object('reference', reference) FROM cancelled
      ), outboxed AS (
        INSERT INTO outbox_events (topic, aggregate_id, payload)
        SELECT 'reservation.cancelled', id::text, jsonb_build_object('reservationId', id, 'reference', reference, 'reason', ${input.reason}::text) FROM cancelled
        UNION ALL
        SELECT 'plot.available', id::text, jsonb_build_object('plotId', id) FROM released
        UNION ALL
        SELECT 'reservation.refund_requested', id::text, jsonb_build_object('refundId', id, 'reservationId', reservation_id, 'amount', amount, 'deduction', deduction) FROM refund_created
      ) SELECT reference, 'CANCELLED' AS status FROM cancelled
    `);
      if (!result.rows[0])
        throw new ORPCError("CONFLICT", {
          message: "Only a live checkout or hold can be cancelled.",
        });
      return result.rows[0];
    }),

  adminList: protectedProcedure
    .input(
      z.object({
        search: z.string().trim().max(100).optional(),
        status: z
          .enum([
            "ALL",
            "CHECKOUT_LOCKED",
            "HOLD_PAYMENT_PENDING",
            "HELD",
            "PURCHASE_IN_PROGRESS",
            "SOLD",
            "CANCELLED",
            "EXPIRED",
            "RELEASED",
          ])
          .default("ALL"),
      }),
    )
    .handler(async ({ context, input }) => {
      const clerkId = context.auth?.userId;
      if (!clerkId) throw new ORPCError("UNAUTHORIZED");
      await requireAdmin(clerkId);
      const search = input.search ? `%${input.search}%` : null;
      return db
        .execute(sql`
      SELECT r.id, r.reference, r.type, r.status, r.price_snapshot AS "priceSnapshot", r.hold_fee_snapshot AS "holdFee",
        r.refundable_amount_snapshot AS "refundableAmount", r.payment_deadline_at AS "paymentDeadlineAt",
        r.hold_started_at AS "holdStartedAt", r.activated_at AS "activatedAt", r.expires_at AS "expiresAt", r.created_at AS "createdAt",
        r.cancellation_reason AS "cancellationReason", p.plot_number AS "plotNumber", p.status AS "plotStatus",
        e.name AS "estateName", c.legal_name AS "companyName", u.email AS "buyerEmail",
        concat_ws(' ',u.first_name,u.last_name) AS "buyerName", u.phone_number AS "buyerPhone",
        pay.reference AS "paymentReference", pay.provider_reference AS "providerReference", pay.status AS "paymentStatus", pay.method AS "paymentMethod", pay.failure_reason AS "paymentFailureReason",
        refund.status AS "refundStatus", refund.amount AS "refundAmount", refund.deduction AS "refundDeduction"
      FROM reservations r JOIN plots p ON p.id=r.plot_id JOIN estates e ON e.id=p.estate_id JOIN companies c ON c.id=e.company_id JOIN users u ON u.id=r.buyer_user_id
      LEFT JOIN LATERAL (SELECT reference, provider_reference, status, method, failure_reason FROM payments WHERE reservation_id=r.id ORDER BY created_at DESC LIMIT 1) pay ON true
      LEFT JOIN reservation_refunds refund ON refund.reservation_id=r.id
      WHERE (${input.status}='ALL' OR r.status=${input.status})
        AND (${search}::text IS NULL OR r.reference ILIKE ${search} OR p.plot_number ILIKE ${search} OR e.name ILIKE ${search} OR c.legal_name ILIKE ${search} OR coalesce(u.email,'') ILIKE ${search} OR coalesce(pay.reference,'') ILIKE ${search})
      ORDER BY r.created_at DESC LIMIT 300
    `)
        .then((result) => result.rows);
    }),

  adminTimeline: protectedProcedure
    .input(z.object({ reference: z.string().trim().min(4).max(32) }))
    .handler(async ({ context, input }) => {
      const clerkId = context.auth?.userId;
      if (!clerkId) throw new ORPCError("UNAUTHORIZED");
      await requireAdmin(clerkId);
      const reservation = await db.execute(
        sql`SELECT id FROM reservations WHERE reference=${input.reference} LIMIT 1`,
      );
      const id = reservation.rows[0]?.id;
      if (!id) throw new ORPCError("NOT_FOUND");
      return db
        .execute(sql`
      SELECT action AS type, reason, metadata, created_at AS "createdAt", 'audit' AS source
      FROM audit_logs WHERE entity_type='reservation' AND entity_id=${String(id)}
      UNION ALL
      SELECT pe.type, coalesce(pe.metadata->>'reason', pay.failure_reason) AS reason, pe.metadata, pe.created_at AS "createdAt", 'payment' AS source
      FROM payment_events pe JOIN payments pay ON pay.id=pe.payment_id WHERE pay.reservation_id=${String(id)}::uuid
      ORDER BY "createdAt" DESC
    `)
        .then((result) => result.rows);
    }),
};
