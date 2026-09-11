CREATE TABLE "reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference" varchar(32) NOT NULL,
	"plot_id" uuid NOT NULL,
	"buyer_user_id" uuid NOT NULL,
	"status" varchar(32) DEFAULT 'ACTIVE' NOT NULL,
	"price_snapshot" numeric(14, 2) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"cancelled_at" timestamp with time zone,
	"cancellation_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reservations_status_check" CHECK ("reservations"."status" in ('ACTIVE','PAYMENT_PENDING','CONFIRMED','CANCELLED','EXPIRED')),
	CONSTRAINT "reservations_price_nonnegative_check" CHECK ("reservations"."price_snapshot" >= 0)
);
--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_plot_id_plots_id_fk" FOREIGN KEY ("plot_id") REFERENCES "public"."plots"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_buyer_user_id_users_id_fk" FOREIGN KEY ("buyer_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "reservations_reference_uq" ON "reservations" USING btree ("reference");--> statement-breakpoint
CREATE UNIQUE INDEX "reservations_one_live_plot_uq" ON "reservations" USING btree ("plot_id") WHERE "reservations"."status" in ('ACTIVE','PAYMENT_PENDING','CONFIRMED');--> statement-breakpoint
CREATE INDEX "reservations_buyer_status_idx" ON "reservations" USING btree ("buyer_user_id","status");--> statement-breakpoint
CREATE INDEX "reservations_expiry_idx" ON "reservations" USING btree ("status","expires_at");