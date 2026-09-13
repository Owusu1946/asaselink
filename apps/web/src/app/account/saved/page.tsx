"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { HugeiconsIcon } from "@hugeicons/react";
import { Bookmark01Icon, Cancel01Icon, Location01Icon } from "@hugeicons/core-free-icons";
import { client } from "@/utils/orpc";
import { notify } from "@/utils/notify";

type SavedEstate = { id: string; slug: string; name: string; region: string; district: string | null; priceFrom: string | null; companyName: string; availablePlots: number };

export default function SavedParcelsPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const [items, setItems] = useState<SavedEstate[] | null>(null);
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    client.buyer.listSaved().then((rows) => setItems(rows as SavedEstate[])).catch((error) => { setItems([]); notify.apiError(error, "Could not load saved parcels"); });
  }, [isLoaded, isSignedIn]);
  const remove = async (estate: SavedEstate) => {
    setItems((current) => current?.filter((item) => item.id !== estate.id) ?? []);
    try {
      await client.buyer.setSaved({ estateId: estate.id, saved: false });
      window.dispatchEvent(new Event("asaselink:buyer-data-changed"));
      notify.success("Estate removed", { description: `${estate.name} was removed from Saved Parcels.` });
    } catch (error) { setItems((current) => [estate, ...(current ?? [])]); notify.apiError(error, "Could not remove estate"); }
  };
  if (items === null) return <div className="grid gap-4 sm:grid-cols-2">{[0, 1].map((item) => <div key={item} className="h-48 animate-pulse rounded-2xl bg-muted" />)}</div>;
  if (!items.length) return <div className="rounded-3xl border border-dashed border-border p-12 text-center"><HugeiconsIcon icon={Bookmark01Icon} size={28} className="mx-auto text-muted-foreground" /><h2 className="mt-4 font-semibold">No saved estates yet</h2><p className="mt-2 text-sm text-muted-foreground">Use the bookmark on any verified estate to keep it here.</p><Link href="/#explore-lands" className="mt-5 inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground">Explore estates</Link></div>;
  return <div className="grid gap-4 sm:grid-cols-2">{items.map((estate) => <article key={estate.id} className="rounded-2xl border border-border bg-card p-5 transition-colors hover:border-brand-green-700/40"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="text-xs font-medium text-brand-green-800 dark:text-brand-green-400">{estate.companyName}</p><h2 className="mt-1 truncate text-lg font-semibold">{estate.name}</h2><p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><HugeiconsIcon icon={Location01Icon} size={14} />{estate.district ?? estate.region}, {estate.region}</p></div><button type="button" onClick={() => void remove(estate)} className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label={`Remove ${estate.name}`}><HugeiconsIcon icon={Cancel01Icon} size={17} /></button></div><div className="mt-5 flex items-end justify-between border-t border-border pt-4"><div><p className="text-xs text-muted-foreground">From</p><p className="font-semibold">{estate.priceFrom ? `GHS ${Number(estate.priceFrom).toLocaleString()}` : "Price on request"}</p></div><div className="text-right"><p className="text-xs text-muted-foreground">Availability</p><p className="text-sm font-semibold">{estate.availablePlots} plots</p></div></div><Link href={`/estates/${estate.slug}`} className="mt-5 inline-flex text-sm font-semibold text-brand-green-900 underline-offset-4 hover:underline dark:text-brand-green-300">View estate layout</Link></article>)}</div>;
}
