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
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Heart } from "lucide-react";
import { dateToYMD } from "../lib/date.js";
import {
  TOP10_LIVES,
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
} from "../lib/top10.js";
import { resolveDailyServices } from "../games/dailyServices.js";
import { DailyDone } from "../components/DailyDone.jsx";
import { usePlayerPool } from "../lib/usePlayerPool.js";
import { rankPlayerSuggestions, suggestionSubtitle } from "../lib/playerSearch.js";
import { useKeyboardAwareInput, useDropdownMaxHeight } from "../lib/useKeyboardAwareInput.js";
import ReportButton from "../components/ReportButton.jsx";
import { MODE_ACCENT, MODE_RGB } from "../lib/accents.js";
import "./top10.css";

const ORDINAL = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"];
const PLACEHOLDER = { player: "Type a player’s name…", club: "Type a club…", nation: "Type a country…" };
const SKIN = { "--t10": MODE_ACCENT.top10, "--t10-rgb": MODE_RGB.top10 };

function useTop10Data() {
  const [state, setState] = useState({ data: null, failed: false });
  useEffect(() => {
    let live = true;
    import("../data/top10Lists.json")
      .then((m) => { if (live) setState({ data: m.default || m, failed: false }); })
      .catch(() => { if (live) setState({ data: null, failed: true }); });
    return () => { live = false; };
  }, []);
  return state;
}

function Head({ number, sub, lives, onBack, embedded }) {
  return (
    <div className={`t10-head${embedded ? " is-embedded" : ""}`}>
      {onBack && <button className="back-btn" onClick={onBack} aria-label="Back">←</button>}
      {embedded ? (
        <div className="t10-mast">
          {number > 0 && <><b>Top 10 #{number}</b>{" · "}</>}{sub}
        </div>
      ) : (
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="t10-head-title">Top 10{number > 0 ? ` #${number}` : ""}</div>
          <div className="t10-head-sub">{sub}</div>
        </div>
      )}
      {lives != null && (
        <div className="t10-lives" role="img" aria-label={`${lives} of ${TOP10_LIVES} lives left`}>
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

export default function Top10({ date = new Date(), listId, onBack, onReport, services, embedded = false }) {
  const { data, failed } = useTop10Data();
  // `listId` plays one list by name instead of the day's: the door the archive
  // and the club lists will use. It has no number and never counts as a daily.
  const number = listId ? 0 : getTop10Number(date);
  const list = data ? data.lists[listId || getTop10Id(date, data.log)] : null;

  if (!data && !failed) {
    return (
      <div className="screen t10" style={SKIN} aria-busy="true">
        <Head number={number} sub="Name all ten. Three lives." onBack={onBack} embedded={embedded} />
        <div className="t10-board" aria-hidden="true">
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
        {onBack && <button className="back-btn" onClick={onBack} aria-label="Back">←</button>}
        <div style={{ marginTop: 60, fontSize: 20, fontWeight: 800, color: "var(--t1)" }}>Top 10</div>
        <div style={{ fontSize: 14, color: "var(--t2)", marginTop: 8 }}>
          {failed ? "Could not load today’s list. Check your connection and try again."
            : "A new list of ten to name every day. Coming soon."}
        </div>
      </div>
    );
  }
  // Keyed on the list so a day that rolls over at midnight, or a corrected
  // list, starts from that list's own saved state and never another's.
  return (
    <Top10Board key={`${list.id}:${dateToYMD(date)}`} list={list} data={data} date={date} number={number}
      byName={!!listId} onBack={onBack} onReport={onReport} services={services} embedded={embedded} />
  );
}

function Top10Board({ list, data, date, number, byName, onBack, onReport, services, embedded }) {
  const { haptic, playSound, Confetti, GetAppCTA, dailyDone } = resolveDailyServices(services);
  // A list opened by name is saved under its own id, so it can never be read
  // back as a day's result (and so never feeds the streak).
  const ymd = byName ? `list_${list.id}` : dateToYMD(date);
  const isArchive = byName || ymd !== dateToYMD(new Date());

  const [day, setDay] = useState(() => {
    const saved = loadTop10Day(ymd);
    return saved && saved.id === list.id ? { picks: saved.picks, gaveUp: !!saved.gaveUp } : { picks: [], gaveUp: false };
  });
  const [entry, setEntry] = useState("");
  const [shake, setShake] = useState(false);
  const [said, setSaid] = useState(null);     // { n, tone, text } — the last pick, in words
  const [fresh, setFresh] = useState(-1);     // the slot that was just filled
  const [armed, setArmed] = useState(false);  // "give up" needs a second tap

  const g = useMemo(() => gradeTop10(list, day), [list, day]);
  const total = list.slots.length;

  useEffect(() => {
    saveTop10Day(ymd, {
      id: list.id, status: g.done ? "done" : "playing", score: g.score,
      picks: day.picks, gaveUp: day.gaveUp, ...(isArchive ? { arc: 1 } : {}),
    });
  }, [ymd, list.id, day, g.done, g.score, isArchive]);

  // The shared daily-completed event, exactly once, and never for an archive
  // play: see the long notes on the same effect in TransferTrail.jsx.
  const announced = useRef(false);
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
  const { pool, ensure: ensurePool } = usePlayerPool();
  const playerPool = useMemo(
    () => (list.kind === "player"
      ? [...pool, ...(data.extras || []).map((e) => ({ id: e.key, name: e.name, fame: 0 }))]
      : []),
    [list.kind, pool, data.extras],
  );
  const suggestions = useMemo(() => {
    if (g.done) return [];
    if (list.kind === "player") {
      return rankPlayerSuggestions(playerPool, entry, { limit: 6, exclude: g.picked })
        .map((p) => ({ key: p.id, name: p.name, sub: suggestionSubtitle(p) }));
    }
    return rankListSuggestions(data.pools?.[list.kind], entry, { limit: 6, exclude: g.picked });
  }, [g.done, g.picked, list.kind, playerPool, data.pools, entry]);
  const wantPool = list.kind === "player" ? ensurePool : undefined;

  const { inputRef, keepInputVisible, kbInset } = useKeyboardAwareInput();
  const entryRef = useRef(null);
  const dropMax = useDropdownMaxHeight(entryRef, { kbInset });
  useEffect(() => (g.done ? undefined : keepInputVisible()), [g.score, g.wrong.length, g.close.length, g.done, keepInputVisible]);

  const pick = useCallback((s) => {
    if (g.done || !s) return;
    const outcome = outcomeOf(list, day, s.key);
    if (outcome === "repeat") return;
    const hit = outcome === "hit";
    // Blur BEFORE the state update that unmounts a focused input, or iOS leaves
    // the keyboard up and the page scroll-locked (see TransferTrail.jsx).
    const willEnd = hit ? g.score + 1 >= total : g.lives <= 1;
    if (willEnd) { try { document.activeElement?.blur?.(); } catch {} }
    setDay((d) => ({ ...d, picks: [...d.picks, { k: s.key, n: s.name }] }));
    setEntry("");
    setArmed(false);
    const n = day.picks.length + 1;
    if (hit) {
      const i = slotIndexFor(list, s.key);
      setFresh(i);
      // A list can accept a second name for a slot (Russia for the Soviet
      // Union). Say so, or the board appears to have filled in a name the
      // player never picked.
      const shown = list.slots[i].name;
      const who = shown === s.name ? s.name : `${s.name} counts as ${shown}`;
      setSaid({ n, tone: "hit", text: `${who}: ${ORDINAL[i] || `${i + 1}th`}` });
      haptic("hardCorrect"); playSound("correct");
    } else {
      const near = nearFor(list, s.key);
      setFresh(-1);
      setSaid(near
        ? { n, tone: "near", text: `${s.name}: so close, ${near.note}. No life lost.` }
        : { n, tone: "miss", text: `${s.name}: not in the ten` });
      if (near) haptic("soft");
      else { haptic("wrong"); playSound("wrong"); setShake(true); setTimeout(() => setShake(false), 300); }
    }
  }, [g.done, g.score, g.lives, list, day, total, haptic, playSound]);

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
    try { if (navigator.share) { await navigator.share({ text: shareText }); return; } } catch { return; }
    try {
      await navigator.clipboard.writeText(shareText);
      window.dispatchEvent(new CustomEvent("biq:show-toast", { detail: "📋 Copied — paste it anywhere" }));
    } catch {}
  }, [shareText]);

  const verdict = g.perfect
    ? (g.lives === TOP10_LIVES ? "All ten, without a single miss." : `All ten, with ${g.lives} ${g.lives === 1 ? "life" : "lives"} to spare.`)
    : g.out ? "Out of lives. The ones that got away are filled in above."
      : "You called it there. The rest are filled in above.";
  const sub = g.done ? (g.perfect ? "Perfect ten" : `${g.score} of ${total}`) : "Name all ten. Three lives.";
  let missedSeen = 0;

  return (
    <div className="screen t10" style={{ ...SKIN, paddingBottom: 20 + kbInset }}>
      {g.perfect && Confetti ? <Confetti /> : null}
      <Head number={number} sub={sub} lives={g.done ? null : g.lives} onBack={onBack} embedded={embedded} />

      <div className="t10-q">
        <h2 className="t10-q-title">{list.title}</h2>
        <div className="t10-q-meta">
          <span>As of {formatAsOf(list.asOf)}{list.clueLabel ? ` · clue: ${list.clueLabel.toLowerCase()}` : ""}</span>
          <span className="t10-q-count">{g.score}/{total}</span>
        </div>
      </div>

      {!g.done && (
        <>
          <div ref={entryRef} className={`t10-entry${shake ? " is-shake" : ""}`}>
            <input
              ref={inputRef}
              className="t10-input"
              value={entry}
              onFocus={wantPool}
              onChange={(e) => { wantPool?.(); setEntry(e.target.value); }}
              onKeyDown={(e) => { if (e.key === "Enter" && suggestions[0]) pick(suggestions[0]); }}
              placeholder={PLACEHOLDER[list.kind]}
              aria-label="Your guess"
              autoCapitalize="words" autoCorrect="off" autoComplete="off" spellCheck={false}
              enterKeyHint="go"
            />
            {suggestions.length > 0 && (
              <div className="t10-drop" style={{ maxHeight: dropMax }}>
                {suggestions.map((s) => (
                  <button key={s.key} type="button" className="t10-opt" onClick={() => pick(s)}>
                    <span className="t10-opt-name">{s.name}</span>
                    {s.sub ? <span className="t10-opt-sub">{s.sub}</span> : null}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className={`t10-say${said ? ` is-${said.tone}` : ""}`} aria-live="polite">
            {said ? <span key={said.n}>{said.text}</span> : null}
          </div>
        </>
      )}

      <div className="t10-board" role="list" aria-label="The ten">
        {list.slots.map((s, i) => {
          const found = g.found[i];
          const missed = g.done && !found;
          const delay = missed ? missedSeen++ * 70 : 0;
          return (
            <div key={s.key} role="listitem"
              className={`t10-cell ${found ? "is-found" : missed ? "is-missed" : "is-open"}${i === fresh && found ? " is-new" : ""}`}
              style={missed ? { "--t10-d": `${delay}ms` } : undefined}>
              <span className="t10-rank">{i + 1}</span>
              <span className="t10-body">
                {(found || missed) && <span className="t10-name">{s.name}</span>}
                {s.clue ? <span className="t10-clue">{s.clue}</span> : null}
              </span>
            </div>
          );
        })}
      </div>

      {(g.wrong.length > 0 || g.close.length > 0) && (
        <div className="t10-wrong" aria-label="Not in the ten">
          {g.wrong.map((w) => (
            <span key={w.key} className="t10-chip"><s>{w.name}</s></span>
          ))}
          {g.close.map((w) => (
            <span key={w.key} className="t10-chip is-close">{w.name}<em>{` ${w.near.note.split(",")[0]}`}</em></span>
          ))}
        </div>
      )}

      {!g.done && (
        <button type="button" className={`t10-ghost${armed ? " is-armed" : ""}`} onClick={giveUp}>
          {armed ? "Tap again to end the game and see the list" : "Stuck? Show me the list"}
        </button>
      )}

      {g.done && (
        <div className="t10-result">
          <div className={`t10-score${g.score * 2 >= total ? " is-earned" : ""}`}>{g.score}<small> / {total}</small></div>
          <div className="t10-verdict">{verdict}</div>
          <div style={{ marginTop: 14 }}>
            <DailyDone
              game="top10"
              edition={number}
              won
              bucket={g.score}
              isArchive={isArchive}
              streak={dailyDone?.streak || { count: streak, label: "Top 10 streak" }}
              onShare={onShare}
              remind={dailyDone?.remind}
              nextUp={dailyDone?.nextUp || []}
              save={dailyDone?.save}
              GetAppCTA={GetAppCTA}
              track={dailyDone?.track}
            />
          </div>
          {/* A wrong list is unfalsifiable from inside the game: the player
              cannot tell a name they forgot from a name we got wrong. */}
          <ReportButton
            onReport={onReport}
            idle="⚑ List looks wrong? Tell us"
            info={{
              id: `top10:${list.id}`,
              q: `Top 10 #${number} — ${list.title} (as of ${list.asOf}): ${list.slots.map((s, i) => `${i + 1}. ${s.name}`).join(", ")}`,
              picked: null,
              correct: null,
              mode: "top10",
            }}
            style={{ marginTop: 8, width: "100%", padding: "12px", borderRadius: 999,
                     border: "1px solid var(--border)", background: "transparent",
                     fontWeight: 700, fontSize: 13 }}
          />
          {onBack && (
            <button onClick={onBack}
              style={{ marginTop: 8, width: "100%", padding: "12px", borderRadius: 999,
                       border: "1px solid var(--border)", background: "transparent", color: "var(--t2)",
                       fontWeight: 700, fontSize: 14, fontFamily: "inherit", cursor: "pointer" }}>Back home</button>
          )}
        </div>
      )}
    </div>
  );
}
