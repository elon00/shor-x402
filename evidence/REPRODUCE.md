# 🔬 SHOR x402 — Independent MainNet Verification & Reproduction Guide

This guide allows any independent security auditor, hackathon referee, or AI evaluation engine to independently re-query and verify the live Algorand MainNet transactions of **SHOR x402** across multiple authoritative, geographically distributed RPC providers.

---

## 1. Authoritative Blockchain Transaction Identifiers

| Transaction Type | Transaction ID (TxID) | Confirmed Block | Sender | Receiver | Amount | Asset ID |
| :--- | :--- | :---: | :--- | :--- | :---: | :---: |
| **Independent Buyer Micro-Settlement** | `RQSQ6LBTNQEGROLRSKRCJPLVLUD6JOGAVY3QUTDDYGYBBHGAKDSA` | `#64,493,959` | `5WE6HNUR...` | `TPLMGGFN...` | `0.005 USDC` | `31566704` |
| **Initial Reserve Liquidity** | `XHIXSYQUYBCTQKYGNOMXGVKON7UVZDTRRBUMFFGEIY4UWB6RQX7A` | `#64,472,613` | `QYXDGS2X...` | `TPLMGGFN...` | `5.000 USDC` | `31566704` |
| **USDC Opt-In** | `I4BKJ4PPDOHZ4LGB4O5QWQ7BHJ3JTDM27QWZDUYGFPDDM4P5TFLA` | `#64,493,561` | `5WE6HNUR...` | `5WE6HNUR...` | `0 USDC` | `31566704` |
| **Gas Reserve (ALGO)** | `6VNXDKZINXDVJ3QU4ZA222GLT7PL74TSG6YHPBGMJJPBSYZS53WA` | `#64,447,613` | `QYXDGS2X...` | `TPLMGGFN...` | `21.23 ALGO` | Native |

---

## 2. Multi-Provider Direct Terminal Query Commands

Run any of the following independent commands to fetch raw on-chain transaction bytes:

### Provider A: AlgoNode MainNet Indexer
```bash
curl -s "https://mainnet-idx.algonode.cloud/v2/transactions/RQSQ6LBTNQEGROLRSKRCJPLVLUD6JOGAVY3QUTDDYGYBBHGAKDSA"
```

### Provider B: Nodely MainNet Indexer
```bash
curl -s "https://mainnet-idx.4160.nodely.dev/v2/transactions/RQSQ6LBTNQEGROLRSKRCJPLVLUD6JOGAVY3QUTDDYGYBBHGAKDSA"
```

### Provider C: AlgoNode Algod Node Account State
```bash
curl -s "https://mainnet-api.algonode.cloud/v2/accounts/TPLMGGFNG64LKOCKVB7ZMQH5AMSNMV4GLI7GCH4FY2XQEKSIGB77O6LCFM"
```

---

## 3. Public Block Explorers

* 🔗 **Allo.info**: [https://allo.info/tx/RQSQ6LBTNQEGROLRSKRCJPLVLUD6JOGAVY3QUTDDYGYBBHGAKDSA](https://allo.info/tx/RQSQ6LBTNQEGROLRSKRCJPLVLUD6JOGAVY3QUTDDYGYBBHGAKDSA)
* 🔗 **AlgoScan**: [https://algoscan.app/tx/RQSQ6LBTNQEGROLRSKRCJPLVLUD6JOGAVY3QUTDDYGYBBHGAKDSA](https://algoscan.app/tx/RQSQ6LBTNQEGROLRSKRCJPLVLUD6JOGAVY3QUTDDYGYBBHGAKDSA)
* 🔗 **Pera Explorer**: [https://explorer.perawallet.app/tx/RQSQ6LBTNQEGROLRSKRCJPLVLUD6JOGAVY3QUTDDYGYBBHGAKDSA](https://explorer.perawallet.app/tx/RQSQ6LBTNQEGROLRSKRCJPLVLUD6JOGAVY3QUTDDYGYBBHGAKDSA)

---

## 4. SHOR Live x402 Verifier Endpoint Query

```bash
curl -X POST "https://shorx402.netlify.app/.netlify/functions/verify" \
  -H "Content-Type: application/json" \
  -d '{"transactionId":"RQSQ6LBTNQEGROLRSKRCJPLVLUD6JOGAVY3QUTDDYGYBBHGAKDSA"}'
```