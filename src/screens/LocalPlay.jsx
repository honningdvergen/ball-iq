// Local pass & play — setup, the game engine and the podium. Extracted from
// App.jsx on 2026-09-06 (review E16, brick 2). The question-selection helpers
// (getQs, applySeenFilter, shuffle, …) stay in App and are imported along the
// seam the lazy screens already use; every screen here takes its state as
// props and reaches into nothing else.
import { useState, useEffect } from "react";
import { Timer, Zap, Flame, Handshake, Home, Share, Trophy } from "lucide-react";
import { TopicPickerSheet, topicMeta, CLUB_PACK_TO_QB, CAT_LABELS, applySeenFilter, getQs, qbHistKey, recordSeenQuestions, shuffle, haptic, playSound } from "../App.jsx";
import { ResultsCloseBtn } from "../components/ResultsCloseBtn.jsx";
import { loadQuestions } from "../questions-loader.js";
import { RETIRED_TAGS } from "../lib/quiz.js";

// Six players, six marks. A number in a coloured ring — not an emoji avatar
// (the review's icon rule) — and the colour follows the player through the
// handoff, reveal, summary and podium so "who is 3?" never needs reading.
export const PLAYER_RGB = ["88,204,2", "255,170,0", "78,168,222", "139,108,240", "236,72,153", "255,122,0"];
export function PlayerMark({ p, size }) {
  if (!p) return null;
  return <span className={`pmark${size === "lg" ? " lg" : ""}`} style={{ "--pm": p.rgb || PLAYER_RGB[(p.id || 0) % PLAYER_RGB.length] }} aria-hidden="true">{p.n || (p.id || 0) + 1}</span>;
}

export function LocalSetup({ onStart, onBack }) {
  const [count, setCount] = useState(2);
  const [names, setNames] = useState(Array.from({ length: 6 }, (_, i) => ""));
  const [lmode, setLmode] = useState("classic");
  const [topic, setTopic] = useState("mixed");
  const [topicOpen, setTopicOpen] = useState(false);

  const setName = (idx, val) => setNames(n => { const copy = n.slice(); copy[idx] = val; return copy; });

  const launch = () => {
    const players = Array.from({ length: count }, (_, i) => ({
      id: i,
      name: (names[i] || "").trim() || `Player ${i + 1}`,
      n: i + 1,
      rgb: PLAYER_RGB[i % PLAYER_RGB.length],
    }));
    // Same call as Classic (Alex, 2026-09-06): no difficulty picker. The arc
    // ramps easy → hard inside the round; survival draws the hard pool.
    onStart({ players, mode: lmode, diff: "hard", topic });
  };

  return (
    <div className="screen">
      <div className="page-hdr">
        <button className="back-btn" onClick={onBack} aria-label="Go back">←</button>
        <div className="page-title">Local Multiplayer</div>
      </div>

      {/* Player count picker */}
      <div className="ds-eyebrow local-section-label">Players</div>
      <div className="local-count-row">
        {[2,3,4,5,6].map(n => (
          <button key={n} className={`local-count-btn${count===n?" on":""}`} onClick={() => setCount(n)}>{n}</button>
        ))}
      </div>

      {/* Names */}
      <div className="ds-eyebrow local-section-label">Names</div>
      <div className="local-names">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="player-input-row">
            <PlayerMark p={{ id: i, n: i + 1 }} />
            <input
              className="player-inp"
              placeholder={`Player ${i + 1}`}
              value={names[i]}
              onChange={e => setName(i, e.target.value)}
              maxLength={16}
            />
          </div>
        ))}
      </div>

      {/* Topic — same card + full-screen picker as the online lobby */}
      <div className="ds-eyebrow local-section-label">Topic</div>
      {(() => {
        const t = topicMeta(topic);
        return (
          <div style={{borderRadius:16,background:"var(--s1)",border:"1px solid var(--border)",padding:"13px 14px",display:"flex",alignItems:"center",gap:12}}>
            <span style={{width:46,height:46,borderRadius:13,background:t.color || "var(--s2)",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:t.abbr ? 12 : 21,fontWeight:t.abbr ? 900 : 400,letterSpacing:t.abbr ? "0.04em" : 0,color:t.fg || "var(--t1)",flexShrink:0,boxShadow:t.color ? `0 2px 8px ${t.color}55` : undefined}}>{t.abbr || t.icon}</span>
            <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",gap:2}}>
              <span style={{fontSize:15,fontWeight:800,color:"var(--t1)",overflow:"hidden",display:"-webkit-box",WebkitBoxOrient:"vertical",WebkitLineClamp:2,lineHeight:1.25}}>{t.label}</span>
              <span style={{fontSize:12,color:"var(--t3)"}}>{t.sub}</span>
            </div>
            <button onClick={() => setTopicOpen(true)} style={{border:"none",borderRadius:999,padding:"9px 16px",fontSize:13,fontWeight:800,color:"var(--grn-ink)",background:"var(--accent)",cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>Change</button>
          </div>
        );
      })()}
      {topicOpen && (
        <TopicPickerSheet value={topic} onClose={() => setTopicOpen(false)} onDone={(id) => { setTopic(id); setTopicOpen(false); }} />
      )}

      {/* Mode */}
      <div className="ds-eyebrow local-section-label">Mode</div>
      <div className="local-mode-row">
        {[
          { id:"classic",  Icon: Timer, name:"Classic",  desc:"10 questions" },
          { id:"sprint",   Icon: Zap,   name:"Sprint",   desc:"5 questions" },
          { id:"survival", Icon: Flame, name:"Survival", desc:"Eliminated on wrong" },
        ].map(m => (
          <button key={m.id} className={`local-mode-chip${lmode===m.id?" on":""}`} onClick={() => setLmode(m.id)}>
            <span className="local-mode-icon"><m.Icon size={22} strokeWidth={2.2} aria-hidden="true" /></span>
            <span className="local-mode-name">{m.name}</span>
            <span className="local-mode-desc">{m.desc}</span>
          </button>
        ))}
      </div>

      <button className="btn-3d" style={{marginTop:18}} onClick={launch}>
        Start with {count} players →
      </button>
    </div>
  );
}

// ─── LOCAL GAME ENGINE ────────────────────────────────────────────────────────
// Flow (classic / sprint — chunk mode):
//   handoff → question → locked (0.8s) → next Q in chunk OR chunk-end reveal (2s)
//     → summary (1.2s) → handoff for next player's chunk
// Flow (survival — round-robin mode):
//   handoff → question → locked (0.8s) → playerSwap → … → question → locked → reveal (2s)
//     → advance to next Q + handoff (eliminations applied during reveal)
//
// Hidden-answer rule: correct/wrong is never revealed after a single pick; the
// reveal phase shows all the picks + correct answer in one go, so a later
// player can't see what's right from an earlier player's feedback.
export function LocalGameScreen({ config, onComplete, onExit }) {
  const { players, mode, diff, topic = "mixed" } = config;
  const TARGETS = { classic: 10, sprint: 5, survival: 30 };
  const target = TARGETS[mode] || 10;
  const CHUNK_SIZE = mode === "survival" ? 1 : 3;

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
            && (!q.tag || !RETIRED_TAGS.has(q.tag)));
          // No "easy" in club games (invested fans); keep full pool only if the
          // no-easy pool is too thin to fill the round.
          const noEasyPool = pool.filter(q => q.diff !== "easy");
          const freshPool = applySeenFilter(noEasyPool.length >= 10 ? noEasyPool : pool, target, qbHistKey);
          raw = shuffle([...freshPool]).slice(0, target).map(q => {
            const idx = shuffle([0, 1, 2, 3].slice(0, q.o.length));
            return { ...q, o: idx.map(i => q.o[i]), a: idx.indexOf(q.a), _histKey: qbHistKey(q) };
          });
        } else if (String(topic).startsWith("cat:")) {
          raw = await getQs({ cat: String(topic).slice(4), diff, n: target, ramp: mode === "classic", noEasy: true });
        } else {
          raw = await getQs({ cat: "All", diff, n: target, ramp: mode === "classic", includeLegends: mode === "survival" });
        }
        if (cancelled) return;
        const filtered = (Array.isArray(raw) ? raw : []).filter(q => q && q.type !== "tf" && q.type !== "typed");
        setQuestions(filtered);
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

  const [currentQIdx, setCurrentQIdx] = useState(0);  // index of question currently on screen
  const [turnIdx, setTurnIdx] = useState(0);           // survival: which surviving player is answering
  const [phase, setPhase] = useState("handoff");
  const [scores, setScores] = useState(() => Object.fromEntries(players.map(p => [p.id, 0])));
  const [eliminatedIds, setEliminatedIds] = useState([]);
  const [newEliminatedIds, setNewEliminatedIds] = useState([]);
  const [chunkPicks, setChunkPicks] = useState([]);   // [{qIdx, playerId, optIdx}] for the active chunk/question
  const [lastPick, setLastPick] = useState(null);      // the just-submitted pick, for the locked-state highlight

  const survivors = players.filter(p => !eliminatedIds.includes(p.id));
  const chunkIdx = Math.floor(currentQIdx / CHUNK_SIZE);
  const chunkStartQ = chunkIdx * CHUNK_SIZE;
  const chunkEndQ = Math.min(chunkStartQ + CHUNK_SIZE - 1, totalQs - 1);
  const chunkQSize = chunkEndQ - chunkStartQ + 1;
  // In classic/sprint, the chunk rotates through players. In survival, the "chunk player" is
  // the current surviving answerer.
  const currentPlayer = mode === "survival"
    ? survivors[turnIdx]
    : players[chunkIdx % players.length];
  const currentQ = questions ? questions[currentQIdx] : null;

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
    if (mode !== "survival") {
      if (currentQIdx >= totalQs) {
        setPhase("done");
        onComplete({ players, scores, eliminatedIds, mode, winnerId: null, endReason: "questions-out" });
      }
      return;
    }
    // Survival
    if (survivors.length <= 1) {
      const winnerId = survivors[0]?.id ?? null;
      const endReason = survivors.length === 1 ? "last-standing" : "total-wipe";
      setPhase("done");
      onComplete({ players, scores, eliminatedIds, mode, winnerId, endReason });
      return;
    }
    if (currentQIdx >= totalQs) {
      // Two or more players still alive but the question pool is exhausted
      setPhase("done");
      onComplete({ players, scores, eliminatedIds, mode, winnerId: null, endReason: "questions-out" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQIdx, totalQs, mode, phase, eliminatedIds]);

  useEffect(() => {
    if (phase !== "done") return;
    try { recordSeenQuestions(questions); } catch {}
  }, [phase, questions]);

  // reveal (2s) → summary (classic/sprint) OR advance (survival).
  // Hoisted above the early-return so the hook count is stable across the
  // initial async-loading render (where !currentQ short-circuits below).
  useEffect(() => {
    if (phase !== "reveal") return;
    const t = setTimeout(() => {
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
      } else {
        setPhase("summary");
      }
    }, 2000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // summary (1.2s) → next chunk handoff. Same hoist as reveal effect above.
  useEffect(() => {
    if (phase !== "summary") return;
    const t = setTimeout(() => {
      const nextStart = chunkEndQ + 1;
      if (nextStart >= totalQs) {
        setCurrentQIdx(nextStart);
        return;
      }
      setCurrentQIdx(nextStart);
      setChunkPicks([]);
      setPhase("handoff");
    }, 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Load failure — mirrors QuizEngine's !q guard. Must render BEFORE the
  // loading/finishing fallback below (explicit state before fallback checks),
  // which would otherwise swallow this as an eternal "Finishing up…". Pairs
  // with the totalQs === 0 guard in the end-of-game effect.
  if (questions !== null && totalQs === 0) {
    return (
      <div className="screen" style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh",flexDirection:"column",gap:14,padding:"0 24px",textAlign:"center"}}>
        <div style={{fontSize:36}}>⚽</div>
        <div style={{fontFamily:"'Inter',sans-serif",fontSize:16,fontWeight:700,color:"var(--text)"}}>Couldn't load questions</div>
        <div style={{fontFamily:"'Inter',sans-serif",fontSize:13,color:"var(--t2)",lineHeight:1.5}}>Check your connection and try again.</div>
        <button className="btn-3d" style={{marginTop:6,maxWidth:240}} onClick={() => { setQuestions(null); setLoadNonce(n => n + 1); }}>Try Again</button>
        <button className="btn-3d ghost" style={{maxWidth:240}} onClick={onExit}>Back to Home</button>
      </div>
    );
  }

  if (phase === "done" || !currentQ) {
    return (
      <div className="screen" style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh",flexDirection:"column",gap:14}}>
        <div style={{fontSize:36}}>⚽</div>
        <div style={{fontSize:14,color:"var(--t2)"}}>{questions === null ? "Loading questions…" : "Finishing up…"}</div>
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
    setChunkPicks(nextPicks);
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
      } else {
        // classic/sprint: same player, next question in chunk OR chunk-end reveal
        if (currentQIdx < chunkEndQ) {
          setCurrentQIdx(currentQIdx + 1);
          setLastPick(null);
          setPhase("question"); // no inter-question screen; same player continues
        } else {
          revealChunk(nextPicks);
        }
      }
    }, 800);
  };

  // A function declaration, not a const arrow: it is called from the
  // lock-in handler declared above it, and a `const` there is a TDZ read.
  function revealSurvivalQuestion(picksSoFar) {
    const thisQPicks = picksSoFar.filter(p => p.qIdx === currentQIdx);
    const freshlyOut = [];
    const nextScores = { ...scores };
    for (const pk of thisQPicks) {
      if (pk.optIdx === currentQ.a) {
        nextScores[pk.playerId] = (nextScores[pk.playerId] || 0) + 1;
      } else {
        freshlyOut.push(pk.playerId);
      }
    }
    setScores(nextScores);
    setNewEliminatedIds(freshlyOut);
    haptic("heavy");
    playSound("streak");
    setPhase("reveal");
  }

  // A function declaration, not a const arrow: it is called from the
  // lock-in handler declared above it, and a `const` there is a TDZ read.
  function revealChunk(picksSoFar) {
    const nextScores = { ...scores };
    for (const pk of picksSoFar) {
      const q = questions[pk.qIdx];
      if (q && pk.optIdx === q.a) {
        nextScores[pk.playerId] = (nextScores[pk.playerId] || 0) + 1;
      }
    }
    setScores(nextScores);
    haptic("heavy");
    playSound("streak");
    setPhase("reveal");
  }

  const prog = `Q ${String(currentQIdx + 1).padStart(2, "0")} / ${String(Math.min(target, totalQs)).padStart(2, "0")}`;

  // ── Render ─────────────────────────────────────────────────────────────────

  if (phase === "handoff") {
    const classicSprint = mode !== "survival";
    const headline = classicSprint
      ? `${currentPlayer?.name}'s ${chunkQSize}-question round`
      : `${currentPlayer?.name}'s turn`;
    const sub = classicSprint
      ? `Pass the phone to ${currentPlayer?.name} — they'll answer the next ${chunkQSize} question${chunkQSize === 1 ? "" : "s"}.`
      : "Pass the phone. Tap Ready when you've got it.";
    return (
      <div className="local-ready">
        <button className="back-btn" onClick={onExit} style={{position:"absolute",top:14,left:14}} aria-label="Go back">←</button>
        <div className="ds-eyebrow local-ready-eyebrow">
          {classicSprint
            ? `Round ${chunkIdx + 1} · Q${chunkStartQ + 1}–${chunkEndQ + 1}`
            : `Next up · ${prog}`}
        </div>
        <div className="local-ready-emoji"><PlayerMark p={currentPlayer} size="lg" /></div>
        <div className="local-ready-name">{headline}</div>
        <div className="local-ready-sub">{sub}</div>
        {mode === "survival" && eliminatedIds.length > 0 && (
          <div className="local-out-list">
            {eliminatedIds.map(id => {
              const p = players.find(pp => pp.id === id);
              return p ? <span key={id} className="local-out-chip"><PlayerMark p={p} /> {p.name}</span> : null;
            })}
          </div>
        )}
        <button className="btn-3d" style={{maxWidth:320}} onClick={() => setPhase("question")}>
          I'm Ready →
        </button>
      </div>
    );
  }

  // Quick neutral pass-the-phone between players inside a single survival question
  if (phase === "playerSwap") {
    return (
      <div className="local-ready">
        <button className="back-btn" onClick={onExit} style={{position:"absolute",top:14,left:14}} aria-label="Go back">←</button>
        <div className="ds-eyebrow local-ready-eyebrow">Next up · {prog}</div>
        <div className="local-ready-emoji"><PlayerMark p={currentPlayer} size="lg" /></div>
        <div className="local-ready-name">{currentPlayer?.name}'s turn</div>
        <div className="local-ready-sub">Pass the phone — same question.</div>
        <button className="btn-3d" style={{maxWidth:320}} onClick={() => setPhase("question")}>
          I'm Ready →
        </button>
      </div>
    );
  }

  if (phase === "question" || phase === "locked") {
    return (
      <div className="quiz-wrap">
        <div className="q-top">
          <button className="back-btn" onClick={onExit} aria-label="Go back">←</button>
          <div className="prog-wrap">
            <div className="prog-bar" style={{ width: `${Math.min(100, ((currentQIdx + 1) / Math.max(1, Math.min(target, totalQs))) * 100)}%` }} />
          </div>
          <span className="q-ctr">{prog}</span>
        </div>
        <div style={{textAlign:"center",padding:"6px 0 8px",fontSize:13,fontWeight:700,color:"var(--accent)"}}>
          🎮 {currentPlayer?.name}'s turn
        </div>
        <div className="q-card">
          <div className="q-tag">{CAT_LABELS[currentQ.cat] || currentQ.cat}</div>
          <div className="q-text">{currentQ.q}</div>
        </div>
        <div className="opts">
          {currentQ.o.map((opt, i) => {
            let cls = "opt";
            if (phase === "locked" && lastPick && i === lastPick.optIdx) cls += " locked";
            else if (phase === "locked") cls += " neutral-after";
            return (
              <button key={i} className={cls} onClick={() => pick(i)} disabled={phase === "locked"}>
                <span className="opt-l">{["A","B","C","D"][i]}</span>{opt}
              </button>
            );
          })}
        </div>
        {phase === "locked" && (
          <div style={{marginTop:14,textAlign:"center",fontSize:15,fontWeight:800,color:"var(--info, var(--gold))"}}>
            ✓ Answer locked in
          </div>
        )}
      </div>
    );
  }

  if (phase === "reveal") {
    const isSurvivalQ = mode === "survival";
    const revealPlayers = isSurvivalQ
      ? survivors
      : [currentPlayer]; // classic/sprint chunk — one player, shown per-question
    return (
      <div className="local-reveal">
        <div className="ds-eyebrow local-reveal-eyebrow">
          {isSurvivalQ ? `Results · ${prog}` : `${currentPlayer?.name}'s round · Q${chunkStartQ + 1}–${chunkEndQ + 1}`}
        </div>
        {isSurvivalQ ? (
          <>
            <div className="local-reveal-q">{currentQ.q}</div>
            <div className="local-reveal-correct">Correct: <strong>{currentQ.o[currentQ.a]}</strong></div>
            <div className="local-reveal-list">
              {revealPlayers.map(p => {
                const pk = chunkPicks.find(x => x.qIdx === currentQIdx && x.playerId === p.id);
                const chose = pk ? currentQ.o[pk.optIdx] : "—";
                const ok = pk && pk.optIdx === currentQ.a;
                const outNow = newEliminatedIds.includes(p.id);
                return (
                  <div key={p.id} className={`local-reveal-row ${ok ? "ok" : "no"}${outNow ? " out" : ""}`}>
                    <PlayerMark p={p} />
                    <span style={{flex:1,fontWeight:700,color:"var(--t1)"}}>{p.name}</span>
                    <span className="local-reveal-chose">{chose}</span>
                    <span className="local-reveal-mark">{ok ? "✓" : "✗"}</span>
                  </div>
                );
              })}
            </div>
            {newEliminatedIds.length > 0 && (
              <div className="local-reveal-eliminate">
                ❌ {newEliminatedIds.map(id => players.find(p => p.id === id)?.name).filter(Boolean).join(", ")} eliminated
              </div>
            )}
          </>
        ) : (
          // Classic/Sprint chunk reveal: one player, list of their questions with pick vs correct
          <>
            <div className="local-reveal-list">
              {chunkPicks.filter(p => p.playerId === currentPlayer.id).map(pk => {
                const q = questions[pk.qIdx];
                const ok = pk.optIdx === q.a;
                return (
                  <div key={pk.qIdx} className={`local-reveal-row ${ok ? "ok" : "no"}`}>
                    <span className="local-reveal-qn">Q{pk.qIdx + 1}</span>
                    <span style={{flex:1,color:"var(--t2)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{q.q}</span>
                    <span className="local-reveal-mark">{ok ? "✓" : "✗"}</span>
                  </div>
                );
              })}
            </div>
            <div className="local-reveal-tally">
              {chunkPicks.filter(p => p.playerId === currentPlayer.id && p.optIdx === questions[p.qIdx]?.a).length} / {chunkQSize} correct
            </div>
          </>
        )}
      </div>
    );
  }

  if (phase === "summary") {
    const rows = [...players].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));
    return (
      <div className="local-summary-overlay">
        <div className="local-summary-card">
          <div className="local-summary-title">After Q{currentQIdx + 1}</div>
          {rows.map(p => (
            <div key={p.id} className="local-summary-row">
              <PlayerMark p={p} />
              <span style={{flex:1,fontWeight:700,color:"var(--t1)"}}>{p.name}</span>
              <span className="local-summary-score">{scores[p.id] || 0}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

// ─── LOCAL RESULTS ────────────────────────────────────────────────────────────
export function LocalResults({ result, onHome, onRetry, onShare }) {
  if (!result || !result.players || result.players.length === 0) {
    return (
      <div className="screen" style={{paddingTop:8, position:"relative"}}>
        <ResultsCloseBtn onClose={onHome} />
        <div className="rc" style={{marginBottom:16}}>
          <div className="rc-title">No results to show</div>
        </div>
        <div className="results-actions">
          <button className="btn-3d ghost" onClick={onHome}>Back to Home</button>
        </div>
      </div>
    );
  }
  const { players, scores, eliminatedIds, mode, winnerId, endReason } = result;
  const isSurvival = mode === "survival";
  const elimList = eliminatedIds || [];

  // Rank players differently per end state:
  // - Survival last-standing: sole survivor first, then eliminated in reverse
  // - Survival total-wipe:    nobody wins; eliminated in reverse elimination order
  // - Survival questions-out: surviving players ranked by score, then eliminated in reverse
  // - Classic/Sprint:         everyone ranked by score descending
  let ranked;
  let headline;
  let subHeadline = null;
  let iconTop = "🏆";
  if (isSurvival) {
    const survivors = players.filter(p => !elimList.includes(p.id));
    const elimRev = [...elimList].reverse().map(id => players.find(p => p.id === id)).filter(Boolean);

    if (endReason === "total-wipe" || (survivors.length === 0 && !winnerId)) {
      iconTop = "💀";
      headline = "Nobody Survives!";
      subHeadline = "All players went out on the same question";
      ranked = elimRev;
    } else if (endReason === "last-standing" || survivors.length === 1) {
      const winner = players.find(p => p.id === winnerId) || survivors[0];
      iconTop = "🏆";
      headline = winner ? `${winner.name} Survives!` : "Nobody Survives!";
      subHeadline = winner ? `${scores[winner.id] || 0} correct · last one standing` : null;
      ranked = winner ? [winner, ...elimRev.filter(p => p.id !== winner.id)] : elimRev;
    } else {
      // questions-out with 2+ survivors — highest score among survivors wins (or draw)
      const byScore = [...survivors].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));
      const topScore = scores[byScore[0]?.id] ?? 0;
      const tiedAtTop = byScore.filter(p => (scores[p.id] || 0) === topScore);
      if (tiedAtTop.length > 1) {
        iconTop = <Handshake size={40} strokeWidth={2} aria-hidden="true" />;
        headline = "It's a tie";
        const names = tiedAtTop.map(p => p.name).join(" · ");
        subHeadline = `${names} — all on ${topScore}`;
      } else {
        const top = byScore[0];
        iconTop = top ? <PlayerMark p={top} size="lg" /> : <Trophy size={40} strokeWidth={2} aria-hidden="true" />;
        headline = top ? `${top.name} wins` : "Game over";
        subHeadline = top ? `${topScore} correct · questions ran out` : null;
      }
      ranked = [...byScore, ...elimRev];
    }
  } else {
    // Classic / Sprint
    ranked = [...players].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));
    const topScore = scores[ranked[0]?.id] ?? 0;
    const tiedAtTop = ranked.filter(p => (scores[p.id] || 0) === topScore);
    const top = ranked[0];
    if (tiedAtTop.length > 1) {
      iconTop = <Handshake size={40} strokeWidth={2} aria-hidden="true" />;
      headline = "It's a tie";
      const names = tiedAtTop.map(p => p.name).join(" · ");
      subHeadline = `${names} — all on ${topScore}`;
    } else {
      iconTop = top ? <PlayerMark p={top} size="lg" /> : <Trophy size={40} strokeWidth={2} aria-hidden="true" />;
      headline = top ? `${top.name} wins` : "Game over";
      subHeadline = top ? `${topScore} correct` : null;
    }
  }

  return (
    <div className="screen" style={{paddingTop:8, position:"relative"}}>
      <ResultsCloseBtn onClose={onHome} />
      <div className="rc" style={{marginBottom:16}}>
        <div className="rc-icon">{iconTop}</div>
        <div className="rc-title">{headline}</div>
        {subHeadline && <div className="rc-sub" style={{marginTop:4}}>{subHeadline}</div>}
      </div>

      {/* Podium top 3 */}
      <div className="podium">
        {ranked.slice(0, 3).map((p, i) => (
          <div key={p.id} className={`podium-row${i === 0 ? " gold" : ""}`}>
            <div className="pod-rank numeric">{i + 1}</div>
            <div className="pod-name"><PlayerMark p={p} /> {p.name}</div>
            <div className="pod-score">{scores[p.id] || 0}</div>
          </div>
        ))}
      </div>

      {/* Full ranked list */}
      {ranked.length > 3 && (
        <div style={{marginTop:14,background:"var(--s1)",border:"1px solid var(--border)",borderRadius:12,overflow:"hidden"}}>
          {ranked.slice(3).map((p, i) => (
            <div key={p.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderTop: i===0?"none":"0.5px solid var(--border)"}}>
              <span style={{width:24,color:"var(--t3)",fontWeight:700,fontVariantNumeric:"tabular-nums"}}>{i + 4}</span>
              <PlayerMark p={p} />
              <span style={{flex:1,color:"var(--t1)",fontWeight:700}}>{p.name}</span>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontVariantNumeric:"tabular-nums",fontWeight:700,color:"var(--accent)"}}>{scores[p.id] || 0}</span>
            </div>
          ))}
        </div>
      )}

      {isSurvival && elimList.length > 0 && (
        <div style={{marginTop:14}}>
          <div style={{fontSize:11,fontWeight:800,letterSpacing:"0.14em",color:"var(--t3)",textTransform:"uppercase",marginBottom:8}}>Elimination order</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {elimList.map((id, i) => {
              const p = players.find(pp => pp.id === id);
              if (!p) return null;
              return (
                <span key={id} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"6px 10px",borderRadius:20,background:"var(--s2)",border:"1px solid var(--border)",fontSize:12,color:"var(--t2)"}}>
                  <span style={{opacity:0.5,fontFamily:"'JetBrains Mono',monospace"}}>#{i+1}</span>
                  <PlayerMark p={p} /> {p.name}
                </span>
              );
            })}
          </div>
        </div>
      )}

      <div className="results-actions" style={{marginTop:16}}>
        <button className="btn-3d" onClick={onRetry}>Play again</button>
        {onShare && <button className="btn-3d ghost" onClick={onShare}>Share score</button>}
        <button className="results-exit" onClick={onHome}>Back to Home</button>
      </div>
    </div>
  );
}


