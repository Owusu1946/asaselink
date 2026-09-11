import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Building02Icon, Compass01Icon, FileValidationIcon } from "@hugeicons/core-free-icons";
import { EmptyState } from "@/components/dashboard/empty-state";
import { buttonVariants } from "@asaselink/ui/components/button";

export default function AccountPage() {
  return <><div className="grid gap-6 md:grid-cols-2"><Link href="/" className="rounded-2xl border border-border bg-card p-6 transition-colors hover:border-brand-green-700"><HugeiconsIcon icon={Compass01Icon} size={22} /><h2 className="mt-4 font-semibold">Explore verified estates</h2><p className="mt-1 text-sm text-muted-foreground">Search parcels by district, master plan, and cadastral boundary.</p></Link><Link href="/company/apply" className="rounded-2xl border border-border bg-card p-6 transition-colors hover:border-brand-green-700"><HugeiconsIcon icon={Building02Icon} size={22} /><h2 className="mt-4 font-semibold">Company workspace</h2><p className="mt-1 text-sm text-muted-foreground">Apply to verify and list an estate development.</p></Link></div><EmptyState icon={<HugeiconsIcon icon={FileValidationIcon} size={24} />} title="No active plot reservations" description="Reserved plots and their verified documents will appear here." action={<Link href="/" className={buttonVariants({ size: "sm" })}>Explore available plots</Link>} /></>;
}
