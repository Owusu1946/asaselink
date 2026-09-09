"use client";

import * as React from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SidebarRight01Icon,
  Compass01Icon,
  FileValidationIcon,
  Building02Icon,
  CheckmarkCircle02Icon,
  ShieldCheckIcon,
  Search01Icon,
  PlusSignIcon,
  Location01Icon,
} from "@hugeicons/core-free-icons";
import { AccountSidebar } from "@/components/dashboard/account-sidebar";
import { EmptyState } from "@/components/dashboard/empty-state";
import { buttonVariants } from "@asaselink/ui/components/button";
import ApiProvider from "@/components/api-provider";
import { cn } from "@asaselink/ui/lib/utils";

function AccountContent() {
  const { user } = useUser();
  const firstName = user?.firstName || "Buyer";

  // Sidebar collapse state (ChatGPT style)
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);
  const [selectedSearch, setSelectedSearch] = React.useState<string | null>(null);

  return (
    <div className="min-h-svh bg-background text-foreground flex">
      {/* Sleek ChatGPT-Inspired Sidebar */}
      <AccountSidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        activeSearchId={selectedSearch || undefined}
        onSelectSearch={(id) => setSelectedSearch(id)}
      />

      {/* Main Content Area */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out",
          sidebarCollapsed ? "lg:pl-[68px]" : "lg:pl-[260px]",
        )}
      >
        {/* Sleek Minimal Top Navigation Bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 sm:px-8 backdrop-blur-md">
          <div className="flex items-center gap-3">
            {/* Mobile / Collapsed sidebar toggle button */}
            <button
              type="button"
              onClick={() => {
                if (window.innerWidth < 1024) {
                  setMobileSidebarOpen(true);
                } else {
                  setSidebarCollapsed(!sidebarCollapsed);
                }
              }}
              className="flex size-8 items-center justify-center rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label="Toggle sidebar"
            >
              <HugeiconsIcon icon={SidebarRight01Icon} size={18} />
            </button>

            {/* Quick Breadcrumb / Context */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Account</span>
              <span>/</span>
              <span>Overview</span>
            </div>
          </div>

          {/* Quick Search Input */}
          <div className="hidden md:flex items-center gap-2 max-w-sm w-full mx-4">
            <div className="relative w-full">
              <HugeiconsIcon
                icon={Search01Icon}
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Search estates, parcel IDs, cadastral records..."
                className="w-full rounded-xl border border-border bg-muted/50 py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-brand-green-800 focus:bg-background focus:outline-none focus:ring-1 focus:ring-brand-green-800 transition-all"
              />
            </div>
          </div>

          {/* Quick Action Button */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className={buttonVariants({
                variant: "default",
                size: "sm",
                className: "gap-1.5 text-xs font-medium rounded-xl h-8 px-3",
              })}
            >
              <HugeiconsIcon icon={PlusSignIcon} size={14} />
              <span className="hidden sm:inline">New exploration</span>
            </Link>
          </div>
        </header>

        {/* Account Page Body */}
        <main className="mx-auto w-full max-w-6xl p-6 sm:p-10 space-y-8 flex-1">
          {/* Header Greeting */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Akwaaba, {firstName}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage your verified land reservations, cadastral survey confirmations, and official
                title documentation.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-xl border border-brand-green-300 bg-brand-green-50 px-3.5 py-1.5 text-xs font-medium text-brand-green-900 dark:border-brand-green-800 dark:bg-brand-green-950/60 dark:text-brand-green-300 shrink-0">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} />
              <span>Profile Ready · Verified Buyer</span>
            </div>
          </div>

          {/* Selected Search Banner (if clicked from ChatGPT sidebar) */}
          {selectedSearch && (
            <div className="flex items-center justify-between rounded-xl border border-brand-green-200 bg-brand-green-50/60 p-4 text-xs dark:border-brand-green-900/60 dark:bg-brand-green-950/30">
              <div className="flex items-center gap-2.5">
                <HugeiconsIcon
                  icon={Location01Icon}
                  size={18}
                  className="text-brand-green-800 dark:text-brand-green-400 shrink-0"
                />
                <div>
                  <span className="font-semibold text-foreground">Loaded exploration session:</span>{" "}
                  <span className="text-muted-foreground">
                    Filtering cadastral boundaries for current selection.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSearch(null)}
                className="text-xs font-medium text-brand-green-800 hover:underline dark:text-brand-green-400"
              >
                Clear selection
              </button>
            </div>
          )}

          {/* Action / Status Bento Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Card 1: Explore Estates */}
            <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-xs hover:border-border/80 transition-colors">
              <div>
                <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-brand-green-50 text-brand-green-900 dark:bg-brand-green-950 dark:text-brand-green-300">
                  <HugeiconsIcon icon={Compass01Icon} size={20} />
                </div>
                <h2 className="text-base font-semibold text-foreground">
                  Explore Verified Estates
                </h2>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                  Search verified land parcels by district, estate master plan, and cadastral survey
                  boundaries.
                </p>
              </div>
              <div className="mt-6">
                <Link
                  href="/explore"
                  className={buttonVariants({
                    variant: "outline",
                    size: "sm",
                    className: "w-full justify-center font-medium rounded-xl text-xs",
                  })}
                >
                  Browse directory (Coming soon)
                </Link>
              </div>
            </div>

            {/* Card 2: Company Setup / List estate */}
            <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-xs hover:border-border/80 transition-colors">
              <div>
                <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-brand-gold-50 text-brand-gold-700 dark:bg-brand-gold-950 dark:text-brand-gold-300">
                  <HugeiconsIcon icon={Building02Icon} size={20} />
                </div>
                <h2 className="text-base font-semibold text-foreground">Land Company Workspace</h2>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                  Are you an estate developer or customary landholder? Apply to verify and list your
                  layout.
                </p>
              </div>
              <div className="mt-6">
                <Link
                  href="/company/apply"
                  className={buttonVariants({
                    variant: "outline",
                    size: "sm",
                    className: "w-full justify-center font-medium rounded-xl text-xs",
                  })}
                >
                  Apply for company listing
                </Link>
              </div>
            </div>

            {/* Card 3: Security & Verification */}
            <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-xs hover:border-border/80 transition-colors">
              <div>
                <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-secondary text-foreground">
                  <HugeiconsIcon icon={ShieldCheckIcon} size={20} />
                </div>
                <h2 className="text-base font-semibold text-foreground">Document Protection</h2>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                  All reservations are cryptographically protected and reconciled with Ghana Lands
                  Commission data.
                </p>
              </div>
              <div className="mt-6">
                <Link
                  href="/onboarding/profile"
                  className={buttonVariants({
                    variant: "ghost",
                    size: "sm",
                    className:
                      "w-full justify-center font-medium text-xs text-muted-foreground hover:text-foreground rounded-xl",
                  })}
                >
                  Update contact profile &rarr;
                </Link>
              </div>
            </div>
          </div>

          {/* Empty State: Reservations */}
          <section aria-labelledby="reservations-heading" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2
                id="reservations-heading"
                className="text-lg font-semibold tracking-tight text-foreground"
              >
                My Land Reservations
              </h2>
              <span className="text-xs text-muted-foreground font-mono">0 active</span>
            </div>

            <EmptyState
              icon={<HugeiconsIcon icon={FileValidationIcon} size={24} />}
              title="No active plot reservations"
              description="When you select and reserve a verified estate plot, your reservation agreement and payment schedule will appear here."
              action={
                <Link
                  href="/"
                  className={buttonVariants({
                    variant: "default",
                    size: "default",
                    className: "font-medium rounded-xl text-xs px-4 py-2",
                  })}
                >
                  Explore available plots
                </Link>
              }
            />
          </section>
        </main>
      </div>
    </div>
  );
}

export default function BuyerAccountPage() {
  return (
    <ApiProvider clerkEnabled>
      <AccountContent />
    </ApiProvider>
  );
}
