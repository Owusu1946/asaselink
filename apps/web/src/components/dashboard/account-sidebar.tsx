"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUser, SignOutButton } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SidebarLeft01Icon,
  SidebarRight01Icon,
  PlusSignIcon,
  Compass01Icon,
  Location01Icon,
  Bookmark01Icon,
  File01Icon,
  Building02Icon,
  ShieldCheckIcon,
  Settings02Icon,
  Logout01Icon,
  Search01Icon,
  MoreHorizontalIcon,
  Sun01Icon,
  Moon02Icon,
  CheckmarkCircle02Icon,
  Notification01Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@asaselink/ui/lib/utils";
import { client } from "@/utils/orpc";
import { notify } from "@/utils/notify";

interface RecentSearch {
  id: string;
  title: string;
  location: string;
  criteria: { location: string; type: string; budget: string };
}

interface AccountSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  activeSearchId?: string;
  onSelectSearch?: (id: string) => void;
}

export function AccountSidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  activeSearchId,
  onSelectSearch,
}: AccountSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { theme, setTheme } = useTheme();

  const [searchFilter, setSearchFilter] = React.useState("");
  const [profileMenuOpen, setProfileMenuOpen] = React.useState(false);
  const [activeItemMenu, setActiveItemMenu] = React.useState<string | null>(null);
  const [counts, setCounts] = React.useState({
    reservations: 0,
    saved: 0,
    documents: 0,
    alerts: 0,
  });
  const [recentExplorations, setRecentExplorations] = React.useState<RecentSearch[]>([]);

  const profileMenuRef = React.useRef<HTMLDivElement>(null);

  // Close profile menu when clicking outside
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

  const refreshBuyerData = React.useCallback(async () => {
    if (!user) return;
    try {
      const data = await client.buyer.overview();
      setCounts(data.counts);
      setRecentExplorations(data.recent as RecentSearch[]);
    } catch {
      // Global query and page error states handle actionable failures.
    }
  }, [user]);

  React.useEffect(() => {
    if (!isLoaded || !user) return;
    void refreshBuyerData();
    window.addEventListener("asaselink:buyer-data-changed", refreshBuyerData);
    return () => window.removeEventListener("asaselink:buyer-data-changed", refreshBuyerData);
  }, [isLoaded, user, refreshBuyerData]);

  const displayName = user?.fullName || user?.firstName || "Verified Buyer";
  const displayEmail = user?.primaryEmailAddress?.emailAddress || "buyer@asaselink.com";
  const userInitials = (user?.firstName?.[0] || "B") + (user?.lastName?.[0] || "");

  const filteredExplorations = recentExplorations.filter((item) =>
    item.title.toLowerCase().includes(searchFilter.toLowerCase()),
  );

  const navLinks = [
    {
      href: "/account",
      label: "Overview",
      icon: Compass01Icon,
      active: pathname === "/account",
    },
    {
      href: "/account/reservations",
      label: "My Reservations",
      icon: Location01Icon,
      badge: String(counts.reservations),
      active: pathname === "/account/reservations",
    },
    {
      href: "/account/saved",
      label: "Saved Parcels",
      icon: Bookmark01Icon,
      badge: String(counts.saved),
      active: pathname === "/account/saved",
    },
    {
      href: "/account/alerts",
      label: "Land Alerts",
      icon: Notification01Icon,
      badge: String(counts.alerts),
      active: pathname === "/account/alerts",
    },
    {
      href: "/account/purchases",
      label: "Purchases",
      icon: File01Icon,
      active: pathname.startsWith("/account/purchases"),
    },
    {
      href: "/account/payments",
      label: "Payments",
      icon: File01Icon,
      active: pathname === "/account/payments",
    },
    {
      href: "/account/documents",
      label: "Document Vault",
      icon: File01Icon,
      badge: String(counts.documents),
      active: pathname === "/account/documents",
    },
    {
      href: "/workspaces",
      label: "Workspaces",
      icon: Building02Icon,
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
          // Desktop collapse states
          collapsed ? "w-0 lg:w-[68px]" : "w-[260px]",
          // Mobile open/close
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

        {/* Action Button: "+ New Plot Search" (ChatGPT "+ New chat" inspired) */}
        <div className="p-3">
          <Link
            href="/"
            className={cn(
              "group flex items-center justify-between rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#212121] px-3 py-2 text-xs font-medium text-foreground shadow-2xs hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-all",
              collapsed && "justify-center px-0 size-10 mx-auto",
            )}
            title="Start new estate search"
          >
            <div className="flex items-center gap-2">
              <span className="flex size-5 items-center justify-center rounded-md bg-brand-green-900 text-white dark:bg-brand-green-800">
                <HugeiconsIcon icon={PlusSignIcon} size={14} />
              </span>
              {!collapsed && <span>New plot search</span>}
            </div>
            {!collapsed && (
              <span className="text-[10px] font-mono text-muted-foreground group-hover:text-foreground">
                ⌘K
              </span>
            )}
          </Link>
        </div>

        {/* Scrollable Middle: Navigation & Recent Explorations (No visible scrollbar) */}
        <div className="flex-1 overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden px-2.5 py-1 space-y-3 text-xs">
          {/* Main Navigation Links */}
          <nav aria-label="Account core links" className="space-y-0.5">
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

          {/* Search Filter (when expanded) */}
          {!collapsed && (
            <div className="relative pt-1">
              <HugeiconsIcon
                icon={Search01Icon}
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <input
                type="text"
                placeholder="Filter explorations..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full rounded-lg border border-black/[0.06] dark:border-white/[0.06] bg-transparent py-1.5 pl-7 pr-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-brand-green-800 focus:outline-none focus:ring-1 focus:ring-brand-green-800"
              />
            </div>
          )}

          {/* ChatGPT-Style History: Recent Explorations */}
          {!collapsed && (
            <div className="space-y-3 pt-2">
              <div className="px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Recent Explorations
              </div>

              <div className="space-y-0.5">
                {filteredExplorations.map((item) => {
                  const isActive = activeSearchId === item.id;
                  const isMenuOpen = activeItemMenu === item.id;

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "group relative flex items-center justify-between rounded-lg px-2.5 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-black/[0.05] dark:hover:bg-white/[0.06] hover:text-foreground cursor-pointer transition-colors",
                        isActive &&
                          "bg-black/[0.07] dark:bg-white/[0.09] font-medium text-foreground",
                      )}
                      onClick={() => {
                        onSelectSearch?.(item.id);
                        router.push(
                          `/?location=${encodeURIComponent(item.criteria.location)}&type=${encodeURIComponent(item.criteria.type)}&budget=${encodeURIComponent(item.criteria.budget)}#explore-lands`,
                        );
                      }}
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="truncate text-xs">{item.title}</span>
                        <span className="truncate text-[10px] text-muted-foreground">
                          {item.location}
                        </span>
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
                          aria-label="Item actions"
                        >
                          <HugeiconsIcon icon={MoreHorizontalIcon} size={14} />
                        </button>
                      </div>

                      {/* Dropdown for item actions */}
                      {isMenuOpen && (
                        <div
                          className="absolute right-2 top-8 z-30 w-36 rounded-xl border border-border bg-card p-1 shadow-lg text-xs animate-in fade-in zoom-in-95 duration-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Link
                            href={`/?location=${encodeURIComponent(item.criteria.location)}&type=${encodeURIComponent(item.criteria.type)}&budget=${encodeURIComponent(item.criteria.budget)}#explore-lands`}
                            onClick={() => setActiveItemMenu(null)}
                            className="block w-full rounded-md px-2 py-1.5 text-left text-foreground hover:bg-muted transition-colors"
                          >
                            Run search again
                          </Link>
                          <div className="my-1 border-t border-border" />
                          <button
                            type="button"
                            onClick={async () => {
                              setActiveItemMenu(null);
                              setRecentExplorations((items) =>
                                items.filter((entry) => entry.id !== item.id),
                              );
                              try {
                                await client.buyer.removeExploration({ id: item.id });
                                notify.success("Exploration removed");
                              } catch (error) {
                                void refreshBuyerData();
                                notify.apiError(error, "Could not remove exploration");
                              }
                            }}
                            className="w-full rounded-md px-2 py-1.5 text-left text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            Remove from list
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
                {!filteredExplorations.length && (
                  <p className="px-2.5 py-3 text-[11px] leading-5 text-muted-foreground">
                    Your searches will appear here.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Profile & Settings Pill (ChatGPT Style) */}
        <div
          ref={profileMenuRef}
          className="relative p-2.5 border-t border-black/[0.06] dark:border-white/[0.06]"
        >
          {/* Profile Menu Popup Card */}
          {profileMenuOpen && (
            <div
              className={cn(
                "absolute bottom-16 z-30 rounded-2xl border border-border bg-card p-2 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-150 text-xs text-foreground",
                collapsed ? "left-2 w-64" : "left-2 right-2",
              )}
            >
              <div className="p-2 border-b border-border/80">
                <p className="font-semibold text-sm truncate">{displayName}</p>
                <p className="text-[11px] text-muted-foreground truncate">{displayEmail}</p>
                <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-brand-green-100 dark:bg-brand-green-950/60 px-2 py-0.5 text-[10px] font-medium text-brand-green-900 dark:text-brand-green-400">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={11} />
                  <span>Ghana Lands Verified</span>
                </div>
              </div>

              <div className="py-1 space-y-0.5">
                <Link
                  href="/onboarding/profile"
                  onClick={() => setProfileMenuOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors"
                >
                  <HugeiconsIcon icon={Settings02Icon} size={15} />
                  <span>Buyer Profile & Settings</span>
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
                    <span>{theme === "dark" ? "Light appearance" : "Dark appearance"}</span>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground uppercase">
                    {theme || "system"}
                  </span>
                </button>

                <Link
                  href="/company/apply"
                  onClick={() => setProfileMenuOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors text-brand-gold-700 dark:text-brand-gold-300"
                >
                  <HugeiconsIcon icon={ShieldCheckIcon} size={15} />
                  <span>List Estate Company</span>
                </Link>
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

          {/* Profile Trigger Pill */}
          <button
            type="button"
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className={cn(
              "flex w-full items-center justify-between rounded-xl px-2 py-1.5 text-foreground hover:bg-black/[0.05] dark:hover:bg-white/[0.06] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              profileMenuOpen && "bg-black/[0.07] dark:bg-white/[0.09]",
              collapsed && "justify-center px-0 size-10 mx-auto",
            )}
            title={displayName}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Avatar */}
              <div className="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-green-900 text-[11px] font-semibold text-white dark:bg-brand-green-800">
                <span>{userInitials}</span>
                <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-[#f9f9f9] dark:border-[#171717] bg-brand-gold-500" />
              </div>

              {!collapsed && (
                <div className="flex flex-col text-left min-w-0">
                  <span className="truncate text-xs font-semibold">{displayName}</span>
                  <span className="truncate text-[10px] text-muted-foreground">Verified Buyer</span>
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
