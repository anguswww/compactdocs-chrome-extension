const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, mkdtempSync, cpSync, existsSync, rmSync, mkdirSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve, dirname } = require('node:path');
const { execFileSync } = require('node:child_process');
const root = resolve(__dirname, '..');

test('release ZIP contains MIT license and only distributable extension files', () => {
  const staging = mkdtempSync(join(tmpdir(), 'compactdocs-package-test-'));
  try {
    const manifest = JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf8'));
    const runtime = ['manifest.json', 'styles.js', 'hover.js', 'content.js', 'popup.html', 'popup.js', ...Object.values(manifest.icons)];
    for (const name of ['package.mjs', 'package.json', ...runtime, ...(existsSync(join(root, 'LICENSE')) ? ['LICENSE'] : [])]) {
      const destination = join(staging, name);
      mkdirSync(dirname(destination), { recursive: true });
      cpSync(join(root, name), destination);
    }
    execFileSync(process.execPath, ['package.mjs'], { cwd: staging });
    const archive = join(staging, 'dist', `compactdocs-${manifest.version}.zip`);
    const entries = execFileSync('unzip', ['-Z1', archive], { encoding: 'utf8' }).trim().split('\n');
    assert.ok(entries.includes('LICENSE'), 'release ZIP must contain the MIT license');
    assert.deepEqual(entries.sort(), [...runtime, 'LICENSE'].sort());
    assert.match(execFileSync('unzip', ['-p', archive, 'LICENSE'], { encoding: 'utf8' }), /MIT License/);
    assert.equal(execFileSync('unzip', ['-p', archive, 'manifest.json'], { encoding: 'utf8' }), readFileSync(join(root, 'manifest.json'), 'utf8'));
  } finally {
    rmSync(staging, { recursive: true, force: true });
  }
});
