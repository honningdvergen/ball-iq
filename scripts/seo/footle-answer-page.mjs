// Footle answer pages — the hub (/football-wordle/answer/) and one page per
// past puzzle (/football-wordle/answer/92/). Served by api/footle.js.
//
// WHY PER-PUZZLE PAGES (2026-09-04). GSC 28d: the hub took 6 clicks on 30
// impressions — 20% CTR, the best ratio on the site — while the whole site
// runs at 3%. "Footle #N answer" / "footle answer today" is the NYT-Wordle
// search pattern, and each past puzzle is its own long-tail query. The hub
// used to carry every past answer in one table with anchor links; Google
// does not rank a table row. Each past puzzle now has a URL, a title, an
// open answer and prev/next links, and the last 30 are in the sitemap and
// linked from /football-wordle/ (scripts/gen-seo-pages.mjs), so they are not
// orphans. Older ones are reachable from the hub's archive table.
//
// Same source of truth as the game (src/lib/wordle.js): a logged day never
// moves, so a page can be cached for a month; today's page rolls at UTC
// midnight. Future puzzles are never rendered — /answer/999/ is a 404 with
// noindex, not a spoiler.
import {
  WORDLE_FULL_NAMES,
  getWordleDayIndex,
  getWordleAnswerForDayIndex,
  WORDLE_ANCHOR_DAY,
} from '../../src/lib/wordle.js';
import { answerDocument, esc, SITE, secondsToUtcMidnight, fmtUtc, MONTH_LONG, MONTH_SHORT, MONTH_SHORT_Y } from './answer-shell.mjs';

const DAY_MS = 24 * 60 * 60 * 1000;
const HUB = `${SITE.base}/football-wordle/answer/`;
const PLAY = `${SITE.base}/play?game=footle`;
const ARCHIVE_ROWS = 90;

export const footleNumber = (di) => di - WORDLE_ANCHOR_DAY + 1;
export const dayIndexOfFootle = (n) => WORDLE_ANCHOR_DAY + n - 1;
export const pageUrl = (n) => `${SITE.base}/football-wordle/answer/${n}/`;
const dateOf = (di) => new Date(di * DAY_MS);
export const fullNameOf = (surname) => {
  const fn = WORDLE_FULL_NAMES[surname] || ['', surname];
  return `${fn[0]} ${fn[1]}`.trim();
};

/** The last `count` finished puzzles, newest first — for the sitemap and the landing page's link block. */
export function recentFootleAnswers(count = 30, now = new Date()) {
  const today = getWordleDayIndex(now);
  const out = [];
  for (let di = today - 1; di > today - 1 - count; di--) {
    const n = footleNumber(di);
    if (n < 1) break;
    const surname = getWordleAnswerForDayIndex(di);
    out.push({ n, surname, full: fullNameOf(surname), date: fmtUtc(dateOf(di), MONTH_SHORT), url: pageUrl(n) });
  }
  return out;
}

// Letter-only hints: we hold the surname and full name, nothing else, so the
// hints never guess at data we do not have.
function hintsFor(surname, subject) {
  const letters = surname.toUpperCase();
  const vowels = (letters.match(/[AEIOU]/g) || []).length;
  const firstName = (WORDLE_FULL_NAMES[surname]?.[0] || '').trim();
  const dbl = /(.)\1/.test(letters);
  const hints = [
    `${subject} is a <strong>${letters.length}-letter</strong> surname.`,
    `It begins with <strong>${letters[0]}</strong> and ends with <strong>${letters[letters.length - 1]}</strong>.`,
    `It has <strong>${vowels}</strong> vowel${vowels === 1 ? '' : 's'}${dbl ? ' and a double letter' : ''}.`,
  ];
  if (firstName) hints.push(`The first name begins with <strong>${firstName[0].toUpperCase()}</strong>.`);
  return hints.map((h, i) => `<li><span class="hn">Hint ${i + 1}</span><span class="ht">${h}</span></li>`).join('\n');
}

const crumbs = (last) =>
  `<nav class="crumbs" aria-label="Breadcrumb"><a href="${SITE.base}/">Home</a><span class="sep" aria-hidden="true">›</span><a href="${SITE.base}/football-wordle/">Footle</a><span class="sep" aria-hidden="true">›</span>${last}</nav>`;

const breadcrumbLd = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE.base}/` },
    { '@type': 'ListItem', position: 2, name: 'Footle', item: `${SITE.base}/football-wordle/` },
    ...items.map((it, i) => ({ '@type': 'ListItem', position: 3 + i, ...it })),
  ],
});

function notFound() {
  const body = `<section class="hero narrow">${crumbs('Answers')}<h1>No Footle with that number</h1>
<p class="lead">Footle numbers start at 1 and run up to today's. Tomorrow's is not written down anywhere you can reach.</p>
<div class="cta-row"><a class="btn-green" href="${HUB}">Today's hints and answer</a><a class="btn-ghost" href="${PLAY}">Play today's Footle</a></div></section>`;
  return {
    status: 404,
    cacheSeconds: 60,
    staleSeconds: 60,
    html: answerDocument({ title: 'Footle answer not found | Ball IQ', description: 'No Footle puzzle with that number.', canonical: HUB, robots: 'noindex, follow', body }),
  };
}

function hubPage(now) {
  const today = getWordleDayIndex(now);
  const num = footleNumber(today);
  const answer = getWordleAnswerForDayIndex(today);
  const todayLabel = fmtUtc(dateOf(today), { weekday: 'long', ...MONTH_LONG });
  const yDi = today - 1;
  const yN = footleNumber(yDi);
  const yAns = yN >= 1 ? getWordleAnswerForDayIndex(yDi) : null;

  const archive = recentFootleAnswers(ARCHIVE_ROWS, now);
  const rows = archive
    .map((a) => `<tr><td class="an"><a href="${a.url}">No. ${a.n}</a></td><td class="ad">${esc(a.date)}</td><td class="aa">${esc(a.full)} <span class="asr">(${esc(a.surname)})</span></td></tr>`)
    .join('\n');

  const title = `Footle Answer Today — Hints for No. ${num} | Ball IQ`; // date lives in the description; 60 chars is the SERP cut
  const description = `Hints for today's Footle, No. ${num} (${todayLabel}), with the answer hidden until you tap — and every past Football Wordle answer, one page per puzzle.`;

  const body = `<section class="hero narrow">${crumbs('Answer')}
<div class="kicker"><span class="eyebrow">Updated daily · answer hidden until you tap</span></div>
<h1>Today's Footle answer and hints</h1>
<p class="lead">Footle No. ${num} — ${esc(todayLabel)}. Have a proper go first; the hints get more specific as you go down.</p>
</section>
<section class="sec narrow"><h2>Hints for No. ${num}</h2>
<div class="card"><ul class="hints">${hintsFor(answer, "Today's answer")}</ul></div>
<details class="reveal"><summary><span>Reveal today's answer (No. ${num})</span><span class="chev" aria-hidden="true">+</span></summary>
<div class="answer"><div class="big">${esc(answer)}</div><div class="who">Today's Footle answer is <strong>${esc(fullNameOf(answer))}</strong>.</div></div></details>
<div class="cta-row"><a class="btn-green" href="${PLAY}">Play today's Footle</a>${yAns ? `<a class="btn-ghost" href="${pageUrl(yN)}">Yesterday's answer: ${esc(fullNameOf(yAns))}</a>` : ''}</div>
</section>
<section class="sec narrow"><h2>What Footle is</h2><div class="prose">
<p><strong>Footle</strong> is the football Wordle: one hidden surname of a real footballer each day, six guesses, and after each guess the tiles turn green (right letter, right place), yellow (in the name, wrong place) or grey (not in it). The length changes from day to day. A new name drops at midnight, and the same one is served to everyone, so a result is worth comparing.</p>
<p>It is one of four daily puzzles on <a href="${SITE.base}/">Ball IQ</a>, alongside the Daily 7, Transfer Trail and Mystery Player — all free, in the browser, no account needed.</p>
</div></section>
<section class="sec narrow"><h2>Past Footle answers</h2>
<p>Every puzzle has its own page, most recent first.</p>
<div class="card" style="padding:6px 16px"><table>${rows}</table></div>
</section>`;

  return {
    status: 200,
    cacheSeconds: secondsToUtcMidnight(now),
    staleSeconds: 60, // seen on prod 2026-09-04: with 3600 the hub showed yesterday's number after the roll
    html: answerDocument({
      title,
      description,
      canonical: HUB,
      ogTitle: `Footle Answer Today — No. ${num} Hints`,
      ld: breadcrumbLd([{ name: 'Answer', item: HUB }]),
      body,
    }),
  };
}

function pastPage(n, todayN) {
  const di = dayIndexOfFootle(n);
  const surname = getWordleAnswerForDayIndex(di);
  const full = fullNameOf(surname);
  const d = dateOf(di);
  const dateLong = fmtUtc(d, MONTH_LONG);
  const canonical = pageUrl(n);
  const prev = n > 1 ? `<a href="${pageUrl(n - 1)}">← No. ${n - 1}</a>` : '<span></span>';
  const next = n + 1 < todayN ? `<a href="${pageUrl(n + 1)}">No. ${n + 1} →</a>` : `<a href="${HUB}">Today's hints →</a>`;

  // With the year when it fits the 60-char SERP cut (it does for every surname
  // under 12 letters), without it otherwise — never a truncated title.
  const withYear = `Footle No. ${n} Answer — ${surname} (${fmtUtc(d, MONTH_SHORT_Y)}) | Ball IQ`;
  const title = withYear.length <= 60 ? withYear : `Footle No. ${n} Answer — ${surname} (${fmtUtc(d, MONTH_SHORT)}) | Ball IQ`;
  const description = `The answer to Footle No. ${n}, the football Wordle for ${dateLong}, was ${full} (${surname}) — ${surname.length} letters. Every past Footle answer has its own page, and today's hints are here too.`;

  const body = `<section class="hero narrow">${crumbs(`<a href="${HUB}">Answers</a><span class="sep" aria-hidden="true">›</span>No. ${n}`)}
<div class="kicker"><span class="eyebrow">Footle archive</span></div>
<h1>Footle No. ${n} answer</h1>
<p class="lead">${esc(fmtUtc(d, { weekday: 'long', ...MONTH_LONG }))}. This puzzle is finished, so the answer is open.</p>
</section>
<section class="sec narrow">
<div class="card"><div class="answer" style="padding:6px 0 4px"><div class="big">${esc(surname)}</div><div class="who">Footle No. ${n} was <strong>${esc(full)}</strong>.</div></div></div>
<h2 style="margin-top:28px">How the letters fell</h2>
<div class="card"><ul class="hints">${hintsFor(surname, 'The answer')}</ul></div>
<nav class="pn" aria-label="Neighbouring puzzles">${prev}${next}</nav>
<div class="cta-row"><a class="btn-green" href="${PLAY}">Play today's Footle</a><a class="btn-ghost" href="${SITE.base}/">Practise on a past puzzle</a></div>
</section>
<section class="sec narrow"><h2>What Footle is</h2><div class="prose">
<p><strong>Footle</strong> is the football Wordle: one hidden surname of a real footballer each day, six guesses, green and yellow tiles telling you how close you are. The same name for everyone, a new one at midnight. <a href="${HUB}">Today's hints and answer</a>, or <a href="${SITE.base}/football-wordle/">how to play</a>.</p>
</div></section>`;

  return {
    status: 200,
    cacheSeconds: 30 * 24 * 60 * 60,
    staleSeconds: 24 * 60 * 60,
    html: answerDocument({
      title,
      description,
      canonical,
      ogTitle: `Footle No. ${n} Answer — ${full}`,
      ld: breadcrumbLd([{ name: 'Answers', item: HUB }, { name: `No. ${n}`, item: canonical }]),
      body,
    }),
  };
}

/**
 * @param {{ n?: number|null, now?: Date }} p  n = null → the hub (today)
 * @returns {{ status: number, cacheSeconds: number, html: string }}
 */
export function renderFootleAnswer({ n = null, now = new Date() } = {}) {
  const todayN = footleNumber(getWordleDayIndex(now));
  if (n == null) return hubPage(now);
  if (!Number.isInteger(n) || n < 1 || n > todayN) return notFound();
  if (n === todayN) return hubPage(now); // today's answer lives on the hub; one URL, one canonical
  return pastPage(n, todayN);
}
