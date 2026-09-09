---
name: asaselink-gis
description: Build and review AsaseLink land geometry, PostGIS validation, viewport queries, and Mapbox plot interactions.
---

# AsaseLink GIS

Use this skill for estates, plots, restricted areas, map rendering, map editing, or geographic API work.

- PostgreSQL/PostGIS is authoritative; Mapbox is visualization only.
- Store estate Polygon/MultiPolygon, plot Polygon, and restricted-area Polygon/MultiPolygon geometry with an explicit SRID and GiST indexes.
- Validate server-side with `ST_IsValid`, `ST_Intersects`, `ST_Contains`/`ST_Within`, `ST_Overlaps`, `ST_Area`, and `ST_Intersection` as applicable. Reject malformed coordinates, invalid polygons, plot overlap, plots outside estates, and restricted-area intersections.
- Keep geometry validation in domain/service code and database constraints where practical; never trust client drawing output.
- Expose bounded viewport/bounds queries and return only fields needed by the map. Design response shapes so GeoJSON can later become vector tiles without changing domain semantics.
- Load Mapbox dynamically in client components. Use sources/layers rather than thousands of DOM markers. Make statuses readable without color alone.
- Version critical geometry changes with actor, timestamp, reason, approval state, and before/after geometry.
