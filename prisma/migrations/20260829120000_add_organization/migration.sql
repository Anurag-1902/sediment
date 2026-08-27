-- Add Organization and OrganizationMember tables
CREATE TABLE IF NOT EXISTS "organization" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "owner_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "plan" TEXT NOT NULL DEFAULT 'FREE',
  "razorpay_customer_id" TEXT,
  "razorpay_subscription_id" TEXT,
  "plan_started_at" TIMESTAMPTZ,
  "plan_expires_at" TIMESTAMPTZ,
  "auto_renew" BOOLEAN NOT NULL DEFAULT true,

  CONSTRAINT "organization_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "organization_slug_key" ON "organization"("slug");
CREATE INDEX IF NOT EXISTS "organization_owner_id_idx" ON "organization"("owner_id");

-- Add foreign key from Organization to User
ALTER TABLE "organization" ADD CONSTRAINT "organization_owner_id_fkey"
  FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create OrganizationMember table
CREATE TABLE IF NOT EXISTS "organization_member" (
  "id" TEXT NOT NULL,
  "organization_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'MEMBER',
  "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "organization_member_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "organization_member_organization_id_user_id_key" ON "organization_member"("organization_id", "user_id");
CREATE INDEX IF NOT EXISTS "organization_member_user_id_idx" ON "organization_member"("user_id");

ALTER TABLE "organization_member" ADD CONSTRAINT "organization_member_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "organization_member" ADD CONSTRAINT "organization_member_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add organization_id to User
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "organization_id" TEXT;

-- Add organization_id to Project
ALTER TABLE "project" ADD COLUMN IF NOT EXISTS "organization_id" TEXT;
CREATE INDEX IF NOT EXISTS "project_organization_id_idx" ON "project"("organization_id");

-- Add organization_id to SlackWorkspace
ALTER TABLE "slack_workspaces" ADD COLUMN IF NOT EXISTS "organization_id" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "slack_workspaces_organization_id_key" ON "slack_workspaces"("organization_id");

-- Migrate existing data: create an org for each user
-- This inserts orgs for all existing users
INSERT INTO "organization" ("id", "name", "slug", "owner_id", "updated_at", "plan", "razorpay_customer_id", "razorpay_subscription_id", "plan_started_at", "plan_expires_at", "auto_renew")
SELECT 
  gen_random_uuid()::text,
  COALESCE("name", 'Workspace') || '''s Workspace',
  "id" as slug,
  "id" as owner_id,
  NOW(),
  COALESCE("plan", 'FREE'),
  "razorpay_customer_id",
  "razorpay_subscription_id",
  "plan_started_at",
  "plan_expires_at",
  COALESCE("auto_renew", true)
FROM "user";

-- Add OrganizationMember entries for all existing users (they are owners of their own orgs)
INSERT INTO "organization_member" ("id", "organization_id", "user_id", "role", "joined_at")
SELECT 
  gen_random_uuid()::text,
  o.id,
  u.id,
  'OWNER',
  NOW()
FROM "user" u
JOIN "organization" o ON o.owner_id = u.id;

-- Set user.organization_id to their org
UPDATE "user" u
SET "organization_id" = o.id
FROM "organization" o
WHERE o.owner_id = u.id;

-- Set project.organization_id to the owning user's org
UPDATE "project" p
SET "organization_id" = o.id
FROM "organization" o
WHERE o.owner_id = p.owner_id;

-- Set slack_workspaces.organization_id to the user's org
UPDATE "slack_workspaces" sw
SET "organization_id" = o.id
FROM "organization" o
WHERE o.owner_id = sw.user_id;

-- Add foreign key from Project to Organization
ALTER TABLE "project" ADD CONSTRAINT "project_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add foreign key from SlackWorkspace to Organization
ALTER TABLE "slack_workspaces" ADD CONSTRAINT "slack_workspaces_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
