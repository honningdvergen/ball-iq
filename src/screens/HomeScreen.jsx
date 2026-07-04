import React from "react";
import { Timer, Flame, Zap, ScrollText, Brain, Sparkles, Trophy, Shield } from "lucide-react";
import { useAuth } from "../useAuth.jsx";
import { APP_NAME } from "../lib/scoring.js";
import { getLevelInfo } from "../lib/scoring.js";
import { readWordleTodayStatus, getWordleDateKey } from "../lib/wordleStatus.js";
import { getWordleAnswer, gradeWordleGuess, computeFootleStreak } from "../lib/wordle.js";
import { computeCard, CARD_TIERS } from "../lib/ballIqCard.js";
import { safeSetItem } from "../safeStorage.js";
import { supabase } from "../supabase.js";
import { FootleHero } from "../components/FootleHero.jsx";
import { MultiplayerCard } from "../components/MultiplayerCard.jsx";

const DAY_MS = 24 * 60 * 60 * 1000;

// ── Inline, playable Footle board (DESKTOP web only) ─────────────────────────
// Renders the REAL daily puzzle (getWordleAnswer) and reads/writes the SAME
// localStorage store the full Footle screen uses (biq_wordle_<ymd>), so it
// truly reflects + drives the day: the streak walker, FootleHero's evening
// state and the Daily-tab activity ring all read that key. Kept as its own
// component so its hooks never touch HomeScreenImpl's hook order, and it stays
// mounted-but-hidden below 1024 / on non-Home tabs (the offsetParent guard on
// the physical-keyboard listener makes it inert whenever it isn't visible).
//
// Deliberately NOT wired to: the emotional-peak review ask + biq:daily-completed
// notification event + confetti that FootballWordle fires — those are
// native/mobile concerns and firing them from a desktop-web inline board would
// surface out-of-context prompts. The competitively-important bits (persisted
// state + streak + cross-device sync) ARE wired.
function DesktopFootleBoard({ onOpen, shareCard, userId }) {
  // Snapshot today's puzzle at mount (dateKey + answer captured once). Home
  // unmounts whenever you leave it (tab bar stays but opening the full Footle
  // screen changes `screen`, and desktop sessions reload/navigate), so the board
  // always re-reads a fresh day on return. Capturing here (vs recomputing each
  // render) avoids a mid-session local-midnight drift where a rolled-over dateKey
  // could grade/persist stale guesses under a new day's key.
  const [dateKey] = React.useState(getWordleDateKey);
  const [answer] = React.useState(getWordleAnswer);
  const L = answer.length;
  const MAX = 6;
  const boardRef = React.useRef(null);

  const [state, setState] = React.useState(() => {
    try {
      const raw = localStorage.getItem(`biq_wordle_${dateKey}`);
      if (raw) { const p = JSON.parse(raw); if (p && Array.isArray(p.guesses)) return p; }
    } catch {}
    return { guesses: [], status: "playing" };
  });
  const [current, setCurrent] = React.useState("");
  const status = state.status;
  const isDone = status === "won" || status === "lost";

  // Persist to biq_wordle_<ymd>, matching FootballWordle's schema. Guard on
  // guesses.length so merely MOUNTING the board never creates an empty key:
  // computePast7DaysActivity treats key-existence as "played that day", so a
  // premature write would false-mark today active. Cross-device sync mirrors
  // FootballWordle's persist effect (fire-and-forget, userId-gated).
  React.useEffect(() => {
    if (!state.guesses.length) return;
    try { safeSetItem(`biq_wordle_${dateKey}`, JSON.stringify(state)); } catch {}
    if (userId) {
      supabase.rpc("upsert_wordle_state", { p_ymd: dateKey, p_state: state })
        .then(({ error }) => { if (error) console.warn("[wordle sync]", error.message); })
        .catch((e) => console.warn("[wordle sync]", e?.message || e));
    }
  }, [state, dateKey, userId]);

  const type = (ch) => { if (status !== "playing") return; setCurrent((c) => (c.length < L ? c + ch : c)); };
  const del = () => setCurrent((c) => c.slice(0, -1));
  const submit = () => {
    if (status !== "playing" || current.length !== L) return;
    const guesses = [...state.guesses, current];
    let st = "playing";
    if (current === answer) st = "won";
    else if (guesses.length >= MAX) st = "lost";
    setState({ guesses, status: st });
    setCurrent("");
  };

  // Physical keyboard. Rebinds each render (no deps) so the closure sees fresh
  // state/current — same pattern as the marketing MiniFootle. The offsetParent
  // guard makes it a no-op whenever the board is display:none (mobile widths,
  // and any non-Home tab, which the app hides via display:none) — so it never
  // steals keystrokes app-wide while the always-mounted Home tab sits hidden.
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // Inert unless the board is actually visible (display:none on mobile
      // widths + on any non-Home tab → offsetParent null).
      if (!boardRef.current || boardRef.current.offsetParent === null) return;
      if (status !== "playing") return;
      // Don't hijack keys when a real control elsewhere on Home is focused —
      // otherwise a keyboard user tabbing to a play-card and hitting Enter would
      // have it swallowed here. Only capture when focus is loose (on <body>) or
      // already within the board.
      const active = document.activeElement;
      if (active && active !== document.body && !boardRef.current.contains(active)) return;
      if (e.key === "Enter") { e.preventDefault(); submit(); }
      else if (e.key === "Backspace") { e.preventDefault(); del(); }
      else if (/^[a-zA-Z]$/.test(e.key)) type(e.key.toUpperCase());
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // On-screen keyboard letter states (green > yellow > grey), duplicate-safe via
  // the app's own grader.
  const keyState = {};
  const rank = { grey: 1, yellow: 2, green: 3 };
  for (const g of state.guesses) {
    const gr = gradeWordleGuess(g, answer);
    for (let i = 0; i < g.length; i++) {
      const ch = g[i], st = gr[i];
      if (!keyState[ch] || rank[st] > rank[keyState[ch]]) keyState[ch] = st;
    }
  }

  const rows = [];
  for (let r = 0; r < MAX; r++) {
    if (r < state.guesses.length) {
      rows.push({ letters: state.guesses[r].split(""), marks: gradeWordleGuess(state.guesses[r], answer), isCur: false });
    } else if (r === state.guesses.length && status === "playing") {
      const a = [];
      for (let i = 0; i < L; i++) a.push(current[i] || "");
      rows.push({ letters: a, marks: null, isCur: true });
    } else {
      rows.push({ letters: new Array(L).fill(""), marks: null, isCur: false });
    }
  }

  const cap = answer.charAt(0) + answer.slice(1).toLowerCase();
  const onShare = async () => {
    if (!isDone || !shareCard) return;
    const grades = state.guesses.map((g) => gradeWordleGuess(g, answer));
    const isWon = status === "won";
    const grid = grades.map((row) => row.map((c) => c === "green" ? "🟩" : c === "yellow" ? "🟨" : "⬛").join("")).join("\n");
    const streak = isWon ? computeFootleStreak(new Date()) : 0;
    const base = isWon ? `Solved in ${state.guesses.length} ${state.guesses.length === 1 ? "guess" : "guesses"}` : "Didn't solve today";
    const scoreLine = isWon && streak > 0 ? `${base} · 🔥 ${streak}-day streak` : base;
    const dateLabel = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
    const textFallback = `⚽ ${APP_NAME} — Footle\n${scoreLine}\n\n${grid}\n\nballiq.app`;
    await shareCard("wordle", { score: state.guesses.length, total: 6, grades, dateLabel, failed: !isWon }, { onToast: () => {}, textFallback });
  };

  return (
    <div className="home-footle-inline" ref={boardRef}>
      <div className="hfi-head">
        <div className="hfi-head-copy">
          <div className="hfi-eyebrow">Daily · Footle</div>
          <div className="hfi-title">Footle</div>
          <div className="hfi-sub">Guess today&apos;s footballer · {L} letters · 6 guesses</div>
        </div>
        <span className="hfi-badge" aria-hidden="true">⚽</span>
      </div>
      <div className="hfi-grid">
        {rows.map((row, r) => (
          <div className="hfi-row" key={r}>
            {row.letters.map((ch, i) => {
              const mark = row.marks ? row.marks[i] : null;
              const cls = mark === "green" ? "hfi-tile hfi-green"
                : mark === "yellow" ? "hfi-tile hfi-amber"
                : mark === "grey" ? "hfi-tile hfi-dark"
                : `hfi-tile${ch ? " hfi-filled" : ""}${row.isCur && i === current.length ? " hfi-active" : ""}`;
              return <div key={i} className={cls}>{ch}</div>;
            })}
          </div>
        ))}
      </div>
      {isDone ? (
        <div className="hfi-result">
          <div className="hfi-result-msg">
            {status === "won"
              ? <>Solved in <strong>{state.guesses.length}</strong> — it was {cap}.</>
              : <>Out of guesses — it was {cap}.</>}
          </div>
          <div className="hfi-result-actions">
            <button className="hfi-btn hfi-btn-primary" onClick={onShare} aria-label="Share today's Footle">↗︎ Share</button>
            <button className="hfi-btn hfi-btn-ghost" onClick={onOpen} aria-label="Open the full Footle screen">Review</button>
          </div>
        </div>
      ) : (
        <div className="hfi-kb">
          <div className="hfi-kb-row">
            {"QWERTYUIOP".split("").map((k) => <button key={k} type="button" className={`hfi-key${keyState[k] ? " hfi-key-" + keyState[k] : ""}`} onClick={() => type(k)}>{k}</button>)}
          </div>
          <div className="hfi-kb-row">
            {"ASDFGHJKL".split("").map((k) => <button key={k} type="button" className={`hfi-key${keyState[k] ? " hfi-key-" + keyState[k] : ""}`} onClick={() => type(k)}>{k}</button>)}
          </div>
          <div className="hfi-kb-row">
            <button type="button" className="hfi-key hfi-key-wide" onClick={submit}>Enter</button>
            {"ZXCVBNM".split("").map((k) => <button key={k} type="button" className={`hfi-key${keyState[k] ? " hfi-key-" + keyState[k] : ""}`} onClick={() => type(k)}>{k}</button>)}
            <button type="button" className="hfi-key hfi-key-wide" onClick={del} aria-label="Delete">⌫</button>
          </div>
        </div>
      )}
    </div>
  );
}

// HomeScreen — Sprint #17 Stage 3 extract. Owns the Home tab layout:
// greeting strip, Daily zone (FootleHero + Today's 7 secondary), MP card,
// More-modes grid, WC2026 event tile, Coming-soon shelf.
//
// desktop-web-refresh Phase 2b: at >=1024 the content reflows into a two-column
// grid (main + glanceable right rail) with a full-width row below, all via CSS.
// The mobile markup is preserved byte-for-byte — the new column wrappers are
// `display:contents` below 1024 (they generate no box, so margins/order are
// untouched) and the rail / inline-Footle / app-banner are `display:none` there
// (the "render always, CSS-reveal at desktop" pattern, like .home-stat-chip-
// desktop-only). The PWA-standalone killswitch resets all of it.
//
// Reads user/authProfile/isGuest via useAuth (same pattern as Profile
// and Daily). All other state + handlers come in as props — HomeScreen
// is a presentational orchestrator, not a state owner.
function HomeScreenImpl({
  profile,
  loginStreak,
  streakPulsing,
  bestLoginStreak,
  stats,
  xp,
  dailyHistory,
  dailyDone,
  dailyScore,
  setTab,
  setNameEditNonce,
  setScreen,
  showToast,
  viewPuzzleStatus,
  viewDailyScore,
  startMode,
  setShowDiffPicker,
  shareCard,
  challenge,
  onPlayChallenge,
  onDismissChallenge,
  setOnlineAutoCreate,
}) {
  const { user, profile: authProfile, isGuest, openAuthPrompt } = useAuth();

  // Cold-start race: on native the session restores from Preferences AFTER first
  // paint, so there's a brief guest window before `user` is set during which the
  // "set your name" CTA would flash for an already-signed-in user. Defer the CTA
  // past that startup transient — homeAuthLoading covers the profile-fetch window,
  // this covers the session-restore window.
  const [ctaSettled, setCtaSettled] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setCtaSettled(true), 800);
    return () => clearTimeout(t);
  }, []);

  // Display name for the desktop rail cards (mirrors the greeting's name logic;
  // plain consts, not hooks, so hook order is untouched). Placeholder usernames
  // (Player / player_xxxxx) fall back to a neutral label rather than being shown.
  const isPlaceholderName = (n) => !n || n === "Player" || /^player_/i.test(n);
  const railUsername = authProfile?.username && !isPlaceholderName(authProfile.username) ? authProfile.username : null;
  const railName = railUsername || (profile?.name && !isPlaceholderName(profile.name) ? profile.name : "Ball IQ Player");

  return (
    <div className="screen tab-content home-screen">
      {/* ─────────── LEFT / MAIN COLUMN ─────────── */}
      <div className="home-col-main">
      {/* Greeting row — Sprint #11 Stage 3: streak chip relocated here
          (top-right of greeting), sub-text replaced with context-aware
          nudges keyed on what's still actionable today. */}
      {(() => {
        const homeAuthLoading = !!user && !authProfile;
        const homeLocalName = (profile?.name || "").trim();
        // Sprint #100: treat the server default usernames as "no real name"
        // so social sign-ups that landed on player_xxxxx (Apple Hide-My-Email
        // repeat / missing-name) get the set-your-name nudge instead of being
        // greeted as "player_13418". Real usernames suppress the CTA.
        const isDefaultName = (n) => !n || n === "Player" || /^player_/i.test(n);
        const homeRealUsername = authProfile?.username && !isDefaultName(authProfile.username) ? authProfile.username : null;
        const homeHasUsername = !!homeRealUsername;
        const homeShowCTA = ctaSettled && !homeAuthLoading && !homeHasUsername && (!homeLocalName || isDefaultName(homeLocalName));
        // Brand-new guest installs (no signed-in user, no local name)
        // used to flash "Good morning, Guest" before auth resolved. Drop
        // the placeholder and the trailing comma when no real name is
        // available — leaves "Good morning" alone until the user sets
        // a name (CTA below offers the affordance).
        const homeDisplayName = homeRealUsername || (profile?.name && !isDefaultName(profile.name) ? profile.name : null);
        const homeGreetingBase = (() => {
          const now = new Date();
          const h = now.getHours();
          if (h < 12) return "Good morning";
          if (h < 18) return "Good afternoon";
          // Easter egg: ~1 in 5 evenings, swap in the "Good ebening" football-
          // commentary pun. Seeded on the calendar date so it stays put through
          // the whole evening (no flicker between renders) but varies day to day.
          const daySeed = now.getFullYear() * 372 + (now.getMonth() + 1) * 31 + now.getDate();
          return (daySeed % 5 === 0) ? "Good ebening" : "Good evening";
        })();
        const greeting = homeGreetingBase + ((homeAuthLoading || homeDisplayName) ? "," : "");
        const ws = readWordleTodayStatus();
        const footleDone = ws.kind === "won" || ws.kind === "lost";
        // Sprint #12: when both daily rituals are complete, omit the
        // subtext entirely — the Daily zone's "2/2 done" status carries
        // the celebration, the greeting line stays calm.
        const subtext = footleDone && dailyDone ? null
          : footleDone                          ? "Daily 7 is still open."
          : dailyDone                           ? "Today's Footle is still open."
          :                                       "Daily puzzle is up.";
        return (
          <div className="hg-block" style={{padding:"6px 0 8px"}}>
            <div style={{display:"flex", alignItems:"center", gap:10}}>
              <div style={{display:"flex", alignItems:"baseline", gap:8, flex:1, minWidth:0, flexWrap:"wrap"}}>
                <div className="hg-greet" style={{fontSize:20, color:"var(--t2)", fontWeight:600, letterSpacing:"-0.3px"}}>{greeting}</div>
                {(homeAuthLoading && !homeDisplayName) ? (
                  // Sprint #23 U2: min-width lock keeps the name-box width stable
                  // across the Loading…→username swap. Only show the skeleton when
                  // we have NO cached name to show — otherwise the local name
                  // appears instantly instead of waiting for the server profile.
                  <div style={{fontSize:20, color:"var(--t1)", fontWeight:800, opacity:0.4, animation:"profileSkeletonPulse 1.4s ease-in-out infinite", minWidth:70}}>Loading…</div>
                ) : homeDisplayName ? (
                  <div className="hg-name" style={{fontSize:20, color:"var(--t1)", fontWeight:800, minWidth:70, letterSpacing:"-0.3px"}}>
                    {homeDisplayName}
                  </div>
                ) : null}
              </div>
              {loginStreak > 0 && (
                <span className={`hst-streak${streakPulsing ? ' is-pulsing' : ''}`} aria-label={`${loginStreak}-day streak`}>
                  🔥 {loginStreak}
                </span>
              )}
              {/* 1.1: settings gear inline with the greeting (the shared header
                  row is hidden on Home) — one tidy top row, no dead space. */}
              <button onClick={() => setScreen("settings")} className="icon-btn" aria-label="Settings" style={{flexShrink:0}}>⚙️</button>
            </div>
            {subtext && (
              <div style={{fontSize:12.5, color:"var(--t3)", marginTop:2, fontWeight:500}}>
                {subtext}
              </div>
            )}
            {homeShowCTA && (
              <button
                onClick={() => { setTab("profile"); setNameEditNonce(n => n + 1); }}
                style={{background:"none",border:"none",padding:"4px 0 0",fontSize:12,fontWeight:600,color:"var(--accent)",cursor:"pointer",fontFamily:"inherit"}}
                aria-label="Set your name"
              >
                ✏️ Tap to set your name
              </button>
            )}
          </div>
        );
      })()}

      {/* 1.1 async challenge: a friend's "beat my Daily 7" link landed here.
          Shown only when the challenge is for today and the user hasn't played
          yet (gated by the parent). Play routes into today's Daily 7; the
          head-to-head result toasts on completion. */}
      {challenge && (
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",marginBottom:10,background:"linear-gradient(135deg, rgba(34,197,94,0.16), rgba(34,197,94,0.05))",border:"1px solid rgba(34,197,94,0.30)",borderRadius:14}}>
          <span style={{fontSize:22}} aria-hidden="true">🏆</span>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:13.5,fontWeight:800,color:"var(--t1)",lineHeight:1.25}}>
              {challenge.name ? `${challenge.name} challenged you` : "You've been challenged"}
            </div>
            <div style={{fontSize:12,color:"var(--t2)",marginTop:1}}>
              Beat {challenge.score}/7 on today's Daily 7
            </div>
          </div>
          <button
            onClick={onPlayChallenge}
            style={{flexShrink:0,minHeight:36,padding:"8px 14px",background:"var(--accent)",color:"#0a1a00",border:"none",borderRadius:10,fontFamily:"inherit",fontSize:13.5,fontWeight:800,cursor:"pointer",WebkitTextFillColor:"#0a1a00"}}
          >
            Play
          </button>
          <button
            onClick={onDismissChallenge}
            aria-label="Dismiss challenge"
            style={{flexShrink:0,background:"none",border:"none",color:"var(--t3)",fontSize:18,cursor:"pointer",padding:"4px 2px",lineHeight:1}}
          >
            ×
          </button>
        </div>
      )}

      {/* ── DAILY ZONE (Sprint #12) ──
          Wraps Footle hero + Today's 7 in a tinted container with a
          shared "DAILY" eyebrow + X/2 progress indicator. The cards
          inside keep their distinct identities; the zone just frames
          them as a coupled unit so they don't read as two unrelated
          rails.

          desktop-web-refresh: on mobile the container renders <FootleHero/>
          (byte-identical). At >=1024 the FootleHero wrapper hides and the
          inline, playable <DesktopFootleBoard/> takes its place. Both read the
          SAME biq_wordle_<ymd> store so they never diverge. */}
      {(() => {
        const ws = readWordleTodayStatus();
        const footleDone = ws.kind === "won" || ws.kind === "lost";
        const doneCount = (footleDone ? 1 : 0) + (dailyDone ? 1 : 0);
        const allDone = doneCount === 2;
        return (
          <div className="daily-zone" role="group" aria-label="Daily">
            <div className="daily-zone-head">
              <span className="daily-zone-eyebrow">Daily</span>
              <span className={`daily-zone-status${allDone ? " is-done" : ""}`}>
                {allDone ? "2/2 done" : `${doneCount}/2 today`}
              </span>
            </div>
            <div className="home-footle-mobile">
              <FootleHero
                onPlay={() => setScreen("wordle")}
                onReview={(wsArg) => viewPuzzleStatus(wsArg)}
                shareCard={shareCard}
              />
            </div>
            <DesktopFootleBoard
              onOpen={() => setScreen("wordle")}
              shareCard={shareCard}
              userId={user?.id}
            />
            <button
              className={`todays-seven-secondary${dailyDone ? ' is-done' : ''}`}
              onClick={() => dailyDone ? viewDailyScore(new Date(), dailyScore) : startMode("daily")}
              aria-label={dailyDone ? `Daily 7 complete: ${dailyScore} out of 7` : "Play Daily 7"}
            >
              <span className="t7s-icon" aria-hidden="true">📋</span>
              <span className="t7s-body">
                <span className="t7s-title">Daily 7</span>
                <span className="t7s-sub">
                  {dailyDone
                    ? <>✅ Done · <strong>{dailyScore}/7</strong></>
                    : <>7 questions · ~3 min</>}
                </span>
              </span>
              <span className="t7s-cta">{dailyDone ? "View" : "Play"}</span>
            </button>
          </div>
        );
      })()}

      {/* ── MULTIPLAYER FEATURED CARD (Sprint #12) ──
          Online lands on the Online tab (the multiplayer home — auth is
          gated there on create/join, not on viewing); Local enters
          pass-and-play immediately. Invite auto-creates a room. */}
      <MultiplayerCard
        onOnline={() => setTab("online")}
        onInvite={() => {
          // 1.1: "Invite" now creates a room and drops you in the lobby (where
          // the real /join/CODE link lives) instead of sharing a dead link.
          if (!user || isGuest) {
            openAuthPrompt("online");
            return;
          }
          setOnlineAutoCreate?.(true);
          setScreen("online-stage1");
        }}
        onLocal={() => startMode("local")}
        showToast={showToast}
      />
      </div>

      {/* ─────────── RIGHT RAIL (desktop-only, render-always/CSS-reveal) ─────────── */}
      <div className="home-rail" aria-label="Your stats">
        {/* Ball IQ rating card */}
        {(() => {
          const acc = (stats?.totalAnswered > 0 && (stats?.totalCorrect || 0) <= stats.totalAnswered)
            ? (stats.totalCorrect || 0) / stats.totalAnswered : 0.4;
          const card = computeCard(stats?.catStats || {}, acc);
          const tm = CARD_TIERS[card.tier] || CARD_TIERS.prospect;
          const lvl = getLevelInfo(xp || 0);
          return (
            <div className="hr-card hr-rating" style={{ background: tm.bg, borderColor: `${tm.accent}55` }}>
              <div className="hr-rating-glow" style={{ background: `radial-gradient(circle, ${tm.accent}22 0%, transparent 70%)` }} aria-hidden="true" />
              <div className="hr-rating-id">
                <div className="hr-avatar" style={{ borderColor: tm.accent }}>
                  {authProfile?.avatar_url
                    ? <img src={authProfile.avatar_url} crossOrigin="anonymous" alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                    : (profile?.avatar || "⚽")}
                </div>
                <div className="hr-rating-idcol">
                  <div className="hr-rating-name" style={{ color: tm.text }}>{railName}</div>
                  <div className="hr-pills">
                    <span className="hr-pill hr-pill-tier" style={{ color: tm.accent, borderColor: `${tm.accent}55` }}>{tm.label}</span>
                    <span className="hr-pill hr-pill-xp">{lvl.level.icon} {(xp || 0).toLocaleString()} XP</span>
                  </div>
                </div>
              </div>
              <div className="hr-rating-num" style={{ color: tm.accent }}>{card.overall}</div>
              <div className="hr-rating-cap" style={{ color: tm.text }}>OVERALL · {tm.label}</div>
            </div>
          );
        })()}

        {/* Streak + 14-day form */}
        {(() => {
          const now = new Date();
          const todayMid = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
          const cells = [];
          for (let i = 13; i >= 0; i--) {
            const d = new Date(todayMid - i * DAY_MS);
            const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
            const score = dailyHistory?.[ymd];
            cells.push({ done: typeof score === "number", isToday: i === 0 });
          }
          const best = Math.max(bestLoginStreak || 0, loginStreak || 0);
          return (
            <div className="hr-card hr-streak">
              <div className="hr-streak-head">
                <div className="hr-streak-num"><span className="hr-flame" aria-hidden="true">🔥</span>{loginStreak || 0}</div>
                <div className="hr-streak-meta">
                  <div className="hr-streak-label">Day streak</div>
                  <div className="hr-streak-best">Best · {best}</div>
                </div>
              </div>
              <div className="hr-form" aria-label="Daily play over the last 14 days">
                {cells.map((c, i) => (
                  <span key={i} className={`hr-form-cell${c.done ? " is-done" : ""}${c.isToday ? " is-today" : ""}`} />
                ))}
              </div>
              <div className="hr-form-cap">Last 14 days</div>
            </div>
          );
        })()}

        {/* Friends leaderboard — COLD-START affordance.
            TODO lift friends leaderboard: the live weekly board lives inside
            ProfileScreen's FriendsSection (a Supabase `friendships` fetch + a
            `leaderboard` useMemo). Surfacing the real thing on Home cleanly means
            lifting that fetch to a shared hook — out of scope for this pass, so
            render the invite/see-all cold-start rather than duplicating the
            query inline. */}
        <div className="hr-card hr-friends">
          <div className="hr-friends-head">
            <span className="hr-friends-title">Friends</span>
            <button type="button" className="hr-friends-see" onClick={() => setTab("profile")}>See all →</button>
          </div>
          <div className="hr-friends-empty">
            <span className="hr-friends-emoji" aria-hidden="true">🏆</span>
            <div className="hr-friends-copy">
              <div className="hr-friends-copy-t">Add friends to see a weekly leaderboard</div>
              <div className="hr-friends-copy-s">Race your mates for the top score.</div>
            </div>
          </div>
          <button type="button" className="hr-friends-invite" onClick={() => setTab("profile")}>Add friends</button>
        </div>
      </div>

      {/* ─────────── BELOW GRID (full-width) ─────────── */}
      <div className="home-col-below">
      {/* ── MORE MODES ── */}
      {/* Lucide icons replace emoji glyphs (2026-05-03). Stroke 2.25
          for a slightly bolder line that holds at the 20px size in
          the 36px rounded-square chip. Color = var(--accent) for a
          consistent green-on-dark identity across the grid.

          Sprint #12: the standalone WC2026 rail card is gone — World
          Cup now appears as the 7th tile in this grid with full-row
          span + EVENT badge + gold "Nd" countdown chip. */}
      <div className="home-section-title">More modes</div>
      <div className="play-grid">
        {[
          { key:"clubquiz",   Icon: Shield,     name: "Club Quiz",   desc: "Pick your club",   onTap: () => startMode("clubquiz") },
          { key:"leaguequiz", Icon: Trophy,     name: "League Quiz", desc: "Pick a league",    onTap: () => startMode("leaguequiz") },
          { key:"classic",   Icon: Timer,      name:"Classic",       desc:"10 Qs, 20s each",   onTap:() => setShowDiffPicker(true) },
          { key:"survival",  Icon: Flame,      name:"Survival",      desc:"Die on wrong" },
          { key:"hotstreak", Icon: Zap,        name:"Hot Streak",    desc:"60-second sprint" },
          { key:"legends",   Icon: ScrollText, name:"Legends",       desc:"Pre-2000 greats" },
          { key:"balliq",    Icon: Brain,      name:`${APP_NAME} Test`,  desc:"What's your IQ?" },
          { key:"chaos",     Icon: Sparkles,   name:"Chaos",         desc:"Quotes & chaos" },
        ].map(({ key, Icon, name, desc, onTap }) => (
          <button
            key={key}
            className="play-card"
            onClick={onTap || (() => startMode(key))}
          >
            <span className="play-card-icon">
              <Icon size={20} strokeWidth={2.25} color="var(--accent)" aria-hidden="true" />
            </span>
            <span className="play-card-body">
              <span className="play-card-name">{name}</span>
              <span className="play-card-desc">{desc}</span>
            </span>
          </button>
        ))}
        {/* World Cup 2026 — 7th tile, full-row event variant */}
        {(() => {
          // Pin both sides to the UTC frame so Math.floor(t/86400000)
          // gives consistent days-to-go in any timezone. Previous
          // mixed-frame version (local-midnight kickoff vs UTC-frame
          // floor) produced 33-vs-34 off-by-one in TZs east of UTC.
          const kickoff = new Date(Date.UTC(2026, 5, 11));
          const dayNow = Math.floor(Date.now() / DAY_MS);
          const dayKick = Math.floor(kickoff.getTime() / DAY_MS);
          const daysTo = dayKick - dayNow;
          const started = daysTo <= 0;
          return (
            <button
              className="play-card wc-tile"
              onClick={() => startMode("wc2026")}
              aria-label={started ? "World Cup 2026 — tap to play the tournament quiz" : `World Cup 2026 — ${daysTo} day${daysTo === 1 ? "" : "s"} to go`}
            >
              <span className="play-card-icon wc-tile-icon">
                <Trophy size={20} strokeWidth={2.25} color="#FFC800" aria-hidden="true" />
              </span>
              <span className="play-card-body wc-tile-body">
                <span className="play-card-name">World Cup 2026</span>
                <span className="play-card-desc">Tournament quiz</span>
              </span>
              <span className="wc-tile-meta" aria-hidden="true">
                <span className="wc-tile-badge">★ Event</span>
                {!started && <span className="wc-tile-chip">{daysTo}d</span>}
                {started && <span className="wc-tile-chip wc-tile-chip-live">LIVE</span>}
              </span>
            </button>
          );
        })()}
      </div>
      {/* Coming-Soon shelf — teaser cards for modes that aren't ready
          yet. True or False is intentionally NOT surfaced here; its
          runtime logic stays in place but the entry point remains
          hidden. Section auto-hides if the array is empty. */}
      {(() => {
        const COMING_SOON = [
          { key:"tikitakatoe", icon:"🎯",  name:"Tiki Taka Toe",    desc:"Tic-tac-toe with football connections" },
          { key:"guessplayer", icon:"🔍",  name:"Guess the Player", desc:"Identify the mystery player from clues" },
        ];
        if (COMING_SOON.length === 0) return null;
        return (
          <div className="coming-soon-list">
            Coming soon: {COMING_SOON.map(m => m.name).join(' · ')}
          </div>
        );
      })()}

      {/* Take Ball IQ everywhere — app-download banner (desktop-web only).
          Hidden below 1024 and in installed PWAs/native (you're already in the
          app there). App Store badge uses the known-good Apple glyph
          (viewBox 0 0 384 512). Android intentionally a non-link ("coming
          soon") — a dead store link is worse than none. */}
      <div className="home-app-banner">
        <div className="hab-copy">
          <div className="hab-title">Take {APP_NAME} everywhere</div>
          <div className="hab-sub">Your streak, rating and friends follow your account — on your phone or in any browser.</div>
        </div>
        <div className="hab-actions">
          <a className="hab-store" href="https://apps.apple.com/app/id6775975961" target="_blank" rel="noopener" aria-label="Download on the App Store">
            <svg viewBox="0 0 384 512" width="20" height="20" aria-hidden="true">
              <path fill="currentColor" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
            </svg>
            <span className="hab-store-txt">
              <span className="hab-store-ey">Download on the</span>
              <span className="hab-store-nm">App Store</span>
            </span>
          </a>
          <span className="hab-soon">Android coming soon</span>
        </div>
      </div>
      </div>
    </div>
  );
}

// Memoized like its sibling tab screens (DailyTabScreen/ProfileScreen): all
// three Home tabs stay mounted and AppInner re-renders on every unrelated state
// change, so without this HomeScreen's whole tree re-rendered each time. Props
// are stable (useCallback handlers + setters; challenge is null or a stable ref;
// stats/xp/dailyHistory/bestLoginStreak are AppInner state refs, not inline
// literals — so memo still holds).
export const HomeScreen = React.memo(HomeScreenImpl);
