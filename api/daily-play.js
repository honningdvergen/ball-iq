// /daily-football-quiz/ (rewritten in vercel.json) — today's Daily 7, playable,
// in the site's one question widget. The page is
// scripts/seo/daily-play-page.mjs so it can be unit-tested; this is the glue.
//
// Node runtime, not edge: the renderer imports the whole question bank
// (src/questions.js) to resolve the frozen ids in src/data/dailyLog.js —
// the same reason api/daily-answers.js is Node.
import { renderDailyPlay } from '../scripts/seo/daily-play-page.mjs';

export default function handler(req, res) {
  const page = renderDailyPlay();
  res.status(page.status);
  res.setHeader('content-type', 'text/html; charset=utf-8');
  res.setHeader('cache-control', `public, max-age=0, s-maxage=${page.cacheSeconds}, stale-while-revalidate=${page.staleSeconds}`);
  res.send(page.html);
}
