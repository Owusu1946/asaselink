import { ORPCError } from "@orpc/server";
import { sql } from "drizzle-orm";
import { db } from "@asaselink/db";

export async function enforceRateLimit(actorId: string, action: string, limit: number, windowSeconds = 60) {
  const result = await db.execute(sql`
    INSERT INTO api_rate_limits (key, window_started_at, request_count)
    VALUES (${`${actorId}:${action}`}, to_timestamp(floor(extract(epoch from now()) / ${windowSeconds}) * ${windowSeconds}), 1)
    ON CONFLICT (key, window_started_at)
    DO UPDATE SET request_count = api_rate_limits.request_count + 1
    RETURNING request_count
  `);
  const count = Number((result.rows[0] as { request_count?: number } | undefined)?.request_count ?? 0);
  if (count > limit) throw new ORPCError("TOO_MANY_REQUESTS", { message: "Too many attempts. Please wait a moment and try again." });
}
