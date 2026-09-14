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
  const [buyer] = await db.select({ id: users.id }).from(users)
    .innerJoin(buyerProfiles, and(eq(buyerProfiles.userId, users.id), isNotNull(buyerProfiles.completedAt)))
    .where(and(eq(users.clerkId, clerkId), eq(users.status, "active"))).limit(1);
  if (!buyer) throw new ORPCError("FORBIDDEN", { message: "Complete your buyer profile before reserving a plot." });
  return buyer;
}

export const reservationRouter = {
  create: protectedProcedure.input(z.object({ plotId: uuid })).handler(async ({ context, input }) => {
    const clerkId = context.auth?.userId;
    if (!clerkId) throw new ORPCError("UNAUTHORIZED");
    await enforceRateLimit(clerkId, "reservation.create", 10);
    const buyer = await requireReadyBuyer(clerkId);
    const reference = `ASL-${crypto.randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase()}`;
    const result = await db.execute(sql`
      WITH expired AS (
        UPDATE reservations SET status = 'EXPIRED', updated_at = now()
        WHERE plot_id = ${input.plotId} AND status = 'ACTIVE' AND expires_at <= now()
        RETURNING plot_id
      ), released AS (
        UPDATE plots SET status = 'AVAILABLE', updated_at = now()
        WHERE id IN (SELECT plot_id FROM expired) AND status = 'RESERVED'
      ), claimed AS (
        UPDATE plots p SET status = 'RESERVED', updated_at = now()
        FROM estates e JOIN companies c ON c.id = e.company_id
        WHERE p.id = ${input.plotId} AND p.estate_id = e.id AND p.status = 'AVAILABLE'
          AND e.status = 'approved' AND c.status = 'approved'
        RETURNING p.id, p.price
      ), created AS (
        INSERT INTO reservations (reference, plot_id, buyer_user_id, status, price_snapshot, expires_at)
        SELECT ${reference}, id, ${buyer.id}, 'ACTIVE', price, now() + interval '30 minutes' FROM claimed
        RETURNING id, reference, plot_id AS "plotId", status, price_snapshot AS "priceSnapshot", expires_at AS "expiresAt"
      ), audited AS (
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata)
        SELECT ${buyer.id}, 'reservation.created', 'reservation', id::text, jsonb_build_object('plotId', "plotId", 'reference', reference) FROM created
      ), outboxed AS (
        INSERT INTO outbox_events (topic, aggregate_id, payload)
        SELECT 'reservation.created', id::text, jsonb_build_object('reservationId', id, 'plotId', "plotId", 'reference', reference) FROM created
      ) SELECT * FROM created
    `);
    const reservation = result.rows[0];
    if (!reservation) throw new ORPCError("CONFLICT", { message: "This plot is no longer available." });
    return reservation;
  }),

  listMine: protectedProcedure.handler(async ({ context }) => {
    const clerkId = context.auth?.userId;
    if (!clerkId) throw new ORPCError("UNAUTHORIZED");
    const buyer = await requireReadyBuyer(clerkId);
    return db.execute(sql`
      SELECT r.id, r.reference, r.status, r.price_snapshot AS "priceSnapshot", r.expires_at AS "expiresAt",
        p.id AS "plotId", p.plot_number AS "plotNumber", e.name AS "estateName", e.slug AS "estateSlug"
      FROM reservations r JOIN plots p ON p.id = r.plot_id JOIN estates e ON e.id = p.estate_id
      WHERE r.buyer_user_id = ${buyer.id} ORDER BY r.created_at DESC LIMIT 100
    `).then((result) => result.rows);
  }),

  listCompany: protectedProcedure.input(z.object({
    companyId: uuid,
    status: z.enum(["ALL", "ACTIVE", "PAYMENT_PENDING", "CONFIRMED", "CANCELLED", "EXPIRED"]).default("ALL"),
    search: z.string().trim().max(100).optional(),
  })).handler(async ({ context, input }) => {
    const clerkId = context.auth?.userId;
    if (!clerkId) throw new ORPCError("UNAUTHORIZED");
    await requireCompanyAccess(clerkId, input.companyId);
    const search = input.search ? `%${input.search}%` : null;
    return db.execute(sql`
      SELECT r.id, r.reference, r.status, r.price_snapshot AS "priceSnapshot", r.expires_at AS "expiresAt",
        r.cancelled_at AS "cancelledAt", r.cancellation_reason AS "cancellationReason", r.created_at AS "createdAt",
        p.plot_number AS "plotNumber", p.status AS "plotStatus", e.id AS "estateId", e.name AS "estateName",
        u.email AS "buyerEmail", u.first_name AS "buyerFirstName", u.last_name AS "buyerLastName", u.phone_number AS "buyerPhone",
        pay.reference AS "paymentReference", pay.status AS "paymentStatus", pay.method AS "paymentMethod", pay.created_at AS "paymentCreatedAt"
      FROM reservations r
      JOIN plots p ON p.id=r.plot_id JOIN estates e ON e.id=p.estate_id JOIN users u ON u.id=r.buyer_user_id
      LEFT JOIN LATERAL (SELECT reference, status, method, created_at FROM payments WHERE reservation_id=r.id ORDER BY created_at DESC LIMIT 1) pay ON true
      WHERE e.company_id=${input.companyId}
        AND (${input.status}='ALL' OR r.status=${input.status})
        AND (${search}::text IS NULL OR r.reference ILIKE ${search} OR p.plot_number ILIKE ${search} OR e.name ILIKE ${search}
          OR coalesce(u.email,'') ILIKE ${search} OR concat_ws(' ',u.first_name,u.last_name) ILIKE ${search})
      ORDER BY CASE WHEN r.status IN ('ACTIVE','PAYMENT_PENDING') THEN 0 ELSE 1 END, r.created_at DESC LIMIT 250
    `).then((result) => result.rows);
  }),

  cancelCompany: protectedProcedure.input(z.object({ companyId: uuid, reference: z.string().trim().min(4).max(32), reason: z.string().trim().min(5).max(500) })).handler(async ({ context, input }) => {
    const clerkId = context.auth?.userId;
    if (!clerkId) throw new ORPCError("UNAUTHORIZED");
    const access = await requireCompanyPermission(clerkId, input.companyId, "reservation:manage");
    const result = await db.execute(sql`
      WITH cancelled AS (
        UPDATE reservations r SET status='CANCELLED', cancelled_at=now(), cancellation_reason=${input.reason}, updated_at=now()
        FROM plots p, estates e WHERE r.reference=${input.reference} AND r.status IN ('ACTIVE','PAYMENT_PENDING')
          AND p.id=r.plot_id AND e.id=p.estate_id AND e.company_id=${input.companyId}
        RETURNING r.id, r.reference, r.plot_id
      ), payments_cancelled AS (
        UPDATE payments SET status='CANCELLED', failed_at=now(), failure_reason=${input.reason}, updated_at=now()
        WHERE reservation_id=(SELECT id FROM cancelled) AND status IN ('INITIATED','PENDING_CONFIRMATION') RETURNING id
      ), released AS (
        UPDATE plots SET status='AVAILABLE', updated_at=now() WHERE id=(SELECT plot_id FROM cancelled) AND status='RESERVED' RETURNING id
      ), audited AS (
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, reason, metadata)
        SELECT ${access.user.id}, 'reservation.cancelled_by_company', 'reservation', id::text, ${input.reason}, jsonb_build_object('reference', reference) FROM cancelled
      ), outboxed AS (
        INSERT INTO outbox_events (topic, aggregate_id, payload)
        SELECT 'reservation.cancelled', id::text, jsonb_build_object('reservationId', id, 'reference', reference, 'reason', ${input.reason}::text) FROM cancelled
      ) SELECT reference, 'CANCELLED' AS status FROM cancelled
    `);
    if (!result.rows[0]) throw new ORPCError("CONFLICT", { message: "Only active or payment-pending reservations can be cancelled." });
    return result.rows[0];
  }),
};
