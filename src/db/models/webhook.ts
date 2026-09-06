// Might use later as an additional webhook audit/idempotency layer
import * as p from "drizzle-orm/pg-core";
import { index, primaryKey } from "drizzle-orm/pg-core";

// WEBHOOK EVENT
export const webhookEvent = p.pgTable(
  "webhook_event",
  {
    id: p.text().notNull(), // The provider's event ID
    provider: p.text().notNull(), // 'stripe', 'github',
    eventType: p.text("event_type").notNull(), // 'payment.succeeded', etc.
    receivedAt: p.timestamp("received_at").defaultNow().notNull(),
    processedAt: p.timestamp("processed_at"),
    payload: p.text().notNull(), // Raw payload for debugging
  },
  (table) => [
    primaryKey({
      columns: [table.provider, table.id],
    }),
    index("webhook_provider_idx").on(table.provider),
    index("webhook_event_type_idx").on(table.eventType),
  ],
);
