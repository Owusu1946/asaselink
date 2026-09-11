"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CompanyOnboardingShell } from "@/components/company/company-onboarding-shell";
import { DocumentUploadZone, type UploadedFileMeta } from "@/components/company/document-upload-zone";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon } from "@hugeicons/core-free-icons";
import { orpc } from "@/utils/orpc";
import ApiProvider from "@/components/api-provider";
import { notify } from "@/utils/notify";

interface DocumentSlot {
  type: string;
  label: string;
  description: string;
  isRequired: boolean;
  file: UploadedFileMeta | null;
}

function DocumentsContent() {
  const router = useRouter();

  const [docSlots, setDocSlots] = React.useState<DocumentSlot[]>([
    {
      type: "certificate_of_incorporation",
      label: "Certificate of Incorporation",
      description: "Official certificate proving legal registration.",
      isRequired: true,
      file: null,
    },
    {
      type: "commencement_certificate",
      label: "Commencement Certificate",
      description: "Certificate to commence business or company profile.",
      isRequired: true,
      file: null,
    },
    {
      type: "representative_id",
      label: "Representative ID",
      description: "Clear photo or scan of the designated representative's ID.",
      isRequired: true,
      file: null,
    },
  ]);

  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Prepopulate draft documents if exist
  React.useEffect(() => {
    let isMounted = true;
    orpc.company.getApplication
      .call()
      .then((data) => {
        if (!isMounted || !data?.documents) return;
        setDocSlots((prev) =>
          prev.map((slot) => {
            const match = data.documents.find((d: any) => d.documentType === slot.type);
            if (match) {
              return {
                ...slot,
                file: {
                  id: match.id,
                  fileName: match.fileName,
                  fileKey: match.fileKey,
                  fileSize: match.fileSize || 1024 * 512,
                  mimeType: match.mimeType || "application/pdf",
                },
              };
            }
            return slot;
          }),
        );
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const handleUpdateFile = (type: string, meta: UploadedFileMeta) => {
    setDocSlots((prev) =>
      prev.map((slot) => (slot.type === type ? { ...slot, file: meta } : slot)),
    );
    setError(null);
  };

  const handleRemoveFile = (type: string) => {
    setDocSlots((prev) =>
      prev.map((slot) => (slot.type === type ? { ...slot, file: null } : slot)),
    );
  };

  const handleNext = async () => {
    setError(null);

    const missingRequired = docSlots.filter((s) => s.isRequired && !s.file);
    if (missingRequired.length > 0) {
      setError(`Please upload all required files: ${missingRequired.map((m) => m.label).join(", ")}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const documentIds = docSlots
        .filter((s) => s.file !== null)
        .map((s) => s.file!.id);

      await orpc.company.saveDocuments.call({
        documentIds,
      });

      notify.success("Documents saved", { description: "Your verified uploads are ready for review." });
      router.push("/company/apply/review");
    } catch (err: unknown) {
      console.error("Failed to save documents:", err);
      setError(err instanceof Error ? err.message : "Documents could not be saved.");
      notify.apiError(err, "Documents could not be saved");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CompanyOnboardingShell
      currentStep={3}
      title="Upload your documents"
      subtitle="Attach official documentation to verify your business and representative."
      backHref="/company/apply/representative"
      onNext={handleNext}
      isSubmitting={isSubmitting}
      nextLabel="Continue"
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

        <div className="space-y-4">
          {docSlots.map((slot) => (
            <DocumentUploadZone
              key={slot.type}
              documentType={slot.type}
              label={slot.label}
              description={slot.description}
              isRequired={slot.isRequired}
              file={slot.file}
              disabled={isSubmitting}
              onUploadComplete={(meta) => handleUpdateFile(slot.type, meta)}
              onRemove={() => handleRemoveFile(slot.type)}
            />
          ))}
        </div>
      </div>
    </CompanyOnboardingShell>
  );
}

export default function CompanyApplyDocumentsPage() {
  return (
    <ApiProvider clerkEnabled>
      <DocumentsContent />
    </ApiProvider>
  );
}
