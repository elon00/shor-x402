# SHOR x402 — REALITY GATE v1.0

## MISSION
Make the project real, reproducible, secure, and independently verifiable on the Algorand Blockchain.

## ABSOLUTE RULES
Never simulate a production capability. The following are FORBIDDEN in production paths:
- `Math.random()` used to fabricate blockchain transaction IDs or balances
- Fake transaction IDs (e.g. `TX_MAINNET_...`)
- Hard-coded wallet balances (e.g. `algoBalance: 25.0`)
- Hard-coded confirmations or fake rounds
- Mock payment verification (`isPaid = proof.length > 20`)
- Hard-coded `"verified": true` without real Algorand Node/Indexer lookup
- Pretending classical computation is real quantum hardware

If a capability cannot be implemented for real:
`STATUS = NOT_IMPLEMENTED` or `STATUS = SIMULATION_RESEARCH` (clearly labeled).

---

## ⛓️ BLOCKCHAIN REALITY
Every Algorand payment MUST be independently verified against an authoritative Algorand node/indexer (`https://mainnet-idx.algonode.cloud` or `https://mainnet-api.algonode.cloud`).

Verification MUST check:
1. **Network CAIP-2**: `algorand:wGHE2pwdvd7S12BL5Fa+PRx3TF3QXDYODnakNVUtvpU=`
2. **Transaction ID**: Must exist on-chain.
3. **Sender**: Real funded Algorand account.
4. **Receiver**: Must match official recipient `TPLMGGFNG64LKOCKVB7ZMQH5AMSNMV4GLI7GCH4FY2XQEKSIGB77O6LCFM`.
5. **Asset ID**: Circle USDC (ASA ID `31566704` on MainNet).
6. **Amount**: Minimum required fee ($\ge 0.005000\text{ USDC}$ = $5,000\text{ micro-USDC}$).
7. **Confirmed Round**: Must be confirmed on a real block round ($> 0$).
8. **Replay Protection**: Transaction ID cannot be reused across multiple nonces.

---

## 💳 x402 REALITY
- **Unpaid request**: Returns `HTTP/1.1 402 Payment Required` with `WWW-Authenticate` header.
- **Invalid / Fake payment**: Returns `HTTP/1.1 402 Payment Required` (REJECTED).
- **Wrong asset / Wrong recipient / Insufficient amount**: REJECTED.
- **Valid on-chain verified payment**: Returns `HTTP/1.1 200 OK` with real on-chain execution receipt.

---

## 💼 WALLET REALITY
- Wallet balances MUST come directly from the connected blockchain via live RPC/Indexer queries.
- Transactions MUST be signed by the user's wallet (Lute, Pera, Kibisis).
- NEVER request, store, log, or transmit seed phrases/private keys.

---

## 🔬 RESEARCH & PQC TRANSPARENCY
- Combinatorial algorithms (Simulated Annealing QUBO) are real classical algorithms and labeled as such.
- NIST FIPS 204 (ML-DSA-65) and FIPS 203 (ML-KEM-768) structures must use real cryptographic primitives (Web Crypto API / SHA-512 / Ed25519 standard) or be explicitly marked as research benchmarks.