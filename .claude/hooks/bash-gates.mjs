#!/usr/bin/env node
/**
 * bash-gates — PreToolUse checks for shell commands, one process for all of them.
 *
 * ⚠️ WHY. Each rule below was written into memory, agreed, and then broken again,
 * because a rule in a markdown file is advice and a hook is a gate. All of them
 * ASK rather than deny: every one has a legitimate exception, and "ask" makes the
 * dangerous case conscious without blocking real work.
 *
 *   1. A gate piped into grep/tail/head reports the PIPE's exit code, not the
 *      gate's. "Tests passed" was read off a failing run more than once
 *      (feedback_gate_exit_code_not_grep, feedback_and_chain_masks_failures).
 *      Allowed when the command captures PIPESTATUS.
 *   2. Release commands on a DIRTY tree: vite bakes the git SHA into the bundle,
 *      so building before committing ships a binary whose SHA lies
 *      (feedback_commit_before_build_sha — bit twice in one day).
 *   3. Release commands OFF main: stale-branch sessions burned us twice in two
 *      days (feedback_verify_branch_first).
 *   4. A simulator OLDER than the installed iOS SDK: build 138 passed an iOS 26.5
 *      simulator and was killed at launch on every iOS 27 phone
 *      (feedback_test_on_the_newest_os). Only checks devices named by UDID or
 *      "booted"; a real device via TestFlight cannot be hooked.
 *
 * Reads tool_input.command, which is the field for Bash, Serena's
 * execute_shell_command, desktop-commander's start_process and the terminal
 * tool alike — so none of those is a way around it.
 */
import { spawnSync } from 'node:child_process';

const run = (cmd, args, ms = 4000) => {
  const r = spawnSync(cmd, args, { encoding: 'utf8', timeout: ms, cwd: process.env.CLAUDE_PROJECT_DIR || process.cwd() });
  return r.status === 0 ? String(r.stdout || '').trim() : null;
};

const ask = (reason) => {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'ask', permissionDecisionReason: reason },
  }));
  process.exit(0);
};

// ── 1. gate output piped away from its exit code ─────────────────────────────
export const GATE = /\b(npm run build|npm (run )?test|npx vitest|vitest run|playwright test|npx eslint|eslint )/;
export function pipedGate(cmd) {
  if (!GATE.test(cmd) || /PIPESTATUS|set -o pipefail/.test(cmd)) return false;
  // the gate and a pipe to a filter inside the same simple command
  return cmd.split(/;|&&|\|\||\n/).some((seg) => GATE.test(seg) && /\|\s*(grep|tail|head|sed|awk)\b/.test(seg));
}

// ── 2/3. release commands ────────────────────────────────────────────────────
export const RELEASE = /\b(cap sync|cap copy|xcodebuild\b[^\n]*\barchive\b|gradlew\b[^\n]*\b(bundleRelease|assembleRelease)\b|preflight-release)/;

// ── 4. simulator runtime vs SDK ──────────────────────────────────────────────
export const SIM = /\bsimctl\s+(boot|install|launch)\b/;
const UDID = /\b[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}\b/i;
export function staleRuntimes(cmd) {
  const sdk = parseFloat(run('xcrun', ['--sdk', 'iphonesimulator', '--show-sdk-version']) || '');
  if (!sdk) return [];
  const listing = run('xcrun', ['simctl', 'list', 'devices', '-j'], 8000);
  if (!listing) return [];
  let devices;
  try { devices = JSON.parse(listing).devices; } catch { return []; }
  const want = cmd.match(UDID)?.[0]?.toUpperCase();
  const hits = [];
  for (const [rt, list] of Object.entries(devices)) {
    const m = rt.match(/iOS-(\d+)-(\d+)/);
    if (!m) continue;
    const ver = parseFloat(`${m[1]}.${m[2]}`);
    for (const d of list) {
      const target = want ? d.udid.toUpperCase() === want : (/\bbooted\b/.test(cmd) && d.state === 'Booted');
      if (target && Math.floor(ver) < Math.floor(sdk)) hits.push(`${d.name} (iOS ${ver})`);
    }
  }
  return hits.length ? [hits, sdk] : [];
}

let raw = '';
process.stdin.on('data', (c) => { raw += c; });
process.stdin.on('end', () => {
  let cmd = '';
  try { cmd = String(JSON.parse(raw || '{}')?.tool_input?.command || ''); } catch { /* stay out of the way */ }
  if (!cmd) return void process.exit(0);

  if (pipedGate(cmd)) {
    ask('A build/test gate is piped into grep/tail/head, so the command reports the FILTER\'s exit code, not the gate\'s — a failing build reads as success. Write the output to a log and print the exit code (`npm run build > /tmp/b.log 2>&1; echo EXIT=$?`), or capture ${PIPESTATUS[0]}.');
  }

  if (RELEASE.test(cmd)) {
    const branch = run('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
    if (branch && branch !== 'main') {
      ask(`Release command on branch "${branch}", not main. Stale-branch sessions have shipped old code twice. Confirm this branch is the one to release.`);
    }
    const dirty = (run('git', ['status', '--porcelain', '--untracked-files=no']) || '').split('\n').filter(Boolean);
    if (dirty.length) {
      ask(`Release command with ${dirty.length} uncommitted file(s) (${dirty.slice(0, 3).map((l) => l.slice(3)).join(', ')}${dirty.length > 3 ? ', …' : ''}). Vite bakes the git SHA into the bundle, so this binary would carry a SHA that does not match its code. Commit first, then build.`);
    }
  }

  if (SIM.test(cmd)) {
    const [hits, sdk] = staleRuntimes(cmd);
    if (hits?.length) {
      ask(`Simulator ${hits.join(', ')} is older than the installed iOS ${sdk} SDK. Build 138 passed an iOS 26.5 simulator and was killed at launch on every iOS 27 phone. Test on an iOS ${Math.floor(sdk)} simulator (xcrun simctl list runtimes), or confirm the older one is deliberate.`);
    }
  }
  process.exit(0);
});
