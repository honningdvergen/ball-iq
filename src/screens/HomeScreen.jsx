import React from "react";
import { Timer, Flame, Zap, ScrollText, Sparkles, Trophy, Shield, ClipboardList, Route, Heart, UserRoundSearch, LandPlot, Newspaper, Settings, Pencil, Search } from "lucide-react";
import { useAuth } from "../useAuth.jsx";
import { APP_NAME } from "../lib/scoring.js";
import { getLevelInfo } from "../lib/scoring.js";
import { readWordleTodayStatus, getWordleDateKey } from "../lib/wordleStatus.js";
import { getTrailAnswer, loadTrailDay, getTrailNumber } from "../lib/trail.js";
import { answerIdForDay, mysteryDayIndex, mysteryNumber, MYSTERY_ENABLED, loadMysteryResult } from "../lib/mysteryPlayer.js";
import MYSTERY_SCHEDULE from "../data/mysterySchedule.json";
import { dateToYMD } from "../lib/date.js";
import { ProfilePic } from '../components/ProfilePic.jsx';
import { computeCard, CARD_TIERS, tierPalette } from "../lib/ballIqCard.js";
import { TOPICAL_PACK } from "../lib/quiz.js";
import { QB_INDEX } from "../questions-index.js";
import { getFootleNumber } from "../lib/footleNumber.js";
import { FOOTLE_TAGLINE } from "../lib/modeCopy.js";
import { MODE_ACCENT, MODE_RGB } from "../lib/accents.js";
import { PLAY_STORE_URL, appStoreUrl } from "../lib/links.js";
import { MultiplayerCard } from "../components/MultiplayerCard.jsx";

// ── CLUB FINDER (front door, 2026-09-03) ─────────────────────────────────────
// Club quizzes are the largest single volume on the site — 763 anonymous plays
// in 30 days, Arsenal 113, Liverpool 73, Barcelona 51 — and until now the only
// way in from Home was one tile labelled "Pick your club" in the fourth screen
// of the mode grid. Alex's brief for the rethink: "you want to find the game
// mode or quiz you are looking for easily — maybe it is your club or your
// league". So: a search field at the top of Home that goes straight into a
// club's quiz, plus the twelve most-played clubs as chips. Search matches on
// name and the three-letter code, prefix before substring, same rule as the
// club picker sheet in App.jsx. clubPacks/clubAbbr arrive as props — importing
// them from App.jsx would be a circular import (App imports this screen).
// Eight, in 30-day play order (Arsenal 113 … Man Utd 11), so the row is two
// lines on desktop and one swipe on a phone; the rest are one tap away.
const FEATURED_CLUB_KEYS = [
  "Arsenal", "Liverpool", "Barcelona", "Chelsea", "ManCity", "RealMadrid", "Tottenham", "ManUtd",
];
// Badge text colour from the club colour's luminance: Real Madrid's white and
// Tottenham's navy cannot share one text colour.
const abbrInk = (hex) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || ""));
  if (!m) return "#fff";
  const n = parseInt(m[1], 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.62 ? "#14171A" : "#fff";
};
function ClubFinder({ clubPacks, clubAbbr, onPickClub, onAllClubs }) {
  const [q, setQ] = React.useState("");
  const [focused, setFocused] = React.useState(false);
  if (!clubPacks) return null;
  const norm = (x) => String(x || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const nq = norm(q.trim());
  const matches = !nq ? [] : Object.entries(clubPacks).map(([key, pack]) => {
    const name = norm(pack.name), abbr = norm(clubAbbr?.[key]);
    if (name.startsWith(nq) || abbr === nq) return { key, pack, rank: 0 };
    if (name.includes(nq) || abbr.startsWith(nq)) return { key, pack, rank: 1 };
    return null;
  }).filter(Boolean).sort((a, b) => a.rank - b.rank || a.pack.name.localeCompare(b.pack.name)).slice(0, 8);
  const pick = (key) => { setQ(""); onPickClub(key); };
  const total = Object.keys(clubPacks).length;
  return (
    <div className="club-finder" role="search">
      <div className="cf-field">
        <Search size={18} strokeWidth={2.25} aria-hidden="true" className="cf-icon" />
        <input
          type="search"
          className="cf-input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 120)}
          onKeyDown={(e) => { if (e.key === "Enter" && matches[0]) pick(matches[0].key); if (e.key === "Escape") setQ(""); }}
          placeholder="Find your club…"
          aria-label="Find your club"
          autoCapitalize="none" autoCorrect="off" spellCheck={false} enterKeyHint="search"
        />
      {nq && focused && (
        <div className="cf-results" role="listbox" aria-label="Clubs">
          {matches.length === 0 && <div className="cf-empty">No club called “{q.trim()}” on file yet. <button type="button" className="cf-link" onClick={onAllClubs}>See every club</button></div>}
          {matches.map(({ key, pack }) => (
            <button key={key} type="button" role="option" className="cf-row" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(key)}>
              <span className="cf-abbr" style={{ background: pack.color || "var(--s2)", color: abbrInk(pack.color) }}>{clubAbbr?.[key] || pack.name.slice(0, 3).toUpperCase()}</span>
              <span className="cf-name">{pack.name}</span>
              <span className="cf-go">Play →</span>
            </button>
          ))}
        </div>
      )}
      </div>
      <div className="cf-chips" aria-label="Most played clubs">
        {FEATURED_CLUB_KEYS.filter((k) => clubPacks[k]).map((k) => (
          <button key={k} type="button" className="cf-chip" onClick={() => onPickClub(k)}>
            {/* Grey at rest: three full-saturation club reds were the most
                saturated pixels on the home and outranked the product's own
                hierarchy. Colour returns on the result row and the club screen. */}
            <span className="cf-abbr cf-abbr-quiet">{clubAbbr?.[k] || k.slice(0, 3).toUpperCase()}</span>
            <span className="cf-chip-name">{clubPacks[k].name}</span>
          </button>
        ))}
        <button type="button" className="cf-chip cf-chip-all" onClick={onAllClubs}>All {total} clubs →</button>
      </div>
    </div>
  );
}

// The desktop Footle hero (an inline board at >=1024) and the mobile FootleHero
// card left the home on 2026-09-06: today's four are four equal rows, as on the
// website's Today block. The worked example lives on the Footle screen's ?.

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
  clubPacks,
  clubAbbr,
  launchClubQuiz,
  // First session on this device (App.jsx showFirstQuizTip). The banner that
  // used to carry the tip is gone (2026-09-06 critique): the Footle row says
  // "Start here" instead, so the tip and its target are the same tap.
  firstSession = false,
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

  // Which modes this device has already opened, so a NEW badge can retire
  // itself the moment it has done its job. Self-clearing beats a hard-coded
  // date: a badge that outlives the user's first visit stops meaning "new"
  // and starts meaning "this app decorates things at random".
  //
  // ⚠️ biq_modes_seen is a DEVICE-SCOPED UX dismiss-flag, so it must NOT go in
  // USER_SCOPED_STATIC_KEYS (useAuth.jsx) — signing out and back in on your own
  // phone should not re-announce a mode you have already played. Same reasoning
  // that biq_onboarded is documented as preserved there; the over-zealous
  // catch-all inclusion caused real replay reports last time.
  const [seenModes, setSeenModes] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('biq_modes_seen') || '{}') || {}; }
    catch { return {}; }
  });
  const markModeSeen = React.useCallback((key) => {
    setSeenModes((prev) => {
      if (prev[key]) return prev;
      const next = { ...prev, [key]: 1 };
      try { localStorage.setItem('biq_modes_seen', JSON.stringify(next)); } catch { /* private mode */ }
      return next;
    });
  }, []);

  // Display name for the desktop rail cards (mirrors the greeting's name logic;
  // plain consts, not hooks, so hook order is untouched). Placeholder usernames
  // (Player / player_xxxxx) fall back to a neutral label rather than being shown.
  // Whether Trail has a puzzle today. Read once here rather than inside the
  // daily-zone IIFE, because the entry point now lives in the More-modes grid.
  const trailLive = (() => { try { return !!getTrailAnswer(); } catch { return false; } })();
  // Cheap enough to compute inline: an array lookup against the frozen log,
  // no ranking work. The heavy pool/ranking import stays inside the lazy
  // screen chunk so the home screen never pays for it.
  // MYSTERY_ENABLED is the pull switch (see lib/mysteryPlayer.js) — the search
  // bank cannot find Ronaldo, so the mode is hidden rather than shipped broken.
  const mysteryLive = (() => {
    if (!MYSTERY_ENABLED) return false;
    try { return !!answerIdForDay(MYSTERY_SCHEDULE, mysteryDayIndex()); } catch { return false; }
  })();

  // Same discipline as trailLive/mysteryLive: never advertise a mode that
  // cannot be played. Counted against the INDEX projection (id/cat/diff/tag,
  // no question text), so the home screen does not pull the 2.3MB bank just to
  // decide whether to draw a tile. Retiring the pack is one constant away —
  // set TOPICAL_PACK to null and this goes false.
  const topicalLive = (() => {
    if (!TOPICAL_PACK?.tag) return false;
    try { return QB_INDEX.filter((r) => r.tag === TOPICAL_PACK.tag).length >= 10; } catch { return false; }
  })();

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
          // Small hours are NOT morning. `h < 12` greeted someone playing at
          // 00:38 with "Good morning", which reads as a broken clock rather
          // than a greeting. 00:00-04:59 belongs to the night before.
          if (h < 5) return "Still up";
          if (h < 12) return "Good morning";
          if (h < 18) return "Good afternoon";
          // Easter egg: ~1 in 5 evenings, swap in the "Good ebening" football-
          // commentary pun. Seeded on the calendar date so it stays put through
          // the whole evening (no flicker between renders) but varies day to day.
          // ⚠️ NEVER UNDER AUTOMATION. The store-screenshot run caught this
          // egg on a 1-in-5 evening and framed "Good ebening, Alex" as the
          // headline of the App Store home shot — where a football-commentary
          // pun stops being a joke and reads as a typo, permanently, to
          // everyone deciding whether to download. Same navigator.webdriver
          // gate the analytics suppression uses: a robot does not get the
          // joke, and captures become deterministic instead of 4-in-5.
          const automated = (() => {
            try { return !!navigator.webdriver; } catch { return false; }
          })();
          const daySeed = now.getFullYear() * 372 + (now.getMonth() + 1) * 31 + now.getDate();
          return (!automated && daySeed % 5 === 0) ? "Good ebening" : "Good evening";
        })();
        const greeting = homeGreetingBase + ((homeAuthLoading || homeDisplayName) ? "," : "");
        const ws = readWordleTodayStatus();
        const footleDone = ws.kind === "won" || ws.kind === "lost";
        // Sprint #12: when both daily rituals are complete, omit the
        // subtext entirely — the Daily zone's "2/2 done" status carries
        // the celebration, the greeting line stays calm.
        //
        // 2026-07-29: the both-OPEN case is that same situation mirrored, so it
        // is null too. "Daily puzzle is up." sat directly above a card reading
        // "0/2 today" and told the user nothing the card wasn't already saying
        // more precisely. The one-done cases stay: naming WHICH ritual is still
        // open is real information the chip's bare count can't give.
        const subtext = footleDone && dailyDone ? null
          : footleDone                          ? "Daily 7 is still open."
          : dailyDone                           ? "Today's Footle is still open."
          :                                       null;
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
              <button onClick={() => setScreen("settings")} className="icon-btn hdr-ic" aria-label="Settings" style={{flexShrink:0}}><Settings size={18} strokeWidth={2.25} aria-hidden="true" /></button>
            </div>
            {subtext && (
              <div style={{fontSize:12.5, color:"var(--t3)", marginTop:2, fontWeight:500}}>
                {subtext}
              </div>
            )}
            {homeShowCTA && (
              <button
                onClick={() => { setTab("profile"); setNameEditNonce(n => n + 1); }}
                className="hit44"
                style={{background:"none",border:"none",padding:"4px 0 0",fontSize:12,fontWeight:600,color:"var(--t2)",textDecoration:"underline",textUnderlineOffset:3,cursor:"pointer",fontFamily:"inherit"}}
                aria-label="Set your name"
              >
                {/* Was "✏️ Tap to set your name" — the same action was worded
                    three different ways across Home and Profile, and "Tap to"
                    is redundant on a touch device. All three now read "Set
                    your name" with a trailing pencil.
                    De-greened 2026-07-29: it was the THIRD green element in the
                    top 300px, competing with Footle's Play for the eye — and it
                    is a settings nudge, not something you came here to do.
                    Underlined so it still reads as tappable without shouting. */}
                Set your name <Pencil size={12} strokeWidth={2.5} aria-hidden="true" style={{display:"inline",verticalAlign:"-1px",marginLeft:2}} />
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
            style={{flexShrink:0,minHeight:36,padding:"8px 14px",background:"var(--accent)",color:"var(--grn-ink)",border:"none",borderRadius:999,boxShadow:"0 8px 22px -8px rgba(88,204,2,0.55)",fontFamily:"inherit",fontSize:13.5,fontWeight:800,cursor:"pointer",WebkitTextFillColor:"var(--grn-ink)"}}
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

      {/* ── TODAY ZONE ──
          Four equal rows (Footle, Daily 7, Transfer Trail, Mystery Player) under
          a shared "TODAY" eyebrow and an X/4 counter — the same block the website
          renders. Since 2026-09-06 there is no hero card and no inline board here:
          the rows carry state (Play / Continue / Review) and the edition number. */}
      {(() => {
        const ws = readWordleTodayStatus();
        const footleDone = ws.kind === "won" || ws.kind === "lost";
        // Since 2026-09-06 nothing here is a hero: four equal rows, like the
        // website's Today block. The COUNT was already all four. It says "today", and since the
        // Daily tab now lists all four it has to mean all four — a Home reading
        // "0/2 today" beside a Daily tab reading "0 of 4 played" is the app
        // contradicting itself. So the fraction counts every live daily puzzle
        // and the whole status becomes the way through to the other two: it
        // promotes them without adding a card.
        const trailDone = ["won", "lost"].includes(loadTrailDay()?.status);
        const mysteryRes = loadMysteryResult(new Date());
        const mysteryDone = !!(mysteryRes?.won || mysteryRes?.gaveUp);
        const total = 2 + (trailLive ? 1 : 0) + (mysteryLive ? 1 : 0);
        const doneCount = (footleDone ? 1 : 0) + (dailyDone ? 1 : 0)
          + (trailLive && trailDone ? 1 : 0) + (mysteryLive && mysteryDone ? 1 : 0);
        const allDone = doneCount === total;
        return (
          <div className="daily-zone" role="group" aria-label="Today's puzzles">
            <div className="daily-zone-head">
              <span className="daily-zone-eyebrow">Today</span>
              <button type="button" className={`daily-zone-status hit44${allDone ? " is-done" : ""}`}
                onClick={() => setTab("daily")}
                aria-label={allDone ? `All ${total} of today's puzzles done — open the Daily tab` : `${doneCount} of ${total} puzzles played today — open the Daily tab`}>
                {allDone ? `${total}/${total} done` : `${doneCount}/${total} today`}
                <span aria-hidden="true" style={{ marginLeft: 5, opacity: 0.7 }}>›</span>
              </button>
            </div>
            {/* FOUR EQUAL ROWS (Alex, 2026-09-06, after seeing the app home beside the
                website's Today block): the Footle hero card carried a worked example
                the returning player has seen a hundred times, Mystery sat in the mode
                grid while the counter said "/4", and the Trail row wore the Daily 7's
                amber pill. One row shape for all four, each carrying its own mode
                colour in the icon well and the pill through --mode / --mode-rgb, the
                edition number beside the name, the state in the subline — the same
                block the website renders, so the app and the site are one product. */}
            {(() => {
              const rows = [
                {
                  key: "footle", name: "Footle", no: getFootleNumber(), accent: MODE_ACCENT.footle, rgb: MODE_RGB.footle,
                  icon: <span className="fh-tile fh-tile-green t7s-f" aria-hidden="true">F</span>,
                  done: footleDone, open: ws.kind === "in-progress",
                  sub: ws.kind === "won" ? <>✅ Solved in <strong>{ws.used}</strong></>
                    : ws.kind === "lost" ? <>✗ Out of guesses</>
                    : ws.kind === "in-progress" ? <>In progress · <strong>{ws.used}</strong> of 6</>
                    : firstSession ? <>Start here — everyone gets the same player</>
                    : <>{FOOTLE_TAGLINE}</>,
                  // Done or not, the row opens the Footle screen: a finished board
                  // shows the result panel (DailyDone) — share, streak, the other
                  // open dailies. The separate status screen stays for the Daily
                  // tab's archive rows (2026-09-06).
                  onTap: () => setScreen("wordle"),
                  aria: footleDone ? "Today's Footle: done — review" : "Play today's Footle",
                },
                {
                  key: "daily", name: "Daily 7", Icon: ClipboardList, accent: MODE_ACCENT.daily7, rgb: MODE_RGB.daily7,
                  done: dailyDone,
                  sub: dailyDone ? <>✅ Done · <strong>{dailyScore}/7</strong></> : <>7 questions · ~3 min</>,
                  onTap: () => (dailyDone ? viewDailyScore(new Date(), dailyScore) : startMode("daily")),
                  aria: dailyDone ? `Daily 7 complete: ${dailyScore} out of 7` : "Play Daily 7",
                },
                ...(trailLive ? [{
                  key: "trail", name: "Transfer Trail", no: getTrailNumber(), Icon: Route, accent: MODE_ACCENT.trail, rgb: MODE_RGB.trail,
                  done: trailDone,
                  sub: trailDone ? <>✅ Done · today's player</> : <>Follow the moves · name the player</>,
                  onTap: () => setScreen("trail"),
                  aria: trailDone ? "Today's Transfer Trail: done — review" : "Play today's Transfer Trail",
                }] : []),
                ...(mysteryLive ? [{
                  key:"mystery", Icon: UserRoundSearch, name: "Mystery Player", no: mysteryNumber(), accent: MODE_ACCENT.mystery, rgb: MODE_RGB.mystery,
                  done: mysteryDone,
                  sub: mysteryDone ? <>✅ Done · guess who</> : <>Guess who from career clues</>,
                  onTap: () => setScreen("mystery"),
                  aria: mysteryDone ? "Today's Mystery Player: done — review" : "Play today's Mystery Player",
                }] : []),
              ];
              return rows.map((r) => (
                <button
                  key={r.key}
                  className={`todays-seven-secondary ${r.key}-row${r.done ? " is-done" : ""}`}
                  style={{ "--mode": r.accent, "--mode-rgb": r.rgb }}
                  onClick={r.onTap}
                  aria-label={r.aria}
                >
                  <span className="t7s-icon" aria-hidden="true">{r.icon || <r.Icon size={22} strokeWidth={2} />}</span>
                  <span className="t7s-body">
                    <span className="t7s-title">{r.name}{r.no ? <span className="t7s-no">No. {r.no}</span> : null}</span>
                    <span className="t7s-sub">{r.sub}</span>
                  </span>
                  <span className="t7s-cta">{r.done ? "Review" : r.open ? "Continue" : "Play"}</span>
                </button>
              ));
            })()}
          </div>
        );
      })()}

      {/* ── PLAY WITH FRIENDS — one row, same anatomy as the Today rows
          (2026-09-06 critique: it had the loudest button on the screen and the
          seventh position, 11 plays in 30 days). The body opens the Online tab;
          the quiet Invite pill creates a room. "Same phone" lives on the Online
          tab ("Local pass & play"), where couch play already was. */}
      <MultiplayerCard
        onInvite={() => {
          // 1.1: "Invite" now creates a room and drops you in the lobby (where
          // the real /join/CODE link lives) instead of sharing a dead link.
          if (!user || isGuest) {
            // "invite", not "online" — the prompt this opens is the only thing
            // the player sees next, so it has to name what they just asked for.
            openAuthPrompt("invite");
            return;
          }
          setOnlineAutoCreate?.(true);
          setScreen("online-stage1");
        }}
        // Tapping the card anywhere outside the two buttons was a dead click.
        // Guests are deliberately NOT gated here — the Online tab is viewable
        // signed-out and gates on create/join, so sending them to an auth prompt
        // for a browse would be a harsher funnel than the buttons have.
        onOpen={() => setTab("online")}
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
          const tm = tierPalette(card.tier);
          const lvl = getLevelInfo(xp || 0);
          return (
            <div className="hr-card hr-rating">
              <div className="hr-rating-glow" aria-hidden="true" />
              <div className="hr-rating-id">
                <div className="hr-avatar" style={{ borderColor: "var(--accent)" }}>
                  {/* One avatar component, not a hand-rolled <img> beside it. The
                      bespoke branch hid itself on a dead URL and left a hole;
                      ProfilePic now falls back to the person's monogram. */}
                  <ProfilePic value={authProfile?.avatar_id || profile?.avatar} url={authProfile?.avatar_url} name={railName} />
                </div>
                <div className="hr-rating-idcol">
                  <div className="hr-rating-name">
                    <span className="hr-rating-nametext">{railName}</span>
                    <svg className="hr-rating-pencil" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
                  </div>
                  <span className="hr-rating-lvl"><lvl.level.Icon size={13} strokeWidth={2.3} /> {lvl.level.name ? `${lvl.level.name} · ` : ""}{(xp || 0).toLocaleString()} XP</span>
                </div>
              </div>
              {/* A rating you have not earned is not a rating. computeCard's
                  0.4 default produced "64 OVERALL SILVER" for a stranger who
                  had answered nothing — the same fabricated-number bug the
                  Profile tab fixed on 2026-08-28, still live on the desktop
                  rail, and now the first thing a front-door visitor reads.
                  Zero answers → an honest empty state; the card appears
                  after the first game. */}
              {(stats?.totalAnswered || 0) > 0 ? (
                <div className="hr-rating-score">
                  <div className="hr-rating-num">{card.overall}</div>
                  <div className="hr-rating-scap">
                    <div className="hr-rating-overall">OVERALL</div>
                    <div className="hr-rating-tier">{tm.label}</div>
                  </div>
                </div>
              ) : (
                <div className="hr-rating-score hr-rating-empty">
                  <div className="hr-rating-num" aria-hidden="true">—</div>
                  <div className="hr-rating-scap">
                    <div className="hr-rating-overall">OVERALL</div>
                    <div className="hr-rating-tier" style={{ color: "var(--t2)", textTransform: "none", letterSpacing: 0, fontWeight: 600 }}>Play a game to get rated</div>
                  </div>
                </div>
              )}
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
      {/* ── FIND A QUIZ ── The club finder moved here from the top of the screen
          (2026-09-06 critique, Alex: the search bar and the club scroller "do not
          belong where they sit"). On the return trip tap beats type: the four
          Today rows come first, the catalogue follows. The finder IS the club
          entry now — the Club Quiz tile below was the same door twice. */}
      <div className="home-section-title">Find a quiz</div>
      {/* FRONT DOOR: the club finder sits above everything but the greeting.
          Today's dailies follow; the modes grid stays below. */}
      <ClubFinder
        clubPacks={clubPacks}
        clubAbbr={clubAbbr}
        onPickClub={(key) => { if (launchClubQuiz) launchClubQuiz(key); else startMode("clubquiz"); }}
        onAllClubs={() => startMode("clubquiz")}
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
          // No Club Quiz tile: the finder above this grid is the club entry
          // (search, chips, "All clubs"). Two doors to one room read as a longer
          // app, not a bigger one (2026-09-06).
          // The topical pack sits high on purpose: it is the only tile whose
          // value DECAYS, so burying it below the evergreen modes wastes it.
          // Gated on topicalLive, and retirable by nulling TOPICAL_PACK.
          ...(topicalLive ? [{ key: TOPICAL_PACK.key, Icon: Newspaper, name: TOPICAL_PACK.name, desc: TOPICAL_PACK.desc, isNew: true, onTap: () => startMode(TOPICAL_PACK.key) }] : []),
          // ⚠️ NO TRAIL TILE HERE. Transfer Trail is already a row in the daily
          // zone above, pointing at the SAME screen — one puzzle a day, listed
          // twice on one screen. A duplicate entry does not add a way in, it
          // just makes the grid look longer than the app is (Alex, 2026-09-04).
          // Same gate as the Trail: the card only exists if the frozen
          // schedule actually has a puzzle for today, so nothing advertises a
          // mode that cannot be played. mysteryLive is computed above.
          // Mystery Player is a row in the Today block above (2026-09-06), same rule
          // as the Trail: one puzzle a day, listed once.
          // Stadiums (2026-08-20, Alex's design): a completion run, not a
          // quiz — name every ground in the league. No live-gate needed:
          // the dataset is season-pinned and always playable.
          { key:"stadiums", Icon: LandPlot, name: "Stadiums", desc: "Name every ground", onTap: () => setScreen("stadiums") },
          { key:"leaguequiz", Icon: Trophy,     name: "League Quiz", desc: "Pick a league",    onTap: () => startMode("leaguequiz") },
          { key:"classic",   Icon: Timer,      name:"Classic",       desc:"10 Qs, 20s each",   onTap:() => setShowDiffPicker(true) },
          // ⚠️ iconColor deliberately REMOVED. Survival was the only tile using the
          // opt-out, so after the grid went neutral it was the single remaining
          // green icon — which is worse than all-green was, because one odd tile
          // reads as a mistake rather than a system. Spotted by Alex immediately.
          // The prop still exists for a tile that genuinely earns its own colour;
          // nothing does today.
          { key:"survival",  Icon: Heart,      name:"Survival",      desc:"Die on wrong" },
          { key:"hotstreak", Icon: Flame,      name:"Hot Streak",    desc:"60-second sprint" },
          { key:"legends",   Icon: ScrollText, name:"Legends",       desc:"Pre-2000 greats" },
          // Ball IQ Test was killed 2026-08-10 (App.jsx side removed then).
          // This tile outlived the mode and silently started an unbranded
          // generic quiz — the grid entry goes too.
          { key:"chaos",     Icon: Sparkles,   name:"Chaos",         desc:"Quotes & chaos" },
        ].map(({ key, Icon, name, desc, onTap, iconColor, isNew }) => {
          const showNew = isNew && !seenModes[key];
          return (
            <button
              key={key}
              className="play-card"
              onClick={() => { markModeSeen(key); (onTap || (() => startMode(key)))(); }}
            >
              {/* ⚠️ NEUTRAL BY DEFAULT, NOT GREEN. Nine tiles each drew a green
                  icon inside a green-bordered box, so the mode grid was nine
                  competing accents and the eye had no way to rank them. Green in
                  this app now means go and correct — spending it on every mode
                  label made it mean "a mode", which is to say nothing.
                  A tile can still opt in via iconColor when it has earned a
                  colour of its own; the default is quiet. */}
              <span className="play-card-icon">
                <Icon size={20} strokeWidth={2.25} color={iconColor || "var(--t2)"} aria-hidden="true" />
              </span>
              <span className="play-card-body">
                <span className="play-card-name">{name}</span>
                <span className="play-card-desc">{desc}</span>
              </span>
              {showNew && <span className="play-card-badge">NEW</span>}
            </button>
          );
        })}
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
          (viewBox 0 0 384 512). Google Play went live 2026-07-27, so the
          former "Android coming soon" text is now a real badge. */}
      <div className="home-app-banner">
        <div className="hab-copy">
          <div className="hab-title">Take {APP_NAME} everywhere</div>
          <div className="hab-sub">Your streak, rating and friends follow your account — on your phone or in any browser.</div>
        </div>
        <div className="hab-actions">
          <a className="hab-store" href={appStoreUrl()} target="_blank" rel="noopener" aria-label="Download on the App Store">
            <svg viewBox="0 0 384 512" width="20" height="20" aria-hidden="true">
              <path fill="currentColor" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
            </svg>
            <span className="hab-store-txt">
              <span className="hab-store-ey">Download on the</span>
              <span className="hab-store-nm">App Store</span>
            </span>
          </a>
          <a className="hab-store" href={PLAY_STORE_URL} target="_blank" rel="noopener" aria-label="Get it on Google Play">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path fill="currentColor" d="M4 3.5 20 12 4 20.5z" />
            </svg>
            <span className="hab-store-txt">
              <span className="hab-store-ey">Get it on</span>
              <span className="hab-store-nm">Google Play</span>
            </span>
          </a>
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
