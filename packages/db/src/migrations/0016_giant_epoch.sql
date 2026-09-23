CREATE TABLE "bank_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid,
	"scope" varchar(16) DEFAULT 'PLATFORM' NOT NULL,
	"bank_name" varchar(120) NOT NULL,
	"account_name" varchar(160) NOT NULL,
	"account_number" varchar(40) NOT NULL,
	"branch" varchar(120),
	"instructions" text,
	"version" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deactivated_at" timestamp with time zone,
	CONSTRAINT "bank_accounts_scope_check" CHECK ("bank_accounts"."scope" in ('PLATFORM','COMPANY')),
	CONSTRAINT "bank_accounts_owner_check" CHECK (("bank_accounts"."scope"='PLATFORM' and "bank_accounts"."company_id" is null) or ("bank_accounts"."scope"='COMPANY' and "bank_accounts"."company_id" is not null))
);
--> statement-breakpoint
CREATE TABLE "payment_proofs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"bank_account_id" uuid NOT NULL,
	"object_key" text NOT NULL,
	"file_name" varchar(256) NOT NULL,
	"mime_type" varchar(80) NOT NULL,
	"file_size" integer NOT NULL,
	"checksum" varchar(128) NOT NULL,
	"transfer_reference" varchar(96) NOT NULL,
	"transfer_date" timestamp with time zone NOT NULL,
	"sender_name" varchar(160) NOT NULL,
	"sender_account" varchar(80),
	"status" varchar(24) DEFAULT 'UPLOADING' NOT NULL,
	"uploaded_at" timestamp with time zone,
	"submitted_at" timestamp with time zone,
	"reviewed_at" timestamp with time zone,
	"reviewed_by_user_id" uuid,
	"review_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_proofs_size_check" CHECK ("payment_proofs"."file_size" > 0 and "payment_proofs"."file_size" <= 10485760),
	CONSTRAINT "payment_proofs_mime_check" CHECK ("payment_proofs"."mime_type" in ('application/pdf','image/jpeg','image/png','image/webp')),
	CONSTRAINT "payment_proofs_status_check" CHECK ("payment_proofs"."status" in ('UPLOADING','UPLOADED','SUBMITTED','UNDER_VERIFICATION','CONFIRMED','REJECTED','FAILED','REFUNDED','CANCELLED'))
);
--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_proofs" ADD CONSTRAINT "payment_proofs_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_proofs" ADD CONSTRAINT "payment_proofs_bank_account_id_bank_accounts_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "public"."bank_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_proofs" ADD CONSTRAINT "payment_proofs_reviewed_by_user_id_users_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "bank_accounts_scope_version_uq" ON "bank_accounts" USING btree ("scope","company_id","version");--> statement-breakpoint
CREATE INDEX "bank_accounts_active_idx" ON "bank_accounts" USING btree ("scope","company_id","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_proofs_payment_uq" ON "payment_proofs" USING btree ("payment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_proofs_object_key_uq" ON "payment_proofs" USING btree ("object_key");--> statement-breakpoint
CREATE INDEX "payment_proofs_status_idx" ON "payment_proofs" USING btree ("status","created_at");
--> statement-breakpoint
INSERT INTO "bank_accounts" ("scope","bank_name","account_name","account_number","branch","instructions","version","is_active")
SELECT 'PLATFORM','AsaseLink Prototype Bank','AsaseLink Collections','0000000000','Online Collections','Use your payment reference as the transfer narration. This is a mock prototype account; do not send real money.',1,true
WHERE NOT EXISTS (SELECT 1 FROM "bank_accounts" WHERE "scope"='PLATFORM' AND "is_active"=true);
