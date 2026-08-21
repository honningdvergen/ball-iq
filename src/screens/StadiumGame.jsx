import React, { useEffect, useMemo, useRef, useState } from "react";
import { STADIUM_LEAGUES, matchStadium } from "../data/stadiums.js";
import { Confetti, haptic } from "../App.jsx";

// Stadiums — a Sporcle-style completion run: name every ground in the league.
// Alex's design (2026-08-20): start cold with just a counter; the FIRST hint
// reveals which clubs you're missing (alphabetical), and after that each
// unsolved row can reveal its stadium's letters one at a time. Finishing the
// set is the win; hints only shade the bragging rights, they never block the
// finish. Not a daily — the set changes once a season, not once a day.
//
// Matching is Sporcle-style too: one input, every keystroke is checked
// against every unsolved ground (alias-aware), so you never pick a row
// before answering — you just empty your head into the box.

const KEY_PREFIX = "biq_stadiums_v1_";

function loadState(leagueId) {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + leagueId);
    if (raw) {
      const p = JSON.parse(raw);
      if (p && typeof p === "object") return p;
    }
  } catch { /* fresh run */ }
  return { solved: [], clubsRevealed: false, letters: {}, gaveUp: false };
}

function saveState(leagueId, state) {
  try { localStorage.setItem(KEY_PREFIX + leagueId, JSON.stringify(state)); } catch {}
}

// Masked display: revealed letters stay letters, everything else becomes a
// dot — but spaces survive, so "······ ·····" still telegraphs word shape,
// which is itself part of the fun.
function mask(stadium, n) {
  let shown = 0;
  return [...stadium].map((ch) => {
    if (ch === " ") return " ";
    shown += 1;
    return shown <= n ? ch : "·";
  }).join("");
}

export default function StadiumGame({ onExit }) {
  // League picker first — five leagues now, and a Board keyed by league.id
  // below so every hook re-initialises cleanly when the league changes.
  const [leagueId, setLeagueId] = useState(null);
  const league = STADIUM_LEAGUES.find((l) => l.id === leagueId) || null;
  if (!league) {
    return (
      <div style={{ minHeight: "100dvh", padding: "16px 16px 32px", maxWidth: 560, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <button className="back-btn" onClick={onExit} aria-label="Back">←</button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.4px", color: "var(--text)" }}>Name the Stadium</div>
            <div style={{ fontSize: 12.5, color: "var(--t2)" }}>Pick a league — name every ground</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {STADIUM_LEAGUES.map((l) => {
            const saved = loadState(l.id);
            const solvedN = (saved.solved || []).length;
            const done = !saved.gaveUp && solvedN === l.clubs.length;
            return (
              <button key={l.id} onClick={() => { haptic("select"); setLeagueId(l.id); }}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px", borderRadius: 13,
                  background: done ? "rgba(88,204,2,0.08)" : "var(--s2)",
                  border: `1px solid ${done ? "rgba(88,204,2,0.35)" : "var(--border)"}`,
                  color: "var(--text)", fontFamily: "inherit", cursor: "pointer", textAlign: "left" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15.5, fontWeight: 800 }}>{l.name}</div>
                  <div style={{ fontSize: 12, color: "var(--t2)" }}>{l.season}</div>
                </div>
                <span className="numeric-mono" style={{ fontSize: 13.5, fontWeight: 700, color: done ? "var(--accent)" : "var(--t2)" }}>
                  {done ? "✓ " : ""}{saved.gaveUp ? solvedN : solvedN}/{l.clubs.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }
  return <StadiumBoard key={league.id} league={league} onExit={() => setLeagueId(null)} />;
}

function StadiumBoard({ league, onExit }) {
  const total = league.clubs.length;
  const [state, setState] = useState(() => loadState(league.id));
  const [text, setText] = useState("");
  const [shake, setShake] = useState(false);
  const [justSolved, setJustSolved] = useState(null);
  const inputRef = useRef(null);
  const solvedSet = useMemo(() => new Set(state.solved), [state.solved]);
  const done = solvedSet.size === total;
  const hintsUsed = (state.clubsRevealed ? 1 : 0)
    + Object.values(state.letters || {}).reduce((a, b) => a + b, 0);

  useEffect(() => { saveState(league.id, state); }, [league.id, state]);

  // ⚠️ The board is a LONG list under an always-focused input, so the software
  // keyboard covers its tail and the page has nothing left to scroll into —
  // the last grounds are simply unreachable (player-reported 2026-08-21: "you
  // can not scroll further down, the keyboard is blocking the list"). The page
  // cannot know the keyboard's height, but visualViewport does: the gap
  // between it and the layout viewport IS the keyboard. Pad the container by
  // exactly that so the final row can always be scrolled clear, and drop back
  // to 0 the moment it closes. Sibling bug to the Transfer Trail one, opposite
  // mechanism — there the input was pushed down, here the content below it
  // cannot come up.
  const [kbInset, setKbInset] = useState(0);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const sync = () => {
      const gap = window.innerHeight - vv.height - (vv.offsetTop || 0);
      setKbInset(gap > 80 ? Math.round(gap) : 0);
    };
    sync();
    vv.addEventListener("resize", sync);
    vv.addEventListener("scroll", sync);
    return () => { vv.removeEventListener("resize", sync); vv.removeEventListener("scroll", sync); };
  }, []);

  // Alphabetical board — Alex's spec: the club-list hint shows the table
  // alphabetically. Solved rows float within the same order so the board
  // reads as one stable list, not a shuffle.
  const rows = useMemo(
    () => [...league.clubs].sort((a, b) => a.club.localeCompare(b.club)),
    [league],
  );

  const finish = (nextSolved, gaveUp) => {
    if (gaveUp) haptic("wrong");
    else haptic("hardCorrect");
    try {
      window.dispatchEvent(new CustomEvent("biq:stadiums-completed", {
        detail: { league: league.id, solved: nextSolved.length, total, hints: hintsUsed, gaveUp },
      }));
    } catch { /* celebration is best-effort */ }
  };

  // ⚠️ finish() fires ONLY on a full sweep or an explicit give-up, so a player
  // who names 12 of 20 and closes the app was completely invisible — Stadiums
  // had zero rows anywhere all-time despite shipping to five leagues. That is
  // how you end up shipping modes you cannot measure.
  // Abandonment goes to funnel_events rather than `scores` on purpose: a
  // partial run is not a score, and writing it as one would quietly skew every
  // average built on that table.
  const progressRef = useRef({ solved: 0, hints: 0, done: false });
  progressRef.current = { solved: solvedSet.size, hints: hintsUsed, done: done || state.gaveUp };
  useEffect(() => () => {
    const p = progressRef.current;
    if (p.done || p.solved === 0) return; // finished runs already report; untouched boards are noise
    try {
      window.dispatchEvent(new CustomEvent("biq:stadiums-exit", {
        detail: { league: league.id, solved: p.solved, total, hints: p.hints },
      }));
    } catch { /* telemetry must never block an exit */ }
  }, [league.id, total]);

  const onType = (v) => {
    setText(v);
    const hit = matchStadium(league, v, solvedSet);
    if (!hit) return;
    const nextSolved = [...state.solved, hit];
    setState((s) => ({ ...s, solved: nextSolved }));
    setText("");
    setJustSolved(hit);
    setTimeout(() => setJustSolved(null), 900);
    if (nextSolved.length === total) finish(nextSolved, false);
    else haptic("correct");
  };

  const onEnter = (e) => {
    if (e.key !== "Enter") return;
    // Enter with no match = the "that's not it" beat; matches land on
    // keystroke so Enter only ever means a miss.
    if (text.trim()) { haptic("wrong"); setShake(true); setTimeout(() => setShake(false), 420); }
  };

  const revealClubs = () => { haptic("select"); setState((s) => ({ ...s, clubsRevealed: true })); };
  const revealLetter = (club) => {
    haptic("select");
    setState((s) => ({ ...s, letters: { ...s.letters, [club]: (s.letters?.[club] || 0) + 1 } }));
  };
  const giveUp = () => {
    const nextSolved = league.clubs.map((c) => c.club);
    setState((s) => ({ ...s, gaveUp: true, solved: nextSolved }));
    finish(state.solved, true);
  };

  const share = async () => {
    const line = state.gaveUp
      ? `🏟️ ${league.name} grounds — I got ${state.solved.length}/${total} on Ball IQ`
      : `🏟️ I named all ${total} ${league.name} grounds on Ball IQ — ${hintsUsed === 0 ? "no hints" : `${hintsUsed} hint${hintsUsed === 1 ? "" : "s"}`}`;
    const url = "https://balliq.app/play";
    try {
      if (navigator.share) { await navigator.share({ text: `${line}\n${url}` }); return; }
    } catch { /* fall through to clipboard */ }
    try {
      await navigator.clipboard.writeText(`${line}\n${url}`);
      window.dispatchEvent(new CustomEvent("biq:show-toast", { detail: "Copied — paste it anywhere" }));
    } catch {}
  };

  const resetRun = () => {
    setState({ solved: [], clubsRevealed: false, letters: {}, gaveUp: false });
    setText("");
    try { inputRef.current?.focus(); } catch {}
  };

  return (
    <div style={{ minHeight: "100dvh", padding: "16px 16px 32px", paddingBottom: 32 + kbInset, maxWidth: 560, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <button className="back-btn" onClick={onExit} aria-label="Back">←</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.4px", color: "var(--text)" }}>Name the Stadium</div>
          <div style={{ fontSize: 12.5, color: "var(--t2)" }}>{league.name} · {league.season}</div>
        </div>
        <div className="numeric-mono" aria-live="polite" style={{ fontSize: 16, fontWeight: 700, color: solvedSet.size === total ? "var(--accent)" : "var(--t2)" }}>
          {state.gaveUp ? state.solved.length : solvedSet.size}/{total}
        </div>
      </div>

      {!done && (
        <>
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => onType(e.target.value)}
            onKeyDown={onEnter}
            placeholder="Type any stadium…"
            autoFocus
            autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false"
            aria-label="Type a stadium name"
            style={{
              width: "100%", padding: "13px 14px", marginTop: 10, borderRadius: 13,
              background: "var(--s2)", border: "1.5px solid var(--border)", color: "var(--text)",
              fontFamily: "inherit", fontSize: 16, fontWeight: 600, outline: "none",
              transform: shake ? "translateX(-4px)" : "none", transition: "transform .12s",
            }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
            {!state.clubsRevealed && (
              <button onClick={revealClubs}
                style={{ padding: "9px 14px", borderRadius: 11, background: "var(--s2)", border: "1px solid var(--border)", color: "var(--text)", fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                💡 Show the clubs
              </button>
            )}
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 12, color: "var(--t3, var(--t2))" }}>{hintsUsed === 0 ? "No hints yet" : `${hintsUsed} hint${hintsUsed === 1 ? "" : "s"}`}</span>
          </div>
        </>
      )}

      {done && (
        <div style={{ marginTop: 12, borderRadius: 16, padding: "18px 16px", textAlign: "center", background: state.gaveUp ? "var(--s2)" : "rgba(88,204,2,0.08)", border: `1px solid ${state.gaveUp ? "var(--border)" : "rgba(88,204,2,0.35)"}` }}>
          {!state.gaveUp && Confetti ? <Confetti /> : null}
          <div style={{ fontSize: 19, fontWeight: 900, color: "var(--text)" }}>
            {state.gaveUp ? "The full list — for next time" : hintsUsed === 0 ? "🏟️ Clean sweep — no hints!" : "🏟️ Every ground named!"}
          </div>
          <div style={{ fontSize: 13.5, color: "var(--t2)", marginTop: 5 }}>
            {state.gaveUp
              ? "It stays on the board below — one read and you'll get more of them next run."
              : `All ${total} ${league.name} grounds${hintsUsed > 0 ? ` · ${hintsUsed} hint${hintsUsed === 1 ? "" : "s"}` : ""}.`}
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 14, flexWrap: "wrap" }}>
            {!state.gaveUp && (
              <button onClick={share} style={{ padding: "12px 22px", borderRadius: 12, background: "var(--accent)", border: "none", color: "#0a1a00", fontFamily: "inherit", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>
                Share result
              </button>
            )}
            <button onClick={resetRun} style={{ padding: "12px 18px", borderRadius: 12, background: "var(--s2)", border: "1px solid var(--border)", color: "var(--text)", fontFamily: "inherit", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              Run it again
            </button>
          </div>
        </div>
      )}

      {/* ⚠️ The board used to render all 20 rows as "•••" from the first frame:
          twenty identical featureless bars, no club, no letters, nothing to
          read (player-reported 2026-08-21: "this looks terrible"). It also
          leaked nothing useful, so it was pure noise — and it pushed the real
          content off-screen under the keyboard. Until the club table is
          unlocked the board now shows only what you have actually NAMED, so it
          fills as you play; "Show the clubs" still expands the full scaffold
          with its per-row letter hints, and giving up reveals everything. The
          hint ladder is unchanged — this only stops drawing empty rows. */}
      {!state.clubsRevealed && !done && solvedSet.size === 0 && (
        <div style={{ marginTop: 18, padding: "22px 18px", borderRadius: 14, textAlign: "center",
                      background: "var(--s2)", border: "1px dashed var(--border)" }}>
          <div style={{ fontSize: 14.5, fontWeight: 800, color: "var(--text)" }}>
            {total} grounds to name
          </div>
          <div style={{ fontSize: 13, color: "var(--t2)", marginTop: 6, lineHeight: 1.5 }}>
            Type any {league.name} ground — they land here as you get them.
            Stuck? Show the clubs.
          </div>
        </div>
      )}

      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 7 }}>
        {(state.clubsRevealed || done ? rows : rows.filter((c) => solvedSet.has(c.club))).map((c) => {
          const isSolved = solvedSet.has(c.club);
          const letters = state.letters?.[c.club] || 0;
          const flash = justSolved === c.club;
          return (
            <div key={c.club} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
              borderRadius: 11, minHeight: 44,
              background: isSolved ? (state.gaveUp && !flash ? "var(--s2)" : "rgba(88,204,2,0.10)") : "var(--s2)",
              border: `1px solid ${isSolved && !state.gaveUp ? "rgba(88,204,2,0.35)" : "var(--border)"}`,
              transition: "background .25s, border-color .25s",
            }}>
              <div style={{ flex: "0 0 40%", minWidth: 0, fontSize: 13.5, fontWeight: 700, color: "var(--t2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {isSolved || state.clubsRevealed ? c.club : "•••"}
              </div>
              <div style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 800, color: isSolved ? "var(--text)" : "var(--t2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: isSolved ? 0 : "1px" }}>
                {isSolved ? c.stadium : (letters > 0 ? mask(c.stadium, letters) : "")}
              </div>
              {!isSolved && state.clubsRevealed && (
                <button onClick={() => revealLetter(c.club)} aria-label={`Reveal a letter of ${c.club}'s stadium`}
                  style={{ flexShrink: 0, padding: "6px 10px", borderRadius: 9, background: "transparent", border: "1px solid var(--border)", color: "var(--t2)", fontFamily: "inherit", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  A…
                </button>
              )}
            </div>
          );
        })}
      </div>

      {!done && (
        <button onClick={giveUp}
          style={{ marginTop: 16, width: "100%", padding: 12, borderRadius: 12, background: "transparent", border: "1px solid var(--border)", color: "var(--t2)", fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          Show me the answers
        </button>
      )}
    </div>
  );
}
