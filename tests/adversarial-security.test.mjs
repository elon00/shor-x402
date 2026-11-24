import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, createHash } from 'node:crypto';
import { canonicalClaim, claimHash, matchClaim } from '../src/security/payment-claims.mjs';
import { claimSettledPayment, recordExecutionResult } from '../src/security/durable-settlement.mjs';
import {
  verifyFacilitatorProof,
  OFFICIAL_NETWORKS,
  OFFICIAL_USDC_ASAS,
  OFFICIAL_FACILITATOR_URL,
} from '../src/security/facilitator-verifier.mjs';
import {
  generatePqcKeyPair,
  createPqcHybridSignature,
  verifyPqcSignature,
} from '../src/utils/pqcCrypto.ts';
import { runConway, solveQubo } from '../src/engines/paid-computation.mjs';

const VALID_TX_ID = 'RQSQ6LBTNQEGROLRSKRCJPLVLUD6JOGAVY3QUTDDYGYBBHGAKDSA';
const RECIPIENT_ADDR = 'TPLMGGFNG64LKOCKVB7ZMQH5AMSNMV4GLI7GCH4FY2XQEKSIGB77O6LCFM';

function createMockChallenge(overrides = {}) {
  return {
    network: OFFICIAL_NETWORKS.mainnet,
    assetId: OFFICIAL_USDC_ASAS.mainnet,
    recipient: RECIPIENT_ADDR,
    amountMicro: 5000,
    resource: '/api/v1/shor/execute',
    nonce: randomBytes(32).toString('hex'),
    expiresAt: Date.now() + 120000,
    ...overrides,
  };
}

function createMockProof(challenge, txId = VALID_TX_ID, overrides = {}) {
  return {
    verified: true,
    settled: true,
    txId,
    network: challenge.network,
    assetId: challenge.assetId,
    recipient: challenge.recipient,
    amountMicro: challenge.amountMicro,
    challengeHash: claimHash(challenge),
    confirmedRound: 64493959,
    facilitator: OFFICIAL_FACILITATOR_URL,
    ...overrides,
  };
}

// 1. Duplicate transaction claims & parallel race conditions
test('ADVERSARIAL: Concurrent duplicate claims allow exactly one winner', async () => {
  const challenge = createMockChallenge();
  const proof = createMockProof(challenge);
  let claimedCount = 0;
  
  // Simulated atomic ledger double testing ON CONFLICT semantics
  const fakePool = {
    connect: async () => ({
      query: async (sql) => {
        if (sql.startsWith('BEGIN') || sql.startsWith('COMMIT') || sql.startsWith('ROLLBACK')) {
          return { rowCount: 0, rows: [] };
        }
        if (sql.includes('INSERT INTO shor_payment_claims')) {
          if (claimedCount === 0) {
            claimedCount++;
            return { rowCount: 1, rows: [{ id: 101 }] };
          }
          return { rowCount: 0, rows: [] }; // Rejected duplicate
        }
        return { rowCount: 0, rows: [] };
      },
      release() {},
    }),
  };

  const results = await Promise.all(
    Array.from({ length: 5 }, () =>
      claimSettledPayment(fakePool, {
        expected: challenge,
        supplied: challenge,
        txId: VALID_TX_ID,
        settlementProof: proof,
        verifySettlement: async () => true,
      })
    )
  );

  const successfulClaims = results.filter((r) => r.claimed);
  assert.equal(successfulClaims.length, 1, 'Only one atomic claim may succeed under concurrency');
});

// 2. Reused historical payments without challenge binding
test('ADVERSARIAL: Reused historical payment rejected when challenge hash does not match', async () => {
  const challengeA = createMockChallenge();
  const challengeB = createMockChallenge(); // Different nonce
  const staleProofFromA = createMockProof(challengeA);

  const res = await verifyFacilitatorProof(staleProofFromA, challengeB, VALID_TX_ID);
  assert.equal(res.verified, false);
  assert.match(res.error, /challenge hash/i);
});

// 3. Wrong network (e.g. TestNet proof supplied for MainNet challenge)
test('ADVERSARIAL: Wrong network rejected', async () => {
  const mainnetChallenge = createMockChallenge();
  const testnetProof = createMockProof(mainnetChallenge, VALID_TX_ID, {
    network: OFFICIAL_NETWORKS.testnet,
  });

  const res = await verifyFacilitatorProof(testnetProof, mainnetChallenge, VALID_TX_ID);
  assert.equal(res.verified, false);
  assert.match(res.error, /network mismatch/i);
});

// 4. Wrong recipient (diverted payment)
test('ADVERSARIAL: Diverted payment to wrong recipient rejected', async () => {
  const challenge = createMockChallenge();
  const wrongRecipientProof = createMockProof(challenge, VALID_TX_ID, {
    recipient: 'TZ6ARRVMQEGRVMBISK7FYDPGIVYBLRSZUUS4A4DGPIEWDNJJ3KUSO66HUE',
  });

  const res = await verifyFacilitatorProof(wrongRecipientProof, challenge, VALID_TX_ID);
  assert.equal(res.verified, false);
  assert.match(res.error, /recipient/i);
});

// 5. Wrong asset (e.g. 0 ALGO or wrong ASA)
test('ADVERSARIAL: Wrong asset ID rejected', async () => {
  const challenge = createMockChallenge();
  const wrongAssetProof = createMockProof(challenge, VALID_TX_ID, {
    assetId: 999999, // wrong ASA
  });

  const res = await verifyFacilitatorProof(wrongAssetProof, challenge, VALID_TX_ID);
  assert.equal(res.verified, false);
  assert.match(res.error, /asset ID mismatch/i);

  const malformedAssetProof = createMockProof(challenge, VALID_TX_ID, {
    assetId: 0, // 0 is invalid ASA ID
  });
  const resMalformed = await verifyFacilitatorProof(malformedAssetProof, challenge, VALID_TX_ID);
  assert.equal(resMalformed.verified, false);
  assert.match(resMalformed.error, /asset ID/i);
});

// 6. Underpayment
test('ADVERSARIAL: Underpayment in micro-units rejected', async () => {
  const challenge = createMockChallenge({ amountMicro: 5000 });
  const underpaidProof = createMockProof(challenge, VALID_TX_ID, {
    amountMicro: 4999,
  });

  const res = await verifyFacilitatorProof(underpaidProof, challenge, VALID_TX_ID);
  assert.equal(res.verified, false);
  assert.match(res.error, /insufficient payment/i);
});

// 7. Malformed / NaN / Infinity amounts
test('ADVERSARIAL: Malformed, NaN, and Infinity amounts rejected', async () => {
  const challenge = createMockChallenge();

  const nanProof = createMockProof(challenge, VALID_TX_ID, { amountMicro: NaN });
  const resNan = await verifyFacilitatorProof(nanProof, challenge, VALID_TX_ID);
  assert.equal(resNan.verified, false);

  const infProof = createMockProof(challenge, VALID_TX_ID, { amountMicro: Infinity });
  const resInf = await verifyFacilitatorProof(infProof, challenge, VALID_TX_ID);
  assert.equal(resInf.verified, false);

  const negProof = createMockProof(challenge, VALID_TX_ID, { amountMicro: -5000 });
  const resNeg = await verifyFacilitatorProof(negProof, challenge, VALID_TX_ID);
  assert.equal(resNeg.verified, false);
});

// 8. Expired challenge
test('ADVERSARIAL: Expired challenge rejected', async () => {
  const expiredChallenge = createMockChallenge({
    expiresAt: Date.now() - 5000,
  });
  const proof = createMockProof(expiredChallenge);

  const res = await verifyFacilitatorProof(proof, expiredChallenge, VALID_TX_ID);
  assert.equal(res.verified, false);
  assert.match(res.error, /expired/i);
});

// 9. Invalid nonce
test('ADVERSARIAL: Nonce tampering detected by canonical claim matcher', () => {
  const c1 = createMockChallenge({ nonce: 'a'.repeat(64) });
  const c2 = createMockChallenge({ nonce: 'b'.repeat(64) });
  assert.equal(matchClaim(c1, c2), false);

  // Malformed nonce (not 64 hex characters)
  assert.throws(() => canonicalClaim({ ...c1, nonce: 'short' }), /invalid secure nonce/i);
});

// 10. Forged facilitator proof (unsettled / missing signature)
test('ADVERSARIAL: Unsettled status rejected', async () => {
  const challenge = createMockChallenge();
  const unsettled = createMockProof(challenge, VALID_TX_ID, { settled: false });
  const res = await verifyFacilitatorProof(unsettled, challenge, VALID_TX_ID);
  assert.equal(res.verified, false);
  assert.match(res.error, /not settled/i);
});

// 11. Invalid PQC signature (tampered bit / wrong key)
test('ADVERSARIAL: Tampered ML-DSA-65 signature fails verification', () => {
  const seed = new Uint8Array(32).fill(0x42);
  const keyPair = generatePqcKeyPair('ML-DSA-65', seed);
  const sigResult = createPqcHybridSignature(VALID_TX_ID, keyPair, 0.005, 'srv-shor-orchestrator');

  // Verify valid signature passes
  const validCheck = verifyPqcSignature(
    sigResult.hybridSignature,
    VALID_TX_ID,
    keyPair.publicKey,
    0.005,
    'srv-shor-orchestrator'
  );
  assert.equal(validCheck.valid, true);

  // Bit-flipped signature must fail
  const parts = sigResult.hybridSignature.split('.');
  const rawSig = parts[2];
  const flippedSig = (rawSig[0] === 'a' ? 'b' : 'a') + rawSig.slice(1);
  const corruptedEnvelope = `${parts[0]}.${parts[1]}.${flippedSig}`;

  const corruptedCheck = verifyPqcSignature(
    corruptedEnvelope,
    VALID_TX_ID,
    keyPair.publicKey,
    0.005,
    'srv-shor-orchestrator'
  );
  assert.equal(corruptedCheck.valid, false);

  // Altered payload parameter (e.g. wrong amount) must fail
  const wrongAmtCheck = verifyPqcSignature(
    sigResult.hybridSignature,
    VALID_TX_ID,
    keyPair.publicKey,
    0.010, // different amount
    'srv-shor-orchestrator'
  );
  assert.equal(wrongAmtCheck.valid, false);
});

// 12. Database outage & rollback (fail-closed)
test('ADVERSARIAL: Database outage fails closed without granting claim', async () => {
  const challenge = createMockChallenge();
  const proof = createMockProof(challenge);

  const brokenPool = {
    connect: async () => ({
      query: async (sql) => {
        if (sql.startsWith('BEGIN')) return {};
        throw new Error('Connection terminated unexpectedly');
      },
      release() {},
    }),
  };

  await assert.rejects(
    claimSettledPayment(brokenPool, {
      expected: challenge,
      supplied: challenge,
      txId: VALID_TX_ID,
      settlementProof: proof,
      verifySettlement: async () => true,
    }),
    /Connection terminated unexpectedly/
  );
});

// 13. State transition integrity: result recorded only on CLAIMED
test('ADVERSARIAL: recordExecutionResult requires valid claim ID and state transition', async () => {
  let updatedState = null;
  const pool = {
    connect: async () => ({
      query: async (sql, params) => {
        if (sql.includes('UPDATE shor_payment_claims')) {
          updatedState = 'EXECUTED';
          return { rowCount: 1, rows: [{ id: params[0] }] };
        }
        return { rowCount: 0, rows: [] };
      },
      release() {},
    }),
  };

  const ok = await recordExecutionResult(pool, 42, { conway: 'done', qubo: 'done' });
  assert.equal(ok, true);
  assert.equal(updatedState, 'EXECUTED');

  // Invalid claim ID rejected
  await assert.rejects(recordExecutionResult(pool, -1, {}), /invalid claim ID/i);
});

// 14. Incorrect Conway and QUBO inputs
test('ADVERSARIAL: Conway rejects non-binary and irregular grids', () => {
  assert.throws(() => runConway([[0, 2], [1, 0]]), /binary matrix/i);
  assert.throws(() => runConway([[0, 1], [0]]), /rectangular/i);
  assert.throws(() => runConway([], 5), /invalid grid height/i);
});

test('ADVERSARIAL: QUBO rejects oversized matrices (>20 vars) and NaN', () => {
  const bigMatrix = Array.from({ length: 25 }, () => Array(25).fill(0.1));
  assert.throws(() => solveQubo(bigMatrix), /requires a finite square matrix of size 1\.\.20/i);

  const nanMatrix = [[1, NaN], [0, 1]];
  assert.throws(() => solveQubo(nanMatrix), /requires a finite square matrix/i);
});
