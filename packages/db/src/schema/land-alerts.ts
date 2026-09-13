import { sql } from "drizzle-orm";
import { check, index, jsonb, numeric, pgTable, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { users } from "./users";
import { plots } from "./plots";
import { geometry } from "./geometry";

export const landAlerts = pgTable("land_alerts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  locationLabel: varchar("location_label", { length: 256 }).notNull(),
  region: varchar("region", { length: 128 }),
  district: varchar("district", { length: 128 }),
  center: geometry("center", { type: "Point", srid: 4326 }),
  radiusKm: numeric("radius_km", { precision: 7, scale: 2 }).notNull().default("10"),
  minPrice: numeric("min_price", { precision: 14, scale: 2 }),
  maxPrice: numeric("max_price", { precision: 14, scale: 2 }),
  channels: jsonb("channels").$type<Array<"email" | "sms">>().notNull().default(["email"]),
  frequency: varchar("frequency", { length: 16 }).notNull().default("instant"),
  status: varchar("status", { length: 16 }).notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index("land_alerts_active_location_idx").on(table.status, table.region, table.district),
  index("land_alerts_center_gist").using("gist", table.center),
  check("land_alerts_status_check", sql`${table.status} in ('active','paused')`),
  check("land_alerts_frequency_check", sql`${table.frequency} in ('instant','daily')`),
  check("land_alerts_price_range_check", sql`${table.minPrice} is null OR ${table.maxPrice} is null OR ${table.minPrice} <= ${table.maxPrice}`),
]);

export const landAlertMatches = pgTable("land_alert_matches", {
  id: uuid("id").primaryKey().defaultRandom(),
  alertId: uuid("alert_id").notNull().references(() => landAlerts.id, { onDelete: "cascade" }),
  plotId: uuid("plot_id").notNull().references(() => plots.id, { onDelete: "cascade" }),
  deliveryStatus: varchar("delivery_status", { length: 32 }).notNull().default("pending"),
  matchedAt: timestamp("matched_at", { withTimezone: true }).notNull().defaultNow(),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
}, (table) => [
  uniqueIndex("land_alert_matches_alert_plot_uq").on(table.alertId, table.plotId),
  index("land_alert_matches_delivery_idx").on(table.deliveryStatus, table.matchedAt),
]);
