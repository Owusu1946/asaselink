import { ORPCError } from "@orpc/server";
import { and, eq, isNotNull, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@asaselink/db";
import { buyerProfiles, users } from "@asaselink/db/schema";
import { protectedProcedure } from "../index";

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
};
