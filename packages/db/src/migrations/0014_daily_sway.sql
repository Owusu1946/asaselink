CREATE TABLE "reservation_commercial_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"checkout_lock_minutes" integer DEFAULT 30 NOT NULL,
	"hold_payment_window_minutes" integer DEFAULT 30 NOT NULL,
	"hold_duration_minutes" integer DEFAULT 10080 NOT NULL,
	"hold_fee" numeric(14, 2) DEFAULT '500' NOT NULL,
	"refund_percentage" numeric(5, 2) DEFAULT '80' NOT NULL,
	"administrative_deduction" numeric(14, 2) DEFAULT '25' NOT NULL,
	"terms_version" varchar(40) DEFAULT 'v1' NOT NULL,
	"terms" text DEFAULT 'The hold fee reserves the selected plot for seven days after payment approval. If the hold expires, the refundable amount is calculated from the snapshotted refund percentage less the administrative deduction.' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reservation_commercial_settings_values_check" CHECK ("reservation_commercial_settings"."checkout_lock_minutes" > 0 and "reservation_commercial_settings"."hold_payment_window_minutes" > 0 and "reservation_commercial_settings"."hold_duration_minutes" > 0 and "reservation_commercial_settings"."hold_fee" > 0 and "reservation_commercial_settings"."refund_percentage" between 0 and 100 and "reservation_commercial_settings"."administrative_deduction" >= 0)
);
--> statement-breakpoint
CREATE TABLE "reservation_refunds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reservation_id" uuid NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"deduction" numeric(14, 2) NOT NULL,
	"status" varchar(24) DEFAULT 'PENDING' NOT NULL,
	"reason" text NOT NULL,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reservation_refunds_status_check" CHECK ("reservation_refunds"."status" in ('PENDING','COMPLETED','CANCELLED')),
	CONSTRAINT "reservation_refunds_amount_check" CHECK ("reservation_refunds"."amount" >= 0 and "reservation_refunds"."deduction" >= 0)
);
--> statement-breakpoint
ALTER TABLE "reservations" DROP CONSTRAINT "reservations_status_check";--> statement-breakpoint
DROP INDEX "reservations_one_live_plot_uq";--> statement-breakpoint
ALTER TABLE "reservations" ALTER COLUMN "status" SET DEFAULT 'CHECKOUT_LOCKED';--> statement-breakpoint
ALTER TABLE "reservations" ADD COLUMN "type" varchar(24) DEFAULT 'CHECKOUT_LOCK' NOT NULL;--> statement-breakpoint
ALTER TABLE "reservations" ADD COLUMN "checkout_lock_minutes_snapshot" integer DEFAULT 30 NOT NULL;--> statement-breakpoint
ALTER TABLE "reservations" ADD COLUMN "hold_duration_minutes_snapshot" integer;--> statement-breakpoint
ALTER TABLE "reservations" ADD COLUMN "hold_fee_snapshot" numeric(14, 2);--> statement-breakpoint
ALTER TABLE "reservations" ADD COLUMN "refund_percentage_snapshot" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "reservations" ADD COLUMN "administrative_deduction_snapshot" numeric(14, 2);--> statement-breakpoint
ALTER TABLE "reservations" ADD COLUMN "refundable_amount_snapshot" numeric(14, 2);--> statement-breakpoint
ALTER TABLE "reservations" ADD COLUMN "terms_version_snapshot" varchar(40);--> statement-breakpoint
ALTER TABLE "reservations" ADD COLUMN "terms_snapshot" text;--> statement-breakpoint
ALTER TABLE "reservations" ADD COLUMN "payment_deadline_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "reservations" ADD COLUMN "hold_started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "reservations" ADD COLUMN "activated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "reservations" ADD COLUMN "released_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "reservations" ADD COLUMN "release_reason" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "purpose" varchar(24) DEFAULT 'PURCHASE' NOT NULL;--> statement-breakpoint
UPDATE "reservations"
SET "status" = CASE
  WHEN "status" = 'ACTIVE' THEN 'CHECKOUT_LOCKED'
  WHEN "status" = 'PAYMENT_PENDING' THEN 'PURCHASE_IN_PROGRESS'
  WHEN "status" = 'CONFIRMED' THEN 'SOLD'
  ELSE "status"
END;--> statement-breakpoint
INSERT INTO "reservation_commercial_settings" ("active") VALUES (true);--> statement-breakpoint
ALTER TABLE "reservation_refunds" ADD CONSTRAINT "reservation_refunds_reservation_id_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "reservation_commercial_settings_one_active_uq" ON "reservation_commercial_settings" USING btree ("active") WHERE "reservation_commercial_settings"."active" = true;--> statement-breakpoint
CREATE UNIQUE INDEX "reservation_refunds_reservation_uq" ON "reservation_refunds" USING btree ("reservation_id");--> statement-breakpoint
CREATE INDEX "reservation_refunds_status_created_idx" ON "reservation_refunds" USING btree ("status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "reservations_one_live_plot_uq" ON "reservations" USING btree ("plot_id") WHERE "reservations"."status" in ('CHECKOUT_LOCKED','HOLD_PAYMENT_PENDING','HELD','PURCHASE_IN_PROGRESS');--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_type_check" CHECK ("reservations"."type" in ('CHECKOUT_LOCK','PAID_HOLD'));--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_terms_check" CHECK (("reservations"."type" = 'CHECKOUT_LOCK') or ("reservations"."hold_duration_minutes_snapshot" > 0 and "reservations"."hold_fee_snapshot" > 0 and "reservations"."refund_percentage_snapshot" between 0 and 100 and "reservations"."administrative_deduction_snapshot" >= 0 and "reservations"."refundable_amount_snapshot" >= 0 and "reservations"."terms_version_snapshot" is not null and "reservations"."terms_snapshot" is not null));--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_status_check" CHECK ("reservations"."status" in ('CHECKOUT_LOCKED','HOLD_PAYMENT_PENDING','HELD','PURCHASE_IN_PROGRESS','SOLD','CANCELLED','EXPIRED','RELEASED'));--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_purpose_check" CHECK ("payments"."purpose" in ('PURCHASE','HOLD_FEE'));
