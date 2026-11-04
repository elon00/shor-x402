import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../netlify/functions/verify.ts', import.meta.url), 'utf8');

test('on-chain verification never grants paid execution', () => {
  assert.match(src, /authorizedForPaidExecution:\s*false/);
  assert.match(src, /facilitatorSettlementVerified:\s*false/);
  assert.match(src, /pqcSignatureVerified:\s*false/);
  assert.match(src, /onChainTransferVerified:\s*true/);
  assert.doesNotMatch(src, /pqcAttestation:\s*['"]STANDARDIZED_HYBRID_ED25519_VERIFIED/);
});
test('clients cannot override minimum amount on verification endpoint', () => {
  assert.match(src, /const minAmount = MINIMUM_REQUIRED_USDC;/);
  assert.doesNotMatch(src, /Number\(body\.minAmountUsdc/);
  assert.match(src, /amountUsdc < minAmount/);
});
test('transaction IDs constrained to Algorand base32 format', () => {
  assert.match(src, /\^\[A-Z2-7\]\{52\}\$/);
});
test('canonical Algorand MainNet network ID', () => {
  assert.match(src, /algorand:wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=/);
});
