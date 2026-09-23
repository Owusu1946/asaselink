"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@asaselink/ui/components/button";
import { client } from "@/utils/orpc";
import { notify } from "@/utils/notify";
import { BankTransferProof } from "./bank-transfer-proof";

const METHODS = [
  {
    id: "BANK_TRANSFER",
    name: "Bank transfer",
    hint: "Transfer to the displayed account and upload private proof",
  },
  { id: "MTN_MOMO", name: "MTN MoMo", hint: "Approve the mock prompt on your phone" },
  { id: "TELECEL_CASH", name: "Telecel Cash", hint: "Use your Telecel mobile wallet" },
  { id: "AIRTELTIGO_MONEY", name: "AirtelTigo Money", hint: "Use your AT Money wallet" },
] as const;

type Method = (typeof METHODS)[number]["id"];

export function PaymentCheckout({ checkout }: { checkout: Record<string, unknown> }) {
  const [method, setMethod] = useState<Method>(
    (checkout.method as Method | undefined) ?? "BANK_TRANSFER",
  );
  const [phone, setPhone] = useState("");
  const [paymentReference, setPaymentReference] = useState<string | null>(
    checkout.paymentReference ? String(checkout.paymentReference) : null,
  );
  const [status, setStatus] = useState(String(checkout.paymentStatus ?? ""));
  const [pending, startTransition] = useTransition();
  const reservationReference = String(checkout.reservationReference);
  const awaitingReview = ["SUBMITTED", "UNDER_VERIFICATION", "PENDING_CONFIRMATION"].includes(
    status,
  );
  const paid = status === "SUCCEEDED";
  const isHold = checkout.reservationType === "PAID_HOLD";
  const authoritativeMs =
    new Date(String(checkout.expiresAt)).getTime() - new Date(String(checkout.serverNow)).getTime();
  const [remainingMs, setRemainingMs] = useState(() => Math.max(authoritativeMs, 0));
  useEffect(() => {
    const startedAt = Date.now();
    const timer = window.setInterval(
      () => setRemainingMs(Math.max(authoritativeMs - (Date.now() - startedAt), 0)),
      1_000,
    );
    return () => window.clearInterval(timer);
  }, [authoritativeMs]);
  const remainingMinutes = Math.floor(remainingMs / 60_000);
  const remainingSeconds = Math.floor((remainingMs % 60_000) / 1_000);

  function submit() {
    startTransition(async () => {
      try {
        let reference = paymentReference;
        if (!reference) {
          const payment = await client.payments.initiate({
            reservationReference,
            method,
            phone: method === "BANK_TRANSFER" ? undefined : phone,
          });
          reference = String(payment.reference);
          setPaymentReference(reference);
        }
        if (method === "BANK_TRANSFER") return;
        const submitted = await client.payments.submitMockPayment({ paymentReference: reference });
        setStatus(String(submitted.status));
        notify.success("Payment submitted", {
          description: "AsaseLink operations will verify this mock payment.",
        });
      } catch (error) {
        notify.apiError(error, "Payment could not be submitted");
      }
    });
  }

  const methodName = METHODS.find((item) => item.id === method)?.name;

  return (
    <main className="min-h-svh bg-background px-3 py-5 sm:px-6 sm:py-10">
      <div className="mx-auto grid w-full max-w-5xl items-start gap-7 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-10">
        <section className="rounded-[1.75rem] border border-border bg-card p-5 sm:p-8 lg:p-10">
          <Link
            href="/account/reservations"
            className="inline-flex min-h-10 items-center text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            ← Reservations
          </Link>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            {isHold ? "Hold" : "Pay for"} plot {String(checkout.plotNumber)}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
            {isHold
              ? "Pay the snapshotted hold fee. After operations approval, this plot stays held for seven days."
              : "Choose a payment method. We will hold your submission for operations verification before ownership changes."}
          </p>
          <p className="mt-2 text-sm font-semibold tabular-nums" aria-live="polite">
            {remainingMs > 0
              ? `${remainingMinutes}:${String(remainingSeconds).padStart(2, "0")} remaining`
              : "Payment window expired"}
          </p>
          {awaitingReview || paid ? (
            <div className="mt-8 rounded-2xl border border-brand-green-200 bg-brand-green-50 p-5 text-brand-green-950 sm:p-6">
              <p className="font-semibold">
                {paid ? "Payment verified" : "Payment awaiting verification"}
              </p>
              <p className="mt-1 text-sm leading-6">
                {paid
                  ? isHold
                    ? "Your paid hold is active. This is not a completed purchase."
                    : "Your plot purchase is confirmed."
                  : "No further payment action is needed. Track it from your account."}
              </p>
              <Link
                href="/account/payments"
                className="mt-4 inline-flex min-h-10 items-center text-sm font-semibold underline underline-offset-4"
              >
                View payment activity
              </Link>
            </div>
          ) : (
            <>
              <fieldset className="mt-8">
                <legend className="text-sm font-semibold">Payment method</legend>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {METHODS.map((item) => (
                    <button
                      type="button"
                      aria-pressed={method === item.id}
                      key={item.id}
                      onClick={() => {
                        setMethod(item.id);
                        setPaymentReference(null);
                      }}
                      className={`group min-h-24 rounded-2xl border p-4 text-left outline-none transition-[border-color,background-color] focus-visible:ring-2 focus-visible:ring-ring ${method === item.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-foreground/25 hover:bg-muted/40"}`}
                    >
                      <span className="flex items-center gap-2 font-semibold">
                        <span
                          className={`size-2 rounded-full ${method === item.id ? "bg-primary" : "bg-muted-foreground/35"}`}
                        />
                        {item.name}
                      </span>
                      <span className="mt-2 block text-xs leading-5 text-muted-foreground">
                        {item.hint}
                      </span>
                    </button>
                  ))}
                </div>
              </fieldset>
              {method !== "BANK_TRANSFER" ? (
                <div className="mt-6">
                  <label className="text-sm font-semibold" htmlFor="payment-detail">
                    Mobile money number
                  </label>
                  <input
                    id="payment-detail"
                    inputMode="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="e.g. 024 000 0000"
                    className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-4 text-base outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              ) : null}
              {method === "BANK_TRANSFER" && paymentReference ? (
                <BankTransferProof
                  paymentReference={paymentReference}
                  onSubmitted={() => setStatus("SUBMITTED")}
                />
              ) : (
                <Button
                  onClick={submit}
                  disabled={
                    pending || (method !== "BANK_TRANSFER" && phone.replace(/\D/g, "").length < 9)
                  }
                  className="mt-6 h-12 w-full rounded-xl text-sm font-semibold"
                >
                  {pending
                    ? "Preparing securely…"
                    : method === "BANK_TRANSFER"
                      ? "Show transfer account"
                      : "Complete mock payment"}
                </Button>
              )}
              <p className="mt-3 text-center text-xs leading-5 text-muted-foreground">
                Mock payment only — no money will leave your account.
              </p>
            </>
          )}
        </section>

        <aside className="payment-receipt relative isolate h-fit overflow-hidden bg-brand-green-950 text-white shadow-[0_20px_55px_rgba(1,45,34,0.18)] lg:sticky lg:top-8">
          <div className="relative z-10 px-7 pb-8 pt-7 sm:px-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-white/55">Payment receipt</p>
                <p className="mt-1 font-mono text-[11px] text-white/40">{reservationReference}</p>
              </div>
              <span className="rounded-full border border-white/15 bg-white/8 px-2.5 py-1 text-[10px] font-semibold">
                MOCK
              </span>
            </div>
            <div className="mt-7">
              <h2 className="text-2xl font-semibold tracking-tight">
                {String(checkout.estateName)}
              </h2>
              <p className="mt-1 text-sm text-white/60">Sold by {String(checkout.companyName)}</p>
            </div>
            <div className="my-7 border-t border-dashed border-white/25" />
            <dl className="space-y-4 text-sm">
              <div className="flex justify-between gap-5">
                <dt className="text-white/55">Plot</dt>
                <dd className="font-semibold">{String(checkout.plotNumber)}</dd>
              </div>
              <div className="flex justify-between gap-5">
                <dt className="text-white/55">Method</dt>
                <dd className="text-right font-semibold">{methodName}</dd>
              </div>
              <div className="flex justify-between gap-5">
                <dt className="text-white/55">Currency</dt>
                <dd className="font-semibold">GHS</dd>
              </div>
            </dl>
            <div className="my-7 border-t border-dashed border-white/25" />
            <div className="flex items-end justify-between gap-5">
              <span className="text-sm text-white/60">{isHold ? "Hold fee" : "Amount due"}</span>
              <strong className="text-2xl tracking-tight">
                GHS {Number(checkout.amount).toLocaleString()}
              </strong>
            </div>
            <div className="mt-8 flex h-7 items-stretch gap-1 opacity-25" aria-hidden="true">
              {[2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 1, 4, 2, 1, 3].map((width, index) => (
                <span key={index} className="bg-white" style={{ width }} />
              ))}
            </div>
            <p className="mt-5 text-xs leading-5 text-white/50">
              {isHold
                ? `Refundable on hold expiry: GHS ${Number(checkout.refundableAmount).toLocaleString()}.`
                : "The amount is fixed from your reservation record and cannot be changed in this browser."}
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
