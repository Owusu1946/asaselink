"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@asaselink/ui/components/button";
import { client } from "@/utils/orpc";
import { notify } from "@/utils/notify";

type Reservation = Record<string, unknown>;
const statuses = ["ALL", "ACTIVE", "PAYMENT_PENDING", "CONFIRMED", "CANCELLED", "EXPIRED"] as const;

export function CompanyReservations({ companyId, initialRows }: { companyId: string; initialRows: Reservation[] }) {
  const [rows, setRows] = useState(initialRows);
  const [status, setStatus] = useState<(typeof statuses)[number]>("ALL");
  const [search, setSearch] = useState("");
  const [cancel, setCancel] = useState<Reservation | null>(null);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  const visible = useMemo(() => rows.filter((row) => {
    if (status !== "ALL" && row.status !== status) return false;
    const haystack = [row.reference, row.plotNumber, row.estateName, row.buyerEmail, row.buyerFirstName, row.buyerLastName].join(" ").toLowerCase();
    return haystack.includes(search.trim().toLowerCase());
  }), [rows, search, status]);

  function cancelReservation() {
    if (!cancel) return;
    startTransition(async () => {
      try {
        await client.reservations.cancelCompany({ companyId, reference: String(cancel.reference), reason });
        setRows(await client.reservations.listCompany({ companyId, status: "ALL" }) as Reservation[]);
        setCancel(null); setReason("");
        notify.success("Reservation cancelled", { description: "The plot is available again and the buyer record was updated." });
      } catch (error) { notify.apiError(error, "Reservation could not be cancelled"); }
    });
  }

  return <div className="space-y-6">
    <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
      <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search reference, buyer, estate or plot" aria-label="Search reservations" className="h-11 rounded-xl border border-border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-ring" />
      <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} aria-label="Filter by status" className="h-11 rounded-xl border border-border bg-background px-3 text-sm">{statuses.map((item) => <option key={item} value={item}>{item === "ALL" ? "All statuses" : item.replaceAll("_", " ")}</option>)}</select>
    </div>
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      {visible.map((row) => <article key={String(row.id)} className="grid gap-4 border-b border-border p-5 last:border-0 md:grid-cols-[1fr_1fr_auto] md:items-center">
        <div><p className="font-semibold">{String(row.estateName)} · Plot {String(row.plotNumber)}</p><p className="mt-1 font-mono text-xs text-muted-foreground">{String(row.reference)}</p><p className="mt-2 text-sm text-muted-foreground">{[row.buyerFirstName, row.buyerLastName].filter(Boolean).join(" ") || "Buyer"} · {String(row.buyerEmail ?? "No email")}</p></div>
        <div className="text-sm"><p className="font-semibold">GHS {Number(row.priceSnapshot).toLocaleString()}</p><p className="mt-1 text-xs text-muted-foreground">Payment: {row.paymentStatus ? String(row.paymentStatus).replaceAll("_", " ") : "Not started"}</p><p className="mt-1 text-xs text-muted-foreground">Created {new Date(String(row.createdAt)).toLocaleString("en-GH", { dateStyle: "medium", timeStyle: "short" })}</p></div>
        <div className="flex items-center gap-2 md:flex-col md:items-end"><span className="rounded-full border border-border px-3 py-1 text-xs font-semibold">{String(row.status).replaceAll("_", " ")}</span>{["ACTIVE", "PAYMENT_PENDING"].includes(String(row.status)) ? <Button size="sm" variant="outline" onClick={() => setCancel(row)}>Cancel</Button> : null}</div>
      </article>)}
      {!visible.length ? <div className="p-12 text-center"><h2 className="font-semibold">No reservations found</h2><p className="mt-2 text-sm text-muted-foreground">Change the search or status filter.</p></div> : null}
    </div>
    {cancel ? <div className="fixed inset-0 z-[70] grid place-items-center bg-black/55 p-4" role="dialog" aria-modal="true" aria-labelledby="cancel-title"><div className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-2xl"><h2 id="cancel-title" className="text-xl font-semibold">Cancel {String(cancel.reference)}?</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">This releases the plot immediately and cancels any unverified payment attempt. This action is recorded in the audit trail.</p><label className="mt-5 block text-sm font-medium">Reason<textarea autoFocus value={reason} onChange={(event) => setReason(event.target.value)} rows={3} placeholder="Explain why this reservation is being cancelled" className="mt-2 w-full resize-none rounded-xl border border-border bg-background p-3 text-sm" /></label><div className="mt-5 flex justify-end gap-2"><Button variant="outline" disabled={pending} onClick={() => { setCancel(null); setReason(""); }}>Keep reservation</Button><Button disabled={pending || reason.trim().length < 5} onClick={cancelReservation}>{pending ? "Cancelling…" : "Cancel reservation"}</Button></div></div></div> : null}
  </div>;
}
