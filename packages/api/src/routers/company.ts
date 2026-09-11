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
import { and, eq, inArray, ne } from "drizzle-orm";
import { protectedProcedure } from "../index";
import { enforceRateLimit } from "../security/rate-limit";
import { companyDocumentKey, createDocumentUploadUrl, createDocumentViewUrl, deleteDocumentObject, DOCUMENT_MIME_TYPES, MAX_DOCUMENT_BYTES, verifyDocumentObject } from "../storage/r2";

const documentType = z.enum(["certificate_of_incorporation", "commencement_certificate", "representative_id", "tax_clearance"]);
const requiredDocumentTypes = new Set(["certificate_of_incorporation", "commencement_certificate", "representative_id"]);

export const companyRouter = {
  getApplication: protectedProcedure.handler(async ({ context }) => {
    const clerkId = context.auth?.userId;
    if (!clerkId) throw new ORPCError("UNAUTHORIZED");

    try {
      const userList = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
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
        .where(and(eq(companyDocuments.applicationId, apps[0].application.id), inArray(companyDocuments.status, ["uploaded", "verified", "rejected"])));

      return {
        application: apps[0].application,
        company: apps[0].company,
        documents: docs,
      };
    } catch (err) {
      console.error("Error in getApplication:", err);
      throw err;
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

      const userList = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
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

  beginDocumentUpload: protectedProcedure
    .input(z.object({ documentType, fileName: z.string().trim().min(1).max(256), fileSize: z.number().int().positive().max(MAX_DOCUMENT_BYTES), mimeType: z.enum(DOCUMENT_MIME_TYPES) }))
    .handler(async ({ context, input }) => {
      const clerkId = context.auth?.userId;
      if (!clerkId) throw new ORPCError("UNAUTHORIZED");
      await enforceRateLimit(clerkId, "company.document.upload", 30);
      const [owner] = await db.select({ userId: users.id, application: companyApplications })
        .from(users).innerJoin(companyApplications, eq(companyApplications.applicantUserId, users.id))
        .where(eq(users.clerkId, clerkId)).limit(1);
      if (!owner) throw new ORPCError("NOT_FOUND", { message: "No company application is available." });
      if (owner.application.currentStep === "submitted") throw new ORPCError("CONFLICT", { message: "Submitted applications cannot be edited." });

      const fileKey = companyDocumentKey(owner.application.companyId, owner.application.id, input.documentType, input.fileName);
      const uploadUrl = await createDocumentUploadUrl(fileKey, input.mimeType);
      const [document] = await db.insert(companyDocuments).values({ companyId: owner.application.companyId, applicationId: owner.application.id, documentType: input.documentType, fileName: input.fileName, fileKey, fileSize: input.fileSize, mimeType: input.mimeType, status: "uploading" }).returning();
      if (!document) throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "The upload could not be initialized." });
      return { documentId: document.id, uploadUrl, expiresIn: 300 };
    }),

  confirmDocumentUpload: protectedProcedure
    .input(z.object({ documentId: z.string().uuid() }))
    .handler(async ({ context, input }) => {
      const clerkId = context.auth?.userId;
      if (!clerkId) throw new ORPCError("UNAUTHORIZED");
      const [document] = await db.select({ document: companyDocuments })
        .from(companyDocuments)
        .innerJoin(companyApplications, eq(companyDocuments.applicationId, companyApplications.id))
        .innerJoin(users, eq(companyApplications.applicantUserId, users.id))
        .where(and(eq(companyDocuments.id, input.documentId), eq(users.clerkId, clerkId))).limit(1);
      if (!document) throw new ORPCError("NOT_FOUND");
      const object = await verifyDocumentObject(document.document.fileKey);
      if (object.ContentLength !== document.document.fileSize || object.ContentType !== document.document.mimeType) {
        throw new ORPCError("BAD_REQUEST", { message: "The uploaded file did not match the authorized file metadata." });
      }
      const [confirmed] = await db.update(companyDocuments).set({ status: "uploaded" }).where(eq(companyDocuments.id, input.documentId)).returning();
      const superseded = await db.select().from(companyDocuments).where(and(eq(companyDocuments.applicationId, document.document.applicationId!), eq(companyDocuments.documentType, document.document.documentType), ne(companyDocuments.id, document.document.id)));
      if (superseded.length) {
        await db.delete(companyDocuments).where(inArray(companyDocuments.id, superseded.map((item) => item.id)));
        await Promise.allSettled(superseded.map((item) => deleteDocumentObject(item.fileKey)));
      }
      return confirmed;
    }),

  getDocumentViewUrl: protectedProcedure
    .input(z.object({ documentId: z.string().uuid() }))
    .handler(async ({ context, input }) => {
      const clerkId = context.auth?.userId;
      if (!clerkId) throw new ORPCError("UNAUTHORIZED");
      const [document] = await db.select({ document: companyDocuments })
        .from(companyDocuments)
        .innerJoin(companyApplications, eq(companyDocuments.applicationId, companyApplications.id))
        .innerJoin(users, eq(companyApplications.applicantUserId, users.id))
        .where(and(eq(companyDocuments.id, input.documentId), eq(users.clerkId, clerkId), inArray(companyDocuments.status, ["uploaded", "verified"]))).limit(1);
      if (!document) throw new ORPCError("NOT_FOUND");
      return { url: await createDocumentViewUrl(document.document.fileKey, document.document.fileName), expiresIn: 120 };
    }),

  removeDocument: protectedProcedure
    .input(z.object({ documentId: z.string().uuid() }))
    .handler(async ({ context, input }) => {
      const clerkId = context.auth?.userId;
      if (!clerkId) throw new ORPCError("UNAUTHORIZED");
      const [owned] = await db.select({ document: companyDocuments, application: companyApplications })
        .from(companyDocuments).innerJoin(companyApplications, eq(companyDocuments.applicationId, companyApplications.id)).innerJoin(users, eq(companyApplications.applicantUserId, users.id))
        .where(and(eq(companyDocuments.id, input.documentId), eq(users.clerkId, clerkId))).limit(1);
      if (!owned) throw new ORPCError("NOT_FOUND");
      if (owned.application.currentStep === "submitted") throw new ORPCError("CONFLICT", { message: "Submitted application documents cannot be removed." });
      await deleteDocumentObject(owned.document.fileKey);
      await db.delete(companyDocuments).where(eq(companyDocuments.id, owned.document.id));
      return { success: true };
    }),

  saveDocuments: protectedProcedure
    .input(
      z.object({
        documentIds: z.array(z.string().uuid()).min(3).max(8),
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

      const documents = await db.select().from(companyDocuments).where(and(eq(companyDocuments.applicationId, app.id), inArray(companyDocuments.id, input.documentIds), eq(companyDocuments.status, "uploaded")));
      const uploadedTypes = new Set(documents.map((doc) => doc.documentType));
      if (documents.length !== input.documentIds.length || [...requiredDocumentTypes].some((type) => !uploadedTypes.has(type))) {
        throw new ORPCError("BAD_REQUEST", { message: "Upload and confirm every required document before continuing." });
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
