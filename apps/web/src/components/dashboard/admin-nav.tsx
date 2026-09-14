"use client";

import { UserButton } from "@clerk/nextjs";
import { Building02Icon, FileValidationIcon, Location01Icon, Search01Icon, Settings02Icon, ShieldCheckIcon, SidebarLeft01Icon, SidebarRight01Icon, UserGroupIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@asaselink/ui/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Company reviews", icon: Building02Icon },
  { href: "/admin/estates", label: "Estate publishing", icon: Location01Icon },
  { href: "/admin/users", label: "User access", icon: UserGroupIcon },
  { href: "/admin/audit", label: "Audit trail", icon: FileValidationIcon },
  { href: "/admin/operations", label: "Operations", icon: Settings02Icon },
  { href: "/admin/reservations", label: "Reservation investigations", icon: FileValidationIcon },
  { href: "/admin/finance", label: "Payments & payouts", icon: FileValidationIcon },
];

type AdminNavProps = { collapsed: boolean; mobileOpen: boolean; onToggleCollapse: () => void; onCloseMobile: () => void };

export function AdminNav({ collapsed, mobileOpen, onToggleCollapse, onCloseMobile }: AdminNavProps) {
  const pathname = usePathname();
  return <>{mobileOpen ? <button type="button" aria-label="Close admin navigation" onClick={onCloseMobile} className="fixed inset-0 z-40 bg-black/45 lg:hidden" /> : null}<aside className={cn("fixed inset-y-0 left-0 z-50 flex flex-col border-r border-black/8 bg-[#f8f9f7] text-foreground transition-[width,transform] duration-300 dark:border-white/8 dark:bg-[#171917] lg:translate-x-0", collapsed ? "w-[68px]" : "w-[260px]", mobileOpen ? "translate-x-0" : "-translate-x-full")}><div className="flex h-14 items-center justify-end border-b border-border/70 px-3"><button type="button" onClick={onToggleCollapse} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} className={cn("grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-black/5 hover:text-foreground dark:hover:bg-white/6", collapsed && "hidden lg:grid")}><HugeiconsIcon icon={collapsed ? SidebarRight01Icon : SidebarLeft01Icon} size={18} /></button></div>{!collapsed ? <div className="p-3"><div className="flex h-10 items-center gap-2 rounded-xl border border-border bg-background px-3 text-xs text-muted-foreground"><HugeiconsIcon icon={Search01Icon} size={15} /><span>Search administration</span><span className="ml-auto rounded border border-border px-1.5 py-0.5 text-[10px]">⌘K</span></div></div> : null}<nav aria-label="Admin navigation" className="flex-1 space-y-1 overflow-y-auto px-2.5 py-2">{links.map((item) => { const active = item.href === "/admin" ? pathname === "/admin" || pathname.startsWith("/admin/companies/") : pathname.startsWith(item.href); return <Link key={item.href} href={item.href} title={collapsed ? item.label : undefined} onClick={onCloseMobile} className={cn("flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground dark:hover:bg-white/6", collapsed && "justify-center px-0", active && "bg-brand-green-900 text-white hover:bg-brand-green-900 hover:text-white dark:bg-brand-green-800")}><HugeiconsIcon icon={item.icon} size={19} className="shrink-0" />{!collapsed ? <span className="truncate">{item.label}</span> : null}</Link>; })}</nav><div className="border-t border-border/70 p-2.5"><Link href="/workspaces" title="Switch workspace" className={cn("mb-2 flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-muted-foreground hover:bg-black/5 hover:text-foreground dark:hover:bg-white/6", collapsed && "justify-center px-0")}><HugeiconsIcon icon={ShieldCheckIcon} size={19} />{!collapsed ? <span>Switch workspace</span> : null}</Link><div className={cn("flex items-center gap-3 rounded-xl bg-background p-2.5", collapsed && "justify-center px-0")}><UserButton />{!collapsed ? <div className="min-w-0"><p className="truncate text-xs font-semibold">AsaseLink Operations</p><p className="truncate text-[11px] text-muted-foreground">Full administrative access</p></div> : null}</div></div></aside></>;
}
