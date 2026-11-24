# SHOR x402: Production and market release plan (V6)

## What V6 really accomplishes
- Adds PostgreSQL-backed, single-use claim insertion with database-enforced unique constraints from V5. The atomic SQL is an implementation, not yet wired to the Netlify function.
- Adds challenge-binding and proof-shape validation plus local negative tests.
- Adds a real PostgreSQL 10-concurrent-claims integration test; must run against a **disposable test database with V5 and V6 migrations applied** and `pg` dependency installed. Never point the test at production; the test deletes its own inserted row.
- Leaves the paid execution hold enabled. Without trusted facilitator verification, accepting a user-supplied `settlementProof` object would be insecure. NEVER wire a request-body object directly into claimSettledPayment.

## Production implementation milestones
1. **Migration and secrets**: create dedicated managed Postgres instance, backup/restore, TLS, least-privilege runtime role; apply V5 `db/001_paid_execution_ledger.sql` then V6 `db/002_result_journal.sql` under controlled migration account. Pin `pg` version, configure only server-side secrets.
2. **Facilitator adapter**: verify the current Algorand x402 facilitator protocol and authenticated receipt format from official docs, ensure receipt is issued by facilitator, check network/asset/recipient/amount/nonce/expiry/HTTP resource. A mainnet indexer axfer alone is not equivalent to x402 facilitator acceptance. Add signed/authenticated settlement evidence before calling durable module.
3. **Challenge source-of-truth**: generate challenge server-side with cryptographic randomness, persist nonce/resource/expiry and prevent changes, enforce one valid resource/price per payment and merchant. Include wallet-approval paths.
4. **Atomic consumption**: both `server.ts` and `netlify/functions/shor-execute.ts` must share durable claim service; never use in-process Set. Determine exactly-once *delivery semantics*, retries, error outcomes and transaction lifecycles. Do not enable either route until both are wired and tests pass.
5. **Real execution**: execute actual Conway B3/S23 and QUBO engine from request inputs with bounded CPU/time and deterministic result hashes. No static fabricated performance or "verified" flags. For AI model calls ensure configured providers and usage budgets.
6. **Adversarial E2E**: valid 402/payment/200, wrong network/asset/payTo/price/request, expired challenge, 10-way concurrency, network failure, re-used historical transfer, invalid PQC proof, facilitator timeouts, rollback/recovery. Keep logs and explorer links.
7. **Release**: CodeQL, test coverage, dependency/SBOM, secret scanning, audit, deploy staging/TestNet, verify real transaction and paid result, then human approval for paid MainNet activity.
8. **Operational readiness**: monitor payment latency and failure rates, alerts, incident plan, backups, restore drill, on-call/support contact, deployment pin and rollback, API quotas, privacy and terms.
9. **Market readiness**: verified service demo, published price/service-level terms, clear value proposition, documented costs and unit economics, wallet UX, developer docs, customer support and actual customer feedback. No promises of hackathon eligibility after closing date.

## Release status
Passing local URS 10/10 is **not** production certification. This module's local concurrency test uses an in-memory fake only to assert the SQL call contract. The separate `postgres-real-concurrency` test provides real-db evidence *only when run*. There is no on-chain deployment or payment performed by V6.

Official resources: https://algorand.co/global-x402-challenge ; https://developer.algorand.org/ ; https://x402.org/ ; https://docs.netlify.com/ ; https://www.postgresql.org/docs/current/ ; https://docs.github.com/en/code-security/code-scanning/introduction-to-code-scanning/about-code-scanning-with-codeql .
