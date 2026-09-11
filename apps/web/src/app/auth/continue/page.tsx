import { auth, currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getServerApiClient } from "@/utils/server-orpc";
import { safeRedirectPath } from "@/utils/safe-redirect";

type ContinuePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AuthContinuePage({ searchParams }: ContinuePageProps) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const params = await searchParams;
  const intent = first(params.intent) === "company" ? "company" : undefined;
  const requestedReturnUrl = first(params.return_url) ?? first(params.redirect_url);
  const returnUrl = requestedReturnUrl
    ? safeRedirectPath(requestedReturnUrl, "/onboarding/profile")
    : undefined;

  try {
    const clerkUser = await currentUser();
    const client = await getServerApiClient();
    const result = await client.auth.syncUser({
      intent,
      returnUrl,
      email: clerkUser?.primaryEmailAddress?.emailAddress,
      firstName: clerkUser?.firstName ?? undefined,
      lastName: clerkUser?.lastName ?? undefined,
      phoneNumber: clerkUser?.primaryPhoneNumber?.phoneNumber,
    });
    redirect(result.nextDestination);
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    console.error("Auth continuation synchronization failed", error);

    const retryHref =
      intent === "company" ? "/auth/continue?intent=company" : "/auth/continue?intent=buyer";

    return (
      <main className="grid min-h-svh place-items-center bg-background p-6 text-foreground">
        <div role="alert" className="w-full max-w-sm rounded-2xl border border-destructive/30 bg-card p-8 text-center shadow-xs">
          <h1 className="text-lg font-semibold">Session synchronization failed</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account is safe, but we could not load your workspace.
          </p>
          <Link
            href={retryHref}
            className="mt-5 inline-flex h-9 items-center justify-center rounded-lg bg-brand-green-900 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-green-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Retry securely
          </Link>
        </div>
      </main>
    );
  }
}
