"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CompanyProgressHeader } from "@/components/company/company-progress-header";
import { Button } from "@asaselink/ui/components/button";
import { Spinner } from "@asaselink/ui/components/spinner";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  FileText,
  UploadCloud,
  CheckCircle2,
} from "lucide-react";
import { orpc } from "@/utils/orpc";
import ApiProvider from "@/components/api-provider";

interface DocumentItem {
  type: string;
  label: string;
  description: string;
  fileName: string | null;
  fileSize?: number;
}

function DocumentsContent() {
  const router = useRouter();

  const [docs, setDocs] = React.useState<DocumentItem[]>([
    {
      type: "certificate_of_incorporation",
      label: "Certificate of Incorporation",
      description: "Official certificate issued by the Registrar General's Department.",
      fileName: null,
    },
    {
      type: "commencement_certificate",
      label: "Certificate to Commence Business",
      description: "RGD certificate of commencement or company profile certificate.",
      fileName: null,
    },
    {
      type: "tax_clearance",
      label: "GRA Tax Clearance / TIN Certificate",
      description: "Ghana Revenue Authority certificate or current tax standing.",
      fileName: null,
    },
    {
      type: "representative_id",
      label: "Representative Ghana Card Copy",
      description: "Clear photo or PDF copy of the designated director's Ghana Card.",
      fileName: null,
    },
  ]);

  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Prepopulate draft if exists
  React.useEffect(() => {
    let isMounted = true;
    orpc.company.getApplication
      .call()
      .then((data) => {
        if (!isMounted || !data?.documents) return;
        setDocs((prev) =>
          prev.map((d) => {
            const existing = data.documents.find((ed) => ed.documentType === d.type);
            return existing ? { ...d, fileName: existing.fileName } : d;
          }),
        );
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSimulateUpload = (type: string) => {
    setDocs((prev) =>
      prev.map((d) => {
        if (d.type === type) {
          return {
            ...d,
            fileName: `${type}_scanned_document.pdf`,
            fileSize: 1024 * 1024 * 2.4, // 2.4 MB
          };
        }
        return d;
      }),
    );
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Require at least the Certificate of Incorporation and Representative ID
    const hasIncorporation = docs.find((d) => d.type === "certificate_of_incorporation")?.fileName;
    const hasId = docs.find((d) => d.type === "representative_id")?.fileName;

    if (!hasIncorporation || !hasId) {
      setError("Please attach at least your Certificate of Incorporation and Representative ID.");
      return;
    }

    setIsSubmitting(true);
    try {
      const uploadedDocs = docs
        .filter((d) => !!d.fileName)
        .map((d) => ({
          documentType: d.type,
          fileName: d.fileName!,
          fileKey: `uploads/${d.type}-${Date.now()}.pdf`,
          fileSize: d.fileSize || 1024 * 500,
          mimeType: "application/pdf",
        }));

      await orpc.company.saveDocuments.call({ documents: uploadedDocs });
      router.push("/company/apply/review");
    } catch (err: unknown) {
      console.error("Failed to save documents:", err);
      router.push("/company/apply/review");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-svh bg-background text-foreground flex flex-col">
      <CompanyProgressHeader currentStep={3} />

      <main className="mx-auto w-full max-w-2xl px-6 py-10 my-auto">
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-10 shadow-xs">
          <div className="mb-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-gold-600 dark:text-brand-gold-400">
              Step 3 of 4 &middot; Regulatory Verification
            </span>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Verification documents
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload official records verifying your legal existence and authority to transact land
              in Ghana.
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {docs.map((doc) => {
              const isUploaded = !!doc.fileName;

              return (
                <div
                  key={doc.type}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border bg-secondary/30 p-4 transition-colors hover:bg-secondary/50"
                >
                  <div className="space-y-0.5 max-w-md">
                    <div className="flex items-center gap-2">
                      <FileText className="size-4 text-muted-foreground" />
                      <span className="text-xs sm:text-sm font-semibold text-foreground">
                        {doc.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground pl-6">{doc.description}</p>
                    {isUploaded && (
                      <div className="flex items-center gap-1.5 pl-6 pt-1 text-xs font-medium text-brand-green-700 dark:text-brand-green-400">
                        <CheckCircle2 className="size-3.5" />
                        <span className="font-mono">{doc.fileName}</span>
                      </div>
                    )}
                  </div>

                  <div className="sm:shrink-0 pl-6 sm:pl-0">
                    <Button
                      type="button"
                      variant={isUploaded ? "outline" : "secondary"}
                      size="sm"
                      onClick={() => handleSimulateUpload(doc.type)}
                      className="w-full sm:w-auto text-xs gap-1.5 font-medium"
                    >
                      <UploadCloud className="size-3.5" />
                      <span>{isUploaded ? "Replace document" : "Attach PDF / Scan"}</span>
                    </Button>
                  </div>
                </div>
              );
            })}

            <div className="pt-6 flex items-center justify-between border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="lg"
                disabled={isSubmitting}
                onClick={() => router.push("/company/apply/representative")}
                className="gap-2"
              >
                <ArrowLeft className="size-4" />
                <span>Back to representative</span>
              </Button>

              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
                className="gap-2 font-medium"
              >
                {isSubmitting ? (
                  <>
                    <Spinner className="size-4" />
                    <span>Saving documents...</span>
                  </>
                ) : (
                  <>
                    <span>Continue to review</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function CompanyApplyDocumentsPage() {
  return (
    <ApiProvider clerkEnabled>
      <DocumentsContent />
    </ApiProvider>
  );
}
