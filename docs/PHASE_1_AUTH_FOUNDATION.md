# Phase 1 — Authentication, Onboarding, and Dashboard Routing

**Status:** Approved implementation direction  
**Depends on:** `docs/ASASELINK_VISION.md`, `docs/DESIGN_SYSTEM.md`, `docs/SCREEN_INVENTORY.md`

Phase 1 establishes identity, application users, onboarding, organization access, verification, and deterministic routing into every dashboard shell. It does not build estate maps, reservations, or payments yet.

## 1. Phase outcome

At the end of Phase 1:

- a visitor can reach authentication from the temporary landing page;
- a new buyer can authenticate and complete a minimal profile;
- a prospective company owner can authenticate and submit a company application;
- invited company staff can accept an invitation and enter the correct company workspace;
- an administrator can review a company application and approve, request changes, or reject it;
- returning users land in the correct buyer, company, or admin dashboard;
- users with more than one valid workspace can switch safely;
- loading, error, verification, session, and access-denied states are complete;
- authorization is enforced server-side and never inferred from visible navigation.

## 2. Temporary landing page

The Phase 1 landing page is intentionally plain. It proves routing without prematurely building the final marketing site.

It contains:

- AsaseLink wordmark;
- one sentence explaining the product;
- `Continue as a buyer`;
- `List your estate`;
- `Sign in` for returning users;
- optional theme control.

`Continue as a buyer` establishes buyer intent. `List your estate` establishes company-application intent. Neither button grants a role.

## 3. Identity and authorization model

Clerk answers: **Who authenticated?**

AsaseLink answers:

- Does an application user exist?
- Is the account active?
- Which buyer profile, company memberships, and admin grants exist?
- What onboarding or verification remains?
- Which resources may this person access?
- Where should the person go next?

Roles are not one exclusive dropdown. One person may be a buyer and also belong to one or more companies.

- `BUYER` is the ordinary consumer context.
- Company access comes from an approved ownership relationship or staff invitation.
- Admin access is assigned internally and is never selectable during sign-up.
- Frontend checks improve presentation only; every protected server operation rechecks authorization.

## 4. Post-authentication resolver

All successful methods finish through one server-controlled continuation route, proposed as `/auth/continue`.

Resolution order:

1. Complete required Clerk session tasks.
2. Idempotently create or synchronize the AsaseLink application user.
3. Reject or explain suspended/restricted account state.
4. Validate any internal return URL against an allowlist to prevent open redirects.
5. Accept a valid company invitation if present.
6. Resume an interrupted identity-sensitive action when one exists.
7. Continue unfinished buyer or company onboarding.
8. Route pending companies to application status.
9. Route a single valid workspace directly to its dashboard.
10. For multiple workspaces, restore the last authorized workspace or show a workspace chooser.
11. Default a general new user to minimal buyer onboarding, then the buyer dashboard.

Destination examples:

| User state                     | Destination                     |
| ------------------------------ | ------------------------------- |
| Buyer profile incomplete       | `/onboarding/profile`           |
| Buyer ready                    | `/account`                      |
| Company application incomplete | `/company/apply/[step]`         |
| Company pending review         | `/company/application`          |
| Approved owner/staff           | `/company/[companyId]/overview` |
| Administrator                  | `/admin`                        |
| Multiple authorized workspaces | Last workspace or `/workspaces` |
| Interrupted future reservation | Original safe return URL        |

## 5. Authentication screen design

### Desktop composition

Authentication is a full-height, split-screen app shell rather than a floating generic auth card.

```text
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  DEEP GREEN PRODUCT PANEL          WHITE AUTHENTICATION PANEL        │
│                                                                      │
│  AsaseLink                         Sign in      Create account        │
│                                                                      │
│  Contextual statement              Welcome back                       │
│  about trust and land              Continue your land journey.       │
│                                                                      │
│  Quiet parcel-line motif           [ Continue with Google          ] │
│  with one gold selection           [ Facebook ]      [ Apple ]       │
│                                                                      │
│  Short trust statement             ─────────── or ───────────        │
│                                     [ Email | Phone ]                 │
│                                     [ identifier                  ]  │
│                                     [ Continue                    ]  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

- Left panel: approximately 44%; deep land green with white copy and one restrained gold plot-selection detail.
- Right panel: approximately 56%; white or black theme surface with a form column around 400-440px.
- The shell feels like a focused application, not a marketing page.
- The left visual is lightweight CSS or a very small static vector; no Mapbox, video, huge photograph, or animated SVG runtime.
- Google is the dominant full-width provider.
- Facebook and Apple are secondary but visible.
- Email and phone use a compact segmented method control.
- Only providers actually configured in Clerk are rendered.

### Mobile and narrow screens

The two panes collapse into a single full-height app-style surface. The form is first, the wordmark stays visible, and the decorative product panel becomes a small contextual header or disappears. There is no miniature desktop card and no horizontal slide trap.

### Sign-in/create-account switching motion

The shared shell remains mounted while the form state changes.

- Segmented indicator moves with `transform` over about 220ms.
- Incoming form moves 12px horizontally while fading from 0 to 1.
- Context copy and the selected parcel detail move in the opposite direction by no more than 16px.
- Exit is slightly faster than entry.
- Container geometry remains stable, so fields do not cause page jumps.
- A rapid second selection cancels the old visual transition and commits the newest state immediately.
- With reduced motion, content swaps with no spatial movement.
- No Framer Motion, GSAP, or other animation dependency is required.

The URL remains meaningful with `/sign-in` and `/sign-up`; the shared auth layout supplies visual continuity.

## 6. Authentication methods

### Primary

- Google OAuth.

### Additional

- Facebook OAuth.
- Apple OAuth.
- Email verification code.
- Ghana-friendly phone number and OTP.

Email and phone are passwordless in the first implementation. Password managers and paste remain allowed wherever passwords or codes appear. OTP entry supports pasting the entire code, numeric mobile keyboards, resend countdown, and alternative-method recovery.

## 7. Auth component inventory

### Structural components

- `AuthShell`: persistent split/single-pane shell.
- `AuthProductPanel`: contextual brand copy and lightweight land motif.
- `AuthFormPanel`: constrained accessible form region.
- `AuthModeSwitch`: sign-in/create-account control and route link.
- `AuthStep`: stable animated region for the current form state.

### Identity components

- `SocialAuthButton`.
- `AuthMethodSwitch` for email/phone.
- `IdentifierForm`.
- `OtpForm`.
- `MfaChallenge`.
- `PasswordRecovery` if password auth is enabled later.
- `AuthErrorSummary` plus inline field errors.
- `AuthSubmitButton` with stable progress state.
- `ClerkCaptchaMount`, required for protected sign-up flows.
- `AuthContinuation`, the minimal post-auth routing screen.

### Onboarding components

- `BuyerProfileForm`.
- `CompanyDetailsForm`.
- `RepresentativeForm`.
- `VerificationDocumentUpload`.
- `ApplicationReview`.
- `ApplicationTimeline`.
- `WorkspaceChooser`.

Components use Clerk's current custom-flow hooks, but application profiles, memberships, and decisions are stored and validated by AsaseLink.

## 8. Buyer onboarding

Buyer onboarding is one short screen and uses information already provided by the identity provider.

Fields:

- first name;
- last name;
- verified email display;
- Ghana phone number, if missing;
- communication consent where legally required.

Do not ask a buyer to select `BUYER`. Do not request address, date of birth, occupation, or other data without a business requirement.

If authentication was triggered by a future reservation, finishing this screen returns to that reservation. Otherwise it opens `/account`.

## 9. Company onboarding

Company onboarding uses a focused multi-step app flow with a stable progress header:

1. Company information.
2. Company representative.
3. Verification documents.
4. Review and declarations.

Each step has a clear title, short explanation, back action, and one primary continue action. Data is validated at the server boundary. Document files use private Cloudflare R2 storage; the database stores metadata and object identifiers.

After submission, the owner lands on an application-status screen:

- Application submitted.
- Documents received.
- Under review.
- Changes requested, approved, or rejected.

An unverified company may not publish an estate. Whether it may prepare drafts before approval is a later business-policy decision and must not be inferred by the frontend.

## 10. Admin company verification

The initial admin surface contains:

- verification queue;
- company detail and representative information;
- private document review with permission checks;
- application timeline;
- approve, request changes, and reject actions;
- confirmation with a required reason for consequential decisions;
- immutable audit event for every decision.

Approval establishes the verified company state and authorized owner membership. It does not come from client-submitted role metadata.

## 11. Dashboard landings in Phase 1

Phase 1 builds usable shells and honest empty states, not fake analytics.

### Buyer dashboard — `/account`

- Greeting and account state.
- `Explore estates` future-action placeholder.
- Reservations empty state.
- Profile completion/status.
- Account menu.

### Company dashboard — `/company/[companyId]/overview`

- Company identity and verification state.
- Empty estates state with the future `Create estate` action.
- Staff/workspace context.
- No invented plot or payment metrics before data exists.

### Admin dashboard — `/admin`

- Pending company-verification count.
- Verification queue.
- Recent verification decisions.
- No decorative charts.

### Multiple-workspace chooser — `/workspaces`

- Buyer workspace.
- Each authorized company workspace and role.
- Admin workspace when internally granted.
- Last-used workspace is clearly marked.

## 12. Loading, error, and transition states

### Authentication action

- Press response occurs immediately.
- The selected button disables and preserves its width.
- Its label becomes specific, such as `Connecting to Google...` or `Sending code...`.
- Other conflicting methods disable during the request.
- Form region exposes `aria-busy`.
- Duplicate submissions are impossible.

### OTP

- Code boxes do not shift when an error appears.
- Pasted full codes distribute correctly.
- Resend state announces remaining time without noisy live-region updates every second.
- Incorrect code errors stay inline and focus remains recoverable.

### OAuth callback

- Minimal brand mark, `Finishing sign in...`, and restrained progress indicator.
- No false success message before Clerk finalization and application-user resolution complete.

### Post-auth routing

- Stable app shell or small centered status.
- Human-readable steps only when a delay is meaningful.
- A recoverable retry state if the application profile cannot be synchronized.

### Dashboard loading

- Navigation shell renders immediately.
- Main sections stream independently with shape-matched skeletons.
- No full-screen spinner.
- Skeletons are Server Components and reserve final layout dimensions.

### Errors

- Field errors appear beside fields.
- Multi-error forms include a focusable linked summary.
- Provider errors explain the next safe action.
- Suspended or unauthorized accounts receive a dedicated explanation, not a redirect loop.

## 13. Performance architecture

- Auth route layout is a Server Component.
- Only the interactive Clerk form region is a Client Component.
- Onboarding shells and explanatory content remain server-rendered.
- No Mapbox code is imported into Phase 1 auth routes.
- The left product panel uses CSS and a tiny static asset at most.
- Geist Sans is loaded once with `next/font`, Latin subset, and no remote browser request.
- Auth transitions use CSS transform and opacity only.
- Heavy providers are scoped to the route groups that need them as the route structure is introduced.
- Route-level `loading.tsx` files and granular Suspense boundaries provide instant, stable feedback.
- Production bundle size is checked after Clerk and every new auth method is wired.

## 14. Security and correctness requirements

- Validate all return URLs.
- Do not trust role, company ID, or onboarding state from query parameters.
- Do not place authorization truth only in Clerk client metadata.
- Synchronization and invitation acceptance are idempotent.
- Company documents are private and accessed through authorized application endpoints.
- Rate-limit OTP and sensitive onboarding operations as appropriate.
- Do not log codes, tokens, secrets, private documents, or full provider payloads.
- Preserve a structured audit trail for company verification and membership changes.
- Test direct navigation to every protected dashboard as the wrong role.

## 15. Phase 1 implementation order

1. Design tokens, typography, motion, and loading primitives.
2. Temporary landing launcher.
3. Auth route group and shared app shell.
4. Google sign-in/sign-up.
5. Email and phone OTP.
6. Facebook and Apple when provider credentials are configured.
7. Application-user synchronization and continuation resolver.
8. Minimal buyer onboarding.
9. Company application and private document upload.
10. Admin verification flow and audit event.
11. Buyer, company, admin, and workspace dashboard shells.
12. Permission, loading, error, session-expiry, and recovery states.
13. Clerk-focused integration and Playwright end-to-end tests.
14. Production bundle, accessibility, and Cloudflare deployment verification.

## 16. Acceptance tests

- A buyer signing in with Google reaches buyer onboarding once, then `/account` on later sign-ins.
- A buyer signing in during an interrupted action returns safely to that action.
- A company applicant resumes the correct incomplete step.
- A pending company always reaches its status screen, not a verified workspace.
- An invited staff member enters only the company named in the valid invitation.
- An admin reaches `/admin` without being able to select the role in the UI.
- A multi-workspace user can switch only among server-authorized contexts.
- Direct access to another company's URL is rejected server-side.
- OTP supports paste and provides accessible recovery.
- Every async action prevents duplicate submission and has a clear failure state.
- Reduced-motion mode removes spatial auth transitions.
- Keyboard-only users can complete every auth and onboarding path.
- The production auth route contains no Mapbox or animation-library bundle.
