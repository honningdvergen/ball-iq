// Ballpark (prototype, web only, 20 Nov 2026): three football numbers a day,
// one guess each. The rules and the scoring live in lib/ballpark.js; this file
// is the view.
//
// Three states of one screen, no routes inside it:
//   ask      the question, the figure being typed, our own keypad, "Lock it in"
//   reveal   a pitch-green card: the true number counting up, the goal with the
//            guess as a shot at it, what kind of shot it was; under the card,
//            how you could have got near it, the source, "Next number"
//   done     the same card with the total and all three shots; the three rows;
//            Share
//
// Our own keypad, not the phone's: the system number pad covers the lower half
// of the screen and pushes the question out of sight. The number is typed in
// full, blank (lib/ballpark.js says why there are no "million" buttons), and
// read back in words under the figure.
// One solid button per state; everything else is a hairline, a tint or a link.
// Lucide icons only, sentence case, no label above the heading.
//
// ⚠️ PROTOTYPE, HIDDEN. Nothing links here: App.jsx opens it from
// /play?ballpark=1 on the web only (never inside the native shell), so Alex can
// play it on his phone before anything is decided. The schedule is a short
// frozen list that repeats (lib/ballpark.js says what it needs before launch).
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, Delete, ArrowRight, Share, Check, ArrowUpRight } from "lucide-react";
import "./ballpark.css";
import {
  BALLPARK_PER_DAY, BALLPARK_MAX, BALLPARK_DAYS,
  ballparkSlot, ballparkSaveKey, ballparkDay, ballparkPoints, ballparkTier, ballparkMiss,
  ballparkVerdict, ballparkTotal, ballparkSquares, shotSpot, SHOT_BOX,
  pressKey, keypadValue, keypadShown, fullNumber, roundedParts, loadBallpark, saveBallpark,
} from "../lib/ballpark.js";
import "../i18n/en.js"; // the full English table: not on Home's eager path
import { t, useT, fmtLocale } from "../i18n/index.js";

export const BALLPARK_URL = "https://balliq.app/play?ballpark=1";
const SCALE_KEY = { 1000: "bp.thousand", 1000000: "bp.million", 1000000000: "bp.billion" };
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "back"];
const COUNT_MS = 900;

const reducedMotion = () => {
  try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; }
};

// The true number, counted up once. Ends on the exact figure, never a rounded
// one: the last frame sets the target itself.
function useCountUp(target, decimals) {
  const [shown, setShown] = useState(() => (reducedMotion() ? target : 0));
  useEffect(() => {
    if (reducedMotion()) { setShown(target); return undefined; }
    let raf = 0;
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0) / COUNT_MS);
      const eased = p === 1 ? 1 : 1 - 2 ** (-10 * p);
      const v = target * eased;
      setShown(p === 1 ? target : decimals ? Number(v.toFixed(decimals)) : Math.round(v));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, decimals]);
  return shown;
}

const decimalsOf = (n) => { const s = String(n); const i = s.indexOf("."); return i === -1 ? 0 : s.length - i - 1; };
const money = (q, text) => (q.prefix ? `${q.prefix}${text}` : text);
// "3.59 million", in the player's language.
const inWords = (n, locale) => { const r = roundedParts(n, locale); return r ? `${r.n} ${t(SCALE_KEY[r.scale])}` : null; };

async function shareOrCopy(text) {
  try {
    if (navigator.share) { await navigator.share({ text }); return "sent"; }
  } catch (e) {
    if (e && (e.name === "AbortError" || /cancel/i.test(e.message || ""))) return null;
  }
  try { await navigator.clipboard.writeText(text); return "copied"; } catch { return null; }
}

function Pips({ at, done }) {
  return (
    <div className="bp-pips" role={at < 0 ? undefined : "img"} aria-hidden={at < 0 ? "true" : undefined} aria-label={at < 0 ? undefined : t("bp.of", { n: at + 1, m: BALLPARK_PER_DAY })}>
      {Array.from({ length: BALLPARK_PER_DAY }, (_, i) => (
        <span key={i} className={`bp-pip${i < done ? " is-done" : ""}${i === at ? " is-now" : ""}`} />
      ))}
    </div>
  );
}

// ── ASK ────────────────────────────────────────────────────────────────────
function Ask({ q, first, onLock }) {
  const locale = fmtLocale();
  const [text, setText] = useState("");
  const value = keypadValue(text);
  const press = useCallback((k) => setText((cur) => pressKey(cur, k)), []);
  const lock = useCallback(() => { if (value > 0) onLock(value); }, [value, onLock]);

  // A desk keyboard works too: digits, the point, Backspace, Enter.
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (/^[0-9]$/.test(e.key)) press(e.key);
      else if (e.key === "." || e.key === ",") press(".");
      else if (e.key === "Backspace") press("back");
      else if (e.key === "Enter") {
        // Enter on Back (or any control that is not a key of the pad) is that
        // control's own. A held Enter must not run on into the reveal.
        const el = e.target instanceof HTMLElement ? e.target.closest("a,button") : null;
        if (el && !el.classList.contains("bp-key")) return;
        if (!e.repeat) lock();
      } else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [press, lock]);

  const shown = money(q, keypadShown(text, locale) || "0");
  // The typed number read back in words ("3.6 million people"), so the zeros
  // can be checked without being counted. It says what was typed, nothing
  // about the answer. A money question already carries its sign: no "pounds".
  const words = value > 0 ? inWords(value, locale) : null;
  const under = words ? (q.prefix ? money(q, words) : `${words} ${q.unit}`) : q.prefix ? "" : q.unit;

  return (
    <>
      <h1 className="bp-q">{q.q}</h1>
      <div className="bp-fig" aria-live="polite" aria-atomic="true">
        <span className={`bp-fig-n${text ? "" : " is-empty"}${shown.length >= 12 ? " is-long" : ""}`}>{shown}</span>
        <span className="bp-fig-u">{under || "\u00a0"}</span>
      </div>
      <div className="bp-pad">
        {KEYS.map((k) => (
          <button key={k} type="button" className="bp-key" onClick={() => press(k)}
            aria-label={k === "back" ? t("bp.del") : k === "." ? t("bp.point") : k}>
            {k === "back" ? <Delete size={22} strokeWidth={2.2} aria-hidden="true" /> : k === "." ? (1.1).toLocaleString(locale).charAt(1) : k}
          </button>
        ))}
      </div>
      <div className="bp-actions">
        <button type="button" className="bp-solid" disabled={!(value > 0)} onClick={lock}>{t("bp.lock")}</button>
        {first ? <p className="bp-rule">{t("bp.rule")}</p> : null}
      </div>
    </>
  );
}

// ── THE SHOT MAP ───────────────────────────────────────────────────────────
// The goal, and where each guess went (lib/ballpark.js shotSpot). One ball on a
// reveal, flying in from the penalty spot: that flight is the reveal's one
// moment, with the count beside it. Three numbered balls on the score.
function ShotMap({ shots, fly = false, label }) {
  const B = SHOT_BOX;
  const [placed, setPlaced] = useState(!fly || reducedMotion());
  useEffect(() => {
    if (placed) return undefined;
    const id = requestAnimationFrame(() => setPlaced(true));
    return () => cancelAnimationFrame(id);
  }, [placed]);
  const net = [];
  for (let x = B.left + 12.8; x < B.right - 1; x += 12.8) net.push(<line key={`v${x}`} x1={x} y1={B.bar} x2={x} y2={B.ground} />);
  for (let y = B.bar + 13; y < B.ground - 1; y += 13) net.push(<line key={`h${y}`} x1={B.left} y1={y} x2={B.right} y2={y} />);
  return (
    <svg className="bp-map" viewBox={`0 ${B.top} ${B.w} ${B.h - B.top}`} role={label ? "img" : undefined} aria-label={label || undefined} aria-hidden={label ? undefined : "true"}>
      <g className="bp-map-net">{net}</g>
      <line className="bp-map-ground" x1="6" y1={B.ground} x2={B.w - 6} y2={B.ground} />
      <path className="bp-map-frame" d={`M${B.left} ${B.ground}V${B.bar}H${B.right}V${B.ground}`} />
      {shots.map((sh, i) => {
        const at = shotSpot(sh.guess, sh.answer, shots.length > 1 ? i : 0);
        const x = placed ? at.x : B.spot.x; const y = placed ? at.y : B.spot.y;
        return (
          <g key={i} className={`bp-ball${fly ? " is-fly" : ""}`} style={{ transform: `translate(${x}px, ${y}px)` }}>
            <circle r="9.5" />
            {shots.length > 1 ? <text y="3.6" textAnchor="middle">{i + 1}</text> : null}
          </g>
        );
      })}
      <text className="bp-map-side" x="8" y={B.h - 4}>{t("bp.mapLow")}</text>
      <text className="bp-map-side" x={B.w - 8} y={B.h - 4} textAnchor="end">{t("bp.mapHigh")}</text>
    </svg>
  );
}

// ── REVEAL ─────────────────────────────────────────────────────────────────
function Reveal({ q, guess, last, onNext }) {
  const locale = fmtLocale();
  const dec = decimalsOf(q.answer);
  const counted = useCountUp(q.answer, dec);
  const tier = ballparkTier(guess, q.answer);
  const miss = ballparkMiss(guess, q.answer, locale);
  const pts = ballparkPoints(guess, q.answer);
  const said = `${t("bp.you", { n: money(q, fullNumber(guess, locale)) })} · ${miss.side === 0 ? t("bp.exact")
    : miss.pct ? t(miss.side < 0 ? "bp.lowPct" : "bp.highPct", { p: miss.pct })
      : t(miss.side < 0 ? "bp.low" : "bp.high", { x: miss.x })}`;
  // Under the figure: the same number in words, with "about" only when the
  // words round something away. A money answer carries its sign, not "pounds".
  const parts = roundedParts(q.answer, locale);
  const words = parts ? `${parts.n} ${t(SCALE_KEY[parts.scale])}` : null;
  const worded = words ? (q.prefix ? money(q, words) : `${words} ${q.unit}`) : null;
  const truthUnder = !worded ? (q.prefix ? "" : q.unit) : parts.exact ? worded : t("bp.about", { n: worded });
  // Sized on the finished figure, so the line does not change size mid-count.
  const chars = money(q, fullNumber(q.answer, locale)).length;
  const size = chars >= 12 ? " is-long" : chars >= 9 ? " is-mid" : "";
  const shots = useMemo(() => [{ guess, answer: q.answer }], [guess, q.answer]);
  // Enter moves on from a desk keyboard. The button is not focused for it: a
  // focused button fires on every repeat of a held key, and the Enter that
  // locked the guess would skip the reveal it had just opened.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Enter" || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target instanceof HTMLElement && e.target.closest("a,button")) return; // its own Enter
      e.preventDefault();
      onNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onNext]);

  return (
    <>
      <h1 className="bp-q is-asked">{q.q}</h1>
      {/* Read out once, finished: the counting figure and the picture are for the eye. */}
      <p className="sr-only" role="status">
        {t("bp.spoken", { answer: `${money(q, fullNumber(q.answer, locale))}${q.prefix ? "" : ` ${q.unit}`}`, tier: t(`bp.tier.${tier}`), pts, said })}
      </p>
      <div className="bp-card">
        <div className="bp-truth" aria-hidden="true">
          <span className={`bp-truth-n${size}`}>{money(q, counted.toLocaleString(locale, { minimumFractionDigits: dec, maximumFractionDigits: dec }))}</span>
          {truthUnder ? <span className="bp-truth-u">{truthUnder}</span> : null}
        </div>
        <ShotMap shots={shots} fly />
        <div className="bp-verdict">
          <span className="bp-tier">{t(`bp.tier.${tier}`)}</span>
          <span className="bp-pts"><strong>{pts}</strong> {t("bp.ofHundred")}</span>
        </div>
        <p className="bp-said">{said}</p>
      </div>

      <div className="bp-why">
        <p className="bp-why-t"><strong>{t("bp.how")}</strong> {q.how}</p>
        <a className="bp-src" href={q.source.url} target="_blank" rel="noopener noreferrer" aria-label={`${t("bp.source", { name: q.source.name })} (${t("bp.newTab")})`}>
          {t("bp.source", { name: q.source.name })}<ArrowUpRight size={14} strokeWidth={2.2} aria-hidden="true" />
        </a>
      </div>

      <div className="bp-actions">
        <button type="button" className="bp-solid" onClick={onNext}>
          {t(last ? "bp.finish" : "bp.next")}<ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" />
        </button>
      </div>
    </>
  );
}

// ── DONE ───────────────────────────────────────────────────────────────────
function Done({ slot, questions, guesses, track, onDay }) {
  const locale = fmtLocale();
  const total = ballparkTotal(guesses, questions);
  const [said, setSaid] = useState(null);
  const share = async () => {
    const text = `${t("bp.shareText", { n: slot, score: total, max: BALLPARK_MAX, squares: ballparkSquares(guesses, questions) })}\n${BALLPARK_URL}`;
    const how = await shareOrCopy(text);
    if (how) { track?.("bp-share", { how }); setSaid(how); }
  };
  const others = BALLPARK_DAYS.map((_, i) => i + 1).filter((n) => n !== slot);
  const shots = useMemo(() => questions.map((q, i) => ({ guess: guesses[i], answer: q.answer })), [questions, guesses]);

  return (
    <>
      {/* The card is the thing a player would screenshot: the score, the line
          under it and the three shots, with nothing else on it. */}
      <div className="bp-card is-score">
        <h1 className="bp-total">
          <span className="bp-total-n">{total}</span>
          <span className="bp-total-of">{t("bp.outOf", { max: BALLPARK_MAX })}</span>
        </h1>
        <p className="bp-total-v">{t(`bp.verdict.${ballparkVerdict(total)}`)}</p>
        <ShotMap shots={shots} label={t("bp.mapAria")} />
      </div>

      <ol className="bp-rows">
        {questions.map((q, i) => (
          <li key={q.id} className="bp-row">
            <span className="bp-row-n" aria-hidden="true">{i + 1}</span>
            <span className="bp-row-main">
              <span className="bp-row-q">{q.q}</span>
              <span className="bp-row-nums">
                <span>{t("bp.rowYou", { n: money(q, fullNumber(guesses[i], locale)) })}</span>
                <span>{t("bp.rowAnswer", { n: money(q, fullNumber(q.answer, locale)) })}</span>
              </span>
            </span>
            <span className="bp-row-pts">
              <strong>{ballparkPoints(guesses[i], q.answer)}</strong>
              <span>{t(`bp.tier.${ballparkTier(guesses[i], q.answer)}`)}</span>
            </span>
          </li>
        ))}
      </ol>

      <div className="bp-actions">
        <button type="button" className="bp-solid" onClick={share}>
          {said === "copied" ? <Check size={18} strokeWidth={2.6} aria-hidden="true" /> : <Share size={18} strokeWidth={2.4} aria-hidden="true" />}
          {said === "copied" ? t("bp.copied") : t("bp.share")}
        </button>
        <p className="bp-rule">{t("bp.tomorrow")}</p>
      </div>

      {/* Prototype only: the other frozen days, so the whole set can be played now. */}
      <div className="bp-proto">
        <p className="bp-proto-h">{t("bp.proto", { n: slot, m: BALLPARK_DAYS.length })}</p>
        <div className="bp-proto-days">
          {others.map((n) => (
            <button key={n} type="button" className="bp-link" onClick={() => onDay(n)}>{t("bp.otherDay", { n })}</button>
          ))}
        </div>
      </div>
    </>
  );
}

// ── THE SCREEN ─────────────────────────────────────────────────────────────
function BallparkDay({ slot, saveKey, onBack, track, onDay }) {
  const questions = useMemo(() => ballparkDay(slot), [slot]);
  // Read once. A day reopened part-way comes back where it was left: on the
  // reveal of a guess whose answer has not been moved on from, else on the first
  // question still unanswered; a finished day opens on its score.
  const [saved] = useState(() => loadBallpark(saveKey));
  const [guesses, setGuesses] = useState(saved.g);
  const [at, setAt] = useState(Math.min(saved.seen, BALLPARK_PER_DAY - 1));
  const [done, setDone] = useState(saved.seen >= BALLPARK_PER_DAY);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    track?.("bp-open", { day: slot, at: saved.g.length });
  }, [track, slot, saved]);

  const q = questions[at];
  const answered = guesses[at] > 0;

  // One guess a question. The counts live in refs as well as in state, so a
  // double tap inside one frame (two calls with the same stale state) cannot
  // lock twice, move on twice, save twice or send an event twice.
  const locked = useRef(saved.g.length);
  const moved = useRef(saved.seen);
  const lock = useCallback((value) => {
    if (locked.current !== at || !(value > 0)) return;
    locked.current = at + 1;
    const next = [...guesses.slice(0, at), value];
    saveBallpark(saveKey, next, at);
    setGuesses(next);
    track?.("bp-lock", { day: slot, q: at + 1, pts: ballparkPoints(value, q.answer) });
    try { window.scrollTo?.(0, 0); } catch { /* fine */ }
  }, [at, slot, saveKey, q, guesses, track]);

  const next = useCallback(() => {
    if (moved.current !== at || locked.current <= at) return;
    moved.current = at + 1;
    saveBallpark(saveKey, guesses, at + 1);
    if (at >= BALLPARK_PER_DAY - 1) {
      track?.("bp-finish", { day: slot, total: ballparkTotal(guesses, questions) });
      setDone(true);
    } else setAt(at + 1);
    try { window.scrollTo?.(0, 0); } catch { /* fine */ }
  }, [at, slot, saveKey, guesses, questions, track]);

  if (questions.length < BALLPARK_PER_DAY) {
    return <div className="bp-screen"><p className="bp-rule">{t("bp.none")}</p></div>;
  }

  return (
    <div className={`bp-screen${done ? " is-done" : answered ? " is-reveal" : " is-ask"}`}>
      <div className="bp-top">
        <button type="button" className="bp-back" onClick={onBack} aria-label={t("game.back")}><ChevronLeft size={22} strokeWidth={2.4} aria-hidden="true" /></button>
        <span className="bp-name">{t("bp.title")} <span className="bp-num">#{slot}</span></span>
        <Pips at={done ? -1 : at} done={guesses.length} />
      </div>
      {done
        ? <Done slot={slot} questions={questions} guesses={guesses} track={track} onDay={onDay} />
        : answered
          ? <Reveal key={`r${at}`} q={q} guess={guesses[at]} last={at >= BALLPARK_PER_DAY - 1} onNext={next} />
          : <Ask key={`a${at}`} q={q} first={at === 0} onLock={lock} />}
    </div>
  );
}

export default function Ballpark({ onBack, forceDay = null, track }) {
  useT();
  // A day opened on purpose (?day=N, or "Play day N") keeps its own save, apart
  // from the real calendar day's: lib/ballpark.js ballparkSaveKey says why.
  const [day, setDay] = useState(() => {
    const f = Number(forceDay);
    return { slot: ballparkSlot(new Date(), forceDay), forced: Number.isInteger(f) && f >= 1 && f <= BALLPARK_DAYS.length };
  });
  const saveKey = ballparkSaveKey(day.slot, day.forced);
  const openDay = useCallback((n) => {
    setDay({ slot: n, forced: true });
    try { window.scrollTo?.(0, 0); } catch { /* fine */ }
  }, []);
  return <BallparkDay key={saveKey} slot={day.slot} saveKey={saveKey} onBack={onBack} track={track} onDay={openDay} />;
}
