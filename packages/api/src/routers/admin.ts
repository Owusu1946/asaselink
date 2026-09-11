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
import { desc, eq } from "drizzle-orm";
import { protectedProcedure } from "../index";

export const adminRouter = {
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
