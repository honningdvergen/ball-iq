#!/usr/bin/env node
// store-state — refresh .claude/state/store.json from App Store Connect (scripts/asc.mjs).
// Started detached by session-start.mjs when the cache is over 2 hours old, so a session never
// waits on Apple. Why: "prod status is unknowable from the repo", and sessions have stated the
// wrong release state (in review vs live, newest TestFlight build) more than once.
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const asc = (...a) => {
  const r = spawnSync('node', ['scripts/asc.mjs', ...a], { cwd: root, encoding: 'utf8', timeout: 30000 });
  return r.status === 0 ? r.stdout : '';
};
const versions = asc('versions').split('\n').map((l) => l.match(/^\s+(\d+\.\d+(?:\.\d+)?)\s+IOS\s+(\S+)/)).filter(Boolean).map((m) => ({ v: m[1], state: m[2] }));
const builds = asc('builds', '--limit', '1').split('\n').map((l) => l.match(/\((\d+)\)\s+(\S+)/)).filter(Boolean).map((m) => ({ build: m[1], state: m[2] }));
if (!versions.length) process.exit(0); // keep the old cache rather than writing an empty one
const live = versions.find((x) => x.state === 'READY_FOR_SALE');
// the newest version record, when it is not the live one (in review, prepare for submission, rejected)
const pending = versions[0] !== live ? versions[0] : null;
mkdirSync(path.join(root, '.claude/state'), { recursive: true });
writeFileSync(path.join(root, '.claude/state/store.json'), JSON.stringify({ time: Date.now(), live, pending: pending ?? null, newestBuild: builds[0] ?? null }) + '\n');
