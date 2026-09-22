# Phase 4 and 5 acceptance

## Trust labels

- Estate, plot, price, and developer records are **company supplied** unless a separate source is shown.
- Survey documents are **licensed-surveyor supplied** only when their provenance says so.
- Company and payment decisions are **AsaseLink platform reviewed**; this is not Lands Commission, title, planning, or EPA approval.
- Viability results are **AsaseLink geographic screening** and always indicative. Confirm with the relevant authority and qualified professionals.

## Deterministic non-production data

Set `DATABASE_URL` to a local or staging database and run `pnpm db:seed:demo`. The command refuses to run when `NODE_ENV=production` or `CF_PAGES_BRANCH=main`, commits no credentials, and is idempotent. It creates documented placeholder actors (`*.invalid`), one company, Estate A and Estate B, plots for every requested state, purchase/refund examples, and prototype viability layers.

## Deployment order and rollback

1. Back up the database and apply migrations 0016 and 0017.
2. Deploy API, then frontend. The jobs worker is unchanged.
3. Confirm R2 credentials and private-bucket CORS from `R2_DOCUMENT_STORAGE_SETUP.md`.
4. Smoke test bank details, proof upload, secure preview, rejection, approval, hold credit, installments, zero balance, and sold status.

Rollback application workers to the preceding deployment first. Keep the additive tables and columns during rollback; removing them while a new worker is active is unsafe. Restore the database backup only if data rollback is explicitly required.

Required server variables: `DATABASE_URL`, `CORS_ORIGIN`, `CLERK_SECRET_KEY`, `R2_ACCOUNT_ID`, `R2_BUCKET_NAME`, `R2_ACCESS_KEY_ID`, and `R2_SECRET_ACCESS_KEY`. Required web variables: `NEXT_PUBLIC_SERVER_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`.
