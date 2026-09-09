"use client";

import * as React from "react";
import { cn } from "@asaselink/ui/lib/utils";
import { Mail, Phone } from "lucide-react";

export type AuthMethod = "email" | "phone";

interface AuthMethodSwitchProps {
  activeMethod: AuthMethod;
  onChange: (method: AuthMethod) => void;
  disabled?: boolean;
}

export function AuthMethodSwitch({
  activeMethod,
  onChange,
  disabled = false,
}: AuthMethodSwitchProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Authentication identifier method"
      className="inline-flex w-full rounded-xl border border-border bg-secondary/50 p-1 text-xs select-none"
    >
      <button
        type="button"
        role="radio"
        aria-checked={activeMethod === "email"}
        disabled={disabled}
        onClick={() => onChange("email")}
        className={cn(
          "flex-1 inline-flex items-center justify-center gap-2 rounded-lg py-1.5 px-3 font-medium transition-all duration-fast outline-none focus-visible:ring-2 focus-visible:ring-ring",
          activeMethod === "email"
            ? "bg-background text-foreground shadow-xs"
            : "text-muted-foreground hover:text-foreground",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        <Mail className="size-3.5" />
        <span>Email code</span>
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={activeMethod === "phone"}
        disabled={disabled}
        onClick={() => onChange("phone")}
        className={cn(
          "flex-1 inline-flex items-center justify-center gap-2 rounded-lg py-1.5 px-3 font-medium transition-all duration-fast outline-none focus-visible:ring-2 focus-visible:ring-ring",
          activeMethod === "phone"
            ? "bg-background text-foreground shadow-xs"
            : "text-muted-foreground hover:text-foreground",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        <Phone className="size-3.5" />
        <span>Ghana phone (SMS)</span>
      </button>
    </div>
  );
}
