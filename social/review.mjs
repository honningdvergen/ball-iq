// Quality gate: no post leaves without an independent banger-critic PASS on the exact caption.
// Alex 09-28: "we do all this banger research and it all counts for nothing… our standards are
// dropping every day." Rules in memory get skimmed; this makes the bar a door.
//
//   node social/review.mjs draft   --platform x --format <family> --text "line" [--media a.jpg,b.mp4] [--story "what it rides"] [--broke 11:20]
//        → saves the draft, renders a MOCK-UP (what a scroller actually sees) and prints its id + path.
//   node social/review.mjs verdict <id> --score 8.5 --verdict PASS|FAIL --why "…" [--fix "…"]   (the banger-critic agent)
//   node social/review.mjs check   --platform x --text "caption"      → exit 0 only if a PASS ≤36h old covers this caption
//   node social/review.mjs taste   <id> yes|no ["Alex's note"]          → Alex's calibration log (the critic reads it)
//   node social/review.mjs list                                         → drafts waiting for a verdict
//
// social/gate.mjs calls `check` for every Postiz post; .claude/hooks/review-guard.mjs does the same for
// Metricool. Chrome posts (X quote-posts, replies are exempt) must run `check` by hand — the PM audits it.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.join(HERE, 'state', 'review'), DRAFTS = path.join(DIR, 'drafts');
const VERDICTS = path.join(DIR, 'verdicts.jsonl'), TASTE = path.join(DIR, 'taste.jsonl');
fs.mkdirSync(DRAFTS, { recursive: true });

// The caption key ignores URLs, case, punctuation and whitespace, so a reviewed line still matches
// after Postiz/Metricool reformat it — but any change to the WORDS needs a new review.
export const keyOf = (t) => crypto.createHash('sha1')
  .update(String(t).toLowerCase().replace(/https?:\/\/\S+/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim().slice(0, 400))
  .digest('hex').slice(0, 12);
const readJsonl = (f) => fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [];

export function hasPass(text, platform) {
  const k = keyOf(text), now = Date.now();
  return readJsonl(VERDICTS).find((v) => v.key === k && v.verdict === 'PASS' && now - Date.parse(v.at) < 36 * 3600e3
    && (!platform || !v.platform || v.platform === platform || v.platforms?.includes(platform)));
}

const arg = (n) => { const i = process.argv.indexOf('--' + n); return i > -1 ? process.argv[i + 1] : null; };
const VIDEO = /\.(mp4|mov|m4v|webm)$/i;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const dataUri = (f) => `data:image/${/png$/i.test(f) ? 'png' : 'jpeg'};base64,${fs.readFileSync(f).toString('base64')}`;

function frames(file, out, n = 4) {
  const dur = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString());
  const pts = [0.3, dur * 0.3, dur * 0.6, Math.max(0.3, dur - 0.4)].slice(0, n);
  const files = pts.map((t, i) => { const f = `${out}_${i}.jpg`; execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-ss', String(t), '-i', file, '-frames:v', '1', '-vf', 'scale=270:-1', f]); return f; });
  return { files, dur };
}

async function mock(d) {
  const { chromium } = await import('../node_modules/playwright/index.mjs');
  const avatar = path.join(HERE, 'state/media/own/shq_avatar.jpg');
  let body;
  if (['x', 'threads', 'bluesky'].includes(d.platform)) {
    const img = d.media.find((f) => !VIDEO.test(f)), vid = d.media.find((f) => VIDEO.test(f));
    const still = img || (vid && frames(vid, path.join(DRAFTS, d.id + '_v'), 1).files[0]);
    body = `<div style="width:560px;padding:16px;background:#000;color:#e7e9ea;font:15px -apple-system,Helvetica">
      <div style="display:flex;gap:10px"><img src="${dataUri(avatar)}" style="width:40px;height:40px;border-radius:50%">
      <div><b>SHQ</b> <span style="color:#71767b">@ShithouseryHQ · now</span>
      <div style="font-size:17px;line-height:1.35;margin:4px 0 10px;white-space:pre-wrap">${esc(d.text)}</div>
      ${still ? `<img src="${dataUri(still)}" style="width:490px;border-radius:14px;border:1px solid #333">${vid ? '<div style="color:#71767b">▶ video</div>' : ''}` : '<div style="color:#f4212e">[no image — text only]</div>'}
      </div></div></div>`;
  } else {
    const strips = d.media.flatMap((f, i) => VIDEO.test(f) ? frames(f, path.join(DRAFTS, `${d.id}_${i}`)).files : [f]).slice(0, 8);
    body = `<div style="padding:12px;background:#111;color:#eee;font:14px -apple-system,Helvetica;width:${Math.max(4, strips.length) * 280}px">
      <div style="display:flex;gap:8px">${strips.map((f) => `<img src="${dataUri(f)}" style="width:270px">`).join('')}</div>
      <div style="margin-top:10px;white-space:pre-wrap;max-width:1000px"><b>${esc(d.platform)} caption:</b> ${esc(d.text)}</div></div>`;
  }
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 800 } });
  await p.setContent(`<body style="margin:0;background:#000">${body}</body>`);
  const out = path.join(DRAFTS, d.id + '.png');
  await (await p.$('body > div')).screenshot({ path: out }); await b.close();
  return out;
}

const MAIN = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
const cmd = MAIN ? process.argv[2] : null;
if (cmd === 'draft') {
  const text = arg('text') || (arg('text-file') && fs.readFileSync(arg('text-file'), 'utf8'));
  if (!arg('platform') || !text) { console.error('draft needs --platform and --text'); process.exit(1); }
  const media = (arg('media') || '').split(',').filter(Boolean).map((f) => path.resolve(f));
  const d = { id: new Date().toISOString().slice(5, 16).replace(/[-:T]/g, '') + '_' + keyOf(text).slice(0, 5), key: keyOf(text),
    platform: arg('platform').toLowerCase(), platforms: (arg('platforms') || arg('platform')).toLowerCase().split(','),
    text, media, format: arg('format') || '', story: arg('story') || '', broke: arg('broke') || '', at: new Date().toISOString() };
  d.mock = await mock(d);
  fs.writeFileSync(path.join(DRAFTS, d.id + '.json'), JSON.stringify(d, null, 1));
  console.log(`draft ${d.id}\nmock  ${d.mock}\nnext: banger-critic agent reviews it → node social/review.mjs verdict ${d.id} --score N --verdict PASS|FAIL --why "…"`);
} else if (cmd === 'verdict') {
  const id = process.argv[3], f = path.join(DRAFTS, id + '.json');
  if (!fs.existsSync(f)) { console.error('no draft ' + id); process.exit(1); }
  const d = JSON.parse(fs.readFileSync(f)), verdict = (arg('verdict') || '').toUpperCase(), score = Number(arg('score'));
  if (!['PASS', 'FAIL'].includes(verdict) || !(score >= 0)) { console.error('need --verdict PASS|FAIL and --score'); process.exit(1); }
  // 09-29: threshold lowered 8 → 7 after the blind backtest (social/state/review/backtest_2026-09-29/RESULT.md: the ≥8 gate passed
  // only 3 of 12 known hits) and Alex's "recalibrate the critic" (09-28/29). Matches the 'HOW TO DECIDE PASS' block in banger-critic.md.
  if (verdict === 'PASS' && score < 7) { console.error('A PASS needs score ≥ 7. Below that it is a FAIL.'); process.exit(1); }
  const v = { id, key: d.key, platform: d.platform, platforms: d.platforms, verdict, score, why: arg('why') || '', fix: arg('fix') || '', at: new Date().toISOString(), text: d.text };
  fs.appendFileSync(VERDICTS, JSON.stringify(v) + '\n');
  Object.assign(d, { verdict, score, why: v.why, fix: v.fix }); fs.writeFileSync(f, JSON.stringify(d, null, 1));
  console.log(`${verdict} ${score}/10 recorded for ${id}`);
} else if (cmd === 'check') {
  const text = arg('text') || (arg('text-file') && fs.readFileSync(arg('text-file'), 'utf8')) || '';
  const p = hasPass(text, (arg('platform') || '').toLowerCase());
  if (p) { console.log(`PASS ${p.score}/10 (${p.id})`); process.exit(0); }
  console.error(`NO CRITIC PASS for this caption (key ${keyOf(text)}). Draft it: node social/review.mjs draft --platform … --text "…" --media …, then run the banger-critic agent.`);
  process.exit(2);
} else if (cmd === 'taste') {
  const [, , , id, yn, ...note] = process.argv;
  const d = JSON.parse(fs.readFileSync(path.join(DRAFTS, id + '.json')));
  fs.appendFileSync(TASTE, JSON.stringify({ id, alex: yn, note: note.join(' '), text: d.text, platform: d.platform, critic: d.verdict, score: d.score, at: new Date().toISOString() }) + '\n');
  console.log(`logged Alex=${yn} for ${id}${d.verdict ? ` (critic said ${d.verdict} ${d.score})` : ''}`);
} else if (cmd === 'list') {
  for (const f of fs.readdirSync(DRAFTS).filter((f) => f.endsWith('.json')).sort().slice(-20)) {
    const d = JSON.parse(fs.readFileSync(path.join(DRAFTS, f)));
    console.log(`${d.id}  ${d.verdict ? d.verdict + ' ' + d.score : 'PENDING'}  ${d.platform}  ${d.text.slice(0, 70).replace(/\n/g, ' ')}`);
  }
} else if (cmd) { console.error('usage: review.mjs draft|verdict|check|taste|list'); process.exit(1); }
