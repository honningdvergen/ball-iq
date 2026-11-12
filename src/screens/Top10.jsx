// Top 10 — a ranked list of ten, three lives, name them all.
//
// Built on the same seams as TransferTrail and MysteryPlayer so it can mount
// both in the app and as an island on a static page:
//   - no import from App.jsx; haptics, sound and confetti arrive in `services`
//   - the lists (src/data/top10Lists.json) are import()ed when the screen opens, and
//     the nine-thousand-name player pool only when a player list's guess box is
//     first focused, so neither weighs on Home
//   - the finish is the shared DailyDone panel
//
// The board is two columns of five ON PURPOSE. Ten rows in one column push the
// guess box under a phone keyboard; this way the question, the box and all ten
// ranks stay visible while typing, which is the whole game.
import GameTitle from "../components/GameTitle.jsx";
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import ChallengeBanner from "../components/ChallengeBanner.jsx";
import { Heart } from "lucide-react";
import { dateToYMD } from "../lib/date.js";
import {
  TOP10_LIVES, TOP10_HINTS,
  getTop10Number,
  getTop10Id,
  gradeTop10,
  outcomeOf,
  slotIndexFor,
  nearFor,
  rankListSuggestions,
  loadTop10Day,
  saveTop10Day,
  computeTop10Streak,
  buildTop10ShareText,
  formatAsOf,
  fitTop10Board, hasLongWord, doneRowFor, T10_SHORT_UNDER,
  T10_ROW_MAX,
  top10GuessPool,
} from "../lib/top10.js";
import { resolveDailyServices } from "../games/dailyServices.js";
import { DailyDone } from "../components/DailyDone.jsx";
import { usePlayerPool } from "../lib/usePlayerPool.js";
import { rankPlayerSuggestions, suggestionSubtitle, SUGGEST_MAX } from "../lib/playerSearch.js";
import { useKeyboardAwareInput, useDropdownMaxHeight, visibleBottom } from "../lib/useKeyboardAwareInput.js";
import ResultFoot from "../components/ResultFoot.jsx";
import { MODE_ACCENT, MODE_RGB } from "../lib/accents.js";
import { t as tNow, useT } from "../i18n/index.js";
import "../i18n/en.js"; // the full English table: not on Home's eager path
import "./top10.css";

const PLACEHOLDER = { player: "game.typePlayer", club: "top10.typeClub", nation: "top10.typeNation" };
const SKIN = { "--t10": MODE_ACCENT.top10, "--t10-rgb": MODE_RGB.top10 };
// How long a pick is held before the board answers. Alex, 9 Oct: "the relief
// you get when you see, oh thank God that Chad was at number seven". Relief
// needs a moment of not knowing first; long enough to feel, short enough that
// ten picks do not drag.
const BEAT_MS = 380;
const isCalm = () => {
  try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; }
};

// The lists: the build's own copy, or a newer one fetched from the site and
// kept (lib/top10Remote.js), whichever is good. An installed app that holds no
// list for the day asked for goes and fetches before saying there is none: the
// first open after its bundled schedule has run out.
// `library`: the Top 10 browser, which needs every list but not today's, so an
// installed app past its bundled schedule does not refetch before drawing it.
export function useTop10Data(date, listId, { library = false } = {}) {
  const [state, setState] = useState({ data: null, failed: false });
  useEffect(() => {
    let live = true;
    (async () => {
      // ⚠️ THE WEBSITE NEVER LOADS THE FETCHING CODE. Its own bundle is the
      // newest there is, so it has nothing to gain, and something to lose: a
      // lazy chunk that fails to load (a flaky connection, a content blocker)
      // makes the page reload itself once (main.jsx, vite:preloadError), and
      // that reload would have happened on the way INTO Top 10. On the web
      // this hook is the one import it always was.
      let native = false;
      try { native = !!window.Capacitor?.isNativePlatform?.(); } catch { /* not an app */ }
      const [bundled, remote] = await Promise.all([
        import("../data/top10Lists.json").then((m) => m.default || m),
        native ? import("../lib/top10Remote.js").catch(() => null) : null,
      ]);
      let data = remote ? remote.pickTop10Data(bundled, remote.cachedTop10()) : bundled;
      const missing = library ? false : listId ? !Object.hasOwn(data.lists, listId) : getTop10Number(date) > data.log.length;
      if (remote && missing) {
        const got = await remote.refreshTop10({ force: true });
        data = remote.pickTop10Data(bundled, remote.cachedTop10());
        // Home was drawn before this fetch: tell the app, so its row follows.
        if (got === "updated") { try { window.dispatchEvent(new Event("biq:top10-updated")); } catch { /* fine */ } }
      }
      if (live) setState({ data, failed: false });
    })().catch(() => { if (live) setState({ data: null, failed: true }); });
    return () => { live = false; };
    // The day asked for when the screen opened decides whether to fetch; a
    // clock that passes midnight with the screen open does not fetch again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return state;
}

function Head({ number, sub, lives, onBack, embedded }) {
  const t = useT();
  return (
    <div className={`t10-head${embedded ? " is-embedded" : ""}`}>
      {onBack && <button className="back-btn" onClick={onBack} aria-label={t("game.back")}>←</button>}
      {embedded ? (
        <div className="t10-mast">
          {number > 0 && <><b>Top 10 #{number}</b>{" · "}</>}{sub}
        </div>
      ) : (
        <div style={{ flex: 1, minWidth: 0 }}>
          <GameTitle no={number} className="t10-head-title">Top 10</GameTitle>
          <div className="t10-head-sub">{sub}</div>
        </div>
      )}
      {lives != null && (
        <div className="t10-lives" role="img" aria-label={t("top10.lives", { n: lives, max: TOP10_LIVES })}>
          {Array.from({ length: TOP10_LIVES }, (_, i) => (
            <Heart key={i} size={20} strokeWidth={2.4}
              className={`t10-heart${i < lives ? "" : " is-lost"}`}
              fill={i < lives ? "currentColor" : "none"} aria-hidden="true" />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Top10({ date = new Date(), listId, onBack, onReport, onMoreLists, services, embedded = false }) {
  const t = useT();
  const { data, failed } = useTop10Data(date, listId);
  // `listId` plays one list by name instead of the day's: the door the archive
  // and the club lists will use. It has no number and never counts as a daily.
  const number = listId ? 0 : getTop10Number(date);
  // hasOwn: `?list=constructor` must be "no such list", not Object's own constructor
  const wanted = data ? (listId || getTop10Id(date, data.log)) : null;
  const list = wanted && Object.hasOwn(data.lists, wanted) ? data.lists[wanted] : null;

  if (!data && !failed) {
    return (
      <div className="screen t10" style={SKIN} aria-busy="true">
        <Head number={number} sub={t("top10.sub")} onBack={onBack} embedded={embedded} />
        <div className="t10-board is-l" style={{ "--t10-row": `${T10_ROW_MAX}px` }} aria-hidden="true">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="t10-cell is-open is-skeleton"><span className="t10-rank">{i + 1}</span></div>
          ))}
        </div>
      </div>
    );
  }
  // Before launch day, past the end of the schedule a build carries, or offline
  // on the first open: say so rather than draw an empty board.
  if (!list) {
    return (
      <div className="screen t10" style={{ ...SKIN, padding: 24, textAlign: "center" }}>
        {onBack && <button className="back-btn" onClick={onBack} aria-label={t("game.back")}>←</button>}
        <div style={{ marginTop: 60, fontSize: 20, fontWeight: 800, color: "var(--t1)" }}>Top 10</div>
        <div style={{ fontSize: 14, color: "var(--t2)", marginTop: 8 }}>
          {t(failed ? "top10.loadFail" : "top10.soon")}
        </div>
      </div>
    );
  }
  // Keyed on the list so a day that rolls over at midnight, or a corrected
  // list, starts from that list's own saved state and never another's.
  return (
    <Top10Board key={`${list.id}:${dateToYMD(date)}`} list={list} data={data} date={date} number={number}
      byName={!!listId} onBack={onBack} onReport={onReport} onMoreLists={onMoreLists} services={services} embedded={embedded} />
  );
}

function Top10Board({ list, data, date, number, byName, onBack, onReport, onMoreLists, services, embedded }) {
  const t = useT();
  const { haptic, playSound, Confetti, GetAppCTA, dailyDone, shareCard } = resolveDailyServices(services);
  // A list opened by name is saved under its own id, so it can never be read
  // back as a day's result (and so never feeds the streak).
  const ymd = byName ? `list_${list.id}` : dateToYMD(date);
  const isArchive = byName || ymd !== dateToYMD(new Date());

  const [day, setDay] = useState(() => {
    const saved = loadTop10Day(ymd);
    return saved && saved.id === list.id
      ? { picks: saved.picks, gaveUp: !!saved.gaveUp, hints: Array.isArray(saved.hints) ? saved.hints : [] }
      : { picks: [], gaveUp: false, hints: [] };
  });
  const [entry, setEntry] = useState("");
  const [shake, setShake] = useState(false);
  const [said, setSaid] = useState(null);     // { n, tone, text } — the last pick, in words
  const [fresh, setFresh] = useState(-1);     // the slot that was just filled
  const [armed, setArmed] = useState(false);  // "give up" needs a second tap
  const [judging, setJudging] = useState(null); // the pick being held for its beat: { name }
  // Is the player typing on a touch screen, i.e. is a keyboard up? Then the
  // board is fitted to the room above the keyboard (fitTop10Board, which has
  // the why). Otherwise it takes the room it has: Alex, in the simulator on
  // launch day, "we can probably use slightly more vertical space ... make the
  // list less compact". Focus is what starts the fitting; the keyboard's real
  // height (kbInset, from the native plugin or the visual viewport) is what
  // sizes it, so before the keyboard has risen the board is still roomy.
  const [typing, setTyping] = useState(false);
  const touch = useMemo(() => { try { return window.matchMedia("(pointer: coarse)").matches; } catch { return true; } }, []);
  const boardRef = useRef(null);
  const [fit, setFit] = useState({ row: T10_ROW_MAX, tight: false, size: "l" });
  const beat = useRef(0);
  // A pick still in the air when the screen closes is dropped: the player never
  // saw its answer, so it must not be recorded.
  useEffect(() => () => clearTimeout(beat.current), []);

  const g = useMemo(() => gradeTop10(list, day), [list, day]);
  const total = list.slots.length;

  useEffect(() => {
    saveTop10Day(ymd, {
      id: list.id, status: g.done ? "done" : "playing", score: g.score,
      picks: day.picks, gaveUp: day.gaveUp, hints: day.hints || [], ...(isArchive ? { arc: 1 } : {}),
    });
  }, [ymd, list.id, day, g.done, g.score, isArchive]);

  // The shared daily-completed event, exactly once, and never for an archive
  // play: see the long notes on the same effect in TransferTrail.jsx. A list
  // already finished when the screen opens was announced then; opening it to
  // review paid its XP again every time until 12 Oct 2026.
  const announced = useRef((() => { const saved = loadTop10Day(ymd); return !!saved && saved.id === list.id && saved.status === "done"; })());
  // Opened to look at, not to play: tell the app so the visit is not logged as
  // an abandoned game. No XP and no scores row ride on this.
  useEffect(() => {
    if (!announced.current) return;
    try { window.dispatchEvent(new CustomEvent("biq:daily-reviewed", { detail: { game: "top10" } })); } catch { /* best effort */ }
  }, []);
  useEffect(() => {
    if (!g.done || announced.current) return;
    announced.current = true;
    if (isArchive) {
      try { window.dispatchEvent(new CustomEvent("biq:archive-completed", { detail: { game: "top10", ymd } })); } catch {}
      return;
    }
    try {
      window.dispatchEvent(new CustomEvent("biq:daily-completed", {
        detail: { positive: g.score * 2 >= total, game: "top10", won: g.perfect, score: g.score, total, attempts: Math.max(1, g.wrong.length) },
      }));
    } catch { /* best effort; never block the reveal */ }
  }, [g.done, g.perfect, g.score, g.wrong.length, total, isArchive, ymd]);

  // ── The guess box ──────────────────────────────────────────────────────────
  const { pool, ensure: ensurePool } = usePlayerPool({ extras: true });
  const playerPool = useMemo(() => {
    if (list.kind !== "player") return [];
    return top10GuessPool(list, pool, data.extras);
  }, [list, pool, data.extras]);
  const suggestions = useMemo(() => {
    if (g.done) return [];
    if (list.kind === "player") {
      return rankPlayerSuggestions(playerPool, entry, { limit: SUGGEST_MAX, exclude: g.picked })
        .map((p) => ({ key: p.id, name: p.name, sub: suggestionSubtitle(p) }));
    }
    return rankListSuggestions(data.pools?.[list.kind], entry, { limit: SUGGEST_MAX, exclude: g.picked });
  }, [g.done, g.picked, list.kind, playerPool, data.pools, entry]);
  const wantPool = list.kind === "player" ? ensurePool : undefined;

  const { inputRef, keepInputVisible, kbInset } = useKeyboardAwareInput();
  // Fit the board after every render while typing: the board moves whenever
  // the line above it changes or the header tightens, and the keyboard's
  // height arrives a moment after focus. Only a changed answer sets state, so
  // this settles in one or two passes and cannot loop.
  // A keyboard that has reported a height counts whatever the pointer says: a
  // phone whose primary pointer reads "fine" (a stylus, a paired mouse) would
  // otherwise keep 60pt rows under its keyboard.
  const fitting = typing && !g.done && (touch || kbInset > 0);
  const measureFit = useRef(null);
  measureFit.current = () => {
    const el = boardRef.current;
    const next = fitting && el
      ? fitTop10Board(visibleBottom(kbInset) - el.getBoundingClientRect().top - 6, fit.tight)
      : g.done ? (() => { const r = doneRowFor(window.innerHeight); return { row: r, tight: false, size: r >= 52 ? "l" : "m" }; })()
      : { row: T10_ROW_MAX, tight: false, size: "l" };
    if (next.row !== fit.row || next.tight !== fit.tight || next.size !== fit.size) setFit({ row: next.row, tight: next.tight, size: next.size });
  };
  useLayoutEffect(() => { measureFit.current(); });
  useEffect(() => {
    const run = () => measureFit.current && measureFit.current();
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    vv?.addEventListener("resize", run); vv?.addEventListener("scroll", run);
    window.addEventListener("resize", run);
    // The page's own scroll moves the board too, and nothing re-renders for it:
    // after a pick keepInputVisible scrolls back up, and without this the last
    // row sat 30 to 50pt under the keyboard until the next keystroke (review,
    // 12 Oct 2026, both engines).
    window.addEventListener("scroll", run, { passive: true });
    return () => {
      vv?.removeEventListener("resize", run); vv?.removeEventListener("scroll", run);
      window.removeEventListener("resize", run); window.removeEventListener("scroll", run);
    };
  }, []);
  // The tightened header is sticky while typing (so it cannot flicker), which
  // means it must be let go by hand when the keyboard goes away with the box
  // still focused (Android's back gesture). Once, on that edge only: letting it
  // go on every pass makes a short window flip it on and off.
  const kbWas = useRef(0);
  useEffect(() => {
    if (kbWas.current > 0 && kbInset === 0) setFit((f) => (f.tight ? { ...f, tight: false } : f));
    kbWas.current = kbInset;
  }, [kbInset]);
  const entryRef = useRef(null);
  const dropMax = useDropdownMaxHeight(entryRef, { kbInset });
  useEffect(() => (g.done ? undefined : keepInputVisible()), [g.score, g.wrong.length, g.close.length, g.done, keepInputVisible]);

  const pick = useCallback((s) => {
    if (g.done || !s || judging) return;
    const outcome = outcomeOf(list, day, s.key);
    if (outcome === "repeat") return;
    const hit = outcome === "hit";
    // A near miss costs no life, so it can never be the pick that ends a game.
    const willEnd = hit ? g.score + 1 >= total : outcome === "miss" && g.lives <= 1;
    setEntry("");
    setArmed(false);
    // Belt and braces for the keyboard: if focus did move (a browser that
    // ignores the pointer-down refusal), take it straight back while we are
    // still inside the tap, which is the only moment iOS allows it.
    if (!willEnd) { try { inputRef.current?.focus({ preventScroll: true }); } catch {} }
    const n = day.picks.length + 1;
    const settle = () => {
      // Blur BEFORE the state update that unmounts a focused input, or iOS
      // leaves the keyboard up and the page scroll-locked (see TransferTrail.jsx).
      if (willEnd) { try { document.activeElement?.blur?.(); } catch {} }
      setJudging(null);
      setDay((d) => ({ ...d, picks: [...d.picks, { k: s.key, n: s.name }] }));
      if (hit) {
        const i = slotIndexFor(list, s.key);
        setFresh(i);
        // A list can accept a second name for a slot (Russia for the Soviet
        // Union). Say so, or the board appears to have filled in a name the
        // player never picked.
        const shown = list.slots[i].name;
        const who = shown === s.name ? s.name : tNow("top10.countsAs", { name: s.name, shown });
        // The places, "1st" … "10th", are one i18n string (top10.ords).
        setSaid({ n, tone: "hit", text: `${who}: ${tNow("top10.ords").split(" ")[i] || `${i + 1}th`}` });
        haptic("hardCorrect"); playSound("correct");
      } else {
        const near = nearFor(list, s.key);
        setFresh(-1);
        setSaid(near
          // No name in it: the player has just typed the name, and a long one
          // ("Wolverhampton Wanderers") wrapped this line and pushed the board
          // down a row while the keyboard was up.
          ? { n, tone: "near", text: tNow("top10.near", { note: near.note }) }
          : { n, tone: "miss", text: tNow("top10.miss", { name: s.name }) });
        if (near) haptic("soft");
        else { haptic("wrong"); playSound("wrong"); setShake(true); setTimeout(() => setShake(false), 300); }
      }
    };
    if (isCalm()) { settle(); return; }
    setSaid(null);
    setJudging({ name: s.name });
    haptic("soft");
    beat.current = setTimeout(settle, BEAT_MS);
  }, [g.done, g.score, g.lives, judging, list, day, total, haptic, playSound, inputRef]);

  // A hint (Alex, 23 Oct: "I was stuck, need a hint", and the only way out was
  // giving up): the first letter of the highest-ranked name still open, shown
  // in its place. Up to TOP10_HINTS a game; no life is lost, but the finish and
  // the share say how many were used.
  const hints = useMemo(() => day.hints || [], [day.hints]);
  const hintable = useMemo(() => list.slots.findIndex((_, i) => !g.found[i] && !hints.includes(i)), [list, g.found, hints]);
  const takeHint = useCallback(() => {
    if (g.done || hints.length >= TOP10_HINTS || hintable < 0) return;
    haptic("soft");
    setDay((d) => ({ ...d, hints: [...(d.hints || []), hintable] }));
  }, [g.done, hints.length, hintable, haptic]);

  const giveUp = useCallback(() => {
    if (!armed) { setArmed(true); return; }
    try { document.activeElement?.blur?.(); } catch {}
    setDay((d) => ({ ...d, gaveUp: true }));
  }, [armed]);
  // An armed button that is left alone stands down, so it cannot be set off by
  // a stray tap a minute later.
  useEffect(() => {
    if (!armed) return undefined;
    const t = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(t);
  }, [armed]);

  // ── The finish ─────────────────────────────────────────────────────────────
  const streak = useMemo(() => (g.done && !isArchive ? computeTop10Streak(date) : 0), [g.done, isArchive, date]);
  const shareText = useMemo(
    () => (g.done ? buildTop10ShareText({ number, title: list.title, found: g.found, lives: g.lives, streak }) : ""),
    [g.done, g.found, g.lives, number, list.title, streak],
  );
  const onShare = useCallback(async () => {
    if (!shareText) return;
    // In the app the result goes as a picture (shareCardRender "top10"): the
    // emoji text came out as one long bar of blocks in a chat (23 Oct).
    if (shareCard) {
      const toast = (m) => window.dispatchEvent(new CustomEvent("biq:show-toast", { detail: m }));
      return shareCard("top10", { num: number, title: list.title, found: g.found, lives: g.lives, hints: (day.hints || []).length, deepLink: "/top10" }, { textFallback: shareText, onToast: toast });
    }
    try { if (navigator.share) { await navigator.share({ text: shareText }); return; } } catch { return false; }
    try {
      await navigator.clipboard.writeText(shareText);
      window.dispatchEvent(new CustomEvent("biq:show-toast", { detail: `📋 ${tNow("game.copied")}` }));
    } catch {}
  }, [shareText, shareCard, number, list.title, g.found, g.lives, day.hints]);

  const verdict = g.perfect
    ? (g.lives === TOP10_LIVES ? t("top10.allClean") : t("top10.allSpare", { count: g.lives }))
    : g.out ? t("top10.out")
      // "You called it there" read oddly over a 0/10 (design pass, 16 Oct 2026):
      // say something true about the game they had.
      : g.score === 0 ? t("top10.zero")
        : t("top10.found", { n: g.score });
  // ⚠️ THE FINISH SAID THE SCORE THREE TIMES: here ("1 of 10"), on the count
  // beside the date ("1/10") and in the large figure under the board (13 Oct
  // 2026). The large figure is the one; the header names the state and the
  // count is for a game still being played.
  const sub = t(g.done ? (g.perfect ? "top10.perfect" : "top10.full") : "top10.sub");
  let missedSeen = 0;

  return (
    <div className={`screen t10${fit.tight ? " is-tight" : ""}${g.done && typeof window !== "undefined" && window.innerHeight < T10_SHORT_UNDER ? " is-short" : ""}`} style={{ ...SKIN, paddingBottom: kbInset ? 20 + kbInset : "var(--foot-clear, 20px)" }}>
      {g.perfect && Confetti ? <Confetti /> : null}
      <Head number={number} sub={sub} lives={g.done ? null : g.lives} onBack={onBack} embedded={embedded} />
      {!isArchive && <ChallengeBanner game="top10" edition={number} finished={g.done} />}

      <div className="t10-q">
        <h2 className="t10-q-title">{list.title}</h2>
        <div className="t10-q-meta">
          <span>{t("top10.asOf", { d: formatAsOf(list.asOf) })}{list.clueLabel ? ` · ${t("top10.clue", { c: list.clueLabel.toLowerCase() })}` : ""}</span>
          {!g.done && <span className="t10-q-count">{g.score}/{total}</span>}
        </div>
        {/* What counts, and how level entries are ordered. A ranked list is
            unfair without it: "since when?" and "why is he above him?" are
            the two things a fan will ask of the answer. */}
        {list.note ? <p className="t10-q-note">{list.note}</p> : null}
        {/* No progress strip here (Alex, 13 Oct 2026): the board under it is the
            progress, rank by rank, and the count sits beside the date. A strip
            of ten dashes said the same thing a third time. */}
      </div>

      {!g.done && (
        <>
          <div ref={entryRef} className={`t10-entry${shake ? " is-shake" : ""}`}>
            <input
              ref={inputRef}
              className="t10-input"
              value={entry}
              onFocus={() => { wantPool?.(); setTyping(true); }}
              onBlur={() => setTyping(false)}
              onChange={(e) => { wantPool?.(); setEntry(e.target.value); }}
              onKeyDown={(e) => { if (e.key === "Enter" && suggestions[0]) pick(suggestions[0]); }}
              placeholder={PLACEHOLDER[list.kind] && t(PLACEHOLDER[list.kind])}
              aria-label={t("game.yourGuess")}
              autoCapitalize="words" autoCorrect="off" autoComplete="off" spellCheck={false}
              enterKeyHint="go"
            />
            {suggestions.length > 0 && (
              <div className="t10-drop" style={{ maxHeight: dropMax }}>
                {suggestions.map((s) => (
                  <button key={s.key} type="button" className="t10-opt"
                    // ⚠️ SEEN IN THE SIMULATOR, 2026-10-09: tapping a suggestion
                    // moved focus to the button, iOS dropped the keyboard, and the
                    // next guess needed a tap on the box first. Ten names, ten
                    // extra taps. Refusing the focus change on pointer-down keeps
                    // the box focused and the keyboard up; the click still fires.
                    onPointerDown={(e) => e.preventDefault()}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pick(s)}>
                    <span className="t10-opt-name">{s.name}</span>
                    {s.sub ? <span className="t10-opt-sub">{s.sub}</span> : null}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className={`t10-say${judging ? " is-wait" : said ? ` is-${said.tone}` : ""}`} aria-live="polite">
            {judging
              ? <span key="wait">{judging.name}<b className="t10-dots" aria-hidden="true"><i /><i /><i /></b></span>
              : said ? <span key={said.n}>{said.text}</span> : null}
          </div>
        </>
      )}

      <div ref={boardRef} className={`t10-board is-${fit.size}${fitting && kbInset > 0 ? " is-fit" : ""}${judging ? " is-wait" : ""}`} style={{ "--t10-row": `${fit.row}px` }} role="list" aria-label={t("top10.theTen")}>
        {list.slots.map((s, i) => {
          const found = g.found[i];
          const missed = g.done && !found;
          const delay = missed ? missedSeen++ * 70 : 0;
          return (
            <div key={s.key} role="listitem"
              className={`t10-cell ${found ? "is-found" : missed ? "is-missed" : "is-open"}${i === fresh && found ? " is-new" : ""}`}
              style={missed ? { "--t10-d": `${delay}ms` } : { "--t10-i": i }}>
              <span className={`t10-rank${i < 3 ? ` is-p${i + 1}` : ""}`}>{i + 1}</span>
              <span className="t10-body">
                {(found || missed) && <span className={`t10-name${hasLongWord(s.name) ? " is-long" : ""}${s.name.length >= 15 ? " is-wide" : ""}`}>{s.name}</span>}
                {!found && !missed && hints.includes(i) && <span className="t10-name is-hint">{`${s.name.charAt(0)}…`}</span>}
                {s.clue ? <span className="t10-clue">{s.clue}</span> : null}
              </span>
            </div>
          );
        })}
      </div>

      {(g.wrong.length > 0 || g.close.length > 0) && (
        <div className="t10-wrong" aria-label={t("top10.notIn")}>
          {g.wrong.map((w) => (
            <span key={w.key} className="t10-chip"><s>{w.name}</s></span>
          ))}
          {g.close.map((w) => (
            <span key={w.key} className="t10-chip is-close">{w.name}<em>{` ${w.near.note.split(",")[0]}`}</em></span>
          ))}
        </div>
      )}

      {!g.done && (
        <div className="t10-help">
          {hints.length < TOP10_HINTS && hintable >= 0 && (
            <button type="button" className="t10-hint" onClick={takeHint}>
              {t("top10.hint", { n: TOP10_HINTS - hints.length })}
            </button>
          )}
          <button type="button" className={`t10-ghost${armed ? " is-armed" : ""}`} onClick={giveUp}>
            {t(armed ? "top10.giveUpArmed" : "top10.giveUp")}
          </button>
        </div>
      )}

      {g.done && (
        <div className="t10-result">
          <div className={`t10-score${g.score * 2 >= total ? " is-earned" : ""}`}>{g.score}<small> / {total}</small></div>
          <div className="t10-verdict">{verdict}{hints.length > 0 ? ` ${t(hints.length === 1 ? "top10.hintsOne" : "top10.hintsN", { n: hints.length })}` : ""}</div>
          <div style={{ marginTop: 14 }}>
            <DailyDone
              game="top10"
              edition={number}
              won
              bucket={g.score}
              isArchive={isArchive}
              streak={dailyDone?.streak || { count: streak, label: t("dd.l.top10") }}
              promoted={dailyDone?.promoted}
              onShare={onShare}
              remind={dailyDone?.remind}
              nextUp={dailyDone?.nextUp || []}
              day={dailyDone?.day}
              save={dailyDone?.save}
              GetAppCTA={GetAppCTA}
              track={dailyDone?.track}
            />
          </div>
          {/* A wrong list is unfalsifiable from inside the game: the player
              cannot tell a name they forgot from a name we got wrong. */}
          <ResultFoot thing="List" onReport={onReport} onHome={onBack}
            more={onMoreLists ? { label: t("top10.more"), onClick: onMoreLists, accent: "var(--t10)" } : null}
            info={{
              id: `top10:${list.id}`,
              q: `Top 10 ${number ? `#${number}` : `list ${list.id}`} — ${list.title} (as of ${list.asOf}): ${list.slots.map((s, i) => `${i + 1}. ${s.name}`).join(", ")}`,
              picked: null,
              correct: null,
              mode: "top10",
            }} />
        </div>
      )}
    </div>
  );
}
