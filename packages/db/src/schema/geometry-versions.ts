import { index, jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { users } from "./users";
import type { GeoJsonGeometry } from "./geometry";

export const geometryVersions = pgTable("geometry_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  resourceType: varchar("resource_type", { length: 32 }).notNull(),
  resourceId: uuid("resource_id").notNull(),
  action: varchar("action", { length: 32 }).notNull(),
  beforeGeometry: jsonb("before_geometry").$type<GeoJsonGeometry | null>(),
  afterGeometry: jsonb("after_geometry").$type<GeoJsonGeometry>().notNull(),
  actorUserId: uuid("actor_user_id").notNull().references(() => users.id),
  reason: text("reason").notNull(),
  approvalState: varchar("approval_state", { length: 32 }).notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("geometry_versions_resource_idx").on(table.resourceType, table.resourceId, table.createdAt)]);
