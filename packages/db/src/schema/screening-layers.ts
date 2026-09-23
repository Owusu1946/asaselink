import { sql } from "drizzle-orm";
import { boolean, check, index, jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { estates } from "./estates";
import { geometry } from "./geometry";
import { users } from "./users";

export const screeningLayers = pgTable("screening_layers", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }),
  estateId: uuid("estate_id").references(() => estates.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 256 }).notNull(),
  kind: varchar("kind", { length: 48 }).notNull(),
  severity: varchar("severity", { length: 32 }).notNull().default("caution"),
  provenance: varchar("provenance", { length: 32 }).notNull(),
  sourceName: varchar("source_name", { length: 256 }).notNull(),
  sourceUrl: text("source_url"),
  sourceVersion: varchar("source_version", { length: 128 }),
  sourceDate: timestamp("source_date", { withTimezone: true }),
  coverageNotes: text("coverage_notes").notNull(),
  confidenceNotes: text("confidence_notes"),
  boundary: geometry("boundary", { type: "MultiPolygon", srid: 4326 }).notNull(),
  active: boolean("active").notNull().default(true),
  createdByUserId: uuid("created_by_user_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("screening_layers_boundary_gist").using("gist", table.boundary),
  index("screening_layers_estate_idx").on(table.estateId),
  index("screening_layers_active_kind_idx").on(table.active, table.kind),
  check("screening_layers_kind_check", sql`${table.kind} in ('wetland','water_body','waterway','flood_risk','protected_area','planning_restriction','environmental_restriction','utility','other')`),
  check("screening_layers_severity_check", sql`${table.severity} in ('caution','potential_restriction')`),
  check("screening_layers_provenance_check", sql`${table.provenance} in ('official','licensed','prototype','company_declared')`),
  check("screening_layers_boundary_valid_check", sql`ST_IsValid(${table.boundary})`),
  check("screening_layers_company_scope_check", sql`(${table.provenance} = 'company_declared' AND ${table.companyId} IS NOT NULL AND ${table.estateId} IS NOT NULL) OR (${table.provenance} <> 'company_declared' AND ${table.estateId} IS NULL)`),
]);

export const viabilityChecks = pgTable("viability_checks", {
  id: uuid("id").primaryKey().defaultRandom(),
  requesterUserId: uuid("requester_user_id").references(() => users.id, { onDelete: "set null" }),
  submittedGeometry: geometry("submitted_geometry", { type: "Geometry", srid: 4326 }).notNull(),
  result: varchar("result", { length: 32 }).notNull(),
  checkedLayerIds: uuid("checked_layer_ids").array().notNull().default(sql`'{}'::uuid[]`),
  intersectingLayerIds: uuid("intersecting_layer_ids").array().notNull().default(sql`'{}'::uuid[]`),
  coverageComplete: boolean("coverage_complete").notNull().default(false),
  report: jsonb("report").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("viability_checks_geometry_gist").using("gist", table.submittedGeometry),
  index("viability_checks_requester_idx").on(table.requesterUserId, table.createdAt),
  check("viability_checks_result_check", sql`${table.result} in ('CLEAR','CAUTION','POTENTIAL_RESTRICTION')`),
  check("viability_checks_geometry_valid_check", sql`ST_IsValid(${table.submittedGeometry})`),
]);

