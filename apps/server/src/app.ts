import { allowedOrigins, createContext } from "@asaselink/api/context";
import { appRouter } from "@asaselink/api/routers/index";
import { handleClerkWebhook } from "@asaselink/api/webhooks/clerk";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { Hono } from "hono";
import { cors } from "hono/cors";

export const app = new Hono();

app.post("/webhooks/clerk", (c) => handleClerkWebhook(c.req.raw));

app.use("/*", async (c, next) => {
  const startedAt = performance.now();
  const requestId = c.req.header("cf-ray") ?? crypto.randomUUID();
  c.header("x-request-id", requestId);
  await next();
  const durationMs = Math.round((performance.now() - startedAt) * 100) / 100;
  c.header("server-timing", `app;dur=${durationMs}`);
  console.log(JSON.stringify({ event: "http.request", requestId, method: c.req.method, path: new URL(c.req.url).pathname, status: c.res.status, durationMs }));
});

app.use("/*", cors({
  origin: allowedOrigins(),
  allowMethods: ["GET", "POST", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
}));

export const apiHandler = new OpenAPIHandler(appRouter, {
  plugins: [new OpenAPIReferencePlugin({ schemaConverters: [new ZodToJsonSchemaConverter()] })],
  interceptors: [onError((error) => console.error(error))],
});

export const rpcHandler = new RPCHandler(appRouter, {
  interceptors: [onError((error) => console.error(error))],
});

app.use("/*", async (c, next) => {
  const context = await createContext({ context: c });
  const rpcResult = await rpcHandler.handle(c.req.raw, { prefix: "/rpc", context });
  if (rpcResult.matched) return c.newResponse(rpcResult.response.body, rpcResult.response);
  const apiResult = await apiHandler.handle(c.req.raw, { prefix: "/api-reference", context });
  if (apiResult.matched) return c.newResponse(apiResult.response.body, apiResult.response);
  await next();
});

app.get("/", (c) => c.text("OK"));
app.get("/health", (c) => c.json({ status: "ok", service: "asaselink-api" }));
