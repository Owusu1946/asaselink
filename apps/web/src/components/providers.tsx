"use client";

import { GooeyToaster } from "goey-toast";
import { useTheme } from "next-themes";

import { ThemeProvider } from "./theme-provider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AppProviders>{children}</AppProviders>
    </ThemeProvider>
  );
}

function AppProviders({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();

  return (
    <>
      {children}
      <GooeyToaster
        position="top-right"
        theme={resolvedTheme === "dark" ? "dark" : "light"}
        preset="subtle"
        bounce={0.1}
        closeButton="top-right"
        closeOnEscape
        swipeToDismiss
        maxQueue={3}
        queueOverflow="drop-oldest"
        showTimestamp={false}
      />
    </>
  );
}
