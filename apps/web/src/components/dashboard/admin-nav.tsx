"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { ModeToggle } from "@/components/mode-toggle";
import { ShieldCheck, Layers, ClipboardCheck, History } from "lucide-react";

export function AdminNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur-sm sm:px-10">
      {/* Brand & Admin Badge */}
      <div className="flex items-center gap-6 sm:gap-8">
        <Link
          href="/admin"
          className="flex items-center gap-2 font-semibold text-lg tracking-tight hover:opacity-90 transition-opacity"
        >
          <span className="h-3 w-3 rounded-full bg-brand-gold-500" aria-hidden="true" />
          <span>
            Asase<span className="text-brand-green-900 dark:text-brand-green-400">Link</span>
          </span>
        </Link>

        {/* Admin Clearance Badge */}
        <div className="hidden lg:flex items-center gap-2 rounded-lg border border-brand-gold-500/30 bg-brand-gold-500/10 px-2.5 py-1 text-xs font-semibold text-brand-gold-700 dark:text-brand-gold-300">
          <ShieldCheck className="size-3.5" />
          <span>Superadmin Portal</span>
        </div>

        {/* Tab Navigation */}
        <nav aria-label="Admin navigation" className="hidden md:flex items-center gap-5 text-sm">
          <Link
            href="/admin"
            className={`inline-flex items-center gap-1.5 font-medium transition-colors ${
              pathname === "/admin"
                ? "text-brand-green-900 dark:text-brand-green-400 font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ClipboardCheck className="size-3.5" />
            <span>Verification Queue</span>
          </Link>
          <Link
            href="/workspaces"
            className="inline-flex items-center gap-1.5 font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Layers className="size-3.5" />
            <span>Switch Workspace</span>
          </Link>
        </nav>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex flex-col text-right text-xs">
          <span className="font-semibold text-foreground">AsaseLink Operations</span>
          <span className="text-muted-foreground">Compliance & Verification</span>
        </div>
        <ModeToggle />
        <UserButton />
      </div>
    </header>
  );
}
