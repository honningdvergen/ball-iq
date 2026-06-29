import React from "react";
import { Timer, Flame, Zap, ScrollText, Brain, Sparkles, Trophy, Shield } from "lucide-react";
import { useAuth } from "../useAuth.jsx";
import { APP_NAME } from "../lib/scoring.js";
import { readWordleTodayStatus } from "../lib/wordleStatus.js";
import { FootleHero } from "../components/FootleHero.jsx";
import { MultiplayerCard } from "../components/MultiplayerCard.jsx";

const DAY_MS = 24 * 60 * 60 * 1000;

// HomeScreen — Sprint #17 Stage 3 extract. Owns the Home tab layout:
// greeting strip, Daily zone (FootleHero + Today's 7 secondary), MP card,
// More-modes grid, WC2026 event tile, Coming-soon shelf.
//
// Reads user/authProfile/isGuest via useAuth (same pattern as Profile
// and Daily). All other state + handlers come in as props — HomeScreen
// is a presentational orchestrator, not a state owner.
function HomeScreenImpl({
  profile,
  loginStreak,
  streakPulsing,
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
  favClub,
  onPlayClub,
  shareCard,
  challenge,
  onPlayChallenge,
  onDismissChallenge,
  setOnlineAutoCreate,
}) {
  const { user, profile: authProfile, isGuest, openAuthPrompt } = useAuth();

  return (
    <div className="screen tab-content">
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
        const homeShowCTA = !homeAuthLoading && !homeHasUsername && (!homeLocalName || isDefaultName(homeLocalName));
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
          <div style={{padding:"6px 0 8px"}}>
            <div style={{display:"flex", alignItems:"center", gap:10}}>
              <div style={{display:"flex", alignItems:"baseline", gap:8, flex:1, minWidth:0, flexWrap:"wrap"}}>
                <div style={{fontSize:20, color:"var(--t2)", fontWeight:600, letterSpacing:"-0.3px"}}>{greeting}</div>
                {(homeAuthLoading && !homeDisplayName) ? (
                  // Sprint #23 U2: min-width lock keeps the name-box width stable
                  // across the Loading…→username swap. Only show the skeleton when
                  // we have NO cached name to show — otherwise the local name
                  // appears instantly instead of waiting for the server profile.
                  <div style={{fontSize:20, color:"var(--t1)", fontWeight:800, opacity:0.4, animation:"profileSkeletonPulse 1.4s ease-in-out infinite", minWidth:70}}>Loading…</div>
                ) : homeDisplayName ? (
                  <div style={{fontSize:20, color:"var(--t1)", fontWeight:800, minWidth:70, letterSpacing:"-0.3px"}}>
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
          rails. */}
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
            <FootleHero
              onPlay={() => setScreen("wordle")}
              onReview={(wsArg) => viewPuzzleStatus(wsArg)}
              shareCard={shareCard}
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
          Two primary CTAs route directly: Online checks guest state
          and either toasts a sign-in prompt or jumps to the online
          stage; Local enters pass-and-play immediately. Invite pill
          handles its own Share/clipboard flow. */}
      <MultiplayerCard
        onOnline={() => {
          if (!user || isGuest) {
            openAuthPrompt("online");
            return;
          }
          setScreen("online-stage1");
        }}
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
          { key:"clubquiz",  Icon: Shield,     name: favClub ? `${favClub.name} Quiz` : "Club Quiz", desc: favClub ? "Your club ⚽" : "Pick your club", onTap: favClub ? () => onPlayClub(favClub.key) : () => startMode("clubquiz") },
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
    </div>
  );
}

// Memoized like its sibling tab screens (DailyTabScreen/ProfileScreen): all
// three Home tabs stay mounted and AppInner re-renders on every unrelated state
// change, so without this HomeScreen's whole tree re-rendered each time. Props
// are stable (useCallback handlers + setters; challenge is null or a stable ref).
export const HomeScreen = React.memo(HomeScreenImpl);
