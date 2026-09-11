"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";

interface AuthErrorSummaryProps {
  error?: string | null;
  onClear?: () => void;
}

export function AuthErrorSummary({ error }: AuthErrorSummaryProps) {
  if (!error) return null;

  return (
    <div
      role="alert"
      tabIndex={-1}
      className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive motion-safe:animate-in motion-safe:fade-in duration-fast"
    >
      <AlertCircle className="size-4 shrink-0 translate-y-0.5" />
      <div className="flex-1 leading-relaxed">
        <p className="font-semibold text-destructive">Unable to continue</p>
        <p className="mt-0.5 text-destructive/90">{error}</p>
      </div>
    </div>
  );
}
