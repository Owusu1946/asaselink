"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { File01Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { AccountPageShell } from "@/components/dashboard/account-page-shell";
import { EmptyState } from "@/components/dashboard/empty-state";
import { buttonVariants } from "@asaselink/ui/components/button";

export default function DocumentVaultPage() {
  return (
    <AccountPageShell
      title="Document Vault"
      description="Official Lands Commission search reports, cadastral survey plans, and indenture deeds."
      breadcrumb="Document Vault"
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
          <span className="hidden sm:inline">Request title search</span>
        </Link>
      }
    >
      <EmptyState
        icon={<HugeiconsIcon icon={File01Icon} size={24} className="text-muted-foreground" />}
        title="Document vault is empty"
        description="When you reserve or purchase a verified plot, your signed deeds, site plans, and Lands Commission receipts are automatically archived here."
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
            <span>Find Land Parcels</span>
          </Link>
        }
      />
    </AccountPageShell>
  );
}
