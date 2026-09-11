"use client";

import * as React from "react";
import Link from "next/link";
import { AdminNav } from "@/components/dashboard/admin-nav";
import { buttonVariants } from "@asaselink/ui/components/button";
import {
  ShieldCheck,
  Search,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { orpc } from "@/utils/orpc";
import ApiProvider from "@/components/api-provider";

interface QueueItem {
  id: string;
  legalName: string;
  registrationNumber: string;
  representativeName: string;
  representativeEmail: string;
  submittedAt: string;
  status: "submitted" | "under_review" | "changes_requested" | "approved" | "rejected";
  documentsCount: number;
}

function AdminQueueContent() {
  const [queue, setQueue] = React.useState<QueueItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  const loadQueue = React.useCallback(() => {
    setIsLoading(true);
    setLoadError(null);
    orpc.admin.getVerificationQueue
      .call()
      .then((data) => {
        if (data) {
          const mapped: QueueItem[] = data.map((item: any) => ({
            id: item.company.id,
            legalName: item.company.legalName,
            registrationNumber: item.company.registrationNumber,
            representativeName:
              `${item.application?.repFirstName || ""} ${item.application?.repLastName || ""}`.trim() ||
              "Primary Rep",
            representativeEmail: item.application?.repEmail || "Not provided",
            submittedAt: item.company.createdAt,
            status: item.company.status,
            documentsCount: item.documents?.length ?? 0,
          }));
          setQueue(mapped);
        }
      })
      .catch((err) => {
        setQueue([]);
        setLoadError(err instanceof Error ? err.message : "Unable to load the verification queue.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  React.useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const filteredQueue = queue.filter((item) => {
    const matchesSearch =
      item.legalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.representativeName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const pendingCount = queue.filter(
    (q) => q.status === "submitted" || q.status === "under_review",
  ).length;
  const changesCount = queue.filter((q) => q.status === "changes_requested").length;
  const approvedCount = queue.filter((q) => q.status === "approved").length;

  return (
    <div className="min-h-svh bg-background text-foreground">
      <AdminNav />

      <main className="mx-auto max-w-6xl p-6 sm:p-10 space-y-8">
        {loadError ? (
          <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {loadError}
          </div>
        ) : null}
        {/* Header Title */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <ShieldCheck className="size-3.5 text-brand-green-700 dark:text-brand-green-400" />
              <span>Compliance & Due Diligence</span>
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Corporate Verification Queue
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Review and audit Ghanaian real estate companies applying to publish verified master
              plans.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadQueue}
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: "gap-1.5",
              })}
              disabled={isLoading}
            >
              <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>Sync Queue</span>
            </button>
          </div>
        </div>

        {/* Metrics Overview Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <div className="text-xs font-medium text-muted-foreground">Pending Review</div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
              {pendingCount}
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">Requires immediate review</div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <div className="text-xs font-medium text-muted-foreground">Changes Requested</div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">
              {changesCount}
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              Awaiting applicant resubmission
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <div className="text-xs font-medium text-muted-foreground">Approved Partners</div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-brand-green-900 dark:text-brand-green-400">
              {approvedCount}
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">Active estate developers</div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <div className="text-xs font-medium text-muted-foreground">Total In Queue</div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">
              {queue.length}
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">All logged submissions</div>
          </div>
        </div>

        {/* Filter and Search Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by company name, registration no, or rep..."
              className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-green-900 focus:border-transparent transition-all"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto rounded-xl border border-border bg-muted/40 p-1 text-xs">
            {[
              { id: "all", label: "All" },
              { id: "under_review", label: "Under Review" },
              { id: "submitted", label: "Submitted" },
              { id: "changes_requested", label: "Changes Requested" },
              { id: "approved", label: "Approved" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`rounded-lg px-3 py-1.5 font-medium transition-colors whitespace-nowrap ${
                  statusFilter === tab.id
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Application Queue Cards List */}
        <div className="space-y-3">
          {filteredQueue.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center">
              <p className="text-sm font-medium text-foreground">
                No applications match your filter
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Try searching for a different company name or clearing the status filter.
              </p>
            </div>
          ) : (
            filteredQueue.map((item) => {
              const formattedDate = new Date(item.submittedAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });

              return (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border bg-card p-5 shadow-xs hover:border-brand-green-900/40 transition-colors"
                >
                  {/* Company Summary */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-semibold text-foreground tracking-tight">
                        {item.legalName}
                      </h2>
                      {item.status === "approved" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand-green-50 dark:bg-brand-green-950/80 px-2 py-0.5 text-[11px] font-semibold text-brand-green-900 dark:text-brand-green-300">
                          <CheckCircle2 className="size-3" />
                          Approved
                        </span>
                      )}
                      {item.status === "under_review" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/80 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                          <Clock className="size-3" />
                          Under Review
                        </span>
                      )}
                      {item.status === "submitted" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-950/80 px-2 py-0.5 text-[11px] font-semibold text-blue-800 dark:text-blue-300">
                          <Clock className="size-3" />
                          Submitted
                        </span>
                      )}
                      {item.status === "changes_requested" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 dark:bg-orange-950/80 px-2 py-0.5 text-[11px] font-semibold text-orange-800 dark:text-orange-300">
                          <AlertCircle className="size-3" />
                          Action Required
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>
                        Reg: <strong className="text-foreground">{item.registrationNumber}</strong>
                      </span>
                      <span>&middot;</span>
                      <span>
                        Rep: <strong className="text-foreground">{item.representativeName}</strong>
                      </span>
                      <span>&middot;</span>
                      <span>Submitted: {formattedDate}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 shrink-0">
                    <Link
                      href={`/admin/companies/${item.id}`}
                      className={buttonVariants({
                        variant: "default",
                        size: "sm",
                        className: "bg-brand-green-900 text-white hover:bg-brand-green-800 gap-1.5",
                      })}
                    >
                      <span>Review Application</span>
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}

export default function AdminPage() {
  return (
    <ApiProvider clerkEnabled>
      <AdminQueueContent />
    </ApiProvider>
  );
}
