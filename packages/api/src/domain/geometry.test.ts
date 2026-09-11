import { describe, expect, it } from "vitest";
import { asMultiPolygon, estateGeometrySchema, polygonSchema } from "./geometry";

const validPolygon = {
  type: "Polygon" as const,
  coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]],
};

describe("land geometry input", () => {
  it("accepts a closed polygon and normalizes an estate boundary", () => {
    const polygon = polygonSchema.parse(validPolygon);
    expect(asMultiPolygon(polygon)).toEqual({ type: "MultiPolygon", coordinates: [polygon.coordinates] });
  });

  it("rejects an open ring", () => {
    expect(() => polygonSchema.parse({ ...validPolygon, coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1]]] })).toThrow("closed");
  });

  it("rejects coordinates outside WGS84 bounds", () => {
    expect(() => estateGeometrySchema.parse({ ...validPolygon, coordinates: [[[181, 0], [1, 0], [1, 1], [181, 0]]] })).toThrow();
  });

  it("rejects underspecified rings", () => {
    expect(() => polygonSchema.parse({ ...validPolygon, coordinates: [[[0, 0], [1, 1], [0, 0]]] })).toThrow();
  });
});
