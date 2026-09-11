import { boolean, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { users } from "./users";

export const companyApplications = pgTable("company_applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  applicantUserId: uuid("applicant_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  currentStep: varchar("current_step", { length: 32 }).notNull().default("details"),
  // details | representative | documents | review | submitted
  repFullName: varchar("rep_full_name", { length: 128 }),
  repRole: varchar("rep_role", { length: 128 }),
  repEmail: varchar("rep_email", { length: 256 }),
  repPhone: varchar("rep_phone", { length: 64 }),
  repIdType: varchar("rep_id_type", { length: 64 }), // ghana_card | passport
  repIdNumber: varchar("rep_id_number", { length: 128 }),
  declarationAccepted: boolean("declaration_accepted").notNull().default(false),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewerUserId: uuid("reviewer_user_id").references(() => users.id),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type CompanyApplication = typeof companyApplications.$inferSelect;
export type NewCompanyApplication = typeof companyApplications.$inferInsert;
