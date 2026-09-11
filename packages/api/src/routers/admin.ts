import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { db } from "@asaselink/db";
import {
  users,
  companies,
  companyApplications,
  companyDocuments,
  auditLogs,
} from "@asaselink/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { protectedProcedure } from "../index";

export const adminRouter = {
  getEstateQueue: protectedProcedure.handler(async ({ context }) => {
    const clerkId = context.auth?.userId;
    if (!clerkId) throw new ORPCError("UNAUTHORIZED");
    const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
    if (!user?.isAdmin) throw new ORPCError("FORBIDDEN");
    const result = await db.execute(sql`
      SELECT e.id, e.name, e.slug, e.region, e.district, e.status, e.updated_at AS "updatedAt",
        c.legal_name AS "companyName", count(p.id)::int AS "plotCount"
      FROM estates e JOIN companies c ON c.id=e.company_id LEFT JOIN plots p ON p.estate_id=e.id
      WHERE e.status IN ('submitted','approved','rejected')
      GROUP BY e.id, c.legal_name ORDER BY e.updated_at DESC LIMIT 100
    `);
    return result.rows;
  }),

  reviewEstate: protectedProcedure.input(z.object({ estateId: z.string().uuid(), decision: z.enum(["approved", "rejected"]), reason: z.string().trim().min(5).max(1000) })).handler(async ({ context, input }) => {
    const clerkId = context.auth?.userId;
    if (!clerkId) throw new ORPCError("UNAUTHORIZED");
    const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
    if (!user?.isAdmin) throw new ORPCError("FORBIDDEN");
    const updated = await db.execute(sql`UPDATE estates SET status=${input.decision}, updated_at=now() WHERE id=${input.estateId} AND status='submitted' RETURNING id, status`);
    if (!updated.rows[0]) throw new ORPCError("CONFLICT", { message: "This estate is not awaiting review." });
    await db.insert(auditLogs).values({ userId: user.id, action: `estate.${input.decision}`, entityType: "estate", entityId: input.estateId, reason: input.reason });
    return updated.rows[0];
  }),

  getVerificationQueue: protectedProcedure.handler(async ({ context }) => {
    const clerkId = context.auth?.userId;
    if (!clerkId) throw new ORPCError("UNAUTHORIZED");

    const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
    if (!user?.isAdmin) {
      throw new ORPCError("FORBIDDEN");
    }

    try {
      const queue = await db
        .select({
          company: companies,
          application: companyApplications,
        })
        .from(companies)
        .leftJoin(companyApplications, eq(companies.id, companyApplications.companyId))
        .orderBy(desc(companies.createdAt));

      return queue;
    } catch (err) {
      console.error("Error in getVerificationQueue:", err);
      throw err;
    }
  }),

  getCompanyReview: protectedProcedure
    .input(z.object({ companyId: z.string() }))
    .handler(async ({ context, input }) => {
      const clerkId = context.auth?.userId;
      if (!clerkId) throw new ORPCError("UNAUTHORIZED");

      const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
      if (!user?.isAdmin) throw new ORPCError("FORBIDDEN");

      const [company] = await db
        .select()
        .from(companies)
        .where(eq(companies.id, input.companyId))
        .limit(1);

      if (!company) throw new ORPCError("NOT_FOUND");

      const [application] = await db
        .select()
        .from(companyApplications)
        .where(eq(companyApplications.companyId, input.companyId))
        .limit(1);

      const documents = await db
        .select()
        .from(companyDocuments)
        .where(eq(companyDocuments.companyId, input.companyId));

      const logs = await db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.entityId, input.companyId))
        .orderBy(desc(auditLogs.createdAt));

      return {
        company,
        application: application || null,
        documents,
        logs,
      };
    }),

  reviewCompany: protectedProcedure
    .input(
      z.object({
        companyId: z.string(),
        decision: z.enum(["approved", "rejected", "changes_requested"]),
        reason: z.string().min(5, "A substantive reason is required for review decisions"),
      }),
    )
    .handler(async ({ context, input }) => {
      const clerkId = context.auth?.userId;
      if (!clerkId) throw new ORPCError("UNAUTHORIZED");

      const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
      if (!user?.isAdmin) throw new ORPCError("FORBIDDEN");

      const [company] = await db
        .select()
        .from(companies)
        .where(eq(companies.id, input.companyId))
        .limit(1);

      if (!company) throw new ORPCError("NOT_FOUND");

      const now = new Date();

      // 1. Update company status
      await db
        .update(companies)
        .set({
          status: input.decision,
          updatedAt: now,
        })
        .where(eq(companies.id, input.companyId));

      // 2. Update application status if exists
      await db
        .update(companyApplications)
        .set({
          reviewedAt: now,
          reviewerUserId: user.id,
          reviewNotes: input.reason,
          updatedAt: now,
        })
        .where(eq(companyApplications.companyId, input.companyId));

      // 3. Create immutable audit log
      await db.insert(auditLogs).values({
        userId: user.id,
        action: `company.${input.decision}`,
        entityType: "company",
        entityId: input.companyId,
        reason: input.reason,
        metadata: {
          previousStatus: company.status,
          newStatus: input.decision,
          reviewedAt: now.toISOString(),
        },
      });

      return { success: true, newStatus: input.decision };
    }),
};
