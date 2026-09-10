"use client";

import Link from "next/link";
import { useState } from "react";
import { useTheme } from "next-themes";
import { Show, UserButton } from "@clerk/nextjs";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Sun01Icon,
  Moon02Icon,
  UserCircleIcon,
  Menu01Icon,
  Cancel01Icon,
  Compass01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";

export function LandingNav() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <header className="sticky top-2 z-50 w-full px-3 sm:top-4 sm:px-6 md:px-8">
      <div className="relative mx-auto flex max-w-7xl items-center gap-2 md:justify-center">
        {/* Main Floating Capsule Navigation - Centered on Desktop */}
        <nav
          aria-label="Main Navigation"
          className="flex h-12 min-w-0 flex-1 items-center justify-between rounded-full border border-border/80 bg-background/95 px-4 shadow-sm backdrop-blur-md sm:h-14 sm:px-6 md:flex-initial md:min-w-[620px] lg:min-w-[700px]"
        >
          {/* Brand Wordmark */}
          <Link
            href="/"
            className="flex items-center gap-2 group transition-opacity hover:opacity-90"
            aria-label="AsaseLink Home"
          >
            <span
              className="size-2.5 rounded-full bg-brand-gold-500 shadow-sm ring-2 ring-brand-gold-200/50 dark:ring-brand-gold-800/50"
              aria-hidden="true"
            />
            <span className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
              Asase
              <span className="text-brand-green-900 dark:text-brand-green-400">Link</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            <Link
              href="#explore-lands"
              className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-full px-2.5 py-1"
            >
              Explore
            </Link>
            <Link
              href="#how-it-works"
              className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-full px-2.5 py-1"
            >
              How it works
            </Link>
            <Link
              href="/company/apply"
              className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-full px-2.5 py-1"
            >
              For companies
            </Link>
          </div>

          {/* Integrated Capsule Action */}
          <div className="flex items-center gap-2">
            <Link
              href="#explore-lands"
              className="hidden h-9 items-center gap-1.5 rounded-full bg-brand-green-900 px-4 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-brand-green-800 active:scale-[0.98] dark:bg-brand-green-600 dark:text-brand-black dark:hover:bg-brand-green-500 sm:inline-flex"
            >
              <HugeiconsIcon icon={Compass01Icon} size={14} className="shrink-0" />
              <span>Explore estates</span>
            </Link>
          </div>
        </nav>

        {/* Detached Circular Controls */}
        <div className="flex shrink-0 items-center gap-2 md:absolute md:right-0 md:top-1/2 md:-translate-y-1/2">
          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="hidden size-11 items-center justify-center rounded-full border border-border/80 bg-background/95 text-foreground shadow-sm backdrop-blur-md transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold-500 active:scale-95 md:flex"
            aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
            title={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
          >
            <HugeiconsIcon
              icon={resolvedTheme === "dark" ? Sun01Icon : Moon02Icon}
              size={18}
              className="transition-transform duration-200"
            />
          </button>

          {/* User / Sign-In Control */}
          <div className="hidden sm:flex items-center">
            <Show when="signed-in">
              <div className="flex size-11 items-center justify-center rounded-full border border-border/80 bg-background/90 shadow-[0_2px_8px_rgba(0,0,0,0.05)] backdrop-blur-md">
                <UserButton
                  appearance={{
                    elements: {
                      userButtonAvatarBox: "size-8",
                    },
                  }}
                />
              </div>
            </Show>
            <Show when="signed-out">
              <Link
                href="/sign-in"
                className="flex size-11 items-center justify-center rounded-full border border-border/80 bg-background/90 text-foreground shadow-[0_2px_8px_rgba(0,0,0,0.05)] backdrop-blur-md transition-all hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold-500 active:scale-95"
                aria-label="Sign in to AsaseLink"
                title="Sign in"
              >
                <HugeiconsIcon icon={UserCircleIcon} size={20} />
              </Link>
            </Show>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="flex size-11 items-center justify-center rounded-full border border-border/80 bg-background/90 text-foreground shadow-[0_2px_8px_rgba(0,0,0,0.05)] backdrop-blur-md transition-all hover:bg-muted md:hidden active:scale-95"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            <HugeiconsIcon icon={mobileMenuOpen ? Cancel01Icon : Menu01Icon} size={18} />
          </button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="mx-auto mt-2 max-w-md rounded-2xl border border-border bg-background/98 p-4 shadow-xl backdrop-blur-xl md:hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col gap-2">
            <Link
              href="#explore-lands"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <span>Explore estates</span>
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} className="text-muted-foreground" />
            </Link>
            <Link
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <span>How it works</span>
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} className="text-muted-foreground" />
            </Link>
            <Link
              href="/company/apply"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <span>For companies</span>
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} className="text-muted-foreground" />
            </Link>

            <div className="my-2 border-t border-border" />

            <div className="flex items-center justify-between px-2 pt-1">
              <Show when="signed-in">
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex items-center gap-2 text-sm font-medium text-brand-green-800 dark:text-brand-green-400"
                >
                  <span>Go to dashboard</span>
                  <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                </Link>
              </Show>
              <Show when="signed-out">
                <Link
                  href="/sign-in"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center rounded-xl bg-muted py-2 text-sm font-medium text-foreground hover:bg-muted/80 transition-colors"
                >
                  Sign in
                </Link>
              </Show>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
