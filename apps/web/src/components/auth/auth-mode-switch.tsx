"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@asaselink/ui/lib/utils";

interface AuthModeSwitchProps {
  currentMode: "sign-in" | "sign-up";
}

export function AuthModeSwitch({ currentMode }: AuthModeSwitchProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams?.toString() ? `?${searchParams.toString()}` : "";

  const isSignIn = currentMode === "sign-in" || pathname?.includes("/sign-in");

  return (
    <nav
      aria-label="Authentication mode"
      className="relative flex w-full rounded-full border border-border bg-secondary/70 p-1 text-sm font-medium select-none"
    >
      {/* Moving sliding pill indicator */}
      <div
        className={cn(
          "absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full bg-background shadow-xs transition-transform duration-standard ease-enter",
          isSignIn ? "translate-x-0" : "translate-x-[calc(100%+0px)]",
        )}
        aria-hidden="true"
      />

      <Link
        href={`/sign-in${queryString}`}
        prefetch
        aria-current={isSignIn ? "page" : undefined}
        className={cn(
          "relative z-10 flex-1 py-1.5 text-center text-xs sm:text-sm font-medium transition-colors duration-fast rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isSignIn
            ? "text-foreground font-semibold"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        Sign in
      </Link>

      <Link
        href={`/sign-up${queryString}`}
        prefetch
        aria-current={!isSignIn ? "page" : undefined}
        className={cn(
          "relative z-10 flex-1 py-1.5 text-center text-xs sm:text-sm font-medium transition-colors duration-fast rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring",
          !isSignIn
            ? "text-foreground font-semibold"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        Create account
      </Link>
    </nav>
  );
}
