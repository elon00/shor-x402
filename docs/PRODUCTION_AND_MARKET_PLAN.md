# SHOR x402 — production and market release plan (V5)

**Release state: BLOCKED**, even if all local code checks pass. Existing paid execution has a safety hold. This package advances one real engineering component: canonical Algorand challenge binding, negative tests, and a reviewed SQL ledger schema. These are NOT wired into a live payment API by this installer.

## P0 critical implementation
1. Issue durable, nonce-bound HTTP 402 challenges persisted before delivery; bind CAIP-2 network, USDC asset ID, recipient, amount, resource, nonce, expiry, requester and optional request-body hash. Never trust a client-supplied challenge as the source of truth.
2. Select a documented **Algorand-compatible** x402 facilitator and confirm exact API version, verification endpoint, settlement API, signature scheme, merchant onboarding, and credentials. Never infer facilitator settlement solely from an Algorand indexer lookup. Enforce confirmed recipient, asset, amount, network, payer (where required), challenge and chain finality.
3. Operate a durable DB with atomic unique transaction consumption shared across all Netlify/server instances. Write and execute concurrency replay tests against the real datastore. Provision secrets through Netlify/managed secret storage, not GitHub.
4. Execute the actual Conway or QUBO function on validated bounded input; no fixed result, no fabricated latency or PQC attestation. Only report successful ML-DSA verification if the full signed envelope, trusted public key and message binding verify. Do not label ML-DSA + a digest as true Ed25519 hybrid.
5. Keep paid endpoint fail-closed (503 for attempted paid fulfillment) until ALL previous controls independently pass. Do not disable the hold based only on unit tests.

## P1 testnet proof
- Configure Algorand TestNet CAIP-2, test USDC asset ID and opted-in test recipient independently from mainnet. Do not use the mainnet address/asset defaults silently.
- Obtain approved faucet resources, execute genuine 402 -> wallet authorization -> facilitator verify+settle -> database claim -> computed service -> receipt.
- Validate negative paths: no pay, wrong chain/asset/recipient/amount, forged signature, stale nonce, reused tx, concurrent tx reuse, facilitator outage, retry/idempotency, service failure, double-submit, cancelled wallet.
- Store transaction receipt, explorer link, actual deployed commit, CI run, redacted logs, and release decision.

## P2 deployment and operations
- Staging CI (node/npm pinned, npm ci, test:nist, verify:reality, npm audit, new claim tests, CodeQL and secret scans).
- Production service health and API synthetic tests; durable DB backups/restore, alerts (failed settlement, replay attack, API latency, error rate), TLS/CORS/input hardening, incident response, on-call/support, rollback drill, data retention and policy.
- MainNet requires separate explicit approval, secrets, budget, reviewed transaction amounts, production infrastructure evidence, and post-deploy smoke checks. x402 API can use Algorand USDC transfers; do not assume an Algorand application ID is required unless a native contract is implemented.

## P3 real market readiness
- Published working demo, product value proposition, target customer/ICP, differentiated paid service, documented SLA, clear price per API call, payment receipts, pricing margin analysis (USDC charged minus facilitator/RPC/DB/compute/network/support costs), refund and dispute policies, privacy policy, terms, support email, abuse/rate limits, analytics/retention, legal/compliance review, and at least initial real customer validation.
- Competition note: official Algorand Global x402 Challenge closed 2026-10-06. Existing hackathon docs draft PR: https://github.com/elon00/shor-x402/pull/6 . New changes are for product maturity or future challenges, not new eligibility.

## Definition of done (strict)
Local tests PASS + independent code/security review + real durable DB/claim tests PASS + facilitator-attributed testnet paid service E2E PASS + production deployment/monitoring/rollback PASS + legal/market evidence. Without every required evidence item, verdict is NOT YET PRODUCTION OR MARKET READY, not 10/10.

QARBI Arbitrum repository is not modified, merged, or deployed by this package. No CBDC integration.
