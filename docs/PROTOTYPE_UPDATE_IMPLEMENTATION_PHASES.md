# AsaseLink Prototype Update Implementation Phases

This roadmap converts the 18 September 2026 prototype update request into independently testable delivery phases. Each phase must be implemented across the database, API, background jobs, frontend, permissions, audit trail, and deployment configuration before it is considered complete.

## Delivery rules for every phase

Every phase must:

1. Preserve existing company onboarding, estate mapping, reservations, payments, payouts, alerts, and buyer-account flows.
2. Use additive database migrations and explicit backfills. Existing production records must remain readable and valid.
3. Enforce authorization and company isolation in the API, not only in the UI.
4. Make state transitions transactional, concurrency-safe, idempotent, and auditable.
5. Update every affected caller when an API contract or status changes. Temporary compatibility mapping must be retained until all callers are migrated.
6. Invalidate or refresh affected server and client data after mutations so counts, dashboards, maps, and statuses do not become stale.
7. Include responsive loading, empty, error, success, disabled, and retry states.
8. Add automated tests for domain rules and the critical browser journey introduced by the phase.
9. Pass API tests, type checks, production builds, migration checks, and focused runtime verification before commit or deployment.
10. Deploy in dependency order: database migration, API, jobs worker when changed, then frontend. Run post-deployment smoke tests.

Do not remove the current working flow until its replacement is implemented, migrated, tested, and used by every consumer.

---

## Phase 1 - Indicative Land Viability Screening

### Outcome

A user can search for a location, enter coordinates, or select/draw an area on the map and receive an indicative Land Viability Report with a mapped result of `CLEAR`, `CAUTION`, or `POTENTIAL_RESTRICTION`.

### Database and datasets

- Add a general-purpose geographic screening-layer model independent of estates.
- Store layer type, source, source date/version, confidence/coverage notes, geometry, and active status.
- Support Ramsar/wetland, water body/waterway, protected/reserved area, flood risk, planning/environmental restriction, and other concern types.
- Add spatial indexes and safe query limits.
- Add a viability-check record containing the submitted geometry/point, result, checked layers, intersections, dataset limitations, requester, and timestamp.
- Seed meaningful prototype data for at least Clear, Caution, and Potential Restriction demonstrations.

### API and GIS rules

- Accept a validated point or polygon in EPSG:4326.
- Search locations and accept manually entered latitude/longitude.
- Intersect the selected area against enabled screening layers in PostGIS.
- Return every checked layer, intersecting features, source metadata, coverage gaps, outcome, and recommended follow-up.
- Use `CAUTION` when required coverage is missing or inconclusive.
- Never describe the result as title, boundary, legal, survey, Lands Commission, EPA, or planning approval.
- Apply authentication/rate limits where appropriate and cap geometry size and query extent.

### Frontend

- Add an accessible viability-check entry point from land discovery and estate/plot consideration.
- Provide location search, coordinate entry, map click, and area drawing.
- Show the submitted area and intersecting layers on Mapbox.
- Present Clear, Caution, and Potential Restriction with non-color indicators and plain-language explanations.
- Display dataset sources, coverage limitations, timestamp, recommended next action, and the required official-verification disclaimer.
- Make the full flow mobile responsive.

### Company-declared site concerns

- Let authorized company users mark known wetland, waterway, flood-risk, protected/reserved, utility, and other concern areas while mapping an estate.
- Require a label, concern type, source/provenance note, and acknowledgement that company-declared areas are not official government determinations.
- Keep these concern polygons inside their estate boundary, version geometry changes, record the actor and reason, and expose them to plot-containment/restriction validation.
- Show company-declared concerns in the estate workspace and viability report with a visibly different provenance label from official or prototype datasets.
- Allow authorized users to remove an incorrect declaration without deleting its audit history.

### Tests and definition of done

- Unit tests cover result aggregation and missing-data caution logic.
- PostGIS integration tests cover no intersection, single intersection, multiple intersections, invalid geometry, and oversized queries.
- Browser test covers location selection through rendered report.
- Company workflow test covers declaring and removing an estate concern, permission enforcement, containment validation, and its appearance in viability screening.
- All three result categories can be demonstrated with seeded data.
- The report never claims official verification.

---

## Phase 2 - Separate Checkout Locks and Paid One-Week Holds

### Outcome

Temporary checkout locks and intentional paid holds become separate workflows with different statuses, durations, money rules, and expiry behaviour.

### Database and configuration

- Introduce explicit reservation type: `CHECKOUT_LOCK` and `PAID_HOLD`.
- Replace ambiguous reservation states with a documented transition model covering Available, Temporarily Locked, Hold Payment Pending, Held, Purchase in Progress, Sold, Expired, Released, and Cancelled.
- Add configurable checkout-lock duration, hold duration, hold fee, refund percentage/administrative deduction, and applicable terms.
- Snapshot all commercial settings on each hold so later configuration changes do not rewrite existing agreements.
- Record hold start, payment deadline, activation time, expiry, amount, refundable amount, deduction, release time, and reason.
- Backfill existing 30-minute reservations as `CHECKOUT_LOCK` without changing their current outcomes.

### Concurrency and expiry

- Acquire the checkout lock transactionally when checkout begins.
- Preserve one-live-claim-per-plot database protection.
- Prevent a second buyer from locking, holding, or purchasing the same plot.
- Convert a successfully paid hold-payment reservation into `HELD` for the configured duration.
- Expire abandoned checkout locks and release the plot automatically.
- Expire holds according to their snapshotted terms and create refund work when applicable.
- Make scheduled processing idempotent and safe when multiple job executions overlap.
- Record audit and outbox events for every transition.

### Frontend

- Present two distinct actions: short checkout and paid one-week hold.
- Explain duration, fee, credit policy, refund policy, deduction, expiry, and consequences before confirmation.
- Show live expiry information without using the browser clock as the authority.
- Update buyer, company, and admin reservation screens for both mechanisms.
- Update sidebar counts and plot availability immediately after transitions.

### Tests and definition of done

- Concurrency test proves two buyers cannot hold or purchase the same plot.
- Expiry tests use controlled time and cover checkout abandonment, unpaid hold, active hold, and already processed expiry.
- Backfilled reservations retain correct buyer, plot, price, and expiry.
- Buyer can create a paid hold using the existing mock payment rail, and the plot remains held for the configured period after approval.
- Company and admin timelines explain every transition.

---

## Phase 3 - Purchase Accounts, Credits, Instalments, Balances, and Refunds

### Outcome

A confirmed hold can become a purchase, the hold amount is credited, multiple payments can be recorded, outstanding balance is authoritative, and the plot becomes Sold only after the required total is confirmed.

### Database and accounting model

- Add a purchase account linking buyer, company, estate, plot, reservation/hold, price snapshot, currency, status, and agreed due date.
- Add immutable purchase-ledger entries for hold credit, deposit, instalment, final payment, refund, adjustment, and reversal.
- Allow multiple payments per purchase while preserving idempotency by provider/reference.
- Calculate totals from confirmed ledger entries: plot price, hold paid, credit applied, total paid, refunded, and outstanding balance.
- Add purchase statuses including `HOLD_ACTIVE`, `PURCHASE_IN_PROGRESS`, `PAID`, `COMPLETED`, `CANCELLED`, and `REFUND_PENDING` as appropriate.
- Do not use floating-point arithmetic for money.

### API and transaction rules

- Start a purchase from an active paid hold or an eligible checkout.
- Apply the hold credit exactly once.
- Accept deposit, instalment, balance, and final payment purposes.
- Prevent confirmed payments from exceeding the outstanding balance unless an explicit reviewed adjustment exists.
- Sell the plot only when the authoritative outstanding balance reaches zero and final completion succeeds.
- Implement refund calculation, review, ledger posting, payment status change, and plot/reservation consequences.
- Preserve actor, date, reference, reason, and before/after status for every action.

### Frontend

- Add a buyer transaction detail page showing plot price, hold paid, credit applied, payment history, total paid, refunds, outstanding balance, next due date, and current status.
- Add payment-stage selection and show the maximum payable amount.
- Add company purchase/receivable visibility without exposing another company’s data.
- Add admin adjustment and refund investigation with mandatory reasons.
- Make transaction tables and actions mobile responsive.

### Tests and definition of done

- Tests cover hold credit once, partial payment, multiple instalments, final payment, duplicate reference, overpayment rejection, refund, reversal, and concurrent final payments.
- A buyer can pay a hold, return later, apply the credit, make at least one further payment, view the correct balance, and complete the purchase.
- A plot cannot become Sold before the balance is zero.
- Company balances and payout eligibility reflect confirmed net funds and reversals correctly.

---

## Phase 4 - Bank Transfer Proof and Verification Operations

### Outcome

Bank transfer becomes a first-class payment method with purpose selection, recipient account details, proof upload, structured verification, rejection, and investigation.

### Database and storage

- Add versioned platform/company bank-account details with activation and access controls.
- Add payment purpose, transfer date, sender/account details where appropriate, buyer reference, proof-object metadata, MIME type, size, checksum, and upload timestamp.
- Store payment proof privately in the existing R2 document system.
- Use signed or authenticated access; never expose raw private object URLs.

### API and authorization

- Return the correct active bank account for the payment’s company/platform settlement model.
- Validate proof type, size, ownership, and reservation/purchase relationship.
- Separate statuses for Pending, Submitted, Under Verification, Confirmed, Rejected, Failed, Refunded, and Cancelled, with compatibility mapping for existing records.
- Make submission and review idempotent.
- Permit only explicitly authorized platform or company finance reviewers.
- Require a review note and record the responsible user, date, reference, proof, and status transition.
- Ensure rejection does not incorrectly destroy an otherwise valid paid hold or purchase account.

### Frontend

- Make bank transfer the primary/default payment choice.
- Show bank name, account name, account number, branch/instructions, amount, and payment purpose.
- Collect transfer reference and relevant transaction details.
- Add proof upload with progress, validation, replacement before submission, and secure preview/download.
- Show Submitted and Under Verification distinctly.
- Extend company/admin queues with proof preview, investigation timeline, approve, reject, refund, and retry-safe actions.

### Tests and definition of done

- Tests cover unsupported files, oversized files, unauthorized access, duplicate submission, approval, rejection, and inaccessible private objects.
- Buyer can submit a mock bank transfer and proof.
- An authorized reviewer can securely inspect and decide it.
- Approval updates the appropriate hold/purchase balance rather than always selling the plot.
- Rejection and refund maintain correct reservation, purchase, ledger, and plot states.

---

## Phase 5 - Trust Language, Navigation, Onboarding, Demo Data, and Final Acceptance

### Outcome

The prototype uses legally careful language, has no dead or misleading controls, contains deterministic demonstration data, and can complete the requested scenario without manual database repair.

### Trust and verification language

- Audit all uses of verified, surveyed, approved, compliant, certified, titled, and registered.
- Label information as company supplied, licensed-surveyor supplied, AsaseLink platform reviewed, AsaseLink geographic screening, or officially verified as applicable.
- Remove claims such as “Ghana Land Registry Compliant” unless independently substantiated and approved for use.
- Show the geographic-screening disclaimer wherever a viability result influences a decision.

### Navigation and onboarding

- Inventory every visible button, link, card, menu item, and call to action.
- Connect destination-specific footer links to real pages or applied filters instead of a generic anchor.
- Verify desktop and mobile navigation, estate cards, View Layout, How It Works, authentication, company application, dashboards, reservations, payments, refunds, and administration.
- Clearly disable and label any intentionally unavailable prototype action.
- Regression-test buyer and company sign-up, sign-in, application resume, approval, workspace selection, and redirect behaviour.

### Demonstration fixtures

- Add an idempotent non-production demo-data command.
- Create one demonstration company with Estate A and Estate B.
- Add valid estate boundaries, multiple plots, and viability layers.
- Include data for available, checkout-locked, held, purchase-in-progress, sold, expired, rejected-payment, and refund examples.
- Create documented demo actors/roles without committing credentials or secrets.

### Final automated journey

The final browser suite must demonstrate:

1. Company onboarding and approval.
2. Estate A and Estate B creation and switching.
3. Estate and plot mapping.
4. Buyer discovery and plot selection.
5. Land viability screening and mapped report.
6. Temporary checkout lock.
7. Configurable paid one-week hold.
8. Bank-transfer details and proof submission.
9. Authorized verification.
10. Confirmed hold and correct plot status.
11. Purchase started within the hold period.
12. Hold credit plus subsequent payment.
13. Final verification, zero balance, and Sold status.

### Definition of done

- No dead controls in the audited inventory.
- No unsupported verification claims remain.
- Seed command can be run repeatedly without duplicating records.
- Full journey passes on desktop and mobile viewports.
- Production-like Cloudflare builds pass within platform limits.
- Database, API, jobs worker, and frontend deployments pass smoke tests.
- Rollback notes and required environment variables are documented.

---

## Phase dependency order

Implement in this order:

1. Phase 1 - Viability screening
2. Phase 2 - Checkout locks and paid holds
3. Phase 3 - Purchase accounting, instalments, balances, and refunds
4. Phase 4 - Bank-transfer proof and verification
5. Phase 5 - Trust, navigation, onboarding, demo data, and final acceptance

Phase 1 is independent. Phases 2-4 must remain in sequence because purchase accounting depends on the hold model, and bank verification must update the new purchase ledger rather than the legacy one-payment-to-Sold flow. Phase 5 validates the combined system.

## Invocation format

Use one of these requests to begin work:

- `Implement Phase 1 end to end.`
- `Implement Phase 2 end to end.`
- `Implement Phase 3 end to end.`
- `Implement Phase 4 end to end.`
- `Implement Phase 5 end to end.`

When a phase is requested, its database, API, jobs, UI, tests, documentation, migration, and regression work are all in scope. Later phases are not silently pulled forward unless required to keep the current production flow compatible.
