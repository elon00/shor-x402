-- Apply AFTER V5 migration 001_paid_execution_ledger.sql, on a controlled DB.
ALTER TABLE shor_payment_claims ADD COLUMN IF NOT EXISTS result_json JSONB;
CREATE INDEX IF NOT EXISTS shor_claims_claimed_at_idx ON shor_payment_claims (claimed_at);
-- Existing unique(network,tx_id) and unique(network,challenge_hash) in V5 are mandatory.
-- DB service account needs INSERT, SELECT and UPDATE, no schema DDL privileges.
