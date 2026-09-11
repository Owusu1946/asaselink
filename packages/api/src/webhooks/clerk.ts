import { verifyWebhook } from "@clerk/backend/webhooks";
import { and, eq } from "drizzle-orm";
import { db } from "@asaselink/db";
import { companies, companyInvitations, companyMembers, users, webhookEvents } from "@asaselink/db/schema";
import { env } from "@asaselink/env/server";
import { requireClerkClient } from "../context";

function localRole(clerkRole: string, invitationRole?: string | null) {
  if (invitationRole && ["admin", "manager", "sales", "surveyor", "viewer"].includes(invitationRole)) return invitationRole;
  return clerkRole === "org:admin" ? "admin" : "viewer";
}

export async function handleClerkWebhook(request: Request) {
  if (!env.CLERK_WEBHOOK_SIGNING_SECRET) return new Response("Webhook signing secret is not configured", { status: 503 });
  let event;
  try {
    event = await verifyWebhook(request, { signingSecret: env.CLERK_WEBHOOK_SIGNING_SECRET });
  } catch (error) {
    console.warn("Clerk webhook verification failed", error);
    return new Response("Invalid signature", { status: 400 });
  }

  const eventId = request.headers.get("svix-id");
  if (!eventId) return new Response("Missing webhook id", { status: 400 });
  const inserted = await db.insert(webhookEvents).values({ id: eventId, provider: "clerk", eventType: event.type, payload: event as unknown as Record<string, unknown> }).onConflictDoNothing().returning({ id: webhookEvents.id });
  if (!inserted[0]) {
    const [existing] = await db.select({ status: webhookEvents.status }).from(webhookEvents).where(eq(webhookEvents.id, eventId)).limit(1);
    if (!existing || existing.status !== "failed") return new Response("Already processed", { status: 200 });
    await db.update(webhookEvents).set({ status: "processing" }).where(eq(webhookEvents.id, eventId));
  }

  try {
    if (event.type === "organizationInvitation.accepted" || event.type === "organizationInvitation.revoked") {
      await db.update(companyInvitations).set({ status: event.type.endsWith("accepted") ? "accepted" : "revoked", acceptedAt: event.type.endsWith("accepted") ? new Date() : null, updatedAt: new Date() }).where(eq(companyInvitations.clerkInvitationId, event.data.id));
    }

    if (event.type === "organizationMembership.created" || event.type === "organizationMembership.updated") {
      const organizationId = event.data.organization.id;
      const clerkUserId = event.data.public_user_data.user_id;
      const [company] = await db.select({ id: companies.id }).from(companies).where(eq(companies.clerkOrganizationId, organizationId)).limit(1);
      if (company) {
        const clerkUser = await requireClerkClient().users.getUser(clerkUserId);
        const email = clerkUser.emailAddresses.find((item) => item.id === clerkUser.primaryEmailAddressId)?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress ?? null;
        const [invitation] = email ? await db.select().from(companyInvitations).where(and(eq(companyInvitations.companyId, company.id), eq(companyInvitations.email, email.toLowerCase()))).limit(1) : [];
        const [user] = await db.insert(users).values({ clerkId: clerkUserId, email, firstName: clerkUser.firstName, lastName: clerkUser.lastName, avatarUrl: clerkUser.imageUrl, status: "active" }).onConflictDoUpdate({ target: users.clerkId, set: { email, firstName: clerkUser.firstName, lastName: clerkUser.lastName, avatarUrl: clerkUser.imageUrl, updatedAt: new Date() } }).returning();
        if (user) await db.insert(companyMembers).values({ companyId: company.id, userId: user.id, role: localRole(event.data.role, invitation?.role), status: "active" }).onConflictDoUpdate({ target: [companyMembers.companyId, companyMembers.userId], set: { role: localRole(event.data.role, invitation?.role), status: "active", updatedAt: new Date() } });
      }
    }

    if (event.type === "organizationMembership.deleted") {
      const [company] = await db.select({ id: companies.id }).from(companies).where(eq(companies.clerkOrganizationId, event.data.organization.id)).limit(1);
      const [user] = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, event.data.public_user_data.user_id)).limit(1);
      if (company && user) await db.update(companyMembers).set({ status: "removed", updatedAt: new Date() }).where(and(eq(companyMembers.companyId, company.id), eq(companyMembers.userId, user.id)));
    }

    await db.update(webhookEvents).set({ status: "processed", processedAt: new Date() }).where(eq(webhookEvents.id, eventId));
    return new Response("OK", { status: 200 });
  } catch (error) {
    await db.update(webhookEvents).set({ status: "failed" }).where(eq(webhookEvents.id, eventId));
    console.error("Clerk webhook processing failed", { eventId, eventType: event.type, error });
    return new Response("Processing failed", { status: 500 });
  }
}
