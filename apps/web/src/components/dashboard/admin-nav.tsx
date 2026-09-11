"use client";

import { UserButton } from "@clerk/nextjs";
import { HugeiconsIcon } from "@hugeicons/react";
import { Building02Icon, Cancel01Icon, FileValidationIcon, Location01Icon, Menu01Icon, Search01Icon, Settings02Icon, ShieldCheckIcon, UserGroupIcon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@asaselink/ui/lib/utils";

const activeLinks = [
  { href: "/admin", label: "Company reviews", icon: Building02Icon },
  { href: "/admin/estates", label: "Estate publishing", icon: Location01Icon },
];
const plannedLinks = [
  { label: "User access", icon: UserGroupIcon },
  { label: "Audit trail", icon: FileValidationIcon },
  { label: "Operations", icon: Settings02Icon },
];

export function AdminNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  return <>
    <button type="button" onClick={() => setMobileOpen(true)} aria-label="Open admin navigation" className="fixed left-4 top-4 z-30 grid size-11 place-items-center rounded-xl border border-border bg-background shadow-sm lg:hidden"><HugeiconsIcon icon={Menu01Icon} size={20} /></button>
    {mobileOpen ? <button type="button" aria-label="Close admin navigation" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-black/40 lg:hidden" /> : null}
    <aside className={cn("fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-black/8 bg-[#f8f9f7] text-foreground transition-transform dark:border-white/8 dark:bg-[#171917] lg:translate-x-0", mobileOpen ? "translate-x-0" : "-translate-x-full")}>
      <div className="flex h-16 items-center justify-between border-b border-border/70 px-4"><Link href="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5"><span className="grid size-8 place-items-center rounded-lg bg-brand-green-900 text-white"><span className="size-2 rounded-full bg-brand-gold-500" /></span><span><strong className="block text-sm">AsaseLink</strong><span className="block text-[11px] text-muted-foreground">Superadmin</span></span></Link><button type="button" onClick={() => setMobileOpen(false)} aria-label="Close navigation" className="grid size-10 place-items-center rounded-lg hover:bg-black/5 lg:hidden"><HugeiconsIcon icon={Cancel01Icon} size={18} /></button></div>
      <div className="p-3"><div className="flex h-10 items-center gap-2 rounded-xl border border-border bg-background px-3 text-xs text-muted-foreground"><HugeiconsIcon icon={Search01Icon} size={15} /><span>Search administration</span><span className="ml-auto rounded border border-border px-1.5 py-0.5 text-[10px]">Soon</span></div></div>
      <nav aria-label="Admin navigation" className="flex-1 space-y-6 overflow-y-auto px-3 py-2"><div className="space-y-1">{activeLinks.map((item) => { const active = item.href === "/admin" ? pathname === "/admin" || pathname.startsWith("/admin/companies/") : pathname.startsWith(item.href); return <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={cn("flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground dark:hover:bg-white/6", active && "bg-brand-green-900 text-white hover:bg-brand-green-900 hover:text-white dark:bg-brand-green-800")}><HugeiconsIcon icon={item.icon} size={19} /><span>{item.label}</span></Link>; })}</div><div><p className="px-3 pb-2 text-[11px] font-medium text-muted-foreground">Control surfaces</p><div className="space-y-1">{plannedLinks.map((item) => <div key={item.label} aria-disabled="true" className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-muted-foreground/65"><HugeiconsIcon icon={item.icon} size={19} /><span>{item.label}</span><span className="ml-auto text-[10px]">Soon</span></div>)}</div></div></nav>
      <div className="border-t border-border/70 p-3"><Link href="/workspaces" className="mb-3 flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-muted-foreground hover:bg-black/5 hover:text-foreground dark:hover:bg-white/6"><HugeiconsIcon icon={ShieldCheckIcon} size={19} /><span>Switch workspace</span></Link><div className="flex items-center gap-3 rounded-xl bg-background p-2.5"><UserButton /><div className="min-w-0"><p className="truncate text-xs font-semibold">AsaseLink Operations</p><p className="truncate text-[11px] text-muted-foreground">Full administrative access</p></div></div></div>
    </aside>
  </>;
}
