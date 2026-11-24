import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
for (const path of ['server.ts', 'netlify/functions/shor-execute.ts']) {
  test(`SECURITY: ${path} includes fail-closed paid execution hold`, () => {
    const source = readFileSync(new URL('../' + path, import.meta.url), 'utf8');
    assert.match(source, /SECURITY_HOLD/);
    assert.match(source, /503/);
  });
}
