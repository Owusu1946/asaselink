export type ViabilitySeverity = "caution" | "potential_restriction";
export type ViabilityResult = "CLEAR" | "CAUTION" | "POTENTIAL_RESTRICTION";

export function aggregateViabilityResult(
  intersections: Array<{ severity: ViabilitySeverity }>,
  coverageComplete: boolean,
): ViabilityResult {
  if (intersections.some((item) => item.severity === "potential_restriction")) return "POTENTIAL_RESTRICTION";
  if (intersections.length > 0 || !coverageComplete) return "CAUTION";
  return "CLEAR";
}

