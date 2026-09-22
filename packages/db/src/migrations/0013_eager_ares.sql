CREATE TABLE "screening_layers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid,
	"estate_id" uuid,
	"name" varchar(256) NOT NULL,
	"kind" varchar(48) NOT NULL,
	"severity" varchar(32) DEFAULT 'caution' NOT NULL,
	"provenance" varchar(32) NOT NULL,
	"source_name" varchar(256) NOT NULL,
	"source_url" text,
	"source_version" varchar(128),
	"source_date" timestamp with time zone,
	"coverage_notes" text NOT NULL,
	"confidence_notes" text,
	"boundary" geometry(MultiPolygon,4326) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "screening_layers_kind_check" CHECK ("screening_layers"."kind" in ('wetland','water_body','waterway','flood_risk','protected_area','planning_restriction','environmental_restriction','utility','other')),
	CONSTRAINT "screening_layers_severity_check" CHECK ("screening_layers"."severity" in ('caution','potential_restriction')),
	CONSTRAINT "screening_layers_provenance_check" CHECK ("screening_layers"."provenance" in ('official','licensed','prototype','company_declared')),
	CONSTRAINT "screening_layers_boundary_valid_check" CHECK (ST_IsValid("screening_layers"."boundary")),
	CONSTRAINT "screening_layers_company_scope_check" CHECK (("screening_layers"."provenance" = 'company_declared' AND "screening_layers"."company_id" IS NOT NULL AND "screening_layers"."estate_id" IS NOT NULL) OR ("screening_layers"."provenance" <> 'company_declared' AND "screening_layers"."estate_id" IS NULL))
);
--> statement-breakpoint
CREATE TABLE "viability_checks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requester_user_id" uuid,
	"submitted_geometry" geometry(Geometry,4326) NOT NULL,
	"result" varchar(32) NOT NULL,
	"checked_layer_ids" uuid[] DEFAULT '{}'::uuid[] NOT NULL,
	"intersecting_layer_ids" uuid[] DEFAULT '{}'::uuid[] NOT NULL,
	"coverage_complete" boolean DEFAULT false NOT NULL,
	"report" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "viability_checks_result_check" CHECK ("viability_checks"."result" in ('CLEAR','CAUTION','POTENTIAL_RESTRICTION')),
	CONSTRAINT "viability_checks_geometry_valid_check" CHECK (ST_IsValid("viability_checks"."submitted_geometry"))
);
--> statement-breakpoint
ALTER TABLE "screening_layers" ADD CONSTRAINT "screening_layers_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "screening_layers" ADD CONSTRAINT "screening_layers_estate_id_estates_id_fk" FOREIGN KEY ("estate_id") REFERENCES "public"."estates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "screening_layers" ADD CONSTRAINT "screening_layers_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "viability_checks" ADD CONSTRAINT "viability_checks_requester_user_id_users_id_fk" FOREIGN KEY ("requester_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "screening_layers_boundary_gist" ON "screening_layers" USING gist ("boundary");--> statement-breakpoint
CREATE INDEX "screening_layers_estate_idx" ON "screening_layers" USING btree ("estate_id");--> statement-breakpoint
CREATE INDEX "screening_layers_active_kind_idx" ON "screening_layers" USING btree ("active","kind");--> statement-breakpoint
CREATE INDEX "viability_checks_geometry_gist" ON "viability_checks" USING gist ("submitted_geometry");--> statement-breakpoint
CREATE INDEX "viability_checks_requester_idx" ON "viability_checks" USING btree ("requester_user_id","created_at");
--> statement-breakpoint
INSERT INTO "screening_layers" ("name", "kind", "severity", "provenance", "source_name", "source_version", "coverage_notes", "confidence_notes", "boundary") VALUES
  ('Prototype Wetland - Accra Demonstration', 'wetland', 'potential_restriction', 'prototype', 'AsaseLink prototype seed', '2026.09', 'Demonstration polygon only; not official coverage.', 'Not suitable for legal, planning, environmental, or purchase decisions.', ST_Multi(ST_GeomFromText('POLYGON((-0.235 5.565,-0.220 5.565,-0.220 5.578,-0.235 5.578,-0.235 5.565))',4326))),
  ('Prototype Flood Caution - Tema Demonstration', 'flood_risk', 'caution', 'prototype', 'AsaseLink prototype seed', '2026.09', 'Demonstration polygon only; not an official flood model.', 'Seek professional and authority confirmation.', ST_Multi(ST_GeomFromText('POLYGON((0.000 5.660,0.020 5.660,0.020 5.678,0.000 5.678,0.000 5.660))',4326))),
  ('Prototype Protected Area - Aburi Demonstration', 'protected_area', 'potential_restriction', 'prototype', 'AsaseLink prototype seed', '2026.09', 'Demonstration polygon only; not an official reserve boundary.', 'Seek confirmation from the relevant authority.', ST_Multi(ST_GeomFromText('POLYGON((-0.205 5.825,-0.185 5.825,-0.185 5.842,-0.205 5.842,-0.205 5.825))',4326)));
--> statement-breakpoint
CREATE OR REPLACE FUNCTION enforce_plot_geometry()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  estate_boundary geometry(MultiPolygon, 4326);
  clipped_boundary geometry;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.estate_id::text, 0));
  SELECT boundary INTO estate_boundary FROM estates WHERE id = NEW.estate_id;
  IF estate_boundary IS NULL THEN RAISE EXCEPTION 'Estate does not exist' USING ERRCODE = '23503'; END IF;
  IF NOT ST_IsValid(NEW.boundary) OR ST_IsEmpty(NEW.boundary) THEN RAISE EXCEPTION 'Plot boundary is invalid' USING ERRCODE = '23514'; END IF;
  IF NOT ST_CoveredBy(NEW.boundary, estate_boundary) THEN
    IF ST_CoveredBy(NEW.boundary, ST_Buffer(estate_boundary::geography, 1)::geometry) THEN
      clipped_boundary := ST_Intersection(NEW.boundary, estate_boundary);
      IF GeometryType(clipped_boundary) <> 'POLYGON' OR ST_IsEmpty(clipped_boundary) THEN RAISE EXCEPTION 'Plot boundary must be contained by its estate' USING ERRCODE = '23514'; END IF;
      NEW.boundary := clipped_boundary;
    ELSE RAISE EXCEPTION 'Plot boundary must be contained by its estate' USING ERRCODE = '23514';
    END IF;
  END IF;
  IF EXISTS (SELECT 1 FROM plots p WHERE p.estate_id = NEW.estate_id AND p.id <> NEW.id AND ST_Area(ST_Intersection(p.boundary, NEW.boundary)::geography) > 0.01) THEN
    RAISE EXCEPTION 'Plot boundary overlaps an existing plot' USING ERRCODE = '23P01';
  END IF;
  IF EXISTS (SELECT 1 FROM restricted_areas r WHERE r.estate_id = NEW.estate_id AND ST_Area(ST_Intersection(r.boundary, NEW.boundary)::geography) > 0.01) THEN
    RAISE EXCEPTION 'Plot boundary intersects a restricted area' USING ERRCODE = '23514';
  END IF;
  IF EXISTS (SELECT 1 FROM screening_layers sl WHERE sl.estate_id = NEW.estate_id AND sl.provenance = 'company_declared' AND sl.active = true AND ST_Area(ST_Intersection(sl.boundary, NEW.boundary)::geography) > 0.01) THEN
    RAISE EXCEPTION 'Plot boundary intersects a company-declared concern area' USING ERRCODE = '23514';
  END IF;
  NEW.area_square_meters := ST_Area(NEW.boundary::geography);
  RETURN NEW;
END;
$$;
