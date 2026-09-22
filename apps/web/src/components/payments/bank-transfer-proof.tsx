"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@asaselink/ui/components/button";
import { client } from "@/utils/orpc";
import { notify } from "@/utils/notify";

const accepted = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

export function BankTransferProof({
  paymentReference,
  onSubmitted,
}: {
  paymentReference: string;
  onSubmitted: () => void;
}) {
  const [details, setDetails] = useState<Record<string, unknown> | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [transferReference, setTransferReference] = useState("");
  const [transferDate, setTransferDate] = useState(new Date().toISOString().slice(0, 10));
  const [senderName, setSenderName] = useState("");
  const [senderAccount, setSenderAccount] = useState("");
  const [progress, setProgress] = useState(0);
  const [pending, startTransition] = useTransition();
  useEffect(() => {
    client.payments
      .bankTransferDetails({ paymentReference })
      .then((value) => setDetails(value as Record<string, unknown>))
      .catch((error) => notify.apiError(error, "Bank details unavailable"));
  }, [paymentReference]);
  function submit() {
    startTransition(async () => {
      try {
        if (!file || !accepted.includes(file.type) || file.size > 10 * 1024 * 1024)
          throw new Error("Choose a PDF, JPG, PNG or WebP proof up to 10 MB.");
        const checksum = Array.from(
          new Uint8Array(await crypto.subtle.digest("SHA-256", await file.arrayBuffer())),
        )
          .map((byte) => byte.toString(16).padStart(2, "0"))
          .join("");
        const authorization = await client.payments.beginProofUpload({
          paymentReference,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type as (typeof accepted)[number] &
            ("application/pdf" | "image/jpeg" | "image/png" | "image/webp"),
          checksum,
          transferReference,
          transferDate: new Date(`${transferDate}T12:00:00Z`),
          senderName,
          senderAccount: senderAccount || undefined,
        });
        setProgress(30);
        const response = await fetch(authorization.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!response.ok)
          throw new Error("Private proof upload failed. Check the R2 CORS configuration.");
        setProgress(75);
        await client.payments.confirmProofUpload({ paymentReference });
        await client.payments.submitBankTransfer({ paymentReference });
        setProgress(100);
        notify.success("Transfer proof submitted", {
          description: "Operations can now securely verify it.",
        });
        onSubmitted();
      } catch (error) {
        setProgress(0);
        notify.apiError(error, "Proof could not be submitted");
      }
    });
  }
  if (!details)
    return <p className="mt-4 text-sm text-muted-foreground">Loading receiving account…</p>;
  return (
    <div className="mt-5 rounded-2xl border border-border bg-muted/25 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Transfer to
      </p>
      <p className="mt-2 text-lg font-semibold">{String(details.bankName)}</p>
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Account name</dt>
          <dd className="font-semibold">{String(details.accountName)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Account number</dt>
          <dd className="font-mono font-semibold">{String(details.accountNumber)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Branch</dt>
          <dd>{String(details.branch ?? "—")}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Purpose</dt>
          <dd>{String(details.purpose).replaceAll("_", " ")}</dd>
        </div>
      </dl>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">
        {String(details.instructions ?? "Use the payment reference as narration.")}
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <input
          aria-label="Transfer reference"
          placeholder="Transfer reference"
          value={transferReference}
          onChange={(e) => setTransferReference(e.target.value)}
          className="h-11 rounded-xl border border-border bg-background px-3 text-sm"
        />
        <input
          aria-label="Transfer date"
          type="date"
          value={transferDate}
          onChange={(e) => setTransferDate(e.target.value)}
          className="h-11 rounded-xl border border-border bg-background px-3 text-sm"
        />
        <input
          aria-label="Sender name"
          placeholder="Sender/account name"
          value={senderName}
          onChange={(e) => setSenderName(e.target.value)}
          className="h-11 rounded-xl border border-border bg-background px-3 text-sm"
        />
        <input
          aria-label="Sender account"
          placeholder="Sender account (optional)"
          value={senderAccount}
          onChange={(e) => setSenderAccount(e.target.value)}
          className="h-11 rounded-xl border border-border bg-background px-3 text-sm"
        />
      </div>
      <label className="mt-3 block rounded-xl border border-dashed border-border bg-background p-4 text-sm">
        <span className="font-semibold">Payment proof</span>
        <span className="mt-1 block text-xs text-muted-foreground">
          Private PDF, JPG, PNG or WebP · maximum 10 MB
        </span>
        <input
          type="file"
          accept={accepted.join(",")}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="mt-3 block w-full text-xs"
        />
      </label>
      {progress > 0 ? (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary transition-[width]" style={{ width: `${progress}%` }} />
        </div>
      ) : null}
      <Button
        onClick={submit}
        disabled={pending || !file || transferReference.length < 5 || senderName.length < 2}
        className="mt-4 w-full"
      >
        {pending ? "Uploading securely…" : "Submit transfer proof"}
      </Button>
    </div>
  );
}
