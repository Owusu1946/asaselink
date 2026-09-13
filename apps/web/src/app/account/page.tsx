import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Building02Icon, Compass01Icon, FileValidationIcon } from "@hugeicons/core-free-icons";
import { EmptyState } from "@/components/dashboard/empty-state";
import { buttonVariants } from "@asaselink/ui/components/button";
import { getServerApiClient } from "@/utils/server-orpc";

export default async function AccountPage() {
  const api = await getServerApiClient();
  const reservations = await api.reservations.listMine() as Record<string, unknown>[];
  const latest = reservations[0];
  return <><div className="grid gap-6 md:grid-cols-2"><Link href="/" className="rounded-2xl border border-border bg-card p-6 transition-colors hover:border-brand-green-700"><HugeiconsIcon icon={Compass01Icon} size={22} /><h2 className="mt-4 font-semibold">Explore verified estates</h2><p className="mt-1 text-sm text-muted-foreground">Search parcels by district, master plan, and cadastral boundary.</p></Link><Link href="/company/apply" className="rounded-2xl border border-border bg-card p-6 transition-colors hover:border-brand-green-700"><HugeiconsIcon icon={Building02Icon} size={22} /><h2 className="mt-4 font-semibold">Company workspace</h2><p className="mt-1 text-sm text-muted-foreground">Apply to verify and list an estate development.</p></Link></div>{latest ? <section className="rounded-2xl border border-border bg-card p-6"><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Latest reservation</p><div className="mt-3 flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-xl font-semibold">{String(latest.estateName)} · Plot {String(latest.plotNumber)}</h2><p className="mt-1 text-sm text-muted-foreground">Reference {String(latest.reference)} · {String(latest.status).replaceAll("_", " ")}</p></div><Link href="/account/reservations" className={buttonVariants({ size: "sm" })}>View reservations</Link></div></section> : <EmptyState icon={<HugeiconsIcon icon={FileValidationIcon} size={24} />} title="No active plot reservations" description="Reserved plots and their verified documents will appear here." action={<Link href="/" className={buttonVariants({ size: "sm" })}>Explore available plots</Link>} />}</>;
}
