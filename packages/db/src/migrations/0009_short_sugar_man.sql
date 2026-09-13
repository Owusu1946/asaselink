CREATE TABLE "land_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"location_label" varchar(256) NOT NULL,
	"region" varchar(128),
	"district" varchar(128),
	"center" geometry(Point,4326),
	"radius_km" numeric(7, 2) DEFAULT '10' NOT NULL,
	"min_price" numeric(14, 2),
	"max_price" numeric(14, 2),
	"channels" jsonb DEFAULT '["email"]'::jsonb NOT NULL,
	"frequency" varchar(16) DEFAULT 'instant' NOT NULL,
	"status" varchar(16) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "land_alerts_status_check" CHECK ("land_alerts"."status" in ('active','paused')),
	CONSTRAINT "land_alerts_frequency_check" CHECK ("land_alerts"."frequency" in ('instant','daily')),
	CONSTRAINT "land_alerts_price_range_check" CHECK ("land_alerts"."min_price" is null OR "land_alerts"."max_price" is null OR "land_alerts"."min_price" <= "land_alerts"."max_price")
);
--> statement-breakpoint
CREATE TABLE "land_alert_matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alert_id" uuid NOT NULL,
	"plot_id" uuid NOT NULL,
	"delivery_status" varchar(32) DEFAULT 'pending' NOT NULL,
	"matched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"delivered_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "land_alerts" ADD CONSTRAINT "land_alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "land_alert_matches" ADD CONSTRAINT "land_alert_matches_alert_id_land_alerts_id_fk" FOREIGN KEY ("alert_id") REFERENCES "public"."land_alerts"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "land_alert_matches" ADD CONSTRAINT "land_alert_matches_plot_id_plots_id_fk" FOREIGN KEY ("plot_id") REFERENCES "public"."plots"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "land_alerts_active_location_idx" ON "land_alerts" USING btree ("status","region","district");
--> statement-breakpoint
CREATE INDEX "land_alerts_center_gist" ON "land_alerts" USING gist ("center");
--> statement-breakpoint
CREATE UNIQUE INDEX "land_alert_matches_alert_plot_uq" ON "land_alert_matches" USING btree ("alert_id","plot_id");
--> statement-breakpoint
CREATE INDEX "land_alert_matches_delivery_idx" ON "land_alert_matches" USING btree ("delivery_status","matched_at");
