# AsaseLink Design System

**Status:** Phase 1 source of truth  
**Parent:** `docs/ASASELINK_VISION.md`  
**Applies to:** Public pages, authentication, buyer account, company workspace, and platform administration

This document defines AsaseLink's core visual and interaction language. Product-specific page specifications may extend it, but must not replace the semantic color, typography, accessibility, motion, or performance rules defined here.

## 1. Design character

AsaseLink should feel calm, trustworthy, spatially intelligent, premium, and fast. The interface is built around real land decisions, significant payments, and operational clarity.

The system is intentionally restrained:

- Green communicates land, trust, availability, and primary action.
- White creates clarity and breathing room.
- Gold communicates selection, progress, verification, and important attention.
- Black provides authority, contrast, and the foundation for dark mode.
- Decoration never competes with geographic or transactional information.
- One page may have one memorable visual idea; everything else stays disciplined.

## 2. Core palette

### 2.1 Brand primitives

| Token      |     Value | Role                                             |
| ---------- | --------: | ------------------------------------------------ |
| Land green | `#0B3D2E` | Primary brand, primary actions, trusted emphasis |
| White      | `#FFFFFF` | Main light surface and text on dark green        |
| Gold       | `#C79A24` | Selected state, milestones, restrained accent    |
| Black      | `#090B09` | Dark canvas and maximum-contrast brand neutral   |

These are primitives. Components consume semantic tokens such as `primary`, `background`, and `warning`; they do not hardcode brand values.

### 2.2 Green scale

| Step |     Value |
| ---- | --------: |
| 50   | `#EEF5F1` |
| 100  | `#D9E9DF` |
| 200  | `#B5D4C2` |
| 300  | `#86B499` |
| 400  | `#579173` |
| 500  | `#347055` |
| 600  | `#245B43` |
| 700  | `#194A36` |
| 800  | `#123D2F` |
| 900  | `#0B3D2E` |
| 950  | `#061F17` |

### 2.3 Gold scale

| Step |     Value |
| ---- | --------: |
| 50   | `#FCF8E9` |
| 100  | `#F8EFC8` |
| 200  | `#F0DD91` |
| 300  | `#E4C45C` |
| 400  | `#D2A62E` |
| 500  | `#C79A24` |
| 600  | `#A77A1C` |
| 700  | `#8A6418` |
| 800  | `#73500F` |
| 900  | `#513619` |

Gold is not a default button color and is not used for paragraphs. On a gold fill, use black or deep green text. White text on mid-gold does not have sufficient contrast.

## 3. Semantic color rules

### Light theme

| Purpose            |     Value |
| ------------------ | --------: |
| Page background    | `#FFFFFF` |
| Primary foreground | `#111713` |
| Card/popover       | `#FFFFFF` |
| Primary action     | `#0B3D2E` |
| On-primary         | `#FFFFFF` |
| Secondary surface  | `#F1F5F2` |
| Muted surface      | `#F3F5F3` |
| Muted text         | `#5E675F` |
| Accent surface     | `#F8EFC8` |
| Accent text        | `#73500F` |
| Border             | `#DDE3DE` |
| Input border       | `#C9D1CB` |
| Focus ring         | `#8A6418` |
| Success            | `#246B45` |
| Warning            | `#8A6418` |
| Destructive        | `#B42318` |

### Dark theme

| Purpose            |     Value |
| ------------------ | --------: |
| Page background    | `#090B09` |
| Primary foreground | `#F7FAF8` |
| Card               | `#101410` |
| Popover            | `#151A16` |
| Primary action     | `#78B98F` |
| On-primary         | `#07130D` |
| Secondary surface  | `#17241B` |
| Muted surface      | `#19221C` |
| Muted text         | `#A8B0AA` |
| Accent surface     | `#342A0C` |
| Accent text        | `#F1D57C` |
| Border             | `#2B332D` |
| Input border       | `#39433C` |
| Focus ring         | `#D2A62E` |

Red is a semantic exception for destructive actions and errors. It is not part of ordinary brand decoration.

### Verified contrast pairs

- White on land green: approximately `12.2:1`.
- Primary black-green text on white: greater than `17:1`.
- Muted text on white: approximately `5.9:1`.
- Black on gold: approximately `7.6:1`.
- Dark-theme foreground on black: greater than `17:1`.
- Dark-theme green action on black: greater than `7:1`.

Normal text must meet WCAG AA `4.5:1`; large text and meaningful UI boundaries must meet at least `3:1`.

## 4. Status color usage

Status is never communicated with color alone.

| State             | Color treatment                   | Additional signal                                  |
| ----------------- | --------------------------------- | -------------------------------------------------- |
| Available         | Green                             | `Available` label and solid outline                |
| Selected          | Gold                              | Strong outline, selected marker, and details panel |
| Reserved          | Gold/amber                        | `Reserved` label and distinct pattern/opacity      |
| Sold              | Black/neutral or restrained brick | `Sold` label and hatch/locked treatment            |
| Verified          | Green with restrained gold detail | Verification label/icon                            |
| Pending           | Gold/neutral                      | Progress label and timeline position               |
| Error/destructive | Red exception                     | Error text/icon and recovery action                |

## 5. Typography

### Font family

Use **Geist Sans Variable** for the entire product.

Reasons:

- clear at small dashboard and form sizes;
- strong numeric rendering for prices, areas, and references;
- variable weights in one family;
- already supported by `next/font`;
- self-hosted automatically in the production build;
- no browser request to Google;
- no font package or runtime JavaScript;
- one family prevents a second font download and reduces visual inconsistency.

Do not load a global display serif or separate monospace font. If a future campaign genuinely needs a display face, scope and measure it instead of making it global.

### Weight roles

| Weight | Use                                    |
| -----: | -------------------------------------- |
|    400 | Body copy, input values, descriptions  |
|    500 | Navigation, labels, compact controls   |
|    600 | Buttons, card titles, section headings |
|    700 | Page titles and high-emphasis numbers  |

Avoid synthetic weights. Avoid all-caps UI labels and decorative letter spacing.

### Type scale

| Token         |  Desktop target | Use                             |
| ------------- | --------------: | ------------------------------- |
| Display       | `56-72px` fluid | Public hero only                |
| Page title    |       `32-40px` | Primary screen heading          |
| Section title |       `24-28px` | Major content group             |
| Card title    |       `18-20px` | Entity/card heading             |
| Body          |          `16px` | Default reading and forms       |
| Compact       |          `14px` | Tables, metadata, supporting UI |
| Micro         |  `12px` minimum | Rare secondary metadata only    |

Body line-height is approximately `1.5`; large headings use `1.0-1.15`. Keep prose below 80 characters per line. Use tabular numerals for aligned prices, counts, dates, and plot measurements.

## 6. Shape and elevation

- Base radius: `12px`.
- Inputs and ordinary controls: `10-12px`.
- Cards: `12-16px`, based on hierarchy.
- Large app/auth shell: up to `24px`.
- Capsule radius: reserved for the floating navigation, segmented controls, primary discovery CTA, and explicitly pill-shaped actions.
- Detached nav controls are circles from the same material family as the navigation capsule.
- Shadows are rare and soft. Borders and surface contrast establish most hierarchy.
- Avoid a page made from nested rounded cards.

## 7. Spacing

Use a 4px base grid with recurring values:

`4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96`

- Form fields use 16-20px vertical gaps.
- Related controls use 8-12px gaps.
- Card padding is usually 20-24px.
- Page gutters grow with the viewport.
- Interactive targets are at least 44px where practical and never below WCAG 2.2's 24px minimum.

## 8. Motion

Motion explains a state change; it is not ambient decoration.

| Token    | Duration | Use                                   |
| -------- | -------: | ------------------------------------- |
| Instant  |   `80ms` | Press feedback                        |
| Fast     |  `140ms` | Hover/focus and small control changes |
| Standard |  `220ms` | Form-step and panel transitions       |
| Slow     |  `360ms` | Rare large spatial transition         |

Use transform and opacity only for routine motion. Entrance easing is `cubic-bezier(0.16, 1, 0.3, 1)`. Exit motion is slightly faster. State correctness must never depend on an animation finishing. Interrupted transitions resolve immediately to the newest state.

`prefers-reduced-motion: reduce` removes non-essential motion and presents the final state without delay.

No animation package is added for Phase 1. CSS is sufficient for the auth transitions and keeps the bundle smaller.

## 9. Loading and perceived performance

Loading UI mirrors the shape of the content that will replace it.

- Keep the page/app shell stable while inner sections stream.
- Prefer route-level `loading.tsx` and granular Suspense boundaries.
- Use Server Component skeletons; a skeleton does not need hydration.
- Reserve final dimensions to prevent layout shift.
- Use a restrained opacity pulse, not a sweeping high-contrast shimmer.
- Do not show a full-screen spinner for ordinary navigation.
- Buttons retain their width, disable repeat submission, expose `aria-busy`, and change to a specific progress label.
- Inline field errors remain near the field; do not use a toast as the only form error.
- OAuth callback and post-auth routing may use a minimal centered progress state because navigation cannot yet show destination content.
- Avoid flashing a loader for work that resolves almost instantly; keep the stable shell visible.
- Loading, empty, error, and success states occupy compatible geometry where possible.

## 10. Performance constitution

- Server Components are the default.
- Client Components are leaf-level islands for Clerk hooks, interactive forms, theme switching, maps, and other browser-only behavior.
- Use one variable font through `next/font` and the Latin subset.
- No CSS `@import` from a remote font provider.
- No animation framework for basic transitions.
- Mapbox is never loaded on auth, onboarding, or dashboard pages that do not display a map.
- Below-fold images are lazy-loaded and dimensioned; only the actual LCP image is eager.
- Public and dashboard shells render useful HTML before client JavaScript is ready.
- Use `loading.tsx` and Suspense to stream independent data regions.
- Scope TanStack Query and other client data libraries to surfaces that need them; do not use them for static page content.
- Audit production bundles as features are added and reject dependencies that duplicate existing capabilities.
- Target LCP <= 2.5s, CLS <= 0.1, and INP <= 200ms under realistic mobile conditions.

## 11. Component rules

- Components use semantic tokens, never raw color hex values.
- Native buttons, links, labels, and inputs provide the behavioral foundation.
- Focus is always visible.
- Icon-only controls have accessible names.
- Hugeicons is the intended product icon family; icons are added only where they improve comprehension.
- Primary actions are visually singular within a region.
- Tables and dashboards prioritize decisions and next actions over decorative metrics.
- Errors explain what happened and what the user can do next.

## 12. Anti-patterns

Do not introduce:

- purple or blue gradient branding;
- glassmorphism or blurred panels;
- gold body text on white;
- white text on mid-gold;
- excessive shadows and nested cards;
- icons beside every navigation label;
- all-caps tracked labels as decoration;
- multiple global font families;
- animated backgrounds, orbs, or perpetual motion;
- spinner-only pages;
- color-only status communication;
- full-page Client Components without a concrete need.
