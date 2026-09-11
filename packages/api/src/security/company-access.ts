import { ORPCError } from "@orpc/server";
import { and, eq } from "drizzle-orm";
import { db } from "@asaselink/db";
import { companies, companyMembers, users } from "@asaselink/db/schema";

const WRITE_ROLES = new Set(["owner", "admin", "manager"]);

export async function requireCompanyAccess(clerkId: string, companyId: string, write = false) {
  const [access] = await db.select({ user: users, member: companyMembers, company: companies })
    .from(users)
    .innerJoin(companyMembers, eq(companyMembers.userId, users.id))
    .innerJoin(companies, eq(companies.id, companyMembers.companyId))
    .where(and(eq(users.clerkId, clerkId), eq(companyMembers.companyId, companyId), eq(companyMembers.status, "active")))
    .limit(1);

  if (!access || access.company.status !== "approved" || (write && !WRITE_ROLES.has(access.member.role))) {
    throw new ORPCError("FORBIDDEN");
  }
  return access;
}

export function requireCompanyWriteAccess(clerkId: string, companyId: string) {
  return requireCompanyAccess(clerkId, companyId, true);
}
