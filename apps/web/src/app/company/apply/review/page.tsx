"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CompanyProgressHeader } from "@/components/company/company-progress-header";
import { Button } from "@asaselink/ui/components/button";
import { Checkbox } from "@asaselink/ui/components/checkbox";
import { AlertCircle, ArrowLeft, CheckCircle2, Send } from "lucide-react";
import { orpc } from "@/utils/orpc";
import ApiProvider from "@/components/api-provider";
import { Spinner } from "@asaselink/ui/components/spinner";

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
          setError("Your application could not be loaded. Refresh the page to try again.");
          setIsLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!declaration) {
      setError("Please accept the legal declaration before submitting your application.");
      return;
    }

    setIsSubmitting(true);
    try {
      await orpc.company.submitApplication.call({
        declarationAccepted: true,
      });

      router.push("/company/application");
    } catch (err: unknown) {
      console.error("Failed to submit application:", err);
      setError(err instanceof Error ? err.message : "Your application could not be submitted.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const company = applicationData?.company;
  const app = applicationData?.application;

  const documents = applicationData?.documents || [];

  return (
    <div className="min-h-svh bg-background text-foreground flex flex-col">
      <CompanyProgressHeader currentStep={4} />

      <main className="mx-auto w-full max-w-2xl px-6 py-10 my-auto">
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-10 shadow-xs">
          <div className="mb-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-gold-600 dark:text-brand-gold-400">
              Step 4 of 4 &middot; Final Declaration
            </span>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Review and submission
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Verify your submitted corporate information before sending your file to the
              administrative verification desk.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-6 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive"
            >
              <AlertCircle className="size-4 shrink-0 translate-y-0.5" />
              <p>{error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center p-8">
              <Spinner className="size-6 text-muted-foreground" />
            </div>
          ) : !company || !app ? (
            <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              No application data is available to review. Complete the earlier steps or refresh the page.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Summary 1: Company details */}
              <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-muted-foreground">
                    Corporate Entity
                  </span>
                  <button
                    type="button"
                    onClick={() => router.push("/company/apply/details")}
                    className="text-xs text-brand-green-900 dark:text-brand-green-300 hover:underline font-medium"
                  >
                    Edit
                  </button>
                </div>
                <div className="text-sm font-semibold text-foreground">{company.legalName}</div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-1">
                  <div>
                    RGD Reg:{" "}
                    <span className="font-mono text-foreground">{company.registrationNumber}</span>
                  </div>
                  <div>
                    Email: <span className="text-foreground">{company.email}</span>
                  </div>
                  <div>
                    Phone: <span className="text-foreground">{company.phone}</span>
                  </div>
                  <div>
                    TIN:{" "}
                    <span className="font-mono text-foreground">
                      {company.taxNumber || "Provided"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Summary 2: Representative details */}
              <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-muted-foreground">
                    Designated Representative
                  </span>
                  <button
                    type="button"
                    onClick={() => router.push("/company/apply/representative")}
                    className="text-xs text-brand-green-900 dark:text-brand-green-300 hover:underline font-medium"
                  >
                    Edit
                  </button>
                </div>
                <div className="text-sm font-semibold text-foreground">{app.repFullName}</div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-1">
                  <div>
                    Capacity: <span className="text-foreground">{app.repRole}</span>
                  </div>
                  <div>
                    ID Number: <span className="font-mono text-foreground">{app.repIdNumber}</span>
                  </div>
                  <div>
                    Email: <span className="text-foreground">{app.repEmail}</span>
                  </div>
                  <div>
                    Phone: <span className="text-foreground">{app.repPhone}</span>
                  </div>
                </div>
              </div>

              {/* Summary 3: Documents */}
              <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-muted-foreground">
                    Attached Documents ({documents.length || 2} attached)
                  </span>
                  <button
                    type="button"
                    onClick={() => router.push("/company/apply/documents")}
                    className="text-xs text-brand-green-900 dark:text-brand-green-300 hover:underline font-medium"
                  >
                    Edit
                  </button>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2 text-foreground">
                    <CheckCircle2 className="size-3.5 text-brand-green-700 dark:text-brand-green-400" />
                    <span>Certificate of Incorporation &amp; Commencement attached</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground">
                    <CheckCircle2 className="size-3.5 text-brand-green-700 dark:text-brand-green-400" />
                    <span>Representative Ghana Card identification attached</span>
                  </div>
                </div>
              </div>

              {/* Statutory Declaration */}
              <div className="rounded-xl border border-brand-gold-300/60 bg-brand-gold-50/50 p-4 dark:border-brand-gold-900 dark:bg-brand-gold-950/30">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <Checkbox
                    checked={declaration}
                    onCheckedChange={(checked) => setDeclaration(checked === true)}
                    disabled={isSubmitting}
                    className="mt-0.5"
                  />
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-foreground">
                      Statutory declaration of title and authority
                    </span>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      I solemnly declare that all statements made herein and documents provided are
                      authentic, true, and correct under the Statutory Declarations Act of Ghana. I
                      confirm that our company holds lawful authority to represent and transact the
                      estate lands we propose to list on AsaseLink.
                    </p>
                  </div>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-between border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  disabled={isSubmitting}
                  onClick={() => router.push("/company/apply/documents")}
                  className="gap-2"
                >
                  <ArrowLeft className="size-4" />
                  <span>Back to documents</span>
                </Button>

                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting || !declaration}
                  aria-busy={isSubmitting}
                  className="gap-2 font-medium"
                >
                  {isSubmitting ? (
                    <>
                      <Spinner className="size-4" />
                      <span>Submitting application...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit application</span>
                      <Send className="size-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

export default function CompanyApplyReviewPage() {
  return (
    <ApiProvider clerkEnabled>
      <ReviewContent />
    </ApiProvider>
  );
}
