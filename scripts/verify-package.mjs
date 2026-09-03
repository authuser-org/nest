import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const temporaryDirectory = mkdtempSync(join(tmpdir(), 'authuser-nest-package-'));
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

try {
  const packOutput = execFileSync(
    npm,
    ['pack', '--json', '--ignore-scripts', '--pack-destination', temporaryDirectory],
    { cwd: root, encoding: 'utf8' },
  );
  const [manifest] = JSON.parse(packOutput);
  if (!manifest?.filename || !Array.isArray(manifest.files)) {
    throw new Error('npm pack did not return a valid manifest');
  }

  const files = new Set(manifest.files.map((entry) => entry.path));
  for (const required of [
    'dist/index.js',
    'dist/index.d.ts',
    'README.md',
    'SECURITY.md',
    'SUPPORT.md',
    'docs/security.md',
  ]) {
    if (!files.has(required)) throw new Error(`Published package is missing ${required}`);
  }
  for (const entry of files) {
    if (/^(src|test|example|scripts|benchmark)\//.test(entry)) {
      throw new Error(`Private development file would be published: ${entry}`);
    }
  }

  execFileSync(npm, ['init', '-y'], { cwd: temporaryDirectory, stdio: 'ignore' });
  const generatedPackage = JSON.parse(readFileSync(join(temporaryDirectory, 'package.json'), 'utf8'));
  writeFileSync(join(temporaryDirectory, 'package.json'), JSON.stringify({
    ...generatedPackage,
    private: true,
    type: 'module',
  }, null, 2));
  execFileSync(npm, [
    'install',
    '--ignore-scripts',
    '--no-audit',
    '--no-fund',
    join(temporaryDirectory, manifest.filename),
  ], { cwd: temporaryDirectory, stdio: 'ignore' });

  writeFileSync(join(temporaryDirectory, 'verify.mjs'), `
    import assert from 'node:assert/strict';
    import { createApp, configureHttpApp } from '@authuser/nest';
    assert.equal(typeof createApp, 'function');
    assert.equal(typeof configureHttpApp, 'function');
  `);
  writeFileSync(join(temporaryDirectory, 'verify.cjs'), `
    const assert = require('node:assert/strict');
    const api = require('@authuser/nest');
    assert.equal(typeof api.createApp, 'function');
    assert.equal('createNestApp' in api, false);
    assert.equal('createHttpApp' in api, false);
  `);
  execFileSync(process.execPath, ['verify.mjs'], { cwd: temporaryDirectory, stdio: 'inherit' });
  execFileSync(process.execPath, ['verify.cjs'], { cwd: temporaryDirectory, stdio: 'inherit' });

  console.log(`Verified ${manifest.name}@${manifest.version} in ESM and CommonJS (${files.size} files).`);
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
