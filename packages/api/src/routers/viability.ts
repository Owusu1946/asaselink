import { ORPCError } from "@orpc/server";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@asaselink/db";
import { auditLogs, geometryVersions, viabilityChecks } from "@asaselink/db/schema";
import { protectedProcedure, publicProcedure } from "../index";
import { estateGeometrySchema, polygonSchema } from "../domain/geometry";
import { aggregateViabilityResult, type ViabilitySeverity } from "../domain/viability";
import { requireCompanyPermission } from "../security/company-access";
import { enforceRateLimit } from "../security/rate-limit";

const uuid = z.string().uuid();
const pointSchema = z.object({
  type: z.literal("Point"),
  coordinates: z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]),
});
const screeningGeometrySchema = z.union([pointSchema, estateGeometrySchema]);
const kindSchema = z.enum(["wetland", "water_body", "waterway", "flood_risk", "protected_area", "planning_restriction", "environmental_restriction", "utility", "other"]);
const severitySchema = z.enum(["caution", "potential_restriction"]);

type LayerRow = {
  id: string;
  name: string;
  kind: string;
  severity: ViabilitySeverity;
  provenance: string;
  sourceName: string;
  sourceUrl: string | null;
  sourceVersion: string | null;
  sourceDate: Date | null;
  coverageNotes: string;
  confidenceNotes: string | null;
  intersects: boolean;
  boundary: unknown;
};

export const viabilityRouter = {
  screen: publicProcedure.input(z.object({ geometry: screeningGeometrySchema })).handler(async ({ context, input }) => {
    await enforceRateLimit(context.requestKey, "viability.screen", 20, 60);
    const geometryJson = JSON.stringify(input.geometry);
    const validation = await db.execute(sql`
      SELECT ST_IsValid(candidate) AS valid,
        ST_IsEmpty(candidate) AS empty,
        ST_XMax(Box2D(candidate)) - ST_XMin(Box2D(candidate)) AS width,
        ST_YMax(Box2D(candidate)) - ST_YMin(Box2D(candidate)) AS height
      FROM (SELECT ST_SetSRID(ST_GeomFromGeoJSON(${geometryJson}), 4326) candidate) q
    `);
    const shape = validation.rows[0] as { valid: boolean; empty: boolean; width: number; height: number } | undefined;
    if (!shape?.valid || shape.empty) throw new ORPCError("BAD_REQUEST", { message: "Choose a valid point or closed area." });
    if (Number(shape.width) > 0.25 || Number(shape.height) > 0.25) throw new ORPCError("BAD_REQUEST", { message: "Screen an area no larger than roughly 25 km at a time." });

    const result = await db.execute(sql`
      WITH candidate AS (SELECT ST_SetSRID(ST_GeomFromGeoJSON(${geometryJson}), 4326) AS geom)
      SELECT sl.id, sl.name, sl.kind, sl.severity, sl.provenance,
        sl.source_name AS "sourceName", sl.source_url AS "sourceUrl",
        sl.source_version AS "sourceVersion", sl.source_date AS "sourceDate",
        sl.coverage_notes AS "coverageNotes", sl.confidence_notes AS "confidenceNotes",
        ST_Intersects(sl.boundary, candidate.geom) AS intersects,
        ST_AsGeoJSON(sl.boundary)::json AS boundary
      FROM screening_layers sl CROSS JOIN candidate
      WHERE sl.active = true
        AND (sl.provenance <> 'company_declared' OR ST_Intersects(sl.boundary, candidate.geom))
        AND sl.boundary && ST_Expand(candidate.geom, 0.3)
      ORDER BY intersects DESC, sl.severity DESC, sl.name
      LIMIT 100
    `);
    const layers = result.rows as unknown as LayerRow[];
    const intersections = layers.filter((layer) => layer.intersects);
    // Concern polygons describe known hazards, not complete geographic coverage.
    // Keep coverage incomplete until explicit authority coverage geometries are imported.
    const coverageComplete = false;
    const outcome = aggregateViabilityResult(intersections, coverageComplete);
    const limitations = coverageComplete
      ? "Available screening layers were checked. This is indicative screening, not official verification."
      : intersections.length > 0
        ? "A mapped concern intersects this location, but screening coverage remains incomplete. Confirm it with the relevant authority."
        : "No stored concern polygon intersects this selection, but screening coverage is incomplete. Satellite labels and imagery are not authoritative datasets; seek official verification.";
    const report = { outcome, coverageComplete, limitations, checkedAt: new Date().toISOString(), checkedLayers: layers.length, intersectingLayers: intersections.length };
    const [saved] = await db.insert(viabilityChecks).values({
      submittedGeometry: sql`ST_SetSRID(ST_GeomFromGeoJSON(${geometryJson}), 4326)`,
      result: outcome,
      checkedLayerIds: layers.map((layer) => layer.id),
      intersectingLayerIds: intersections.map((layer) => layer.id),
      coverageComplete,
      report,
    }).returning({ id: viabilityChecks.id, createdAt: viabilityChecks.createdAt });
    return { id: saved!.id, ...report, checkedAt: saved!.createdAt, submittedGeometry: input.geometry, layers };
  }),

  listEstateConcerns: protectedProcedure.input(z.object({ companyId: uuid, estateId: uuid })).handler(async ({ context, input }) => {
    const clerkId = context.auth?.userId;
    if (!clerkId) throw new ORPCError("UNAUTHORIZED");
    await requireCompanyPermission(clerkId, input.companyId, "plot:write");
    const rows = await db.execute(sql`
      SELECT sl.id, sl.name, sl.kind, sl.severity, sl.source_name AS "sourceName",
        sl.coverage_notes AS "coverageNotes", sl.created_at AS "createdAt",
        ST_AsGeoJSON(sl.boundary)::json AS boundary
      FROM screening_layers sl JOIN estates e ON e.id = sl.estate_id
      WHERE sl.estate_id = ${input.estateId} AND e.company_id = ${input.companyId}
        AND sl.provenance = 'company_declared' AND sl.active = true
      ORDER BY sl.created_at DESC
    `);
    return rows.rows;
  }),

  declareEstateConcern: protectedProcedure.input(z.object({
    companyId: uuid,
    estateId: uuid,
    name: z.string().trim().min(2).max(256),
    kind: kindSchema,
    severity: severitySchema,
    sourceNote: z.string().trim().min(5).max(1000),
    boundary: polygonSchema,
    acknowledgement: z.literal(true),
  })).handler(async ({ context, input }) => {
    const clerkId = context.auth?.userId;
    if (!clerkId) throw new ORPCError("UNAUTHORIZED");
    await enforceRateLimit(clerkId, "estate.concern.create", 60);
    const access = await requireCompanyPermission(clerkId, input.companyId, "plot:write");
    const boundaryJson = JSON.stringify(input.boundary);
    const inserted = await db.execute(sql`
      INSERT INTO screening_layers (company_id, estate_id, name, kind, severity, provenance, source_name, coverage_notes, confidence_notes, boundary, created_by_user_id)
      SELECT e.company_id, e.id, ${input.name}, ${input.kind}, ${input.severity}, 'company_declared',
        'Company declaration', ${input.sourceNote},
        'Declared by the estate company; not an official authority determination.',
        ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON(${boundaryJson}), 4326)), ${access.user.id}
      FROM estates e
      WHERE e.id = ${input.estateId} AND e.company_id = ${input.companyId}
        AND ST_CoveredBy(ST_SetSRID(ST_GeomFromGeoJSON(${boundaryJson}), 4326), e.boundary)
      RETURNING id, name, kind, severity, source_name AS "sourceName", coverage_notes AS "coverageNotes", created_at AS "createdAt", ST_AsGeoJSON(boundary)::json AS boundary
    `);
    const concern = inserted.rows[0];
    if (!concern) throw new ORPCError("BAD_REQUEST", { message: "Keep the concern area completely inside this estate boundary." });
    await Promise.all([
      db.insert(auditLogs).values({ userId: access.user.id, action: "estate.concern.declared", entityType: "screening_layer", entityId: String((concern as { id: string }).id), reason: input.sourceNote, metadata: { estateId: input.estateId, companyId: input.companyId, kind: input.kind, severity: input.severity } }),
      db.insert(geometryVersions).values({ resourceType: "screening_layer", resourceId: String((concern as { id: string }).id), action: "created", afterGeometry: input.boundary, actorUserId: access.user.id, reason: input.sourceNote }),
    ]);
    return concern;
  }),

  removeEstateConcern: protectedProcedure.input(z.object({ companyId: uuid, concernId: uuid, reason: z.string().trim().min(5).max(1000) })).handler(async ({ context, input }) => {
    const clerkId = context.auth?.userId;
    if (!clerkId) throw new ORPCError("UNAUTHORIZED");
    const access = await requireCompanyPermission(clerkId, input.companyId, "plot:write");
    const rows = await db.execute(sql`
      UPDATE screening_layers sl SET active = false, updated_at = now()
      FROM estates e
      WHERE sl.id = ${input.concernId} AND sl.estate_id = e.id AND e.company_id = ${input.companyId}
        AND sl.provenance = 'company_declared' AND sl.active = true
      RETURNING sl.id, sl.estate_id AS "estateId", sl.name, ST_AsGeoJSON(sl.boundary)::json AS boundary
    `);
    const removed = rows.rows[0] as { id: string; estateId: string; name: string; boundary: { type: "MultiPolygon"; coordinates: number[][][][] } } | undefined;
    if (!removed) throw new ORPCError("NOT_FOUND");
    await Promise.all([
      db.insert(auditLogs).values({ userId: access.user.id, action: "estate.concern.removed", entityType: "screening_layer", entityId: removed.id, reason: input.reason, metadata: { estateId: removed.estateId, companyId: input.companyId, name: removed.name } }),
      db.insert(geometryVersions).values({ resourceType: "screening_layer", resourceId: removed.id, action: "removed", beforeGeometry: removed.boundary, afterGeometry: removed.boundary, actorUserId: access.user.id, reason: input.reason }),
    ]);
    return { removed: true };
  }),
};
