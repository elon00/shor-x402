/** Read-only inspector. Never signs, settles, or broadcasts transactions. */
import { verifyGate14 } from '../src/security/testnet-evidence.mjs';
const report = await verifyGate14({
  merchant: process.env.TESTNET_MERCHANT_ADDRESS || undefined,
  payer: process.env.TESTNET_PAYER_ADDRESS,
  txId: process.env.TESTNET_PAYMENT_TXID || process.env.TESTNET_TXID,
  algod: process.env.TESTNET_ALGOD_URL || undefined,
  indexer: process.env.TESTNET_INDEXER_URL || undefined,
});
if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2));
else {
  console.log('SHOR x402 - Gate 14 live evidence (read-only)');
  for (const check of report.checks) console.log(`[${check.status}] ${check.name}\n  ${check.detail || JSON.stringify(check.evidence)}`);
  console.log(`Gate 14: ${report.passed}/${report.total} PASS. Exit ${report.exitCode}.`);
  console.log('Exit codes: 0 verified, 1 failed evidence, 2 incomplete/blocked.');
  console.log('Funding or manually transferring USDC cannot complete missing live integrations.');
}
process.exitCode = report.exitCode;
