---
name: asaselink-payments
description: Implement and review AsaseLink Paystack payment initiation, webhook verification, payment proof, and payment state transitions.
---

# AsaseLink Payments

Use this skill for payment APIs, Paystack integration, payment webhooks, proof uploads, or transaction state.

- Treat Paystack as a provider behind an internal payment abstraction; do not spread provider-specific assumptions through domain code.
- Initiate payments server-side and persist an immutable provider reference, reservation relationship, amount, currency, status, and timestamps.
- Verify webhook signatures and provider transaction status server-side. Webhook handling must be idempotent and safe to retry.
- Never transition payment or reservation state from frontend claims. Apply explicit, transactional state transitions and preserve payment history.
- Store payment proofs privately in R2 after validating type, size, and content; store metadata/object keys in PostgreSQL and use controlled access URLs.
- Keep secrets server-only and return safe, human-readable errors. Add tests for duplicate webhooks, mismatched amounts, unknown references, and failed verification.
