export type PurchaseLedgerLine = {
  direction: "CREDIT" | "DEBIT";
  status: "CONFIRMED" | "REVERSED";
  amount: string;
};

function toCents(value: string) {
  const [whole = "0", fraction = ""] = value.trim().split(".");
  return BigInt(whole) * 100n + BigInt(`${fraction}00`.slice(0, 2));
}

export function fromCents(value: bigint) {
  const sign = value < 0n ? "-" : "";
  const absolute = value < 0n ? -value : value;
  return `${sign}${absolute / 100n}.${String(absolute % 100n).padStart(2, "0")}`;
}

export function calculatePurchaseTotals(price: string, entries: PurchaseLedgerLine[]) {
  const priceCents = toCents(price);
  const paidCents = entries.reduce((total, entry) => {
    if (entry.status !== "CONFIRMED") return total;
    const amount = toCents(entry.amount);
    return total + (entry.direction === "CREDIT" ? amount : -amount);
  }, 0n);
  return {
    price: fromCents(priceCents),
    netPaid: fromCents(paidCents),
    outstanding: fromCents(priceCents > paidCents ? priceCents - paidCents : 0n),
    isPaid: paidCents >= priceCents,
  };
}

export function validatePurchasePayment(outstanding: string, amount: string) {
  const outstandingCents = toCents(outstanding);
  const amountCents = toCents(amount);
  if (amountCents <= 0n) return { valid: false, reason: "Payment must be greater than zero." };
  if (amountCents > outstandingCents)
    return { valid: false, reason: "Payment exceeds the outstanding balance." };
  return { valid: true as const };
}
