import test from 'node:test';
import assert from 'node:assert/strict';
import { CID } from 'multiformats/cid';
import { sha256 } from 'multiformats/hashes/sha2';
import { encodePublicReceipt, storePublicReceipt } from '../src/infrastructure/ipfs-store.mjs';
import { handleReceiptStorage } from '../src/infrastructure/storage-handler.mjs';
import { inspectQuickNode } from '../src/infrastructure/chain-rpc.mjs';
import { resolveApiEndpoint } from '../src/infrastructure/public-config.mjs';
const receipt = { version: 1, network: 'eip155:84532', transactionId: '0x' + 'a'.repeat(64),
  resource: '/api/v1/shor/execute', resultSha256: 'b'.repeat(64), issuedAt: '2026-11-19T00:00:00.000Z' };
test('public receipt schema rejects secrets, extra fields and malformed values', () => {
  for (const value of [{ ...receipt, privateKey: 'secret' }, { ...receipt, version: 2 },
    { ...receipt, issuedAt: 'yesterday' }, { ...receipt, resultSha256: 'fake' },
    { ...receipt, resource: 'private data' }, { ...receipt, transactionId: 'fake' }]) {
    assert.throws(() => encodePublicReceipt(value));
  }
});
test('IPFS upload verifies returned CID against actual serialized content', async () => {
  const result = await storePublicReceipt(receipt, { endpoint: 'https://ipfs.example.invalid',
    token: 'test-token', fetchFn: async (url, options) => {
      assert.equal(url.searchParams.get('pin'), 'true');
      assert.equal(options.headers.Authorization, 'Bearer test-token');
      const bytes = new Uint8Array(await options.body.get('file').arrayBuffer());
      assert.deepEqual(JSON.parse(new TextDecoder().decode(bytes)), receipt);
      const cid = CID.createV1(0x55, await sha256.digest(bytes));
      return { ok: true, json: async () => ({ Hash: cid.toString() }) };
    } });
  assert.match(result.uri, /^ipfs:\/\/bafk/);
  assert.match(result.scope, /does not verify payment/);
});
test('IPFS rejects mismatched content, unconfigured provider and nonlocal HTTP', async () => {
  const otherCid = CID.createV1(0x55, await sha256.digest(new Uint8Array([1])));
  await assert.rejects(storePublicReceipt(receipt, { endpoint: 'https://ipfs.example.invalid',
    fetchFn: async () => ({ ok: true, json: async () => ({ Hash: otherCid.toString() }) }) }), /does not match/);
  await assert.rejects(storePublicReceipt(receipt, { endpoint: '' }), /not configured/);
  await assert.rejects(storePublicReceipt(receipt, { endpoint: 'http://remote.example.invalid' }), /requires HTTPS/);
});
test('storage handler blocks anonymous writes and does not leak provider errors', async () => {
  const env = { SHOR_STORAGE_API_KEY: 'k'.repeat(32), IPFS_RPC_URL: 'https://ipfs.example.invalid' };
  let writes = 0;
  const store = async () => { writes++; throw new Error('sensitive-provider-token'); };
  assert.equal((await handleReceiptStorage({ body: receipt }, env, store)).status, 401);
  assert.equal(writes, 0);
  assert.equal((await handleReceiptStorage({ authorization: 'Bearer ' + env.SHOR_STORAGE_API_KEY,
    body: { ...receipt, privateKey: 'secret' } }, env, store)).status, 400);
  assert.equal(writes, 0);
  const result = await handleReceiptStorage({ authorization: 'Bearer ' + env.SHOR_STORAGE_API_KEY, body: receipt }, env, store);
  assert.equal(result.status, 502);
  assert.doesNotMatch(JSON.stringify(result), /sensitive-provider-token/);
  assert.equal((await handleReceiptStorage({ body: receipt }, {}, store)).status, 503);
});
test('QuickNode checks actual chain ID and never submits a transaction', async () => {
  const options = { url: 'https://example.quiknode.pro/test-token',
    fetchFn: async (_url, request) => {
      const rpc = JSON.parse(request.body);
      assert.equal(rpc.method, 'eth_chainId');
      assert.deepEqual(rpc.params, []);
      return { ok: true, json: async () => ({ jsonrpc: '2.0', id: 1, result: '0x14a34' }) };
    } };
  assert.equal((await inspectQuickNode(options)).caip2, 'eip155:84532');
  await assert.rejects(inspectQuickNode({ ...options, chain: 'ethereum-sepolia' }), /identity mismatch/);
  await assert.rejects(inspectQuickNode({ ...options, url: 'https://attacker.invalid/token' }), /Expected a private HTTPS/);
});
test('IPFS API endpoints use the external HTTPS backend origin', () => {
  assert.equal(resolveApiEndpoint('/api/health', 'https://api.example.invalid'), 'https://api.example.invalid/api/health');
  for (const base of ['http://api.example.invalid', 'https://user:password@api.example.invalid', 'https://api.example.invalid?key=secret']) {
    assert.throws(() => resolveApiEndpoint('/api/health', base));
  }
  assert.throws(() => resolveApiEndpoint('//attacker.invalid'));
});
