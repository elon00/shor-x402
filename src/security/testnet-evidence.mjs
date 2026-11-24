// Live read-only observations. A transfer alone is not an x402 settlement proof.
import { isValidAddress } from 'algosdk';

export const TESTNET = Object.freeze({
  network: 'algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDe',
  genesisHash: 'SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=',
  genesisId: 'testnet-v1.0', algod: 'https://testnet-api.algonode.cloud',
  indexer: 'https://testnet-idx.algonode.cloud',
  facilitator: 'https://facilitator.goplausible.xyz',
  merchant: 'TPLMGGFNG64LKOCKVB7ZMQH5AMSNMV4GLI7GCH4FY2XQEKSIGB77O6LCFM',
  assetId: 10458941, amountMicro: 5000,
});
class EvidenceError extends Error {
  constructor(message, status = 'FAIL') { super(message); this.status = status; }
}
function requireEvidence(condition, message, status) {
  if (!condition) throw new EvidenceError(message, status);
}
async function getJson(base, path, fetchFn, label) {
  let url;
  try { url = new URL(base); } catch { throw new EvidenceError('Invalid provider URL'); }
  requireEvidence(url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash,
    'Provider URL must use HTTPS without user info, query, or fragment');
  url.pathname = `${url.pathname.replace(/\/$/, '')}${path}`;
  try {
    const response = await fetchFn(url, { method: 'GET', redirect: 'error',
      headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(12000) });
    requireEvidence(response.ok, `${label} returned HTTP ${response.status}`, 'BLOCKED');
    return await response.json();
  } catch (error) {
    if (error instanceof EvidenceError) throw error;
    // Do not print provider credentials embedded in URLs or transport errors.
    throw new EvidenceError(`${label} unavailable or returned invalid JSON`, 'BLOCKED');
  }
}
function checkGenesis(data, label) {
  requireEvidence(data?.['genesis-hash'] === TESTNET.genesisHash && data?.['genesis-id'] === TESTNET.genesisId,
    `${label} is not Algorand TestNet`);
}
export async function inspectNode({ algod = TESTNET.algod, fetchFn = fetch } = {}) {
  const data = await getJson(algod, '/v2/transactions/params', fetchFn, 'Algod parameters');
  checkGenesis(data, 'Algod');
  requireEvidence(Number.isSafeInteger(data['last-round']) && data['last-round'] > 0,
    'Algod did not provide a positive consensus round');
  return { network: TESTNET.network, round: data['last-round'] };
}
export async function inspectAsset({ algod = TESTNET.algod, fetchFn = fetch } = {}) {
  await inspectNode({ algod, fetchFn });
  const data = await getJson(algod, `/v2/assets/${TESTNET.assetId}`, fetchFn, 'USDC asset');
  requireEvidence(data?.index === TESTNET.assetId && data?.params?.decimals === 6 &&
    data?.params?.['unit-name'] === 'USDC', 'TestNet USDC asset metadata mismatch');
  return { assetId: TESTNET.assetId, decimals: 6 };
}
export async function inspectMerchant({ merchant = TESTNET.merchant, algod = TESTNET.algod, fetchFn = fetch } = {}) {
  requireEvidence(isValidAddress(merchant), 'Invalid merchant address checksum');
  await inspectNode({ algod, fetchFn });
  const account = await getJson(algod, `/v2/accounts/${merchant}`, fetchFn, 'Merchant account');
  requireEvidence(account?.address === merchant, 'Merchant account response mismatch');
  requireEvidence(Number.isSafeInteger(account.amount) && Number.isSafeInteger(account['min-balance']) &&
    account['min-balance'] > 0 && account.amount >= account['min-balance'],
    'Merchant is below its minimum ALGO balance', 'BLOCKED');
  const holding = account.assets?.find(asset => asset['asset-id'] === TESTNET.assetId);
  requireEvidence(holding && holding['is-frozen'] === false, 'Merchant needs an unfrozen TestNet USDC opt-in', 'BLOCKED');
  return { merchant, amountMicroAlgo: account.amount, minBalanceMicroAlgo: account['min-balance'],
    assetId: TESTNET.assetId, scope: 'merchant-prerequisites-only' };
}
export async function inspectFacilitator({ facilitator = TESTNET.facilitator, fetchFn = fetch } = {}) {
  const data = await getJson(facilitator, '/supported', fetchFn, 'Facilitator capabilities');
  const kind = data?.kinds?.find(item => item.x402Version === 2 && item.scheme === 'exact' && item.network === TESTNET.network);
  requireEvidence(kind, 'Facilitator does not advertise x402 v2 exact Algorand TestNet', 'BLOCKED');
  return { network: kind.network, scheme: kind.scheme, scope: 'advertised-capability-only' };
}
export async function inspectTransfer({ txId, payer, merchant = TESTNET.merchant, indexer = TESTNET.indexer, fetchFn = fetch } = {}) {
  requireEvidence(typeof txId === 'string' && /^[A-Z2-7]{52}$/.test(txId),
    'Set TESTNET_PAYMENT_TXID to a confirmed candidate transaction ID', txId ? 'FAIL' : 'BLOCKED');
  requireEvidence(typeof payer === 'string' && isValidAddress(payer),
    'Set TESTNET_PAYER_ADDRESS to the expected public payer address', payer ? 'FAIL' : 'BLOCKED');
  requireEvidence(isValidAddress(merchant), 'Invalid merchant address checksum');
  requireEvidence(payer !== merchant, 'Payer and merchant must be distinct');
  checkGenesis(await getJson(indexer, '/v2/blocks/0', fetchFn, 'Indexer genesis'), 'Indexer');
  const data = await getJson(indexer, `/v2/transactions/${txId}`, fetchFn, 'Candidate transaction');
  const tx = data?.transaction;
  requireEvidence(tx?.id === txId && tx?.['tx-type'] === 'axfer', 'Transaction ID or type mismatch');
  requireEvidence(Number.isSafeInteger(tx['confirmed-round']) && tx['confirmed-round'] > 0, 'Candidate transfer is not confirmed');
  requireEvidence(tx.sender === payer, 'Transfer sender does not match the expected payer');
  const transfer = tx['asset-transfer-transaction'];
  requireEvidence(transfer?.['asset-id'] === TESTNET.assetId && transfer?.receiver === merchant &&
    transfer?.amount === TESTNET.amountMicro, 'Transfer must match the exact asset, recipient, and amount');
  requireEvidence(!tx['rekey-to'] && !transfer['close-to'] && !transfer.sender,
    'Rekey, asset close, and clawback transfers are not accepted');
  return { txId, payer, merchant, confirmedRound: tx['confirmed-round'], scope: 'confirmed-transfer-only' };
}
export async function observe(name, fn) {
  try { return { name, status: 'PASS', evidence: await fn() }; }
  catch (error) { return { name, status: error instanceof EvidenceError ? error.status : 'FAIL',
    detail: error instanceof EvidenceError ? error.message : 'Unexpected verifier error' }; }
}
export function reportExitCode(checks) {
  if (checks.some(check => check.status === 'FAIL')) return 1;
  return checks.length && checks.every(check => check.status === 'PASS') ? 0 : 2;
}
export async function verifyGate14(options = {}) {
  const wallet = await observe('W - merchant TestNet prerequisites', () => inspectMerchant(options));
  const transfer = await observe('Candidate transfer inspection (outside Gate 14)', () => inspectTransfer(options));
  const checks = [wallet,
    { name: 'C - persisted server-issued challenge', status: 'BLOCKED', detail: 'Live challenge issuance and server-side persistence have not been verified.' },
    { name: 'P - authorized challenge-bound payment', status: transfer.status === 'FAIL' ? 'FAIL' : 'BLOCKED',
      detail: transfer.status === 'PASS' ? 'Transfer confirmed. Authorization and binding to a live challenge remain unverified.' : transfer.detail },
    { name: 'F - facilitator settlement', status: 'BLOCKED', detail: 'Requires a signed paymentGroup and live verify/settle flow. A transaction ID is insufficient.' },
    { name: 'E - server execution and verifiable receipt', status: 'BLOCKED', detail: 'Paid execution is on SECURITY_HOLD. No server-delivered paid result or trusted PQC receipt was verified.' },
    { name: 'R - PostgreSQL replay rejection', status: 'BLOCKED', detail: 'No live paid request and database replay test was performed. Unit-test pools do not satisfy this gate.' },
  ];
  return { scope: 'Gate 14 live evidence, read-only', observedAt: new Date().toISOString(), checks,
    candidateTransfer: transfer, passed: checks.filter(check => check.status === 'PASS').length,
    total: checks.length, exitCode: reportExitCode(checks) };
}
