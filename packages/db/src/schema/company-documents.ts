import { integer, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { companyApplications } from "./company-applications";

export const companyDocuments = pgTable("company_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  applicationId: uuid("application_id").references(() => companyApplications.id, {
    onDelete: "set null",
  }),
  documentType: varchar("document_type", { length: 64 }).notNull(),
  // certificate_of_incorporation | commencement_certificate | tax_clearance | representative_id
  fileName: varchar("file_name", { length: 256 }).notNull(),
  fileKey: varchar("file_key", { length: 512 }).notNull(),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type", { length: 128 }),
  status: varchar("status", { length: 32 }).notNull().default("uploaded"), // uploaded | verified | rejected
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
});

export type CompanyDocument = typeof companyDocuments.$inferSelect;
export type NewCompanyDocument = typeof companyDocuments.$inferInsert;
