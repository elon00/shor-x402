import test from 'node:test';
import assert from 'node:assert/strict';
import { executeShorOrchestratorTask, HTTP_PACKET_LOGS } from '../src/services/apiClient.ts';
const wallet = { connected: true, address: 'public-test-address', network: 'algorand-testnet' };
test('HTTP 402 cannot manufacture a transaction, signature or confirmed receipt', async () => {
  const original = globalThis.fetch;
  let calls = 0; let receipts = 0;
  try {
    globalThis.fetch = async (_url, request) => {
      calls++;
      assert.equal(request.headers.Authorization, undefined);
      return new Response(JSON.stringify({ error: 'Payment Required', nonce: 'server-nonce' }),
        { status: 402, headers: { 'Content-Type': 'application/json', 'X-Observed': 'real-header' } });
    };
    const result = await executeShorOrchestratorTask('test', 0.005, wallet, {}, () => { receipts++; });
    assert.equal(calls, 1);
    assert.equal(receipts, 0);
    assert.equal(result.success, false);
    assert.equal(result.transaction, null);
    assert.equal(result.http402Challenge, null);
    assert.match(result.error, /No payment was sent/);
    assert.equal(HTTP_PACKET_LOGS[0].headersReceived['x-observed'], 'real-header');
    assert.equal(HTTP_PACKET_LOGS[0].headersReceived['x-402-settled'], undefined);
  } finally { globalThis.fetch = original; }
});
test('network errors and unauthenticated HTTP 200 cannot certify paid execution', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => { throw new Error('offline'); };
    const offline = await executeShorOrchestratorTask('test', 0.005, wallet, {});
    assert.equal(offline.transaction, null);
    assert.equal(offline.success, false);
    globalThis.fetch = async () => new Response(JSON.stringify({ status: 'success' }), { status: 200 });
    const result = await executeShorOrchestratorTask('test', 0.005, wallet, {});
    assert.equal(result.transaction, null);
    assert.equal(result.success, false);
    assert.match(result.error, /not verified/);
  } finally { globalThis.fetch = original; }
});
