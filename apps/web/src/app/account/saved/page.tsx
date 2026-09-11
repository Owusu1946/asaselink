import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Bookmark01Icon } from "@hugeicons/core-free-icons";
import { EmptyState } from "@/components/dashboard/empty-state";
import { buttonVariants } from "@asaselink/ui/components/button";

export default function SavedParcelsPage() { return <EmptyState icon={<HugeiconsIcon icon={Bookmark01Icon} size={24} />} title="No saved parcels" description="Bookmark plots to track their pricing and verification updates." action={<Link href="/" className={buttonVariants({ size: "sm" })}>Search verified plots</Link>} />; }
