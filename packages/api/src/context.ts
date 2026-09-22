type ClerkContextAuth = {
  userId: string | null;
};

type ClerkRequestContext = {
  auth: ClerkContextAuth | null;
  session: null;
  requestKey: string;
};

async function anonymousRequestKey(request: Request) {
  const address = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(address));
  return `visitor:${Array.from(new Uint8Array(bytes)).slice(0, 12).map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

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

  // Public RPC calls do not carry credentials. Avoid Clerk's JWT/session work on
  // every landing-page request; protected procedures still require a bearer token.
  const hasAuthorization = Boolean(request.headers.get("authorization"));
  const hasSessionCookie = /(?:^|;\s*)__session=/.test(request.headers.get("cookie") ?? "");
  if (!hasAuthorization && !hasSessionCookie) return null;

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
    requestKey: clerkAuth?.userId ?? await anonymousRequestKey(context.req.raw),
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
