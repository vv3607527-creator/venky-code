#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { install, supportedPlatforms } from '../installer.mjs';
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`Usage: npx venky [--dry-run] [--help] [--version]

Installation is disabled; verified VENKY Code artifacts are not available yet.
Planned targets: ${supportedPlatforms().join(', ')}.
  --dry-run   currently unavailable
  --version   print this installer's version`);
} else if (args.includes('--version') || args.includes('-v')) {
  console.log(JSON.parse(readFileSync(new URL('../package.json', import.meta.url))).version);
} else {
  install({ dryRun: args.includes('--dry-run') }).catch(error => {
    console.error(`venky: ${error.message}`);
    process.exit(1);
  });
}
