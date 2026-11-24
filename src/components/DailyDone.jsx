import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Flame, ShieldCheck, Bell, Share, Check, ChevronDown, ChevronRight, ClipboardList, Route, UserRoundSearch, ListOrdered, Swords, Users, Send } from "lucide-react";
import { msToNextLocalMidnight } from "../lib/date.js";
import { MODE_ACCENT, MODE_RGB } from "../lib/accents.js";
import { recordDailyResult, fetchDistribution, summariseDistribution, MIN_N, SCORE_GAMES } from "../lib/dailyResults.js";
import { GAME_CODES, challengeToken, readChallenge, compareScores, scoreLabel, replyName } from "../lib/gameChallenge.js";
import { MateNameAsk } from "./MateNameAsk.jsx";
// Mates' leagues (phase 2: web and the app). The results lib is loaded on
// demand: a static import here put it in the chunk Home loads eagerly (+4 KB
// measured against scripts/audit-home-budget.mjs).
const LEAGUE_GAMES = ["footle", "daily7", "trail", "top10"];
// Set by lib/leagues.js on this device once the player is in a league. Read
// here so the finish panel can offer a league to everyone who is not.

// Results in a day before the panel shows headcounts instead of shares.
const SHOW_COUNTS_FROM = 300;
import { reminderHourLabel } from "../lib/playHour.js";
import { levelName, countdownText } from "../i18n/names.js";
import { useT, useLang, isLangLoaded, fmtLocale, fmtFixed } from "../i18n/index.js";
import "../i18n/en.js"; // the full English table: not on Home's eager path
import { rich } from "../i18n/rich.jsx";
import { ResultCard } from "./ResultCard.jsx";
import { ShareSheet } from "./ShareSheet.jsx";
import "./dailyDone.css";

// DailyDone — ONE return-loop panel under every decided daily (Footle, Daily 7,
// Transfer Trail, Mystery Player), in the app and on the static islands.
//
// Before this (2026-09-06) each game had its own finish: four share buttons in
// four styles, a countdown on two of them, the streak on one, the reminder ask
// as a bottom sheet seven seconds after Daily 7 only, and no "how did everyone
// do" anywhere since the fake percentile was removed. The day-1→2 leak is
// decided at this moment, so it is built once and built properly:
//
//   streak line → countdown + Remind me → SHARE (the one primary) →
//   how everyone did (real, n ≥ 20 only) → still open today → save (guest) →
//   get the app (web islands only)
//
// What stays in the host: the answer reveal, XP, the report button, Back.
//
// props
//   game        'footle' | 'daily7' | 'trail' | 'mystery'
//   edition     puzzle number (Daily 7: the day index)
//   won         boolean (Daily 7: true)
//   bucket      guesses / clubs when won, 0 when not; Daily 7: the score
//   isArchive   an old puzzle — never recorded, never counts toward tomorrow
//   streak      { count, label, keepsOnLoss? } — the app passes its one streak; islands the game's.
//               keepsOnLoss: the host's streak ticks on any finish, so a loss keeps it ("Streak safe")
//   onShare     async () => void   (host builds the text / card)
//   challengeGrid  the result as coloured squares, one row per line (Footle); goes in the "Send it to a mate" message
//   remind      { state: 'off'|'on'|'blocked'|'unsupported', onRemind } | undefined
//   nextUp      [{ key, name, onTap? , href?, open? }] — today's other unplayed dailies (open: started, so the button says Continue)
//   save        { onSave, line? } | null — guest; shows at a 2+ streak or when `line` names what is on this phone
//   stitch      () => void | null — "Stitch up a mate" under Share (Trail, web only)
//   GetAppCTA   component | null (islands pass the store badges)
//   track       (name, meta) => void — optional analytics
//   bucketMax   the most guesses / clubs this puzzle allows (Trail: the career's length), so
//               "how everyone did" knows its row count before the numbers arrive
//   promoted    { game, name, Icon } | null — a level this finish earned. One quiet line
//               under the streak, shown only when `game` matches: a daily finish never gets
//               the full-screen level-up overlay (return research, 16 Oct 2026).
//   card        what the result card says (components/ResultCard.jsx); with `picture`, the
//               game's own picture for the card
//   layout      "one": the finish as ONE object (24 Nov 2026, Footle first). The card carries
//               the picture and the Share button; under it sit one caption line and the other
//               dailies as one filled list. Needs `card`. Every other host leaves it out and
//               keeps the panel it has. The branch is just above the classic return.
// Default glyph per daily for the "still open today" rows, so a host that passes
// only names + links (the static islands) still draws a well with something in
// it — an empty tinted square read as a bug on the first web play-through.
const DEFAULT_ICON = {
  footle: <span className="fh-tile fh-tile-green" style={{ "--fh-tile": "22px", borderRadius: 6 }} aria-hidden="true">F</span>,
  daily7: <ClipboardList size={18} strokeWidth={2.2} />,
  trail: <Route size={18} strokeWidth={2.2} />,
  mystery: <UserRoundSearch size={18} strokeWidth={2.2} />,
  top10: <ListOrdered size={18} strokeWidth={2.2} />,
};

// What each daily costs, said on the Next up card: "3 min" answers the
// question that stops a second game (daily design pass, 16 Oct 2026).
// The lines themselves are the dd.hook.* keys in i18n/en.js.
const HOOK = { footle: 1, daily7: 1, trail: 1, top10: 1, mystery: 1 };
const modeOf = (k) => (k === "daily" ? "daily7" : k);

// One "the panel was seen" event per result, claimed synchronously.
//
// Every other event in this file is a TAP, which leaves the denominator
// missing: we can count who pressed "Remind me" but not how many were offered
// it, so "the reminder converts badly" has been unfalsifiable. Push reach sits
// at a fraction of accounts and nobody can say whether the ask is unseen, seen
// and refused, or granted and then revoked at the OS.
//
// The claim is not optional. TWO of these panels mount per result (mobile and
// the desktop card), and the result write next door had to be given exactly
// this guard after both of them fired it — a naive mount event here would
// double every denominator it produces and quietly halve the conversion rate
// it exists to measure.
const shownClaims = new Set();
// The labelled reminder button: on how many different days it has been offered
// on this phone, so it can step back after a few. "n:day", day = local days
// since 1970. Device-level on purpose: it describes what this phone has shown.
export const REMIND_ASK_DAYS = 5;
const OFFER_KEY = "biq_remind_offer";
const offerClaims = new Set();
const localDay = () => { const d = new Date(); return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000); };
export function readOfferDays(storage) {
  try {
    // Resolved in here, not as a default: touching localStorage can itself throw.
    const [n, day] = String((storage || globalThis.localStorage).getItem(OFFER_KEY) || "").split(":").map((x) => parseInt(x, 10));
    return { n: Number.isFinite(n) && n > 0 ? n : 0, day: Number.isFinite(day) ? day : -1 };
  } catch { return { n: 0, day: -1 }; }
}
// One count a day, however many dailies are finished that day.
export function noteOfferDay(seen, storage, today = localDay()) {
  if (seen.day === today) return seen;
  const next = { n: seen.n + 1, day: today };
  try { (storage || globalThis.localStorage).setItem(OFFER_KEY, `${next.n}:${next.day}`); } catch { /* private mode: it is offered again, which is fine */ }
  return next;
}
// Words for the first five days it is offered, the whole of the fifth day
// included: the count is written the moment the button first shows, so "five
// reached today" still means today.
export function asksInWords(seen, today = localDay()) {
  return seen.n < REMIND_ASK_DAYS || (seen.n === REMIND_ASK_DAYS && seen.day === today);
}
// The labelled button was shown: count the day, and say so once per result.
// Keyed like dd-shown (game and edition), so an app left open overnight still
// counts tomorrow's offer.
export function noteOfferShown({ seen, game, edition, track, storage, today = localDay() }) {
  noteOfferDay(seen, storage, today);
  const claim = `${game}:${edition}`;
  if (offerClaims.has(claim)) return false;
  offerClaims.add(claim);
  // Counted by name, with nothing attached: phones send the event name only,
  // so "offered in words" has to be its own event to be readable against
  // dd-remind (the tap).
  track?.("dd-remind-offer");
  return true;
}
// "Make it a league?" was seen: once per result, the same double-mount guard.
const leagueOfferClaims = new Set();
// The way back for a challenge (lib/challengeReplies.js). Loaded with import(),
// never statically: a static lib import in this file has landed in Home's
// eager chunk before (see leagueResults.js above). The panel asks for it as it
// mounts, so it is here long before anyone can tap Send; a tap that somehow
// beats it sends the link without an id, which is the link as it always was.
let repliesLib = null;
const loadRepliesLib = () => import("../lib/challengeReplies.js").then((m) => { repliesLib = m; return m; }).catch(() => null);
let challengeBusy = false;

// Opens the league create sheet. Inside the app, App.jsx registers the opener;
// on the static islands there is none, so the link carries the head-to-head
// into the app's boot (/play?leaguenew=…), which opens the same sheet.
function openLeagueCreate(opts) {
  try {
    if (typeof window !== "undefined" && typeof window.__biqOpenLeague === "function") { window.__biqOpenLeague(opts); return; }
    const q = new URLSearchParams({ leaguenew: `h2h_${opts.h2hGame}` });
    if (opts.vs) q.set("vs", opts.vs);
    if (opts.h2h) q.set("h2h", [opts.h2h.game, opts.h2h.edition, opts.h2h.mine, opts.h2h.theirs].join("."));
    window.location.assign(`/play?${q.toString()}`);
  } catch { /* nothing to do */ }
}

/**
 * What the result card says: the verdict beside the score and the line under
 * it. `today` is summariseDistribution()'s answer for today's edition, or null
 * while there is no crowd to speak of; `card` carries the host's own words.
 *
 * A HEADLINE MUST NOT RUB IT IN. In the bottom half the comparison is "Better
 * than 18%", which was fine as a quiet aside on the crowd's row and is unkind
 * at 20px beside a 1. There the card keeps the host's verdict ("A tough set
 * today.") and puts the average under it.
 *
 * A zero-point-something share also lands here ("Better than 0%").
 *
 * A host that sets `pinSub` keeps its own line under the verdict whatever the
 * crowd says (Footle: the answer's name matters more than a headcount).
 *
 * Headcounts only from SHOW_COUNTS_FROM results, as everywhere on the panel:
 * below that the card speaks in shares and averages.
 */
export function cardWords(today, card, t, isArchive = false) {
  if (!today) return { verdict: card.verdict, sub: card.sub ?? null };
  const rub = today.outOf != null && today.beatPct < 50 && today.line === t("dd.cmp.better", { p: today.beatPct });
  const line = today.line && !rub ? today.line : null;
  const n = today.n >= SHOW_COUNTS_FROM ? today.n.toLocaleString(fmtLocale()) : null;
  const avg = today.avg != null ? fmtFixed(today.avg, 1) : null;
  // An old day from the archive was not played "today".
  const sub = card.pinSub ? (card.sub ?? null)
    : n ? (line || !avg ? t(isArchive ? "dd.played" : "rc.played", { n }) : t("rc.avgPlayed", { avg, n })) : avg ? t("rc.avg", { avg }) : (card.sub ?? null);
  return { verdict: line || card.verdict, sub };
}

export function DailyDone({ game, edition, won, bucket, isArchive = false, streak, onShare, challengeGrid = "", remind, nextUp = [], day = null, save, stitch = null, GetAppCTA = null, track, bucketMax = null, promoted = null, card = null, layout = null }) {
  const t = useT();
  const [now, setNow] = useState(() => new Date());
  const [dist, setDist] = useState(null);
  // Too few results yet today: yesterday's edition stands in, labelled and
  // grey, so the block never vanishes (16 Oct 2026: it was missing on all four
  // finish screens one morning) and nothing is invented.
  const [prev, setPrev] = useState(null);
  // False until both reads (today, and yesterday when today is thin) settle.
  // Until then "how everyone did" holds its place as an empty frame of the
  // same height, so nothing under it moves when the numbers land.
  const [distReady, setDistReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [shared, setShared] = useState(false);

  // THE REMINDER IS ASKED FOR IN WORDS AGAIN (21 Nov 2026).
  // The ask shrank twice: a sheet until 6 Sep, a line of text until 10 Nov, then
  // a grey bell with no label. Taps on it per finished daily fell with each
  // step: about 2 in 100 in mid-September, 1 in 1,263 in the week of 16 Nov,
  // and no phone at all said yes to notifications that week. For a daily game
  // the reminder is the way back in, so for a player's first few days of
  // finishes it is a labelled button under the streak it protects. After that
  // it steps back to the bell: someone who has seen the offer on five different
  // days and passed has answered, and the panel goes quiet for them again.
  const [offerDays] = useState(() => readOfferDays());
  const canRemind = !!remind && remind.state === "off" && !isArchive;
  const askInWords = canRemind && asksInWords(offerDays);
  useEffect(() => {
    if (askInWords) noteOfferShown({ seen: offerDays, game, edition, track });
  }, [askInWords, offerDays, game, edition, track]);

  // CAREFUL — 30s, NOT 1s. `now` feeds exactly one thing — `ko`, via formatCountdown,
  // which has MINUTE granularity ("2h 46m") and never prints seconds. At 1s
  // this re-rendered the whole panel — streak row, every still-open row, share,
  // the distribution bars, the save row — sixty times a minute to produce the
  // same string fifty-nine of them. This is the panel that sits under every
  // finished daily, so it was the app's most-visited idle screen doing the most
  // pointless work. Reported on device 2026-09-09: "it is a bit laggy."
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  // Fires once per (game, edition) per page life, carrying the state of the
  // ask so the funnel can separate "never offered" from "offered and declined".
  useEffect(() => {
    if (!track || !game) return;
    const key = `${game}:${edition ?? "?"}`;
    if (shownClaims.has(key)) return;
    shownClaims.add(key);
    track("dd-shown", {
      game,
      // 'none' means the host passed no remind prop at all — a surface where
      // the ask cannot appear, which is itself worth being able to count.
      remind: remind?.state || "none",
      // NOTE — THE SAME REASONING AS `remind`, NEVER APPLIED TO THE OTHER TWO
      // ROWS. (No emoji in this file: the panel is drawn, not decorated, and a
      // test enforces it across the whole source, comments included.)
      // dd-save has not fired ONCE in 208 panel views, and nothing recorded
      // whether the save row was ever RENDERED — so a lever that never shows
      // and a lever nobody wants produce an identical zero. That row is the
      // reach ask shipped 2026-09-09, and it only renders for guests with a
      // streak, which may be almost nobody. Counting it is the difference
      // between "declined" and "never offered", which is the whole point of
      // the line above. Computed from the props, not from `streakN`, which is
      // declared below this effect.
      save: (save && save.onSave && ((streak?.count || 0) >= 2 || save.line)) ? 1 : 0,
    });
  }, [game, edition, remind?.state, isArchive, track, save, streak?.count]);

  // Record once (the lib dedupes per visitor per edition), then read the room.
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!isArchive) {
        // Mates' leagues: the same result, to the league table. NOT awaited.
        // Both panels' callbacks run one after the other once the module is
        // in, and the lib takes its claim synchronously, before its first
        // await, so the second finds it taken (leagueResults.js). Archive
        // plays never go.
        if (LEAGUE_GAMES.includes(game)) {
          import("../lib/leagueResults.js").then((m) => m.recordLeagueResult({ game, edition, bucket, won })).catch(() => {});
        }
        // Both the record and the play-hour note live behind one synchronous
        // claim in the lib — two of these panels mount per result (mobile +
        // desktop) and used to fire both, twice.
        await recordDailyResult({ game, edition, bucket, won });
      }
      const d = await fetchDistribution({ game, edition });
      let y = null;
      if ((!d || d.n < MIN_N) && edition > 1) {
        y = await fetchDistribution({ game, edition: edition - 1 });
      }
      // One render with everything, not two: today's thin numbers and then
      // yesterday's would otherwise swap the block's content in two steps.
      if (alive) { setDist(d); setPrev(y && y.n >= MIN_N ? y : null); setDistReady(true); }
    })().catch(() => { if (alive) setDistReady(true); });
    return () => { alive = false; };
  }, [game, edition, bucket, won, isArchive]);

  // ── CHALLENGE A MATE (16 Oct 2026) ── Footle, Trail and Top 10 share a link
  // to the same puzzle; a friend who arrives on one sees the head-to-head here.
  const canChallenge = !!GAME_CODES[game] && !isArchive && Number.isInteger(edition);
  const myScore = game === "top10" ? (bucket || 0) : (won ? bucket || 0 : 0);
  const rival = useMemo(() => (canChallenge ? readChallenge(game, edition) : null), [canChallenge, game, edition]);
  const [challengeState, setChallengeState] = useState("");
  // This device was sent the puzzle and has now finished it: tell the sender
  // (their Home shows "… played your Footle"). Once per link; never for a
  // practice replay, and the library refuses a link this device sent itself.
  useEffect(() => {
    if (!canChallenge) return;
    loadRepliesLib().then((m) => {
      if (!m || !rival?.rid) return;
      // The name this player goes by: one typed for a mate before, else the
      // account's. The library drops it in an installed app (see there), and
      // only the ask itself (MateNameAsk) ever sends a name as "typed here".
      const who = replyName() || (() => { try { return day?.who?.() || ""; } catch { return ""; } })();
      m.recordChallengeReply({ rid: rival.rid, game, edition, score: myScore, name: who });
    });
  }, [canChallenge, rival, game, edition, myScore, day]);
  // LAST of the state hooks on purpose: the render tests address the others by their order.
  const [distOpen, setDistOpen] = useState(false);
  // After it, for the same reason: the share sheet of the "one" layout.
  const [sheetOpen, setSheetOpen] = useState(false);
  // The league offer. With a head-to-head on the panel it is "Make it a
  // league?"; otherwise, for a player who is not in one, "Start a league with
  // your mates" (29 Oct 2026: in 13 days on the web nobody made a league, and
  // the only offer sat behind a challenge link almost nobody had). Live
  // league games only; a member sees the table on Home instead.
  const leagueGame = LEAGUE_GAMES.includes(game) && !isArchive;
  // 12 Nov 2026: with no head-to-head the offer is gone from this panel. Shown
  // 296 times to 80 people in two weeks, tapped by nobody outside our own
  // testing: a stranger does not name a league before they have a rival. The
  // one button is "Send it to a mate" now; "Make it a league?" stays for the
  // moment a rival exists. Home keeps its Mates' league row.
  const leagueOffer = leagueGame && !!rival;
  useEffect(() => {
    if (!leagueOffer) return;
    const key = `${game}:${edition}`;
    if (leagueOfferClaims.has(key)) return;
    leagueOfferClaims.add(key);
    track?.("league-offer-shown", { game, h2h: !!rival });
  }, [leagueOffer, game, edition, rival, track]);
  const makeLeague = () => {
    track?.("league-make-tap", { game, h2h: !!rival });
    if (rival) openLeagueCreate({ h2hGame: game, vs: rival.name || "", from: "h2h", h2h: { game, edition, mine: myScore, theirs: rival.score ?? 0 } });
    else openLeagueCreate({ h2hGame: game, vs: "", from: "finish", h2h: null });
  };
  const sendChallenge = async () => {
    // The name on the link: the account's, else the one typed for a mate.
    const who = (() => { try { return day?.who?.() || ""; } catch { return ""; } })() || replyName();
    const token = challengeToken(game, edition, myScore, who);
    if (!token) return;
    // The way back (lib/challengeReplies.js): an id on the link, so this
    // device can be told when the mate has played. One id per puzzle.
    const rid = repliesLib ? repliesLib.replyIdFor(game, edition, myScore) : null;
    const url = `https://balliq.app/c/${token}${rid ? `?r=${rid}` : ""}`;
    const what = { footle: "Footle", trail: "Transfer Trail", top10: "Top 10" }[game];
    // In the sharer's language (i18n step 5). English is the same line as before:
    // scoreLabel's English words are the gc.* keys' English.
    // THE GRID GOES WITH IT (15 Nov 2026). "Send it to a mate" became the one
    // button, and what it put in the chat was a bare line of text: the coloured
    // grid, the thing people actually recognise and tap, only went with the
    // quiet "Just share my result". A host that has a grid (Footle) passes it,
    // and it sits under the line. It shows colours only, never letters.
    const line = t("share.challenge", { what, edition, score: scoreLabel(game, myScore, t) });
    const text = challengeGrid ? `${line}\n\n${challengeGrid}\n` : line;
    track?.("dd-challenge", { game, rival: !!rival });
    try {
      if (navigator.share) { await navigator.share({ text, url }); setChallengeState("sent"); return; }
      await navigator.clipboard.writeText(challengeGrid ? `${text}\n${url}` : `${text} ${url}`); setChallengeState("copied");
    } catch (e) {
      if (e && (e.name === "AbortError" || /cancel/i.test(e?.message || ""))) return;
      try { await navigator.clipboard.writeText(challengeGrid ? `${text}\n${url}` : `${text} ${url}`); setChallengeState("copied"); } catch { /* nothing to do */ }
    }
  };
  const doChallenge = async () => {
    // One share sheet at a time: a second tap while it is open made
    // navigator.share throw, and the fallback then said "Link copied".
    if (challengeBusy) return;
    challengeBusy = true;
    try { await sendChallenge(); } finally { challengeBusy = false; }
  };

  // `lang`: the summary carries a sentence (comparisonLine) in the active language.
  const lang = useLang();
  const langReady = isLangLoaded(lang);
  const today = useMemo(() => summariseDistribution(dist, { game, mine: bucket, won }), [dist, game, bucket, won, lang, langReady]);
  const yesterday = useMemo(() => (today ? null : summariseDistribution(prev, { game, mine: bucket, won })), [today, prev, game, bucket, won]);
  const summary = today || yesterday;
  const shown = today ? dist : prev;
  // Daily 7 has no public number (its edition is a day index).
  const yLabel = game === "daily7" ? t("dd.yday") : t("dd.ydayNo", { n: edition - 1 });
  const showCounts = !!summary && summary.n >= SHOW_COUNTS_FROM;
  const barValue = (r) => (showCounts ? r.c : `${summary.n ? Math.round((r.c / summary.n) * 100) : 0}%`);
  const ko = countdownText(msToNextLocalMidnight(now));
  const streakN = streak?.count || 0;
  const label = streak?.label || t("dd.l.none");
  // A lost puzzle keeps the streak only where the host says its streak counts
  // any finish (the app's daily streak ticks on a loss, App.jsx onDailyDone).
  // The islands' per-game streaks break on a loss, so they never say it.
  const streakSafe = !isArchive && won === false && !!streak?.keepsOnLoss && streakN >= 2;

  // The rows are known before the numbers are (the frame drawn while they
  // load has exactly as many as the block will), except where the host gives
  // no bucketMax for a guess-count game: then the data can add rows.
  const bars = useMemo(() => {
    const loading = !distReady;
    if (!summary && !loading) return [];
    const b = (summary && shown?.buckets) || {};
    const outOf = SCORE_GAMES[game];
    const keys = outOf != null
      ? Array.from({ length: outOf + 1 }, (_, i) => i)
      : game === "footle" ? [1, 2, 3, 4, 5, 6, 0]
      : (() => { const ks = Object.keys(b).map(Number).filter((k) => k > 0); const max = Number.isInteger(bucketMax) && bucketMax > 0 ? Math.max(bucketMax, ...ks) : Math.max(4, ...ks, won ? bucket : 0); return [...Array.from({ length: Math.min(max, 10) }, (_, i) => i + 1), 0]; })();
    const top = Math.max(1, ...keys.map((k) => b[k] || 0));
    return keys.map((k) => ({ k, label: k === 0 && outOf == null ? "X" : String(k), c: b[k] || 0, pct: loading ? 0 : Math.round(((b[k] || 0) / top) * 100), mine: !loading && !yesterday && (outOf != null ? k === bucket : (won ? k === bucket : k === 0)) }));
  }, [distReady, summary, shown, yesterday, game, bucket, won, bucketMax]);

  const doShare = async () => {
    if (busy) return;
    setBusy(true); track?.("dd-share", { game });
    // A dismissed sheet resolves false: no "Shared" tick for a share that never happened.
    try { const ok = await onShare?.(); if (ok !== false) { setShared(true); setTimeout(() => setShared(false), 2200); } }
    finally { setBusy(false); }
  };
  const doRemind = async () => {
    if (busy || !remind?.onRemind) return;
    setBusy(true); track?.("dd-remind", { game });
    try { await remind.onRemind(); } finally { setBusy(false); }
  };
  // The share sheet ("one" layout) steps aside once one of its two rows has
  // done its work: the row says so ("Challenge sent", "Link copied", "Shared")
  // for a moment, then the result is back. A dismissed share sets nothing, so
  // the sheet stays for the other row.
  useEffect(() => {
    if (!sheetOpen || !(shared || challengeState)) return undefined;
    const id = setTimeout(() => setSheetOpen(false), 1200);
    return () => clearTimeout(id);
  }, [sheetOpen, shared, challengeState]);

  // Four groups, top to bottom: your result, one share action, what to play
  // next, a quiet footer. They arrive one after another (--i staggers them).
  let gi = 0;
  const g = () => ({ className: "dd-g", style: { "--i": gi++ } });
  // THE RESULT CARD (22 Nov 2026, components/ResultCard.jsx). The host hands
  // over what only it knows (the game's name, its day, the score, the seven
  // marks, a verdict for when there is no crowd yet); the standing against
  // everyone else is this panel's, because it holds the day's distribution.
  // Only today's numbers go on the card: yesterday's are about another set.
  const saveShown = !!(save && save.onSave && (streakN >= 2 || save.line));
  const words = card ? cardWords(today, card, t, isArchive) : null;

  // ── THE FINISH AS ONE OBJECT (24 Nov 2026, Footle first) ─────────────────────
  // Alex on the Footle finish: "thrown together … a divorced couple". The
  // result was on screen twice (the board, then a green card), and under it sat
  // a framed panel with a solid button, a note, a link, a framed "Next up" card
  // and two chips. He steered eight drawn rounds to this:
  //
  //   the card      carries the game's own picture and ONE quiet Share button.
  //                 The button opens a sheet with today's two actions, unchanged
  //                 (doChallenge, doShare), each named and explained.
  //   one caption   "Today 1 of 4" on the left; the flame, the streak and the
  //                 XP this finish earned on the right.
  //   one list      the other dailies as one filled block with no outline: the
  //                 first ends in a small green Play, the rest in a chevron.
  //   quiet lines   when the next puzzles come (with the reminder), the app
  //                 badge on the web, and the save line for a guest.
  //
  // His rules that bind here: one loud thing a screen, and it is the card
  // (nothing lime and large under it); filled, never outlined; no frame inside
  // a frame. Everything the classic panel below does has a place here; a state
  // the drawing did not cover was given the quietest place that keeps it
  // working. A host that does not ask for this layout never reaches it.
  if (layout === "one" && card) {
    const scoreTxt = card.score != null ? `${card.score}/${card.outOf}` : null;
    const openSheet = () => { setChallengeState(""); setSheetOpen(true); };
    // With no puzzle link to send (an old puzzle from the archive) there is
    // one thing to do, so the button does it: no sheet with a single row.
    const action = (
      <button type="button" className="rc-act" onClick={canChallenge ? openSheet : doShare} disabled={!canChallenge && busy} aria-haspopup={canChallenge ? "dialog" : undefined} aria-expanded={canChallenge ? sheetOpen : undefined}>
        {!canChallenge && shared
          ? <><Check size={18} strokeWidth={2.6} aria-hidden="true" />{t("dd.shared")}</>
          : <><Share size={18} strokeWidth={2.4} aria-hidden="true" />{scoreTxt ? t("dd.shareMy", { score: scoreTxt }) : t("dd.shareMine")}</>}
      </button>
    );
    const sheet = sheetOpen ? (
      <ShareSheet
        title={t("dd.sheetTitle")} closeLabel={t("dd.sheetClose")} onClose={() => setSheetOpen(false)}
        rows={[
          // With a mate's challenge waiting, sending the puzzle IS the answer to it: today's wording.
          { key: "mate", Icon: challengeState ? Check : Send, onClick: doChallenge,
            title: t(challengeState === "copied" ? "dd.linkCopied" : challengeState === "sent" ? "dd.sent" : rival ? "dd.sendBack" : "dd.sendMate"),
            note: t(rival ? "dd.sendBackNote" : "dd.sendMateNote") },
          { key: "mine", Icon: shared ? Check : Share, onClick: doShare, disabled: busy,
            title: t(shared ? "dd.shared" : "dd.shareOnly"), note: t("dd.shareOnlyNote") },
        ]}
      />
    ) : null;
    // Outside the card and the groups: both are animated, and an animated
    // ancestor would become the box a fixed sheet is laid out in.
    const sheetEl = sheet && typeof document !== "undefined" && document.body ? createPortal(sheet, document.body) : sheet;

    const others = isArchive ? [] : nextUp.filter((n) => modeOf(n.key) !== modeOf(game));
    const go = (n) => { track?.("dd-next", { game, to: n.key }); n.onTap?.(); };
    const lostHere = won === false && SCORE_GAMES[game] == null;
    const keys = day?.keys || [];
    const isDone = (k) => modeOf(k) === modeOf(game) || !nextUp.some((n) => modeOf(n.key) === modeOf(k));
    const doneN = keys.filter(isDone).length;
    const sweep = !isArchive && !others.length && keys.length > 0 && doneN >= keys.length;

    // The caption. The streak is said short here ("Day 5 streak"); which streak
    // it is (the daily one, or a game's own) is its title, in the classic
    // panel's own words.
    const streakFull = streakN >= 2 ? t("dd.streakN", { n: streakN, label }) : t("dd.streak1", { label });
    const dayEl = !isArchive && keys.length > 1
      ? <span className="dd-cap-day"><b>{t("dd.capToday")}</b>{" "}{t("dd.nOf", { n: doneN, total: keys.length })}</span> : null;
    const streakEl = streakN >= 1 ? (
      <span className="dd-cap-st" title={streakFull}>
        {streakSafe ? <ShieldCheck size={16} strokeWidth={2.2} aria-hidden="true" /> : <Flame size={16} strokeWidth={2.2} aria-hidden="true" />}
        {t("dd.capStreak", { n: streakN })}
        {!isArchive && streak?.shields > 0 && (
          <span className="dd-shields" role="img" aria-label={t("dd.shieldsAria", { count: streak.shields })} title={t("dd.shieldTitle")}>
            {Array.from({ length: streak.shields }, (_, i) => <ShieldCheck key={i} size={13} strokeWidth={2.4} aria-hidden="true" />)}
          </span>
        )}
      </span>
    ) : null;
    // An old puzzle pays no XP (the host only announces a live finish), so the caption claims none.
    const xpEl = !isArchive && card.xp > 0 ? <span className="dd-cap-xp">{rich(t("rs.xp"), { n: card.xp })}</span> : null;

    const row = (n, i) => {
      const T = n.href ? "a" : "button";
      const m = modeOf(n.key);
      return (
        <T key={n.key} className="dd-li" style={{ "--dd-rgb": MODE_RGB[m] || "88,204,2", "--dd-c": MODE_ACCENT[m] || "var(--accent)" }} href={n.href} onClick={() => go(n)} {...(n.href ? {} : { type: "button" })}>
          <span className="dd-li-ic" aria-hidden="true">{n.icon || DEFAULT_ICON[m] || null}</span>
          <span className="dd-li-t">
            <span className="dd-li-n">{i === 0 ? n.name : (n.short ?? n.name.replace(/^Today's /, ""))}</span>
            {/* Each part between the dots is its own piece and the dot is drawn BEFORE a piece, in a gutter the row clips at the start of a line: wherever the line breaks, no dot is left hanging at its end (dailyDone.css, .dd-segs). */}
            <span className="dd-li-h has-segs"><span className="dd-segs">{[i === 0 && lostHere ? t("dd.winBack") : "", HOOK[m] ? t(`dd.hook.${m}`) : ""].join(" · ").split("·").map((s) => s.trim()).filter(Boolean).map((s, k) => <span className="dd-seg" key={k}>{s}</span>)}</span></span>
          </span>
          {i === 0
            ? <span className="dd-li-go">{t(n.open ? "home.row.continue" : "common.play")}</span>
            : <span className="dd-li-chev" aria-hidden="true"><ChevronRight size={18} strokeWidth={2.4} /></span>}
        </T>
      );
    };

    return (
      <>
      <ResultCard title={card.title} tag={card.tag} score={card.score} scoreNode={card.scoreNode} outOf={card.outOf} marks={card.marks} shares={card.shares} levels={card.levels}
        verdict={words.verdict} sub={words.sub} note={card.note} picture={card.picture} action={action} />
      {sheetEl}
      <section className="dd-one" aria-label={t("dd.aria")}>
        {/* A mate sent this puzzle: who won, the name ask, and the league offer that only a rival earns. */}
        {rival && (() => {
          const r = compareScores(game, myScore, rival.score);
          const name = rival.name || t("dd.yourMate");
          return (
            <div className="dd-g dd-vs" style={{ "--i": gi++ }}>
              <div className={`dd-h2h${r > 0 ? " is-win" : r < 0 ? " is-loss" : ""}`} role="status">
                <span>{rich(t("dd.h2h"), { me: <strong className="dd-num">{scoreLabel(game, myScore, t)}</strong>, name, them: <strong className="dd-num">{scoreLabel(game, rival.score, t)}</strong> })}</span>
                <strong>{t(r > 0 ? "dd.beat" : r < 0 ? "dd.lost" : "dd.level", { name })}</strong>
              </div>
              {rival.rid && !isArchive && (
                <MateNameAsk rival={rival} game={game} edition={edition} score={myScore} />
              )}
              {leagueOffer && (
                <button type="button" className="dd-league is-flat" onClick={makeLeague}>
                  <Users size={15} strokeWidth={2.4} aria-hidden="true" /> {t("dd.league")}
                </button>
              )}
            </div>
          );
        })()}

        <div {...g()}>
          {(dayEl || streakEl || xpEl) && (
            <div className="dd-cap">
              {dayEl}
              {(streakEl || xpEl) && <span className="dd-cap-r">{streakEl}{xpEl}</span>}
            </div>
          )}
          {promoted && promoted.game === game && !isArchive && (
            <div className="dd-promo" role="status">
              {promoted.Icon && <promoted.Icon size={14} strokeWidth={2.4} aria-hidden="true" />}
              <span>{rich(t("dd.promoted"), { name: <strong>{levelName(promoted.name)}</strong> })}</span>
            </div>
          )}
          {others.length > 0 ? (
            <div className="dd-list">{others.map(row)}</div>
          ) : sweep ? (
            <div className="dd-list">
              <div className="dd-li is-sweep">
                <span className="dd-li-t">
                  <span className="dd-li-n">{rich(t("dd.allDone"), { n: keys.length })}</span>
                  <span className="dd-li-h">{t("dd.sweep")}</span>
                </span>
                <span className="dd-day-bar" role="img" aria-label={t("dd.dayAria", { n: doneN, total: keys.length })}>
                  {keys.map((k) => (
                    <i key={k} className={modeOf(k) === modeOf(game) && lostHere ? "is-lost" : "is-done"} style={{ "--dd-c": MODE_ACCENT[modeOf(k)] || "var(--accent)" }} />
                  ))}
                </span>
              </div>
            </div>
          ) : null}
        </div>

        <div {...g()}>
          {/* WHEN THE NEXT ONES COME, as one quiet line: every daily game shows
              it, and it is what tonight's streak hangs on. The reminder rides
              it, as it rode the streak row: a bell, or the hour once set. */}
          <div className="dd-line">
            <span>
              {isArchive ? t("dd.archive")
                : streakSafe ? rich(t("dd.safe"), { safe: <strong>{t("dd.safeWord")}</strong>, ko: <strong className="dd-num">{ko}</strong> })
                : streakN >= 1 ? rich(t("dd.tomorrow"), { n: <strong className="dd-num">{streakN + 1}</strong>, ko: <strong className="dd-num">{ko}</strong> })
                : rich(t("dd.newIn"), { ko: <strong className="dd-num">{ko}</strong> })}
            </span>
            {canRemind && !askInWords && (
              <button type="button" className="dd-bell" disabled={busy} onClick={doRemind} aria-label={t("dd.remindAria", { h: reminderHourLabel() })} title={t("dd.remindTitle")}>
                <Bell size={17} strokeWidth={2.2} aria-hidden="true" />
              </button>
            )}
            {remind && remind.state === "on" && (
              <span className="dd-pill is-set" aria-label={t("dd.remindSet", { h: reminderHourLabel() })}>
                <Bell size={13} strokeWidth={2.4} aria-hidden="true" /> {reminderHourLabel()}
              </span>
            )}
          </div>
          {/* A player's first days: the reminder asked for in words (askInWords, above). */}
          {askInWords && (
            <button type="button" className="dd-remind" disabled={busy} onClick={doRemind} title={t("dd.remindTitle")}>
              <Bell size={16} strokeWidth={2.3} aria-hidden="true" />{t("dd.remindBtn", { h: reminderHourLabel() })}
            </button>
          )}
          {/* Stitch-up (the Trail, web only): a link, as it was. */}
          {stitch && (
            <button type="button" className="dd-share-alt" onClick={() => { track?.("dd-stitch", { game }); stitch(); }}>{t("dd.stitch")}</button>
          )}
          {GetAppCTA && <div className="dd-getapp"><GetAppCTA /></div>}
          {saveShown && (
            <div className="dd-line">
              <span>
                {streakN >= 2
                  ? rich(t("dd.saveStreak"), { days: <strong className="dd-num">{rich(t("dd.saveDays"), { n: streakN })}</strong>, and: null, s: "s" })
                  : rich(t("dd.saveLine"), { line: <strong className="dd-num">{save.line}</strong> })}
              </span>
              <button type="button" className="dd-pill" onClick={() => { track?.("dd-save", { game }); save.onSave(); }}>{t("dd.save")}</button>
            </div>
          )}
        </div>
      </section>
      </>
    );
  }

  // THE DAILY 7'S XP IS ON ITS CARD (24 Nov 2026), in yellow under the verdict,
  // so the streak row under the card does not say the same number a second
  // time. Transfer Trail and Top 10 keep theirs on the streak row.
  const xpOnCard = game === "daily7" && card?.xp > 0;
  const cardEl = card ? (
    <ResultCard title={card.title} tag={card.tag} score={card.score} scoreNode={card.scoreNode} outOf={card.outOf} marks={card.marks} shares={card.shares} levels={card.levels}
      verdict={words.verdict} sub={words.sub} xp={xpOnCard ? card.xp : null} note={card.note} />
  ) : null;
  return (
    <>
    {cardEl}
    <section className="dd" aria-label={t("dd.aria")}>
      <div {...g()}>
      {/* Streak: the stake tonight names. Flame in the amber well the streak pill
          already uses elsewhere in the app. */}
      <div className="dd-row" style={{ "--dd-rgb": "255,170,0", "--dd-c": "var(--gold)" }}>
        <span className="dd-well" aria-hidden="true">{streakSafe ? <ShieldCheck size={20} strokeWidth={2.2} /> : <Flame size={20} strokeWidth={2.2} />}</span>
        <div className="dd-body">
          {/* With the card above, the XP has no score to sit under: it rides the streak's title line
              (unless the card itself carries it: xpOnCard, above). */}
          {(() => {
            const titleEl = (
              <div className="dd-title">
                {streakN >= 2 ? rich(t("dd.streakN"), { n: streakN, label }) : rich(t(streakN === 1 ? "dd.streak1" : "dd.streak0"), { label })}
                {/* Banked shields, named BEFORE one is needed (16 Oct 2026). */}
                {!isArchive && streakN >= 1 && streak?.shields > 0 && (
                  <span className="dd-shields" role="img" aria-label={t("dd.shieldsAria", { count: streak.shields })} title={t("dd.shieldTitle")}>
                    {Array.from({ length: streak.shields }, (_, i) => <ShieldCheck key={i} size={13} strokeWidth={2.4} aria-hidden="true" />)}
                  </span>
                )}
              </div>
            );
            return card?.xp > 0 && !xpOnCard
              ? <div className="dd-trow">{titleEl}<span className="dd-xp dd-num">{rich(t("rs.xp"), { n: card.xp })}</span></div>
              : titleEl;
          })()}
          <div className="dd-sub">
            {isArchive ? t("dd.archive")
              : streakSafe ? rich(t("dd.safe"), { safe: <strong>{t("dd.safeWord")}</strong>, ko: <strong className="dd-num">{ko}</strong> })
              : streakN >= 1 ? rich(t("dd.tomorrow"), { n: <strong className="dd-num">{streakN + 1}</strong>, ko: <strong className="dd-num">{ko}</strong> })
              : rich(t("dd.newIn"), { ko: <strong className="dd-num">{ko}</strong> })}
          </div>
        </div>
        {/* THE REMINDER IS A BELL ON THE STREAK ROW (calm pass, 10 Nov 2026). It
            was a third line under the streak ("Remind me at 19:00"), which made
            the block three lines tall on every finish. The bell keeps it on the
            streak it protects; once set it becomes the hour pill below. */}
        {canRemind && !askInWords && (
          <button type="button" className="dd-bell" disabled={busy} onClick={doRemind} aria-label={t("dd.remindAria", { h: reminderHourLabel() })} title={t("dd.remindTitle")}>
            <Bell size={17} strokeWidth={2.2} aria-hidden="true" />
          </button>
        )}
        {remind && remind.state === "on" && (
          <span className="dd-pill is-set" aria-label={t("dd.remindSet", { h: reminderHourLabel() })}>
            {/* A bell, not a tick: a tick and "19:00" beside the streak said nothing about
                what was set for 19:00 (Alex's recording, 12 Oct 2026). */}
            <Bell size={13} strokeWidth={2.4} aria-hidden="true" /> {reminderHourLabel()}
          </span>
        )}
      </div>
      {askInWords && (
        <button type="button" className="dd-remind" disabled={busy} onClick={doRemind} title={t("dd.remindTitle")}>
          <Bell size={16} strokeWidth={2.3} aria-hidden="true" />{t("dd.remindBtn", { h: reminderHourLabel() })}
        </button>
      )}

      {/* "Promoted to", never "Level up to": the ladder reads Sunday League ->
          Non-League -> Championship, and "Level up! Non-League" read as a
          relegation (design pass, 15 Oct 2026). */}
      {promoted && promoted.game === game && !isArchive && (
        <div className="dd-promo" role="status">
          {promoted.Icon && <promoted.Icon size={14} strokeWidth={2.4} aria-hidden="true" />}
          <span>{rich(t("dd.promoted"), { name: <strong>{levelName(promoted.name)}</strong> })}</span>
        </div>
      )}

      {rival && (() => {
        const r = compareScores(game, myScore, rival.score);
        const name = rival.name || t("dd.yourMate");
        return (
          <>
            <div className={`dd-h2h${r > 0 ? " is-win" : r < 0 ? " is-loss" : ""}`} role="status">
              <span>{rich(t("dd.h2h"), { me: <strong className="dd-num">{scoreLabel(game, myScore, t)}</strong>, name, them: <strong className="dd-num">{scoreLabel(game, rival.score, t)}</strong> })}</span>
              <strong>{t(r > 0 ? "dd.beat" : r < 0 ? "dd.lost" : "dd.level", { name })}</strong>
            </div>
            {/* The sender is told who played: one line, joined to this box. */}
            {rival.rid && !isArchive && (
              <MateNameAsk rival={rival} game={game} edition={edition} score={myScore} />
            )}
          </>
        );
      })()}
      </div>

      <div {...g()}>
      {/* SHARE COMES SECOND, RIGHT UNDER THE STREAK (Alex, 12 Oct 2026, from a
          recording of his own Footle: "the share button was placed below the
          screen, so you had to scroll down to see it"). It sat under the
          reminder and the still-open list, by a decision of 6 Sept that put
          the next daily first. THE PRICE, MEASURED: Share and its link add
          about 81px above the still-open list (the reminder row another 64 on
          native). A Footle solved in four or fewer gives that back in dropped
          rows; on a loss or a five or six guess solve the list's last row
          goes under the fold on a 375x812 phone. Share on screen was the
          instruction; the list is one short scroll. */}
      {/* ONE SOLID BUTTON IN THE WHOLE PANEL (tidy pass, 16 Oct 2026). Alex on
          the first build of this panel: "a lot of competing stuff that all
          screams at me … all happening at once". Share and Next up's Play were
          both solid green, Next up glowed in its mode colour, the chips were
          tinted and "Challenge a mate" was a second full-width button. Now the
          only solid fill is here; everything else is a hairline, a tint or a
          link. With a challenge waiting, answering it IS the share. */}
      {rival ? (
        <button type="button" className="dd-share" onClick={doChallenge} aria-label={t("dd.sendBackAria")}>
          <Swords size={18} strokeWidth={2.4} aria-hidden="true" /> {t(challengeState === "copied" ? "dd.linkCopied" : challengeState === "sent" ? "dd.sent" : rival ? "dd.sendBack" : "dd.challenge")}
        </button>
      ) : canChallenge ? (
        /* ONE THING TO DO (12 Nov 2026, Alex's yes on the before and after).
           Under Share sat a league pill, a WhatsApp link and "Challenge a
           mate": four ways to share at once, and in 30 days 196 people saw the
           panel, 8 shared and nobody outside our own testing tapped the other
           three. The solid button now sends the puzzle itself to a mate (the
           same /c/ link "Challenge a mate" made); the plain result is the one
           quiet link under it. */
        <>
          <button type="button" className="dd-share" onClick={doChallenge}>
            <Swords size={18} strokeWidth={2.4} aria-hidden="true" /> {t(challengeState === "copied" ? "dd.linkCopied" : challengeState === "sent" ? "dd.sent" : "dd.sendMate")}
          </button>
          <p className="dd-share-note">{t("dd.sendMateNote")}</p>
        </>
      ) : (
        <button type="button" className="dd-share" onClick={doShare} disabled={busy} aria-label={t("dd.shareAria")}>
          {shared ? <><Check size={18} strokeWidth={2.6} aria-hidden="true" />{" " + t("dd.shared")}</> : <><Share size={18} strokeWidth={2.4} aria-hidden="true" />{" " + t("dd.shareResult")}</>}
        </button>
      )}
      {(leagueOffer || stitch || canChallenge) && (
        <div className="dd-share-alts">
          {/* The league offer. 7 Nov 2026: as a 12.5px underlined line it was
              shown 178 times to 48 web visitors and tapped by none, so it became
              a full-width pill. 10 Nov: Alex on the panel, "cluttery and busy";
              two full-width bars stacked under each other was part of it. It
              stays a hairline BUTTON (not a link again), but compact and first
              in this row, so Share is the only full-width thing. */}
          {leagueOffer && (
            <button type="button" className="dd-league" onClick={makeLeague}>
              <Users size={15} strokeWidth={2.4} aria-hidden="true" /> {t(rival ? "dd.league" : "dd.leagueShort")}
            </button>
          )}
          {(rival || canChallenge) && (
            <button type="button" className="dd-share-alt" onClick={doShare} disabled={busy}>{t(shared ? "dd.shared" : rival ? "dd.shareResult" : "dd.shareOnly")}</button>
          )}
          {/* Stitch-up (web only; the host passes it on the Trail alone): build
              a Trail of your own for a mate. A link, like the others here. */}
          {stitch && (
            <button type="button" className="dd-share-alt" onClick={() => { track?.("dd-stitch", { game }); stitch(); }}>{t("dd.stitch")}</button>
          )}
        </div>
      )}
      </div>

      {/* NEXT UP (daily design pass, 16 Oct 2026). "Still open today" was a
          title and up to three equal rows, below Share and the app badge.
          Playing a second daily depends on nobody and is the cheapest
          retention the product has, so it is now ONE large card for the next
          daily, with its cost in minutes, the day's progress and the countdown;
          the rest follow as small chips. Web player-days with 2+ dailies were
          44% over 30 days against 76% signed in: this is that gap. */}
      {!isArchive && (() => {
        const others = nextUp.filter((n) => modeOf(n.key) !== modeOf(game));
        const [first, ...rest] = others;
        const go = (n) => { track?.("dd-next", { game, to: n.key }); n.onTap?.(); };
        const lostHere = won === false && SCORE_GAMES[game] == null;
        const keys = day?.keys || [];
        const isDone = (k) => modeOf(k) === modeOf(game) || !nextUp.some((n) => modeOf(n.key) === modeOf(k));
        const doneN = keys.filter(isDone).length;
        const card = (n, cls, inner) => {
          const T = n.href ? "a" : "button";
          const rgb = MODE_RGB[modeOf(n.key)] || "88,204,2";
          const c = MODE_ACCENT[modeOf(n.key)] || "var(--accent)";
          return <T key={n.key} className={cls} style={{ "--dd-rgb": rgb, "--dd-c": c }} href={n.href} onClick={() => go(n)} {...(n.href ? {} : { type: "button" })}>{inner}</T>;
        };
        // The day's progress rides on the card's top line (10 Nov 2026). It was
        // its own row under the card, so a clean sweep read "All 4 done today"
        // and, right under it, "4 of 4 done today".
        const dayBar = keys.length > 1 ? (
          <span className="dd-day-bar" role="img" aria-label={t("dd.dayAria", { n: doneN, total: keys.length })}>
            {keys.map((k) => (
              <i key={k} className={isDone(k) ? (modeOf(k) === modeOf(game) && lostHere ? "is-lost" : "is-done") : ""} style={{ "--dd-c": MODE_ACCENT[modeOf(k)] || "var(--accent)" }} />
            ))}
          </span>
        ) : null;
        return (
          <>
            <div className="dd-hr" aria-hidden="true" />
            <div {...g()}>
            {first ? card(first, "dd-up", (
              <>
                <span className="dd-up-top"><span className="dd-up-k">{t("dd.nextUp")}{keys.length > 1 ? <> · {rich(t("dd.dayDoneShort"), { n: doneN, total: keys.length })}</> : null}</span>{dayBar}</span>
                <span className="dd-up-main">
                  <span className="dd-well" aria-hidden="true">{first.icon || DEFAULT_ICON[modeOf(first.key)] || null}</span>
                  <span className="dd-up-body">
                    <span className="dd-up-name">{first.name}</span>
                    <span className="dd-up-hook">{lostHere ? <><span className="dd-up-seg">{t("dd.winBack").trim()}</span>{" "}</> : ""}{HOOK[modeOf(first.key)] ? <span className="dd-up-seg">{t(`dd.hook.${modeOf(first.key)}`)}</span> : ""}</span>
                  </span>
                  <span className="dd-up-go">{t(first.open ? "home.row.continue" : "common.play")}</span>
                </span>
              </>
            )) : keys.length > 0 && doneN >= keys.length ? (
              <div className="dd-up is-sweep">
                <span className="dd-up-top"><span className="dd-up-k">{t("dd.sweep")}</span>{dayBar}</span>
                <span className="dd-up-name">{rich(t("dd.allDone"), { n: keys.length })}</span>
              </div>
            ) : null}
            {rest.length > 0 && (
              <div className="dd-up-more">
                {rest.map((n) => card(n, "dd-chip", (
                  <><span className="dd-chip-ic" aria-hidden="true">{n.icon || DEFAULT_ICON[modeOf(n.key)] || null}</span>{n.short ?? n.name.replace(/^Today's /, "")}</>
                )))}
              </div>
            )}
            </div>
          </>
        );
      })()}


      {/* With the result card above, the crowd's row is not drawn at all (the
          card carries the standing), so the footer can be empty: then neither
          the hairline nor the group is. */}
      {(!card || GetAppCTA || saveShown) && <>
      <div className="dd-hr" aria-hidden="true" />
      <div {...g()}>
      {/* THE QUIET FOOTER: reminder, the crowd, the app and the save, below a
          hairline. The app badge sat right under Share from 15 Oct (highest
          intent on a phone browser); it keeps its place above the crowd's
          numbers but no longer competes with the two things to do now. */}
      {GetAppCTA && <div className="dd-getapp"><GetAppCTA /></div>}



      {saveShown && (
        <div className="dd-row">
          <div className="dd-body">
            {streakN >= 2
              ? <div className="dd-sub">{rich(t("dd.saveStreak"), {
                  days: <strong className="dd-num">{rich(t("dd.saveDays"), { n: streakN })}</strong>,
                  // The streak alone (11 Nov 2026): with the XP joined on, the
                  // line ran to three. English "lives"; Spanish has no {s}.
                  and: null,
                  s: "s",
                })}</div>
              : <div className="dd-sub">{rich(t("dd.saveLine"), { line: <strong className="dd-num">{save.line}</strong> })}</div>}
          </div>
          <button type="button" className="dd-pill" onClick={() => { track?.("dd-save", { game }); save.onSave(); }}>{t("dd.save")}</button>
        </div>
      )}

      {/* LAST IN THE PANEL (16 Oct 2026): the crowd's numbers are the one
          thing here that arrives late, about a second after the rest. Above
          the save row they pushed it, and Back to Home, 178px down as they
          landed (measured at 375x812). Now the block holds its height while
          loading and sits at the bottom, so a late or missing answer can only
          move what is below the panel. */}
      {/* SHARES, NOT HEADCOUNTS, WHILE THE CROWD IS SMALL (Alex, 2026-10-07).
          "27 played" and a bar reading "13" tell a newcomer how few people are
          here, and a small room is a reason to leave. Below SHOW_COUNTS_FROM
          results the panel speaks only in percentages (which are just as true);
          above it the real numbers come back, because then they are an asset. */}
      {/* ONE LINE, BARS ON A TAP (calm pass, 10 Nov 2026). The block was a
          title, up to eleven bars and a summary on every finish; Alex: "looks
          cluttery and busy". The summary line is the answer most people want
          ("Average 3.0/7"); the bars open under it. The frame while loading is
          the same one line, so nothing moves when the numbers land. */}
      {card ? null : !distReady ? (
        <div className="dd-dist is-loading" aria-busy="true" aria-label={t("dd.distLoading")}>
          <div className="dd-dist-tog" aria-hidden="true"><span className="dd-sub">{"\u00a0"}</span></div>
        </div>
      ) : summary && (
        <div className={`dd-dist${yesterday ? " is-yesterday" : ""}`} aria-label={yesterday ? yLabel : showCounts ? t("dd.distN", { n: summary.n }) : t("dd.dist")}>
          <button type="button" className="dd-dist-tog" aria-expanded={distOpen} onClick={() => { setDistOpen((v) => !v); if (!distOpen) track?.("dd-dist-open", { game }); }}>
            <span className="dd-sub">
              {yesterday
                ? rich(t("dd.earlyToday"), { x: summary.outOf != null
                  ? rich(t("dd.ydayAvg"), { avg: <strong className="dd-num">{fmtFixed(summary.avg, 1)}/{summary.outOf}</strong> })
                  : rich(t("dd.ydaySolved"), { pct: <strong className="dd-num">{summary.solvedPct}%</strong> }) })
                : summary.outOf != null
                  ? rich(t("dd.avg"), { avg: <strong className="dd-num">{fmtFixed(summary.avg, 1)}/{summary.outOf}</strong>, line: summary.line ? <> · <strong>{summary.line}</strong></> : null })
                  : rich(t("dd.solved"), { pct: <strong className="dd-num">{summary.solvedPct}%</strong>, line: summary.line ? <> · <strong>{summary.line}</strong></> : null })}
            </span>
            <span className="dd-dist-more">{t("dd.distShort")}<ChevronDown size={15} strokeWidth={2.4} aria-hidden="true" /></span>
          </button>
          {distOpen && (
            <>
              <div className="dd-dist-head">
                <div className="dd-title">{yesterday ? yLabel : t("dd.dist")}</div>
                {showCounts && !yesterday ? <div className="dd-dist-cap dd-num">{rich(t("dd.played"), { n: summary.n.toLocaleString(fmtLocale()) })}</div>
                  : !yesterday ? <div className="dd-dist-cap">{t("dd.early")}</div> : null}
              </div>
              <div className="dd-bars">
                {bars.map((r) => (
                  <React.Fragment key={r.k}>
                    <span className={`dd-bar-k${r.mine ? " is-mine" : ""}`}>{r.label}</span>
                    <span className={`dd-bar${r.mine ? " is-mine" : ""}`} role="img" aria-label={`${r.label}: ${barValue(r)}`}><i style={{ width: `${r.pct}%` }} /></span>
                    <span className={`dd-bar-v${r.mine ? " is-mine" : ""}`}>{barValue(r)}</span>
                  </React.Fragment>
                ))}
              </div>
            </>
          )}
        </div>
      )}


      </div>
      </>}
    </section>
    </>
  );
}

export { MIN_N };
export default DailyDone;
