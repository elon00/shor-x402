import fs from 'node:fs';

const files = ['server.ts', 'src', 'netlify', 'api'];
const roots = files.filter((p) => fs.existsSync(p));
const textFiles = [];

function walk(path) {
  const stat = fs.statSync(path);
  if (stat.isDirectory()) {
    for (const name of fs.readdirSync(path)) walk(`${path}/${name}`);
  } else if (/\.(ts|tsx|js|mjs|cjs)$/.test(path)) {
    textFiles.push(path);
  }
}
for (const root of roots) walk(root);

const forbiddenPatterns = [
  { re: /signatureHex:\s*req\.headers\[['"]x-pqc-signature['"]\]\s*\|\|\s*['"][0-9a-f]+/i, reason: 'hard-coded PQC signature fallback' },
  { re: /verified:\s*true\s*[,\n]/, reason: 'unconditional verification claim' },
  { re: /pqcVerified:\s*true/, reason: 'unconditional PQC verification claim' },
  { re: /HYBRID-ED25519-(?:VALID|VERIFIED|PQC-BENCHMARK)/, reason: 'unproven hybrid cryptography status' },
  { re: /minEntropyBitsPerByte:\s*7\.9998/, reason: 'hard-coded entropy quality claim' },
  { re: /pointsProcessed:\s*14500000/, reason: 'hard-coded satellite workload claim' },
  { re: /aggregateLiquidityUsdc:\s*48920000/, reason: 'hard-coded market-data claim' },
];

const failures = [];
for (const file of textFiles) {
  const text = fs.readFileSync(file, 'utf8');
  for (const { re, reason } of forbiddenPatterns) {
    if (re.test(text)) failures.push(`${file}: ${reason}`);
  }
}

if (failures.length) {
  console.error('THE CREATOR PRODUCTION CLAIM GATE: BLOCKED');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('THE CREATOR PRODUCTION CLAIM GATE: PASS');
console.log(`Scanned ${textFiles.length} source files.`);
