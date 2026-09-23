#!/usr/bin/env node
/**
 * stop-deploy-verified — do not end a turn on a deploy that has not landed.
 *
 * ⚠️ WHY. On 2026-09-17 the Brasileirão wave was pushed, the live check was
 * started as a background poll, and the turn ended with "production check is
 * polling". The poll's output was lost; the deploy had FAILED; four new pages
 * were 404 for four days (feedback_deploy_verified_means_rendered).
 *
 * WHAT IT DOES. When the local HEAD is the tip of origin/main and was committed
 * in the last 3 hours (i.e. this session plausibly just pushed it), it reads
 * Vercel's commit status:
 *   pending / not started yet  -> block the stop: wait for it, or say UNVERIFIED
 *   failure / error            -> block the stop: production is serving the OLD build
 *   success                    -> allow
 * Anything older, unpushed, or unreadable -> allow. `stop_hook_active` guards
 * the loop: a second stop in a row is always allowed, so this nudges once and
 * can never trap a session.
 *
 * What it CANNOT do: prove the page rendered. That still needs a browser, and
 * stays a rule, not a gate.
 */
import { spawnSync } from 'node:child_process';

const cwd = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const run = (cmd, args, ms = 5000) => {
  const r = spawnSync(cmd, args, { encoding: 'utf8', timeout: ms, cwd });
  return r.status === 0 ? String(r.stdout || '').trim() : null;
};

let raw = '';
process.stdin.on('data', (c) => { raw += c; });
process.stdin.on('end', () => {
  let active = false;
  try { active = !!JSON.parse(raw || '{}').stop_hook_active; } catch { /* allow */ }
  if (active) return void process.exit(0);

  const head = run('git', ['rev-parse', 'HEAD']);
  const tip = run('git', ['rev-parse', 'origin/main']);
  if (!head || head !== tip) return void process.exit(0);

  const committed = Number(run('git', ['log', '-1', '--format=%ct', 'HEAD']) || 0);
  if (!committed || Date.now() / 1000 - committed > 3 * 3600) return void process.exit(0);

  const repo = run('gh', ['repo', 'view', '--json', 'nameWithOwner', '--jq', '.nameWithOwner'], 6000);
  if (!repo) return void process.exit(0);
  const st = run('gh', ['api', `repos/${repo}/commits/${head}/statuses`, '--jq', '[.[] | select(.context == "Vercel")][0] | "\\(.state) \\(.target_url // "")"'], 8000);
  if (st === null) return void process.exit(0);
  const [state, url] = st.split(' ');

  const block = (reason) => {
    process.stdout.write(JSON.stringify({ decision: 'block', reason }));
    process.exit(0);
  };
  const short = head.slice(0, 8);
  if (state === 'failure' || state === 'error') {
    block(`The production deploy of ${short} FAILED (Vercel: ${state}). Production is still serving the previous build, so the site will look fine. Read the build log (${url}), fix it, or tell the user plainly that the push did not deploy.`);
  }
  if (!state || state === 'null' || state === 'pending') {
    block(`The production deploy of ${short} has not finished (Vercel: ${state && state !== 'null' ? state : 'not started'}). Wait for it — gh run watch on the newest deploy-check.yml run — or tell the user explicitly that the deploy is UNVERIFIED. Do not end on "polling in the background".`);
  }
  process.exit(0);
});
