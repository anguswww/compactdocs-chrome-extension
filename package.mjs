import { readFileSync, mkdirSync, mkdtempSync, cpSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
const manifest = JSON.parse(readFileSync('manifest.json', 'utf8'));
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
if (manifest.version !== pkg.version) throw new Error('Package and manifest versions must match');
const files = ['LICENSE', 'manifest.json', 'styles.js', 'layout.js', 'hover.js', 'content.js', 'popup.html', 'popup.js', ...Object.values(manifest.icons)];
const target = resolve('dist', `compactdocs-${manifest.version}.zip`);
mkdirSync('dist', { recursive: true });
const staging = mkdtempSync(join(tmpdir(), 'compactdocs-release-'));
try {
  for (const file of files) {
    const destination = join(staging, file);
    mkdirSync(resolve(destination, '..'), { recursive: true });
    cpSync(file, destination);
  }
  rmSync(target, { force: true });
  execFileSync('zip', ['-q', '-X', target, ...files], { cwd: staging });
  console.log(target);
} finally {
  rmSync(staging, { recursive: true, force: true });
}
