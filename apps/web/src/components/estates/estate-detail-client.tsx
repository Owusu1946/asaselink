"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import type { Geometry } from "geojson";
import { Button } from "@asaselink/ui/components/button";
import { EstatePlotMap, type PublicPlot } from "./estate-plot-map";
import { client } from "@/utils/orpc";
import { notify } from "@/utils/notify";

export function EstateDetailClient({ slug, boundary, plots }: { slug: string; boundary: Geometry; plots: PublicPlot[] }) {
  const [livePlots, setLivePlots] = useState(plots);
  const [selected, setSelected] = useState<PublicPlot | null>(() => plots.find((plot) => plot.status === "AVAILABLE") ?? null);
  const [reservationError, setReservationError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { isSignedIn } = useAuth();
  const router = useRouter();
  useEffect(() => { router.prefetch("/account/reservations"); }, [router]);
  const selectPlot = useCallback((plot: PublicPlot) => setSelected(plot), []);

  function reserve() {
    if (!selected) return;
    const returnUrl = `/estates/${slug}?plot=${selected.id}`;
    if (!isSignedIn) { router.push(`/sign-in?intent=buyer&redirect_url=${encodeURIComponent(returnUrl)}`); return; }
    setReservationError(null);
    const previous = selected;
    const reserved = { ...previous, status: "RESERVED" as const };
    setSelected(reserved);
    setLivePlots((current) => current.map((plot) => plot.id === previous.id ? reserved : plot));
    startTransition(async () => {
      try {
        await client.reservations.create({ plotId: previous.id });
        notify.success("Plot reserved", { description: `${previous.plotNumber} has been secured for you.` });
        router.push("/account/reservations");
      } catch (error) {
        setSelected(previous);
        setLivePlots((current) => current.map((plot) => plot.id === previous.id ? previous : plot));
        const message = error instanceof Error ? error.message : "The plot could not be reserved.";
        if (message.toLowerCase().includes("buyer profile")) router.push(`/onboarding/profile?return_url=${encodeURIComponent(returnUrl)}`);
        else { setReservationError(message); notify.error("Reservation failed", { description: message }); }
      }
    });
  }

  return <div className="grid gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(19rem,0.75fr)]">
    <EstatePlotMap estateBoundary={boundary} plots={livePlots} onSelect={selectPlot} />
    <aside className="rounded-2xl border border-border bg-card p-5 sm:p-6"><h2 className="text-lg font-semibold">Plot inventory</h2><p className="mt-1 text-sm text-muted-foreground">Select a boundary on the map or choose a plot below.</p><div className="mt-5 max-h-72 space-y-2 overflow-y-auto pr-1">{livePlots.map((plot) => <button key={plot.id} type="button" onClick={() => setSelected(plot)} className={`flex min-h-14 w-full items-center justify-between rounded-xl border px-3 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selected?.id === plot.id ? "border-brand-gold-500 bg-brand-gold-50 dark:bg-brand-gold-950/30" : "border-border hover:bg-muted"}`}><span><strong className="block">{plot.plotNumber}</strong><span className="text-xs text-muted-foreground">{Number(plot.areaSquareMeters).toLocaleString()} m²</span></span><span className="text-right"><strong className="block">GHS {Number(plot.price).toLocaleString()}</strong><span className="text-xs capitalize text-muted-foreground">{plot.status.toLowerCase()}</span></span></button>)}</div>{livePlots.length === 0 ? <p className="mt-6 rounded-xl bg-muted p-4 text-sm text-muted-foreground">No plots have been published for this estate yet.</p> : null}{selected ? <div className="mt-5 border-t border-border pt-5"><p className="font-semibold">{selected.plotNumber}</p><p className="mt-1 text-sm text-muted-foreground">Availability is confirmed again before reservation.</p>{reservationError ? <p role="alert" className="mt-3 text-sm text-destructive">{reservationError}</p> : null}<Button type="button" onClick={reserve} disabled={selected.status !== "AVAILABLE" || isPending} className="mt-4 h-12 w-full rounded-xl">{isPending ? "Securing plot…" : selected.status === "AVAILABLE" ? "Reserve this plot" : "Plot unavailable"}</Button></div> : null}</aside>
  </div>;
}
