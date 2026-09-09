"use client";

import * as React from "react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@asaselink/ui/components/input-otp";
import { AuthSubmitButton } from "./auth-submit-button";
import { Button } from "@asaselink/ui/components/button";
import { ArrowLeft, RotateCw } from "lucide-react";

interface OtpFormProps {
  identifier: string; // email or phone number
  isLoading?: boolean;
  error?: string | null;
  onVerify: (code: string) => Promise<void> | void;
  onResend: () => Promise<void> | void;
  onBack: () => void;
}

export function OtpForm({
  identifier,
  isLoading = false,
  error = null,
  onVerify,
  onResend,
  onBack,
}: OtpFormProps) {
  const [code, setCode] = React.useState("");
  const [countdown, setCountdown] = React.useState(60);
  const [isResending, setIsResending] = React.useState(false);

  React.useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleComplete = async (completedCode: string) => {
    if (completedCode.length === 6) {
      await onVerify(completedCode);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || isResending) return;
    setIsResending(true);
    try {
      await onResend();
      setCountdown(60);
      setCode("");
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length === 6) {
      await onVerify(code);
    }
  };

  return (
    <div className="space-y-6">
      {/* Target Identifier Context */}
      <div className="flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground font-medium transition-colors outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm py-1"
        >
          <ArrowLeft className="size-3.5" />
          <span>Change details</span>
        </button>

        <span className="font-mono text-muted-foreground tabular-nums">6-digit code</span>
      </div>

      <div className="rounded-xl border border-border/80 bg-secondary/30 p-3 text-xs text-muted-foreground">
        We sent a verification code to{" "}
        <span className="font-semibold text-foreground break-all">{identifier}</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* OTP Input Fields */}
        <div className="flex flex-col items-center justify-center space-y-2">
          <InputOTP
            maxLength={6}
            value={code}
            onChange={(val) => setCode(val)}
            onComplete={handleComplete}
            disabled={isLoading}
            autoFocus
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>

          {error && (
            <p role="alert" className="text-xs font-medium text-destructive mt-2 text-center">
              {error}
            </p>
          )}
        </div>

        {/* Submit Action */}
        <AuthSubmitButton
          isLoading={isLoading}
          loadingText="Verifying code..."
          disabled={code.length < 6}
        >
          Verify and continue
        </AuthSubmitButton>

        {/* Resend Countdown */}
        <div className="flex items-center justify-center text-xs text-muted-foreground pt-2">
          {countdown > 0 ? (
            <span>
              Resend available in{" "}
              <span className="font-mono font-medium text-foreground">{countdown}s</span>
            </span>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isResending || isLoading}
              onClick={handleResend}
              className="gap-1.5 text-xs text-brand-green-900 dark:text-brand-green-300 font-medium"
            >
              <RotateCw className={`size-3.5 ${isResending ? "animate-spin" : ""}`} />
              <span>Resend code</span>
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
