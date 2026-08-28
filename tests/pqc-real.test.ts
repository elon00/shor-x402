import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createPqcHybridSignature,
  generatePqcKeyPair,
  verifyPqcSignature,
} from '../src/utils/pqcCrypto.js';

test('ML-DSA-65 signs and verifies real FIPS-204 signatures', () => {
  const keyPair = generatePqcKeyPair('ML-DSA-65');
  const signature = createPqcHybridSignature(
    'TEST-TX-001',
    keyPair,
    0.005,
    'srv-shor-orchestrator',
  );

  const result = verifyPqcSignature(
    signature.hybridSignature,
    'TEST-TX-001',
    keyPair.publicKey,
    0.005,
    'srv-shor-orchestrator',
  );

  assert.equal(result.valid, true);
  assert.equal(result.algorithm, 'ML-DSA-65');
  assert.equal(result.specification, 'NIST FIPS 204');
  assert.ok(result.latticeVerificationTimeUs >= 0);
  assert.equal(signature.ed25519Component, '');
});

test('ML-DSA-65 rejects tampered messages', () => {
  const keyPair = generatePqcKeyPair('ML-DSA-65');
  const signature = createPqcHybridSignature(
    'TEST-TX-002',
    keyPair,
    0.005,
    'srv-shor-orchestrator',
  );

  const result = verifyPqcSignature(
    signature.hybridSignature,
    'TAMPERED-TX',
    keyPair.publicKey,
    0.005,
    'srv-shor-orchestrator',
  );

  assert.equal(result.valid, false);
});
