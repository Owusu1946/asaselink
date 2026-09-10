import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Location01Icon } from "@hugeicons/core-free-icons";
import { EmptyState } from "@/components/dashboard/empty-state";
import { buttonVariants } from "@asaselink/ui/components/button";

export default function MyReservationsPage() { return <EmptyState icon={<HugeiconsIcon icon={Location01Icon} size={24} />} title="No active reservations" description="Search verified estate concessions and reserve your preferred plot." action={<Link href="/" className={buttonVariants({ size: "sm" })}>Explore land directory</Link>} />; }
