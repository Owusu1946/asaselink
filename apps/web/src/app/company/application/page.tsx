"use client";

import * as React from "react";
import Link from "next/link";
import { ModeToggle } from "@/components/mode-toggle";
import { Button, buttonVariants } from "@asaselink/ui/components/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle02Icon,
  AlertCircleIcon,
  ArrowRight01Icon,
  File01Icon,
  Loading03Icon,
} from "@hugeicons/core-free-icons";
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
  const application = appData?.application;
  const documents = appData?.documents || [];

  if (!isLoading && (!company || loadError)) {
    return (
      <main className="min-h-svh grid place-items-center p-6 bg-background text-foreground">
        <div className="max-w-md w-full rounded-2xl border border-border bg-card p-8 text-center space-y-4">
          <div className="size-12 mx-auto rounded-full bg-secondary flex items-center justify-center text-foreground">
            <HugeiconsIcon icon={AlertCircleIcon} size={24} />
          </div>
          <h1 className="font-semibold text-lg">Application not found</h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            We couldn&apos;t load your company application. Please try again or start a new application.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={loadData}>
              Try Again
            </Button>
            <Link href="/company/apply" className={buttonVariants({ size: "sm" })}>
              Start Application
            </Link>
          </div>
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
    <div className="min-h-svh bg-background text-foreground flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-border/60 bg-background/95 backdrop-blur-sm sticky top-0 z-30">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-lg tracking-tight hover:opacity-90 transition-opacity"
          >
            <span className="h-3.5 w-3.5 rounded-full bg-brand-green-900 dark:bg-brand-green-400" aria-hidden="true" />
            <span>
              Asase<span className="text-brand-green-900 dark:text-brand-green-400">Link</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={isLoading}
              className="text-xs gap-1.5 h-8 rounded-full"
            >
              <HugeiconsIcon icon={Loading03Icon} size={14} className={isLoading ? "animate-spin" : ""} />
              <span>Refresh</span>
            </Button>
            <ModeToggle />
          </div>
        </div>
      </header>

      {/* Main Status Container */}
      <main className="flex-1 flex flex-col justify-center px-6 py-12 sm:py-16">
        <div className="mx-auto w-full max-w-xl space-y-8">
          {/* Status Header */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold">
              {isApproved ? (
                <span className="text-brand-green-800 dark:text-brand-green-300 bg-brand-green-50 dark:bg-brand-green-950/60 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} /> Verified Company
                </span>
              ) : isChangesRequested ? (
                <span className="text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <HugeiconsIcon icon={AlertCircleIcon} size={15} /> Action Required
                </span>
              ) : isRejected ? (
                <span className="text-destructive bg-destructive/10 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <HugeiconsIcon icon={AlertCircleIcon} size={15} /> Not Approved
                </span>
              ) : (
                <span className="text-foreground bg-secondary px-3 py-1 rounded-full flex items-center gap-1.5">
                  <HugeiconsIcon icon={Loading03Icon} size={15} className="animate-spin" /> Application Under Review
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight text-foreground text-balance">
              {isApproved
                ? "Your company is verified!"
                : isChangesRequested
                ? "Updates requested"
                : isRejected
                ? "Application not approved"
                : "We're reviewing your application"}
            </h1>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              {isApproved
                ? "Your company has been verified on AsaseLink. You can now access your workspace to list plots."
                : isChangesRequested
                ? "Please update your submitted documents so we can complete your verification."
                : isRejected
                ? "Your application was not approved. You can contact support for more details."
                : `We received the application for ${company.legalName}. Verification usually takes 24–48 hours.`}
            </p>
          </div>

          {/* Action CTA */}
          {isApproved && (
            <div className="pt-2">
              <Link
                href={`/company/${company.id}/overview`}
                className={buttonVariants({
                  className: "h-12 px-7 rounded-xl font-semibold text-sm gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-colors",
                })}
                style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
              >
                <span>Open Company Workspace</span>
                <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
              </Link>
            </div>
          )}

          {isChangesRequested && (
            <div className="pt-2">
              <Link
                href="/company/apply/documents"
                className={buttonVariants({
                  className: "h-12 px-7 rounded-xl font-semibold text-sm gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-colors",
                })}
                style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
              >
                <span>Update Documents</span>
                <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
              </Link>
            </div>
          )}

          {/* Submitted Summary */}
          <div className="p-5 rounded-2xl border border-border bg-card space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Submitted Details
            </span>

            <div className="space-y-2 text-xs text-muted-foreground pt-1">
              <div className="flex justify-between py-1 border-b border-border/40">
                <span>Company Name</span>
                <span className="font-semibold text-foreground">{company.legalName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/40">
                <span>Registration Number</span>
                <span className="font-mono text-foreground">{company.registrationNumber}</span>
              </div>
              {application?.repFullName && (
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span>Representative</span>
                  <span className="text-foreground">{application.repFullName}</span>
                </div>
              )}
              <div className="flex justify-between py-1">
                <span>Documents Uploaded</span>
                <span className="text-foreground">{documents.length} attached</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 py-5 text-center text-xs text-muted-foreground">
        <div className="mx-auto max-w-5xl px-6 flex items-center justify-between">
          <span>&copy; {new Date().getFullYear()} AsaseLink</span>
          <Link href="/" className="hover:underline">Home</Link>
        </div>
      </footer>
    </div>
  );
}

export default function CompanyApplicationPage() {
  return (
    <ApiProvider clerkEnabled>
      <StatusContent />
    </ApiProvider>
  );
}
