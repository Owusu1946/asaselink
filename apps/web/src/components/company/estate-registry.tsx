"use client";

import Link from "next/link";
import { useState } from "react";
import { EstateBoundaryEditor } from "./estate-boundary-editor";

interface EstateSummary {
  id: string; name: string; slug: string; region: string; district: string | null;
  status: string; priceFrom: string | null;
}

export function EstateRegistry({ companyId, initialEstates }: { companyId: string; initialEstates: EstateSummary[] }) {
  const [estates, setEstates] = useState(initialEstates);
  const addEstate = (created: EstateSummary) => setEstates((current) => current.some((estate) => estate.id === created.id) ? current : [created, ...current]);

  return <div className="space-y-8">
    <EstateBoundaryEditor companyId={companyId} onCreated={addEstate} />
    {estates.length === 0 ? <div className="rounded-2xl border border-dashed border-border p-8 text-center"><h2 className="font-semibold">No registered estates yet</h2><p className="mt-2 text-sm text-muted-foreground">Your first validated estate will appear here.</p></div> : <section aria-labelledby="registered-estates-heading"><h2 id="registered-estates-heading" className="mb-4 text-lg font-semibold">Registered estates <span className="text-muted-foreground">({estates.length})</span></h2><div className="grid gap-4 sm:grid-cols-2">{estates.map((estate) => <Link href={`/company/${companyId}/estates/${estate.id}`} key={estate.id} className="rounded-2xl border border-border bg-card p-5 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><div className="flex items-start justify-between gap-4"><div><h3 className="font-semibold">{estate.name}</h3><p className="mt-1 text-sm text-muted-foreground">{estate.district ? `${estate.district}, ` : ""}{estate.region}</p></div><span className="rounded-full border border-border px-2.5 py-1 text-xs font-medium capitalize">{estate.status}</span></div>{estate.priceFrom ? <p className="mt-5 text-sm"><span className="text-muted-foreground">From </span><strong>GHS {Number(estate.priceFrom).toLocaleString()}</strong></p> : null}<p className="mt-4 text-sm font-semibold">Manage plots →</p></Link>)}</div></section>}
  </div>;
}
