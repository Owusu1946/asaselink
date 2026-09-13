import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

interface Env { DATABASE_URL: string; EVENTS: Queue<{ eventId: string }> }

export default {
  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(Promise.all([expireReservations(env), dispatch(env)]));
  },
  async queue(batch: MessageBatch<unknown>, env: Env) {
    const sql = neon(env.DATABASE_URL);
    for (const message of batch.messages) {
      try {
        const body = message.body as { eventId?: string };
        if (!body.eventId) { message.ack(); continue; }
        const rows = await sql`SELECT id, topic, aggregate_id, payload FROM outbox_events WHERE id=${body.eventId} AND status='processing' LIMIT 1`;
        const event = rows[0];
        if (!event) { message.ack(); continue; }
        const payload = event.payload as Record<string, unknown>;
        if (event.topic === "estate.reviewed" && payload.decision === "approved") await matchLandAlerts(sql, { estateId: String(payload.estateId) });
        if (event.topic === "plot.available") await matchLandAlerts(sql, { plotId: String(payload.plotId) });
        if (event.topic === "land_alert.mock_delivery") {
          await sql`UPDATE land_alert_matches SET delivery_status='mock_delivered', delivered_at=now() WHERE id=${event.aggregate_id}::uuid AND delivery_status='pending'`;
          console.log(JSON.stringify({ event: "land_alert.mock_delivered", matchId: event.aggregate_id, channels: payload.channels }));
        }
        console.log(JSON.stringify({ event: "outbox.processed", topic: event.topic, aggregateId: event.aggregate_id, eventId: event.id }));
        await sql`UPDATE outbox_events SET status='processed', processed_at=now(), last_error=NULL WHERE id=${event.id}`;
        message.ack();
      } catch (error) {
        const body = message.body as { eventId?: string };
        if (body.eventId) await sql`UPDATE outbox_events SET last_error=${error instanceof Error ? error.message.slice(0, 1000) : "Unknown consumer error"} WHERE id=${body.eventId}`;
        message.retry();
      }
    }
  },
} satisfies ExportedHandler<Env>;

async function dispatch(env: Env) {
  const sql = neon(env.DATABASE_URL);
  const events = await sql`
    UPDATE outbox_events SET status='processing', attempts=attempts+1, available_at=now() + interval '5 minutes'
    WHERE id IN (
      SELECT id FROM outbox_events
      WHERE status='pending' AND available_at <= now()
         OR status='processing' AND available_at <= now()
      ORDER BY created_at LIMIT 100 FOR UPDATE SKIP LOCKED
    ) RETURNING id
  `;
  if (!events.length) return;
  try {
    await env.EVENTS.sendBatch(events.map((event) => ({ body: { eventId: String(event.id) } })));
  } catch (error) {
    const ids = events.map((event) => String(event.id));
    await sql`UPDATE outbox_events SET status='pending', available_at=now(), last_error=${error instanceof Error ? error.message.slice(0, 1000) : "Queue dispatch failed"} WHERE id = ANY(${ids}::uuid[])`;
    throw error;
  }
}

async function expireReservations(env: Env) {
  const sql = neon(env.DATABASE_URL);
  await sql`
    WITH expired AS (
      UPDATE reservations SET status='EXPIRED', updated_at=now()
      WHERE status='ACTIVE' AND expires_at <= now() RETURNING plot_id
    ), available AS (
      UPDATE plots SET status='AVAILABLE', updated_at=now()
      WHERE id IN (SELECT plot_id FROM expired) AND status='RESERVED' RETURNING id
    )
    INSERT INTO outbox_events (topic, aggregate_id, payload)
    SELECT 'plot.available', id::text, jsonb_build_object('plotId', id) FROM available
  `;
  await sql`DELETE FROM api_rate_limits WHERE window_started_at < now() - interval '1 day'`;
}

async function matchLandAlerts(sql: NeonQueryFunction<false, false>, target: { estateId?: string; plotId?: string }) {
  const estateId = target.estateId ?? null; const plotId = target.plotId ?? null;
  await sql`
    WITH matches AS (
      INSERT INTO land_alert_matches (alert_id, plot_id)
      SELECT a.id, p.id
      FROM land_alerts a
      JOIN plots p ON p.status='AVAILABLE'
      JOIN estates e ON e.id=p.estate_id AND e.status='approved'
      WHERE a.status='active'
        AND (${estateId}::uuid IS NULL OR e.id=${estateId}::uuid)
        AND (${plotId}::uuid IS NULL OR p.id=${plotId}::uuid)
        AND (a.min_price IS NULL OR p.price >= a.min_price)
        AND (a.max_price IS NULL OR p.price <= a.max_price)
        AND (a.region IS NULL OR lower(e.region)=lower(a.region))
        AND (a.district IS NULL OR lower(coalesce(e.district,''))=lower(a.district))
        AND (a.center IS NULL OR ST_DWithin(a.center::geography, ST_Centroid(e.boundary)::geography, a.radius_km * 1000))
      ON CONFLICT (alert_id, plot_id) DO NOTHING
      RETURNING id, alert_id, plot_id
    )
    INSERT INTO outbox_events (topic, aggregate_id, payload)
    SELECT 'land_alert.mock_delivery', m.id::text,
      jsonb_build_object('matchId', m.id, 'alertId', m.alert_id, 'plotId', m.plot_id, 'channels', a.channels, 'mock', true)
    FROM matches m JOIN land_alerts a ON a.id=m.alert_id
  `;
}
