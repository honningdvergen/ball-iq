// Top 10 in turns: pass and play's list mode. Players take turns on the one
// phone, one name each turn, until the ten are found or everyone is out.
//
// Drawn and approved on 26 Nov 2026 (ball-iq-audit/2026-11-24/finish/
// top10-turns-1.png and top10-turns-moments-2.png, sources tt1.py and tt3.py;
// the two landings are the moving preview ball-iq-audit/2026-11-26/
// top10-turns-preview/index.html, source tt5.py: Alex, "Yes, build it"). The
// brief is ball-iq-audit/2026-11-26/pass-play-build-brief.md, JOB 2. The rules
// are pure functions in lib/top10Turns.js (tests/unit/top10-turns.test.js).
//
// The lists and the name search are the daily Top 10's (data/top10Lists.json,
// lib/top10.js, lib/playerSearch.js). This screen never saves a day, never
// counts as a daily and never plays a list that is still to come as a daily
// (turnsBank). Opened by LocalPlay.jsx's LocalGameScreen in its own lazy chunk.
//
// ── THE TWO LANDINGS ─────────────────────────────────────────────────────────
// A right name: it shows in the field in the player's colour with a tick and
// its number, the row's grey figure fades, the name travels to its row and
// shrinks on the way so it lands on its final letters, the row lights, the
// disc and the figure slide in; the field has cross-faded to the next player's
// prompt before the name lands. A wrong name: one small shake, struck through
// in red with the strike mark, the "Not on the list" chips slide aside, the
// name drops into the gap, the red fades. About 1.0 s from send to typable;
// a tap skips to the end; with reduced motion nothing travels.
// Built as the preview's notes ask: ONE render when the name is sent (the
// game's new state, with the moving parts still hidden), then every step in
// place on the elements themselves, then one render when it lands. Each step
// is also kept in a ref the render reads, so a render that happens anyway
// (a keyboard resize) draws the step that is on, not the start again.
// Transitions start after a forced layout read, never on requestAnimationFrame
// alone (it stalled in headless WebKit in the design session).
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { ArrowLeft, ArrowRight, Search, Check, X, Loader, CircleAlert } from "lucide-react";
import "../i18n/en.js"; // the full English table: not on Home's eager path
import { useT } from "../i18n/index.js";
import { rankListSuggestions, top10GuessPool } from "../lib/top10.js";
import { usePlayerPool } from "../lib/usePlayerPool.js";
import { rankPlayerSuggestions, suggestionSubtitle, SUGGEST_MAX } from "../lib/playerSearch.js";
import { useKeyboardAwareInput, useDropdownMaxHeight, visibleBottom } from "../lib/useKeyboardAwareInput.js";
import { haptic, playSound } from "../lib/feedback.js";
import { colourOf } from "../lib/passPlay.js";
import {
  TURNS_STRIKES, turnsBank, pickTurnsList, newTurnsGame, playTurn, isOut, rowsBy, turnsResult, swapStart,
} from "../lib/top10Turns.js";
import { PlayerDisc, playerVars } from "./passPlayParts.jsx";
import "./passPlay.css";
import "./top10Turns.css";

// How many missed names the line under the field prints before "and N more".
const MISSED_SHOWN = 6;

const isCalm = () => {
  try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; }
};
const wait = { say: 340, fly: 470, flyMs: 460, cross: 540, strike: 200, slide: 240, dropAt: 500, dropMs: 440, missCross: 570, lit: 650, red: 700, endHold: 600, note: 1400, calmSay: 900 };

// The lists the daily plays from: the build's own, or (in the installed app) a
// newer copy it fetched and kept, whichever the daily would use, so a longer
// schedule bars its days here too. Never fetches: this is not a daily.
function useTurnsData() {
  const [st, setSt] = useState({ data: null, failed: false });
  useEffect(() => {
    let live = true;
    (async () => {
      let native = false;
      try { native = !!window.Capacitor?.isNativePlatform?.(); } catch { /* not an app */ }
      const [bundled, remote] = await Promise.all([
        import("../data/top10Lists.json").then((m) => m.default || m),
        native ? import("../lib/top10Remote.js").catch(() => null) : null,
      ]);
      const data = remote ? remote.pickTop10Data(bundled, remote.cachedTop10()) : bundled;
      if (live) setSt({ data, failed: false });
    })().catch(() => { if (live) setSt({ data: null, failed: true }); });
    return () => { live = false; };
  }, []);
  return st;
}

function Head({ sub, onBack }) {
  const t = useT();
  return (
    <header className="pp-top">
      <button className="pp-tile" onClick={onBack} aria-label={t("game.goBack")}><ArrowLeft size={20} strokeWidth={2.2} aria-hidden="true" /></button>
      <div className="pp-tt">
        <h1>{t("lp.top10")}</h1>
        {sub ? <p>{sub}</p> : null}
      </div>
    </header>
  );
}

export default function Top10Turns({ players, onExit }) {
  const t = useT();
  const { data, failed } = useTurnsData();
  // Read once, when the lists arrive: a game left open past midnight keeps
  // the bank it started with (yesterday's list is barred as well as today's).
  const bank = useMemo(() => (data ? turnsBank(data, new Date()) : []), [data]);
  const [round, setRound] = useState(null); // { id, start, n }
  const played = useRef([]);
  useEffect(() => {
    if (round || !bank.length) return;
    const id = pickTurnsList(bank);
    played.current = [id];
    setRound({ id, start: 0, n: 1 });
  }, [bank, round]);

  const another = useCallback(() => {
    setRound((r) => {
      const id = pickTurnsList(bank, { avoid: played.current, current: r.id });
      played.current = [...played.current, id];
      return { id, start: r.start, n: r.n + 1 };
    });
  }, [bank]);
  const swap = useCallback(() => setRound((r) => ({ ...r, start: swapStart(r.start, players.length), n: r.n + 1 })), [players.length]);

  const list = round && data ? data.lists[round.id] : null;
  if (!list) {
    const empty = data && !bank.length;
    return (
      <div className="pp pp-page tt">
        <Head onBack={onExit} />
        <div className="tt-wait" role="status">
          {failed || empty
            ? <CircleAlert size={32} strokeWidth={1.8} aria-hidden="true" />
            : <Loader size={32} strokeWidth={1.8} aria-hidden="true" />}
          <p>{t(failed ? "t10t.loadFail" : empty ? "t10t.empty" : "t10t.loading")}</p>
        </div>
      </div>
    );
  }
  return (
    <TurnsBoard key={round.n} list={list} data={data} players={players} start={round.start}
      onExit={onExit} onAnother={another} onSwap={swap} />
  );
}

function TurnsBoard({ list, data, players, start, onExit, onAnother, onSwap }) {
  const t = useT();
  const order = useMemo(() => players.map((p) => p.id), [players]);
  const byId = useCallback((id) => players.find((p) => p.id === id) || null, [players]);
  const [game, setGame] = useState(() => newTurnsGame(order, start));
  const gameRef = useRef(game);
  gameRef.current = game;

  // The landing on now: { kind, slot, name, by, k, before } (null between turns).
  const [land, setLand] = useState(null);
  const landRef = useRef(null);
  const stepRef = useRef(null); // "say" | "fade" | "fly" | "cross"
  // A name refused (found or tried already), or under reduced motion the
  // answer shown in the field without anything travelling: { kind, name, by, n, k }.
  const [note, setNote] = useState(null);
  const [fresh, setFresh] = useState(-1);     // the row just lit
  const [bump, setBump] = useState(null);     // the chip whose count just went up
  const [redKey, setRedKey] = useState(null); // the "Not on the list" chip just dropped in
  const [ended, setEnded] = useState(false);
  const [entry, setEntry] = useState("");
  const [said, setSaid] = useState("");       // for screen readers

  const fieldRef = useRef(null);
  const nameRef = useRef(null);
  const markRef = useRef(null);
  const rowRefs = useRef([]);
  const msRef = useRef(null);
  const stickyRef = useRef(null);
  const chipsRef = useRef(null);
  const flyRef = useRef(null);
  const timers = useRef([]);
  const afters = useRef([]);
  const later = (ms, fn) => { timers.current.push(setTimeout(fn, ms)); };
  const after = (ms, fn) => { afters.current.push(setTimeout(fn, ms)); };
  useEffect(() => () => {
    timers.current.forEach(clearTimeout); afters.current.forEach(clearTimeout);
    flyRef.current?.remove();
  }, []);

  const { inputRef, kbInset } = useKeyboardAwareInput();
  const entryRef = useRef(null);
  const dropMax = useDropdownMaxHeight(entryRef, { kbInset });

  // ── The name search: the daily's own ──────────────────────────────────────
  const { pool, ensure: ensurePool } = usePlayerPool({ extras: true });
  const playerPool = useMemo(() => (list.kind === "player" ? top10GuessPool(list, pool, data.extras) : []), [list, pool, data.extras]);
  // Nothing is left out of the box: a name found or tried already is still
  // offered, so picking it can be answered ("Found already") instead of
  // vanishing with no word why.
  const suggestions = useMemo(() => {
    if (game.over || !entry) return [];
    if (list.kind === "player") {
      return rankPlayerSuggestions(playerPool, entry, { limit: SUGGEST_MAX })
        // The birth year alone, as on the Trail: the pool's own club is unreliable
        // ("Thierry Henry 1977 · AS Monaco") and a club under a name can answer a list.
        .map((p) => ({ key: p.id, name: p.name, sub: suggestionSubtitle(p, { club: false }) }));
    }
    return rankListSuggestions(data.pools?.[list.kind], entry, { limit: SUGGEST_MAX });
  }, [game.over, entry, list, playerPool, data.pools]);
  const wantPool = list.kind === "player" ? ensurePool : undefined;

  // ── The field's look for the step that is on ──────────────────────────────
  const fieldWho = () => {
    const l = landRef.current;
    if (l && stepRef.current !== "cross") return l.by;
    if (note) return note.by;
    return gameRef.current.turn;
  };
  const fieldClass = () => {
    const l = landRef.current;
    const s = stepRef.current;
    let c = "tt-fld";
    if (l) {
      c += " is-land";
      if (s === "cross") c += " is-cross";
      else c += l.kind === "hit" ? " is-good" : " is-bad";
      if (l.kind === "hit" && (s === "fly" || s === "cross")) c += " is-fly";
      if (l.kind === "miss") c += " is-shake";
    } else if (note) {
      c += " is-note";
      if (note.kind === "hit") c += " is-good";
      if (note.kind === "miss") c += " is-bad";
    }
    return c;
  };
  const rowClass = (i, finder) => {
    const l = landRef.current;
    let c = "tt-r";
    if (finder != null) c += " got";
    if (l && l.kind === "hit" && l.slot === i) {
      c += " is-land";
      if (stepRef.current === "say") c += " is-pre";
      if (stepRef.current === "fade") c += " is-pre is-fade";
    } else if (fresh === i) c += " hit";
    return c;
  };

  // A miss: the new chip starts squeezed shut at the front of the line, before
  // the first paint, so the line does not jump and can slide open.
  useLayoutEffect(() => {
    if (!land || land.kind !== "miss") return;
    const ms = msRef.current;
    const chip = ms?.querySelector(".is-land");
    if (!ms || !chip) return;
    ms.scrollLeft = 0;
    chip.style.marginLeft = `${-chip.offsetWidth}px`;
    chip.style.opacity = "0";
  }, [land]);

  // The player who is up keeps their chip in view when the chips scroll sideways.
  useEffect(() => {
    if (land) return;
    const row = chipsRef.current;
    const on = row?.querySelector(".is-turn");
    if (!row || !on || row.scrollWidth <= row.clientWidth) return;
    const l = on.offsetLeft - row.offsetLeft;
    if (l < row.scrollLeft || l + on.offsetWidth > row.scrollLeft + row.clientWidth) {
      row.scrollTo({ left: Math.max(0, l - 8), behavior: isCalm() ? "auto" : "smooth" });
    }
  }, [game.turn, land]);

  // The field takes focus when the board opens (it raises no keyboard on a
  // phone until tapped; a computer types straight away).
  useEffect(() => { try { inputRef.current?.focus({ preventScroll: true }); } catch { /* fine */ } }, [inputRef]);

  // ── The landing, step by step ─────────────────────────────────────────────
  const applyField = () => {
    const f = fieldRef.current;
    if (!f) return;
    f.className = fieldClass();
    const c = colourOf(byId(fieldWho())?.colour);
    f.style.setProperty("--pc", c.hex);
    f.style.setProperty("--pr", c.rgb);
  };
  const applyRow = (i) => {
    const r = rowRefs.current[i];
    const l = landRef.current;
    if (r && l) r.className = rowClass(i, l.by);
  };

  function fly(src, dst, ms) {
    if (!src || !dst) return;
    const a = src.getBoundingClientRect();
    const b = dst.getBoundingClientRect();
    const cs = getComputedStyle(src);
    const ds = getComputedStyle(dst);
    const e = document.createElement("div");
    e.className = "tt-fly";
    e.setAttribute("aria-hidden", "true");
    e.textContent = src.textContent;
    e.style.fontFamily = cs.fontFamily; e.style.fontSize = cs.fontSize; e.style.fontWeight = cs.fontWeight;
    e.style.lineHeight = cs.lineHeight; e.style.color = cs.color; e.style.transitionDuration = `${ms}ms`;
    e.style.transform = `translate(${a.left}px, ${a.top}px)`;
    document.body.appendChild(e);
    flyRef.current = e;
    src.style.visibility = "hidden";
    void e.offsetWidth; // a forced layout read, then the move
    e.style.transform = `translate(${b.left}px, ${b.top}px) scale(${parseFloat(ds.fontSize) / parseFloat(cs.fontSize)})`;
    e.style.color = ds.color;
  }

  // The landing's end, on time or at once (a tap, a key, the next name).
  function finish() {
    const l = landRef.current;
    if (!l) return;
    timers.current.forEach(clearTimeout); timers.current = [];
    flyRef.current?.remove(); flyRef.current = null;
    landRef.current = null;
    stepRef.current = null;
    const chip = msRef.current?.querySelector(".is-land");
    flushSync(() => {
      setLand(null);
      setFresh(l.kind === "hit" ? l.slot : -1);
      setBump(l.kind === "hit" ? l.by : null);
      setRedKey(l.kind === "miss" ? l.key : null);
    });
    if (chip) { chip.style.marginLeft = ""; chip.style.opacity = ""; chip.style.transition = ""; }
    afters.current.forEach(clearTimeout); afters.current = [];
    after(wait.lit, () => setFresh(-1));
    after(wait.red, () => setRedKey(null));
    if (gameRef.current.over) {
      // Blur before the field goes, or iOS can leave the keyboard up.
      after(wait.endHold, () => {
        try { document.activeElement?.blur?.(); } catch { /* fine */ }
        setEnded(true);
        try { window.scrollTo({ top: 0, left: 0, behavior: "instant" }); } catch { /* old engines */ }
      });
    }
  }

  const send = (s) => {
    if (!s) return;
    if (landRef.current) finish();
    if (note) setNote(null);
    const g = gameRef.current;
    const r = playTurn(g, list, { key: s.key, name: s.name });
    setEntry("");
    try { inputRef.current?.focus({ preventScroll: true }); } catch { /* keep the keyboard */ }
    if (r.kind === "over") return;
    const by = byId(r.by);
    if (r.kind === "found" || r.kind === "tried") {
      haptic("soft");
      setNote({ kind: r.kind, name: r.kind === "found" ? list.slots[r.slot].name : s.name, by: r.by });
      setSaid(t(r.kind === "found" ? "t10t.sayFound" : "t10t.sayTried", { name: s.name }));
      afters.current.forEach(clearTimeout); afters.current = [];
      after(wait.note, () => setNote(null));
      return;
    }
    const hit = r.kind === "hit";
    const name = hit ? list.slots[r.slot].name : s.name;
    const k = hit ? 0 : r.game.strikes[r.by];
    const next = r.game.turn != null ? byId(r.game.turn) : null;
    setSaid([
      hit ? t("t10t.sayHit", { name, n: r.slot + 1 }) : t("t10t.sayMiss", { name, k }),
      !hit && k >= TURNS_STRIKES ? t("t10t.sayOut", { name: by?.name }) : "",
      next ? t("t10t.nameOne", { name: next.name }) : "",
    ].filter(Boolean).join(" "));
    if (hit) { haptic("hardCorrect"); playSound("correct"); } else { haptic("wrong"); playSound("wrong"); }

    if (isCalm()) {
      // Nothing travels: the row simply fills, the chip simply appears, and the
      // field says what it was for a moment, then the next prompt.
      setGame(r.game);
      setFresh(hit ? r.slot : -1);
      setBump(hit ? r.by : null);
      setRedKey(hit ? null : s.key);
      setNote({ kind: r.kind, name, by: r.by, n: r.slot + 1, k });
      afters.current.forEach(clearTimeout); afters.current = [];
      after(wait.calmSay, () => { setNote(null); setFresh(-1); setRedKey(null); });
      if (r.game.over) after(wait.calmSay, () => { try { document.activeElement?.blur?.(); } catch { /* fine */ } setEnded(true); });
      return;
    }

    const l = { kind: r.kind, slot: r.slot, name, by: r.by, k, key: s.key, before: g };
    landRef.current = l;
    stepRef.current = "say";
    setLand(l);
    setGame(r.game);

    if (hit) {
      // The row comes into view under the pinned chips and field, above the
      // keyboard, while the name still sits in the field.
      const row = rowRefs.current[r.slot];
      const top = (stickyRef.current?.getBoundingClientRect().bottom || 0) + 8;
      const bottom = visibleBottom(kbInset) - 8;
      if (row) {
        const rr = row.getBoundingClientRect();
        const dy = rr.top < top ? rr.top - top : rr.bottom > bottom ? rr.bottom - bottom : 0;
        if (dy) { try { window.scrollBy({ top: dy, behavior: "smooth" }); } catch { window.scrollBy(0, dy); } }
      }
      later(wait.say, () => { stepRef.current = "fade"; applyRow(r.slot); });
      later(wait.fly, () => {
        stepRef.current = "fly"; applyRow(r.slot); applyField();
        const dst = rowRefs.current[r.slot]?.querySelector(".tt-nm");
        fly(nameRef.current, dst, wait.flyMs);
      });
      if (!r.game.over) later(wait.cross, () => { stepRef.current = "cross"; applyField(); });
      later(wait.fly + wait.flyMs + 20, finish);
    } else {
      later(wait.strike, () => {
        markRef.current?.classList.add("on", "is-bump");
        const chipMark = chipsRef.current?.querySelector(`[data-p="${r.by}"] .tt-stk em:nth-child(${k})`);
        chipMark?.classList.add("on");
        const chip = msRef.current?.querySelector(".is-land");
        if (chip) {
          void chip.offsetWidth; // a forced layout read, then the slide
          chip.style.transition = `margin-left ${wait.slide}ms cubic-bezier(.45,0,.2,1)`;
          chip.style.marginLeft = "0px";
        }
      });
      later(wait.dropAt, () => {
        const dst = msRef.current?.querySelector(".is-land b");
        fly(nameRef.current, dst, wait.dropMs);
      });
      if (!r.game.over) later(wait.missCross, () => { stepRef.current = "cross"; applyField(); });
      later(wait.dropAt + wait.dropMs + 20, finish);
    }
  };

  // A tap anywhere skips the landing to its end.
  const skip = () => { if (landRef.current) finish(); };

  // ── The end ───────────────────────────────────────────────────────────────
  const shown = land ? land.before : game; // the chips change when the name lands
  const counts = rowsBy(shown);
  const res = useMemo(() => (ended ? turnsResult(game, players) : null), [ended, game, players]);

  const chips = (
    // Three to six scroll sideways: the line can then be reached and scrolled
    // from the keyboard too.
    <div ref={chipsRef} className={`tt-scs${players.length > 2 ? " is-many" : ""}`} role="group" aria-label={t("lp.scoresSoFar")}
      tabIndex={players.length > 2 ? 0 : undefined}>
      {players.map((p) => {
        const k = shown.strikes[p.id] || 0;
        const out = isOut(shown, p.id);
        const up = !ended && shown.turn === p.id;
        return (
          <div key={p.id} data-p={p.id} className={`tt-sc${up ? " is-turn" : ""}${out ? " is-out" : ""}`} style={playerVars(p)}>
            <PlayerDisc p={p} size={28} />
            {/* THE TOP, REDRAWN (27 Nov 2026). Alex on the first build: "i still
                think there might be something that is not quite right here";
                to the redraw (top10-turns-top-1.png) "Yes, build it". The name
                with three clear strike marks under it, and the count as one
                big number in the player's colour: "N found" is no longer
                printed, it is the number's spoken name. */}
            <span className="tt-sc-t">
              <b>{p.name}</b>
              <span className="tt-stk" role="img" aria-label={`${t("t10t.strikes", { count: k })}${out ? `, ${t("lp.out")}` : ""}`}>
                {Array.from({ length: TURNS_STRIKES }, (_, j) => <em key={j} className={j < k ? "on" : undefined}><X size={10} strokeWidth={3.4} aria-hidden="true" /></em>)}
              </span>
            </span>
            <span key={counts[p.id]} className={`tt-sc-n${bump === p.id ? " is-nudge" : ""}`} role="img" aria-label={t("t10t.found", { count: counts[p.id] || 0 })}>{counts[p.id] || 0}</span>
          </div>
        );
      })}
    </div>
  );

  const rows = (reveal) => (
    <section className="pp-card tt-list" aria-label={t("top10.theTen")}>
      {list.slots.map((s, i) => {
        const finder = game.found[i] != null ? byId(game.found[i]) : null;
        const l = land && land.kind === "hit" && land.slot === i;
        return (
          <div key={s.key} ref={(el) => { rowRefs.current[i] = el; }} className={reveal ? `tt-r${finder ? " got" : " miss"}` : rowClass(i, finder?.id)}
            style={finder ? playerVars(finder) : undefined}>
            <u>{i + 1}</u>
            {l && <b className="q tt-ph" aria-hidden="true">{s.clue}</b>}
            {finder || reveal
              ? <b className="tt-nm">{s.name}</b>
              : <b className="q">{s.clue}</b>}
            {finder && <span className={`tt-tail${fresh === i ? " is-late" : ""}`}><PlayerDisc p={finder} size={22} label={finder.name} /></span>}
            {(finder || reveal) && <i className={fresh === i ? "is-late" : undefined}>{s.clue}</i>}
          </div>
        );
      })}
    </section>
  );

  if (ended && res) {
    const many = players.length > 2;
    const twoOn = res.top.length === 2;
    const buttons = (
      <>
        <button type="button" className="pp-go" onClick={onAnother}>{t("t10t.another")}<ArrowRight size={18} strokeWidth={2.6} aria-hidden="true" /></button>
        <button type="button" className="pp-again" onClick={onSwap}>{t("t10t.swap")}</button>
      </>
    );
    const side = (p) => (
      <div className="pp-sd" key={p.id}>
        <PlayerDisc p={p} size={76} />
        <b>{p.name}</b>
        <i>{t("t10t.found", { count: res.scores[p.id] || 0 })}</i>
      </div>
    );
    let card;
    if (res.kind === "draw") {
      card = (
        <section className="pp-win is-draw">
          <p className="pp-eye">{t("lp.tie")}</p>
          {twoOn ? (
            <div className="pp-vs">
              {side(res.top[0])}
              <strong aria-label={t("t10t.foundEach", { count: res.topScore })}>{res.topScore}<s aria-hidden="true" />{res.topScore}</strong>
              {side(res.top[1])}
            </div>
          ) : (
            <>
              <div className="pp-row-of">{res.top.map(side)}</div>
              <p className="pp-meta">{t("t10t.foundEach", { count: res.topScore })}</p>
            </>
          )}
          {buttons}
        </section>
      );
    } else {
      const w = res.top[0];
      const other = res.ranked[1];
      card = (
        <section className="pp-win">
          <div className="pp-hero"><PlayerDisc p={w} size={96} glow /></div>
          <h2>{t("lp.wins", { name: w.name })}</h2>
          <p className="pp-meta">{!many && other
            ? t("t10t.foundVs", { count: res.scores[w.id] || 0, b: res.scores[other.id] || 0 })
            : t("t10t.found", { count: res.scores[w.id] || 0 })}</p>
          {buttons}
        </section>
      );
    }
    return (
      <div className="screen foot-clear">
        <div className="pp pp-page pp-end tt is-end">
          <Head sub={list.title} onBack={onExit} />
          {card}
          {chips}
          {rows(true)}
        </div>
      </div>
    );
  }

  // ── The board ─────────────────────────────────────────────────────────────
  const fp = byId(fieldWho());
  const turnP = byId(game.turn);
  const prompt = turnP ? t("t10t.nameOne", { name: turnP.name }) : "";
  const sayItem = land || note;
  const missed = [...game.missed].reverse(); // newest first
  return (
    <div className="pp pp-page tt" onPointerDown={land ? skip : undefined}>
      <Head sub={list.title} onBack={onExit} />
      <div ref={stickyRef} className="tt-pin">
        {chips}
        <div ref={entryRef} className="tt-entry">
          <div ref={fieldRef} className={fieldClass()} style={playerVars(fp)}>
            <label className="tt-in">
              <Search size={20} strokeWidth={2.2} aria-hidden="true" />
              <input
                ref={inputRef}
                value={entry}
                placeholder={prompt}
                aria-label={prompt || t("lp.top10")}
                disabled={game.over}
                onFocus={() => wantPool?.()}
                onChange={(e) => { skip(); if (note) setNote(null); wantPool?.(); setEntry(e.target.value); }}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  e.preventDefault();
                  if (suggestions[0]) { send(suggestions[0]); return; }
                  // Nothing matches what is typed: one quiet line, no strike, so
                  // the screen does not look frozen (the design session's play).
                  if (entry.trim().length >= 2 && !landRef.current) {
                    setNote({ kind: "pick", name: entry.trim(), by: gameRef.current.turn });
                    setSaid(t("t10t.pick"));
                    afters.current.forEach(clearTimeout); afters.current = [];
                    after(wait.note, () => setNote(null));
                  }
                }}
                autoCapitalize="words" autoCorrect="off" autoComplete="off" spellCheck={false} enterKeyHint="go"
              />
            </label>
            <span className="tt-say" aria-hidden="true">
              {sayItem && (sayItem.kind === "hit" ? (
                <>
                  <em className="tt-ok is-bump"><Check size={18} strokeWidth={3} /></em>
                  <b ref={nameRef}>{sayItem.name}</b>
                  <i>{t("t10t.number", { n: land ? land.slot + 1 : sayItem.n })}</i>
                </>
              ) : sayItem.kind === "miss" ? (
                <>
                  <b ref={nameRef} className="is-struck">{sayItem.name}</b>
                  <span className="tt-bs">
                    {Array.from({ length: TURNS_STRIKES }, (_, j) => (
                      <em key={j} ref={land && j === sayItem.k - 1 ? markRef : undefined} className={j < sayItem.k - (land ? 1 : 0) ? "on" : undefined}><X size={15} strokeWidth={3.2} /></em>
                    ))}
                  </span>
                </>
              ) : (
                <>
                  <b>{sayItem.name}</b>
                  <i className="is-quiet">{t(sayItem.kind === "found" ? "t10t.foundAlready" : sayItem.kind === "pick" ? "t10t.pick" : "t10t.triedAlready")}</i>
                </>
              ))}
            </span>
          </div>
          {suggestions.length > 0 && !land && (
            <div className="tt-drop" style={{ maxHeight: dropMax }}>
              {suggestions.map((s) => (
                <button key={s.key} type="button" className="tt-opt"
                  // Keep the field focused and the keyboard up (Top10.jsx, 9 Oct 2026).
                  onPointerDown={(e) => e.preventDefault()}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => send(s)}>
                  <span className="tt-opt-n">{s.name}</span>
                  {s.sub ? <span className="tt-opt-s">{s.sub}</span> : null}
                </button>
              ))}
            </div>
          )}
        </div>
        {/* The missed names are one plain line of words, newest first: no pills,
            no discs, nothing cut at the edge (the redraw he approved, knowing
            the line no longer says who missed each name; the chips count that).
            Past MISSED_SHOWN names the rest is "and N more", so six players'
            misses cannot push the ten off the screen. */}
        <div className="tt-msr">
          <p ref={msRef} className={`tt-ms${missed.length ? "" : " is-none"}`}>
            <span className="tt-ms-l">{t("t10t.notOn")}: </span>
            {missed.length === 0 && t("t10t.none")}
            {missed.slice(0, MISSED_SHOWN).map((m, i) => {
              const isLand = land && land.kind === "miss" && land.key === m.key;
              const last = i === Math.min(missed.length, MISSED_SHOWN) - 1;
              return (
                <span key={m.key} className={`tt-mc${isLand ? " is-land" : ""}${redKey === m.key ? " is-red" : ""}`}>
                  <b>{m.name}</b>{last ? (missed.length > MISSED_SHOWN ? " " : "") : ", "}
                </span>
              );
            })}
            {missed.length > MISSED_SHOWN && <span className="tt-ms-more">{t("t10t.more", { count: missed.length - MISSED_SHOWN })}</span>}
          </p>
        </div>
      </div>
      {rows(false)}
      <p className="tt-rule">{t("t10t.rule")}</p>
      <p className="sr-only" role="status" aria-live="polite">{said}</p>
    </div>
  );
}
