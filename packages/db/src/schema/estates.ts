import { sql } from "drizzle-orm";
import { check, index, numeric, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { geometry } from "./geometry";

export const estates = pgTable("estates", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 256 }).notNull(),
  slug: varchar("slug", { length: 256 }).notNull(),
  description: text("description"),
  region: varchar("region", { length: 128 }).notNull(),
  district: varchar("district", { length: 128 }),
  address: text("address"),
  status: varchar("status", { length: 32 }).notNull().default("draft"),
  priceFrom: numeric("price_from", { precision: 14, scale: 2 }),
  boundary: geometry("boundary", { type: "MultiPolygon", srid: 4326 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex("estates_company_slug_uq").on(table.companyId, table.slug),
  index("estates_company_idx").on(table.companyId),
  index("estates_status_idx").on(table.status),
  index("estates_boundary_gist").using("gist", table.boundary),
  check("estates_status_check", sql`${table.status} in ('draft','submitted','approved','rejected','suspended')`),
  check("estates_boundary_valid_check", sql`ST_IsValid(${table.boundary})`),
]);

export type Estate = typeof estates.$inferSelect;
export type NewEstate = typeof estates.$inferInsert;
