// The Scouting Report homepage — seed cf2f8891, ported from
// docs/mockups/scouting-d.html.
//
// ⚠️ THIS IS A PORT, NOT A PARAPHRASE — the distinction cost a production
// incident. The first implementation reproduced the mockup's *parts* (a
// sheet, a question, an index) while inventing its own composition, and Alex
// called it on the live page: "the implementation did not go right." The
// composition below follows values MEASURED from the rendered mockup at
// 1456px, not remembered from grepping it:
//   container 1000px · hero LEFT-aligned, padding 34/64 · h1 88px -0.02em
//   the file 1080px wide (overhanging the container), rotated -0.45deg,
//   with a letterhead ("Ball IQ — scouting report" / "Subject: you · …")
//   and an INK assessment band carrying "N of 5" · options in a 2-col grid
//   · 12 curated clubs shown, the rest one disclosure away · Footle as
//   board + 422px rail with the legend and the clock.
//
// Standing rules that look like bugs if you do not know them:
//   · No cards, no border-radius, no glow. Hairline rules do that work.
//   · Action on the paper is INK, not green (Alex). Green lives on the desk.
//   · No counted-up numbers, no bounce easing.
//   · The exact question count never appears. Binding product rule.
//   · No literal px sizes — every size is a --ty/--sp role from report.js.
//   · No backticks inside the CSS template literal (build fails silently).
//   · The JSON-LD block stringifies a STATIC const — no user input reaches it.

import '../design/fonts.css';
import { NAV_GROUPS } from '../lib/nav.js';
import '../design/report.css';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { PLAY_STORE_URL, appStoreUrl } from '../lib/links.js';
import { getFootleNumber } from '../lib/footleNumber.js';
import { marketingEvent } from '../lib/marketingEvent.js';
// Generated (gen-club-index.mjs): 72 rows of {name, slug, competition}, 3.8KB.
// Never import scripts/seo/clubs.mjs here — it carries every club's SEO prose
// and would put ~200KB into this chunk to read three fields.
import { CLUB_HEADING, CLUB_INDEX } from './clubIndex.js';
import FootleBand from './FootleBand.jsx';

// OS-matched store badges (critique #3): an iPhone shown a Google Play button
// is friction with zero payoff. Desktop (neither) keeps the pair.
const _UA = typeof navigator !== 'undefined' ? navigator.userAgent : '';
const IS_IOS = /iPhone|iPad|iPod/.test(_UA);
const IS_ANDROID = /Android/.test(_UA);

const PLAY = '/play';
// /footle loads STRAIGHT into a playable board (measured 4.2s) — unlike
// /football-wordle/, which is a 4,931px marketing page about Footle.
const FOOTLE = '/footle';

// The five FAQs, copy identical to MarketingHome's CORRECTED set (Android
// live since 2026-07-30; no question counts). One array feeds both the
// rendered section and the FAQPage JSON-LD, so they cannot diverge.
const FAQS = [
  { q: 'Is Ball IQ free?', a: 'Yes — 100% free with no ads, in your browser and in the apps. Guests can jump straight into solo and local games, no account needed.' },
  { q: 'Do I need an account?', a: 'No. Play as a guest, or sign up to play online with up to 8 friends, save your streak, and build your profile card and leaderboard rank.' },
  { q: "What's Footle?", a: "Our daily Wordle-style game: guess the name a footballer goes by in six tries. A fresh one drops every day." },
  { q: 'Can I play with friends?', a: 'Absolutely — race friends in real time online, or pass-and-play locally on a single device.' },
  { q: 'Where can I play?', a: 'On iPhone via the App Store, on Android via Google Play, or instantly in your browser at balliq.app — no install, no account. Your progress follows your account across all three.' },
];

// FIVE VERIFIED BANK ROWS, not hand-written — Alex called the old opener
// (Klopp/Liverpool 2020) a gimme, and a taster promising an honest verdict
// cannot open with a free point. These are graded 'hard' in the bank and
// ramp from famous-record to genuinely tough; every answer was verified by
// RESOLVING o[a] at extraction, and every row ships the bank's own hint.
// `a` is an INDEX into `o`, never the answer string.
const QS = [
  {
    // bank q_cad396 [hard] — answer verified by resolution: "£100m"
    d: "Premier League",
    q: "How much did Man City pay Aston Villa for Jack Grealish in 2021 — a British record?",
    o: ["£80m", "£90m", "£115m", "£100m"],
    a: 3,
    why: "£100 million — the first-ever £100m deal involving a British club. Grealish went on to win the treble with City.",
  },
  {
    // bank q_08e349 [hard] — answer verified by resolution: "Juventus"
    d: "Euros",
    q: "Which club provided the most players to the Euro 2020 winning Italian squad?",
    o: ["Juventus", "AC Milan", "Inter", "Napoli"],
    a: 0,
    why: "Italy's two veteran centre-backs that summer both came from the same Turin club, which had four squad members in all.",
  },
  {
    // bank q_88b25c [hard] — answer verified by resolution: "Dinamo Batumi"
    d: "Transfers",
    q: "Napoli signed Khvicha Kvaratskhelia in 2022 from which club?",
    o: ["Dinamo Batumi", "Rubin Kazan", "Dinamo Tbilisi", "Lokomotiv Moscow"],
    a: 0,
    why: "Napoli picked up Kvaratskhelia from Georgia's Dinamo Batumi for a modest fee in summer 2022.",
  },
  {
    // bank q_d82f96 [hard] — answer verified by resolution: "Anelka"
    d: "Champions League",
    q: "Whose missed penalty allowed Man United to win the 2008 UCL final shootout vs Chelsea?",
    o: ["Ballack", "Kalou", "Cole", "Anelka"],
    a: 3,
    why: "Nicolas Anelka's saved penalty sealed United's win in Moscow. John Terry had slipped earlier, hitting the post with a chance to win it.",
  },
  {
    // bank q_c2301f [hard] — answer verified by resolution: "Suker"
    d: "Legends",
    q: "Who was top scorer at the 1998 World Cup with 6 goals?",
    o: ["Zidane", "Petit", "Suker", "Ronaldo"],
    a: 2,
    why: "Davor Šuker of Croatia — he led Croatia to third place in their first-ever World Cup as an independent nation.",
  },
];

// One band per possible score. Every verdict stop clears 4.5:1 as ink on
// newsprint (measured 7.08 / 5.38 / 4.66 / 4.81 / 4.75 / 5.23) — the Scout's
// Ramp amber (--attr-mid) is 2.13:1 there and must never be text.
const BANDS = [
  { t: 'Casual', s: 'You watch the finals. Nothing wrong with that.', v: 'var(--v0)' },
  { t: 'Passer-by', s: 'You know the names. The details are somebody else’s job.', v: 'var(--v1)' },
  { t: 'Matchday', s: 'You follow a team. You do not follow the archive.', v: 'var(--v2)' },
  { t: 'Regular', s: 'Solid. You have watched more football than most people you know.', v: 'var(--v3)' },
  { t: 'Anorak', s: 'You argue about football with people who lose those arguments.', v: 'var(--v4)' },
  { t: 'Scout', s: 'Five from five. The full test is the only thing left that will test you.', v: 'var(--v5)' },
];

// The mockup shows these twelve on the homepage; the other sixty stay one
// disclosure away — still real anchors in the DOM, so the 72-link crawl mesh
// survives while the reader gets the curated dozen.
const FEATURED_SLUGS = [
  'liverpool', 'arsenal', 'manchester-united', 'manchester-city', 'chelsea', 'tottenham',
  'barcelona', 'real-madrid', 'bayern-munich', 'borussia-dortmund', 'celtic', 'hajduk-split',
];

const CSS = `
.sr{background:var(--bg);background-image:var(--grain);color:var(--on-desk);
    font-family:'Archivo',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;
    font-variant-numeric:tabular-nums;min-height:100vh;overflow-x:hidden}
.sr *{box-sizing:border-box;margin:0;padding:0}
.sr a{color:inherit;text-decoration:none}
.sr :focus-visible{outline:3px solid var(--grn);outline-offset:3px}
.sr-w{max-width:1000px;margin:0 auto;padding-left:28px;padding-right:28px}

.sr a.sr-skip{position:absolute;left:-9999px;top:0;z-index:50;min-height:44px;
         display:inline-flex;align-items:center;padding:10px var(--sp3);
         background:var(--grn);color:var(--grn-ink);font:var(--ty-sec);font-weight:700}
.sr a.sr-skip:focus{left:0}

.sr-mast{display:flex;align-items:center;justify-content:space-between;gap:var(--sp2);
         flex-wrap:wrap;padding:var(--sp2) var(--sp3);border-bottom:1px solid var(--bd)}
.sr-mark{display:inline-flex;align-items:center;min-height:44px;
         font:700 21px/1 'Archivo Narrow',sans-serif;letter-spacing:.02em;
         color:var(--tx);text-transform:uppercase}
.sr-mark em{font-style:normal;color:var(--grn)}
.sr-nav{display:flex;gap:2px;flex-wrap:wrap;flex:1;justify-content:center}
.sr-nav a{display:inline-flex;align-items:center;min-height:44px;padding:10px 12px;
          font:var(--ty-sec);color:var(--on-desk-mut);transition:color .12s var(--ease)}
@media (hover:hover){.sr-nav a:hover{color:var(--tx)}}
@media (max-width:699px){.sr-nav{order:3;flex:1 1 100%;width:100%;margin-top:2px}}
.sr-grp{position:relative}
.sr-top{display:inline-flex;align-items:center;gap:5px;min-height:44px;padding:10px 12px;
        background:none;border:0;cursor:pointer;font:var(--ty-sec);color:var(--on-desk-mut);
        font-family:inherit;transition:color .12s var(--ease)}
@media (hover:hover){.sr-top:hover{color:var(--tx)}}
.sr-top[aria-expanded="true"]{color:var(--tx)}
.sr-caret{transition:transform .18s var(--ease)}
.sr-top[aria-expanded="true"] .sr-caret{transform:rotate(180deg)}
/* ⚠️ ABSOLUTE, NOT FIXED. .sr-mast carries a backdrop-filter on some routes,
   and a filtered element becomes the containing block for fixed descendants —
   the generated pages hit exactly this and the panel detached from the bar. */
/* ⚠️ OPAQUE, LITERAL COLOURS. var(--desk)/var(--rule) resolved to something
   see-through here and the h1 read straight through the open panel. The
   dropdown floats over arbitrary page content, so its background cannot be a
   role token that might be transparent in this scope — these match the
   generated pages' .nav-drop exactly, which is the point: one nav, one look. */
.sr-drop{position:absolute;top:100%;left:0;min-width:212px;z-index:120;
         display:flex;flex-direction:column;padding:7px;
         background:#12141B;border:1px solid #242836;border-radius:14px;
         box-shadow:0 18px 44px rgba(0,0,0,.55)}
.sr-drop[hidden]{display:none}
.sr-drop a{display:block;min-height:40px;padding:10px 12px;border-radius:9px;
           font:var(--ty-sec);color:#A6ADBB;white-space:nowrap}
@media (hover:hover){.sr-drop a:hover{color:#fff;background:rgba(88,204,2,.10)}}
@media (max-width:699px){
  .sr-nav{gap:0}
  .sr-grp{flex:1 1 auto}
  .sr-drop{left:0;right:0;min-width:0}
}
.sr a.sr-webbtn{display:flex;justify-content:center;width:100%;margin-top:10px}
.sr-footwhy{font-size:12.5px;opacity:.75;margin:4px 0 2px}
.sr a.sr-play{display:inline-flex;align-items:center;min-height:44px;padding:10px var(--sp3);
         background:var(--grn);color:var(--grn-ink);font:var(--ty-sec);font-weight:700;
         border:1px solid var(--grn);border-radius:var(--rc);transition:opacity .15s var(--ease)}
@media (hover:hover){.sr-play:hover{opacity:.88}}

/* The opening. LEFT-aligned and tight — measured from the mockup (34px over,
   64px under, 1000px container). Centring this was half of "does not look
   right": the same 88px headline reads calmer ranged left in a dense block. */
.sr-open{padding-top:var(--sp4);padding-bottom:var(--sp5)}
.sr-h1{font:var(--ty-headline);letter-spacing:var(--ty-headline-ls);
       text-transform:uppercase;color:var(--tx);text-wrap:balance}
.sr-lede{margin-top:var(--sp2);font:var(--ty-lede);color:var(--tx4);max-width:60ch}

/* The file: wider than the container, lying on the desk, with the stacked
   second sheet behind it — a sheet, not a glow. */
.sr-filewrap{position:relative;max-width:1080px;margin:0 auto var(--sp6);padding:0 var(--sp1)}
.sr-file{position:relative;background:var(--pa);background-image:var(--paper-tex);
         color:var(--ink);box-shadow:var(--sheet-shadow)}
@media (min-width:1140px){.sr-file{transform:rotate(-.45deg)}}
.sr-file::before{content:'';position:absolute;inset:-7px -6px 9px 10px;
                 background:var(--pa3);transform:rotate(.5deg);z-index:-1;
                 box-shadow:var(--sheet-shadow)}
@media (max-width:699px){.sr-file::before{display:none}
  .sr-filewrap{margin-left:var(--sp2);margin-right:var(--sp2);padding:0}}

.sr-lh{padding:var(--sp2) var(--sp3);border-bottom:2px solid var(--ink);background:var(--pa2)}
@media (min-width:700px){.sr-lh{padding:var(--sp2) var(--sp4)}}
.sr-who{font:var(--ty-label);letter-spacing:var(--ty-label-ls);
        text-transform:uppercase;font-weight:700}
.sr-subject{margin-top:3px;font:var(--ty-meta);color:var(--mut)}

.sr-assess{margin:var(--sp3) var(--sp3) 0;border:1px solid var(--ink)}
@media (min-width:700px){.sr-assess{margin:var(--sp4) var(--sp4) 0}}
.sr-ab{display:flex;align-items:center;justify-content:space-between;
       padding:9px var(--sp2);background:var(--ink);color:var(--pa)}
.sr-abt{font:var(--ty-label);letter-spacing:var(--ty-label-ls);text-transform:uppercase}
.sr-abn{font:var(--ty-meta);color:var(--pa3)}
.sr-abody{padding:var(--sp3) var(--sp2)}
@media (min-width:700px){.sr-abody{padding:var(--sp3)}}
/* Sentence-case caption, deliberately NOT the tracked-uppercase eyebrow the
   craft floor bans and the detector flagged once already. */
.sr-dept{font:var(--ty-sec);color:var(--mut)}
.sr-q{margin-top:6px;font:var(--ty-sub);font-weight:600;text-wrap:balance}
@media (min-width:700px){.sr-q{font:var(--ty-lede);font-weight:600}}

/* Options: the mockup's two-column boxed grid. --rule2 (3.31:1) because a
   rule doing a CONTROL's job must clear WCAG 1.4.11's 3:1 floor. */
.sr-opts{margin-top:var(--sp2);display:grid;grid-template-columns:1fr;gap:9px}
@media (min-width:700px){.sr-opts{grid-template-columns:1fr 1fr}}
.sr-opt{display:flex;align-items:center;gap:var(--sp2);width:100%;text-align:left;
        min-height:52px;padding:var(--sp1) var(--sp2);background:var(--pa);
        border:1px solid var(--rule2);color:var(--ink);
        font:var(--ty-body);cursor:pointer;transition:background-color .12s var(--ease)}
.sr-opt:disabled{cursor:default}
@media (hover:hover){.sr-opt:not(:disabled):hover{background:var(--pa2)}}

/* ⚠️ PHONE FOLD BUDGET — every number here was measured, not estimated.
   At 390×664 (iPhone 13) the stack above the first answer button ran to 641px:
   masthead 133 (the nav wraps onto its own 44px row) · opening 34+67+62+52 ·
   letterhead 69 · assessment frame 22+37+22 · caption 21 · question 87 · 15.
   The button is 52px tall, so the fold sliced it in half and options 2-4 were
   entirely below it: a page promising "five questions" showed a phone none of
   them. Taking the air out of three ornamental gaps pulls option 1 fully into
   view and starts option 2, which also signals there is more to scroll to.
   Type sizes and the 44px tap-target floors are untouched — this only trims
   the paper-file styling, and only on phones, because the desk-and-file
   composition genuinely needs that air at desktop widths.
   MUST STAY BELOW the rules it overrides: media queries add no specificity,
   so a later plain .sr-assess/.sr-abody rule would otherwise win. */
@media (max-width:699px){
  .sr-open{padding-top:var(--sp3);padding-bottom:var(--sp3)}
  .sr-lh{padding:10px var(--sp3)}
  .sr-assess{margin-top:var(--sp2)}
  .sr-abody{padding:var(--sp2)}
}
.sr-key{flex:0 0 auto;width:26px;height:26px;display:grid;place-items:center;
        border:1px solid var(--rule2);font:var(--ty-label);color:var(--mut)}
.sr-opt[data-mark="hit"]{border-color:var(--v5);font-weight:700}
.sr-opt[data-mark="hit"] .sr-key{background:var(--v5);border-color:var(--v5);color:var(--tx)}
.sr-opt[data-mark="miss"]{color:var(--mut);background:var(--pa2);border-color:var(--v0)}
.sr-opt[data-mark="miss"] .sr-key{background:var(--v0);border-color:var(--v0);color:var(--tx)}

.sr-whywrap{margin-top:var(--sp2);padding:var(--sp2);background:var(--pa2)}
.sr-whylab{font:var(--ty-label);letter-spacing:var(--ty-label-ls);text-transform:uppercase;
           color:var(--mut);margin-bottom:6px}
.sr-why{font:var(--ty-sec);color:var(--ink)}
.sr-next{margin-top:var(--sp2);min-height:52px;width:100%;background:var(--ink);color:var(--pa);
         border:1px solid var(--ink);border-radius:var(--rc);font:var(--ty-body);font-weight:700;cursor:pointer;
         transition:opacity .15s var(--ease)}
@media (hover:hover){.sr-next:hover{opacity:.86}}
/* The verdict's primary. Deliberately the SAME filled ink treatment as
   .sr-next, because this system has exactly one filled control and a second
   visual language for "the most important button" would weaken both. */
.sr-next-up{margin-top:var(--sp3)}
.sr-primary{display:flex;align-items:center;justify-content:center;min-height:56px;width:100%;
            background:var(--ink);color:var(--pa);border:1px solid var(--ink);border-radius:var(--rc);
            font:var(--ty-body);font-weight:700;text-align:center;
            transition:opacity .15s var(--ease)}
@media (hover:hover){.sr-primary:hover{opacity:.86;color:var(--pa)}}
.sr-nextp{margin-top:8px;font:var(--ty-meta);color:var(--mut)}

.sr-stubwrap{padding:var(--sp3);border-top:1px solid var(--rule);margin-top:var(--sp3)}
@media (min-width:700px){.sr-stubwrap{padding:var(--sp3) var(--sp4) var(--sp4)}}
.sr-stub{width:100%;border-collapse:collapse}
.sr-stub tr:nth-child(even){background:var(--pa2)}
.sr-stub th{font:var(--ty-label);letter-spacing:var(--ty-label-ls);
            text-transform:uppercase;color:var(--mut);text-align:left;
            padding:7px var(--sp1) 7px 0;font-weight:700;white-space:nowrap}
.sr-stub td{padding:7px 0}
.sr-bar{display:block;width:100%;max-width:180px;height:5px;background:var(--pa3)}
.sr-bar i{display:block;height:100%;background:var(--v5);transform:scaleX(0);
          transform-origin:left;transition:transform .5s var(--ease)}
.sr-bar i[data-on="1"]{transform:scaleX(1)}
@media (prefers-reduced-motion:reduce){.sr-bar i{transition:none}}
/* Filing motion: a new question slides in as a fresh sheet section; a filed
   outcome and the why-note land the same way the verdict does. One easing,
   short, meaningful — motion only where the document changed. */
.sr-swap{animation:sr-land .28s var(--ease) both}
.sr-filein{display:inline-block;animation:sr-land .3s var(--ease) both}
@media (prefers-reduced-motion:reduce){.sr-swap,.sr-filein{animation:none}}
.sr-out{font:var(--ty-meta);text-align:right;white-space:nowrap;padding-left:var(--sp1)}
.sr-out[data-r="yes"]{color:var(--v5);font-weight:700}
.sr-out[data-r="no"]{color:var(--v0);font-weight:700}
.sr-out[data-r="pend"]{color:var(--mut)}
.sr-vh{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}

.sr-verd{padding:var(--sp3);animation:sr-land .5s var(--ease) both}
@media (min-width:700px){.sr-verd{padding:var(--sp4)}}
@keyframes sr-land{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.sr-verd{animation:none}}
.sr-score{font:var(--ty-verdict-num);letter-spacing:var(--ty-verdict-num-ls)}
.sr-band{margin-top:var(--sp1);font:var(--ty-verdict-tier);
         letter-spacing:var(--ty-verdict-tier-ls);text-transform:uppercase}
.sr-bsub{margin-top:var(--sp1);font:var(--ty-body);color:var(--mut);max-width:44ch}
.sr-keep{margin-top:var(--sp3);padding-top:var(--sp3);border-top:2px solid var(--ink)}
.sr-keept{font:var(--ty-label);letter-spacing:var(--ty-label-ls);text-transform:uppercase}
.sr-keepp{margin-top:6px;font:var(--ty-sec);color:var(--mut);max-width:46ch}
.sr-links{margin-top:var(--sp2);display:flex;gap:var(--sp1);flex-wrap:wrap}
.sr-a{display:inline-flex;align-items:center;gap:8px;min-height:52px;padding:12px var(--sp3);
      border:1px solid var(--ink);border-radius:var(--rc);font:var(--ty-sec);font-weight:700;
      transition:background-color .15s var(--ease),color .15s var(--ease)}
.sr-a span{font:var(--ty-meta);color:var(--mut)}
@media (hover:hover){.sr-a:hover{background:var(--ink);color:var(--pa)}
                     .sr-a:hover span{color:var(--pa3)}}
@media (max-width:520px){.sr-a{width:100%;justify-content:space-between}}
.sr-web{margin-top:var(--sp2);font:var(--ty-sec);color:var(--mut)}
.sr-web a{text-decoration:underline;text-underline-offset:3px;font-weight:700;color:var(--ink)}

.sr-clubs{padding:var(--sp5) 0 var(--sp4);border-top:1px solid var(--bd)}
.sr-h2{font:var(--ty-section);letter-spacing:var(--ty-section-ls);
       text-transform:uppercase;color:var(--tx);text-wrap:balance}
.sr-clsub{margin-top:var(--sp2);font:var(--ty-sub);color:var(--on-desk);max-width:58ch}
.sr-idx{margin-top:var(--sp3);column-count:1;column-gap:var(--sp5)}
@media (min-width:760px){.sr-idx{column-count:2}}
.sr-row{display:flex;align-items:baseline;gap:10px;min-height:36px;
        break-inside:avoid;padding:6px 0;color:var(--on-desk);font:var(--ty-sec)}
@media (pointer:coarse){.sr-row{min-height:44px;padding:10px 0}}
.sr-cn{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:60%}
.sr-ld{flex:1;min-width:16px;border-bottom:1px dotted var(--bd3);transform:translateY(-4px)}
.sr-cc{white-space:nowrap;font:var(--ty-meta);color:var(--on-desk-mut)}
@media (hover:hover){.sr-row:hover{color:var(--tx)}
  .sr-row:hover .sr-ld{border-bottom-color:var(--on-desk-mut)}}
.sr-allclubs{margin-top:var(--sp1)}
.sr-allclubs summary{display:inline-flex;align-items:center;min-height:48px;
        padding:12px var(--sp3);border:1px solid var(--bd3);border-radius:var(--rc);color:var(--tx);
        font:var(--ty-sec);font-weight:700;cursor:pointer;list-style:none;
        transition:background-color .15s var(--ease)}
.sr-allclubs summary::-webkit-details-marker{display:none}
@media (hover:hover){.sr-allclubs summary:hover{background:var(--card)}}
.sr-allclubs[open] summary{margin-bottom:var(--sp2)}

.sr-faq{padding:var(--sp5) 0 var(--sp4);border-top:1px solid var(--bd)}
.sr-faq details{border-bottom:1px solid var(--bd)}
.sr-faq summary{display:flex;align-items:center;justify-content:space-between;
        gap:var(--sp2);min-height:52px;padding:var(--sp2) 0;cursor:pointer;
        font:var(--ty-body);font-weight:600;color:var(--on-desk);list-style:none}
.sr-faq summary::-webkit-details-marker{display:none}
.sr-faq summary::after{content:'+';font:700 20px/1 'Archivo Narrow',sans-serif;
        color:var(--on-desk-mut);flex:0 0 auto}
.sr-faq details[open] summary::after{content:'−'}
.sr-faq details[open] summary{color:var(--tx)}
.sr-faq .sr-fa{padding:0 0 var(--sp2);font:var(--ty-sec);color:var(--on-desk-mut);
        max-width:60ch;line-height:1.55}
@media (hover:hover){.sr-faq summary:hover{color:var(--tx)}}

.sr-foot{padding:var(--sp4) var(--sp3) var(--sp5);text-align:center;font:var(--ty-meta);
         color:var(--tx4);border-top:1px solid var(--bd)}
.sr-foot p{max-width:52ch;margin:0 auto}
.sr-dist{margin-top:var(--sp2);display:flex;gap:var(--sp2);justify-content:center;flex-wrap:wrap}
.sr-legal a{display:inline-flex;align-items:center;min-height:44px;
        padding:10px 12px;font:var(--ty-sec);color:var(--on-desk-mut);
        text-decoration:underline;text-underline-offset:3px}
.sr a.sr-badge{display:inline-flex;align-items:center;gap:9px;min-height:48px;
        padding:12px 18px;border:1px solid var(--bd3);border-radius:var(--rc);
        font:var(--ty-sec);font-weight:700;color:var(--tx);text-decoration:none;
        transition:background-color .15s var(--ease)}
@media (hover:hover){.sr a.sr-badge:hover{background:var(--card)}}
@media (hover:hover){.sr-legal a:hover{color:var(--tx)}}
.sr-legal{margin-top:2px;display:flex;gap:var(--sp1);justify-content:center;flex-wrap:wrap}
`;

/** The mockup's store marks (Footer Distribution Line, DESIGN.md) — the
 *  first port replaced them with text links; Alex asked for the marks. */
function AppleMark() {
  return (<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor"><path d="M16.7 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9-.7 0-1.8-.9-3-.8-1.5 0-2.9.9-3.7 2.3-1.6 2.7-.4 6.8 1.1 9 .8 1.1 1.7 2.3 2.9 2.2 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2.1-1.1 2.8-2.2.9-1.2 1.3-2.4 1.3-2.5 0 0-2.5-1-2.5-3.6zM14.4 5.8c.6-.8 1.1-1.9 1-3-.9 0-2.1.6-2.8 1.4-.6.7-1.2 1.8-1 2.9 1 .1 2.1-.5 2.8-1.3z" /></svg>);
}
function PlayMark() {
  return (<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="currentColor"><path d="M3.6 2.2c-.3.3-.5.8-.5 1.4v16.8c0 .6.2 1.1.5 1.4l.1.1 9.4-9.4v-.2L3.7 2.1z" /><path d="M16.3 15.7l-3.1-3.1v-.2l3.1-3.1.1.1 3.7 2.1c1.1.6 1.1 1.6 0 2.2z" /><path d="M16.4 15.8L13.2 12.6 3.6 22.2c.4.4 1 .4 1.7 0z" /><path d="M16.4 8.2L5.3 1.9c-.7-.4-1.3-.4-1.7 0l9.6 9.6z" /></svg>);
}

/** The running-report table — under the assessment while filing, above the
 *  verdict once filed. One component so the two can never disagree. */
function Stub({ results, caption }) {
  return (
    <table className="sr-stub">
      <caption className="sr-vh">{caption}</caption>
      <tbody>
        {QS.map((qq, k) => (
          <tr key={k}>
            <th scope="row">{qq.d}</th>
            <td>{results[k] !== null && (
              <span className="sr-bar"><i data-on={results[k] === true ? 1 : 0} /></span>
            )}</td>
            <td className="sr-out" data-r={results[k] === true ? 'yes' : results[k] === false ? 'no' : 'pend'}>
              <span className={results[k] === null ? undefined : 'sr-filein'} key={String(results[k])}>
                {results[k] === true ? '1 of 1' : results[k] === false ? '0 of 1' : 'not assessed'}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function ScoutingReport() {
  // Nav dropdowns. One open at a time; outside-click and Escape close it —
  // without those a phone tap outside the panel leaves it stuck over content.
  const [openNav, setOpenNav] = useState(null);
  useEffect(() => {
    if (!openNav) return undefined;
    const onDown = (e) => { if (!e.target.closest?.('.sr-grp')) setOpenNav(null); };
    const onKey = (e) => { if (e.key === 'Escape') setOpenNav(null); };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [openNav]);

  const [i, setI] = useState(0);
  const [picked, setPicked] = useState(null);
  const [results, setResults] = useState(() => QS.map(() => null));
  const scoreRef = useRef(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const q = QS[i];
  const answered = picked !== null;
  const filed = results.filter((r) => r !== null).length;

  const choose = useCallback((k) => {
    if (picked !== null) return;
    setPicked(k);
    const right = k === QS[i].a;
    setResults((r) => r.map((v, j) => (j === i ? right : v)));
    if (right) { scoreRef.current += 1; setScore(scoreRef.current); }
  }, [picked, i]);

  const next = useCallback(() => {
    if (i + 1 >= QS.length) { setDone(true); return; }
    setI(i + 1);
    setPicked(null);
  }, [i]);

  const band = BANDS[Math.min(score, BANDS.length - 1)];
  const featured = FEATURED_SLUGS.map((s) => CLUB_INDEX.find((r) => r.s === s)).filter(Boolean);
  const rest = CLUB_INDEX.filter((r) => !FEATURED_SLUGS.includes(r.s));

  // The letterhead's subject line follows the file's state — every state is a
  // sentence, never a bare label.
  const subject = done
    ? 'Subject: you · verdict filed — ' + band.t.toLowerCase() + ', ' + score + ' of ' + QS.length
    : filed === 0
      ? 'Subject: you · nothing filed yet'
      : 'Subject: you · ' + filed + ' of ' + QS.length + ' filed';

  return (
    <div className="sr">
      <style>{CSS}</style>

      <a className="sr-skip" href="#report">Skip to the assessment</a>

      <header className="sr-mast">
        <a className="sr-mark" href="/" aria-label="Ball IQ home">Ball <em>IQ</em></a>
        <nav className="sr-nav" aria-label="Main">
          {NAV_GROUPS.map(g => (
            <div className="sr-grp" key={g.key}>
              <button
                type="button"
                className="sr-top"
                aria-expanded={openNav === g.key}
                aria-controls={`srnd-${g.key}`}
                onClick={() => setOpenNav(o => (o === g.key ? null : g.key))}
              >
                {g.label}
                <svg className="sr-caret" width="10" height="6" viewBox="0 0 10 6" aria-hidden="true">
                  <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
                </svg>
              </button>
              <div className="sr-drop" id={`srnd-${g.key}`} hidden={openNav !== g.key}>
                {g.items.map(([label, href]) => <a key={href} href={href}>{label}</a>)}
              </div>
            </div>
          ))}
        </nav>
        {/* Critique #4 (2026-08-29): after the verdict is filed the earned
            moment shouldn't live and die inside the card — the header CTA
            graduates from acquisition to the retention offer. */}
        <a className="sr-play" href={done ? '/get' : PLAY}>{done ? 'Get the app' : 'Play free'}</a>
      </header>

      {!done && (
        <div className="sr-w sr-open">
          <h1 className="sr-h1">Five questions.<br />One honest verdict.</h1>
          <p className="sr-lede">
            No account, no waiting. The report writes itself while you answer.
          </p>
        </div>
      )}

      <div className="sr-filewrap">
        <main className="sr-file" id="report">
          <div className="sr-lh">
            <div className="sr-who">Ball IQ — scouting report</div>
            <div className="sr-subject">{subject}</div>
          </div>

          {!done ? (
            <>
              <div className="sr-assess">
                <div className="sr-ab">
                  <span className="sr-abt">Assessment</span>
                  <span className="sr-abn">{i + 1} of {QS.length}</span>
                </div>
                <div className="sr-abody sr-swap" key={i}>
                  <p className="sr-dept">{q.d}</p>
                  <h2 className="sr-q">{q.q}</h2>
                  <div className="sr-opts">
                    {q.o.map((opt, k) => {
                      const mark = !answered ? null : k === q.a ? 'hit' : k === picked ? 'miss' : null;
                      return (
                        <button key={k} className="sr-opt" data-mark={mark || undefined}
                          disabled={answered} onClick={() => choose(k)}>
                          <span className="sr-key" aria-hidden="true">{'ABCD'[k]}</span>
                          <span>{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                  {answered && (
                    <>
                      <div className="sr-whywrap sr-filein" role="status">
                        <div className="sr-whylab">Why</div>
                        <p className="sr-why">{q.why}</p>
                      </div>
                      <button className="sr-next" onClick={next}>
                        {i + 1 >= QS.length ? 'See the verdict' : 'Next question'}
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="sr-stubwrap">
                <Stub results={results} caption="The report so far, by discipline" />
              </div>
            </>
          ) : (
            <div className="sr-verd">
              <Stub results={results} caption="The completed report, by discipline" />
              <div className="sr-score" style={{ color: band.v, marginTop: 'var(--sp3)' }}>{score} / {QS.length}</div>
              <div className="sr-band" style={{ color: band.v }}>{band.t}</div>
              <p className="sr-bsub">{band.s}</p>

              {/* ⚠️ THE PAYOFF USED TO POINT AT A STORE LISTING.
                  Measured 2026-09-02 (WebKit, iPhone 13): after five answered
                  questions — the single highest-intent moment on the site — the
                  only two controls were "App Store" (y=772) and "Keep going in
                  the browser" (y=834), both 303x52 OUTLINE buttons. Same weight,
                  same border, no filled primary, no hierarchy: the one filled
                  control in this design system ("Next question") had just
                  unmounted. Footle appeared nowhere.
                  A warm visitor inside a working session was pointed at a
                  download, and away from the mode 62 of 66 three-day-active
                  players arrived through. Alex, 2026-09-02, asked for the trade
                  explicitly: browser plays over app installs.
                  ⚠️ EXPECT INSTALLS TO FALL. The metric is D3 return of the
                  cohort that clicks this, NOT installs — watching installs will
                  read this as a regression. */}
              <div className="sr-next-up">
                <a
                  className="sr-primary"
                  href={FOOTLE}
                  onClick={() => marketingEvent('sr-verdict-footle', { score })}
                >
                  Play today&rsquo;s Footle &rarr;
                </a>
                <p className="sr-nextp">
                  One puzzle, six guesses. Everyone gets the same player today.
                </p>
              </div>

              <div className="sr-keep">
                <div className="sr-keept">Or take it with you</div>
                <p className="sr-keepp">
                  The full test scores you 60 to 160 and remembers it. Your streak, your clubs,
                  your card — and friends to race online, up to eight of you.
                </p>
                <p className="sr-keepp">
                  The app is also the only version that can nudge you when tomorrow&rsquo;s
                  puzzle drops.
                </p>
                {/* Critique #3: on a phone, show only the store this phone
                    can use — the other badge is pure choice friction. Desktop
                    keeps the pair. And the browser path gets a real control:
                    it is the proven converter for cold traffic, and an inline
                    text link was the weakest tap target on the screen. */}
                <div className="sr-links">
                  {!IS_ANDROID && <a className="sr-a" href={appStoreUrl()} onClick={() => marketingEvent('sr-verdict-store', { store: 'ios' })}><AppleMark />App Store</a>}
                  {!IS_IOS && <a className="sr-a" href={PLAY_STORE_URL} onClick={() => marketingEvent('sr-verdict-store', { store: 'android' })}><PlayMark />Google Play</a>}
                </div>
                <a className="sr-a sr-webbtn" href={PLAY} onClick={() => marketingEvent('sr-verdict-play')}>Keep going in the browser — free</a>
              </div>
            </div>
          )}
        </main>
      </div>

      <FootleBand />

      <section className="sr-clubs" aria-labelledby="srClubsT">
        <div className="sr-w">
          <h2 className="sr-h2" id="srClubsT">{CLUB_HEADING}</h2>
          <p className="sr-clsub">
            Hajduk Split get the same treatment as Real Madrid. Every question in both files went
            through the same checks before it was let in, and most of them tell you why the answer
            is the answer.
          </p>
          <div className="sr-idx">
            {featured.map((r) => (
              <a key={r.s} className="sr-row" href={'/quiz/' + r.s + '/'}>
                <span className="sr-cn">{r.n}</span>
                <span className="sr-ld" aria-hidden="true" />
                <span className="sr-cc">{r.c}</span>
              </a>
            ))}
          </div>
          <details className="sr-allclubs">
            <summary>Show every club on file</summary>
            <div className="sr-idx">
              {rest.map((r) => (
                <a key={r.s} className="sr-row" href={'/quiz/' + r.s + '/'}>
                  <span className="sr-cn">{r.n}</span>
                  <span className="sr-ld" aria-hidden="true" />
                  <span className="sr-cc">{r.c}</span>
                </a>
              ))}
            </div>
          </details>
        </div>
      </section>

      <section className="sr-faq" aria-labelledby="srFaqT">
        <div className="sr-w">
          <h2 className="sr-h2" id="srFaqT">Common questions</h2>
          <div style={{ marginTop: 'var(--sp2)' }}>
            {FAQS.map((f, k) => (
              <details key={k}>
                <summary>{f.q}</summary>
                <p className="sr-fa">{f.a}</p>
              </details>
            ))}
          </div>
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQS.map((f) => ({
              '@type': 'Question', name: f.q,
              acceptedAnswer: { '@type': 'Answer', text: f.a },
            })),
          }) }} />
        </div>
      </section>

      <footer className="sr-foot">
        <p>Ball IQ — an independent football quiz. Made by one person.</p>
        <p className="sr-footwhy">Streaks, live 1v1 and the daily nudge live in the app.</p>
        <div className="sr-dist">
          <a className="sr-badge" href={appStoreUrl()}><AppleMark />App Store</a>
          <a className="sr-badge" href={PLAY_STORE_URL}><PlayMark />Google Play</a>
        </div>
        <div className="sr-legal">
          <a href="/about/">About</a>
          <a href="/contact/">Contact</a>
          <a href="/terms/">Terms</a>
        </div>
      </footer>
    </div>
  );
}
