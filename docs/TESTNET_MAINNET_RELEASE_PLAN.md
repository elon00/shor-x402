# SHOR x402 — TESTNET & MAINNET RELEASE PLAN

**Project:** SHOR x402 Post-Quantum Autonomous Agent Commerce Hub  
**Chain:** Algorand  
**Document Type:** Formal Release Gates & Operational Deployment Plan  
**Date:** 2026-11-03  
**Status:** DRAFT — PRODUCTION PAYMENT HOLD ACTIVE  

---

## 1. Network Release Gate Architecture

To ensure strict network separation and prevent funds loss or accidental mainnet transactions, SHOR x402 enforces an explicit two-stage promotion model:

```mermaid
flowchart LR
    Local["Stage 0: Local Reality & DB Gates (76/76 Tests Passing)"]
    TestnetGate{"Stage 1: TestNet Gate"}
    MainnetGate{"Stage 2: MainNet Gate"}
    ProdRelease["Production Live Execution Enabled"]

    Local --> TestnetGate
    TestnetGate -->|"TestNet Verification Evidence"| MainnetGate
    MainnetGate -->|"Postgres DB + Facilitator Creds + User Approval"| ProdRelease
```

---

## 2. Stage 1 — Algorand TestNet Deployment Plan

### Target Environment Parameters
* **Network Name:** Algorand TestNet
* **CAIP-2 Identifier:** `algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=`
* **Settlement Asset:** Circle TestNet USDC ASA `10458941`
* **TestNet Recipient:** `TZ6ARRVMQEGRVMBISK7FYDPGIVYBLRSZUUS4A4DGPIEWDNJJ3KUSO66HUE`
* **Indexer Node:** `https://testnet-idx.algonode.cloud`
* **Algod Node:** `https://testnet-api.algonode.cloud`

### Prerequisites for TestNet Release
1. [ ] **Dispenser Funding:** Ensure TestNet recipient account (`TZ6ARR...`) holds at least 0.2 ALGO for minimum balance requirement (MBR) and ASA opt-in.
2. [ ] **ASA Opt-In:** Confirm `TZ6ARR...` has executed an asset opt-in transaction for TestNet USDC ASA `10458941`.
3. [x] **Facilitator TestNet Route:** Verified reachable via `https://x402.goplausible.xyz` (HTTP 200).
4. [x] **Local PostgreSQL Concurrency:** Verified on physical PostgreSQL 16 container (`shor-real-db-*`): 10 racing workers -> 1 success, 9 duplicate rejections (0 skipped, 0 fail).

### TestNet Automated Staging Preflight
Execute non-destructive preflight check anytime:
```bash
npm run testnet:preflight
```
Current status: **4/5 Checks PASS** (Algod node round verified, USDC ASA verified, Facilitator accessible, CAIP-2 binding verified; Merchant account dispenser funding pending).

---

## 3. Stage 2 — Algorand MainNet Promotion Gates

### Strict Safety Hold Policy
The production payment execution endpoint (`/api/v1/shor/execute`) is guarded by a fail-closed `SECURITY_HOLD` (HTTP 503). This hold **MUST NOT** be lifted until the following 6 gates have passed:

| Gate | Requirement | Current Verification Status | Action Needed |
| :---: | :--- | :---: | :--- |
| **G1** | Pure-TS NIST FIPS 203/204 PQC Keygen & Signatures | **PASS** | Completed locally (10/10 PASS) |
| **G2** | Classical Conway & QUBO Exact Solver Integration | **PASS** | Completed locally (10/10 PASS) |
| **G3** | Local Reality & Negative Test Suites Passing | **PASS** (76/76 tests) | Completed locally (51 std + 10 PQC + 15 adv) |
| **G4** | Managed PostgreSQL Instance Provisioned | **LOCAL PASS / CLOUD BLOCKED** | Local concurrency verified on Postgres 16; Cloud DB (Neon/Supabase) needed for prod |
| **G5** | Facilitator Webhook & API Secret Configured | **BLOCKED** | Register merchant account on GoPlausible and inject `X402_FACILITATOR_API_KEY` |
| **G6** | Separate Explicit User Production Authorization | **BLOCKED** | Explicit user sign-off required |

---

## 4. MainNet Operational Deployment Checklist

When Gate G4, G5, and G6 are satisfied, follow this controlled deployment procedure:

### Step 1: Database Migration
```sql
-- Connect via psql using restricted application role:
\i db/001_paid_execution_ledger.sql
\i db/002_result_journal.sql
```

### Step 2: Secret Injection (Hosting Provider Environment)
* Configure environment variables in Netlify / Cloud hosting dashboard (never in git):
  * `DATABASE_URL=postgres://app_user:strong_password@prod-db.internal:5432/shor_prod?sslmode=require`
  * `X402_FACILITATOR_API_KEY=live_fac_...`
  * `ALGORAND_NETWORK=algorand-mainnet`
  * `OFFICIAL_RECIPIENT_ADDRESS=TPLMGGFNG64LKOCKVB7ZMQH5AMSNMV4GLI7GCH4FY2XQEKSIGB77O6LCFM`

### Step 3: Removing Security Hold
Only when G1–G6 are verified, replace lines in `server.ts` and `netlify/functions/shor-execute.ts`:
```ts
// From:
return res.status(503).json({ status: 'SECURITY_HOLD', ... });

// To:
const claimResult = await claimSettledPayment(dbPool, {
  expected: challenge,
  supplied: challenge,
  txId: verification.txId,
  settlementProof: facilitatorProof,
  verifySettlement: verifyFacilitatorProof,
});
if (!claimResult.claimed) {
  return res.status(409).json({ error: 'Transaction already claimed or invalid' });
}
```

---

## 5. Rollback Plan & Emergency Kill Switch

If any anomaly occurs in production (e.g. database latency spike, replay detection alert, indexer desync):
1. **Immediate API Kill Switch:** Set environment variable `SHOR_KILL_SWITCH=true` to instantly return HTTP 503 for all paid executions.
2. **Re-engage Security Hold:** Redeploy commit with active `SECURITY_HOLD` via Netlify CLI:
   ```bash
   netlify rollback
   ```
3. **Database Audit:** Run verification query:
   ```sql
   SELECT state, count(*) FROM shor_payment_claims GROUP BY state;
   ```
4. **No Fund Risk:** Because merchant never signs outgoing transactions (payments are inbound USDC to merchant address), merchant wallet cannot be drained by payment pipeline bugs.
