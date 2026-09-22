export const reservationTypes = ["CHECKOUT_LOCK", "PAID_HOLD"] as const;
export type ReservationType = (typeof reservationTypes)[number];

export const reservationStatuses = [
  "CHECKOUT_LOCKED",
  "HOLD_PAYMENT_PENDING",
  "HELD",
  "PURCHASE_IN_PROGRESS",
  "SOLD",
  "EXPIRED",
  "RELEASED",
  "CANCELLED",
] as const;
export type ReservationStatus = (typeof reservationStatuses)[number];

const transitions: Record<ReservationStatus, readonly ReservationStatus[]> = {
  CHECKOUT_LOCKED: ["PURCHASE_IN_PROGRESS", "CANCELLED", "EXPIRED", "RELEASED"],
  HOLD_PAYMENT_PENDING: ["HELD", "CANCELLED", "EXPIRED", "RELEASED"],
  HELD: ["PURCHASE_IN_PROGRESS", "CANCELLED", "EXPIRED", "RELEASED"],
  PURCHASE_IN_PROGRESS: ["SOLD", "CANCELLED", "RELEASED"],
  SOLD: [],
  EXPIRED: [],
  RELEASED: [],
  CANCELLED: [],
};

export function canTransitionReservation(from: ReservationStatus, to: ReservationStatus) {
  return transitions[from].includes(to);
}

export function calculateRefundableAmount(
  holdFee: string,
  refundPercentage: string,
  deduction: string,
) {
  const feeCents = Math.round(Number(holdFee) * 100);
  const percentageBasisPoints = Math.round(Number(refundPercentage) * 100);
  const deductionCents = Math.round(Number(deduction) * 100);
  const refundableCents = Math.max(
    Math.floor((feeCents * percentageBasisPoints) / 10_000) - deductionCents,
    0,
  );
  return (refundableCents / 100).toFixed(2);
}

export function addMinutes(at: Date, minutes: number) {
  return new Date(at.getTime() + minutes * 60_000);
}
