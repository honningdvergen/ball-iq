// Negative tests for the enforced gate rules (09-30 audit: "each rule gets a negative test").
//   node social/gate.test.mjs        exit 0 = all pass
// Every rule must BLOCK its known-bad case, and a clean case must NOT trip the new rules. Uses real files in /tmp.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { check } from './gate.mjs';

const T = '/private/tmp/tt/gate_test'; fs.mkdirSync(T, { recursive: true });
const mk = (name, color) => { const f = `${T}/${name}.png`; execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'lavfi', '-i', `color=c=${color}:s=270x338`, '-frames:v', '1', f]); return f; };
const clean = mk('clean_' + process.pid, 'purple'), card = mk('card_' + process.pid, 'teal');
fs.writeFileSync(card + '.card', 'tweet-card render\n');
let fail = 0;
const t = (name, ok, detail = '') => { console.log(`${ok ? '✅' : '❌'} ${name}${ok ? '' : '  ← ' + detail}`); if (!ok) fail++; };
const has = (r, re) => r.block.some((b) => re.test(b));
const OK = { ...process.env }; delete process.env.PZ_ALLOW_UNMAPPED;

// 1. own tweet card on X → blocked (and the same file on Instagram is fine)
t('X + own tweet card → BLOCK', has(check({ platform: 'x', caption: 'Lamine Yamal scored twice', media: [card] }), /tweet CARD/));
t('Instagram + same card file → NOT blocked for the card rule', !has(check({ platform: 'instagram', caption: 'x', media: [card] }), /tweet CARD/));
t('X + bare photo → no card block', !has(check({ platform: 'x', caption: 'x', media: [clean] }), /tweet CARD/));
// 2. caption that lists the slides → blocked
t('numbered-list caption → BLOCK', has(check({ platform: 'instagram', caption: 'The night in one swipe:\n1. one\n2. two\n3. three', media: [clean] }), /lists or explains the slides/));
t('"in one swipe" phrase → BLOCK', has(check({ platform: 'instagram', caption: 'The whole story in one swipe', media: [clean] }), /lists or explains the slides/));
t('hook + context caption → not blocked for listing', !has(check({ platform: 'instagram', caption: 'Welcome to Shamchester.\n\nPenalty still to come, City have until Friday to appeal.', media: [clean] }), /lists or explains the slides/));
// 3. media the gate cannot fingerprint → fail closed
t('unmapped media URL → BLOCK', has(check({ platform: 'instagram', caption: 'x', media: [clean], unmapped: 1 }), /cannot be fingerprinted/));
t('missing local file → BLOCK', has(check({ platform: 'instagram', caption: 'x', media: ['/private/tmp/tt/gate_test/does_not_exist.png'] }), /cannot be fingerprinted/));
process.env.PZ_ALLOW_UNMAPPED = '1';
t('PZ_ALLOW_UNMAPPED=1 override → demoted to a warning', !has(check({ platform: 'instagram', caption: 'x', media: [clean], unmapped: 1 }), /cannot be fingerprinted/));
delete process.env.PZ_ALLOW_UNMAPPED;
// 4. repeat slide (a file already recorded in the repeat database) → blocked
const db = JSON.parse(fs.readFileSync(new URL('./state/hashes.json', import.meta.url), 'utf8'));
const seen = db.find((e) => e.file && e.platform === 'instagram' && fs.existsSync(e.file));
if (seen) t('repeat slide (already posted on Instagram) → BLOCK', has(check({ platform: 'instagram', caption: 'x', media: [seen.file, clean, clean, clean] }), /REPEAT on instagram/));
else console.log('⚠️  no recorded Instagram file exists on disk; repeat case skipped');
// 5. critic PASS must exist (fail closed)
t('no critic PASS → BLOCK', has(check({ platform: 'instagram', caption: 'A caption nobody ever reviewed ' + process.pid, media: [clean] }), /BANGER-CRITIC PASS/));

console.log(fail ? `\n${fail} FAILED` : '\nall gate rule tests pass');
process.exit(fail ? 1 : 0);
