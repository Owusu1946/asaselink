import Link from "next/link";
import { ModeToggle } from "@/components/mode-toggle";
import { BuyerProfileForm } from "@/components/onboarding/buyer-profile-form";
import ApiProvider from "@/components/api-provider";

export default function BuyerProfileOnboardingPage() {
  return (
    <ApiProvider clerkEnabled>
      <main className="relative flex min-h-svh flex-col justify-between bg-background p-6 text-foreground sm:p-10 md:p-12">
        {/* Header */}
        <header className="mx-auto flex w-full max-w-lg items-center justify-between">
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

        {/* Form Container */}
        <div className="mx-auto w-full max-w-lg my-auto py-8">
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs">
            <div className="mb-6">
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-gold-600 dark:text-brand-gold-400">
                Step 1 of 1 &middot; Quick Setup
              </span>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Complete your buyer profile
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Confirm your identity to enable reservations and official plot title documentation.
              </p>
            </div>

            <BuyerProfileForm />
          </div>
        </div>

        {/* Footer */}
        <footer className="mx-auto w-full max-w-lg text-center text-xs text-muted-foreground pt-4">
          Ghana Land Registry Compliant &middot; Protected by AsaseLink Security
        </footer>
      </main>
    </ApiProvider>
  );
}
