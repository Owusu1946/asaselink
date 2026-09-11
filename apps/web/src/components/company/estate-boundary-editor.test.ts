import { describe, expect, it } from "vitest";
import { boundaryData } from "./estate-boundary";

describe("estate boundary drawing", () => {
  it("closes a valid draft polygon", () => {
    const data = boundaryData([[-0.2, 5.6], [-0.1, 5.6], [-0.1, 5.7]]);
    const geometry = data.features[0]?.geometry;

    expect(geometry?.type).toBe("Polygon");
    if (geometry?.type === "Polygon") {
      expect(geometry.coordinates[0]?.[0]).toEqual(geometry.coordinates[0]?.at(-1));
    }
  });

  it("keeps incomplete boundaries as lines", () => {
    const geometry = boundaryData([[-0.2, 5.6], [-0.1, 5.6]]).features[0]?.geometry;
    expect(geometry?.type).toBe("LineString");
  });
});
