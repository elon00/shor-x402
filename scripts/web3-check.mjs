// One command for reproducible local checks and honest live readiness results.
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, '.web3-checks');
await mkdir(output, { recursive: true });
const npmCli = process.env.npm_execpath || path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
const steps = [
  ['TypeScript', [npmCli, 'run', 'lint']],
  ['Web3 regression tests (fixtures, not live settlement)', [npmCli, 'run', 'test:web3']],
  ['Existing regression tests (database test may skip without credentials)', [npmCli, 'test']],
  ['PQC tests', [npmCli, 'run', 'test:nist']],
  ['Adversarial tests', [npmCli, 'run', 'test:adversarial']],
  ['Frontend production build', [npmCli, 'run', 'build']],
  ['Backend production build', [npmCli, 'run', 'build:server']],
  ['Netlify functions build', [npmCli, 'run', 'build:functions']],
  ['Netlify function regression tests', [npmCli, 'run', 'test:netlify']],
  ['HTTP smoke tests', [npmCli, 'run', 'test:http']],
  ['CodeQL security analysis', [npmCli, 'run', 'security:codeql']],
  ['Dependency advisory audit', [npmCli, 'audit', '--audit-level=high']],
  ['Live TestNet prerequisites', ['scripts/testnet-staging-preflight.mjs']],
  ['Gate 14 live evidence', ['scripts/testnet-e2e-runner.mjs']],
  ['Web3 provider readiness', ['scripts/web3-preflight.mjs']],
  ['Compile and prepare unsigned Algorand deployment', ['scripts/algorand-deploy-plan.mjs']],
  ['Portable IPFS build with configured backend', [npmCli, 'run', 'build:ipfs']],
];
const results = [];
for (const [name, args] of steps) {
  console.log(`\nRunning ${name}`);
  let log = '';
  const code = await new Promise(resolve => {
    const child = spawn(process.execPath, args, { cwd: root, env: process.env, stdio: ['ignore', 'pipe', 'pipe'] });
    child.stdout.on('data', data => { log += data; process.stdout.write(data); });
    child.stderr.on('data', data => { log += data; process.stderr.write(data); });
    child.on('error', () => resolve(1));
    child.on('close', code => resolve(code ?? 1));
  });
  const status = code === 0 ? 'PASS' : code === 2 ? 'BLOCKED' : 'FAIL';
  results.push({ name, status, exitCode: code });
  await writeFile(path.join(output, String(results.length).padStart(2, '0') + '.log'), log);
}
const report = { observedAt: new Date().toISOString(), repository: root,
  productionReady: false, results,
  note: 'Unit tests, preflight and historical transfers do not establish live paid execution. Deployment and uploads require their own evidence.' };
await writeFile(path.join(output, 'latest.json'), JSON.stringify(report, null, 2) + '\n');
console.table(results);
console.log(`Report saved to ${path.join(output, 'latest.json')}`);
process.exitCode = results.some(r => r.status === 'FAIL') ? 1 : results.some(r => r.status === 'BLOCKED') ? 2 : 0;
