/*
  Warnings:

  - Added the required column `date_key` to the `sync_session` table without a default value. Existing rows will keep NULL, which is allowed by the composite unique constraint.

*/
-- AlterTable
ALTER TABLE "sync_session" ADD COLUMN     "date_key" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "sync_session_project_id_date_key_key" ON "sync_session"("project_id", "date_key");
