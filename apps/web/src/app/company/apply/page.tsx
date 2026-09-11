"use client";

import * as React from "react";
import Link from "next/link";
import { ModeToggle } from "@/components/mode-toggle";
import { buttonVariants } from "@asaselink/ui/components/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Building02Icon,
  UserCheck01Icon,
  FileValidationIcon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import { orpc } from "@/utils/orpc";
import ApiProvider from "@/components/api-provider";

function ApplyLandingContent() {
  const [existingApp, setExistingApp] = React.useState<any>(null);

  React.useEffect(() => {
    let isMounted = true;
    orpc.company.getApplication
      .call()
      .then((data) => {
        if (!isMounted) return;
        setExistingApp(data);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const currentStep = existingApp?.application?.currentStep;
  const companyName = existingApp?.company?.legalName;
  const resumeHref = currentStep ? `/company/apply/${currentStep === "submitted" ? "review" : currentStep}` : "/company/apply/details";

  return (
    <div className="min-h-svh bg-background text-foreground flex flex-col justify-between">
      {/* Top Header */}
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

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-full border border-border/80 hover:border-foreground/40"
            >
              Exit
            </Link>
            <ModeToggle />
          </div>
        </div>
      </header>

      {/* Main Content - Airbnb Host Onboarding Style */}
      <main className="flex-1 flex flex-col justify-center px-6 py-12 sm:py-16">
        <div className="mx-auto w-full max-w-xl space-y-10">
          {/* Main Title */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-foreground text-balance">
              List your estate on AsaseLink
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Verify your company and showcase your land plots to qualified buyers.
            </p>
          </div>

          {/* Simple 3-Step Overview */}
          <div className="space-y-6 pt-2">
            <div className="flex items-start gap-4">
              <span className="text-sm font-semibold text-muted-foreground/80 font-mono mt-0.5">1</span>
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground text-base">Tell us about your company</h3>
                <p className="text-sm text-muted-foreground">
                  Share your business registration name, number, and office contacts.
                </p>
              </div>
            </div>

            <div className="h-px bg-border/60" />

            <div className="flex items-start gap-4">
              <span className="text-sm font-semibold text-muted-foreground/80 font-mono mt-0.5">2</span>
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground text-base">Add authorized representative</h3>
                <p className="text-sm text-muted-foreground">
                  Designate the executive officer managing this workspace and listings.
                </p>
              </div>
            </div>

            <div className="h-px bg-border/60" />

            <div className="flex items-start gap-4">
              <span className="text-sm font-semibold text-muted-foreground/80 font-mono mt-0.5">3</span>
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground text-base">Upload verification documents</h3>
                <p className="text-sm text-muted-foreground">
                  Attach your certificate of incorporation and representative identification.
                </p>
              </div>
            </div>
          </div>

          {/* Action Area */}
          <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
            <Link
              href={resumeHref}
              className={buttonVariants({
                className: "h-13 px-8 rounded-xl w-full sm:w-auto font-semibold text-base gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-colors",
              })}
              style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
            >
              <span>{companyName ? "Continue application" : "Get started"}</span>
              <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
            </Link>

            {companyName && (
              <span className="text-xs text-muted-foreground">
                In progress: <strong className="text-foreground">{companyName}</strong>
              </span>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 py-5 text-center text-xs text-muted-foreground">
        <div className="mx-auto max-w-5xl px-6 flex items-center justify-between">
          <span>&copy; {new Date().getFullYear()} AsaseLink</span>
          <Link href="/" className="hover:underline">Terms &amp; Privacy</Link>
        </div>
      </footer>
    </div>
  );
}

export default function CompanyApplyPage() {
  return (
    <ApiProvider clerkEnabled>
      <ApplyLandingContent />
    </ApiProvider>
  );
}
