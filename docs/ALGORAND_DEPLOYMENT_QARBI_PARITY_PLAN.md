# SHOR x402 — Algorand Deployment & QARBI Engineering Parity Plan

Date: 2026-11-02
Scope: SHOR stays Algorand-native. QARBI PR #15 is an Arbitrum engineering reference only.
Status: PLAN ONLY. No chain transaction, key operation, funded execution, or production release authorized.

## Preservation contract
- Preserve all existing files, features, UI, endpoints, chains, documentation and deployment evidence.
- No auto-copy of Solidity/EVM contracts into Algorand; use AVM/ARC-native implementations if new on-chain logic is justified.
- No CBDC integration. Never use an Arbitrum RPC, chain ID, wallet or address as an Algorand production default.
- Never use real money, private keys or production credentials in CI.

## Observed repository baseline
- TypeScript/React/Vite; Netlify functions for bazaar, verify and shor-execute.
- Algorand Algod/Indexer endpoints, asset-transfer USDC settlement, x402 discovery.
- PQC and Conway/QUBO modules, multi-wallet UI, evidence and reality gates.
- Current README contains mainnet transaction and site claims that require independent verification.
- No independently verified new Algorand smart contract deployment was established in this review.

## Priority 0: Correctness and security (fail closed)
1. src/utils/pqcCrypto.ts: remove digest-only acceptance from verifyPqcSignature; verify full ML-DSA-65 signature against full message and public key. Reject malformed hex, wrong length, missing signing key and signature/key mismatches. Do not label a hash as an Ed25519 signature. Add tamper, replay, wrong-key tests.
2. src/services/algorandClient.ts: remove synthetic live rounds, timestamps and network hashes from RPC failure paths. Return explicit unavailable state; no fabricated data in production.
3. netlify/functions/verify.ts + paid executor: bind challenge nonce, payer, recipient, ASA, required integer micro-USDC amount, resource, expiry and TxID in a durable, atomic settlement journal. Ensure one TxID cannot authorize multiple requests; reject old/duplicate/malformed TxIDs. Never lower the minimum via client-supplied minAmountUsdc.
4. .github/workflows/deploy.yml: remove continue-on-error on deployment; eliminate npm-ci fallback that hides lockfile integrity failures. Require CI and scoped environment approval before production.
5. .github/workflows/algorand-validation.yml: replace curl ... || echo ... with exit-code-preserving health checks; verify chain identification and return an explicit failure if RPC unavailable.
6. Scrutinize any post-payment execution and AI-agent side effects. Enforce spending caps, role separation, timeout, SSRF/input validation, idempotency, audit journal and human approval above threshold.

## Verification matrix
- Unit: TS typings; PQC keygen-sign-verify, invalid key/signature, tampered payload, unsupported algorithm, RNG/seed safety.
- x402: unpaid=402; paid authorized=200; unconfirmed, wrong ASA/network/receiver/amount, invalid challenge, duplicate TxID, expired nonce, concurrent replay all denied.
- Algorand: API timeout/429/5xx, outage and network mismatch fail closed; account balance strictly live.
- Property/adversarial: double-spend and concurrent requests; integer-denomination round trips; malformed encodings.
- Integration: local Netlify/API gateway; sandbox wallet signing; Algorand testnet actual transaction, read-after-write receipt and explorer verification.
- CI: npm ci; npm run lint; npm run test; npm run test:nist; npm run audit:crypto; npm run verify:reality; npm audit --audit-level=high; npm run build:all. Verify actual process exit codes and upload logs.
- External: independent review and operational/legal launch approval before mainnet.

## Deployment gates and evidence
G0 clean checkout/lockfile + no secrets committed; G1 all tests green; G2 adversarial tests green; G3 testnet funding authorized, wallet-signed test transactions with TxIDs, round, genesis hash and asset evidence; G4 API+frontend staging with a durable settlement backend; G5 human approval for mainnet; G6 canary with capped funds and rollback.
No mandatory new smart contract unless a documented on-chain state machine requires one. Existing x402 payment acceptance by ASA transfer is a blockchain integration, not a new deployed Algorand app.
Evidence: commit SHA, workflow-run URLs, exact commands and logs, transaction explorer links, genesis hash, asset ID, receipt validation, spend totals, approver and rollback results. Never certify from README alone.

## QARBI PR #15 parity (behavior not blockchain code)
- Adopt production truthfulness/anti-simulation gates and PR-only, fail-closed release policy.
- Adapt least-privilege agent execution, payment accounting, wallet consent, cryptographic tests, reproducible evidence and bounded automation.
- Keep QARBI's EVM addresses/Solidity/Arbitrum Sepolia entirely separate from SHOR's Algorand ASA/AVM.
- PR #15 was closed and not merged; selectively implement verified controls, do not merge its branch.

## Execution order
A. Read-only audit and CI; B. isolated security patches with regression tests; C. staging end-to-end; D. authorized Algorand testnet real receipts; E. third-party review and mainnet release approval.
No deployment in this plan PR.
