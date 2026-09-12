type ClerkContextAuth = {
  userId: string | null;
};

type ClerkRequestContext = {
  auth: ClerkContextAuth | null;
  session: null;
};

function toClerkContextAuth(auth: { userId: string | null } | null): ClerkContextAuth | null {
  return auth ? { userId: auth.userId } : null;
}

import { env } from "@asaselink/env/server";
import { createClerkClient } from "@clerk/backend";

const clerkClient =
  env.CLERK_SECRET_KEY && env.CLERK_PUBLISHABLE_KEY
    ? createClerkClient({
        secretKey: env.CLERK_SECRET_KEY,
        publishableKey: env.CLERK_PUBLISHABLE_KEY,
      })
    : null;

export function requireClerkClient() {
  if (!clerkClient) throw new Error("Clerk server credentials are not configured");
  return clerkClient;
}

async function authenticateClerkRequest(request: Request): Promise<ClerkContextAuth | null> {
  if (!clerkClient) return null;

  const requestState = await clerkClient.authenticateRequest(request, {
    authorizedParties: allowedOrigins(),
  });
  return toClerkContextAuth(requestState.toAuth());
}

export function allowedOrigins() {
  return env.CORS_ORIGIN.split(",").map((origin) => origin.trim().replace(/\/$/, "")).filter(Boolean);
}

import type { Context as HonoContext } from "hono";

export type CreateContextOptions = {
  context: HonoContext;
};

export async function createContext({
  context,
}: CreateContextOptions): Promise<ClerkRequestContext> {
  const clerkAuth = await authenticateClerkRequest(context.req.raw);
  return {
    auth: clerkAuth,
    session: null,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
