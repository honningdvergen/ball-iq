// Tiki Taka Toe — the football grid. Three clubs across; down the side, three
// rows, of which one may be a nationality, a country or a teammate. For each
// cell, name a player who fits both. Nine guesses for nine cells. A second,
// quiet door opens the versus mode: two players on one phone, three in a row
// wins, three steals each.
//
// Built on the same seams as Draft and Top 10: no import from App.jsx, services
// arrive as a prop, and every data file is import()ed by this screen, so none
// of it weighs on Home:
//   - the frozen schedule and the kit table when the screen opens (small);
//   - the answer pool (gridPool.json) and the names (mysteryPool.json, the
//     chunk Mystery Player and Top 10 already share) on the first tap of a
//     cell, or when a finished board needs its example answers.
//
// Everything that decides anything is in lib/grid.js (the board for a day, the
// judge, the rarity score, the versus rules, what is saved and whether it can
// be trusted). This file draws what it returns: the repo has no DOM test
// environment, so a rule written in here is a rule no test can hold.
//
// ⚠️ A RIGHT PLAYER IS NEVER TOLD HE IS WRONG. Our career data is a curated
// subset of football, so a guess we cannot confirm says exactly that (see the
// note at the top of lib/grid.js). The copy is grid.unconfirmed*; keep it a
// statement about our record, never about the player.
//
// ⚠️ NO CRESTS. A club is a shirt in its colours (components/KitShirt.jsx).
//
// ⚠️ HIDDEN (GRID_LIVE, lib/grid.js). Reachable by /play?game=grid only, until
// Alex has played it.
import GameTitle from "../components/GameTitle.jsx";
import KitShirt from "../components/KitShirt.jsx";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { dayIndexForDate } from "../lib/date.js";
import {
  GRID, GRID_GUESSES, GRID_FLAGS, gridForDay, toJudgePool, judgePick, judgeTyped, cellAnswers, rarityScore,
  headerKind, shortClub, freshGrid, gridOver, gridRarity, loadGrid, saveGrid, pruneGrids, buildGridShareText,
  freshDuel, duelAction, duelPlay, duelPass,
} from "../lib/grid.js";
import { resolveDailyServices } from "../games/dailyServices.js";
import { usePlayerPool } from "../lib/usePlayerPool.js";
import { rankPlayerSuggestions, suggestionSubtitle, SUGGEST_MAX } from "../lib/playerSearch.js";
import { useKeyboardAwareInput, useDropdownMaxHeight } from "../lib/useKeyboardAwareInput.js";
import { t as tNow, useT } from "../i18n/index.js";
import "../i18n/en.js"; // the full English table: not on Home's eager path
import "./grid.css";

// The mode's colour, here and on the share card (lib/shareCardV2.js). Not in
// lib/accents.js while the mode is hidden: that file is on Home's eager path.
// O's colour is the versus mode's second side.
const SKIN = { "--gr": "#5FD39A", "--gr-rgb": "95,211,154", "--gr-o": "#F2B84B", "--gr-o-rgb": "242,184,75" };

function useBoardData() {
  const [state, setState] = useState({ D: null, failed: false });
  useEffect(() => {
    let live = true;
    Promise.all([import("../data/gridSchedule.json"), import("../data/gridKits.json")])
      .then(([s, k]) => { if (live) setState({ D: { schedule: s.default || s, kits: k.default || k }, failed: false }); })
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

const KIND_SUFFIX = { nat: "Nat", in: "In", with: "With" };
const KIND_VAR = { nat: "nat", in: "country", with: "star" };

/**
 * Every word the board says about a header, in the player's language.
 *   name(h)    what the header shows: "Barcelona", "Argentina", "Messi"
 *   phrase(h)  the same for a sentence or a screen reader: "from Argentina"
 *   msg(base, row, col, vars)  grid.<base>, or grid.<base>Nat/In/With when one
 *              header is not a club (the other is then always a club)
 */
function useHeaderText(D) {
  const t = useT();
  return useMemo(() => {
    const name = (h) => {
      const k = headerKind(h);
      if (k.t === "club") return D.kits[k.v]?.s || shortClub(k.v);
      if (k.t === "with") return D.schedule.stars?.[k.v] || k.v;
      return t(`grid.country.${k.v}`);
    };
    const phrase = (h) => {
      const k = headerKind(h);
      return k.t === "club" ? name(h) : t(`grid.lbl${KIND_SUFFIX[k.t]}`, { x: name(h) });
    };
    const msg = (base, row, col, vars = {}) => {
      const other = headerKind(row).t !== "club" ? row : headerKind(col).t !== "club" ? col : null;
      if (!other) return t(`grid.${base}`, { row: name(row), col: name(col), ...vars });
      const club = other === row ? col : row;
      const k = headerKind(other);
      return t(`grid.${base}${KIND_SUFFIX[k.t]}`, { col: name(club), [KIND_VAR[k.t]]: name(other), ...vars });
    };
    return { name, phrase, msg };
  }, [D, t]);
}

export default function GridGame({ date, onBack, services }) {
  const t = useT();
  const { D, failed } = useBoardData();
  // The day is read ONCE, when the screen opens: a board being played as the
  // clock passes midnight is finished on the board it started on.
  const [today] = useState(() => dayIndexForDate(date || new Date()));
  useEffect(() => { pruneGrids(today); }, [today]);
  const board = useMemo(() => (D ? gridForDay(D.schedule, today) : null), [D, today]);
  const [mode, setMode] = useState("solo");
  const duels = D?.schedule?.duels?.length ? D.schedule.duels : null;

  if (D && duels && mode === "duel") {
    return <Duel D={D} duels={duels} onBack={() => setMode("solo")} services={services} />;
  }
  if (!D || !board) {
    return (
      <div className="screen gr" style={SKIN} aria-busy={!D && !failed}>
        <Head onBack={onBack} />
        <p className="gr-empty">{failed ? t("grid.loadFail") : D ? t("grid.noBoard") : t("grid.loading")}</p>
        {duels && <button type="button" className="gr-quiet" onClick={() => setMode("duel")}>{t("grid.duelOpen")}</button>}
      </div>
    );
  }
  return (
    <Board key={today} day={today} board={board} D={D} onBack={onBack} services={services}
      onDuel={duels ? () => setMode("duel") : null} />
  );
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

// A header. A club is its shirt and short name; a nationality or a country is
// its flag; a teammate is a handshake and his name. No crests, no photos.
function Header({ h, D, text, axis }) {
  const t = useT();
  const k = headerKind(h);
  if (k.t === "club") {
    return (
      <div className={`gr-badge is-${axis}`}>
        <KitShirt kit={D.kits[k.v]} name={text.name(h)} size={40} className="gr-kit" />
      </div>
    );
  }
  const icon = k.t === "with" ? "🤝" : GRID_FLAGS[k.v] || "🏳️";
  return (
    <div className={`gr-badge is-${axis} is-${k.t}`} role="img" aria-label={text.phrase(h)}>
      <span className="gr-cap" aria-hidden="true">{t(`grid.cap${KIND_SUFFIX[k.t]}`)}</span>
      <span className="gr-flag" aria-hidden="true">{icon}</span>
      <span className="gr-club" aria-hidden="true">{text.name(h)}</span>
    </div>
  );
}

// The 3x3 with its headers. `cellBody(i)` draws a cell's inside; `cellProps(i)`
// adds its class, label and disabled state.
function BoardGrid({ board, D, text, onTap, sel, cellBody, cellProps }) {
  const t = useT();
  return (
    <div className="gr-board" role="group" aria-label={t("grid.boardAria")}>
      <div className="gr-corner" aria-hidden="true" />
      {board.cols.map((c) => <Header key={c} h={c} D={D} text={text} axis="col" />)}
      {board.rows.map((r, ri) => (
        <React.Fragment key={r}>
          <Header h={r} D={D} text={text} axis="row" />
          {board.cols.map((c, ci) => {
            const i = ri * 3 + ci;
            const p = cellProps(i, r, c);
            return (
              <button key={c} type="button" className={`gr-cell${sel === i ? " is-sel" : ""}${p.className || ""}`}
                onClick={() => onTap(i)} disabled={p.disabled} aria-label={p.label} aria-pressed={sel === i}>
                {cellBody(i)}
              </button>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
}

// The question for the selected cell and its box. `onGuess(picked)` is given a
// suggestion, or null for the typed text (`entry`), and returns true when the
// box should be cleared.
function Ask({ question, pool, exclude, onGuess, said }) {
  const t = useT();
  const [entry, setEntry] = useState("");
  const suggestions = useMemo(() => {
    if (!pool) return [];
    return rankPlayerSuggestions(pool.index, entry, { limit: SUGGEST_MAX, exclude })
      .map((p) => ({ key: p.id, p, name: p.name, sub: suggestionSubtitle(p) }));
  }, [pool, entry, exclude]);

  const { inputRef, keepInputVisible, kbInset } = useKeyboardAwareInput();
  const entryRef = useRef(null);
  const dropMax = useDropdownMaxHeight(entryRef, { kbInset });
  useEffect(() => keepInputVisible(), [said, keepInputVisible]);
  useEffect(() => {
    const id = setTimeout(() => { try { inputRef.current?.focus({ preventScroll: true }); } catch { /* no focus */ } }, 0);
    return () => clearTimeout(id);
  }, [inputRef]);

  const go = (picked) => { if (onGuess(picked, entry)) setEntry(""); };
  return (
    <div className="gr-ask">
      <div className="gr-ask-q">{question}</div>
      <div ref={entryRef} className="gr-entry">
        <input
          ref={inputRef}
          className="gr-input"
          value={entry}
          onChange={(e) => setEntry(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { if (suggestions[0] && entry.trim()) go(suggestions[0].p); else if (entry.trim()) go(null); } }}
          placeholder={t("game.typePlayer")}
          aria-label={question}
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
                onClick={() => go(s.p)}>
                <span className="gr-opt-name">{s.name}</span>
                {s.sub ? <span className="gr-opt-sub">{s.sub}</span> : null}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Blur BEFORE the input leaves the page, or iOS keeps the keyboard up and the
// page scroll-locked (see TransferTrail.jsx).
const blurInput = () => { try { document.activeElement?.blur?.(); } catch { /* nothing focused */ } };

function useSay() {
  const [said, setSaid] = useState(null);
  const n = useRef(0);
  const say = useCallback((tone, text) => { n.current += 1; setSaid({ tone, text, n: n.current }); }, []);
  return [said, say, setSaid];
}

function Board({ day, board, D, onBack, services, onDuel }) {
  const t = useT();
  const text = useHeaderText(D);
  const { haptic, playSound, Confetti, shareCard } = resolveDailyServices(services);
  const { pool, ensure } = useJudgePool();
  const [g, setG] = useState(() => loadGrid(day) || freshGrid());
  useEffect(() => { saveGrid(day, g); }, [day, g]);
  const over = gridOver(g);
  const solved = g.cells.filter(Boolean).length;
  const rarity = gridRarity(g);

  const [sel, setSel] = useState(null);
  const [said, say, setSaid] = useSay();
  const [giving, setGiving] = useState(false);
  // A finished board shows an example answer for every cell, so it needs the pool.
  useEffect(() => { if (over) ensure(); }, [over, ensure]);
  const wasOver = useRef(over);

  const used = useMemo(() => new Set(g.cells.filter(Boolean).map((c) => c.id)), [g.cells]);

  const open = (i) => {
    if (over || g.cells[i]) return;
    ensure();
    haptic("soft");
    setSel(i === sel ? null : i);
    setSaid(null);
    setGiving(false);
  };

  // One guess: a suggestion picked (we know who) or typed text (we resolve it).
  const guess = (picked, typed) => {
    if (over || sel == null) return false;
    if (!pool) { say("info", tNow("grid.loadingPool")); return false; }
    const row = board.rows[Math.floor(sel / 3)], col = board.cols[sel % 3];
    const r = picked ? judgePick(pool, picked, row, col) : judgeTyped(pool, typed, row, col);
    if (r.result === GRID.UNKNOWN) { say("info", tNow("grid.unknown")); return false; }
    if (r.result === GRID.AMBIGUOUS) { say("info", tNow("grid.ambiguous")); return false; }
    if (used.has(r.player.id)) { say("info", tNow("grid.used", { name: r.player.name })); return true; }
    // A guess that resolves to a player costs one of the nine, either way.
    if (r.result === GRID.CORRECT) {
      haptic("hardCorrect"); playSound("correct");
      const at = sel;
      const pts = rarityScore(cellAnswers(pool, row, col), r.player.id);
      setG((cur) => ({ ...cur, left: cur.left - 1, cells: cur.cells.map((c, i) => (i === at ? { id: r.player.id, name: r.player.name, pts } : c)) }));
      blurInput();
      setSel(null);
      say("ok", text.msg("correct", row, col, { name: r.player.name }));
    } else {
      haptic("soft");
      setG((cur) => ({ ...cur, left: cur.left - 1 }));
      say("info", text.msg("unconfirmed", row, col, { name: r.player.name }));
    }
    return true;
  };

  useEffect(() => {
    if (!over || wasOver.current) return;
    wasOver.current = true;
    blurInput();
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
    const shareText = buildGridShareText({
      cells: g.cells,
      head: tNow("share.gridHead", { n: board.number, solved }),
      score: solved ? tNow("share.gridRarity", { n: rarity }) : null,
      url: tNow("share.gridUrl"),
    });
    if (shareCard) {
      const toast = (m) => window.dispatchEvent(new CustomEvent("biq:show-toast", { detail: m }));
      await shareCard("grid", { num: board.number, cells: g.cells.map(Boolean), rarity, deepLink: "/play?game=grid" }, { textFallback: shareText, onToast: toast });
      return;
    }
    try { if (navigator.share) { await navigator.share({ text: shareText }); return; } } catch { return; }
    try {
      await navigator.clipboard.writeText(shareText);
      window.dispatchEvent(new CustomEvent("biq:show-toast", { detail: tNow("share.pasteAnywhere") }));
    } catch { /* nothing to copy to */ }
  }, [g.cells, board.number, solved, rarity, shareCard]);

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
          {rarity > 0 && <span className="gr-left-r" aria-hidden="true">{t("grid.rarity")} {rarity}</span>}
        </div>
      )}

      {!over && sel != null && (
        <Ask key={sel} question={text.msg("ask", selRow, selCol)} pool={pool} exclude={used} onGuess={guess} said={said} />
      )}
      <div className={`gr-say${said ? ` is-${said.tone}` : ""}`} aria-live="polite">
        {said ? <span key={said.n}>{said.text}</span> : (!over && sel == null ? t("grid.tapCell") : null)}
      </div>

      <BoardGrid board={board} D={D} text={text} onTap={open} sel={sel}
        cellProps={(i, r, c) => {
          const cell = g.cells[i];
          return {
            className: `${cell ? " is-solved" : ""}${over && !cell ? " is-missed" : ""}`,
            disabled: over && !cell,
            label: cell
              ? t("grid.cellSolved", { row: text.phrase(r), col: text.phrase(c), name: cell.name })
              : t("grid.cellOpen", { row: text.phrase(r), col: text.phrase(c) }),
          };
        }}
        cellBody={(i) => {
          const cell = g.cells[i];
          const ex = over && !cell ? examples?.[i] : null;
          if (cell) {
            return (
              <span className="gr-cell-in">
                <span className="gr-cell-name">{cell.name}</span>
                {cell.pts ? <span className="gr-cell-pts">{cell.pts}</span> : null}
              </span>
            );
          }
          return ex ? <span className="gr-cell-ex"><small>{t("grid.eg")}</small>{ex}</span> : null;
        }} />

      {!over && (
        <button type="button" className={`gr-quiet gr-give${giving ? " is-sure" : ""}`}
          onClick={() => { if (giving) { setG((cur) => ({ ...cur, gaveUp: true })); setGiving(false); } else setGiving(true); }}>
          {giving ? t("grid.giveUpSure") : t("grid.giveUp")}
        </button>
      )}
      {!over && onDuel && <button type="button" className="gr-link" onClick={onDuel}>{t("grid.duelOpen")}</button>}

      {over && (
        // Announced once, when the board is finished.
        <div className="gr-final" aria-live="polite">
          <div className="gr-score">{solved}<small>/9</small></div>
          <p className="gr-verdict">{t(solved === 9 ? "grid.vAll" : solved >= 6 ? "grid.vGood" : solved >= 1 ? "grid.vSome" : "grid.vNone", { n: solved })}</p>
          {solved > 0 && (
            <div className="gr-rarity">
              <span className="gr-rarity-n">{rarity}</span>
              <span className="gr-rarity-l">{t("grid.rarity")}</span>
            </div>
          )}
          {/* Every cell shows a player we would have taken: what makes it a
              puzzle worth coming back to, not a list of misses. */}
          <p className="gr-note">
            {solved > 0 ? `${t("grid.rarityNote")} ` : ""}{examples ? t("grid.examplesNote") : t("grid.loadingPool")}
          </p>
          <button className="gr-cta" onClick={share}>{t("grid.share")}</button>
          {onDuel && <button className="gr-quiet" onClick={onDuel}>{t("grid.duelOpen")}</button>}
          {onBack && <button className="gr-quiet" onClick={onBack}>{t("quiz.backHome")}</button>}
          <p className="gr-source">{t("grid.source")}</p>
        </div>
      )}
      {!over && <p className="gr-source">{t("grid.source")}</p>}
    </div>
  );
}

// ── Two players, one phone ───────────────────────────────────────────────────
// The rules are duelAction / duelPlay / duelPass in lib/grid.js. The boards
// are the schedule's `duels`, drawn apart from the dailies, so a versus game
// never gives away a day still to come. Nothing is saved: a versus game lasts
// as long as the phone is passed back and forth.
function Duel({ D, duels, onBack, services }) {
  const t = useT();
  const text = useHeaderText(D);
  const { haptic, playSound, Confetti } = resolveDailyServices(services);
  const { pool, ensure } = useJudgePool();
  useEffect(() => { ensure(); }, [ensure]);
  // A random board, never the one just played. (Which board is not a daily
  // fact everyone must share, so Math.random is fine here.)
  const pick = useCallback((not) => {
    if (duels.length < 2) return 0;
    let i = not;
    while (i === not) i = Math.floor(Math.random() * duels.length);
    return i;
  }, [duels]);
  const [bi, setBi] = useState(() => pick(-1));
  const board = { rows: duels[bi].r, cols: duels[bi].c };
  const [s, setS] = useState(freshDuel);
  const [sel, setSel] = useState(null);
  const [said, say, setSaid] = useSay();
  const over = !!(s.winner || s.draw);
  const used = useMemo(() => new Set(s.used), [s.used]);

  const tap = (i) => {
    const a = duelAction(s, i);
    if (a === "over") return;
    if (a === "own") { say("info", t("grid.duelOwn")); return; }
    if (a === "noSteals") { say("info", t("grid.duelNoSteals", { p: s.turn })); return; }
    haptic("soft");
    setSel(i === sel ? null : i);
    setSaid(a === "steal" ? { tone: "info", text: t("grid.duelAskSteal"), n: -1 } : null);
  };

  const guess = (picked, typed) => {
    if (sel == null) return false;
    if (!pool) { say("info", tNow("grid.loadingPool")); return false; }
    const row = board.rows[Math.floor(sel / 3)], col = board.cols[sel % 3];
    const r = picked ? judgePick(pool, picked, row, col) : judgeTyped(pool, typed, row, col);
    if (r.result === GRID.UNKNOWN) { say("info", tNow("grid.unknown")); return false; }
    if (r.result === GRID.AMBIGUOUS) { say("info", tNow("grid.ambiguous")); return false; }
    const { state, outcome } = duelPlay(s, sel, r.result, r.player);
    if (outcome === "used") { say("info", t("grid.duelUsed", { name: r.player.name })); return true; }
    setS(state);
    blurInput();
    setSel(null);
    const next = { p: state.turn };
    if (outcome === "won") { haptic("hardCorrect"); playSound("correct"); say("ok", t("grid.duelWin", { p: s.turn })); }
    else if (outcome === "draw") { haptic("soft"); say("info", t("grid.duelDraw")); }
    else if (outcome === "unconfirmed") {
      haptic("soft");
      say("info", `${text.msg("unconfirmed", row, col, { name: r.player.name })} ${t("grid.duelNext", next)}`);
    } else {
      haptic("hardCorrect"); playSound("correct");
      say("ok", t(outcome === "stolen" ? "grid.duelStolen" : "grid.duelPlaced", { name: r.player.name, ...next }));
    }
    return true;
  };

  const pass = () => {
    const n = duelPass(s);
    setS(n);
    blurInput();
    setSel(null);
    say("info", n.draw ? t("grid.duelDraw") : t("grid.duelNext", { p: n.turn }));
  };
  const restart = () => {
    setS(freshDuel());
    setSel(null);
    setSaid(null);
    setBi((b) => pick(b));
  };

  const selRow = sel == null ? null : board.rows[Math.floor(sel / 3)];
  const selCol = sel == null ? null : board.cols[sel % 3];

  return (
    <div className={`screen gr is-duel${over ? " is-done" : ""}`} style={SKIN}>
      {s.winner && Confetti ? <Confetti /> : null}
      <Head onBack={onBack} sub={t("grid.duelSub")} />

      <div className="gr-sides" role="group" aria-label={over ? undefined : t("grid.duelTurn", { p: s.turn })}>
        {["X", "O"].map((m) => (
          <div key={m} className={`gr-side is-${m.toLowerCase()}${!over && s.turn === m ? " is-turn" : ""}${s.winner === m ? " is-won" : ""}`}>
            <span className="gr-side-m">{m}</span>
            <span className="gr-side-s">{t("grid.duelSteals", { n: s.steals[m] })}</span>
          </div>
        ))}
      </div>

      {!over && sel != null && (
        <Ask key={`${bi}:${sel}:${s.turn}`} question={`${s.turn} · ${text.msg("ask", selRow, selCol)}`} pool={pool} exclude={used} onGuess={guess} said={said} />
      )}
      <div className={`gr-say${said ? ` is-${said.tone}` : ""}`} aria-live="polite">
        {said ? <span key={said.n}>{said.text}</span> : (!over && sel == null ? `${t("grid.duelTurn", { p: s.turn })}. ${t("grid.duelTap")}` : null)}
      </div>

      <BoardGrid board={board} D={D} text={text} onTap={tap} sel={sel}
        cellProps={(i, r, c) => {
          const cell = s.cells[i];
          const inLine = s.line?.includes(i);
          return {
            className: `${cell ? ` is-mark is-${cell.mark.toLowerCase()}` : ""}${inLine ? " is-line" : ""}`,
            disabled: over,
            label: cell
              ? t("grid.cellMark", { row: text.phrase(r), col: text.phrase(c), p: cell.mark, name: cell.name })
              : t("grid.cellOpen", { row: text.phrase(r), col: text.phrase(c) }),
          };
        }}
        cellBody={(i) => {
          const cell = s.cells[i];
          if (!cell) return null;
          return (
            <span className="gr-cell-in">
              <span className="gr-mark" aria-hidden="true">{cell.mark}</span>
              <span className="gr-cell-name">{cell.name}</span>
            </span>
          );
        }} />

      {!over && <button type="button" className="gr-quiet" onClick={pass}>{t("grid.duelPass")}</button>}
      {over && (
        <div className="gr-final" aria-live="polite">
          <p className="gr-verdict">{s.winner ? t("grid.duelWin", { p: s.winner }) : t("grid.duelDraw")}</p>
          {/* A rematch is on a new board: the old one's answers are known. */}
          <button className="gr-cta" onClick={() => restart()}>{t("grid.duelAgain")}</button>
        </div>
      )}
      {!over && <button type="button" className="gr-link" onClick={() => restart()}>{t("grid.duelNewBoard")}</button>}
      <button type="button" className="gr-link" onClick={onBack}>{t("grid.duelBack")}</button>
      <p className="gr-source">{t("grid.source")}</p>
    </div>
  );
}
