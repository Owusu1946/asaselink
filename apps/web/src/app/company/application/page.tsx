"use client";

import * as React from "react";
import Link from "next/link";
import { ModeToggle } from "@/components/mode-toggle";
import { Button, buttonVariants } from "@asaselink/ui/components/button";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  FileSearch,
  Building,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { orpc } from "@/utils/orpc";
import ApiProvider from "@/components/api-provider";

function StatusContent() {
  const [appData, setAppData] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState(false);

  const loadData = React.useCallback(() => {
    setIsLoading(true);
    setLoadError(false);
    orpc.company.getApplication
      .call()
      .then((data) => {
        setAppData(data);
      })
      .catch((err) => {
        console.error("Error loading application status:", err);
        setLoadError(true);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const company = appData?.company;

  if (!isLoading && (!company || loadError)) {
    return (
      <main className="min-h-svh grid place-items-center p-6">
        <div role="alert" className="max-w-md rounded-xl border border-destructive/40 bg-card p-6 text-center">
          <h1 className="font-semibold">Application unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">We could not load your company application. Refresh to try again.</p>
        </div>
      </main>
    );
  }

  if (!company) return null;

  const status = company.status || "under_review";
  const isApproved = status === "approved";
  const isChangesRequested = status === "changes_requested";
  const isRejected = status === "rejected";

  return (
    <div className="min-h-svh bg-background text-foreground flex flex-col justify-between p-6 sm:p-10 md:p-14">
      {/* Header */}
      <header className="mx-auto flex w-full max-w-2xl items-center justify-between">
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
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={loadData}
            title="Refresh status"
            disabled={isLoading}
          >
            <RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
            <span className="sr-only">Refresh status</span>
          </Button>
          <ModeToggle />
        </div>
      </header>

      {/* Main Status Container */}
      <main className="mx-auto w-full max-w-2xl my-auto py-8">
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-10 shadow-xs space-y-8">
          {/* Status Header Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Corporate Verification Status
              </div>
              <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {company.legalName}
              </h1>
            </div>

            <div>
              {isApproved ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-green-300 bg-brand-green-50 px-3 py-1 text-xs font-semibold text-brand-green-900 dark:border-brand-green-800 dark:bg-brand-green-950/60 dark:text-brand-green-300">
                  <CheckCircle2 className="size-3.5" />
                  Approved &amp; Verified
                </span>
              ) : isChangesRequested ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/40 bg-accent/30 px-3 py-1 text-xs font-semibold text-accent-foreground">
                  <AlertCircle className="size-3.5" />
                  Action Required
                </span>
              ) : isRejected ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-destructive/40 bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
                  <AlertCircle className="size-3.5" />
                  Application Rejected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-gold-300 bg-brand-gold-50 px-3 py-1 text-xs font-semibold text-brand-gold-900 dark:border-brand-gold-800 dark:bg-brand-gold-950 dark:text-brand-gold-300">
                  <Clock className="size-3.5" />
                  Under Administrative Review
                </span>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Verification Progress
            </h2>

            <ol className="relative border-l border-border ml-3 space-y-6">
              {/* Step 1 */}
              <li className="ml-6">
                <span className="absolute -left-3 flex size-6 items-center justify-center rounded-full bg-brand-green-900 text-brand-white dark:bg-brand-green-400 dark:text-brand-green-950 ring-4 ring-background">
                  <CheckCircle2 className="size-3.5" />
                </span>
                <h3 className="text-sm font-semibold text-foreground">Application Submitted</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Corporate details, representative national identification, and declarations
                  received.
                </p>
              </li>

              {/* Step 2 */}
              <li className="ml-6">
                <span
                  className={`absolute -left-3 flex size-6 items-center justify-center rounded-full ring-4 ring-background ${
                    isApproved
                      ? "bg-brand-green-900 text-brand-white dark:bg-brand-green-400 dark:text-brand-green-950"
                      : isChangesRequested
                        ? "bg-brand-gold-500 text-brand-white"
                        : "bg-brand-gold-500 text-brand-white animate-pulse"
                  }`}
                >
                  <FileSearch className="size-3.5" />
                </span>
                <h3 className="text-sm font-semibold text-foreground">
                  RGD &amp; Regulatory Verification
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Administrative team is validating Registrar General incorporation records and tax
                  identification.
                </p>
              </li>

              {/* Step 3 */}
              <li className="ml-6">
                <span
                  className={`absolute -left-3 flex size-6 items-center justify-center rounded-full ring-4 ring-background ${
                    isApproved
                      ? "bg-brand-green-900 text-brand-white dark:bg-brand-green-400 dark:text-brand-green-950"
                      : "border border-border bg-secondary text-muted-foreground"
                  }`}
                >
                  <Building className="size-3.5" />
                </span>
                <h3 className="text-sm font-semibold text-foreground">
                  Workspace &amp; Estate Activation
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Upon administrative approval, your team workspace will unlock plot boundary
                  drawing and reservation management.
                </p>
              </li>
            </ol>
          </div>

          {/* Action / Next steps */}
          <div className="pt-4 border-t border-border">
            {isApproved ? (
              <div className="space-y-3">
                <p className="text-xs text-brand-green-700 dark:text-brand-green-300 font-medium">
                  Your company verification is complete and your workspace is ready.
                </p>
                <Link
                  href={`/company/${company.id}/overview`}
                  className={buttonVariants({
                    size: "lg",
                    className: "w-full font-medium gap-2",
                  })}
                >
                  <span>Open Company Workspace</span>
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            ) : isChangesRequested ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-warning/40 bg-accent/20 p-3.5 text-xs text-accent-foreground">
                  <p className="font-semibold">Review note from administrator:</p>
                  <p className="mt-1">
                    Please provide an updated copy of the Certificate to Commence Business or
                    contact compliance.
                  </p>
                </div>
                <Link
                  href="/company/apply/documents"
                  className={buttonVariants({
                    size: "lg",
                    className: "w-full font-medium gap-2",
                  })}
                >
                  <span>Update attached documents</span>
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-secondary/30 p-4 text-xs text-muted-foreground flex items-center justify-between">
                <span>Estimated verification time: 24 &ndash; 48 hours</span>
                <Link href="/account" className="font-medium text-foreground hover:underline">
                  Return to account &rarr;
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mx-auto w-full max-w-2xl text-center text-xs text-muted-foreground pt-4">
        AsaseLink Legal Verification Desk &middot; Accra, Ghana
      </footer>
    </div>
  );
}

export default function CompanyApplicationStatusPage() {
  return (
    <ApiProvider clerkEnabled>
      <StatusContent />
    </ApiProvider>
  );
}
