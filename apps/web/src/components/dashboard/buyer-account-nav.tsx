"use client";

import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";
import { ModeToggle } from "@/components/mode-toggle";
import { Layers } from "lucide-react";

export function BuyerAccountNav() {
  const { user } = useUser();
  const displayName = user?.firstName || user?.fullName || "Buyer";

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur-sm sm:px-10">
      {/* Brand */}
      <div className="flex items-center gap-8">
        <Link
          href="/account"
          className="flex items-center gap-2 font-semibold text-lg tracking-tight hover:opacity-90 transition-opacity"
        >
          <span className="h-3 w-3 rounded-full bg-brand-gold-500" aria-hidden="true" />
          <span>
            Asase<span className="text-brand-green-900 dark:text-brand-green-400">Link</span>
          </span>
        </Link>

        <nav aria-label="Buyer navigation" className="hidden md:flex items-center gap-6 text-sm">
          <Link
            href="/account"
            className="font-medium text-foreground hover:text-foreground/80 transition-colors"
          >
            Overview
          </Link>
          <Link
            href="/workspaces"
            className="inline-flex items-center gap-1.5 font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Layers className="size-3.5" />
            <span>Workspaces</span>
          </Link>
        </nav>
      </div>

      {/* Right User Controls */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex flex-col text-right text-xs">
          <span className="font-semibold text-foreground">{displayName}</span>
          <span className="text-muted-foreground">Verified Buyer</span>
        </div>
        <ModeToggle />
        <UserButton />
      </div>
    </header>
  );
}
