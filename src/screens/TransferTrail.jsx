// Transfer Trail — daily "name the player from their career" screen.
// Spec: docs/transfer-trail-spec-v2.md.
//
// The career is revealed chronologically, two clubs to open, one more per miss.
// v1 asked players to SORT a scrambled career instead; it was pulled the hour it
// shipped, because sorting is only deduction if you already know whose career it
// is — without recognition it is blind permutation. Naming the player is the
// genre convention and needs no tutorial.
//
// Only revealed clubs are drawn. No "?" placeholders for the rest: the LENGTH of
// a career is itself a clue — a six-club journeyman reads very differently from
// a three-club one-club-man — and handing that over free undoes the ladder.
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { dateToYMD } from "../lib/date.js";
import {
  TRAIL_MAX_ATTEMPTS,
  getTrailNumber,
  guessMatchesPlayer,
  cluesShown,
  hintFor,
  computeTrailStreak,
  buildTrailShareText,
} from "../lib/trail.js";
import { Confetti, haptic, CLUB_ABBR, CLUB_PACKS } from "../App.jsx";
import { clubColour, clubAbbr } from "../lib/clubColour.js";
/* Shares mysteryPool.json with Mystery Player ON PURPOSE. Vite hoists it into
   one chunk both modes use, so a player who does the dailies downloads it ONCE
   (661 KB gzip) instead of twice. A slim 4-field index was built and measured
   first: it cut a Trail-only visit 359 -> 206 KB, but pushed anyone playing
   BOTH dailies to 867 KB, and duplicated 784 KB into the native binary, which
   ships all of dist/. Neither chunk is preloaded — only react is — so this
   costs nothing at boot. */
import POOL from "../data/mysteryPool.json";
import { rankPlayerSuggestions, suggestionSubtitle } from "../lib/playerSearch.js";

function loadDay(ymd) {
  try {
    const raw = localStorage.getItem(`biq_trail_${ymd}`);
    if (!raw) return null;
    const p = JSON.parse(raw);
    return Array.isArray(p?.attempts) ? p : null;
  } catch { return null; }
}
function saveDay(ymd, state) {
  try { localStorage.setItem(`biq_trail_${ymd}`, JSON.stringify(state)); } catch {}
}

export default function TransferTrail({ player, date = new Date(), onBack, onReport }) {
  const ymd = dateToYMD(date);
  const number = getTrailNumber(date);
  const career = useMemo(() => player?.clubs || [], [player]);

  // Attempts are the raw submissions — { text, skipped } — and everything else
  // derives. Same store-inputs-not-derived-state rule as Footle, so a mid-game
  // reload rebuilds the exact board rather than trusting a cached verdict.
  const [attempts, setAttempts] = useState(() => loadDay(ymd)?.attempts || []);
  const [entry, setEntry] = useState("");
  const [shake, setShake] = useState(false);

  const won = attempts.some((a) => !a.skipped && guessMatchesPlayer(a.text, player));
  const misses = attempts.filter((a) => a.skipped || !guessMatchesPlayer(a.text, player)).length;
  const lost = !won && misses >= TRAIL_MAX_ATTEMPTS;
  const done = won || lost;

  const shown = done ? career.length : cluesShown(misses, career.length);
  const clubsUsed = won ? cluesShown(misses, career.length) : career.length;
  const hint = done ? null : hintFor(player, misses);
  const left = Math.max(0, TRAIL_MAX_ATTEMPTS - misses);

  useEffect(() => {
    // arc: archive plays are visible history but never streak fuel — the
    // walks in lib/trail.js break on it (same stamp as Footle and Mystery).
    saveDay(ymd, { status: won ? "won" : lost ? "lost" : "playing", attempts, ...(isArchive ? { arc: 1 } : {}) });
  }, [ymd, attempts, won, lost]);

  // Fire the shared daily-completed event exactly once. App.jsx listens and
  // cancels the evening reminder, awards XP and writes the `scores` row — a mode
  // that stays silent here is invisible in the only table anyone queries, which
  // is how Footle went months looking unplayed. Ref-guarded because the screen
  // re-mounts whenever you navigate back into a finished puzzle.
  const announced = useRef(false);
  // ⚠️ ARCHIVE PLAYS DO NOT COUNT. The Trail already accepted a `date`, but it
  // announced completion whichever day it was — so replaying an old puzzle
  // would have ticked today's streak and paid XP. That turns the archive into
  // a way to farm the streak, and a farmable streak stops meaning "I showed up
  // every day", which is the only reason it exists. The board still records
  // the solve; only the habit metrics are protected.
  const isArchive = ymd !== dateToYMD(new Date());
  useEffect(() => {
    if (!done || announced.current) return;
    announced.current = true;
    if (isArchive) return;
    try {
      window.dispatchEvent(new CustomEvent("biq:daily-completed", {
        detail: { positive: won, game: "trail", won, attempts: Math.max(1, misses) },
      }));
    } catch { /* best effort; never block the reveal */ }
  }, [done, won, misses, isArchive]);

  const submit = useCallback((skipped, explicit) => {
    if (done) return;
    // ⚠️ `explicit` exists because tapping a suggestion cannot go through
    // setEntry() first: this callback closes over `entry`, so it would read the
    // PREVIOUS keystroke's value and guess the wrong player. The tapped name is
    // passed straight in instead.
    const text = skipped ? "" : String(explicit ?? entry).trim();
    if (!skipped && !text) return;
    const hit = !skipped && guessMatchesPlayer(text, player);
    // ⚠️ iOS WKWebView: unmounting a FOCUSED input strands the keyboard on
    // screen and leaves the viewport in its keyboard-resized, scroll-locked
    // state (playtester report, 2026-08-11: "keyboard would not go away and
    // the app would not let him scroll"). This attempt ends the game exactly
    // when it's a hit or the final miss — blur BEFORE the state update
    // unmounts the input. Mid-game guesses keep focus for rapid re-guessing.
    const willEnd = hit || misses + 1 >= TRAIL_MAX_ATTEMPTS;
    if (willEnd) { try { document.activeElement?.blur?.(); } catch {} }
    setAttempts((a) => [...a, { text, skipped: !!skipped }]);
    setEntry("");
    if (hit) haptic("hardCorrect");
    else { haptic("wrong"); setShake(true); setTimeout(() => setShake(false), 420); }
  }, [done, entry, player, misses]);

  /* Name autocomplete, same ranker as Mystery Player (lib/playerSearch.js).
     Alex, after playing: "players type the first letter or two like mystery
     player and a list of suggestions comes up". It also removes the spelling
     tax — a Trail guess is limited, so losing an attempt to a mistyped
     "Szczesny" punishes typing rather than football knowledge.
     Already-guessed players are filtered out for the same reason Mystery does
     it: re-offering a name you have spent is a wasted tap on a limited board. */
  const guessedNames = useMemo(
    () => new Set(attempts.filter((a) => !a.skipped).map((a) => a.text.toLowerCase().trim())),
    [attempts],
  );
  const suggestions = useMemo(
    () => rankPlayerSuggestions(POOL, entry, { limit: 6 })
      .filter((p) => !guessedNames.has(p.name.toLowerCase())),
    [entry, guessedNames],
  );

  const streak = useMemo(() => (won ? computeTrailStreak(date) : 0), [won, date]);
  const [reportSent, setReportSent] = useState(false);
  const shareText = useMemo(
    () => (done ? buildTrailShareText({ number, won, clubsUsed, streak }) : ""),
    [done, number, won, clubsUsed, streak]
  );
  const onShare = useCallback(async () => {
    if (!shareText) return;
    try { if (navigator.share) { await navigator.share({ text: shareText }); return; } } catch { return; }
    try {
      await navigator.clipboard.writeText(shareText);
      window.dispatchEvent(new CustomEvent("biq:show-toast", { detail: "📋 Copied — paste it anywhere" }));
    } catch {}
  }, [shareText]);

  // Unrouted or a bad day index: land somewhere real rather than on a blank board.
  if (!career.length) {
    return (
      <div className="screen" style={{ padding: 24, textAlign: "center" }}>
        <button className="back-btn" onClick={onBack} aria-label="Back">←</button>
        <div style={{ marginTop: 60, fontSize: 20, fontWeight: 800, color: "var(--t1)" }}>Transfer Trail</div>
        <div style={{ fontSize: 14, color: "var(--t2)", marginTop: 8 }}>Coming soon — a new career to name every day.</div>
      </div>
    );
  }

  const wrongOnes = attempts.filter((a) => !a.skipped && !guessMatchesPlayer(a.text, player));

  // Club identity on the ladder, mirroring the Club Quiz rows. CLUB_PACKS
  // carries {name, color}; the resolver handles the fact that careers say
  // "Man Utd" where the packs say "Man United".
  const packColours = Object.fromEntries(Object.values(CLUB_PACKS).map((p) => [p.name, p.color]));
  const tint = (hex, a) => {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  };
  // Every black-and-white side carries #111111 (Juventus, Santos, Botafogo,
  // Atlético Mineiro). At 30% alpha on a dark card that is invisible, so those
  // rungs looked uncoloured even though the lookup had succeeded — which is how
  // Gilberto Silva's real América-MG → Atlético-MG move read as one club twice.
  // Lift ONLY the value used for the card tint and border. The badge keeps the
  // true club colour, where black with white type is authentic and legible.
  const lift = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    if ((0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 >= 0.18) return hex;
    const mix = (c) => Math.round(c + (255 - c) * 0.55);
    return `#${[mix(r), mix(g), mix(b)].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
  };
  const onColour = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    const f = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
      const v = c / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2] > 0.42 ? "#14181F" : "#FFFFFF";
  };

  return (
    <div className="screen" style={{ display: "flex", flexDirection: "column", minHeight: "100%", paddingBottom: 20, maxWidth: 640, marginLeft: "auto", marginRight: "auto", width: "100%" }}>
      {won && Confetti ? <Confetti /> : null}

      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 4px" }}>
        <button className="back-btn" onClick={onBack} aria-label="Back">←</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--t1)" }}>
            Transfer Trail{number > 0 ? ` #${number}` : ""}
          </div>
          <div style={{ fontSize: 12.5, color: "var(--t2)" }}>
            {done ? (won ? "Solved" : "Not this time") : "Name the player from their career"}
          </div>
        </div>
        {!done && (
          <div style={{ textAlign: "center", flexShrink: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: left <= 1 ? "var(--red)" : "var(--t1)" }}>{left}</div>
            <div style={{ fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--t3)" }}>left</div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 7, padding: "6px 2px" }}>
        {career.slice(0, shown).map((club, i) => {
          const col = clubColour(club, packColours);
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 11,
              background: col ? `linear-gradient(90deg, ${tint(lift(col), 0.3)} 0%, ${tint(lift(col), 0.05)} 100%)` : "var(--s1)",
              border: `1px solid ${col ? tint(lift(col), 0.45) : "var(--border)"}`,
              borderRadius: 12, padding: "12px 14px",
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--t3)", width: 12, flexShrink: 0 }}>{i + 1}</span>
              <span aria-hidden="true" style={{
                width: 30, height: 30, flexShrink: 0, borderRadius: 9,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 800, letterSpacing: "0.02em",
                background: col || "var(--s3)", color: col ? onColour(col) : "var(--t3)",
              }}>{clubAbbr(club, CLUB_ABBR)}</span>
              <span style={{ fontSize: 15.5, fontWeight: 700, color: "var(--t1)", flex: 1, minWidth: 0 }}>{club}</span>
              {player.loans?.[i] && (
                <span style={{ fontSize: 10.5, color: "var(--gold)", fontWeight: 700, flexShrink: 0 }}>loan</span>
              )}
            </div>
          );
        })}
      </div>

      {hint && (
        <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 11,
                      background: "rgba(255,193,7,0.10)", border: "1px solid rgba(255,193,7,0.3)",
                      color: "var(--gold)", fontSize: 13, fontWeight: 700 }}>
          {hint}
        </div>
      )}

      {wrongOnes.length > 0 && !done && (
        <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
          {wrongOnes.map((a, i) => (
            <span key={i} style={{ fontSize: 12.5, color: "var(--t3)", textDecoration: "line-through",
                                   background: "var(--s2)", borderRadius: 8, padding: "4px 9px" }}>{a.text}</span>
          ))}
        </div>
      )}

      {!done && (
        <>
          <div style={{ position: "relative", marginTop: 14, display: "flex", gap: 8,
                        transform: shake ? "translateX(-4px)" : "none", transition: "transform .12s" }}>
            <input
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submit(false); }}
              placeholder="Type a surname…"
              aria-label="Your guess"
              autoCapitalize="words" autoCorrect="off" autoComplete="off" spellCheck={false}
              enterKeyHint="go"
              style={{ flex: 1, minWidth: 0, background: "var(--s1)", border: "1px solid var(--border)",
                       borderRadius: 12, padding: "13px 15px", color: "var(--t1)", fontSize: 16,
                       fontFamily: "inherit", outline: "none" }}
            />
            <button onClick={() => submit(false)} disabled={!entry.trim()}
              style={{ flexShrink: 0, padding: "0 20px", borderRadius: 12, border: "none",
                       background: entry.trim() ? "var(--accent)" : "var(--s2)",
                       color: entry.trim() ? "#06230C" : "var(--t3)", fontWeight: 800, fontSize: 14,
                       fontFamily: "inherit", cursor: entry.trim() ? "pointer" : "default" }}>Guess</button>
            {suggestions.length > 0 && (
              <div style={{ position: "absolute", left: 0, right: 0, top: "100%", zIndex: 20, marginTop: 6,
                            background: "var(--s2)", border: "1px solid var(--border)", borderRadius: 14,
                            overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
                {suggestions.map((p) => (
                  <button key={p.id} type="button" onClick={() => submit(false, p.name)}
                    style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2,
                             width: "100%", padding: "9px 14px", background: "none", border: "none",
                             borderBottom: "1px solid var(--border)", color: "var(--t1)", cursor: "pointer",
                             fontFamily: "inherit", textAlign: "left" }}>
                    <span style={{ fontSize: 14.5, fontWeight: 700 }}>{p.name}</span>
                    <span style={{ fontSize: 11.5, color: "var(--t3)", fontWeight: 600, maxWidth: "100%",
                                   whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {suggestionSubtitle(p)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => submit(true)}
            style={{ marginTop: 8, width: "100%", background: "transparent", border: "1px solid var(--border)",
                     borderRadius: 11, padding: "10px", color: "var(--t2)", fontSize: 13, fontWeight: 700,
                     fontFamily: "inherit", cursor: "pointer" }}>
            Skip — show me another club
          </button>
        </>
      )}

      {done && (
        <div style={{ marginTop: 18, textAlign: "center" }}>
          <div style={{ fontSize: 13, color: "var(--t2)" }}>It was</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "var(--t1)", marginTop: 2 }}>
            {(player.display || []).join(" ")}
          </div>
          <div style={{ fontSize: 13, color: "var(--t2)", marginTop: 6 }}>
            {won
              // ⚠️ Archive plays deliberately do NOT tick the streak (see the
              // effect above, which returns early when isArchive), so claiming
              // one here would credit the player for something that did not
              // happen. Same class as "back tomorrow" on a puzzle from the past.
              ? `Got it on ${clubsUsed} club${clubsUsed === 1 ? "" : "s"}${!isArchive && streak > 1 ? ` · 🔥 ${streak}-day streak` : ""}`
              : isArchive
                ? "Out of guesses — that one's in the books"
                : "Out of guesses — back tomorrow"}
          </div>
          <button onClick={onShare}
            style={{ marginTop: 16, width: "100%", padding: "14px", borderRadius: 999, border: "none",
                     background: "var(--accent)", color: "#06230C", fontWeight: 800, fontSize: 15,
                     fontFamily: "inherit", cursor: "pointer" }}>Share result</button>
          {/* A wrong career order is UNFALSIFIABLE to the player — they cannot
              tell a puzzle they misread from data we got wrong, so without this
              they simply lose trust and say nothing. Same trust class as a wrong
              answer key. Sends the full ladder so the row is actionable. */}
          {onReport && (
            <button
              type="button"
              disabled={reportSent}
              onClick={() => {
                if (reportSent) return;
                onReport({
                  id: `trail:${player.key}`,
                  q: `Transfer Trail #${number} — ${(player.display || []).join(" ")}: ${career.join(" → ")}`,
                  picked: null,
                  correct: (player.display || []).join(" "),
                  mode: "trail",
                });
                setReportSent(true);
              }}
              style={{ marginTop: 8, width: "100%", padding: "12px", borderRadius: 999,
                       border: "1px solid var(--border)", background: "transparent",
                       color: reportSent ? "var(--accent)" : "var(--t2)",
                       fontWeight: 700, fontSize: 13, fontFamily: "inherit",
                       cursor: reportSent ? "default" : "pointer" }}>
              {reportSent ? "✓ Reported — thanks" : "⚑ Career looks wrong? Tell us"}
            </button>
          )}
          <button onClick={onBack}
            style={{ marginTop: 8, width: "100%", padding: "12px", borderRadius: 999,
                     border: "1px solid var(--border)", background: "transparent", color: "var(--t2)",
                     fontWeight: 700, fontSize: 14, fontFamily: "inherit", cursor: "pointer" }}>Back home</button>
        </div>
      )}
    </div>
  );
}
