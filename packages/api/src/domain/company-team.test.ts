import { describe, expect, it } from "vitest";
import { assertMutableMember, clerkRoleFor, hasCompanyPermission } from "./company-team";

describe("company team authorization", () => {
  it("keeps granular operational roles local while mapping Clerk system access", () => {
    expect(clerkRoleFor("admin")).toBe("org:admin");
    expect(clerkRoleFor("surveyor")).toBe("org:member");
  });

  it("grants surveyors plot work but not estate or team administration", () => {
    expect(hasCompanyPermission("surveyor", "plot:write")).toBe(true);
    expect(hasCompanyPermission("surveyor", "estate:write")).toBe(false);
    expect(hasCompanyPermission("surveyor", "team:manage")).toBe(false);
  });

  it("protects the owner and self-access from mutation", () => {
    expect(() => assertMutableMember("admin", "owner", "a", "b")).toThrow("owner");
    expect(() => assertMutableMember("admin", "viewer", "a", "a")).toThrow("own");
  });
});
