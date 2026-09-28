#!/usr/bin/env node
/**
 * review-guard — Metricool posts need a banger-critic PASS, same as Postiz posts.
 *
 * ⚠️ WHY. Alex 09-28: "our standards are dropping every day… posting because we need to meet a
 * quota." social/gate.mjs enforces the critic PASS for everything that goes through social/pz, but
 * Metricool is an MCP tool call, not a shell command, so it needs its own door. This hook reads the
 * post text + providers from createScheduledPost/updateScheduledPost and denies the call unless
 * social/review.mjs has a PASS (≥8/10, ≤36h old) for that exact caption.
 */
import path from 'node:path';

let raw = '';
process.stdin.on('data', (c) => { raw += c; });
process.stdin.on('end', async () => {
  let input = {};
  try { input = JSON.parse(raw || '{}'); } catch { return void process.exit(0); }
  const tool = input.tool_name || '';
  if (!/createScheduledPost|updateScheduledPost/.test(tool) || /ForReview/.test(tool)) return void process.exit(0);
  let info = input.tool_input?.info;
  try { if (typeof info === 'string') info = JSON.parse(info); } catch { info = null; }
  if (!info) return void process.exit(0);
  if (info.draft === true) return void process.exit(0);          // drafts publish nothing
  const text = info.text || '';
  const providers = (info.providers || []).map((p) => String(p.network || '').toLowerCase());
  const root = process.env.CLAUDE_PROJECT_DIR || path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
  const { hasPass, keyOf } = await import(path.join(root, 'social/review.mjs'));
  const missing = providers.filter((p) => !hasPass(text, p));
  if (!missing.length) return void process.exit(0);
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny',
    permissionDecisionReason: `No banger-critic PASS for this caption on ${missing.join(', ')} (key ${keyOf(text)}). Draft it with node social/review.mjs draft --platform <p> --platforms ${providers.join(',')} --text-file caption.txt --media <file>, run the banger-critic, then schedule the EXACT same text.` } }));
  process.exit(0);
});
