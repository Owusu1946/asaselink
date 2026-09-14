export const COMPANY_ROLES = ["owner", "admin", "manager", "sales", "surveyor", "viewer"] as const;
export type CompanyRole = (typeof COMPANY_ROLES)[number];

export const TEAM_MANAGE_ROLES = new Set<CompanyRole>(["owner", "admin"]);
export type CompanyPermission = "estate:write" | "plot:write" | "team:manage" | "finance:manage";
const PERMISSIONS: Record<CompanyPermission, ReadonlySet<CompanyRole>> = {
  "estate:write": new Set(["owner", "admin", "manager"]),
  "plot:write": new Set(["owner", "admin", "manager", "surveyor"]),
  "team:manage": TEAM_MANAGE_ROLES,
  "finance:manage": TEAM_MANAGE_ROLES,
};

export function hasCompanyPermission(role: string, permission: CompanyPermission) {
  return PERMISSIONS[permission].has(role as CompanyRole);
}

export function canManageTeam(role: string): role is "owner" | "admin" {
  return TEAM_MANAGE_ROLES.has(role as CompanyRole);
}

export function clerkRoleFor(role: CompanyRole) {
  return role === "owner" || role === "admin" ? "org:admin" : "org:member";
}

export function assertMutableMember(actorRole: string, targetRole: string, actorUserId: string, targetUserId: string) {
  if (!canManageTeam(actorRole)) throw new Error("Only owners and administrators can manage the team.");
  if (targetRole === "owner") throw new Error("The company owner cannot be changed or removed.");
  if (actorUserId === targetUserId) throw new Error("You cannot change your own team access.");
}
