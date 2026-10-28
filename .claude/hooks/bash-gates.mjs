#!/usr/bin/env node
/**
 * bash-gates — PreToolUse checks for shell commands, one process for all of them.
 *
 * ⚠️ WHY. Each rule below was written into memory, agreed, and then broken again,
 * because a rule in a markdown file is advice and a hook is a gate. All of them
 * ASK rather than deny: every one has a legitimate exception, and "ask" makes the
 * dangerous case conscious without blocking real work.
 *
 * EXCEPT RULE 1, which NOTES rather than asks (Alex, 16 Oct 2026: "is this
 * ocean of constant needed approvals really necessary?"). Every agent pipes a
 * vitest run into grep a dozen times a session, so it was the prompt he saw
 * most, and his tap fixes nothing: the risk is the agent misreading a result,
 * so the reminder goes to the agent, not to him. Rules 2 to 4 are rare and
 * guard real release failures; they still ask.
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
 *   5–9 (added 28 Oct 2026, Alex: "go ahead, everything you think will benefit
 *      us"). These DENY rather than ask, so the agent fixes the command itself
 *      and Alex is not pinged. Prefix the command with BALLIQ_OVERRIDE=1 to
 *      turn a deny into an ask when the exception is real.
 *   5. `git push` to main with app files changed since the last green
 *      `npm run build` (.build-ok, written by the build's last step). A build
 *      that fails the Home JS budget leaves production on the previous deploy.
 *   6. Sweeping stages on main (`git add -A/./-u`, `git commit -a`) and
 *      `--amend`: the social session commits under social/ in this same
 *      checkout, and other sessions commit to main too (CLAUDE.md).
 *   7. Reading the App Store Connect .p8 keys. They are passed as paths only.
 *   8. Booting a second simulator while one is already running (Tide HQ shares
 *      this Mac); booting the first one adds a reminder to tell Tide HQ.
 *   9. Committing a public/sw.js logic change without a CACHE_VERSION bump.
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
import fs from 'node:fs';
import path from 'node:path';

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

const OVERRIDE = /\bBALLIQ_OVERRIDE=1\b/;
let cmdForOverride = '';
const deny = (reason) => {
  if (OVERRIDE.test(cmdForOverride)) ask(`${reason}\n\n(BALLIQ_OVERRIDE=1 was given, so this asks instead of refusing.)`);
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: `${reason}\n\nIf this is a real exception, prefix the command with BALLIQ_OVERRIDE=1 and Alex will be asked.` },
  }));
  process.exit(0);
};

// Quoted strings and heredoc bodies hold commit messages; flags inside them are not flags.
export const stripQuoted = (cmd) => cmd
  .replace(/<<-?\s*['"]?(\w+)['"]?[\s\S]*?\n\s*\1\b/g, ' ')
  .replace(/'[^']*'/g, ' ')
  .replace(/"(?:[^"\\]|\\.)*"/g, ' ');
const segments = (cmd) => stripQuoted(cmd).split(/;|&&|\|\||\||\n/).map((x) => x.trim()).filter(Boolean);

// ── 5. push to main without a green build of the current files ──────────────
const NO_BUILD_NEEDED = /^(social|docs)\/|\.md$|^\.claude\/|^\.github\/|^\.agents\/|^\.codex\//;
export function pushesMain(cmd, branch) {
  return segments(cmd).some((seg) => {
    const m = seg.match(/\bgit\s+push\b(.*)$/);
    if (!m || /\s(--dry-run|-n)\b/.test(m[1])) return false;
    const pos = m[1].split(/\s+/).filter((t) => t && !t.startsWith('-'));
    const refs = pos.slice(1);
    if (!refs.length) return branch === 'main';
    return refs.some((r) => /(^|:|\/)main$/.test(r) || (r === 'HEAD' && branch === 'main'));
  });
}
export function unbuiltFiles(cwd) {
  const changed = (run('git', ['diff', '--name-only', 'origin/main..HEAD']) ?? '').split('\n').filter(Boolean)
    .filter((f) => !NO_BUILD_NEEDED.test(f));
  if (!changed.length) return [];
  let stamp = 0;
  try { stamp = JSON.parse(fs.readFileSync(path.join(cwd, '.build-ok'), 'utf8')).time || 0; } catch { /* none */ }
  if (!stamp) return [['(no green `npm run build` recorded yet)'], changed];
  const late = changed.filter((f) => { try { return fs.statSync(path.join(cwd, f)).mtimeMs > stamp; } catch { return false; } });
  return late.length ? [late, changed] : [];
}

// ── 6. sweeping stages / amend on main ───────────────────────────────────────
export function sweeping(cmd) {
  for (const seg of segments(cmd)) {
    if (/\bgit\s+commit\b/.test(seg) && /\s--amend\b/.test(seg)) return '`git commit --amend` rewrites the last commit, and on main that is often another session\'s commit. Make a new commit instead.';
    if (/\bgit\s+commit\b/.test(seg) && /\s(--all|-[a-zA-Z]*a[a-zA-Z]*)(?=\s|$)/.test(seg)) return '`git commit -a` sweeps in every modified tracked file, including the social session\'s work under social/. Stage the files you changed by name, then commit.';
    const add = seg.match(/\bgit\s+add\b(.*)$/);
    if (add) {
      const toks = add[1].split(/\s+/).filter(Boolean);
      const paths = toks.filter((t) => !t.startsWith('-'));
      const sweepFlag = toks.some((t) => /^(-A|--all|-u|--update|--no-ignore-removal)$/.test(t) || /^-[a-zA-Z]*[Au][a-zA-Z]*$/.test(t));
      const sweepPath = paths.some((p) => /^(\.|\.\/|:\/|:\/\.|\*|-- \.)$/.test(p));
      if ((sweepFlag && !paths.filter((p) => p !== '--').length) || sweepPath) return 'This stages every change in the checkout, including the social session\'s files under social/ (CLAUDE.md: never `git add -A`). Name the files you changed: `git add path/one path/two`.';
    }
  }
  return '';
}

// ── 7. App Store Connect private keys ────────────────────────────────────────
const KEYPATH = /\.appstoreconnect|private_keys|AuthKey_\w+\.p8|\.p8\b/;
const READER = /\b(cat|head|tail|less|more|bat|base64|openssl|xxd|od|hexdump|strings|cp|mv|scp|rsync|curl|grep|rg|sed|awk|perl|python3?|ruby|pbcopy|tar|zip|security|vim?|nano|code|open)\b/;
export function readsKey(cmd) {
  const rest = cmd
    .replace(/-authenticationKeyPath\s+\S+/g, ' ')
    .replace(/--?api-?[Kk]ey(Path)?\s+\S+/g, ' ');
  return segments(rest).some((seg) => KEYPATH.test(seg) && READER.test(seg));
}

// ── 9. service worker logic without a CACHE_VERSION bump ────────────────────
export function swNeedsBump(diff) {
  const lines = diff.split('\n').filter((l) => /^[+-]/.test(l) && !/^(\+\+\+|---)/.test(l)).map((l) => l.slice(1).trim());
  if (lines.some((l) => /CACHE_VERSION\s*=/.test(l))) return false;
  return lines.some((l) => l && !/^(\/\/|\/\*|\*)/.test(l));
}

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
// sim-probe.sh boots SIM_DEVICE, default the Ball IQ iPhone 17 Pro below.
const PROBE_DEVICE = '308173DD-2B28-4C1A-8287-2A2935CA9023';
export const BOOT = {
  test: (cmd) => segments(cmd).some((seg) => /^(\S+=\S+\s+)*xcrun\s+simctl\s+boot\b/.test(seg) || /^(\S+=\S+\s+)*((ba|z)?sh\s+)?\S*sim-probe\.sh\b/.test(seg)),
};
export function bootTarget(cmd) {
  const u = cmd.match(UDID)?.[0];
  if (u) return u.toUpperCase();
  return /sim-probe\.sh/.test(cmd) ? PROBE_DEVICE : undefined;
}
export function bootedSims() {
  const listing = run('xcrun', ['simctl', 'list', 'devices', 'booted', '-j'], 8000);
  try { return Object.values(JSON.parse(listing).devices).flat().filter((d) => d.state === 'Booted'); } catch { return []; }
}
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

  cmdForOverride = cmd;
  const cwd = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const branch = /\bgit\b/.test(cmd) ? run('git', ['rev-parse', '--abbrev-ref', 'HEAD']) : null;

  if (readsKey(cmd)) {
    deny('This reads an App Store Connect private key (~/.appstoreconnect/private_keys). The keys are never printed, copied or opened; pass the path to xcodebuild (-authenticationKeyPath) or let the asc scripts load it.');
  }
  if (branch === 'main') {
    const why = sweeping(cmd);
    if (why) deny(why);
  }
  if (pushesMain(cmd, branch)) {
    const [late, changed] = unbuiltFiles(cwd);
    if (late?.length) {
      deny(`Push to main, but ${late.length} app file(s) changed after the last green \`npm run build\`: ${late.slice(0, 4).join(', ')}${late.length > 4 ? ', …' : ''} (${changed.length} app file(s) in this push). The build ends in the Home JS budget gate, and a build Vercel rejects leaves production silently on the previous deploy. Run \`npm run build > /tmp/b.log 2>&1; echo EXIT=$?\` first; a green run writes .build-ok.`);
    }
  }
  if (/\bgit\s+commit\b/.test(stripQuoted(cmd))) {
    const diff = (run('git', ['diff', '--cached', '-U0', '--', 'public/sw.js']) || '') + (/public\/sw\.js/.test(cmd) ? '\n' + (run('git', ['diff', 'HEAD', '-U0', '--', 'public/sw.js']) || '') : '');
    if (swNeedsBump(diff)) deny('This commit changes public/sw.js logic without bumping CACHE_VERSION. CLAUDE.md: a service-worker logic change bumps CACHE_VERSION in the same commit, or installed PWAs keep the old caches.');
  }

  const notes = [];
  if (pipedGate(cmd)) {
    notes.push('A build/test gate is piped into grep/tail/head, so the command reports the FILTER\'s exit code, not the gate\'s — a failing build reads as success. Write the output to a log and print the exit code (`npm run build > /tmp/b.log 2>&1; echo EXIT=$?`), or capture ${PIPESTATUS[0]}.');
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

  if (BOOT.test(cmd)) {
    const booted = bootedSims();
    const want = bootTarget(cmd);
    const others = booted.filter((d) => d.udid.toUpperCase() !== want);
    if (others.length) {
      deny(`Simulator ${others.map((d) => `${d.name} (${d.udid.slice(0, 8)})`).join(', ')} is already running, probably Tide HQ's. Never run two simulators at once on this Mac: message the Tide HQ session first and agree who uses it.`);
    }
    notes.push('You are booting a simulator. Tell the Tide HQ session first (it shares this Mac), and shut the simulator down when you are done.');
  }

  if (SIM.test(cmd)) {
    const [hits, sdk] = staleRuntimes(cmd);
    if (hits?.length) {
      ask(`Simulator ${hits.join(', ')} is older than the installed iOS ${sdk} SDK. Build 138 passed an iOS 26.5 simulator and was killed at launch on every iOS 27 phone. Test on an iOS ${Math.floor(sdk)} simulator (xcrun simctl list runtimes), or confirm the older one is deliberate.`);
    }
  }
  if (notes.length) {
    process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', additionalContext: `Reminder: ${notes.join(' ')}` } }));
  }
  process.exit(0);
});
