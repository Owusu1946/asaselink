# AsaseLink Product Surface and Screen Inventory

**Status:** Planning source of truth  
**Parent document:** `docs/ASASELINK_VISION.md`  
**Purpose:** Define every planned page, screen, major workflow state, dashboard, and supporting surface before implementation.

If this inventory conflicts with the AsaseLink vision, the vision wins. Routes are proposed and may be refined during implementation, but the underlying user journeys and responsibilities should remain intact.

## 1. Product shells

AsaseLink has four primary interface shells. They should share design tokens and primitives without being forced into the same layout.

### 1.1 Public discovery shell

For unauthenticated buyers and search-engine traffic.

- Floating pill navigation on marketing and discovery pages.
- Search and map controls appear only where useful.
- No account is required for browsing.
- The map is a primary product surface, not decorative media.
- Public estate and company content is crawlable and shareable.

### 1.2 Buyer account shell

For authenticated buyers managing reservations and transactions.

- Simple account navigation focused on progress and next actions.
- Mobile-friendly before dashboard density.
- Reservation status and payment state are always explicit.
- No generic analytics dashboard or unnecessary charts.

### 1.3 Company workspace shell

For verified company owners and staff.

- Operational navigation for estates, plots, reservations, payments, staff, and audit history.
- Navigation and actions adapt to server-authorized permissions.
- Desktop layouts may be denser, but remain fully usable on smaller screens.
- Map editing is treated as a dedicated work surface.

### 1.4 AsaseLink admin shell

For internal platform operators.

- Clear separation from company tools.
- Optimized for review, verification, risk, conflicts, and auditability.
- Critical and destructive actions require confirmation and a reason where appropriate.

## 2. Priority labels

- **Core V1:** Required for the first complete marketplace transaction.
- **Supporting V1:** Required for a credible, operable production release.
- **Later:** Designed for, but not required before the core product works.

## 3. Public and buyer-discovery pages

### P01 — Landing page

- **Route:** `/`
- **Priority:** Core V1
- **Audience:** Everyone
- **Purpose:** Explain AsaseLink immediately and lead buyers into estate discovery.
- **Primary content:** Pill navigation, map-led hero, search/discovery entry point, featured estates, how the process works, verified-company trust explanation, company CTA, footer.
- **Primary actions:** Explore estates, search by location, open a featured estate, list an estate.
- **Important states:** Default, signed-in buyer, signed-in company user.

### P02 — Explore estates

- **Route:** `/explore`
- **Priority:** Core V1
- **Audience:** Public buyers
- **Purpose:** Search, filter, compare, and spatially discover estates.
- **Primary content:** Search input, relevant filters, estate results, synchronized map, result count, sort control.
- **Primary actions:** Search location, change viewport, filter by price/status/location, open estate, clear filters.
- **Important states:** Initial discovery, results, no results, map loading, list loading, recoverable error, selected estate preview.
- **Performance note:** Return only data relevant to the viewport and current filters.

### P03 — Estate public page

- **Route:** `/estates/[estateSlug]`
- **Priority:** Core V1
- **Audience:** Public buyers
- **Purpose:** Help a buyer understand an estate, its company, location, inventory, pricing, and plot layout.
- **Primary content:** Estate identity, verified company, location, gallery, description, starting price, key facts, estate boundary, interactive plot map, availability summary, contact/help information.
- **Primary actions:** Explore plots, select a plot, share estate, view company, begin reservation.
- **Important states:** Available inventory, no available plots, unpublished/removed estate, map unavailable with accessible plot-list alternative.

### P04 — Plot detail

- **Route:** `/estates/[estateSlug]/plots/[plotSlug]`
- **Priority:** Core V1
- **Audience:** Public buyers
- **Purpose:** Provide a stable, shareable view of a selected plot.
- **Primary content:** Plot number, status, area, price, estate, company, map geometry, relevant metadata, reservation conditions.
- **Primary actions:** Reserve plot, return to estate, share plot, contact company.
- **Important states:** Available, reserved, sold, temporarily unavailable, availability changed while viewing.

### P05 — Company public profile

- **Route:** `/companies/[companySlug]`
- **Priority:** Supporting V1
- **Audience:** Public buyers
- **Purpose:** Establish seller identity and trust.
- **Primary content:** Company description, logo, verification status, contact details, active estates, relevant policies.
- **Primary actions:** View estate, contact company, report a concern.
- **Important states:** Verified, verification pending where publicly appropriate, suspended/unavailable.

### P06 — How AsaseLink works

- **Route:** `/how-it-works`
- **Priority:** Supporting V1
- **Audience:** Buyers and first-time visitors
- **Purpose:** Explain discovery, reservation, payment, company verification, and confirmation in plain language.
- **Primary actions:** Explore estates, visit help center.

### P07 — For land companies

- **Route:** `/for-companies`
- **Priority:** Supporting V1
- **Audience:** Prospective land-selling companies
- **Purpose:** Explain company verification, inventory management, maps, reservations, and staff operations.
- **Primary actions:** Apply as a company, sign in.

### P08 — Search results share view

- **Route:** `/explore` with URL query state
- **Priority:** Core V1
- **Audience:** Public buyers
- **Purpose:** Preserve a searched location, filters, map bounds, and selected estate in a shareable URL.
- **Note:** This is a state of Explore, not a separate page implementation.

## 4. Authentication screens

Authentication uses Clerk for identity. AsaseLink still owns the surrounding product context, user record, roles, permissions, and post-authentication routing.

### A01 — Sign in

- **Route:** `/sign-in`
- **Priority:** Core V1
- **Audience:** Buyers, company staff, administrators
- **Methods:** Google as primary; Facebook, Apple, email, and phone/OTP as configured.
- **Important states:** Default, provider loading, email/phone entry, OTP verification, recoverable provider error, account restricted.

### A02 — Create account

- **Route:** `/sign-up`
- **Priority:** Core V1
- **Audience:** New users
- **Purpose:** Create an authentication identity with minimal friction.
- **Important states:** Provider selection, verification, profile completion, terms acceptance, duplicate identity resolution.

### A03 — Authentication callback

- **Route:** `/sso-callback` or Clerk-required callback
- **Priority:** Core V1
- **Audience:** Users returning from an identity provider
- **Purpose:** Complete authentication and return the user to their intended action.
- **Note:** Functional transition screen; keep it visually quiet and fast.

### A04 — Complete buyer profile

- **Route:** `/onboarding/profile`
- **Priority:** Core V1
- **Audience:** Newly authenticated buyers missing required application data
- **Purpose:** Collect only information required for reservation and communication.
- **Important states:** Initial completion, phone verification, validation error, saved.

### A05 — Access denied

- **Route:** `/unauthorized`
- **Priority:** Supporting V1
- **Audience:** Authenticated users without permission
- **Purpose:** Explain that access is restricted and provide a safe route back.

## 5. Reservation and payment journey

These are buyer-facing transactional screens. The server and database control all status transitions.

### R01 — Reservation review

- **Route:** `/reserve/[plotId]`
- **Priority:** Core V1
- **Audience:** Buyer selecting an available plot
- **Purpose:** Confirm the exact estate, plot, area, price, reservation terms, and expiry rules before creating a reservation.
- **Primary actions:** Confirm reservation, sign in if necessary, return to plot.
- **Important states:** Available, authentication required, availability rechecking, no longer available, validation error.

### R02 — Reservation success

- **Route:** `/reservations/[reference]/created`
- **Priority:** Core V1
- **Audience:** Buyer who won the atomic reservation attempt
- **Purpose:** Confirm the reservation reference, expiry time, amount due, and next action.
- **Primary actions:** Continue to payment, view reservation.

### R03 — Reservation collision/unavailable

- **Route:** Same reservation flow state
- **Priority:** Core V1
- **Audience:** Buyer whose chosen plot became unavailable
- **Purpose:** Clearly explain that the plot was reserved first by another transaction.
- **Primary actions:** Return to estate map, view similar available plots.
- **Note:** This is a result state, not a standalone route unless implementation requires it.

### R04 — Payment checkout

- **Route:** `/reservations/[reference]/payment`
- **Priority:** Core V1
- **Audience:** Reservation holder
- **Purpose:** Show amount, reference, supported method, and launch trusted Paystack payment.
- **Primary actions:** Pay securely, return to reservation.
- **Important states:** Ready, provider initializing, redirected/popup active, failed initialization, reservation expired.

### R05 — Payment return and verification

- **Route:** `/payments/return`
- **Priority:** Core V1
- **Audience:** Buyer returning from Paystack
- **Purpose:** Explain that server-side verification is occurring; never declare success from frontend return parameters alone.
- **Important states:** Verifying, verified, pending provider confirmation, failed, reference not found.

### R06 — Manual payment proof upload

- **Route:** `/reservations/[reference]/payment-proof`
- **Priority:** Later unless manual proof is required for launch
- **Audience:** Reservation holder
- **Purpose:** Upload a private, validated proof document for an approved manual-payment workflow.
- **Important states:** Upload, progress, file rejected, submitted, under review, replacement requested.

### R07 — Reservation transaction detail

- **Route:** `/account/reservations/[reference]`
- **Priority:** Core V1
- **Audience:** Reservation owner
- **Purpose:** Act as the canonical buyer view of the entire transaction.
- **Primary content:** Estate and plot, reservation reference, expiry, status timeline, payment status, verification status, next action, documents, company information.
- **Important states:** Active/payment pending, payment verifying, payment confirmed, company review, confirmed, sold, expired, cancelled, disputed.

## 6. Buyer account

### B01 — Buyer account overview

- **Route:** `/account`
- **Priority:** Core V1
- **Audience:** Authenticated buyers
- **Purpose:** Show active transactions and the next action requiring attention.
- **Primary content:** Active reservation, recent activity, saved estates if enabled, concise status summaries.

### B02 — My reservations

- **Route:** `/account/reservations`
- **Priority:** Core V1
- **Audience:** Authenticated buyers
- **Purpose:** List and filter the buyer's reservations.
- **Important states:** Active, completed, expired/cancelled, no reservations, loading, error.

### B03 — Buyer payments

- **Route:** `/account/payments`
- **Priority:** Supporting V1
- **Audience:** Authenticated buyers
- **Purpose:** Provide a transaction record without duplicating the reservation detail.
- **Primary actions:** Open related reservation, view receipt where available.

### B04 — Buyer documents

- **Route:** `/account/documents`
- **Priority:** Supporting V1
- **Audience:** Authenticated buyers
- **Purpose:** Securely access documents associated with reservations and confirmations.
- **Important states:** Available, processing, access expired, no documents.

### B05 — Saved estates and plots

- **Route:** `/account/saved`
- **Priority:** Later
- **Audience:** Authenticated buyers
- **Purpose:** Return to shortlisted estates and plots.

### B06 — Notifications

- **Route:** `/account/notifications`
- **Priority:** Supporting V1
- **Audience:** Authenticated buyers
- **Purpose:** Show meaningful reservation, payment, verification, and document updates.
- **Important states:** Unread/read, empty, delivery preference link.

### B07 — Profile and settings

- **Route:** `/account/settings`
- **Priority:** Supporting V1
- **Audience:** Authenticated buyers
- **Sections:** Profile, phone, authentication methods managed through Clerk, notification preferences, privacy/account controls.

## 7. Company application and onboarding

### C01 — Company application start

- **Route:** `/company/apply`
- **Priority:** Core V1
- **Audience:** Prospective company owner
- **Purpose:** Explain requirements and begin a controlled company application.

### C02 — Company details

- **Route:** `/company/apply/details`
- **Priority:** Core V1
- **Purpose:** Capture legal/business name, description, contact information, and responsible person.

### C03 — Company verification documents

- **Route:** `/company/apply/documents`
- **Priority:** Core V1
- **Purpose:** Securely collect required verification documents and metadata.
- **Important states:** Uploading, rejected type/size, uploaded, replacement requested.

### C04 — Application review

- **Route:** `/company/apply/review`
- **Priority:** Core V1
- **Purpose:** Review submitted information, confirm declarations, and submit.

### C05 — Application status

- **Route:** `/company/application`
- **Priority:** Core V1
- **Purpose:** Show submitted, under review, approved, changes requested, rejected, or suspended status with clear next steps.

### C06 — First workspace setup

- **Route:** `/company/setup`
- **Priority:** Supporting V1
- **Audience:** Newly approved company owner
- **Purpose:** Complete public profile and guide the owner toward creating the first estate.

## 8. Company workspace

Routes below use `/company/[companyId]` to make organization scope explicit. A future organization switcher may preserve the same structure.

### D01 — Company overview

- **Route:** `/company/[companyId]/overview`
- **Priority:** Core V1
- **Audience:** Authorized company staff
- **Purpose:** Operational summary of estates, plot availability, active reservations, and actions needing attention.
- **Primary content:** Estate count, available/reserved/sold counts, active reservations, pending verification, recent activity.
- **Important states:** Role-filtered view, new company empty state, data error.

### D02 — Estates list

- **Route:** `/company/[companyId]/estates`
- **Priority:** Core V1
- **Purpose:** Find, filter, create, and manage company estates.
- **Views:** Table/list first; compact map view where it provides real value.

### D03 — Create estate

- **Route:** `/company/[companyId]/estates/new`
- **Priority:** Core V1
- **Purpose:** Create estate identity and metadata before boundary definition.
- **Sections:** Basic information, location, pricing summary, description, visibility.

### D04 — Estate overview

- **Route:** `/company/[companyId]/estates/[estateId]`
- **Priority:** Core V1
- **Purpose:** Canonical operational view of one estate.
- **Primary content:** Publication status, boundary status, inventory totals, map, recent reservations, validation issues, quick actions.

### D05 — Edit estate information

- **Route:** `/company/[companyId]/estates/[estateId]/edit`
- **Priority:** Core V1
- **Purpose:** Edit non-geographic estate metadata with audit coverage for important changes.

### D06 — Estate media

- **Route:** `/company/[companyId]/estates/[estateId]/media`
- **Priority:** Supporting V1
- **Purpose:** Upload, order, caption, and remove estate imagery stored in R2.

### D07 — Estate boundary editor

- **Route:** `/company/[companyId]/estates/[estateId]/boundary`
- **Priority:** Core V1
- **Purpose:** Draw or edit Polygon/MultiPolygon geometry and submit it for authoritative server validation.
- **Primary content:** Large map canvas, draw/edit controls, geometry summary, validation results, version note/reason.
- **Important states:** No boundary, editing, unsaved changes, validating, invalid geometry, restricted-area conflict, saved, permission denied.

### D08 — Boundary history

- **Route:** `/company/[companyId]/estates/[estateId]/boundary/history`
- **Priority:** Supporting V1
- **Purpose:** Compare geometry versions and see actor, timestamp, reason, and approval state.

### D09 — Estate plots list

- **Route:** `/company/[companyId]/estates/[estateId]/plots`
- **Priority:** Core V1
- **Purpose:** View and manage plots using list/table and map modes.
- **Filters:** Status, price, area, validation state, search by plot number.

### D10 — Create plot

- **Route:** `/company/[companyId]/estates/[estateId]/plots/new`
- **Priority:** Core V1
- **Purpose:** Define plot identifier, geometry, price, area metadata, and other permitted fields.
- **Important states:** Drawing, server validation, overlap detected, outside-estate error, restricted-area intersection, saved.

### D11 — Plot operational detail

- **Route:** `/company/[companyId]/estates/[estateId]/plots/[plotId]`
- **Priority:** Core V1
- **Purpose:** Canonical company view of one plot, its geometry, controlled status, reservations, and history.

### D12 — Edit plot

- **Route:** `/company/[companyId]/estates/[estateId]/plots/[plotId]/edit`
- **Priority:** Core V1
- **Purpose:** Update permitted metadata and geometry while preserving history and preventing unsafe status manipulation.

### D13 — Plot geometry history

- **Route:** `/company/[companyId]/estates/[estateId]/plots/[plotId]/history`
- **Priority:** Supporting V1
- **Purpose:** Review previous geometry and important field/status transitions.

### D14 — Restricted areas

- **Route:** `/company/[companyId]/estates/[estateId]/restricted-areas`
- **Priority:** Supporting V1
- **Purpose:** Manage roads, water bodies, utility corridors, reserved land, and other non-sellable geometry.

### D15 — Company reservations

- **Route:** `/company/[companyId]/reservations`
- **Priority:** Core V1
- **Purpose:** Filter and process reservations across the company's estates.
- **Filters:** Status, estate, payment state, verification state, assigned staff, date.

### D16 — Company reservation detail

- **Route:** `/company/[companyId]/reservations/[reference]`
- **Priority:** Core V1
- **Purpose:** Review buyer, plot, timeline, payment record, documents, notes, and permitted transitions.
- **Primary actions:** Verify permitted information, request information, confirm according to business rules, escalate dispute.
- **Important states:** Payment pending, payment verified, under review, confirmed, expired, cancelled, disputed.

### D17 — Company payments

- **Route:** `/company/[companyId]/payments`
- **Priority:** Supporting V1
- **Audience:** Authorized finance roles
- **Purpose:** Review payment records without exposing them to unauthorized staff.

### D18 — Company payment detail

- **Route:** `/company/[companyId]/payments/[paymentId]`
- **Priority:** Supporting V1
- **Purpose:** View provider reference, amount, timestamps, verification result, reservation relationship, and payment proof where applicable.

### D19 — Staff management

- **Route:** `/company/[companyId]/staff`
- **Priority:** Core V1
- **Purpose:** List members, invite staff, and review roles and account state.

### D20 — Invite staff

- **Route:** `/company/[companyId]/staff/invite`
- **Priority:** Core V1
- **Purpose:** Invite a person with an explicit role and scoped permissions.

### D21 — Staff member detail

- **Route:** `/company/[companyId]/staff/[memberId]`
- **Priority:** Core V1
- **Purpose:** Review membership, role, permissions, activity, and remove/suspend access where authorized.

### D22 — Company audit history

- **Route:** `/company/[companyId]/audit`
- **Priority:** Supporting V1
- **Purpose:** Search structured audit events the current role is allowed to see.

### D23 — Company settings

- **Route:** `/company/[companyId]/settings`
- **Priority:** Supporting V1
- **Sections:** Public profile, contact information, branding, reservation configuration, notification preferences, organization controls.
- **Security note:** Ownership and critical financial configuration require elevated authorization and audit records.

## 9. AsaseLink administration

### M01 — Admin overview

- **Route:** `/admin`
- **Priority:** Core V1
- **Audience:** AsaseLink administrators
- **Purpose:** Show verification queues, transaction issues, geometry conflicts, and recent critical activity.

### M02 — Companies

- **Route:** `/admin/companies`
- **Priority:** Core V1
- **Purpose:** Search and filter all companies by verification and account state.

### M03 — Company review

- **Route:** `/admin/companies/[companyId]`
- **Priority:** Core V1
- **Purpose:** Review company profile, submitted documents, estates, staff summary, audit history, and risk indicators.
- **Primary actions:** Approve, request changes, reject, suspend, restore where authorized.
- **Safety:** Critical decisions require confirmation, a reason, and an audit event.

### M04 — Company verification queue

- **Route:** `/admin/company-verifications`
- **Priority:** Core V1
- **Purpose:** Process pending applications and requested changes efficiently.

### M05 — Estates oversight

- **Route:** `/admin/estates`
- **Priority:** Core V1
- **Purpose:** Search estates, inspect publication state, and identify geographic or policy problems.

### M06 — Estate admin detail

- **Route:** `/admin/estates/[estateId]`
- **Priority:** Core V1
- **Purpose:** Inspect estate metadata, boundary, plots, company, validation results, and history.

### M07 — Plot inventory oversight

- **Route:** `/admin/plots`
- **Priority:** Supporting V1
- **Purpose:** Search plots across companies and identify invalid or inconsistent inventory.

### M08 — Plot conflict review

- **Route:** `/admin/plot-conflicts`
- **Priority:** Core V1
- **Purpose:** Review overlaps, plots outside estate boundaries, restricted-area intersections, and invalid geometry.
- **Primary content:** Map comparison, validation evidence, affected records, resolution history.

### M09 — Restricted-area oversight

- **Route:** `/admin/restricted-areas`
- **Priority:** Supporting V1
- **Purpose:** Review platform-level and company-level restricted geometry.

### M10 — Reservations oversight

- **Route:** `/admin/reservations`
- **Priority:** Core V1
- **Purpose:** Search reservations and identify stuck, conflicting, expired, or disputed transactions.

### M11 — Admin reservation detail

- **Route:** `/admin/reservations/[reference]`
- **Priority:** Core V1
- **Purpose:** Inspect the complete reservation timeline and perform explicitly authorized corrective actions.

### M12 — Payments oversight

- **Route:** `/admin/payments`
- **Priority:** Core V1
- **Purpose:** Review provider state, webhook verification, amount mismatches, duplicates, and failed payments.

### M13 — Admin payment detail

- **Route:** `/admin/payments/[paymentId]`
- **Priority:** Core V1
- **Purpose:** Inspect trusted provider data, webhook events, internal state transitions, and the related reservation.

### M14 — Users

- **Route:** `/admin/users`
- **Priority:** Supporting V1
- **Purpose:** Search application users and review account state and relationships.

### M15 — User admin detail

- **Route:** `/admin/users/[userId]`
- **Priority:** Supporting V1
- **Purpose:** Review profile, roles, organization memberships, reservations, and permitted account controls.

### M16 — Disputes

- **Route:** `/admin/disputes`
- **Priority:** Supporting V1
- **Purpose:** Triage and manage disputes with an auditable case trail.

### M17 — Dispute detail

- **Route:** `/admin/disputes/[disputeId]`
- **Priority:** Supporting V1
- **Purpose:** Review participants, evidence, timeline, notes, and resolution.

### M18 — Documents and payment proofs

- **Route:** `/admin/documents`
- **Priority:** Later unless operationally required for launch
- **Purpose:** Locate private uploads, review access and processing state, and investigate unsafe or invalid files.

### M19 — Platform audit log

- **Route:** `/admin/audit`
- **Priority:** Core V1
- **Purpose:** Search structured platform-wide audit events by actor, resource, action, date, and organization.

### M20 — Platform configuration

- **Route:** `/admin/settings`
- **Priority:** Supporting V1
- **Purpose:** Manage controlled business configuration such as reservation expiry rules and platform feature state.
- **Safety:** Configuration changes are validated, permission-gated, and audited.

### M21 — Operational health

- **Route:** `/admin/operations`
- **Priority:** Later
- **Purpose:** Summarize failed background jobs, webhook failures, and integration health without replacing Sentry or infrastructure monitoring.

## 10. Help, trust, and legal pages

### S01 — Help center

- **Route:** `/help`
- **Priority:** Supporting V1
- **Purpose:** Answer common buyer and company questions in plain language.

### S02 — Contact and support

- **Route:** `/contact`
- **Priority:** Supporting V1
- **Purpose:** Route buyer, company, transaction, and safety concerns correctly.

### S03 — Report a concern

- **Route:** `/report`
- **Priority:** Supporting V1
- **Purpose:** Report suspicious companies, estates, plots, or platform activity.

### S04 — Terms of service

- **Route:** `/legal/terms`
- **Priority:** Supporting V1

### S05 — Privacy policy

- **Route:** `/legal/privacy`
- **Priority:** Supporting V1

### S06 — Cookie policy/preferences

- **Route:** `/legal/cookies`
- **Priority:** Supporting V1 as applicable

### S07 — Company terms/policies

- **Route:** `/legal/company-terms`
- **Priority:** Supporting V1

### S08 — Accessibility statement

- **Route:** `/accessibility`
- **Priority:** Supporting V1

## 11. System and resilience screens

### E01 — Not found

- **Route:** Framework `not-found`
- **Priority:** Supporting V1
- **Purpose:** Recover from invalid URLs with useful routes back to exploration.

### E02 — Application error

- **Route:** Framework error boundary
- **Priority:** Core V1
- **Purpose:** Show a human-readable recovery state while technical details go to monitoring.

### E03 — Service unavailable/maintenance

- **Route:** `/maintenance` or edge-generated state
- **Priority:** Supporting V1
- **Purpose:** Explain temporary unavailability without exposing infrastructure details.

### E04 — Offline/connectivity state

- **Route:** In-place application state
- **Priority:** Supporting V1
- **Purpose:** Explain when map or transaction data cannot be refreshed. Never present cached availability as authoritative.

### E05 — Session expired

- **Route:** In-place modal or sign-in redirect with return URL
- **Priority:** Core V1
- **Purpose:** Preserve safe user context and resume the intended action after authentication.

### E06 — Rate-limited request

- **Route:** In-place error state
- **Priority:** Supporting V1
- **Purpose:** Explain when the user should retry without exposing security rules.

## 12. Reusable screen states that are not separate pages

These states must be designed and implemented consistently rather than becoming ad hoc screens:

- Loading skeletons for estate lists, plot details, dashboards, and tables.
- Map loading and map-provider failure with a usable list alternative.
- Empty states with one relevant next action.
- No search results with filter recovery.
- Permission-restricted actions and read-only views.
- Confirmation dialogs for critical transitions.
- Unsaved geometry-change warning.
- File upload progress, rejection, retry, and success.
- Webhook/payment verification pending.
- Reservation expiry countdown and expired transition.
- Availability changed during interaction.
- Toasts or inline confirmations for non-critical actions.
- Structured validation summaries linked to affected form fields or geometry.
- Status timelines for reservation, payment, and verification.
- Audit-event detail drawer/dialog.
- Destructive-action confirmation requiring a reason where appropriate.

## 13. Navigation model

### Public navigation

- Explore
- How it works
- For companies
- Sign in/account
- Primary action: Explore estates

### Buyer account navigation

- Overview
- Reservations
- Payments
- Documents
- Notifications
- Settings

### Company workspace navigation

- Overview
- Estates
- Reservations
- Payments, when permitted
- Staff, when permitted
- Audit
- Settings

### Admin navigation

- Overview
- Companies
- Estates and plot conflicts
- Reservations
- Payments
- Users
- Disputes
- Audit
- Settings

## 14. Core V1 release path

The smallest complete product path should work end to end before optional screens expand:

1. Landing page.
2. Explore estates.
3. Estate public page and plot selection.
4. Plot detail.
5. Sign in/sign up and minimal profile completion.
6. Reservation review and atomic reservation result.
7. Payment checkout and trusted server verification.
8. Buyer reservation detail and status tracking.
9. Company application and admin verification.
10. Company estate, boundary, plot, reservation, payment, and staff operations.
11. Admin company, GIS conflict, reservation, payment, and audit oversight.
12. Required error, permission, loading, empty, legal, and support states.

## 15. Screen-count discipline

This inventory is intentionally comprehensive, but it does not require every state to become a route. During implementation:

- Prefer one canonical detail page with state-aware sections over several near-duplicate pages.
- Use dialogs, drawers, and inline states for short contextual tasks.
- Give important, shareable, recoverable, or multi-step tasks their own route.
- Preserve filter and map state in URLs when it helps navigation and sharing.
- Do not create dashboards that merely repeat counts without enabling a decision or action.
- Do not expose internal technical concepts such as PostGIS, queues, webhooks, or provider payloads to ordinary users.
- Keep authorization on the server regardless of what navigation is visible.

