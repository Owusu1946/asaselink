"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@asaselink/ui/components/button";
import { client } from "@/utils/orpc";
import { notify } from "@/utils/notify";

const METHODS = [
  { id: "MTN_MOMO", name: "MTN MoMo", hint: "Approve the mock prompt on your phone" },
  { id: "TELECEL_CASH", name: "Telecel Cash", hint: "Use your Telecel mobile wallet" },
  { id: "AIRTELTIGO_MONEY", name: "AirtelTigo Money", hint: "Use your AT Money wallet" },
  { id: "BANK_TRANSFER", name: "Bank transfer", hint: "Submit your transfer reference for review" },
] as const;

type Method = (typeof METHODS)[number]["id"];

export function PaymentCheckout({ checkout }: { checkout: Record<string, unknown> }) {
  const [method, setMethod] = useState<Method>((checkout.method as Method | undefined) ?? "MTN_MOMO");
  const [phone, setPhone] = useState("");
  const [bankReference, setBankReference] = useState("");
  const [paymentReference, setPaymentReference] = useState<string | null>(checkout.paymentReference ? String(checkout.paymentReference) : null);
  const [status, setStatus] = useState(String(checkout.paymentStatus ?? ""));
  const [pending, startTransition] = useTransition();
  const reservationReference = String(checkout.reservationReference);
  const awaitingReview = status === "PENDING_CONFIRMATION";
  const paid = status === "SUCCEEDED";

  function submit() {
    startTransition(async () => {
      try {
        let reference = paymentReference;
        if (!reference) {
          const payment = await client.payments.initiate({ reservationReference, method, phone: method === "BANK_TRANSFER" ? undefined : phone });
          reference = String(payment.reference);
          setPaymentReference(reference);
        }
        const submitted = await client.payments.submitMockPayment({ paymentReference: reference, bankTransferReference: method === "BANK_TRANSFER" ? bankReference : undefined });
        setStatus(String(submitted.status));
        notify.success("Payment submitted", { description: "AsaseLink operations will verify this mock payment." });
      } catch (error) { notify.apiError(error, "Payment could not be submitted"); }
    });
  }

  return <main className="min-h-svh bg-muted/30 px-4 py-8 sm:py-12"><div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[1fr_22rem]"><section className="rounded-3xl border border-border bg-card p-5 sm:p-8"><Link href="/account/reservations" className="text-sm font-semibold text-muted-foreground">← Reservations</Link><h1 className="mt-5 text-3xl font-bold tracking-tight">Pay for {String(checkout.plotNumber)}</h1><p className="mt-2 text-sm text-muted-foreground">Choose how to submit this mock payment for verification.</p>{awaitingReview || paid ? <div className="mt-8 rounded-2xl border border-brand-green-200 bg-brand-green-50 p-5 text-brand-green-950"><p className="font-semibold">{paid ? "Payment verified" : "Payment awaiting verification"}</p><p className="mt-1 text-sm">{paid ? "Your plot purchase is confirmed." : "No further payment action is needed. Track it from your account."}</p><Link href="/account/payments" className="mt-4 inline-block text-sm font-semibold underline">View payment activity</Link></div> : <><div className="mt-7 grid gap-3 sm:grid-cols-2">{METHODS.map((item) => <button type="button" key={item.id} onClick={() => { setMethod(item.id); setPaymentReference(null); }} className={`min-h-24 rounded-2xl border p-4 text-left transition-colors ${method === item.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:bg-muted/50"}`}><span className="font-semibold">{item.name}</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">{item.hint}</span></button>)}</div><div className="mt-6"><label className="text-sm font-semibold" htmlFor="payment-detail">{method === "BANK_TRANSFER" ? "Bank transfer reference" : "Mobile money number"}</label><input id="payment-detail" value={method === "BANK_TRANSFER" ? bankReference : phone} onChange={(event) => method === "BANK_TRANSFER" ? setBankReference(event.target.value) : setPhone(event.target.value)} placeholder={method === "BANK_TRANSFER" ? "e.g. TRX-204839" : "e.g. 024 000 0000"} className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-ring" /></div><Button onClick={submit} disabled={pending || (method === "BANK_TRANSFER" ? bankReference.trim().length < 5 : phone.replace(/\D/g, "").length < 9)} className="mt-6 h-12 w-full rounded-xl">{pending ? "Submitting securely…" : method === "BANK_TRANSFER" ? "Submit transfer for verification" : "Complete mock payment"}</Button></>}</section><aside className="h-fit rounded-3xl bg-brand-green-950 p-6 text-white sm:p-7"><p className="text-xs uppercase tracking-widest text-white/60">Order summary</p><h2 className="mt-4 text-xl font-semibold">{String(checkout.estateName)}</h2><p className="mt-1 text-sm text-white/70">{String(checkout.companyName)}</p><div className="my-6 border-t border-white/15"/><div className="flex justify-between text-sm"><span className="text-white/70">Plot</span><strong>{String(checkout.plotNumber)}</strong></div><div className="mt-3 flex justify-between text-lg"><span>Total</span><strong>GHS {Number(checkout.amount).toLocaleString()}</strong></div><p className="mt-6 text-xs leading-5 text-white/60">The browser cannot change this amount. It comes from the reservation price snapshot stored by AsaseLink.</p></aside></div></main>;
}
