"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@asaselink/ui/components/button";
import { client } from "@/utils/orpc";
import { notify } from "@/utils/notify";
import { BankTransferProof } from "./bank-transfer-proof";

const methods = [
  ["BANK_TRANSFER", "Bank transfer"],
  ["MTN_MOMO", "MTN MoMo"],
  ["TELECEL_CASH", "Telecel Cash"],
  ["AIRTELTIGO_MONEY", "AirtelTigo Money"],
] as const;
const stages = [
  ["DEPOSIT", "Deposit"],
  ["INSTALLMENT", "Installment"],
  ["BALANCE", "Balance"],
  ["FINAL_PAYMENT", "Final payment"],
] as const;

export function PurchaseDetail({
  data,
}: {
  data: {
    account: Record<string, unknown>;
    entries: Record<string, unknown>[];
    payments: Record<string, unknown>[];
  };
}) {
  const account = data.account;
  const router = useRouter();
  const [method, setMethod] = useState<(typeof methods)[number][0]>("BANK_TRANSFER");
  const [stage, setStage] = useState<(typeof stages)[number][0]>("INSTALLMENT");
  const [amount, setAmount] = useState(String(account.outstanding));
  const [phone, setPhone] = useState("");
  const [bankPaymentReference, setBankPaymentReference] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const outstanding = Number(account.outstanding);
  const refunded = data.entries
    .filter((entry) => entry.status === "CONFIRMED" && entry.direction === "DEBIT")
    .reduce((sum, entry) => sum + Number(entry.amount), 0);
  function submit() {
    startTransition(async () => {
      try {
        const payment = await client.purchases.initiatePayment({
          purchaseReference: String(account.reference),
          stage,
          amount: Number(amount),
          method,
          phone: method === "BANK_TRANSFER" ? undefined : phone.replace(/\s/g, ""),
        });
        if (method === "BANK_TRANSFER") {
          setBankPaymentReference(String(payment.reference));
          return;
        }
        await client.payments.submitMockPayment({ paymentReference: String(payment.reference) });
        notify.success("Payment submitted", {
          description: "Operations will verify it before your balance changes.",
        });
        router.refresh();
      } catch (error) {
        notify.apiError(error, "Payment could not be submitted");
      }
    });
  }
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-5">
        <section className="rounded-2xl border border-border bg-card p-5 sm:p-7">
          <div className="flex flex-wrap justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">{String(account.estateName)}</p>
              <h2 className="mt-1 text-2xl font-bold">Plot {String(account.plotNumber)}</h2>
              <p className="mt-2 font-mono text-xs text-muted-foreground">
                {String(account.reference)}
              </p>
            </div>
            <span className="h-fit rounded-full bg-muted px-3 py-1 text-xs font-semibold">
              {String(account.status).replaceAll("_", " ")}
            </span>
          </div>
          <dl className="mt-6 grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
            <Summary label="Purchase price" value={account.priceSnapshot} />
            <Summary label="Hold credit" value={account.holdCredit} />
            <Summary label="Net paid" value={account.netPaid} />
            <Summary label="Refunded/reversed" value={refunded} />
          </dl>
        </section>
        <section className="rounded-2xl border border-border bg-card p-5 sm:p-7">
          <h3 className="font-semibold">Accounting history</h3>
          <div className="mt-4 divide-y divide-border">
            {data.entries.map((entry) => (
              <div
                key={String(entry.reference)}
                className="flex flex-wrap justify-between gap-3 py-4 text-sm"
              >
                <div>
                  <p className="font-semibold">{String(entry.type).replaceAll("_", " ")}</p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {String(entry.reference)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    {entry.direction === "DEBIT" ? "−" : "+"} GHS{" "}
                    {Number(entry.amount).toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{String(entry.status)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
      <aside className="h-fit rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-20">
        <p className="text-sm text-muted-foreground">Outstanding balance</p>
        <p className="mt-2 text-3xl font-bold">GHS {outstanding.toLocaleString()}</p>
        {outstanding > 0 && account.status === "PURCHASE_IN_PROGRESS" ? (
          <>
            <label className="mt-6 block text-xs font-semibold">
              Payment stage
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as typeof stage)}
                className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              >
                {stages.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-4 block text-xs font-semibold">
              Method
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as typeof method)}
                className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              >
                {methods.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            {method === "BANK_TRANSFER" ? (
              account.bankAccountNumber ? (
                <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4 text-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Pay to
                  </p>
                  <p className="mt-2 font-semibold">{String(account.bankName)}</p>
                  <dl className="mt-3 grid gap-2">
                    <div>
                      <dt className="text-xs text-muted-foreground">Account name</dt>
                      <dd className="font-medium">{String(account.bankAccountName)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Account number</dt>
                      <dd className="font-mono text-base font-bold">
                        {String(account.bankAccountNumber)}
                      </dd>
                    </div>
                    {account.bankBranch ? (
                      <div>
                        <dt className="text-xs text-muted-foreground">Branch</dt>
                        <dd>{String(account.bankBranch)}</dd>
                      </div>
                    ) : null}
                  </dl>
                  {account.bankInstructions ? (
                    <p className="mt-3 border-t border-border pt-3 text-xs leading-5 text-muted-foreground">
                      {String(account.bankInstructions)}
                    </p>
                  ) : null}
                </div>
              ) : (
                <p role="alert" className="mt-4 text-sm text-destructive">
                  No receiving bank account is currently configured.
                </p>
              )
            ) : null}
            <label className="mt-4 block text-xs font-semibold">
              Amount
              <input
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              />
            </label>
            {bankPaymentReference ? (
              <BankTransferProof
                paymentReference={bankPaymentReference}
                onSubmitted={() => router.refresh()}
              />
            ) : (
              <>
                {method !== "BANK_TRANSFER" ? (
                  <label className="mt-4 block text-xs font-semibold">
                    Mobile number
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                    />
                  </label>
                ) : null}
                <Button
                  className="mt-5 w-full"
                  disabled={
                    pending ||
                    Number(amount) <= 0 ||
                    Number(amount) > outstanding ||
                    (method === "BANK_TRANSFER" && !account.bankAccountNumber) ||
                    (method !== "BANK_TRANSFER" && phone.replace(/\D/g, "").length < 9)
                  }
                  onClick={submit}
                >
                  {pending ? "Submitting…" : "Submit mock payment"}
                </Button>
              </>
            )}
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              No money moves in this MVP. An administrator must verify every submission.
            </p>
          </>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            No further buyer payment is currently required.
          </p>
        )}
      </aside>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: unknown }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-semibold">GHS {Number(value).toLocaleString()}</dd>
    </div>
  );
}
