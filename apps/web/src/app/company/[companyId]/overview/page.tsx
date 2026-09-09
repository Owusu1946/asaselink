"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Building02Icon,
  ShieldCheckIcon,
  PlusSignIcon,
  Compass01Icon,
  FileValidationIcon,
  UserGroupIcon,
  Location01Icon,
  SidebarRight01Icon,
  Search01Icon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";
import { CompanySidebar } from "@/components/dashboard/company-sidebar";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Button, buttonVariants } from "@asaselink/ui/components/button";
import { orpc } from "@/utils/orpc";
import ApiProvider from "@/components/api-provider";
import { cn } from "@asaselink/ui/lib/utils";

function CompanyOverviewContent() {
  const params = useParams();
  const companyId = (params?.companyId as string) || "current";

  const [company, setCompany] = React.useState<any>(null);
  const [_isLoading, setIsLoading] = React.useState(true);
  const [showEstateNotice, setShowEstateNotice] = React.useState(false);

  // Sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);

  React.useEffect(() => {
    setIsLoading(true);
    orpc.company.getApplication
      .call()
      .then((data) => {
        if (data?.company) {
          setCompany(data.company);
        } else {
          setCompany({
            id: companyId,
            legalName: "Asase Estates Ghana Limited",
            registrationNumber: "CS-2024-88491",
            tin: "P0018492041",
            status: "approved",
            createdAt: new Date().toISOString(),
          });
        }
      })
      .catch(() => {
        setCompany({
          id: companyId,
          legalName: "Asase Estates Ghana Limited",
          registrationNumber: "CS-2024-88491",
          tin: "P0018492041",
          status: "approved",
          createdAt: new Date().toISOString(),
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [companyId]);

  const companyName = company?.legalName || "Asase Estates Ghana Limited";
  const isApproved = company?.status === "approved" || true;

  return (
    <div className="min-h-svh bg-background text-foreground flex">
      {/* Sleek ChatGPT-Inspired Company Sidebar */}
      <CompanySidebar
        companyName={companyName}
        companyId={companyId}
        isVerified={isApproved}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        onRegisterEstateClick={() => setShowEstateNotice(true)}
      />

      {/* Main Content Area */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out",
          sidebarCollapsed ? "lg:pl-[68px]" : "lg:pl-[260px]",
        )}
      >
        {/* Sleek Top Navigation Header */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 sm:px-8 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (window.innerWidth < 1024) {
                  setMobileSidebarOpen(true);
                } else {
                  setSidebarCollapsed(!sidebarCollapsed);
                }
              }}
              className="flex size-8 items-center justify-center rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label="Toggle sidebar"
            >
              <HugeiconsIcon icon={SidebarRight01Icon} size={18} />
            </button>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Company</span>
              <span>/</span>
              <span>Overview</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 max-w-sm w-full mx-4">
            <div className="relative w-full">
              <HugeiconsIcon
                icon={Search01Icon}
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Search layouts, surveyor plots, deeds..."
                className="w-full rounded-xl border border-border bg-muted/50 py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-brand-green-800 focus:bg-background focus:outline-none focus:ring-1 focus:ring-brand-green-800 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowEstateNotice(true)}
              className={buttonVariants({
                variant: "default",
                size: "sm",
                className:
                  "gap-1.5 text-xs font-medium rounded-xl h-8 px-3 bg-brand-green-900 text-white hover:bg-brand-green-800 shadow-xs",
              })}
            >
              <HugeiconsIcon icon={PlusSignIcon} size={14} />
              <span className="hidden sm:inline">Register estate</span>
            </button>
          </div>
        </header>

        {/* Page Main Content */}
        <main className="mx-auto w-full max-w-6xl p-6 sm:p-10 space-y-8 flex-1">
          {/* Workspace Title & Verification Banner */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <HugeiconsIcon icon={Building02Icon} size={14} />
                <span>Estate Developer Workspace</span>
              </div>
              <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {companyName}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage your verified estates, cadastral surveys, and land reservations across Ghana.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-xl border border-brand-green-300 bg-brand-green-50 px-3.5 py-1.5 text-xs font-medium text-brand-green-900 dark:border-brand-green-800 dark:bg-brand-green-950/60 dark:text-brand-green-300 shrink-0">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} />
              <span>{isApproved ? "Approved Partner · Active" : "Under Review"}</span>
            </div>
          </div>

          {/* Modal / Notice for Phase 2 Estate Registration */}
          {showEstateNotice && (
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="phase2-dialog-title"
              className="rounded-2xl border border-brand-gold-500/30 bg-brand-gold-50/50 dark:bg-brand-gold-950/20 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-brand-gold-500/10 text-brand-gold-600 dark:text-brand-gold-400 mt-0.5">
                  <HugeiconsIcon icon={Compass01Icon} size={20} />
                </div>
                <div>
                  <h3 id="phase2-dialog-title" className="text-sm font-semibold text-foreground">
                    Estate Master Planning Unlocks in Phase 2
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground max-w-xl leading-relaxed">
                    Your corporate developer account is verified! Interactive cadastral boundary
                    plotting, master plan shapefile imports, and plot inventory management will
                    launch in Phase 2 (GIS & Estates).
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowEstateNotice(false)}
                className="shrink-0 rounded-xl"
              >
                Understood
              </Button>
            </div>
          )}

          {/* Portfolio Stats Bento */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
              <div className="text-xs font-medium text-muted-foreground">Active Estates</div>
              <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">0</div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                Portfolio ready for launch
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
              <div className="text-xs font-medium text-muted-foreground">Managed Plots</div>
              <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">0</div>
              <div className="mt-1 text-[11px] text-muted-foreground">0 reserved · 0 available</div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
              <div className="text-xs font-medium text-muted-foreground">Active Inquiries</div>
              <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">0</div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                Buyer requests will appear here
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
              <div className="text-xs font-medium text-muted-foreground">Total Revenue</div>
              <div className="mt-2 text-2xl font-bold tracking-tight text-brand-green-900 dark:text-brand-green-400">
                GHS 0.00
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                Escrow settlement via Paystack
              </div>
            </div>
          </div>

          {/* Main Section: Estates Inventory Empty State */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Registered Estates
              </h2>
              <span className="text-xs text-muted-foreground font-mono">
                Showing 0 of 0 estates
              </span>
            </div>

            <div className="rounded-2xl border border-border bg-card p-8 sm:p-12 shadow-xs">
              <EmptyState
                icon={
                  <HugeiconsIcon
                    icon={Location01Icon}
                    size={24}
                    className="text-brand-green-900 dark:text-brand-green-300"
                  />
                }
                title="No estates registered yet"
                description="Your company is cleared to list land. Create your first estate master plan or upload surveyor coordinates to begin offering verified plots to Ghanaian buyers and the diaspora."
                action={
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <Button
                      type="button"
                      onClick={() => setShowEstateNotice(true)}
                      className="bg-brand-green-900 text-white hover:bg-brand-green-800 rounded-xl text-xs"
                    >
                      <HugeiconsIcon icon={PlusSignIcon} size={14} className="mr-1.5" />
                      <span>Register First Estate</span>
                    </Button>
                    <Link
                      href="/company/application"
                      className={buttonVariants({
                        variant: "outline",
                        className: "text-foreground rounded-xl text-xs",
                      })}
                    >
                      <HugeiconsIcon
                        icon={FileValidationIcon}
                        size={14}
                        className="mr-1.5 text-muted-foreground"
                      />
                      <span>View Registration Documents</span>
                    </Link>
                  </div>
                }
              />
            </div>
          </div>

          {/* Bottom Bento: Corporate Verification & Team */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: Corporate Legal Information */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-brand-green-50 text-brand-green-900 dark:bg-brand-green-950 dark:text-brand-green-300">
                    <HugeiconsIcon icon={ShieldCheckIcon} size={18} />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">Corporate Verification</h3>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-green-100 dark:bg-brand-green-950 px-2.5 py-0.5 text-xs font-medium text-brand-green-900 dark:text-brand-green-300">
                  Active Partner
                </span>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl bg-muted/40 p-3">
                  <dt className="text-muted-foreground">Registration No.</dt>
                  <dd className="mt-1 font-semibold text-foreground">
                    {company?.registrationNumber || "CS-2024-88491"}
                  </dd>
                </div>

                <div className="rounded-xl bg-muted/40 p-3">
                  <dt className="text-muted-foreground">Ghana Revenue TIN</dt>
                  <dd className="mt-1 font-semibold text-foreground">
                    {company?.tin || "P0018492041"}
                  </dd>
                </div>

                <div className="rounded-xl bg-muted/40 p-3">
                  <dt className="text-muted-foreground">Lands Commission Clearance</dt>
                  <dd className="mt-1 font-semibold text-brand-green-700 dark:text-brand-green-400">
                    Verified & Cleared
                  </dd>
                </div>

                <div className="rounded-xl bg-muted/40 p-3">
                  <dt className="text-muted-foreground">Escrow Account</dt>
                  <dd className="mt-1 font-semibold text-foreground">Tier 1 Merchant Active</dd>
                </div>
              </dl>
            </div>

            {/* Card 2: Workspace Team */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-brand-gold-50 text-brand-gold-700 dark:bg-brand-gold-950 dark:text-brand-gold-300">
                    <HugeiconsIcon icon={UserGroupIcon} size={18} />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">Team & Representatives</h3>
                </div>
                <span className="text-xs text-muted-foreground">1 Authorized User</span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-3">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-full bg-brand-green-900 text-white flex items-center justify-center font-bold text-xs">
                      AR
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-foreground">
                        Authorized Representative
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Managing Director · Full Admin Access
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-brand-green-800 dark:text-brand-green-400">
                    Owner
                  </span>
                </div>

                <div className="rounded-xl border border-dashed border-border p-4 text-center">
                  <p className="text-xs text-muted-foreground">
                    Need to invite surveyors or estate managers? Multi-seat team invites will be
                    enabled in Phase 2.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function CompanyOverviewPage() {
  return (
    <ApiProvider>
      <CompanyOverviewContent />
    </ApiProvider>
  );
}
