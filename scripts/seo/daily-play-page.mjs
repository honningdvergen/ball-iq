// Today's Daily 7, playable — served by api/daily-play.js at
// /daily-football-quiz/ (vercel.json rewrite; the generator no longer writes
// that file). Alex, 2026-09-05: static playable daily pages before retiring
// /play?game=…; for the Daily 7 that means the club engine — the site's ONE
// question widget — fed today's frozen seven, not a React island around the
// app's quiz engine.
//
// WHY SERVED. The seven change at midnight and are frozen per date in
// src/data/dailyLog.js; a generated file would be stale by the second morning
// and a client-side pick would ship the whole log. The answers pages already
// live this way (api/daily-answers.js), cached until UTC midnight.
//
// WHY THREE DAYS. The app rolls at LOCAL midnight. A visitor in Auckland at
// 01:00 on the 6th is still on the 5th in UTC; one in Los Angeles at 21:00 on
// the 5th is already on the 6th in UTC. The page therefore carries yesterday,
// today and tomorrow (UTC) — today's seven visible for crawlers, the other two
// as <template>s — and a few lines of script swap in the visitor's own date
// before the engine starts. Tomorrow's seven are thereby in view-source; the
// app bundle has carried the entire log since the log existed, so this adds
// no new exposure — but it is a fact, not an accident.
import { QB } from '../../src/questions.js';
import { pickDailyFromLog } from '../../src/lib/quiz.js';
import { answerDocument, esc, SITE, secondsToUtcMidnight, fmtUtc, MONTH_LONG } from './answer-shell.mjs';
import { todayIndex, isoOf, recentDailyDays } from './daily-answers-page.mjs';
import { DAILY7_PAGE } from './content.mjs';
import { DEFAULT_TIERS } from './clubTiers.mjs';
import { BQ_CSS, BQ_JS, renderQuizSet, renderQuizItems } from './quiz-widget.mjs';

const DAY_MS = 24 * 60 * 60 * 1000;
const dateOf = (di) => new Date(di * DAY_MS);
const CANONICAL = `${SITE.base}/${DAILY7_PAGE.slug}/`;
const ANSWERS = `${SITE.base}/daily-football-quiz/answers/`;

const PAGE_CSS = `
  .dp-mast{margin:-4px 0 14px;font-size:14px;color:var(--tx3);font-variant-numeric:tabular-nums}
  .dp-mast b{color:var(--tx);font-weight:800}
  .dp-app{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;margin:26px 0 0;padding:14px 16px;border:1px solid var(--bd);border-radius:12px;background:var(--card2)}
  .dp-app span{font-size:14px;color:var(--tx3);line-height:1.45;flex:1 1 260px}
  .dp-app span b{color:var(--tx)}
  .dp-app-links{display:flex;gap:8px;flex:none}
  .dp-app-links a{display:inline-flex;align-items:center;min-height:44px;padding:0 16px;border-radius:999px;border:1px solid var(--bd2);color:var(--tx);font-size:13.5px;font-weight:700;text-decoration:none}
  .dp-recent{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:4px 14px}
  .dp-recent a{display:block;padding:8px 0;border-bottom:1px solid var(--bd);color:var(--tx2);font-size:14.5px}
  .dp-recent b{color:var(--tx)}
  .prose p{margin:0 0 12px;line-height:1.6;color:var(--tx2)}
  .sec h2{margin-top:6px}
`;

// Swap in the visitor's LOCAL date before the engine reads the board.
const DAY_PICK_JS = `(function(){try{var d=new Date(),y=d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2);
var root=document.querySelector('.bq[data-daily]');if(!root||root.getAttribute('data-daily')===y)return;
var t=document.getElementById('bq-day-'+y);if(!t)return;
var list=root.querySelector('.bq-list');list.innerHTML='';list.appendChild(t.content.cloneNode(true));root.setAttribute('data-daily',y);
var m=document.querySelector('.dp-mast b');if(m&&t.getAttribute('data-label'))m.textContent='Daily 7 \\u00b7 '+t.getAttribute('data-label')}catch(e){}})();`;

function unavailable() {
  return {
    status: 503,
    cacheSeconds: 60,
    staleSeconds: 60,
    html: answerDocument({
      title: 'Daily 7 — back in a moment | Ball IQ',
      description: "Today's Daily 7 is being prepared.",
      canonical: CANONICAL,
      robots: 'noindex, follow',
      body: `<section class="hero narrow"><h1>Back in a moment</h1><p class="lead">Today's seven are not ready here yet. <a href="${SITE.base}/play?game=daily">Play today's Daily 7 in the app</a>, or come back shortly.</p></section>`,
    }),
  };
}

/**
 * Today's playable Daily 7.
 * @returns {{ status: number, cacheSeconds: number, staleSeconds: number, html: string }}
 */
export function renderDailyPlay({ now = new Date() } = {}) {
  const today = todayIndex(now);
  const days = [today - 1, today, today + 1]
    .map((di) => ({ di, iso: isoOf(di), qs: pickDailyFromLog(QB, di) }))
    .filter((d) => Array.isArray(d.qs) && d.qs.length === 7);
  const cur = days.find((d) => d.di === today);
  if (!cur) return unavailable();

  const label = (di) => fmtUtc(dateOf(di), { weekday: 'long', ...MONTH_LONG });
  const quiz = renderQuizSet(cur.qs, { name: 'the Daily 7', tiers: DEFAULT_TIERS, more: 0, daily: cur.iso });
  const templates = days
    .filter((d) => d.di !== today)
    .map((d) => `<template id="bq-day-${d.iso}" data-label="${esc(label(d.di))}">${renderQuizItems(d.qs)}</template>`)
    .join('\n');

  const cfg = DAILY7_PAGE;
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE.base}/` },
        { '@type': 'ListItem', position: 2, name: cfg.game, item: CANONICAL },
      ] },
      { '@type': 'Game', name: cfg.game, alternateName: cfg.alternateName, url: CANONICAL, description: cfg.description,
        genre: ['Trivia', 'Sports trivia', 'Daily quiz'], gamePlatform: ['Web browser', 'iOS', 'Android'],
        numberOfPlayers: { '@type': 'QuantitativeValue', value: 1 }, isAccessibleForFree: true, inLanguage: 'en', playMode: 'SinglePlayer',
        publisher: { '@type': 'Organization', name: 'Ball IQ', url: `${SITE.base}/` } },
      { '@type': 'FAQPage', mainEntity: cfg.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
    ],
  };

  const how = cfg.how.map(([t, d], i) => `<p><strong>${i + 1}. ${esc(t)}.</strong> ${esc(d)}</p>`).join('\n');
  const body = cfg.body.map((p) => `<p>${esc(p)}</p>`).join('\n');
  const faq = cfg.faq.map((f) => `<details class="reveal"><summary><span>${esc(f.q)}</span><span class="chev" aria-hidden="true">+</span></summary><div class="answer" style="padding:0 18px 16px;color:var(--tx2);line-height:1.6">${esc(f.a)}</div></details>`).join('\n');
  const recent = recentDailyDays(7, now).map((d) => `<li><a href="${d.url}"><b>${esc(d.wd)}</b> ${esc(d.long)}</a></li>`).join('');

  const html = answerDocument({
    title: cfg.title,
    description: cfg.description,
    canonical: CANONICAL,
    ogTitle: `${cfg.game} — ${label(today)}`,
    ld,
    body: `<section class="hero">
<div class="crumbs"><a href="${SITE.base}/">Home</a><span class="sep" aria-hidden="true">›</span>${esc(cfg.game)}</div>
<div class="kicker"><span class="eyebrow">Daily game</span></div>
<h1>${esc(cfg.h1)}</h1>
<p class="lead">${esc(cfg.lede)}</p>
<p class="dp-mast"><b>Daily 7 · ${esc(label(today))}</b> · the same seven for everyone · a new seven at midnight</p>
</section>
<style>${BQ_CSS}${PAGE_CSS}</style>
${quiz}
${templates}
<script>${DAY_PICK_JS}</script>
<section class="sec" id="how"><h2>How to play</h2><div class="prose">${how}</div></section>
<section class="sec"><h2>What makes it different</h2><div class="prose">${body}</div></section>
<section class="sec"><h2>Yesterday's seven, and the week before</h2>
<p>Every day has its own page: the seven questions, the answers, and why each is right. <a href="${ANSWERS}">Today's, hidden until you tap</a>.</p>
<ul class="dp-recent">${recent}</ul>
<div class="dp-app"><span><b>Also on your phone.</b> Streaks, reminders and live 1v1 against a mate — the same seven, in the app.</span><span class="dp-app-links"><a href="${SITE.appStore}" rel="noopener">iOS</a><a href="${SITE.playStore}" rel="noopener">Android</a></span></div>
</section>
<section class="sec"><h2>Daily 7 FAQ</h2>${faq}</section>`,
  });
  // The engine is appended after the shell footer's scripts? No — inline in the
  // body above is fine; answerDocument places body inside <main>. The engine
  // must run after the board exists, so it goes right after the templates.
  return {
    status: 200,
    cacheSeconds: secondsToUtcMidnight(now),
    staleSeconds: 60,
    html: html.replace('<script>' + DAY_PICK_JS + '</script>', '<script>' + DAY_PICK_JS + '</script>\n<script>' + BQ_JS + '</script>'),
  };
}
