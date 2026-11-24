import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { claimHash } from '../src/security/payment-claims.mjs';
import {
  verifyFacilitatorProof,
  OFFICIAL_NETWORKS,
  OFFICIAL_USDC_ASAS,
  OFFICIAL_FACILITATOR_URL,
} from '../src/security/facilitator-verifier.mjs';

const baseChallenge = {
  network: OFFICIAL_NETWORKS.mainnet,
  assetId: OFFICIAL_USDC_ASAS.mainnet,
  recipient: 'TPLMGGFNG64LKOCKVB7ZMQH5AMSNMV4GLI7GCH4FY2XQEKSIGB77O6LCFM',
  amountMicro: 5000,
  resource: '/api/v1/shor/execute',
  nonce: randomBytes(32).toString('hex'),
  expiresAt: Date.now() + 120000,
};

const txId = 'RQSQ6LBTNQEGROLRSKRCJPLVLUD6JOGAVY3QUTDDYGYBBHGAKDSA';
const validProof = {
  verified: true,
  settled: true,
  txId,
  network: baseChallenge.network,
  assetId: baseChallenge.assetId,
  recipient: baseChallenge.recipient,
  amountMicro: 5000,
  challengeHash: claimHash(baseChallenge),
  confirmedRound: 64493959,
  facilitator: OFFICIAL_FACILITATOR_URL,
};

test('FACILITATOR VERIFIER: Valid facilitator proof succeeds', async () => {
  const result = await verifyFacilitatorProof(validProof, baseChallenge, txId);
  assert.equal(result.verified, true);
  assert.equal(result.source, 'facilitator');
  assert.equal(result.txId, txId);
});

test('FACILITATOR VERIFIER: Rejects invalid transaction ID format', async () => {
  const result = await verifyFacilitatorProof(validProof, baseChallenge, 'short-tx');
  assert.equal(result.verified, false);
  assert.match(result.error, /invalid Algorand transaction ID/i);
});

test('FACILITATOR VERIFIER: Rejects mismatched transaction ID', async () => {
  const otherTx = 'A'.repeat(52);
  const result = await verifyFacilitatorProof(validProof, baseChallenge, otherTx);
  assert.equal(result.verified, false);
  assert.match(result.error, /mismatch/i);
});

test('FACILITATOR VERIFIER: Rejects wrong network', async () => {
  const wrongNetProof = { ...validProof, network: OFFICIAL_NETWORKS.testnet };
  const result = await verifyFacilitatorProof(wrongNetProof, baseChallenge, txId);
  assert.equal(result.verified, false);
  assert.match(result.error, /network mismatch/i);
});

test('FACILITATOR VERIFIER: Rejects wrong asset ID', async () => {
  const wrongAssetProof = { ...validProof, assetId: 999999 };
  const result = await verifyFacilitatorProof(wrongAssetProof, baseChallenge, txId);
  assert.equal(result.verified, false);
  assert.match(result.error, /asset ID mismatch/i);
});

test('FACILITATOR VERIFIER: Rejects wrong recipient', async () => {
  const wrongRecipientProof = { ...validProof, recipient: 'TZ6ARRVMQEGRVMBISK7FYDPGIVYBLRSZUUS4A4DGPIEWDNJJ3KUSO66HUE' };
  const result = await verifyFacilitatorProof(wrongRecipientProof, baseChallenge, txId);
  assert.equal(result.verified, false);
  assert.match(result.error, /recipient/i);
});

test('FACILITATOR VERIFIER: Rejects insufficient payment amount', async () => {
  const lowAmountProof = { ...validProof, amountMicro: 1000 };
  const result = await verifyFacilitatorProof(lowAmountProof, baseChallenge, txId);
  assert.equal(result.verified, false);
  assert.match(result.error, /insufficient payment/i);
});

test('FACILITATOR VERIFIER: Rejects altered challenge hash binding', async () => {
  const badHashProof = { ...validProof, challengeHash: '0'.repeat(64) };
  const result = await verifyFacilitatorProof(badHashProof, baseChallenge, txId);
  assert.equal(result.verified, false);
  assert.match(result.error, /challenge hash/i);
});

test('FACILITATOR VERIFIER: Rejects unconfirmed/unsettled proof', async () => {
  const unsettledProof = { ...validProof, settled: false };
  const result = await verifyFacilitatorProof(unsettledProof, baseChallenge, txId);
  assert.equal(result.verified, false);
  assert.match(result.error, /not settled/i);
});

test('FACILITATOR VERIFIER: Remote facilitator verification fails closed on network failure', async () => {
  const failingFetch = async () => {
    throw new Error('Connection refused');
  };
  const result = await verifyFacilitatorProof(validProof, baseChallenge, txId, {
    remoteVerify: true,
    fetchFn: failingFetch,
  });
  assert.equal(result.verified, false);
  assert.match(result.error, /facilitator connection failed/i);
});

test('FACILITATOR VERIFIER: Remote facilitator verification fails closed on HTTP 403/500', async () => {
  const badStatusFetch = async () => ({
    ok: false,
    status: 502,
    json: async () => ({}),
  });
  const result = await verifyFacilitatorProof(validProof, baseChallenge, txId, {
    remoteVerify: true,
    fetchFn: badStatusFetch,
  });
  assert.equal(result.verified, false);
  assert.match(result.error, /rejected settlement: HTTP 502/i);
});
