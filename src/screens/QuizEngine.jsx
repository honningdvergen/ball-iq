// The quiz engine — Classic, Speed, Survival, Legends, Chaos, the Daily 7, club
// and league quizzes. Extracted from App.jsx on 2026-09-06 (review E16, brick
// 9). Everything it needs arrives as a prop; app-level helpers come along the
// seam the lazy screens already use.
import { markBadReviewMoment } from "../lib/review.js";
import { useModalA11y } from "../useModalA11y.js";
import { Results } from "../screens/ResultsScreen.jsx";
import * as Sentry from "@sentry/react";
import { Lightbulb, Flame, Flag } from "lucide-react";
import ReportButton from "../components/ReportButton.jsx";
import { useCallback, useEffect, useRef, useState } from "react";
import { CAT_LABELS, LETTERS, TIMINGS, checkTyped, getACSuggestions, haptic, norm, playSound } from "../App.jsx";

// ─── HARD RIGHT BURST ────────────────────────────────────────────────────────
// Lightweight, quick particle burst used when a user gets a HARD question right.
// Different from full Confetti — faster, more focused, emanates from center-bottom.
export function HardRightBurst({ onComplete }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    // Honor prefers-reduced-motion: skip the burst but keep the flow moving.
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { onComplete?.(); return; }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.visualViewport?.width ?? window.innerWidth;
    canvas.height = window.visualViewport?.height ?? window.innerHeight;
    // Origin: center of screen, slightly above middle (where the answer would be)
    const ox = canvas.width / 2;
    const oy = canvas.height * 0.55;
    // 40 particles burst outward and upward
    const pieces = Array.from({length: 40}, (_, i) => {
      const angle = (i / 40) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      const speed = 6 + Math.random() * 6;
      return {
        x: ox,
        y: oy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,  // bias upward
        w: Math.random() * 8 + 4,
        h: Math.random() * 4 + 2,
        r: Math.random() * Math.PI * 2,
        dr: (Math.random() - 0.5) * 0.3,
        life: 1,
        color: ["#58CC02", "#FFC800", "#FBBF24", "#16a34a"][Math.floor(Math.random() * 4)],
      };
    });
    let alive = true;
    let frame = 0;
    const draw = () => {
      if (!alive) return;
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let anyAlive = false;
      pieces.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25;  // gravity
        p.vx *= 0.99;  // air resistance
        p.r += p.dr;
        p.life -= 0.015;
        if (p.life > 0) {
          anyAlive = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.r);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.life);
          ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
          ctx.restore();
        }
      });
      if (anyAlive && frame < 90) requestAnimationFrame(draw);
      else { alive = false; if (onComplete) onComplete(); }
    };
    requestAnimationFrame(draw);
    return () => { alive = false; };
  }, [onComplete]);
  return <canvas ref={canvasRef} aria-hidden="true" style={{position:"fixed",top:0,right:0,bottom:0,left:0,inset:0,pointerEvents:"none",zIndex:500}} />;
}


// ─── TYPED INPUT WITH AUTOCOMPLETE ───────────────────────────────────────────
export function TypedInput({ question, diff, hintsEnabled, onAnswer }) {
  const [val, setVal] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [state, setState] = useState(null);
  const [showHint, setShowHint] = useState(false);

  // Derive the hint: first letter of the correct answer
  const correctAnswer = question.o ? question.o[question.a] : "";
  const firstLetter = correctAnswer ? correctAnswer[0].toUpperCase() : "";

  useEffect(() => {
    if (val.length >= 2 && !state) setSuggestions(getACSuggestions(val));
    else setSuggestions([]);
  }, [val, state]);

  const submit = useCallback((v) => {
    const answer = (v || val).trim();
    if (!answer || state) return;
    setSuggestions([]);
    const correct = checkTyped(answer, question);
    setState(correct ? "correct" : "wrong");
    setVal(v || val);
    onAnswer(correct, answer);
  }, [val, state, question, onAnswer]);

  const pick = (s) => { setVal(s); setSuggestions([]); setTimeout(() => submit(s), TIMINGS.AUTOCOMPLETE_DEBOUNCE); };

  const highlight = (s) => {
    const v = norm(val);
    const sn = norm(s);
    const i = sn.indexOf(v);
    if (i === -1) return s;
    return <>{s.slice(0, i)}<span className="ac-hi">{s.slice(i, i + v.length)}</span>{s.slice(i + v.length)}</>;
  };

  return (
    <div>
      <div className="typed-outer">
        <input
          className={`typed-inp${state ? ` ${state}` : ""}`}
          placeholder="Type your answer…"
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => e.key === "Enter" && submit()}
          disabled={!!state}
          autoFocus
          /* Sprint #77 SS1: kill iOS autocorrect / spell-suggest on
             typed answers. Without these, iOS would helpfully replace
             "Mbappé" / "Sterling" / "Eusébio" with common-word
             substitutions (or auto-accept a suggestion on Enter),
             actively breaking gameplay. Capitalize="words" preserves
             the natural casing of name entries (the autocomplete
             below shows them title-cased) but the autocorrect engine
             stays off. */
          autoCorrect="off"
          autoCapitalize="words"
          spellCheck={false}
          autoComplete="off"
        />
        {suggestions.length > 0 && (
          <div className="ac-list">
            {suggestions.map((s, i) => (
              <div key={i} className="ac-row" onMouseDown={() => pick(s)}>{highlight(s)}</div>
            ))}
          </div>
        )}
      </div>
      {hintsEnabled !== false && diff === "easy" && !state && val.length === 0 && firstLetter && (
        <div className="hint-note"><Lightbulb size={12} strokeWidth={2.5} aria-hidden="true" /> Starts with "{firstLetter}"</div>
      )}
      <button className="typed-btn" onClick={() => submit()} disabled={!val.trim() || !!state}>Submit →</button>
    </div>
  );
}

// ─── QUIZ ENGINE ──────────────────────────────────────────────────────────────
export function QuizEngine({ questions, mode, diff, timerEnabled, timerSecondsOverride, soundEnabled, hintsEnabled, onComplete, onBack, survivalBest, onReport, quizLabel, onHowToPlay }) {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);   // MCQ selected index
  const [typedResult, setTypedResult] = useState(null); // 'correct' | 'wrong' | null
  // ⚠️ Running out of time sets `selected` to the CORRECT index so the right
  // option lights up green in the reveal — but the verdict pill decides what to
  // say from `selected === q.a`, so a timeout congratulated the player with
  // "✓ Correct!" for a question they never answered. Everything else already
  // recorded it correctly (isCorrect:false, timedOut:true, red pip, streak
  // reset) — only the message lied, which is the worst kind of lie: the score
  // says one thing and the screen says another.
  const [timedOut, setTimedOut] = useState(false);
  const isSpeed = mode === "speed";
  const timerDuration = isSpeed ? 8 : (timerSecondsOverride || 20);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  // Mobile in-run streak beat (scouting panel): the qd-meta streak pill is
  // desktop-only, so on a phone a 5-in-a-row passed in silence until the
  // results screen. A transient fixed-position pill at 3 and 5 gives the
  // combo its moment without touching layout (fixed = zero reflow, unlike
  // mounting into the header, which visibly shifted the progress track).
  const [streakBeat, setStreakBeat] = useState(0);
  const streakBeatTimeoutRef = useRef(null);
  useEffect(() => () => clearTimeout(streakBeatTimeoutRef.current), []);
  const [timeLeft, setTimeLeft] = useState(timerDuration);
  const [speedScore, setSpeedScore] = useState(0);
  const [done, setDone] = useState(false);
  const timerRef = useRef(null);
  // The per-question auto-advance timeout must be cancellable the moment an
  // answer registers; otherwise it can fire during the result/hint dwell and
  // inject a phantom "timed out" record (skewing category ratings) + skip Next.
  const answerTimeoutRef = useRef(null);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  // Phase 6b Issue B: track previous timeLeft so the .timer-fill CSS
  // transition (width 0.9s linear, drain animation) can be suppressed
  // on reset (post-answer, advancing to next question). Without this,
  // the bar visibly fills from low → 100% over 0.9s when the question
  // changes; with this, width snaps instantly while drain animation
  // remains for the countdown direction.
  const prevTimeLeftRef = useRef(timerDuration);
  // timeLeftRef mirrors the live countdown so the Speed bonus (computed in
  // registerAnswer, whose deps deliberately exclude timeLeft to avoid recreating
  // the callback every tick) reads the REAL remaining time, not a stale closure.
  const timeLeftRef = useRef(timerDuration);
  // speedScoreRef mirrors speedScore so doAdvance (deps exclude speedScore) emits
  // the final question's just-added bonus rather than a pre-bonus stale value.
  const speedScoreRef = useRef(0);
  useEffect(() => { prevTimeLeftRef.current = timeLeft; timeLeftRef.current = timeLeft; }, [timeLeft]);
  useEffect(() => { speedScoreRef.current = speedScore; }, [speedScore]);
  const [showQuit, setShowQuit] = useState(false);
  // Focus trap + Escape + back-gesture for the quit sheet. The App-wide
  // dialog/hook count masked this sheet having none until the engine got its
  // own file (E16, brick 9) and the a11y-structure test counted it alone.
  const quitRef = useRef(null);
  useModalA11y({ isOpen: showQuit, onClose: () => setShowQuit(false), ref: quitRef });
  // First-session audit 2026-08-30 (#4): coming from the untimed Daily 7, a
  // timed run's clock was already draining before the player could read Q1 —
  // the first ~2 seconds of every club quiz were stolen. Timed modes now hold
  // Q1 behind a tap-to-start gate (one tap, no 3-2-1 wait); the timer effect
  // below doesn't run until armed. Q2+ are mid-flow, so they start hot as
  // before. Untimed modes never see the gate.
  // No start gate (2026-09-06). There was a full-screen "Ready?" interstitial,
  // then for an hour a 3-2-1 count — Alex: "absolutely hated"; dropped. The
  // clock runs from the moment the first question is on screen, like every
  // quiz show. `armed` stays as state so the Q1-specific branches below (back
  // exits directly before the first answer, the timer effect) keep holding.
  const [armed, setArmed] = useState(true);
  const [showNext, setShowNext] = useState(false);
  // ⚠️ RE-ENTRY GUARD — a double-tap on "Next →" used to SKIP A QUESTION.
  // Found 2026-08-19 from Clarity: "Next →" was the most dead-clicked element
  // in the product (633), far ahead of anything else. The clicks were not
  // inert — they were landing on the button twice before React unmounted it,
  // and each call ran setIdx(i => i + 1), so the player jumped two questions
  // (reproduced: Q2 -> Q4). `total` is fixed, so a 7-question daily silently
  // became six questions scored out of seven: a lost point, on the one mode
  // that is shared and compared between players.
  //
  // Keyed on idx rather than a plain boolean so it self-clears: each question
  // may be advanced from exactly once, and the next question is free again.
  const advancedFromRef = useRef(-1);
  const advanceRef = useRef(null);
  // wrongAnswers is purely terminal — only emitted to onComplete, never
  // read for in-flight UI display. Using a ref instead of state avoids a
  // stale-closure bug where doAdvance captures the array before the most
  // recent setWrongAnswers had landed; the final-question wrong answer
  // was silently dropped from the array passed up to handleComplete.
  const wrongAnswersRef = useRef([]);
  // allAnswers — Phase 5x. Captures every answer (right or wrong, plus
  // timeouts) so the Daily review screen can render the user's full
  // game in order: question, options, what they picked, what was
  // correct. Same ref pattern as wrongAnswers.
  const allAnswersRef = useRef([]);
  // ⚠️ STATE, NOT A REF, AND DELIBERATELY SEPARATE FROM allAnswersRef. That ref
  // is terminal data — read once by the results screen, so a ref is right there
  // and avoids the stale-closure that loses the last answer. The pips are the
  // opposite case: they must repaint the instant an answer lands, and a ref
  // mutation does not re-render. Two stores, two jobs; cheap (one boolean per
  // question) and it keeps the ref's terminal-read contract intact.
  const [marks, setMarks] = useState([]);
  useEffect(() => { wrongAnswersRef.current = []; allAnswersRef.current = []; setMarks([]); }, [questions]);
  useEffect(() => {
    Sentry.addBreadcrumb({ category: 'game', message: 'quiz started', level: 'info', data: { mode, diff: diff || null, total: questions?.length || 0 } });
    // Sprint #61 DD3: tag the mode for the duration of the quiz. On unmount
    // (back-out or quiz end) clear it so post-quiz errors don't keep stale
    // mode context. Question id is tagged per-question in the effect below.
    try { Sentry.setTag('mode', mode); } catch {}
    return () => { try { Sentry.setTag('mode', undefined); } catch {} };
  }, []);
  // Sprint #61 DD3: tag the current question id so any error during a quiz
  // (render crash, RPC fail, timer glitch) carries the exact question that
  // was on screen. Cleared on unmount.
  useEffect(() => {
    const qid = questions?.[idx]?.id;
    try { Sentry.setTag('question_id', qid || undefined); } catch {}
    return () => { try { Sentry.setTag('question_id', undefined); } catch {} };
  }, [idx, questions]);
  const [hardRightBurst, setHardRightBurst] = useState(false);
  const hardRightBurstTimerRef = useRef(null);
  useEffect(() => () => {
    if (hardRightBurstTimerRef.current) clearTimeout(hardRightBurstTimerRef.current);
  }, []);


  // Android hardware back mid-quiz — AppInner turns Capacitor's backButton
  // into a cancelable "biq:hw-back" window event while a game is mounted.
  // Claim it (preventDefault) and mirror the ← button exactly: Q1 backs out
  // directly, later questions raise the quit-confirm; a press while the
  // confirm is up dismisses it (same as the backdrop tap). The quit modal is
  // deliberately NOT on the useModalA11y stack, so the shell can't close it.
  const total = questions?.length || 0;
  const q = questions?.[idx];
  // Phase 6b Issue A: Daily 7 is a leisurely review experience; the
  // auto-fail-after-20s signal was creating frustration on re-entry
  // (the timer-at-full initial render read as "stale state"). Daily
  // joins survival/legends/chaos in skipping the timer.
  // ⚠️ Declared ABOVE the hw-back effect below — its dep array reads `timed`
  // during render, and a dep array evaluates at the call site, not inside the
  // closure. Declaring it after the effect is a TDZ crash on first render
  // (caught by the browser verify pass, 2026-08-30).
  const timed = (timerEnabled !== false) && mode !== "survival" && mode !== "legends" && mode !== "chaos" && mode !== "daily" && q?.type !== "tf";

  useEffect(() => {
    const onHwBack = (e) => {
      e.preventDefault();
      if (showQuit) { setShowQuit(false); return; }
      // Q1 before the clock starts (or in an untimed mode) has nothing at
      // stake — exit instantly. Once a timed run is live, a back press is a
      // question with time draining: confirm it (audit #5 — a mis-tap on Q1
      // of a timed run killed the attempt with no warning).
      if (idx === 0 && (!timed || !armed)) { onBack(); return; }
      setShowQuit(true);
    };
    window.addEventListener("biq:hw-back", onHwBack);
    return () => window.removeEventListener("biq:hw-back", onHwBack);
  }, [idx, showQuit, onBack, timed, armed]);

  const isTyped = q?.type === "typed";
  const isTF = q?.type === "tf";
  const answered = selected !== null || typedResult !== null;

  // Bring the explanation to the player instead of hoping they scroll.
  //
  // The sticky Next button floats over the "Why?" panel on arrival and clips
  // it mid-sentence (see the panel's own comment). Scrolling it into view is
  // the smallest fix that actually changes behaviour — the alternative,
  // un-sticking the CTA, would trade a reachable button for a readable
  // paragraph, and both matter.
  //
  // ⚠️ `center`, NOT `end`. `end` aligns the panel's bottom edge with the
  // viewport bottom — which is precisely where the sticky CTA lives, so it put
  // the explanation straight back underneath the button this effect exists to
  // get it out from under. It also pushed Next off-screen, which stalled the
  // e2e daily-play helper and read as an unrelated flake for two days.
  // `center` parks the paragraph in open space with the CTA below it.
  // rAF because the panel has a 0.4s fadeIn and is not laid out at effect time.
  const whyRef = useRef(null);
  useEffect(() => {
    const el = whyRef.current;
    if (!answered || !el) return undefined;
    const id = requestAnimationFrame(() => {
      // ⚠️ INSTANT, not smooth. A smooth scroll keeps the page animating for
      // ~300ms after every single answer, which (a) fights a player who is
      // already scrolling and (b) made the e2e suite go from 1.0 to 4.0
      // minutes with seven unrelated timeouts — Playwright waits for elements
      // to stop moving before it will click them. A moving page is a slow page
      // for a person too; they just cannot file a bug about it.
      // ⚠️ MINIMUM SCROLL, NOT `center`. The 1.7.0 design review flagged that
      // answering "unmounts the entire header" — back button, progress pips and
      // counter all gone, ~90pt of content jump, ten times a session. The
      // header is NOT unmounted; it is rendered unconditionally. This scroll is
      // what removes it, and `center` is why: parking the panel in the middle
      // of the viewport moves the page much further than revealing the panel
      // requires, so the chrome above it leaves the screen even when there was
      // room to keep it.
      // `nearest`/`end` were both wrong for the original reason (they put the
      // panel back under the sticky CTA), so this computes the shortest scroll
      // that clears BOTH the viewport bottom and the CTA sitting on it. When
      // the panel already fits, it does not scroll at all — which is the common
      // case on a short explanation, and the header simply stays put.
      // A sticky .q-top was tried first and did not pin on device; rather than
      // ship CSS I could not prove, the scroll itself is the fix.
      try {
        const CTA_INSET = 96; // sticky Next button + its margin
        const overshoot = el.getBoundingClientRect().bottom
          - (window.innerHeight - CTA_INSET) + 12;
        if (overshoot > 0) window.scrollBy({ top: overshoot, behavior: 'auto' });
      } catch { /* older WebViews */ }
    });
    return () => cancelAnimationFrame(id);
  }, [answered, idx]);

  // ── desktop-web-refresh (Quiz #02): derived values for the >=1024 desktop
  // chrome (top bar + thin progress + circular timer ring). Every element that
  // consumes these is render-always / CSS-revealed (base display:none), so this
  // math is inert on mobile — the mobile chrome (.q-top/.timer-row/.streak-bar/
  // .q-tag) stays byte-identical. quizLabel is the mode/club/league badge passed
  // from the mount site; the per-question category is the secondary label. ──
  const QD_MODE_BADGE = { classic:"Classic", speed:"Speed", daily:"Daily 7", legends:"Legends", chaos:"Chaos", survival:"Survival", local:"Local" };
  const qdBadge = quizLabel || QD_MODE_BADGE[mode] || "Quiz";
  const qdCat = q ? (CAT_LABELS[q.cat] || q.cat || "") : "";
  const qdCounter = mode === "survival" ? `Q ${idx + 1}` : `Q ${String(idx + 1).padStart(2, "0")} / ${total}`;
  const qdPct = total > 0 ? ((idx + (answered ? 1 : 0)) / total) * 100 : 0;
  const QD_RING_C = 2 * Math.PI * 33; // r=33 → circumference ≈ 207.35
  const qdRatio = timed ? Math.max(0, Math.min(1, timeLeft / timerDuration)) : 1;
  const qdRingColor = qdRatio > 0.5 ? "#58CC02" : qdRatio > 0.25 ? "#FFC107" : "#FF4747";

  const doAdvance = useCallback((ns, nb, correct) => {
    if (advancedFromRef.current === idx) return;   // see advancedFromRef
    advancedFromRef.current = idx;
    if (mode === "survival" && !correct) {
      Sentry.addBreadcrumb({ category: 'game', message: 'quiz ended (survival fail)', level: 'info', data: { mode, score: ns, answered: idx + 1 } });
      setDone(true); onCompleteRef.current({ score: ns, total: idx + 1, bestStreak: nb, wrongAnswers: wrongAnswersRef.current, allAnswers: allAnswersRef.current }); return;
    }
    if (idx + 1 >= total) {
      Sentry.addBreadcrumb({ category: 'game', message: 'quiz ended', level: 'info', data: { mode, score: ns, total } });
      setDone(true); onCompleteRef.current({ score: ns, total, bestStreak: nb, wrongAnswers: wrongAnswersRef.current, allAnswers: allAnswersRef.current, speedScore: speedScoreRef.current }); return;
    }
    setIdx(i => i + 1); setSelected(null); setTypedResult(null); setTimedOut(false); setShowNext(false);
    if (timed) setTimeLeft(timerDuration);
  }, [idx, total, mode, timed]);

  const advance = useCallback((ns, nb, correct) => {
    if (mode === "survival" && !correct) { doAdvance(ns, nb, correct); return; }
    // ⚠️ Timeouts used to auto-advance after 800ms while wrong answers waited
    // for a Next tap — the one player who never even SAW the answer got the
    // shortest look at it (scouting panel, gameplay 7/B). The timer effect has
    // already revealed the correct option and set the timedOut flag, so the
    // "⏱ Time's up" pill, the explanation and the Next button all render;
    // give that player the same self-paced dwell everyone else gets.
    if (correct === "timeout") { setShowNext({ ns, nb, correct: false }); return; }
    setShowNext({ ns, nb, correct });
  }, [mode, doAdvance]);
  useEffect(() => { advanceRef.current = advance; }, [advance]);

  const registerAnswer = useCallback((correct, userAnswerText, userIndex) => {
    clearInterval(timerRef.current);
    clearTimeout(answerTimeoutRef.current);
    const ns = correct ? score + 1 : score;
    const nst = correct ? streak + 1 : 0;
    const nb = Math.max(bestStreak, nst);
    setScore(ns); setStreak(nst); setBestStreak(nb);
    // Beat at exactly 3 and 5 — not every correct answer (that would be
    // noise) and not in Survival, whose streak-bar already narrates the run.
    if (correct && mode !== "survival" && (nst === 3 || nst === 5)) {
      setStreakBeat(nst);
      clearTimeout(streakBeatTimeoutRef.current);
      streakBeatTimeoutRef.current = setTimeout(() => setStreakBeat(0), 1600);
      haptic("hardCorrect");
    }
    // Sprint #61 DD3: breadcrumb every answer with question id + outcome
    // (no PII — id is a 6-char hash, no question text). Gives the launch-day
    // debugger a precise reconstruction of the user's session up to a crash.
    try {
      Sentry.addBreadcrumb({
        category: 'game',
        message: 'answer submitted',
        level: 'info',
        data: {
          qid: q?.id || null,
          idx,
          correct: correct === true,
          timeout: correct === 'timeout',
          type: q?.type || 'mcq',
        },
      });
    } catch {}
    if (!correct && q && correct !== "timeout") {
      // userAnswerText carries what the user picked so the missed-answers
      // review on the result screen can show "✗ X · ✓ Y". Typed inputs
      // don't pass it (different code path); those just show "✓ correct".
      wrongAnswersRef.current = [...wrongAnswersRef.current, { id: q.id, q: q.q, correct: q.type === "typed" ? q.typed_a : q.type === "tf" ? (q.a ? "TRUE" : "FALSE") : q.o[q.a], user: userAnswerText, cat: q.cat, hint: q.hint }];
    }
    // Phase 5x: capture the full answer record for the Daily review
    // screen. userIndex is the actual selected index passed from
    // handleMCQ (avoids fragile indexOf against duplicate option text).
    // Typed inputs pass userIndex=-1; userAnswerText carries the typed
    // string. Timeouts have their own capture path in the timer effect.
    if (q && correct !== "timeout") {
      const type = q.type === 'tf' ? 'tf' : (q.type === 'typed' ? 'typed' : 'mcq');
      const options = type === 'tf' ? ['FALSE', 'TRUE'] : (type === 'typed' ? null : q.o);
      const correctIdx = type === 'typed' ? -1 : (type === 'tf' ? (q.a ? 1 : 0) : q.a);
      const uIdx = (typeof userIndex === 'number') ? userIndex : -1;
      allAnswersRef.current = [...allAnswersRef.current, {
        q: q.q,
        type,
        cat: q.cat || null,
        diff: q.diff || 'medium', // rating weight — see saveStats DIFF_CREDIT
        options,
        userIdx: uIdx,
        correctIdx,
        userText: type === 'typed' ? (userAnswerText || null) : null,
        correctText: type === 'typed' ? q.typed_a : (type === 'tf' ? (q.a ? 'TRUE' : 'FALSE') : q.o[q.a]),
        isCorrect: correct === true,
        timedOut: false,
      }];
    }
    // A timeout is recorded by the timer effect's own capture path, not here.
    if (correct !== "timeout") setMarks(m => [...m, correct === true]);
    if (isSpeed && correct === true) { setSpeedScore(prev => prev + 100 + timeLeftRef.current * 10); }
    advance(ns, nb, correct);
  }, [score, streak, bestStreak, advance, mode]);

  const handleMCQ = useCallback((i) => {
    if (answered || done) return;
    setSelected(i);
    // T/F questions store answer as boolean OR number; MCQ stores as index
    const qAsBool = q.a === true || q.a === 1;
    const correct = q.type === "tf" ? ((i === 1) === qAsBool) : (i === q.a);
    // Capture user's chosen text for the missed-answers review.
    const userAnswerText = q.type === "tf" ? (i === 1 ? "TRUE" : "FALSE") : q.o[i];
    playSound(correct ? "correct" : "wrong");
    // Bigger celebration for HARD questions right
    if (correct && q.diff === "hard") {
      haptic("hardCorrect");
      setHardRightBurst(true);
      if (hardRightBurstTimerRef.current) clearTimeout(hardRightBurstTimerRef.current);
      hardRightBurstTimerRef.current = setTimeout(() => setHardRightBurst(false), TIMINGS.ANSWER_REVEAL);
    } else {
      haptic(correct ? "correct" : "wrong");
    }
    registerAnswer(correct, userAnswerText, i);
  }, [answered, done, q, registerAnswer, soundEnabled]);

  useEffect(() => {
    if (!timed || done || isTyped) return;
    if (idx === 0 && !armed) return; // Q1 waits for the tap-to-start gate
    setTimeLeft(timerDuration);
    clearInterval(timerRef.current);
    // ⚠️ ONE CLOCK, NOT TWO. This used to DECREMENT a counter on an interval
    // while a separate setTimeout owned the actual deadline — two independent
    // clocks for one question. Browsers coalesce setInterval callbacks that
    // could not run (a chunk parse, a GC pause, a backgrounded tab), so the
    // display quietly loses ticks; setTimeout still fires at its absolute
    // deadline. The two drift apart and the question dies with time visibly
    // left on the clock.
    //
    // Reproduced in the built app on 2026-08-23: a 12-second question, a
    // 6-second main-thread stall, and the deadline fired at 12.5s while the
    // countdown still read SIX. The player sees six seconds remaining and is
    // marked wrong — indistinguishable from the app cheating, on the core loop
    // of Classic, Club Quiz, League Quiz and the topical pack.
    //
    // Deriving the display from the same wall-clock deadline the timeout uses
    // makes drift impossible rather than unlikely: a stall now just skips the
    // display forward, which is honest.
    const deadline = Date.now() + timerDuration * 1000;
    let warned = false;
    timerRef.current = setInterval(() => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      // Fire the 5-second warning on the CROSSING, not on an exact equality —
      // a stall can jump straight past any single value.
      if (!warned && left <= 5 && left > 0) { warned = true; try { haptic("select"); } catch {} }
      if (left <= 0) clearInterval(timerRef.current);
      setTimeLeft(left);
    }, 250);
    // Separate effect watches for timeout (avoids stale closure entirely)
    const timeoutMs = (timerDuration * 1000) + 100;
    answerTimeoutRef.current = setTimeout(() => {
      // Phase 5x: capture timeout into allAnswers so the Daily review
      // screen renders this question with a "timed out" tag instead of
      // dropping it. Same shape as a wrong MCQ answer; userIdx=-1.
      const tq = questions[idx];
      if (tq) {
        const type = tq.type === 'tf' ? 'tf' : (tq.type === 'typed' ? 'typed' : 'mcq');
        const options = type === 'tf' ? ['FALSE', 'TRUE'] : (type === 'typed' ? null : tq.o);
        const correctIdx = type === 'typed' ? -1 : (type === 'tf' ? (tq.a ? 1 : 0) : tq.a);
        allAnswersRef.current = [...allAnswersRef.current, {
          q: tq.q,
          type,
          cat: tq.cat || null,
          diff: tq.diff || 'medium', // rating weight — see saveStats DIFF_CREDIT
          options,
          userIdx: -1,
          correctIdx,
          userText: null,
          correctText: type === 'typed' ? tq.typed_a : (type === 'tf' ? (tq.a ? 'TRUE' : 'FALSE') : tq.o[tq.a]),
          isCorrect: false,
          timedOut: true,
        }];
        // ⚠️ AND into the missed-answers review, which timeouts were excluded
        // from (`correct !== "timeout"` guards the push in registerAnswer).
        // The result screen showed a red pip for every timed-out question but
        // never its explanation — so a player who ran out of time never learned
        // the answer they never even saw. Explanations are the differentiator;
        // withholding them from the one case where the player has NO idea what
        // the answer was is exactly backwards. `user` is deliberately omitted:
        // the review renders the "✗ picked" line only when it is set, so a
        // timeout shows the correct answer and the story, with nothing claimed
        // about what they chose.
        wrongAnswersRef.current = [...wrongAnswersRef.current, {
          id: tq.id,
          q: tq.q,
          correct: type === 'typed' ? tq.typed_a : (type === 'tf' ? (tq.a ? 'TRUE' : 'FALSE') : tq.o[tq.a]),
          cat: tq.cat,
          hint: tq.hint,
        }];
      }
      // Running out of time is a miss and must colour its pip red — otherwise
      // the row silently stops advancing and reads as a rendering bug.
      setMarks(m => [...m, false]);
      setScore(s => {
        setStreak(0);
        setBestStreak(b => {
          setSelected(questions[idx]?.a ?? -1);
          setTimedOut(true);
          advanceRef.current?.(s, b, "timeout");
          return b;
        });
        return s;
      });
    }, timeoutMs);
    return () => { clearInterval(timerRef.current); clearTimeout(answerTimeoutRef.current); };
  }, [idx, timed, done, isTyped, armed]);

  if (done) return null;
  if (!q) return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"60vh",gap:14,padding:"0 24px",textAlign:"center"}}>
      <div style={{fontSize:36}}>⚽</div>
      <div style={{fontFamily:"'Inter',sans-serif",fontSize:16,fontWeight:700,color:"var(--text)"}}>Couldn't load questions</div>
      <div style={{fontFamily:"'Inter',sans-serif",fontSize:13,color:"var(--t2)",lineHeight:1.5}}>Please try again in a moment.</div>
      <button onClick={onBack} className="btn-3d" style={{marginTop:6,maxWidth:240}}>Back to Home</button>
    </div>
  );

  return (
    <div className={`quiz-wrap qd-wrap${q?.cat ? ` cat-${q.cat}` : ""}`}>
      {hardRightBurst && <HardRightBurst />}
      {hardRightBurst && (
        <div style={{
          position:"fixed",
          top:"28%",
          left:"50%",
          transform:"translate(-50%, -50%)",
          background:"linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)",
          color:"#1a1a1a",
          padding:"10px 22px",
          borderRadius:100,
          fontSize:13,
          fontWeight:900,
          letterSpacing:0.2,
          boxShadow:"0 8px 32px rgba(251, 191, 36, 0.5), 0 2px 8px rgba(0,0,0,0.3)",
          zIndex:501,
          pointerEvents:"none",
          fontFamily:"'Inter',sans-serif",
          animation:"hardRightBadge 1.5s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        }}>
          🏆 HARD · NAILED IT
        </div>
      )}
      {/* ── desktop-web-refresh (Quiz #02): >=1024 chrome. Render-always,
          CSS-revealed (base display:none). The mobile chrome below (.q-top,
          .streak-bar, .timer-row, .q-tag) is hidden at desktop instead; the
          play area is centered via the .qd-play display:contents→block wrapper.
          All of it is display:none < 1024, so mobile is byte-identical. ── */}
      <div className="qd-topbar">
        <div className="qd-topbar-l">
          <span className="qd-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="13" r="7.5"></circle><path d="M12 13V9M9.5 2.5h5"></path></svg>
            {qdBadge}
          </span>
          {qdCat && <span className="qd-cat">{qdCat}</span>}
        </div>
        <div className="qd-topbar-r">
          <span className="qd-counter">{qdCounter}</span>
          <button className="qd-close" onClick={() => { if (idx === 0) { onBack(); return; } setShowQuit(true); }} aria-label="Quit game">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18"></path></svg>
          </button>
        </div>
      </div>
      <div className="qd-progress" aria-hidden="true"><div className="qd-progress-fill" style={{ width: `${qdPct}%` }} /></div>

      <div className="qd-play">
      <div className="q-top">
        <button className="back-btn" onClick={() => {
          if (idx === 0 && (!timed || !armed)) { onBack(); return; }
          setShowQuit(true);
        }} aria-label="Go back">←</button>
        {mode === "survival" ? (
          <div style={{flex:1}} />
        ) : (
          <div className="prog-pips" aria-hidden="true">
            {Array.from({ length: total }, (_, i) => (
              <i key={i} className={i < marks.length ? (marks[i] ? "ok" : "no") : (i === marks.length ? "now" : "")} />
            ))}
          </div>
        )}
        <div className="q-top-right">
          {/* Rendered even at 0, just invisible. Mounting it on the first
              correct answer shrank the progress track mid-quiz — the bar
              visibly jumped sideways at exactly the moment the user was
              watching it for feedback. Reserve the space instead. */}
          <span className="q-score-live" aria-hidden={score === 0 || undefined} style={score === 0 ? {visibility:"hidden"} : undefined}>{score}<span className="q-score-tick"> ✓</span></span>
          <span className="q-ctr">{mode === "survival" ? `Q${idx + 1}` : `${idx + 1}/${total}`}</span>
          {onHowToPlay && <button className="icon-btn" onClick={onHowToPlay} aria-label="How to play" title="How to play">?</button>}
        </div>
      </div>

      {streakBeat > 0 && (
        <div className="streak-beat" role="status"><Flame size={14} strokeWidth={2.4} aria-hidden="true" /> {streakBeat} in a row</div>
      )}
      {mode === "survival" && (
        <div className="streak-bar">
          <div className="streak-n"><Flame size={18} strokeWidth={2.4} aria-hidden="true" />{streak}</div>
          <div className="streak-info">
            <strong>{streak === 0 ? "Survival Mode" : streak === 1 ? "First one!" : streak < 5 ? "Keep going!" : streak < 10 ? "On fire!" : "Unstoppable!"}</strong>
            {survivalBest > 0 && <span style={{fontSize:11,color:"var(--t3)",marginLeft:6}}>PB: {survivalBest}</span>}
            {streak > 0 && survivalBest > 0 && streak >= survivalBest && <span style={{fontSize:11,color:"var(--gold)",marginLeft:4,fontWeight:700}}>New PB</span>}
          </div>
        </div>
      )}

      {timed && !isTyped && (
        <div className="timer-row">
          <div className="timer-track">
            <div className="timer-fill" style={{
              width:`${(timeLeft/timerDuration)*100}%`,
              background: (timeLeft/timerDuration) > 0.5 ? "var(--accent)" : (timeLeft/timerDuration) > 0.25 ? "var(--gold)" : "var(--red)",
              // Phase 6b Issue B: suppress CSS width transition when
              // timeLeft jumps UP (post-answer reset to timerDuration).
              // Drain direction (decrement) keeps the .timer-fill class
              // transition for smooth animation.
              transition: timeLeft > prevTimeLeftRef.current ? 'none' : undefined,
            }}/>
          </div>
          <span className={`timer${(timeLeft/timerDuration)<=0.25?" urgent":""}`}>{timeLeft}s</span>
        </div>
      )}

      {/* Screen-reader countdown — announces only at thresholds (10s/5s/time's
          up), never every second, so AT users know time is draining in timed
          modes without a chatty per-second read. (medical accessibility HIGH.) */}
      <div className="sr-only" role="timer" aria-live="assertive" aria-atomic="true">
        {timed && !isTyped ? (timeLeft === 10 ? "10 seconds left" : timeLeft === 5 ? "5 seconds left" : timeLeft === 0 ? "Time's up" : "") : ""}
      </div>

      {/* desktop-web-refresh (Quiz #02): streak · circular timer ring · correct.
          Desktop-only (base display:none); reuses the live streak/score/timeLeft
          state that drives the mobile chrome, so the two never disagree. */}
      <div className="qd-meta" aria-hidden="true">
        <span className="qd-pill qd-pill-streak"><span className="qd-pill-ic"><Flame size={13} strokeWidth={2.4} aria-hidden="true" /></span>{streak} streak</span>
        {timed && !isTyped ? (
          <div className="qd-ring">
            <svg width="78" height="78" viewBox="0 0 78 78">
              <circle cx="39" cy="39" r="33" fill="none" stroke="#242730" strokeWidth="7"></circle>
              <circle cx="39" cy="39" r="33" fill="none" stroke={qdRingColor} strokeWidth="7" strokeLinecap="round"
                strokeDasharray={QD_RING_C} strokeDashoffset={QD_RING_C * (1 - qdRatio)}
                transform="rotate(-90 39 39)"
                style={{ transition: timeLeft > prevTimeLeftRef.current ? "none" : "stroke-dashoffset 0.9s linear, stroke 0.3s ease" }} />
            </svg>
            <span className="qd-ring-n">{timeLeft}</span>
          </div>
        ) : null}
        <span className="qd-pill qd-pill-correct"><span className="qd-pill-num">{score}</span>correct</span>
      </div>
      <div className="qd-eyebrow" aria-hidden="true">Question {idx + 1}</div>

      <div key={idx} className="q-card q-fade">
        <div className="q-tag">{CAT_LABELS[q.cat]||q.cat}</div>
        <div className="q-text" style={{fontSize:18}}>{q.q}</div>
      </div>

      {isTF ? (
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:8}}>
          {[true, false].map(val => {
            const isAnswered = selected !== null;
            // T/F answers stored as either boolean (TF_STATEMENTS) or number (QB: a:1/0)
            const qAsBool = q.a === true || q.a === 1;
            const isCorrect = val === qAsBool;
            const isChosen = selected === (val ? 1 : 0);
            // Pre-answer: neutral — no colour bias toward TRUE or FALSE
            let bg = "var(--s1)";
            let border = "2px solid var(--border)";
            let color = "var(--t1)";
            if (isAnswered) {
              if (isCorrect) { bg = "var(--green)"; border = "2px solid var(--green)"; color = "#fff"; }
              else if (isChosen) { bg = "var(--red)"; border = "2px solid var(--red)"; color = "#fff"; }
              else { bg = "var(--s2)"; border = "2px solid var(--border)"; color = "var(--t3)"; }
            }
            return (
              <button key={String(val)} disabled={isAnswered}
                onClick={() => { haptic("select"); handleMCQ(val ? 1 : 0); }}
                onPointerDown={e => { if (!isAnswered) e.currentTarget.style.transform = "scale(0.97)"; }}
                onPointerUp={e => { e.currentTarget.style.transform = ""; }}
                style={{padding:"20px 8px",fontSize:17,fontWeight:800,borderRadius:16,
                  background:bg,border,color,cursor:isAnswered?"default":"pointer",transition:"all 0.2s",fontFamily:"inherit",
                  opacity: isAnswered && !isCorrect && !isChosen ? 0.55 : 1}}>
                {isAnswered && isCorrect ? "✓ " : isAnswered && isChosen && !isCorrect ? "✗ " : ""}{val ? "TRUE" : "FALSE"}
              </button>
            );
          })}
        </div>
      ) : !isTyped ? (
        <div className="opts">
          {q.o.map((opt, i) => {
            const answered = selected !== null;
            const isCorrect = i === q.a;
            const isChosen = i === selected;
            let cls = "opt";
            if (answered) {
              if (isCorrect) cls += " correct";
              else if (isChosen) cls += " wrong";
              else cls += " neutral-after";
            }
            const icon = answered && isCorrect ? "✓" : answered && isChosen ? "✗" : LETTERS[i];
            return (
              // Measured 2026-07-28: after answering, all four options became
              // `disabled`, and a disabled button is a guaranteed dead click —
              // one of the two sources behind Clarity's 176 dead clicks (149 in
              // /play). Users tap the answered card expecting it to advance, so
              // now it does. aria-disabled (not `disabled`) keeps the control
              // focusable and clickable while still announcing it as unavailable
              // for answering; the paired CSS rules key off it for cursor/hover.
              <button key={i} className={cls} aria-disabled={answered || undefined}
                onClick={() => {
                  if (!answered) { handleMCQ(i); return; }
                  if (showNext) doAdvance(showNext.ns, showNext.nb, showNext.correct);
                }}
                onPointerDown={e => { if (!answered) e.currentTarget.style.transform = "scale(0.97)"; }}
                onPointerUp={e => { e.currentTarget.style.transform = ""; }}
                onPointerLeave={e => { e.currentTarget.style.transform = ""; }}
              >
                <span className="opt-l">{icon}</span>{opt}
              </button>
            );
          })}
        </div>
      ) : (
        <TypedInput key={idx} question={q} diff={diff} hintsEnabled={hintsEnabled} onAnswer={(correct, userText) => {
          // ⚠️ iOS WKWebView strands the keyboard if a focused input unmounts
          // (key={idx} remounts on advance; Results replaces it on the last
          // question). Blur on submit — the reveal phase wants the keyboard
          // down anyway so the explanation is visible. Same fix as Trail.
          try { document.activeElement?.blur?.(); } catch {}
          setTypedResult(correct ? "correct" : "wrong");
          if (correct && q.diff === "hard") {
            haptic("hardCorrect");
            setHardRightBurst(true);
            if (hardRightBurstTimerRef.current) clearTimeout(hardRightBurstTimerRef.current);
            hardRightBurstTimerRef.current = setTimeout(() => setHardRightBurst(false), TIMINGS.ANSWER_REVEAL);
          }
          registerAnswer(correct, userText, -1);
        }} />
      )}

      {/* Verdict BEFORE explanation. These two used to be the other way round
          here while TrueFalseScreen rendered verdict-then-explanation — the
          same two pieces of information in opposite orders in one app. Verdict
          first is also the right reading order: the outcome, then the reason
          for it, then the way forward.

          role="status" is polite by implication — NOT assertive, which the quiz
          timer already owns; two assertive regions would clobber each other. */}
      {answered && (() => {
        // timedOut wins over the index comparison — see the state declaration.
        const gotIt = !timedOut && (isTF
          ? ((selected === 1) === (q?.a === true || q?.a === 1))
          : (selected === q?.a || typedResult === "correct"));
        return (
          <div role="status" className={`feedback ${gotIt ? "correct" : "wrong"}`}>
            <span style={{flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{
              gotIt ? "✓ Correct!"
                : timedOut ? "Time's up"
                : isTyped ? `✗ ${q.typed_a}`
                : "✗ Incorrect"
            }</span>
          </div>
        );
      })()}

      {/* Shown whether they got it right or wrong. It used to be wrong-only —
          so the hand-written explanations that are the whole differentiator
          only ever appeared as a consolation prize, and a player on a good run
          never saw one. 75% of the bank carries an explanation; getting it
          right is exactly when someone wants the story behind it.

          ⚠️ AND IT HAS TO BE SEEN, which is a separate problem from being
          rendered. `.next-btn-primary` is position:sticky (bottom:16px,
          z-index:5) so that the CTA is always reachable — correct on its own
          terms, but it means that on ARRIVAL the green button floats directly
          over the explanation and clips it mid-sentence. Observed on an iPhone
          17 simulator, 2026-08-23: "...making the display all" and then the
          button. The text was reachable by scrolling, but nothing told the
          player it was there, and the obvious action — the big green Next —
          skips it.
          That matters more here than it would elsewhere: the explanations are
          the differentiator no measured competitor has. Routing players past
          them by default wastes the one thing that earns a return visit.
          So the panel scrolls itself into view. */}
      {answered && q?.hint && (
        <div ref={whyRef} style={{
          marginTop:10,
          padding:"10px 14px",
          background:"var(--s1)",
          border:"1px solid var(--border)",
          borderRadius:10,
          fontSize:13,
          lineHeight:1.5,
          color:"var(--t2)",
          animation:"fadeIn 0.4s ease-out"
        }}>
          <div style={{fontSize:10,fontWeight:700,color:"var(--t3)",letterSpacing:0.2,fontFamily:"'Inter',sans-serif",marginBottom:4,display:"flex",alignItems:"center",gap:4}}><Lightbulb size={11} strokeWidth={2.5} aria-hidden="true" /> Why?</div>
          <div>{q.hint}</div>
        </div>
      )}
      {answered && onReport && (() => {
        const rkey = q?._histKey || (q?.id != null ? String(q.id) : q?.q);
        return (
          <ReportButton
            // ⚠️ key is load-bearing. This element keeps its position in the
            // tree while `q` changes, so without it question 2 would inherit
            // question 1's "reported" state. The old code needed a keyed Set
            // for exactly this reason; remounting per question is simpler and
            // cannot go stale.
            key={rkey}
            onReport={onReport}
            idle={<><Flag size={13} strokeWidth={2.4} aria-hidden="true" /> Report a problem</>}
            idleColor="var(--t3)"
            // A thunk, so picked/correct are read at press time rather than
            // recomputed on every render of the question.
            info={() => {
              const picked = isTF
                ? (selected === 1 ? "True" : selected === 0 ? "False" : null)
                : (typeof selected === "number" && Array.isArray(q?.o) ? q.o[selected] : null);
              const correct = isTF
                ? ((q?.a === true || q?.a === 1) ? "True" : "False")
                : (Array.isArray(q?.o) && typeof q?.a === "number" ? q.o[q.a] : (q?.typed_a || null));
              return { id: q?.id, q: q?.q, picked, correct, mode };
            }}
            // Was 12px var(--t3) — our DIMMEST token — borderless, on a screen
            // that auto-advances. Zero reports were ever filed. A control the
            // player cannot find is the same as no control, and playtesters have
            // a far better hit rate on real question defects than any audit we
            // run, so this is the highest-value thing on the screen after the
            // answer itself. Now t2 on a bordered chip at 13px, and a 44px min
            // height so it clears the touch-target floor.
            // ⚠️ Demoted 2026-08-23. A bordered chip sitting directly beneath
            // the primary CTA gave a RARE action the second-most prominent
            // position on the busiest screen in the app, competing with Next
            // for the same downward glance. It is a safety valve, not a step
            // in the flow. Now plain text at --t3: still a 44px tap target,
            // still perfectly findable by someone who wants it, no longer
            // shouting at everyone who does not.
            style={{
              display:"block", margin:"16px auto 0", padding:"12px 14px", minHeight:44,
              background:"transparent", border:"none", borderRadius:10,
              fontSize:12.5, fontWeight:600,
            }}
          />
        );
      })()}
      {/* Sticky FOOTER, not a sticky button (review 2026-09-06, A3/A4): the
          pinned button used to sit flat over the last "Why?" box, and "Report a
          problem" sat under it where mis-taps landed. The footer fades what it
          covers, and the report link now precedes it in flow. */}
      {answered && showNext && (
        <div className="q-sticky-foot">
          <button
            className="next-btn-primary"
            onClick={() => doAdvance(showNext.ns, showNext.nb, showNext.correct)}
          >
            {idx + 1 >= total ? "Results →" : "Next →"}
          </button>
        </div>
      )}
      </div>{/* /.qd-play */}

      {showQuit && (
        <div className="modal-overlay" onClick={() => setShowQuit(false)}>
          <div ref={quitRef} tabIndex={-1} className="modal-box" role="dialog" aria-modal="true" aria-labelledby="quit-title" onClick={e => e.stopPropagation()}>
            <div className="modal-grab" aria-hidden="true" />
            {/* The stake, not a generic warning (2026-09-06, Alex: "this screen
                also looks dull"): a sheet in the app's vocabulary — icon well,
                what is actually on the line, one green primary, a quiet exit. */}
            <div className="modal-head">
              <div className="modal-title" id="quit-title">Leave this quiz?</div>
              <div className="modal-body">{idx > 0
                ? <><strong>{score}</strong> right from <strong>{idx}</strong> answered — that&#39;s lost if you quit.</>
                : "Your progress will be lost."}</div>
            </div>
            <div className="modal-btns">
              <button className="modal-btn modal-cancel" onClick={() => setShowQuit(false)}>Keep playing</button>
              {/* ⚠️ A rage-quit is a stated bad moment. The app already knows —
                  it rendered a confirm dialog and the player said yes — and it
                  did nothing with that. Abandoning mid-quiz is not the mood to
                  ask for five stars in. */}
              <button className="modal-btn modal-confirm" onClick={() => { try { markBadReviewMoment(); } catch {} onBack(); }}>Quit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

