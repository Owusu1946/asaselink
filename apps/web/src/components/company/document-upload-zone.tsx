"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Upload01Icon,
  File01Icon,
  CheckmarkCircle02Icon,
  Cancel01Icon,
  Loading03Icon,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@asaselink/ui/components/button";
import { cn } from "@asaselink/ui/lib/utils";
import { orpc } from "@/utils/orpc";
import { notify } from "@/utils/notify";

export interface UploadedFileMeta {
  id: string;
  fileName: string;
  fileKey: string;
  fileSize?: number;
  mimeType?: string;
  previewUrl?: string;
}

interface DocumentUploadZoneProps {
  documentType: string;
  label: string;
  description: string;
  isRequired?: boolean;
  file: UploadedFileMeta | null;
  onUploadComplete: (meta: UploadedFileMeta) => void;
  onRemove: () => void;
  disabled?: boolean;
  className?: string;
}

export function DocumentUploadZone({
  documentType,
  label,
  description,
  isRequired = true,
  file,
  onUploadComplete,
  onRemove,
  disabled = false,
  className,
}: DocumentUploadZoneProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const processFile = async (selectedFile: File) => {
    setErrorMessage(null);

    // Max 15MB
    if (selectedFile.size > 15 * 1024 * 1024) {
      setErrorMessage("File exceeds 15MB limit.");
      return;
    }

    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(selectedFile.type)) {
      setErrorMessage("Please select a PDF, PNG, or JPG file.");
      return;
    }

    setIsUploading(true);
    try {
      const authorization = await orpc.company.beginDocumentUpload.call({ documentType: documentType as "certificate_of_incorporation" | "commencement_certificate" | "representative_id" | "tax_clearance", fileName: selectedFile.name, fileSize: selectedFile.size, mimeType: selectedFile.type as "application/pdf" | "image/jpeg" | "image/png" | "image/webp" });
      const response = await fetch(authorization.uploadUrl, { method: "PUT", headers: { "Content-Type": selectedFile.type }, body: selectedFile });
      if (!response.ok) throw new Error(response.status === 403 ? "The upload authorization expired or the R2 CORS policy rejected this request." : "Cloud storage rejected the upload.");
      const confirmed = await orpc.company.confirmDocumentUpload.call({ documentId: authorization.documentId });
      if (!confirmed) throw new Error("The upload could not be confirmed.");
      onUploadComplete({ id: confirmed.id, fileName: confirmed.fileName, fileKey: confirmed.fileKey, fileSize: confirmed.fileSize ?? undefined, mimeType: confirmed.mimeType ?? undefined });
      notify.success("Document uploaded", { description: selectedFile.name });
    } catch (error) {
      const message = error instanceof Error ? error.message : "The document could not be uploaded.";
      setErrorMessage(message);
      notify.error("Upload failed", { description: message });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeFile = async () => {
    if (!file) return;
    try {
      await orpc.company.removeDocument.call({ documentId: file.id });
      onRemove();
      notify.success("Document removed");
    } catch (error) {
      const message = error instanceof Error ? error.message : "The document could not be removed.";
      setErrorMessage(message);
      notify.error("Remove failed", { description: message });
    }
  };

  const viewFile = async () => {
    if (!file) return;
    const tab = window.open("about:blank", "_blank");
    if (tab) tab.opener = null;
    try {
      const result = await orpc.company.getDocumentViewUrl.call({ documentId: file.id });
      if (tab) tab.location.href = result.url;
      else window.location.assign(result.url);
    } catch (error) {
      tab?.close();
      notify.apiError(error, "Document could not be opened");
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.webp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) processFile(e.target.files[0]);
        }}
        disabled={disabled || isUploading}
      />

      {/* Label and Description */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-semibold text-foreground">{label}</span>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        {isRequired ? (
          <span className="text-[11px] font-medium text-muted-foreground">Required</span>
        ) : (
          <span className="text-[11px] text-muted-foreground">Optional</span>
        )}
      </div>

      {/* Upload Box */}
      {file ? (
        <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-10 rounded-lg bg-secondary flex items-center justify-center text-foreground shrink-0">
              <HugeiconsIcon icon={File01Icon} size={20} />
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-foreground truncate">{file.fileName}</p>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span>{formatFileSize(file.fileSize)}</span>
                <span>&bull;</span>
                <span className="flex items-center gap-1 text-brand-green-700 dark:text-brand-green-400 font-medium">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={13} /> Uploaded
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button type="button" variant="ghost" size="sm" onClick={viewFile} disabled={disabled} className="text-xs h-8">View</Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="text-xs h-8"
            >
              Replace
            </Button>
            <button
              type="button"
              onClick={removeFile}
              disabled={disabled}
              className="size-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title="Remove"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragging(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
          }}
          className={cn(
            "border border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-2",
            isDragging
              ? "border-foreground bg-secondary/60"
              : "border-border hover:border-foreground/40 hover:bg-secondary/20",
          )}
        >
          {isUploading ? (
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground py-2">
              <HugeiconsIcon icon={Loading03Icon} size={20} className="animate-spin" />
              <span>Uploading...</span>
            </div>
          ) : (
            <>
              <div className="size-10 rounded-full bg-secondary flex items-center justify-center text-foreground">
                <HugeiconsIcon icon={Upload01Icon} size={20} />
              </div>
              <p className="text-xs font-semibold text-foreground">
                Upload or drag document here
              </p>
              <p className="text-[11px] text-muted-foreground">PDF, PNG, or JPG up to 15MB</p>
            </>
          )}
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-1.5 text-xs text-destructive">
          <HugeiconsIcon icon={AlertCircleIcon} size={14} />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
