"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon, Search01Icon, SidebarRight01Icon } from "@hugeicons/core-free-icons";
import { AccountSidebar } from "@/components/dashboard/account-sidebar";
import { buttonVariants } from "@asaselink/ui/components/button";
import { cn } from "@asaselink/ui/lib/utils";

const PAGE_META: Record<string, { title: string; description: string }> = {
  "/account": { title: "Buyer overview", description: "Manage verified land activity and documentation." },
  "/account/reservations": { title: "My Reservations", description: "Active parcel reservations, escrow statuses, and deed preparation progress." },
  "/account/payments": { title: "Payments", description: "Purchase payments and verification status." },
  "/account/saved": { title: "Saved Parcels", description: "Bookmarked plots, price alerts, and estate layouts saved for review." },
  "/account/documents": { title: "Document Vault", description: "Official search reports, cadastral plans, and indenture deeds." },
  "/account/alerts": { title: "Land Alerts", description: "Areas and budgets AsaseLink is actively watching for you." },
};

export function AccountWorkspaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const meta = PAGE_META[pathname] ?? PAGE_META["/account"]!;
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);

  return (
    <div className="flex min-h-svh bg-background text-foreground">
      <AccountSidebar collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed((value) => !value)} mobileOpen={mobileSidebarOpen} onCloseMobile={() => setMobileSidebarOpen(false)} />
      <div className={cn("flex min-w-0 flex-1 flex-col transition-[padding] duration-300", sidebarCollapsed ? "lg:pl-[68px]" : "lg:pl-[260px]")}>
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => window.innerWidth < 1024 ? setMobileSidebarOpen(true) : setSidebarCollapsed((value) => !value)} className="grid size-8 place-items-center rounded-lg hover:bg-muted" aria-label="Toggle sidebar"><HugeiconsIcon icon={SidebarRight01Icon} size={18} /></button>
            <span className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Account</span> / {meta.title}</span>
          </div>
          <div className="hidden w-full max-w-sm px-6 md:block"><div className="relative"><HugeiconsIcon icon={Search01Icon} size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input aria-label="Search account" placeholder="Search your account..." className="w-full rounded-xl border border-border bg-muted/50 py-1.5 pl-8 pr-3 text-xs outline-none focus:ring-1 focus:ring-ring" /></div></div>
          <Link href="/" className={buttonVariants({ size: "sm", className: "h-8 gap-1.5 rounded-xl text-xs" })}><HugeiconsIcon icon={PlusSignIcon} size={14} /><span className="hidden sm:inline">New exploration</span></Link>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 space-y-8 p-6 sm:p-10">
          <div className="border-b border-border pb-6"><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{meta.title}</h1><p className="mt-1 text-sm text-muted-foreground">{meta.description}</p></div>
          {children}
        </main>
      </div>
    </div>
  );
}
