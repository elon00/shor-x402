# 👑 THE CREATOR

## Universal Real-Only Engineering, Security, Compliance & Agentic Development Rulebook

### Version 1.0 — Applies to EVERY project

---

# 0. CREATOR PRINCIPLE

The Creator exists to build systems that are:

REAL.
VERIFIABLE.
SECURE.
REPRODUCIBLE.
LEGALLY RESPONSIBLE.
TRANSPARENT.
AUDITABLE.

No AI, AI agent, developer, workflow, CI pipeline or deployment system
may convert an unimplemented feature into a simulated feature and then
present that simulation as real.

If something cannot be implemented or verified:

> STATUS = NOT IMPLEMENTED

Never hide the limitation.

---

# 1. UNIVERSAL REALITY RULE

Every feature MUST have one of these statuses:

- REAL
- PARTIAL
- SIMULATION
- NOT IMPLEMENTED
- BLOCKED

A feature may be called REAL only when:

1. Real implementation exists.
2. Required external service/network/device is actually invoked.
3. Automated tests pass.
4. Negative/security tests pass.
5. Independent verification succeeds.
6. Documentation accurately describes reality.
7. Evidence can be reproduced.

If any requirement is missing:

> DO NOT CALL IT REAL.

---

# 2. ZERO-FABRICATION RULE

Production code MUST NOT fabricate:

* blockchain transactions
* transaction IDs
* wallet balances
* token balances
* block confirmations
* payment confirmations
* signatures
* cryptographic proofs
* PQC attestations
* quantum results
* AI execution results
* oracle data
* market data
* security scores
* compliance status
* audit results
* user identities
* deployment status

Forbidden examples:

- `Math.random()` as security material or transaction hashes.
- Hard-coded balance.
- Hard-coded transaction ID.
- `"verified": true` without independent verification.
- `"settled": true` without blockchain evidence.
- Fake cryptographic signature.
- Fake PQC certificate.
- Fake quantum result.
- Fake blockchain confirmation.

---

# 3. SIMULATION POLICY

Simulation is allowed ONLY when explicitly isolated and labelled:

- SIMULATION
- DEMO
- TEST
- LOCAL_ONLY
- MOCK

A simulation MUST:

1. Be isolated from production code paths.
2. Never use Mainnet credentials.
3. Never claim real-world settlement.
4. Never produce evidence presented as real.
5. Never be enabled silently in production.
6. Be clearly documented.

Production must fail closed if a required real dependency is unavailable.

Example:

REAL payment unavailable
↓
DO NOT simulate payment
↓
RETURN failure / NOT_IMPLEMENTED

---

# 4. BLOCKCHAIN REALITY

Every blockchain claim MUST identify:

* blockchain/network
* chain ID / CAIP-2 identifier
* wallet/address
* transaction ID
* contract/application ID where applicable
* token/asset ID where applicable
* block/round
* confirmation/finality
* explorer evidence

Blockchain data MUST come from:

* authoritative node
* official RPC
* official indexer
* trusted, documented infrastructure

Frontend state is NEVER blockchain evidence.

---

# 5. TESTNET / MAINNET RULE

Default development sequence:

LOCAL → UNIT TESTS → INTEGRATION TESTS → TESTNET → SECURITY REVIEW → LIMITED MAINNET → PRODUCTION

Never claim Mainnet deployment because Testnet deployment succeeded.

Never claim a smart contract is deployed without its real deployment
transaction/application/contract evidence.

Mainnet deployment requires:

* explicit network configuration
* verified address
* verified deployment transaction
* explorer evidence
* rollback/emergency plan where applicable

---

# 6. WALLET & ASSET SECURITY

Never request:

* seed phrase
* mnemonic
* private key

Never store private keys in source code.
Never log secrets.

Wallet balances MUST come from the actual network.

Transactions MUST be signed by:

* user's wallet
* hardware wallet
* secure wallet provider
* explicitly authorized server signer

Never fabricate a successful transaction.

---

# 7. PAYMENT RULE

Payment is considered successful ONLY after independent verification.

Verify, as applicable:

* network
* transaction ID
* sender
* recipient
* asset
* exact amount
* decimals
* timestamp
* confirmation/finality
* nonce/idempotency
* expiration
* replay status

Client-provided `paid=true` is NEVER evidence.

A fake/invalid/replayed payment MUST be rejected.

---

# 8. x402 / HTTP PAYMENT RULE

For payment-gated services:

- NO PAYMENT → HTTP 402
- INVALID PAYMENT → REJECT
- WRONG NETWORK → REJECT
- WRONG ASSET → REJECT
- WRONG AMOUNT → REJECT
- WRONG RECIPIENT → REJECT
- REPLAY → REJECT
- VALID VERIFIED PAYMENT → EXECUTE SERVICE

The frontend MUST NEVER determine payment success.

---

# 9. TOKEN SUPPLY RULE

"Unlimited supply" is NOT a default.

Every token project MUST explicitly document:

* total supply model
* initial supply
* emission mechanism
* mint authority
* burn mechanism
* inflation rate
* maximum/minimum constraints
* distribution
* treasury
* vesting
* governance
* upgrade authority

If unlimited supply is intentionally chosen:

> TOTAL SUPPLY = UNLIMITED

must be accompanied by a transparent emission/inflation policy.

The AI MUST NOT silently change a finite token supply to unlimited.
The AI MUST NOT claim scarcity when unlimited minting exists.

---

# 10. SMART CONTRACT RULE

Every smart contract requires:

* source code
* compiler/version
* deployment network
* deployment address
* deployment transaction
* tests
* access-control review
* reentrancy review where relevant
* overflow/underflow review
* authorization review
* upgradeability review
* emergency controls
* event/log verification

Admin privileges MUST be documented.

---

# 11. PQC RULE

PQC means REAL post-quantum cryptography.

If claiming:

- ML-KEM
- ML-DSA
- SLH-DSA
- or another standardized PQC algorithm

the implementation MUST use a genuine standards-compliant implementation.

Do NOT create:

* fake keys
* fake signatures
* random hexadecimal strings
* hashes pretending to be signatures
* length checks pretending to be verification

Required:

* known-answer tests
* positive verification tests
* negative verification tests
* interoperability tests where possible
* library/version disclosure
* security assumptions

If unavailable:

> PQC = NOT IMPLEMENTED / SPECIFICATION BENCHMARK ONLY

Never simulate PQC and call it production cryptography.

---

# 12. QUANTUM RULE

A classical algorithm is NOT automatically quantum.

If claiming real quantum execution, provide:

* quantum backend/provider
* circuit/job identifier where available
* execution evidence
* result
* reproducibility information

If using a simulator:

> QUANTUM SIMULATION

must be clearly displayed.

Never call simulator output:

REAL QUANTUM HARDWARE RESULT.

---

# 13. CONWAY AI AUTOMATON RULE

Conway's Game of Life or a Conway-based automaton may be used as:

* simulation
* deterministic computation
* emergent-system research
* visualization
* agent/environment model

But it MUST NOT automatically be described as:

* blockchain consensus
* cryptographic security
* quantum computation
* economic proof
* AI intelligence

unless those properties are independently demonstrated.

Every emergent behavior claim requires reproducible experiments.

---

# 14. WEB 4.0 RULE

"Web 4.0" is an architectural/product designation, not proof of a technical capability.

A Web 4.0 claim MUST identify actual components such as:

* autonomous agents
* machine-to-machine interaction
* identity
* permissions
* decentralized infrastructure
* real-time data
* programmable payments
* user-controlled assets
* verifiable execution

Marketing language MUST NOT substitute for implementation.

---

# 15. AI AGENT RULE

AI agents may:

* inspect
* plan
* code
* test
* refactor
* deploy
* monitor

ONLY within explicitly granted permissions.

Agents MUST:

1. Read this rulebook first.
2. Inspect before modifying.
3. Preserve evidence.
4. Never fabricate results.
5. Never modify tests merely to make them pass.
6. Never hide errors.
7. Never silently downgrade real functionality into simulation.
8. Stop when a required dependency is unavailable.
9. Report limitations.
10. Request human approval for irreversible Mainnet actions.

---

# 16. SECURITY RULE

Every project MUST consider:

* authentication
* authorization
* secrets
* dependency vulnerabilities
* injection
* SSRF
* XSS
* CSRF where applicable
* replay attacks
* rate limiting
* DoS
* access control
* privilege escalation
* wallet security
* cryptographic misuse
* API abuse
* data leakage
* logging of sensitive information

Security tests MUST include negative cases.

---

# 17. LEGAL / REGULATORY RULE

The project MUST NOT claim:

* legally compliant
* licensed
* registered security
* approved financial product
* guaranteed investment
* guaranteed return
* regulated status

unless independently verified.

Before launching tokens, financial services, prediction markets, custody, payments or securities-like products:

1. Identify target jurisdictions.
2. Identify applicable laws.
3. Obtain appropriate professional legal advice.
4. Document compliance assumptions.
5. Publish risk disclosures.
6. Do not market uncertain legal status as established fact.

AI MUST NOT provide false legal certainty.

---

# 18. MARKETING RULE

Marketing MUST NEVER exaggerate technical capability.

Every public claim must map to evidence.

- Claim: "Real Mainnet payment" → Evidence: transaction ID + network + explorer + reproducible verification.
- Claim: "Post-quantum security" → Evidence: actual PQC algorithm + implementation + tests.
- Claim: "AI autonomous agent" → Evidence: actual agent execution path + tools + permissions + logs.
- Claim: "Quantum" → Evidence: actual quantum backend/job.

NO EVIDENCE → NO CLAIM.

---

# 19. GLOBAL STANDARD MARKETING RULE

For every project create:

* one-line vision
* technical elevator pitch
* problem statement
* solution
* architecture
* real-world use cases
* measurable metrics
* security model
* roadmap
* token/economic model if applicable
* demo
* documentation
* evidence links
* known limitations
* risk disclosure

Never manufacture users, partnerships, transactions, TVL, revenue, adoption, audits, grants, investors, or community size.

---

# 20. TESTING RULE

Required layers:

UNIT → INTEGRATION → END-TO-END → SECURITY → NETWORK → PRODUCTION-SMOKE

Tests MUST include both POSITIVE CASES and NEGATIVE CASES.

Minimum blockchain/payment negative tests:

* invalid transaction
* wrong network
* wrong asset
* wrong amount
* wrong recipient
* wrong sender
* replay
* expired payment
* malformed proof
* unavailable node
* indexer failure

Tests may use mocks ONLY in isolated unit-test environments.
Production tests MUST exercise real integrations where appropriate.

---

# 21. REALITY GATE

Every project MUST contain `REALITY_GATE.md` and a machine-executable reality check (`reality-gate.mjs`).

The gate MUST fail if critical prohibited patterns are detected.

---

# 22. CI/CD RULE

Deployment pipeline:

AUDIT → TYPECHECK → TEST → SECURITY → REALITY GATE → BUILD → DEPLOY → POST-DEPLOY SMOKE TEST → EVIDENCE

If a critical gate fails:

> DEPLOYMENT = BLOCKED

Never turn a failed test into success by changing the test without proving the underlying implementation is correct.

---

# 23. PRODUCTION FAIL-CLOSED RULE

If a critical real dependency is unavailable:

DO NOT simulate it, bypass it, return success, or fabricate data.
Instead, return a safe error, mark the feature unavailable, log a non-sensitive diagnostic, and alert the operator.

---

# 24. EVIDENCE LEDGER

Every production feature SHOULD have an evidence record:

FEATURE | STATUS | VERSION | NETWORK | DEPENDENCY | TEST | RESULT | TRANSACTION/CONTRACT ID | EXPLORER/EXTERNAL EVIDENCE | DATE | LIMITATIONS

Evidence must be reproducible.

---

# 25. AI SELF-AUDIT BEFORE EVERY RELEASE

The agent MUST ask:

1. Is this actually implemented?
2. Is it independently verifiable?
3. Did I accidentally create a simulation?
4. Did I hard-code a success value?
5. Did I fabricate blockchain data?
6. Did I fabricate cryptographic evidence?
7. Did I label a simulator as quantum?
8. Did I test failure cases?
9. Did security tests pass?
10. Does documentation match the code?
11. Is the legal/financial claim supported?
12. Can another engineer reproduce the result?

If any answer is NO:

> RELEASE BLOCKED.

---

# 26. FINAL CREATOR REPORT FORMAT

Every AI agent MUST finish with:

- **REAL**: List genuinely implemented and verified features.
- **PARTIAL**: List incomplete features.
- **SIMULATION**: List simulations, including legitimate test simulations.
- **NOT IMPLEMENTED**: List missing capabilities.
- **SECURITY**: List vulnerabilities and unresolved risks.
- **LEGAL**: List claims requiring professional/legal verification.
- **TESTS**: List commands and results.
- **BLOCKCHAIN EVIDENCE**: List real network, transaction, contract/application and explorer evidence.
- **DEPLOYMENT**: List actual deployment environment and status.
- **CHANGES**: List files changed.
- **REMAINING WORK**: List exact next actions.
- **FINAL STATUS**: REALITY_GATE: PASS / FAIL | PRODUCTION: READY / NOT READY | CONFIDENCE: HIGH / MEDIUM / LOW

---

# 27. THE CREATOR'S FINAL COMMAND

Build what is real.
Prove what is real.
Clearly label what is simulated.
Never hide what is missing.
Never fabricate evidence.
Never sacrifice security for appearance.
Never sacrifice truth for marketing.

If reality cannot yet be achieved:

> SAY SO.

That is not failure.
Pretending it is real is failure.

# END — THE CREATOR