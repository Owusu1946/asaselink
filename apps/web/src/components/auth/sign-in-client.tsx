"use client";

import * as React from "react";
import { useSignIn, useAuth } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthFormPanel } from "./auth-form-panel";
import { AuthStep } from "./auth-step";
import { SocialAuthButton, type OAuthStrategy } from "./social-auth-button";
import { IdentifierForm, type IdentifierSubmitPayload } from "./identifier-form";
import { OtpForm } from "./otp-form";
import { AuthErrorSummary } from "./auth-error-summary";
import { Separator } from "@asaselink/ui/components/separator";

export function SignInClient() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const { isSignedIn, isLoaded: isAuthLoaded } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectUrl = searchParams?.get("redirect_url") || "/auth/continue";

  // If already signed in, immediately forward to continuation destination
  React.useEffect(() => {
    if (isAuthLoaded && isSignedIn) {
      router.replace(redirectUrl);
    }
  }, [isAuthLoaded, isSignedIn, redirectUrl, router]);

  const [step, setStep] = React.useState<"identifier" | "otp">("identifier");
  const [activeIdentifier, setActiveIdentifier] = React.useState("");
  const [activeMethod, setActiveMethod] = React.useState<"email" | "phone">("email");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [loadingSocial, setLoadingSocial] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Clear errors when navigating back
  const handleBackToIdentifier = () => {
    setStep("identifier");
    setErrorMessage(null);
  };

  // Social SSO handler
  const handleSocialAuth = async (strategy: OAuthStrategy) => {
    if (!signIn) return;
    setLoadingSocial(strategy);
    setErrorMessage(null);

    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const callbackUrl = `${origin}/sso-callback`;
      const destination = `${origin}${redirectUrl}`;

      const { error } = await signIn.sso({
        strategy,
        redirectUrl: destination,
        redirectCallbackUrl: callbackUrl,
      });

      if (error) {
        setErrorMessage(error.message || "Failed to connect with provider. Please try again.");
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "An unexpected error occurred during social login.";
      setErrorMessage(msg);
    } finally {
      setLoadingSocial(null);
    }
  };

  // Identifier (Email or Phone) submission -> send OTP code
  const handleIdentifierSubmit = async ({ method, identifier }: IdentifierSubmitPayload) => {
    if (!signIn) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    setActiveIdentifier(identifier);
    setActiveMethod(method);

    try {
      if (method === "email") {
        const { error } = await signIn.emailCode.sendCode({
          emailAddress: identifier,
        });

        if (error) {
          setErrorMessage(
            error.message || "Could not send verification code. Please check your email.",
          );
          return;
        }
      } else {
        const { error } = await signIn.phoneCode.sendCode({
          phoneNumber: identifier,
        });

        if (error) {
          setErrorMessage(
            error.message || "Could not send SMS code. Please check your phone number.",
          );
          return;
        }
      }

      setStep("otp");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unable to deliver code. Please try again.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Finalize sign in session
  const finalizeSignIn = async () => {
    if (!signIn) return;
    await signIn.finalize({
      navigate: async ({ session, decorateUrl }) => {
        const destination =
          session.currentTask && session.currentTask.key !== "choose-organization"
            ? `/sign-in/tasks/${session.currentTask.key}`
            : redirectUrl;
        const targetUrl = decorateUrl(destination);
        if (targetUrl.startsWith("http")) {
          window.location.href = targetUrl;
        } else {
          router.push(targetUrl);
        }
      },
    });
  };

  // Verify OTP code
  const handleVerifyOtp = async (code: string) => {
    if (!signIn) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (activeMethod === "email") {
        const { error } = await signIn.emailCode.verifyCode({ code });
        if (error) {
          setErrorMessage(error.message || "Invalid or expired code. Please try again.");
          return;
        }
      } else {
        const { error } = await signIn.phoneCode.verifyCode({ code });
        if (error) {
          setErrorMessage(error.message || "Invalid or expired code. Please try again.");
          return;
        }
      }

      if (signIn.status === "complete") {
        await finalizeSignIn();
      } else {
        setErrorMessage("Verification could not be finalized. Please try again.");
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Code verification failed. Please try again.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend OTP code
  const handleResendOtp = async () => {
    if (!signIn) return;
    setErrorMessage(null);

    try {
      if (activeMethod === "email") {
        const { error } = await signIn.emailCode.sendCode();
        if (error) {
          setErrorMessage(error.message || "Could not resend email code.");
        }
      } else {
        const { error } = await signIn.phoneCode.sendCode();
        if (error) {
          setErrorMessage(error.message || "Could not resend phone code.");
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to resend code.";
      setErrorMessage(msg);
    }
  };

  const isAnyLoading = isSubmitting || !!loadingSocial || fetchStatus === "fetching";

  const isSignedUp = searchParams?.get("signed_up") === "true";

  return (
    <AuthFormPanel
      mode="sign-in"
      title={step === "identifier" ? "Welcome back" : "Enter verification code"}
      subtitle={
        step === "identifier"
          ? "Continue your verified land journey."
          : `We sent a 6-digit code to ${activeIdentifier}`
      }
    >
      <div className="space-y-5">
        {isSignedUp && (
          <div className="flex items-center gap-2.5 rounded-xl border border-brand-green-300 bg-brand-green-50/90 p-3 text-xs font-medium text-brand-green-900 dark:border-brand-green-800 dark:bg-brand-green-950/60 dark:text-brand-green-300">
            <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-brand-green-700 text-white dark:bg-brand-green-500">
              ✓
            </span>
            <span>Account created successfully! Please sign in below to continue.</span>
          </div>
        )}

        <AuthErrorSummary error={errorMessage || errors?.global?.[0]?.message} />

        {step === "identifier" ? (
          <AuthStep className="space-y-5">
            {/* Primary Social: Google */}
            <div className="space-y-2.5">
              <SocialAuthButton
                provider="google"
                isLoading={loadingSocial === "oauth_google"}
                disabled={isAnyLoading}
                onClick={handleSocialAuth}
              />

              {/* Secondary Social: Apple and Facebook */}
              <div className="grid grid-cols-2 gap-2.5">
                <SocialAuthButton
                  provider="apple"
                  isLoading={loadingSocial === "oauth_apple"}
                  disabled={isAnyLoading}
                  onClick={handleSocialAuth}
                />
                <SocialAuthButton
                  provider="facebook"
                  isLoading={loadingSocial === "oauth_facebook"}
                  disabled={isAnyLoading}
                  onClick={handleSocialAuth}
                />
              </div>
            </div>

            {/* Separator */}
            <div className="relative flex items-center justify-center">
              <Separator className="w-full" />
              <span className="absolute bg-background px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                or continue with
              </span>
            </div>

            {/* Identifier Form (Email or Ghana Phone) */}
            <IdentifierForm isLoading={isAnyLoading} onSubmit={handleIdentifierSubmit} />
          </AuthStep>
        ) : (
          <AuthStep>
            <OtpForm
              identifier={activeIdentifier}
              isLoading={isAnyLoading}
              error={errorMessage}
              onVerify={handleVerifyOtp}
              onResend={handleResendOtp}
              onBack={handleBackToIdentifier}
            />
          </AuthStep>
        )}
      </div>
    </AuthFormPanel>
  );
}
