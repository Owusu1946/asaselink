CREATE TABLE "support_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference" varchar(32) NOT NULL,
	"name" varchar(160) NOT NULL,
	"email" varchar(256) NOT NULL,
	"subject" varchar(160) NOT NULL,
	"message" text NOT NULL,
	"status" varchar(24) DEFAULT 'OPEN' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "support_requests_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
CREATE INDEX "support_requests_status_created_idx" ON "support_requests" USING btree ("status","created_at");