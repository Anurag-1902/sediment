CREATE TABLE "organization_invite" (
  "id" TEXT NOT NULL,
  "organization_id" TEXT NOT NULL,
  "invited_email" TEXT NOT NULL,
  "invited_user_id" TEXT NOT NULL,
  "invited_by_user_id" TEXT NOT NULL,
  "role" "OrgRole" NOT NULL,
  "token" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "expires_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "accepted_at" TIMESTAMP(3),
  CONSTRAINT "organization_invite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "organization_invite_token_key" ON "organization_invite"("token");
CREATE INDEX "organization_invite_invited_user_id_status_idx" ON "organization_invite"("invited_user_id", "status");
CREATE INDEX "organization_invite_token_idx" ON "organization_invite"("token");

ALTER TABLE "organization_invite" ADD CONSTRAINT "organization_invite_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
