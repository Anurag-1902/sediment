-- Add followUpsSentAt to SyncSession so follow-ups are sent once
-- without prematurely closing the session.
ALTER TABLE "sync_session" ADD COLUMN "followups_sent_at" TIMESTAMP(3);
