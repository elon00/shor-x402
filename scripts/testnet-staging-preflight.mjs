/** Prerequisites only. A preflight pass is not payment or production certification. */
import { claimHash } from '../src/security/payment-claims.mjs';
import { TESTNET, inspectNode, inspectAsset, inspectMerchant, inspectFacilitator,
  observe, reportExitCode } from '../src/security/testnet-evidence.mjs';
const options = { merchant: process.env.TESTNET_MERCHANT_ADDRESS || undefined,
  algod: process.env.TESTNET_ALGOD_URL || undefined,
  facilitator: process.env.TESTNET_FACILITATOR_URL || undefined };
const checks = await Promise.all([
  observe('Live node TestNet genesis and consensus round', () => inspectNode(options)),
  observe('Live TestNet USDC metadata', () => inspectAsset(options)),
  observe('Selected merchant balance and unfrozen USDC opt-in', () => inspectMerchant(options)),
  observe('Facilitator advertises x402 v2 exact TestNet capability', () => inspectFacilitator(options)),
  observe('LOCAL ONLY - canonical hash detects amount changes', async () => {
    const claim = { network: TESTNET.network, assetId: TESTNET.assetId,
      recipient: options.merchant || TESTNET.merchant, amountMicro: TESTNET.amountMicro,
      resource: '/api/v1/shor/execute', nonce: '0'.repeat(64), expiresAt: 1 };
    if (claimHash(claim) === claimHash({ ...claim, amountMicro: TESTNET.amountMicro + 1 })) throw new Error('Amount binding failed');
    return { scope: 'local-sanity-only' };
  }),
]);
const report = { scope: 'Prerequisites only', observedAt: new Date().toISOString(), checks,
  passed: checks.filter(c => c.status === 'PASS').length, total: checks.length, exitCode: reportExitCode(checks) };
if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2));
else {
  console.log('SHOR x402 - TestNet prerequisites (read-only)');
  for (const check of checks) console.log(`[${check.status}] ${check.name}\n  ${check.detail || JSON.stringify(check.evidence)}`);
  console.log(`Preflight: ${report.passed}/${report.total} PASS. Exit ${report.exitCode}.`);
  console.log('Preflight does not prove payment, settlement, execution, or durable replay prevention.');
}
process.exitCode = report.exitCode;
