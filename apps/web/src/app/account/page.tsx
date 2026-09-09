"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { BuyerAccountNav } from "@/components/dashboard/buyer-account-nav";
import { EmptyState } from "@/components/dashboard/empty-state";
import { buttonVariants } from "@asaselink/ui/components/button";
import { Compass, FileCheck, Landmark, CheckCircle2, Shield } from "lucide-react";
import ApiProvider from "@/components/api-provider";

function AccountContent() {
  const { user } = useUser();
  const firstName = user?.firstName || "Buyer";

  return (
    <div className="min-h-svh bg-background text-foreground">
      <BuyerAccountNav />

      <main className="mx-auto max-w-6xl p-6 sm:p-10 space-y-8">
        {/* Header Greeting */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Akwaaba, {firstName}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your verified land reservations, survey confirmations, and legal documents.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-xl border border-brand-green-300 bg-brand-green-50 px-3.5 py-1.5 text-xs font-medium text-brand-green-900 dark:border-brand-green-800 dark:bg-brand-green-950/60 dark:text-brand-green-300">
            <CheckCircle2 className="size-4" />
            <span>Profile Ready &middot; Verified Buyer</span>
          </div>
        </div>

        {/* Action / Status Bento Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Card 1: Explore Estates */}
          <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-xs">
            <div>
              <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-brand-green-50 text-brand-green-900 dark:bg-brand-green-950 dark:text-brand-green-300">
                <Compass className="size-5" />
              </div>
              <h2 className="text-base font-semibold text-foreground">Explore Verified Estates</h2>
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
                  className: "w-full justify-center font-medium",
                })}
              >
                Browse directory (Coming soon)
              </Link>
            </div>
          </div>

          {/* Card 2: Company Setup / List estate */}
          <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-xs">
            <div>
              <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-brand-gold-50 text-brand-gold-700 dark:bg-brand-gold-950 dark:text-brand-gold-300">
                <Landmark className="size-5" />
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
                  className: "w-full justify-center font-medium",
                })}
              >
                Apply for company listing
              </Link>
            </div>
          </div>

          {/* Card 3: Security & Verification */}
          <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-xs">
            <div>
              <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-secondary text-foreground">
                <Shield className="size-5" />
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
                    "w-full justify-center font-medium text-xs text-muted-foreground hover:text-foreground",
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
            icon={<FileCheck className="size-6" />}
            title="No active plot reservations"
            description="When you select and reserve a verified estate plot, your reservation agreement and payment schedule will appear here."
            action={
              <Link
                href="/"
                className={buttonVariants({
                  variant: "default",
                  size: "default",
                  className: "font-medium",
                })}
              >
                Explore available plots
              </Link>
            }
          />
        </section>
      </main>
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
