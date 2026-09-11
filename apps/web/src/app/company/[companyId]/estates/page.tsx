import { getServerApiClient } from "@/utils/server-orpc";

export default async function EstatesPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;

  try {
    const client = await getServerApiClient();
    const estates = await client.land.listCompanyEstates({ companyId });

    if (estates.length === 0) {
      return <div className="rounded-2xl border border-dashed border-border p-10 text-center sm:p-14"><h2 className="font-semibold">No registered estates</h2><p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Create an estate boundary before adding its individual plots. The boundary editor is the next delivery milestone.</p></div>;
    }

    return <div className="grid gap-4 sm:grid-cols-2">{estates.map((estate) => <article key={estate.id} className="rounded-2xl border border-border bg-card p-5"><div className="flex items-start justify-between gap-4"><div><h2 className="font-semibold">{estate.name}</h2><p className="mt-1 text-sm text-muted-foreground">{estate.district ? `${estate.district}, ` : ""}{estate.region}</p></div><span className="rounded-full border border-border px-2.5 py-1 text-xs font-medium capitalize">{estate.status}</span></div>{estate.priceFrom ? <p className="mt-5 text-sm"><span className="text-muted-foreground">From </span><strong>GHS {Number(estate.priceFrom).toLocaleString()}</strong></p> : null}</article>)}</div>;
  } catch {
    return <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">Estate inventory could not be loaded. Confirm your company is approved and try again.</div>;
  }
}
