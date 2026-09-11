"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Mail01Icon, PlusSignIcon, Search01Icon, UserGroupIcon } from "@hugeicons/core-free-icons";
import { Button } from "@asaselink/ui/components/button";
import { Input } from "@asaselink/ui/components/input";
import { orpc } from "@/utils/orpc";
import { notify } from "@/utils/notify";

type Role = "owner" | "admin" | "manager" | "sales" | "surveyor" | "viewer";
type Member = { id: string; userId: string; firstName: string | null; lastName: string | null; email: string | null; avatarUrl: string | null; role: string; status: string; joinedAt: Date };
type Invitation = { id: string; email: string; role: string; status: string; createdAt: Date; expiresAt: Date | null };
type TeamData = { members: Member[]; invitations: Invitation[]; currentUserId: string; currentRole: string; canManage: boolean; roles: readonly string[] };

const roles: { value: Exclude<Role, "owner">; label: string; description: string }[] = [
  { value: "admin", label: "Administrator", description: "Manage the team and all company operations" },
  { value: "manager", label: "Manager", description: "Manage estates, plots, and reservations" },
  { value: "sales", label: "Sales", description: "Handle buyer enquiries and reservations" },
  { value: "surveyor", label: "Surveyor", description: "Manage cadastral and boundary records" },
  { value: "viewer", label: "Viewer", description: "Read-only workspace access" },
];

function initials(member: Member) { return `${member.firstName?.[0] ?? ""}${member.lastName?.[0] ?? ""}`.toUpperCase() || member.email?.[0]?.toUpperCase() || "?"; }
function displayName(member: Member) { return [member.firstName, member.lastName].filter(Boolean).join(" ") || member.email || "Team member"; }

export function CompanyTeam({ companyId, initialData }: { companyId: string; initialData: TeamData }) {
  const [members, setMembers] = React.useState(initialData.members);
  const [invitations, setInvitations] = React.useState(initialData.invitations);
  const [query, setQuery] = React.useState("");
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<Exclude<Role, "owner">>("viewer");
  const inviteInput = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => { if (inviteOpen) requestAnimationFrame(() => inviteInput.current?.focus()); }, [inviteOpen]);
  React.useEffect(() => { const close = (event: KeyboardEvent) => { if (event.key === "Escape") setInviteOpen(false); }; window.addEventListener("keydown", close); return () => window.removeEventListener("keydown", close); }, []);
  const filtered = members.filter((member) => `${displayName(member)} ${member.email ?? ""} ${member.role}`.toLowerCase().includes(query.toLowerCase()));

  async function invite(event: React.FormEvent) {
    event.preventDefault(); setBusy("invite");
    try {
      const created = await orpc.team.invite.call({ companyId, email, role });
      if (created) setInvitations((current) => [...current, created]);
      notify.success("Invitation sent", { description: `${email} can now join this workspace.` });
      setEmail(""); setRole("viewer"); setInviteOpen(false);
    } catch (error) { notify.apiError(error, "Invitation failed"); } finally { setBusy(null); }
  }

  async function changeRole(member: Member, nextRole: Exclude<Role, "owner">) {
    const previous = member.role; setBusy(member.id); setMembers((current) => current.map((item) => item.id === member.id ? { ...item, role: nextRole } : item));
    try { await orpc.team.updateRole.call({ companyId, memberId: member.id, role: nextRole }); notify.success("Access updated"); }
    catch (error) { setMembers((current) => current.map((item) => item.id === member.id ? { ...item, role: previous } : item)); notify.apiError(error, "Could not update access"); }
    finally { setBusy(null); }
  }

  async function remove(member: Member) {
    if (!window.confirm(`Remove ${displayName(member)} from this workspace?`)) return;
    setBusy(member.id);
    try { await orpc.team.remove.call({ companyId, memberId: member.id }); setMembers((current) => current.filter((item) => item.id !== member.id)); notify.success("Team member removed"); }
    catch (error) { notify.apiError(error, "Could not remove member"); } finally { setBusy(null); }
  }

  async function revoke(invitation: Invitation) {
    setBusy(invitation.id);
    try { await orpc.team.revokeInvitation.call({ companyId, invitationId: invitation.id }); setInvitations((current) => current.filter((item) => item.id !== invitation.id)); notify.success("Invitation revoked"); }
    catch (error) { notify.apiError(error, "Could not revoke invitation"); } finally { setBusy(null); }
  }

  return <div className="space-y-6">
    <section className="grid gap-3 sm:grid-cols-3" aria-label="Team summary">
      <div className="rounded-2xl border bg-card p-5"><p className="text-xs text-muted-foreground">Active members</p><p className="mt-2 text-2xl font-semibold">{members.filter((m) => m.status === "active").length}</p></div>
      <div className="rounded-2xl border bg-card p-5"><p className="text-xs text-muted-foreground">Pending invitations</p><p className="mt-2 text-2xl font-semibold">{invitations.length}</p></div>
      <div className="rounded-2xl border bg-card p-5"><p className="text-xs text-muted-foreground">Your access</p><p className="mt-2 text-lg font-semibold capitalize">{initialData.currentRole}</p></div>
    </section>
    <section className="overflow-hidden rounded-2xl border bg-card">
      <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between"><div className="relative max-w-sm flex-1"><HugeiconsIcon icon={Search01Icon} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" placeholder="Search members and roles" aria-label="Search team" /></div>{initialData.canManage && <Button onClick={() => setInviteOpen(true)} className="gap-2 rounded-xl"><HugeiconsIcon icon={PlusSignIcon} size={16} />Invite member</Button>}</div>
      <div className="divide-y">{filtered.map((member) => <div key={member.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"><div className="flex min-w-0 flex-1 items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-green-100 text-xs font-semibold text-brand-green-900">{initials(member)}</span><div className="min-w-0"><p className="truncate text-sm font-medium">{displayName(member)}{member.userId === initialData.currentUserId && <span className="ml-2 text-xs font-normal text-muted-foreground">You</span>}</p><p className="truncate text-xs text-muted-foreground">{member.email ?? "No email synced"}</p></div></div><div className="flex items-center gap-2 pl-13 sm:pl-0">{initialData.canManage && member.role !== "owner" && member.userId !== initialData.currentUserId ? <><select aria-label={`Role for ${displayName(member)}`} disabled={busy === member.id} value={member.role} onChange={(e) => changeRole(member, e.target.value as Exclude<Role, "owner">)} className="h-9 rounded-lg border bg-background px-3 text-xs outline-none focus:ring-2 focus:ring-ring">{roles.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select><button type="button" disabled={busy === member.id} onClick={() => remove(member)} className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label={`Remove ${displayName(member)}`}><HugeiconsIcon icon={Cancel01Icon} size={17} /></button></> : <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium capitalize">{member.role}</span>}</div></div>)}{!filtered.length && <div className="p-10 text-center"><HugeiconsIcon icon={UserGroupIcon} size={26} className="mx-auto text-muted-foreground" /><p className="mt-3 text-sm font-medium">No matching team members</p></div>}</div>
    </section>
    {invitations.length > 0 && <section className="rounded-2xl border bg-card p-5"><h2 className="text-sm font-semibold">Pending invitations</h2><div className="mt-3 divide-y">{invitations.map((invitation) => <div key={invitation.id} className="flex items-center gap-3 py-3"><span className="grid size-9 place-items-center rounded-full bg-muted"><HugeiconsIcon icon={Mail01Icon} size={16} /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{invitation.email}</p><p className="text-xs capitalize text-muted-foreground">{invitation.role} · invited {new Date(invitation.createdAt).toLocaleDateString()}</p></div>{initialData.canManage && <button type="button" disabled={busy === invitation.id} onClick={() => revoke(invitation)} className="rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive">Revoke</button>}</div>)}</div></section>}
    {inviteOpen && <div className="fixed inset-0 z-[70] grid place-items-center bg-black/50 p-4 backdrop-blur-sm" onMouseDown={(e) => { if (e.currentTarget === e.target) setInviteOpen(false); }}><form onSubmit={invite} role="dialog" aria-modal="true" aria-labelledby="invite-title" className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-2xl"><div className="flex items-start justify-between"><div><h2 id="invite-title" className="text-xl font-semibold">Invite a team member</h2><p className="mt-1 text-sm text-muted-foreground">They’ll receive a secure Clerk invitation by email.</p></div><button type="button" onClick={() => setInviteOpen(false)} className="grid size-8 place-items-center rounded-lg hover:bg-muted" aria-label="Close"><HugeiconsIcon icon={Cancel01Icon} size={18} /></button></div><label className="mt-6 block text-sm font-medium">Work email<Input ref={inviteInput} type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2" placeholder="colleague@company.com" /></label><label className="mt-4 block text-sm font-medium">Role<select value={role} onChange={(e) => setRole(e.target.value as Exclude<Role, "owner">)} className="mt-2 h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring">{roles.map((item) => <option key={item.value} value={item.value}>{item.label} — {item.description}</option>)}</select></label><div className="mt-6 flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button><Button type="submit" disabled={busy === "invite" || !email}>{busy === "invite" ? "Sending…" : "Send invitation"}</Button></div></form></div>}
  </div>;
}
