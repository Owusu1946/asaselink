import { sql } from "drizzle-orm";
import {
  check,
  index,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { reservations } from "./reservations";
import { users } from "./users";

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  reference: varchar("reference", { length: 40 }).notNull(),
  reservationId: uuid("reservation_id").notNull().references(() => reservations.id, { onDelete: "restrict" }),
  buyerUserId: uuid("buyer_user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "restrict" }),
  provider: varchar("provider", { length: 24 }).notNull().default("MOCK"),
  providerReference: varchar("provider_reference", { length: 96 }).notNull(),
  method: varchar("method", { length: 32 }).notNull(),
  status: varchar("status", { length: 32 }).notNull().default("INITIATED"),
  purpose: varchar("purpose", { length: 24 }).notNull().default("PURCHASE"),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  platformFeeAmount: numeric("platform_fee_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  developerNetAmount: numeric("developer_net_amount", { precision: 14, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("GHS"),
  payerPhone: varchar("payer_phone", { length: 32 }),
  payerNetwork: varchar("payer_network", { length: 24 }),
  bankTransferReference: varchar("bank_transfer_reference", { length: 96 }),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  failedAt: timestamp("failed_at", { withTimezone: true }),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex("payments_reference_uq").on(table.reference),
  uniqueIndex("payments_provider_reference_uq").on(table.provider, table.providerReference),
  uniqueIndex("payments_one_open_reservation_uq").on(table.reservationId).where(sql`${table.status} in ('INITIATED','PENDING_CONFIRMATION')`),
  index("payments_buyer_created_idx").on(table.buyerUserId, table.createdAt),
  index("payments_company_status_idx").on(table.companyId, table.status),
  check("payments_provider_check", sql`${table.provider} in ('MOCK')`),
  check("payments_method_check", sql`${table.method} in ('MTN_MOMO','TELECEL_CASH','AIRTELTIGO_MONEY','BANK_TRANSFER')`),
  check("payments_status_check", sql`${table.status} in ('INITIATED','PENDING_CONFIRMATION','SUCCEEDED','FAILED','CANCELLED','REFUNDED')`),
  check("payments_purpose_check", sql`${table.purpose} in ('PURCHASE','HOLD_FEE','DEPOSIT','INSTALLMENT','BALANCE','FINAL_PAYMENT')`),
  check("payments_amount_check", sql`${table.amount} > 0 and ${table.platformFeeAmount} >= 0 and ${table.developerNetAmount} >= 0 and ${table.amount} = ${table.platformFeeAmount} + ${table.developerNetAmount}`),
  check("payments_currency_check", sql`${table.currency} = 'GHS'`),
]);

export const paymentEvents = pgTable("payment_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  paymentId: uuid("payment_id").notNull().references(() => payments.id, { onDelete: "cascade" }),
  eventKey: varchar("event_key", { length: 128 }).notNull(),
  type: varchar("type", { length: 48 }).notNull(),
  fromStatus: varchar("from_status", { length: 32 }),
  toStatus: varchar("to_status", { length: 32 }).notNull(),
  actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
  metadata: jsonb("metadata").notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("payment_events_event_key_uq").on(table.eventKey),
  index("payment_events_payment_created_idx").on(table.paymentId, table.createdAt),
]);

export const payoutRequests = pgTable("payout_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  reference: varchar("reference", { length: 40 }).notNull(),
  companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "restrict" }),
  requestedByUserId: uuid("requested_by_user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  reviewedByUserId: uuid("reviewed_by_user_id").references(() => users.id, { onDelete: "set null" }),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("GHS"),
  status: varchar("status", { length: 24 }).notNull().default("REQUESTED"),
  destinationType: varchar("destination_type", { length: 24 }).notNull(),
  destination: jsonb("destination").notNull(),
  reviewNote: text("review_note"),
  requestedAt: timestamp("requested_at", { withTimezone: true }).notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex("payout_requests_reference_uq").on(table.reference),
  index("payout_requests_company_status_idx").on(table.companyId, table.status),
  index("payout_requests_status_created_idx").on(table.status, table.createdAt),
  check("payout_requests_amount_check", sql`${table.amount} > 0`),
  check("payout_requests_currency_check", sql`${table.currency} = 'GHS'`),
  check("payout_requests_status_check", sql`${table.status} in ('REQUESTED','APPROVED','PROCESSING','PAID','REJECTED','CANCELLED')`),
  check("payout_requests_destination_check", sql`${table.destinationType} in ('MOBILE_MONEY','BANK_ACCOUNT')`),
]);

export const companyLedgerEntries = pgTable("company_ledger_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "restrict" }),
  paymentId: uuid("payment_id").references(() => payments.id, { onDelete: "restrict" }),
  payoutRequestId: uuid("payout_request_id").references(() => payoutRequests.id, { onDelete: "restrict" }),
  type: varchar("type", { length: 32 }).notNull(),
  status: varchar("status", { length: 24 }).notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("GHS"),
  description: text("description").notNull(),
  availableAt: timestamp("available_at", { withTimezone: true }),
  settledAt: timestamp("settled_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("company_ledger_payment_type_uq").on(table.paymentId, table.type),
  uniqueIndex("company_ledger_payout_type_uq").on(table.payoutRequestId, table.type),
  index("company_ledger_company_status_idx").on(table.companyId, table.status),
  check("company_ledger_type_check", sql`${table.type} in ('SALE_CREDIT','PAYOUT_DEBIT','REFUND_DEBIT','ADJUSTMENT_CREDIT','ADJUSTMENT_DEBIT')`),
  check("company_ledger_status_check", sql`${table.status} in ('PENDING','AVAILABLE','SETTLED','REVERSED')`),
  check("company_ledger_amount_check", sql`${table.amount} > 0`),
  check("company_ledger_currency_check", sql`${table.currency} = 'GHS'`),
  check("company_ledger_source_check", sql`(${table.paymentId} is not null)::int + (${table.payoutRequestId} is not null)::int = 1`),
]);

export type Payment = typeof payments.$inferSelect;
export type PaymentEvent = typeof paymentEvents.$inferSelect;
export type PayoutRequest = typeof payoutRequests.$inferSelect;
export type CompanyLedgerEntry = typeof companyLedgerEntries.$inferSelect;
