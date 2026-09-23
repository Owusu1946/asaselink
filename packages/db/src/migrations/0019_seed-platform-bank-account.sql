INSERT INTO "bank_accounts" (
  "scope",
  "bank_name",
  "account_name",
  "account_number",
  "branch",
  "instructions",
  "version",
  "is_active"
)
SELECT
  'PLATFORM',
  'AsaseLink Prototype Bank',
  'AsaseLink Collections',
  '0000000000',
  'Online Collections',
  'Use your payment reference as the transfer narration. This is a mock prototype account; do not send real money.',
  COALESCE((SELECT MAX("version") FROM "bank_accounts" WHERE "scope" = 'PLATFORM'), 0) + 1,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM "bank_accounts" WHERE "scope" = 'PLATFORM' AND "is_active" = true
);
