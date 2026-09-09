import React, { useEffect, useMemo, useState } from "react";
import { Flame, Bell, Share, Check, ClipboardList, Route, UserRoundSearch } from "lucide-react";
import { msToNextLocalMidnight, formatCountdown } from "../lib/date.js";
import { MODE_ACCENT, MODE_RGB } from "../lib/accents.js";
import { recordDailyResult, fetchDistribution, summariseDistribution, MIN_N } from "../lib/dailyResults.js";
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
//   streak      { count, label } — the app passes its one streak; islands the game's
//   onShare     async () => void   (host builds the text / card)
//   waText      web-only WhatsApp fallback text (omit on native)
//   remind      { state: 'off'|'on'|'blocked'|'unsupported', onRemind } | undefined
//   nextUp      [{ key, name, onTap? , href? }] — today's other unplayed dailies
//   save        { onSave, line? } | null — guest; shows at a 2+ streak or when `line` names what is on this phone
//   stump       () => void | null — "Stump a mate" under Share (the app's k-factor lever)
//   GetAppCTA   component | null (islands pass the store badges)
//   track       (name, meta) => void — optional analytics
// Default glyph per daily for the "still open today" rows, so a host that passes
// only names + links (the static islands) still draws a well with something in
// it — an empty tinted square read as a bug on the first web play-through.
const DEFAULT_ICON = {
  footle: <span className="fh-tile fh-tile-green" style={{ "--fh-tile": "22px", borderRadius: 6 }} aria-hidden="true">F</span>,
  daily7: <ClipboardList size={18} strokeWidth={2.2} />,
  trail: <Route size={18} strokeWidth={2.2} />,
  mystery: <UserRoundSearch size={18} strokeWidth={2.2} />,
};

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

export function DailyDone({ game, edition, won, bucket, isArchive = false, streak, onShare, waText, remind, nextUp = [], save, stump, GetAppCTA = null, track }) {
  const [now, setNow] = useState(() => new Date());
  const [dist, setDist] = useState(null);
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
      archive: isArchive ? 1 : 0,
    });
  }, [game, edition, remind?.state, isArchive, track]);

  // Record once (the lib dedupes per visitor per edition), then read the room.
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!isArchive) {
        // Both the record and the play-hour note live behind one synchronous
        // claim in the lib — two of these panels mount per result (mobile +
        // desktop) and used to fire both, twice.
        await recordDailyResult({ game, edition, bucket, won });
      }
      const d = await fetchDistribution({ game, edition });
      if (alive) setDist(d);
    })();
    return () => { alive = false; };
  }, [game, edition, bucket, won, isArchive]);

  const summary = useMemo(() => summariseDistribution(dist, { game, mine: bucket, won }), [dist, game, bucket, won]);
  const ko = formatCountdown(msToNextLocalMidnight(now));
  const streakN = streak?.count || 0;

  const bars = useMemo(() => {
    if (!summary) return [];
    const b = dist.buckets;
    const keys = game === "daily7"
      ? [0, 1, 2, 3, 4, 5, 6, 7]
      : game === "footle" ? [1, 2, 3, 4, 5, 6, 0]
      : (() => { const ks = Object.keys(b).map(Number).filter((k) => k > 0); const max = Math.max(4, ...ks, won ? bucket : 0); return [...Array.from({ length: Math.min(max, 10) }, (_, i) => i + 1), 0]; })();
    const top = Math.max(1, ...keys.map((k) => b[k] || 0));
    return keys.map((k) => ({ k, label: k === 0 && game !== "daily7" ? "X" : String(k), c: b[k] || 0, pct: Math.round(((b[k] || 0) / top) * 100), mine: game === "daily7" ? k === bucket : (won ? k === bucket : k === 0) }));
  }, [summary, dist, game, bucket, won]);

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

  return (
    <section className="dd" aria-label="After today's puzzle">
      {/* Streak: the stake tonight names. Flame in the amber well the streak pill
          already uses elsewhere in the app. */}
      <div className="dd-row" style={{ "--dd-rgb": "255,170,0", "--dd-c": "var(--gold)" }}>
        <span className="dd-well" aria-hidden="true"><Flame size={20} strokeWidth={2.2} /></span>
        <div className="dd-body">
          <div className="dd-title">
            {streakN >= 2 ? <>{streakN}-day {streak?.label || "streak"}</> : streakN === 1 ? <>Day 1 of a {streak?.label || "streak"}</> : <>Start a {streak?.label || "streak"}</>}
          </div>
          <div className="dd-sub">
            {isArchive ? <>An old puzzle — it doesn’t count toward tomorrow.</>
              : streakN >= 1 ? <>Tomorrow makes it <strong className="dd-num">{streakN + 1}</strong> · new puzzles in <strong className="dd-num">{ko}</strong></>
              : <>New puzzles in <strong className="dd-num">{ko}</strong></>}
          </div>
        </div>
        {remind && remind.state === "on" && (
          <span className="dd-pill is-set" aria-label={`Reminder set for ${reminderHourLabel()}`}>
            <Check size={14} strokeWidth={2.6} aria-hidden="true" /> {reminderHourLabel()}
          </span>
        )}
      </div>

      {/* THE ASK IS A ROW, NOT A PILL (2026-09-09). Reach is the retention
          leak: 44 of 308 accounts hold a token. Since the soft-prompt sheet was
          retired (09-06) this panel has been the only ask in the app, and it
          was a 34px pill beside a countdown — offered 12 times in three days,
          tapped once. A row in the panel's own anatomy says what it does and
          when, and it sits directly under the stake it protects. It still asks
          for permission only on the tap (iOS shows its sheet once, ever). */}
      {remind && remind.state === "off" && !isArchive && (
        <div className="dd-row" style={{ "--dd-rgb": "88,204,2", "--dd-c": "var(--accent)" }}>
          <span className="dd-well" aria-hidden="true"><Bell size={20} strokeWidth={2.2} /></span>
          <div className="dd-body">
            <div className="dd-title">Remind me tomorrow at {reminderHourLabel()}</div>
            <div className="dd-sub">One nudge at your hour, only if you haven’t played · off any time</div>
          </div>
          <button type="button" className="dd-pill dd-pill-on" disabled={busy} onClick={doRemind} aria-label={`Turn on a daily reminder at ${reminderHourLabel()}`}>Turn on</button>
        </div>
      )}

      {/* ABOVE SHARE, DELIBERATELY (Alex, 2026-09-06, looking at his own
          finish screen: "we can not really see the modes further down, nobody
          will scroll down here"). He is right, and the ranking is not close.
          Sharing depends on another person and k-factor measured 0.23 — the
          floor. Playing a second daily depends on nobody, is one tap, and is
          the cheapest retention this product has. The panel's job at this
          moment is "what next?", and another puzzle is a better answer than a
          share sheet. So: streak, then what is still open, then share. */}
      {nextUp.filter((n) => n.key !== game).length > 0 && (
        <div className="dd-next" aria-label="Still open today">
          <div className="dd-title">Still open today</div>
          {nextUp.filter((n) => n.key !== game).map((n) => {
            const Tag = n.href ? "a" : "button";
            const rgb = MODE_RGB[n.key === "daily" ? "daily7" : n.key] || "88,204,2";
            const c = MODE_ACCENT[n.key === "daily" ? "daily7" : n.key] || "var(--accent)";
            return (
              <Tag key={n.key} className="dd-next-row is-mode" style={{ "--dd-rgb": rgb, "--dd-c": c }} href={n.href} onClick={() => { track?.("dd-next", { game, to: n.key }); n.onTap?.(); }} {...(n.href ? {} : { type: "button" })}>
                <span className="dd-well" aria-hidden="true">{n.icon || DEFAULT_ICON[n.key] || null}</span>
                <span className="dd-title">{n.name}</span>
                <span className="dd-next-go">Play</span>
              </Tag>
            );
          })}
        </div>
      )}

      <button type="button" className="dd-share" onClick={doShare} disabled={busy} aria-label="Share your result">
        {shared ? <><Check size={18} strokeWidth={2.6} aria-hidden="true" /> Shared</> : <><Share size={18} strokeWidth={2.4} aria-hidden="true" /> Share result</>}
      </button>
      {(waText || stump) && (
        <div className="dd-share-alts">
          {waText && (
            <a className="dd-share-alt" href={`https://wa.me/?text=${encodeURIComponent(waText)}`} target="_blank" rel="noopener noreferrer" onClick={() => track?.("dd-share-wa", { game })}>Send on WhatsApp</a>
          )}
          {/* The k-factor lever lives under Share, where sharing is. It was a
              third full-width button below the panel. */}
          {stump && (
            <button type="button" className="dd-share-alt" onClick={() => { track?.("dd-stump", { game }); stump(); }}>Stump a mate</button>
          )}
        </div>
      )}

      {summary && (
        <div className="dd-dist" aria-label={`How everyone did, ${summary.n} results`}>
          <div className="dd-dist-head">
            <div className="dd-title">How everyone did</div>
            <div className="dd-dist-cap dd-num">{summary.n.toLocaleString()} played</div>
          </div>
          <div className="dd-bars">
            {bars.map((r) => (
              <React.Fragment key={r.k}>
                <span className={`dd-bar-k${r.mine ? " is-mine" : ""}`}>{r.label}</span>
                <span className={`dd-bar${r.mine ? " is-mine" : ""}`} role="img" aria-label={`${r.label}: ${r.c}`}><i style={{ width: `${r.pct}%` }} /></span>
                <span className={`dd-bar-v${r.mine ? " is-mine" : ""}`}>{r.c}</span>
              </React.Fragment>
            ))}
          </div>
          <div className="dd-sub">
            {game === "daily7"
              ? <>Average <strong className="dd-num">{summary.avg.toFixed(1)}/7</strong>{summary.beatPct > 0 ? <> · you beat <strong className="dd-num">{summary.beatPct}%</strong></> : null}</>
              : <><strong className="dd-num">{summary.solvedPct}%</strong> solved{won && summary.beatPct > 0 ? <> · you beat <strong className="dd-num">{summary.beatPct}%</strong></> : null}</>}
          </div>
        </div>
      )}


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

      {GetAppCTA && <div className="dd-getapp"><GetAppCTA /></div>}
    </section>
  );
}

export { MIN_N };
export default DailyDone;
