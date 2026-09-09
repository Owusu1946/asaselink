import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { db } from "@asaselink/db";
import {
  users,
  companies,
  companyApplications,
  companyDocuments,
  companyMembers,
  auditLogs,
} from "@asaselink/db/schema";
import { eq } from "drizzle-orm";
import { protectedProcedure } from "../index";

export const companyRouter = {
  getApplication: protectedProcedure.handler(async ({ context }) => {
    const clerkId = context.auth?.userId;
    if (!clerkId) throw new ORPCError("UNAUTHORIZED");

    try {
      const userList = await db
        .select()
        .from(users)
        .where(eq(users.clerkId, clerkId))
        .limit(1);
      const userRecord = userList[0];
      if (!userRecord) return null;

      const apps = await db
        .select({
          application: companyApplications,
          company: companies,
        })
        .from(companyApplications)
        .innerJoin(companies, eq(companyApplications.companyId, companies.id))
        .where(eq(companyApplications.applicantUserId, userRecord.id))
        .limit(1);

      if (apps.length === 0 || !apps[0]) return null;

      const docs = await db
        .select()
        .from(companyDocuments)
        .where(eq(companyDocuments.applicationId, apps[0].application.id));

      return {
        application: apps[0].application,
        company: apps[0].company,
        documents: docs,
      };
    } catch (err) {
      console.error("Error in getApplication:", err);
      return null;
    }
  }),

  saveDetails: protectedProcedure
    .input(
      z.object({
        legalName: z.string().min(2, "Legal business name is required"),
        tradeName: z.string().optional(),
        registrationNumber: z.string().min(2, "Registration number is required"),
        taxNumber: z.string().optional(),
        email: z.string().email("Valid business email is required"),
        phone: z.string().min(8, "Valid phone number is required"),
        website: z.string().optional(),
        address: z.string().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      const clerkId = context.auth?.userId;
      if (!clerkId) throw new ORPCError("UNAUTHORIZED");

      const userList = await db
        .select()
        .from(users)
        .where(eq(users.clerkId, clerkId))
        .limit(1);
      let userRecord = userList[0];
      if (!userRecord) {
        const inserted = await db.insert(users).values({ clerkId, status: "active" }).returning();
        userRecord = inserted[0];
      }
      if (!userRecord) throw new Error("User record unavailable");

      // Check existing application
      const existingApps = await db
        .select()
        .from(companyApplications)
        .where(eq(companyApplications.applicantUserId, userRecord.id))
        .limit(1);

      let companyId: string;

      if (existingApps.length > 0 && existingApps[0]) {
        companyId = existingApps[0].companyId;
        await db
          .update(companies)
          .set({
            legalName: input.legalName,
            tradeName: input.tradeName,
            registrationNumber: input.registrationNumber,
            taxNumber: input.taxNumber,
            email: input.email,
            phone: input.phone,
            website: input.website,
            address: input.address,
            updatedAt: new Date(),
          })
          .where(eq(companies.id, companyId));

        await db
          .update(companyApplications)
          .set({
            currentStep: "representative",
            updatedAt: new Date(),
          })
          .where(eq(companyApplications.id, existingApps[0].id));
      } else {
        const [comp] = await db
          .insert(companies)
          .values({
            legalName: input.legalName,
            tradeName: input.tradeName,
            registrationNumber: input.registrationNumber,
            taxNumber: input.taxNumber,
            email: input.email,
            phone: input.phone,
            website: input.website,
            address: input.address,
            status: "pending",
          })
          .returning();
        if (!comp) throw new Error("Failed to create company record");
        companyId = comp.id;

        await db.insert(companyApplications).values({
          companyId: comp.id,
          applicantUserId: userRecord.id,
          currentStep: "representative",
        });

        await db.insert(companyMembers).values({
          companyId: comp.id,
          userId: userRecord.id,
          role: "owner",
          status: "active",
        });
      }

      return { success: true, companyId, nextStep: "representative" };
    }),

  saveRepresentative: protectedProcedure
    .input(
      z.object({
        repFullName: z.string().min(2, "Representative name is required"),
        repRole: z.string().min(2, "Representative role is required"),
        repEmail: z.string().email("Valid email is required"),
        repPhone: z.string().min(8, "Valid phone number is required"),
        repIdType: z.string().min(2, "ID type is required"),
        repIdNumber: z.string().min(2, "ID number is required"),
      }),
    )
    .handler(async ({ context, input }) => {
      const clerkId = context.auth?.userId;
      if (!clerkId) throw new ORPCError("UNAUTHORIZED");

      const userList = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
      const userRecord = userList[0];
      if (!userRecord) throw new ORPCError("UNAUTHORIZED");

      const [app] = await db
        .select()
        .from(companyApplications)
        .where(eq(companyApplications.applicantUserId, userRecord.id))
        .limit(1);
      if (!app) throw new Error("No application in progress");

      await db
        .update(companyApplications)
        .set({
          repFullName: input.repFullName,
          repRole: input.repRole,
          repEmail: input.repEmail,
          repPhone: input.repPhone,
          repIdType: input.repIdType,
          repIdNumber: input.repIdNumber,
          currentStep: "documents",
          updatedAt: new Date(),
        })
        .where(eq(companyApplications.id, app.id));

      return { success: true, nextStep: "documents" };
    }),

  saveDocuments: protectedProcedure
    .input(
      z.object({
        documents: z.array(
          z.object({
            documentType: z.string(),
            fileName: z.string(),
            fileKey: z.string(),
            fileSize: z.number().optional(),
            mimeType: z.string().optional(),
          }),
        ),
      }),
    )
    .handler(async ({ context, input }) => {
      const clerkId = context.auth?.userId;
      if (!clerkId) throw new ORPCError("UNAUTHORIZED");

      const userList = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
      const userRecord = userList[0];
      if (!userRecord) throw new ORPCError("UNAUTHORIZED");

      const [app] = await db
        .select()
        .from(companyApplications)
        .where(eq(companyApplications.applicantUserId, userRecord.id))
        .limit(1);
      if (!app) throw new Error("No application in progress");

      for (const doc of input.documents) {
        await db.insert(companyDocuments).values({
          companyId: app.companyId,
          applicationId: app.id,
          documentType: doc.documentType,
          fileName: doc.fileName,
          fileKey: doc.fileKey,
          fileSize: doc.fileSize,
          mimeType: doc.mimeType,
          status: "uploaded",
        });
      }

      await db
        .update(companyApplications)
        .set({
          currentStep: "review",
          updatedAt: new Date(),
        })
        .where(eq(companyApplications.id, app.id));

      return { success: true, nextStep: "review" };
    }),

  submitApplication: protectedProcedure
    .input(
      z.object({
        declarationAccepted: z.boolean().refine((val) => val === true, {
          message: "You must accept the legal declaration to submit your application.",
        }),
      }),
    )
    .handler(async ({ context, input }) => {
      const clerkId = context.auth?.userId;
      if (!clerkId) throw new ORPCError("UNAUTHORIZED");

      const userList = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
      const userRecord = userList[0];
      if (!userRecord) throw new ORPCError("UNAUTHORIZED");

      const [app] = await db
        .select()
        .from(companyApplications)
        .where(eq(companyApplications.applicantUserId, userRecord.id))
        .limit(1);
      if (!app) throw new Error("No application in progress");

      const now = new Date();

      // Update application
      await db
        .update(companyApplications)
        .set({
          declarationAccepted: input.declarationAccepted,
          currentStep: "submitted",
          submittedAt: now,
          updatedAt: now,
        })
        .where(eq(companyApplications.id, app.id));

      // Update company status to under_review
      await db
        .update(companies)
        .set({
          status: "under_review",
          updatedAt: now,
        })
        .where(eq(companies.id, app.companyId));

      // Create immutable audit log
      await db.insert(auditLogs).values({
        userId: userRecord.id,
        action: "company.application_submitted",
        entityType: "company",
        entityId: app.companyId,
        metadata: {
          applicationId: app.id,
          submittedAt: now.toISOString(),
        },
      });

      return { success: true, status: "under_review" };
    }),
};
