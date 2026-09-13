import "server-only";

import type { AppRouterClient } from "@asaselink/api/routers/index";
import { env } from "@asaselink/env/web";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";

function serverUrl() {
  const configured = process.env.SERVER_URL || env.NEXT_PUBLIC_SERVER_URL;
  return configured.endsWith("/") ? configured.slice(0, -1) : configured;
}

/** Public procedures only. Never attach Clerk state or request cookies here. */
export function getPublicServerApiClient(): AppRouterClient {
  return createORPCClient(new RPCLink({ url: `${serverUrl()}/rpc`, headers: {} }));
}
