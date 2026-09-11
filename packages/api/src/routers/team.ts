import { ORPCError } from "@orpc/server";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@asaselink/db";
import { auditLogs, companies, companyInvitations, companyMembers, users } from "@asaselink/db/schema";
import { protectedProcedure } from "../index";
import { requireClerkClient } from "../context";
import { COMPANY_ROLES, assertMutableMember, canManageTeam, clerkRoleFor } from "../domain/company-team";
import { requireCompanyAccess } from "../security/company-access";
import { enforceRateLimit } from "../security/rate-limit";

const roleSchema = z.enum(COMPANY_ROLES);
const assignableRoleSchema = z.enum(["admin", "manager", "sales", "surveyor", "viewer"]);

function failFromRule(error: unknown): never {
  throw new ORPCError("FORBIDDEN", { message: error instanceof Error ? error.message : "This team action is not allowed." });
}

async function ensureOrganization(companyId: string, actorClerkId: string) {
  const access = await requireCompanyAccess(actorClerkId, companyId);
  if (access.company.clerkOrganizationId) return { organizationId: access.company.clerkOrganizationId, access };
  if (!canManageTeam(access.member.role)) throw new ORPCError("FORBIDDEN", { message: "Only owners and administrators can initialize the team workspace." });
  const clerk = requireClerkClient();
  const organization = await clerk.organizations.createOrganization({
    name: access.company.tradeName || access.company.legalName,
    createdBy: actorClerkId,
    publicMetadata: { asaselinkCompanyId: companyId },
  });
  await db.update(companies).set({ clerkOrganizationId: organization.id, updatedAt: new Date() }).where(and(eq(companies.id, companyId), eq(companies.status, "approved")));
  return { organizationId: organization.id, access };
}

export const teamRouter = {
  myCompanies: protectedProcedure.handler(async ({ context }) => {
    const clerkId = context.auth?.userId;
    if (!clerkId) throw new ORPCError("UNAUTHORIZED");
    const [currentUser] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
    if (!currentUser) return [];

    // Synchronous reconciliation prevents an invitation acceptance from landing on an
    // empty workspace while the signed webhook is still in flight.
    const clerkMemberships = await requireClerkClient().users.getOrganizationMembershipList({ userId: clerkId, limit: 100 });
    for (const membership of clerkMemberships.data) {
      const [company] = await db.select({ id: companies.id }).from(companies).where(eq(companies.clerkOrganizationId, membership.organization.id)).limit(1);
      if (!company) continue;
      const email = membership.publicUserData?.identifier?.toLowerCase();
      const [invitation] = email ? await db.select({ role: companyInvitations.role }).from(companyInvitations).where(and(eq(companyInvitations.companyId, company.id), eq(companyInvitations.email, email))).limit(1) : [];
      await db.insert(companyMembers).values({ companyId: company.id, userId: currentUser.id, clerkMembershipId: membership.id, role: localRoleFromMembership(membership.role, invitation?.role), status: "active" }).onConflictDoUpdate({ target: [companyMembers.companyId, companyMembers.userId], set: { clerkMembershipId: membership.id, status: "active", updatedAt: new Date() } });
    }

    return db.select({ id: companies.id, legalName: companies.legalName, tradeName: companies.tradeName, status: companies.status, role: companyMembers.role })
      .from(companyMembers).innerJoin(companies, eq(companyMembers.companyId, companies.id))
      .where(and(eq(companyMembers.userId, currentUser.id), eq(companyMembers.status, "active"), eq(companies.status, "approved")))
      .orderBy(asc(companies.legalName));
  }),

  list: protectedProcedure.input(z.object({ companyId: z.string().uuid() })).handler(async ({ context, input }) => {
    const clerkId = context.auth?.userId;
    if (!clerkId) throw new ORPCError("UNAUTHORIZED");
    const access = await requireCompanyAccess(clerkId, input.companyId);
    const members = await db.select({ id: companyMembers.id, userId: users.id, clerkId: users.clerkId, firstName: users.firstName, lastName: users.lastName, email: users.email, avatarUrl: users.avatarUrl, role: companyMembers.role, status: companyMembers.status, joinedAt: companyMembers.createdAt })
      .from(companyMembers).innerJoin(users, eq(companyMembers.userId, users.id))
      .where(eq(companyMembers.companyId, input.companyId)).orderBy(asc(companyMembers.createdAt));
    const invitations = await db.select().from(companyInvitations)
      .where(and(eq(companyInvitations.companyId, input.companyId), eq(companyInvitations.status, "pending")))
      .orderBy(asc(companyInvitations.createdAt));
    return { members, invitations, currentUserId: access.user.id, currentRole: access.member.role, canManage: canManageTeam(access.member.role), roles: roleSchema.options };
  }),

  invite: protectedProcedure.input(z.object({ companyId: z.string().uuid(), email: z.string().trim().toLowerCase().email(), role: assignableRoleSchema })).handler(async ({ context, input }) => {
    const clerkId = context.auth?.userId;
    if (!clerkId) throw new ORPCError("UNAUTHORIZED");
    await enforceRateLimit(clerkId, "company.team.invite", 20);
    const { organizationId, access } = await ensureOrganization(input.companyId, clerkId);
    if (!canManageTeam(access.member.role)) throw new ORPCError("FORBIDDEN");
    const duplicate = await db.select({ id: companyInvitations.id }).from(companyInvitations)
      .where(and(eq(companyInvitations.companyId, input.companyId), eq(companyInvitations.email, input.email), eq(companyInvitations.status, "pending"))).limit(1);
    if (duplicate[0]) throw new ORPCError("CONFLICT", { message: "A pending invitation already exists for this email." });
    const invitation = await requireClerkClient().organizations.createOrganizationInvitation({
      organizationId,
      inviterUserId: clerkId,
      emailAddress: input.email,
      role: clerkRoleFor(input.role),
      redirectUrl: `${process.env.CORS_ORIGIN}/workspaces`,
      publicMetadata: { asaselinkRole: input.role, asaselinkCompanyId: input.companyId },
    });
    const [record] = await db.insert(companyInvitations).values({ companyId: input.companyId, invitedByUserId: access.user.id, clerkInvitationId: invitation.id, email: input.email, role: input.role, status: invitation.status, expiresAt: invitation.expiresAt ? new Date(invitation.expiresAt) : null }).returning();
    await db.insert(auditLogs).values({ userId: access.user.id, action: "company.team_invited", entityType: "company", entityId: input.companyId, metadata: { email: input.email, role: input.role, clerkInvitationId: invitation.id } });
    return record;
  }),

  revokeInvitation: protectedProcedure.input(z.object({ companyId: z.string().uuid(), invitationId: z.string().uuid() })).handler(async ({ context, input }) => {
    const clerkId = context.auth?.userId;
    if (!clerkId) throw new ORPCError("UNAUTHORIZED");
    const access = await requireCompanyAccess(clerkId, input.companyId);
    if (!canManageTeam(access.member.role)) throw new ORPCError("FORBIDDEN");
    const [invitation] = await db.select().from(companyInvitations).where(and(eq(companyInvitations.id, input.invitationId), eq(companyInvitations.companyId, input.companyId), eq(companyInvitations.status, "pending"))).limit(1);
    if (!invitation || !access.company.clerkOrganizationId) throw new ORPCError("NOT_FOUND");
    await requireClerkClient().organizations.revokeOrganizationInvitation({ organizationId: access.company.clerkOrganizationId, invitationId: invitation.clerkInvitationId, requestingUserId: clerkId });
    await db.update(companyInvitations).set({ status: "revoked", updatedAt: new Date() }).where(eq(companyInvitations.id, invitation.id));
    await db.insert(auditLogs).values({ userId: access.user.id, action: "company.team_invitation_revoked", entityType: "company", entityId: input.companyId, metadata: { email: invitation.email } });
    return { success: true };
  }),

  updateRole: protectedProcedure.input(z.object({ companyId: z.string().uuid(), memberId: z.string().uuid(), role: assignableRoleSchema })).handler(async ({ context, input }) => {
    const clerkId = context.auth?.userId;
    if (!clerkId) throw new ORPCError("UNAUTHORIZED");
    const access = await requireCompanyAccess(clerkId, input.companyId);
    const [target] = await db.select({ member: companyMembers, user: users }).from(companyMembers).innerJoin(users, eq(companyMembers.userId, users.id)).where(and(eq(companyMembers.id, input.memberId), eq(companyMembers.companyId, input.companyId))).limit(1);
    if (!target || !access.company.clerkOrganizationId) throw new ORPCError("NOT_FOUND");
    try { assertMutableMember(access.member.role, target.member.role, access.user.id, target.user.id); } catch (error) { failFromRule(error); }
    await requireClerkClient().organizations.updateOrganizationMembership({ organizationId: access.company.clerkOrganizationId, userId: target.user.clerkId, role: clerkRoleFor(input.role) });
    await db.update(companyMembers).set({ role: input.role, updatedAt: new Date() }).where(eq(companyMembers.id, target.member.id));
    await db.insert(auditLogs).values({ userId: access.user.id, action: "company.team_role_changed", entityType: "company_member", entityId: target.member.id, metadata: { from: target.member.role, to: input.role } });
    return { success: true, role: input.role };
  }),

  remove: protectedProcedure.input(z.object({ companyId: z.string().uuid(), memberId: z.string().uuid() })).handler(async ({ context, input }) => {
    const clerkId = context.auth?.userId;
    if (!clerkId) throw new ORPCError("UNAUTHORIZED");
    const access = await requireCompanyAccess(clerkId, input.companyId);
    const [target] = await db.select({ member: companyMembers, user: users }).from(companyMembers).innerJoin(users, eq(companyMembers.userId, users.id)).where(and(eq(companyMembers.id, input.memberId), eq(companyMembers.companyId, input.companyId))).limit(1);
    if (!target || !access.company.clerkOrganizationId) throw new ORPCError("NOT_FOUND");
    try { assertMutableMember(access.member.role, target.member.role, access.user.id, target.user.id); } catch (error) { failFromRule(error); }
    await requireClerkClient().organizations.deleteOrganizationMembership({ organizationId: access.company.clerkOrganizationId, userId: target.user.clerkId });
    await db.update(companyMembers).set({ status: "removed", updatedAt: new Date() }).where(eq(companyMembers.id, target.member.id));
    await db.insert(auditLogs).values({ userId: access.user.id, action: "company.team_member_removed", entityType: "company_member", entityId: target.member.id, metadata: { role: target.member.role } });
    return { success: true };
  }),
};

function localRoleFromMembership(clerkRole: string, invitationRole?: string | null) {
  if (invitationRole && ["admin", "manager", "sales", "surveyor", "viewer"].includes(invitationRole)) return invitationRole;
  return clerkRole === "org:admin" ? "admin" : "viewer";
}
