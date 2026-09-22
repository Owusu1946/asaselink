# Phase 2: checkout locks and paid holds

## State model

| Type | Live states | Terminal states |
| --- | --- | --- |
| `CHECKOUT_LOCK` | `CHECKOUT_LOCKED` -> `PURCHASE_IN_PROGRESS` | `SOLD`, `EXPIRED`, `RELEASED`, `CANCELLED` |
| `PAID_HOLD` | `HOLD_PAYMENT_PENDING` -> `HELD` -> `PURCHASE_IN_PROGRESS` | `SOLD`, `EXPIRED`, `RELEASED`, `CANCELLED` |

Only one live reservation may exist per plot. PostgreSQL enforces that invariant with a partial unique index; the API also claims the plot using an atomic `AVAILABLE` to `RESERVED` update.

## Commercial terms

The active row in `reservation_commercial_settings` controls checkout duration, hold payment window, hold duration, fee, refund percentage, administrative deduction, and terms. Paid holds copy those values onto the reservation when it is created. Later configuration changes therefore cannot alter an existing agreement.

The seeded prototype terms are:

- 30-minute checkout lock
- 30-minute window to pay the hold fee
- 7-day paid hold
- GHS 500 hold fee
- 80% refund basis less a GHS 25 administrative deduction

## Expiry and refunds

The jobs Worker runs every minute. It claims at most 100 expired live reservations with `FOR UPDATE SKIP LOCKED`, releases their plots, records audit/outbox events, and cancels unverified payments. An expired or company-cancelled paid hold with a successful hold-fee payment creates one `reservation_refunds` work item. A unique reservation index makes refund creation idempotent.

Phase 2 creates refund work but does not process money. Refund accounting and application of a paid hold to a purchase are Phase 3 responsibilities.

## Deployment order

1. Apply database migration `0014_daily_sway.sql`.
2. Deploy the API Worker.
3. Deploy the jobs Worker.
4. Deploy the web Worker.
