"use client";

import { useAuth } from "@clerk/nextjs";
import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";

import { setClerkAuthTokenGetter } from "@/utils/clerk-auth";
import { queryClient } from "@/utils/orpc";

function ClerkApiAuthBridge() {
  const { getToken } = useAuth();

  useEffect(() => {
    setClerkAuthTokenGetter(getToken);

    return () => {
      setClerkAuthTokenGetter(null);
    };
  }, [getToken]);

  return null;
}

export default function ApiProvider({
  children,
  clerkEnabled = false,
}: {
  children: React.ReactNode;
  clerkEnabled?: boolean;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      {clerkEnabled ? <ClerkApiAuthBridge /> : null}
      {children}
    </QueryClientProvider>
  );
}
