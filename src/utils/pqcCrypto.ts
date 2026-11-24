import type { PqcKeyPair } from '../types.js';
import { ml_kem768 } from '@noble/post-quantum/ml-kem.js';
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { hkdf } from '@noble/hashes/hkdf.js';

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.replace(/[^0-9a-fA-F]/g, '');
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return bytes;
}

export function computeDemoDigestHex(data: string): string {
  const encoder = new TextEncoder();
  const hash = sha256(encoder.encode(data));
  return bytesToHex(hash).substring(0, 16);
}

// In-memory key store for active runtime keys
const activeKeyStorage = new Map<string, { secretKey: Uint8Array; publicKey: Uint8Array }>();

/**
 * Real NIST FIPS 203 & 204 Post-Quantum Key Generation
 */
export function generatePqcKeyPair(
  algorithm: 'ML-KEM-768' | 'ML-DSA-65' | 'Hybrid-Ed25519-Dilithium' = 'ML-DSA-65',
  seed?: Uint8Array
): PqcKeyPair {
  let pubBytes: Uint8Array;
  let secBytes: Uint8Array;
  let keySizeBits: number;
  let securityLevel: number;

  if (algorithm === 'ML-KEM-768') {
    const seedFormatted = seed ? (seed.length === 64 ? seed : new Uint8Array(64).fill(0x19)) : undefined;
    const pair = seedFormatted ? ml_kem768.keygen(seedFormatted) : ml_kem768.keygen();
    pubBytes = pair.publicKey;
    secBytes = pair.secretKey;
    keySizeBits = 1184 * 8; // 9,472 bits
    securityLevel = 3;
  } else {
    // ML-DSA-65 or Hybrid
    const seedFormatted = seed ? (seed.length === 32 ? seed : seed.slice(0, 32)) : undefined;
    const pair = seedFormatted ? ml_dsa65.keygen(seedFormatted) : ml_dsa65.keygen();
    pubBytes = pair.publicKey;
    secBytes = pair.secretKey;
    keySizeBits = 1952 * 8; // 15,616 bits
    securityLevel = 3;
  }

  const pubHex = bytesToHex(pubBytes);
  const keyId = `pqc-${algorithm.toLowerCase()}-${pubHex.substring(0, 12)}`;
  activeKeyStorage.set(keyId, { secretKey: secBytes, publicKey: pubBytes });

  const fingerprint = bytesToHex(sha256(pubBytes)).substring(0, 16).toUpperCase();

  return {
    keyId,
    algorithm,
    publicKey: pubHex,
    publicKeyFingerprint: fingerprint,
    privateKeyPreview: `${bytesToHex(secBytes.slice(0, 8))}...[${secBytes.length} bytes]`,
    keySizeBits,
    nistSecurityLevel: securityLevel,
    createdAt: new Date().toISOString(),
    authorizedForAgent: true,
  };
}

/**
 * Real ML-KEM-768 Key Encapsulation
 */
export function encapsulateKEM(publicKeyHex: string): { ciphertextHex: string; sharedSecretHex: string } {
  const pubBytes = hexToBytes(publicKeyHex);
  const result = ml_kem768.encapsulate(pubBytes);
  return {
    ciphertextHex: bytesToHex(result.cipherText),
    sharedSecretHex: bytesToHex(result.sharedSecret),
  };
}

/**
 * Real ML-KEM-768 Key Decapsulation
 */
export function decapsulateKEM(ciphertextHex: string, secretKeyHex: string): string {
  const ct = hexToBytes(ciphertextHex);
  const sk = hexToBytes(secretKeyHex);
  const ss = ml_kem768.decapsulate(ct, sk);
  return bytesToHex(ss);
}

/**
 * Real NIST FIPS 204 ML-DSA-65 Signing for Algorand x402 Service Authorization
 */
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
  const payload = `tx:${txId}|amt:${amount}|srv:${serviceId}|pub:${keyPair.publicKey.substring(0, 32)}`;
  const encoder = new TextEncoder();
  const messageBytes = encoder.encode(payload);

  const stored = activeKeyStorage.get(keyPair.keyId);
  if (!stored || stored.publicKey.length !== 1952 || stored.secretKey.length !== 4032) {
    throw new Error('ML-DSA-65 signing key unavailable or invalid; refusing fallback');
  }
  const signature = ml_dsa65.sign(messageBytes, stored.secretKey);
  const signatureHex = bytesToHex(signature);
  const digest = bytesToHex(sha256(messageBytes));
  return {
    hybridSignature: `PQC-HYBRID-x402.${digest}.${signatureHex}`,
    mlDsaComponent: signatureHex,
    // No Ed25519 signature is produced by this operation.
    ed25519Component: '',
    verificationProof: `ML_DSA_65_SIGNATURE_GENERATED_${keyPair.publicKeyFingerprint}`,
    quantumResistanceScore: 1.0,
  };
}

/**
 * Real NIST FIPS 204 Signature Verification
 */
export function verifyPqcSignature(
  signature: string,
  txId: string,
  publicKey: string,
  amount: number = 0.005,
  serviceId: string = 'srv-shor-orchestrator'
) {
  const payload = `tx:${txId}|amt:${amount}|srv:${serviceId}|pub:${publicKey.substring(0, 32)}`;
  const encoder = new TextEncoder();
  const messageBytes = encoder.encode(payload);

  try {
    if (!/^[0-9a-fA-F]{3904}$/.test(publicKey)) throw new Error('Invalid ML-DSA-65 public key');
    let rawSignature = signature;
    if (signature.startsWith('PQC-HYBRID-x402.')) {
      const parts = signature.split('.');
      if (parts.length !== 3 || !/^[0-9a-fA-F]{64}$/.test(parts[1])) throw new Error('Invalid envelope');
      const actualDigest = bytesToHex(sha256(messageBytes));
      if (parts[1].toLowerCase() !== actualDigest) throw new Error('Invalid digest');
      rawSignature = parts[2];
    }
    if (!/^[0-9a-fA-F]{6618}$/.test(rawSignature)) throw new Error('Invalid ML-DSA-65 signature length');
    const valid = ml_dsa65.verify(hexToBytes(rawSignature), messageBytes, hexToBytes(publicKey));
    return {
      valid,
      algorithm: 'NIST FIPS 204 ML-DSA-65',
      specification: 'ML-DSA-65 signature verification',
      signatureDigestMatch: valid,
      latticeVerificationTimeUs: 0,
      securityBits: 0,
    };
  } catch {
    return {
      valid: false,
      algorithm: 'NIST FIPS 204 ML-DSA-65',
      specification: 'Invalid signature (fail-closed)',
      signatureDigestMatch: false,
      latticeVerificationTimeUs: 0,
      securityBits: 0,
    };
  }
}
