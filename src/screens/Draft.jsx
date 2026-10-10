// Draft — eleven spins, eleven real seasons, one league table.
//
// Each spin lands on a real club in a real season. Take one man from it. He
// brings that season with him: the games he played, the goals he scored, his
// club's defence. The games he missed are played by a stand-in from a
// relegated side. Then the eleven plays 38 matches (src/lib/draftModel.js).
//
// Built on the same seams as Top10: no import from App.jsx, services arrive as
// a prop, and the squads (src/data/draftSquads.json) are import()ed when the
// screen opens, so none of it weighs on Home.
//
// Everything that decides anything lives in draftModel.js as plain functions
// (the board, a game in progress, what is saved and whether it can be trusted,
// the season). This file draws what they return. Keep it that way: the repo
// has no DOM test environment, so a rule written in here is a rule no test
// can hold.
//
// ⚠️ NOT A DAILY YET. It is reachable only by address (?game=draft), it sends
// no daily-completed event and feeds no streak. The day's board and the day's
// luck are already fixed by the date, so turning it on is wiring, not a
// rewrite.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { dayIndexForDate } from "../lib/date.js";
import {
  POS, FORMATION, SPINS, GAMES,
  prepare, strength, playSeason, dayLuck, standing, ordinal,
  freshGame, restoreGame, settleSpin, respin, takePick, picksOf, openIn, squadKeyAt,
} from "../lib/draftModel.js";
import { resolveDailyServices } from "../games/dailyServices.js";
import { MODE_ACCENT, MODE_RGB } from "../lib/accents.js";
import "./draft.css";

const SKIN = { "--dr": MODE_ACCENT.draft, "--dr-rgb": MODE_RGB.draft };
const PLURAL = { GK: "Goalkeepers", DF: "Defenders", MF: "Midfielders", FW: "Forwards" };
const LINES = ["FW", "MF", "DF", "GK"]; // the pitch, attack at the top
const TICK_MS = 85;                      // one match of the season
const KEEP_DAYS = 7;                     // saved boards older than this are cleared
const isCalm = () => {
  try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; }
};
const surname = (n) => { const w = n.split(" "); return w.length > 1 ? w.slice(1).join(" ") : n; };
const games = (p, sq) => (sq.split && p.su ? `${p.st}+${p.su}` : `${p.st}`);
const PREFIX = "biq_draft_";
const load = (day) => { try { return JSON.parse(localStorage.getItem(PREFIX + day) || "null"); } catch { return null; } };
const save = (day, g) => { try { localStorage.setItem(PREFIX + day, JSON.stringify(g)); } catch { /* private window: play on unsaved */ } };
// One saved board a day would otherwise pile up for ever.
const prune = (today) => {
  try {
    const old = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX) && !(+k.slice(PREFIX.length) > today - KEEP_DAYS)) old.push(k);
    }
    for (const k of old) localStorage.removeItem(k);
  } catch { /* nothing to clear */ }
};

function useSquads() {
  const [state, setState] = useState({ D: null, failed: false });
  useEffect(() => {
    let live = true;
    import("../data/draftSquads.json")
      .then((m) => { if (live) setState({ D: prepare(m.default || m), failed: false }); })
      .catch(() => { if (live) setState({ D: null, failed: true }); });
    return () => { live = false; };
  }, []);
  return state;
}

export default function Draft({ date, onBack, services }) {
  const { D, failed } = useSquads();
  // The day is read ONCE, when the screen opens. A game being played as the
  // clock passes midnight is finished on the board it started on, rather than
  // being swapped for tomorrow's under the player's thumb.
  const [today] = useState(() => dayIndexForDate(date || new Date()));
  // A practice board is another day's board, played without being saved.
  const [practice, setPractice] = useState(0);
  useEffect(() => { prune(today); }, [today]);
  if (!D) {
    return (
      <div className="screen dr" style={{ ...SKIN, padding: 24, textAlign: "center" }} aria-busy={!failed}>
        {onBack && <button className="back-btn" onClick={onBack} aria-label="Back">←</button>}
        <div style={{ marginTop: 60, fontSize: 20, fontWeight: 800, color: "var(--t1)" }}>Draft</div>
        <div style={{ fontSize: 14, color: "var(--t2)", marginTop: 8 }}>
          {failed ? "Could not load the squads. Check your connection and try again." : "Loading the squads…"}
        </div>
      </div>
    );
  }
  const day = today + practice * 1000;
  return (
    <DraftGame key={day} D={D} day={day} isPractice={practice > 0} onBack={onBack} services={services}
      onAnother={() => setPractice((n) => n + 1)} />
  );
}

function DraftGame({ D, day, isPractice, onBack, services, onAnother }) {
  const { haptic, playSound, Confetti } = resolveDailyServices(services);
  // What was saved, if all of it still makes sense; otherwise a fresh deal.
  // Either way the spin on show is one somebody can be taken from.
  const [g, setG] = useState(() => settleSpin((isPractice ? null : restoreGame(load(day), D)) || freshGame(D, day), D));
  const update = useCallback((fn) => setG((cur) => settleSpin(fn(cur), D)), [D]);
  useEffect(() => { if (!isPractice) save(day, g); }, [day, g, isPractice]);
  const [chosen, setChosen] = useState(null);

  const picks = useMemo(() => picksOf(g, D), [g, D]);
  const at = picks.length;
  const done = at >= SPINS;
  const sq = done ? null : D.byKey.get(squadKeyAt(g, at));
  const open = useMemo(() => openIn(picks), [picks]);

  const onRespin = useCallback(() => { haptic("soft"); setChosen(null); update(respin); }, [haptic, update]);
  const take = useCallback(() => {
    if (!chosen) return;
    haptic("hardCorrect"); playSound("correct");
    update((cur) => takePick(cur, D, chosen.id));
    setChosen(null);
  }, [chosen, D, haptic, playSound, update]);

  // Back to the top for every new squad and for the season, AFTER the new
  // content is on the page. ⚠️ `behavior: "instant"` is the point: the page
  // scrolls smoothly by rule (app.css), and a smooth scroll started in the tap
  // was cut short by the re-render, leaving the next squad's name 600pt above
  // the screen (measured in WebKit, 10 Oct 2026: the player could not see where
  // the spin had landed).
  const spinKey = sq ? sq.k : "season";
  useEffect(() => {
    if (!g.started) return;
    try { window.scrollTo({ top: 0, left: 0, behavior: "instant" }); } catch { try { window.scrollTo(0, 0); } catch { /* nothing to scroll */ } }
  }, [at, spinKey, g.started]);

  // ── The season ──────────────────────────────────────────────────────────────
  const result = useMemo(() => {
    if (!done) return null;
    const se = playSeason(strength(picks, D), D.league, dayLuck(day));
    return { se, stand: standing(se.pts, D.table) };
  }, [done, picks, D, day]);
  // How many of the 38 matches have been shown. A season already watched, or a
  // player who asked for less motion, gets all of them at once.
  const [shown, setShown] = useState(() => (g.seen || isCalm() ? GAMES : 0));
  useEffect(() => {
    if (!done || shown >= GAMES) return undefined;
    const t = setTimeout(() => setShown((n) => n + 1), shown === 0 ? 500 : TICK_MS);
    return () => clearTimeout(t);
  }, [done, shown]);
  // ⚠️ `done &&` is load-bearing. Without it a player with Reduce Motion on
  // (shown starts at 38) was "played out" before the first pick, and the effect
  // below read a result that did not exist: the screen crashed on Spin, and
  // again on every reload (found in review, 10 Oct 2026).
  const played = done && shown >= GAMES;
  useEffect(() => {
    if (!played || !result || g.seen) return;
    setG((cur) => ({ ...cur, seen: true }));
    haptic(result.se.pts >= 80 ? "hardCorrect" : "soft");
    // Tells the app the game was finished, not walked away from. Deliberately
    // its own event: `biq:daily-completed` would count this as a daily.
    try { window.dispatchEvent(new CustomEvent("biq:draft-completed", { detail: { points: result.se.pts, practice: isPractice } })); } catch { /* best effort */ }
  }, [played, result, g.seen, haptic, isPractice]);

  if (!g.started) {
    return (
      <div className="screen dr" style={SKIN}>
        <Head sub="Eleven spins. One season." onBack={onBack} />
        <div className="dr-intro">
          <h2>Build an eleven out of real seasons.</h2>
          <ol>
            <li><b>Eleven spins.</b> Each lands on a real club in a real league season since 1995.</li>
            <li><b>Take one man from each.</b> He brings that season with him: the games he played, the goals he scored, his club’s defence.</li>
            <li><b>The games he missed</b> are played by a stand-in from a relegated side. A star who was injured half the year is half a star.</li>
            <li><b>Then your eleven plays 38 matches.</b> Everyone gets the same board and the same luck today.</li>
          </ol>
          <label className="dr-hard">
            <input type="checkbox" checked={g.hard} onChange={(e) => { const hard = e.target.checked; update((cur) => ({ ...cur, hard })); }} />
            <span><b>Hide the numbers.</b> Names only: you have to know who had the season.</span>
          </label>
          <button className="dr-cta" onClick={() => { haptic("soft"); update((cur) => ({ ...cur, started: true })); }}>Spin</button>
          <p className="dr-source">4-3-3. One re-spin. Squads, games and goals from English Wikipedia’s club-season articles, checked against the league table.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="screen dr" style={SKIN}>
      {played && result.se.pts >= 90 && Confetti ? <Confetti /> : null}
      <Head sub={done ? (isPractice ? "Practice board" : "Today’s board") : `Spin ${at + 1} of ${SPINS}`} onBack={onBack}
        right={!done && (
          <button className="dr-respin" onClick={onRespin} disabled={g.respun} aria-label={g.respun ? "Re-spin used" : "Re-spin this squad"}>
            <RefreshCw size={15} strokeWidth={2.4} aria-hidden="true" />{g.respun ? "Used" : "Re-spin"}
          </button>
        )} />

      <Pitch picks={picks} chosen={chosen} />

      {!done && sq && (
        <>
          <div className="dr-spin" key={`${at}:${sq.k}`}>
            <div className="dr-spin-season">{sq.season}</div>
            <h2 className="dr-spin-club">{sq.club}</h2>
            <div className="dr-spin-meta">
              Finished {ordinal(sq.pos)} · {sq.pts} points · scored {sq.gf}, conceded {sq.ga}
            </div>
          </div>

          {[...POS].sort((a, b) => (open.left[b] > 0) - (open.left[a] > 0) || POS.indexOf(b) - POS.indexOf(a)).map((pos) => {
            const free = open.left[pos];
            let rows = sq.players.filter((p) => p.p === pos);
            if (g.hard) rows = [...rows].sort((a, b) => a.n.localeCompare(b.n));
            return (
              <section key={pos} className={`dr-line${free > 0 ? "" : " is-full"}`}>
                <h3>{PLURAL[pos]}<span>{free > 0 ? `${free} ${free === 1 ? "place" : "places"} open` : "full"}</span></h3>
                {free > 0 && rows.map((p) => {
                  const ok = open.can(p);
                  return (
                    <button key={p.id} type="button" disabled={!ok}
                      className={`dr-row${chosen?.id === p.id ? " is-chosen" : ""}`}
                      onClick={() => { haptic("soft"); setChosen(chosen?.id === p.id ? null : p); }}>
                      <span className="dr-row-name">{p.n}</span>
                      {!ok ? <span className="dr-row-num">already yours</span>
                        : g.hard ? null
                          : <span className="dr-row-num"><b>{games(p, sq)}</b> games{pos === "GK" ? "" : <> · <b>{p.g}</b> {p.g === 1 ? "goal" : "goals"}</>}</span>}
                    </button>
                  );
                })}
              </section>
            );
          })}
          <div className="dr-pad" />
          <div className={`dr-take${chosen ? " is-on" : ""}`}>
            <button className="dr-cta" disabled={!chosen} onClick={take}>
              {chosen ? `Take ${chosen.n}` : "Pick a player"}
            </button>
          </div>
        </>
      )}

      {done && result && (
        <Season result={result} picks={picks} shown={shown} played={played} hard={g.hard}
          isPractice={isPractice} onSkip={() => setShown(GAMES)} onAnother={onAnother} onBack={onBack} />
      )}
    </div>
  );
}

function Head({ sub, onBack, right }) {
  return (
    <div className="dr-head">
      {onBack && <button className="back-btn" onClick={onBack} aria-label="Back">←</button>}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="dr-head-title">Draft</div>
        <div className="dr-head-sub">{sub}</div>
      </div>
      {right}
    </div>
  );
}

// The eleven so far, attack at the top. A place lights up when it is filled;
// the man being considered shows where he would go.
function Pitch({ picks, chosen }) {
  return (
    <div className="dr-pitch" role="list" aria-label="Your eleven">
      {LINES.map((pos) => {
        const mine = picks.filter((x) => x.p.p === pos);
        return (
          <div key={pos} className="dr-pitch-row">
            {Array.from({ length: FORMATION[pos] }, (_, i) => {
              const x = mine[i];
              const ghost = !x && chosen?.p === pos && i === mine.length;
              return (
                <div key={i} role="listitem" className={`dr-slot${x ? " is-on" : ghost ? " is-ghost" : ""}`}>
                  {x ? <><b>{surname(x.p.n)}</b><i>{x.sq.season.slice(2)}</i></>
                    : ghost ? <b>{surname(chosen.n)}</b>
                      : <span>{pos}</span>}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

const WORD = { w: "Won", d: "Drew", l: "Lost" };

function Season({ result, picks, shown, played, hard, isPractice, onSkip, onAnother, onBack }) {
  const { se, stand } = result;
  const sofar = se.matches.slice(0, shown);
  const w = sofar.filter((m) => m.r === "w").length, d = sofar.filter((m) => m.r === "d").length, l = shown - w - d;
  const last = sofar[sofar.length - 1];
  // The one thing that cost most: the man who was on the pitch least.
  const absent = [...picks].sort((a, b) => a.p.on - b.p.on)[0];
  const top = [...picks].sort((a, b) => b.p.g - a.p.g)[0];
  const verdict = stand.titles >= stand.seasons ? `${se.pts} points wins the league in every season since 1995.`
    : stand.titles > 0 ? `${se.pts} points wins the league in ${stand.titles} of the ${stand.seasons} seasons since 1995.`
      : stand.down >= stand.seasons / 2 ? `${se.pts} points goes down in ${stand.down} of the ${stand.seasons} seasons since 1995.`
        : `${se.pts} points has never won the league. It usually finishes ${ordinal(stand.place)}.`;
  const share = useCallback(async () => {
    const rowsOf = (ms) => ms.map((m) => (m.r === "w" ? "🟩" : m.r === "d" ? "⬜" : "🟥")).join("");
    const text = `Ball IQ Draft\n${se.w}-${se.d}-${se.l} · ${se.pts} points · goals ${se.gf}-${se.ga}\n${rowsOf(se.matches.slice(0, 19))}\n${rowsOf(se.matches.slice(19))}\n${verdict}\nballiq.app/play?game=draft`;
    try { if (navigator.share) { await navigator.share({ text }); return; } } catch { return; }
    try {
      await navigator.clipboard.writeText(text);
      window.dispatchEvent(new CustomEvent("biq:show-toast", { detail: "📋 Copied — paste it anywhere" }));
    } catch { /* nothing to copy to */ }
  }, [se, verdict]);

  return (
    <div className="dr-season">
      <div className="dr-record">
        <span className="dr-record-n">{w}<i>–</i>{d}<i>–</i>{l}</span>
        <span className="dr-record-l">won · drawn · lost</span>
      </div>
      <button type="button" className="dr-ticker" onClick={onSkip} aria-label={played ? "The 38 matches, in order" : "Skip to the end of the season"}>
        {se.matches.map((m, i) => <i key={i} className={i < shown ? `is-${m.r}` : undefined} />)}
      </button>
      {!played && (
        <div className="dr-tick-note" aria-hidden="true">
          {last ? <>Matchday {shown}: {WORD[last.r].toLowerCase()} {last.f}–{last.a} {last.home ? "at home to" : "away to"} {ordinal(last.place)} place</> : "Kick-off"}
          {" · tap to skip"}
        </div>
      )}

      {played && (
        // Announced once, when the season is over: the running record above
        // changes 38 times in three seconds and would be read out each time.
        <div className="dr-final" aria-live="polite">
          <div className="dr-points">{se.pts}<small> points</small></div>
          <div className="dr-goals">Won {se.w}, drew {se.d}, lost {se.l} · goals {se.gf}–{se.ga}</div>
          <p className="dr-verdict">{verdict}</p>
          <p className="dr-why">
            {absent.p.on < 0.8
              ? <>{absent.p.n} {absent.sq.split ? "started" : "played"} {absent.p.st} of the 38 league games in {absent.sq.season}. A stand-in from a relegated side filled in for him.</>
              : <>Nobody in your eleven missed much. {top.p.g > 0 ? `${top.p.n} scored ${top.p.g} in ${top.sq.season}.` : ""}</>}
          </p>

          <h3 className="dr-xi-h">Your eleven</h3>
          <div className="dr-xi">
            {[...picks].sort((a, b) => POS.indexOf(b.p.p) - POS.indexOf(a.p.p)).map(({ p, sq }) => (
              <div key={p.id} className="dr-xi-row">
                <span className="dr-xi-pos">{p.p}</span>
                <span className="dr-xi-who"><b>{p.n}</b><i>{sq.season} {sq.club} · finished {ordinal(sq.pos)}</i></span>
                <span className="dr-xi-num">{games(p, sq)}<small> games</small>{p.p !== "GK" && <> · {p.g}<small> {p.g === 1 ? "goal" : "goals"}</small></>}</span>
              </div>
            ))}
          </div>
          {hard && <p className="dr-source">You played with the numbers hidden.</p>}

          <button className="dr-cta" onClick={share}>Share the season</button>
          <button className="dr-quiet" onClick={onAnother}>Play another board{isPractice ? "" : " (practice)"}</button>
          {onBack && <button className="dr-quiet" onClick={onBack}>Back home</button>}
          <p className="dr-source">
            Positions are the ones each club’s season page gives. Squads, games and goals:
            English Wikipedia club-season articles, by Wikipedia contributors,{" "}
            <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">CC BY-SA 4.0</a>, checked by Ball IQ against the league table.
            A club’s own first eleven, put through this, lands within about four points of its real season.
          </p>
        </div>
      )}
    </div>
  );
}
