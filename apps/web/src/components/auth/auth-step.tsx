import * as React from "react";
import { cn } from "@asaselink/ui/lib/utils";

interface AuthStepProps extends React.ComponentProps<"div"> {
  children: React.ReactNode;
  direction?: "forward" | "backward";
}

export function AuthStep({
  children,
  className,
  ...props
}: AuthStepProps) {
  return (
    <div
      className={cn(
        "w-full transition-all duration-standard ease-enter",
        "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-3",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
