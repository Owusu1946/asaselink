"use client";

import Image from "next/image";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  ShieldCheckIcon,
  Building02Icon,
} from "@hugeicons/core-free-icons";

export function CompanyBanner() {
  return (
    <section className="relative py-16 sm:py-24 px-4 sm:px-6 md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* Left Content Column */}
          <div className="lg:col-span-6 flex flex-col text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3.5 py-1 text-xs font-semibold text-brand-green-800 dark:text-brand-green-400 mb-5 w-fit">
              <span className="grid size-8 place-items-center rounded-full bg-brand-green-50 text-brand-green-900 dark:bg-brand-green-950 dark:text-brand-green-300"><HugeiconsIcon icon={ShieldCheckIcon} size={15} /></span>
              <span>For Registered Land Companies</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-[1.12]">
              List your estate with spatial precision.
            </h2>

            <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
              Connect directly with qualified local and diaspora buyers. Showcase verified boundaries,
              manage live plot inventory, and eliminate double-allocation forever.
            </p>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href="/company/apply"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-green-900 px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-green-800 active:scale-[0.98] dark:bg-brand-green-600 dark:text-brand-black dark:hover:bg-brand-green-500 sm:w-auto"
              >
                <span>Apply as a verified company</span>
                <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
              </Link>

              <Link
                href="/sign-in"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-border/80 bg-background/80 px-5 text-sm font-medium text-foreground backdrop-blur-md transition-colors hover:bg-muted active:scale-[0.98] sm:w-auto"
              >
                <HugeiconsIcon icon={Building02Icon} size={16} />
                <span>Company sign in</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Organic Blob Masked Photography Directly on Background */}
          <div className="lg:col-span-6 relative flex items-center justify-center">
            {/* Organic Blob Container */}
            <div className="relative w-full max-w-md aspect-square">
              {/* Subtle background glow */}
              <div
                className="absolute inset-0 rounded-[40%_60%_70%_30%/40%_50%_60%_50%] bg-gradient-to-tr from-brand-green-800/15 to-brand-gold-500/15 blur-2xl transform scale-110 pointer-events-none"
                aria-hidden="true"
              />

              {/* Main Organic Blob Image Mask */}
              <div className="relative size-full overflow-hidden rounded-[38%_62%_63%_37%/41%_44%_56%_59%] border border-border/60 shadow-2xl transition-transform duration-700 hover:scale-[1.02]">
                <Image
                  src="/estates/developer-survey.jpg"
                  alt="Estate developer inspecting layout"
                  fill
                  sizes="(max-width: 1024px) 100vw, 480px"
                  className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
