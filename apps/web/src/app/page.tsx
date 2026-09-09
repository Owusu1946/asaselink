import Link from "next/link";
import { ModeToggle } from "@/components/mode-toggle";
import { buttonVariants } from "@asaselink/ui/components/button";

export default function HomePage() {
  return (
    <main className="relative flex min-h-svh flex-col justify-between bg-background text-foreground p-6 sm:p-10 md:p-16">
      {/* Top Bar: Wordmark & Theme Switcher */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-brand-gold-500" aria-hidden="true" />
          <span className="font-semibold tracking-tight text-xl text-foreground">
            Asase<span className="text-brand-green-900 dark:text-brand-green-400">Link</span>
          </span>
        </div>
        <ModeToggle />
      </header>

      {/* Main Core Section */}
      <div className="mx-auto w-full max-w-xl py-12 text-center md:py-20">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3.5 py-1 text-xs font-medium text-muted-foreground mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-green-600 dark:bg-brand-green-400" />
          Ghana Verified Land Platform &middot; Phase 1 Foundation
        </div>

        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl text-balance">
          Discover, understand, and reserve verified land with confidence.
        </h1>

        <p className="mt-4 text-base text-muted-foreground sm:text-lg text-balance max-w-lg mx-auto">
          A calm, transparent standard for discovering estate plots, verifying ownership documents,
          and securing title in Ghana.
        </p>

        {/* Action Group */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
          <Link
            href="/sign-up?intent=buyer"
            className={buttonVariants({ size: "lg", className: "w-full sm:w-auto font-medium" })}
          >
            Continue as a buyer
          </Link>

          <Link
            href="/company/apply"
            className={buttonVariants({
              variant: "outline",
              size: "lg",
              className: "w-full sm:w-auto font-medium",
            })}
          >
            List your estate
          </Link>
        </div>

        <div className="mt-6 text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
          >
            Sign in
          </Link>
        </div>
      </div>

      {/* Footer Details */}
      <footer className="flex flex-col items-center justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
        <div>&copy; {new Date().getFullYear()} AsaseLink Platform. All rights reserved.</div>
        <div className="flex items-center gap-6">
          <span>Accra, Ghana</span>
          <span>Spatially Verified</span>
        </div>
      </footer>
    </main>
  );
}
