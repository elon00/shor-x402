import test from 'node:test';
import assert from 'node:assert/strict';
import { TESTNET, inspectMerchant, inspectTransfer, inspectFacilitator, observe,
  verifyGate14, reportExitCode } from '../src/security/testnet-evidence.mjs';
const payer = '5WE6HNUR6MFPZRTZT3I7USU7LVMCWOXZKS2T5XEGETBGHHRFRDVUX4ATLI';
const txId = 'A'.repeat(52);
function fixture({ tx = {}, account = {}, genesis = {}, status = 200, supported } = {}) {
  return async (url, options) => {
    assert.equal(options.method, 'GET', 'verifier must never submit a payment');
    const path = new URL(url).pathname;
    const data = path.endsWith('/params') || path.endsWith('/blocks/0')
      ? { 'genesis-hash': TESTNET.genesisHash, 'genesis-id': TESTNET.genesisId, 'last-round': 42, ...genesis }
      : path.includes('/accounts/')
        ? { address: TESTNET.merchant, amount: 9996000, 'min-balance': 200000,
          assets: [{ 'asset-id': TESTNET.assetId, 'is-frozen': false }], ...account }
        : path.endsWith('/supported')
          ? supported ?? { kinds: [{ x402Version: 2, scheme: 'exact', network: TESTNET.network }] }
          : { transaction: { id: txId, sender: payer, 'tx-type': 'axfer', 'confirmed-round': 42,
            'asset-transfer-transaction': { 'asset-id': TESTNET.assetId, receiver: TESTNET.merchant, amount: 5000 }, ...tx } };
    return { ok: status === 200, status, json: async () => data };
  };
}
test('merchant readiness validates TestNet genesis and selected account', async () => {
  assert.equal((await inspectMerchant({ fetchFn: fixture() })).amountMicroAlgo, 9996000);
  await assert.rejects(inspectMerchant({ fetchFn: fixture({ genesis: { 'genesis-hash': 'mainnet' } }) }), /not Algorand TestNet/);
  await assert.rejects(inspectMerchant({ fetchFn: fixture({ account: { address: payer } }) }), /mismatch/);
});
test('frozen or unopted merchant cannot pass', async () => {
  for (const assets of [[], [{ 'asset-id': TESTNET.assetId, 'is-frozen': true }]]) {
    const result = await observe('merchant', () => inspectMerchant({ fetchFn: fixture({ account: { assets } }) }));
    assert.equal(result.status, 'BLOCKED');
  }
});
test('a valid transfer is labelled transfer-only and cannot complete Gate 14', async () => {
  const options = { txId, payer, fetchFn: fixture() };
  assert.equal((await inspectTransfer(options)).scope, 'confirmed-transfer-only');
  const report = await verifyGate14(options);
  assert.equal(report.candidateTransfer.status, 'PASS');
  assert.equal(report.passed, 1);
  assert.equal(report.exitCode, 2);
  assert.ok(report.checks.slice(1).every(c => c.status === 'BLOCKED'));
});
test('missing explicit payer blocks the transfer inspection', async () => {
  const result = await observe('transfer', () => inspectTransfer({ txId, fetchFn: fixture() }));
  assert.equal(result.status, 'BLOCKED');
});
test('confirmed transfer must match exact payer, amount, recipient, and asset', async () => {
  const transfer = { 'asset-id': TESTNET.assetId, receiver: TESTNET.merchant, amount: 5000 };
  for (const tx of [{ sender: TESTNET.merchant }, { 'confirmed-round': 0 },
    { id: 'B'.repeat(52) }, { 'tx-type': 'pay' },
    { 'asset-transfer-transaction': { ...transfer, amount: 0 } },
    { 'asset-transfer-transaction': { ...transfer, amount: 5001 } },
    { 'asset-transfer-transaction': { ...transfer, receiver: payer } },
    { 'asset-transfer-transaction': { ...transfer, 'asset-id': 31566704 } },
    { 'rekey-to': payer },
    { 'asset-transfer-transaction': { ...transfer, 'close-to': payer } },
    { 'asset-transfer-transaction': { ...transfer, sender: payer } }]) {
    await assert.rejects(inspectTransfer({ txId, payer, fetchFn: fixture({ tx }) }));
  }
});
test('indexer must independently identify TestNet', async () => {
  await assert.rejects(inspectTransfer({ txId, payer,
    fetchFn: fixture({ genesis: { 'genesis-id': 'mainnet-v1.0' } }) }), /not Algorand TestNet/);
});
test('facilitator 403/404 and unrelated supported networks do not pass', async () => {
  for (const status of [403, 404]) {
    assert.equal((await observe('facilitator', () => inspectFacilitator({ fetchFn: fixture({ status }) }))).status, 'BLOCKED');
  }
  await assert.rejects(inspectFacilitator({ fetchFn: fixture({ supported: { kinds: [{ scheme: 'exact', network: 'eip155:8453' }] } }) }), /does not advertise/);
  assert.equal((await inspectFacilitator({ fetchFn: fixture() })).scope, 'advertised-capability-only');
});
test('provider path prefixes are preserved and credentials are not logged', async () => {
  await inspectFacilitator({ facilitator: 'https://example.com/private-token/', fetchFn: async url => {
    assert.equal(new URL(url).pathname, '/private-token/supported');
    throw new Error('secret in https://example.com/private-token/');
  }}).then(() => assert.fail('must block'), error => assert.doesNotMatch(error.message, /private-token/));
});
test('incomplete and empty reports have nonzero exit codes', () => {
  assert.equal(reportExitCode([]), 2);
  assert.equal(reportExitCode([{ status: 'PASS' }, { status: 'BLOCKED' }]), 2);
  assert.equal(reportExitCode([{ status: 'FAIL' }, { status: 'BLOCKED' }]), 1);
  assert.equal(reportExitCode([{ status: 'PASS' }]), 0);
});
