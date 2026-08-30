import { PqcKeyPair } from '../types';

/**
 * Demonstration cryptography metadata helpers.
 *
 * IMPORTANT: This file does not implement ML-KEM, ML-DSA, Dilithium, or
 * Ed25519 signatures. Do not use its output as cryptographic proof.
 */

function getCryptoBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error('Cryptographically secure randomness is unavailable in this runtime');
  }
  globalThis.crypto.getRandomValues(bytes);
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function computeDemoDigestHex(data: string): string {
  // Non-security checksum for deterministic UI demonstrations only.
  let hash = 0x811c9dc5;
  for (let i = 0; i < data.length; i++) {
    hash ^= data.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function generatePqcKeyPair(
  algorithm: 'ML-KEM-768' | 'ML-DSA-65' | 'Hybrid-Ed25519-Dilithium' = 'Hybrid-Ed25519-Dilithium'
): PqcKeyPair {
  const pubHex = bytesToHex(getCryptoBytes(32));
  return {
    keyId: `demo-key-${pubHex.substring(0, 12)}`,
    algorithm,
    publicKey: `DEMO-NON-CRYPTOGRAPHIC:${pubHex}`,
    publicKeyFingerprint: `DEMO:${pubHex.substring(0, 16).toUpperCase()}`,
    privateKeyPreview: 'NOT GENERATED OR STORED',
    keySizeBits: 0,
    nistSecurityLevel: 0,
    createdAt: new Date().toISOString(),
    authorizedForAgent: false,
  };
}

export function createPqcHybridSignature(
  txId: string,
  keyPair: PqcKeyPair,
  amount: number,
  serviceId: string
): {
  hybridSignature: string;
  mlDsaComponent: string;
  ed25519Component: string;
  verificationProof: string;
  quantumResistanceScore: number;
} {
  const payload = `tx:${txId}|amt:${amount}|srv:${serviceId}|pub:${keyPair.publicKey}`;
  const digest = computeDemoDigestHex(payload);
  return {
    hybridSignature: `DEMO-ATTESTATION.${digest}.${txId}`,
    mlDsaComponent: 'NOT_IMPLEMENTED',
    ed25519Component: 'NOT_IMPLEMENTED',
    verificationProof: 'DEMONSTRATION_ONLY_NOT_CRYPTOGRAPHIC_PROOF',
    quantumResistanceScore: 0,
  };
}

export function verifyPqcSignature(
  _signature: string,
  _txId: string,
  _publicKey: string,
  _amount: number = 0.005,
  _serviceId: string = 'srv-shor-orchestrator'
) {
  return {
    valid: false,
    algorithm: 'NOT_IMPLEMENTED',
    specification: 'No ML-DSA/ML-KEM/Ed25519 verification is implemented here',
    signatureDigestMatch: false,
    latticeVerificationTimeUs: 0,
    securityBits: 0,
  };
}
