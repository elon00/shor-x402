# SHOR x402 — Post-Quantum Autonomous Agent Commerce on Algorand

[![Algorand](https://img.shields.io/badge/Algorand-MainNet-00D2C4?logo=algorand&logoColor=white)](https://algorand.co)
[![Challenge](https://img.shields.io/badge/x402-Global%20Challenge-8B5CF6)](https://algorand.co/global-x402-challenge)
[![PQC NIST Standard](https://img.shields.io/badge/PQC-FIPS%20203%20%26%20204%20(ML--DSA%20%2F%20ML--KEM)-7C3AED)](https://csrc.nist.gov/pubs/fips/204/final)
[![Protocol](https://img.shields.io/badge/HTTP%20Status-402%20Payment%20Required-F59E0B)](https://x402.org)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Deploy with Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/elon00/shor-x402)

> **SHOR x402** is a quantum-resilient, autonomous economic protocol and agent commerce command hub built natively on the **Algorand Blockchain**. It unifies **Hierarchical AI Task Planning**, **11-State Conway Cellular Automaton State Transitions**, **QUBO/QAOA Combinatorial Service Optimization**, **Wire-Level HTTP 402 Machine-to-Machine Settlements**, and **NIST FIPS 203/204 Post-Quantum Cryptography (ML-DSA-65 & ML-KEM-768)** into a production-grade Web 4.0 operating platform.

---

## 🏆 Global x402 Challenge — Verified MainNet Status

| Requirement | Live Status | Verified MainNet Data |
| :--- | :---: | :--- |
| **Live Web App** | 🟢 **ACTIVE** | [https://shorx402.netlify.app](https://shorx402.netlify.app) |
| **MainNet CAIP-2** | 🟢 **ACTIVE** | `algorand:wGHE2pwdvd7S12BL5Fa+PRx3TF3QXDYODnakNVUtvpU=` |
| **Official Recipient** | 🟢 **ACTIVE** | `TPLMGGFNG64LKOCKVB7ZMQH5AMSNMV4GLI7GCH4FY2XQEKSIGB77O6LCFM` |
| **Confirmed MainNet TxID** | 🟢 **CONFIRMED** | [`XHIXSYQUYBCTQKYGNOMXGVKON7UVZDTRRBUMFFGEIY4UWB6RQX7A`](https://allo.info/tx/XHIXSYQUYBCTQKYGNOMXGVKON7UVZDTRRBUMFFGEIY4UWB6RQX7A) (5.00 USDC) |
| **USDC Opt-In TxID** | 🟢 **CONFIRMED** | [`OYX6EJ7AOLZHEBNWED4OBWYVO63IVTWQGPERK5K5BC2KA2LUHJDQ`](https://allo.info/tx/OYX6EJ7AOLZHEBNWED4OBWYVO63IVTWQGPERK5K5BC2KA2LUHJDQ) |
| **Primary Orchestrator** | 🟢 **LIVE** | `POST https://shorx402.netlify.app/api/v1/shor/execute` |
| **Bazaar Discovery** | 🟢 **LIVE JSON** | `GET https://shorx402.netlify.app/.well-known/x402-bazaar.json` |
| **Facilitator** | 🟢 **ACTIVE** | `https://x402.goplausible.xyz` |
| **Challenge Tag** | 🟢 **ACTIVE** | `x402-global-challenge` |

---

## 🛒 Machine-Readable Bazaar Discovery (`x402-bazaar.json`)

The platform exports the standard machine-readable discovery document according to the official x402 Bazaar protocol specification:

- **Root Document**: [`x402-bazaar.json`](./x402-bazaar.json)
- **Live HTTP Endpoint**: `https://shorx402.netlify.app/.well-known/x402-bazaar.json`
- **Fallback Alias**: `https://shorx402.netlify.app/.well-known/x402.json`

```json
{
  "x402Version": "1.0.0",
  "version": "1.0.0",
  "name": "SHOR x402 — Post-Quantum Autonomous Agent Commerce Hub",
  "type": "ai-orchestrator",
  "category": "ai-orchestrator",
  "tags": [
    "x402-global-challenge",
    "algorand",
    "post-quantum",
    "qubo",
    "orchestrator",
    "usdc",
    "fips-204"
  ],
  "provider": {
    "name": "SHOR Labs / Martin Luther",
    "website": "https://github.com/elon00/shor-x402",
    "payTo": "TPLMGGFNG64LKOCKVB7ZMQH5AMSNMV4GLI7GCH4FY2XQEKSIGB77O6LCFM",
    "network": "algorand-mainnet",
    "caip2": "algorand:wGHE2pwdvd7S12BL5Fa+PRx3TF3QXDYODnakNVUtvpU="
  },
  "primaryEndpoint": {
    "path": "/api/v1/shor/execute",
    "resource": "/api/v1/shor/execute",
    "method": "POST",
    "pricing": {
      "costUsdc": 0.005,
      "amount": "0.005000",
      "currency": "USDC",
      "assetId": 31566704
    },
    "facilitator": "https://x402.goplausible.xyz",
    "challengeTag": "x402-global-challenge"
  }
}
```

---

## ⚡ Primary Orchestrator Flow (`POST /api/v1/shor/execute`)

```
AI Agent / Client
       │
       ▼  POST /api/v1/shor/execute
   ┌───────────────────────────────────────────────┐
   │ HTTP/1.1 402 Payment Required                 │
   │ WWW-Authenticate: x402 realm=..., tag=...     │
   │ Cost: 0.005 USDC (ASA 31566704 MainNet)       │
   └──────────────────────┬────────────────────────┘
                          │
                          ▼  Agent signs & settles USDC
   ┌───────────────────────────────────────────────┐
   │ GoPlausible Facilitator & Algorand MainNet    │
   │ Settlement Confirmed on Round 64472613+       │
   └──────────────────────┬────────────────────────┘
                          │
                          ▼  Deliver with Auth Proof
   ┌───────────────────────────────────────────────┐
   │ HTTP/1.1 200 OK                               │
   │ • Verified Settlement Receipt                 │
   │ • 11-State Conway Automaton State Transition  │
   │ • QUBO Hamiltonian Optimization Result       │
   │ • NIST FIPS 204 ML-DSA-65 Signature           │
   └───────────────────────────────────────────────┘
```

---

## 🚀 Getting Started & Local Development

### Prerequisites
- **Node.js**: v20.x or v22.x LTS
- **npm** or **pnpm**
- **Git**

### Installation

```bash
# 1. Clone repository
git clone https://github.com/elon00/shor-x402.git
cd shor-x402

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```

---

## 🛡️ Security, Governance & Circuit Breakers

- **Human-in-the-Loop Thresholds**: Autonomous execution halts and requests manual confirmation if single request cost $> \$0.03\text{ USDC}$ or provider risk rating $> 0.25$.
- **Emergency Circuit Breaker**: One-click kill switch to instantly freeze all automated payments and settlement dispatches.
- **Spending Caps**: Strict daily budget limits ($2.50 USDC default) with hard transaction caps ($0.06 USDC per request).
- **Post-Quantum Agility**: NIST FIPS 204 ML-DSA-65 post-quantum hybrid signatures.

---

## 📜 License

Distributed under the **Apache-2.0 License**. See `LICENSE` for more information.

**SHOR x402** — *Pioneering the Post-Quantum Autonomous Machine Economy on Algorand.*