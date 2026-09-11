CREATE TABLE "outbox_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "topic" varchar(128) NOT NULL,
  "aggregate_id" varchar(128) NOT NULL,
  "payload" jsonb NOT NULL,
  "status" varchar(32) DEFAULT 'pending' NOT NULL,
  "attempts" integer DEFAULT 0 NOT NULL,
  "available_at" timestamp with time zone DEFAULT now() NOT NULL,
  "processed_at" timestamp with time zone,
  "last_error" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "outbox_status_check" CHECK ("status" IN ('pending','processing','processed'))
);
CREATE INDEX "outbox_dispatch_idx" ON "outbox_events" ("status", "available_at", "created_at");
