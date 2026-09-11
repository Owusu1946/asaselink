import { describe, expect, it } from "vitest";
import { documentTypeLabel, fileSizeLabel } from "./document-display";

describe("admin document display", () => {
  it("formats stored document types", () => expect(documentTypeLabel("tax_clearance")).toBe("tax clearance"));
  it("handles missing legacy fields safely", () => {
    expect(documentTypeLabel(undefined)).toBe("Document");
    expect(fileSizeLabel(null)).toBe("Size unavailable");
  });
});
