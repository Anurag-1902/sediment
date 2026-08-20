-- CreateTable
CREATE TABLE "debug_events" (
    "id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "debug_events_pkey" PRIMARY KEY ("id")
);
