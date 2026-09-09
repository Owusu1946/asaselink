---
name: asaselink-observability
description: Add AsaseLink monitoring, structured audit logs, product events, and Vitest/Playwright quality coverage for critical workflows.
---

# AsaseLink Observability

Use this skill for Sentry, PostHog, audit history, error handling, or tests around critical product workflows.

- Send unexpected frontend/API failures to Sentry without secrets, tokens, payment payloads, or private document contents.
- Record structured audit events for company verification, geometry changes, plot/status transitions, reservations, payments, verification, staff permissions, and admin actions. Include actor, resource, action, timestamp, and before/after data where appropriate.
- Track meaningful PostHog product events only; analytics never determines reservation or payment truth.
- Use Vitest for domain/service/unit/integration tests and Playwright for end-to-end buyer/company journeys. Prioritize the concurrent same-plot reservation acceptance test.
- Assert human-readable error states, authorization boundaries, webhook idempotency, and responsive critical flows. Keep monitoring and analytics non-blocking for successful transactions.
