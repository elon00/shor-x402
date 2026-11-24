import 'dotenv/config';
import { spawnSync } from 'node:child_process';
import { resolveApiEndpoint, DEFAULT_API_ORIGIN } from '../src/infrastructure/public-config.mjs';
const apiOrigin = process.env.VITE_API_BASE_URL || DEFAULT_API_ORIGIN;
if (!apiOrigin) {
  console.error('BLOCKED: Set VITE_API_BASE_URL to your HTTPS backend origin. IPFS static hosting cannot run this Express/PostgreSQL API.');
  process.exitCode = 2;
} else {
  try {
    resolveApiEndpoint('/api/health', apiOrigin);
    const result = spawnSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--configLoader', 'runner', '--base=./'],
      { stdio: 'inherit', env: { ...process.env, VITE_API_BASE_URL: apiOrigin, VITE_HOSTING_TARGET: 'ipfs' } });
    process.exitCode = result.status ?? 1;
  } catch { console.error('BLOCKED: VITE_API_BASE_URL must be an HTTPS origin without credentials.'); process.exitCode = 2; }
}
