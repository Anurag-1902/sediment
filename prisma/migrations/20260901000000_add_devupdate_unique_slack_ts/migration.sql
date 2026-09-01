-- Idempotency guard: one devUpdate per (session, slack message ts)
-- Remove duplicates introduced by Slack retries, keeping the earliest update.
DELETE FROM "dev_update" a
USING "dev_update" b
WHERE a."session_id" = b."session_id"
  AND a."slack_message_ts" = b."slack_message_ts"
  AND (a."created_at" > b."created_at"
       OR (a."created_at" = b."created_at" AND a."id" > b."id"));

-- CreateUniqueIndex
CREATE UNIQUE INDEX "dev_update_session_id_slack_message_ts_key" ON "dev_update"("session_id", "slack_message_ts");
