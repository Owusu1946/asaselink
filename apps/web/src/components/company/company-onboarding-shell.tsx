"use client";

import * as React from "react";
import Link from "next/link";
import { ModeToggle } from "@/components/mode-toggle";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, ArrowRight01Icon, Loading03Icon } from "@hugeicons/core-free-icons";
import { Button } from "@asaselink/ui/components/button";
import { cn } from "@asaselink/ui/lib/utils";

interface CompanyOnboardingShellProps {
  currentStep: 1 | 2 | 3 | 4;
  title: string;
  subtitle: string;
  onBack?: () => void;
  backHref?: string;
  onNext?: () => void;
  nextLabel?: string;
  isSubmitting?: boolean;
  isNextDisabled?: boolean;
  hideFooter?: boolean;
  children: React.ReactNode;
}

export function CompanyOnboardingShell({
  currentStep,
  title,
  subtitle,
  onBack,
  backHref,
  onNext,
  nextLabel = "Next",
  isSubmitting = false,
  isNextDisabled = false,
  hideFooter = false,
  children,
}: CompanyOnboardingShellProps) {
  // Progress percentage (1 -> 25%, 2 -> 50%, 3 -> 75%, 4 -> 100%)
  const progressPercent = (currentStep / 4) * 100;

  return (
    <div className="min-h-svh bg-background text-foreground flex flex-col justify-between">
      {/* Top Header - Airbnb style */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border/60">
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
              Save &amp; exit
            </Link>
            <ModeToggle />
          </div>
        </div>
      </header>

      {/* Center Main Stage */}
      <main className="flex-1 flex flex-col justify-center px-6 py-10 sm:py-14">
        <div className="mx-auto w-full max-w-xl space-y-8">
          {/* Step Header */}
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Step {currentStep} of 4
            </span>
            <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight text-foreground text-balance">
              {title}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              {subtitle}
            </p>
          </div>

          {/* Step Content Form */}
          <div className="pt-2">{children}</div>
        </div>
      </main>

      {/* Bottom Sticky Action Bar - Airbnb style */}
      {!hideFooter && (
        <footer className="sticky bottom-0 z-30 bg-background/95 backdrop-blur-sm border-t border-border/60">
          {/* Progress bar line right above the footer */}
          <div className="h-1 w-full bg-secondary">
            <div
              className="h-full bg-brand-green-900 dark:bg-brand-green-400 transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
            {backHref ? (
              <Link
                href={backHref}
                className="text-sm font-semibold underline underline-offset-4 text-foreground hover:text-muted-foreground transition-colors"
              >
                Back
              </Link>
            ) : onBack ? (
              <button
                type="button"
                onClick={onBack}
                disabled={isSubmitting}
                className="text-sm font-semibold underline underline-offset-4 text-foreground hover:text-muted-foreground transition-colors disabled:opacity-40"
              >
                Back
              </button>
            ) : (
              <div />
            )}

            {onNext && (
              <Button
                type="button"
                onClick={onNext}
                disabled={isSubmitting || isNextDisabled}
                className="h-12 px-7 rounded-xl font-semibold text-sm bg-primary text-primary-foreground hover:bg-primary/90 gap-2 shadow-sm transition-colors"
                style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
              >
                {isSubmitting ? (
                  <>
                    <HugeiconsIcon icon={Loading03Icon} size={18} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span>{nextLabel}</span>
                    <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
                  </>
                )}
              </Button>
            )}
          </div>
        </footer>
      )}
    </div>
  );
}
