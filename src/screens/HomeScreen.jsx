import React from "react";
import { Timer, Flame, Zap, ScrollText, Brain, Sparkles, Trophy, Shield, ClipboardList } from "lucide-react";
import { useAuth } from "../useAuth.jsx";
import { APP_NAME } from "../lib/scoring.js";
import { getLevelInfo } from "../lib/scoring.js";
import { readWordleTodayStatus, getWordleDateKey } from "../lib/wordleStatus.js";
import { getWordleAnswer } from "../lib/wordle.js";
import { dateToYMD } from "../lib/date.js";
import { computeCard, CARD_TIERS } from "../lib/ballIqCard.js";
import { FootleHero } from "../components/FootleHero.jsx";
import { APP_STORE_URL } from "../lib/links.js";
import { MultiplayerCard } from "../components/MultiplayerCard.jsx";

const DAY_MS = 24 * 60 * 60 * 1000;

// ── Footle HERO card (DESKTOP web only) ──────────────────────────────────────
// desktop-web-refresh: the Home hero is a compact GREEN hero card matching the
// Claude Design handoff (reference screen 01), NOT a full playable board. It
// reads today's real puzzle status from the SAME store the full Footle screen
// uses (biq_wordle_<ymd>) so the CTA reflects reality — "Play today's Footle"
// when unplayed, a solved/failed chip + "Review" when done. Playing happens on
// the dedicated Footle screen (onPlay → setScreen("wordle")); the small board on
// the right is decorative only. Kept as its own component so its hooks never
// touch HomeScreenImpl's hook order, and it stays mounted-but-hidden below 1024
// (the .home-footle-inline reveal class + the PWA-standalone killswitch).
function DesktopFootleHero({ onPlay }) {
  // Snapshot today's puzzle at mount (dateKey + answer captured once) so a
  // mid-session local-midnight rollover can't mismatch the store key. Only the
  // answer LENGTH is surfaced (as the mock does) — never the answer itself.
  const [dateKey] = React.useState(getWordleDateKey);
  const [answer] = React.useState(getWordleAnswer);
  const L = answer.length;
  // Decorative board width — cap so a long surname can't crowd the copy column.
  const cols = Math.min(L, 7);

  const store = (() => {
    try {
      const raw = localStorage.getItem(`biq_wordle_${dateKey}`);
      if (raw) { const p = JSON.parse(raw); if (p && Array.isArray(p.guesses)) return p; }
    } catch {}
    return { guesses: [], status: "playing" };
  })();
  const won = store.status === "won";
  const lost = store.status === "lost";
  const done = won || lost;

  return (
    <div className="home-footle-inline">
      <span className="ffh-glow" aria-hidden="true" />
      <div className="ffh-inner">
        <div className="ffh-copy">
          <div className="ffh-eyebrow">Daily · Footle</div>
          <div className="ffh-title">Footle</div>
          <div className="ffh-sub">{L} letters · 6 guesses · Surname of a footballer</div>
          {done ? (
            <div className="ffh-actions">
              <span className={`ffh-solved${lost ? " is-lost" : ""}`}>
                {won ? `✓ Solved in ${store.guesses.length}` : "✗ Out of guesses"}
              </span>
              <button type="button" className="ffh-review" onClick={onPlay} aria-label="Review today's Footle">
                Review →
              </button>
            </div>
          ) : (
            <button type="button" className="ffh-cta" onClick={onPlay}>Play today&apos;s Footle</button>
          )}
        </div>
        <div className="ffh-board" aria-hidden="true">
          <div className="ffh-board-row">
            {Array.from({ length: cols }).map((_, i) => (
              <span key={i} className={`ffh-cell${i === 0 ? " is-active" : ""}`} />
            ))}
          </div>
          <div className="ffh-board-row">
            {Array.from({ length: cols }).map((_, i) => <span key={i} className="ffh-cell" />)}
          </div>
        </div>
      </div>
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
  notifCount = 0,
  onOpenNotifs,
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
              {/* Two-line greeting: subtitle-weight line 1 ("Good afternoon,")
                  above a bold name that truncates with an ellipsis so long
                  usernames never clip into / collide with the subtitle. */}
              <div style={{display:"flex", flexDirection:"column", alignItems:"flex-start", gap:1, flex:1, minWidth:0}}>
                <div className="hg-greet" style={{fontSize:13.5, color:"var(--t2)", fontWeight:500, letterSpacing:"-0.2px"}}>{greeting}</div>
                {(homeAuthLoading && !homeDisplayName) ? (
                  // Sprint #23 U2: min-width lock keeps the name-box width stable
                  // across the Loading…→username swap. Only show the skeleton when
                  // we have NO cached name to show — otherwise the local name
                  // appears instantly instead of waiting for the server profile.
                  <div style={{fontSize:24, color:"var(--t1)", fontWeight:800, opacity:0.4, animation:"profileSkeletonPulse 1.4s ease-in-out infinite", minWidth:70}}>Loading…</div>
                ) : homeDisplayName ? (
                  <div className="hg-name" style={{fontSize:24, color:"var(--t1)", fontWeight:800, maxWidth:"100%", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", letterSpacing:"-0.3px"}}>
                    {homeDisplayName}
                  </div>
                ) : null}
              </div>
              {loginStreak > 0 && (
                <span className={`hst-streak${streakPulsing ? ' is-pulsing' : ''}`} aria-label={`${loginStreak}-day streak`}>
                  <span className="hst-flame" aria-hidden="true">🔥</span>
                  <span className="hst-num">{loginStreak}</span>
                </span>
              )}
              {/* Notification bell — the Home tab hides the shared header, so the
                  bell lives here (signed-in only; onOpenNotifs passed then). */}
              {onOpenNotifs && (
                <button onClick={onOpenNotifs} className="icon-btn hdr-ic" aria-label={notifCount > 0 ? `Notifications, ${notifCount} new` : "Notifications"} style={{flexShrink:0, position:"relative"}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                  {notifCount > 0 && <span className="notif-dot" aria-hidden="true" />}
                </button>
              )}
              {/* 1.1: settings gear inline with the greeting (the shared header
                  row is hidden on Home) — one tidy top row, no dead space. */}
              <button onClick={() => setScreen("settings")} className="icon-btn hdr-ic" aria-label="Settings" style={{flexShrink:0}}>⚙️</button>
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
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",marginBottom:10,background:"linear-gradient(135deg, rgba(88,204,2,0.16), rgba(88,204,2,0.05))",border:"1px solid rgba(88,204,2,0.30)",borderRadius:14}}>
          <span style={{fontSize:22}} aria-hidden="true">🏆</span>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:13.5,fontWeight:800,color:"var(--t1)",lineHeight:1.25}}>
              {challenge.name ? `${challenge.name} challenged you` : "You've been challenged"}
            </div>
            <div style={{fontSize:12,color:"var(--t2)",marginTop:1}}>
              Beat {challenge.score}/7{challenge.date !== dateToYMD(new Date()).replace(/-/g, "") ? " (yesterday's score)" : ""} on today's Daily 7
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
            <DesktopFootleHero onPlay={() => setScreen("wordle")} />
            <button
              className={`todays-seven-secondary${dailyDone ? ' is-done' : ''}`}
              onClick={() => dailyDone ? viewDailyScore(new Date(), dailyScore) : startMode("daily")}
              aria-label={dailyDone ? `Daily 7 complete: ${dailyScore} out of 7` : "Play Daily 7"}
            >
              <span className="t7s-icon" aria-hidden="true"><ClipboardList size={22} strokeWidth={2} /></span>
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
            <div className="hr-card hr-rating">
              <div className="hr-rating-glow" aria-hidden="true" />
              <div className="hr-rating-id">
                <div className="hr-avatar" style={{ borderColor: "#58CC02" }}>
                  {authProfile?.avatar_url
                    ? <img src={authProfile.avatar_url} crossOrigin="anonymous" alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                    : (profile?.avatar || "⚽")}
                </div>
                <div className="hr-rating-idcol">
                  <div className="hr-rating-name">
                    <span className="hr-rating-nametext">{railName}</span>
                    <svg className="hr-rating-pencil" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
                  </div>
                  <span className="hr-rating-lvl">{lvl.level.icon} {lvl.level.name ? `${lvl.level.name} · ` : ""}{(xp || 0).toLocaleString()} XP</span>
                </div>
              </div>
              <div className="hr-rating-score">
                <div className="hr-rating-num">{card.overall}</div>
                <div className="hr-rating-scap">
                  <div className="hr-rating-overall">OVERALL</div>
                  <div className="hr-rating-tier">{tm.label}</div>
                </div>
              </div>
              <button type="button" className="hr-rating-view" onClick={() => setTab("profile")}>
                View full profile →
              </button>
            </div>
          );
        })()}

        {/* Streak + 14-day form */}
        {(() => {
          // Drive the 14-cell bar from the SAME login streak the number above
          // shows (there's no per-day login history to map, and the old
          // dailyHistory cells tracked a DIFFERENT metric — daily-puzzle
          // completion — so a 3-day login streak lit 0 cells). i = days-ago
          // (0 = today); a streak of N lights the N most recent cells, so the
          // lit run always agrees with .hr-streak-num. Capped at the 14 shown.
          const streakDays = Math.max(0, loginStreak || 0);
          const cells = [];
          for (let i = 13; i >= 0; i--) {
            cells.push({ done: i < streakDays, isToday: i === 0 });
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
              <div className="hr-form" aria-label={`Login streak: ${loginStreak || 0} of the last 14 days`}>
                {cells.map((c, i) => (
                  <span key={i} className={`hr-form-cell${c.done ? " is-done" : ""}${c.isToday ? " is-today" : ""}`} />
                ))}
              </div>
              <div className="hr-form-cap">Last 14 days</div>
            </div>
          );
        })()}

        {/* Your form — quick-stats card (mock screen 01, 3rd rail card). Same
            real computation the Profile scouting report uses: overall accuracy,
            best classic score, and the strongest competition from the card model.
            Cold-start (no games yet) → a friendly prompt, never fake numbers. */}
        {(() => {
          const answered = stats?.totalAnswered || 0;
          const correct = stats?.totalCorrect || 0;
          const acc = answered > 0 && correct <= answered ? correct / answered : 0.4;
          const hasPlayed = (stats?.gamesPlayed || 0) > 0 || answered > 0;
          const card = computeCard(stats?.catStats || {}, acc);
          const played = (card.ratings || []).filter((r) => r.answered > 0).sort((a, b) => b.rating - a.rating);
          const strongest = played[0] || null;
          const best = stats?.bestScore || 0;
          return (
            <div className="hr-card hr-yf">
              <div className="hr-yf-title">Your form</div>
              {hasPlayed ? (
                <div className="hr-yf-rows">
                  <div className="hr-yf-row"><span className="hr-yf-k">Accuracy</span><span className="hr-yf-v">{Math.round(acc * 100)}%</span></div>
                  {best > 0 && <div className="hr-yf-row"><span className="hr-yf-k">Best score</span><span className="hr-yf-v">{best} / 10</span></div>}
                  {strongest && <div className="hr-yf-row"><span className="hr-yf-k">Strongest</span><span className="hr-yf-v hr-yf-v-green">{strongest.name}</span></div>}
                </div>
              ) : (
                <div className="hr-yf-empty">Play a game to see your form.</div>
              )}
            </div>
          );
        })()}
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
          { key:"survival",  Icon: Flame,      name:"Survival",      desc:"Die on wrong", iconColor:"#8AE042" },
          { key:"hotstreak", Icon: Zap,        name:"Hot Streak",    desc:"60-second sprint" },
          { key:"legends",   Icon: ScrollText, name:"Legends",       desc:"Pre-2000 greats" },
          { key:"balliq",    Icon: Brain,      name:`${APP_NAME} Test`,  desc:"What's your IQ?" },
          { key:"chaos",     Icon: Sparkles,   name:"Chaos",         desc:"Quotes & chaos" },
        ].map(({ key, Icon, name, desc, onTap, iconColor }) => (
          <button
            key={key}
            className="play-card"
            onClick={onTap || (() => startMode(key))}
          >
            <span className="play-card-icon">
              <Icon size={20} strokeWidth={2.25} color={iconColor || "var(--accent)"} aria-hidden="true" />
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
          const finalDay = new Date(Date.UTC(2026, 6, 19)); // WC final: 19 Jul 2026
          const dayNow = Math.floor(Date.now() / DAY_MS);
          const dayKick = Math.floor(kickoff.getTime() / DAY_MS);
          const dayFinal = Math.floor(finalDay.getTime() / DAY_MS);
          const daysTo = dayKick - dayNow;
          const daysToFinal = dayFinal - dayNow;
          const started = daysTo <= 0;
          // Final-week escalation (opportunity-scan #7): the biggest football
          // week of the cycle deserves more than a static LIVE chip — and
          // after the final, LIVE would be a lie. States: countdown → LIVE →
          // 🏆 FINAL Nd (last week) → evergreen recap.
          const finalWeek = started && daysToFinal >= 0 && daysToFinal <= 7;
          const over = daysToFinal < 0;
          return (
            <button
              className="play-card wc-tile"
              onClick={() => startMode("wc2026")}
              aria-label={over ? "World Cup 2026 quiz — relive the tournament"
                : finalWeek ? `World Cup 2026 — final in ${daysToFinal} day${daysToFinal === 1 ? "" : "s"}, tap to play the tournament quiz`
                : started ? "World Cup 2026 — tap to play the tournament quiz"
                : `World Cup 2026 — ${daysTo} day${daysTo === 1 ? "" : "s"} to go`}
            >
              <span className="play-card-icon wc-tile-icon">
                <Trophy size={20} strokeWidth={2.25} color="#FFC800" aria-hidden="true" />
              </span>
              <span className="play-card-body wc-tile-body">
                <span className="play-card-name">World Cup 2026</span>
                <span className="play-card-desc">{over ? "Relive the tournament" : finalWeek ? "Final week — test yourself" : "Tournament quiz"}</span>
              </span>
              <span className="wc-tile-meta" aria-hidden="true">
                <span className="wc-tile-badge">★ Event</span>
                {!started && <span className="wc-tile-chip">{daysTo}d</span>}
                {finalWeek && <span className="wc-tile-chip wc-tile-chip-live">{daysToFinal === 0 ? "🏆 FINAL DAY" : `🏆 FINAL ${daysToFinal}d`}</span>}
                {started && !finalWeek && !over && <span className="wc-tile-chip wc-tile-chip-live">LIVE</span>}
                {over && <span className="wc-tile-chip">🏆</span>}
              </span>
            </button>
          );
        })()}
      </div>
      {/* Coming-Soon shelf — teaser line for modes that aren't ready yet.
          Section auto-hides if the array is empty. Only list a mode here once
          it actually exists behind a flag and has a ship date; naming a mode
          with no implementation reads as a broken promise on first contact.
          (Tiki Taka Toe / Guess the Player were listed here with no route, no
          handler and no code — removed 2026-07-15.) True or False is
          intentionally NOT surfaced; its runtime logic stays in place but the
          entry point remains hidden. */}
      {(() => {
        const COMING_SOON = [];
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
          <a className="hab-store" href={APP_STORE_URL} target="_blank" rel="noopener" aria-label="Download on the App Store">
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
