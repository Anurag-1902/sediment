-- Create the enum type
CREATE TYPE "OrgRole" AS ENUM ('MANAGER', 'ADMIN', 'DEVELOPER', 'HR', 'ACCOUNTANT', 'FINANCE', 'EMPLOYEE');

-- Backfill existing roles: OWNER -> MANAGER, MEMBER -> EMPLOYEE, ADMIN -> ADMIN
UPDATE "organization_member" SET role = 'MANAGER' WHERE role = 'OWNER';
UPDATE "organization_member" SET role = 'EMPLOYEE' WHERE role = 'MEMBER';
-- ADMIN stays ADMIN

-- Drop the default so we can change the column type
ALTER TABLE "organization_member" ALTER COLUMN role DROP DEFAULT;

-- Change the column type from text to enum
ALTER TABLE "organization_member" ALTER COLUMN role TYPE "OrgRole" USING role::"OrgRole";

-- Set the new default
ALTER TABLE "organization_member" ALTER COLUMN role SET DEFAULT 'EMPLOYEE';
