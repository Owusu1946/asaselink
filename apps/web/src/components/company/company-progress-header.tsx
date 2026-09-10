"use client";

import * as React from "react";
import Link from "next/link";
import { ModeToggle } from "@/components/mode-toggle";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@asaselink/ui/lib/utils";

interface CompanyProgressHeaderProps {
  currentStep: 1 | 2 | 3 | 4;
}

const STEPS = [
  { step: 1, label: "Company", href: "/company/apply/details" },
  { step: 2, label: "Representative", href: "/company/apply/representative" },
  { step: 3, label: "Documents", href: "/company/apply/documents" },
  { step: 4, label: "Review", href: "/company/apply/review" },
];

export function CompanyProgressHeader({ currentStep }: CompanyProgressHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-base sm:text-lg tracking-tight hover:opacity-90 transition-opacity"
        >
          <span className="h-3 w-3 rounded-full bg-brand-green-900 dark:bg-brand-green-400" aria-hidden="true" />
          <span>
            Asase<span className="text-brand-green-900 dark:text-brand-green-400">Link</span>
          </span>
        </Link>

        {/* Multi-step indicator */}
        <nav aria-label="Application progress" className="flex items-center gap-1 sm:gap-3">
          {STEPS.map((s) => {
            const isCompleted = s.step < currentStep;
            const isCurrent = s.step === currentStep;

            return (
              <div key={s.step} className="flex items-center gap-1.5 sm:gap-2">
                <div
                  className={cn(
                    "flex size-6 sm:size-7 items-center justify-center rounded-full text-xs font-medium transition-colors",
                    isCompleted &&
                      "bg-brand-green-900 text-brand-white dark:bg-brand-green-400 dark:text-brand-green-950",
                    isCurrent &&
                      "border-2 border-brand-green-900 font-bold dark:border-brand-green-400",
                    !isCompleted &&
                      !isCurrent &&
                      "border border-border text-muted-foreground bg-secondary/40",
                  )}
                >
                  {isCompleted ? <HugeiconsIcon icon={Tick01Icon} size={14} /> : s.step}
                </div>
                <span
                  className={cn(
                    "hidden md:inline-block text-xs",
                    isCurrent ? "font-semibold text-foreground" : "text-muted-foreground",
                  )}
                >
                  {s.label}
                </span>
                {s.step < 4 && (
                  <div
                    className={cn(
                      "h-0.5 w-3 sm:w-6 rounded-full",
                      isCompleted ? "bg-brand-green-900 dark:bg-brand-green-400" : "bg-border",
                    )}
                  />
                )}
              </div>
            );
          })}
        </nav>

        <ModeToggle />
      </div>
    </header>
  );
}
