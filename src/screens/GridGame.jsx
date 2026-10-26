// Tiki Taka Toe — the football grid. Three clubs down, three across; for each
// cell, name a player who played for both. Nine guesses for nine cells.
//
// Built on the same seams as Draft and Top 10: no import from App.jsx, services
// arrive as a prop, and every data file is import()ed by this screen, so none
// of it weighs on Home:
//   - the frozen schedule and the header table when the screen opens (small);
//   - the answer pool (gridPool.json) and the names (mysteryPool.json, the
//     chunk Mystery Player and Top 10 already share) on the first tap of a
//     cell, or when a finished board needs its example answers.
//
// Everything that decides anything is in lib/grid.js (the board for a day, the
// judge, what is saved and whether it can be trusted). This file draws what it
// returns: the repo has no DOM test environment, so a rule written in here is a
// rule no test can hold.
//
// ⚠️ A RIGHT PLAYER IS NEVER TOLD HE IS WRONG. Our career data is a curated
// subset of football, so a guess we cannot confirm says exactly that (see the
// note at the top of lib/grid.js). The copy is grid.unconfirmed; keep it a
// statement about our record, never about the player.
//
// ⚠️ HIDDEN (GRID_LIVE, lib/grid.js). Reachable by /play?game=grid only, until
// Alex has played it.
import GameTitle from "../components/GameTitle.jsx";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { dayIndexForDate } from "../lib/date.js";
import {
  GRID, GRID_GUESSES, gridForDay, toJudgePool, judgePick, judgeTyped, cellAnswers,
  freshGrid, gridOver, loadGrid, saveGrid, pruneGrids, buildGridShareText,
} from "../lib/grid.js";
import { resolveDailyServices } from "../games/dailyServices.js";
import { usePlayerPool } from "../lib/usePlayerPool.js";
import { rankPlayerSuggestions, suggestionSubtitle, SUGGEST_MAX } from "../lib/playerSearch.js";
import { useKeyboardAwareInput, useDropdownMaxHeight } from "../lib/useKeyboardAwareInput.js";
import { lift, onColour } from "../lib/colourMath.js";
import { t as tNow, useT } from "../i18n/index.js";
import "../i18n/en.js"; // the full English table: not on Home's eager path
import "./grid.css";

// The mode's colour, here and on the share card (lib/shareCardV2.js). Not in
// lib/accents.js while the mode is hidden: that file is on Home's eager path.
const SKIN = { "--gr": "#5FD39A", "--gr-rgb": "95,211,154" };

function useBoardData() {
  const [state, setState] = useState({ D: null, failed: false });
  useEffect(() => {
    let live = true;
    Promise.all([import("../data/gridSchedule.json"), import("../data/gridHeaders.json")])
      .then(([s, h]) => { if (live) setState({ D: { schedule: s.default || s, headers: h.default || h }, failed: false }); })
      .catch(() => { if (live) setState({ D: null, failed: true }); });
    return () => { live = false; };
  }, []);
  return state;
}

// The judge's pool: the curated careers plus the names. Asked for, not loaded
// with the screen (see the note at the top).
function useJudgePool() {
  const { pool: names, ready, ensure: ensureNames } = usePlayerPool();
  const [careers, setCareers] = useState(null);
  const inflight = useRef(null);
  const ensure = useCallback(() => {
    ensureNames();
    if (!inflight.current) {
      inflight.current = import("../data/gridPool.json")
        .then((m) => setCareers(m.default || m))
        .catch(() => { inflight.current = null; });
    }
  }, [ensureNames]);
  const pool = useMemo(() => (ready && careers ? toJudgePool(careers, names) : null), [ready, careers, names]);
  return { pool, ensure };
}

export default function GridGame({ date, onBack, services }) {
  const t = useT();
  const { D, failed } = useBoardData();
  // The day is read ONCE, when the screen opens: a board being played as the
  // clock passes midnight is finished on the board it started on.
  const [today] = useState(() => dayIndexForDate(date || new Date()));
  useEffect(() => { pruneGrids(today); }, [today]);
  const board = useMemo(() => (D ? gridForDay(D.schedule, today) : null), [D, today]);

  if (!D || !board) {
    return (
      <div className="screen gr" style={SKIN} aria-busy={!D && !failed}>
        <Head onBack={onBack} />
        <p className="gr-empty">{failed ? t("grid.loadFail") : D ? t("grid.noBoard") : t("grid.loading")}</p>
      </div>
    );
  }
  return <Board key={today} day={today} board={board} headers={D.headers} onBack={onBack} services={services} />;
}

function Head({ no, sub, onBack }) {
  const t = useT();
  return (
    <div className="gr-head">
      {onBack && <button className="back-btn" onClick={onBack} aria-label={t("game.back")}>←</button>}
      <div style={{ flex: 1, minWidth: 0 }}>
        <GameTitle no={no}>Tiki Taka Toe</GameTitle>
        {sub ? <div className="gr-head-sub">{sub}</div> : null}
      </div>
    </div>
  );
}

// A header: the club's letters on its colour, the short name under them.
// Text only: no crests, no photos.
function Badge({ club, headers, axis }) {
  const h = headers[club] || { s: club, a: club.slice(0, 3).toUpperCase(), h: null };
  const style = h.h ? { background: h.h, color: onColour(h.h), borderColor: lift(h.h) } : undefined;
  return (
    <div className={`gr-badge is-${axis}`}>
      <span className={`gr-mono${h.h ? "" : " is-plain"}`} style={style} aria-hidden="true">{h.a}</span>
      <span className="gr-club">{h.s}</span>
    </div>
  );
}

function Board({ day, board, headers, onBack, services }) {
  const t = useT();
  const { haptic, playSound, Confetti, shareCard } = resolveDailyServices(services);
  const { pool, ensure } = useJudgePool();
  const [g, setG] = useState(() => loadGrid(day) || freshGrid());
  useEffect(() => { saveGrid(day, g); }, [day, g]);
  const over = gridOver(g);
  const solved = g.cells.filter(Boolean).length;
  const short = (club) => headers[club]?.s || club;

  const [sel, setSel] = useState(null);
  const [entry, setEntry] = useState("");
  const [said, setSaid] = useState(null);
  const [giving, setGiving] = useState(false);
  const saidN = useRef(0);
  const say = (tone, text) => { saidN.current += 1; setSaid({ tone, text, n: saidN.current }); };
  // A finished board shows an example answer for every cell, so it needs the pool.
  useEffect(() => { if (over) ensure(); }, [over, ensure]);
  const wasOver = useRef(over);

  const used = useMemo(() => new Set(g.cells.filter(Boolean).map((c) => c.id)), [g.cells]);
  const suggestions = useMemo(() => {
    if (over || sel == null || !pool) return [];
    return rankPlayerSuggestions(pool.index, entry, { limit: SUGGEST_MAX, exclude: used })
      .map((p) => ({ key: p.id, p, name: p.name, sub: suggestionSubtitle(p) }));
  }, [over, sel, pool, entry, used]);

  const { inputRef, keepInputVisible, kbInset } = useKeyboardAwareInput();
  const entryRef = useRef(null);
  const dropMax = useDropdownMaxHeight(entryRef, { kbInset });
  useEffect(() => (sel == null ? undefined : keepInputVisible()), [sel, said, keepInputVisible]);

  const open = (i) => {
    if (over || g.cells[i]) return;
    ensure();
    haptic("soft");
    setSel(i === sel ? null : i);
    setEntry("");
    setSaid(null);
    setGiving(false);
    if (i !== sel) setTimeout(() => { try { inputRef.current?.focus({ preventScroll: true }); } catch { /* no focus */ } }, 0);
  };

  // One guess: a suggestion picked (we know who) or typed text (we resolve it).
  const guess = useCallback((picked) => {
    if (over || sel == null) return;
    if (!pool) { say("info", tNow("grid.loadingPool")); return; }
    const row = board.rows[Math.floor(sel / 3)], col = board.cols[sel % 3];
    const r = picked ? judgePick(pool, picked, row, col) : judgeTyped(pool, entry, row, col);
    const names = { row: short(row), col: short(col) };
    if (r.result === GRID.UNKNOWN) { say("info", tNow("grid.unknown")); return; }
    if (r.result === GRID.AMBIGUOUS) { say("info", tNow("grid.ambiguous")); return; }
    if (used.has(r.player.id)) { say("info", tNow("grid.used", { name: r.player.name })); return; }
    // A guess that resolves to a player costs one of the nine, either way.
    setEntry("");
    if (r.result === GRID.CORRECT) {
      haptic("hardCorrect"); playSound("correct");
      const at = sel;
      setG((cur) => ({ ...cur, left: cur.left - 1, cells: cur.cells.map((c, i) => (i === at ? { id: r.player.id, name: r.player.name } : c)) }));
      setSel(null);
      say("ok", tNow("grid.correct", { name: r.player.name, ...names }));
    } else {
      haptic("soft");
      setG((cur) => ({ ...cur, left: cur.left - 1 }));
      say("info", tNow("grid.unconfirmed", { name: r.player.name, ...names }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [over, sel, pool, board, entry, used, haptic, playSound]);

  // Blur BEFORE the input leaves the page, or iOS keeps the keyboard up and
  // the page scroll-locked (see TransferTrail.jsx).
  useEffect(() => {
    if (!over || wasOver.current) return;
    wasOver.current = true;
    try { document.activeElement?.blur?.(); } catch { /* nothing focused */ }
    setSel(null);
    haptic(solved >= 6 ? "hardCorrect" : "soft");
  }, [over, solved, haptic]);

  // An example answer per cell for the finished board: the best-known player
  // we would have accepted there, other than the one the player named.
  const examples = useMemo(() => {
    if (!over || !pool) return null;
    return g.cells.map((c, i) => {
      const all = cellAnswers(pool, board.rows[Math.floor(i / 3)], board.cols[i % 3]);
      return (all.find((p) => p.id !== c?.id) || all[0] || null)?.name || null;
    });
  }, [over, pool, g.cells, board]);

  const share = useCallback(async () => {
    const text = buildGridShareText({
      cells: g.cells,
      head: tNow("share.gridHead", { n: board.number, solved }),
      url: tNow("share.gridUrl"),
    });
    if (shareCard) {
      const toast = (m) => window.dispatchEvent(new CustomEvent("biq:show-toast", { detail: m }));
      await shareCard("grid", { num: board.number, cells: g.cells.map(Boolean), deepLink: "/play?game=grid" }, { textFallback: text, onToast: toast });
      return;
    }
    try { if (navigator.share) { await navigator.share({ text }); return; } } catch { return; }
    try {
      await navigator.clipboard.writeText(text);
      window.dispatchEvent(new CustomEvent("biq:show-toast", { detail: tNow("share.pasteAnywhere") }));
    } catch { /* nothing to copy to */ }
  }, [g.cells, board.number, solved, shareCard]);

  const selRow = sel == null ? null : board.rows[Math.floor(sel / 3)];
  const selCol = sel == null ? null : board.cols[sel % 3];

  return (
    <div className={`screen gr${over ? " is-done" : ""}`} style={SKIN}>
      {over && solved === 9 && Confetti ? <Confetti /> : null}
      <Head no={board.number} onBack={onBack}
        sub={over ? t("grid.doneSub", { n: solved }) : t("grid.sub")} />

      {!over && (
        <div className="gr-left" role="img" aria-label={t("game.left", { count: g.left })}>
          <span className="gr-pips" aria-hidden="true">
            {Array.from({ length: GRID_GUESSES }, (_, i) => <i key={i} className={i < g.left ? "is-on" : undefined} />)}
          </span>
          <span className="gr-left-n" aria-hidden="true">{t("game.left", { count: g.left })}</span>
        </div>
      )}

      {!over && sel != null && (
        <div className="gr-ask">
          <div className="gr-ask-q">{t("grid.ask", { row: short(selRow), col: short(selCol) })}</div>
          <div ref={entryRef} className="gr-entry">
            <input
              ref={inputRef}
              className="gr-input"
              value={entry}
              onFocus={ensure}
              onChange={(e) => setEntry(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { if (suggestions[0]) guess(suggestions[0].p); else if (entry.trim()) guess(null); } }}
              placeholder={t("game.typePlayer")}
              aria-label={t("grid.inputAria", { row: short(selRow), col: short(selCol) })}
              autoCapitalize="words" autoCorrect="off" autoComplete="off" spellCheck={false}
              enterKeyHint="go"
            />
            {entry.trim() && suggestions.length > 0 && (
              <div className="gr-drop" style={{ maxHeight: dropMax }}>
                {suggestions.map((s) => (
                  <button key={s.key} type="button" className="gr-opt"
                    // Keep the box focused, and the keyboard up (see Top10.jsx).
                    onPointerDown={(e) => e.preventDefault()}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => guess(s.p)}>
                    <span className="gr-opt-name">{s.name}</span>
                    {s.sub ? <span className="gr-opt-sub">{s.sub}</span> : null}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      <div className={`gr-say${said ? ` is-${said.tone}` : ""}`} aria-live="polite">
        {said ? <span key={said.n}>{said.text}</span> : (!over && sel == null ? t("grid.tapCell") : null)}
      </div>

      <div className="gr-board" role="group" aria-label={t("grid.boardAria")}>
        <div className="gr-corner" aria-hidden="true" />
        {board.cols.map((c) => <Badge key={c} club={c} headers={headers} axis="col" />)}
        {board.rows.map((r, ri) => (
          <React.Fragment key={r}>
            <Badge club={r} headers={headers} axis="row" />
            {board.cols.map((c, ci) => {
              const i = ri * 3 + ci;
              const cell = g.cells[i];
              const ex = over && !cell ? examples?.[i] : null;
              const label = cell
                ? t("grid.cellSolved", { row: short(r), col: short(c), name: cell.name })
                : t("grid.cellOpen", { row: short(r), col: short(c) });
              return (
                <button key={c} type="button"
                  className={`gr-cell${cell ? " is-solved" : ""}${sel === i ? " is-sel" : ""}${over && !cell ? " is-missed" : ""}`}
                  onClick={() => open(i)} disabled={over && !cell} aria-label={label} aria-pressed={sel === i}>
                  {cell ? <span className="gr-cell-name">{cell.name}</span>
                    : ex ? <span className="gr-cell-ex"><small>{t("grid.eg")}</small>{ex}</span>
                      : null}
                </button>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {!over && (
        <button type="button" className={`gr-quiet gr-give${giving ? " is-sure" : ""}`}
          onClick={() => { if (giving) { setG((cur) => ({ ...cur, gaveUp: true })); setGiving(false); } else setGiving(true); }}>
          {giving ? t("grid.giveUpSure") : t("grid.giveUp")}
        </button>
      )}

      {over && (
        // Announced once, when the board is finished.
        <div className="gr-final" aria-live="polite">
          <div className="gr-score">{solved}<small>/9</small></div>
          <p className="gr-verdict">{t(solved === 9 ? "grid.vAll" : solved >= 6 ? "grid.vGood" : solved >= 1 ? "grid.vSome" : "grid.vNone", { n: solved })}</p>
          {/* Every cell shows a player we would have taken: what makes it a
              puzzle worth coming back to, not a list of misses. */}
          <p className="gr-note">{examples ? t("grid.examplesNote") : t("grid.loadingPool")}</p>
          <button className="gr-cta" onClick={share}>{t("grid.share")}</button>
          {onBack && <button className="gr-quiet" onClick={onBack}>{t("quiz.backHome")}</button>}
          <p className="gr-source">{t("grid.source")}</p>
        </div>
      )}
      {!over && <p className="gr-source">{t("grid.source")}</p>}
    </div>
  );
}
