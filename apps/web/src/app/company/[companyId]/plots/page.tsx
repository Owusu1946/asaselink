import Link from "next/link";
import { connection } from "next/server";
import { getServerApiClient } from "@/utils/server-orpc";

export default async function PlotsPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  await connection();
  const api = await getServerApiClient();
  const plots = await api.land.listCompanyPlots({ companyId });
  if (!plots.length) return <div className="rounded-2xl border border-dashed border-border p-12 text-center"><h2 className="font-semibold">No managed plots yet</h2><p className="mt-2 text-sm text-muted-foreground">Open a registered estate to map its first surveyed plot.</p><Link href={`/company/${companyId}/estates`} className="mt-5 inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground">Open registered estates</Link></div>;
  return <div className="overflow-hidden rounded-2xl border border-border"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-muted text-muted-foreground"><tr><th className="px-4 py-3 font-medium">Plot</th><th className="px-4 py-3 font-medium">Estate</th><th className="px-4 py-3 font-medium">Area</th><th className="px-4 py-3 font-medium">Price</th><th className="px-4 py-3 font-medium">Status</th></tr></thead><tbody>{plots.map((plot) => <tr key={plot.id} className="border-t border-border"><td className="px-4 py-3 font-semibold"><Link href={`/company/${companyId}/estates/${plot.estateId}`} className="hover:underline">{plot.plotNumber}</Link></td><td className="px-4 py-3">{plot.estateName}</td><td className="px-4 py-3">{Number(plot.areaSquareMeters).toLocaleString()} m²</td><td className="px-4 py-3">GHS {Number(plot.price).toLocaleString()}</td><td className="px-4 py-3"><span className="rounded-full border border-border px-2.5 py-1 text-xs">{plot.status}</span></td></tr>)}</tbody></table></div></div>;
}
