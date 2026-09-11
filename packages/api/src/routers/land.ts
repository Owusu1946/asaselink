import { ORPCError } from "@orpc/server";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@asaselink/db";
import { auditLogs, estates, geometryVersions, plots } from "@asaselink/db/schema";
import { protectedProcedure, publicProcedure } from "../index";
import { asMultiPolygon, estateGeometrySchema, polygonSchema } from "../domain/geometry";
import { requireCompanyAccess, requireCompanyWriteAccess } from "../security/company-access";

const uuid = z.string().uuid();

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

  listPublished: publicProcedure.input(z.object({ limit: z.number().int().min(1).max(48).default(24), offset: z.number().int().min(0).default(0) }).optional()).handler(async ({ input }) => {
    const result = await db.execute(sql`
      SELECT e.id, e.name, e.slug, e.region, e.district, e.price_from AS "priceFrom",
        c.legal_name AS "companyName",
        count(p.id) FILTER (WHERE p.status = 'AVAILABLE')::int AS "availablePlots"
      FROM estates e
      JOIN companies c ON c.id = e.company_id
      LEFT JOIN plots p ON p.estate_id = e.id
      WHERE e.status = 'approved' AND c.status = 'approved'
      GROUP BY e.id, c.legal_name
      ORDER BY e.created_at DESC
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
    const access = await requireCompanyWriteAccess(clerkId, input.companyId);
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
    const [estate] = await db.select({ companyId: estates.companyId }).from(estates).where(eq(estates.id, input.estateId)).limit(1);
    if (!estate) throw new ORPCError("NOT_FOUND");
    const access = await requireCompanyWriteAccess(clerkId, estate.companyId);
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
      throw error;
    }
    if (!created) throw new ORPCError("INTERNAL_SERVER_ERROR");
    const actualGeometry = await db.execute(sql`SELECT ST_AsGeoJSON(boundary)::json AS boundary FROM plots WHERE id=${created.id}`);
    const savedBoundary = (actualGeometry.rows[0] as { boundary?: typeof input.boundary } | undefined)?.boundary ?? input.boundary;
    await Promise.all([
      db.insert(geometryVersions).values({ resourceType: "plot", resourceId: created.id, action: "created", afterGeometry: savedBoundary, actorUserId: access.user.id, reason: input.reason }),
      db.insert(auditLogs).values({ userId: access.user.id, action: "plot.created", entityType: "plot", entityId: created.id, reason: input.reason, metadata: { estateId: input.estateId } }),
    ]);
    return { ...created, boundary: savedBoundary };
  }),

  submitEstate: protectedProcedure.input(z.object({ estateId: uuid })).handler(async ({ context, input }) => {
    const clerkId = context.auth?.userId;
    if (!clerkId) throw new ORPCError("UNAUTHORIZED");
    const [estate] = await db.select({ companyId: estates.companyId }).from(estates).where(eq(estates.id, input.estateId)).limit(1);
    if (!estate) throw new ORPCError("NOT_FOUND");
    const access = await requireCompanyWriteAccess(clerkId, estate.companyId);
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
