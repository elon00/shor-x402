// Compile fixed source and prepare an unsigned TestNet deployment. Never signs or broadcasts.
import 'dotenv/config';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import algosdk from 'algosdk';
import { TESTNET } from '../src/security/testnet-evidence.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'contracts/algorand/artifacts');
try {
  const host = process.env.TESTNET_ALGOD_URL || process.env.ALGOD_TESTNET_URL || TESTNET.algod;
  const url = new URL(host);
  if (url.protocol !== 'https:') throw new Error('Algod endpoint must use HTTPS');
  const request = async (suffix, options = {}) => {
    const target = new URL(url);
    target.pathname = target.pathname.replace(/\/$/, '') + suffix;
    const res = await fetch(target, { ...options, redirect: 'error', signal: AbortSignal.timeout(15000),
      headers: { ...options.headers, ...(process.env.ALGOD_TESTNET_TOKEN ? { 'X-Algo-API-Token': process.env.ALGOD_TESTNET_TOKEN } : {}) } });
    if (!res.ok) throw new Error(`Algod request failed with HTTP ${res.status}`);
    return res.json();
  };
  const params = await request('/v2/transactions/params');
  if (params['genesis-hash'] !== TESTNET.genesisHash || params['genesis-id'] !== TESTNET.genesisId) throw new Error('Deployment planning requires verified Algorand TestNet');
  const compile = async name => {
    const source = await readFile(path.join(root, 'contracts/algorand', name), 'utf8');
    const compiled = await request('/v2/teal/compile', { method: 'POST', body: source, headers: { 'Content-Type': 'text/plain' } });
    const program = new Uint8Array(Buffer.from(compiled.result, 'base64'));
    if (!program.length || new algosdk.LogicSigAccount(program).address().toString() !== compiled.hash) throw new Error('Compiled program hash mismatch');
    return { source: name, programBase64: compiled.result, programHash: compiled.hash };
  };
  const approval = await compile('receipt-registry.approval.teal');
  const clear = await compile('receipt-registry.clear.teal');
  const plan = { status: 'COMPILED_NOT_DEPLOYED', network: TESTNET.network,
    observedRound: params['last-round'], approval, clear,
    schema: { globalInts: 1, globalBytes: 2, localInts: 0, localBytes: 0 },
    purpose: 'Optional creator-only receipt pointer. Not x402 settlement proof.',
    applicationId: null, confirmedTransactionId: null };
  const sender = process.env.TESTNET_DEPLOYER_ADDRESS;
  if (sender) {
    if (!algosdk.isValidAddress(sender)) throw new Error('Invalid TESTNET_DEPLOYER_ADDRESS');
    const firstValid = BigInt(params['last-round']);
    const tx = algosdk.makeApplicationCreateTxnFromObject({ sender,
      approvalProgram: new Uint8Array(Buffer.from(approval.programBase64, 'base64')),
      clearProgram: new Uint8Array(Buffer.from(clear.programBase64, 'base64')),
      onComplete: algosdk.OnApplicationComplete.NoOpOC,
      numGlobalInts: 1, numGlobalByteSlices: 2, numLocalInts: 0, numLocalByteSlices: 0,
      suggestedParams: { fee: BigInt(params['min-fee']), flatFee: true,
        firstValid, lastValid: firstValid + 200n, genesisID: TESTNET.genesisId,
        genesisHash: new Uint8Array(Buffer.from(TESTNET.genesisHash, 'base64')) } });
    plan.status = 'UNSIGNED_NOT_DEPLOYED';
    plan.sender = sender;
    plan.unsignedTransactionBase64 = Buffer.from(algosdk.encodeUnsignedTransaction(tx)).toString('base64');
    plan.validThroughRound = String(firstValid + 200n);
  }
  await mkdir(output, { recursive: true });
  await writeFile(path.join(output, 'deployment-plan.json'), JSON.stringify(plan, null, 2) + '\n');
  console.log(JSON.stringify({ status: plan.status, network: plan.network,
    approvalProgramHash: approval.programHash, clearProgramHash: clear.programHash,
    artifact: path.join(output, 'deployment-plan.json'),
    blockers: ['LocalNet execution/security tests', 'Wallet signing and confirmed TestNet creation'],
    applicationId: null, confirmedTransactionId: null }, null, 2));
  process.exitCode = 2;
} catch {
  console.error('Contract preparation failed. Check the configured TestNet provider and compiler support. No deployment was submitted.');
  process.exitCode = 1;
}
