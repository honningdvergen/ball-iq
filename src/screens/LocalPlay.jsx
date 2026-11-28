// Pass and play: the couch mode, several players on one phone. Setup, the game
// and the end. Extracted from App.jsx on 2026-09-06 (review E16, brick 2); the
// question-selection helpers (getQs, applySeenFilter, shuffle, …) stay in App
// and are imported along the seam the lazy screens already use.
//
// THE LOOK OF 26 NOV 2026, approved piece by piece by Alex (ball-iq-audit/
// 2026-11-24/finish/pass-play-*.png; brief ball-iq-audit/2026-11-26/
// pass-play-build-brief.md). His rulings, so nothing is undone:
//  - each player picks a colour and a badge; the disc carries the badge and
//    NEVER a number, and the name is said once ("Johannes, you're up");
//  - "Scores so far" is a table on the hand-over; nobody can take a colour or
//    a badge another player holds;
//  - Steal only in two-player games ("Yes, lock it"), and the stealer sees the
//    struck answer ("Yes, show it"): the two switches are in lib/passPlay.js;
//  - a draw is just a draw ("No, just a draw"): no decider of any kind.
// The question and its reveal are the approved quiz look (quizQuestion.css's
// .qq classes, shared, not copied). The players, Steal and the end's maths are
// pure functions in lib/passPlay.js (tests/unit/pass-play.test.js).
import { useState, useEffect, lazy, Suspense } from "react";
import { ArrowLeft, ArrowRight, Check, X, Pencil, ChevronRight, Shuffle, Timer, Zap, Flame, Shield, Lightbulb, Flag, Skull, CircleAlert, Loader, Share, ListOrdered } from "lucide-react";
import { chipLabel, applySeenFilter, getQs, qbHistKey, recordSeenQuestions, shuffle } from "../App.jsx";
import { haptic, playSound } from "../lib/feedback.js";
import "../i18n/en.js";
import { useT } from "../i18n/index.js";
import { TopicPickerSheet, topicMeta } from "../components/TopicPickerSheet.jsx";
import { CLUB_PACK_TO_QB } from "../data/clubPacks.js";
import ReportButton from "../components/ReportButton.jsx";
import { loadQuestions } from "../questions-loader.js";
import { useQuestionText, useLiveQuestion } from "../i18n/questionText.js";
import { RETIRED_TAGS, optionOrder } from "../lib/quiz.js";
import { QUIZ_LEAGUE_FLAGS, QUIZ_TOPIC_ICONS, LEGENDS_ICON, topicAnswersQuestion } from "../lib/quizTopicMarks.js";
import { questionCardStyle } from "../lib/questionAccent.js";
import { noBreakScores } from "../lib/noBreakScore.js";
import {
  STEAL_SHOWS_STRUCK, initialSlots, normalizeSlots, pickFor, makePlayers, slotsFromPlayers,
  stealInGame, canSteal, stealerFor, newTally, scoreOwn, scoreSteal, scoresSoFar, standing,
  gamePlan, fitPlan, dealt, ownQuestions, handoverLineKey,
} from "../lib/passPlay.js";
import { PlayerDisc, PickerSheet, PlayerTable, playerVars } from "./passPlayParts.jsx";
import "./quizQuestion.css";
import "./passPlay.css";

const LETTERS = ["A", "B", "C", "D"];
// Classic and Sprint say what each player gets for the chosen player count
// (lib/passPlay.js gamePlan: "6 questions each"); the other two keep a line.
const MODES = [
  { id: "classic", Icon: Timer, name: "quiz.mode.classic" },
  { id: "sprint", Icon: Zap, name: "lp.sprint" },
  { id: "survival", Icon: Flame, name: "home.mode.survival", desc: "lp.survivalDesc" },
  // Top 10 in turns (26 Nov 2026): its own screen, Top10Turns.jsx, in its own
  // lazy chunk. A list at random, never a daily still to come; no topic.
  { id: "top10", Icon: ListOrdered, name: "lp.top10", desc: "lp.top10Desc" },
];
const Top10Turns = lazy(() => import("./Top10Turns.jsx"));
const modeName = (t, mode) => t((MODES.find((m) => m.id === mode) || MODES[0]).name);

// The topic's name and mark on the quiet row and in the end's grey line:
// "Everything" for all topics mixed (the Quiz topic screen's own words), a
// league's flag, a competition's line icon, a club's colours; never an emoji.
function topicShown(topic, t) {
  if (!topic || topic === "mixed") return { label: t("qz.classic"), sub: t("qz.classicSub"), mark: <span className="pp-ic g"><Shuffle size={20} strokeWidth={2.1} aria-hidden="true" /></span> };
  const tm = topicMeta(topic, t);
  const cat = String(topic).startsWith("cat:") ? String(topic).slice(4) : null;
  let mark;
  if (cat && QUIZ_LEAGUE_FLAGS[cat]) mark = <span className="pp-ic"><img src={`/${QUIZ_LEAGUE_FLAGS[cat]}`} width="26" height="18" alt="" aria-hidden="true" decoding="async" /></span>;
  else if (cat && QUIZ_TOPIC_ICONS[cat]) { const I = QUIZ_TOPIC_ICONS[cat]; mark = <span className="pp-ic"><I size={20} strokeWidth={2.1} aria-hidden="true" /></span>; }
  else if (tm.abbr) mark = <span className="pp-ic"><span className="pp-mono" style={{ background: tm.color || "var(--s2)", color: tm.fg || "var(--t1)" }} aria-hidden="true">{tm.abbr}</span></span>;
  else mark = <span className="pp-ic"><Shield size={20} strokeWidth={2.1} aria-hidden="true" /></span>;
  return { label: tm.label, sub: tm.sub, mark };
}

// ─── SETUP ────────────────────────────────────────────────────────────────────
// As drawn (pass-play-setup-2.png): the number of players as one filled row,
// one row per player (disc, name, a pencil into the picker), the quiet topic
// row, the three modes with a tick, ONE solid Start kept in view at the bottom.
// `initial` is the last game's config when the end's "Change topic or mode"
// brings the players back here.
export function LocalSetup({ onStart, onBack, initial }) {
  const t = useT();
  const unnamed = (n) => t("lp.player", { n });
  const [count, setCount] = useState(() => (initial?.players?.length >= 2 ? initial.players.length : 2));
  const [slots, setSlots] = useState(() => (initial?.players ? slotsFromPlayers(initial.players, unnamed) : initialSlots()));
  const [lmode, setLmode] = useState(initial?.mode || "classic");
  const [topic, setTopic] = useState(initial?.topic || "mixed");
  const [topicOpen, setTopicOpen] = useState(false);
  const [editing, setEditing] = useState(null); // the seat whose sheet is open

  const changeCount = (n) => { setCount(n); setSlots((s) => normalizeSlots(s, n)); };
  const launch = () => {
    // Same call as Classic (Alex, 2026-09-06): no difficulty picker. The arc
    // ramps easy → hard inside the round; survival draws the hard pool.
    onStart({ players: makePlayers(slots, count, unnamed), mode: lmode, diff: "hard", topic });
  };
  const tp = topicShown(topic, t);

  return (
    <div className="pp pp-page">
      <header className="pp-top">
        <button className="pp-tile" onClick={onBack} aria-label={t("game.goBack")}><ArrowLeft size={20} strokeWidth={2.2} aria-hidden="true" /></button>
        <div className="pp-tt">
          <h1>{t("lp.heading")}</h1>
          <p>{t("oh.localSub")}</p>
        </div>
      </header>

      <h2 className="pp-label" id="pp-n-l">{t("lp.players")}</h2>
      <div className="pp-seg" role="radiogroup" aria-labelledby="pp-n-l">
        {[2, 3, 4, 5, 6].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={count === n} className={count === n ? "on" : ""} onClick={() => changeCount(n)}>{n}</button>
        ))}
      </div>

      <h2 className="pp-label">{t("lp.who")}</h2>
      <section className="pp-card">
        {slots.slice(0, count).map((s, i) => {
          const shown = s.name.trim() || unnamed(i + 1);
          return (
            <button key={i} type="button" className="pp-row is-name" aria-haspopup="dialog" aria-label={t("lp.edit", { name: shown })} onClick={() => setEditing(i)}>
              <PlayerDisc p={s} size={36} />
              <b className={s.name.trim() ? "" : "is-ph"}>{shown}</b>
              <span className="pp-ch"><Pencil size={16} strokeWidth={2.1} aria-hidden="true" /></span>
            </button>
          );
        })}
      </section>

      {lmode === "top10" ? (
        <>
          {/* Top 10 in turns plays a list, not a topic: which one is a surprise. */}
          <h2 className="pp-label">{t("t10t.list")}</h2>
          <section className="pp-card">
            <div className="pp-row is-tall is-still">
              <span className="pp-ic g"><Shuffle size={20} strokeWidth={2.1} aria-hidden="true" /></span>
              <span className="pp-rt"><b>{t("t10t.listRandom")}</b><i>{t("t10t.listNever")}</i></span>
            </div>
          </section>
        </>
      ) : (
        <>
          <h2 className="pp-label">{t("lp.topic")}</h2>
          <section className="pp-card">
            <button type="button" className="pp-row is-tall" aria-haspopup="dialog" onClick={() => setTopicOpen(true)}>
              {tp.mark}
              <span className="pp-rt"><b>{tp.label}</b><i>{tp.sub}</i></span>
              <span className="pp-ch"><ChevronRight size={20} strokeWidth={2.1} aria-hidden="true" /></span>
            </button>
          </section>
        </>
      )}
      {topicOpen && (
        <TopicPickerSheet value={topic} onClose={() => setTopicOpen(false)} onDone={(id) => { setTopic(id); setTopicOpen(false); }} />
      )}

      <h2 className="pp-label" id="pp-m-l">{t("lp.mode")}</h2>
      <section className="pp-card" role="radiogroup" aria-labelledby="pp-m-l">
        {MODES.map((m) => {
          const on = lmode === m.id;
          return (
            <button key={m.id} type="button" role="radio" aria-checked={on} className={`pp-row is-tall${on ? " on" : ""}`} onClick={() => setLmode(m.id)}>
              <span className={`pp-ic${on ? " g" : ""}`}><m.Icon size={18} strokeWidth={2.1} aria-hidden="true" /></span>
              <span className="pp-rt"><b>{t(m.name)}</b><i>{m.desc ? t(m.desc) : t("lp.each", { count: gamePlan(m.id, count).each })}</i></span>
              {on && <span className="pp-tick"><Check size={20} strokeWidth={2.6} aria-hidden="true" /></span>}
            </button>
          );
        })}
      </section>

      <div className="pp-spacer" />
      <div className="pp-bar">
        <button type="button" className="pp-go" onClick={launch}>{t("lp.start", { n: count })}</button>
      </div>

      {editing != null && (
        <PickerSheet slots={slots} count={count} seat={editing}
          onName={(v) => setSlots((s) => s.map((x, i) => (i === editing ? { ...x, name: v } : x)))}
          onPick={(key, v) => setSlots((s) => pickFor(s, count, editing, key, v))}
          onClose={() => setEditing(null)} />
      )}
    </div>
  );
}

// ─── LOCAL GAME ENGINE ────────────────────────────────────────────────────────
// Flow (classic / sprint — dealt in turns, lib/passPlay.js gamePlan: every
// player gets the same number of questions, Alex 26 Nov "Yes, same each"):
//   hand-over → question → locked (0.8s) → that question's reveal (Next)
//     → the next question in the turn, OR the next player's hand-over
//   In a two-player Classic or Sprint game a wrong answer is not revealed: the
//   other player gets one try at it (Steal), then the reveal, then play goes on
//   where it was.
// Flow (survival — everyone on the same question):
//   hand-over → question → locked (0.8s) → next player → … → reveal (Next)
//     → next question's hand-over (eliminations applied on Next)
//
// Hidden-answer rule (Survival): nothing is revealed after a single pick; the
// reveal shows all the picks and the right answer in one go, so a later player
// can't read the answer off an earlier player's screen.
export function LocalGameScreen(props) {
  // Top 10 in turns is its own screen (Top10Turns.jsx); the quiz modes below
  // are exactly as they were.
  if (props.config?.mode === "top10") {
    return (
      <Suspense fallback={<div className="screen" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}><Loader size={36} strokeWidth={1.8} color="var(--t3)" aria-hidden="true" /></div>}>
        <Top10Turns players={props.config.players} onExit={props.onExit} />
      </Suspense>
    );
  }
  return <LocalQuizGame {...props} />;
}

function LocalQuizGame({ config, onComplete, onExit, onReport }) {
  // Questions print in the player's language (i18n/questionText.js); picks and
  // scoring read the English rows. The chrome is t() (i18n step 6).
  const loc = useQuestionText();
  const t = useT();
  const { players, mode, diff, topic = "mixed" } = config;
  const isSurvival = mode === "survival";
  // Classic and Sprint: the table's deal (rounds of one turn each). Survival
  // draws up to 30 and plays them one at a time.
  const basePlan = isSurvival ? null : gamePlan(mode, players.length) || gamePlan("classic", players.length);
  const target = isSurvival ? 30 : basePlan.total;
  const stealOn = stealInGame(players.length, mode);

  // getQs was made async by commit fc6e7aa (V1.1 lazy-load). useState
  // initializers can't await — so the previous `useState(() => getQs(...))`
  // stored a Promise and `(Promise || []).filter` crashed with a TypeError.
  // Load via useEffect; null = still loading, [] = loaded (possibly empty).
  const [questions, setQuestions] = useState(null);
  // Retry nonce for the load-failure screen below: bumping it re-runs the
  // load effect. questions: null = loading, [] = failed/empty.
  const [loadNonce, setLoadNonce] = useState(0);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Topic-scoped pools (same ids as the online lobby): a club topic
        // filters the bank by club; a cat topic rides getQs' category filter;
        // mixed keeps the original all-categories behaviour.
        let raw;
        if (String(topic).startsWith("club:")) {
          const { QB } = await loadQuestions();
          const clubName = CLUB_PACK_TO_QB[String(topic).slice(5)];
          // Retired packs withheld here too — pass-and-play draws the bank directly.
          const pool = QB.filter(q => q && q.club === clubName && q.type === "mcq" && Array.isArray(q.o)
            && (!q.tag || !RETIRED_TAGS.has(q.tag)) && !q.flag);
          // No "easy" in club games (invested fans); keep full pool only if the
          // no-easy pool is too thin to fill the round.
          const noEasyPool = pool.filter(q => q.diff !== "easy");
          const freshPool = applySeenFilter(noEasyPool.length >= target ? noEasyPool : pool, target, qbHistKey);
          raw = shuffle([...freshPool]).slice(0, target).map(q => {
            const idx = optionOrder(q.o.slice(0, 4), shuffle);
            return { ...q, o: idx.map(i => q.o[i]), a: idx.indexOf(q.a), _histKey: qbHistKey(q) };
          });
        } else if (String(topic).startsWith("cat:")) {
          raw = await getQs({ cat: String(topic).slice(4), diff, n: target, ramp: mode === "classic", noEasy: true });
        } else {
          raw = await getQs({ cat: "All", diff, n: target, ramp: mode === "classic", includeLegends: mode === "survival" });
        }
        if (cancelled) return;
        const filtered = (Array.isArray(raw) ? raw : []).filter(q => q && q.type !== "tf" && q.type !== "typed");
        // A short bank never deals an unequal game: whole rounds come off
        // until the questions cover every turn (fitPlan); none covered is []
        // and the not-enough screen below.
        const fit = isSurvival ? null : fitPlan(basePlan, players.length, filtered.length);
        setQuestions(isSurvival ? filtered : fit ? filtered.slice(0, fit.total) : []);
      } catch {
        if (!cancelled) setQuestions([]);
      }
    })();
    return () => { cancelled = true; };
    // config is captured at mount (LocalGameScreen unmounts on exit); no
    // need to re-fetch on prop change since LocalSetup creates a fresh
    // instance for each game. loadNonce re-runs it for the error screen's
    // Try Again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadNonce]);
  const totalQs = questions?.length ?? 0;
  // The plan as played: the table's, or fewer rounds when the bank was short.
  const plan = isSurvival || !totalQs ? null : fitPlan(basePlan, players.length, totalQs);

  const [currentQIdx, setCurrentQIdx] = useState(0);  // index of question currently on screen
  const [turnIdx, setTurnIdx] = useState(0);           // survival: which surviving player is answering
  const [phase, setPhase] = useState("handoff");
  // Points (scores), own right answers (rights) and steals, per player.
  const [tally, setTally] = useState(() => newTally(players));
  const scores = tally.scores;
  const [eliminatedIds, setEliminatedIds] = useState([]);
  const [newEliminatedIds, setNewEliminatedIds] = useState([]);
  const [chunkPicks, setChunkPicks] = useState([]);   // survival: [{qIdx, playerId, optIdx}] for the question on screen
  const [lastPick, setLastPick] = useState(null);      // the just-submitted pick, for the locked-state mark
  const [marks, setMarks] = useState([]);              // classic/sprint: per question, the asker's own answer right or not (the steps)
  const [steal, setSteal] = useState(null);            // { misserId, stealerId, missOpt, pick } while a steal is on or just revealed
  const [ownPick, setOwnPick] = useState(null);        // classic/sprint: the asker's pick on the question being revealed

  const survivors = players.filter(p => !eliminatedIds.includes(p.id));
  // In classic/sprint, whose turn it is and where the question sits in that
  // player's own run (lib/passPlay.js dealt). In survival, the answering
  // player is the current surviving answerer.
  const deal = plan ? dealt(plan, players.length, currentQIdx) : null;
  const turnEndQ = deal ? deal.turnEnd : currentQIdx;
  const currentPlayer = isSurvival
    ? survivors[turnIdx]
    : deal ? players[deal.seat] : null;
  const currentQ = questions ? questions[currentQIdx] : null;
  // Computed above the early returns, so it is only held English as displayed
  // (questionText.js useLiveQuestion) while a phase actually shows it: not
  // behind the hand-off screen.
  const shownQ = useLiveQuestion(currentQ, phase === "question" || phase === "locked" || phase === "steal" || phase === "stealLocked" || phase === "reveal");

  // End-of-game:
  // - Classic/Sprint: ran off the end of the question list → rank by score.
  // - Survival — three ways to finish:
  //     last-standing : exactly one player alive
  //     total-wipe    : all remaining players answered wrong on the same question
  //     questions-out : pool exhausted with 2+ survivors still alive (rank by score among them)
  useEffect(() => {
    if (phase === "done") return;
    // Skip while questions are still async-loading — totalQs would otherwise
    // read 0 and immediately fire onComplete with "questions-out".
    if (questions === null) return;
    // Load failed / pool came back empty ([]): the error screen below owns
    // this state. Without the guard, currentQIdx (0) >= totalQs (0) fires a
    // fake 0-0 "questions-out" podium via onComplete.
    if (totalQs === 0) return;
    const base = { players, scores, rights: tally.rights, steals: tally.steals, stealOn, eliminatedIds, mode, topic };
    if (mode !== "survival") {
      if (currentQIdx >= totalQs) {
        setPhase("done");
        onComplete({ ...base, winnerId: null, endReason: "questions-out" });
      }
      return;
    }
    // Survival
    if (survivors.length <= 1) {
      const winnerId = survivors[0]?.id ?? null;
      const endReason = survivors.length === 1 ? "last-standing" : "total-wipe";
      setPhase("done");
      onComplete({ ...base, winnerId, endReason });
      return;
    }
    if (currentQIdx >= totalQs) {
      // Two or more players still alive but the question pool is exhausted
      setPhase("done");
      onComplete({ ...base, winnerId: null, endReason: "questions-out" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQIdx, totalQs, mode, phase, eliminatedIds]);

  useEffect(() => {
    if (phase !== "done") return;
    try { recordSeenQuestions(questions); } catch {}
  }, [phase, questions]);

  // A new question, a hand-over or a steal starts at the top: the reveal's Why
  // can leave the page scrolled down (QuizEngine does the same per question).
  const screenKey = `${currentQIdx}:${phase === "handoff" || phase === "playerSwap" ? "h" : phase === "steal" ? "s" : "q"}`;
  useEffect(() => {
    try { window.scrollTo({ top: 0, left: 0, behavior: "instant" }); } catch { /* old engines */ }
  }, [screenKey]);

  // Load failure — mirrors QuizEngine's !q guard. Must render BEFORE the
  // loading/finishing fallback below (explicit state before fallback checks),
  // which would otherwise swallow this as an eternal "Finishing up…". Pairs
  // with the totalQs === 0 guard in the end-of-game effect.
  if (questions !== null && totalQs === 0) {
    return (
      <div className="screen" style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh",flexDirection:"column",gap:14,padding:"0 24px",textAlign:"center"}}>
        <CircleAlert size={36} strokeWidth={1.8} color="var(--t3)" aria-hidden="true" />
        <div style={{fontFamily:"'Inter',sans-serif",fontSize:16,fontWeight:700,color:"var(--text)"}}>{t("lp.loadFail")}</div>
        <div style={{fontFamily:"'Inter',sans-serif",fontSize:13,color:"var(--t2)",lineHeight:1.5}}>{t("lp.loadFailSub")}</div>
        <button className="btn-3d" style={{marginTop:6,maxWidth:240}} onClick={() => { setQuestions(null); setLoadNonce(n => n + 1); }}>{t("lp.retry")}</button>
        <button className="btn-3d ghost" style={{maxWidth:240}} onClick={onExit}>{t("quiz.backHome")}</button>
      </div>
    );
  }

  if (phase === "done" || !currentQ) {
    return (
      <div className="screen" style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh",flexDirection:"column",gap:14}}>
        <Loader size={36} strokeWidth={1.8} color="var(--t3)" aria-hidden="true" />
        <div style={{fontSize:14,color:"var(--t2)"}}>{questions === null ? t("lp.loading") : t("lp.finishing")}</div>
      </div>
    );
  }

  // ── Actions ────────────────────────────────────────────────────────────────
  const pick = (optIdx) => {
    if (phase !== "question" || !currentPlayer) return;
    haptic("soft");
    playSound("soft");
    const entry = { qIdx: currentQIdx, playerId: currentPlayer.id, optIdx };
    const nextPicks = [...chunkPicks, entry];
    if (mode === "survival") setChunkPicks(nextPicks);
    setLastPick(entry);
    setPhase("locked");

    setTimeout(() => {
      if (mode === "survival") {
        // Same question, advance to next surviving player who hasn't answered
        const answeredIds = new Set(nextPicks.filter(p => p.qIdx === currentQIdx).map(p => p.playerId));
        const nextI = survivors.findIndex(p => !answeredIds.has(p.id));
        if (nextI !== -1) {
          setTurnIdx(nextI);
          setLastPick(null);
          setPhase("playerSwap");
        } else {
          // Everyone answered this question → reveal
          revealSurvivalQuestion(nextPicks);
        }
        return;
      }
      // classic/sprint: a miss a steal can be made on goes to the other
      // player unrevealed; anything else is revealed now.
      const right = optIdx === currentQ.a;
      setOwnPick(optIdx);
      setLastPick(null);
      // The step turns green or red with the reveal, not before (a steal waits).
      const mark = () => setMarks(m => { const c = m.slice(); c[currentQIdx] = right; return c; });
      if (!right && canSteal(players.length, mode, currentQ)) {
        setSteal({ misserId: currentPlayer.id, stealerId: stealerFor(players, currentPlayer.id).id, missOpt: optIdx, pick: null });
        setPhase("steal");
        return;
      }
      setSteal(null);
      mark();
      setTally(tl => scoreOwn(tl, currentPlayer.id, right));
      haptic("heavy");
      playSound("streak");
      setPhase("reveal");
    }, 800);
  };

  // The stealer's one try: a right pick is their point and a steal; a wrong
  // one scores nobody. Then the normal reveal.
  const pickSteal = (optIdx) => {
    if (phase !== "steal" || !steal) return;
    if (STEAL_SHOWS_STRUCK && optIdx === steal.missOpt) return; // struck, not tappable
    haptic("soft");
    playSound("soft");
    setLastPick({ qIdx: currentQIdx, playerId: steal.stealerId, optIdx });
    setPhase("stealLocked");
    setTimeout(() => {
      const right = optIdx === currentQ.a;
      setSteal(s => ({ ...s, pick: optIdx }));
      setLastPick(null);
      setMarks(m => { const c = m.slice(); c[currentQIdx] = false; return c; }); // the asker's own answer missed
      setTally(tl => scoreSteal(tl, steal.stealerId, right));
      haptic("heavy");
      playSound("streak");
      setPhase("reveal");
    }, 800);
  };

  // A function declaration, not a const arrow: it is called from the
  // lock-in handler declared above it, and a `const` there is a TDZ read.
  function revealSurvivalQuestion(picksSoFar) {
    const thisQPicks = picksSoFar.filter(p => p.qIdx === currentQIdx);
    const freshlyOut = [];
    setTally(tl => {
      let next = tl;
      for (const pk of thisQPicks) next = scoreOwn(next, pk.playerId, pk.optIdx === currentQ.a);
      return next;
    });
    for (const pk of thisQPicks) if (pk.optIdx !== currentQ.a) freshlyOut.push(pk.playerId);
    setNewEliminatedIds(freshlyOut);
    haptic("heavy");
    playSound("streak");
    setPhase("reveal");
  }

  // Next on a reveal: play continues where it was.
  const advance = () => {
    if (mode === "survival") {
      const allOut = [...eliminatedIds, ...newEliminatedIds];
      setEliminatedIds(allOut);
      setNewEliminatedIds([]);
      const nextSurvivors = players.filter(p => !allOut.includes(p.id));
      if (nextSurvivors.length <= 1) return;
      const nextQ = currentQIdx + 1;
      if (nextQ >= totalQs) {
        setCurrentQIdx(nextQ);
        return;
      }
      setCurrentQIdx(nextQ);
      setTurnIdx(0);
      setChunkPicks([]);
      setPhase("handoff");
      return;
    }
    setSteal(null);
    setOwnPick(null);
    if (currentQIdx < turnEndQ) {
      setCurrentQIdx(currentQIdx + 1);
      setPhase("question"); // no screen between questions; same player continues
      return;
    }
    const nextStart = turnEndQ + 1;
    setCurrentQIdx(nextStart);
    if (nextStart < totalQs) setPhase("handoff");
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  const back = (
    <button className="back-btn qq-tile pp-tile" onClick={onExit} aria-label={t("game.goBack")}><ArrowLeft size={20} strokeWidth={2.2} aria-hidden="true" /></button>
  );

  if (phase === "handoff" || phase === "playerSwap") {
    // Classic/Sprint count the player's OWN questions ("Questions 4 to 6" of
    // their six), and the line under the name says whether the phone goes on.
    const eyebrow = deal && plan.perTurn > 1
      ? t("lp.qRange", { a: deal.ownStart + 1, b: deal.ownEnd + 1 })
      : t("lp.qOne", { n: deal ? deal.own + 1 : currentQIdx + 1 });
    const lineKey = deal ? handoverLineKey(plan, players.length, currentQIdx) : "lp.next1";
    const rows = scoresSoFar(players, scores, eliminatedIds);
    return (
      <div className="pp pp-page" style={playerVars(currentPlayer)}>
        <header className="pp-top">{back}</header>
        <div className="pp-ho">
          <p className="pp-eye">{eyebrow}</p>
          <PlayerDisc p={currentPlayer} size={96} />
          <h2>{t("lp.youreUp", { name: currentPlayer?.name })}</h2>
          <p>{t(lineKey)}</p>
        </div>
        <h2 className="pp-label">{t("lp.scoresSoFar")}</h2>
        <PlayerTable rows={rows} scores={scores} size="sm" upId={currentPlayer?.id} outIds={eliminatedIds} />
        <div className="pp-spacer" />
        <div className="pp-bar">
          <button type="button" className="pp-go" onClick={() => setPhase("question")}>{t("lp.ready")}<ArrowRight size={18} strokeWidth={2.6} aria-hidden="true" /></button>
        </div>
      </div>
    );
  }

  // The question, the steal and the reveal: the approved quiz look.
  const cardStyle = questionCardStyle(currentQ.cat);
  const clubName = String(topic).startsWith("club:") ? CLUB_PACK_TO_QB[String(topic).slice(5)] : null;
  // In a mixed game the topic line must not answer the question (quizTopicMarks.js).
  const quietTopic = (!topic || topic === "mixed") && topicAnswersQuestion(currentQ, chipLabel(t, currentQ.cat));
  const flag = quietTopic ? null : QUIZ_LEAGUE_FLAGS[currentQ.cat];
  const TopicIcon = quietTopic ? null : (QUIZ_TOPIC_ICONS[currentQ.cat] || (currentQ.cat === "Legends" ? LEGENDS_ICON : null));
  const lead = flag ? { name: chipLabel(t, currentQ.cat) }
    : TopicIcon ? { Icon: TopicIcon, name: chipLabel(t, currentQ.cat) }
    : clubName ? { Icon: Shield, name: clubName }
    : { Icon: null, name: quietTopic ? t("home.quiz.title") : chipLabel(t, currentQ.cat) };
  const LeadIcon = lead.Icon;
  // The steps and "N of M" count the asker's own questions in this game (six
  // for Classic with two to four players), not the game's total; a steal
  // shows on the misser's step, the asker's.
  const mine = deal ? ownQuestions(plan, players.length, deal.seat) : [];
  const ownTotal = mine.length;
  const isReveal = phase === "reveal";
  // The banner stands while the steal is on; its reveal is the normal one,
  // the two picks tagged with whose they were.
  const isSteal = phase === "steal" || phase === "stealLocked";
  const stealer = steal ? players.find(p => p.id === steal.stealerId) : null;
  const misser = steal ? players.find(p => p.id === steal.misserId) : null;
  const locked = phase === "locked" || phase === "stealLocked";
  const lastQ = mode === "survival" ? false : currentQIdx >= totalQs - 1;
  const tag = (p) => <i className="pp-tag" key={p.id}><PlayerDisc p={p} size={22} /><span>{p.name}</span></i>;

  // Who picked each option, shown on the reveal: Survival's picks, or the
  // steal's two (the miss and the stealer's try).
  const pickersOf = (i) => {
    if (!isReveal) return [];
    if (mode === "survival") return chunkPicks.filter(pk => pk.qIdx === currentQIdx && pk.optIdx === i).map(pk => players.find(p => p.id === pk.playerId)).filter(Boolean);
    if (steal && steal.pick !== null) return [steal.missOpt === i ? misser : null, steal.pick === i ? stealer : null].filter(Boolean);
    return [];
  };
  const someoneRight = mode === "survival"
    ? chunkPicks.some(pk => pk.qIdx === currentQIdx && pk.optIdx === currentQ.a)
    : steal && steal.pick !== null ? steal.pick === currentQ.a : ownPick === currentQ.a;

  const reportInfo = () => ({ id: currentQ?.id, q: currentQ?.q, picked: typeof ownPick === "number" ? currentQ.o[ownPick] : null, correct: currentQ.o[currentQ.a], mode: "local" });

  return (
    <div className="quiz-wrap qq pp" style={playerVars(isSteal ? stealer : currentPlayer)}>
      <div className="qq-hd">
        {back}
        {mode === "survival" ? (
          <div className="qq-gap" />
        ) : (
          <div className="qq-steps" role="img" aria-label={t("lp.stepsAria", { n: deal.own + 1, total: ownTotal })}>
            {mine.map((gi) => (
              <i key={gi} className={marks[gi] === true ? "ok" : marks[gi] === false ? "no" : gi === currentQIdx ? "cur" : ""} />
            ))}
          </div>
        )}
        {!isSteal && !(isReveal && mode === "survival") && (
          <span className="pp-turn"><PlayerDisc p={currentPlayer} size={26} /><span>{t("lp.turn", { name: currentPlayer?.name })}</span></span>
        )}
      </div>

      {isSteal && stealer && (
        <div className="pp-stl" role="status">
          <PlayerDisc p={stealer} size={40} />
          <span className="pp-rt"><b>{t("lp.stealIt", { name: stealer.name })}</b><i>{t("lp.stealLine", { name: misser?.name })}</i></span>
        </div>
      )}

      <section key={currentQIdx} className={`qq-card q-fade${cardStyle ? " has-k" : ""}`} style={cardStyle}>
        <div className="qq-cat">
          {flag
            ? <img className="qq-flag" src={`/${flag}`} width="26" height="18" decoding="async" alt="" aria-hidden="true" onError={(e) => { e.currentTarget.style.display = "none"; }} />
            : LeadIcon ? <span className="qq-lead" aria-hidden="true"><LeadIcon size={18} strokeWidth={2.1} /></span> : null}
          <span className="qq-cat-n">{lead.name}</span>
          <span className="q-ctr qq-n">{mode === "survival" ? t("lp.qOne", { n: currentQIdx + 1 }) : t("quiz.nOf", { n: deal.own + 1, total: ownTotal })}</span>
        </div>
        <h2 className="qq-q">{noBreakScores(shownQ.q)}</h2>
      </section>

      <div className="qq-os">
        {shownQ.o.map((opt, i) => {
          const struck = steal && (phase === "steal" || phase === "stealLocked") && STEAL_SHOWS_STRUCK && i === steal.missOpt;
          let cls = "opt qq-o";
          let well = LETTERS[i];
          if (isReveal) {
            const isCorrect = i === currentQ.a;
            const picked = mode === "survival"
              ? pickersOf(i).length > 0
              : i === ownPick || (steal && i === steal.pick);
            if (isCorrect) { cls += " correct"; well = <Check size={18} strokeWidth={3} aria-hidden="true" />; }
            else if (picked) { cls += " wrong"; well = <X size={16} strokeWidth={3} aria-hidden="true" />; }
            else cls += " neutral-after";
          } else if (struck) {
            cls += " pp-gone"; well = <X size={16} strokeWidth={3} aria-hidden="true" />;
          } else if (locked && lastPick) {
            cls += i === lastPick.optIdx ? " pp-lock" : " neutral-after";
          }
          const tags = isReveal ? pickersOf(i) : struck ? [misser] : [];
          const onClick = isReveal ? advance : phase === "steal" ? () => pickSteal(i) : () => pick(i);
          const inert = struck || locked;
          return (
            <button key={`${currentQIdx}-${i}`} className={cls} onClick={inert ? undefined : onClick}
              disabled={struck || undefined} aria-disabled={(!struck && (locked || isReveal)) || undefined}>
              <span className="qq-w">{well}</span>
              <span className="qq-ot">{noBreakScores(opt)}</span>
              {tags.length > 0 && (tags.length === 1 ? tag(tags[0]) : <span className="pp-tags">{tags.map(tag)}</span>)}
            </button>
          );
        })}
      </div>

      {locked && (
        <p className="pp-locked" role="status"><Check size={16} strokeWidth={2.6} aria-hidden="true" />{t("lp.locked")}</p>
      )}

      {isReveal && (
        <div role="status" className="sr-only">{t(someoneRight ? "quiz.rightWord" : "quiz.wrongWord")}</div>
      )}
      {isReveal && mode === "survival" && newEliminatedIds.length > 0 && (
        <div className="pp-out"><Skull size={16} strokeWidth={2.4} aria-hidden="true" />{t("lp.eliminated", { names: newEliminatedIds.map(id => players.find(p => p.id === id)?.name).filter(Boolean).join(", ") })}</div>
      )}
      {isReveal && shownQ?.hint && (
        <div className="qq-why">
          <div className="qq-why-h"><Lightbulb size={16} strokeWidth={2.2} aria-hidden="true" />{t("quiz.why")}</div>
          <p>{shownQ.hint}</p>
        </div>
      )}
      {isReveal && (
        <div className="q-sticky-foot qq-foot">
          {onReport && (
            <ReportButton
              key={currentQ?._histKey || (currentQ?.id != null ? String(currentQ.id) : currentQ?.q)}
              onReport={onReport}
              idle={<><Flag size={15} strokeWidth={2.2} aria-hidden="true" />{t("quiz.report")}</>}
              idleColor="var(--t3)"
              info={reportInfo}
              style={{
                display:"flex", alignItems:"center", justifyContent:"center", gap:7,
                margin:"4px auto 0", padding:"12px 14px", minHeight:44,
                background:"transparent", border:"none", borderRadius:10,
                fontSize:13.5, fontWeight:500,
              }}
            />
          )}
          <button className="next-btn-primary qq-next" onClick={advance}>
            {t(lastQ ? "quiz.resultsGo" : "quiz.nextGo")}<ArrowRight size={18} strokeWidth={2.6} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── THE END ──────────────────────────────────────────────────────────────────
// Two players (pass-play-steal-1.png, the right phone): the winner card ("Anmol
// wins" / "6 points against 5"), ONE solid button to play again, the quiet "Change topic
// or mode", then the final table, the winner's points in their colour. Three
// to six (pass-play-handover-table-2.png, the right phone): "7 points" and the
// table with coloured bars. A draw (pass-play-draw-4.png): the tied discs
// facing each other with the score between; three or more on top stand in a
// row, "N points each". Survival keeps its own facts (who lasted longest).
export function LocalResults({ result, onHome, onRetry, onChange, onShare }) {
  const t = useT();
  if (!result || !result.players || result.players.length === 0) {
    return (
      <div className="pp pp-page pp-end">
        <header className="pp-top">
          <button className="pp-tile" onClick={onHome} aria-label={t("quiz.backHome")}><ArrowLeft size={20} strokeWidth={2.2} aria-hidden="true" /></button>
          <div className="pp-tt"><h1>{t("lp.noResults")}</h1></div>
        </header>
      </div>
    );
  }
  const { players, scores, rights = scores, steals = {}, stealOn = false, eliminatedIds = [], mode, topic } = result;
  const isSurvival = mode === "survival";
  const st = standing(result);
  const many = players.length > 2;
  const right = (p) => t("lp.right", { count: rights[p.id] || 0 });
  const line = (p) => (stealOn && (steals[p.id] || 0) > 0 ? `${right(p)} · ${t("lp.steals", { count: steals[p.id] })}` : right(p));

  let card;
  const playAgain = <button type="button" className="pp-go" onClick={onRetry}>{t("lp.again")}<ArrowRight size={18} strokeWidth={2.6} aria-hidden="true" /></button>;
  const change = onChange ? <button type="button" className="pp-again" onClick={onChange}>{t("lp.changeSetup")}</button> : null;
  if (st.kind === "draw") {
    const side = (p) => (
      <div className="pp-sd" key={p.id}>
        <PlayerDisc p={p} size={76} />
        <b>{p.name}</b>
        <i>{line(p)}</i>
      </div>
    );
    card = (
      <section className="pp-win is-draw">
        <p className="pp-eye">{t("lp.tie")}</p>
        {st.top.length === 2 ? (
          <div className="pp-vs">
            {side(st.top[0])}
            <strong aria-label={t("lp.pointsEach", { count: st.topScore })}>{st.topScore}<s aria-hidden="true" />{st.topScore}</strong>
            {side(st.top[1])}
          </div>
        ) : (
          <>
            <div className="pp-row-of">{st.top.map(side)}</div>
            <p className="pp-meta">{t("lp.pointsEach", { count: st.topScore })}</p>
          </>
        )}
        {playAgain}
        {change}
      </section>
    );
  } else {
    const w = st.top[0];
    let headline, meta;
    if (st.kind === "wipe") { headline = t("lp.nobody"); meta = t("lp.nobodySub"); }
    else if (isSurvival && (result.endReason === "last-standing" || players.filter(p => !eliminatedIds.includes(p.id)).length === 1)) {
      headline = t("lp.survives", { name: w.name }); meta = t("lp.lastStanding", { count: scores[w.id] || 0 });
    } else if (isSurvival) { headline = t("lp.wins", { name: w.name }); meta = t("lp.ranOut", { count: scores[w.id] || 0 }); }
    else {
      headline = t("lp.wins", { name: w.name });
      const other = st.ranked[1];
      meta = !many && other ? t("lp.pointsVs", { count: scores[w.id] || 0, b: scores[other.id] || 0 }) : t("lp.points", { count: scores[w.id] || 0 });
    }
    card = (
      <section className="pp-win">
        <div className="pp-hero">
          {w ? <PlayerDisc p={w} size={96} glow /> : <span className="pp-none"><Skull size={44} strokeWidth={2} aria-hidden="true" /></span>}
        </div>
        <h2>{headline}</h2>
        <p className="pp-meta">{meta}</p>
        {playAgain}
        {change}
      </section>
    );
  }

  // The table: always with three or more; with two, under a win (a two-player
  // draw shows both sides on the card already).
  const showTable = many || st.kind !== "draw";
  const bars = many || isSurvival;
  // .screen.foot-clear: the end clears the home indicator, as every finish does.
  return (
    <div className="screen foot-clear">
    <div className="pp pp-page pp-end">
      <header className="pp-top">
        <button className="pp-tile" onClick={onHome} aria-label={t("quiz.backHome")}><ArrowLeft size={20} strokeWidth={2.2} aria-hidden="true" /></button>
        <div className="pp-tt">
          <h1>{t("lp.heading")}</h1>
          <p>{modeName(t, mode)} · {topicShown(topic, t).label}</p>
        </div>
      </header>
      {card}
      {showTable && (
        <>
          <h2 className="pp-label">{t("lp.finalTable")}</h2>
          <PlayerTable rows={st.ranked} scores={scores} size="lg" line={many ? right : line} bars={bars}
            winnerId={!bars && st.kind === "win" ? st.top[0]?.id : undefined} />
        </>
      )}
      {onShare && (
        <button type="button" className="pp-share" onClick={onShare}><Share size={15} strokeWidth={2.2} aria-hidden="true" />{t("lp.share")}</button>
      )}
    </div>
    </div>
  );
}
