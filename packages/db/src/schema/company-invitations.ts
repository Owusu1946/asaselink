import { index, pgTable, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { users } from "./users";

export const companyInvitations = pgTable("company_invitations", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  invitedByUserId: uuid("invited_by_user_id").references(() => users.id, { onDelete: "set null" }),
  clerkInvitationId: varchar("clerk_invitation_id", { length: 256 }).notNull(),
  email: varchar("email", { length: 256 }).notNull(),
  role: varchar("role", { length: 32 }).notNull(),
  status: varchar("status", { length: 32 }).notNull().default("pending"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex("company_invitations_clerk_id_unique").on(table.clerkInvitationId),
  index("company_invitations_company_status_idx").on(table.companyId, table.status),
]);

export type CompanyInvitation = typeof companyInvitations.$inferSelect;
export type NewCompanyInvitation = typeof companyInvitations.$inferInsert;
