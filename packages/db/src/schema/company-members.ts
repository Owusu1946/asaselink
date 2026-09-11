import { index, pgTable, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { users } from "./users";

export const companyMembers = pgTable("company_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  clerkMembershipId: varchar("clerk_membership_id", { length: 256 }),
  role: varchar("role", { length: 32 }).notNull().default("owner"), // owner | admin | manager | sales | surveyor | viewer
  status: varchar("status", { length: 32 }).notNull().default("active"), // active | suspended | removed
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex("company_members_company_user_unique").on(table.companyId, table.userId),
  uniqueIndex("company_members_clerk_membership_unique").on(table.clerkMembershipId),
  index("company_members_company_status_idx").on(table.companyId, table.status),
]);

export type CompanyMember = typeof companyMembers.$inferSelect;
export type NewCompanyMember = typeof companyMembers.$inferInsert;
