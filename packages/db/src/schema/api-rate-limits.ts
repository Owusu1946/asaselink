import { index, integer, pgTable, primaryKey, timestamp, varchar } from "drizzle-orm/pg-core";

export const apiRateLimits = pgTable("api_rate_limits", {
  key: varchar("key", { length: 256 }).notNull(),
  windowStartedAt: timestamp("window_started_at", { withTimezone: true }).notNull(),
  requestCount: integer("request_count").notNull().default(1),
}, (table) => [
  primaryKey({ columns: [table.key, table.windowStartedAt] }),
  index("api_rate_limits_cleanup_idx").on(table.windowStartedAt),
]);
