import { sql } from "drizzle-orm";
import { check, index, jsonb, numeric, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { estates } from "./estates";
import { payments } from "./payments";
import { plots } from "./plots";
import { reservations } from "./reservations";
import { users } from "./users";

export const purchaseAccounts = pgTable("purchase_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  reference: varchar("reference", { length: 40 }).notNull(),
  buyerUserId: uuid("buyer_user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "restrict" }),
  estateId: uuid("estate_id").notNull().references(() => estates.id, { onDelete: "restrict" }),
  plotId: uuid("plot_id").notNull().references(() => plots.id, { onDelete: "restrict" }),
  sourceReservationId: uuid("source_reservation_id").notNull().references(() => reservations.id, { onDelete: "restrict" }),
  priceSnapshot: numeric("price_snapshot", { precision: 14, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("GHS"),
  status: varchar("status", { length: 32 }).notNull().default("PURCHASE_IN_PROGRESS"),
  agreedDueAt: timestamp("agreed_due_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  cancellationReason: text("cancellation_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex("purchase_accounts_reference_uq").on(table.reference),
  uniqueIndex("purchase_accounts_source_reservation_uq").on(table.sourceReservationId),
  uniqueIndex("purchase_accounts_one_live_plot_uq").on(table.plotId).where(sql`${table.status} in ('HOLD_ACTIVE','PURCHASE_IN_PROGRESS','PAID')`),
  index("purchase_accounts_buyer_status_idx").on(table.buyerUserId, table.status),
  index("purchase_accounts_company_status_idx").on(table.companyId, table.status),
  check("purchase_accounts_status_check", sql`${table.status} in ('HOLD_ACTIVE','PURCHASE_IN_PROGRESS','PAID','COMPLETED','CANCELLED','REFUND_PENDING')`),
  check("purchase_accounts_price_check", sql`${table.priceSnapshot} > 0`),
  check("purchase_accounts_currency_check", sql`${table.currency} = 'GHS'`),
]);

export const purchaseLedgerEntries = pgTable("purchase_ledger_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  purchaseAccountId: uuid("purchase_account_id").notNull().references(() => purchaseAccounts.id, { onDelete: "restrict" }),
  paymentId: uuid("payment_id").references(() => payments.id, { onDelete: "restrict" }),
  reservationId: uuid("reservation_id").references(() => reservations.id, { onDelete: "restrict" }),
  reversalOfEntryId: uuid("reversal_of_entry_id"),
  reference: varchar("reference", { length: 64 }).notNull(),
  type: varchar("type", { length: 32 }).notNull(),
  direction: varchar("direction", { length: 8 }).notNull(),
  status: varchar("status", { length: 16 }).notNull().default("CONFIRMED"),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("GHS"),
  actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
  reason: text("reason"),
  metadata: jsonb("metadata").notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("purchase_ledger_reference_uq").on(table.reference),
  uniqueIndex("purchase_ledger_payment_type_uq").on(table.paymentId, table.type).where(sql`${table.paymentId} is not null`),
  uniqueIndex("purchase_ledger_hold_credit_uq").on(table.purchaseAccountId, table.type).where(sql`${table.type} = 'HOLD_CREDIT' and ${table.status} = 'CONFIRMED'`),
  uniqueIndex("purchase_ledger_reversal_uq").on(table.reversalOfEntryId).where(sql`${table.reversalOfEntryId} is not null`),
  index("purchase_ledger_account_created_idx").on(table.purchaseAccountId, table.createdAt),
  check("purchase_ledger_type_check", sql`${table.type} in ('HOLD_CREDIT','DEPOSIT','INSTALLMENT','BALANCE','FINAL_PAYMENT','REFUND','ADJUSTMENT','REVERSAL')`),
  check("purchase_ledger_direction_check", sql`${table.direction} in ('CREDIT','DEBIT')`),
  check("purchase_ledger_status_check", sql`${table.status} in ('CONFIRMED','REVERSED')`),
  check("purchase_ledger_amount_check", sql`${table.amount} > 0`),
  check("purchase_ledger_currency_check", sql`${table.currency} = 'GHS'`),
]);

export type PurchaseAccount = typeof purchaseAccounts.$inferSelect;
export type PurchaseLedgerEntry = typeof purchaseLedgerEntries.$inferSelect;
