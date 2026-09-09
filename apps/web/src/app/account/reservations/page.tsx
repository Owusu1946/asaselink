"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Location01Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { AccountPageShell } from "@/components/dashboard/account-page-shell";
import { EmptyState } from "@/components/dashboard/empty-state";
import { buttonVariants } from "@asaselink/ui/components/button";

export default function MyReservationsPage() {
  return (
    <AccountPageShell
      title="My Reservations"
      description="Active land parcel reservations, escrow statuses, and deed preparation progress across Ghana."
      breadcrumb="My Reservations"
      action={
        <Link
          href="/"
          className={buttonVariants({
            variant: "default",
            size: "sm",
            className:
              "gap-1.5 text-xs font-medium rounded-xl h-8 px-3 bg-brand-green-900 text-white hover:bg-brand-green-800",
          })}
        >
          <HugeiconsIcon icon={PlusSignIcon} size={14} />
          <span className="hidden sm:inline">Explore parcels</span>
        </Link>
      }
    >
      <EmptyState
        icon={<HugeiconsIcon icon={Location01Icon} size={24} className="text-muted-foreground" />}
        title="No active reservations"
        description="Search verified estate concessions and place a 48-hour escrow deposit to lock down your preferred plot."
        action={
          <Link
            href="/"
            className={buttonVariants({
              variant: "default",
              size: "sm",
              className:
                "gap-1.5 text-xs font-medium rounded-xl h-9 px-4 bg-brand-green-900 text-white hover:bg-brand-green-800",
            })}
          >
            <HugeiconsIcon icon={PlusSignIcon} size={14} />
            <span>Explore Land Directory</span>
          </Link>
        }
      />
    </AccountPageShell>
  );
}
