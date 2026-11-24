import { createHash, timingSafeEqual } from 'node:crypto';

export interface PaymentClaim {
  network: string;
  assetId: number;
  recipient: string;
  amountMicro: number;
  resource: string;
  nonce: string;
  expiresAt: number;
}

const B32 = /^[A-Z2-7]{58}$/;
const HEX64 = /^[0-9a-f]{64}$/;
const MAX_AGE_MS = 10 * 60 * 1000;

/**
 * Returns canonical serialized JSON representation of a payment challenge.
 */
export function canonicalClaim(c: PaymentClaim): string {
  if (!c || typeof c !== 'object') throw new TypeError('payment claim required');
  const { network, assetId, recipient, amountMicro, resource, nonce, expiresAt } = c;
  if (typeof network !== 'string' || !network.startsWith('algorand:') || network.length > 100) {
    throw new Error('invalid Algorand CAIP-2');
  }
  if (!Number.isSafeInteger(assetId) || assetId <= 0) throw new Error('invalid asset ID');
  if (typeof recipient !== 'string' || !B32.test(recipient)) throw new Error('invalid recipient');
  if (!Number.isSafeInteger(amountMicro) || amountMicro < 1) throw new Error('invalid amount');
  if (typeof resource !== 'string' || !/^\/[a-zA-Z0-9/_-]{1,200}$/.test(resource)) {
    throw new Error('invalid resource');
  }
  if (typeof nonce !== 'string' || !HEX64.test(nonce)) throw new Error('invalid secure nonce');
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= 0) throw new Error('invalid expiry');
  return JSON.stringify([network, assetId, recipient, amountMicro, resource, nonce, expiresAt]);
}

/**
 * Derives SHA-256 hash of canonical payment challenge.
 */
export function claimHash(claim: PaymentClaim): string {
  return createHash('sha256').update(canonicalClaim(claim)).digest('hex');
}

/**
 * Constant-time challenge comparison.
 */
export function matchClaim(expected: PaymentClaim, delivered: PaymentClaim, now: number = Date.now()): boolean {
  if (!Number.isSafeInteger(now)) return false;
  try {
    if (expected.expiresAt < now || expected.expiresAt > now + MAX_AGE_MS) return false;
    const e = Buffer.from(claimHash(expected), 'hex');
    const d = Buffer.from(claimHash(delivered), 'hex');
    return timingSafeEqual(e, d);
  } catch {
    return false;
  }
}
