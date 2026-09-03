// /football-wordle/answer/ and /football-wordle/answer/:n/ (rewritten in
// vercel.json) — today's Footle hints + hidden answer, and one open page per
// past puzzle. The page itself is scripts/seo/footle-answer-page.mjs so it
// can be unit-tested and reused by the sitemap; this is only the edge glue.
//
// Server-rendered fresh on every request from the SAME source of truth the
// game uses (src/lib/wordle.js), so the answer can never drift from the live
// puzzle, and future answers never leave the server. Edge runtime; today's
// page is cached until the next UTC midnight, past pages for a month.
import { renderFootleAnswer } from '../scripts/seo/footle-answer-page.mjs';

export const config = { runtime: 'edge' };

export default function handler(request) {
  const raw = new URL(request.url).searchParams.get('n');
  const n = raw == null || raw === '' ? null : Number(raw);
  const page = renderFootleAnswer({ n });
  return new Response(page.html, {
    status: page.status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': `public, max-age=0, s-maxage=${page.cacheSeconds}, stale-while-revalidate=3600`,
    },
  });
}
