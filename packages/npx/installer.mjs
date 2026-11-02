// Signature-verification helpers for future VENKY release artifacts.
// Installation stays disabled until real artifacts have been verified.
import { createHash, createPublicKey, verify } from 'node:crypto';

// plugins.updater.pubkey from src-tauri/tauri.conf.json (kept in sync by a test).
export const PUBKEY = 'dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IDM3OEQ0RkYwQ0I4QzRGODEKUldTQlQ0ekw4RStOTnhNYW9jL1pTZENocVU3TGNPeVVxcDdzdkN4d0s3R2lPekxGRitGLzVwM3oK';

// Planned platform targets only; no release artifacts are currently available.
export const ASSETS = {
  'darwin-arm64': 'VENKY-macOS-arm64.app.tar.gz',
  'darwin-x64': 'VENKY-macOS-x64.app.tar.gz',
  'win32-x64': 'VENKY-Windows-x64-setup.exe',
  'win32-arm64': 'VENKY-Windows-arm64-setup.exe',
  'linux-x64': 'VENKY-Linux-x86_64.AppImage',
  'linux-arm64': 'VENKY-Linux-aarch64.AppImage',
};
const PLATFORMS = {
  'darwin-arm64': 'macOS Apple silicon',
  'darwin-x64': 'macOS Intel',
  'win32-x64': 'Windows x64',
  'win32-arm64': 'Windows arm64',
  'linux-x64': 'Linux x64',
  'linux-arm64': 'Linux arm64',
};
export function supportedPlatforms() {
  return Object.keys(ASSETS).map(key => PLATFORMS[key]);
}
export function assetFor(platform = process.platform, arch = process.arch) {
  const asset = ASSETS[`${platform}-${arch}`];
  if (!asset) throw new Error(`VENKY Code has no build for ${platform}-${arch}. Supported: ${supportedPlatforms().join(', ')}.`);
  return asset;
}
const b64 = text => Buffer.from(text.trim(), 'base64');
const lines = buffer => buffer.toString('utf8').split('\n');
const SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');
const key = pk => createPublicKey({ key: Buffer.concat([SPKI_PREFIX, pk]), format: 'der', type: 'spki' });
/** Verify `data` against a Tauri `.sig` file (base64 of minisign text). */
export function verifyMinisign(data, sigFile, pubkey = PUBKEY) {
  const pub = b64(lines(b64(pubkey))[1]);
  const sigLines = lines(b64(sigFile));
  const sig = b64(sigLines[1]);
  if (pub.length !== 42 || pub.subarray(0, 2).toString() !== 'Ed') throw new Error('Bad public key.');
  if (sig.length !== 74) throw new Error('Bad signature.');
  const alg = sig.subarray(0, 2).toString();
  if (alg !== 'ED' && alg !== 'Ed') throw new Error('Unknown signature algorithm.');
  if (!pub.subarray(2, 10).equals(sig.subarray(2, 10))) throw new Error('Signature was made with a different key.');
  const pk = key(pub.subarray(10));
  const message = alg === 'ED' ? createHash('blake2b512').update(data).digest() : data;
  const raw = sig.subarray(10);
  if (!verify(null, message, pk, raw)) throw new Error('Signature does not match the download.');
  const prefix = 'trusted comment: ';
  if (!sigLines[2]?.startsWith(prefix)) throw new Error('Signature has no trusted comment.');
  const comment = Buffer.from(sigLines[2].slice(prefix.length));
  if (!verify(null, Buffer.concat([raw, comment]), pk, b64(sigLines[3] ?? ''))) throw new Error('Signature comment does not match.');
}
export function desktopEntry(exec, icon) {
  return `[Desktop Entry]\nType=Application\nName=VENKY Code\nComment=Desktop app for coding agents\nExec=${exec}\nIcon=${icon}\nTerminal=false\nCategories=Development;\nStartupWMClass=VENKY Code\n`;
}
export async function install() {
  throw new Error('VENKY Code downloads are unavailable until real release artifacts are verified.');
}
