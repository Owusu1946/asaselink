import { ORPCError } from "@orpc/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@asaselink/db";
import { estates, recentExplorations, savedEstates, users } from "@asaselink/db/schema";
import { protectedProcedure } from "../index";

async function requireUser(clerkId: string) {
  const [user] = await db.select({ id: users.id }).from(users)
    .where(and(eq(users.clerkId, clerkId), eq(users.status, "active"))).limit(1);
  if (!user) throw new ORPCError("FORBIDDEN", { message: "Complete your buyer profile to use this feature." });
  return user;
}

const criteriaSchema = z.object({
  location: z.string().trim().min(1).max(256),
  type: z.string().trim().min(1).max(128),
  budget: z.string().trim().min(1).max(128),
});

export const buyerRouter = {
  overview: protectedProcedure.handler(async ({ context }) => {
    const clerkId = context.auth?.userId;
    if (!clerkId) throw new ORPCError("UNAUTHORIZED");
    const user = await requireUser(clerkId);
    const [counts, recent] = await Promise.all([
      db.execute(sql`
        SELECT
          (SELECT count(*)::int FROM reservations WHERE buyer_user_id = ${user.id}) AS reservations,
          (SELECT count(*)::int FROM saved_estates WHERE user_id = ${user.id}) AS saved,
          (SELECT count(*)::int FROM reservations WHERE buyer_user_id = ${user.id}) AS documents,
          (SELECT count(*)::int FROM land_alerts WHERE user_id = ${user.id}) AS alerts
      `).then((result) => result.rows[0] as { reservations: number; saved: number; documents: number; alerts: number }),
      db.select({ id: recentExplorations.id, title: recentExplorations.title, location: recentExplorations.location, criteria: recentExplorations.criteria, updatedAt: recentExplorations.updatedAt })
        .from(recentExplorations).where(eq(recentExplorations.userId, user.id))
        .orderBy(desc(recentExplorations.updatedAt)).limit(8),
    ]);
    return { counts, recent };
  }),

  listSaved: protectedProcedure.handler(async ({ context }) => {
    const clerkId = context.auth?.userId;
    if (!clerkId) throw new ORPCError("UNAUTHORIZED");
    const user = await requireUser(clerkId);
    return db.execute(sql`
      SELECT e.id, e.slug, e.name, e.region, e.district, e.price_from AS "priceFrom",
        c.legal_name AS "companyName", s.created_at AS "savedAt",
        count(p.id) FILTER (WHERE p.status = 'AVAILABLE')::int AS "availablePlots"
      FROM saved_estates s
      JOIN estates e ON e.id = s.estate_id
      JOIN companies c ON c.id = e.company_id
      LEFT JOIN plots p ON p.estate_id = e.id
      WHERE s.user_id = ${user.id} AND e.status = 'approved' AND c.status = 'approved'
      GROUP BY s.id, e.id, c.legal_name
      ORDER BY s.created_at DESC
    `).then((result) => result.rows);
  }),

  listSavedIds: protectedProcedure.handler(async ({ context }) => {
    const clerkId = context.auth?.userId;
    if (!clerkId) throw new ORPCError("UNAUTHORIZED");
    const user = await requireUser(clerkId);
    return db.select({ estateId: savedEstates.estateId }).from(savedEstates).where(eq(savedEstates.userId, user.id));
  }),

  setSaved: protectedProcedure.input(z.object({ estateId: z.string().uuid(), saved: z.boolean() })).handler(async ({ context, input }) => {
    const clerkId = context.auth?.userId;
    if (!clerkId) throw new ORPCError("UNAUTHORIZED");
    const user = await requireUser(clerkId);
    const [estate] = await db.select({ id: estates.id }).from(estates)
      .where(and(eq(estates.id, input.estateId), eq(estates.status, "approved"))).limit(1);
    if (!estate) throw new ORPCError("NOT_FOUND", { message: "This estate is no longer available." });
    if (input.saved) {
      await db.insert(savedEstates).values({ userId: user.id, estateId: input.estateId }).onConflictDoNothing();
    } else {
      await db.delete(savedEstates).where(and(eq(savedEstates.userId, user.id), eq(savedEstates.estateId, input.estateId)));
    }
    return { estateId: input.estateId, saved: input.saved };
  }),

  recordExploration: protectedProcedure.input(criteriaSchema).handler(async ({ context, input }) => {
    const clerkId = context.auth?.userId;
    if (!clerkId) throw new ORPCError("UNAUTHORIZED");
    const user = await requireUser(clerkId);
    const fingerprint = `${input.location}|${input.type}|${input.budget}`.toLowerCase();
    const title = input.location === "All of Ghana" ? `${input.type} · ${input.budget}` : `${input.location} · ${input.type}`;
    const [record] = await db.insert(recentExplorations).values({ userId: user.id, fingerprint, title, location: input.location, criteria: input })
      .onConflictDoUpdate({ target: [recentExplorations.userId, recentExplorations.fingerprint], set: { title, location: input.location, criteria: input, updatedAt: new Date() } })
      .returning({ id: recentExplorations.id });
    return record;
  }),

  removeExploration: protectedProcedure.input(z.object({ id: z.string().uuid() })).handler(async ({ context, input }) => {
    const clerkId = context.auth?.userId;
    if (!clerkId) throw new ORPCError("UNAUTHORIZED");
    const user = await requireUser(clerkId);
    await db.delete(recentExplorations).where(and(eq(recentExplorations.id, input.id), eq(recentExplorations.userId, user.id)));
    return { removed: true };
  }),

  listDocuments: protectedProcedure.handler(async ({ context }) => {
    const clerkId = context.auth?.userId;
    if (!clerkId) throw new ORPCError("UNAUTHORIZED");
    const user = await requireUser(clerkId);
    return db.execute(sql`
      SELECT r.id, r.reference, r.status, r.created_at AS "createdAt", r.price_snapshot AS "priceSnapshot",
        p.plot_number AS "plotNumber", e.name AS "estateName", e.slug AS "estateSlug"
      FROM reservations r JOIN plots p ON p.id = r.plot_id JOIN estates e ON e.id = p.estate_id
      WHERE r.buyer_user_id = ${user.id} ORDER BY r.created_at DESC LIMIT 100
    `).then((result) => result.rows);
  }),
};
