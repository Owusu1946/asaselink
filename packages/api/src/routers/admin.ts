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
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { protectedProcedure } from "../index";
import { enforceRateLimit } from "../security/rate-limit";
import { createDocumentViewUrl } from "../storage/r2";

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
    await enforceRateLimit(clerkId, "admin.estate.review", 60);
    const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
    if (!user?.isAdmin) throw new ORPCError("FORBIDDEN");
    const updated = await db.execute(sql`
      WITH reviewed AS (
        UPDATE estates SET status=${input.decision}, updated_at=now()
        WHERE id=${input.estateId} AND status='submitted' RETURNING id, status
      ), outboxed AS (
        INSERT INTO outbox_events (topic, aggregate_id, payload)
        SELECT 'estate.reviewed', id::text, jsonb_build_object('estateId', id, 'decision', status) FROM reviewed
      ) SELECT * FROM reviewed
    `);
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
        .where(and(eq(companyDocuments.companyId, input.companyId), inArray(companyDocuments.status, ["uploaded", "verified", "rejected"])));

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

  getCompanyDocumentViewUrl: protectedProcedure
    .input(z.object({ companyId: z.string().uuid(), documentId: z.string().uuid() }))
    .handler(async ({ context, input }) => {
      const clerkId = context.auth?.userId;
      if (!clerkId) throw new ORPCError("UNAUTHORIZED");
      const [admin] = await db.select({ id: users.id, isAdmin: users.isAdmin }).from(users).where(eq(users.clerkId, clerkId)).limit(1);
      if (!admin?.isAdmin) throw new ORPCError("FORBIDDEN");
      await enforceRateLimit(clerkId, "admin.document.view", 120);
      const [document] = await db.select().from(companyDocuments).where(and(eq(companyDocuments.id, input.documentId), eq(companyDocuments.companyId, input.companyId), inArray(companyDocuments.status, ["uploaded", "verified", "rejected"]))).limit(1);
      if (!document) throw new ORPCError("NOT_FOUND");
      await db.insert(auditLogs).values({ userId: admin.id, action: "company.document_viewed", entityType: "company_document", entityId: document.id, metadata: { companyId: input.companyId } });
      return { url: await createDocumentViewUrl(document.fileKey, document.fileName), expiresIn: 120 };
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
      await enforceRateLimit(clerkId, "admin.company.review", 60);

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
          currentStep: input.decision === "changes_requested" ? "documents" : "submitted",
          reviewedAt: now,
          reviewerUserId: user.id,
          reviewNotes: input.reason,
          updatedAt: now,
        })
        .where(eq(companyApplications.companyId, input.companyId));

      if (input.decision === "approved" || input.decision === "rejected") {
        await db.update(companyDocuments).set({ status: input.decision === "approved" ? "verified" : "rejected" }).where(eq(companyDocuments.companyId, input.companyId));
      }

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

  listUsers: protectedProcedure.input(z.object({ search: z.string().trim().max(128).optional() })).handler(async ({ context, input }) => {
    const clerkId = context.auth?.userId;
    if (!clerkId) throw new ORPCError("UNAUTHORIZED");
    const [admin] = await db.select({ isAdmin: users.isAdmin }).from(users).where(eq(users.clerkId, clerkId)).limit(1);
    if (!admin?.isAdmin) throw new ORPCError("FORBIDDEN");
    const search = `%${input.search ?? ""}%`;
    return db.execute(sql`SELECT id, clerk_id AS "clerkId", email, phone_number AS "phoneNumber", first_name AS "firstName", last_name AS "lastName", status, is_admin AS "isAdmin", created_at AS "createdAt", updated_at AS "updatedAt" FROM users WHERE ${input.search ? sql`coalesce(email,'') ILIKE ${search} OR coalesce(first_name || ' ' || last_name,'') ILIKE ${search}` : sql`TRUE`} ORDER BY created_at DESC LIMIT 200`).then((result) => result.rows);
  }),

  updateUserAccess: protectedProcedure.input(z.object({ userId: z.string().uuid(), status: z.enum(["active", "suspended", "restricted"]), isAdmin: z.boolean(), reason: z.string().trim().min(5).max(1000) })).handler(async ({ context, input }) => {
    const clerkId = context.auth?.userId;
    if (!clerkId) throw new ORPCError("UNAUTHORIZED");
    await enforceRateLimit(clerkId, "admin.user.update", 60);
    const [admin] = await db.select({ id: users.id, isAdmin: users.isAdmin }).from(users).where(eq(users.clerkId, clerkId)).limit(1);
    if (!admin?.isAdmin) throw new ORPCError("FORBIDDEN");
    if (admin.id === input.userId && (input.status !== "active" || !input.isAdmin)) throw new ORPCError("BAD_REQUEST", { message: "You cannot suspend yourself or remove your own admin access." });
    const result = await db.execute(sql`WITH previous AS (SELECT id, status, is_admin FROM users WHERE id=${input.userId}), changed AS (UPDATE users SET status=${input.status}, is_admin=${input.isAdmin}, updated_at=now() WHERE id=${input.userId} RETURNING id, status, is_admin AS "isAdmin", updated_at AS "updatedAt") INSERT INTO audit_logs (user_id, action, entity_type, entity_id, reason, metadata) SELECT ${admin.id}, 'user.access_updated', 'user', changed.id::text, ${input.reason}, jsonb_build_object('previousStatus', previous.status, 'newStatus', changed.status, 'previousIsAdmin', previous.is_admin, 'newIsAdmin', changed."isAdmin") FROM changed JOIN previous USING (id) RETURNING (SELECT row_to_json(changed) FROM changed) AS user`);
    const updated = (result.rows[0] as { user?: unknown } | undefined)?.user;
    if (!updated) throw new ORPCError("NOT_FOUND");
    return updated;
  }),

  listAuditLogs: protectedProcedure.input(z.object({ search: z.string().trim().max(128).optional() })).handler(async ({ context, input }) => {
    const clerkId = context.auth?.userId;
    if (!clerkId) throw new ORPCError("UNAUTHORIZED");
    const [admin] = await db.select({ isAdmin: users.isAdmin }).from(users).where(eq(users.clerkId, clerkId)).limit(1);
    if (!admin?.isAdmin) throw new ORPCError("FORBIDDEN");
    const search = `%${input.search ?? ""}%`;
    return db.execute(sql`SELECT a.id, a.action, a.entity_type AS "entityType", a.entity_id AS "entityId", a.reason, a.metadata, a.created_at AS "createdAt", coalesce(u.email, 'System') AS actor FROM audit_logs a LEFT JOIN users u ON u.id=a.user_id WHERE ${input.search ? sql`a.action ILIKE ${search} OR a.entity_type ILIKE ${search} OR a.entity_id ILIKE ${search} OR coalesce(u.email,'') ILIKE ${search}` : sql`TRUE`} ORDER BY a.created_at DESC LIMIT 250`).then((result) => result.rows);
  }),

  getOperations: protectedProcedure.handler(async ({ context }) => {
    const clerkId = context.auth?.userId;
    if (!clerkId) throw new ORPCError("UNAUTHORIZED");
    const [admin] = await db.select({ isAdmin: users.isAdmin }).from(users).where(eq(users.clerkId, clerkId)).limit(1);
    if (!admin?.isAdmin) throw new ORPCError("FORBIDDEN");
    const result = await db.execute(sql`SELECT (SELECT count(*)::int FROM users) AS users, (SELECT count(*)::int FROM companies) AS companies, (SELECT count(*)::int FROM estates) AS estates, (SELECT count(*)::int FROM plots) AS plots, (SELECT count(*)::int FROM reservations WHERE status IN ('CHECKOUT_LOCKED','HOLD_PAYMENT_PENDING','HELD','PURCHASE_IN_PROGRESS')) AS "activeReservations", (SELECT count(*)::int FROM outbox_events WHERE status='pending') AS "pendingEvents", (SELECT count(*)::int FROM outbox_events WHERE status='processing') AS "processingEvents", (SELECT count(*)::int FROM outbox_events WHERE last_error IS NOT NULL AND status <> 'processed') AS "failedEvents"`);
    const events = await db.execute(sql`SELECT id, topic, status, attempts, last_error AS "lastError", created_at AS "createdAt" FROM outbox_events ORDER BY created_at DESC LIMIT 50`);
    return { metrics: result.rows[0], events: events.rows };
  }),

  retryOutboxEvent: protectedProcedure.input(z.object({ eventId: z.string().uuid() })).handler(async ({ context, input }) => {
    const clerkId = context.auth?.userId;
    if (!clerkId) throw new ORPCError("UNAUTHORIZED");
    const [admin] = await db.select({ id: users.id, isAdmin: users.isAdmin }).from(users).where(eq(users.clerkId, clerkId)).limit(1);
    if (!admin?.isAdmin) throw new ORPCError("FORBIDDEN");
    const result = await db.execute(sql`UPDATE outbox_events SET status='pending', available_at=now(), last_error=NULL WHERE id=${input.eventId} AND status <> 'processed' RETURNING id, status`);
    if (!result.rows[0]) throw new ORPCError("CONFLICT", { message: "Only incomplete events can be retried." });
    await db.insert(auditLogs).values({ userId: admin.id, action: "outbox.retry_requested", entityType: "outbox_event", entityId: input.eventId, reason: "Manual retry requested from operations console" });
    return result.rows[0];
  }),
};
