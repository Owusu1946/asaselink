import { jsonb, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

export const webhookEvents = pgTable("webhook_events", {
  id: varchar("id", { length: 256 }).primaryKey(),
  provider: varchar("provider", { length: 32 }).notNull(),
  eventType: varchar("event_type", { length: 128 }).notNull(),
  status: varchar("status", { length: 32 }).notNull().default("processing"),
  payload: jsonb("payload").$type<Record<string, unknown>>(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
