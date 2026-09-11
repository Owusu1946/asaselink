"use client";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon, SidebarRight01Icon } from "@hugeicons/core-free-icons";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@asaselink/ui/lib/utils";
import { AdminNav } from "./admin-nav";

const titles: Record<string, string> = { "/admin": "Company reviews", "/admin/estates": "Estate publishing", "/admin/users": "User access", "/admin/audit": "Audit trail", "/admin/operations": "Operations" };
export function AdminPageShell({ children }: { children: React.ReactNode }) { const pathname = usePathname(); const [collapsed, setCollapsed] = useState(false); const [mobileOpen, setMobileOpen] = useState(false); const title = pathname.startsWith("/admin/companies/") ? "Company review" : titles[pathname] ?? "Administration"; return <div className="min-h-svh bg-background"><AdminNav collapsed={collapsed} mobileOpen={mobileOpen} onToggleCollapse={() => setCollapsed((value) => !value)} onCloseMobile={() => setMobileOpen(false)} /><div className={cn("min-w-0 transition-[padding] duration-300", collapsed ? "lg:pl-[68px]" : "lg:pl-[260px]")}><header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur-md sm:px-7"><button type="button" onClick={() => window.innerWidth < 1024 ? setMobileOpen(true) : setCollapsed((value) => !value)} className="grid size-9 place-items-center rounded-lg hover:bg-muted" aria-label="Toggle sidebar"><HugeiconsIcon icon={SidebarRight01Icon} size={18} /></button><p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Superadmin</span> / {title}</p><div className="ml-auto hidden w-64 items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground md:flex"><HugeiconsIcon icon={Search01Icon} size={14} />Search control center</div></header>{children}</div></div>; }
