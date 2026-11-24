# SHOR x402 — AUTONOMOUS ENGINEERING MASTER MISSION

PROJECT: C:\Users\marti\shor-x402
CHAIN: Algorand
OWNER: elon00
REPOSITORY: https://github.com/elon00/shor-x402
WEBSITE: https://shorx402.netlify.app

MISSION:
Implement and genuinely verify every remaining technical production layer.
Do actual engineering work, not just write another readiness report.
Operate on this local repository.

ABSOLUTE RULES:
1. No mock, fabricated, simulated or hallucinated success evidence.
2. Test doubles are permitted only in isolated unit tests and must be labeled as such.
3. Never claim live settlement, PQC verification or deployment without proof.
4. Never spend ALGO, USDC, cycles or other funds.
5. Never deploy to TestNet or MainNet without separate explicit authorization.
6. Never expose API keys, mnemonic phrases or private keys.
7. Do not change the unrelated QARBI repository.
8. No CBDC integrations.
9. Preserve existing code, features and uncommitted work.
10. Create a dedicated repair branch; do not force-push or overwrite main.
11. Fail closed when real infrastructure or credentials are missing.
12. Reuse existing working modules instead of creating duplicate implementations.

PHASE 1 — SOURCE INVENTORY AND REALITY AUDIT
- Inspect every relevant source file, configuration, test and workflow.
- Find V5-V8 payment security, challenge-binding, settlement and computation modules regardless of directory.
- Inspect server.ts and Netlify functions.
- Identify false attestation claims, hardcoded outputs, replay weaknesses and incorrect settlement authorization.
- Check GitHub security PR #7, but do not overwrite local changes.
- Write docs/MASTER_ARCHITECTURE.md and a blocker matrix.

PHASE 2 — DURABLE PAYMENT SECURITY
- Implement persistent PostgreSQL payment challenge storage.
- Implement transaction-backed atomic claim consumption.
- Enforce unique network + transaction identifiers.
- Bind each challenge to amount, asset, recipient, service, request, nonce and expiration.
- Reject concurrent replays across server instances.
- Implement correct claim lifecycle, retries and idempotent result delivery.
- Add actual PostgreSQL integration and concurrent adversarial tests.
- If no real test database is available, report NOT RUN, never PASS.

PHASE 3 — GENUINE ALGORAND X402
- Preserve strict network separation.
- MainNet USDC ASA 31566704.
- TestNet USDC ASA 10458941.
- Verify current network identifiers against authoritative sources.
- Implement real x402 facilitator verification using its published API contract.
- Validate settlement finality and recipient, asset, amount and challenge ownership.
- Do not authorize execution based solely on a historical transaction ID.
- Do not claim facilitator settlement from indexer lookup alone.
- Do not reuse previous payments as new authorizations.
- Never accept a client-controlled minimum payment threshold.

PHASE 4 — PQC SECURITY
- Use genuine supported cryptographic libraries and algorithms.
- Verify complete signatures, signed message and trusted public key.
- Reject fabricated signatures and digest-only authentication.
- Remove or correct misleading PQC-verified claims.
- Add adversarial cryptographic regression tests.

PHASE 5 — REAL COMPUTATION
- Integrate actual Conway and bounded QUBO engines into paid service execution.
- Validate inputs, resource limits and timeouts.
- Replace static output values with input-derived computations.
- Preserve existing functionality where it genuinely works.
- Add deterministic correctness and negative tests.
- Never claim physical quantum computation if only a classical solver runs.

PHASE 6 — BACKEND AND FRONTEND
- Secure Express and Netlify payment endpoints consistently.
- Centralize network and payment configuration.
- Add request validation, errors, idempotency and observability.
- Ensure frontend handles HTTP 402, wallet signing and final receipts correctly.
- Preserve existing UI/UX and existing supported features.

PHASE 7 — AUTOMATED QUALITY GATES
Run real:
- npm ci
- npm audit --audit-level=moderate
- TypeScript
- Production build
- Unit tests
- Regression tests
- PQC negative tests
- PostgreSQL real concurrency tests
- API smoke and integration tests
- CodeQL or compatible local SAST where available
- GitHub Actions review
- Algorand read-only verification
- Existing signed transaction evidence validation

Record commands, exit codes, commit hashes and artifacts.
A previously passing test does not certify new integrations.

PHASE 8 — NETWORK RELEASE GATES
TestNet:
- Require actual configured resources.
- Prepare independently verifiable end-to-end release evidence.
- Do not broadcast transactions without user approval.

MainNet:
- Keep production payment execution blocked until all safety gates pass.
- No automatic live release or irreversible operation.
- Prepare a deployment and rollback plan for user authorization.

PHASE 9 — MARKET READINESS
Verify pricing, transaction fees, hosting costs, API documentation,
support, privacy, service reliability, incident response,
customer onboarding, legal review and real pilot acceptance.
Mark external evidence as pending unless genuinely verified.

PHASE 10 — OUTPUT
Create:
docs/MASTER_ARCHITECTURE.md
docs/PRODUCTION_REMEDIATION.md
docs/TESTNET_MAINNET_RELEASE_PLAN.md
docs/MARKET_READINESS.md
evidence/TECHNICAL_REALITY_REPORT.json

Use status values PASS, FAIL, BLOCKED and NOT_RUN.
Never award 100/100 on unexecuted checks.

WORKING INSTRUCTIONS:
Implement safe code fixes in priority order.
Run and repair actual tests.
Repeat bounded verification after changes.
Keep working until the available authorized tasks are completed
or an external blocker is encountered.
If an external blocker remains, state exactly what is missing,
what has been implemented, and what evidence is still required.
Do not stop after producing only a plan.
Do not claim completion based on source presence alone.

START NOW.
