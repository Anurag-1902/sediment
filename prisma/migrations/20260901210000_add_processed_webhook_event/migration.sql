-- Idempotency table for Razorpay webhook events
CREATE TABLE "processed_webhook_event" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "processed_webhook_event_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "processed_webhook_event_event_id_key" ON "processed_webhook_event"("event_id");
