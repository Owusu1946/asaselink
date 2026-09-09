"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Bookmark01Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { AccountPageShell } from "@/components/dashboard/account-page-shell";
import { EmptyState } from "@/components/dashboard/empty-state";
import { buttonVariants } from "@asaselink/ui/components/button";

export default function SavedParcelsPage() {
  return (
    <AccountPageShell
      title="Saved Parcels"
      description="Bookmarked plots, price alerts, and favorite estate layouts saved for future review."
      breadcrumb="Saved Parcels"
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
          <span className="hidden sm:inline">Browse plots</span>
        </Link>
      }
    >
      <EmptyState
        icon={<HugeiconsIcon icon={Bookmark01Icon} size={24} className="text-muted-foreground" />}
        title="No saved parcels"
        description="Bookmark plots while browsing masterplans to track pricing adjustments and survey verification updates."
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
            <span>Search Verified Plots</span>
          </Link>
        }
      />
    </AccountPageShell>
  );
}
