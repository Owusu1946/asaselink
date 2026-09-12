CREATE TABLE IF NOT EXISTS "estate_site_plans" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "estate_id" uuid NOT NULL REFERENCES "estates"("id") ON DELETE CASCADE,
  "file_name" varchar(256) NOT NULL,
  "file_key" varchar(512) NOT NULL,
  "file_size" integer NOT NULL,
  "mime_type" varchar(64) NOT NULL,
  "status" varchar(32) DEFAULT 'uploading' NOT NULL,
  "coordinates" jsonb,
  "opacity" numeric(3,2) DEFAULT '0.65' NOT NULL,
  "alignment_locked" boolean DEFAULT false NOT NULL,
  "aligned_by_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "estate_site_plans_status_check" CHECK ("status" IN ('uploading','ready')),
  CONSTRAINT "estate_site_plans_opacity_check" CHECK ("opacity" >= 0.1 AND "opacity" <= 1)
);
CREATE UNIQUE INDEX IF NOT EXISTS "estate_site_plans_estate_uq" ON "estate_site_plans" ("estate_id");
CREATE INDEX IF NOT EXISTS "estate_site_plans_status_idx" ON "estate_site_plans" ("status");
