"use client";

import { useEffect, useState, useTransition } from "react";
import { AdminNav } from "@/components/dashboard/admin-nav";
import ApiProvider from "@/components/api-provider";
import { Button } from "@asaselink/ui/components/button";
import { client } from "@/utils/orpc";

interface EstateQueueItem { id: string; name: string; region: string; district?: string; status: string; companyName: string; plotCount: number }

function EstateQueue() {
  const [items, setItems] = useState<EstateQueueItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const load = () => client.admin.getEstateQueue().then((rows) => setItems(rows as unknown as EstateQueueItem[])).catch((cause) => setError(cause instanceof Error ? cause.message : "Estate queue could not load."));
  useEffect(() => { void load(); }, []);
  function decide(estateId: string, decision: "approved" | "rejected") {
    const reason = window.prompt(decision === "approved" ? "Approval audit note" : "Rejection reason");
    if (!reason || reason.trim().length < 5) return;
    startTransition(async () => { try { await client.admin.reviewEstate({ estateId, decision, reason: reason.trim() }); await load(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Decision could not be saved."); } });
  }
  return <div className="min-h-svh bg-background"><AdminNav /><main className="mx-auto max-w-6xl space-y-6 p-6 sm:p-10"><div><h1 className="text-3xl font-bold tracking-tight">Estate publication queue</h1><p className="mt-2 text-sm text-muted-foreground">Approve mapped estates before they appear to buyers.</p></div>{error ? <p role="alert" className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">{error}</p> : null}<div className="space-y-3">{items.map((estate) => <article key={estate.id} className="flex flex-col justify-between gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center"><div><h2 className="font-semibold">{estate.name}</h2><p className="mt-1 text-sm text-muted-foreground">{estate.companyName} · {estate.district ? `${estate.district}, ` : ""}{estate.region} · {estate.plotCount} plots</p></div><div className="flex items-center gap-2"><span className="mr-2 rounded-full border border-border px-3 py-1 text-xs capitalize">{estate.status}</span>{estate.status === "submitted" ? <><Button type="button" disabled={pending} onClick={() => decide(estate.id, "approved")}>Approve</Button><Button type="button" variant="outline" disabled={pending} onClick={() => decide(estate.id, "rejected")}>Reject</Button></> : null}</div></article>)}</div>{!items.length && !error ? <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">No estates are awaiting or have completed review.</p> : null}</main></div>;
}

export default function AdminEstatesPage() { return <ApiProvider clerkEnabled><EstateQueue /></ApiProvider>; }
