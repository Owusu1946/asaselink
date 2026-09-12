import { boolean, index, integer, jsonb, numeric, pgTable, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { estates } from "./estates";
import { users } from "./users";

export const estateSitePlans = pgTable("estate_site_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  estateId: uuid("estate_id").notNull().references(() => estates.id, { onDelete: "cascade" }),
  fileName: varchar("file_name", { length: 256 }).notNull(),
  fileKey: varchar("file_key", { length: 512 }).notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: varchar("mime_type", { length: 64 }).notNull(),
  status: varchar("status", { length: 32 }).notNull().default("uploading"),
  coordinates: jsonb("coordinates").$type<[[number, number], [number, number], [number, number], [number, number]]>(),
  opacity: numeric("opacity", { precision: 3, scale: 2 }).notNull().default("0.65"),
  alignmentLocked: boolean("alignment_locked").notNull().default(false),
  alignedByUserId: uuid("aligned_by_user_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex("estate_site_plans_estate_uq").on(table.estateId),
  index("estate_site_plans_status_idx").on(table.status),
]);

export type EstateSitePlan = typeof estateSitePlans.$inferSelect;
