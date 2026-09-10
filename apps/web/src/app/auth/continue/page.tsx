import { auth } from "@clerk/nextjs/server";
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
    const client = await getServerApiClient();
    const result = await client.auth.syncUser({ intent, returnUrl });
    redirect(result.nextDestination);
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;

    return (
      <main className="grid min-h-svh place-items-center bg-background p-6 text-foreground">
        <div role="alert" className="w-full max-w-sm rounded-2xl border border-destructive/30 bg-card p-8 text-center shadow-xs">
          <h1 className="text-lg font-semibold">Session synchronization failed</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account is safe, but we could not load your workspace. Refresh this page to retry.
          </p>
        </div>
      </main>
    );
  }
}
