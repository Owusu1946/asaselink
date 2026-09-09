---
name: asaselink-reservations
description: Design and test AsaseLink reservation concurrency, expiry, status transitions, and transactional integrity.
---

# AsaseLink Reservations

Use this skill for plot reservation, availability, expiry jobs, cancellation, payment-linked transitions, or race-condition fixes.

- The database is the final authority for availability. Reserve inside one transaction with an atomic availability predicate plus row locking and/or a uniqueness constraint.
- A concurrent request pair for one plot must produce exactly one success and one conflict/failure. Never rely on cached frontend status.
- Keep plot, reservation, and payment states explicit. Model allowed transitions centrally and reject arbitrary status updates.
- Reservation expiry runs server-side, is configurable, and is idempotent. A repeated expiry job must not revive sold/paid/confirmed reservations or corrupt history.
- Preserve references, actors, timestamps, and transition history. Do not partially update plot and reservation state.
- Write integration tests against a real PostgreSQL-compatible database for concurrent reservation, retry, expiry, cancellation, and payment-confirmation paths.
