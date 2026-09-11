"use client";

import * as React from "react";
import { AuthMethodSwitch, type AuthMethod } from "./auth-method-switch";
import { AuthSubmitButton } from "./auth-submit-button";
import { Input } from "@asaselink/ui/components/input";
import { Label } from "@asaselink/ui/components/label";

export interface IdentifierSubmitPayload {
  method: AuthMethod;
  identifier: string; // e.g. email or E.164 phone (+233...)
}

interface IdentifierFormProps {
  isLoading?: boolean;
  initialMethod?: AuthMethod;
  onSubmit: (payload: IdentifierSubmitPayload) => Promise<void> | void;
}

export function IdentifierForm({
  isLoading = false,
  initialMethod = "email",
  onSubmit,
}: IdentifierFormProps) {
  const [method, setMethod] = React.useState<AuthMethod>(initialMethod);
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [fieldError, setFieldError] = React.useState<string | null>(null);

  const handleMethodChange = (newMethod: AuthMethod) => {
    setMethod(newMethod);
    setFieldError(null);
  };

  const validateEmail = (val: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(val.trim());
  };

  const normalizeGhanaPhone = (val: string): string | null => {
    // Strip spaces, dashes, parentheses
    const cleaned = val.replace(/[\s\-()]/g, "");
    // If starts with 0 (e.g. 0244123456), convert 0 to +233
    if (/^0\d{9}$/.test(cleaned)) {
      return `+233${cleaned.slice(1)}`;
    }
    // If starts with +233
    if (/^\+233\d{9}$/.test(cleaned)) {
      return cleaned;
    }
    // If starts with 233 without +
    if (/^233\d{9}$/.test(cleaned)) {
      return `+${cleaned}`;
    }
    // If 9 digits entered directly (e.g. 244123456)
    if (/^\d{9}$/.test(cleaned)) {
      return `+233${cleaned}`;
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError(null);

    if (method === "email") {
      const trimmedEmail = email.trim();
      if (!trimmedEmail) {
        setFieldError("Please enter your email address.");
        return;
      }
      if (!validateEmail(trimmedEmail)) {
        setFieldError("Please enter a valid email address (e.g. name@domain.com).");
        return;
      }
      await onSubmit({ method: "email", identifier: trimmedEmail });
    } else {
      const trimmedPhone = phone.trim();
      if (!trimmedPhone) {
        setFieldError("Please enter your Ghana mobile number.");
        return;
      }
      const normalized = normalizeGhanaPhone(trimmedPhone);
      if (!normalized) {
        setFieldError("Please enter a valid Ghana phone number (e.g. 024 123 4567).");
        return;
      }
      await onSubmit({ method: "phone", identifier: normalized });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Method Switcher */}
      <AuthMethodSwitch activeMethod={method} onChange={handleMethodChange} disabled={isLoading} />

      {method === "email" ? (
        <div className="space-y-1.5">
          <Label htmlFor="auth-email" className="text-xs font-medium text-foreground">
            Email address
          </Label>
          <Input
            id="auth-email"
            type="email"
            autoComplete="email"
            autoFocus
            disabled={isLoading}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldError) setFieldError(null);
            }}
            placeholder="you@domain.com"
            aria-invalid={!!fieldError}
            aria-describedby={fieldError ? "email-error" : undefined}
            className="h-11"
          />
          {fieldError && (
            <p id="email-error" className="text-xs text-destructive mt-1">
              {fieldError}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-1.5">
          <Label htmlFor="auth-phone" className="text-xs font-medium text-foreground">
            Ghana phone number
          </Label>
          <div className="relative flex items-center">
            <div className="absolute left-3.5 flex items-center gap-1.5 text-sm font-medium text-muted-foreground select-none pointer-events-none">
              <span>🇬🇭</span>
              <span>+233</span>
            </div>
            <Input
              id="auth-phone"
              type="tel"
              autoComplete="tel"
              autoFocus
              disabled={isLoading}
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (fieldError) setFieldError(null);
              }}
              placeholder="024 123 4567"
              aria-invalid={!!fieldError}
              aria-describedby={fieldError ? "phone-error" : undefined}
              className="h-11 pl-20 tabular-nums font-medium"
            />
          </div>
          {fieldError ? (
            <p id="phone-error" className="text-xs text-destructive mt-1">
              {fieldError}
            </p>
          ) : (
            <p className="text-[11px] text-muted-foreground">
              We&apos;ll send an SMS code to verify your number.
            </p>
          )}
        </div>
      )}

      <AuthSubmitButton isLoading={isLoading} loadingText="Sending code..." className="mt-2">
        Send verification code
      </AuthSubmitButton>
    </form>
  );
}
