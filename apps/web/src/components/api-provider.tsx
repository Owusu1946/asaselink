"use client";

import { useAuth } from "@clerk/nextjs";
import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { setClerkAuthTokenGetter } from "@/utils/clerk-auth";
import { createQueryClient } from "@/utils/orpc";

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
  const [queryClient] = useState(createQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      {clerkEnabled ? <ClerkApiAuthBridge /> : null}
      {children}
    </QueryClientProvider>
  );
}
