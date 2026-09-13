import { index, jsonb, pgTable, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { estates } from "./estates";
import { users } from "./users";

export const savedEstates = pgTable("saved_estates", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  estateId: uuid("estate_id").notNull().references(() => estates.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("saved_estates_user_estate_uq").on(table.userId, table.estateId),
  index("saved_estates_user_created_idx").on(table.userId, table.createdAt),
]);

export const recentExplorations = pgTable("recent_explorations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  fingerprint: varchar("fingerprint", { length: 256 }).notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  location: varchar("location", { length: 256 }).notNull(),
  criteria: jsonb("criteria").$type<{ location: string; type: string; budget: string }>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex("recent_explorations_user_fingerprint_uq").on(table.userId, table.fingerprint),
  index("recent_explorations_user_updated_idx").on(table.userId, table.updatedAt),
]);
