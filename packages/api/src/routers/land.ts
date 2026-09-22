import { ORPCError } from "@orpc/server";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@asaselink/db";
import { auditLogs, estates, estateSitePlans, geometryVersions, plots } from "@asaselink/db/schema";
import { protectedProcedure, publicProcedure } from "../index";
import { enforceRateLimit } from "../security/rate-limit";
import { asMultiPolygon, estateGeometrySchema, polygonSchema } from "../domain/geometry";
import { requireCompanyAccess, requireCompanyPermission } from "../security/company-access";
import { createDocumentUploadUrl, createDocumentViewUrl, deleteDocumentObject, estateSitePlanKey, MAX_SITE_PLAN_BYTES, SITE_PLAN_MIME_TYPES, verifyDocumentObject } from "../storage/r2";

const uuid = z.string().uuid();
const corner = z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]);
const overlayCoordinates = z.tuple([corner, corner, corner, corner]);

export const landRouter = {
  listCompanyEstates: protectedProcedure.input(z.object({ companyId: uuid })).handler(async ({ context, input }) => {
    const clerkId = context.auth?.userId;
    if (!clerkId) throw new ORPCError("UNAUTHORIZED");
    await requireCompanyAccess(clerkId, input.companyId);
    return db.select({ id: estates.id, name: estates.name, slug: estates.slug, region: estates.region, district: estates.district, status: estates.status, priceFrom: estates.priceFrom, updatedAt: estates.updatedAt })
      .from(estates).where(eq(estates.companyId, input.companyId));
  }),

  listEstatePlots: protectedProcedure.input(z.object({ estateId: uuid })).handler(async ({ context, input }) => {
    const clerkId = context.auth?.userId;
    if (!clerkId) throw new ORPCError("UNAUTHORIZED");
    const [estate] = await db.select({ companyId: estates.companyId }).from(estates).where(eq(estates.id, input.estateId)).limit(1);
    if (!estate) throw new ORPCError("NOT_FOUND");
    await requireCompanyAccess(clerkId, estate.companyId);
    return db.select({ id: plots.id, plotNumber: plots.plotNumber, status: plots.status, areaSquareMeters: plots.areaSquareMeters, price: plots.price, updatedAt: plots.updatedAt })
      .from(plots).where(eq(plots.estateId, input.estateId));
  }),

  listCompanyPlots: protectedProcedure.input(z.object({ companyId: uuid })).handler(async ({ context, input }) => {
    const clerkId = context.auth?.userId;
    if (!clerkId) throw new ORPCError("UNAUTHORIZED");
    await requireCompanyAccess(clerkId, input.companyId);
    return db.select({ id: plots.id, plotNumber: plots.plotNumber, status: plots.status, areaSquareMeters: plots.areaSquareMeters, price: plots.price, estateId: estates.id, estateName: estates.name, updatedAt: plots.updatedAt })
      .from(plots).innerJoin(estates, eq(plots.estateId, estates.id)).where(eq(estates.companyId, input.companyId));
  }),

  listCadastralRecords: protectedProcedure.input(z.object({ companyId: uuid, estateId: uuid.optional() })).handler(async ({ context, input }) => {
    const clerkId = context.auth?.userId;
    if (!clerkId) throw new ORPCError("UNAUTHORIZED");
    await requireCompanyAccess(clerkId, input.companyId);
    const selectedEstateId = input.estateId ?? null;
    const result = await db.execute(sql`
      SELECT gv.id, gv.resource_type AS "resourceType", gv.resource_id AS "resourceId",
        gv.action, gv.reason, gv.approval_state AS "approvalState", gv.created_at AS "createdAt",
        gv.after_geometry AS geometry,
        COALESCE(direct_estate.id, plot_estate.id, concern_estate.id) AS "estateId",
        COALESCE(direct_estate.name, plot_estate.name, concern_estate.name) AS "estateName",
        p.plot_number AS "plotNumber",
        COALESCE(NULLIF(TRIM(CONCAT(u.first_name, ' ', u.last_name)), ''), u.email, 'Workspace member') AS actor
      FROM geometry_versions gv
      LEFT JOIN estates direct_estate ON gv.resource_type = 'estate' AND direct_estate.id = gv.resource_id
      LEFT JOIN plots p ON gv.resource_type = 'plot' AND p.id = gv.resource_id
      LEFT JOIN estates plot_estate ON plot_estate.id = p.estate_id
      LEFT JOIN screening_layers sl ON gv.resource_type = 'screening_layer' AND sl.id = gv.resource_id
      LEFT JOIN estates concern_estate ON concern_estate.id = sl.estate_id
      LEFT JOIN users u ON u.id = gv.actor_user_id
      WHERE COALESCE(direct_estate.company_id, plot_estate.company_id, concern_estate.company_id) = ${input.companyId}
        AND (${selectedEstateId}::uuid IS NULL OR COALESCE(direct_estate.id, plot_estate.id, concern_estate.id) = ${selectedEstateId})
      ORDER BY gv.created_at DESC LIMIT 250
    `);
    return result.rows;
  }),

  getEstateWorkspace: protectedProcedure.input(z.object({ companyId: uuid, estateId: uuid })).handler(async ({ context, input }) => {
    const clerkId = context.auth?.userId;
    if (!clerkId) throw new ORPCError("UNAUTHORIZED");
    await requireCompanyAccess(clerkId, input.companyId);
    const estateRows = await db.execute(sql`
      SELECT id, name, slug, region, district, status, ST_AsGeoJSON(boundary)::json AS boundary
      FROM estates WHERE id = ${input.estateId} AND company_id = ${input.companyId} LIMIT 1
    `);
    const estate = estateRows.rows[0];
    if (!estate) throw new ORPCError("NOT_FOUND");
    const plotRows = await db.execute(sql`
      SELECT id, plot_number AS "plotNumber", status, area_square_meters AS "areaSquareMeters", price,
        ST_AsGeoJSON(boundary)::json AS boundary
      FROM plots WHERE estate_id = ${input.estateId} ORDER BY plot_number
    `);
    return { ...estate, plots: plotRows.rows };
  }),

  getEstateSitePlan: protectedProcedure.input(z.object({ companyId: uuid, estateId: uuid })).handler(async ({ context, input }) => {
    const clerkId = context.auth?.userId;
    if (!clerkId) throw new ORPCError("UNAUTHORIZED");
    await requireCompanyAccess(clerkId, input.companyId);
    const [plan] = await db.select().from(estateSitePlans).innerJoin(estates, eq(estateSitePlans.estateId, estates.id))
      .where(and(eq(estateSitePlans.estateId, input.estateId), eq(estates.companyId, input.companyId), eq(estateSitePlans.status, "ready"))).limit(1);
    if (!plan) return null;
    return { id: plan.estate_site_plans.id, fileName: plan.estate_site_plans.fileName, imageUrl: await createDocumentViewUrl(plan.estate_site_plans.fileKey, plan.estate_site_plans.fileName), coordinates: plan.estate_site_plans.coordinates, opacity: Number(plan.estate_site_plans.opacity), alignmentLocked: plan.estate_site_plans.alignmentLocked };
  }),

  beginEstateSitePlanUpload: protectedProcedure.input(z.object({ estateId: uuid, fileName: z.string().trim().min(1).max(256), fileSize: z.number().int().positive().max(MAX_SITE_PLAN_BYTES), mimeType: z.enum(SITE_PLAN_MIME_TYPES) })).handler(async ({ context, input }) => {
    const clerkId = context.auth?.userId;
    if (!clerkId) throw new ORPCError("UNAUTHORIZED");
    await enforceRateLimit(clerkId, "estate.site-plan.upload", 12);
    const rows = await db.execute(sql`SELECT company_id AS "companyId", ST_XMin(Box2D(boundary)) AS west, ST_YMin(Box2D(boundary)) AS south, ST_XMax(Box2D(boundary)) AS east, ST_YMax(Box2D(boundary)) AS north FROM estates WHERE id=${input.estateId} LIMIT 1`);
    const estate = rows.rows[0] as { companyId: string; west: number; south: number; east: number; north: number } | undefined;
    if (!estate) throw new ORPCError("NOT_FOUND");
    await requireCompanyPermission(clerkId, estate.companyId, "plot:write");
    const fileKey = estateSitePlanKey(estate.companyId, input.estateId, input.fileName);
    const coordinates = [[Number(estate.west), Number(estate.north)], [Number(estate.east), Number(estate.north)], [Number(estate.east), Number(estate.south)], [Number(estate.west), Number(estate.south)]] as [[number, number], [number, number], [number, number], [number, number]];
    const [existing] = await db.select().from(estateSitePlans).where(eq(estateSitePlans.estateId, input.estateId)).limit(1);
    const [plan] = existing
      ? await db.update(estateSitePlans).set({ fileName: input.fileName, fileKey, fileSize: input.fileSize, mimeType: input.mimeType, status: "uploading", coordinates, alignmentLocked: false, updatedAt: new Date() }).where(eq(estateSitePlans.id, existing.id)).returning()
      : await db.insert(estateSitePlans).values({ estateId: input.estateId, fileName: input.fileName, fileKey, fileSize: input.fileSize, mimeType: input.mimeType, coordinates }).returning();
    if (!plan) throw new ORPCError("INTERNAL_SERVER_ERROR");
    return { planId: plan.id, uploadUrl: await createDocumentUploadUrl(fileKey, input.mimeType), expiresIn: 300 };
  }),

  confirmEstateSitePlanUpload: protectedProcedure.input(z.object({ planId: uuid })).handler(async ({ context, input }) => {
    const clerkId = context.auth?.userId;
    if (!clerkId) throw new ORPCError("UNAUTHORIZED");
    const [owned] = await db.select({ plan: estateSitePlans, companyId: estates.companyId }).from(estateSitePlans).innerJoin(estates, eq(estateSitePlans.estateId, estates.id)).where(eq(estateSitePlans.id, input.planId)).limit(1);
    if (!owned) throw new ORPCError("NOT_FOUND");
    const access = await requireCompanyPermission(clerkId, owned.companyId, "plot:write");
    const object = await verifyDocumentObject(owned.plan.fileKey);
    if (object.ContentLength !== owned.plan.fileSize || object.ContentType !== owned.plan.mimeType) throw new ORPCError("BAD_REQUEST", { message: "The uploaded plan did not match the authorized file." });
    const [plan] = await db.update(estateSitePlans).set({ status: "ready", updatedAt: new Date() }).where(eq(estateSitePlans.id, input.planId)).returning();
    await db.insert(auditLogs).values({ userId: access.user.id, action: "estate.site_plan.uploaded", entityType: "estate", entityId: owned.plan.estateId, reason: "Site plan uploaded for manual plot alignment", metadata: { planId: input.planId } });
    return { id: plan!.id, fileName: plan!.fileName, imageUrl: await createDocumentViewUrl(plan!.fileKey, plan!.fileName), coordinates: plan!.coordinates, opacity: Number(plan!.opacity), alignmentLocked: plan!.alignmentLocked };
  }),

  updateEstateSitePlanAlignment: protectedProcedure.input(z.object({ planId: uuid, coordinates: overlayCoordinates, opacity: z.number().min(0.1).max(1), alignmentLocked: z.boolean() })).handler(async ({ context, input }) => {
    const clerkId = context.auth?.userId;
    if (!clerkId) throw new ORPCError("UNAUTHORIZED");
    const [owned] = await db.select({ plan: estateSitePlans, companyId: estates.companyId }).from(estateSitePlans).innerJoin(estates, eq(estateSitePlans.estateId, estates.id)).where(eq(estateSitePlans.id, input.planId)).limit(1);
    if (!owned) throw new ORPCError("NOT_FOUND");
    const access = await requireCompanyPermission(clerkId, owned.companyId, "plot:write");
    const [updated] = await db.update(estateSitePlans).set({ coordinates: input.coordinates, opacity: input.opacity.toFixed(2), alignmentLocked: input.alignmentLocked, alignedByUserId: access.user.id, updatedAt: new Date() }).where(eq(estateSitePlans.id, input.planId)).returning();
    await db.insert(auditLogs).values({ userId: access.user.id, action: input.alignmentLocked ? "estate.site_plan.locked" : "estate.site_plan.updated", entityType: "estate", entityId: owned.plan.estateId, reason: input.alignmentLocked ? "Site plan alignment locked for plot tracing" : "Site plan alignment updated", metadata: { planId: input.planId } });
    return { id: updated!.id, coordinates: updated!.coordinates, opacity: Number(updated!.opacity), alignmentLocked: updated!.alignmentLocked };
  }),

  removeEstateSitePlan: protectedProcedure.input(z.object({ planId: uuid })).handler(async ({ context, input }) => {
    const clerkId = context.auth?.userId;
    if (!clerkId) throw new ORPCError("UNAUTHORIZED");
    const [owned] = await db.select({ plan: estateSitePlans, companyId: estates.companyId }).from(estateSitePlans).innerJoin(estates, eq(estateSitePlans.estateId, estates.id)).where(eq(estateSitePlans.id, input.planId)).limit(1);
    if (!owned) throw new ORPCError("NOT_FOUND");
    const access = await requireCompanyPermission(clerkId, owned.companyId, "plot:write");
    await deleteDocumentObject(owned.plan.fileKey);
    await db.delete(estateSitePlans).where(eq(estateSitePlans.id, input.planId));
    await db.insert(auditLogs).values({ userId: access.user.id, action: "estate.site_plan.removed", entityType: "estate", entityId: owned.plan.estateId, reason: "Site plan overlay removed to continue with manual plot tracing", metadata: { planId: input.planId, fileName: owned.plan.fileName } });
    return { removed: true };
  }),

  listPublished: publicProcedure.input(z.object({
    limit: z.number().int().min(1).max(48).default(24),
    offset: z.number().int().min(0).default(0),
    query: z.string().trim().min(2).max(100).optional(),
  }).optional()).handler(async ({ input }) => {
    const query = input?.query ? `%${input.query}%` : null;
    const result = await db.execute(sql`
      SELECT e.id, e.name, e.slug, e.region, e.district, e.price_from AS "priceFrom",
        c.legal_name AS "companyName",
        count(p.id) FILTER (WHERE p.status = 'AVAILABLE')::int AS "availablePlots",
        ST_X(ST_PointOnSurface(e.boundary))::float AS longitude,
        ST_Y(ST_PointOnSurface(e.boundary))::float AS latitude,
        CASE WHEN ${query}::text IS NOT NULL THEN ST_AsGeoJSON(e.boundary)::json ELSE NULL END AS "searchBoundary"
      FROM estates e
      JOIN companies c ON c.id = e.company_id
      LEFT JOIN plots p ON p.estate_id = e.id
      WHERE e.status = 'approved' AND c.status = 'approved'
        AND (${query}::text IS NULL OR e.name ILIKE ${query} OR c.legal_name ILIKE ${query})
      GROUP BY e.id, c.legal_name
      ORDER BY CASE WHEN ${query}::text IS NOT NULL AND lower(e.name) = lower(${input?.query ?? ""}) THEN 0 ELSE 1 END, e.created_at DESC
      LIMIT ${input?.limit ?? 24} OFFSET ${input?.offset ?? 0}
    `);
    return result.rows;
  }),

  getPublished: publicProcedure.input(z.object({ slug: z.string().min(2).max(256) })).handler(async ({ input }) => {
    const rows = await db.execute(sql`
      SELECT e.id, e.name, e.slug, e.description, e.region, e.district, e.address,
        e.price_from AS "priceFrom", c.id AS "companyId", c.legal_name AS "companyName",
        ST_AsGeoJSON(e.boundary)::json AS boundary
      FROM estates e JOIN companies c ON c.id = e.company_id
      WHERE e.slug = ${input.slug} AND e.status = 'approved' AND c.status = 'approved'
      LIMIT 1
    `);
    const estate = rows.rows[0];
    if (!estate) throw new ORPCError("NOT_FOUND");
    const plotRows = await db.execute(sql`
      SELECT p.id, p.plot_number AS "plotNumber", p.status,
        p.area_square_meters AS "areaSquareMeters", p.price,
        ST_AsGeoJSON(p.boundary)::json AS boundary
      FROM plots p
      WHERE p.estate_id = ${(estate as { id: string }).id}
        AND p.status IN ('AVAILABLE', 'RESERVED', 'SOLD')
      ORDER BY p.plot_number
    `);
    return { ...estate, plots: plotRows.rows };
  }),

  createEstate: protectedProcedure.input(z.object({
    companyId: uuid,
    name: z.string().trim().min(2).max(256),
    slug: z.string().trim().min(2).max(256).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    description: z.string().trim().max(5000).optional(),
    region: z.string().trim().min(2).max(128),
    district: z.string().trim().max(128).optional(),
    address: z.string().trim().max(1000).optional(),
    priceFrom: z.number().nonnegative().optional(),
    boundary: estateGeometrySchema,
    reason: z.string().trim().min(5).max(1000),
  })).handler(async ({ context, input }) => {
    const clerkId = context.auth?.userId;
    if (!clerkId) throw new ORPCError("UNAUTHORIZED");
    await enforceRateLimit(clerkId, "estate.create", 12);
    const access = await requireCompanyPermission(clerkId, input.companyId, "estate:write");
    const boundary = asMultiPolygon(input.boundary);
    const boundaryJson = JSON.stringify(boundary);
    const [created] = await db.insert(estates).values({
      companyId: input.companyId, name: input.name, slug: input.slug, description: input.description,
      region: input.region, district: input.district, address: input.address,
      priceFrom: input.priceFrom?.toFixed(2), boundary: sql`ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON(${boundaryJson}), 4326))`,
    }).returning({ id: estates.id, name: estates.name, slug: estates.slug, region: estates.region, district: estates.district, status: estates.status, priceFrom: estates.priceFrom });
    if (!created) throw new ORPCError("INTERNAL_SERVER_ERROR");
    await Promise.all([
      db.insert(geometryVersions).values({ resourceType: "estate", resourceId: created.id, action: "created", afterGeometry: boundary, actorUserId: access.user.id, reason: input.reason }),
      db.insert(auditLogs).values({ userId: access.user.id, action: "estate.created", entityType: "estate", entityId: created.id, reason: input.reason, metadata: { companyId: input.companyId } }),
    ]);
    return created;
  }),

  createPlot: protectedProcedure.input(z.object({
    estateId: uuid, plotNumber: z.string().trim().min(1).max(128), price: z.number().nonnegative(),
    boundary: polygonSchema, reason: z.string().trim().min(5).max(1000),
  })).handler(async ({ context, input }) => {
    const clerkId = context.auth?.userId;
    if (!clerkId) throw new ORPCError("UNAUTHORIZED");
    await enforceRateLimit(clerkId, "plot.create", 60);
    const [estate] = await db.select({ companyId: estates.companyId }).from(estates).where(eq(estates.id, input.estateId)).limit(1);
    if (!estate) throw new ORPCError("NOT_FOUND");
    const access = await requireCompanyPermission(clerkId, estate.companyId, "plot:write");
    const boundaryJson = JSON.stringify(input.boundary);
    let created: { id: string; plotNumber: string; status: string; areaSquareMeters: string; price: string } | undefined;
    try {
      [created] = await db.insert(plots).values({ estateId: input.estateId, plotNumber: input.plotNumber, price: input.price.toFixed(2), areaSquareMeters: "1", boundary: sql`ST_SetSRID(ST_GeomFromGeoJSON(${boundaryJson}), 4326)` })
        .returning({ id: plots.id, plotNumber: plots.plotNumber, status: plots.status, areaSquareMeters: plots.areaSquareMeters, price: plots.price });
    } catch (error) {
      const message = error instanceof Error ? `${error.message} ${String((error as Error & { cause?: unknown }).cause ?? "")}` : String(error);
      if (message.includes("contained by its estate")) throw new ORPCError("BAD_REQUEST", { message: "Keep every plot corner inside the highlighted estate boundary. Small edge differences up to one metre are snapped automatically." });
      if (message.includes("overlaps an existing plot")) throw new ORPCError("CONFLICT", { message: "This boundary overlaps a plot already registered in the estate." });
      if (message.includes("restricted area")) throw new ORPCError("BAD_REQUEST", { message: "This plot crosses a restricted area. Adjust its boundary and try again." });
      if (message.includes("company-declared concern")) throw new ORPCError("BAD_REQUEST", { message: "This plot crosses a concern area declared for the estate. Review the marked area before mapping this plot." });
      throw error;
    }
    if (!created) throw new ORPCError("INTERNAL_SERVER_ERROR");
    const actualGeometry = await db.execute(sql`SELECT ST_AsGeoJSON(boundary)::json AS boundary FROM plots WHERE id=${created.id}`);
    const savedBoundary = (actualGeometry.rows[0] as { boundary?: typeof input.boundary } | undefined)?.boundary ?? input.boundary;
    await Promise.all([
      db.insert(geometryVersions).values({ resourceType: "plot", resourceId: created.id, action: "created", afterGeometry: savedBoundary, actorUserId: access.user.id, reason: input.reason }),
      db.insert(auditLogs).values({ userId: access.user.id, action: "plot.created", entityType: "plot", entityId: created.id, reason: input.reason, metadata: { estateId: input.estateId } }),
      db.execute(sql`INSERT INTO outbox_events (topic, aggregate_id, payload) SELECT 'plot.available', ${created.id}, jsonb_build_object('plotId', ${created.id}::text) FROM estates WHERE id=${input.estateId} AND status='approved'`),
    ]);
    return { ...created, boundary: savedBoundary };
  }),

  submitEstate: protectedProcedure.input(z.object({ estateId: uuid })).handler(async ({ context, input }) => {
    const clerkId = context.auth?.userId;
    if (!clerkId) throw new ORPCError("UNAUTHORIZED");
    const [estate] = await db.select({ companyId: estates.companyId }).from(estates).where(eq(estates.id, input.estateId)).limit(1);
    if (!estate) throw new ORPCError("NOT_FOUND");
    const access = await requireCompanyPermission(clerkId, estate.companyId, "plot:write");
    const result = await db.execute(sql`
      UPDATE estates SET status = 'submitted', updated_at = now()
      WHERE id = ${input.estateId} AND status IN ('draft','rejected')
        AND EXISTS (SELECT 1 FROM plots WHERE estate_id = ${input.estateId})
      RETURNING id, status
    `);
    if (!result.rows[0]) throw new ORPCError("CONFLICT", { message: "Add at least one plot before submitting this estate." });
    await db.insert(auditLogs).values({ userId: access.user.id, action: "estate.submitted", entityType: "estate", entityId: input.estateId, reason: "Submitted for marketplace review", metadata: { companyId: estate.companyId } });
    return result.rows[0];
  }),

  viewport: publicProcedure.input(z.object({ west: z.number().min(-180).max(180), south: z.number().min(-90).max(90), east: z.number().min(-180).max(180), north: z.number().min(-90).max(90) }).refine((b) => b.west < b.east && b.south < b.north && b.east - b.west <= 5 && b.north - b.south <= 5, "Viewport bounds are invalid or too large.")).handler(async ({ input }) => {
    const rows = await db.execute(sql`
      SELECT e.id, e.name, e.slug, e.region, e.district, e.price_from AS "priceFrom",
        ST_AsGeoJSON(e.boundary)::json AS boundary
      FROM estates e
      WHERE e.status = 'approved'
        AND ST_Intersects(e.boundary, ST_MakeEnvelope(${input.west}, ${input.south}, ${input.east}, ${input.north}, 4326))
      ORDER BY e.name
      LIMIT 200
    `);
    return rows.rows;
  }),
};
