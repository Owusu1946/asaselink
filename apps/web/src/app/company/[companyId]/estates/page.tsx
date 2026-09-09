"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Building02Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { CompanyPageShell } from "@/components/dashboard/company-page-shell";
import { EmptyState } from "@/components/dashboard/empty-state";
import { buttonVariants } from "@asaselink/ui/components/button";

export default function RegisteredEstatesPage() {
  return (
    <CompanyPageShell
      title="Registered Estates"
      description="Manage and review your approved cadastral estate layouts and verified concessions."
      breadcrumb="Registered Estates"
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
          <span className="hidden sm:inline">Register estate</span>
        </button>
      }
    >
      <EmptyState
        icon={<HugeiconsIcon icon={Building02Icon} size={24} className="text-muted-foreground" />}
        title="No registered estates yet"
        description="Submit your estate cadastral masterplan for verification by the Lands Commission to begin onboarding plots."
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
            <span>Register First Estate</span>
          </button>
        }
      />
    </CompanyPageShell>
  );
}
