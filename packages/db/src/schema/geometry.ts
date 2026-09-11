import { customType } from "drizzle-orm/pg-core";

export type GeoJsonGeometry = {
  type: "Polygon" | "MultiPolygon";
  coordinates: number[][][] | number[][][][];
};

export const geometry = customType<{
  data: string;
  driverData: string;
  config: { type: "Polygon" | "MultiPolygon" | "Geometry"; srid: number };
}>({
  dataType(config) {
    return `geometry(${config?.type ?? "Geometry"},${config?.srid ?? 4326})`;
  },
});
