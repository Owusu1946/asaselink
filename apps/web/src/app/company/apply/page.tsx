import Link from "next/link";
import { buttonVariants } from "@asaselink/ui/components/button";
import { ShieldCheck, CheckCircle2, ArrowRight } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";

export default function CompanyApplyStartPage() {
  return (
    <main className="min-h-svh bg-background text-foreground flex flex-col justify-between p-6 sm:p-10 md:p-14">
      {/* Top Header */}
      <header className="mx-auto flex w-full max-w-2xl items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-lg tracking-tight hover:opacity-90 transition-opacity"
        >
          <span className="h-3 w-3 rounded-full bg-brand-gold-500" aria-hidden="true" />
          <span>
            Asase<span className="text-brand-green-900 dark:text-brand-green-400">Link</span>
          </span>
        </Link>
        <ModeToggle />
      </header>

      {/* Intro Content */}
      <div className="mx-auto w-full max-w-2xl my-auto py-8">
        <div className="rounded-2xl border border-border bg-card p-8 sm:p-10 shadow-xs">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-green-200 bg-brand-green-50 px-3 py-1 text-xs font-medium text-brand-green-900 dark:border-brand-green-800 dark:bg-brand-green-950/60 dark:text-brand-green-300 mb-6">
            <ShieldCheck className="size-3.5" />
            <span>Official Land Developer Verification</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground text-balance">
            List your estate on Ghana&apos;s verified land registry.
          </h1>

          <p className="mt-3 text-sm text-muted-foreground sm:text-base leading-relaxed">
            AsaseLink provides verified land companies and customary stools with coordinate-backed
            plot inventory, transparent reservation agreements, and direct buyer trust.
          </p>

          <div className="mt-8 space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              What you will need for this application:
            </h2>

            <div className="space-y-2.5 pt-1">
              <div className="flex items-start gap-3 rounded-xl border border-border bg-secondary/30 p-3 text-xs">
                <CheckCircle2 className="size-4 text-brand-green-700 dark:text-brand-green-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground">Company Registration</span>
                  <p className="text-muted-foreground mt-0.5">
                    Registrar General&apos;s Department (RGD) Certificate of Incorporation and
                    Commencement.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-border bg-secondary/30 p-3 text-xs">
                <CheckCircle2 className="size-4 text-brand-green-700 dark:text-brand-green-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground">Representative Ghana Card</span>
                  <p className="text-muted-foreground mt-0.5">
                    National Identification card of the designated director, secretary, or legal
                    counsel.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-border bg-secondary/30 p-3 text-xs">
                <CheckCircle2 className="size-4 text-brand-green-700 dark:text-brand-green-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground">Tax & Operational Details</span>
                  <p className="text-muted-foreground mt-0.5">
                    TIN number, business address, and designated operational contacts.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
            <Link
              href="/company/apply/details"
              className={buttonVariants({
                size: "lg",
                className: "w-full sm:w-auto font-medium gap-2",
              })}
            >
              <span>Begin company application</span>
              <ArrowRight className="size-4" />
            </Link>

            <Link
              href="/"
              className={buttonVariants({
                variant: "ghost",
                size: "lg",
                className: "w-full sm:w-auto text-muted-foreground hover:text-foreground",
              })}
            >
              Cancel and return
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mx-auto w-full max-w-2xl text-center text-xs text-muted-foreground pt-4">
        AsaseLink Platform &middot; Verification decisions are subject to administrative legal
        review.
      </footer>
    </main>
  );
}
