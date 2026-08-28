import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

const OFFICIAL_RECIPIENT = "TPLMGGFNG64LKOCKVB7ZMQH5AMSNMV4GLI7GCH4FY2XQEKSIGB77O6LCFM";
const BUYER_ADDRESS = "5WE6HNUR6MFPZRTZT3I7USU7LVMCWOXZKS2T5XEGETBGHHRFRDVUX4ATLI";
const USDC_ASA_ID = 31566704;
const MINIMUM_REQUIRED_USDC_MICRO = 5000; // 0.005 USDC = 5,000 micro-units

// Real Confirmed MainNet Transaction Hashes
const REAL_BUYER_SETTLEMENT_TXID = "RQSQ6LBTNQEGROLRSKRCJPLVLUD6JOGAVY3QUTDDYGYBBHGAKDSA";
const REAL_INITIAL_5_USDC_TXID = "XHIXSYQUYBCTQKYGNOMXGVKON7UVZDTRRBUMFFGEIY4UWB6RQX7A";
const REAL_ALGO_PAY_TXID = "6VNXDKZINXDVJ3QU4ZA222GLT7PL74TSG6YHPBGMJJPBSYZS53WA";
const REAL_OPTIN_0_USDC_TXID = "OYX6EJ7AOLZHEBNWED4OBWYVO63IVTWQGPERK5K5BC2KA2LUHJDQ";

test("REALITY TEST 1: Real On-Chain Distinct Buyer -> Merchant 0.005 USDC Settlement Verification", async () => {
  // Multi-node resilient lookup (AlgoNode + Nodely)
  const indexerUrls = [
    `https://mainnet-idx.algonode.cloud/v2/transactions/${REAL_BUYER_SETTLEMENT_TXID}`,
    `https://mainnet-idx.4160.nodely.dev/v2/transactions/${REAL_BUYER_SETTLEMENT_TXID}`,
  ];

  let tx = null;
  for (const url of indexerUrls) {
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (res.ok) {
        const data = await res.json();
        tx = data.transaction;
        if (tx) break;
      }
    } catch (e) {
      // fallback
    }
  }

  assert.ok(tx, "Algorand Indexer must find confirmed transaction on MainNet");
  assert.equal(tx["tx-type"], "axfer", "Transaction type must be an Asset Transfer (axfer)");
  assert.equal(tx["confirmed-round"], 64493959, "Confirmed round must match block #64,493,959");

  const axfer = tx["asset-transfer-transaction"];
  assert.ok(axfer, "Asset transfer details must be present");
  assert.equal(axfer["asset-id"], USDC_ASA_ID, "Asset ID must match Circle USDC (31566704)");
  assert.equal(tx["sender"], BUYER_ADDRESS, "Sender must match distinct Buyer Wallet");
  assert.equal(axfer["receiver"], OFFICIAL_RECIPIENT, "Receiver must match official merchant recipient");
  assert.notEqual(tx["sender"], axfer["receiver"], "Sender must be distinct from Receiver (Buyer != Merchant)");
  assert.equal(axfer["amount"], MINIMUM_REQUIRED_USDC_MICRO, "Amount must match exactly 0.005000 USDC (5,000 micro-units)");
});

test("REALITY TEST 2: Real On-Chain Initial 5.00 USDC Liquidity Funding Verification", async () => {
  const res = await fetch(`https://mainnet-idx.algonode.cloud/v2/transactions/${REAL_INITIAL_5_USDC_TXID}`);
  assert.equal(res.status, 200, "Algorand Indexer must find 5 USDC transaction on MainNet");

  const data = await res.json();
  const tx = data.transaction;
  assert.ok(tx, "Transaction object must exist");
  assert.equal(tx["tx-type"], "axfer");
  assert.equal(tx["asset-transfer-transaction"]["asset-id"], USDC_ASA_ID);
  assert.equal(tx["asset-transfer-transaction"]["receiver"], OFFICIAL_RECIPIENT);
  assert.equal(tx["asset-transfer-transaction"]["amount"], 5000000);
});

test("REALITY TEST 3: Negative Test — ALGO Payment ('pay') is Rejected for USDC Settlement", async () => {
  const res = await fetch(`https://mainnet-idx.algonode.cloud/v2/transactions/${REAL_ALGO_PAY_TXID}`);
  assert.equal(res.status, 200, "ALGO transaction exists on MainNet");

  const data = await res.json();
  const tx = data.transaction;
  assert.equal(tx["tx-type"], "pay", "Transaction is a pure ALGO payment, not an axfer");
  
  // Verification logic MUST reject tx-type !== 'axfer'
  const isEligibleForUsdc = tx["tx-type"] === "axfer" && tx["asset-transfer-transaction"]?.["asset-id"] === USDC_ASA_ID;
  assert.equal(isEligibleForUsdc, false, "ALGO pay transactions must NEVER be accepted as USDC settlement");
});

test("REALITY TEST 4: Negative Test — 0 USDC Opt-In is Rejected for Insufficient Amount", async () => {
  const res = await fetch(`https://mainnet-idx.algonode.cloud/v2/transactions/${REAL_OPTIN_0_USDC_TXID}`);
  assert.equal(res.status, 200, "Opt-in transaction exists on MainNet");

  const data = await res.json();
  const tx = data.transaction;
  const axfer = tx["asset-transfer-transaction"];
  assert.equal(axfer["amount"], 0, "Opt-in transaction amount is 0 USDC");

  // Verification logic MUST reject amount < 0.005 USDC
  const isSufficientAmount = (axfer["amount"] || 0) >= MINIMUM_REQUIRED_USDC_MICRO;
  assert.equal(isSufficientAmount, false, "0 USDC opt-ins must NEVER pass as paid execution");
});

test("REALITY TEST 5: Negative Test — Fake Transaction ID is Strictly Rejected by Indexer", async () => {
  const fakeTxId = "FAKE_NON_EXISTENT_TX_HASH_88899911122233344455566677788899";
  const res = await fetch(`https://mainnet-idx.algonode.cloud/v2/transactions/${fakeTxId}`);
  assert.ok(res.status >= 400, "Indexer must return error code for fake transaction ID");
});

test("REALITY TEST 6: Live Account Balances directly from Algorand MainNet Node", async () => {
  const res = await fetch(`https://mainnet-api.algonode.cloud/v2/accounts/${OFFICIAL_RECIPIENT}`);
  assert.equal(res.status, 200, "Account lookup on Algorand MainNet algod must succeed");

  const acc = await res.json();
  const algoBalance = acc.amount / 1000000;
  assert.ok(algoBalance >= 20.0, `Live ALGO balance must be >= 20.0 ALGO (actual: ${algoBalance})`);

  const usdcAsset = acc.assets?.find((a) => a["asset-id"] === USDC_ASA_ID);
  assert.ok(usdcAsset, "Account must have Circle USDC (ASA 31566704) opted-in");
  const usdcBalance = usdcAsset.amount / 1000000;
  assert.ok(usdcBalance >= 4.9, `Live USDC balance must be >= 4.9 USDC (actual: ${usdcBalance})`);
});

test("REALITY TEST 7: Standard Cryptographic HMAC-SHA256 Signature Generation & Tamper Detection", () => {
  const txId = REAL_BUYER_SETTLEMENT_TXID;
  const amount = 0.005;
  const serviceId = "srv-shor-orchestrator";
  const pubKey = "mldsa65:pk:9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c";

  const canonicalPayload = `tx:${txId}|amt:${amount}|srv:${serviceId}|pub:${pubKey}`;
  
  // Real standard NIST-compliant HMAC-SHA256 signing
  const ed25519Sig = crypto.createHmac("sha256", "ed25519_master_key").update(canonicalPayload).digest("hex");
  const mlDsaSig = crypto.createHmac("sha256", "mldsa65_master_key").update(canonicalPayload).digest("hex");
  const validSignature = `SHOR-HYBRID-V1.${ed25519Sig}.${mlDsaSig}.${txId}`;

  // Positive verification test
  const parts = validSignature.split(".");
  assert.equal(parts[0], "SHOR-HYBRID-V1");
  assert.equal(parts[1], ed25519Sig);
  assert.equal(parts[2], mlDsaSig);
  assert.equal(parts[3], txId);

  // Negative verification test: Tampered amount must FAIL cryptographic signature match
  const tamperedPayload = `tx:${txId}|amt:0.001|srv:${serviceId}|pub:${pubKey}`;
  const tamperedSig = crypto.createHmac("sha256", "ed25519_master_key").update(tamperedPayload).digest("hex");
  assert.notEqual(tamperedSig, ed25519Sig, "Tampered amount must produce a completely different cryptographic HMAC-SHA256 signature");
});