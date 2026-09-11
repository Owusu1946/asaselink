# Clerk Organizations setup

AsaseLink uses Clerk Organizations for invitations and membership identity, while the AsaseLink database remains the source of truth for granular operational roles and audit history.

## One-time Clerk dashboard setup

1. Open **Clerk Dashboard → Organizations → Settings** and enable Organizations.
2. Select **Membership optional**. Buyers keep personal accounts; approved estate developers receive an organization workspace.
3. Keep the built-in `org:admin` and `org:member` roles. AsaseLink maps owner/admin to `org:admin`; manager, sales, surveyor, and viewer use `org:member` with finer permissions enforced by the API.
4. Open **Webhooks → Add endpoint**.
5. Use `https://YOUR_API_DOMAIN/webhooks/clerk` in production. For local testing, expose port 3000 with Clerk CLI or a tunnel and use `/webhooks/clerk`.
6. Subscribe to:
   - `organizationInvitation.accepted`
   - `organizationInvitation.revoked`
   - `organizationMembership.created`
   - `organizationMembership.updated`
   - `organizationMembership.deleted`
7. Copy the endpoint signing secret into the API environment as `CLERK_WEBHOOK_SIGNING_SECRET`.

## Deploy the database change

Run `pnpm --filter @asaselink/db db:migrate:deploy` once for each environment before opening the Company Staff page.

## Production notes

- Invitation emails are sent by Clerk and acceptance lands on `/workspaces`.
- Every mutation is authorized again by the API; hiding controls in the UI is not treated as security.
- Webhook signatures are mandatory and delivery IDs are deduplicated. Failed deliveries can safely retry.
- Do not expose `CLERK_SECRET_KEY` or `CLERK_WEBHOOK_SIGNING_SECRET` to the browser.
