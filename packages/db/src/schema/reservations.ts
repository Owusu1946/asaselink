import { sql } from "drizzle-orm";
import { boolean, check, index, integer, numeric, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { plots } from "./plots";
import { users } from "./users";

export const reservations = pgTable("reservations", {
  id: uuid("id").primaryKey().defaultRandom(),
  reference: varchar("reference", { length: 32 }).notNull(),
  plotId: uuid("plot_id").notNull().references(() => plots.id, { onDelete: "restrict" }),
  buyerUserId: uuid("buyer_user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  type: varchar("type", { length: 24 }).notNull().default("CHECKOUT_LOCK"),
  status: varchar("status", { length: 32 }).notNull().default("CHECKOUT_LOCKED"),
  priceSnapshot: numeric("price_snapshot", { precision: 14, scale: 2 }).notNull(),
  checkoutLockMinutesSnapshot: integer("checkout_lock_minutes_snapshot").notNull().default(30),
  holdDurationMinutesSnapshot: integer("hold_duration_minutes_snapshot"),
  holdFeeSnapshot: numeric("hold_fee_snapshot", { precision: 14, scale: 2 }),
  refundPercentageSnapshot: numeric("refund_percentage_snapshot", { precision: 5, scale: 2 }),
  administrativeDeductionSnapshot: numeric("administrative_deduction_snapshot", { precision: 14, scale: 2 }),
  refundableAmountSnapshot: numeric("refundable_amount_snapshot", { precision: 14, scale: 2 }),
  termsVersionSnapshot: varchar("terms_version_snapshot", { length: 40 }),
  termsSnapshot: text("terms_snapshot"),
  paymentDeadlineAt: timestamp("payment_deadline_at", { withTimezone: true }),
  holdStartedAt: timestamp("hold_started_at", { withTimezone: true }),
  activatedAt: timestamp("activated_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  releasedAt: timestamp("released_at", { withTimezone: true }),
  releaseReason: text("release_reason"),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  cancellationReason: text("cancellation_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex("reservations_reference_uq").on(table.reference),
  uniqueIndex("reservations_one_live_plot_uq").on(table.plotId).where(sql`${table.status} in ('CHECKOUT_LOCKED','HOLD_PAYMENT_PENDING','HELD','PURCHASE_IN_PROGRESS')`),
  index("reservations_buyer_status_idx").on(table.buyerUserId, table.status),
  index("reservations_expiry_idx").on(table.status, table.expiresAt),
  check("reservations_type_check", sql`${table.type} in ('CHECKOUT_LOCK','PAID_HOLD')`),
  check("reservations_status_check", sql`${table.status} in ('CHECKOUT_LOCKED','HOLD_PAYMENT_PENDING','HELD','PURCHASE_IN_PROGRESS','SOLD','CANCELLED','EXPIRED','RELEASED')`),
  check("reservations_price_nonnegative_check", sql`${table.priceSnapshot} >= 0`),
  check("reservations_terms_check", sql`(${table.type} = 'CHECKOUT_LOCK') or (${table.holdDurationMinutesSnapshot} > 0 and ${table.holdFeeSnapshot} > 0 and ${table.refundPercentageSnapshot} between 0 and 100 and ${table.administrativeDeductionSnapshot} >= 0 and ${table.refundableAmountSnapshot} >= 0 and ${table.termsVersionSnapshot} is not null and ${table.termsSnapshot} is not null)`),
]);

export const reservationCommercialSettings = pgTable("reservation_commercial_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  active: boolean("active").notNull().default(true),
  checkoutLockMinutes: integer("checkout_lock_minutes").notNull().default(30),
  holdPaymentWindowMinutes: integer("hold_payment_window_minutes").notNull().default(30),
  holdDurationMinutes: integer("hold_duration_minutes").notNull().default(10080),
  holdFee: numeric("hold_fee", { precision: 14, scale: 2 }).notNull().default("500"),
  refundPercentage: numeric("refund_percentage", { precision: 5, scale: 2 }).notNull().default("80"),
  administrativeDeduction: numeric("administrative_deduction", { precision: 14, scale: 2 }).notNull().default("25"),
  termsVersion: varchar("terms_version", { length: 40 }).notNull().default("v1"),
  terms: text("terms").notNull().default("The hold fee reserves the selected plot for seven days after payment approval. If the hold expires, the refundable amount is calculated from the snapshotted refund percentage less the administrative deduction."),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex("reservation_commercial_settings_one_active_uq").on(table.active).where(sql`${table.active} = true`),
  check("reservation_commercial_settings_values_check", sql`${table.checkoutLockMinutes} > 0 and ${table.holdPaymentWindowMinutes} > 0 and ${table.holdDurationMinutes} > 0 and ${table.holdFee} > 0 and ${table.refundPercentage} between 0 and 100 and ${table.administrativeDeduction} >= 0`),
]);

export const reservationRefunds = pgTable("reservation_refunds", {
  id: uuid("id").primaryKey().defaultRandom(),
  reservationId: uuid("reservation_id").notNull().references(() => reservations.id, { onDelete: "restrict" }),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  deduction: numeric("deduction", { precision: 14, scale: 2 }).notNull(),
  status: varchar("status", { length: 24 }).notNull().default("PENDING"),
  reason: text("reason").notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex("reservation_refunds_reservation_uq").on(table.reservationId),
  index("reservation_refunds_status_created_idx").on(table.status, table.createdAt),
  check("reservation_refunds_status_check", sql`${table.status} in ('PENDING','COMPLETED','CANCELLED')`),
  check("reservation_refunds_amount_check", sql`${table.amount} >= 0 and ${table.deduction} >= 0`),
]);

export type Reservation = typeof reservations.$inferSelect;
export type NewReservation = typeof reservations.$inferInsert;
export type ReservationCommercialSettings = typeof reservationCommercialSettings.$inferSelect;
export type ReservationRefund = typeof reservationRefunds.$inferSelect;
