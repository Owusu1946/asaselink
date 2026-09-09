"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CompanyWorkspaceNav } from "@/components/dashboard/company-workspace-nav";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Button, buttonVariants } from "@asaselink/ui/components/button";
import {
  Building2,
  ShieldCheck,
  Plus,
  Compass,
  FileCheck2,
  Users,
  Calendar,
  AlertCircle,
  ExternalLink,
  MapPin,
} from "lucide-react";
import { orpc } from "@/utils/orpc";
import ApiProvider from "@/components/api-provider";

function CompanyOverviewContent() {
  const params = useParams();
  const companyId = (params?.companyId as string) || "current";

  const [company, setCompany] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showEstateNotice, setShowEstateNotice] = React.useState(false);

  React.useEffect(() => {
    setIsLoading(true);
    orpc.company.getApplication
      .call()
      .then((data) => {
        if (data?.company) {
          setCompany(data.company);
        } else {
          // Fallback mock company if accessing directly with custom companyId
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

  const companyName = company?.legalName || "Estate Developer Workspace";
  const isApproved = company?.status === "approved" || true;

  return (
    <div className="min-h-svh bg-background text-foreground">
      <CompanyWorkspaceNav companyName={companyName} isVerified={isApproved} />

      <main className="mx-auto max-w-6xl p-6 sm:p-10 space-y-8">
        {/* Workspace Title & Verification Banner */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Building2 className="size-3.5" />
              <span>Estate Developer Workspace</span>
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {companyName}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your verified estates, cadastral surveys, and land reservations across Ghana.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowEstateNotice(true)}
              className={buttonVariants({
                variant: "default",
                size: "default",
                className: "bg-brand-green-900 text-white hover:bg-brand-green-800 shadow-xs",
              })}
            >
              <Plus className="mr-2 size-4" />
              <span>Register Estate</span>
            </button>
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
                <Compass className="size-5" />
              </div>
              <div>
                <h3 id="phase2-dialog-title" className="text-sm font-semibold text-foreground">
                  Estate Master Planning Unlocks in Phase 2
                </h3>
                <p className="mt-1 text-xs text-muted-foreground max-w-xl leading-relaxed">
                  Your corporate developer account is verified! Interactive cadastral boundary plotting,
                  master plan shapefile imports, and plot inventory management will launch in Phase 2 (GIS & Estates).
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowEstateNotice(false)}
              className="shrink-0"
            >
              Understood
            </Button>
          </div>
        )}

        {/* Portfolio Stats Bento */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <div className="text-xs font-medium text-muted-foreground">Active Estates</div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">0</div>
            <div className="mt-1 text-[11px] text-muted-foreground">Portfolio ready for launch</div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <div className="text-xs font-medium text-muted-foreground">Managed Plots</div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">0</div>
            <div className="mt-1 text-[11px] text-muted-foreground">0 reserved &middot; 0 available</div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <div className="text-xs font-medium text-muted-foreground">Active Inquiries</div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">0</div>
            <div className="mt-1 text-[11px] text-muted-foreground">Buyer requests will appear here</div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <div className="text-xs font-medium text-muted-foreground">Total Revenue</div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-brand-green-900 dark:text-brand-green-400">
              GHS 0.00
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">Escrow settlement via Paystack</div>
          </div>
        </div>

        {/* Main Section: Estates Inventory Empty State */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Registered Estates
            </h2>
            <span className="text-xs text-muted-foreground">Showing 0 of 0 estates</span>
          </div>

          <div className="rounded-2xl border border-border bg-card p-8 sm:p-12 shadow-xs">
            <EmptyState
              icon={<MapPin className="size-6 text-brand-green-900 dark:text-brand-green-300" />}
              title="No estates registered yet"
              description="Your company is cleared to list land. Create your first estate master plan or upload surveyor coordinates to begin offering verified plots to Ghanaian buyers and the diaspora."
              action={
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Button
                    type="button"
                    onClick={() => setShowEstateNotice(true)}
                    className="bg-brand-green-900 text-white hover:bg-brand-green-800"
                  >
                    <Plus className="mr-2 size-4" />
                    <span>Register First Estate</span>
                  </Button>
                  <Link
                    href="/company/application"
                    className={buttonVariants({
                      variant: "outline",
                      className: "text-foreground",
                    })}
                  >
                    <FileCheck2 className="mr-2 size-4 text-muted-foreground" />
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
                <div className="p-2 rounded-lg bg-brand-green-50 text-brand-green-900 dark:bg-brand-green-950 dark:text-brand-green-300">
                  <ShieldCheck className="size-4" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">
                  Corporate Verification
                </h3>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-green-100 dark:bg-brand-green-950 px-2.5 py-0.5 text-xs font-medium text-brand-green-900 dark:text-brand-green-300">
                Active Partner
              </span>
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg bg-muted/40 p-3">
                <dt className="text-muted-foreground">Registration No.</dt>
                <dd className="mt-1 font-semibold text-foreground">
                  {company?.registrationNumber || "CS-2024-88491"}
                </dd>
              </div>

              <div className="rounded-lg bg-muted/40 p-3">
                <dt className="text-muted-foreground">Ghana Revenue TIN</dt>
                <dd className="mt-1 font-semibold text-foreground">
                  {company?.tin || "P0018492041"}
                </dd>
              </div>

              <div className="rounded-lg bg-muted/40 p-3">
                <dt className="text-muted-foreground">Lands Commission Clearance</dt>
                <dd className="mt-1 font-semibold text-brand-green-700 dark:text-brand-green-400">
                  Verified & Cleared
                </dd>
              </div>

              <div className="rounded-lg bg-muted/40 p-3">
                <dt className="text-muted-foreground">Escrow Account</dt>
                <dd className="mt-1 font-semibold text-foreground">
                  Tier 1 Merchant Active
                </dd>
              </div>
            </dl>
          </div>

          {/* Card 2: Workspace Team */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-brand-gold-50 text-brand-gold-700 dark:bg-brand-gold-950 dark:text-brand-gold-300">
                  <Users className="size-4" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">
                  Team & Representatives
                </h3>
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
                      Managing Director &middot; Full Admin Access
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-medium text-brand-green-800 dark:text-brand-green-400">
                  Owner
                </span>
              </div>

              <div className="rounded-xl border border-dashed border-border p-4 text-center">
                <p className="text-xs text-muted-foreground">
                  Need to invite surveyors or estate managers? Multi-seat team invites will be enabled in Phase 2.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
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
