import test from 'node:test';
import assert from 'node:assert/strict';
import { WalletController, isValidAlgorandAddress } from '../src/services/walletConnector.ts';
import { fetchLiveAccountHolding, fetchLiveAlgodStatus } from '../src/services/algorandClient.ts';
const address = 'TPLMGGFNG64LKOCKVB7ZMQH5AMSNMV4GLI7GCH4FY2XQEKSIGB77O6LCFM';
function fixture(connect = async () => [address]) {
  const handlers = {};
  let disconnects = 0;
  return { adapter: { connect, reconnectSession: connect,
    disconnect: async () => { disconnects++; },
    on: (name, fn) => { handlers[name] = fn; return () => { delete handlers[name]; }; } },
    handlers, disconnects: () => disconnects };
}
test('watching an address gives no wallet session or ownership proof', () => {
  const controller = new WalletController();
  controller.watch(address);
  assert.equal(controller.state.status, 'watching');
  assert.equal(controller.state.ownershipProven, false);
  assert.equal(isValidAlgorandAddress('A'.repeat(58)), false);
});
test('wallet rejection cannot fall back to a default merchant address', async () => {
  const { adapter } = fixture(async () => { throw new Error('User rejected'); });
  const controller = new WalletController('algorand-testnet', () => {}, async () => adapter);
  await controller.connect();
  assert.equal(controller.state.status, 'error');
  assert.equal(controller.state.address, '');
});
test('actual adapter connection is separate from wallet ownership proof', async () => {
  const { adapter } = fixture();
  const controller = new WalletController('algorand-testnet', () => {}, async () => adapter);
  await controller.connect();
  assert.equal(controller.state.status, 'connected');
  assert.equal(controller.state.address, address);
  assert.equal(controller.state.ownershipProven, false);
  await controller.disconnect();
});
test('wallet network change and revocation clear signing session', async () => {
  const setup = fixture();
  const controller = new WalletController('algorand-testnet', () => {}, async () => setup.adapter);
  await controller.connect();
  setup.handlers.networkChanged();
  assert.equal(controller.state.status, 'disconnected');
  await controller.connect();
  setup.handlers.disconnect();
  assert.equal(controller.state.address, '');
});
test('switching network disconnects the old session', async () => {
  const setup = fixture();
  const controller = new WalletController('algorand-testnet', () => {}, async () => setup.adapter);
  await controller.connect();
  await controller.changeNetwork('algorand-mainnet');
  assert.equal(controller.state.status, 'disconnected');
  assert.equal(controller.state.network, 'algorand-mainnet');
  assert.ok(setup.disconnects() > 0);
});
test('cancelled pending connection cannot restore connected UI state', async () => {
  let resolve;
  const setup = fixture(() => new Promise(done => { resolve = done; }));
  const controller = new WalletController('algorand-testnet', () => {}, async () => setup.adapter);
  const pending = controller.connect();
  await new Promise(done => setImmediate(done));
  await controller.disconnect();
  resolve([address]);
  await pending;
  assert.equal(controller.state.status, 'disconnected');
  assert.equal(controller.state.address, '');
});
test('zero balances clear old amounts and node failure does not invent a round', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response(JSON.stringify({ address, amount: 0, round: 42, assets: [] }));
    const holding = await fetchLiveAccountHolding(address, 'algorand-testnet');
    assert.equal(holding.usdcBalance, 0);
    assert.equal(holding.algoBalance, 0);
    globalThis.fetch = async () => { throw new Error('offline'); };
    const status = await fetchLiveAlgodStatus('algorand-testnet');
    assert.equal(status.isLive, false);
    assert.equal(status.lastRound, 0);
    assert.equal(status.genesisHash, '');
    assert.equal(await fetchLiveAccountHolding(address), null);
  } finally { globalThis.fetch = original; }
});
