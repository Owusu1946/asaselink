import { neon } from "@neondatabase/serverless";

interface Env { DATABASE_URL: string; EVENTS: Queue<{ eventId: string }> }

export default {
  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(dispatch(env));
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
    UPDATE outbox_events SET status='processing', attempts=attempts+1
    WHERE id IN (
      SELECT id FROM outbox_events WHERE status='pending' AND available_at <= now()
      ORDER BY created_at LIMIT 100 FOR UPDATE SKIP LOCKED
    ) RETURNING id
  `;
  if (!events.length) return;
  try {
    await env.EVENTS.sendBatch(events.map((event) => ({ body: { eventId: String(event.id) } })));
  } catch (error) {
    const ids = events.map((event) => String(event.id));
    await sql`UPDATE outbox_events SET status='pending', last_error=${error instanceof Error ? error.message.slice(0, 1000) : "Queue dispatch failed"} WHERE id = ANY(${ids})`;
    throw error;
  }
}
