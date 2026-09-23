"use client";

import Link from "next/link";
import { buttonVariants } from "@asaselink/ui/components/button";
import { useCompanyWorkspace } from "@/components/dashboard/company-page-shell";

export default function CompanyOverviewPage() {
  const { companyId, summary, loading } = useCompanyWorkspace();
  const counts = summary?.counts;
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {[
        ["Registered estates", counts?.estateCount],
        ["Available plots", counts?.availablePlotCount],
        ["Active staff", counts?.activeStaffCount],
      ].map(([label, value]) => (
        <div key={String(label)} className="rounded-2xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold tabular-nums" aria-busy={loading}>
            {value ?? "—"}
          </p>
        </div>
      ))}
      {!loading && counts?.estateCount === 0 ? (
        <div className="md:col-span-3 rounded-2xl border border-dashed border-border p-10 text-center">
          <h2 className="font-semibold">Register your first estate</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Add a company-supplied master plan for platform review and plot mapping.
          </p>
          <Link
            href={`/company/${companyId}/estates`}
            className={buttonVariants({ size: "sm", className: "mt-5" })}
          >
            Register estate
          </Link>
        </div>
      ) : null}
      {!loading && (counts?.estateCount ?? 0) > 0 ? (
        <div className="md:col-span-3 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-semibold">Recent estates</h2>
          <div className="mt-4 divide-y divide-border">
            {summary?.recentEstates.slice(0, 5).map((estate) => (
              <Link
                key={estate.id}
                href={`/company/${companyId}/estates/${estate.id}`}
                className="flex items-center justify-between gap-4 py-3 text-sm hover:text-brand-green-800"
              >
                <span className="truncate font-medium">{estate.name}</span>
                <span className="shrink-0 text-xs capitalize text-muted-foreground">
                  {estate.plotCount} plots · {estate.status.replace("_", " ")}
                </span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
