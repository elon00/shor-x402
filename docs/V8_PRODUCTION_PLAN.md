# SHOR Algorand production and market launch: acceptance contract

## What V8 installs
- `src/engines/paid-computation.mjs` real bounded, deterministic Conway Game of Life and exact exhaustive QUBO solver (1-20 variables).
- `tests/paid-computation.test.mjs` adversarial tests including limit and malformed input checks.
- It does **not** call the module from the existing paid API, alter existing source, deploy, send funds, or remove the paid-execution safety hold.

## P0 — verified settlement
- Use actual facilitator `verify` / `settle` implementation and authenticated responses (not user-supplied JSON attestations). Verify against current facilitator official API spec.
- Bind network, challenge ID, nonce, expiry, resource, recipient, ASA, amount, payer and transaction ID; reject stale/mismatched payments.
- Initialize real PostgreSQL on a protected service, apply reviewed migrations, connect BOTH `server.ts` and `netlify/functions/shor-execute.ts` to the same database with least-privilege credentials.
- Concurrently submit identical payment evidence across multiple server instances. Exactly one consumption and exactly one fulfillment. Establish crash consistency and retries/failed execution resolution.
- Define the network-specific USDC ASA and recipient separately for TestNet and MainNet. Never accept a transfer from the other network.

## P1 — execution and TestNet deployment
- Wire genuine computation with request validation, resource/time limits, deterministic outputs, and failure recovery into authorized paid endpoint, guarded by successful atomic settlement claim.
- Execute fresh Algorand TestNet payment with funded, opt-in wallet. Capture TxID, explorer, confirmation, 402 challenge, settlement proof, first response, second replay response, and concurrency logs.
- Deploy off-chain Netlify/Express service via protected environment CI pipeline. Algorand payment service **does not inherently require** a new AVM smart contract. If contract deployment is desired, add reviewed TEAL/Puya contract, approval program, state schema, typed client, and on-chain App ID.

## P1 — MainNet gated release
- Require all TestNet checks, independent security review, production backup/restore trial, metrics and alerts, secret management, release approval, and explicit funding permission. Deploy same reviewed release with MainNet configuration and audit evidence. Never auto-send MainNet funds in a setup script.

## P2 — market readiness
- Published pricing, payment terms, refund/failed execution policy, public API and SDK docs, wallet onboarding, rate limits, support response process, privacy/terms, operational SLOs, monitoring, and validated customer demand. Claims must match measured functionality.

## Evidence rules
- Unit tests != paid E2E. Indexer reachability != contract deployment. Historical USDC transfer != current release. Netlify webpage reachable != payment functionality. A project's internal 10/10 score != independent security certification.
- `NOT_YET_PRODUCTION_READY` until all above gates have evidence.
