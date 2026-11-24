import { createHash, timingSafeEqual } from 'node:crypto';

const B32 = /^[A-Z2-7]{58}$/;
const HEX64 = /^[0-9a-f]{64}$/;
const MAX_AGE_MS = 10 * 60 * 1000;
export function canonicalClaim(c) {
  if (!c || typeof c !== 'object') throw new TypeError('payment claim required');
  const { network, assetId, recipient, amountMicro, resource, nonce, expiresAt } = c;
  if (typeof network !== 'string' || !network.startsWith('algorand:') || network.length > 100) throw new Error('invalid Algorand CAIP-2');
  if (!Number.isSafeInteger(assetId) || assetId <= 0) throw new Error('invalid asset ID');
  if (typeof recipient !== 'string' || !B32.test(recipient)) throw new Error('invalid recipient');
  if (!Number.isSafeInteger(amountMicro) || amountMicro < 1) throw new Error('invalid amount');
  if (typeof resource !== 'string' || !/^\/[a-zA-Z0-9/_-]{1,200}$/.test(resource)) throw new Error('invalid resource');
  if (typeof nonce !== 'string' || !HEX64.test(nonce)) throw new Error('invalid secure nonce');
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= 0) throw new Error('invalid expiry');
  return JSON.stringify([network, assetId, recipient, amountMicro, resource, nonce, expiresAt]);
}
export function claimHash(claim) { return createHash('sha256').update(canonicalClaim(claim)).digest('hex'); }
export function matchClaim(expected, delivered, now = Date.now()) {
  if (!Number.isSafeInteger(now)) return false;
  try {
    if (expected.expiresAt < now || expected.expiresAt > now + MAX_AGE_MS) return false;
    const e = Buffer.from(claimHash(expected), 'hex');
    const d = Buffer.from(claimHash(delivered), 'hex');
    return timingSafeEqual(e, d);
  } catch { return false; }
}
// These functions only bind request parameters. They DO NOT prove payment,
// signature validity, facilitator settlement, or single-use consumption.
