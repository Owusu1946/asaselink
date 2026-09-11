import { sql } from "drizzle-orm";
import { check, index, numeric, pgTable, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { estates } from "./estates";
import { geometry } from "./geometry";

export const plots = pgTable("plots", {
  id: uuid("id").primaryKey().defaultRandom(),
  estateId: uuid("estate_id").notNull().references(() => estates.id, { onDelete: "cascade" }),
  plotNumber: varchar("plot_number", { length: 128 }).notNull(),
  status: varchar("status", { length: 32 }).notNull().default("AVAILABLE"),
  areaSquareMeters: numeric("area_square_meters", { precision: 14, scale: 2 }).notNull(),
  price: numeric("price", { precision: 14, scale: 2 }).notNull(),
  boundary: geometry("boundary", { type: "Polygon", srid: 4326 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex("plots_estate_number_uq").on(table.estateId, table.plotNumber),
  index("plots_estate_status_idx").on(table.estateId, table.status),
  index("plots_boundary_gist").using("gist", table.boundary),
  check("plots_status_check", sql`${table.status} in ('AVAILABLE','RESERVED','SOLD','BLOCKED')`),
  check("plots_boundary_valid_check", sql`ST_IsValid(${table.boundary})`),
  check("plots_area_positive_check", sql`${table.areaSquareMeters} > 0`),
  check("plots_price_nonnegative_check", sql`${table.price} >= 0`),
]);

export type Plot = typeof plots.$inferSelect;
export type NewPlot = typeof plots.$inferInsert;
