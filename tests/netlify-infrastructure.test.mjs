import test from 'node:test';
import assert from 'node:assert/strict';
import { handler as health } from '../build/functions/netlify/functions/health.js';
import { handler as storage } from '../build/functions/netlify/functions/store-receipt.js';
import { handler as discovery } from '../build/functions/netlify/functions/bazaar.js';
test('Netlify health is process-only, with no fabricated consensus round', async () => {
  const response = await health({ httpMethod: 'GET' }, {});
  assert.equal(response.statusCode, 200);
  const data = JSON.parse(response.body);
  assert.equal(data.payments.enabled, false);
  assert.equal(data.activeRound, undefined);
  assert.equal(data.productionReady, false);
  assert.equal(data.network.consensusStatus, 'not-checked');
});
test('Netlify discovery does not advertise unavailable paid resources', async () => {
  const response = await discovery({ httpMethod: 'GET' }, {});
  const data = JSON.parse(response.body);
  assert.equal(data.available, false);
  assert.deepEqual(data.resources, []);
  assert.equal(data.status, 'SECURITY_HOLD');
});
test('Netlify storage rejects wrong methods, invalid JSON and base64 bodies', async () => {
  assert.equal((await storage({ httpMethod: 'GET', headers: {} }, {})).statusCode, 405);
  assert.equal((await storage({ httpMethod: 'POST', headers: {}, body: '{' }, {})).statusCode, 400);
  assert.equal((await storage({ httpMethod: 'POST', headers: {}, body: 'e30=', isBase64Encoded: true }, {})).statusCode, 413);
});
