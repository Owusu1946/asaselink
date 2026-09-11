import { sql } from "drizzle-orm";
import { check, index, numeric, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { plots } from "./plots";
import { users } from "./users";

export const reservations = pgTable("reservations", {
  id: uuid("id").primaryKey().defaultRandom(),
  reference: varchar("reference", { length: 32 }).notNull(),
  plotId: uuid("plot_id").notNull().references(() => plots.id, { onDelete: "restrict" }),
  buyerUserId: uuid("buyer_user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  status: varchar("status", { length: 32 }).notNull().default("ACTIVE"),
  priceSnapshot: numeric("price_snapshot", { precision: 14, scale: 2 }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  cancellationReason: text("cancellation_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex("reservations_reference_uq").on(table.reference),
  uniqueIndex("reservations_one_live_plot_uq").on(table.plotId).where(sql`${table.status} in ('ACTIVE','PAYMENT_PENDING','CONFIRMED')`),
  index("reservations_buyer_status_idx").on(table.buyerUserId, table.status),
  index("reservations_expiry_idx").on(table.status, table.expiresAt),
  check("reservations_status_check", sql`${table.status} in ('ACTIVE','PAYMENT_PENDING','CONFIRMED','CANCELLED','EXPIRED')`),
  check("reservations_price_nonnegative_check", sql`${table.priceSnapshot} >= 0`),
]);

export type Reservation = typeof reservations.$inferSelect;
export type NewReservation = typeof reservations.$inferInsert;
