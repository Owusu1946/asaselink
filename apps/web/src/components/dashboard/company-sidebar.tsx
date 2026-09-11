"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SidebarLeft01Icon,
  SidebarRight01Icon,
  PlusSignIcon,
  Compass01Icon,
  Location01Icon,
  FileValidationIcon,
  Building02Icon,
  ShieldCheckIcon,
  Settings02Icon,
  Logout01Icon,
  Search01Icon,
  MoreHorizontalIcon,
  Sun01Icon,
  Moon02Icon,
  CheckmarkCircle02Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@asaselink/ui/lib/utils";

interface CompanySidebarProps {
  companyName: string;
  companyId: string;
  isVerified?: boolean;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onRegisterEstateClick?: () => void;
  counts?: { estateCount: number; availablePlotCount: number; activeStaffCount: number };
  recentEstates: Array<{ id: string; name: string; status: string; plotCount: number }>;
}

export function CompanySidebar({
  companyName,
  companyId,
  isVerified = true,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  onRegisterEstateClick,
  counts,
  recentEstates,
}: CompanySidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const [searchFilter, setSearchFilter] = React.useState("");
  const [profileMenuOpen, setProfileMenuOpen] = React.useState(false);
  const [activeItemMenu, setActiveItemMenu] = React.useState<string | null>(null);

  const profileMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
        setActiveItemMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const overviewHref = `/company/${companyId}/overview`;
  const companyInitials = companyName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const filteredEstates = recentEstates.filter((item) =>
    item.name.toLowerCase().includes(searchFilter.toLowerCase()),
  );

  const navLinks = [
    {
      href: overviewHref,
      label: "Overview",
      icon: Compass01Icon,
      active: pathname === overviewHref,
    },
    {
      href: `/company/${companyId}/estates`,
      label: "Registered Estates",
      icon: Building02Icon,
      badge: String(counts?.estateCount ?? 0),
      active: pathname === `/company/${companyId}/estates`,
    },
    {
      href: `/company/${companyId}/plots`,
      label: "Managed Plots",
      icon: Location01Icon,
      badge: String(counts?.availablePlotCount ?? 0),
      active: pathname === `/company/${companyId}/plots`,
    },
    {
      href: `/company/${companyId}/cadastral`,
      label: "Cadastral Survey Records",
      icon: FileValidationIcon,
      badge: undefined,
      active: pathname === `/company/${companyId}/cadastral`,
    },
    {
      href: `/company/${companyId}/staff`,
      label: "Company Staff",
      icon: UserGroupIcon,
      badge: String(counts?.activeStaffCount ?? 0),
      active: pathname === `/company/${companyId}/staff`,
    },
    {
      href: "/workspaces",
      label: "Switch Workspace",
      icon: ShieldCheckIcon,
      active: pathname === "/workspaces",
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs transition-opacity lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#f9f9f9] text-[#171717] dark:bg-[#171717] dark:text-[#ececec] border-r border-black/[0.08] dark:border-white/[0.08] transition-all duration-300 ease-in-out select-none",
          collapsed ? "w-0 lg:w-[68px]" : "w-[260px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex h-14 items-center justify-end px-3.5 border-b border-black/[0.06] dark:border-white/[0.06]">
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "flex size-8 items-center justify-center rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              collapsed && "hidden lg:flex mx-auto mt-2",
            )}
          >
            <HugeiconsIcon icon={collapsed ? SidebarRight01Icon : SidebarLeft01Icon} size={18} />
          </button>
        </div>

        {/* Action Button: "+ Register Estate" (ChatGPT "+ New chat" inspired) */}
        <div className="p-3">
          <Link
            href={`/company/${companyId}/estates`}
            onClick={onRegisterEstateClick}
            className={cn(
              "group flex w-full items-center justify-between rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#212121] px-3 py-2 text-xs font-medium text-foreground shadow-2xs hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-all text-left",
              collapsed && "justify-center px-0 size-10 mx-auto",
            )}
            title="Register new estate layout"
          >
            <div className="flex items-center gap-2">
              <span className="flex size-5 items-center justify-center rounded-md bg-brand-green-900 text-white dark:bg-brand-green-800">
                <HugeiconsIcon icon={PlusSignIcon} size={14} />
              </span>
              {!collapsed && <span>Register estate</span>}
            </div>
            {!collapsed && (
              <span className="text-[10px] font-mono text-muted-foreground group-hover:text-foreground">
                ⌘E
              </span>
            )}
          </Link>
        </div>

        {/* Middle Navigation & Estate Records (No visible scrollbar) */}
        <div className="flex-1 overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden px-2.5 py-1 space-y-3 text-xs">
          {/* Main Navigation Links */}
          <nav aria-label="Company core links" className="space-y-0.5">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-2.5 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-black/[0.05] dark:hover:bg-white/[0.06] hover:text-foreground transition-colors",
                    item.active &&
                      "bg-black/[0.07] dark:bg-white/[0.09] font-semibold text-brand-green-900 dark:text-brand-green-400",
                    collapsed && "justify-center px-0 size-9 mx-auto",
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <HugeiconsIcon icon={Icon} size={18} className="shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </div>
                  {!collapsed && item.badge && (
                    <span className="rounded-full bg-black/[0.06] dark:bg-white/[0.08] px-1.5 py-0.2 text-[10px] font-mono text-muted-foreground">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Filter Bar (when expanded) */}
          {!collapsed && (
            <div className="relative pt-1">
              <HugeiconsIcon
                icon={Search01Icon}
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <input
                type="text"
                placeholder="Filter estate records..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full rounded-lg border border-black/[0.06] dark:border-white/[0.06] bg-transparent py-1.5 pl-7 pr-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-brand-green-800 focus:outline-none focus:ring-1 focus:ring-brand-green-800"
              />
            </div>
          )}

          {/* Recent Estates (ChatGPT History Style) */}
          {!collapsed && (
            <div className="space-y-3 pt-2">
              <div className="px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Managed Estates
              </div>

              <div className="space-y-0.5">
                {filteredEstates.map((item) => {
                  const isMenuOpen = activeItemMenu === item.id;

                  return (
                    <div
                      key={item.id}
                      className="group relative flex items-center justify-between rounded-lg px-2.5 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-black/[0.05] dark:hover:bg-white/[0.06] hover:text-foreground cursor-pointer transition-colors"
                      onClick={() => router.push(`/company/${companyId}/estates/${item.id}`)}
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="truncate text-xs font-medium">{item.name}</span>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <span>{item.plotCount} plot{item.plotCount === 1 ? "" : "s"}</span>
                          <span>·</span>
                          <span
                            className={cn(
                              item.status === "approved"
                                ? "text-brand-green-800 dark:text-brand-green-400"
                                : "text-amber-600 dark:text-amber-400",
                            )}
                          >
                            {item.status.replace("_", " ")}
                          </span>
                        </div>
                      </div>

                      {/* Hover action menu trigger */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveItemMenu(isMenuOpen ? null : item.id);
                          }}
                          className="flex size-6 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-black/[0.08] dark:hover:bg-white/[0.1]"
                          aria-label="Estate actions"
                        >
                          <HugeiconsIcon icon={MoreHorizontalIcon} size={14} />
                        </button>
                      </div>

                      {/* Context menu */}
                      {isMenuOpen && (
                        <div
                          className="absolute right-2 top-8 z-30 w-40 rounded-xl border border-border bg-card p-1 shadow-lg text-xs animate-in fade-in zoom-in-95 duration-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => setActiveItemMenu(null)}
                            className="w-full rounded-md px-2 py-1.5 text-left text-foreground hover:bg-muted transition-colors"
                          >
                            View cadastral map
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveItemMenu(null)}
                            className="w-full rounded-md px-2 py-1.5 text-left text-foreground hover:bg-muted transition-colors"
                          >
                            Export plot list
                          </button>
                          <div className="my-1 border-t border-border" />
                          <button
                            type="button"
                            onClick={() => setActiveItemMenu(null)}
                            className="w-full rounded-md px-2 py-1.5 text-left text-muted-foreground hover:bg-muted transition-colors"
                          >
                            Archive layout
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Profile Pill (ChatGPT Style) */}
        <div
          ref={profileMenuRef}
          className="relative p-2.5 border-t border-black/[0.06] dark:border-white/[0.06]"
        >
          {profileMenuOpen && (
            <div
              className={cn(
                "absolute bottom-16 z-30 rounded-2xl border border-border bg-card p-2 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-150 text-xs text-foreground",
                collapsed ? "left-2 w-64" : "left-2 right-2",
              )}
            >
              <div className="p-2 border-b border-border/80">
                <p className="font-semibold text-sm truncate">{companyName}</p>
                <p className="text-[11px] text-muted-foreground">Estate Developer Workspace</p>
                <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-brand-green-100 dark:bg-brand-green-950/60 px-2 py-0.5 text-[10px] font-medium text-brand-green-900 dark:text-brand-green-400">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={11} />
                  <span>{isVerified ? "Approved & Verified" : "Under Review"}</span>
                </div>
              </div>

              <div className="py-1 space-y-0.5">
                <Link
                  href="/company/application"
                  onClick={() => setProfileMenuOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors"
                >
                  <HugeiconsIcon icon={Settings02Icon} size={15} />
                  <span>Company Settings</span>
                </Link>

                <Link
                  href="/workspaces"
                  onClick={() => setProfileMenuOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors"
                >
                  <HugeiconsIcon icon={ShieldCheckIcon} size={15} />
                  <span>Switch Workspace</span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setTheme(theme === "dark" ? "light" : "dark");
                  }}
                  className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={theme === "dark" ? Sun01Icon : Moon02Icon} size={15} />
                    <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground uppercase">
                    {theme || "system"}
                  </span>
                </button>
              </div>

              <div className="pt-1 border-t border-border/80">
                <SignOutButton redirectUrl="/sign-in">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <HugeiconsIcon icon={Logout01Icon} size={15} />
                    <span>Sign out</span>
                  </button>
                </SignOutButton>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className={cn(
              "flex w-full items-center justify-between rounded-xl px-2 py-1.5 text-foreground hover:bg-black/[0.05] dark:hover:bg-white/[0.06] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              profileMenuOpen && "bg-black/[0.07] dark:bg-white/[0.09]",
              collapsed && "justify-center px-0 size-10 mx-auto",
            )}
            title={companyName}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-green-900 text-[11px] font-semibold text-white dark:bg-brand-green-800">
                <span>{companyInitials || "CO"}</span>
                <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-[#f9f9f9] dark:border-[#171717] bg-brand-gold-500" />
              </div>

              {!collapsed && (
                <div className="flex flex-col text-left min-w-0">
                  <span className="truncate text-xs font-semibold">{companyName}</span>
                  <span className="truncate text-[10px] text-muted-foreground">
                    Corporate Portal
                  </span>
                </div>
              )}
            </div>

            {!collapsed && (
              <HugeiconsIcon
                icon={MoreHorizontalIcon}
                size={16}
                className="text-muted-foreground shrink-0 ml-1"
              />
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
