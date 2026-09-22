import { describe, expect, it } from "vitest";
import { addMinutes, calculateRefundableAmount, canTransitionReservation } from "./reservation";

describe("reservation state model", () => {
  it("allows only documented live transitions", () => {
    expect(canTransitionReservation("CHECKOUT_LOCKED", "PURCHASE_IN_PROGRESS")).toBe(true);
    expect(canTransitionReservation("HOLD_PAYMENT_PENDING", "HELD")).toBe(true);
    expect(canTransitionReservation("HELD", "PURCHASE_IN_PROGRESS")).toBe(true);
    expect(canTransitionReservation("HELD", "SOLD")).toBe(false);
    expect(canTransitionReservation("SOLD", "RELEASED")).toBe(false);
  });

  it("calculates the snapshotted refund without floating point money drift", () => {
    expect(calculateRefundableAmount("500.00", "80.00", "25.00")).toBe("375.00");
    expect(calculateRefundableAmount("20.00", "10.00", "5.00")).toBe("0.00");
  });

  it("derives authoritative expiry from server time", () => {
    expect(addMinutes(new Date("2026-09-22T00:00:00.000Z"), 30).toISOString()).toBe("2026-09-22T00:30:00.000Z");
  });
});
