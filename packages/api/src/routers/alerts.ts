import { ORPCError } from "@orpc/server";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@asaselink/db";
import { auditLogs, landAlerts, users } from "@asaselink/db/schema";
import { protectedProcedure } from "../index";
import { enforceRateLimit } from "../security/rate-limit";

const criteria = z.object({
  locationLabel: z.string().trim().min(2).max(256),
  region: z.string().trim().max(128).optional(),
  district: z.string().trim().max(128).optional(),
  center: z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]).optional(),
  radiusKm: z.number().min(1).max(100).default(10),
  minPrice: z.number().nonnegative().optional(),
  maxPrice: z.number().positive().optional(),
  channels: z.array(z.enum(["email", "sms"])).min(1).max(2),
  frequency: z.enum(["instant", "daily"]).default("instant"),
}).refine((value) => value.minPrice === undefined || value.maxPrice === undefined || value.minPrice <= value.maxPrice, { message: "Minimum price cannot exceed maximum price.", path: ["maxPrice"] });

async function currentUser(clerkId: string) {
  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  if (!user) throw new ORPCError("PRECONDITION_FAILED", { message: "Complete your buyer profile before creating an alert." });
  return user;
}

export const alertRouter = {
  list: protectedProcedure.handler(async ({ context }) => {
    const clerkId = context.auth?.userId; if (!clerkId) throw new ORPCError("UNAUTHORIZED");
    const user = await currentUser(clerkId);
    return db.execute(sql`
      SELECT a.id, a.location_label AS "locationLabel", a.region, a.district, a.radius_km AS "radiusKm",
        a.min_price AS "minPrice", a.max_price AS "maxPrice", a.channels, a.frequency, a.status,
        a.created_at AS "createdAt", count(m.id)::int AS "matchCount", max(m.matched_at) AS "lastMatchedAt"
      FROM land_alerts a LEFT JOIN land_alert_matches m ON m.alert_id=a.id
      WHERE a.user_id=${user.id} GROUP BY a.id ORDER BY a.created_at DESC
    `).then((result) => result.rows);
  }),

  create: protectedProcedure.input(criteria).handler(async ({ context, input }) => {
    const clerkId = context.auth?.userId; if (!clerkId) throw new ORPCError("UNAUTHORIZED");
    await enforceRateLimit(clerkId, "land-alert.create", 20);
    const user = await currentUser(clerkId);
    const [created] = await db.insert(landAlerts).values({
      userId: user.id, locationLabel: input.locationLabel, region: input.region, district: input.district,
      center: input.center ? sql`ST_SetSRID(ST_MakePoint(${input.center[0]}, ${input.center[1]}), 4326)` : undefined,
      radiusKm: input.radiusKm.toFixed(2), minPrice: input.minPrice?.toFixed(2), maxPrice: input.maxPrice?.toFixed(2),
      channels: input.channels, frequency: input.frequency,
    }).returning({ id: landAlerts.id, locationLabel: landAlerts.locationLabel, status: landAlerts.status });
    if (!created) throw new ORPCError("INTERNAL_SERVER_ERROR");
    await db.insert(auditLogs).values({ userId: user.id, action: "land_alert.created", entityType: "land_alert", entityId: created.id, reason: "Buyer requested availability notifications", metadata: { location: input.locationLabel, channels: input.channels, frequency: input.frequency } });
    return created;
  }),

  setStatus: protectedProcedure.input(z.object({ id: z.string().uuid(), status: z.enum(["active", "paused"]) })).handler(async ({ context, input }) => {
    const clerkId = context.auth?.userId; if (!clerkId) throw new ORPCError("UNAUTHORIZED");
    const user = await currentUser(clerkId);
    const [updated] = await db.update(landAlerts).set({ status: input.status, updatedAt: new Date() }).where(and(eq(landAlerts.id, input.id), eq(landAlerts.userId, user.id))).returning({ id: landAlerts.id, status: landAlerts.status });
    if (!updated) throw new ORPCError("NOT_FOUND");
    await db.insert(auditLogs).values({ userId: user.id, action: `land_alert.${input.status}`, entityType: "land_alert", entityId: input.id, reason: `Buyer ${input.status} land alert` });
    return updated;
  }),

  remove: protectedProcedure.input(z.object({ id: z.string().uuid() })).handler(async ({ context, input }) => {
    const clerkId = context.auth?.userId; if (!clerkId) throw new ORPCError("UNAUTHORIZED");
    const user = await currentUser(clerkId);
    const [removed] = await db.delete(landAlerts).where(and(eq(landAlerts.id, input.id), eq(landAlerts.userId, user.id))).returning({ id: landAlerts.id });
    if (!removed) throw new ORPCError("NOT_FOUND");
    await db.insert(auditLogs).values({ userId: user.id, action: "land_alert.removed", entityType: "land_alert", entityId: input.id, reason: "Buyer removed land alert" });
    return { removed: true };
  }),
};
