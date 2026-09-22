import { describe, expect, it } from "vitest";
import { validatePaymentProofFile } from "./payment-proof";

describe("payment proof validation", () => {
  it("accepts supported private proof documents", () =>
    expect(validatePaymentProofFile({ mimeType: "application/pdf", fileSize: 512_000 })).toEqual({
      valid: true,
    }));
  it("rejects unsupported executable files", () =>
    expect(
      validatePaymentProofFile({ mimeType: "application/x-msdownload", fileSize: 100 }),
    ).toMatchObject({ valid: false }));
  it("rejects oversized files", () =>
    expect(
      validatePaymentProofFile({ mimeType: "image/png", fileSize: 10 * 1024 * 1024 + 1 }),
    ).toMatchObject({ valid: false }));
});
