-- PostgreSQL migration PROPOSAL; review, back up and apply via controlled deploy.
-- Not automatically applied by the PowerShell runner.
CREATE TABLE IF NOT EXISTS shor_payment_claims (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  network TEXT NOT NULL,
  tx_id VARCHAR(64) NOT NULL,
  challenge_hash CHAR(64) NOT NULL,
  resource TEXT NOT NULL,
  recipient TEXT NOT NULL,
  asset_id BIGINT NOT NULL,
  amount_micro BIGINT NOT NULL CHECK (amount_micro > 0),
  facilitator_receipt JSONB NOT NULL,
  state TEXT NOT NULL DEFAULT 'CLAIMED' CHECK (state IN ('CLAIMED','EXECUTED','FAILED')),
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  executed_at TIMESTAMPTZ,
  UNIQUE(network, tx_id),
  UNIQUE(network, challenge_hash)
);
-- Application MUST use one atomic INSERT with ON CONFLICT DO NOTHING RETURNING id,
-- in a database transaction, only AFTER independently verifying a genuine
-- facilitator settlement and strict request/challenge binding. If zero rows are
-- returned, reject the already-consumed transaction rather than deliver output.
-- Store final result atomically and implement explicit failed-execution handling.
