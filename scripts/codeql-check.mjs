import { spawnSync } from 'node:child_process';
import path from 'node:path';
const cli = process.platform === 'win32' ? 'codeql.exe' : 'codeql';
const probe = spawnSync(cli, ['version'], { encoding: 'utf8' });
if (probe.error?.code === 'ENOENT') {
  console.error('BLOCKED: CodeQL CLI is unavailable locally. The GitHub CodeQL workflow is configured but has not run for these local changes.');
  process.exitCode = 2;
} else if (probe.status !== 0) {
  console.error('CodeQL CLI could not start.'); process.exitCode = 1;
} else {
  const db = path.resolve('.web3-checks/codeql-db');
  const create = spawnSync(cli, ['database', 'create', db, '--language=javascript-typescript',
    '--source-root=' + process.cwd(), '--overwrite'], { stdio: 'inherit' });
  if (create.status !== 0) process.exitCode = create.status ?? 1;
  else {
    const analyze = spawnSync(cli, ['database', 'analyze', db,
      'codeql/javascript-queries:codeql-suites/javascript-security-extended.qls',
      '--format=sarif-latest', '--output=' + path.resolve('.web3-checks/codeql.sarif')], { stdio: 'inherit' });
    process.exitCode = analyze.status ?? 1;
  }
}
