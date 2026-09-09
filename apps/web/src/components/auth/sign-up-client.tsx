"use client";

import * as React from "react";
import { useSignUp } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthFormPanel } from "./auth-form-panel";
import { AuthStep } from "./auth-step";
import { SocialAuthButton, type OAuthStrategy } from "./social-auth-button";
import { IdentifierForm, type IdentifierSubmitPayload } from "./identifier-form";
import { OtpForm } from "./otp-form";
import { AuthErrorSummary } from "./auth-error-summary";
import { ClerkCaptchaMount } from "./clerk-captcha-mount";
import { Separator } from "@asaselink/ui/components/separator";

export function SignUpClient() {
  const { signUp, errors, fetchStatus } = useSignUp();
  const router = useRouter();
  const searchParams = useSearchParams();

  const intent = searchParams?.get("intent");
  const returnUrl = searchParams?.get("return_url") || searchParams?.get("redirect_url");
  const continuationQuery = [
    intent ? `intent=${encodeURIComponent(intent)}` : null,
    returnUrl ? `return_url=${encodeURIComponent(returnUrl)}` : null,
  ]
    .filter(Boolean)
    .join("&");

  const finalRedirectUrl = `/auth/continue${continuationQuery ? `?${continuationQuery}` : ""}`;

  const [step, setStep] = React.useState<"identifier" | "otp">("identifier");
  const [activeIdentifier, setActiveIdentifier] = React.useState("");
  const [activeMethod, setActiveMethod] = React.useState<"email" | "phone">("email");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [loadingSocial, setLoadingSocial] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleBackToIdentifier = () => {
    setStep("identifier");
    setErrorMessage(null);
  };

  // Social SSO handler
  const handleSocialAuth = async (strategy: OAuthStrategy) => {
    if (!signUp) return;
    setLoadingSocial(strategy);
    setErrorMessage(null);

    try {
      const { error } = await signUp.sso({
        strategy,
        redirectUrl: finalRedirectUrl,
        redirectCallbackUrl: "/sso-callback",
      });

      if (error) {
        setErrorMessage(
          error.message || "Failed to start sign up with provider. Please try again.",
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Social sign-up failed. Please try again.";
      setErrorMessage(msg);
    } finally {
      setLoadingSocial(null);
    }
  };

  // Identifier submit: create user then send code
  const handleIdentifierSubmit = async ({ method, identifier }: IdentifierSubmitPayload) => {
    if (!signUp) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    setActiveIdentifier(identifier);
    setActiveMethod(method);

    try {
      if (method === "email") {
        const { error: createErr } = await signUp.create({
          emailAddress: identifier,
        });

        if (createErr) {
          setErrorMessage(
            createErr.message || "Unable to create account. Please verify your email.",
          );
          return;
        }

        const { error: sendErr } = await signUp.verifications.sendEmailCode();
        if (sendErr) {
          setErrorMessage(sendErr.message || "Failed to send verification code. Please try again.");
          return;
        }
      } else {
        const { error: createErr } = await signUp.create({
          phoneNumber: identifier,
        });

        if (createErr) {
          setErrorMessage(
            createErr.message || "Unable to create account. Please verify your phone number.",
          );
          return;
        }

        const { error: sendErr } = await signUp.verifications.sendPhoneCode();
        if (sendErr) {
          setErrorMessage(sendErr.message || "Failed to send SMS code. Please try again.");
          return;
        }
      }

      setStep("otp");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "An unexpected error occurred. Please try again.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Finalize sign up session
  const finalizeSignUp = async () => {
    if (!signUp) return;
    await signUp.finalize({
      navigate: async ({ session, decorateUrl }) => {
        const destination = session.currentTask
          ? `/sign-up/tasks/${session.currentTask.key}`
          : finalRedirectUrl;
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
    if (!signUp) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (activeMethod === "email") {
        const { error } = await signUp.verifications.verifyEmailCode({ code });
        if (error) {
          setErrorMessage(error.message || "Incorrect or expired code. Please try again.");
          return;
        }
      } else {
        const { error } = await signUp.verifications.verifyPhoneCode({ code });
        if (error) {
          setErrorMessage(error.message || "Incorrect or expired code. Please try again.");
          return;
        }
      }

      if (signUp.status === "complete") {
        await finalizeSignUp();
      } else {
        setErrorMessage("Verification requires additional requirements.");
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
    if (!signUp) return;
    setErrorMessage(null);

    try {
      if (activeMethod === "email") {
        const { error } = await signUp.verifications.sendEmailCode();
        if (error) {
          setErrorMessage(error.message || "Failed to resend email code.");
        }
      } else {
        const { error } = await signUp.verifications.sendPhoneCode();
        if (error) {
          setErrorMessage(error.message || "Failed to resend phone code.");
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to resend verification code.";
      setErrorMessage(msg);
    }
  };

  const isAnyLoading = isSubmitting || !!loadingSocial || fetchStatus === "fetching";

  return (
    <AuthFormPanel
      mode="sign-up"
      title={step === "identifier" ? "Create your account" : "Verify your identity"}
      subtitle={
        step === "identifier"
          ? intent === "company"
            ? "Register to begin your company verification."
            : "Start discovering and reserving verified land in Ghana."
          : `Enter the 6-digit code sent to ${activeIdentifier}`
      }
    >
      <div className="space-y-5">
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
                or sign up with
              </span>
            </div>

            {/* Identifier Form */}
            <IdentifierForm isLoading={isAnyLoading} onSubmit={handleIdentifierSubmit} />

            {/* Required bot captcha container */}
            <ClerkCaptchaMount />
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
