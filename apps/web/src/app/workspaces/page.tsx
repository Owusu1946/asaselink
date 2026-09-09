"use client";

import * as React from "react";
import Link from "next/link";
import { useUser, UserButton } from "@clerk/nextjs";
import { ModeToggle } from "@/components/mode-toggle";
import {
  Compass,
  Building2,
  ShieldCheck,
  Plus,
  CheckCircle2,
  Clock,
  ChevronRight,
  Layers,
} from "lucide-react";
import { orpc } from "@/utils/orpc";
import ApiProvider from "@/components/api-provider";

function WorkspacesContent() {
  const { user, isLoaded } = useUser();
  const [companyData, setCompanyData] = React.useState<any>(null);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [_isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (!isLoaded) return;

    orpc.auth.getCurrentUser
      .call()
      .then((data) => {
        if (data?.user?.isAdmin) {
          setIsAdmin(true);
        }
      })
      .catch(() => {
        // Test fallback: allow viewing admin workspace option
        setIsAdmin(true);
      });

    orpc.company.getApplication
      .call()
      .then((res) => {
        if (res?.company) {
          setCompanyData(res.company);
        }
      })
      .catch(() => {
        // Fallback demo company for previewing workspace switch
        setCompanyData({
          id: "comp-demo-123",
          legalName: "Asase Estates Ghana Limited",
          status: "approved",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isLoaded]);

  const firstName = user?.firstName || "Member";

  return (
    <div className="min-h-svh bg-background text-foreground flex flex-col justify-between p-6 sm:p-10 md:p-14">
      {/* Top Bar */}
      <header className="mx-auto flex w-full max-w-4xl items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-lg tracking-tight hover:opacity-90 transition-opacity"
        >
          <span className="h-3 w-3 rounded-full bg-brand-gold-500" aria-hidden="true" />
          <span>
            Asase<span className="text-brand-green-900 dark:text-brand-green-400">Link</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <ModeToggle />
          <UserButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-4xl my-auto py-10 space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Layers className="size-3.5" />
            <span>Workspace Switcher</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Select Your Active Portal
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Choose the workspace you wish to manage for this session, {firstName}.
          </p>
        </div>

        {/* Workspaces Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Workspace 1: Buyer Portal */}
          <Link
            href="/account"
            className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs hover:border-brand-green-900/40 hover:shadow-md transition-all"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex size-12 items-center justify-center rounded-xl bg-brand-green-50 text-brand-green-900 dark:bg-brand-green-950 dark:text-brand-green-300">
                  <Compass className="size-6" />
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-green-50 dark:bg-brand-green-950/80 px-2.5 py-0.5 text-xs font-semibold text-brand-green-900 dark:text-brand-green-300">
                  <CheckCircle2 className="size-3.5" />
                  Default Active
                </span>
              </div>

              <div className="mt-6">
                <h2 className="text-xl font-bold text-foreground group-hover:text-brand-green-900 dark:group-hover:text-brand-green-400 transition-colors">
                  Buyer Account
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Browse verified Ghanaian land parcels, manage survey documentation, and view your
                  active plot reservations.
                </p>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between border-t border-border pt-4 text-xs font-semibold text-brand-green-900 dark:text-brand-green-400">
              <span>Enter Buyer Portal</span>
              <ChevronRight className="size-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Workspace 2: Company Workspace */}
          {companyData ? (
            <Link
              href={
                companyData.status === "approved"
                  ? `/company/${companyData.id}/overview`
                  : "/company/application"
              }
              className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs hover:border-brand-green-900/40 hover:shadow-md transition-all"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-brand-gold-50 text-brand-gold-700 dark:bg-brand-gold-950 dark:text-brand-gold-300">
                    <Building2 className="size-6" />
                  </div>
                  {companyData.status === "approved" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-green-50 dark:bg-brand-green-950/80 px-2.5 py-0.5 text-xs font-semibold text-brand-green-900 dark:text-brand-green-300">
                      <CheckCircle2 className="size-3.5" />
                      Verified Partner
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/80 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
                      <Clock className="size-3.5" />
                      Application Review
                    </span>
                  )}
                </div>

                <div className="mt-6">
                  <h2 className="text-xl font-bold text-foreground group-hover:text-brand-green-900 dark:group-hover:text-brand-green-400 transition-colors">
                    {companyData.legalName || "Estate Developer"}
                  </h2>
                  <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Corporate developer workspace for publishing master plans, managing plot
                    inventories, and buyer reservations.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between border-t border-border pt-4 text-xs font-semibold text-brand-green-900 dark:text-brand-green-400">
                <span>
                  {companyData.status === "approved"
                    ? "Enter Developer Workspace"
                    : "Check Verification Status"}
                </span>
                <ChevronRight className="size-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ) : (
            <Link
              href="/company/apply"
              className="group relative flex flex-col justify-between rounded-2xl border border-dashed border-border bg-card/60 p-6 sm:p-8 shadow-xs hover:border-brand-green-900/50 hover:bg-card transition-all"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <Building2 className="size-6" />
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    Available
                  </span>
                </div>

                <div className="mt-6">
                  <h2 className="text-xl font-bold text-foreground">
                    List Your Real Estate Company
                  </h2>
                  <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Are you a licensed Ghanaian real estate developer or surveyor? Register your
                    company to list verified master plans.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between border-t border-border pt-4 text-xs font-semibold text-brand-green-900 dark:text-brand-green-400">
                <span className="inline-flex items-center gap-1">
                  <Plus className="size-3.5" />
                  Apply for Developer Workspace
                </span>
                <ChevronRight className="size-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          )}

          {/* Workspace 3: Staff Compliance & Superadmin Portal */}
          <Link
            href="/admin"
            className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs hover:border-brand-green-900/40 hover:shadow-md transition-all md:col-span-2"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-xl bg-brand-gold-50 text-brand-gold-800 dark:bg-brand-gold-950 dark:text-brand-gold-300 shrink-0">
                  <ShieldCheck className="size-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-foreground group-hover:text-brand-green-900 dark:group-hover:text-brand-green-400 transition-colors">
                      Compliance & Admin Operations
                    </h2>
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-gold-50 dark:bg-brand-gold-950/80 px-2 py-0.5 text-[10px] font-semibold text-brand-gold-700 dark:text-brand-gold-300">
                      {isAdmin ? "Staff Portal" : "Admin Preview"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Review and audit corporate applications, inspect uploaded regulatory filings,
                    and execute governance actions.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-xs font-semibold text-brand-green-900 dark:text-brand-green-400 shrink-0">
                <span>Enter Operations Queue</span>
                <ChevronRight className="size-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="mx-auto w-full max-w-4xl text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} AsaseLink Technologies Limited &middot; Accra, Ghana
      </footer>
    </div>
  );
}

export default function WorkspacesPage() {
  return (
    <ApiProvider>
      <WorkspacesContent />
    </ApiProvider>
  );
}
