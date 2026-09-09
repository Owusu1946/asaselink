"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { ModeToggle } from "@/components/mode-toggle";
import { Building2, Layers, ShieldCheck } from "lucide-react";

interface CompanyWorkspaceNavProps {
  companyName?: string;
  isVerified?: boolean;
}

export function CompanyWorkspaceNav({
  companyName = "Estate Developer",
  isVerified = true,
}: CompanyWorkspaceNavProps) {
  const params = useParams();
  const pathname = usePathname();
  const companyId = (params?.companyId as string) || "current";

  const overviewHref = `/company/${companyId}/overview`;

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur-sm sm:px-10">
      {/* Brand & Workspace Name */}
      <div className="flex items-center gap-6 sm:gap-8">
        <Link
          href={overviewHref}
          className="flex items-center gap-2 font-semibold text-lg tracking-tight hover:opacity-90 transition-opacity"
        >
          <span className="h-3 w-3 rounded-full bg-brand-gold-500" aria-hidden="true" />
          <span>
            Asase<span className="text-brand-green-900 dark:text-brand-green-400">Link</span>
          </span>
        </Link>

        {/* Workspace Pill */}
        <div className="hidden lg:flex items-center gap-2 rounded-lg border border-border bg-muted/60 px-2.5 py-1 text-xs">
          <Building2 className="size-3.5 text-muted-foreground" />
          <span className="max-w-[160px] truncate font-medium text-foreground">{companyName}</span>
          {isVerified ? (
            <span className="inline-flex items-center gap-1 rounded bg-brand-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-brand-green-900 dark:bg-brand-green-950 dark:text-brand-green-300">
              <ShieldCheck className="size-2.5" />
              Verified
            </span>
          ) : (
            <span className="inline-flex items-center rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-900 dark:bg-amber-950 dark:text-amber-300">
              Review
            </span>
          )}
        </div>

        {/* Tab Navigation */}
        <nav aria-label="Company navigation" className="hidden md:flex items-center gap-5 text-sm">
          <Link
            href={overviewHref}
            className={`font-medium transition-colors ${
              pathname === overviewHref
                ? "text-brand-green-900 dark:text-brand-green-400 font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Overview
          </Link>
          <span
            className="cursor-not-allowed font-medium text-muted-foreground/60 select-none text-xs uppercase tracking-wider"
            title="Available in Phase 2"
          >
            Estates (Phase 2)
          </span>
          <Link
            href="/workspaces"
            className="inline-flex items-center gap-1.5 font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Layers className="size-3.5" />
            <span>Switch Workspace</span>
          </Link>
        </nav>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex flex-col text-right text-xs">
          <span className="font-semibold text-foreground">{companyName}</span>
          <span className="text-muted-foreground">Corporate Portal</span>
        </div>
        <ModeToggle />
        <UserButton />
      </div>
    </header>
  );
}
