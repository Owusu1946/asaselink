ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "clerk_organization_id" varchar(256);
ALTER TABLE "company_members" ADD COLUMN IF NOT EXISTS "clerk_membership_id" varchar(256);

CREATE UNIQUE INDEX IF NOT EXISTS "companies_clerk_organization_id_unique" ON "companies" ("clerk_organization_id");
CREATE UNIQUE INDEX IF NOT EXISTS "company_members_company_user_unique" ON "company_members" ("company_id", "user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "company_members_clerk_membership_unique" ON "company_members" ("clerk_membership_id");
CREATE INDEX IF NOT EXISTS "company_members_company_status_idx" ON "company_members" ("company_id", "status");

CREATE TABLE IF NOT EXISTS "company_invitations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
  "invited_by_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "clerk_invitation_id" varchar(256) NOT NULL,
  "email" varchar(256) NOT NULL,
  "role" varchar(32) NOT NULL,
  "status" varchar(32) DEFAULT 'pending' NOT NULL,
  "expires_at" timestamp with time zone,
  "accepted_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "company_invitations_clerk_id_unique" ON "company_invitations" ("clerk_invitation_id");
CREATE INDEX IF NOT EXISTS "company_invitations_company_status_idx" ON "company_invitations" ("company_id", "status");
