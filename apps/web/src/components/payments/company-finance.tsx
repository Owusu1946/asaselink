"use client";

import { useState, useTransition } from "react";
import { Button } from "@asaselink/ui/components/button";
import { client } from "@/utils/orpc";
import { notify } from "@/utils/notify";

type Summary = {
  balance: Record<string, unknown>;
  payments: Record<string, unknown>[];
  payouts: Record<string, unknown>[];
};

export function CompanyFinance({
  companyId,
  initialSummary,
}: {
  companyId: string;
  initialSummary: Summary;
}) {
  const [summary, setSummary] = useState(initialSummary);
  const [amount, setAmount] = useState("");
  const [destinationType, setDestinationType] = useState<"MOBILE_MONEY" | "BANK_ACCOUNT">(
    "MOBILE_MONEY",
  );
  const [network, setNetwork] = useState<"MTN_MOMO" | "TELECEL_CASH" | "AIRTELTIGO_MONEY">(
    "MTN_MOMO",
  );
  const [phone, setPhone] = useState("");
  const [accountName, setAccountName] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [pending, startTransition] = useTransition();
  const [reviewNote, setReviewNote] = useState("Bank transfer proof reviewed by company finance");
  const available = Number(summary.balance?.available ?? 0);

  function requestPayout() {
    startTransition(async () => {
      try {
        const destination =
          destinationType === "MOBILE_MONEY"
            ? ({ type: destinationType, network, phone, accountName } as const)
            : ({ type: destinationType, bankName, accountNumber, accountName } as const);
        await client.payments.requestPayout({ companyId, amount: Number(amount), destination });
        setSummary((await client.payments.companySummary({ companyId })) as Summary);
        setAmount("");
        setPhone("");
        setAccountNumber("");
        notify.success("Payout requested", {
          description: "AsaseLink operations will review the mock payout.",
        });
      } catch (error) {
        notify.apiError(error, "Payout request failed");
      }
    });
  }

  function inspectProof(payment: Record<string, unknown>) {
    startTransition(async () => {
      try {
        if (payment.status === "SUBMITTED")
          await client.payments.beginBankReview({ paymentReference: String(payment.reference) });
        const proof = await client.payments.getProofViewUrl({
          paymentReference: String(payment.reference),
        });
        window.open(proof.url, "_blank", "noopener,noreferrer");
        setSummary((await client.payments.companySummary({ companyId })) as Summary);
      } catch (error) {
        notify.apiError(error, "Proof could not be opened");
      }
    });
  }

  function reviewPayment(payment: Record<string, unknown>, decision: "APPROVE" | "REJECT") {
    startTransition(async () => {
      try {
        await client.payments.reviewPayment({
          paymentReference: String(payment.reference),
          decision,
          reason: reviewNote,
        });
        setSummary((await client.payments.companySummary({ companyId })) as Summary);
        notify.success(decision === "APPROVE" ? "Payment verified" : "Payment rejected");
      } catch (error) {
        notify.apiError(error, "Payment review failed");
      }
    });
  }

  return (
    <div className="space-y-7">
      <label className="block max-w-xl text-xs font-semibold">
        Finance review note
        <input
          value={reviewNote}
          onChange={(event) => setReviewNote(event.target.value)}
          className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-normal"
        />
      </label>
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-brand-green-950 p-6 text-white">
          <p className="text-sm text-white/65">Available for payout</p>
          <p className="mt-2 text-3xl font-bold">GHS {available.toLocaleString()}</p>
          <p className="mt-3 text-xs leading-5 text-white/60">
            Only administrator-verified sales are included.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Awaiting verification</p>
          <p className="mt-2 text-3xl font-bold">
            GHS {Number(summary.balance?.pending ?? 0).toLocaleString()}
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Pending collections cannot be withdrawn.
          </p>
        </div>
      </section>
      <section className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Sales activity</h2>
          {summary.payments.length ? (
            summary.payments.map((payment) => (
              <article
                key={String(payment.reference)}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {String(payment.estateName)} · {String(payment.plotNumber)}
                    </p>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      {String(payment.reference)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      GHS {Number(payment.developerNetAmount).toLocaleString()}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {String(payment.status).replaceAll("_", " ")}
                    </p>
                    {payment.proofStatus ? (
                      <div className="mt-3 flex flex-wrap justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => inspectProof(payment)}>
                          Secure proof
                        </Button>
                        {["SUBMITTED", "UNDER_VERIFICATION"].includes(String(payment.status)) ? (
                          <>
                            <Button
                              size="sm"
                              disabled={pending || reviewNote.length < 5}
                              onClick={() => reviewPayment(payment, "APPROVE")}
                            >
                              Verify
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={pending || reviewNote.length < 5}
                              onClick={() => reviewPayment(payment, "REJECT")}
                            >
                              Reject
                            </Button>
                          </>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No buyer payments yet.
            </div>
          )}
        </div>
        <aside className="h-fit rounded-2xl border border-border bg-card p-5">
          <h2 className="font-semibold">Request payout</h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Owner and admin roles only. This MVP records a mock transfer.
          </p>
          <label className="mt-5 block text-xs font-semibold">
            Amount (GHS)
            <input
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
            />
          </label>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDestinationType("MOBILE_MONEY")}
              className={`h-10 rounded-xl border text-xs font-semibold ${destinationType === "MOBILE_MONEY" ? "border-primary bg-primary/5" : "border-border"}`}
            >
              Mobile money
            </button>
            <button
              type="button"
              onClick={() => setDestinationType("BANK_ACCOUNT")}
              className={`h-10 rounded-xl border text-xs font-semibold ${destinationType === "BANK_ACCOUNT" ? "border-primary bg-primary/5" : "border-border"}`}
            >
              Bank account
            </button>
          </div>
          {destinationType === "MOBILE_MONEY" ? (
            <>
              <select
                value={network}
                onChange={(event) => setNetwork(event.target.value as typeof network)}
                className="mt-4 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              >
                <option value="MTN_MOMO">MTN MoMo</option>
                <option value="TELECEL_CASH">Telecel Cash</option>
                <option value="AIRTELTIGO_MONEY">AirtelTigo Money</option>
              </select>
              <input
                placeholder="Wallet phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="mt-3 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              />
            </>
          ) : (
            <>
              <input
                placeholder="Bank name"
                value={bankName}
                onChange={(event) => setBankName(event.target.value)}
                className="mt-4 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              />
              <input
                placeholder="Account number"
                value={accountNumber}
                onChange={(event) => setAccountNumber(event.target.value)}
                className="mt-3 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              />
            </>
          )}
          <input
            placeholder="Account name"
            value={accountName}
            onChange={(event) => setAccountName(event.target.value)}
            className="mt-3 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
          />
          <Button
            onClick={requestPayout}
            disabled={
              pending ||
              Number(amount) <= 0 ||
              Number(amount) > available ||
              accountName.length < 2 ||
              (destinationType === "MOBILE_MONEY"
                ? phone.replace(/\D/g, "").length < 9
                : bankName.length < 2 || accountNumber.length < 6)
            }
            className="mt-4 h-11 w-full rounded-xl"
          >
            {pending ? "Requesting…" : "Request payout"}
          </Button>
        </aside>
      </section>
      {summary.payouts.length ? (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Payout history</h2>
          <div className="grid gap-3">
            {summary.payouts.map((payout) => (
              <div
                key={String(payout.reference)}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border p-4 text-sm"
              >
                <span className="font-mono">{String(payout.reference)}</span>
                <span>GHS {Number(payout.amount).toLocaleString()}</span>
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">
                  {String(payout.status)}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
