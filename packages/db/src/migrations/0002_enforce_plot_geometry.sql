CREATE OR REPLACE FUNCTION enforce_plot_geometry()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  estate_boundary geometry(MultiPolygon, 4326);
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.estate_id::text, 0));

  SELECT boundary INTO estate_boundary FROM estates WHERE id = NEW.estate_id;
  IF estate_boundary IS NULL THEN
    RAISE EXCEPTION 'Estate does not exist' USING ERRCODE = '23503';
  END IF;
  IF NOT ST_IsValid(NEW.boundary) OR ST_IsEmpty(NEW.boundary) THEN
    RAISE EXCEPTION 'Plot boundary is invalid' USING ERRCODE = '23514';
  END IF;
  IF NOT ST_CoveredBy(NEW.boundary, estate_boundary) THEN
    RAISE EXCEPTION 'Plot boundary must be contained by its estate' USING ERRCODE = '23514';
  END IF;
  IF EXISTS (
    SELECT 1 FROM plots p
    WHERE p.estate_id = NEW.estate_id
      AND p.id <> NEW.id
      AND ST_Area(ST_Intersection(p.boundary, NEW.boundary)::geography) > 0.01
  ) THEN
    RAISE EXCEPTION 'Plot boundary overlaps an existing plot' USING ERRCODE = '23P01';
  END IF;
  IF EXISTS (
    SELECT 1 FROM restricted_areas r
    WHERE r.estate_id = NEW.estate_id
      AND ST_Area(ST_Intersection(r.boundary, NEW.boundary)::geography) > 0.01
  ) THEN
    RAISE EXCEPTION 'Plot boundary intersects a restricted area' USING ERRCODE = '23514';
  END IF;

  NEW.area_square_meters := ST_Area(NEW.boundary::geography);
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER plots_enforce_geometry
BEFORE INSERT OR UPDATE OF boundary, estate_id ON plots
FOR EACH ROW EXECUTE FUNCTION enforce_plot_geometry();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION enforce_restricted_area_geometry()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  estate_boundary geometry(MultiPolygon, 4326);
BEGIN
  SELECT boundary INTO estate_boundary FROM estates WHERE id = NEW.estate_id;
  IF estate_boundary IS NULL OR NOT ST_CoveredBy(NEW.boundary, estate_boundary) THEN
    RAISE EXCEPTION 'Restricted area must be contained by its estate' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER restricted_areas_enforce_geometry
BEFORE INSERT OR UPDATE OF boundary, estate_id ON restricted_areas
FOR EACH ROW EXECUTE FUNCTION enforce_restricted_area_geometry();
