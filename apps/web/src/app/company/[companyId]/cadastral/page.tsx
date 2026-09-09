"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { FileValidationIcon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { CompanyPageShell } from "@/components/dashboard/company-page-shell";
import { EmptyState } from "@/components/dashboard/empty-state";
import { buttonVariants } from "@asaselink/ui/components/button";

export default function CadastralRecordsPage() {
  return (
    <CompanyPageShell
      title="Cadastral Survey Records"
      description="Licensed surveyor pillars, coordinate logs, and Lands Commission survey verification files."
      breadcrumb="Cadastral Records"
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
          <span className="hidden sm:inline">Upload survey plan</span>
        </button>
      }
    >
      <EmptyState
        icon={
          <HugeiconsIcon icon={FileValidationIcon} size={24} className="text-muted-foreground" />
        }
        title="Survey records under review"
        description="Official surveyor reports, GIS boundary shapefiles, and beacon coordinates will be recorded here."
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
            <span>Upload Cadastral Plan</span>
          </button>
        }
      />
    </CompanyPageShell>
  );
}
