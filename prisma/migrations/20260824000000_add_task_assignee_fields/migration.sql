-- AlterTable
ALTER TABLE "task" ADD COLUMN IF NOT EXISTS "assignee_slack_id" TEXT;
ALTER TABLE "task" ADD COLUMN IF NOT EXISTS "assignee_name" TEXT;
