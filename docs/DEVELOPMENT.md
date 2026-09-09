# Development Guide

## Principles

AsaseLink is prepared as a performance-first monorepo. Keep public pages server-rendered by default, isolate interactive/heavy features behind client boundaries, and do not add dependencies without a measured reason. The full product and engineering contract is in [ASASELINK_VISION.md](ASASELINK_VISION.md).

## Local setup

1. Install Node.js and pnpm `10.33.0`.
2. Run `pnpm install` from the repository root.
3. Copy `apps/server/.env.example` to `apps/server/.env` and `apps/web/.env.example` to `apps/web/.env`.
4. Set a local PostgreSQL connection in `apps/server/.env`. Clerk values may remain blank while working on unauthenticated flows.
5. Run `pnpm run dev`.

The web app runs on `http://localhost:3001`; the API runs on `http://localhost:3000`. The default dev task intentionally excludes deployment-only infrastructure tasks.

## Cloudflare CLI

Wrangler is installed in the `web` workspace because its configuration belongs to the Cloudflare frontend Worker. From the repository root, use:

- `pnpm run cf:login` to authenticate.
- `pnpm run cf:whoami` to verify the active account.
- `pnpm run cf:deploy` to deploy the configured web Worker directly.
- `pnpm run cf --version` to pass another Wrangler command or flag.

The equivalent workspace command is `pnpm --filter web exec wrangler <command>`. Do not use root-level `pnpm exec wrangler` unless Wrangler is intentionally added as a root dependency.

## Quality commands

- `pnpm run check-types` checks every workspace package.
- `pnpm run check` runs Oxlint and formatting.
- `pnpm run build` verifies production builds.
- `pnpm run test` is reserved for unit/integration tests as domain slices are added.
- `pnpm run test:e2e` is reserved for Playwright journeys once user flows exist.

## Performance guardrails

- Prefer Server Components and server-side data fetching.
- Use Client Components only for browser APIs and necessary interaction.
- Dynamically import Mapbox, drawing tools, and other heavy features.
- Do not mount development tools or analytics in production bundles.
- Query map data by viewport; never ship the full inventory to the browser.
- Treat reservation, payment, and availability data as correctness-sensitive rather than aggressively cached.
- Measure bundle size and Core Web Vitals after each public-experience slice.

## Environment safety

`.env.example` files document required keys without containing credentials. Real `.env` files are ignored by git. Keep local development connected only to local/staging services, never production data.
