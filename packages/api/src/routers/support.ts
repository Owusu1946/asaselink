import { sql } from "drizzle-orm";
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
    const result = await db.execute(sql`
      INSERT INTO support_requests (reference, name, email, subject, message)
      VALUES (${reference}, ${input.name}, ${input.email.toLowerCase()}, ${input.subject}, ${input.message})
      RETURNING reference, status, created_at AS "createdAt"
    `);
    return result.rows[0];
  }),
};
