"use client";

import * as React from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@asaselink/ui/components/button";
import { AlertCircle, RotateCcw } from "lucide-react";
import { orpc } from "@/utils/orpc";
import ApiProvider from "@/components/api-provider";

function ContinuationContent() {
  const { isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();

  const intent = searchParams?.get("intent") || undefined;
  const returnUrl = searchParams?.get("return_url") || searchParams?.get("redirect_url") || undefined;

  const [statusMessage, setStatusMessage] = React.useState("Checking authentication...");
  const [error, setError] = React.useState<string | null>(null);
  const [isRetrying, setIsRetrying] = React.useState(false);

  const resolveContinuation = React.useCallback(async () => {
    if (!isSignedIn || !user) return;

    setError(null);
    setStatusMessage("Synchronizing verified application profile...");

    try {
      const email = user.primaryEmailAddress?.emailAddress;
      const phoneNumber = user.primaryPhoneNumber?.phoneNumber;
      const firstName = user.firstName || undefined;
      const lastName = user.lastName || undefined;

      const result = await orpc.auth.syncUser.call({
        intent,
        returnUrl,
        email,
        phoneNumber,
        firstName,
        lastName,
      });

      if (result.status === "suspended" || result.status === "restricted") {
        router.replace(result.nextDestination);
        return;
      }

      setStatusMessage("Directing to your workspace...");
      router.replace(result.nextDestination);
    } catch (err: unknown) {
      console.error("Continuation resolution error:", err);
      // If network/database error, provide deterministic safe fallback
      const fallback = intent === "company" ? "/company/apply" : "/onboarding/profile";
      setStatusMessage("Taking you to your next step...");
      setTimeout(() => {
        router.replace(fallback);
      }, 500);
    }
  }, [isSignedIn, user, intent, returnUrl, router]);

  React.useEffect(() => {
    if (!isAuthLoaded || !isUserLoaded) return;

    if (!isSignedIn) {
      router.replace("/sign-in");
      return;
    }

    resolveContinuation();
  }, [isAuthLoaded, isUserLoaded, isSignedIn, resolveContinuation, router]);

  const handleManualRetry = async () => {
    setIsRetrying(true);
    await resolveContinuation();
    setIsRetrying(false);
  };

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-background p-6 text-foreground">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center shadow-xs">
        {/* Brand Mark */}
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-green-50 text-brand-green-900 dark:bg-brand-green-950 dark:text-brand-green-300 mb-4">
          <span className="h-3 w-3 rounded-full bg-brand-gold-500" aria-hidden="true" />
        </div>

        <h1 className="text-lg font-semibold tracking-tight text-foreground">
          {error ? "Session Synchronization" : "AsaseLink"}
        </h1>

        {error ? (
          <div className="mt-4 space-y-4">
            <div className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive text-left">
              <AlertCircle className="size-4 shrink-0 translate-y-0.5" />
              <p>{error}</p>
            </div>

            <Button
              type="button"
              variant="default"
              size="default"
              disabled={isRetrying}
              onClick={handleManualRetry}
              className="w-full gap-2 font-medium"
            >
              <RotateCcw className={`size-4 ${isRetrying ? "animate-spin" : ""}`} />
              <span>Retry continuation</span>
            </Button>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {/* Smooth spinner */}
            <div className="mx-auto h-7 w-7 rounded-full border-2 border-brand-green-900 border-t-transparent animate-spin dark:border-brand-green-400" />
            <p className="text-sm font-medium text-foreground">{statusMessage}</p>
            <p className="text-xs text-muted-foreground">Securing your verified session</p>
          </div>
        )}
      </div>
    </main>
  );
}

export default function AuthContinuePage() {
  return (
    <ApiProvider clerkEnabled>
      <ContinuationContent />
    </ApiProvider>
  );
}
