# AsaseLink Product Vision and Engineering Constitution

**Status:** Canonical project source of truth  
**Last updated:** 2026-09-04

## Product Definition

AsaseLink is a fast, secure, map-driven digital land marketplace connecting buyers with verified land companies. Buyers discover estates, inspect geographic layouts, select plots, reserve them, pay, and track verification through one trustworthy flow. The core relationship is:

`Company -> Estate -> Plot -> Discovery -> Reservation -> Payment -> Verification -> Confirmed/Sold`

The map is a primary product surface, not decoration. A user must understand where an estate and plot are, its current status, and what they are buying.

## Product Principles

- Modern, premium, calm, professional, clean, spatially intelligent, fast, reliable.
- Public discovery is frictionless; authentication is required only for identity-sensitive actions such as reservation.
- The database is authoritative. The frontend, map, and payment UI are representations, never proof of state.
- Correctness, security, transactional integrity, accessibility, responsiveness, and performance are non-negotiable.
- Start simple and modular. Add infrastructure only when measured bottlenecks justify it.

## Users and Authorization

Users are buyers, company staff, and AsaseLink administrators. Clerk manages authentication (Google, Facebook, Apple, email, and phone/OTP); AsaseLink stores application profile, role, verification, organization membership, and permissions.

Companies have profiles, verification state, estates, staff, reservations, transaction information, and audit history. Staff roles include Owner, Administrator, Sales Manager, Sales Agent, and Finance Officer. Authorization is always enforced server-side for authentication, identity, organization membership, role, permission, resource ownership, and access. Frontend checks are UX only.

Administrators oversee companies, verification, estates, plots, conflicts, reservations, payments, users, disputes, audit logs, and platform controls. Critical and destructive actions require confirmation and auditing.

## Domain and Data Model

The extensible core model is:

`Company -> Estate -> Plot -> Reservation -> Payment -> Verification`

Supporting concepts include users, staff, ownership history, boundary history, restricted areas, documents, notifications, and structured audit logs. Important history is preserved rather than overwritten.

Use PostgreSQL + PostGIS as the authoritative relational/geographic database, with Drizzle ORM and Drizzle Kit. Enforce invariants near the database: foreign keys, status constraints, transactional updates, appropriate indexes, and GiST spatial indexes.

## Geographic Authority

Estate boundaries are Polygon or MultiPolygon; plots are Polygon; restricted areas are Polygon or MultiPolygon for roads, water, utilities, and reserved land. Preserve real geometry, never reduce land to points.

The server/database validates geometry using PostGIS capabilities such as `ST_IsValid`, `ST_Intersects`, `ST_Contains`, `ST_Within`, `ST_Overlaps`, `ST_Area`, and `ST_Intersection`. Detect invalid/self-intersecting polygons, plot overlap, plots outside estates, restricted-area intersections, invalid coordinates, and platform-rule violations. Mapbox GL JS is the visualization layer; PostGIS is the geographic authority.

Use GeoJSON initially and design the API for viewport/bounds queries. The browser receives only relevant geographic data. Evolve to vector tiles only when measurements justify it; do not add H3, Redis, search clusters, Kafka, or microservices prematurely.

Authorized company users can draw, edit, review, and submit estate/plot geometry with a Mapbox-compatible drawing tool. Final validation and approval are server-side. Geometry changes are versioned with previous/new geometry, actor, timestamp, reason, and approval state where applicable.

## Land, Reservation, and Payment Integrity

Land statuses include `AVAILABLE`, `RESERVED`, and `SOLD`, with additional internal states as needed. Backend-controlled transitions prevent arbitrary frontend status changes.

Reservation creation is transactional and concurrency-safe: two users must never successfully reserve the same plot. Use atomic availability checks, row locking and/or database constraints, and a non-negotiable concurrent reservation test. Reservation expiry is server-side, reliable, configurable, and idempotent; use Cloudflare background processing where appropriate.

Keep plot, reservation, and payment state explicit rather than casually coupling them. Typical flow: `AVAILABLE -> RESERVED -> PAYMENT -> VERIFICATION -> CONFIRMED -> SOLD`; expired reservations return to `AVAILABLE` according to configured rules.

Paystack is the preferred initial payment provider behind a provider abstraction. Initiate payments server-side, record references/statuses/amounts/timestamps, process webhooks, and verify payment server-side. Never trust a frontend success message. Payment proof, when needed, is private, validated, size-limited, stored in Cloudflare R2, and served through controlled access; the database stores metadata and object identifiers.

## API and Runtime Architecture

Use modular Hono + TypeScript APIs organized around auth, users, companies, estates, plots, maps, reservations, payments, documents, verification, admin, and audit. Keep domain logic out of route handlers and UI components; validate all server boundaries with Zod.

Deploy the API on Cloudflare Workers with Wrangler. Use Cloudflare R2 for objects and Queues/Workers for expiry, notifications, GIS/document/image processing, and other non-blocking jobs. Jobs are idempotent. Use environment-specific secrets and keep development, staging, and production separate.

Use Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui, and Hugeicons. Prefer Server Components and server-side fetching. Use Client Components only for Mapbox, drawing, filters, complex forms, real-time UI, and necessary interactivity. Avoid Redux/global state unless proven necessary.

## Buyer Experience

`Home -> Explore Estates -> Estate -> Interactive Map -> Plot -> Details -> Reserve -> Authenticate -> Reservation -> Payment -> Verification -> Confirmation`

Public estate pages should be indexable, responsive, and show estate name/company, location, description, images, pricing, boundary, plot availability, metadata, and a prominent map. Plot details clearly show number, status, area, price, estate, and reserve action. Status uses text/labels/patterns in addition to color.

## Company and Admin Operations

Company portals provide overview metrics, estate creation/editing, boundary management, plot creation/editing and metadata, map views, reservations, payment review, verification, staff invitations, role assignment, and access removal.

Admin portals provide company verification, estate/geographic oversight, reservation/payment/user review, dispute/problem management, audit inspection, and platform controls. All important changes are structured and auditable: actor, action, resource, before/after state, timestamp, reason, and relevant request metadata.

## Design, Accessibility, and Performance

Build one coherent custom design system for typography, spacing, radius, shadows, controls, tables, dialogs, badges, statuses, loading, empty, and error states. Use icons intentionally and sparingly. The product must feel like a focused land marketplace, not a generic dashboard or GIS tool.

Design mobile-first for mobile, tablet, laptop, and desktop. Maps, plot cards, forms, dashboards, tables, navigation, reservation, and payment remain usable at small sizes. Every async interaction has contextual skeleton/progressive loading; errors are human-readable and technical details stay in monitoring.

Targets: `LCP <= 2.5s`, `CLS <= 0.1`, `INP <= 200ms`. Use server rendering, small client bundles, dynamic imports, lazy Mapbox loading, optimized images/fonts, CDN delivery, intentional caching, spatial indexes, bounded queries, and no N+1 patterns. Do not aggressively cache availability, payment, or transaction state.

Meet accessibility requirements for keyboard/focus, semantic HTML, labels, contrast, screen readers, and non-color-only status communication. Provide reasonable alternatives for important map information.

## Security, Observability, and Quality

Never hardcode secrets. Validate request bodies, query parameters, IDs, coordinates, geometry, files, and payment inputs. Protect private documents, rate-limit where appropriate, use safe error responses, and prevent cross-company/resource access.

Use Sentry for frontend/API/transaction/performance errors and PostHog selectively for meaningful product events such as `estate_viewed`, `map_opened`, `plot_selected`, `reservation_started`, `reservation_created`, `payment_started`, `payment_completed`, and `verification_completed`. Analytics is never transaction truth.

Use Vitest for unit/integration tests and Playwright for end-to-end tests. Critical workflows, especially concurrent reservation collision, must be automated. Demo environments include at least one company, one estate, multiple polygons, and available/reserved/sold plots.

## Delivery Order

1. Foundation: monorepo, pnpm/Turborepo, Next.js, Hono, Workers/Wrangler, PostgreSQL/PostGIS, Drizzle, Clerk, env configuration, design system.
2. Domain: users, companies, staff, estates, plots, geometry, statuses, reservations, payments, verification, audit.
3. GIS: Mapbox, boundaries, polygons, spatial queries/validation, editing, viewport loading, status visualization.
4. Public experience: discovery, estate pages, map, plots, search/filtering, responsive UX, SEO.
5. Authentication and application-user/role handling.
6. Reservations: locking, references, expiry, transitions, collision tests.
7. Paystack: initiation, webhooks, verification, records, proof uploads.
8. Company portal, then admin portal.
9. Hardening: security, performance, accessibility, E2E, monitoring, SEO, assets, database optimization, production deployment.

## Out of Scope for V1

Government registry integrations, Lands Commission/TDC integrations, digital conveyancing, mortgages, escrow, commission engines, native mobile apps, AI valuation/fraud detection, enterprise infrastructure, H3 without measured need, and unnecessary microservices.

## Acceptance Standard

A feature is complete only when it works correctly, handles errors, is secure, responsive, accessible, performant, tested in proportion to risk, consistent with the design system, and does not compromise existing functionality. Build as though real people will trust AsaseLink with significant money and important land decisions.

**One-sentence definition:** AsaseLink is a fast, secure, map-driven digital land marketplace that connects buyers with verified land companies and lets users discover, understand, reserve, pay for, and track land through one trustworthy platform.
