"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { UserGroupIcon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { CompanyPageShell } from "@/components/dashboard/company-page-shell";
import { EmptyState } from "@/components/dashboard/empty-state";
import { buttonVariants } from "@asaselink/ui/components/button";

export default function CompanyStaffPage() {
  return (
    <CompanyPageShell
      title="Company Staff"
      description="Authorized officers, surveyors, legal counsel, and sales managers with access to this workspace."
      breadcrumb="Company Staff"
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
          <span className="hidden sm:inline">Invite member</span>
        </button>
      }
    >
      <EmptyState
        icon={<HugeiconsIcon icon={UserGroupIcon} size={24} className="text-muted-foreground" />}
        title="Workspace team roster"
        description="Invite licensed surveyors, attorneys, and sales personnel to collaborate on parcel reservations and deed transfers."
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
            <span>Invite Team Member</span>
          </button>
        }
      />
    </CompanyPageShell>
  );
}
