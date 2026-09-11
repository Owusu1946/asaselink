"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CompanyOnboardingShell } from "@/components/company/company-onboarding-shell";
import { Button } from "@asaselink/ui/components/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertCircleIcon,
  CheckmarkCircle02Icon,
  File01Icon,
  Loading03Icon,
} from "@hugeicons/core-free-icons";
import { orpc } from "@/utils/orpc";
import ApiProvider from "@/components/api-provider";
import { notify } from "@/utils/notify";

function ReviewContent() {
  const router = useRouter();

  const [applicationData, setApplicationData] = React.useState<any>(null);
  const [declaration, setDeclaration] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let isMounted = true;
    orpc.company.getApplication
      .call()
      .then((data) => {
        if (!isMounted) return;
        setApplicationData(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load application data:", err);
        if (isMounted) {
          setError("Your application could not be loaded. Please refresh the page.");
          setIsLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const company = applicationData?.company;
  const app = applicationData?.application;
  const documents = applicationData?.documents || [];

  const handleSubmit = async () => {
    setError(null);

    if (!declaration) {
      setError("Please confirm the agreement before submitting your application.");
      return;
    }

    setIsSubmitting(true);
    try {
      await orpc.company.submitApplication.call({
        declarationAccepted: true,
      });

      notify.success("Application submitted", { description: "AsaseLink will notify you when the compliance review is complete." });
      router.push("/company/application");
    } catch (err: unknown) {
      console.error("Failed to submit application:", err);
      setError(err instanceof Error ? err.message : "Your application could not be submitted.");
      notify.apiError(err, "Application was not submitted");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CompanyOnboardingShell
      currentStep={4}
      title="Review your application"
      subtitle="Check your details below before submitting your company for verification."
      backHref="/company/apply/documents"
      onNext={handleSubmit}
      isSubmitting={isSubmitting}
      isNextDisabled={!declaration}
      nextLabel="Submit application"
    >
      <div className="space-y-6">
        {error && (
          <div
            role="alert"
            className="flex items-center gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive"
          >
            <HugeiconsIcon icon={AlertCircleIcon} size={16} className="shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center p-12">
            <HugeiconsIcon icon={Loading03Icon} size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : !company || !app ? (
          <div className="p-6 rounded-2xl border border-border text-center space-y-3">
            <p className="text-sm font-semibold">Application details missing</p>
            <p className="text-xs text-muted-foreground">Please complete previous steps first.</p>
            <Link href="/company/apply/details" className="text-xs font-semibold underline">
              Go to Step 1
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Section 1: Business */}
            <div className="p-5 rounded-2xl border border-border bg-card space-y-3">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Company Details
                </span>
                <Link
                  href="/company/apply/details"
                  className="text-xs font-semibold underline underline-offset-2 text-foreground hover:text-muted-foreground transition-colors"
                >
                  Edit
                </Link>
              </div>

              <div className="space-y-1">
                <h3 className="font-semibold text-foreground text-base">{company.legalName}</h3>
                {company.tradeName && (
                  <p className="text-xs text-muted-foreground">Brand: {company.tradeName}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground pt-1">
                <div>
                  <span className="text-[10px] uppercase block text-muted-foreground/70">Registration</span>
                  <span className="font-mono font-medium text-foreground">{company.registrationNumber}</span>
                </div>
                {company.taxNumber && (
                  <div>
                    <span className="text-[10px] uppercase block text-muted-foreground/70">Tax Number</span>
                    <span className="font-mono font-medium text-foreground">{company.taxNumber}</span>
                  </div>
                )}
                <div>
                  <span className="text-[10px] uppercase block text-muted-foreground/70">Email</span>
                  <span className="text-foreground truncate block">{company.email}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase block text-muted-foreground/70">Phone</span>
                  <span className="text-foreground block">{company.phone}</span>
                </div>
              </div>
            </div>

            {/* Section 2: Representative */}
            <div className="p-5 rounded-2xl border border-border bg-card space-y-3">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Authorized Representative
                </span>
                <Link
                  href="/company/apply/representative"
                  className="text-xs font-semibold underline underline-offset-2 text-foreground hover:text-muted-foreground transition-colors"
                >
                  Edit
                </Link>
              </div>

              <div className="space-y-0.5">
                <h3 className="font-semibold text-foreground text-base">{app.repFullName}</h3>
                <p className="text-xs text-muted-foreground">{app.repRole}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground pt-1">
                <div>
                  <span className="text-[10px] uppercase block text-muted-foreground/70">ID Verification</span>
                  <span className="font-mono font-medium text-foreground">{app.repIdNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase block text-muted-foreground/70">Direct Contact</span>
                  <span className="text-foreground block">{app.repPhone}</span>
                </div>
              </div>
            </div>

            {/* Section 3: Documents */}
            <div className="p-5 rounded-2xl border border-border bg-card space-y-3">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Uploaded Documents ({documents.length})
                </span>
                <Link
                  href="/company/apply/documents"
                  className="text-xs font-semibold underline underline-offset-2 text-foreground hover:text-muted-foreground transition-colors"
                >
                  Edit
                </Link>
              </div>

              <div className="space-y-2">
                {documents.map((doc: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-xs py-1">
                    <div className="flex items-center gap-2 truncate">
                      <HugeiconsIcon icon={File01Icon} size={15} className="text-muted-foreground shrink-0" />
                      <span className="font-medium text-foreground truncate">{doc.fileName}</span>
                    </div>
                    <span className="flex items-center gap-1 text-[11px] text-brand-green-700 dark:text-brand-green-400 font-medium shrink-0">
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} size={13} /> Attached
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Simple Agreement Checkbox */}
            <div className="p-4 rounded-xl border border-border bg-secondary/30">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={declaration}
                  onChange={(e) => setDeclaration(e.target.checked)}
                  className="mt-0.5 rounded border-input size-4 text-brand-green-900 focus:ring-brand-green-900 dark:focus:ring-brand-green-400"
                />
                <span className="text-xs text-foreground leading-relaxed font-medium">
                  I confirm that all provided details and documents are genuine and accurate, and I am authorized to submit this verification request on behalf of the company.
                </span>
              </label>
            </div>
          </div>
        )}
      </div>
    </CompanyOnboardingShell>
  );
}

export default function CompanyApplyReviewPage() {
  return (
    <ApiProvider clerkEnabled>
      <ReviewContent />
    </ApiProvider>
  );
}
