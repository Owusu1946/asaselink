import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { File01Icon } from "@hugeicons/core-free-icons";
import { EmptyState } from "@/components/dashboard/empty-state";
import { buttonVariants } from "@asaselink/ui/components/button";

export default function DocumentVaultPage() { return <EmptyState icon={<HugeiconsIcon icon={File01Icon} size={24} />} title="Document vault is empty" description="Signed deeds, site plans, and official receipts will be archived here." action={<Link href="/" className={buttonVariants({ size: "sm" })}>Find land parcels</Link>} />; }
