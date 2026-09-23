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
import { spawnSync } from 'node:child_process';

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

if (lines.length) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: `Repo state at session start:\n${lines.join('\n')}` },
  }));
}
process.exit(0);
