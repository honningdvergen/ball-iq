// /daily-football-quiz/answers/ and /daily-football-quiz/answers/:date/
// (rewritten in vercel.json) — today's Daily 7 with the answers hidden, and
// one open page per logged day. The page itself is
// scripts/seo/daily-answers-page.mjs; this is only the glue.
//
// Node runtime, not edge: the renderer imports the whole question bank
// (src/questions.js) to resolve the frozen ids in src/data/dailyLog.js.
import { renderDailyAnswers } from '../scripts/seo/daily-answers-page.mjs';

export default function handler(req, res) {
  const d = typeof req.query?.d === 'string' && req.query.d ? req.query.d : null;
  const page = renderDailyAnswers({ date: d });
  res.status(page.status);
  res.setHeader('content-type', 'text/html; charset=utf-8');
  res.setHeader('cache-control', `public, max-age=0, s-maxage=${page.cacheSeconds}, stale-while-revalidate=${page.staleSeconds}`);
  res.send(page.html);
}
