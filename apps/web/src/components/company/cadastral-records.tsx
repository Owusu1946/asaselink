"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { FileValidationIcon, Location01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@asaselink/ui/components/button";
import { notify } from "@/utils/notify";

export interface CadastralRecord { id: string; resourceType: string; resourceId: string; action: string; reason: string; approvalState: string; createdAt: string | Date; geometry: unknown; estateId: string; estateName: string; plotNumber: string | null; actor: string }

export function CadastralRecords({ companyId, selectedEstateId, estates, records }: { companyId: string; selectedEstateId?: string; estates: Array<{ id: string; name: string }>; records: CadastralRecord[] }) {
  const router = useRouter();
  const estateRecords = records.filter((record) => record.resourceType === "estate").length;

  function downloadGeoJson() {
    const collection = { type: "FeatureCollection", features: records.map((record) => ({ type: "Feature", id: record.resourceId, properties: { recordId: record.id, resourceType: record.resourceType, estate: record.estateName, plotNumber: record.plotNumber, action: record.action, approvalState: record.approvalState, recordedAt: record.createdAt }, geometry: record.geometry })) };
    const url = URL.createObjectURL(new Blob([JSON.stringify(collection, null, 2)], { type: "application/geo+json" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${selectedEstateId ? "estate" : "company"}-cadastral-records.geojson`; anchor.click(); URL.revokeObjectURL(url);
    notify.success(`Exported ${records.length} cadastral record${records.length === 1 ? "" : "s"}.`);
  }

  return <div className="space-y-6">
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-medium text-brand-green-800">Boundary ledger</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Cadastral survey records</h1><p className="mt-2 text-sm text-muted-foreground">Immutable estate and plot geometry captured from your mapped layouts.</p></div><Button variant="outline" disabled={!records.length} onClick={downloadGeoJson}>Export GeoJSON</Button></header>
    <section className="grid gap-3 sm:grid-cols-3">{[["Total records", records.length], ["Estate boundaries", estateRecords], ["Plot surveys", records.length - estateRecords]].map(([label, value]) => <div key={String(label)} className="rounded-2xl border border-border bg-card p-5"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>)}</section>
    <label className="block max-w-sm text-sm font-medium">Estate<select value={selectedEstateId ?? ""} onChange={(event) => router.push(event.target.value ? `/company/${companyId}/cadastral?estate=${event.target.value}` : `/company/${companyId}/cadastral`)} className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"><option value="">All managed estates</option>{estates.map((estate) => <option key={estate.id} value={estate.id}>{estate.name}</option>)}</select></label>
    {records.length ? <div className="overflow-hidden rounded-2xl border border-border bg-card">{records.map((record) => <article key={record.id} className="flex flex-col justify-between gap-4 border-b border-border/70 p-5 last:border-0 sm:flex-row sm:items-center"><div className="flex min-w-0 gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted"><HugeiconsIcon icon={record.resourceType === "plot" ? Location01Icon : FileValidationIcon} size={18} /></span><div className="min-w-0"><h2 className="truncate text-sm font-semibold">{record.plotNumber ? `Plot ${record.plotNumber}` : record.estateName}</h2><p className="mt-1 text-xs text-muted-foreground">{record.action.replaceAll("_", " ")} by {record.actor} · {new Date(record.createdAt).toLocaleString("en-GH", { dateStyle: "medium", timeStyle: "short" })}</p><p className="mt-2 text-sm">{record.reason}</p></div></div><div className="flex shrink-0 items-center gap-2"><span className="rounded-full border border-border px-2.5 py-1 text-xs capitalize">{record.approvalState}</span><Link href={`/company/${companyId}/estates/${record.estateId}`} className="text-xs font-medium text-brand-green-800 hover:underline">Open map</Link></div></article>)}</div> : <div className="rounded-2xl border border-dashed border-border p-12 text-center"><HugeiconsIcon icon={FileValidationIcon} size={26} className="mx-auto text-muted-foreground" /><h2 className="mt-4 font-semibold">No cadastral records yet</h2><p className="mt-2 text-sm text-muted-foreground">Map an estate or plot and its signed geometry record will appear here.</p><Link href={`/company/${companyId}/estates`} className="mt-5 inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground">Map an estate</Link></div>}
  </div>;
}
