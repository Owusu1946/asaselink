import { sql } from "drizzle-orm";
import { check, index, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { estates } from "./estates";
import { geometry } from "./geometry";

export const restrictedAreas = pgTable("restricted_areas", {
  id: uuid("id").primaryKey().defaultRandom(),
  estateId: uuid("estate_id").notNull().references(() => estates.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 256 }).notNull(),
  kind: varchar("kind", { length: 32 }).notNull(),
  description: text("description"),
  boundary: geometry("boundary", { type: "MultiPolygon", srid: 4326 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("restricted_areas_estate_idx").on(table.estateId),
  index("restricted_areas_boundary_gist").using("gist", table.boundary),
  check("restricted_areas_kind_check", sql`${table.kind} in ('road','water','utility','reserved','other')`),
  check("restricted_areas_boundary_valid_check", sql`ST_IsValid(${table.boundary})`),
]);
