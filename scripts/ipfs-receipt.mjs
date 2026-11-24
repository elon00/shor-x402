import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import 'dotenv/config';
import { encodePublicReceipt, storePublicReceipt } from '../src/infrastructure/ipfs-store.mjs';
try {
  const file = process.argv.find(arg => arg.startsWith('--file='))?.slice(7);
  if (!file) throw new Error('Use --file=path/to/public-receipt.json. Only the documented public schema is accepted.');
  const receipt = JSON.parse(await readFile(file, 'utf8'));
  const bytes = encodePublicReceipt(receipt);
  if (!process.argv.includes('--publish-public')) {
    console.log(JSON.stringify({ status: 'REVIEW', bytes: bytes.length,
      sha256: createHash('sha256').update(bytes).digest('hex'), receipt,
      next: 'Add --publish-public to upload this receipt to public IPFS storage.' }, null, 2));
    process.exitCode = 2;
  } else console.log(JSON.stringify(await storePublicReceipt(receipt), null, 2));
} catch (error) { console.error(error.message); process.exitCode = 1; }
