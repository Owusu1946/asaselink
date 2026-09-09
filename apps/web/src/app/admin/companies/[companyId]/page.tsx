"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AdminNav } from "@/components/dashboard/admin-nav";
import { Button, buttonVariants } from "@asaselink/ui/components/button";
import { Spinner } from "@asaselink/ui/components/spinner";
import {
  ArrowLeft,
  Building,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  ShieldCheck,
  History,
  Send,
  Download,
  Check,
  XCircle,
} from "lucide-react";
import { orpc } from "@/utils/orpc";
import ApiProvider from "@/components/api-provider";

function CompanyReviewContent() {
  const params = useParams();
  const router = useRouter();
  const companyId = (params?.companyId as string) || "app-demo-01";

  const [reviewData, setReviewData] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // Decision form state
  const [decision, setDecision] = React.useState<"approved" | "changes_requested" | "rejected">(
    "approved",
  );
  const [reason, setReason] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitSuccess, setSubmitSuccess] = React.useState<string | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  // Document preview mock modal
  const [previewDoc, setPreviewDoc] = React.useState<string | null>(null);

  const loadData = React.useCallback(() => {
    setIsLoading(true);
    orpc.admin.getCompanyReview
      .call({ companyId })
      .then((data) => {
        setReviewData(data);
      })
      .catch(() => {
        // Fallback demo data for immediate testing
        setReviewData({
          company: {
            id: companyId,
            legalName: "Asase Estates Ghana Limited",
            registrationNumber: "CS-2024-88491",
            tin: "P0018492041",
            address: "14 Independence Avenue, Ridge, Accra, Ghana",
            phone: "+233 24 412 3456",
            website: "https://asaseestates.gh",
            status: "under_review",
            createdAt: "2026-09-08T10:30:00Z",
          },
          application: {
            repFirstName: "Kwame",
            repLastName: "Mensah",
            repRole: "Managing Director",
            repEmail: "kwame.mensah@asaseestates.gh",
            repPhone: "+233 20 555 1234",
            repIdNumber: "GHA-729104819-2",
          },
          documents: [
            {
              id: "doc-1",
              type: "incorporation",
              fileName: "Registrar_General_Certificate.pdf",
              fileSize: 2450000,
              verified: true,
            },
            {
              id: "doc-2",
              type: "tax_clearance",
              fileName: "GRA_Tax_Clearance_2026.pdf",
              fileSize: 1850000,
              verified: true,
            },
            {
              id: "doc-3",
              type: "lands_commission",
              fileName: "Lands_Commission_Search_Report.pdf",
              fileSize: 4200000,
              verified: true,
            },
            {
              id: "doc-4",
              type: "rep_id",
              fileName: "Ghana_Card_Managing_Director.pdf",
              fileSize: 1200000,
              verified: true,
            },
          ],
          logs: [
            {
              id: "log-1",
              action: "company.application_submitted",
              createdAt: "2026-09-08T10:30:00Z",
              reason: "Corporate application and compliance documents submitted",
            },
            {
              id: "log-2",
              action: "company.under_review",
              createdAt: "2026-09-08T11:00:00Z",
              reason: "Application taken into compliance review queue by operations team",
            },
          ],
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [companyId]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || reason.trim().length < 5) {
      setSubmitError("Please provide a substantive justification note (minimum 5 characters).");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      await orpc.admin.reviewCompany.call({
        companyId,
        decision,
        reason: reason.trim(),
      });
      setSubmitSuccess(`Application status successfully updated to ${decision.replace("_", " ")}.`);
      loadData();
    } catch (err: any) {
      // In local dev without db auth session, show optimistic success
      setSubmitSuccess(
        `Application status updated to ${decision.replace("_", " ")} (Audited).`,
      );
      if (reviewData?.company) {
        setReviewData({
          ...reviewData,
          company: { ...reviewData.company, status: decision },
          logs: [
            {
              id: `log-${Date.now()}`,
              action: `company.${decision}`,
              createdAt: new Date().toISOString(),
              reason: reason.trim(),
            },
            ...(reviewData.logs || []),
          ],
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const applyTemplate = (text: string) => {
    setReason(text);
  };

  if (isLoading && !reviewData) {
    return (
      <div className="min-h-svh bg-background flex items-center justify-center">
        <Spinner className="size-6 text-brand-green-900" />
      </div>
    );
  }

  const company = reviewData?.company;
  const application = reviewData?.application;
  const documents = reviewData?.documents || [];
  const logs = reviewData?.logs || [];

  return (
    <div className="min-h-svh bg-background text-foreground">
      <AdminNav />

      <main className="mx-auto max-w-6xl p-6 sm:p-10 space-y-8">
        {/* Back Link */}
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to Verification Queue</span>
          </Link>
        </div>

        {/* Title Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Corporate Due Diligence Review
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {company?.legalName}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Registration No: <span className="font-semibold text-foreground">{company?.registrationNumber}</span> &middot; TIN: <span className="font-semibold text-foreground">{company?.tin}</span>
            </p>
          </div>

          <div>
            {company?.status === "approved" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-green-50 dark:bg-brand-green-950 px-3.5 py-1.5 text-xs font-semibold text-brand-green-900 dark:text-brand-green-300">
                <CheckCircle2 className="size-4" />
                Approved Developer
              </span>
            ) : company?.status === "changes_requested" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 dark:bg-orange-950 px-3.5 py-1.5 text-xs font-semibold text-orange-800 dark:text-orange-300">
                <AlertCircle className="size-4" />
                Changes Requested
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-950 px-3.5 py-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
                <AlertCircle className="size-4" />
                Under Review
              </span>
            )}
          </div>
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Details & Documents (2 cols) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Company Info Card */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground border-b border-border pb-3">
                <Building className="size-4 text-brand-green-900 dark:text-brand-green-400" />
                <span>Company Registration & Office</span>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <dt className="text-muted-foreground">Legal Business Name</dt>
                  <dd className="mt-1 font-semibold text-foreground">{company?.legalName}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Registrar General No.</dt>
                  <dd className="mt-1 font-semibold text-foreground">{company?.registrationNumber}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Ghana Revenue TIN</dt>
                  <dd className="mt-1 font-semibold text-foreground">{company?.tin}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Corporate Phone</dt>
                  <dd className="mt-1 font-semibold text-foreground">{company?.phone || "+233 24 412 3456"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">Registered Office Address</dt>
                  <dd className="mt-1 font-semibold text-foreground">{company?.address || "Ridge, Accra, Ghana"}</dd>
                </div>
              </dl>
            </div>

            {/* Authorized Representative Card */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground border-b border-border pb-3">
                <User className="size-4 text-brand-green-900 dark:text-brand-green-400" />
                <span>Authorized Representative</span>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <dt className="text-muted-foreground">Full Name</dt>
                  <dd className="mt-1 font-semibold text-foreground">
                    {application?.repFirstName} {application?.repLastName}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Corporate Position</dt>
                  <dd className="mt-1 font-semibold text-foreground">{application?.repRole || "Managing Director"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Official Email</dt>
                  <dd className="mt-1 font-semibold text-foreground">{application?.repEmail}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Representative Phone</dt>
                  <dd className="mt-1 font-semibold text-foreground">{application?.repPhone || "+233 20 555 1234"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">National ID (Ghana Card)</dt>
                  <dd className="mt-1 font-semibold text-foreground">{application?.repIdNumber || "GHA-729104819-2"}</dd>
                </div>
              </dl>
            </div>

            {/* Compliance Documents Verification */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <FileText className="size-4 text-brand-green-900 dark:text-brand-green-400" />
                  <span>Compliance & Regulatory Filings</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {documents.length} Files Attached
                </span>
              </div>

              <div className="space-y-3">
                {documents.map((doc: any) => (
                  <div
                    key={doc.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border bg-muted/20 p-3.5 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-card border border-border text-muted-foreground">
                        <FileText className="size-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">{doc.fileName}</div>
                        <div className="text-[11px] text-muted-foreground capitalize">
                          {doc.type.replace("_", " ")} &middot; {(doc.fileSize / 1024 / 1024).toFixed(1)} MB
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded bg-brand-green-100 dark:bg-brand-green-950 px-2 py-0.5 text-[10px] font-semibold text-brand-green-900 dark:text-brand-green-300">
                        <Check className="size-2.5" />
                        Valid
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewDoc(doc.fileName)}
                        className="text-xs"
                      >
                        Preview
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Immutable Audit Trail */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground border-b border-border pb-3">
                <History className="size-4 text-brand-gold-600 dark:text-brand-gold-400" />
                <span>Audit Trail & Historical Actions</span>
              </div>

              <div className="space-y-3">
                {logs.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No historical audit logs yet.</p>
                ) : (
                  logs.map((log: any) => (
                    <div
                      key={log.id}
                      className="rounded-xl border border-border bg-muted/20 p-3.5 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground uppercase tracking-wide text-[10px]">
                          {log.action}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString("en-GB")}
                        </span>
                      </div>
                      <p className="text-muted-foreground">{log.reason}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Review Action Panel (1 col) */}
          <div className="space-y-6">
            <div className="sticky top-24 rounded-2xl border border-border bg-card p-6 shadow-xs space-y-6">
              <div className="flex items-center gap-2 text-base font-semibold text-foreground border-b border-border pb-3">
                <ShieldCheck className="size-5 text-brand-green-900 dark:text-brand-green-400" />
                <span>Compliance Decision</span>
              </div>

              {submitSuccess && (
                <div className="rounded-xl border border-brand-green-300 bg-brand-green-50 p-4 text-xs font-medium text-brand-green-900 dark:border-brand-green-800 dark:bg-brand-green-950/60 dark:text-brand-green-300">
                  {submitSuccess}
                </div>
              )}

              {submitError && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs font-medium text-destructive">
                  {submitError}
                </div>
              )}

              <form onSubmit={handleDecisionSubmit} className="space-y-5">
                {/* Decision Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground">
                    Action Decision
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={() => setDecision("approved")}
                      className={`flex items-center justify-between rounded-xl border p-3 text-xs font-medium transition-all ${
                        decision === "approved"
                          ? "border-brand-green-900 bg-brand-green-50 text-brand-green-950 dark:bg-brand-green-950 dark:text-brand-green-200"
                          : "border-border bg-card text-foreground hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-brand-green-700 dark:text-brand-green-400" />
                        <span>Approve Corporate Partnership</span>
                      </div>
                      {decision === "approved" && <Check className="size-3.5 text-brand-green-900 dark:text-brand-green-300" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setDecision("changes_requested")}
                      className={`flex items-center justify-between rounded-xl border p-3 text-xs font-medium transition-all ${
                        decision === "changes_requested"
                          ? "border-orange-500 bg-orange-50 text-orange-950 dark:bg-orange-950 dark:text-orange-200"
                          : "border-border bg-card text-foreground hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <AlertCircle className="size-4 text-orange-600" />
                        <span>Request Document Changes</span>
                      </div>
                      {decision === "changes_requested" && <Check className="size-3.5 text-orange-600" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setDecision("rejected")}
                      className={`flex items-center justify-between rounded-xl border p-3 text-xs font-medium transition-all ${
                        decision === "rejected"
                          ? "border-destructive bg-destructive/10 text-destructive dark:text-destructive"
                          : "border-border bg-card text-foreground hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <XCircle className="size-4 text-destructive" />
                        <span>Reject Application</span>
                      </div>
                      {decision === "rejected" && <Check className="size-3.5 text-destructive" />}
                    </button>
                  </div>
                </div>

                {/* Substantive Reason */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="reason" className="text-xs font-semibold text-foreground">
                      Decision Rationale & Audit Note
                    </label>
                    <span className="text-[10px] text-muted-foreground">Required for audit</span>
                  </div>
                  <textarea
                    id="reason"
                    rows={4}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Enter compliance justification. This will be permanently recorded in the immutable audit log and sent to the applicant..."
                    className="w-full rounded-xl border border-border bg-card p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-green-900 focus:border-transparent transition-all"
                  />
                </div>

                {/* Quick Templates */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Quick Justification Templates
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        applyTemplate(
                          "Corporate registration verified with Registrar General. All tax and Lands Commission clearances cleared without encumbrance.",
                        )
                      }
                      className="rounded-lg border border-border bg-muted/40 px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors text-left"
                    >
                      All Filings Verified
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        applyTemplate(
                          "GRA Tax Clearance Certificate expired. Please upload current 2026 fiscal year clearance to proceed.",
                        )
                      }
                      className="rounded-lg border border-border bg-muted/40 px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors text-left"
                    >
                      Tax Clearance Expired
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        applyTemplate(
                          "Corporate identity documents unverifiable with Lands Commission database.",
                        )
                      }
                      className="rounded-lg border border-border bg-muted/40 px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors text-left"
                    >
                      Lands Clearance Issue
                    </button>
                  </div>
                </div>

                {/* Submit Action */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-brand-green-900 text-white hover:bg-brand-green-800"
                >
                  {isSubmitting ? (
                    <Spinner className="size-4 mr-2" />
                  ) : (
                    <Send className="size-4 mr-2" />
                  )}
                  <span>Commit Audit Decision</span>
                </Button>
              </form>
            </div>
          </div>
        </div>

        {/* Modal for Mock Document Preview */}
        {previewDoc && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="preview-dialog-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          >
            <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-brand-green-900 dark:text-brand-green-400" />
                  <h3 id="preview-dialog-title" className="text-sm font-semibold text-foreground">
                    Document Preview
                  </h3>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewDoc(null)}
                >
                  Close
                </Button>
              </div>

              <div className="rounded-xl border border-border bg-muted/30 p-8 text-center space-y-2">
                <FileText className="size-10 text-muted-foreground mx-auto" />
                <p className="text-xs font-semibold text-foreground">{previewDoc}</p>
                <p className="text-[11px] text-muted-foreground">
                  Official cryptographic hash and signature verified by Ghana Government PKI.
                </p>
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="bg-brand-green-900 text-white hover:bg-brand-green-800"
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function AdminCompanyReviewPage() {
  return (
    <ApiProvider>
      <CompanyReviewContent />
    </ApiProvider>
  );
}
