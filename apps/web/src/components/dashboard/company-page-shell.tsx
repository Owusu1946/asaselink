"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { SidebarRight01Icon, Search01Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { CompanySidebar } from "@/components/dashboard/company-sidebar";
import { buttonVariants } from "@asaselink/ui/components/button";
import { orpc } from "@/utils/orpc";
import ApiProvider from "@/components/api-provider";
import { cn } from "@asaselink/ui/lib/utils";

interface CompanyPageShellProps {
  title: string;
  description: string;
  breadcrumb: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

function CompanyPageShellContent({
  title,
  description,
  breadcrumb,
  action,
  children,
}: CompanyPageShellProps) {
  const params = useParams();
  const companyId = (params?.companyId as string) || "comp-demo-123";

  const [company, setCompany] = React.useState<{
    id: string;
    legalName: string;
    status: string;
  } | null>(null);

  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);

  React.useEffect(() => {
    orpc.company.getApplication
      .call()
      .then((data) => {
        if (data?.company) {
          setCompany(data.company);
        } else {
          setCompany({
            id: companyId,
            legalName: "Asase Estates Ghana Limited",
            status: "approved",
          });
        }
      })
      .catch(() => {
        setCompany({
          id: companyId,
          legalName: "Asase Estates Ghana Limited",
          status: "approved",
        });
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
              <span>{breadcrumb}</span>
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
            {action ? (
              action
            ) : (
              <button
                type="button"
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
            )}
          </div>
        </header>

        {/* Page Main Content */}
        <main className="mx-auto w-full max-w-6xl p-6 sm:p-10 space-y-8 flex-1">
          {/* Header */}
          <div className="border-b border-border pb-6">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>

          {/* Subpage Content */}
          <div>{children}</div>
        </main>
      </div>
    </div>
  );
}

export function CompanyPageShell(props: CompanyPageShellProps) {
  return (
    <ApiProvider clerkEnabled>
      <CompanyPageShellContent {...props} />
    </ApiProvider>
  );
}
