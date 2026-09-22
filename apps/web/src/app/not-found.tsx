import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Compass01Icon,
  Home01Icon,
  ShieldCheckIcon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import { buttonVariants } from "@asaselink/ui/components/button";

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      {/* Sleek Top Navigation Bar */}
      <header className="flex h-16 items-center justify-between border-b border-border/80 px-6 sm:px-10">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-semibold tracking-tight text-foreground"
        >
          <span className="flex size-7 items-center justify-center rounded-lg bg-brand-green-900 text-white dark:bg-brand-green-800">
            <span className="size-2 rounded-full bg-brand-gold-500" />
          </span>
          <span className="text-base font-bold">
            Asase<span className="text-brand-green-900 dark:text-brand-green-400">Link</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/account"
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Buyer Account
          </Link>
          <span className="text-muted-foreground/40">·</span>
          <Link
            href="/workspaces"
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Workspaces
          </Link>
        </div>
      </header>

      {/* 404 Hero Container */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
        <div className="mx-auto max-w-lg space-y-6">
          {/* Visual 3D Asset / Graphic Container */}
          <div className="relative mx-auto flex size-44 items-center justify-center">
            {/* Ambient background glow */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-brand-green-900/15 via-brand-gold-500/10 to-transparent blur-2xl dark:from-brand-green-500/20 dark:via-brand-gold-400/15" />

            {/* Concentric GPS Radar Rings */}
            <div className="absolute inset-2 rounded-full border border-dashed border-brand-green-900/20 dark:border-brand-green-400/20 animate-[spin_40s_linear_infinite]" />
            <div className="absolute inset-8 rounded-full border border-border/70" />

            {/* Central Pin / Beacon Emblem */}
            <div className="relative flex size-20 items-center justify-center rounded-2xl border border-border bg-card/90 shadow-xl backdrop-blur-sm">
              <div className="flex size-12 items-center justify-center rounded-xl bg-brand-green-900 text-brand-gold-400 shadow-inner dark:bg-brand-green-800">
                <HugeiconsIcon icon={Compass01Icon} size={28} />
              </div>
            </div>

            {/* Floating Coordinate Pill */}
            <div className="absolute -bottom-2 inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-background/95 px-3 py-1 text-[11px] font-mono font-medium text-muted-foreground shadow-xs">
              <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span>LAT: ??? · LNG: ???</span>
            </div>
          </div>

          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.03] dark:bg-white/[0.04] px-3.5 py-1 text-xs font-semibold text-muted-foreground">
            <span className="font-mono text-brand-gold-600 dark:text-brand-gold-400">404</span>
            <span>·</span>
            <span>Coordinate Beyond Boundary</span>
          </div>

          {/* Heading & Copy */}
          <div className="space-y-2.5">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Lost Beyond Cadastral Boundaries
            </h1>
            <p className="text-sm text-muted-foreground sm:text-base text-balance leading-relaxed">
              The parcel, survey record, or workspace page you are attempting to reach does not
              exist in the AsaseLink land registry or has been decommissioned.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center pt-2">
            <Link
              href="/"
              className={buttonVariants({
                variant: "default",
                size: "default",
                className:
                  "gap-2 rounded-xl bg-brand-green-900 text-white hover:bg-brand-green-800 px-5 shadow-xs",
              })}
            >
              <HugeiconsIcon icon={Home01Icon} size={16} />
              <span>Return to Platform Home</span>
            </Link>

            <Link
              href="/account"
              className={buttonVariants({
                variant: "outline",
                size: "default",
                className: "gap-2 rounded-xl border-border hover:bg-muted px-5",
              })}
            >
              <HugeiconsIcon icon={Compass01Icon} size={16} />
              <span>Buyer Dashboard</span>
            </Link>
          </div>

          {/* Quick Workspace Switcher Helper */}
          <div className="pt-6 border-t border-border/60 text-xs text-muted-foreground">
            <span>Looking for your developer portal? </span>
            <Link
              href="/workspaces"
              className="inline-flex items-center gap-1 font-medium text-brand-green-800 hover:underline dark:text-brand-green-400"
            >
              <HugeiconsIcon icon={ShieldCheckIcon} size={13} />
              <span>Open Workspaces</span>
              <HugeiconsIcon icon={ArrowRight01Icon} size={12} />
            </Link>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-border/80 py-4 text-center text-xs text-muted-foreground">
        AsaseLink geographic screening · Not an official title verification
      </footer>
    </div>
  );
}
