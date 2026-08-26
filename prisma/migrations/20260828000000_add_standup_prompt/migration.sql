-- AlterTable
ALTER TABLE "project" ADD COLUMN IF NOT EXISTS "standup_prompt" TEXT NOT NULL DEFAULT 'What did you do yesterday? What''s on today? Any blockers?';
