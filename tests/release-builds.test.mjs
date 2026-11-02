import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('the candidate exposes no desktop release or download links', async () => {
  const site = await readFile(new URL('../website/src/pages/index.astro', import.meta.url), 'utf8');
  const distribution = await readFile(new URL('../website/src/lib/distribution.ts', import.meta.url), 'utf8');
  const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8');
  const updater = await readFile(new URL('../src/app-updates.ts', import.meta.url), 'utf8');
  const installer = await readFile(new URL('../packages/npx/installer.mjs', import.meta.url), 'utf8');

  assert.match(site, /Downloads unavailable/);
  assert.doesNotMatch(site, /project\.releases|platformDownloads|data-download|data-platform-download/);
  assert.doesNotMatch(site, /https:\/\/github\.com\/[^\s"']+\/releases/);
  assert.match(distribution, /Release\/download URLs stay absent until real VENKY artifacts are verified/);
  assert.match(readme, /Download links, GitHub Release pages, Homebrew packages and the `npx venky` installer are intentionally unavailable/);
  assert.doesNotMatch(readme, /https:\/\/github\.com\/[^\s)]+\/releases/);
  assert.match(updater, /const RELEASE_UPDATES_ENABLED = false/);
  assert.match(installer, /downloads are unavailable until real release artifacts are verified/i);
});
