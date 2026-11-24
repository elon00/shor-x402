import { timingSafeEqual } from 'node:crypto';
import { encodePublicReceipt, storePublicReceipt } from './ipfs-store.mjs';
export async function handleReceiptStorage({ authorization, body }, env = process.env, store = storePublicReceipt) {
  const key = env.SHOR_STORAGE_API_KEY;
  if (!key || key.length < 32 || !env.IPFS_RPC_URL) return { status: 503, body: { error: 'Public receipt storage is not configured' } };
  const expected = Buffer.from(`Bearer ${key}`);
  const actual = Buffer.from(typeof authorization === 'string' ? authorization : '');
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return { status: 401, body: { error: 'Unauthorized' } };
  try { encodePublicReceipt(body); } catch { return { status: 400, body: { error: 'Invalid public receipt schema; extra fields are rejected' } }; }
  try {
    return { status: 201, body: await store(body, { endpoint: env.IPFS_RPC_URL, token: env.IPFS_RPC_TOKEN }) };
  } catch { return { status: 502, body: { error: 'IPFS upload could not be verified' } }; }
}
