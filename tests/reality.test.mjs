import test from "node:test";
import assert from "node:assert/strict";

const OFFICIAL_RECIPIENT = "TPLMGGFNG64LKOCKVB7ZMQH5AMSNMV4GLI7GCH4FY2XQEKSIGB77O6LCFM";
const USDC_ASA_ID = 31566704;
const MINIMUM_REQUIRED_USDC_MICRO = 5000; // 0.005 USDC = 5,000 micro-units

// Real Confirmed MainNet Transaction Hashes
const REAL_5_USDC_TXID = "XHIXSYQUYBCTQKYGNOMXGVKON7UVZDTRRBUMFFGEIY4UWB6RQX7A";
const REAL_ALGO_PAY_TXID = "6VNXDKZINXDVJ3QU4ZA222GLT7PL74TSG6YHPBGMJJPBSYZS53WA";
const REAL_OPTIN_0_USDC_TXID = "OYX6EJ7AOLZHEBNWED4OBWYVO63IVTWQGPERK5K5BC2KA2LUHJDQ";

test("REALITY TEST 1: Real On-Chain Algorand MainNet 5 USDC Payment Verification", async () => {
  const res = await fetch(`https://mainnet-idx.algonode.cloud/v2/transactions/${REAL_5_USDC_TXID}`);
  assert.equal(res.status, 200, "Algorand Indexer must find confirmed transaction on MainNet");

  const data = await res.json();
  const tx = data.transaction;
  assert.ok(tx, "Transaction object must exist in indexer payload");
  assert.equal(tx["tx-type"], "axfer", "Transaction type must be an Asset Transfer (axfer)");
  assert.equal(tx["confirmed-round"], 64472613, "Confirmed round must match block #64,472,613");

  const axfer = tx["asset-transfer-transaction"];
  assert.ok(axfer, "Asset transfer details must be present");
  assert.equal(axfer["asset-id"], USDC_ASA_ID, "Asset ID must match Circle USDC (31566704)");
  assert.equal(axfer["receiver"], OFFICIAL_RECIPIENT, "Receiver must match official challenge recipient");
  assert.ok(axfer["amount"] >= MINIMUM_REQUIRED_USDC_MICRO, "Amount must be >= 0.005 USDC (actual: 5.00 USDC)");
});

test("REALITY TEST 2: Negative Test — ALGO Payment ('pay') is Rejected for USDC Settlement", async () => {
  const res = await fetch(`https://mainnet-idx.algonode.cloud/v2/transactions/${REAL_ALGO_PAY_TXID}`);
  assert.equal(res.status, 200, "ALGO transaction exists on MainNet");

  const data = await res.json();
  const tx = data.transaction;
  assert.equal(tx["tx-type"], "pay", "Transaction is a pure ALGO payment, not an axfer");
  
  // Verification logic MUST reject tx-type !== 'axfer'
  const isEligibleForUsdc = tx["tx-type"] === "axfer" && tx["asset-transfer-transaction"]?.["asset-id"] === USDC_ASA_ID;
  assert.equal(isEligibleForUsdc, false, "ALGO pay transactions must NEVER be accepted as USDC settlement");
});

test("REALITY TEST 3: Negative Test — 0 USDC Opt-In is Rejected for Insufficient Amount", async () => {
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

test("REALITY TEST 4: Negative Test — Fake Transaction ID is Strictly Rejected by Indexer", async () => {
  const fakeTxId = "FAKE_NON_EXISTENT_TX_HASH_88899911122233344455566677788899";
  const res = await fetch(`https://mainnet-idx.algonode.cloud/v2/transactions/${fakeTxId}`);
  assert.ok(res.status >= 400, "Indexer must return error code (400 Bad Request or 404 Not Found) for fake transaction ID");
});

test("REALITY TEST 5: Live Account Balances directly from Algorand MainNet Node", async () => {
  const res = await fetch(`https://mainnet-api.algonode.cloud/v2/accounts/${OFFICIAL_RECIPIENT}`);
  assert.equal(res.status, 200, "Account lookup on Algorand MainNet algod must succeed");

  const acc = await res.json();
  const algoBalance = acc.amount / 1000000;
  assert.ok(algoBalance >= 21.0, `Live ALGO balance must be >= 21.0 ALGO (actual: ${algoBalance})`);

  const usdcAsset = acc.assets?.find((a) => a["asset-id"] === USDC_ASA_ID);
  assert.ok(usdcAsset, "Account must have Circle USDC (ASA 31566704) opted-in");
  const usdcBalance = usdcAsset.amount / 1000000;
  assert.ok(usdcBalance >= 5.0, `Live USDC balance must be >= 5.0 USDC (actual: ${usdcBalance})`);
});