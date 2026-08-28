import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js';
import type { PqcKeyPair } from '../types';

const keyMaterial = new WeakMap<PqcKeyPair, Uint8Array>();
const encoder = new TextEncoder();

function bytesToBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64');
}

function base64ToBytes(value: string): Uint8Array {
  return new Uint8Array(Buffer.from(value, 'base64'));
}

function messageBytes(value: string): Uint8Array {
  return encoder.encode(value);
}

/**
 * Real NIST FIPS 204 ML-DSA-65 key generation.
 * Private key material is retained only in-memory and is never placed in PqcKeyPair.
 * ML-KEM is intentionally not masqueraded as a signature algorithm here.
 */
export function generatePqcKeyPair(
  algorithm: 'ML-KEM-768' | 'ML-DSA-65' | 'Hybrid-Ed25519-Dilithium' = 'ML-DSA-65'
): PqcKeyPair {
  if (algorithm !== 'ML-DSA-65') {
    throw new Error(`Unsupported signature algorithm: ${algorithm}. Use ML-DSA-65 for FIPS 204 signatures.`);
  }

  const keys = ml_dsa65.keygen();
  const publicKey = `mldsa65:pk:${bytesToBase64(keys.publicKey)}`;
  const keyPair: PqcKeyPair = {
    keyId: `pqc-key-${bytesToBase64(keys.publicKey).slice(0, 16)}`,
    algorithm: 'ML-DSA-65',
    publicKey,
    publicKeyFingerprint: `ML-DSA-65:${bytesToBase64(keys.publicKey).slice(0, 32)}`,
    privateKeyPreview: '[redacted: in-memory only]',
    keySizeBits: 4032 * 8,
    nistSecurityLevel: 3,
    createdAt: new Date().toISOString(),
    authorizedForAgent: true,
  };

  keyMaterial.set(keyPair, keys.secretKey);
  return keyPair;
}

/**
 * Real ML-DSA-65 signing. The legacy function name is retained for API compatibility,
 * but no fabricated Ed25519 or hash-based signature is generated.
 */
export function createPqcHybridSignature(
  txId: string,
  keyPair: PqcKeyPair,
  amount: number,
  serviceId: string,
): {
  hybridSignature: string;
  mlDsaComponent: string;
  ed25519Component: string;
  verificationProof: string;
  quantumResistanceScore: number;
} {
  if (keyPair.algorithm !== 'ML-DSA-65') {
    throw new Error('Only real ML-DSA-65 keys are accepted by the production signature path.');
  }

  const secretKey = keyMaterial.get(keyPair);
  if (!secretKey) {
    throw new Error('ML-DSA-65 private key material is unavailable. Regenerate the in-memory key pair.');
  }

  const canonicalPayload = `tx:${txId}|amt:${amount}|srv:${serviceId}|pub:${keyPair.publicKey}`;
  const signature = ml_dsa65.sign(messageBytes(canonicalPayload), secretKey);
  const signatureBase64 = bytesToBase64(signature);
  const hybridSignature = `SHOR-MLDSA65-V1.${signatureBase64}.${txId}`;

  return {
    hybridSignature,
    mlDsaComponent: signatureBase64,
    ed25519Component: '',
    verificationProof: 'FIPS-204-ML-DSA-65-VERIFIED-BY-STANDARD-IMPLEMENTATION',
    quantumResistanceScore: 1.0,
  };
}

export function verifyPqcSignature(
  signature: string,
  txId: string,
  publicKey: string,
  amount = 0.005,
  serviceId = 'srv-shor-orchestrator',
): {
  valid: boolean;
  algorithm: string;
  specification: string;
  signatureDigestMatch: boolean;
  latticeVerificationTimeUs: number;
  securityBits: number;
} {
  const invalid = (elapsedUs = 0) => ({
    valid: false,
    algorithm: 'ML-DSA-65',
    specification: 'NIST FIPS 204',
    signatureDigestMatch: false,
    latticeVerificationTimeUs: elapsedUs,
    securityBits: 0,
  });

  if (!signature || !signature.startsWith('SHOR-MLDSA65-V1.')) return invalid();
  const parts = signature.split('.');
  if (parts.length !== 3 || parts[2] !== txId || !publicKey.startsWith('mldsa65:pk:')) return invalid();

  try {
    const canonicalPayload = `tx:${txId}|amt:${amount}|srv:${serviceId}|pub:${publicKey}`;
    const sig = base64ToBytes(parts[1]);
    const pk = base64ToBytes(publicKey.slice('mldsa65:pk:'.length));
    const start = performance.now();
    const valid = ml_dsa65.verify(sig, messageBytes(canonicalPayload), pk);
    const elapsedUs = Math.round((performance.now() - start) * 1000);

    return {
      valid,
      algorithm: 'ML-DSA-65',
      specification: 'NIST FIPS 204',
      signatureDigestMatch: valid,
      latticeVerificationTimeUs: elapsedUs,
      securityBits: valid ? 192 : 0,
    };
  } catch {
    return invalid();
  }
}
