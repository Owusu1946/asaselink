const MAX_PAYMENT_PROOF_BYTES = 10 * 1024 * 1024;
const PAYMENT_PROOF_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export function validatePaymentProofFile(input: { mimeType: string; fileSize: number }) {
  if (!(PAYMENT_PROOF_MIME_TYPES as readonly string[]).includes(input.mimeType))
    return { valid: false as const, reason: "Unsupported proof file type." };
  if (
    !Number.isInteger(input.fileSize) ||
    input.fileSize <= 0 ||
    input.fileSize > MAX_PAYMENT_PROOF_BYTES
  )
    return { valid: false as const, reason: "Proof must be no larger than 10 MB." };
  return { valid: true as const };
}
