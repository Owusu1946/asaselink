"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Location01Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { CompanyPageShell } from "@/components/dashboard/company-page-shell";
import { EmptyState } from "@/components/dashboard/empty-state";
import { buttonVariants } from "@asaselink/ui/components/button";

export default function ManagedPlotsPage() {
  return (
    <CompanyPageShell
      title="Managed Plots"
      description="Demarcated plots, reservation allocations, and buyer ownership deeds across your estates."
      breadcrumb="Managed Plots"
      action={
        <button
          type="button"
          className={buttonVariants({
            variant: "default",
            size: "sm",
            className:
              "gap-1.5 text-xs font-medium rounded-xl h-8 px-3 bg-brand-green-900 text-white hover:bg-brand-green-800 shadow-xs",
          })}
        >
          <HugeiconsIcon icon={PlusSignIcon} size={14} />
          <span className="hidden sm:inline">Add plot record</span>
        </button>
      }
    >
      <EmptyState
        icon={<HugeiconsIcon icon={Location01Icon} size={24} className="text-muted-foreground" />}
        title="No plots demarcated yet"
        description="Individual plots will appear here once an estate masterplan is approved and subdivided into parcel beacons."
        action={
          <button
            type="button"
            className={buttonVariants({
              variant: "default",
              size: "sm",
              className:
                "gap-1.5 text-xs font-medium rounded-xl h-9 px-4 bg-brand-green-900 text-white hover:bg-brand-green-800 shadow-xs",
            })}
          >
            <HugeiconsIcon icon={PlusSignIcon} size={14} />
            <span>Demarcate New Plot</span>
          </button>
        }
      />
    </CompanyPageShell>
  );
}
