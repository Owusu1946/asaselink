import { describe, expect, it } from "vitest";
import { aggregateViabilityResult } from "./viability";

describe("aggregateViabilityResult", () => {
  it("returns CLEAR only when coverage is complete and nothing intersects", () => {
    expect(aggregateViabilityResult([], true)).toBe("CLEAR");
  });

  it("uses CAUTION for missing coverage or caution intersections", () => {
    expect(aggregateViabilityResult([], false)).toBe("CAUTION");
    expect(aggregateViabilityResult([{ severity: "caution" }], true)).toBe("CAUTION");
  });

  it("prioritizes potential restrictions", () => {
    expect(aggregateViabilityResult([{ severity: "caution" }, { severity: "potential_restriction" }], false)).toBe("POTENTIAL_RESTRICTION");
  });
});
