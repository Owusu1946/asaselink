import { sql } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { db } from "@asaselink/db";
import { publicProcedure } from "../index";

export const supportRouter = {
  create: publicProcedure.input(z.object({
    name: z.string().trim().min(2).max(160),
    email: z.string().trim().email().max(256),
    subject: z.string().trim().min(4).max(160),
    message: z.string().trim().min(20).max(4000),
    website: z.string().max(0).optional(),
  })).handler(async ({ input }) => {
    const reference = `HELP-${crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`;
    const email = input.email.toLowerCase();
    const result = await db.execute(sql`
      INSERT INTO support_requests (reference, name, email, subject, message)
      SELECT ${reference}, ${input.name}, ${email}, ${input.subject}, ${input.message}
      WHERE (SELECT count(*) FROM support_requests WHERE email=${email} AND created_at > now() - interval '1 hour') < 5
      RETURNING reference, status, created_at AS "createdAt"
    `);
    if (!result.rows[0]) throw new ORPCError("TOO_MANY_REQUESTS", { message: "Too many support requests. Wait an hour before trying again." });
    return result.rows[0];
  }),
};
