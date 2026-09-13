"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { HugeiconsIcon } from "@hugeicons/react";
import { Download01Icon, File01Icon, ShieldCheckIcon } from "@hugeicons/core-free-icons";
import { client } from "@/utils/orpc";
import { notify } from "@/utils/notify";

type VaultDocument = { id: string; reference: string; status: string; createdAt: string; priceSnapshot: string; plotNumber: string; estateName: string; estateSlug: string };

export default function DocumentVaultPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const [documents, setDocuments] = useState<VaultDocument[] | null>(null);
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    client.buyer.listDocuments().then((rows) => setDocuments(rows as VaultDocument[])).catch((error) => { setDocuments([]); notify.apiError(error, "Could not load document vault"); });
  }, [isLoaded, isSignedIn]);
  const downloadReceipt = (document: VaultDocument) => {
    const receipt = ["ASASELINK RESERVATION RECEIPT", `Reference: ${document.reference}`, `Estate: ${document.estateName}`, `Plot: ${document.plotNumber}`, `Reserved price: GHS ${Number(document.priceSnapshot).toLocaleString()}`, `Status: ${document.status.replaceAll("_", " ")}`, `Issued: ${new Date(document.createdAt).toLocaleString()}`].join("\n");
    const url = URL.createObjectURL(new Blob([receipt], { type: "text/plain;charset=utf-8" }));
    const anchor = window.document.createElement("a"); anchor.href = url; anchor.download = `${document.reference}-reservation-receipt.txt`; anchor.click(); URL.revokeObjectURL(url);
    notify.success("Receipt downloaded", { description: document.reference });
  };
  if (documents === null) return <div className="h-52 animate-pulse rounded-2xl bg-muted" />;
  if (!documents.length) return <div className="rounded-3xl border border-dashed border-border p-12 text-center"><HugeiconsIcon icon={File01Icon} size={28} className="mx-auto text-muted-foreground" /><h2 className="mt-4 font-semibold">Document vault is empty</h2><p className="mt-2 text-sm text-muted-foreground">Reservation receipts and future verified transaction documents will appear here.</p><Link href="/#explore-lands" className="mt-5 inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground">Find land parcels</Link></div>;
  return <div className="overflow-hidden rounded-2xl border border-border bg-card"><div className="border-b border-border px-5 py-4"><h2 className="font-semibold">Transaction documents</h2><p className="mt-1 text-xs text-muted-foreground">Receipts are generated from your authoritative reservation records.</p></div><div className="divide-y divide-border">{documents.map((document) => <article key={document.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-green-50 text-brand-green-900 dark:bg-brand-green-950 dark:text-brand-green-300"><HugeiconsIcon icon={File01Icon} size={19} /></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate font-semibold">Reservation receipt · Plot {document.plotNumber}</h3><span className="inline-flex items-center gap-1 rounded-full bg-brand-green-50 px-2 py-0.5 text-[10px] font-medium text-brand-green-900 dark:bg-brand-green-950 dark:text-brand-green-300"><HugeiconsIcon icon={ShieldCheckIcon} size={11} />Verified record</span></div><p className="mt-1 text-sm text-muted-foreground">{document.estateName} · {document.reference}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(document.createdAt).toLocaleDateString()}</p></div></div><div className="flex shrink-0 items-center gap-2"><Link href={`/estates/${document.estateSlug}`} className="inline-flex h-9 items-center rounded-lg border border-border px-3 text-xs font-medium hover:bg-muted">View estate</Link><button type="button" onClick={() => downloadReceipt(document)} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground"><HugeiconsIcon icon={Download01Icon} size={14} />Download</button></div></article>)}</div></div>;
}
