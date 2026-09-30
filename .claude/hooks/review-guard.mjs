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
  // Stories carry no caption (Metricool: a Story-only post must not send text), so a Story is
  // reviewed by its media: `review.mjs draft --text "story:<first media URL>"`.
  const storyOnly = (info.providers || []).every((p) => /instagram|facebook/i.test(p.network)) &&
    ['instagramData', 'facebookData'].every((k) => !info[k] || String(info[k].type || '').toUpperCase() === 'STORY');
  const text = info.text || (storyOnly && info.media?.[0] ? 'story:' + info.media[0] : '');
  const providers = (info.providers || []).map((p) => String(p.network || '').toLowerCase());
  const root = process.env.CLAUDE_PROJECT_DIR || path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
  const { hasPass, keyOf } = await import(path.join(root, 'social/review.mjs'));
  const missing = providers.filter((p) => !hasPass(text, p));
  if (!missing.length) {
    // 09-29: Metricool posts skipped social/gate.mjs entirely, so repeat slides (a slide already posted on 09-23 / 09-26) and
    // banned-brand media sailed through and only the Postiz door caught them. Run the same media checks here.
    try {
      const gate = await import(path.join(root, 'social/gate.mjs'));
      const fs = await import('node:fs');
      const map = new Map((fs.existsSync(path.join(root, 'social/state/uploads.tsv')) ? fs.readFileSync(path.join(root, 'social/state/uploads.tsv'), 'utf8').split('\n') : []).filter(Boolean).map((l) => l.split('\t')));
      const media = (info.media || []).map((u) => map.get(u)).filter(Boolean), unmapped = (info.media || []).length - media.length;
      const bad = [];
      for (const pv of providers) {
        const platform = pv === 'twitter' ? 'x' : pv;
        const r = gate.check({ platform, caption: text, media, unmapped });
        r.block.filter((b) => !/BANGER-CRITIC PASS/.test(b)).forEach((b) => bad.push(`[${platform}] ${b}`));
      }
      if (bad.length) {
        process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: 'Pre-publish media gate (same as social/pz): ' + bad.join(' | ') + ' — fix the media, or run node social/preflight.mjs first.' } }));
      }
    } catch { /* the media check must never break a valid post */ }
    return void process.exit(0);
  }
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny',
    permissionDecisionReason: `No banger-critic PASS for this caption on ${missing.join(', ')} (key ${keyOf(text)}). Draft it with node social/review.mjs draft --platform <p> --platforms ${providers.join(',')} --text-file caption.txt --media <file>, run the banger-critic, then schedule the EXACT same text.` } }));
  process.exit(0);
});
