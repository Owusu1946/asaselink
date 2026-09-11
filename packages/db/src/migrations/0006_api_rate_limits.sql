CREATE TABLE "api_rate_limits" (
  "key" varchar(256) NOT NULL,
  "window_started_at" timestamp with time zone NOT NULL,
  "request_count" integer DEFAULT 1 NOT NULL,
  PRIMARY KEY ("key", "window_started_at")
);
CREATE INDEX "api_rate_limits_cleanup_idx" ON "api_rate_limits" ("window_started_at");
