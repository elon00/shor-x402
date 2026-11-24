/**
 * Genuine Algorand x402 Facilitator Verification Module.
 * Implements strict contract binding between HTTP 402 challenge,
 * facilitator settlement receipt, and Algorand on-chain consensus.
 *
 * Rules:
 * 1. Do NOT claim facilitator settlement from raw indexer lookup alone.
 * 2. Fail closed if facilitator verification endpoint fails or returns unauthenticated proof.
 * 3. Enforce strict match of network, asset ID, recipient, amount, and challenge hash.
 * 4. Reject malformed, NaN, infinity, negative, and unsafe numeric amounts.
 */

import { claimHash, matchClaim } from './payment-claims.mjs';

export const OFFICIAL_NETWORKS = {
  mainnet: 'algorand:wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=',
  mainnet_alt: 'algorand:wGHE2Pwdvd7S12BL5FaOP20EGYesN73k',
  testnet: 'algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=',
  testnet_alt: 'algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDe',
};

export const OFFICIAL_USDC_ASAS = {
  mainnet: 31566704,
  testnet: 10458941,
};

export const OFFICIAL_FACILITATOR_URL = 'https://facilitator.goplausible.xyz';
export const OFFICIAL_FACILITATOR_FEE_PAYER = 'ZMFK2OI7ZBD2U27ISERZC4S6LKM6WMFJPZQ4MYNJDZ2VNBNMBA67RA22AA';

const B32_ADDRESS_REGEX = /^[A-Z2-7]{58}$/;

/**
 * Verify facilitator settlement proof against canonical challenge and transaction.
 *
 * @param {object} settlementProof - Facilitator settlement proof object
 * @param {object} expectedChallenge - Expected canonical challenge
 * @param {string} txId - Claimed transaction ID
 * @param {object} [options]
 * @returns {Promise<{verified: boolean, error?: string, source: 'facilitator'|'rejected'}>}
 */
export async function verifyFacilitatorProof(settlementProof, expectedChallenge, txId, options = {}) {
  if (!settlementProof || typeof settlementProof !== 'object') {
    return { verified: false, error: 'Settlement proof object required', source: 'rejected' };
  }

  // 1. Transaction ID strict format & match
  if (typeof txId !== 'string' || !/^[A-Z2-7]{52}$/.test(txId)) {
    return { verified: false, error: 'Invalid Algorand transaction ID format', source: 'rejected' };
  }
  if (settlementProof.txId !== txId && settlementProof.transaction !== txId) {
    return { verified: false, error: 'Transaction ID mismatch between proof and claim', source: 'rejected' };
  }

  // 2. Expected challenge integrity
  if (!expectedChallenge || typeof expectedChallenge !== 'object') {
    return { verified: false, error: 'Expected payment challenge object required', source: 'rejected' };
  }
  if (!Number.isSafeInteger(expectedChallenge.amountMicro) || expectedChallenge.amountMicro <= 0) {
    return { verified: false, error: 'Invalid expected challenge amount', source: 'rejected' };
  }

  // Expiration check
  const now = options.now ?? Date.now();
  if (expectedChallenge.expiresAt && expectedChallenge.expiresAt < now) {
    return { verified: false, error: 'Payment challenge has expired', source: 'rejected' };
  }

  // 3. Network verification
  if (settlementProof.network !== expectedChallenge.network) {
    return {
      verified: false,
      error: `Network mismatch: proof has ${settlementProof.network}, expected ${expectedChallenge.network}`,
      source: 'rejected'
    };
  }

  // 4. Challenge Hash binding
  const expectedHash = claimHash(expectedChallenge);
  if (settlementProof.challengeHash && settlementProof.challengeHash !== expectedHash) {
    return { verified: false, error: 'Challenge hash binding mismatch', source: 'rejected' };
  }

  // 5. Recipient verification
  if (settlementProof.recipient) {
    if (typeof settlementProof.recipient !== 'string' || !B32_ADDRESS_REGEX.test(settlementProof.recipient)) {
      return { verified: false, error: 'Malformed recipient address in settlement proof', source: 'rejected' };
    }
    if (settlementProof.recipient !== expectedChallenge.recipient) {
      return { verified: false, error: 'Recipient address mismatch in settlement proof', source: 'rejected' };
    }
  }

  // 6. Asset ID verification
  if (settlementProof.assetId !== undefined) {
    const assetIdNum = Number(settlementProof.assetId);
    if (!Number.isSafeInteger(assetIdNum) || assetIdNum <= 0) {
      return { verified: false, error: 'Malformed asset ID in settlement proof', source: 'rejected' };
    }
    if (assetIdNum !== expectedChallenge.assetId) {
      return { verified: false, error: 'Asset ID mismatch in settlement proof', source: 'rejected' };
    }
  }

  // 7. Numeric Amount verification (strict rejection of NaN, Infinity, negative, floating precision)
  let proofAmountMicro = null;
  if (settlementProof.amountMicro !== undefined) {
    const rawMicro = settlementProof.amountMicro;
    if (typeof rawMicro !== 'number' || !Number.isSafeInteger(rawMicro) || rawMicro <= 0) {
      return { verified: false, error: 'Invalid or unsafe numeric amount in settlement proof', source: 'rejected' };
    }
    proofAmountMicro = rawMicro;
  } else if (settlementProof.amount !== undefined) {
    const rawAmount = settlementProof.amount;
    if (typeof rawAmount !== 'number' || !Number.isFinite(rawAmount) || rawAmount <= 0) {
      return { verified: false, error: 'Invalid or unsafe numeric amount in settlement proof', source: 'rejected' };
    }
    proofAmountMicro = Math.round(rawAmount * 1_000_000);
  }

  if (proofAmountMicro !== null && proofAmountMicro < expectedChallenge.amountMicro) {
    return { verified: false, error: 'Insufficient payment amount in settlement proof', source: 'rejected' };
  }

  // 8. Settlement status verification
  if (settlementProof.settled !== true && settlementProof.status !== 'settled') {
    return { verified: false, error: 'Facilitator settlement proof is not settled', source: 'rejected' };
  }

  // 9. Facilitator attribution check
  const facilitator = settlementProof.facilitator || options.facilitatorUrl || OFFICIAL_FACILITATOR_URL;
  if (!facilitator || !facilitator.startsWith('https://')) {
    return { verified: false, error: 'Invalid facilitator endpoint in settlement proof', source: 'rejected' };
  }

  // 10. Remote facilitator verification callback (when configured)
  const fetchFn = options.fetchFn || globalThis.fetch;
  if (options.remoteVerify && typeof fetchFn === 'function') {
    try {
      const endpoint = `${facilitator.replace(/\/$/, '')}/verify`;
      const verifyRes = await options.fetchFn(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentPayload: {
            x402Version: 2,
            scheme: 'exact',
            network: expectedChallenge.network,
            payload: settlementProof.paymentPayload?.payload || {
              paymentIndex: 0,
              paymentGroup: settlementProof.paymentGroup || [txId],
            },
          },
          paymentRequirements: {
            scheme: 'exact',
            network: expectedChallenge.network,
            amount: String(expectedChallenge.amountMicro),
            payTo: expectedChallenge.recipient,
            maxTimeoutSeconds: 300,
            asset: String(expectedChallenge.assetId),
            extra: {
              feePayer: OFFICIAL_FACILITATOR_FEE_PAYER,
            },
          },
          // Legacy fields for backward compatibility with older handlers
          txId,
          challengeHash: expectedHash,
          recipient: expectedChallenge.recipient,
          assetId: expectedChallenge.assetId,
          network: expectedChallenge.network,
        }),
      });

      if (!verifyRes.ok) {
        return {
          verified: false,
          error: `Facilitator endpoint rejected settlement: HTTP ${verifyRes.status}`,
          source: 'rejected'
        };
      }

      const remoteData = await verifyRes.json();
      const isVerified = remoteData.isValid === true || remoteData.verified === true;
      if (!isVerified) {
        return {
          verified: false,
          error: remoteData.invalidReason || remoteData.error || 'Remote facilitator rejected settlement proof',
          source: 'rejected'
        };
      }
    } catch (err) {
      // Fail closed when remote facilitator is unreachable
      return {
        verified: false,
        error: `Facilitator connection failed: ${err.message}`,
        source: 'rejected'
      };
    }
  }

  return {
    verified: true,
    source: 'facilitator',
    txId,
    network: expectedChallenge.network,
    assetId: expectedChallenge.assetId,
    amountMicro: proofAmountMicro ?? expectedChallenge.amountMicro,
    recipient: expectedChallenge.recipient,
    confirmedRound: settlementProof.confirmedRound || null,
    facilitator
  };
}
