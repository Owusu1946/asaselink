# R2 document storage setup

AsaseLink keeps developer compliance documents in a private Cloudflare R2 bucket. The API issues five-minute, content-type-bound upload URLs and two-minute admin/developer view URLs. File bytes travel directly between the browser and R2; credentials never reach the browser.

## 1. Create the bucket

Create a private R2 bucket named `asaselink-documents`. The web Worker configuration already declares it as the `DOCUMENTS` binding.

## 2. Create scoped credentials

Create an R2 API token scoped to this bucket with Object Read & Write permission. Copy the generated Access Key ID and Secret Access Key into the API/server environment:

```env
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_BUCKET_NAME=asaselink-documents
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
```

Do not expose these values through `NEXT_PUBLIC_*` variables or commit them.

## 3. Configure browser CORS

Add this policy in R2 > `asaselink-documents` > Settings > CORS. Replace the production domain with the deployed AsaseLink origin and retain localhost for development.

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3001",
      "https://your-asaselink-domain.com"
    ],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["Content-Type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

Keep public bucket access disabled. Presigned URLs are bearer credentials and are intentionally short-lived.

## 4. Bind and deploy

The `apps/web/wrangler.jsonc` binding expects the bucket to exist before deployment. Add the same secrets to the API runtime that hosts `apps/server`; the R2 binding itself does not expose S3 signing credentials.

## Verification

1. Start the API and web app with the four R2 variables present.
2. Begin a developer application and upload a PDF or supported image under 15 MB.
3. Confirm the object appears under `companies/<company-id>/applications/...` in R2.
4. Continue to review, submit the application, then open it as an admin.
5. Select Preview and confirm the document loads through a temporary signed URL.
