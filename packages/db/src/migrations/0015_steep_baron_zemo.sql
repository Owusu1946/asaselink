CREATE TABLE "purchase_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference" varchar(40) NOT NULL,
	"buyer_user_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"estate_id" uuid NOT NULL,
	"plot_id" uuid NOT NULL,
	"source_reservation_id" uuid NOT NULL,
	"price_snapshot" numeric(14, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'GHS' NOT NULL,
	"status" varchar(32) DEFAULT 'PURCHASE_IN_PROGRESS' NOT NULL,
	"agreed_due_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"cancellation_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "purchase_accounts_status_check" CHECK ("purchase_accounts"."status" in ('HOLD_ACTIVE','PURCHASE_IN_PROGRESS','PAID','COMPLETED','CANCELLED','REFUND_PENDING')),
	CONSTRAINT "purchase_accounts_price_check" CHECK ("purchase_accounts"."price_snapshot" > 0),
	CONSTRAINT "purchase_accounts_currency_check" CHECK ("purchase_accounts"."currency" = 'GHS')
);
--> statement-breakpoint
CREATE TABLE "purchase_ledger_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"purchase_account_id" uuid NOT NULL,
	"payment_id" uuid,
	"reservation_id" uuid,
	"reversal_of_entry_id" uuid,
	"reference" varchar(64) NOT NULL,
	"type" varchar(32) NOT NULL,
	"direction" varchar(8) NOT NULL,
	"status" varchar(16) DEFAULT 'CONFIRMED' NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'GHS' NOT NULL,
	"actor_user_id" uuid,
	"reason" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "purchase_ledger_type_check" CHECK ("purchase_ledger_entries"."type" in ('HOLD_CREDIT','DEPOSIT','INSTALLMENT','BALANCE','FINAL_PAYMENT','REFUND','ADJUSTMENT','REVERSAL')),
	CONSTRAINT "purchase_ledger_direction_check" CHECK ("purchase_ledger_entries"."direction" in ('CREDIT','DEBIT')),
	CONSTRAINT "purchase_ledger_status_check" CHECK ("purchase_ledger_entries"."status" in ('CONFIRMED','REVERSED')),
	CONSTRAINT "purchase_ledger_amount_check" CHECK ("purchase_ledger_entries"."amount" > 0),
	CONSTRAINT "purchase_ledger_currency_check" CHECK ("purchase_ledger_entries"."currency" = 'GHS')
);
--> statement-breakpoint
ALTER TABLE "payments" DROP CONSTRAINT "payments_purpose_check";--> statement-breakpoint
DROP INDEX "payments_one_open_reservation_uq";--> statement-breakpoint
ALTER TABLE "purchase_accounts" ADD CONSTRAINT "purchase_accounts_buyer_user_id_users_id_fk" FOREIGN KEY ("buyer_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_accounts" ADD CONSTRAINT "purchase_accounts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_accounts" ADD CONSTRAINT "purchase_accounts_estate_id_estates_id_fk" FOREIGN KEY ("estate_id") REFERENCES "public"."estates"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_accounts" ADD CONSTRAINT "purchase_accounts_plot_id_plots_id_fk" FOREIGN KEY ("plot_id") REFERENCES "public"."plots"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_accounts" ADD CONSTRAINT "purchase_accounts_source_reservation_id_reservations_id_fk" FOREIGN KEY ("source_reservation_id") REFERENCES "public"."reservations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_ledger_entries" ADD CONSTRAINT "purchase_ledger_entries_purchase_account_id_purchase_accounts_id_fk" FOREIGN KEY ("purchase_account_id") REFERENCES "public"."purchase_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_ledger_entries" ADD CONSTRAINT "purchase_ledger_entries_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_ledger_entries" ADD CONSTRAINT "purchase_ledger_entries_reservation_id_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_ledger_entries" ADD CONSTRAINT "purchase_ledger_entries_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "purchase_accounts_reference_uq" ON "purchase_accounts" USING btree ("reference");--> statement-breakpoint
CREATE UNIQUE INDEX "purchase_accounts_source_reservation_uq" ON "purchase_accounts" USING btree ("source_reservation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "purchase_accounts_one_live_plot_uq" ON "purchase_accounts" USING btree ("plot_id") WHERE "purchase_accounts"."status" in ('HOLD_ACTIVE','PURCHASE_IN_PROGRESS','PAID');--> statement-breakpoint
CREATE INDEX "purchase_accounts_buyer_status_idx" ON "purchase_accounts" USING btree ("buyer_user_id","status");--> statement-breakpoint
CREATE INDEX "purchase_accounts_company_status_idx" ON "purchase_accounts" USING btree ("company_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "purchase_ledger_reference_uq" ON "purchase_ledger_entries" USING btree ("reference");--> statement-breakpoint
CREATE UNIQUE INDEX "purchase_ledger_payment_type_uq" ON "purchase_ledger_entries" USING btree ("payment_id","type") WHERE "purchase_ledger_entries"."payment_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "purchase_ledger_hold_credit_uq" ON "purchase_ledger_entries" USING btree ("purchase_account_id","type") WHERE "purchase_ledger_entries"."type" = 'HOLD_CREDIT' and "purchase_ledger_entries"."status" = 'CONFIRMED';--> statement-breakpoint
CREATE UNIQUE INDEX "purchase_ledger_reversal_uq" ON "purchase_ledger_entries" USING btree ("reversal_of_entry_id") WHERE "purchase_ledger_entries"."reversal_of_entry_id" is not null;--> statement-breakpoint
CREATE INDEX "purchase_ledger_account_created_idx" ON "purchase_ledger_entries" USING btree ("purchase_account_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_one_open_reservation_uq" ON "payments" USING btree ("reservation_id") WHERE "payments"."status" in ('INITIATED','PENDING_CONFIRMATION');--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_purpose_check" CHECK ("payments"."purpose" in ('PURCHASE','HOLD_FEE','DEPOSIT','INSTALLMENT','BALANCE','FINAL_PAYMENT'));