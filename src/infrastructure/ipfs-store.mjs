// Server-side only. IPFS content is public; publish only this minimal receipt schema.
import { createHash } from 'node:crypto';
import { CID } from 'multiformats/cid';
import { sha256 } from 'multiformats/hashes/sha2';
import * as raw from 'multiformats/codecs/raw';

export function encodePublicReceipt(receipt) {
  const keys = ['version', 'network', 'transactionId', 'resource', 'resultSha256', 'issuedAt'];
  if (!receipt || Object.getPrototypeOf(receipt) !== Object.prototype ||
      Object.keys(receipt).length !== keys.length || keys.some(k => !Object.hasOwn(receipt, k))) {
    throw new Error('Only the public receipt schema is accepted');
  }
  if (keys.filter(k => k !== 'version').some(k => typeof receipt[k] !== 'string') ||
      receipt.version !== 1 || !/^(algorand|eip155):[A-Za-z0-9_-]{1,64}$/.test(receipt.network) ||
      !/^(?:[A-Z2-7]{52}|0x[0-9a-fA-F]{64})$/.test(receipt.transactionId) ||
      !/^\/[A-Za-z0-9/_-]{1,200}$/.test(receipt.resource) ||
      !/^[a-f0-9]{64}$/.test(receipt.resultSha256) ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(receipt.issuedAt) ||
      !Number.isFinite(Date.parse(receipt.issuedAt)) ||
      new Date(receipt.issuedAt).toISOString() !== receipt.issuedAt) {
    throw new Error('Invalid public receipt fields');
  }
  return new TextEncoder().encode(JSON.stringify(Object.fromEntries(keys.map(k => [k, receipt[k]]))));
}
function rpcUrl(endpoint) {
  if (!endpoint) throw new Error('IPFS_RPC_URL is not configured');
  const url = new URL(endpoint);
  if (url.username || url.password || url.search || url.hash ||
      (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)))) {
    throw new Error('IPFS RPC requires HTTPS or local loopback HTTP');
  }
  url.pathname = url.pathname.replace(/\/$/, '') + '/api/v0/add';
  url.search = new URLSearchParams({ 'cid-version': '1', 'raw-leaves': 'true',
    'wrap-with-directory': 'false', hash: 'sha2-256', chunker: 'size-262144', pin: 'true' }).toString();
  return url;
}
export async function storePublicReceipt(receipt, { endpoint = process.env.IPFS_RPC_URL,
  token = process.env.IPFS_RPC_TOKEN, fetchFn = fetch } = {}) {
  const bytes = encodePublicReceipt(receipt);
  const expected = CID.createV1(raw.code, await sha256.digest(bytes));
  const url = rpcUrl(endpoint);
  const form = new FormData();
  form.set('file', new Blob([bytes], { type: 'application/json' }), 'receipt.json');
  let response;
  try {
    response = await fetchFn(url, { method: 'POST', redirect: 'error', body: form,
      headers: token ? { Authorization: `Bearer ${token}` } : {}, signal: AbortSignal.timeout(15000) });
  } catch { throw new Error('IPFS upload unavailable'); }
  if (!response.ok) throw new Error(`IPFS upload returned HTTP ${response.status}`);
  let returned;
  try { returned = await response.json(); } catch { throw new Error('IPFS returned invalid JSON'); }
  let cid;
  try { cid = CID.parse(returned.Hash); } catch { throw new Error('IPFS returned an invalid CID'); }
  if (!cid.equals(expected)) throw new Error('IPFS CID does not match the uploaded bytes');
  return { cid: cid.toString(), uri: `ipfs://${cid}`,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    bytes: bytes.byteLength, persistence: 'provider-reported-pin; retention requires monitoring',
    scope: 'public-content-addressing; does not verify payment or result correctness' };
}
