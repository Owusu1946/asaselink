import type { Feature, FeatureCollection } from "geojson";

export type Position = [number, number];

export const EMPTY_COLLECTION: FeatureCollection = { type: "FeatureCollection", features: [] };

export function boundaryData(points: Position[]): FeatureCollection {
  if (points.length === 0) return EMPTY_COLLECTION;
  const pointFeatures: Feature[] = points.map((coordinates, index) => ({
    type: "Feature",
    properties: { index },
    geometry: { type: "Point", coordinates },
  }));
  const lineCoordinates = points.length > 2 ? [...points, points[0]!] : points;
  const shape: Feature = {
    type: "Feature",
    properties: {},
    geometry: points.length > 2
      ? { type: "Polygon", coordinates: [lineCoordinates] }
      : { type: "LineString", coordinates: lineCoordinates },
  };
  return { type: "FeatureCollection", features: [shape, ...pointFeatures] };
}
