import React, { useEffect, useMemo, useState } from "react";
import { Flame, ShieldCheck, Bell, Share, Check, ClipboardList, Route, UserRoundSearch, ListOrdered, Swords } from "lucide-react";
import { msToNextLocalMidnight, formatCountdown } from "../lib/date.js";
import { MODE_ACCENT, MODE_RGB } from "../lib/accents.js";
import { recordDailyResult, fetchDistribution, summariseDistribution, MIN_N, SCORE_GAMES } from "../lib/dailyResults.js";
import { GAME_CODES, challengeToken, readChallenge, compareScores, scoreLabel } from "../lib/gameChallenge.js";
// Mates' leagues (phase 1, web only). The results lib is loaded on demand: a
// static import here put it in the chunk Home loads eagerly (+4 KB measured
// against scripts/audit-home-budget.mjs). Same detection as leagueResults.js.
const isNativeShell = () => {
  try {
    if (typeof location !== "undefined" && location.protocol === "capacitor:") return true;
    if (typeof document !== "undefined" && document.documentElement?.classList?.contains("native-app")) return true;
    const C = typeof window !== "undefined" ? window.Capacitor : null;
    return !!(C && typeof C.isNativePlatform === "function" && C.isNativePlatform());
  } catch { return false; }
};
const LEAGUE_GAMES = ["footle", "daily7", "trail", "top10"];

// Results in a day before the panel shows headcounts instead of shares.
const SHOW_COUNTS_FROM = 300;
import { reminderHourLabel } from "../lib/playHour.js";
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
//   waText      web-only WhatsApp fallback text (omit on native)
//   remind      { state: 'off'|'on'|'blocked'|'unsupported', onRemind } | undefined
//   nextUp      [{ key, name, onTap? , href? }] — today's other unplayed dailies
//   save        { onSave, line? } | null — guest; shows at a 2+ streak or when `line` names what is on this phone
//   stump       () => void | null — "Stump a mate" under Share (the app's k-factor lever)
//   stitch      () => void | null — "Stitch up a mate" under Share (Trail, web only)
//   GetAppCTA   component | null (islands pass the store badges)
//   track       (name, meta) => void — optional analytics
//   bucketMax   the most guesses / clubs this puzzle allows (Trail: the career's length), so
//               "how everyone did" knows its row count before the numbers arrive
//   promoted    { game, name, Icon } | null — a level this finish earned. One quiet line
//               under the streak, shown only when `game` matches: a daily finish never gets
//               the full-screen level-up overlay (return research, 16 Oct 2026).
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
const HOOK = {
  footle: "Six guesses · 2 min",
  daily7: "7 questions · 3 min",
  trail: "Whose career? · 2 min",
  top10: "Name all ten · 4 min",
  mystery: "Guess who · 3 min",
};
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
// "Make it a league?" was seen: once per result, the same double-mount guard.
const leagueOfferClaims = new Set();

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

export function DailyDone({ game, edition, won, bucket, isArchive = false, streak, onShare, waText, remind, nextUp = [], day = null, save, stump, stitch = null, GetAppCTA = null, track, bucketMax = null, promoted = null }) {
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
      stump: stump ? 1 : 0,
    });
  }, [game, edition, remind?.state, isArchive, track, save, stump, streak?.count]);

  // Record once (the lib dedupes per visitor per edition), then read the room.
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!isArchive) {
        // Mates' leagues: the same result, to the league table. NOT awaited.
        // Both panels' callbacks run one after the other once the module is
        // in, and the lib takes its claim synchronously, before its first
        // await, so the second finds it taken (leagueResults.js). Archive
        // plays never go; native shells never load it.
        if (LEAGUE_GAMES.includes(game) && !isNativeShell()) {
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
  // "Make it a league?" (mates' leagues, web only): wherever the head-to-head
  // line shows. Measure whether to limit it to wins (spec section 8).
  const leagueOffer = !!rival && !isNativeShell();
  useEffect(() => {
    if (!leagueOffer) return;
    const key = `${game}:${edition}`;
    if (leagueOfferClaims.has(key)) return;
    leagueOfferClaims.add(key);
    track?.("league-offer-shown", { game });
  }, [leagueOffer, game, edition, track]);
  const makeLeague = () => {
    track?.("league-make-tap", { game });
    openLeagueCreate({ h2hGame: game, vs: rival?.name || "", from: "h2h", h2h: { game, edition, mine: myScore, theirs: rival?.score ?? 0 } });
  };
  const doChallenge = async () => {
    const who = (() => { try { return day?.who?.() || ""; } catch { return ""; } })();
    const token = challengeToken(game, edition, myScore, who);
    if (!token) return;
    const url = `https://balliq.app/c/${token}`;
    const what = { footle: "Footle", trail: "Transfer Trail", top10: "Top 10" }[game];
    const text = `${what} No. ${edition}: ${scoreLabel(game, myScore)}. Can you beat it?`;
    track?.("dd-challenge", { game, rival: !!rival });
    try {
      if (navigator.share) { await navigator.share({ text, url }); setChallengeState("sent"); return; }
      await navigator.clipboard.writeText(`${text} ${url}`); setChallengeState("copied");
    } catch (e) {
      if (e && (e.name === "AbortError" || /cancel/i.test(e?.message || ""))) return;
      try { await navigator.clipboard.writeText(`${text} ${url}`); setChallengeState("copied"); } catch { /* nothing to do */ }
    }
  };

  const today = useMemo(() => summariseDistribution(dist, { game, mine: bucket, won }), [dist, game, bucket, won]);
  const yesterday = useMemo(() => (today ? null : summariseDistribution(prev, { game, mine: bucket, won })), [today, prev, game, bucket, won]);
  const summary = today || yesterday;
  const shown = today ? dist : prev;
  // Daily 7 has no public number (its edition is a day index).
  const yLabel = game === "daily7" ? "Yesterday" : `Yesterday, No. ${edition - 1}`;
  const showCounts = !!summary && summary.n >= SHOW_COUNTS_FROM;
  const barValue = (r) => (showCounts ? r.c : `${summary.n ? Math.round((r.c / summary.n) * 100) : 0}%`);
  const ko = formatCountdown(msToNextLocalMidnight(now));
  const streakN = streak?.count || 0;
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
    try { await onShare?.(); setShared(true); setTimeout(() => setShared(false), 2200); }
    finally { setBusy(false); }
  };
  const doRemind = async () => {
    if (busy || !remind?.onRemind) return;
    setBusy(true); track?.("dd-remind", { game });
    try { await remind.onRemind(); } finally { setBusy(false); }
  };

  // Four groups, top to bottom: your result, one share action, what to play
  // next, a quiet footer. They arrive one after another (--i staggers them).
  let gi = 0;
  const g = () => ({ className: "dd-g", style: { "--i": gi++ } });
  return (
    <section className="dd" aria-label="After today's puzzle">
      <div {...g()}>
      {/* Streak: the stake tonight names. Flame in the amber well the streak pill
          already uses elsewhere in the app. */}
      <div className="dd-row" style={{ "--dd-rgb": "255,170,0", "--dd-c": "var(--gold)" }}>
        <span className="dd-well" aria-hidden="true">{streakSafe ? <ShieldCheck size={20} strokeWidth={2.2} /> : <Flame size={20} strokeWidth={2.2} />}</span>
        <div className="dd-body">
          <div className="dd-title">
            {streakN >= 2 ? <>{streakN}-day {streak?.label || "streak"}</> : streakN === 1 ? <>Day 1 of a {streak?.label || "streak"}</> : <>Start a {streak?.label || "streak"}</>}
            {/* Banked shields, named BEFORE one is needed (16 Oct 2026). */}
            {!isArchive && streakN >= 1 && streak?.shields > 0 && (
              <span className="dd-shields" role="img" aria-label={`${streak.shields} streak shield${streak.shields > 1 ? "s" : ""} banked: each covers one missed day`} title="Each shield covers one missed day">
                {Array.from({ length: streak.shields }, (_, i) => <ShieldCheck key={i} size={13} strokeWidth={2.4} aria-hidden="true" />)}
              </span>
            )}
          </div>
          <div className="dd-sub">
            {isArchive ? <>An old puzzle — it doesn’t count toward tomorrow.</>
              : streakSafe ? <><strong>Streak safe</strong> · new puzzles in <strong className="dd-num">{ko}</strong></>
              : streakN >= 1 ? <>Tomorrow makes it <strong className="dd-num">{streakN + 1}</strong> · new puzzles in <strong className="dd-num">{ko}</strong></>
              : <>New puzzles in <strong className="dd-num">{ko}</strong></>}
          </div>
          {/* THE REMINDER LIVES ON THE STREAK IT PROTECTS (16 Oct 2026). As a row in
              the footer it drew 12 taps in 14 days against ~1,774 finish views. Here
              it is a third line of the streak itself: a pill beside the title
              wrapped "12-day daily streak" onto three lines at 375px. */}
          {remind && remind.state === "off" && !isArchive && (
            <button type="button" className="dd-remind" disabled={busy} onClick={doRemind} aria-label={`Turn on a daily reminder at ${reminderHourLabel()}`} title="One nudge a day, only if you haven't played. Off any time.">
              <Bell size={13} strokeWidth={2.4} aria-hidden="true" /> Remind me at {reminderHourLabel()}
            </button>
          )}
        </div>
        {remind && remind.state === "on" && (
          <span className="dd-pill is-set" aria-label={`Reminder set for ${reminderHourLabel()}`}>
            {/* A bell, not a tick: a tick and "19:00" beside the streak said nothing about
                what was set for 19:00 (Alex's recording, 12 Oct 2026). */}
            <Bell size={13} strokeWidth={2.4} aria-hidden="true" /> {reminderHourLabel()}
          </span>
        )}
      </div>

      {/* "Promoted to", never "Level up to": the ladder reads Sunday League ->
          Non-League -> Championship, and "Level up! Non-League" read as a
          relegation (design pass, 15 Oct 2026). */}
      {promoted && promoted.game === game && !isArchive && (
        <div className="dd-promo" role="status">
          {promoted.Icon && <promoted.Icon size={14} strokeWidth={2.4} aria-hidden="true" />}
          <span>Promoted to <strong>{promoted.name}</strong></span>
        </div>
      )}

      {rival && (() => {
        const r = compareScores(game, myScore, rival.score);
        const name = rival.name || "Your mate";
        return (
          <div className={`dd-h2h${r > 0 ? " is-win" : r < 0 ? " is-loss" : ""}`} role="status">
            <span>You <strong className="dd-num">{scoreLabel(game, myScore)}</strong> · {name} <strong className="dd-num">{scoreLabel(game, rival.score)}</strong></span>
            <strong>{r > 0 ? `You beat ${name}` : r < 0 ? `${name} wins this one` : `Level with ${name}`}</strong>
          </div>
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
        <button type="button" className="dd-share" onClick={doChallenge} aria-label="Send a challenge back">
          <Swords size={18} strokeWidth={2.4} aria-hidden="true" /> {challengeState === "copied" ? "Link copied" : challengeState === "sent" ? "Challenge sent" : rival ? "Send it back" : "Challenge a mate"}
        </button>
      ) : (
        <button type="button" className="dd-share" onClick={doShare} disabled={busy} aria-label="Share your result">
          {shared ? <><Check size={18} strokeWidth={2.6} aria-hidden="true" /> Shared</> : <><Share size={18} strokeWidth={2.4} aria-hidden="true" /> Share result</>}
        </button>
      )}
      {(waText || stump || stitch || canChallenge || leagueOffer) && (
        <div className="dd-share-alts">
          {rival && (
            <button type="button" className="dd-share-alt" onClick={doShare} disabled={busy}>{shared ? "Shared" : "Share result"}</button>
          )}
          {leagueOffer && (
            <button type="button" className="dd-share-alt" onClick={makeLeague}>Make it a league?</button>
          )}
          {waText && (
            <a className="dd-share-alt" href={`https://wa.me/?text=${encodeURIComponent(waText)}`} target="_blank" rel="noopener noreferrer" onClick={() => track?.("dd-share-wa", { game })}>Send on WhatsApp</a>
          )}
          {/* The k-factor lever lives under Share, where sharing is. It was a
              third full-width button below the panel. */}
          {stump && (
            <button type="button" className="dd-share-alt" onClick={() => { track?.("dd-stump", { game }); stump(); }}>Stump a mate</button>
          )}
          {/* Stitch-up (web only; the host passes it on the Trail alone): build
              a Trail of your own for a mate. A link, like the others here. */}
          {stitch && (
            <button type="button" className="dd-share-alt" onClick={() => { track?.("dd-stitch", { game }); stitch(); }}>Stitch up a mate</button>
          )}
          {canChallenge && !rival && (
            <button type="button" className="dd-share-alt" onClick={doChallenge} aria-label="Challenge a mate to this puzzle">{challengeState === "copied" ? "Link copied" : challengeState === "sent" ? "Challenge sent" : rival ? "Send it back" : "Challenge a mate"}</button>
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
        return (
          <>
            <div className="dd-hr" aria-hidden="true" />
            <div {...g()}>
            {first ? card(first, "dd-up", (
              <>
                <span className="dd-up-k">Next up</span>
                <span className="dd-up-main">
                  <span className="dd-well" aria-hidden="true">{first.icon || DEFAULT_ICON[modeOf(first.key)] || null}</span>
                  <span className="dd-up-body">
                    <span className="dd-up-name">{first.name}</span>
                    <span className="dd-up-hook">{lostHere ? "Win the day back · " : ""}{HOOK[modeOf(first.key)] || ""}</span>
                  </span>
                  <span className="dd-up-go">Play</span>
                </span>
              </>
            )) : keys.length > 0 && doneN >= keys.length ? (
              <div className="dd-up is-sweep">
                <span className="dd-up-k">Clean sweep</span>
                <span className="dd-up-name">All {keys.length} done today</span>
              </div>
            ) : null}
            {keys.length > 1 && (
              <div className="dd-day" aria-label={`${doneN} of ${keys.length} today`}>
                <span className="dd-day-bar" aria-hidden="true">
                  {keys.map((k) => (
                    <i key={k} className={isDone(k) ? (modeOf(k) === modeOf(game) && lostHere ? "is-lost" : "is-done") : ""} style={{ "--dd-c": MODE_ACCENT[modeOf(k)] || "var(--accent)" }} />
                  ))}
                </span>
                {/* The countdown lives on the streak line at the top; once is enough. */}
                <span className="dd-day-tx"><strong className="dd-num">{doneN} of {keys.length}</strong> done today</span>
              </div>
            )}
            {rest.length > 0 && (
              <div className="dd-up-more">
                {rest.map((n) => card(n, "dd-chip", (
                  <><span className="dd-chip-ic" aria-hidden="true">{n.icon || DEFAULT_ICON[modeOf(n.key)] || null}</span>{n.name.replace(/^Today's /, "")}</>
                )))}
              </div>
            )}
            </div>
          </>
        );
      })()}


      <div className="dd-hr" aria-hidden="true" />
      <div {...g()}>
      {/* THE QUIET FOOTER: reminder, the crowd, the app and the save, below a
          hairline. The app badge sat right under Share from 15 Oct (highest
          intent on a phone browser); it keeps its place above the crowd's
          numbers but no longer competes with the two things to do now. */}
      {GetAppCTA && <div className="dd-getapp"><GetAppCTA /></div>}



      {save && save.onSave && (streakN >= 2 || save.line) && (
        <div className="dd-row">
          <div className="dd-body">
            {streakN >= 2
              ? <div className="dd-sub">Your <strong className="dd-num">{streakN}-day</strong> streak{save.line ? <> and <strong className="dd-num">{save.line}</strong></> : null} live{save.line ? "" : "s"} on this phone only.</div>
              : <div className="dd-sub"><strong className="dd-num">{save.line}</strong> — on this phone only.</div>}
          </div>
          <button type="button" className="dd-pill" onClick={() => { track?.("dd-save", { game }); save.onSave(); }}>Save</button>
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
      {!distReady ? (
        // The frame: same head, same rows, same one-line sub, no numbers.
        <div className="dd-dist is-loading" aria-busy="true" aria-label="How everyone did, loading">
          <div className="dd-dist-head"><div className="dd-title">How everyone did</div></div>
          <div className="dd-bars" aria-hidden="true">
            {bars.map((r) => (
              <React.Fragment key={r.k}>
                <span className="dd-bar-k">{r.label}</span>
                <span className="dd-bar"><i style={{ width: 0 }} /></span>
                <span className="dd-bar-v">{"\u00a0"}</span>
              </React.Fragment>
            ))}
          </div>
          <div className="dd-sub" aria-hidden="true">{"\u00a0"}</div>
        </div>
      ) : summary && (
        <div className={`dd-dist${yesterday ? " is-yesterday" : ""}`} aria-label={yesterday ? yLabel : showCounts ? `How everyone did, ${summary.n} results` : "How everyone did"}>
          <div className="dd-dist-head">
            <div className="dd-title">{yesterday ? yLabel : "How everyone did"}</div>
            {showCounts && !yesterday ? <div className="dd-dist-cap dd-num">{summary.n.toLocaleString()} played</div>
              : !yesterday ? <div className="dd-dist-cap">Early numbers</div> : null}
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
          <div className="dd-sub">
            {yesterday
              // One line, like today's (the frame reserves one): two lines here
              // moved everything under the block by a line when it landed.
              ? <>You're early today. {summary.outOf != null
                ? <>Yesterday's average: <strong className="dd-num">{summary.avg.toFixed(1)}/{summary.outOf}</strong></>
                : <><strong className="dd-num">{summary.solvedPct}%</strong> solved yesterday's.</>}</>
              : summary.outOf != null
                ? <>Average <strong className="dd-num">{summary.avg.toFixed(1)}/{summary.outOf}</strong>{summary.line ? <> · <strong>{summary.line}</strong></> : null}</>
                : <><strong className="dd-num">{summary.solvedPct}%</strong> solved{summary.line ? <> · <strong>{summary.line}</strong></> : null}</>}
          </div>
        </div>
      )}


      </div>
    </section>
  );
}

export { MIN_N };
export default DailyDone;
