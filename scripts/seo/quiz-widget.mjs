// ── THE WEB QUESTION WIDGET — one component for every quiz on the site ──────
// Lifted out of gen-seo-pages.mjs on 2026-09-05 so that a SERVED page can use
// it too: api/daily-play.js renders today's Daily 7 with this exact widget,
// and the generated club/category pages keep importing it from here. The
// critique of that day scored "four multiple-choice widgets on one domain" as
// a P0; this module is the one that survives. Nothing here is new — the CSS,
// the engine wiring, the option shuffle and the section markup moved verbatim
// (the engine itself stays in club-quiz-engine.js, read at import time).
import { readFileSync } from 'node:fs';
import { SITE } from './content.mjs';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Supabase endpoint + PUBLISHABLE key for the inline scripts. The key is
// publishable and already public in the app bundle; it carries no privilege
// beyond calling the SECURITY DEFINER functions, which throttle internally.
export const BQ_SUPABASE_URL = 'https://blcisypmngimqkwxrrdm.supabase.co';
export const BQ_PUBLISHABLE_KEY = 'sb_publishable_FluGERu-3n3KSIlgM37Jbg_P0KhDsiR';

// Deterministic option order: a given question always shuffles the same way.
export const seedFromId = (id) => {
  let h = 2166136261 >>> 0; // FNV-1a
  const s = String(id || '');
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
};
export function shuffleOptions(r) {
  if (!Array.isArray(r.o) || r.o.length < 2 || typeof r.a !== 'number') return r;
  const idx = r.o.map((_, i) => i);
  let h = seedFromId(r.id ?? r.q);
  // Fisher-Yates driven by a deterministic xorshift32 PRNG.
  for (let i = idx.length - 1; i > 0; i--) {
    h ^= h << 13; h >>>= 0; h ^= h >>> 17; h ^= h << 5; h >>>= 0;
    const j = h % (i + 1);
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return { ...r, o: idx.map((i) => r.o[i]), a: idx.indexOf(r.a) };
}

export const BQ_CSS = `  .bq{scroll-margin-top:72px}
  .bq-lenl{font-family:var(--mono);font-size:10px;letter-spacing:.13em;text-transform:uppercase;color:var(--tx4);margin-bottom:7px}
  .bq-len{display:flex;gap:7px;margin-bottom:12px}
  .bq-len button{flex:1;min-height:44px;padding:9px 6px;border-radius:10px;border:1px solid var(--bd);background:var(--card);color:var(--tx3);font:inherit;font-size:13px;font-weight:700;cursor:pointer;transition:background .15s,border-color .15s,color .15s}
  .bq-len button:hover{border-color:var(--bd3)}
  .bq-len button[aria-pressed="true"]{background:var(--grn);border-color:var(--grn);color:var(--grn-ink)}
  /* overflow:clip, not hidden. position:sticky sticks to the nearest ancestor
     that scrolls, and overflow:hidden MAKES the card that ancestor — the Next
     button would stick to the card instead of the viewport, i.e. not at all.
     clip clips the 2px top strip to the radius exactly as hidden did, without
     creating a scroll container. */
  .bq-card{background:linear-gradient(var(--card2),var(--card));border:1px solid var(--bd2);border-radius:20px;padding:20px;position:relative;overflow:clip}
  .bq-card::before{content:"";position:absolute;inset:0 0 auto;height:2px;background:linear-gradient(90deg,var(--club,var(--grn)),var(--club-soft,var(--grn-soft)) 60%,transparent)}
  .bq-top{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px;min-height:24px}
  .bq-meter{display:flex;gap:4px;flex-wrap:wrap}
  .bq-meter i{width:15px;height:4px;border-radius:2px;background:var(--bd);transition:background .2s}
  .bq-meter i.ok{background:var(--grn)}
  .bq-meter i.no{background:#FF4747}
  .bq-streak{font-family:var(--mono);font-size:11.5px;font-weight:700;color:var(--grn-ink);background:var(--amber);border-radius:6px;padding:3px 8px}
  .bq-list{list-style:none;margin:0;padding:0}
  /* ⚠️ EVERY QUESTION IS IN THE HTML AND MUST STAY THERE — it is the crawlable
     "with answers" text these pages rank on, and it is what a reader with JS
     off gets. But the browser was laying out all of it before the engine ran:
     /quiz/arsenal/ ships 66 questions / 264 option buttons, 1,379 of the
     page's 2,085 tags. Measured on the live page, five runs each: laying the
     full list out costs 44.5ms median unthrottled, 1.4ms with this rule —
     and PSI throttles the CPU 4x on top. content-visibility skips the
     RENDERING work for anything off-screen without touching the DOM, the
     accessibility tree, find-in-page, or what a crawler reads; it is not
     display:none. contain-intrinsic-size keeps the scroll height honest so
     CLS stays at 0. */
  .bq-q{content-visibility:auto;contain-intrinsic-size:auto 420px}
  .bq-q + .bq-q{margin-top:26px;padding-top:26px;border-top:1px solid var(--bd)}
  .bq-qn{font-family:var(--mono);font-size:10.5px;letter-spacing:.13em;text-transform:uppercase;color:var(--tx4);margin-bottom:7px}
  .bq-qx{font-size:19px;font-weight:700;color:var(--tx);line-height:1.3;letter-spacing:-.015em;margin:0 0 15px;text-wrap:balance}
  .bq-os{display:grid;gap:8px}
  .bq-o{display:flex;align-items:center;gap:11px;width:100%;min-height:44px;text-align:left;padding:12px 13px;border-radius:11px;border:1px solid var(--bd);background:var(--bg2);color:var(--tx2);font:inherit;font-size:14.5px;font-weight:600;cursor:pointer;transition:border-color .15s,background .15s;-webkit-user-select:none;user-select:none;touch-action:manipulation}
  .bq-o:active{border-color:var(--tx2)}
  .bq-o:hover:not(:disabled){border-color:var(--bd3);background:var(--card2)}
  .bq-o:disabled{cursor:default}
  .bq-o .k{flex:0 0 auto;width:22px;height:22px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:11px;font-weight:700;background:#1B2029;color:var(--tx4)}
  .bq-o .tt{flex:1}
  .bq-o.ok{border-color:var(--grn);background:rgba(88,204,2,.10);color:#B6F27E}
  .bq-o.ok .k{background:var(--grn);color:var(--grn-ink)}
  .bq-o.no{border-color:var(--wrong);background:rgba(255,71,71,.09);color:#FF8A82}
  .bq-o.no .k{background:var(--wrong);color:#fff}
  .bq-o.dim{opacity:.45}
  /* Screen-reader-only announcement of the outcome. Not display:none and not
     hidden — both remove it from the accessibility tree, which is exactly the
     bug this fixes. */
  .bq-sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0}
  .bq-why{margin-top:13px;border-left:2px solid var(--club,var(--grn));padding:2px 0 2px 14px;font-size:13.5px;color:var(--tx3);line-height:1.55;scroll-margin-bottom:76px}
  .bq-why b{display:block;font-family:var(--mono);font-size:10px;letter-spacing:.13em;text-transform:uppercase;color:var(--club-soft,var(--grn));margin-bottom:5px;font-weight:700}
  /* Sticky: after an answer the button used to land 212px below the fold at
     375x812 (measured live 2026-09-05), so every question cost a scroll-hunt on
     the page that holds visitors longest. Pinned to the viewport's foot while
     the card overflows it; in normal flow the moment the card fits. */
  .bq-next{position:sticky;bottom:10px;z-index:2;box-shadow:0 8px 24px rgba(0,0,0,.35);margin-top:14px;width:100%;padding:13px;border:none;border-radius:12px;background:var(--grn);color:var(--grn-ink);font:inherit;font-weight:800;font-size:15px;cursor:pointer}
  .bq-next:hover{filter:brightness(1.05)}
  .bq-res{text-align:center;padding:6px 2px;position:relative;overflow:hidden}
  .bq-res::before{content:"";position:absolute;inset:0 0 auto;height:3px;background:linear-gradient(90deg,transparent,var(--club,var(--grn)),transparent)}
  .bq-crest{width:30px;height:30px;margin:6px auto 10px;border-radius:8px;background:var(--club,var(--grn));color:#fff;font-family:var(--mono);font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center}
  .bq-rank{font-size:11px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:var(--tx4)}
  .bq-big{font-family:var(--mono);font-size:clamp(50px,11vw,62px);font-weight:800;line-height:1;letter-spacing:-.04em;color:#fff;margin:6px 0 6px}
  .bq-big small{font-size:.42em;color:var(--tx3);font-weight:700;letter-spacing:0}
  .bq-note b{color:var(--tx);font-family:var(--mono);font-weight:700}
  .bq-tier{display:inline-block;font-size:15px;font-weight:800;color:var(--club-ink,var(--grn-ink));background:var(--club,var(--grn));padding:5px 13px;border-radius:999px}
  .bq-sub{font-size:13.5px;color:var(--tx4);margin-top:11px}
  .bq-row{display:flex;flex-wrap:wrap;gap:8px;margin-top:15px}
  .bq-row a,.bq-row button{flex:1 1 140px;text-align:center;padding:12px;border-radius:11px;background:var(--grn);color:var(--grn-ink);font:inherit;font-weight:800;font-size:14px;border:none;cursor:pointer}
  .bq-row a:hover{text-decoration:none;filter:brightness(1.05)}
  .bq-row .ghost{background:transparent;border:1px solid var(--bd2);color:var(--tx3)}
  /* One primary on the results card since 2026-09-05. The club-coloured
     "Play the full quiz" crossing (.bq-cross) went with the web /play game
     routes; green has exactly one job here — continue where you already are —
     and the app is a quiet line at the foot (.bq-app), a destination rather
     than a competitor. */
  /* Full-width primary: the action that keeps the reader where they already
     are. It is first in the DOM and now first in the eye. */
  .bq-row .bq-wide{flex:1 1 100%}
  .bq-app{display:flex;align-items:center;justify-content:center;min-height:44px;margin-top:10px;font-size:13px;color:var(--tx3);text-decoration:none}
  .bq-app:hover{color:var(--tx);text-decoration:none}
  /* The daily door as a card (fourth treatment — see finish() in the engine):
     a board picture, a name, one line, a green "Play". Outside .bq-row on
     purpose, so none of the row's button paint reaches it. */
  .bq-footle{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:14px;margin-top:10px;padding:12px 14px;border-radius:12px;background:var(--card2);border:1px solid var(--bd);color:var(--tx);text-align:left}
  .bq-footle:hover{text-decoration:none;border-color:var(--bd2)}
  .bq-fb{display:grid;grid-template-columns:repeat(7,14px);gap:3px}
  .bq-fb i{display:block;width:14px;height:14px;border-radius:4px;background:var(--bd);border:1px solid rgba(255,255,255,.07)}
  .bq-fb i.cur{border-color:rgba(88,204,2,.7);box-shadow:inset 0 0 0 1px rgba(88,204,2,.35)}
  .bq-ft{display:flex;flex-direction:column;gap:2px;min-width:0}
  .bq-ft b{font-size:15px;font-weight:700;color:var(--tx)}
  .bq-ft span{font-size:12.5px;line-height:1.4;color:var(--tx3)}
  .bq-fgo{font-size:13.5px;font-weight:800;color:var(--grn);white-space:nowrap}
  .bq-footle:focus-visible{outline:3px solid var(--grn-soft);outline-offset:2px}
  .bq-note{margin:12px 0 0;font-size:12.5px;color:var(--tx4)}
  .bq-o:focus-visible,.bq-len button:focus-visible,.bq-next:focus-visible,.bq-row a:focus-visible,.bq-row button:focus-visible{outline:3px solid var(--grn-soft);outline-offset:2px}
  .bq-days{display:inline-block;margin-top:9px;padding:4px 11px;border-radius:999px;
    background:rgba(240,169,59,.14);border:1px solid rgba(240,169,59,.4);
    color:#F0A93B;font-size:12.5px;font-weight:700}
  .bq-share{display:block;width:100%;margin-top:13px;padding:13px;border-radius:11px;
    border:1px solid var(--club,var(--grn));background:transparent;color:var(--club-tx,var(--grn));
    font:inherit;font-weight:800;font-size:14.5px;cursor:pointer;min-height:44px}
  .bq-share:hover{background:rgba(255,255,255,.04)}
  .bq-share:focus-visible{outline:3px solid var(--grn-soft);outline-offset:2px}
  .bq-lenwrap{margin-top:14px}
  .bq-daily{display:flex;align-items:center;gap:9px;margin:0 0 13px;padding:9px 12px;border-radius:11px;
    background:linear-gradient(90deg,rgba(240,169,59,.10),transparent);border:1px solid rgba(240,169,59,.28)}
  .bq-dot{width:7px;height:7px;border-radius:50%;background:#F0A93B;flex:none;box-shadow:0 0 8px rgba(240,169,59,.7)}
  .bq-dtx{font-size:13px;color:var(--tx3);line-height:1.35}
  .bq-dtx b{color:#F0A93B;font-weight:700}
  @media (prefers-reduced-motion:reduce){.bq-meter i,.bq-o{transition:none}}`;

// The engine, read from its own file with the two build-time values
// substituted. Ship the ENGINE, not the file's documentation.
export const BQ_JS = (() => {
  const file = readFileSync(new URL('./club-quiz-engine.js', import.meta.url), 'utf8');
  // ⚠️ Ship the ENGINE, not the file's documentation. The first version of this
  // inlined the whole file, which put a 20-line header on ~140 pages — and
  // substituted the real Supabase URL and key into the very comment that names
  // the placeholders. Slice from the marker instead.
  const MARK = '/* ---- ENGINE START';
  const i = file.indexOf(MARK);
  if (i < 0) throw new Error('[quiz-widget] club-quiz-engine.js is missing its ENGINE START marker');
  const nl = file.indexOf('\n', i);
  return file
    .slice(nl + 1)
    .replaceAll('__BQ_SUPABASE_URL__', BQ_SUPABASE_URL)
    .replaceAll('__BQ_PUBLISHABLE_KEY__', BQ_PUBLISHABLE_KEY);
})();

export function renderQuizItems(rows) {
  return rows
    .map(shuffleOptions)
    .map((r) => {
      const opts = r.o
        .map((o, k) => `<button class="bq-o" type="button" data-i="${k}"><span class="k">${'ABCD'[k] || ''}</span><span class="tt">${esc(o)}</span></button>`)
        .join('');
      return `<li class="bq-q" data-a="${r.a}"${r.diff ? ` data-diff="${esc(r.diff)}"` : ''}>
<p class="bq-qn">${esc(r.diff || 'Question')}</p>
<p class="bq-qx">${esc(r.q)}</p>
<div class="bq-os">${opts}</div>
<p class="bq-sr" role="status" aria-live="polite"></p>
<div class="bq-why"><b>Why</b>${esc(r.hint)}</div>
<button class="bq-next" type="button" hidden>Next question →</button>
</li>`;
    })
    .join('\n');
}

// `daily` (a YYYY-MM-DD) turns the widget into the Daily 7: exactly the rows
// given, no length picker, and the engine's daily branch (one shot, the app's
// own biq_daily_<date> record, a share line with the date).
export function renderQuizSet(rows, { name, tiers, store, more = 0, badge = '', slug = '', color = '', play = `${SITE.base}/play`, daily = '' }) {
  const items = renderQuizItems(rows);
  const lens = daily ? [] : [10, 20, rows.length].filter((n, i, a) => n <= rows.length && a.indexOf(n) === i);
  const picker = lens.length > 1
    ? `<div class="bq-lenl">Change the length</div><div class="bq-len">${lens
        // ⚠️ "Full set" CARRIES NO NUMBER — it used to read "42 Full set".
        // That is the pack size, i.e. exactly the "N questions in this pack"
        // badge the no-counts rule names as the disguise it keeps coming back
        // wearing. It was live on 124 pages with values from 15 to 609, so
        // /quiz/hajduk-split/ told a searcher there were 15 questions and
        // /quiz/beckham/ told them 16 — advertising the thinnest packs, and
        // showing two wildly different figures one click apart.
        //
        // "10 Quick" and "20 Standard" KEEP their numbers on purpose: those are
        // how many questions the player is choosing to answer, not a claim
        // about how much content exists. The rule is about the size of the
        // bank, not about counting things.
        .map((n, i) => `<button type="button" data-n="${n}" aria-pressed="${i === 0 ? 'true' : 'false'}">${n === rows.length ? 'Full set' : n === 10 ? '10 Quick' : `${n} Standard`}</button>`)
        .join('')}</div>`
    : '';
  return `<section class="bq" id="quiz" data-total="${rows.length}"${daily ? ` data-daily="${daily}"` : ''} data-name="${esc(name)}" data-tiers="${esc(tiers.join('|'))}" data-store="${SITE.getApp}" data-play="${play}" data-more="${more}" data-badge="${esc(badge)}" data-slug="${esc(slug)}" data-color="${esc(color)}">
<div class="bq-head"><p class="bq-daily" hidden><span class="bq-dot" aria-hidden="true"></span><span class="bq-dtx"></span></p>
<div class="bq-card">
<div class="bq-top"><div class="bq-meter" aria-hidden="true"></div><span class="bq-streak" hidden></span></div>
<ol class="bq-list">
${items}
</ol>
</div></div>
<div class="bq-res bq-card" hidden></div>
<div class="bq-lenwrap" hidden>${picker}</div>
<script>${BQ_JS}</script>
</section>`;
}
