import * as React from "react";
import Link from "next/link";
import { AuthProductPanel } from "./auth-product-panel";
import { ModeToggle } from "@/components/mode-toggle";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-svh w-full flex-col bg-background text-foreground lg:grid lg:grid-cols-[44%_56%]">
      {/* Left panel: Deep land green brand & parcel motif (desktop only) */}
      <AuthProductPanel />

      {/* Right panel: Authentication form surface */}
      <main className="relative flex min-h-svh flex-col justify-between p-6 sm:p-10 md:p-12 overflow-y-auto">
        {/* Mobile / top bar with wordmark & theme toggle */}
        <header className="flex items-center justify-between w-full max-w-md mx-auto mb-6">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold text-lg tracking-tight hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg p-1 -m-1"
          >
            <span className="h-3 w-3 rounded-full bg-brand-gold-500" aria-hidden="true" />
            <span>
              Asase<span className="text-brand-green-900 dark:text-brand-green-400">Link</span>
            </span>
          </Link>

          <ModeToggle />
        </header>

        {/* Center: Auth form container strictly bounded to 400-440px */}
        <div className="mx-auto w-full max-w-[420px] my-auto py-4">
          {children}
        </div>

        {/* Footer: Legal terms & privacy links */}
        <footer className="w-full max-w-md mx-auto pt-6 text-center text-xs text-muted-foreground">
          Protected by AsaseLink Land Verification Security.{" "}
          <Link
            href="/terms"
            className="underline underline-offset-4 hover:text-foreground transition-colors"
          >
            Terms
          </Link>{" "}
          &middot;{" "}
          <Link
            href="/privacy"
            className="underline underline-offset-4 hover:text-foreground transition-colors"
          >
            Privacy
          </Link>
        </footer>
      </main>
    </div>
  );
}
