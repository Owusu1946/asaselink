WITH recoverable AS MATERIALIZED (
  SELECT pa.source_reservation_id AS reservation_id, pa.plot_id
  FROM purchase_accounts pa
  JOIN reservations r ON r.id = pa.source_reservation_id
  JOIN plots p ON p.id = pa.plot_id
  WHERE pa.status = 'PURCHASE_IN_PROGRESS'
    AND r.status = 'EXPIRED'
    AND p.status = 'AVAILABLE'
    AND NOT EXISTS (
      SELECT 1 FROM reservations other
      WHERE other.plot_id = pa.plot_id
        AND other.id <> r.id
        AND other.status IN ('CHECKOUT_LOCKED','HOLD_PAYMENT_PENDING','HELD','PURCHASE_IN_PROGRESS')
    )
), reserved AS (
  UPDATE plots p SET status = 'RESERVED', updated_at = now()
  FROM recoverable repair WHERE p.id = repair.plot_id
  RETURNING p.id
), restored AS (
  UPDATE reservations r SET status = 'PURCHASE_IN_PROGRESS', released_at = NULL,
    release_reason = NULL, updated_at = now()
  FROM recoverable repair
  WHERE r.id = repair.reservation_id
    AND repair.plot_id IN (SELECT id FROM reserved)
  RETURNING r.id, r.plot_id
)
INSERT INTO audit_logs (action, entity_type, entity_id, reason, metadata)
SELECT 'reservation.purchase_restored', 'reservation', id::text,
  'Restored after erroneous expiry of an active purchase',
  jsonb_build_object('plotId', plot_id)
FROM restored;
