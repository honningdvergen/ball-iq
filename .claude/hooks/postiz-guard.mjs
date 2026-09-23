#!/usr/bin/env node
/**
 * postiz-guard — refuse bare `postiz` calls; everything goes through social/pz.
 *
 * ⚠️ WHY. social/pz enforces the Postiz quota (~30 calls/hour; we were locked out for 30+ min on
 * 09-21) and runs social/gate.mjs before every post (Facebook, IG 10-slide limit, Kalshi/Stake,
 * repeats, double audio). A rule that lives only in a wrapper is optional; this hook makes it the
 * only door. It also reads shell scripts passed to bash/sh, because every queue job is a script.
 *
 * Allowed bare: `postiz auth:status`, `postiz --help`, `postiz --version`.
 */
import fs from 'node:fs';

let raw = '';
process.stdin.on('data', (c) => { raw += c; });
process.stdin.on('end', () => {
  let cmd = '';
  try { cmd = JSON.parse(raw || '{}')?.tool_input?.command || ''; } catch { /* stay out of the way */ }
  if (!cmd) return void process.exit(0);

  // a bare `postiz <subcommand>` (not social/pz, not a path ending in /pz, not inside a word)
  const BARE = /(^|[\s;&|(`$])postiz\s+(upload|posts:[a-z]+|analytics:[a-z]+|integrations:[a-z]+|auth:log(in|out))\b/m;
  const deny = (why) => {
    process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny',
      permissionDecisionReason: `${why} Use social/pz with the same arguments (e.g. /Users/alexanderbrynolsen/ball-iq/social/pz upload file.mp4) — it enforces the Postiz quota and runs the pre-publish gate.` } }));
    process.exit(0);
  };

  if (BARE.test(cmd)) deny('Bare `postiz` call.');

  // scripts run by bash/sh/zsh: read them and apply the same rule
  for (const m of cmd.matchAll(/(?:^|[\s;&|(])(?:bash|sh|zsh)\s+(?:-\w+\s+)*("?)([^\s"';&|]+\.sh)\1/g)) {
    const file = m[2];
    try {
      const body = fs.readFileSync(file, 'utf8').split('\n').filter((l) => !/^\s*#/.test(l)).join('\n');
      if (BARE.test(body)) deny(`Script ${file} calls \`postiz\` directly.`);
    } catch { /* unreadable: not our concern */ }
  }
  process.exit(0);
});
