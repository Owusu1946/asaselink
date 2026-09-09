import * as React from "react";
import { AuthModeSwitch } from "./auth-mode-switch";

interface AuthFormPanelProps {
  mode: "sign-in" | "sign-up";
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function AuthFormPanel({
  mode,
  title,
  subtitle,
  children,
}: AuthFormPanelProps) {
  return (
    <section aria-labelledby="auth-heading" className="w-full flex flex-col">
      {/* Top Segmented Mode Switch */}
      <div className="mb-6">
        <AuthModeSwitch currentMode={mode} />
      </div>

      {/* Screen Title & Description */}
      <div className="mb-6 text-left">
        <h1
          id="auth-heading"
          className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
        >
          {title}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {subtitle}
        </p>
      </div>

      {/* Form Content */}
      <div className="w-full">
        {children}
      </div>
    </section>
  );
}
