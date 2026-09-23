import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../../../..");
const migration = readFileSync(
  resolve(root, "packages/db/src/migrations/0014_daily_sway.sql"),
  "utf8",
);
const jobs = readFileSync(resolve(root, "apps/jobs/src/index.ts"), "utf8");

describe("paid hold persistence contracts", () => {
  it("backfills legacy outcomes without replacing buyer, plot, price, or expiry", () => {
    expect(migration).toContain("WHEN \"status\" = 'ACTIVE' THEN 'CHECKOUT_LOCKED'");
    expect(migration).toContain("WHEN \"status\" = 'PAYMENT_PENDING' THEN 'PURCHASE_IN_PROGRESS'");
    expect(migration).toContain("WHEN \"status\" = 'CONFIRMED' THEN 'SOLD'");
    const backfill =
      migration.match(/UPDATE "reservations"[\s\S]*?statement-breakpoint/)?.[0] ?? "";
    expect(backfill).not.toContain("buyer_user_id");
    expect(backfill).not.toContain("plot_id");
    expect(backfill).not.toContain("price_snapshot");
    expect(backfill).not.toContain("expires_at");
  });

  it("retains database protection against two live claims on one plot", () => {
    expect(migration).toContain('CREATE UNIQUE INDEX "reservations_one_live_plot_uq"');
    expect(migration).toContain(
      "'CHECKOUT_LOCKED','HOLD_PAYMENT_PENDING','HELD','PURCHASE_IN_PROGRESS'",
    );
  });

  it("makes overlapping expiry runs safe and refund creation idempotent", () => {
    expect(jobs).toContain("FOR UPDATE SKIP LOCKED");
    expect(jobs).toContain("ON CONFLICT (reservation_id) DO NOTHING");
    expect(jobs).toContain("status IN ('CHECKOUT_LOCKED','HOLD_PAYMENT_PENDING','HELD')");
    expect(jobs).not.toContain(
      "status IN ('CHECKOUT_LOCKED','HOLD_PAYMENT_PENDING','HELD','PURCHASE_IN_PROGRESS')",
    );
  });
});
