CREATE TABLE "recent_explorations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"fingerprint" varchar(256) NOT NULL,
	"title" varchar(256) NOT NULL,
	"location" varchar(256) NOT NULL,
	"criteria" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_estates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"estate_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "recent_explorations" ADD CONSTRAINT "recent_explorations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_estates" ADD CONSTRAINT "saved_estates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_estates" ADD CONSTRAINT "saved_estates_estate_id_estates_id_fk" FOREIGN KEY ("estate_id") REFERENCES "public"."estates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "recent_explorations_user_fingerprint_uq" ON "recent_explorations" USING btree ("user_id","fingerprint");--> statement-breakpoint
CREATE INDEX "recent_explorations_user_updated_idx" ON "recent_explorations" USING btree ("user_id","updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "saved_estates_user_estate_uq" ON "saved_estates" USING btree ("user_id","estate_id");--> statement-breakpoint
CREATE INDEX "saved_estates_user_created_idx" ON "saved_estates" USING btree ("user_id","created_at");