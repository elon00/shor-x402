/**
 * Fail-closed, PostgreSQL-backed exactly-once settlement consumption.
 * IMPORTANT: settlementProof must already be independently verified by a trusted
 * facilitator and strictly bound to the challenge. This module DOES NOT verify it.
 * A caller must never execute/fulfil paid work unless claimSettledPayment returns
 * claimed=true. Failed work is not automatically refundable or reusable.
 */
import { claimHash, matchClaim, PaymentClaim } from './claimBinding';

export interface SettlementProof {
  verified: boolean;
  settled: boolean;
  txId: string;
  network: string;
  challengeHash: string;
  [key: string]: any;
}

export interface ClaimPaymentParams {
  expected: PaymentClaim;
  supplied: PaymentClaim;
  txId: string;
  settlementProof: SettlementProof | null;
  verifySettlement: (proof: any, expected: PaymentClaim, txId: string) => Promise<boolean> | boolean;
  now?: number;
}

export interface ClaimResult {
  claimed: boolean;
  claimId: number | null;
}

function checkText(s: string, name: string, max: number = 1024): string {
  if (typeof s !== 'string' || !s.length || s.length > max) throw new Error(`invalid ${name}`);
  return s;
}

export async function claimSettledPayment(
  pool: any,
  { expected, supplied, txId, settlementProof, verifySettlement, now = Date.now() }: ClaimPaymentParams
): Promise<ClaimResult> {
  if (!pool || typeof pool.connect !== 'function') throw new Error('PostgreSQL pool required');
  if (!matchClaim(expected, supplied, now)) throw new Error('payment challenge mismatch or expired');
  checkText(txId, 'transaction ID', 64);
  if (!/^[A-Z2-7]{52}$/.test(txId)) throw new Error('invalid Algorand transaction ID');
  if (typeof verifySettlement !== 'function') throw new Error('trusted facilitator verifier required');

  const authenticated = await verifySettlement(settlementProof, expected, txId);
  if (authenticated !== true) throw new Error('facilitator proof authentication failed');

  if (
    !settlementProof ||
    settlementProof.verified !== true ||
    settlementProof.settled !== true ||
    settlementProof.txId !== txId ||
    settlementProof.network !== expected.network ||
    settlementProof.challengeHash !== claimHash(expected)
  ) {
    throw new Error('valid facilitator settlement evidence required');
  }

  // CRITICAL: the caller must establish the authenticity of settlementProof; a
  // JSON object supplied by the requester is NEVER trusted proof.
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const q = await client.query(
      `INSERT INTO shor_payment_claims
      (network,tx_id,challenge_hash,resource,recipient,asset_id,amount_micro,facilitator_receipt)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)
      ON CONFLICT DO NOTHING RETURNING id`,
      [
        expected.network,
        txId,
        claimHash(expected),
        expected.resource,
        expected.recipient,
        expected.assetId,
        expected.amountMicro,
        JSON.stringify(settlementProof),
      ]
    );
    await client.query('COMMIT');
    return { claimed: q.rowCount === 1, claimId: q.rows[0]?.id ?? null };
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {
      /* log in caller */
    }
    throw err;
  } finally {
    client.release();
  }
}

export async function recordExecutionResult(pool: any, claimId: number, result: any): Promise<boolean> {
  if (!Number.isSafeInteger(claimId) || claimId <= 0) throw new Error('invalid claim ID');
  const client = await pool.connect();
  try {
    const r = await client.query(
      `UPDATE shor_payment_claims SET state='EXECUTED', executed_at=NOW(), result_json=$2::jsonb
      WHERE id=$1 AND state='CLAIMED' RETURNING id`,
      [claimId, JSON.stringify(result)]
    );
    return r.rowCount === 1;
  } finally {
    client.release();
  }
}
