#!/usr/bin/env node
/**
 * session-start — print the state that sessions have repeatedly assumed wrong.
 *
 * ⚠️ WHY. Stale-branch sessions burned two days (feedback_verify_branch_first);
 * production deploys failed silently for four days (09-17→21); CI was red on 40
 * straight pushes (09-07→23) and nobody noticed. Every one of those was visible
 * in one command — nobody ran it. This runs it, and its output lands in the
 * session's context before the first message is read.
 *
 * Never blocks. Every lookup has a short timeout and fails quiet: a slow network
 * must not delay a session, and a missing `gh` just drops those lines.
 */
import { spawn, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const cwd = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const run = (cmd, args, ms = 4000) => {
  const r = spawnSync(cmd, args, { encoding: 'utf8', timeout: ms, cwd });
  return r.status === 0 ? String(r.stdout || '').trim() : null;
};

const lines = [];
const branch = run('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
if (branch) {
  run('git', ['fetch', '-q', 'origin'], 6000);
  const counts = run('git', ['rev-list', '--left-right', '--count', 'HEAD...origin/main']);
  const [ahead, behind] = (counts || '0 0').split(/\s+/).map(Number);
  const dirty = (run('git', ['status', '--porcelain', '--untracked-files=no']) || '').split('\n').filter(Boolean).length;
  const warn = branch !== 'main' || behind > 0;
  lines.push(`${warn ? '⚠️ ' : ''}git: branch ${branch} · ${ahead} ahead / ${behind} behind origin/main · ${dirty} uncommitted file(s)`);
  if (branch !== 'main') lines.push('   Not on main — check this is the intended branch before building or releasing anything.');
  if (behind > 0) lines.push('   Behind origin/main — pull before editing, or work will be built on stale code.');
}

const gh = (wf) => run('gh', ['run', 'list', '--workflow', wf, '--branch', 'main', '--limit', '1', '--json', 'conclusion,status,headSha', '--jq', '.[0] | "\\(.status) \\(.conclusion) \\(.headSha[0:8])"'], 6000);
for (const [wf, label] of [['deploy-check.yml', 'Production deploy'], ['ci.yml', 'CI']]) {
  const r = gh(wf);
  if (!r) continue;
  const [status, conclusion, sha] = r.split(' ');
  const bad = status === 'completed' && conclusion !== 'success';
  lines.push(`${bad ? '🚨 ' : ''}${label}: ${status === 'completed' ? conclusion : status} on ${sha}${bad ? ' — FIX THIS FIRST; a red gate left red becomes noise (CI was red 40 pushes running)' : ''}`);
}

// App Store state, from a cache refreshed in the background (never waits on Apple).
const state = (f) => { try { return JSON.parse(readFileSync(path.join(cwd, '.claude/state', f), 'utf8')); } catch { return null; } };
const ago = (t) => { const h = (Date.now() - t) / 36e5; return h < 1 ? 'under an hour ago' : h < 48 ? `${Math.round(h)} h ago` : `${Math.round(h / 24)} days ago`; };
const store = state('store.json');
if (!store || Date.now() - store.time > 2 * 36e5) {
  try { spawn('node', [path.join(cwd, '.claude/hooks/store-state.mjs')], { cwd, detached: true, stdio: 'ignore' }).unref(); } catch { /* skip */ }
}
if (store?.live) {
  const parts = [`App Store: ${store.live.v} live`];
  if (store.pending) parts.push(`${store.pending.v} ${store.pending.state}`);
  if (store.newestBuild) parts.push(`newest build ${store.newestBuild.build} (${store.newestBuild.state})`);
  lines.push(`${parts.join(' · ')} — read ${ago(store.time)}; confirm with \`node scripts/asc.mjs versions\` before quoting it`);
}
const gsc = state('gsc-last-read.json');
const gscDays = gsc ? (Date.now() - gsc.time) / 864e5 : Infinity;
lines.push(`${gscDays > 1 ? '⚠️ ' : ''}Search Console last read: ${gsc ? ago(gsc.time) : 'never recorded'}${gscDays > 1 ? ' — the Google-drop watch reads it daily (project_google_drop_oct20)' : ''}`);

if (lines.length) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: `Repo state at session start:\n${lines.join('\n')}` },
  }));
}
process.exit(0);
