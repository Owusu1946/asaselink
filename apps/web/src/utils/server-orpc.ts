import "server-only";

import type { AppRouterClient } from "@asaselink/api/routers/index";
import { env } from "@asaselink/env/web";
import { auth } from "@clerk/nextjs/server";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";

function serverUrl() {
  const configured = process.env.SERVER_URL || env.NEXT_PUBLIC_SERVER_URL;
  return configured.endsWith("/") ? configured.slice(0, -1) : configured;
}

export async function getServerApiClient(): Promise<AppRouterClient> {
  const { getToken } = await auth();
  const token = await getToken();

  return createORPCClient(
    new RPCLink({
      url: `${serverUrl()}/rpc`,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),
  );
}
