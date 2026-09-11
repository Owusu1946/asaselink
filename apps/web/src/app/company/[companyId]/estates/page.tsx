import { getServerApiClient } from "@/utils/server-orpc";
import { EstateBoundaryEditor } from "@/components/company/estate-boundary-editor";
import Link from "next/link";

export default async function EstatesPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;

  try {
    const client = await getServerApiClient();
    const estates = await client.land.listCompanyEstates({ companyId });

    return <div className="space-y-8"><EstateBoundaryEditor companyId={companyId} />{estates.length === 0 ? <div className="rounded-2xl border border-dashed border-border p-8 text-center"><h2 className="font-semibold">No registered estates yet</h2><p className="mt-2 text-sm text-muted-foreground">Your first validated estate will appear here.</p></div> : <div className="grid gap-4 sm:grid-cols-2">{estates.map((estate) => <Link href={`/company/${companyId}/estates/${estate.id}`} key={estate.id} className="rounded-2xl border border-border bg-card p-5 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><div className="flex items-start justify-between gap-4"><div><h2 className="font-semibold">{estate.name}</h2><p className="mt-1 text-sm text-muted-foreground">{estate.district ? `${estate.district}, ` : ""}{estate.region}</p></div><span className="rounded-full border border-border px-2.5 py-1 text-xs font-medium capitalize">{estate.status}</span></div>{estate.priceFrom ? <p className="mt-5 text-sm"><span className="text-muted-foreground">From </span><strong>GHS {Number(estate.priceFrom).toLocaleString()}</strong></p> : null}<p className="mt-4 text-sm font-semibold">Manage plots →</p></Link>)}</div>}</div>;
  } catch {
    return <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">Estate inventory could not be loaded. Confirm your company is approved and try again.</div>;
  }
}
