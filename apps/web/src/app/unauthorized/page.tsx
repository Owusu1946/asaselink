"use client";

import Link from "next/link";
import { useClerk } from "@clerk/nextjs";
import { ModeToggle } from "@/components/mode-toggle";
import { Button, buttonVariants } from "@asaselink/ui/components/button";
import { ShieldAlert, Compass, Layers, LogOut } from "lucide-react";

export default function UnauthorizedPage() {
  const { signOut } = useClerk();

  return (
    <div className="min-h-svh bg-background text-foreground flex flex-col justify-between p-6 sm:p-10 md:p-14">
      {/* Top Header */}
      <header className="mx-auto flex w-full max-w-xl items-center justify-between">
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

      {/* Main Content */}
      <main className="mx-auto w-full max-w-xl my-auto py-8">
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-10 shadow-xs text-center space-y-6">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <ShieldAlert className="size-7" />
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-destructive">
              Access Restricted &middot; Error 403
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Unauthorized Workspace Access
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
              You do not currently have the permissions required to view this workspace or resource.
              This area is restricted to verified real estate developers or AsaseLink operations
              staff.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-muted/40 p-4 text-left text-xs space-y-2 text-muted-foreground">
            <div className="font-semibold text-foreground">Common Reasons:</div>
            <ul className="list-disc list-inside space-y-1">
              <li>Your corporate application may still be under review by our compliance team.</li>
              <li>You may be signed in with an account that is not an authorized team member.</li>
              <li>Superadmin clearance is required for the requested URL.</li>
            </ul>
          </div>

          {/* Action Links */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/account"
              className={buttonVariants({
                variant: "default",
                className:
                  "w-full sm:w-auto bg-brand-green-900 text-white hover:bg-brand-green-800 gap-1.5",
              })}
            >
              <Compass className="size-4" />
              <span>Return to Buyer Account</span>
            </Link>

            <Link
              href="/workspaces"
              className={buttonVariants({
                variant: "outline",
                className: "w-full sm:w-auto gap-1.5",
              })}
            >
              <Layers className="size-4" />
              <span>Switch Workspace</span>
            </Link>

            <Button
              type="button"
              variant="ghost"
              onClick={() => signOut({ redirectUrl: "/" })}
              className="w-full sm:w-auto text-muted-foreground hover:text-foreground gap-1.5"
            >
              <LogOut className="size-4" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mx-auto w-full max-w-xl text-center text-xs text-muted-foreground">
        Need assistance? Contact support at{" "}
        <span className="font-medium text-foreground">compliance@asaselink.gh</span>
      </footer>
    </div>
  );
}
