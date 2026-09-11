"use client";

import { useState, useTransition } from "react";
import { Button } from "@asaselink/ui/components/button";
import { client } from "@/utils/orpc";

export function EstateReviewAction({ estateId, status, plotCount }: { estateId: string; status: string; plotCount: number }) {
  const [currentStatus, setCurrentStatus] = useState(status);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  if (currentStatus === "submitted") return <p aria-live="polite" className="rounded-xl border border-brand-gold-500/40 bg-brand-gold-50 p-4 text-sm dark:bg-brand-gold-950/30">This estate is awaiting AsaseLink review.</p>;
  if (currentStatus === "approved") return <p className="rounded-xl border border-brand-green-500/40 bg-brand-green-50 p-4 text-sm dark:bg-brand-green-950/30">Published to the buyer marketplace.</p>;
  return <div>{error ? <p role="alert" className="mb-3 text-sm text-destructive">{error}</p> : null}<Button type="button" disabled={plotCount === 0 || pending} onClick={() => startTransition(async () => { try { const result = await client.land.submitEstate({ estateId }); setCurrentStatus(String(result.status)); } catch (cause) { setError(cause instanceof Error ? cause.message : "The estate could not be submitted."); } })} className="h-11">{pending ? "Submitting…" : "Submit estate for review"}</Button>{plotCount === 0 ? <p className="mt-2 text-xs text-muted-foreground">Add at least one mapped plot before submitting.</p> : null}</div>;
}
