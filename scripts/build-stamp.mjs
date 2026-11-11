// Last step of `npm run build`: record that every gate passed, and when.
// .claude/hooks/bash-gates.mjs refuses a push to main when an app file in the push
// was modified after this time (CLAUDE.md: run the build before pushing; a build that
// fails the Home JS budget leaves production silently on the previous deploy).
// Only reached when every earlier step exited 0, because the build is an && chain.
import { writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

let head = '';
try { head = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim(); } catch { /* not a checkout (CI tarball) */ }
writeFileSync('.build-ok', JSON.stringify({ time: Date.now(), head, at: new Date().toISOString() }) + '\n');
console.log('✓ build-stamp: every gate passed, .build-ok written');
