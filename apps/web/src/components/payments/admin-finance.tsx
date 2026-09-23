"use client";

import { useState, useTransition } from "react";
import { Button } from "@asaselink/ui/components/button";
import { client } from "@/utils/orpc";
import { notify } from "@/utils/notify";

type Queue = { payments: Record<string, unknown>[]; payouts: Record<string, unknown>[] };

export function AdminFinance({ initialQueue }: { initialQueue: Queue }) {
  const [queue, setQueue] = useState(initialQueue);
  const [reason, setReason] = useState("Mock transaction verified by operations");
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null);
  const [events, setEvents] = useState<Record<string, unknown>[]>([]);
  const refresh = async () => setQueue((await client.payments.adminQueue()) as Queue);
  const reviewPayment = (paymentReference: string, decision: "APPROVE" | "REJECT") =>
    startTransition(async () => {
      try {
        await client.payments.reviewPayment({ paymentReference, decision, reason });
        await refresh();
        notify.success(decision === "APPROVE" ? "Purchase confirmed" : "Payment rejected");
      } catch (error) {
        notify.apiError(error, "Payment review failed");
      }
    });
  const reviewPayout = (payoutReference: string, decision: "MARK_PAID" | "REJECT") =>
    startTransition(async () => {
      try {
        await client.payments.reviewPayout({ payoutReference, decision, reason });
        await refresh();
        notify.success(decision === "MARK_PAID" ? "Payout marked paid" : "Payout rejected");
      } catch (error) {
        notify.apiError(error, "Payout review failed");
      }
    });
  const inspect = (payment: Record<string, unknown>) =>
    startTransition(async () => {
      setSelected(payment);
      try {
        setEvents(
          (await client.payments.adminTimeline({
            paymentReference: String(payment.reference),
          })) as Record<string, unknown>[],
        );
      } catch (error) {
        notify.apiError(error, "Payment history could not be loaded");
      }
    });
  const inspectProof = (payment: Record<string, unknown>) =>
    startTransition(async () => {
      try {
        if (payment.status === "SUBMITTED")
          await client.payments.beginBankReview({ paymentReference: String(payment.reference) });
        const proof = await client.payments.getProofViewUrl({
          paymentReference: String(payment.reference),
        });
        window.open(proof.url, "_blank", "noopener,noreferrer");
        await refresh();
      } catch (error) {
        notify.apiError(error, "Proof could not be opened");
      }
    });
  return (
    <>
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Payments & payouts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Verify collections, inspect immutable payment events, and release seller balances.
        </p>
      </div>
      <label className="block max-w-xl text-xs font-semibold">
        Required audit note
        <input
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-normal"
        />
      </label>
      <section>
        <h2 className="mb-3 text-lg font-semibold">Payment verification</h2>
        <div className="grid gap-3">
          {queue.payments.map((payment) => (
            <article
              key={String(payment.reference)}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                <button type="button" onClick={() => inspect(payment)} className="text-left">
                  <p className="font-semibold">
                    {String(payment.estateName)} · {String(payment.plotNumber)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {String(payment.buyerEmail)} · {String(payment.method).replaceAll("_", " ")}
                  </p>
                  <p className="mt-2 font-mono text-xs">{String(payment.reference)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Reservation {String(payment.reservationReference)} · Provider{" "}
                    {String(payment.providerReference)}
                  </p>
                  {payment.bankTransferReference ? (
                    <p className="mt-1 text-xs">
                      Transfer: {String(payment.bankTransferReference)}
                    </p>
                  ) : null}
                </button>
                <div className="sm:text-right">
                  <p className="text-lg font-bold">GHS {Number(payment.amount).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">
                    {String(payment.status).replaceAll("_", " ")}
                  </p>
                  {payment.proofStatus ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      onClick={() => inspectProof(payment)}
                    >
                      Secure proof
                    </Button>
                  ) : null}
                  {["PENDING_CONFIRMATION", "SUBMITTED", "UNDER_VERIFICATION"].includes(
                    String(payment.status),
                  ) ? (
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        disabled={pending || reason.length < 5}
                        onClick={() => reviewPayment(String(payment.reference), "APPROVE")}
                      >
                        Verify payment
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pending || reason.length < 5}
                        onClick={() => reviewPayment(String(payment.reference), "REJECT")}
                      >
                        Reject
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
      {selected ? (
        <section className="rounded-2xl border border-border bg-muted/30 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold">Payment event history</h2>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                {String(selected.reference)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelected(null);
                setEvents([]);
              }}
              className="text-sm font-semibold"
            >
              Close
            </button>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {events.map((event, index) => (
              <div
                key={`${String(event.createdAt)}-${index}`}
                className="rounded-xl border border-border bg-background p-4"
              >
                <p className="text-sm font-semibold">
                  {String(event.type).replaceAll("_", " ").replaceAll(".", " ")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {String(event.fromStatus ?? "Created")} → {String(event.toStatus)}
                </p>
                <p className="mt-2 text-xs">
                  {String(event.actor ?? "System")} ·{" "}
                  {new Date(String(event.createdAt)).toLocaleString("en-GH")}
                </p>
              </div>
            ))}
            {!events.length && !pending ? (
              <p className="text-sm text-muted-foreground">No payment events recorded.</p>
            ) : null}
          </div>
        </section>
      ) : null}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Payout requests</h2>
        <div className="grid gap-3">
          {queue.payouts.length ? (
            queue.payouts.map((payout) => (
              <article
                key={String(payout.reference)}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold">{String(payout.companyName)}</p>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      {String(payout.reference)}
                    </p>
                  </div>
                  <div>
                    <p className="font-bold">GHS {Number(payout.amount).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{String(payout.status)}</p>
                  </div>
                  {payout.status === "REQUESTED" ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={pending || reason.length < 5}
                        onClick={() => reviewPayout(String(payout.reference), "MARK_PAID")}
                      >
                        Mark paid
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pending || reason.length < 5}
                        onClick={() => reviewPayout(String(payout.reference), "REJECT")}
                      >
                        Reject
                      </Button>
                    </div>
                  ) : null}
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No payout requests.
            </div>
          )}
        </div>
      </section>
    </>
  );
}
