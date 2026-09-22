import { describe, expect, it } from "vitest";
import { calculatePurchaseTotals, validatePurchasePayment } from "./purchase";

describe("purchase accounting", () => {
  it("calculates multiple payments without floating point arithmetic", () => {
    expect(calculatePurchaseTotals("50000.00", [
      { direction: "CREDIT", status: "CONFIRMED", amount: "500.00" },
      { direction: "CREDIT", status: "CONFIRMED", amount: "9950.15" },
      { direction: "CREDIT", status: "CONFIRMED", amount: "39549.85" },
    ])).toEqual({ price: "50000.00", netPaid: "50000.00", outstanding: "0.00", isPaid: true });
  });

  it("subtracts refunds and ignores reversed entries", () => {
    expect(calculatePurchaseTotals("1000.00", [
      { direction: "CREDIT", status: "CONFIRMED", amount: "700.00" },
      { direction: "DEBIT", status: "CONFIRMED", amount: "200.00" },
      { direction: "CREDIT", status: "REVERSED", amount: "400.00" },
    ]).outstanding).toBe("500.00");
  });

  it("rejects overpayment and accepts the exact final balance", () => {
    expect(validatePurchasePayment("250.00", "250.01")).toEqual({ valid: false, reason: "Payment exceeds the outstanding balance." });
    expect(validatePurchasePayment("250.00", "250.00")).toEqual({ valid: true });
  });
});
