CREATE TABLE "webhook_event" (
	"id" text NOT NULL,
	"provider" text NOT NULL,
	"event_type" text NOT NULL,
	"received_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp,
	"payload" text NOT NULL,
	CONSTRAINT "webhook_event_provider_id_pk" PRIMARY KEY("provider","id")
);
--> statement-breakpoint
CREATE INDEX "webhook_provider_idx" ON "webhook_event" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "webhook_event_type_idx" ON "webhook_event" USING btree ("event_type");