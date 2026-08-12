// ⚠️ SUPERSEDED 2026-08-12 — /fun-facts/ now renders scripts/seo/funFactsCurated.js.
// This miner produced 100 facts that were all TRUE and all BORING, because it
// selected from `hint` fields and a hint exists to explain an answer, not to
// surprise a reader. Verdict from the live page: "not fun at all, they are
// just facts." Kept because the self-containment gate below is still the right
// filter if the bank is ever mined again for something else — but nothing
// imports its output now.
// build-fun-facts.mjs — the /fun-facts/ corpus, mined from the VERIFIED bank.
//
//   node scripts/build-fun-facts.mjs        # writes scripts/seo/funFacts.js
//
// ⚠️ WHY MINE INSTEAD OF WRITE. A "100 fun facts" page is exactly the shape
// that invites fabrication: it wants punchy, surprising, quotable claims, and
// nothing in the format forces a source. Our `hint` fields are the opposite —
// every one was written to explain a bank answer and went through the forge's
// generate → examiner → skeptic → adversarial fact-check gauntlet, and the
// 2026-07 audit web-verified the flagged ones. Reusing them means the page
// inherits that verification instead of starting a new fabrication surface.
//
// ⚠️ SELF-CONTAINMENT IS THE HARD FILTER. A hint sits under its question, so
// it may open with an anaphor — "The Midlands club lost the first leg…" reads
// fine below a Villa question and reads as nothing on a facts page. Anything
// that cannot stand alone is dropped, not rewritten: rewriting is where a
// verified sentence quietly becomes an unverified one.
import { readFileSync, writeFileSync } from 'fs';

const src = readFileSync('src/questions.js', 'utf8');

// Pull hint + the row's cat together so facts can be grouped by theme.
const rows = [];
for (const m of src.matchAll(/\{\s*id:"([^"]+)"[\s\S]{0,2400}?\}/g)) {
  const row = m[0];
  const hint = row.match(/hint:"((?:[^"\\]|\\.)*)"/);
  const cat = row.match(/cat:"([^"]*)"/);
  const club = row.match(/club:"([^"]*)"/);
  if (!hint) continue;
  rows.push({
    id: m[1],
    text: hint[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\'),
    cat: cat ? cat[1] : '',
    club: club ? club[1] : '',
  });
}

// ── the self-containment gate ───────────────────────────────────────────────
// Opens with a pronoun / bare definite description, or leans on the question
// for its subject. All rejected outright.
const ANAPHORIC = /^(he|she|they|it|his|her|their|the (club|side|team|player|manager|midfielder|defender|striker|keeper|goalkeeper|forward|winger|城)\b|that\b|this\b|both\b|these\b|those\b|there\b)/i;
const NEEDS_STEM = /\b(the (above|question|answer)|as (asked|shown)|see (above|below))\b/i;
// A fact must name at least one proper noun beyond a sentence-initial word.
const hasNamedEntity = (t) => (t.match(/(?!^)\b[A-Z][a-zà-ÿA-ZÀ-Ÿ'’-]{2,}/g) || []).length >= 1;

const seen = new Set();
const candidates = [];
for (const r of rows) {
  const t = r.text.trim();
  if (t.length < 70 || t.length > 210) continue;      // a card, not a paragraph
  if (ANAPHORIC.test(t) || NEEDS_STEM.test(t)) continue;
  if (!hasNamedEntity(t)) continue;
  if (!/[.!]$/.test(t)) continue;                      // complete sentence
  if (/\?/.test(t)) continue;                          // quizzy, not factual
  // Telegraphic notes ("… 274). 2006 WC winner.") read as scribbles on a
  // facts page even though the content is sound — a trailing fragment with no
  // verb is the tell.
  if (/\.\s+[^.]{4,26}\.$/.test(t) && !/\b(is|was|were|has|had|won|scored|became|remains|holds|made|played|kept|left|joined)\b[^.]*\.$/i.test(t)) continue;
  // Contextless openers: an indefinite subject with no named anchor up front.
  if (/^(a|an|the)\s+[a-z]+\s+(was|were|is|are)\b/i.test(t)) continue;
  const key = t.slice(0, 42).toLowerCase();
  if (seen.has(key)) continue;                         // near-duplicate openings
  seen.add(key);

  // Interestingness: numbers, superlatives, records, firsts, oddities.
  let score = 0;
  if (/\b(first|only|last|oldest|youngest|fastest|record|never|unbeaten|all-time)\b/i.test(t)) score += 3;
  if (/\b\d{4}\b/.test(t)) score += 1;                 // a date anchors it
  if (/\b\d+([–-]\d+)?\b/.test(t)) score += 1;         // a number
  if (/\b(but|despite|even though|after|before)\b/i.test(t)) score += 1; // a turn
  if (t.length > 95 && t.length < 175) score += 1;     // readable length
  candidates.push({ ...r, text: t, score });
}

candidates.sort((a, b) => b.score - a.score || a.text.length - b.text.length);

// ── theme buckets, so the page reads as sections not a wall ─────────────────
const THEMES = [
  ['Records & firsts', (c) => /\b(first|only|record|youngest|oldest|fastest|most)\b/i.test(c.text)],
  ['World Cup & internationals', (c) => /world cup|euro|copa|nations|international/i.test(c.text + c.cat)],
  ['European nights', (c) => /champions league|european cup|uefa|europa/i.test(c.text + c.cat)],
  ['Clubs & rivalries', (c) => !!c.club || /derby|rival|stadium|ground/i.test(c.text)],
  ['Players & legends', (c) => /legend/i.test(c.cat) || true],   // catch-all
];

const PER_THEME = 20;
const used = new Set();
const out = [];
for (const [theme, test] of THEMES) {
  const picked = [];
  for (const c of candidates) {
    if (used.has(c.id) || picked.length >= PER_THEME) continue;
    if (!test(c)) continue;
    used.add(c.id);
    picked.push({ id: c.id, text: c.text, cat: c.cat, club: c.club });
  }
  if (picked.length) out.push({ theme, facts: picked });
}

const total = out.reduce((n, t) => n + t.facts.length, 0);
writeFileSync('scripts/seo/funFacts.js',
  '// GENERATED by scripts/build-fun-facts.mjs — do not hand-edit.\n'
  + '// Every fact is a VERIFIED explanation from the question bank (forge:\n'
  + '// generate -> examiner -> skeptic -> adversarial fact-check). Facts that\n'
  + '// could not stand alone were dropped, never rewritten.\n'
  + `export const FUN_FACTS = ${JSON.stringify(out, null, 1)};\n`);

console.log(`candidates ${candidates.length} of ${rows.length} hints · wrote ${total} facts across ${out.length} themes`);
for (const t of out) console.log(`  ${String(t.facts.length).padStart(3)}  ${t.theme}`);
