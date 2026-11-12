#!/usr/bin/env node
/**
 * stop-visual-proof — a one-time reminder before ending a turn that pushed a visual change
 * nobody looked at.
 *
 * ⚠️ WHY. Standing rule since 5 Oct 2026 (feedback_look_with_own_eyes): every visual change gets
 * a real screenshot I read before shipping, never measurement alone. It is in memory, so it is
 * advice; this makes it a checkpoint.
 *
 * WHAT IT DOES. Reads this turn of the transcript (since the last real user message). If the turn
 * edited a UI file (src/**.jsx|css, index.html, the SEO generators, public/*.css), then ran a
 * `git push`, and no screenshot, simulator shot, WebKit verifier or image Read happened after the
 * last UI edit, it blocks the stop ONCE with the reason. `stop_hook_active` makes it one-shot: the
 * agent either takes the screenshot or says why this change is not visual, and then stops freely.
 */
import { closeSync, fstatSync, openSync, readSync } from 'node:fs';

// The turn is at the end of the transcript; reading the last 16 MB keeps this fast on a 1 GB file.
const tail = (file, max = 16 * 1024 * 1024) => {
  const fd = openSync(file, 'r');
  try {
    const size = fstatSync(fd).size, n = Math.min(size, max), buf = Buffer.alloc(n);
    readSync(fd, buf, 0, n, size - n);
    const text = buf.toString('utf8');
    return size > n ? text.slice(text.indexOf('\n') + 1) : text;
  } finally { closeSync(fd); }
};

const UI = /(^|\/)(src\/.*\.(jsx|css)|index\.html|scripts\/seo\/[^ ]*\.m?js|scripts\/gen-seo-pages\.mjs|public\/[^ ]*\.css)\b/;
const PROOF_TOOL = /^(mcp__Claude_Browser__(computer|browser_batch|read_page)|mcp__claude-in-chrome__(computer|browser_batch)|mcp__Claude_Code_iOS_Simulator__control|mcp__Claude_Preview__\w*screenshot\w*)$/;

let raw = '';
process.stdin.on('data', (c) => { raw += c; });
process.stdin.on('end', () => {
  let j = {};
  try { j = JSON.parse(raw || '{}'); } catch { return void process.exit(0); }
  if (j.stop_hook_active || !j.transcript_path) return void process.exit(0);
  let rows;
  try { rows = tail(j.transcript_path).split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean); } catch { return void process.exit(0); }

  // start of this turn: the last user row that is a real message, not a tool result
  let start = 0;
  rows.forEach((r, i) => {
    if (r.type !== 'user' || r.isMeta) return;
    const c = r.message?.content;
    const real = typeof c === 'string' ? c.trim() : Array.isArray(c) && c.some((x) => x.type === 'text');
    if (real) start = i;
  });

  let lastUi = -1, pushed = -1, proof = -1, k = 0;
  for (const r of rows.slice(start)) {
    if (r.type !== 'assistant') continue;
    for (const c of r.message?.content || []) {
      if (c.type !== 'tool_use') continue;
      k++;
      const n = c.name || '', inp = c.input || {};
      const text = JSON.stringify(inp);
      if (/^(Edit|Write|MultiEdit)$/.test(n) && UI.test(String(inp.file_path || ''))) lastUi = k;
      if (n === 'Bash' && UI.test(String(inp.command || '')) && /(sed -i|>\s*\S|python3? -|node -e|perl -pi|tee )/.test(String(inp.command || ''))) lastUi = k;
      if (n === 'Bash' && /\bgit\s+push\b/.test(String(inp.command || ''))) pushed = k;
      const shot = PROOF_TOOL.test(n) && (/screenshot|zoom/.test(text) || /read_page/.test(n))
        || (n === 'Agent' && /webkit-verifier/.test(text))
        || (n === 'Read' && /\.(png|jpe?g|webp)$/i.test(String(inp.file_path || '')))
        || (n === 'Bash' && /(sim-shot\.sh|screencap|screenshot|webkit|playwright)/i.test(String(inp.command || '')));
      if (shot) proof = k;
    }
  }
  if (lastUi > 0 && pushed > lastUi && proof < lastUi) {
    process.stdout.write(JSON.stringify({
      decision: 'block',
      reason: 'This turn pushed a UI change (a .jsx/.css/index.html/SEO generator edit) and no screenshot was taken after the last edit. Standing rule (feedback_look_with_own_eyes): look at the real rendered page or app with your own eyes before calling it shipped. Take the screenshot now (browser pane, simulator, or webkit-verifier) and read it, or, if this change has no visual effect, say so in one line and stop.',
    }));
  }
  process.exit(0);
});
