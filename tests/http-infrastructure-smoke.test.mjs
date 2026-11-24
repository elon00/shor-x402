import test from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
test('built backend serves frontend and blocks unconfigured storage and unpaid execution', { timeout: 30000 }, async () => {
  const portProbe = net.createServer();
  portProbe.listen(0, '127.0.0.1');
  await once(portProbe, 'listening');
  const port = portProbe.address().port;
  await new Promise(resolve => portProbe.close(resolve));
  const child = spawn(process.execPath, ['build/server/server.js'], {
    cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, NODE_ENV: 'production', PORT: String(port),
      IPFS_RPC_URL: '', SHOR_STORAGE_API_KEY: '', GEMINI_API_KEY: '' },
  });
  let startup = '';
  child.stdout.on('data', data => { startup += data; });
  child.stderr.on('data', data => { startup += data; });
  const base = `http://127.0.0.1:${port}`;
  try {
    let ready = false;
    for (let i = 0; i < 100; i++) {
      if (child.exitCode !== null) throw new Error('Backend exited during startup: ' + startup.slice(-1000));
      try { const response = await fetch(base + '/api/health', { signal: AbortSignal.timeout(500) }); if (response.ok) { ready = true; break; } } catch {}
      await delay(100);
    }
    assert.equal(ready, true, 'backend readiness');
    const health = await (await fetch(base + '/api/health')).json();
    assert.equal(health.payments.enabled, false);
    assert.equal(health.network.consensusStatus, 'not-checked');
    assert.equal(health.activeRound, undefined);
    const page = await fetch(base);
    assert.equal(page.status, 200);
    assert.match(await page.text(), /id="root"/);
    const storage = await fetch(base + '/api/v1/storage/receipts', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    assert.equal(storage.status, 503);
    const challenge = await fetch(base + '/api/v1/shor/execute', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal: 'read-only smoke check', budgetUsdc: 0.005 }) });
    assert.equal(challenge.status, 402);
    const held = await fetch(base + '/api/v1/shor/execute', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-402-Proof': 'untrusted-test-proof' },
      body: '{}' });
    assert.equal(held.status, 503);
    assert.match(JSON.stringify(await held.json()), /SECURITY_HOLD/);
    const legacy = await fetch(base + '/api/services/weather', {
      headers: { Authorization: 'x402-algo forged-proof' } });
    assert.equal(legacy.status, 503);
    const verifier = await fetch(base + '/api/v1/x402/verify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    assert.equal(verifier.status, 503);
  } finally {
    if (child.exitCode === null) { child.kill(); await once(child, 'exit'); }
  }
});
