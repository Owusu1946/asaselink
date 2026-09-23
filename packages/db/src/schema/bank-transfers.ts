import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { payments } from "./payments";
import { users } from "./users";

export const bankAccounts = pgTable(
  "bank_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }),
    scope: varchar("scope", { length: 16 }).notNull().default("PLATFORM"),
    bankName: varchar("bank_name", { length: 120 }).notNull(),
    accountName: varchar("account_name", { length: 160 }).notNull(),
    accountNumber: varchar("account_number", { length: 40 }).notNull(),
    branch: varchar("branch", { length: 120 }),
    instructions: text("instructions"),
    version: integer("version").notNull().default(1),
    isActive: boolean("is_active").notNull().default(true),
    createdByUserId: uuid("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    deactivatedAt: timestamp("deactivated_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("bank_accounts_scope_version_uq").on(table.scope, table.companyId, table.version),
    index("bank_accounts_active_idx").on(table.scope, table.companyId, table.isActive),
    check("bank_accounts_scope_check", sql`${table.scope} in ('PLATFORM','COMPANY')`),
    check(
      "bank_accounts_owner_check",
      sql`(${table.scope}='PLATFORM' and ${table.companyId} is null) or (${table.scope}='COMPANY' and ${table.companyId} is not null)`,
    ),
  ],
);

export const paymentProofs = pgTable(
  "payment_proofs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    paymentId: uuid("payment_id")
      .notNull()
      .references(() => payments.id, { onDelete: "cascade" }),
    bankAccountId: uuid("bank_account_id")
      .notNull()
      .references(() => bankAccounts.id, { onDelete: "restrict" }),
    objectKey: text("object_key").notNull(),
    fileName: varchar("file_name", { length: 256 }).notNull(),
    mimeType: varchar("mime_type", { length: 80 }).notNull(),
    fileSize: integer("file_size").notNull(),
    checksum: varchar("checksum", { length: 128 }).notNull(),
    transferReference: varchar("transfer_reference", { length: 96 }).notNull(),
    transferDate: timestamp("transfer_date", { withTimezone: true }).notNull(),
    senderName: varchar("sender_name", { length: 160 }).notNull(),
    senderAccount: varchar("sender_account", { length: 80 }),
    status: varchar("status", { length: 24 }).notNull().default("UPLOADING"),
    uploadedAt: timestamp("uploaded_at", { withTimezone: true }),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewedByUserId: uuid("reviewed_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    reviewNote: text("review_note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("payment_proofs_payment_uq").on(table.paymentId),
    uniqueIndex("payment_proofs_object_key_uq").on(table.objectKey),
    index("payment_proofs_status_idx").on(table.status, table.createdAt),
    check(
      "payment_proofs_size_check",
      sql`${table.fileSize} > 0 and ${table.fileSize} <= 10485760`,
    ),
    check(
      "payment_proofs_mime_check",
      sql`${table.mimeType} in ('application/pdf','image/jpeg','image/png','image/webp')`,
    ),
    check(
      "payment_proofs_status_check",
      sql`${table.status} in ('UPLOADING','UPLOADED','SUBMITTED','UNDER_VERIFICATION','CONFIRMED','REJECTED','FAILED','REFUNDED','CANCELLED')`,
    ),
  ],
);

export type BankAccount = typeof bankAccounts.$inferSelect;
export type PaymentProof = typeof paymentProofs.$inferSelect;
