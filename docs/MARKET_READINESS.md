# SHOR x402 — MARKET READINESS SPECIFICATION

**Project:** SHOR x402 Post-Quantum Autonomous Agent Commerce Hub  
**Document Type:** Business Architecture, Unit Economics & Operational Governance  
**Date:** 2026-11-03  
**Status:** DRAFT SPECIFICATION — EXTERNAL PILOTS PENDING  

---

## 1. Product Value Proposition

SHOR x402 enables autonomous AI agents to negotiate, pay for, execute, and verify specialized compute and data services without human intervention, subscription lock-in, or credit card dependencies.

### Key Differentiators
1. **HTTP 402 Native Protocol:** Seamless RFC 7235 / CAIP-2 payment handshake.
2. **Sub-Cent Micro-Settlements:** 0.005 USDC per orchestration request on Algorand with ~0.001 ALGO (<$0.0003) network fees.
3. **NIST FIPS 204 Lattice Security:** ML-DSA-65 post-quantum signed execution receipts.
4. **Autonomous Service Discovery:** Machine-readable `.well-known/x402-bazaar.json` service directory.

---

## 2. Unit Economics & Fee Breakdown

### Cost Structure per 1,000 Orchestration Requests ($5.00 Gross Revenue)

| Cost Component | Unit Rate | Cost per 1,000 Reqs | Margin Impact |
| :--- | :--- | :---: | :--- |
| **Gross Inbound Settlement** | $0.005 USDC / call | **$5.0000** | Revenue |
| **Algorand Network Fee (Payer)** | 0.001 ALGO (~$0.0002) | Paid by Client | $0.0000 |
| **Facilitator Settlement Fee** | ~0.5% (GoPlausible) | -$0.0250 | -0.5% |
| **Managed DB & Storage** | ~$0.0001 / query | -$0.1000 | -2.0% |
| **Serverless Compute (Netlify/Edge)** | ~$0.0002 / invocation | -$0.2000 | -4.0% |
| **AlgoNode / Nodely Indexer RPC** | Free Tier / Standard | -$0.0500 | -1.0% |
| **Estimated Net Operating Profit** | — | **$4.6250** | **92.5% Gross Margin** |

---

## 3. Published Service Catalog & Pricing

| Service ID | Service Name | Price (USDC) | Compute Engine |
| :--- | :--- | :---: | :--- |
| `srv-shor-orchestrator` | SHOR Autonomous Agent Orchestrator | $0.005 | QUBO Optimizer + Conway Cellular Automaton |
| `srv-weather-hyperlocal` | Planetary Radar & Hyperlocal Weather API | $0.002 | Doppler GIS Matrix |
| `srv-market-depth` | Institutional Macro & Cross-Chain Liquidity Feed | $0.008 | Algorand DEX Spread Aggregator |
| `srv-quantum-inference` | Classical QUBO Optimization Engine | $0.015 | Classical Variational Simulation |
| `srv-hpc-satellite` | Distributed Orbital Compute & GIS Matrix Engine | $0.050 | Synthetic Aperture Radar Decomposition |
| `srv-pqc-entropy` | True Quantum Entropy Seed Generator | $0.001 | High-Entropy Cryptographic Seed |

---

## 4. Service Level Objectives (SLO) & Reliability

* **API Availability:** Target 99.9% uptime for payment challenge generation and verification endpoints.
* **Settlement Finality Time:** Algorand MainNet block round finality typically 2.9 to 3.3 seconds.
* **Challenge Nonce Expiration:** Challenges expire after 10 minutes (600 seconds) to prevent stale authorization attacks.
* **Replay Protection Guarantee:** Exactly-once consumption enforced by primary key `(network, tx_id)` and `(network, challenge_hash)`.

---

## 5. Operational Governance & Support

### Support & Incident Handling
* **Support Contact:** `support@shorx402.netlify.app` / GitHub Issues (`elon00/shor-x402`)
* **Incident Response Escalation:**
  * P0 (Settlement desync / double-spend alert): Immediate kill switch activation (`SHOR_KILL_SWITCH=true`).
  * P1 (Node RPC indexer degradation): Automatic failover between AlgoNode and Nodely indexers.
  * P2 (Latency > 5000ms): Database connection pool optimization.

### Dispute & Refund Policy
* Because Algorand blockchain asset transfers are irreversible, failed execution after a valid on-chain payment triggers automatic journal state `FAILED` in `shor_payment_claims`.
* Clients may query `/api/v1/x402/claim-status?txId=<hash>` to verify execution state and receive an off-chain credit or replay retry.

---

## 6. Pilot Readiness & External Evidence Status

| Criterion | Target Requirement | Status | Note |
| :--- | :--- | :---: | :--- |
| **Technical Protocol Implementation** | x402 specification & NIST PQC verified | **PASS** | Automated gates passing locally |
| **API Documentation** | OpenAPI / Bazaar machine-readable spec | **PASS** | Available at `/.well-known/x402-bazaar.json` |
| **Privacy Policy & Terms** | Documented user data & key retention policy | **PASS** | No private keys or mnemonics stored |
| **Legal / Regulatory Review** | Regulatory compliance review for utility token payments | **PENDING** | Requires corporate legal review |
| **External Pilot Customer Onboarding** | First 3 external agent integrations completed | **BLOCKED** | Pending staging environment deployment |
| **Live Customer Production Pilot** | Production pilot with real USDC settlements | **BLOCKED** | Blocked until MainNet Gate release |
