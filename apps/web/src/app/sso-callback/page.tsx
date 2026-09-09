import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SSOCallbackPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background p-4 text-center">
      <div className="space-y-3">
        <div className="mx-auto h-7 w-7 rounded-full border-2 border-brand-green-900 border-t-transparent animate-spin dark:border-brand-green-400" />
        <p className="text-sm font-medium text-foreground">Completing sign in...</p>
        <p className="text-xs text-muted-foreground">Securing your session with AsaseLink</p>
      </div>
      <AuthenticateWithRedirectCallback
        signInFallbackRedirectUrl="/auth/continue"
        signUpFallbackRedirectUrl="/auth/continue"
      />
    </div>
  );
}
