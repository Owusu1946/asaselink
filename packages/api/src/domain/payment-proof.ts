import { MAX_PAYMENT_PROOF_BYTES, PAYMENT_PROOF_MIME_TYPES } from "../storage/r2";

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
