"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Location01Icon, Notification01Icon, PauseIcon, PlayIcon, Delete02Icon } from "@hugeicons/core-free-icons";
import { Button, buttonVariants } from "@asaselink/ui/components/button";
import { client } from "@/utils/orpc";
import { notify } from "@/utils/notify";

interface AlertRow { id: string; locationLabel: string; radiusKm: string; minPrice: string | null; maxPrice: string | null; channels: Array<"email" | "sms">; frequency: string; status: "active" | "paused"; matchCount: number; lastMatchedAt: string | null }

export default function LandAlertsPage() {
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const load = useCallback(async () => { try { setAlerts(await client.alerts.list() as unknown as AlertRow[]); } catch (cause) { notify.apiError(cause, "Land alerts could not be loaded"); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);

  function toggle(alert: AlertRow) {
    const status = alert.status === "active" ? "paused" : "active"; setPendingId(alert.id);
    setAlerts((rows) => rows.map((row) => row.id === alert.id ? { ...row, status } : row));
    startTransition(async () => { try { await client.alerts.setStatus({ id: alert.id, status }); notify.success(status === "active" ? "Alert resumed" : "Alert paused"); } catch (cause) { setAlerts((rows) => rows.map((row) => row.id === alert.id ? alert : row)); notify.apiError(cause, "Alert could not be updated"); } finally { setPendingId(null); } });
  }
  function remove(alert: AlertRow) {
    if (!window.confirm(`Remove the alert for ${alert.locationLabel}?`)) return;
    const previous = alerts; setAlerts((rows) => rows.filter((row) => row.id !== alert.id)); setPendingId(alert.id);
    startTransition(async () => { try { await client.alerts.remove({ id: alert.id }); notify.success("Alert removed"); } catch (cause) { setAlerts(previous); notify.apiError(cause, "Alert could not be removed"); } finally { setPendingId(null); } });
  }

  if (loading) return <div className="space-y-3">{[1, 2].map((item) => <div key={item} className="h-36 animate-pulse rounded-2xl bg-muted" />)}</div>;
  if (!alerts.length) return <div className="rounded-3xl border border-dashed border-border px-6 py-16 text-center"><span className="mx-auto grid size-12 place-items-center rounded-full bg-brand-green-50 text-brand-green-900"><HugeiconsIcon icon={Notification01Icon} size={22} /></span><h2 className="mt-4 text-lg font-semibold">No areas being watched</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">Search for land and create an alert when no available plots match your location and budget.</p><Link href="/#explore-lands" className={buttonVariants({ size: "sm", className: "mt-5 rounded-xl" })}>Search for land</Link></div>;

  return <div className="space-y-3">{alerts.map((alert) => <article key={alert.id} className="rounded-2xl border border-border bg-card p-5 sm:p-6"><div className="flex flex-col gap-5 sm:flex-row sm:items-center"><span className={`grid size-11 shrink-0 place-items-center rounded-full ${alert.status === "active" ? "bg-brand-green-50 text-brand-green-900" : "bg-muted text-muted-foreground"}`}><HugeiconsIcon icon={Location01Icon} size={20} /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{alert.locationLabel}</h2><span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${alert.status === "active" ? "bg-brand-green-50 text-brand-green-900" : "bg-muted text-muted-foreground"}`}>{alert.status === "active" ? "Watching" : "Paused"}</span></div><p className="mt-1 text-sm text-muted-foreground">Within {Number(alert.radiusKm)} km · {priceLabel(alert)} · {alert.frequency === "daily" ? "Daily digest" : "Instant alerts"}</p><p className="mt-2 text-xs text-muted-foreground">{alert.channels.map((channel) => channel.toUpperCase()).join(" + ")} mock delivery · {alert.matchCount} {alert.matchCount === 1 ? "match" : "matches"}</p></div><div className="flex gap-2"><Button type="button" variant="outline" size="sm" disabled={pendingId === alert.id} onClick={() => toggle(alert)} className="gap-1.5 rounded-xl"><HugeiconsIcon icon={alert.status === "active" ? PauseIcon : PlayIcon} size={15} />{alert.status === "active" ? "Pause" : "Resume"}</Button><Button type="button" variant="ghost" size="icon" disabled={pendingId === alert.id} onClick={() => remove(alert)} className="rounded-xl text-destructive hover:text-destructive" aria-label={`Remove alert for ${alert.locationLabel}`}><HugeiconsIcon icon={Delete02Icon} size={17} /></Button></div></div></article>)}</div>;
}

function priceLabel(alert: AlertRow) {
  const money = (value: string) => `GHS ${Number(value).toLocaleString()}`;
  if (alert.minPrice && alert.maxPrice) return `${money(alert.minPrice)}–${money(alert.maxPrice)}`;
  if (alert.maxPrice) return `Up to ${money(alert.maxPrice)}`;
  if (alert.minPrice) return `From ${money(alert.minPrice)}`;
  return "Any price";
}
