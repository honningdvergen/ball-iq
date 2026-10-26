// lastmod.mjs: an honest "last changed" date per page, for the sitemap and for
// the byline a page prints.
//
// ⚠️ WHY (26 Oct 2026). The sitemap used to stamp every URL with the BUILD date,
// so with 20 to 70 deploys a week all 262 pages "changed" every day. Google says
// it uses <lastmod> only when it is "consistently and verifiably accurate", and
// ignores it otherwise; a site whose every page claims to change daily also
// reads as unstable. The date here moves only when a page's content does.
//
// How: each page registers a content key (a hash of what it is made from: its
// question rows and prose, or its visible text with dates stripped). The key is
// compared with scripts/seo/lastmod.json; a new or changed key gets today's
// date, a matching key keeps the stored one. The store is rewritten by a LOCAL
// build only (never on Vercel, which cannot commit), so the next local build
// after a content change records it and ships it.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const STORE = fileURLToPath(new URL('./lastmod.json', import.meta.url));
const TODAY = new Date().toISOString().slice(0, 10);
const stored = existsSync(STORE) ? JSON.parse(readFileSync(STORE, 'utf8')) : {};
const seen = new Map(); // path -> { h, d }

const MONTHS = 'January|February|March|April|May|June|July|August|September|October|November|December';
// Dates a page prints about itself (today's set, the byline, the build) are
// not content; strip them so a page that only re-dated itself keeps its key.
const DATE_RE = new RegExp(`\\b(?:${MONTHS})\\s+\\d{1,2}(?:,\\s*\\d{4})?\\b|\\b\\d{1,2}\\s+(?:${MONTHS})\\s+\\d{4}\\b|\\b\\d{4}-\\d{2}-\\d{2}\\b`, 'g');

export function contentKeyOfHtml(html) {
  const text = html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(DATE_RE, '')
    .replace(/\s+/g, ' ');
  return createHash('sha1').update(text).digest('hex').slice(0, 16);
}

export function contentKeyOf(material) {
  return createHash('sha1').update(typeof material === 'string' ? material : JSON.stringify(material)).digest('hex').slice(0, 16);
}

/** Register a page's content key and get its last-changed date (YYYY-MM-DD). */
export function lastmodFor(path, key) {
  const hit = seen.get(path);
  if (hit) return hit.d;
  const prev = stored[path];
  const d = prev && prev.h === key ? prev.d : TODAY;
  seen.set(path, { h: key, d });
  return d;
}

/** The sitemap's fallback: a page nobody registered, keyed on its built HTML. */
export function lastmodForHtml(path, html) {
  return lastmodFor(path, contentKeyOfHtml(html));
}

/** Write the store, locally only. Returns how many dates moved. */
export function flushLastmodStore() {
  if (process.env.VERCEL || process.env.CI) return 0;
  let moved = 0;
  const next = {};
  for (const [path, v] of [...seen].sort(([a], [b]) => a.localeCompare(b))) {
    if (!stored[path] || stored[path].h !== v.h) moved++;
    next[path] = v;
  }
  writeFileSync(STORE, JSON.stringify(next, null, 0).replace(/},"/g, '},\n"') + '\n');
  return moved;
}

export function niceDate(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  return `${d} ${MONTHS.split('|')[m - 1]} ${y}`;
}
