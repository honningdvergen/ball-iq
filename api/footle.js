// Footle answer + hints page — /football-wordle/answer/ (rewritten in vercel.json).
//
// Captures the daily high-intent search "footle answer today" / "football wordle
// answer" without cannibalising the game: hints render openly, but TODAY'S answer
// sits behind a <details> spoiler (still in the DOM, so Google indexes it — the
// player has to click to be spoiled). Yesterday + a rolling archive of past
// answers are revealed openly (they're already done) and each past puzzle number
// is its own long-tail target ("footle #64 answer").
//
// Server-rendered fresh on every request from the SAME source of truth the game
// uses (src/lib/wordle.js), so the answer can never drift from the live puzzle,
// and the full word list stays server-side — future answers are never shipped to
// the client. Edge runtime; cache expires at the next UTC midnight (puzzle roll).

import {
  WORDLE_FULL_NAMES,
  getWordleDayIndex,
  getWordleAnswerForDayIndex,
  WORDLE_ANCHOR_DAY,
} from '../src/lib/wordle.js';

export const config = { runtime: 'edge' };

const SITE = 'https://balliq.app';
const DAY_MS = 24 * 60 * 60 * 1000;
const ARCHIVE_DAYS = 90; // yesterday + 89 more — each past puzzle is its own indexable
                         // "footle #N answer" long-tail target (deterministic from
                         // WORDLE_ANSWER_LOG, so a deeper archive is free + drift-proof).

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const footleNumber = (di) => di - WORDLE_ANCHOR_DAY + 1;
const dateOf = (di) => new Date(di * DAY_MS);
const fullNameOf = (surname) => {
  const fn = WORDLE_FULL_NAMES[surname] || ['', surname];
  return `${fn[0]} ${fn[1]}`.trim();
};
const fmtDate = (d, opts) =>
  d.toLocaleDateString('en-US', { timeZone: 'UTC', ...opts });

// Letter-only hints (we only hold the surname + full name — no positions/nations,
// so hints stay spoiler-light and never guess at data we don't have).
function hintsFor(surname) {
  const letters = surname.toUpperCase();
  const vowels = (letters.match(/[AEIOU]/g) || []).length;
  const firstName = (WORDLE_FULL_NAMES[surname]?.[0] || '').trim();
  const dbl = /(.)\1/.test(letters);
  const hints = [
    `Today's Footle answer is a <strong>${letters.length}-letter</strong> surname.`,
    `It begins with the letter <strong>${letters[0]}</strong> and ends with <strong>${letters[letters.length - 1]}</strong>.`,
    `It contains <strong>${vowels}</strong> vowel${vowels === 1 ? '' : 's'}${dbl ? ' and a double letter' : ''}.`,
  ];
  if (firstName) hints.push(`The player's first name begins with <strong>${firstName[0].toUpperCase()}</strong>.`);
  return hints;
}

export default function handler() {
  const today = getWordleDayIndex();
  const num = footleNumber(today);
  const answer = getWordleAnswerForDayIndex(today);
  const answerFull = fullNameOf(answer);
  const todayDate = dateOf(today);
  const todayLabel = fmtDate(todayDate, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const hints = hintsFor(answer);

  const yDi = today - 1;
  const yAns = getWordleAnswerForDayIndex(yDi);
  const yFull = fullNameOf(yAns);

  // Rolling archive: yesterday back ARCHIVE_DAYS days.
  const archive = [];
  for (let k = 1; k <= ARCHIVE_DAYS; k++) {
    const di = today - k;
    const a = getWordleAnswerForDayIndex(di);
    archive.push({
      n: footleNumber(di),
      surname: a,
      full: fullNameOf(a),
      date: fmtDate(dateOf(di), { month: 'short', day: 'numeric' }),
    });
  }

  const canonical = `${SITE}/football-wordle/answer/`;
  const title = `Footle Answer Today — ${todayLabel} Hints & Solution (Football Wordle #${num}) | Ball IQ`;
  const description = `Stuck on today's Footle? Get progressive hints for Football Wordle #${num} (${todayLabel}), reveal the answer only if you want to, and browse every past Footle answer. Free daily football word puzzle.`;

  const ld = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'Footle', item: `${SITE}/football-wordle/` },
      { '@type': 'ListItem', position: 3, name: 'Answer', item: canonical },
    ],
  }).replace(/</g, '\\u003c');

  const hintItems = hints
    .map((h, i) => `<li><span class="hn">Hint ${i + 1}</span><span class="ht">${h}</span></li>`)
    .join('\n');

  const archiveRows = archive
    .map(
      (a) =>
        // id anchor makes each past puzzle directly linkable — /football-wordle/answer/#footle-64
        `<tr id="footle-${a.n}"><td class="an">#${a.n}</td><td class="ad">${esc(a.date)}</td><td class="aa">${esc(a.full)} <span class="asr">(${esc(a.surname)})</span></td></tr>`,
    )
    .join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Ball IQ">
<meta property="og:title" content="${esc(`Footle Answer Today — Football Wordle #${num} Hints & Solution`)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${SITE}/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(`Footle Answer Today — Football Wordle #${num}`)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${SITE}/og-image.png">
<script type="application/ld+json">${ld}</script>
<style>
:root{--bg:#0A0A0A;--s1:#101218;--s2:#161922;--ln:#1A1D27;--tx:#F4F5F7;--tx2:#C9CDD8;--tx3:#8A90A2;--grn:#58CC02;--gold:#FFC107}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--tx);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;line-height:1.6;-webkit-font-smoothing:antialiased}
.wrap{max-width:720px;margin:0 auto;padding:0 20px 72px}
header{display:flex;align-items:center;justify-content:space-between;padding:18px 0;border-bottom:1px solid var(--ln);position:sticky;top:0;background:rgba(10,10,10,.86);backdrop-filter:saturate(1.4) blur(10px);z-index:5}
.brand{font-weight:800;font-size:19px;letter-spacing:-.3px;color:#fff;text-decoration:none}
.brand em{color:var(--grn);font-style:normal}
.nav a{color:var(--tx2);text-decoration:none;font-weight:600;font-size:14px;margin-left:18px}
.nav a:hover{color:#fff}
.crumb{font-size:13px;color:var(--tx3);margin:20px 0 0}
.crumb a{color:var(--tx3);text-decoration:none}
h1{font-size:29px;line-height:1.18;letter-spacing:-.6px;margin:12px 0 6px}
.sub{color:var(--tx2);font-size:16px;margin:0 0 4px}
.pill{display:inline-block;margin-top:14px;padding:6px 13px;border:1px solid var(--ln);border-radius:999px;font-size:13px;color:var(--tx2);background:var(--s1)}
h2{font-size:21px;letter-spacing:-.3px;margin:38px 0 14px}
.card{background:var(--s1);border:1px solid var(--ln);border-radius:16px;padding:8px 20px}
ul.hints{list-style:none;margin:0;padding:0}
ul.hints li{display:flex;gap:14px;align-items:baseline;padding:14px 0;border-bottom:1px solid var(--ln)}
ul.hints li:last-child{border-bottom:0}
.hn{flex:0 0 auto;font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--grn);width:52px}
.ht{color:var(--tx2);font-size:16px}
.ht strong{color:#fff}
details.reveal{margin-top:18px;background:var(--s2);border:1px solid var(--ln);border-radius:14px;overflow:hidden}
details.reveal summary{list-style:none;cursor:pointer;padding:18px 20px;font-weight:700;color:#fff;display:flex;align-items:center;justify-content:space-between;gap:12px}
details.reveal summary::-webkit-details-marker{display:none}
details.reveal summary .chev{color:var(--grn);font-size:20px;transition:transform .2s}
details.reveal[open] summary .chev{transform:rotate(45deg)}
.answer{padding:0 20px 22px}
.answer .big{font-size:34px;font-weight:800;letter-spacing:.06em;color:var(--grn);margin:2px 0}
.answer .who{color:var(--tx2);font-size:16px}
.ya{background:var(--s1);border:1px solid var(--ln);border-radius:14px;padding:16px 20px;display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}
.ya .who{font-size:18px;font-weight:700;color:#fff}
.ya .lbl{font-size:13px;color:var(--tx3)}
.cta{display:block;text-align:center;background:var(--grn);color:#06230C;font-weight:800;font-size:17px;text-decoration:none;padding:16px;border-radius:14px;margin:18px 0 10px}
.cta.ghost{background:transparent;color:var(--tx);border:1px solid var(--ln);font-weight:700}
p{color:var(--tx2);font-size:16px}
table{width:100%;border-collapse:collapse;font-size:15px}
table td{padding:11px 6px;border-bottom:1px solid var(--ln)}
.an{color:var(--grn);font-weight:800;width:60px}
.ad{color:var(--tx3);width:78px}
.aa{color:var(--tx)}
.asr{color:var(--tx3)}
footer{margin-top:52px;padding-top:24px;border-top:1px solid var(--ln);color:var(--tx3);font-size:13px}
footer a{color:var(--tx3)}
@media(max-width:560px){h1{font-size:24px}.hn{width:46px}}
</style>
</head>
<body>
<div class="wrap">
<header>
<a class="brand" href="${SITE}/">Ball <em>IQ</em></a>
<nav class="nav"><a href="${SITE}/football-wordle/">Play Footle</a><a href="${SITE}/quiz/">Quizzes</a></nav>
</header>

<p class="crumb"><a href="${SITE}/">Home</a> › <a href="${SITE}/football-wordle/">Footle</a> › Answer</p>
<h1>Today's Footle Answer &amp; Hints</h1>
<p class="sub">Football Wordle <strong>#${num}</strong> — ${esc(todayLabel)}</p>
<span class="pill">Updated daily · answer stays hidden until you tap</span>

<h2>Hints for today's Footle</h2>
<div class="card">
<ul class="hints">
${hintItems}
</ul>
</div>

<details class="reveal">
<summary><span>👀 Reveal today's Footle answer (#${num})</span><span class="chev">+</span></summary>
<div class="answer">
<div class="big">${esc(answer)}</div>
<div class="who">Today's Footle answer is <strong>${esc(answerFull)}</strong>.</div>
</div>
</details>

<a class="cta" href="${SITE}/play?game=footle">▶ Play today's Footle free</a>

<h2>Yesterday's Footle answer</h2>
<div class="ya">
<div><div class="lbl">Football Wordle #${footleNumber(yDi)}</div><div class="who">${esc(yFull)} <span class="asr">(${esc(yAns)})</span></div></div>
<a class="cta ghost" style="margin:0;padding:11px 18px" href="${SITE}/play?game=footle">Play now</a>
</div>

<h2>What is Footle?</h2>
<p><strong>Footle</strong> is a free daily football word game — Wordle for footballers. Every day there's one hidden surname of a real player or manager, and you get six guesses. After each guess the tiles turn <strong style="color:var(--grn)">green</strong> (right letter, right spot), <span style="color:var(--gold)">yellow</span> (in the name, wrong spot) or grey (not in the name). The word length changes daily, from four to eight letters. There's no sign-up, a fresh puzzle drops at midnight, and you can share your result grid.</p>
<p>Footle is part of <a href="${SITE}/" style="color:var(--grn)">Ball IQ</a>, a football trivia app with 4,000+ questions across leagues, clubs and competitions, plus real-time multiplayer. If you found this page looking for today's answer, the puzzle itself takes about a minute — <a href="${SITE}/play?game=footle" style="color:var(--grn)">give it a try first</a>.</p>

<h2>Past Footle answers</h2>
<p>Every previous Football Wordle solution, most recent first:</p>
<div class="card" style="padding:6px 16px">
<table>
${archiveRows}
</table>
</div>

<a class="cta" href="${SITE}/football-wordle/" style="margin-top:24px">More about Footle →</a>
<a class="cta ghost" href="${SITE}/quiz/">Browse all football quizzes →</a>

<footer>
<p>Ball IQ is an independent football quiz app. Player names are used for identification and trivia only; no affiliation with or endorsement by any club, league or player is implied. Answers update automatically each day at 00:00 UTC.</p>
<p><a href="${SITE}/">Ball IQ home</a> · <a href="${SITE}/football-wordle/">Play Footle</a> · <a href="${SITE}/quiz/">All quizzes</a> · <a href="${SITE}/about/">About</a></p>
</footer>
</div>
</body>
</html>`;

  // Cache until the next UTC midnight (when the puzzle rolls), min 60s.
  const now = Date.now();
  const nextMidnight = (today + 1) * DAY_MS;
  const sMaxAge = Math.max(60, Math.floor((nextMidnight - now) / 1000));

  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': `public, max-age=0, s-maxage=${sMaxAge}, stale-while-revalidate=3600`,
    },
  });
}
