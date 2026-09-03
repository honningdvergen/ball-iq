// Daily 7 answer pages — the hub (/daily-football-quiz/answers/) and one page
// per day (/daily-football-quiz/answers/2026-09-03/). Served by
// api/daily-answers.js (Node runtime: it imports the whole question bank).
//
// WHY (2026-09-04). The Footle answer page is the only surface on the site
// with daily-return search demand (20% CTR on "footle answer" queries), and
// the Daily 7 had nothing like it. Each day's seven questions have been
// frozen in src/data/dailyLog.js since 2026-08-19 — the SAME questions
// everyone was served — so a dated page is a faithful record, not a
// reconstruction. Days before the log started are not rendered: they were
// rewritten by every bank change since launch and cannot be recovered
// honestly (see scripts/gen-daily-log.mjs).
//
// Today's answers sit behind a reveal so a search visitor is not spoiled by
// accident; past days are open, with the explanation for each answer — the
// part of a Ball IQ question people come back for.
import { QB } from '../../src/questions.js';
import { pickDailyFromLog } from '../../src/lib/quiz.js';
import DAILY_LOG from '../../src/data/dailyLog.js';
import { answerDocument, esc, SITE, secondsToUtcMidnight, fmtUtc, MONTH_LONG, MONTH_SHORT } from './answer-shell.mjs';

const DAY_MS = 24 * 60 * 60 * 1000;
const HUB = `${SITE.base}/daily-football-quiz/answers/`;
const PLAY = `${SITE.base}/play?game=daily`;
const RECENT = 30;

export const dayIndexOfDate = (y, m, d) => Math.floor(Date.UTC(y, m - 1, d) / DAY_MS);
export const todayIndex = (now = new Date()) => dayIndexOfDate(now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate());
export const isoOf = (di) => new Date(di * DAY_MS).toISOString().slice(0, 10);
export const pageUrl = (di) => `${HUB}${isoOf(di)}/`;
const dateOf = (di) => new Date(di * DAY_MS);
const firstLogged = () => DAILY_LOG.anchor;

/** The last `count` finished days the log covers, newest first — sitemap + landing-page links. */
export function recentDailyDays(count = RECENT, now = new Date()) {
  const today = todayIndex(now);
  const out = [];
  for (let di = today - 1; di > today - 1 - count; di--) {
    if (di < firstLogged()) break;
    out.push({ di, iso: isoOf(di), date: fmtUtc(dateOf(di), MONTH_SHORT), long: fmtUtc(dateOf(di), MONTH_LONG), wd: fmtUtc(dateOf(di), { weekday: 'short' }), url: pageUrl(di) });
  }
  return out;
}

const crumbs = (last) =>
  `<nav class="crumbs" aria-label="Breadcrumb"><a href="${SITE.base}/">Home</a><span class="sep" aria-hidden="true">›</span><a href="${SITE.base}/daily-football-quiz/">Daily 7</a><span class="sep" aria-hidden="true">›</span>${last}</nav>`;

const breadcrumbLd = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE.base}/` },
    { '@type': 'ListItem', position: 2, name: 'Daily 7', item: `${SITE.base}/daily-football-quiz/` },
    ...items.map((it, i) => ({ '@type': 'ListItem', position: 3 + i, ...it })),
  ],
});

function questionList(qs, { open }) {
  const items = qs
    .map((q, i) => {
      const opts = q.o.map((o, j) => `<span${open && j === q.a ? ' class="ok"' : ''}>${esc(o)}</span>`).join('');
      const why = open && q.hint ? `<div class="qw">${esc(q.hint)}</div>` : '';
      return `<li><div class="qn">Question ${i + 1}${q.cat ? ` · ${esc(q.cat)}` : ''}</div><div class="qq">${esc(q.q)}</div><div class="qo">${opts}</div>${why}</li>`;
    })
    .join('\n');
  return `<ol class="qa">${items}</ol>`;
}

function notFound() {
  const body = `<section class="hero narrow">${crumbs('Answers')}<h1>No Daily 7 for that date</h1>
<p class="lead">Answer pages run from ${esc(fmtUtc(dateOf(firstLogged()), MONTH_LONG))}, when the Daily 7 was first written down day by day, up to today. Tomorrow's is not written anywhere you can reach.</p>
<div class="cta-row"><a class="btn-green" href="${HUB}">Today's Daily 7 answers</a><a class="btn-ghost" href="${PLAY}">Play today's Daily 7</a></div></section>`;
  return {
    status: 404,
    cacheSeconds: 60,
    staleSeconds: 60,
    html: answerDocument({ title: 'Daily 7 answers not found | Ball IQ', description: 'No Daily 7 for that date.', canonical: HUB, robots: 'noindex, follow', body }),
  };
}

function recentBlock(now, exceptDi = null) {
  const days = recentDailyDays(RECENT, now).filter((d) => d.di !== exceptDi);
  if (!days.length) return '';
  return `<section class="sec narrow"><h2>Past days</h2><p>Each day's seven questions and answers, most recent first.</p>
<ul class="days">${days.map((d) => `<li><a href="${d.url}"><b>${esc(fmtUtc(dateOf(d.di), { weekday: 'short' }))}</b> ${esc(fmtUtc(dateOf(d.di), MONTH_LONG))}</a></li>`).join('')}</ul></section>`;
}

function dayPage(di, now) {
  const today = todayIndex(now);
  const isToday = di === today;
  const qs = pickDailyFromLog(QB, di);
  if (!qs) return notFound();
  const d = dateOf(di);
  const dateLong = fmtUtc(d, MONTH_LONG);
  const canonical = isToday ? HUB : pageUrl(di);

  const title = isToday
    ? `Daily 7 Answers Today — Daily Football Quiz | Ball IQ`
    : `Daily 7 Answers — ${dateLong} | Ball IQ`;
  const description = isToday
    ? `Today's Daily 7 answers, revealed only when you tap, with the reason each one is right — plus every past day's seven questions and answers.`
    : `The Daily 7 for ${dateLong}: all seven questions, the correct answers and why they are right. Play today's Daily 7 free on Ball IQ.`;

  const prevDi = di - 1 >= firstLogged() ? di - 1 : null;
  const nextDi = !isToday && di + 1 <= today ? di + 1 : null;
  const prev = prevDi != null ? `<a href="${pageUrl(prevDi)}">← ${esc(fmtUtc(dateOf(prevDi), MONTH_SHORT))}</a>` : '<span></span>';
  const next = nextDi != null ? `<a href="${nextDi === today ? HUB : pageUrl(nextDi)}">${nextDi === today ? 'Today' : esc(fmtUtc(dateOf(nextDi), MONTH_SHORT))} →</a>` : '';

  const answers = isToday
    ? `${questionList(qs, { open: false })}
<details class="reveal"><summary><span>Reveal today's seven answers</span><span class="chev" aria-hidden="true">+</span></summary><div class="answer" style="padding:0 12px 14px">${questionList(qs, { open: true })}</div></details>`
    : questionList(qs, { open: true });

  const body = `<section class="hero narrow">${crumbs(isToday ? 'Answers' : `<a href="${HUB}">Answers</a><span class="sep" aria-hidden="true">›</span>${esc(fmtUtc(d, MONTH_SHORT))}`)}
<div class="kicker"><span class="eyebrow">${isToday ? 'Updated daily · answers hidden until you tap' : 'Daily 7 archive'}</span></div>
<h1>${isToday ? "Today's Daily 7 answers" : `Daily 7 answers for ${esc(dateLong)}`}</h1>
<p class="lead">${esc(fmtUtc(d, { weekday: 'long', ...MONTH_LONG }))}. Seven questions, the same for everyone that day${isToday ? ' — play first, then check' : ', with the reason each answer is right'}.</p>
</section>
<section class="sec narrow">${answers}
<nav class="pn" aria-label="Neighbouring days">${prev}${next}</nav>
<div class="cta-row"><a class="btn-green" href="${PLAY}">Play today's Daily 7</a><a class="btn-ghost" href="${SITE.base}/daily-football-quiz/">About the Daily 7</a></div>
</section>
${recentBlock(now, di)}`;

  return {
    status: 200,
    cacheSeconds: isToday ? secondsToUtcMidnight(now) : 30 * 24 * 60 * 60,
    staleSeconds: isToday ? 60 : 24 * 60 * 60,
    html: answerDocument({
      title,
      description,
      canonical,
      ogTitle: isToday ? 'Daily 7 Answers Today' : `Daily 7 Answers — ${dateLong}`,
      ld: breadcrumbLd(isToday ? [{ name: 'Answers', item: HUB }] : [{ name: 'Answers', item: HUB }, { name: dateLong, item: canonical }]),
      body,
    }),
  };
}

/**
 * @param {{ date?: string|null, now?: Date }} p  date = null → today (the hub); else "YYYY-MM-DD"
 * @returns {{ status: number, cacheSeconds: number, html: string }}
 */
export function renderDailyAnswers({ date = null, now = new Date() } = {}) {
  const today = todayIndex(now);
  if (date == null) return dayPage(today, now);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(date));
  if (!m) return notFound();
  const di = dayIndexOfDate(+m[1], +m[2], +m[3]);
  if (!Number.isFinite(di) || isoOf(di) !== date || di < firstLogged() || di > today) return notFound();
  return dayPage(di, now);
}
