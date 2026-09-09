"use client";

import * as React from "react";
import { Button } from "@asaselink/ui/components/button";
import { Spinner } from "@asaselink/ui/components/spinner";
import { cn } from "@asaselink/ui/lib/utils";

interface AuthSubmitButtonProps extends React.ComponentProps<typeof Button> {
  isLoading?: boolean;
  loadingText?: string;
}

export function AuthSubmitButton({
  children,
  isLoading = false,
  loadingText = "Please wait...",
  disabled,
  className,
  ...props
}: AuthSubmitButtonProps) {
  return (
    <Button
      type="submit"
      size="lg"
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      className={cn(
        "w-full h-11 justify-center font-medium transition-[color,background-color,border-color,box-shadow,opacity] duration-fast",
        isLoading && "opacity-90 cursor-wait",
        className,
      )}
      {...props}
    >
      {isLoading ? (
        <>
          <Spinner className="size-4" />
          <span>{loadingText}</span>
        </>
      ) : (
        children
      )}
    </Button>
  );
}
