import 'dotenv/config';
import { inspectQuickNode } from '../src/infrastructure/chain-rpc.mjs';
import { resolveApiEndpoint, DEFAULT_API_ORIGIN } from '../src/infrastructure/public-config.mjs';
import { observe, reportExitCode } from '../src/security/testnet-evidence.mjs';
const checks = [];
checks.push(process.env.QUICKNODE_EVM_RPC_URL
  ? await observe('QuickNode EVM TestNet chain identity', () => inspectQuickNode())
  : { name: 'QuickNode EVM TestNet chain identity', status: 'BLOCKED', detail: 'QUICKNODE_EVM_RPC_URL is not configured.' });
checks.push({ name: 'IPFS live upload and retention', status: 'BLOCKED',
  detail: process.env.IPFS_RPC_URL ? 'Provider configured. No public receipt upload or retention was verified.' : 'Set server-only IPFS_RPC_URL and provider credentials.' });
checks.push(!(process.env.VITE_API_BASE_URL || DEFAULT_API_ORIGIN)
  ? { name: 'IPFS frontend backend origin configuration', status: 'BLOCKED', detail: 'Set public VITE_API_BASE_URL to the HTTPS backend origin.' }
  : await observe('IPFS frontend backend origin configuration', async () => {
  if (!(process.env.VITE_API_BASE_URL || DEFAULT_API_ORIGIN)) throw new Error();
  resolveApiEndpoint('/api/health', process.env.VITE_API_BASE_URL || DEFAULT_API_ORIGIN);
  return { scope: 'configuration-only; does not prove backend health' };
}));
checks.push({ name: 'Netlify release and independent IPFS publication', status: 'BLOCKED',
  detail: 'Requires a new Netlify release, a verified IPFS CID, and live smoke tests. Fleek Hosting was discontinued.' });
checks.push({ name: 'SHOR smart contract deployment', status: 'BLOCKED',
  detail: 'Compile and review the Algorand receipt registry, test on LocalNet, then sign and verify a TestNet creation transaction.' });
const report = { scope: 'Web3 integration readiness', observedAt: new Date().toISOString(), checks, exitCode: reportExitCode(checks) };
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.exitCode;
