import { describe, expect, it } from "vitest";

import { safeRedirectPath } from "./safe-redirect";

describe("safeRedirectPath", () => {
  it.each([
    ["/account?tab=reservations", "/account?tab=reservations"],
    ["/company/apply/details", "/company/apply/details"],
    ["/onboarding/profile", "/onboarding/profile"],
  ])("accepts an authorized same-origin destination", (value, expected) => {
    expect(safeRedirectPath(value)).toBe(expected);
  });

  it.each([
    "https://attacker.example/account",
    "//attacker.example/account",
    "/\\attacker.example/account",
    "/admin",
    "/company/unowned/overview",
    "/sign-in",
  ])("rejects unsafe or authorization-sensitive destination %s", (value) => {
    expect(safeRedirectPath(value)).toBe("/auth/continue");
  });
});
