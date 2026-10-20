import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { shellStrings } from '../../scripts/seo/shell-i18n.mjs';

// The <head> of a localised club page is read by Google and by every chat app
// that unfurls a link, so English there is English the reader sees. Until
// 20 Oct 2026 (the localisation review), every translated club page:
//   - named its quiz "Quiz del FC Barcelona quiz", with "… soccer quiz" and
//     "… trivia" as alternates (written for US English searches);
//   - put "Quizzes" → /quiz/ in the structured breadcrumb while the visible one
//     linked the language's own hub;
//   - asked the share image for the Spanish label "Quiz de club" in Italian,
//     German, French, Dutch, Portuguese, Turkish and Indonesian;
//   - gave that image the English alt "Ball IQ football quiz".
// Skips when dist/ is absent (it runs after the build in npm run build).
const DIST = new URL('../../dist/', import.meta.url).pathname;
const LANGS = ['es', 'pt', 'it', 'de', 'fr', 'nl', 'tr', 'id'];

function clubPages() {
  const out = [];
  for (const lang of LANGS) {
    const dir = join(DIST, lang, 'quiz');
    if (!existsSync(dir)) continue;
    for (const slug of readdirSync(dir)) {
      const p = join(dir, slug, 'index.html');
      if (existsSync(p)) out.push({ lang, slug, html: readFileSync(p, 'utf8') });
    }
  }
  return out;
}

describe('localised club pages: the <head> is in the page language', () => {
  it.skipIf(!existsSync(DIST))('quiz name, breadcrumb, share-image label and alt', () => {
    const pages = clubPages();
    expect(pages.length).toBeGreaterThan(40);
    const bad = [];
    for (const { lang, slug, html } of pages) {
      const t = shellStrings(lang);
      const where = `${lang}/quiz/${slug}`;
      if (/"@type":"Quiz","name":"[^"]* quiz"/.test(html)) bad.push(`${where}: quiz name ends in English "quiz"`);
      if (/soccer quiz|"[^"]* trivia"/.test(html)) bad.push(`${where}: English "soccer quiz"/"trivia" alternate`);
      if (html.includes('"name":"Quizzes","item":"https://balliq.app/quiz/"')) bad.push(`${where}: English breadcrumb`);
      const alt = html.match(/og:image:alt" content="([^"]*)"/)?.[1];
      if (alt === 'Ball IQ football quiz') bad.push(`${where}: English image alt`);
      const k = html.match(/og:image" content="[^"]*[?&]k=([^&"]*)/)?.[1];
      if (slug !== 'index.html' && k && decodeURIComponent(k.replace(/\+/g, ' ')) !== t.clubQuizKind) {
        bad.push(`${where}: share image says "${decodeURIComponent(k.replace(/\+/g, ' '))}", not "${t.clubQuizKind}"`);
      }
    }
    expect(bad).toEqual([]);
  });
});
