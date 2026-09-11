CREATE EXTENSION IF NOT EXISTS postgis;
--> statement-breakpoint
CREATE TABLE "estates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" varchar(256) NOT NULL,
	"slug" varchar(256) NOT NULL,
	"description" text,
	"region" varchar(128) NOT NULL,
	"district" varchar(128),
	"address" text,
	"status" varchar(32) DEFAULT 'draft' NOT NULL,
	"price_from" numeric(14, 2),
	"boundary" geometry(MultiPolygon,4326) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "estates_status_check" CHECK ("estates"."status" in ('draft','submitted','approved','rejected','suspended')),
	CONSTRAINT "estates_boundary_valid_check" CHECK (ST_IsValid("estates"."boundary"))
);
--> statement-breakpoint
CREATE TABLE "geometry_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resource_type" varchar(32) NOT NULL,
	"resource_id" uuid NOT NULL,
	"action" varchar(32) NOT NULL,
	"before_geometry" jsonb,
	"after_geometry" jsonb NOT NULL,
	"actor_user_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"approval_state" varchar(32) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"estate_id" uuid NOT NULL,
	"plot_number" varchar(128) NOT NULL,
	"status" varchar(32) DEFAULT 'AVAILABLE' NOT NULL,
	"area_square_meters" numeric(14, 2) NOT NULL,
	"price" numeric(14, 2) NOT NULL,
	"boundary" geometry(Polygon,4326) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "plots_status_check" CHECK ("plots"."status" in ('AVAILABLE','RESERVED','SOLD','BLOCKED')),
	CONSTRAINT "plots_boundary_valid_check" CHECK (ST_IsValid("plots"."boundary")),
	CONSTRAINT "plots_area_positive_check" CHECK ("plots"."area_square_meters" > 0),
	CONSTRAINT "plots_price_nonnegative_check" CHECK ("plots"."price" >= 0)
);
--> statement-breakpoint
CREATE TABLE "restricted_areas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"estate_id" uuid NOT NULL,
	"name" varchar(256) NOT NULL,
	"kind" varchar(32) NOT NULL,
	"description" text,
	"boundary" geometry(MultiPolygon,4326) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "restricted_areas_kind_check" CHECK ("restricted_areas"."kind" in ('road','water','utility','reserved','other')),
	CONSTRAINT "restricted_areas_boundary_valid_check" CHECK (ST_IsValid("restricted_areas"."boundary"))
);
--> statement-breakpoint
ALTER TABLE "estates" ADD CONSTRAINT "estates_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geometry_versions" ADD CONSTRAINT "geometry_versions_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plots" ADD CONSTRAINT "plots_estate_id_estates_id_fk" FOREIGN KEY ("estate_id") REFERENCES "public"."estates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restricted_areas" ADD CONSTRAINT "restricted_areas_estate_id_estates_id_fk" FOREIGN KEY ("estate_id") REFERENCES "public"."estates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "estates_company_slug_uq" ON "estates" USING btree ("company_id","slug");--> statement-breakpoint
CREATE INDEX "estates_company_idx" ON "estates" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "estates_status_idx" ON "estates" USING btree ("status");--> statement-breakpoint
CREATE INDEX "estates_boundary_gist" ON "estates" USING gist ("boundary");--> statement-breakpoint
CREATE INDEX "geometry_versions_resource_idx" ON "geometry_versions" USING btree ("resource_type","resource_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "plots_estate_number_uq" ON "plots" USING btree ("estate_id","plot_number");--> statement-breakpoint
CREATE INDEX "plots_estate_status_idx" ON "plots" USING btree ("estate_id","status");--> statement-breakpoint
CREATE INDEX "plots_boundary_gist" ON "plots" USING gist ("boundary");--> statement-breakpoint
CREATE INDEX "restricted_areas_estate_idx" ON "restricted_areas" USING btree ("estate_id");--> statement-breakpoint
CREATE INDEX "restricted_areas_boundary_gist" ON "restricted_areas" USING gist ("boundary");
