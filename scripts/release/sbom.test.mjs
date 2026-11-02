import assert from 'node:assert/strict';
import test from 'node:test';
import { coverage, inventoryStatus, markdown, packagedAssets, platformOf, scanStatus } from './sbom.mjs';

test('picks installers and updater archives only', () => {
  const names = ['VENKY-macOS-arm64.dmg', 'VENKY-macOS-arm64.dmg.sha256', 'latest.json', 'VENKY-macOS-arm64.app.tar.gz.sig', 'VENKY-Linux-x86_64.AppImage'];
  assert.deepEqual(packagedAssets(names), ['VENKY-Linux-x86_64.AppImage', 'VENKY-macOS-arm64.dmg']);
  assert.equal(platformOf('VENKY-Windows-x64-setup.exe'), 'win32/x64');
});

test('an empty or failed inventory is incomplete, never ok', () => {
  assert.equal(inventoryStatus({ bom: { components: [] } }).status, 'incomplete');
  assert.equal(inventoryStatus({ bom: {} }).status, 'incomplete');
  assert.match(inventoryStatus({ error: 'boom' }).reason, /boom/);
  assert.deepEqual(inventoryStatus({ bom: { components: [{}, {}] } }), { status: 'ok', components: 2 });
});

test('a scan needs a complete inventory and counts severities', () => {
  assert.equal(scanStatus({ status: 'incomplete' }, {}).status, 'not-scanned');
  assert.equal(scanStatus({ status: 'ok' }, { error: 'db' }).status, 'failed');
  const scanned = scanStatus({ status: 'ok' }, { report: { matches: [{ vulnerability: { severity: 'High' } }, { vulnerability: { severity: 'odd' } }] } });
  assert.equal(scanned.findings, 2);
  assert.equal(scanned.severities.High, 1);
  assert.equal(scanned.severities.Unknown, 1);
  assert.equal(scanStatus({ status: 'ok' }, { report: {} }).findings, 0);
});

test('coverage is not complete while any inventory is incomplete', () => {
  const ok = { name: 'a', kind: 'artifact', platform: 'x', inventory: { status: 'ok', components: 3 }, scan: { status: 'scanned', findings: 0 } };
  const bad = { name: 'b.dmg', kind: 'artifact', platform: 'y', sha256: 'ff', inventory: { status: 'incomplete', reason: 'none' }, scan: { status: 'not-scanned', reason: 'inventory incomplete' } };
  const base = { version: '1.2.3', commit: 'abc', scanners: { syft: '1', grype: '2' }, notes: ['n'] };
  assert.equal(coverage({ ...base, entries: [ok] }).complete, true);
  const report = coverage({ ...base, entries: [ok, bad] });
  assert.equal(report.complete, false);
  assert.deepEqual(report.incomplete, ['b.dmg']);
  assert.match(markdown(report), /Coverage is incomplete\*\* for: `b\.dmg`/);
  assert.match(markdown(report), /unknown|Vulnerability database built/);
});
