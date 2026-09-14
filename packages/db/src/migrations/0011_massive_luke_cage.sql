CREATE TABLE "company_ledger_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"payment_id" uuid,
	"payout_request_id" uuid,
	"type" varchar(32) NOT NULL,
	"status" varchar(24) NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'GHS' NOT NULL,
	"description" text NOT NULL,
	"available_at" timestamp with time zone,
	"settled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "company_ledger_type_check" CHECK ("company_ledger_entries"."type" in ('SALE_CREDIT','PAYOUT_DEBIT','REFUND_DEBIT','ADJUSTMENT_CREDIT','ADJUSTMENT_DEBIT')),
	CONSTRAINT "company_ledger_status_check" CHECK ("company_ledger_entries"."status" in ('PENDING','AVAILABLE','SETTLED','REVERSED')),
	CONSTRAINT "company_ledger_amount_check" CHECK ("company_ledger_entries"."amount" > 0),
	CONSTRAINT "company_ledger_currency_check" CHECK ("company_ledger_entries"."currency" = 'GHS'),
	CONSTRAINT "company_ledger_source_check" CHECK (("company_ledger_entries"."payment_id" is not null)::int + ("company_ledger_entries"."payout_request_id" is not null)::int = 1)
);
--> statement-breakpoint
CREATE TABLE "payment_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"event_key" varchar(128) NOT NULL,
	"type" varchar(48) NOT NULL,
	"from_status" varchar(32),
	"to_status" varchar(32) NOT NULL,
	"actor_user_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference" varchar(40) NOT NULL,
	"reservation_id" uuid NOT NULL,
	"buyer_user_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"provider" varchar(24) DEFAULT 'MOCK' NOT NULL,
	"provider_reference" varchar(96) NOT NULL,
	"method" varchar(32) NOT NULL,
	"status" varchar(32) DEFAULT 'INITIATED' NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"platform_fee_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"developer_net_amount" numeric(14, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'GHS' NOT NULL,
	"payer_phone" varchar(32),
	"payer_network" varchar(24),
	"bank_transfer_reference" varchar(96),
	"confirmed_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"failure_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_provider_check" CHECK ("payments"."provider" in ('MOCK')),
	CONSTRAINT "payments_method_check" CHECK ("payments"."method" in ('MTN_MOMO','TELECEL_CASH','AIRTELTIGO_MONEY','BANK_TRANSFER')),
	CONSTRAINT "payments_status_check" CHECK ("payments"."status" in ('INITIATED','PENDING_CONFIRMATION','SUCCEEDED','FAILED','CANCELLED','REFUNDED')),
	CONSTRAINT "payments_amount_check" CHECK ("payments"."amount" > 0 and "payments"."platform_fee_amount" >= 0 and "payments"."developer_net_amount" >= 0 and "payments"."amount" = "payments"."platform_fee_amount" + "payments"."developer_net_amount"),
	CONSTRAINT "payments_currency_check" CHECK ("payments"."currency" = 'GHS')
);
--> statement-breakpoint
CREATE TABLE "payout_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference" varchar(40) NOT NULL,
	"company_id" uuid NOT NULL,
	"requested_by_user_id" uuid NOT NULL,
	"reviewed_by_user_id" uuid,
	"amount" numeric(14, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'GHS' NOT NULL,
	"status" varchar(24) DEFAULT 'REQUESTED' NOT NULL,
	"destination_type" varchar(24) NOT NULL,
	"destination" jsonb NOT NULL,
	"review_note" text,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payout_requests_amount_check" CHECK ("payout_requests"."amount" > 0),
	CONSTRAINT "payout_requests_currency_check" CHECK ("payout_requests"."currency" = 'GHS'),
	CONSTRAINT "payout_requests_status_check" CHECK ("payout_requests"."status" in ('REQUESTED','APPROVED','PROCESSING','PAID','REJECTED','CANCELLED')),
	CONSTRAINT "payout_requests_destination_check" CHECK ("payout_requests"."destination_type" in ('MOBILE_MONEY','BANK_ACCOUNT'))
);
--> statement-breakpoint
ALTER TABLE "company_ledger_entries" ADD CONSTRAINT "company_ledger_entries_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_ledger_entries" ADD CONSTRAINT "company_ledger_entries_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_ledger_entries" ADD CONSTRAINT "company_ledger_entries_payout_request_id_payout_requests_id_fk" FOREIGN KEY ("payout_request_id") REFERENCES "public"."payout_requests"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_reservation_id_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_buyer_user_id_users_id_fk" FOREIGN KEY ("buyer_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_requests" ADD CONSTRAINT "payout_requests_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_requests" ADD CONSTRAINT "payout_requests_requested_by_user_id_users_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_requests" ADD CONSTRAINT "payout_requests_reviewed_by_user_id_users_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "company_ledger_payment_type_uq" ON "company_ledger_entries" USING btree ("payment_id","type");--> statement-breakpoint
CREATE UNIQUE INDEX "company_ledger_payout_type_uq" ON "company_ledger_entries" USING btree ("payout_request_id","type");--> statement-breakpoint
CREATE INDEX "company_ledger_company_status_idx" ON "company_ledger_entries" USING btree ("company_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_events_event_key_uq" ON "payment_events" USING btree ("event_key");--> statement-breakpoint
CREATE INDEX "payment_events_payment_created_idx" ON "payment_events" USING btree ("payment_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_reference_uq" ON "payments" USING btree ("reference");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_provider_reference_uq" ON "payments" USING btree ("provider","provider_reference");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_one_open_reservation_uq" ON "payments" USING btree ("reservation_id") WHERE "payments"."status" in ('INITIATED','PENDING_CONFIRMATION','SUCCEEDED');--> statement-breakpoint
CREATE INDEX "payments_buyer_created_idx" ON "payments" USING btree ("buyer_user_id","created_at");--> statement-breakpoint
CREATE INDEX "payments_company_status_idx" ON "payments" USING btree ("company_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "payout_requests_reference_uq" ON "payout_requests" USING btree ("reference");--> statement-breakpoint
CREATE INDEX "payout_requests_company_status_idx" ON "payout_requests" USING btree ("company_id","status");--> statement-breakpoint
CREATE INDEX "payout_requests_status_created_idx" ON "payout_requests" USING btree ("status","created_at");