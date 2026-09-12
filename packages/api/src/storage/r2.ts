import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@asaselink/env/server";

export const MAX_DOCUMENT_BYTES = 15 * 1024 * 1024;
export const DOCUMENT_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"] as const;
export const SITE_PLAN_MIME_TYPES = ["image/jpeg", "image/png"] as const;
export const MAX_SITE_PLAN_BYTES = 20 * 1024 * 1024;

function configuration() {
  const values = { accountId: env.R2_ACCOUNT_ID, bucket: env.R2_BUCKET_NAME, accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY };
  if (Object.values(values).some((value) => !value)) throw new Error("Document storage is not configured. Add the R2 credentials to the API environment.");
  return values as Record<keyof typeof values, string>;
}

function client() {
  const config = configuration();
  return { bucket: config.bucket, s3: new S3Client({ region: "auto", endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`, credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey } }) };
}

export function safeFileName(fileName: string) {
  const cleaned = fileName.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-");
  return cleaned.replace(/^[-.]+|[-.]+$/g, "").slice(0, 120) || "document";
}

export function companyDocumentKey(companyId: string, applicationId: string, documentType: string, fileName: string) {
  return `companies/${companyId}/applications/${applicationId}/${documentType}/${crypto.randomUUID()}-${safeFileName(fileName)}`;
}

export function estateSitePlanKey(companyId: string, estateId: string, fileName: string) {
  return `companies/${companyId}/estates/${estateId}/site-plans/${crypto.randomUUID()}-${safeFileName(fileName)}`;
}

export async function createDocumentUploadUrl(key: string, mimeType: string) {
  const { s3, bucket } = client();
  return getSignedUrl(s3, new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: mimeType }), { expiresIn: 300 });
}

export async function verifyDocumentObject(key: string) {
  const { s3, bucket } = client();
  return s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
}

export async function createDocumentViewUrl(key: string, fileName: string) {
  const { s3, bucket } = client();
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: bucket, Key: key, ResponseContentDisposition: `inline; filename="${safeFileName(fileName)}"` }), { expiresIn: 120 });
}

export async function deleteDocumentObject(key: string) {
  const { s3, bucket } = client();
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
