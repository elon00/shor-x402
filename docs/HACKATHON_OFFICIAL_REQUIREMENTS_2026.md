# SHOR x402 — Official Global x402 Challenge requirements and implementation matrix

Research date: 2026-11-02. Source of truth: Algorand Foundation, not the repository's own claims.

## Competition status (IMPORTANT)
- The Algorand Global x402 Challenge closed on **October 6, 2026**, per the Algorand winners announcement published October 22, 2026.
- The hackathon homepage says registration is closed and shows finalists/winners. No new entry is assumed eligible; work here targets standards conformance and future demos, not a retroactive submission.
- Official links:
  - https://algorand.co/global-x402-challenge
  - https://algorand.co/blog/the-x402-global-challenge-is-live-how-to-build-submit-your-entry
  - https://algorand.co/blog/the-global-x402-challenge-winners-are-here

## Official requirements mapped to SHOR
| Requirement | Current checked-in evidence | Missing evidence or next action |
|---|---|---|
| A real, valuable x402 paid API; unpaid call returns HTTP 402 | Netlify shor-execute function and /api/v1/shor/execute route declared | Capture real HTTP 402 response and one genuine authorized paid result |
| Testnet full request -> pay -> settle -> paid response | Testnet URLs, CAIP-2 and USDC 10458941 in .env.example | Test a separate Testnet payTo opted in/funded with dispenser test assets and retain all receipts |
| Mainnet public HTTPS endpoint | https://shorx402.netlify.app and health route declared; user independently saw HTTP 200 | Verify exact resource-route challenge and payment flow live, not merely health |
| Mainnet USDC ASA 31566704 and designated payTo | README and server/netlify settings; historic confirmed axfer transaction | Link a new legitimate facilitator-attributed paid request to receipt and delivery without recycling prior payments |
| GoPlausible x402 facilitator must verify/settle | Facilitator URL configured | Confirm payment route actually goes through facilitator; indexer lookup alone does not establish facilitator settlement |
| Bazaar discovery enabled and tagged x402-global-challenge | / .well-known/x402-bazaar.json route and challengeTag declared | Verify current Bazaar catalog registration, resource description, proper discovery extension and merchant attribution |
| One domain per merchant account; share same payTo only for endpoints under that domain | A single SHOR domain/payTo configured | Keep domain/payTo consistent across new endpoints; don't reuse merchant payTo on other domains |
| Orchestrator entry: own paid endpoint first, real downstream paid services, completed synthesized reply | Orchestrator claims in README | If registering as orchestrator, produce real downstream facilitator payments; otherwise represent SHOR as Standard Entry |
| Actual usage and leaderboard visibility | Historic transfer referenced | Verify counted facilitator volume; never treat a manual USDC transfer as ranked activity |
| Submission and Electric Capital public-repository listing | Public GitHub repository | Historic September 30 submission deadline has passed; no evidence of SHOR submission or Electric Capital listing |
| Project metadata and informative catalog | README, metadata.json, Bazaar configuration | Verify title/logo/description/well-known files, route-specific descriptions, working demo video and public source |
| Production security | Local tests and npm audit reported green on user's local repair branch | Fix durable atomic replay protection, exact challenge binding, real cryptographic attestation, non-static Conway/QUBO before accepting money |

## Engineering architecture — preserve network boundaries
SHOR remains an Algorand x402 API product (USDC ASA payments, AlgoNode/indexer, GoPlausible facilitator, native wallet UX). QARBI PR #15 is a **reference for evidence-driven workflows, security and UX patterns only**. No Arbitrum contract, address, chain ID, Solidity or Stylus deployment is imported or changed.

## Required deployment dependencies and operational resources
- Node/npm pinned in CI; TypeScript, Vite/React, Express/Netlify Functions as currently declared.
- Algorand MainNet/TestNet node and indexer API; chain-specific CAIP-2 and asset IDs in environment; no silent fallback between networks.
- Algorand-native user wallet and separately authorized service signing credentials; never commit recovery phrases, private keys or API secrets.
- Facilitator endpoint for merchant verification/settlement, Bazaar metadata and explorer receipts. Confirm API versions and exact middleware format against current Algorand developer examples before changing protocol code.
- Durable transactional datastore with uniqueness constraints for payment consumption and nonce/challenge expiry; atomic compare-and-set/transaction claim, immutable outcome journal.
- Official resources: https://algorand.co/blog/the-x402-global-challenge-is-live-how-to-build-submit-your-entry and https://developer.algorand.org/ and https://github.com/algorandfoundation/x402-demo (verify repository URL before adoption).

## Release gates (all must independently pass)
1. Baseline npm ci, lint, build, existing tests and npm audit --audit-level=moderate.
2. Real 402 response, valid payment verified via the facilitator, valid paid 200 response, and the actual service output retained in evidence; negative unpaid/malformed/expired/wrong-asset/wrong-recipient tests.
3. Persistent replay defense with multi-instance concurrent double-claim negative test; request/nonce/price/recipient/network binding.
4. Real ML-DSA-65 full signature verification, tamper/forgery negatives, without digest-only acceptance or hardcoded “verified”.
5. Real Conway and QUBO execution derived from inputs (not fixed response templates); explicit AI unavailability behavior.
6. Testnet and Mainnet proofs kept separate; no spending or mainnet deployment from CI without explicit authorization.
7. Verify public HTTPS, catalog discovery, facilitator-attributed usage and supportable claims.
8. Manual security review and deployment signoff; mark status BLOCKED otherwise.

## Development order
P0: remove false paid-execution claims, add fail-closed test coverage, persistent payment ledger and cryptographic binding.
P1: Testnet x402 facilitator end-to-end with actual computed response, wallet compatibility, receipt explorer and metadata.
P2: Mainnet rollout only after approvals, secrets provisioned securely, spending caps, monitoring and rollback plan.
P3: Documentation, demo, adoption metrics for future hackathons; do not promise placement in this closed challenge.

## Reference to QARBI
https://github.com/elon00/QARBI/pull/15 (closed and unmerged as checked earlier). Reuse policy concepts only.
