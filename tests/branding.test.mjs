import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const SOURCE = /\.(?:ts|tsx|js|mjs|css|html|rs|json|toml|yml|yaml|astro)$/;
// The old product token must not survive anywhere it could reach a user,
// an identifier or a persisted key. Upstream attribution links are allowed.
const FORBIDDEN = ['pandacode', 'Pandacode', 'PandaCode', 'PANDACODE'];

async function files(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.map(entry => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return files(path);
    return SOURCE.test(entry.name) ? [path] : [];
  }));
  return nested.flat();
}

async function readSources(dirs) {
  const found = [];
  for (const dir of dirs) {
    for (const path of await files(join(root, dir))) {
      const name = relative(root, path);
      const base = name.split('/').pop() ?? name;
      if (base === 'LICENSE' || base.endsWith('.license')) continue;
      const text = await readFile(path, 'utf8');
      if (text.includes('aicodeking/pandacode')) continue;
      found.push({ path: name, text });
    }
  }
  return found;
}

test('the app is branded VENKY Code in the document, package and native config', async () => {
  const html = await readFile(join(root, 'index.html'), 'utf8');
  assert.match(html, /<title>VENKY Code<\/title>/);
  assert.match(html, /content="VENKY Code — a local workspace for coding agents\."/);
  const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
  assert.equal(pkg.name, 'venky');
  const tauri = JSON.parse(await readFile(join(root, 'src-tauri/tauri.conf.json'), 'utf8'));
  assert.equal(tauri.productName, 'VENKY Code');
  assert.equal(tauri.app.windows[0].title, 'VENKY Code');
});

test('the About screens carry the required PandaCode fork notice and link upstream', async () => {
  const about = await readFile(join(root, 'src/about-settings.ts'), 'utf8');
  assert.match(about, /This is a fork of PandaCode/);
  assert.match(about, /github\.com\/aicodeking\/pandacode/);
  const mobileAbout = await readFile(join(root, 'mobile/src/app/(tabs)/settings/index.tsx'), 'utf8');
  assert.match(mobileAbout, /link\('This is a fork of PandaCode', UPSTREAM\)/);
  assert.match(mobileAbout, /const SOURCE = 'https:\/\/github\.com\/vv3607527-creator\/venky-code'/);
  assert.match(mobileAbout, /const UPSTREAM = 'https:\/\/github\.com\/aicodeking\/pandacode'/);
  const readme = await readFile(join(root, 'README.md'), 'utf8');
  assert.match(readme, /This is a fork of PandaCode/);
  assert.match(readme, /github\.com\/aicodeking\/pandacode/);
});

test('the website renders the unchanged LICENSE verbatim and makes its attribution URL clickable', async () => {
  const license = await readFile(join(root, 'LICENSE'), 'utf8');
  const page = await readFile(join(root, 'website/src/pages/license.astro'), 'utf8');
  const { licenseTextToHtml } = await import('../website/src/lib/license-html.mjs');
  assert.match(page, /readFile\(new URL\('\.\.\/\.\.\/\.\.\/LICENSE', import\.meta\.url\), 'utf8'\)/);
  assert.match(page, /licenseTextToHtml\(licenseText\)/);
  assert.match(page, /set:html=\{licenseHtml\}/);
  assert.doesNotMatch(page, /This is a fork of VENKY Code|VENKY Code License/);
  const html = licenseTextToHtml(license);
  const plain = html
    .replace(/<a\b[^>]*>([\s\S]*?)<\/a>/g, '$1')
    .replace(/&(amp|lt|gt|quot|#39);/g, (_match, entity) => ({ amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'" })[entity]);
  assert.equal(plain, license);
  assert.equal((html.match(/<a\b/g) ?? []).length, 1);
  assert.ok(html.includes('<a href="https://github.com/aicodeking/pandacode" target="_blank" rel="noopener noreferrer">https://github.com/aicodeking/pandacode</a>'));
  assert.ok(license.replace(/\s+/g, ' ').includes('"This is a fork of PandaCode"'));
  assert.doesNotMatch(license, /This is a fork of VENKY Code/);
});

test('Expo Router has host-independent static web output configured', async () => {
  const app = JSON.parse(await readFile(join(root, 'mobile/app.json'), 'utf8'));
  assert.deepEqual(app.expo.platforms, ['ios', 'android', 'web']);
  assert.deepEqual(app.expo.web, { bundler: 'metro', output: 'static' });
  assert.equal(app.expo.web.origin, undefined);
});

test('no app source, test, script, website or CI file keeps the old PandaCode token', async () => {
  const sources = await readSources(['src', 'src-tauri/src', 'tests', 'mobile/src', 'mobile/tests', 'packages', 'scripts', 'website/src', 'website/tests', '.github', 'public', 'relay']);
  const offenders = [];
  for (const { path, text } of sources) {
    const lower = text.toLowerCase();
    for (const term of FORBIDDEN) if (lower.includes(term.toLowerCase())) offenders.push(`${path}: ${term}`);
  }
  assert.deepEqual(offenders, [], offenders.join('\n'));
});

test('the app tool namespace, run script and persisted keys use the venky prefix', async () => {
  const agentTools = await readFile(join(root, 'src-tauri/src/agent_tools.rs'), 'utf8');
  assert.match(agentTools, /"venky_run_project"/);
  assert.match(agentTools, /"venky_preview_file"/);
  const runScript = await readFile(join(root, 'src-tauri/src/run_script.rs'), 'utf8');
  assert.match(runScript, /pub const FILE_NAME: &str = "venky-run\.sh";/);
  const storage = await readFile(join(root, 'src-tauri/src/storage.rs'), 'utf8');
  assert.match(storage, /user_version/);
});
