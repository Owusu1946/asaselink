import { pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  legalName: varchar("legal_name", { length: 256 }).notNull(),
  tradeName: varchar("trade_name", { length: 256 }),
  registrationNumber: varchar("registration_number", { length: 128 }),
  taxNumber: varchar("tax_number", { length: 128 }),
  email: varchar("email", { length: 256 }),
  phone: varchar("phone", { length: 64 }),
  website: varchar("website", { length: 256 }),
  address: text("address"),
  status: varchar("status", { length: 32 }).notNull().default("pending"), 
  // pending | under_review | changes_requested | approved | rejected | suspended
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
