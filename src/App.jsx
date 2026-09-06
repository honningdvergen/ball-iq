import './app.css';
import React, { useState, useEffect, useLayoutEffect, useCallback, useRef, useMemo } from "react";
import * as Sentry from '@sentry/react';
import { CLUB_COLOUR_ALIASES, tint as _tint, lift as _lift } from './lib/clubColour.js';
import { useAuth, clearAllUserLocalStorage } from './useAuth.jsx';
import { supabase } from './supabase.js';
import { safeSetItem } from './safeStorage.js';
import { useMultiplayerRoom } from './useMultiplayerRoom.js';
import Login from './Login.jsx';
import ReportButton from './components/ReportButton.jsx';
import { useProfilePhotos } from './lib/profilePhotos.js';
// Lazy: the 523-line review screen is settings-only, never on the cold/first
// paint — React.lazy keeps it out of the initial bundle (Suspense at render).
const ReviewScreen = React.lazy(() => import('./ReviewScreen.jsx'));
// Desktop left rail (>= 1024px, browser only — hidden in native + installed PWA).
import { BiqNav } from './BiqNav.jsx';
import { AppBar } from './components/AppBar.jsx';
import { SiteHeader } from './marketing/SiteHeader.jsx';
import { loadQuestions, prefetchQuestions, loadQuestionIndex, prefetchQuestionIndex } from './questions-loader.js';
// Pure + tested. seededShuffle's integer maths is load-bearing (Math.sin differs
// between JavaScriptCore and V8); pickDailyQuestions is what keeps every player
// on the same Daily 7. See tests/unit/quiz.test.js.
import { seededShuffle, pickDailyQuestions, pickAvoidingConflicts, TOPICAL_PACK, RETIRED_TAGS } from './lib/quiz.js';
import { MYSTERY_ENABLED } from './lib/mysteryPlayer.js';
import { conflictsWith } from './questionConflicts.js';
import { Timer, Flame, Zap, ScrollText, Brain, Sparkles, Trophy, Share, Home, CalendarDays, User, Globe, Users, KeyRound, Gamepad2, Settings, Bell, Lightbulb, Star, Mail, ArrowUpRight, Check, X, ClipboardList, Route, UserRoundSearch, CircleX, CircleHelp, Pencil, Moon, BrickWall, Flag, Handshake } from 'lucide-react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { mpCreateRoom, mpJoinRoom, mpLeaveRoom, mpLookupRoom, useMpRetryStatus } from './multiplayerRpc.js';
import { useModalA11y, closeTopModal } from './useModalA11y.js';
import VersionBanner from './VersionBanner.jsx';
import { useInstallPrompt, useInstallBanner } from './installPrompt.js';
import { FOOTLE_SHORT } from './lib/modeCopy.js';
import { APP_NAME, LEVELS, getLevelInfo, computeBadges, MIN_RATED_ANSWERS, getXPForResult } from './lib/scoring.js';
import { dateToYMD, keyForDate, dayIndexForDate, msToNextLocalMidnight, formatCountdown } from './lib/date.js';
import { bumpUsage } from './lib/usageCounters.js';
import { readWordleTodayStatus, getWordleDateKey, countPriorFootleSolves } from './lib/wordleStatus.js';
import { notificationsSupported, getNotifPermission, requestNotifPermission, scheduleReminderWindow, cancelTodayReminder, cancelAllReminders, onReminderTap } from './lib/notifications.js';
import { webPushSupported, webPushPermission, enableWebPush, disableWebPush, refreshWebPushSubscription } from './lib/webpush.js';
import { registerPush, onPushTap, initPushTapRouting } from './lib/push.js';
import { maybeRequestReview, nativeAskBlockedReason, markBadReviewMoment, clearBadReviewMoment, webRatePromptEligible, markWebRatePromptShown } from './lib/review.js';
import { saveScore, flushScoreOutbox } from './lib/scoreOutbox.js';
import { markAcctStep } from './lib/acctFunnel.js';
// Small enough to sit in the main bundle — the heavy ProfileScreen stays lazy.
import { ProfilePic, firstLetter as firstLetterOf } from './components/ProfilePic.jsx';
import { avatarColour } from './lib/avatarColour.js';
import { syncWidget } from './lib/widgetBridge.js';
import { computeCard, CARD_TIERS, tierPalette } from './lib/ballIqCard.js';
import { getTrailAnswer, loadTrailDay } from './lib/trail.js';
import { DailyDone } from './components/DailyDone.jsx';
import { CountUp } from './components/CountUp.jsx';
import { ResultsCloseBtn } from './components/ResultsCloseBtn.jsx';
import { WrongAnswersReview } from './components/WrongAnswersReview.jsx';
import { Results } from './screens/ResultsScreen.jsx';
import { OnlineHubTab } from './screens/OnlineHubTab.jsx';
import { OnboardingScreen } from './screens/OnboardingScreen.jsx';
import { resultVerdict, HotStreakResults, TrueFalseResults } from './screens/ModeResults.jsx';
import { QuizEngine, TypedInput } from './screens/QuizEngine.jsx';
import { privacyH2, privacyP } from './screens/privacyStyles.js';
import { useNotificationCenter } from './hooks/useNotificationCenter.js';
import { useScrollAwareTabBar } from './hooks/useScrollAwareTabBar.js';
import { useShare } from './hooks/useShare.js';
import { dailyTierCopy, scoreTagline } from './lib/resultsCopy.js';
import { stumpLink, shareStumpText, shareSenderName } from './lib/stump.js';
import {
  WORDLE_PLAYERS, WORDLE_ANCHOR_DAY, WORDLE_ANCHOR_IDX, WORDLE_STRIDE,
  WORDLE_FULL_NAMES,
  getWordleDayIndex, getWordleAnswerForDayIndex, getWordleAnswer,
  gradeWordleGuess, computeFootleStreak, getFootleNumber,
} from './lib/wordle.js';
import { FootleHero } from './components/FootleHero.jsx';
import { FootballWordle } from './games/FootballWordle.jsx';
import { PlatformStoreBadge } from './components/StoreBadge.jsx';
import { getFootleXP } from './lib/footleXp.js';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { APP_STORE_ID, APP_STORE_URL, PLAY_STORE_URL, appStoreUrl } from './lib/links.js';
import { MultiplayerCard } from './components/MultiplayerCard.jsx';
import { UsernameSetupModal } from './components/UsernameSetupModal.jsx';
// Sprint #88 DDD2: ProfileScreen module (~72 kB raw / ~18 kB gzip) is too heavy
// for the first-paint critical path — none of the three screens are reachable
// without tab/screen navigation that happens AFTER cold launch. React.lazy
// pulls them into a separate chunk; the Suspense boundaries at their render
// sites fall back to an empty tab-pane (no visible flash because Profile is
// hidden via HIDDEN_STYLE on non-profile tabs, and the other two are only
// rendered post-navigation).
const ProfileScreen = React.lazy(() => import('./screens/ProfileScreen.jsx').then(m => ({ default: m.ProfileScreen })));
const FriendProfileScreen = React.lazy(() => import('./screens/ProfileScreen.jsx').then(m => ({ default: m.FriendProfileScreen })));
const BlockedUsersScreen = React.lazy(() => import('./screens/ProfileScreen.jsx').then(m => ({ default: m.BlockedUsersScreen })));
// E16 (2026-09-06): the screens extracted from this file that sit OFF the boot
// path load on demand. Each is wrapped in its own Suspense so the render
// sites below stay one-liners; ScreenLoading is a hoisted declaration.
const lazyNamed = (loader, name) => React.lazy(() => loader().then(m => ({ default: m[name] })));
const withSuspense = (Comp, label = "Loading") => function LazyScreen(props) {
  // Boundary + Suspense together: a chunk that fails to load, or a screen
  // that throws, offers the way out (the app's own go-home event) instead of
  // a dead end. TabErrorBoundary is a hoisted class, used at render time.
  const exit = () => { try { window.dispatchEvent(new Event("biq:go-home")); } catch { /* no window */ } };
  return <TabErrorBoundary name={label} onExit={exit}><React.Suspense fallback={<ScreenLoading label={label} />}><Comp {...props} /></React.Suspense></TabErrorBoundary>;
};
const SettingsScreen = withSuspense(lazyNamed(() => import('./screens/SettingsScreen.jsx'), 'SettingsScreen'), "Loading settings");
const DailyReviewScreen = withSuspense(lazyNamed(() => import('./screens/ReviewScreens.jsx'), 'DailyReviewScreen'), "Loading review");
const PuzzleReviewScreen = withSuspense(lazyNamed(() => import('./screens/ReviewScreens.jsx'), 'PuzzleReviewScreen'), "Loading review");
const ClubQuizScreen = withSuspense(lazyNamed(() => import('./screens/ClubQuizScreen.jsx'), 'ClubQuizScreen'), "Loading clubs");
const PrivacyScreen = withSuspense(lazyNamed(() => import('./screens/PrivacyScreen.jsx'), 'PrivacyScreen'));
const StumpScreen = withSuspense(lazyNamed(() => import('./screens/StumpScreen.jsx'), 'StumpScreen'));
const LocalSetup = withSuspense(lazyNamed(() => import('./screens/LocalPlay.jsx'), 'LocalSetup'));
const LocalGameScreen = withSuspense(lazyNamed(() => import('./screens/LocalPlay.jsx'), 'LocalGameScreen'));
const LocalResults = withSuspense(lazyNamed(() => import('./screens/LocalPlay.jsx'), 'LocalResults'));
// Online multiplayer (~1700 lines) — only loads when a user goes online, never
// on the cold/first paint. Both entry points share the one chunk.
// Transfer Trail — lazy like the other full screens. Self-gating: the entry
// card and the route both resolve through getTrailAnswer(), which returns
// null while TRAIL_ANSWER_LOG is empty, so this renders NOTHING until the
// spot-checked dataset lands. Wiring inert beats wiring half-done.
const TransferTrail = React.lazy(() => import('./screens/TransferTrail.jsx'));
const StadiumGame = React.lazy(() => import('./screens/StadiumGame.jsx'));
const MysteryPlayer = React.lazy(() => import('./screens/MysteryPlayer.jsx'));
const OnlineEntry = React.lazy(() => import('./screens/OnlineMultiplayer.jsx').then(m => ({ default: m.OnlineEntry })));
const MultiplayerLobby = React.lazy(() => import('./screens/OnlineMultiplayer.jsx').then(m => ({ default: m.MultiplayerLobby })));
import { DailyTabScreen } from './screens/DailyScreen.jsx';
import { HomeScreen } from './screens/HomeScreen.jsx';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style as StatusBarStyle } from '@capacitor/status-bar';
import { App as CapApp } from '@capacitor/app';
import { Share as CapShare } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';

// Sprint #98: local iOS plugin (ios/App/App/ShareCardPlugin.swift). Presents
// the share sheet with the card file + a per-target text item: the text is
// withheld from share extensions that reject text+image multi-item payloads
// (Snapchat fails to LAUNCH on those), and provided everywhere else
// (iMessage renders card + tappable challenge line). JS falls back to plain
// @capacitor/share file-only if this plugin is unavailable or throws.
const NativeShareCard = registerPlugin('ShareCard');

// Sprint #90 EEE1: cold-start instrumentation (toggle in ./lib/perf.js).
import { perfMark } from './lib/perf.js';
perfMark('module-load: App.jsx parsed');

export const TIMINGS = {
  TOAST_DURATION: 2500,
  STREAK_TOAST: 3500,
  ANSWER_REVEAL: 1500,
  AUTOCOMPLETE_DEBOUNCE: 60,
  ONLINE_SUBSCRIBE_TIMEOUT: 12000,
  ONLINE_ABANDON_GRACE: 60000,
  DAY_MS: 86400000,
  WORDLE_FLIP_MS: 280,
  SEEN_WINDOW_MS: 14 * 24 * 60 * 60 * 1000,
};


/** Screens where a rating ask must never appear: a question is live and its
 *  clock is running, so a modal blocks every control and costs the player the
 *  round. See screenRef / ratingAskAllowed in AppInner for why this is a
 *  deny-list. */
const RATING_ASK_BLOCKED = new Set(["quiz", "online-stage1", "online-stage1-lobby"]);
// Boot URL, snapshotted at module eval — i.e. before any component renders and
// therefore before any of AppInner's deep-link initializers replaceState the
// path/query away. Deep-link detection MUST read these rather than live
// window.location: those initializers strip the URL as a side effect, so a
// re-run of a later initializer (StrictMode double-invokes them) sees a
// different URL than the first run did. Snapshot once, read many.
const BOOT_PATH = (() => { try { return window.location.pathname; } catch { return "/"; } })();
const BOOT_SEARCH = (() => { try { return window.location.search; } catch { return ""; } })();

// Invite-code normalizer. Module-level so the deep-link deferral check and the
// pendingJoinCode initializer decide "is this a real code?" with ONE rule —
// they disagreed before, and /join/x deferred onboarding for a code that
// normalized to null (no gate, no auto-join, nothing staged).
const normalizeJoinCode = s => (s || "").toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g, "").slice(0, 6) || null;

// Deep-link onboarding deferral, module-scoped because BOOT_PATH is immutable
// and AppInner REMOUNTS (AppGate unmounts it whenever effectiveLoading flips —
// a guest signing in sets profileNotReady). Component-local state would re-arm
// the deferral from the same boot URL on every remount while the "staged screen
// was seen" ref reset to false, suppressing onboarding for the whole session.
// Spent-once + seen-across-remounts fixes both halves.
let bootDeferralSpent = false;
let bootStagedScreenSeen = false;



// V1.1: chaos default-difficulty normalization + QB_WC2026 / QB_CHAOS
// pre-bucketing moved into src/questions-loader.js, which performs them
// once when its async cache is first populated. The semantics are
// preserved (compute once, reuse forever) — just deferred to first
// loadQuestions() resolution. See questions-loader.js for context.

// ─── AUTOCOMPLETE POOL ────────────────────────────────────────────────────────
// Each entry: display name. Matching uses normalised (accent-stripped) comparison.
const AC_POOL = [
  // Players — full name + surname only
  "Andres Iniesta","Iniesta",
  "Mario Götze","Götze","Gotze",
  "Miroslav Klose","Klose",
  "Emiliano Martinez","Emiliano Martínez","Martinez",
  "Hugo Lloris","Lloris",
  "Zinedine Zidane","Zidane",
  "Cristiano Ronaldo","Ronaldo",
  "Lionel Messi","Messi",
  "Kylian Mbappe","Kylian Mbappé","Mbappe","Mbappé",
  "Ronaldinho",
  "Pele","Pelé",
  "Diego Maradona","Maradona",
  "David Beckham","Beckham",
  "Erling Haaland","Haaland",
  "Robert Lewandowski","Lewandowski",
  "Karim Benzema","Benzema",
  "Luka Modric","Modric","Modrić",
  "Mohamed Salah","Salah",
  "Neymar",
  "Harry Kane","Kane",
  "Vinicius Jr","Vinicius",
  "Victor Osimhen","Osimhen",
  "Divock Origi","Origi",
  "Georginio Wijnaldum","Wijnaldum",
  "Teddy Sheringham","Sheringham",
  "Ole Gunnar Solskjaer","Solskjaer","Solskjær",
  "Alan Shearer","Shearer",
  "Sergio Aguero","Agüero","Aguero",
  "Wes Morgan",
  "Petr Cech","Petr Čech","Cech",
  "Thiago Silva",
  "David Trezeguet","Trezeguet",
  "Hakan Sukur","Hakan Şükür","Sukur",
  "Geoff Hurst","Hurst",
  "George Weah","Weah",
  "Johan Cruyff","Cruyff",
  "Pavel Nedved","Pavel Nedvěd","Nedved",
  "Michel Platini","Platini",
  "Lothar Matthaus","Lothar Matthäus","Matthaus",
  "Xabi Alonso","Alonso",
  "Thomas Muller","Thomas Müller","Muller",
  "Philipp Lahm","Lahm",
  "Manuel Neuer","Neuer",
  "Antoine Griezmann","Griezmann",
  "Paul Pogba","Pogba",
  "Didier Drogba","Drogba",
  "Brian Clough","Clough",
  "Antonio Conte","Conte",
  // Managers
  "Alex Ferguson","Ferguson",
  "Jurgen Klopp","Jürgen Klopp","Klopp",
  "Pep Guardiola","Guardiola",
  "Jose Mourinho","Mourinho",
  "Carlo Ancelotti","Ancelotti",
  "Claudio Ranieri","Ranieri",
  "Otto Rehhagel","Rehhagel",
  "Zlatko Dalic","Zlatko Dalić","Dalic",
  "Arsene Wenger","Wenger",
  "Sven Goran Eriksson","Eriksson",
  // Clubs
  "Barcelona","FC Barcelona","Real Madrid","Atletico Madrid","Manchester City","Manchester United",
  "Liverpool","Chelsea","Arsenal","Tottenham","Bayern Munich","Borussia Dortmund",
  "Bayer Leverkusen","Inter Milan","AC Milan","Juventus","Napoli","PSG","Ajax","Porto",
  // Cities / Stadiums
  "Istanbul","London","Madrid","Munich","Rome",
  "Signal Iduna Park","Anfield","Camp Nou","Bernabeu","Santiago Bernabeu","Old Trafford",
  // Countries
  "England","Spain","France","Germany","Italy","Brazil","Argentina","Portugal","Netherlands","Denmark","Greece","Croatia","Uruguay",
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
// Strip accents so é=e, ü=u, ă=a etc — English speakers aren't punished
export function norm(s) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Tags used to detect club clustering — maps keywords to a club tag
const CLUB_TAG = {
  liverpool:["liverpool","salah","klopp","slot","gerrard","fowler","origi","wijnaldum","dalglish"],
  manutd:["manchester united","man united","man utd","solskjær","sheringham","schmeichel","ferguson","cantona","beckham"],
  mancity:["manchester city","man city","aguero","guardiola","haaland","silva"],
  arsenal:["arsenal","wenger","henry","bergkamp","invincibles"],
  chelsea:["chelsea","mourinho","lampard","drogba","cech"],
  realmadrid:["real madrid","zidane","benzema","modric","bale","ramos"],
  barcelona:["barcelona","messi","xavi","iniesta","cruyff","guardiola"],
  bayern:["bayern","lewandowski","müller","muller","neuer","lahm"],
  leipzig:["leipzig","rb leipzig","rbl","red bull","werner","nagelsmann"],
  atalanta:["atalanta","bergamo","la dea","gasperini","lookman"],
  juventus:["juventus","juve","ronaldo","buffon","conte"],
};

function getClubTag(q) {
  const text = (q.q + (q.o ? q.o.join(" ") : "") + (q.typed_a || "")).toLowerCase();
  for (const [tag, keys] of Object.entries(CLUB_TAG)) {
    if (keys.some(k => text.includes(k))) return tag;
  }
  return null;
}

// ─── SEEN QUESTION HISTORY ────────────────────────────────────────────────────
// Tracks questions already shown to the user with a timestamp, and filters
// them out of future selections for 14 days. Stored as { "<histKey>": ts }
// under localStorage key "biq_seen_history_v2" (v1 was index-based, replaced
// when stable ids were added — old histories silently expire). Keys are
// namespaced by source:
//   - QB questions       → "q:<question id>"
//   - TF_STATEMENTS items → "tf:<question id>"
const SEEN_HISTORY_KEY = "biq_seen_history_v2";
const SEEN_WINDOW_MS = TIMINGS.SEEN_WINDOW_MS;
let _seenHistory = null; // { histKey: timestamp }

// Build a fast QB → index lookup once at module load
export const qbHistKey = (origQ) => (origQ && origQ.id ? `q:${origQ.id}` : null);

function _readSeenHistoryRaw() {
  try {
    if (typeof localStorage === "undefined") return {};
    const raw = localStorage.getItem(SEEN_HISTORY_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return (parsed && typeof parsed === "object" && !Array.isArray(parsed)) ? parsed : {};
  } catch { return {}; }
}
function _writeSeenHistoryRaw(obj) {
  try {
    if (typeof localStorage !== "undefined") localStorage.setItem(SEEN_HISTORY_KEY, JSON.stringify(obj));
  } catch {}
}

// Load + auto-prune entries older than the 14-day window
function loadSeenHistory() {
  const raw = _readSeenHistoryRaw();
  const cutoff = Date.now() - SEEN_WINDOW_MS;
  const cleaned = {};
  for (const k in raw) {
    const ts = Number(raw[k]);
    if (ts && ts >= cutoff) cleaned[k] = ts;
  }
  _seenHistory = cleaned;
  _writeSeenHistoryRaw(cleaned);
  return cleaned;
}
function getSeenHistory() {
  if (_seenHistory === null) loadSeenHistory();
  return _seenHistory;
}
function getSeenKeySet() {
  const hist = getSeenHistory();
  const cutoff = Date.now() - SEEN_WINDOW_MS;
  const set = new Set();
  for (const k in hist) {
    if (hist[k] >= cutoff) set.add(k);
  }
  return set;
}
// Filter originals (not clones) out of a pool when they've been seen recently.
// Falls back to the full pool if the filter would leave fewer than `needed`.
export function applySeenFilter(pool, needed, toKey) {
  const seen = getSeenKeySet();
  if (seen.size === 0) return pool;
  const hist = getSeenHistory();
  const fresh = [], stale = [];
  for (const q of pool) {
    const k = toKey(q);
    (!k || !seen.has(k) ? fresh : stale).push(q);
  }
  if (fresh.length >= needed) return fresh;
  // Pool exhausted — everything left was seen inside the 14-day window. Instead
  // of falling back to the WHOLE pool (which resurfaces recent questions at
  // random — the #1 cause of "I just saw this" in small categories/clubs),
  // keep the fresh ones and top up with the LEAST-recently-seen, so unavoidable
  // repeats are spaced as far apart as the pool allows. The generous top-up
  // still leaves the downstream diversity shuffle room to vary the order.
  if (import.meta.env.DEV) {
    console.log(`[seen] pool exhausted (${fresh.length}/${needed} fresh) — topping up with least-recently-seen`);
  }
  stale.sort((a, b) => (hist[toKey(a)] || 0) - (hist[toKey(b)] || 0));
  return [...fresh, ...stale.slice(0, Math.max(needed * 2, needed + 6))];
}
/**
 * How many of `pool` the player has NOT seen inside the 14-day window.
 *
 * ⚠️ applySeenFilter degrades correctly and SILENTLY — when it runs short it
 * tops up with the least-recently-seen rows, which is the right behaviour and
 * is also invisible. Measured 2026-08-24: 81 of 86 club packs hold under four
 * rounds' worth of eligible questions (Manchester United 24 against a
 * 10-question round; 43 packs under three rounds; 14 under two). So a fan who
 * plays their club twice starts getting repeats, and the app says nothing —
 * which reads as "this app has no questions" rather than "you have played most
 * of them", and those are very different feelings about the same fact.
 *
 * Read-only: no history is written, so asking is free.
 */
function countFreshQuestions(pool, toKey) {
  const seen = getSeenKeySet();
  if (seen.size === 0) return pool.length;
  let n = 0;
  for (const q of pool) {
    const k = toKey(q);
    if (!k || !seen.has(k)) n += 1;
  }
  return n;
}

/**
 * Tell the player once a day, per club, that they are into repeats.
 *
 * Once per club per DAY, not per session: a thin pack repeats on every session
 * from the third onward, and a toast on each one stops being information and
 * becomes nagging — which is the annoyance this release is supposed to remove,
 * not add.
 */
const PACK_THIN_KEY = 'biq_pack_thin_notice';
function shouldWarnPackThin(clubKey) {
  try {
    const raw = JSON.parse(localStorage.getItem(PACK_THIN_KEY) || '{}');
    const today = new Date().toISOString().slice(0, 10);
    if (raw[clubKey] === today) return false;
    // Prune other days so this cannot grow forever.
    const next = { [clubKey]: today };
    safeSetItem(PACK_THIN_KEY, JSON.stringify(next));
    return true;
  } catch { return false; }
}

export function recordSeenQuestions(questions) {
  if (!questions || !questions.length) return;
  const hist = getSeenHistory();
  const now = Date.now();
  for (const q of questions) {
    const k = q && q._histKey;
    if (k) hist[k] = now;
  }
  _seenHistory = hist;
  _writeSeenHistoryRaw(hist);
}
function clearSeenHistory() {
  _seenHistory = {};
  _writeSeenHistoryRaw({});
}

// Record a multiplayer round into the same 14-day seen history the solo modes
// use, so the next pick avoids it. Called by BOTH players, not just the host:
// hosting alternates across a rematch, so a host-only record would leave the
// new host picking blind against the round they just played. The rows here are
// the server's shape ({ id, prompt, options, correct }), not QB clones, so
// there is no `_histKey` to read — it is rebuilt from the id that
// pickMultiplayerQuestions deliberately sends along.
//
// Recorded at PLAY time rather than pick time: a lobby that never starts must
// not burn questions out of the pool.
export function recordMpQuestionsSeen(questions) {
  if (!Array.isArray(questions)) return;
  recordSeenQuestions(questions.map(q => ({ _histKey: q && q.id ? `q:${q.id}` : null })));
}


export async function getQs({ cat, tag, diff, onlyDiff, n = 10, ramp = false, includeLegends = false, noEasy = false, avoidConflicts = false }) {
  const { QB } = await loadQuestions();
  // Defensive: strip out any undefined entries that might exist from array holes
  let pool = QB.filter(q => q && typeof q === "object");
  // ⚠️ Retired packs are withheld from EVERY draw. Nulling TOPICAL_PACK removes
  // the tile, not the questions — they each carry a real `cat`, so without this
  // they keep arriving in Classic and category quizzes. See RETIRED_TAGS.
  pool = pool.filter(q => !q.tag || !RETIRED_TAGS.has(q.tag));
  // Phase 6c.1: gate cat:"Legends" by default. Legends-cat is the
  // "classic football" bucket spanning 1950s-2010s; casual modes
  // (Classic, Speed, Hot Streak, Daily 7, etc.) should feel modern.
  // Modes that want vintage allowed (Survival, comprehensive
  // assessments) opt in via includeLegends:true. Legends mode itself
  // bypasses the gate by passing cat:"Legends" — the cat-equality
  // check below the filter still selects only Legends entries.
  if (!includeLegends && cat !== "Legends") {
    pool = pool.filter(q => q.cat !== "Legends");
  }
  if (cat && cat !== "All") pool = pool.filter(q => q.cat === cat);
  // Topical packs select by TAG, not category, because a topical pack cuts
  // across categories by nature — the summer-2026 set spans WorldCup,
  // Transfers, Managers, PL, UCL and more. Filtering by cat could never
  // express "everything that happened this summer".
  if (tag) pool = pool.filter(q => q.tag === tag);
  // Club/league quizzes are for invested fans — drop "easy" (casual-obvious or
  // telegraphed) entirely. Only topic-scoped callers pass noEasy; general modes
  // (Classic, Daily 7, Survival, Hot Streak) keep the full easy→hard range.
  if (noEasy) pool = pool.filter(q => q.diff !== "easy");
  // onlyDiff is a HARD restriction, unlike `diff` — which is a ceiling, not a
  // floor (diff:"hard" means "the full range", not "hard questions only").
  // The topical pack needs the floor: a pack about the last few weeks is, for
  // an engaged audience, made of things they watched happen, so its headline
  // questions are not questions at all.
  if (onlyDiff) pool = pool.filter(q => q.diff === onlyDiff);
  // Honesty over silence: if a category has nothing to offer, return empty
  // so the caller can show a "not enough questions" toast. If we have some
  // but fewer than `n`, return the shuffled pool — better to play 7 real
  // Ligue 1 questions than a 10-pack secretly padded with other leagues.
  if (pool.length < 5) {
    return [];
  }
  // noEasy is authoritative: if a caller both drops easy AND was handed
  // diff:"easy" (e.g. a local-MP league topic where the Easy chip is still
  // selectable), do NOT then filter to easy-only — that empties the pool and
  // instantly ends the game. noEasy wins → the medium+hard pool stands.
  if (diff === "easy" && !noEasy) pool = pool.filter(q => q.diff === "easy" && (q.type === "mcq" || q.type === "tf"));
  else if (diff === "medium") pool = pool.filter(q => q.diff !== "hard");
  // Hide questions seen within the last 14 days; fall back to full pool if too few remain
  pool = applySeenFilter(pool, n, qbHistKey);
  // For hard + default: shuffle first so diversity filter samples evenly across all cats
  pool = shuffle(pool);
  // ⚠️ TOPICAL PACKS SHIPPED OUTSIDE EVERY LEAK GUARD. The club and league
  // draws call pickAvoidingConflicts directly (see launchClubQuiz /
  // launchLeagueQuiz); this path never did, so the Home-featured, NEW-badged
  // summer-2026 tile handed out a free point in 38.2% of ten-question sessions
  // — measured on the served pool by simulating SESSIONS, not questions.
  // Reordering here rather than selecting: passing pool.length returns the
  // whole pool with the non-conflicting rows first and the clashes appended,
  // so the ramp and diversity filters below still do their own jobs and a
  // session can never be shortened by the guard.
  if (avoidConflicts) pool = pickAvoidingConflicts(pool, pool.length, conflictsWith);
  if (diff === "hard") {
    // Weight toward hard but still shuffle — diversity filter picks from this shuffled pool
    const hard = pool.filter(q => q.diff === "hard");
    const rest = pool.filter(q => q.diff !== "hard");
    pool = [...hard, ...rest]; // hard first, but each group is pre-shuffled
  }

  // Difficulty ramp: for standard quiz, build easy→medium→hard arc
  if (ramp && n === 10) {
    const pick = (difficulty, count) => {
      const sub = shuffle(pool.filter(q => q.diff === difficulty && (q.type === "mcq" || q.type === "tf")));
      const picked = []; const usedC = {}; const usedCl = {};
      for (const q of sub) {
        if (picked.length >= count) break;
        const cc = usedC[q.cat] || 0; if (cc >= 2) continue;
        const cl = getClubTag(q); if (cl && (usedCl[cl] || 0) >= 1) continue;
        picked.push(q);
        usedC[q.cat] = cc + 1;
        if (cl) usedCl[cl] = (usedCl[cl] || 0) + 1;
      }
      return picked;
    };
    const easy = noEasy ? [] : pick("easy", 3);
    const med  = pick("medium", noEasy ? 6 : 4);
    const hard = pick("hard", noEasy ? 4 : 3);
    // Fill any gaps with whatever's available
    const got = [...easy, ...med, ...hard];
    if (got.length === 10) {
      // Shuffle only within same-difficulty groups so order stays easy→hard
      return [...shuffle(easy), ...shuffle(med), ...shuffle(hard)].map(q => {
        const histKey = qbHistKey(q);
        if (q.type !== "mcq" || !q.o) return { ...q, _histKey: histKey };
        const indices = [0,1,2,3].slice(0, q.o.length);
        const sh = shuffle(indices);
        return { ...q, o: sh.map(i => q.o[i]), a: sh.indexOf(q.a), _histKey: histKey };
      });
    }
    // Fallback to normal if not enough questions
  }

  // Diversity filter: max 1 per cat, max 1 per club tag, per game
  const selected = [];
  const usedCats = {};
  const usedClubs = {};
  const CAT_MAX = 2; // allow at most 2 from same category
  const CLUB_MAX = 1; // never more than 1 question heavily featuring same club

  for (const q of pool) {
    if (selected.length >= n) break;
    const catCount = usedCats[q.cat] || 0;
    if (catCount >= CAT_MAX) continue;
    const club = getClubTag(q);
    if (club && (usedClubs[club] || 0) >= CLUB_MAX) continue;
    selected.push(q);
    usedCats[q.cat] = catCount + 1;
    if (club) usedClubs[club] = (usedClubs[club] || 0) + 1;
  }

  // If diversity filter left us short, fill up without restriction
  if (selected.length < n) {
    const selectedSet = new Set(selected);
    for (const q of pool) {
      if (selected.length >= n) break;
      if (!selectedSet.has(q)) selected.push(q);
    }
  }

  // Shuffle options for each question so correct answer isn't always same position
  return shuffle(selected).map(q => {
    const histKey = qbHistKey(q);
    if (q.type !== "mcq" || !q.o) return { ...q, _histKey: histKey };
    const indices = [0,1,2,3].slice(0, q.o.length);
    const shuffled = shuffle(indices);
    return {
      ...q,
      o: shuffled.map(i => q.o[i]),
      a: shuffled.indexOf(q.a),
      _histKey: histKey,
    };
  });
}



// dateToYMD, keyForDate, dayIndexForDate extracted to ./lib/date.js
// (Sprint #14 Stage 2).


async function getDailyQsForDate(date) {
  const { QB } = await loadQuestions();
  // Selection lives in src/lib/quiz.js — pure and tested. It must depend on the
  // date and nothing else (the Daily 7 feeds /c/ challenge links and an OG card),
  // and the reasons why are documented there. We still RECORD into seen-history
  // via _histKey below — other modes consume it; the daily just never reads it.
  // Cached completions in biq_daily_<ymd> are unaffected. Option order below is
  // deliberately per-player random: it doesn't change WHICH seven you get.
  return pickDailyQuestions(QB, dayIndexForDate(date)).map(q => {
    const histKey = qbHistKey(q);
    const indices = [0,1,2,3].slice(0, q.o.length);
    const sh = shuffle(indices);
    return { ...q, o: sh.map(i => q.o[i]), a: sh.indexOf(q.a), _histKey: histKey };
  });
}
function getDailyQs() { return getDailyQsForDate(new Date()); }  // returns Promise (delegates to async)



async function getTrueFalseQs() {
  const { TF_STATEMENTS } = await loadQuestions();
  // Chaos questions are MCQ-shaped and don't suit the T/F format — explicitly
  // exclude any item tagged cat:"chaos" in case a chaos T/F statement ever
  // lands in TF_STATEMENTS in the future.
  const indexed = TF_STATEMENTS
    .map((s, i) => ({ ...s, _tfIdx: i }))
    .filter(s => s.cat !== "chaos");
  const keyFn = (s) => (s && s.id ? `tf:${s.id}` : null);
  const filtered = applySeenFilter(indexed, 20, keyFn);
  return shuffle(filtered).slice(0, 20).map(s => ({ ...s, _histKey: keyFn(s) }));
}



function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({length: m+1}, (_, i) => Array.from({length: n+1}, (_, j) => i === 0 ? j : j === 0 ? i : 0));
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++)
    dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}

export function checkTyped(input, question) {
  const v = norm(input);
  if (!v || v.length < 2) return false;
  const a = norm(question.typed_a);

  // Exact match
  if (v === a) return true;

  // Last name match — "iniesta" matches "andres iniesta"
  const parts = a.split(" ");
  if (parts.some(p => p === v && v.length >= 3)) return true;

  // Fuzzy match — allow 1 typo for short answers, 2 for longer
  const maxDist = a.length <= 5 ? 1 : 2;
  if (levenshtein(v, a) <= maxDist) return true;
  // Fuzzy match on last name
  if (parts.some(p => p.length >= 4 && levenshtein(v, p) <= 1)) return true;

  // Partial contains (at least 4 chars)
  if (a.includes(v) && v.length >= 4) return true;

  // Check aliases
  if (question.aliases) {
    for (const alias of question.aliases) {
      const na = norm(alias);
      if (v === na) return true;
      if (na.includes(v) && v.length >= 3) return true;
      if (levenshtein(v, na) <= 1) return true;
    }
  }
  return false;
}

export function getACSuggestions(val) {
  if (!val || val.length < 2) return [];
  const v = norm(val);
  // Match if any word in the pool entry starts with the typed value
  const matches = AC_POOL.filter(n => {
    const nn = norm(n);
    // starts with typed value
    if (nn.startsWith(v)) return true;
    // any word in name starts with typed value
    if (nn.split(" ").some(w => w.startsWith(v))) return true;
    return false;
  });
  // Dedupe display names (prefer accented version)
  const seen = new Set();
  const deduped = matches.filter(n => {
    const nn = norm(n);
    if (seen.has(nn)) return false;
    seen.add(nn);
    return true;
  });
  return deduped.slice(0, 5);
}

function generateCode() {
  // 6-character alphanumeric code, all uppercase. Big enough that collisions
  // inside the 24h cleanup window are negligible (~2.2bn possibilities).
  const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // I, O, 0, 1 omitted to dodge ambiguity
  let out = "";
  for (let i = 0; i < 6; i++) out += ALPHA.charAt(Math.floor(Math.random() * ALPHA.length));
  return out;
}

// V1 game-room helpers + schema doc were here. Removed in Stage 0 cleanup
// (the V1 game_rooms table was dropped in Phase H). Online multiplayer is
// now backed by SECURITY DEFINER RPCs (create_room, join_room, etc.) called
// directly from a useMultiplayerRoom hook. Stage 1F (1F.6 + 1F.7) deleted
// the V1 stub components (OnlineGame, MultiplayerComingSoon) that were
// briefly kept around behind the ?stage1=1 gate.

export const LETTERS = ["A","B","C","D"];
export const CAT_LABELS = {
  WorldCup:"International", Euros:"Euros", UCL:"Champions League",
  PL:"Premier League", LaLiga:"La Liga", Bundesliga:"Bundesliga",
  SerieA:"Serie A", Ligue1:"Ligue 1", SuperLig:"Süper Lig", Primeira:"Primeira Liga",
  Managers:"Managers", Records:"Records & Icons",
  Legends:"Legends & History", Transfers:"Transfers",
  // ⚠️ DISPLAY LABEL ONLY — DO NOT RENAME THE `cat` VALUE ITSELF. Club-quiz
  // questions are tagged cat:"ClubQuiz" (see the club-quiz session builder),
  // and .q-tag uppercases whatever it is given, so the chip above every
  // club-quiz question read "CLUBQUIZ" — a raw internal token shipped as UI
  // copy on the most-played long-tail mode. The same string is also the KEY
  // that catStats aggregates per-category accuracy under, so changing the
  // literal would silently orphan every club-quiz stat a player has already
  // accumulated. Fix the label, never the key.
  ClubQuiz:"Club Quiz", LeagueQuiz:"League Quiz"
};
const CATS = ["All","WorldCup","Euros","UCL","PL","LaLiga","Bundesliga","SerieA","Ligue1","Transfers","Managers","Records","Legends"];



// ─── CSS ──────────────────────────────────────────────────────────────────────



// ─── CLUB QUIZ PACKS (Pro feature — starter content) ────────────────────────
// Maps each club-pack key to its canonical `club` value in the question bank, so
// the club quiz serves our fact-checked, hint-bearing QB questions whenever we
// have >=10 for that club — auto-upgrading each club as content is generated —
// and falls back to the pack's starter questions otherwise.
export const CLUB_PACK_TO_QB = {
  // ── Wave O (2026-08-23): ten clubs that already had a live /quiz/<slug>/
  // page and 15-20 verified bank rows, but no entry in ANY of these four maps.
  // The landing pages therefore shipped a "Play the full <club> quiz →" button
  // that resolved to nothing and dumped the reader on Home with ?club= already
  // stripped from the URL — 60 dead links across 10 pages, measured against
  // the built output. They were never missing content, only missing wiring.
  // Bank names are the canonical long forms (see club-alias.mjs).
  Birmingham: "Birmingham City", Cardiff: "Cardiff City", Derby: "Derby County",
  Norwich: "Norwich City", Portsmouth: "Portsmouth", SheffWed: "Sheffield Wednesday",
  Middlesbrough: "Middlesbrough", WestBrom: "West Brom", SheffUtd: "Sheffield United", Blackburn: "Blackburn Rovers",
  Southampton: "Southampton", Stoke: "Stoke City", Swansea: "Swansea City",
  Wrexham: "Wrexham",
  Leipzig: "RB Leipzig",
  Atalanta: "Atalanta",
  Boca: "Boca Juniors",
  River: "River Plate",
  Flamengo: "Flamengo",
  Palmeiras: "Palmeiras",
  Corinthians: "Corinthians",
  Arsenal: "Arsenal", Liverpool: "Liverpool", ManUtd: "Manchester United", ManCity: "Manchester City",
  Chelsea: "Chelsea", Tottenham: "Tottenham Hotspur", Newcastle: "Newcastle United",
  Barcelona: "Barcelona", RealMadrid: "Real Madrid", BayernMunich: "Bayern Munich",
  Juventus: "Juventus", AcMilan: "AC Milan", Atletico: "Atlético Madrid", Dortmund: "Borussia Dortmund",
  PSG: "Paris Saint-Germain", InterMilan: "Inter Milan", Ajax: "Ajax",
  Napoli: "Napoli", Galatasaray: "Galatasaray", Benfica: "Benfica",
  Fenerbahce: "Fenerbahçe", Porto: "Porto", Roma: "Roma",
  Celtic: "Celtic", Rangers: "Rangers", Marseille: "Marseille",
  Feyenoord: "Feyenoord", PSV: "PSV", Anderlecht: "Anderlecht",
  Besiktas: "Besiktas", Trabzonspor: "Trabzonspor", ClubBrugge: "Club Brugge",
  RedStar: "Red Star Belgrade", DinamoZagreb: "Dinamo Zagreb", Hajduk: "Hajduk Split", Basel: "Basel",
  Forest: "Nottingham Forest", Villa: "Aston Villa", Everton: "Everton",
  Leeds: "Leeds United", WestHam: "West Ham", Leicester: "Leicester City", Olympiacos: "Olympiacos", Panathinaikos: "Panathinaikos",
  Sunderland: "Sunderland", Ipswich: "Ipswich Town", Palace: "Crystal Palace", Fulham: "Fulham", Brighton: "Brighton",
  Bournemouth: "Bournemouth", Brentford: "Brentford", Burnley: "Burnley", Wolves: "Wolves",
  Coventry: "Coventry City", HullCity: "Hull City",
  Athletic: "Athletic Bilbao", Sevilla: "Sevilla", Betis: "Real Betis",
  // Wave N — two at a time from here on, so the curate step actually gets read.
  Santos: "Santos", RealSociedad: "Real Sociedad",
  Schalke: "Schalke 04", Hamburg: "Hamburger SV",
  Fiorentina: "Fiorentina", Lazio: "Lazio", Torino: "Torino",
  Sporting: "Sporting CP", SaintEtienne: "Saint-Étienne",
  Valencia: "Valencia", Leverkusen: "Bayer Leverkusen", Lyon: "Olympique Lyonnais",
  Parma: "Parma", Monaco: "AS Monaco",
};

// Club -> COUNTRY, and the order they appear inside it.
//
// ⚠️ ORDER IS DELIBERATE AND LOAD-BEARING. The picker previews only the
// first CLUB_PREVIEW (2) clubs per section, so whatever leads each country is
// effectively the whole section until someone taps "Show all". It used to be
// CLUB_PACKS insertion order, which is why adding ten clubs on 2026-08-23 put
// Birmingham and Cardiff above Arsenal and Liverpool — the newest rows, not
// the ones anyone came looking for. Ordered by who a fan opening this screen
// is most likely to want; adding a club appends rather than displaces.
export const CLUB_LEAGUES = {
  Arsenal: "england", ManUtd: "england", Liverpool: "england", ManCity: "england",
  Chelsea: "england", Tottenham: "england", Newcastle: "england", Everton: "england",
  Villa: "england", WestHam: "england", Forest: "england", Leeds: "england", Leicester: "england",
  // ⚠️ EXPLICIT, not left to fall through. `CLUB_LEAGUES[key] || "other"`
  // at the call site made an entry here look optional — it is not:
  // club-sections.test.js asserts every CLUB_PACKS key has a country, and
  // Greece has no section of its own, so "other" ("More clubs") is the
  // deliberate home, same as Red Star and Basel.
  Olympiacos: "other",
  Panathinaikos: "other",
  Palace: "england", Fulham: "england", Brighton: "england", Bournemouth: "england",
  Brentford: "england", Sunderland: "england", Ipswich: "england", Wolves: "england",
  Burnley: "england", Southampton: "england", Norwich: "england", Derby: "england",
  Middlesbrough: "england", WestBrom: "england", SheffUtd: "england", Blackburn: "england",
  Stoke: "england", Birmingham: "england", SheffWed: "england", Coventry: "england",
  HullCity: "england", Portsmouth: "england", Cardiff: "england", Swansea: "england",
  Wrexham: "england",
  RealMadrid: "spain", Barcelona: "spain", Atletico: "spain", Sevilla: "spain",
  Valencia: "spain", Athletic: "spain", Betis: "spain", RealSociedad: "spain",
  Juventus: "italy", AcMilan: "italy", InterMilan: "italy", Napoli: "italy",
  Roma: "italy", Lazio: "italy", Atalanta: "italy", Fiorentina: "italy",
  Torino: "italy", Parma: "italy",
  BayernMunich: "germany", Dortmund: "germany", Leverkusen: "germany", Leipzig: "germany",
  Schalke: "germany", Hamburg: "germany",
  PSG: "france", Marseille: "france", Lyon: "france", Monaco: "france",
  SaintEtienne: "france",
  Benfica: "portugal", Porto: "portugal", Sporting: "portugal",
  Ajax: "netherlands", PSV: "netherlands", Feyenoord: "netherlands",
  Galatasaray: "turkiye", Fenerbahce: "turkiye", Besiktas: "turkiye", Trabzonspor: "turkiye",
  Celtic: "scotland", Rangers: "scotland",
  Anderlecht: "belgium", ClubBrugge: "belgium",
  DinamoZagreb: "croatia", Hajduk: "croatia",
  Flamengo: "brazil", Palmeiras: "brazil", Corinthians: "brazil", Santos: "brazil",
  Boca: "argentina", River: "argentina",
  RedStar: "other", Basel: "other",
};
// Position within a country, from the order above. Unknown keys sort last so a
// club added to CLUB_PACKS but not here still renders instead of vanishing.
export const CLUB_ORDER = Object.fromEntries(Object.values({"england": ["Arsenal", "ManUtd", "Liverpool", "ManCity", "Chelsea", "Tottenham", "Newcastle", "Everton", "Villa", "WestHam", "Forest", "Leeds", "Palace", "Fulham", "Brighton", "Bournemouth", "Brentford", "Sunderland", "Ipswich", "Wolves", "Burnley", "Southampton", "Leicester", "Norwich", "Derby", "Stoke", "Birmingham", "SheffWed", "Coventry", "HullCity", "Portsmouth", "Cardiff", "Swansea", "Wrexham", "Middlesbrough", "WestBrom", "SheffUtd", "Blackburn"], "spain": ["RealMadrid", "Barcelona", "Atletico", "Sevilla", "Valencia", "Athletic", "Betis", "RealSociedad"], "italy": ["Juventus", "AcMilan", "InterMilan", "Napoli", "Roma", "Lazio", "Atalanta", "Fiorentina", "Torino", "Parma"], "germany": ["BayernMunich", "Dortmund", "Leverkusen", "Leipzig", "Schalke", "Hamburg"], "france": ["PSG", "Marseille", "Lyon", "Monaco", "SaintEtienne"], "portugal": ["Benfica", "Porto", "Sporting"], "netherlands": ["Ajax", "PSV", "Feyenoord"], "turkiye": ["Galatasaray", "Fenerbahce", "Besiktas", "Trabzonspor"], "scotland": ["Celtic", "Rangers"], "belgium": ["Anderlecht", "ClubBrugge"], "croatia": ["DinamoZagreb", "Hajduk"], "brazil": ["Flamengo", "Palmeiras", "Corinthians", "Santos"], "argentina": ["Boca", "River"], "other": ["RedStar", "Basel", "Olympiacos", "Panathinaikos"]}).flat().map((k, i) => [k, i]));
export const CLUB_LEAGUE_SECTIONS = [
  // ── SECTIONS ARE COUNTRIES, NOT LEAGUES ────────────────────────────────────
  // Alex, 2026-08-23, on seeing Birmingham and Cardiff heading the Premier
  // League list: "they are not even in the premier league? ... maybe we should
  // categorize by country instead?"
  //
  // Right on both counts. League membership changes every May, so a league
  // label is a fact with an expiry date — which is exactly how this list ended
  // up asserting that Birmingham and Cardiff are Premier League clubs, and why
  // Burnley and Wolves sat under "pl" beneath a comment admitting they are in
  // the Championship. A club's COUNTRY does not change, so these labels cannot
  // rot and never need re-verifying against a season we cannot see.
  //
  // ⚠️ TWO CLUBS DO NOT PLAY IN THEIR OWN COUNTRY'S LEAGUE, and pretending
  // otherwise would trade one wrong label for another:
  //   · Cardiff, Swansea and Wrexham are WELSH clubs in the English pyramid —
  //     hence "England & Wales" rather than "England". Calling Wrexham English
  //     is exactly the kind of error this change exists to stop.
  //   · Monaco is Monégasque, not French. It sits under France because it
  //     plays in Ligue 1 and every fan discusses it as a Ligue 1 club; the
  //     alternative is a section of one, which serves nobody.
  { key: "england", label: "England & Wales" },
  { key: "spain", label: "Spain" },
  { key: "italy", label: "Italy" },
  { key: "germany", label: "Germany" },
  { key: "france", label: "France" },
  { key: "portugal", label: "Portugal" },
  { key: "netherlands", label: "Netherlands" },
  { key: "turkiye", label: "Türkiye" },
  { key: "scotland", label: "Scotland" },
  { key: "belgium", label: "Belgium" },
  { key: "croatia", label: "Croatia" },
  { key: "brazil", label: "Brazil" },
  { key: "argentina", label: "Argentina" },
  // Same 2+ rule the old list used: a country gets a section once it has two
  // clubs. Red Star (Serbia) and Basel (Switzerland) are still singletons.
  { key: "other", label: "More clubs" },
];

// Colour-code helpers for the club rows (no crests — the club colour IS the identity).
export function clubInitials(name) {
  const w = String(name).trim().split(/\s+/);
  return (w.length === 1 ? w[0].slice(0, 3) : w.map(x => x[0]).join("")).slice(0, 3).toUpperCase();
}
export function clubHexToRgba(hex, a) {
  const h = String(hex).replace("#", "");
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}
export function clubReadableText(hex) {
  const h = String(hex).replace("#", "");
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? "var(--bg)" : "#ffffff";
}

// Broadcast/club-recognised short codes for the row swatches (MUN, FCB, BVB, …),
// not raw initials. Falls back to clubInitials() for any unmapped key.
export const CLUB_ABBR = {
  Leipzig: "RBL",
  Atalanta: "ATA",
  Boca: "BOC",
  River: "RIV",
  Flamengo: "FLA",
  Palmeiras: "PAL",
  Corinthians: "COR",
  Santos: "SAN", RealSociedad: "RSO",
  Arsenal: "ARS", Liverpool: "LIV", ManUtd: "MUN", ManCity: "MCI", Chelsea: "CHE", Tottenham: "TOT", Newcastle: "NEW",
  Barcelona: "FCB", RealMadrid: "RMA", Atletico: "ATM",
  Juventus: "JUV", AcMilan: "ACM", InterMilan: "INT",
  BayernMunich: "BAY", Dortmund: "BVB",
  PSG: "PSG", Ajax: "AJA",
  Napoli: "NAP", Galatasaray: "GAL", Benfica: "SLB",
  Fenerbahce: "FEN", Porto: "POR", Roma: "ROM",
  Celtic: "CEL", Rangers: "RAN", Marseille: "OM",
  Feyenoord: "FEY", PSV: "PSV", Anderlecht: "RSCA",
  Besiktas: "BJK", Trabzonspor: "TS", ClubBrugge: "CLU",
  RedStar: "CZ", DinamoZagreb: "DIN", Hajduk: "HAJ", Basel: "BAS",
  Forest: "NFO", Villa: "AVL", Everton: "EVE", Leeds: "LEE", WestHam: "WHU", Leicester: "LEI", Olympiacos: "OLY", Panathinaikos: "PAO",
  Sunderland: "SUN", Ipswich: "IPS", Palace: "CRY", Fulham: "FUL", Brighton: "BHA",
  Middlesbrough: "MID", WestBrom: "WBA", SheffUtd: "SHU", Blackburn: "BLA",
  Bournemouth: "BOU", Brentford: "BRE", Burnley: "BUR", Wolves: "WOL",
  Coventry: "COV", HullCity: "HUL",
  Athletic: "ATH", Sevilla: "SEV", Betis: "BET", Schalke: "S04", Hamburg: "HSV",
  Fiorentina: "FIO", Lazio: "LAZ", Torino: "TOR", Sporting: "SCP", SaintEtienne: "ASSE",
  Valencia: "VAL", Leverkusen: "B04", Lyon: "OL", Parma: "PAR", Monaco: "ASM",
};

// SEO deep-links: /play?club=<slug> and /play?quiz=<league-slug> land a
// searcher IN the quiz they Googled (the club/league landing pages' CTAs emit
// these — see scripts/gen-seo-pages.mjs ctaBlock). Slugs match scripts/seo.
const CLUB_SLUG_TO_PACK = {
  // Wave O — the ten slugs whose landing pages linked here and found nothing.
  "birmingham-city": "Birmingham", "cardiff-city": "Cardiff",
  "derby-county": "Derby", "norwich-city": "Norwich", "portsmouth": "Portsmouth",
  "middlesbrough": "Middlesbrough", "west-brom": "WestBrom", "sheffield-united": "SheffUtd", "blackburn-rovers": "Blackburn",
  "sheffield-wednesday": "SheffWed", "southampton": "Southampton",
  "stoke-city": "Stoke", "swansea-city": "Swansea", "wrexham": "Wrexham",
  "rb-leipzig": "Leipzig",
  "atalanta": "Atalanta",
  "boca-juniors": "Boca",
  "river-plate": "River",
  "flamengo": "Flamengo",
  "palmeiras": "Palmeiras",
  "corinthians": "Corinthians",
  "santos": "Santos", "real-sociedad": "RealSociedad",
  "arsenal": "Arsenal", "liverpool": "Liverpool", "manchester-united": "ManUtd",
  "manchester-city": "ManCity", "chelsea": "Chelsea", "tottenham": "Tottenham",
  "newcastle": "Newcastle", "barcelona": "Barcelona", "real-madrid": "RealMadrid",
  "atletico-madrid": "Atletico", "bayern-munich": "BayernMunich",
  "borussia-dortmund": "Dortmund", "psg": "PSG", "inter-milan": "InterMilan",
  "juventus": "Juventus", "ac-milan": "AcMilan", "ajax": "Ajax",
  "napoli": "Napoli", "galatasaray": "Galatasaray", "benfica": "Benfica",
  "fenerbahce": "Fenerbahce", "porto": "Porto", "roma": "Roma",
  "celtic": "Celtic", "rangers": "Rangers", "marseille": "Marseille",
  "feyenoord": "Feyenoord", "psv": "PSV", "anderlecht": "Anderlecht",
  "besiktas": "Besiktas", "trabzonspor": "Trabzonspor", "club-brugge": "ClubBrugge",
  "red-star-belgrade": "RedStar", "dinamo-zagreb": "DinamoZagreb", "hajduk-split": "Hajduk", "basel": "Basel",
  "nottingham-forest": "Forest", "aston-villa": "Villa", "everton": "Everton",
  "leeds-united": "Leeds", "west-ham": "WestHam", "leicester-city": "Leicester", "olympiacos": "Olympiacos", "panathinaikos": "Panathinaikos",
  "sunderland": "Sunderland", "ipswich": "Ipswich", "crystal-palace": "Palace", "fulham": "Fulham", "brighton": "Brighton",
  "bournemouth": "Bournemouth", "brentford": "Brentford", "burnley": "Burnley", "wolves": "Wolves",
  "coventry": "Coventry", "hull-city": "HullCity",
  "athletic-bilbao": "Athletic", "sevilla": "Sevilla", "real-betis": "Betis",
  "schalke-04": "Schalke", "hamburger-sv": "Hamburg",
  "fiorentina": "Fiorentina", "lazio": "Lazio", "torino": "Torino",
  "sporting-cp": "Sporting", "saint-etienne": "SaintEtienne",
  "valencia": "Valencia", "bayer-leverkusen": "Leverkusen", "lyon": "Lyon",
  "parma": "Parma", "monaco": "Monaco",
};
const QUIZ_SLUG_TO_CAT = {
  "premier-league": "PL", "la-liga": "LaLiga", "serie-a": "SerieA",
  "bundesliga": "Bundesliga", "ligue-1": "Ligue1",
  "super-lig": "SuperLig", "primeira-liga": "Primeira",
  "champions-league": "UCL", "world-cup": "WorldCup", "euros": "Euros",
  // The three theme pages whose CTA pointed at a slug this map did not carry.
  "legends": "Legends", "managers": "Managers", "football-records": "Records",
};
// Reverse maps for share deep-links (opportunity-scan #1): a club/league quiz
// result should link the recipient back into THAT quiz (/play?club=… /
// ?quiz=…), not the marketing homepage — the boot routing above already
// handles these params; shares just never used them.
export const PACK_TO_CLUB_SLUG = Object.fromEntries(Object.entries(CLUB_SLUG_TO_PACK).map(([s, k]) => [k, s]));

export const CAT_TO_QUIZ_SLUG = Object.fromEntries(Object.entries(QUIZ_SLUG_TO_CAT).map(([s, c]) => [c, s]));

// ─── LEAGUE QUIZ (competition picker) ────────────────────────────────────────
// Solo single-competition quizzes. Unlike the club quiz (which re-tags rows as
// cat:"ClubQuiz"), league-quiz questions KEEP their real cat, so every answer
// feeds the matching competition rating on the Ball IQ card (EPL/UCL/INT/…).
const LEAGUE_QUIZ_SECTIONS = [
  { label: "Leagues", items: [
    { cat: "PL",         name: "Premier League",   abbr: "EPL", color: "#3D195B" },
    { cat: "LaLiga",     name: "La Liga",          abbr: "LAL", color: "#EE8707" },
    { cat: "SerieA",     name: "Serie A",          abbr: "SEA", color: "#0578D3" },
    { cat: "Bundesliga", name: "Bundesliga",       abbr: "BUN", color: "#D20515" },
    { cat: "Ligue1",     name: "Ligue 1",          abbr: "L1",  color: "#1B2447" },
    { cat: "SuperLig",   name: "Süper Lig",        abbr: "TSL", color: "#E30A17" },
    { cat: "Primeira",   name: "Primeira Liga",    abbr: "PRI", color: "#046A38" },
  ]},
  { label: "Tournaments", items: [
    { cat: "UCL",      name: "Champions League", abbr: "UCL", color: "#123A8F" },
    { cat: "WorldCup", name: "International",     abbr: "INT", color: "#8A6D1B" },
    { cat: "Euros",    name: "Euros",            abbr: "EUR", color: "#1F6FB2" },
  ]},
  // ── Themes (2026-08-23). Not competitions, but the picker is the only place
  // a category-sized pool can be chosen, and these three were unreachable from
  // it: /quiz/legends/, /quiz/managers/ and /quiz/football-records/ are live,
  // indexed pages whose CTA emits ?quiz=<slug>, and QUIZ_SLUG_TO_CAT had no
  // entry for any of them — so the button resolved to nothing. Same
  // reachability class as the 135 orphaned Champions League questions: the
  // content was never missing, only the route to it. Pools are large (Legends
  // 575, Records 519, Managers 425 medium+hard), so these are among the
  // deepest quizzes in the app, not filler.
  { label: "Themes", items: [
    { cat: "Legends",  name: "Legends",          abbr: "LEG", color: "#A67C00" },
    { cat: "Managers", name: "Managers",         abbr: "MGR", color: "#37474F" },
    { cat: "Records",  name: "Records",          abbr: "REC", color: "#6A1B9A" },
  ]},
];
export const LEAGUE_QUIZ_BY_CAT = Object.fromEntries(LEAGUE_QUIZ_SECTIONS.flatMap(s => s.items.map(i => [i.cat, i])));

export const CLUB_PACKS = {
  Leipzig: {
    name: "RB Leipzig", icon: "🐂", color: "#DD0741",
    questions: [],
  },
  Atalanta: {
    name: "Atalanta", icon: "⚫", color: "#1D71B8",
    questions: [],
  },
  Boca: {
    name: "Boca Juniors", icon: "🔵", color: "#0A2B72",
    questions: [],
  },
  River: {
    name: "River Plate", icon: "⚪", color: "#E1122E",
    questions: [],
  },
  Flamengo: {
    name: "Flamengo", icon: "🔴", color: "#C52613",
    questions: [],
  },
  Palmeiras: {
    name: "Palmeiras", icon: "🟢", color: "#006437",
    questions: [],
  },
  Corinthians: {
    name: "Corinthians", icon: "⬛", color: "#111111",
    questions: [],
  },
  Santos: {
    name: "Santos", icon: "⚪", color: "#0B0B0B",
    questions: [],
  },
  RealSociedad: {
    name: "Real Sociedad", icon: "🔵", color: "#0067B1",
    questions: [],
  },
  Arsenal: {
    name: "Arsenal", icon: "🔴", color: "#EF0107",
    questions: [
      { q:"In which year did Arsenal move from Highbury to the Emirates Stadium?", o:["2004","2005","2006","2007"], a:2, diff:"easy" },
      { q:"Who scored Arsenal's famous last-minute title-winning goal against Liverpool in 1989?", o:["Alan Smith","Paul Merson","Michael Thomas","Steve Bould"], a:2, diff:"medium" },
      { q:"Which Arsenal player scored 30 goals in a single Premier League season in 2004-05?", o:["Bergkamp","Pires","Henry","Ljungberg"], a:2, diff:"easy" },
      { q:"Who was Arsenal's goalkeeper during the Invincibles season of 2003-04?", o:["David Seaman","Jens Lehmann","Stuart Taylor","Manuel Almunia"], a:1, diff:"medium" },
      { q:"How many league titles did Arsène Wenger win with Arsenal?", o:["1","2","3","4"], a:2, diff:"medium" },
      { q:"Which club did Arsenal sign Cesc Fàbregas from as a youth player?", o:["Real Madrid","Valencia","Villarreal","Barcelona"], a:3, diff:"hard" },
      { q:"What year did Arsenal last win the FA Cup before their 2014 victory?", o:["1993","2002","2003","2005"], a:3, diff:"hard" },
      { q:"Which Arsenal legend scored a hat-trick in the 2003 FA Cup final?", o:["Bergkamp","Ljungberg","Henry","Pires"], a:2, diff:"hard" },
      { q:"Who is Arsenal's all-time leading scorer in the Premier League?", o:["Ian Wright","Dennis Bergkamp","Henry","Robin van Persie"], a:2, diff:"easy" },
      { q:"Which manager preceded Arsène Wenger at Arsenal?", o:["Terry Neill","Don Howe","George Graham","Bruce Rioch"], a:3, diff:"medium" },
    ]
  },
  Liverpool: {
    name: "Liverpool", icon: "🔴", color: "#C8102E",
    questions: [
      { q:"How many times have Liverpool won the European Cup / Champions League?", o:["4","5","6","7"], a:2, diff:"easy" },
      { q:"Who scored Liverpool's famous solo goal against Manchester United in the 1996 FA Cup final?", o:["Collymore","McManaman","Barnes","Fowler"], a:1, diff:"hard" },
      { q:"In which year did Liverpool win their first ever Premier League title?", o:["2018","2019","2020","2021"], a:2, diff:"easy" },
      { q:"What is the name of Liverpool's famous home end?", o:["The Stretford End","The Kop","The Holte End","The Gwladys Street"], a:1, diff:"easy" },
      { q:"Which Liverpool player scored 32 Premier League goals in the 2013-14 season?", o:["Gerrard","Suárez","Sterling","Sturridge"], a:1, diff:"medium" },
      { q:"Who was Liverpool's top scorer in the 2019-20 title-winning season?", o:["Firmino","Mané","Salah","Henderson"], a:2, diff:"medium" },
      { q:"In which year did Liverpool win their first ever First Division title?", o:["1901","1906","1922","1947"], a:1, diff:"hard" },
      { q:"Which Liverpool manager won back-to-back league titles in 1976 and 1977?", o:["Bill Shankly","Bob Paisley","Joe Fagan","Kenny Dalglish"], a:1, diff:"medium" },
      { q:"Who scored the winning penalty for Liverpool in the 2022 FA Cup final shootout vs Chelsea?", o:["Salah","Van Dijk","Kelleher","Milner"], a:2, diff:"hard" },
    ]
  },
  ManUtd: {
    name: "Man United", icon: "🔴", color: "#DA291C",
    questions: [
      { q:"How many Premier League titles did Sir Alex Ferguson win with Manchester United?", o:["10","11","12","13"], a:3, diff:"medium" },
      { q:"Who scored United's second injury-time goal in the 1999 Champions League final?", o:["Sheringham","Cole","Solskjær","Scholes"], a:2, diff:"medium" },
      { q:"Which player did Manchester United sell to Real Madrid in 2009?", o:["Rooney","Ronaldo","Tevez","Berbatov"], a:1, diff:"easy" },
      { q:"In which year did Manchester United complete their historic treble?", o:["1997","1998","1999","2000"], a:2, diff:"easy" },
      { q:"Who is Manchester United's all-time record goalscorer?", o:["Bobby Charlton","Denis Law","Rooney","Giggs"], a:2, diff:"easy" },
      { q:"Which manager took over from David Moyes at Manchester United in 2014?", o:["Louis van Gaal","José Mourinho","Giggs","Phil Neville"], a:0, diff:"medium" },
      { q:"What is the capacity of Old Trafford approximately?", o:["65,000","72,000","74,000","76,000"], a:2, diff:"medium" },
      { q:"Who scored a hat-trick for United vs Porto in the 2009 Champions League?", o:["Tevez","Ronaldo","Rooney","Berbatov"], a:1, diff:"hard" },
      { q:"Which year did Eric Cantona join Manchester United?", o:["1991","1992","1993","1994"], a:1, diff:"medium" },
      { q:"Who captained Manchester United to FA Cup glory in 2016?", o:["Rooney","Carrick","Smalling","Blind"], a:0, diff:"hard" },
    ]
  },
  Barcelona: {
    name: "Barcelona", icon: "🔵", color: "#A50044",
    questions: [
      { q:"How many trebles has Barcelona won in their history?", o:["1","2","3","4"], a:2, diff:"medium" },
      { q:"Which Barcelona player won the 2010 and 2014 World Cup?", o:["Xavi","Iniesta","Puyol","Busquets"], a:1, diff:"easy" },
      { q:"In which year did Barcelona complete the first of their three trebles under Pep Guardiola?", o:["2008","2009","2010","2011"], a:1, diff:"medium" },
      { q:"Who scored Barcelona's crucial away goal vs Chelsea in the 2012 UCL semi-final?", o:["Messi","Busquets","Puyol","Iniesta"], a:0, diff:"hard" },
      { q:"Which club did Neymar leave to join Barcelona in 2013?", o:["Flamengo","Santos","Corinthians","Grêmio"], a:1, diff:"easy" },
      { q:"Who is Barcelona's all-time top scorer?", o:["Ronaldo","Kubala","César","Messi"], a:3, diff:"easy" },
      { q:"In which year did Johan Cruyff join Barcelona as a player?", o:["1971","1973","1975","1977"], a:1, diff:"hard" },
      { q:"What is the name of Barcelona's stadium?", o:["Bernabéu","Wanda Metropolitano","Camp Nou","Spotify Camp Nou"], a:3, diff:"easy" },
      { q:"Who managed Barcelona immediately before Pep Guardiola in 2008?", o:["Rijkaard","Van Gaal","Tito Vilanova","Luis Enrique"], a:0, diff:"medium" },
    ]
  },
  RealMadrid: {
    name: "Real Madrid", icon: "⚪", color: "#FFFFFF",
    questions: [
      { q:"How many Champions League titles has Real Madrid won in total?", o:["13","14","15","16"], a:2, diff:"easy" },
      { q:"Who scored Real Madrid's winning goal in the 2014 Champions League final vs Atletico?", o:["Benzema","Bale","Ramos","Modric"], a:2, diff:"medium" },
      { q:"Which year did Ronaldo join Real Madrid from Manchester United?", o:["2007","2008","2009","2010"], a:2, diff:"easy" },
      { q:"Who managed Real Madrid to three consecutive Champions League titles?", o:["Ancelotti","Mourinho","Benitez","Zidane"], a:3, diff:"easy" },
      { q:"What is Real Madrid's home stadium now officially called after renovation?", o:["Bernabéu Arena","Santiago Bernabéu","Estadio Real","Florentino Pérez Arena"], a:1, diff:"easy" },
      { q:"Which player scored for Real Madrid in five consecutive Champions League finals?", o:["Benzema","Bale","Ronaldo","Modric"], a:2, diff:"hard" },
      { q:"Who was Real Madrid's first Galáctico signing in 2000?", o:["Figo","Zidane","Ronaldo","Beckham"], a:0, diff:"medium" },
      { q:"How many La Liga titles did Zidane win as Real Madrid manager?", o:["1","2","3","0"], a:0, diff:"medium" },
      { q:"Which Real Madrid player was known as 'El Halcón' (The Falcon)?", o:["Ronaldo","Raúl","Morientes","Hierro"], a:1, diff:"hard" },
    ]
  },

  ManCity: {
    name: "Man City", icon: "🔵", color: "#6CABDD",
    questions: [
      { q:"In which year did Man City win their first Premier League title?", o:["2010","2011","2012","2013"], a:2, diff:"easy" },
      { q:"Who scored the famous 93:20 goal to win the 2012 Premier League title?", o:["Tevez","Balotelli","Silva","Agüero"], a:3, diff:"easy" },
      { q:"Which manager led Man City to their first Champions League title in 2023?", o:["Mancini","Pellegrini","Guardiola","Hughes"], a:2, diff:"easy" },
      { q:"How many Premier League titles did Man City win between 2011 and 2024?", o:["5","6","7","8"], a:3, diff:"medium" },
      { q:"Which player left Man City to join Barcelona in 2025 after breaking all scoring records?", o:["De Bruyne","Foden","Haaland","B. Silva"], a:2, diff:"medium" },
      { q:"Man City's Etihad Stadium is in which area of Manchester?", o:["Salford","Stretford","Eastlands","Old Trafford"], a:2, diff:"medium" },
      { q:"Which Man City player won the PFA Players' Player of the Year four times?", o:["Silva","Agüero","De Bruyne","Kompany"], a:2, diff:"hard" },
      { q:"Who was Man City's top scorer in the 2022-23 Champions League winning campaign?", o:["Foden","Gündoğan","De Bruyne","Haaland"], a:3, diff:"hard" },
      { q:"Man City completed an unprecedented domestic treble in which season?", o:["2018-19","2020-21","2022-23","2023-24"], a:2, diff:"medium" },
      { q:"Which Abu Dhabi group took over Man City in 2008?", o:["ADNOC","Mubadala","Abu Dhabi United Group","UAE Investment Fund"], a:2, diff:"hard" },
    ]
  },
  Chelsea: {
    name: "Chelsea", icon: "🔵", color: "#034694",
    questions: [
      { q:"Which Russian billionaire bought Chelsea in 2003?", o:["Abramovich","Prokhorov","Deripaska","Potanin"], a:0, diff:"easy" },
      { q:"Chelsea won their first Champions League in 2012 — who scored the winning penalty in the shootout?", o:["Lampard","Drogba","Torres","Mata"], a:0, diff:"medium" },
      { q:"Which manager led Chelsea to their first Premier League title in 2004-05?", o:["Ranieri","Mourinho","Ancelotti","Hiddink"], a:1, diff:"easy" },
      { q:"Didier Drogba scored how many Premier League goals for Chelsea?", o:["100","104","108","115"], a:2, diff:"hard" },
      { q:"Chelsea won the Champions League for a second time in 2021 — who managed them?", o:["Lampard","Sarri","Tuchel","Ancelotti"], a:2, diff:"easy" },
      { q:"Which Chelsea player won the PFA Young Player of the Year in 2022?", o:["Mount","Pulisic","Reece James","Mason Mount"], a:2, diff:"medium" },
      { q:"Chelsea's Stamford Bridge is in which part of London?", o:["East London","South London","West London","North London"], a:2, diff:"easy" },
      { q:"Who scored a famous last-minute goal for Chelsea vs Arsenal in the 1998 League Cup final?", o:["Zola","Vialli","Di Matteo","Wise"], a:1, diff:"hard" },
      { q:"Chelsea set a then-record of how many points in the 2004-05 Premier League season?", o:["91","93","95","97"], a:2, diff:"hard" },
      { q:"Which consortium took over Chelsea from Abramovich in 2022?", o:["Qatar Sports Investments","INEOS","BlueCo","PCP Capital Partners"], a:2, diff:"medium" },
    ]
  },
  BayernMunich: {
    name: "Bayern Munich", icon: "🔴", color: "#DC052D",
    questions: [
      { q:"How many Bundesliga titles have Bayern Munich won — the most in German football?", o:["28","30","32","34"], a:2, diff:"medium" },
      { q:"Bayern Munich won the Champions League in 2020 without losing a single game — who managed them?", o:["Kovač","Guardiola","Heynckes","Flick"], a:3, diff:"easy" },
      { q:"Which legendary striker scored 365 Bundesliga goals — an all-time record?", o:["Müller","Lewandowski","Rummenigge","Gerd Müller"], a:3, diff:"easy" },
      { q:"Bayern's famous treble season of 2012-13 was won under which manager?", o:["Guardiola","Flick","Heynckes","Ancelotti"], a:2, diff:"medium" },
      { q:"Bayern Munich's Allianz Arena opened in which year?", o:["2004","2005","2006","2007"], a:1, diff:"medium" },
      { q:"Who was Bayern Munich's captain when they won the 2013 Champions League final?", o:["Neuer","Lahm","Schweinsteiger","Robben"], a:1, diff:"medium" },
      { q:"Robert Lewandowski scored 41 Bundesliga goals in 2020-21 — whose record of 40 did he break?", o:["Rummenigge","Gerd Müller","Müller T","Klinsmann"], a:1, diff:"medium" },
      { q:"Bayern Munich were the first team in the 2019-20 UCL to beat Barcelona — what was the score?", o:["6-1","7-2","8-2","5-0"], a:2, diff:"easy" },
      { q:"Which player has won the most Bundesliga titles as a Bayern player?", o:["Lahm","Müller T","Neuer","Kahn"], a:1, diff:"hard" },
    ]
  },
  Juventus: {
    name: "Juventus", icon: "⚫", color: "#000000",
    questions: [
      { q:"How many consecutive Serie A titles did Juventus win from 2012 to 2020?", o:["7","8","9","10"], a:2, diff:"easy" },
      { q:"Which player scored the decisive penalty for Juventus in the 1996 Champions League final?", o:["Del Piero","Baggio","Vialli","Jugović"], a:3, diff:"hard" },
      { q:"Juventus's stadium is named after which sponsor?", o:["Pirelli","Allianz","Juventus Arena","Fiat"], a:1, diff:"easy" },
      { q:"Which manager won Juventus's historic nine consecutive Serie A titles?", o:["Lippi","Allegri then Conte","Conte then Allegri","Sarri"], a:2, diff:"medium" },
      { q:"Juventus's nickname 'La Vecchia Signora' means what?", o:["The Black and Whites","The Old Lady","The Turin Giants","The Zebras"], a:1, diff:"easy" },
      { q:"Alessandro Del Piero spent how many years at Juventus?", o:["17","18","19","20"], a:0, diff:"hard" },
      { q:"Juventus were stripped of two Serie A titles in 2006 due to which scandal?", o:["Doping","Calciopoli match-fixing","Financial irregularities","Fan violence"], a:1, diff:"medium" },
      { q:"Gianluigi Buffon made how many appearances for Juventus — a club record?", o:["576","626","676","726"], a:2, diff:"medium" },
      { q:"Juventus reached the Champions League final in 2015 and 2017 — who beat them both times?", o:["Real Madrid","Barcelona","Bayern Munich","Real Madrid in 2015, Madrid in 2017"], a:0, diff:"medium" },
    ]
  },
  AcMilan: {
    name: "AC Milan", icon: "🔴", color: "#FB090B",
    questions: [
      { q:"AC Milan was founded in 1899 by businessmen from which English city?", o:["London","Liverpool","Manchester","Nottingham"], a:3, diff:"hard" },
      { q:"Which legendary sweeper was AC Milan's captain for most of the 1980s and 1990s?", o:["Maldini","Costacurta","Baresi","Albertini"], a:2, diff:"medium" },
      { q:"AC Milan won back-to-back European Cups in which years under Arrigo Sacchi?", o:["1988 and 1989","1989 and 1990","1990 and 1991","1991 and 1992"], a:1, diff:"medium" },
      { q:"Paolo Maldini holds the record for most AC Milan appearances — approximately how many?", o:["802","868","902","952"], a:1, diff:"hard" },
      { q:"AC Milan's famous red and black kit — what do the colours officially represent?", o:["Fire and night","Red hell and black fear of opponents","The city's colours","Historical tradition"], a:1, diff:"hard" },
      { q:"AC Milan won the Champions League in 2007 — who did they beat in the final?", o:["Arsenal","Barcelona","Man Utd","Liverpool"], a:3, diff:"medium" },
      { q:"What is the name of the stadium shared by AC Milan and Inter Milan?", o:["Olimpico","Meazza / San Siro","Delle Alpi","Tardini"], a:1, diff:"easy" },
      { q:"AC Milan won the Serie A title in 2021-22 — ending an 11-year drought. Who was their standout forward?", o:["Ibrahimović","Giroud","Leão","Rebić"], a:2, diff:"medium" },
      { q:"Which two AC Milan managers each won two European Cups with the club — Nereo Rocco in the 1960s and which other legend decades later?", o:["Fabio Capello","Arrigo Sacchi","Carlo Ancelotti","Both Sacchi and Ancelotti"], a:3, cat:"UCL", diff:"hard", type:"mcq", hint:"Sacchi won in 1989 and 1990 with the Dutch trio; Ancelotti won in 2003 and 2007 with Kaká and Maldini.", v:1 },
    ]
  },
  Atletico: {
    name: "Atletico Madrid", icon: "🔴", color: "#CB3524",
    questions: [
      { q:"Who has managed Atletico Madrid since December 2011?", o:["Quique Flores","Rudi García","Diego Simeone","Emery"], a:2, diff:"easy" },
      { q:"Atletico Madrid won La Liga in 2013-14 — their first title in how many years?", o:["14","16","18","20"], a:2, diff:"medium" },
      { q:"Atletico Madrid's red and white striped kit was inspired by which English club?", o:["Arsenal","Liverpool","Sunderland","Southampton"], a:2, diff:"medium" },
      { q:"Which Atletico Madrid striker scored 274 La Liga goals — a club record?", o:["Forlan","Griezmann","Torres","Luis García"], a:1, diff:"hard" },
      { q:"Atletico Madrid reached the Champions League final in 2014 and 2016 — who beat them both times?", o:["Barcelona","Real Madrid","Bayern","PSG"], a:1, diff:"easy" },
      { q:"What is the name of Atletico Madrid's current stadium?", o:["Vicente Calderón","Bernabéu","Cívitas Metropolitano","Riazor"], a:2, diff:"medium" },
      { q:"Atletico Madrid won the Europa League in 2012, 2018 and which other year?", o:["2010","2016","2022","2024"], a:1, diff:"medium" },
      { q:"Fernando Torres left Atletico for Liverpool in 2007 — for a fee of how much?", o:["£20m","£25m","£30m","£35m"], a:1, diff:"hard" },
      { q:"Which Atletico player famously headed in a last-minute goal to take the 2014 UCL final to extra time?", o:["Diego Costa","Arda Turan","Godin","Filipe Luís"], a:2, diff:"medium" },
      { q:"Atletico's nickname is 'Los Colchoneros' — what does this mean in English?", o:["The Warriors","The Red and Whites","The Mattress Makers","The Defenders"], a:2, diff:"hard" },
    ]
  },
  Dortmund: {
    name: "Borussia Dortmund", icon: "🟡", color: "#FDE100",
    questions: [
      { q:"What are Borussia Dortmund's official club colours?", o:["Red and black","Yellow and black","Yellow and white","Black and white"], a:1, diff:"easy" },
      { q:"The famous Yellow Wall at Signal Iduna Park holds approximately how many standing fans?", o:["20,000","25,000","27,000","30,000"], a:2, diff:"medium" },
      { q:"Who managed Dortmund to back-to-back Bundesliga titles in 2011 and 2012?", o:["Favre","Tuchel","Klopp","Hitzfeld"], a:2, diff:"easy" },
      { q:"Dortmund reached the Champions League final in 2013 — who beat them in the all-German final?", o:["Schalke","Bayern Munich","Hamburg","Leverkusen"], a:1, diff:"easy" },
      { q:"Which player scored 23 Champions League goals for Dortmund before joining Man City in 2022?", o:["Reus","Götze","Lewandowski","Haaland"], a:3, diff:"easy" },
      { q:"Mario Götze left Dortmund for Bayern Munich in 2013 — how much did Bayern pay?", o:["£25m","£31m","£37m","£44m"], a:2, diff:"hard" },
      { q:"Dortmund's worst ever Bundesliga defeat was 0-12 — to which club in 1978?", o:["Bayern Munich","Hamburg","Schalke","Borussia Mönchengladbach"], a:3, diff:"hard" },
      { q:"Which Dortmund player scored the winning goal in the 2012 DFB-Pokal final vs Bayern?", o:["Reus","Lewandowski","Götze","Gündoğan"], a:2, diff:"hard" },
      { q:"Borussia Dortmund were founded in which year?", o:["1901","1905","1909","1912"], a:2, diff:"medium" },
      { q:"Dortmund reached the UCL final in 2024 — who beat them in Wembley?", o:["PSG","Man City","Bayern","Real Madrid"], a:3, diff:"easy" },
    ]
  },
  PSG: {
    name: "Paris Saint-Germain", icon: "🔵", color: "#003170",
    questions: [
      { q:"PSG were taken over by which country's investment group in 2011?", o:["UAE","Saudi Arabia","China","Qatar"], a:3, diff:"easy" },
      { q:"Which player became the world's most expensive transfer ever when PSG signed him in 2017?", o:["Neymar","Mbappé","Verratti","Cavani"], a:0, diff:"easy" },
      { q:"PSG won the 2024-25 Champions League — who did they beat in the final?", o:["Arsenal","Inter","Barcelona","Real Madrid"], a:1, diff:"easy" },
      { q:"Kylian Mbappé left PSG to join which club in 2024?", o:["Man City","Arsenal","Bayern Munich","Real Madrid"], a:3, diff:"easy" },
      { q:"PSG's Parc des Princes stadium is in which area of Paris?", o:["Montmartre","Marais","16th arrondissement","Boulogne"], a:2, diff:"medium" },
      { q:"Edinson Cavani scored how many goals for PSG — a club record?", o:["198","211","220","240"], a:2, diff:"hard" },
      { q:"PSG beat Barcelona 4-0 in the 2016-17 UCL group stage — who scored twice that night?", o:["Cavani","Di María","Verratti","Lucas Moura"], a:0, diff:"hard" },
      { q:"PSG won how many consecutive Ligue 1 titles between 2013 and 2023?", o:["7","8","9","10"], a:2, diff:"medium" },
      { q:"Who managed PSG when they won their first Champions League in 2024-25?", o:["Pochettino","Galtier","Enrique","Campos"], a:2, diff:"medium" },
    ]
  },
  InterMilan: {
    name: "Inter Milan", icon: "⚫", color: "#010E80",
    questions: [
      { q:"Inter Milan was founded in 1908 — why did they split from AC Milan?", o:["Financial reasons","They wanted more foreign players","A dispute over colours","The manager left"], a:1, diff:"medium" },
      { q:"Inter won the Champions League in 2010 as part of a treble — who managed them?", o:["Mancini","Lippi","Mourinho","Spalletti"], a:2, diff:"easy" },
      { q:"Which Inter player holds the record for most consecutive appearances in Serie A?", o:["Maldini","Zanetti","Facchetti","Baresi"], a:1, diff:"hard" },
      { q:"Inter's nickname 'La Beneamata' translates roughly to what?", o:["The Black and Blues","The Beloved One","The Great Inter","The Milan Giants"], a:1, diff:"medium" },
      { q:"Inter won the Serie A title in 2020-21 — ending Juventus's nine-year run. Who managed them?", o:["Mancini","Spalletti","Simone Inzaghi","Conte"], a:3, diff:"medium" },
      { q:"Inter reached the Champions League final in 2023 — who beat them?", o:["PSG","Bayern Munich","Real Madrid","Man City"], a:3, diff:"easy" },
      { q:"Which legendary player was Inter captain for nearly his entire career — 19 seasons?", o:["Facchetti","Mazzola","Zanetti","Cordoba"], a:2, diff:"hard" },
      { q:"Inter Milan and AC Milan share the San Siro stadium — what is its official name?", o:["Stadio Inter","Stadio Meazza","Stadio San Siro","Stadio di Milano"], a:1, diff:"medium" },
      { q:"Inter's 2023-24 Serie A title win — how many points did they finish with?", o:["86","89","92","94"], a:2, diff:"hard" },
      { q:"Which striker scored 30 Serie A goals for Inter in 2022-23?", o:["Džeko","L. Martínez","Lukaku","Sanchez"], a:1, diff:"medium" },
    ]
  },
  Ajax: {
    name: "Ajax", icon: "🔴", color: "#CC0000",
    questions: [
      { q:"Ajax won the Champions League in 1995 with a famous young squad — who managed them?", o:["Cruyff","Michels","Van Gaal","Koeman"], a:2, diff:"medium" },
      { q:"Which Ajax player became the world's most expensive teenager when he joined Juventus in 2019?", o:["Frenkie de Jong","Matthijs de Ligt","Hakim Ziyech","Donny van de Beek"], a:1, diff:"easy" },
      { q:"Ajax's ground is called the Johan Cruyff Arena — what was it called before 2018?", o:["Ajax Arena","Olympic Stadium","Amsterdam Arena","De Kuip"], a:2, diff:"medium" },
      { q:"Ajax knocked out Real Madrid in the 2018-19 Champions League — what was the score in the Bernabéu?", o:["2-1","3-1","4-1","3-2"], a:2, diff:"hard" },
      { q:"Johan Cruyff — Ajax's greatest ever player — won the European Cup with Ajax how many times as a player?", o:["2","3","4","5"], a:1, diff:"medium" },
      { q:"Ajax have produced players for many top clubs — which country provides most of their academy players?", o:["Suriname","Morocco","Netherlands","Ghana"], a:2, diff:"medium" },
      { q:"Ajax won four consecutive Dutch league titles from 2019 to 2022 — true or false?", o:["True","False — they only won three","False — they won two","False — another club won in 2021"], a:3, diff:"hard" },
      { q:"Which Ajax striker scored a hat-trick on his debut aged 17 in 2019?", o:["Brobbey","Bergwijn","Neres","Brian Brobbey"], a:3, diff:"hard" },
      { q:"Ajax's famous 3-4-3 system was developed by which legendary Dutch coach?", o:["Michels","Cruyff","Van Gaal","Kovacs"], a:0, diff:"medium" },
      { q:"How many times have Ajax won the European Cup or Champions League?", o:["3","4","5","6"], a:2, diff:"medium" },
    ]
  },
  Tottenham: {
    name: "Tottenham", icon: "⚪", color: "#132257",
    questions: [],
  },
  Newcastle: {
    name: "Newcastle", icon: "⚫", color: "#241F20",
    questions: [],
  },
  Napoli: {
    name: "Napoli", icon: "🔵", color: "#12A0D7",
    questions: [],
  },
  Galatasaray: {
    name: "Galatasaray", icon: "🟡", color: "#A90432",
    questions: [],
  },
  Benfica: {
    name: "Benfica", icon: "🔴", color: "#E32221",
    questions: [],
  },
  Fenerbahce: {
    name: "Fenerbahçe", icon: "🟡", color: "#163962",
    questions: [],
  },
  Porto: {
    name: "Porto", icon: "🔵", color: "#00428C",
    questions: [],
  },
  Roma: {
    name: "Roma", icon: "🔴", color: "#8E1F2F",
    questions: [],
  },
  Celtic: {
    name: "Celtic", icon: "🍀", color: "#018749",
    questions: [],
  },
  Rangers: {
    name: "Rangers", icon: "🔵", color: "#1B458F",
    questions: [],
  },
  Marseille: {
    name: "Marseille", icon: "⚪", color: "#2FAEE0",
    questions: [],
  },
  Feyenoord: {
    name: "Feyenoord", icon: "🔴", color: "#DA020E",
    questions: [],
  },
  PSV: {
    name: "PSV", icon: "🔴", color: "#ED1C24",
    questions: [],
  },
  Anderlecht: {
    name: "Anderlecht", icon: "🟣", color: "#52247F",
    questions: [],
  },
  Besiktas: {
    name: "Beşiktaş", icon: "🦅", color: "#000000",
    questions: [],
  },
  Trabzonspor: {
    name: "Trabzonspor", icon: "🌊", color: "#7B1E3C",
    questions: [],
  },
  ClubBrugge: {
    name: "Club Brugge", icon: "🔵", color: "#0A4595",
    questions: [],
  },
  RedStar: {
    name: "Red Star Belgrade", icon: "⭐", color: "#E4002B",
    questions: [],
  },
  DinamoZagreb: {
    name: "Dinamo Zagreb", icon: "🔵", color: "#1B458F",
    questions: [],
  },
  Hajduk: {
    name: "Hajduk Split", icon: "⚪", color: "#0E4C92",
    questions: [],
  },
  Basel: {
    name: "Basel", icon: "🔴", color: "#002D62",
    questions: [],
  },
  Forest: {
    name: "Nottingham Forest", icon: "🌳", color: "#E53233",
    questions: [],
  },
  Villa: {
    name: "Aston Villa", icon: "🦁", color: "#670E36",
    questions: [],
  },
  Everton: {
    name: "Everton", icon: "🔵", color: "#003399",
    questions: [],
  },
  Leeds: {
    name: "Leeds United", icon: "⚪", color: "#1D428A",
    questions: [],
  },
  Leicester: {
    name: "Leicester City", icon: "🦊", color: "#003090",
    questions: [],
  },
  Olympiacos: {
    name: "Olympiacos", icon: "🔴", color: "#DA020E",
    questions: [],
  },
  // 🍀 is the trifylli, the three-leaf clover on the badge since 1918 —
  // the club's own nickname, not a decorative pick.
  Panathinaikos: {
    name: "Panathinaikos", icon: "🍀", color: "#00614E",
    questions: [],
  },
  WestHam: {
    name: "West Ham", icon: "⚒️", color: "#7A263A",
    questions: [],
  },
  Sunderland: {
    name: "Sunderland", icon: "🔴", color: "#EB172B",
    questions: [],
  },
  Ipswich: {
    name: "Ipswich Town", icon: "🔵", color: "#3A64A3",
    questions: [],
  },
  Palace: {
    name: "Crystal Palace", icon: "🦅", color: "#1B458F",
    questions: [],
  },
  Fulham: {
    name: "Fulham", icon: "⚪", color: "#E6E6E6",
    questions: [],
  },
  Brighton: {
    name: "Brighton", icon: "🔵", color: "#0057B8",
    questions: [],
  },
  Bournemouth: {
    name: "Bournemouth", icon: "🍒", color: "#DA291C",
    questions: [],
  },
  Brentford: {
    name: "Brentford", icon: "🐝", color: "#E30613",
    questions: [],
  },
  Burnley: {
    name: "Burnley", icon: "🟣", color: "#6C1D45",
    questions: [],
  },
  Wolves: {
    name: "Wolves", icon: "🐺", color: "#FDB913",
    questions: [],
  },
  Coventry: {
    name: "Coventry City", icon: "🐘", color: "#059DD9",
    questions: [],
  },
  HullCity: {
    name: "Hull City", icon: "🐯", color: "#F18A01",
    questions: [],
  },
  Athletic: {
    name: "Athletic Bilbao", icon: "🦁", color: "#EE2523",
    questions: [],
  },
  Sevilla: {
    name: "Sevilla", icon: "🔴", color: "#CB0007",
    questions: [],
  },
  Betis: {
    name: "Real Betis", icon: "🟢", color: "#00954C",
    questions: [],
  },
  Schalke: {
    name: "Schalke 04", icon: "🔵", color: "#004E9E",
    questions: [],
  },
  Hamburg: {
    name: "Hamburger SV", icon: "⬦", color: "#0A3A7A",
    questions: [],
  },
  Fiorentina: {
    name: "Fiorentina", icon: "🟣", color: "#592C82",
    questions: [],
  },
  Lazio: {
    name: "Lazio", icon: "🦅", color: "#87D8F7",
    questions: [],
  },
  Torino: {
    name: "Torino", icon: "🐂", color: "#8A1E12",
    questions: [],
  },
  Sporting: {
    name: "Sporting CP", icon: "🦁", color: "#008056",
    questions: [],
  },
  SaintEtienne: {
    name: "Saint-Étienne", icon: "🟢", color: "#009E60",
    questions: [],
  },
  Valencia: {
    name: "Valencia", icon: "🦇", color: "#F18E00",
    questions: [],
  },
  Leverkusen: {
    name: "Bayer Leverkusen", icon: "🔴", color: "#E32221",
    questions: [],
  },
  Lyon: {
    name: "Olympique Lyonnais", icon: "🦁", color: "#3D74C4",
    questions: [],
  },
  Parma: {
    name: "Parma", icon: "🟡", color: "#F5D800",
    questions: [],
  },
  Monaco: {
    name: "AS Monaco", icon: "🔺", color: "#DA291C",
    questions: [],
  },
  // draw prefers the verified, hint-bearing QB rows via CLUB_PACK_TO_QB and
  // only falls back to this array. Each of these clears the 10 medium+hard
  // floor the club draw needs (thinnest is Sheffield Wednesday at 11).
  Birmingham:  { name: "Birmingham City",     icon: "🔵", color: "#253896", questions: [] },
  Cardiff:     { name: "Cardiff City",        icon: "🐦", color: "#0070B5", questions: [] },
  Derby:       { name: "Derby County",        icon: "🐏", color: "#1B1B1B", questions: [] },
  Norwich:     { name: "Norwich City",        icon: "🐤", color: "#00A650", questions: [] },
  Middlesbrough: { name: "Middlesbrough",     icon: "🔴", color: "#DC143C", questions: [] },
  WestBrom:    { name: "West Brom",          icon: "🔵", color: "#122F67", questions: [] },
  SheffUtd:    { name: "Sheffield United",   icon: "⚔️", color: "#EE2737", questions: [] },
  Blackburn:   { name: "Blackburn Rovers",   icon: "🔷", color: "#009EE0", questions: [] },
  Portsmouth:  { name: "Portsmouth",          icon: "⚓", color: "#001489", questions: [] },
  SheffWed:    { name: "Sheffield Wednesday", icon: "🦉", color: "#0066B3", questions: [] },
  Southampton: { name: "Southampton",         icon: "⛵", color: "#D71920", questions: [] },
  Stoke:       { name: "Stoke City",          icon: "🔴", color: "#E03A3E", questions: [] },
  Swansea:     { name: "Swansea City",        icon: "🦢", color: "#121212", questions: [] },
  Wrexham:     { name: "Wrexham",             icon: "🐐", color: "#DA291C", questions: [] },
};


// Multiplayer/local topics — the "what you play" axis. ids are "mixed" |
// "cat:<QB cat>" | "club:<CLUB_PACK key>"; consumed by TopicPickerSheet (used
// by the online lobby AND local setup) and by pickMultiplayerQuestions.
// Tab split (Leagues · Clubs · Tournaments) per the design handoff; clubs
// carry their real colours (same treatment as the Club Quiz picker).
export const MP_TOPICS = {
  mixed: { id: "mixed", label: "Mixed — all topics", icon: "🎲" },
  leagues: [
    { id: "cat:PL", label: "Premier League", icon: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
    { id: "cat:LaLiga", label: "La Liga", icon: "🇪🇸" },
    { id: "cat:SerieA", label: "Serie A", icon: "🇮🇹" },
    { id: "cat:Bundesliga", label: "Bundesliga", icon: "🇩🇪" },
    { id: "cat:Ligue1", label: "Ligue 1", icon: "🇫🇷" },
    { id: "cat:SuperLig", label: "Süper Lig", icon: "🇹🇷" },
    { id: "cat:Primeira", label: "Primeira Liga", icon: "🇵🇹" },
  ],
  tournaments: [
    { id: "cat:UCL", label: "Champions League", icon: "⭐" },
    { id: "cat:WorldCup", label: "International", icon: "🌍" },
    { id: "cat:Euros", label: "Euros", icon: "🏆" },
  ],
  clubs: Object.entries(CLUB_PACK_TO_QB)
    .map(([key, name]) => {
      const color = CLUB_PACKS[key]?.color || null;
      return {
        id: `club:${key}`, label: name,
        abbr: CLUB_ABBR[key] || clubInitials(name),
        color, fg: color ? clubReadableText(color) : null,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label)),
};

// Resolve a pack id to its display treatment (icon or club-coloured monogram
// + copy) for the topic cards (online lobby + local setup) and the picker's
// Done bar.
export function topicMeta(packId) {
  if (!packId || packId === "mixed") return { label: MP_TOPICS.mixed.label, icon: MP_TOPICS.mixed.icon, sub: "Questions from every topic" };
  const comp = [...MP_TOPICS.leagues, ...MP_TOPICS.tournaments].find(t => t.id === packId);
  if (comp) return { label: comp.label, icon: comp.icon, sub: "Competition pack" };
  const club = MP_TOPICS.clubs.find(t => t.id === packId);
  if (club) return { label: club.label, abbr: club.abbr, color: club.color, fg: club.fg, sub: "Club deep-dive" };
  return { label: MP_TOPICS.mixed.label, icon: MP_TOPICS.mixed.icon, sub: "Questions from every topic" };
}

// Full-screen topic picker (design handoff topics-leagues/clubs.dc.html):
// Mixed pinned above Leagues · Clubs · Tournaments tabs, single-select radio
// behaviour, pinned Done bar echoing the current selection. Local draft state
// — nothing commits until Done. Shared by the online lobby and local setup.
export function TopicPickerSheet({ value, onDone, onClose }) {
  const [draft, setDraft] = useState(value || "mixed");
  const [tab, setTab] = useState(() =>
    String(value || "").startsWith("club:") ? "clubs"
    : MP_TOPICS.tournaments.some(t => t.id === value) ? "tournaments"
    : "leagues");
  const meta = topicMeta(draft);
  const doneLabel = draft === "mixed" ? "Done — Mixed, all topics" : `Done — ${meta.label}`;
  // Clubs is 61 entries in a 2-column grid. The array IS alphabetical, but a
  // row-major grid means scanning DOWN a column skips every second club
  // (AC Milan, Anderlecht, Aston Villa, Atletico...), so it reads as random —
  // exactly the "chaotic and shuffled" report. Sorting differently can't fix a
  // scan-direction illusion; being able to type "man" can. Matches abbr too,
  // so MUN/PSG/BVB work.
  const [q, setQ] = useState("");
  const allItems = MP_TOPICS[tab] || [];
  const needle = q.trim().toLowerCase();
  const items = needle
    ? allItems.filter(it =>
        it.label.toLowerCase().includes(needle) ||
        (it.abbr || "").toLowerCase().includes(needle))
    : allItems;
  return (
    <div style={{position:"fixed",inset:0,zIndex:999,background:"var(--bg)",display:"flex",flexDirection:"column"}}>
      <div style={{padding:"calc(14px + env(safe-area-inset-top, 0px)) 20px 0",display:"flex",alignItems:"center",gap:12}}>
        <button onClick={onClose} aria-label="Back" style={{width:38,height:38,borderRadius:12,background:"var(--s1)",border:"1px solid var(--border)",color:"var(--t1)",fontSize:16,cursor:"pointer",fontFamily:"inherit"}}>←</button>
        <span style={{fontSize:24,fontWeight:800,letterSpacing:"-0.02em",color:"var(--t1)"}}>Topics</span>
      </div>
      <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",padding:"0 20px 20px"}}>
        <button onClick={() => setDraft("mixed")} style={{width:"100%",marginTop:14,borderRadius:999,boxShadow:"0 8px 22px -8px rgba(88,204,2,0.55)",textAlign:"left",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:11,padding:"13px 15px",
          ...(draft === "mixed" ? {background:"rgba(88,204,2,0.1)",border:"1.5px solid rgba(88,204,2,0.55)"} : {background:"var(--s1)",border:"1px solid var(--border)"})}}>
          <span style={{fontSize:19}}>🎲</span>
          <span style={{fontSize:14.5,fontWeight:draft === "mixed" ? 800 : 700,color:draft === "mixed" ? "var(--grn-soft)" : "var(--t1)"}}>Mixed — all topics</span>
          <span style={{marginLeft:"auto",width:19,height:19,borderRadius:"50%",...(draft === "mixed"
            ? {background:"var(--accent)",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"var(--grn-ink)",fontWeight:900}
            : {border:"1.5px solid #3E4150"})}}>{draft === "mixed" ? "✓" : ""}</span>
        </button>
        <div style={{display:"flex",gap:6,marginTop:16,padding:4,borderRadius:14,background:"var(--s1)",border:"1px solid var(--border)"}}>
          {[{ id: "leagues", label: "Leagues" }, { id: "clubs", label: "Clubs" }, { id: "tournaments", label: "Tournaments" }].map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setQ(""); }} style={{flex:1,borderRadius:10,padding:9,textAlign:"center",fontSize:13,cursor:"pointer",fontFamily:"inherit",
              ...(tab === t.id ? {background:"var(--s2)",border:"1px solid #3E4150",fontWeight:800,color:"var(--t1)"} : {background:"transparent",border:"1px solid transparent",fontWeight:700,color:"var(--t2)"})}}>{t.label}</button>
          ))}
        </div>
        {allItems.length > 12 && (
          <div style={{position:"relative",marginTop:12}}>
            <span aria-hidden="true" style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",fontSize:14,opacity:0.65,pointerEvents:"none"}}>🔍</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={`Search ${tab}…`}
              aria-label={`Search ${tab}`}
              autoComplete="off"
              spellCheck={false}
              style={{width:"100%",boxSizing:"border-box",padding:"12px 38px",borderRadius:13,background:"var(--s1)",border:"1px solid var(--border)",color:"var(--t1)",fontSize:16,fontFamily:"inherit",outline:"none"}}
            />
            {q && (
              <button onClick={() => setQ("")} aria-label="Clear search"
                style={{position:"absolute",right:6,top:"50%",transform:"translateY(-50%)",width:30,height:30,borderRadius:9,background:"transparent",border:"none",color:"var(--t2)",fontSize:15,cursor:"pointer",fontFamily:"inherit"}}>✕</button>
            )}
          </div>
        )}
        {needle && items.length === 0 && (
          <div style={{marginTop:18,textAlign:"center",color:"var(--t2)",fontSize:13.5}}>
            No {tab} matching “{q.trim()}”
          </div>
        )}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginTop:14}}>
          {items.map(it => {
            const sel = draft === it.id;
            return (
              <button key={it.id} onClick={() => setDraft(it.id)} style={{borderRadius:16,padding:14,display:"flex",flexDirection:"column",gap:6,textAlign:"left",cursor:"pointer",fontFamily:"inherit",
                ...(sel ? {background:"rgba(88,204,2,0.1)",border:"1.5px solid rgba(88,204,2,0.55)"} : {background:"var(--s1)",border:"1px solid var(--border)"})}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%"}}>
                  {it.abbr
                    ? <span style={{width:34,height:34,borderRadius:10,background:it.color || (sel ? "rgba(88,204,2,0.14)" : "var(--s2)"),display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900,letterSpacing:"0.04em",color:it.fg || (sel ? "var(--grn-soft)" : "var(--t1)"),boxShadow:it.color ? `0 2px 8px ${it.color}55` : undefined}}>{it.abbr}</span>
                    : <span style={{fontSize:24}}>{it.icon}</span>}
                  {sel && <span style={{width:19,height:19,borderRadius:"50%",background:"var(--accent)",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"var(--grn-ink)",fontWeight:900}}>✓</span>}
                </div>
                <span style={{fontSize:14.5,fontWeight:sel ? 800 : 700,color:sel ? "var(--grn-soft)" : "var(--t1)",marginTop:2}}>{it.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div style={{borderTop:"1px solid var(--s1)",background:"#0C0E14",padding:"12px 20px calc(12px + env(safe-area-inset-bottom, 0px))"}}>
        <button onClick={() => onDone(draft)} style={{width:"100%",border:"none",borderRadius:999,background:"var(--accent)",boxShadow:"0 8px 22px -8px rgba(88,204,2,0.55)",padding:15,fontSize:15.5,fontWeight:800,color:"var(--grn-ink)",cursor:"pointer",fontFamily:"inherit"}}>{doneLabel}</button>
      </div>
    </div>
  );
}

// ─── CLUB CRESTS ─────────────────────────────────────────────────────────────
// Custom simplified SVG crests for each club pack. All share the same shield
// path (viewBox 100×100) so they feel like a cohesive set.
const CLUB_CRESTS = {
  Arsenal: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 10 L88 10 L88 55 Q88 88 50 96 Q12 88 12 55 Z" fill="#EF0107"/>
    <rect x="24" y="48" width="42" height="8" rx="2" fill="#FFFFFF"/>
    <polygon points="64,44 80,52 64,60" fill="#FFFFFF"/>
    <circle cx="32" cy="66" r="9" fill="#FFFFFF"/>
    <circle cx="32" cy="66" r="3" fill="#EF0107"/>
    <line x1="32" y1="57" x2="32" y2="75" stroke="#EF0107" stroke-width="1.5"/>
    <line x1="23" y1="66" x2="41" y2="66" stroke="#EF0107" stroke-width="1.5"/>
  </svg>`,
  Liverpool: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 10 L88 10 L88 55 Q88 88 50 96 Q12 88 12 55 Z" fill="#C8102E"/>
    <ellipse cx="50" cy="50" rx="10" ry="14" fill="#FFFFFF"/>
    <circle cx="50" cy="32" r="6.5" fill="#FFFFFF"/>
    <polygon points="56,30 64,28 57,36" fill="#F6EB61"/>
    <path d="M40 46 Q30 44 32 56 Q39 54 42 52 Z" fill="#FFFFFF"/>
    <path d="M60 46 Q70 44 68 56 Q61 54 58 52 Z" fill="#FFFFFF"/>
    <path d="M40 70 Q44 62 46 70" stroke="#F6EB61" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <path d="M54 70 Q58 62 60 70" stroke="#F6EB61" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <path d="M47 74 Q50 66 53 74" stroke="#F6EB61" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  </svg>`,
  ManUtd: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 10 L88 10 L88 55 Q88 88 50 96 Q12 88 12 55 Z" fill="#DA291C"/>
    <circle cx="44" cy="34" r="6" fill="#FFFFFF"/>
    <polygon points="40,29 38,22 43,27" fill="#FFFFFF"/>
    <polygon points="48,29 50,22 45,27" fill="#FFFFFF"/>
    <path d="M37 42 L51 42 L51 66 Q44 70 37 66 Z" fill="#FFFFFF"/>
    <path d="M51 55 Q58 56 58 66 Q54 70 52 64 Z" fill="#FFFFFF"/>
    <rect x="63" y="34" width="3" height="36" fill="#FBE122"/>
    <polygon points="58,34 64.5,24 71,34 68,34 68,40 61,40 61,34" fill="#FBE122"/>
  </svg>`,
  Barcelona: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs><clipPath id="bcn_clip"><path d="M12 10 L88 10 L88 55 Q88 88 50 96 Q12 88 12 55 Z"/></clipPath></defs>
    <g clip-path="url(#bcn_clip)">
      <rect x="12" y="10" width="15.2" height="90" fill="#A50044"/>
      <rect x="27.2" y="10" width="15.2" height="90" fill="#004D98"/>
      <rect x="42.4" y="10" width="15.2" height="90" fill="#A50044"/>
      <rect x="57.6" y="10" width="15.2" height="90" fill="#004D98"/>
      <rect x="72.8" y="10" width="15.2" height="90" fill="#A50044"/>
    </g>
    <path d="M12 10 L88 10 L88 55 Q88 88 50 96 Q12 88 12 55 Z" fill="none" stroke="#EDBB00" stroke-width="3"/>
  </svg>`,
  RealMadrid: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 10 L88 10 L88 55 Q88 88 50 96 Q12 88 12 55 Z" fill="#FFFFFF"/>
    <rect x="28" y="32" width="44" height="6" fill="#00529F"/>
    <polygon points="28,32 33,20 38,32" fill="#00529F"/>
    <polygon points="42,32 50,18 58,32" fill="#00529F"/>
    <polygon points="62,32 67,20 72,32" fill="#00529F"/>
    <circle cx="33" cy="22" r="2.4" fill="#FEBE10"/>
    <circle cx="50" cy="20" r="3" fill="#FEBE10"/>
    <circle cx="67" cy="22" r="2.4" fill="#FEBE10"/>
    <text x="50" y="72" text-anchor="middle" font-family="Inter, -apple-system, sans-serif" font-weight="900" font-size="22" fill="#00529F">RM</text>
    <path d="M12 10 L88 10 L88 55 Q88 88 50 96 Q12 88 12 55 Z" fill="none" stroke="#FEBE10" stroke-width="3"/>
  </svg>`,
  ManCity: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 10 L88 10 L88 55 Q88 88 50 96 Q12 88 12 55 Z" fill="#6CABDD"/>
    <ellipse cx="50" cy="54" rx="7" ry="14" fill="#FFFFFF"/>
    <circle cx="50" cy="34" r="5.5" fill="#FFFFFF"/>
    <polygon points="55,33 62,31 55,38" fill="#1C2C5B"/>
    <path d="M43 44 Q26 42 24 60 Q33 58 43 54 Z" fill="#FFFFFF"/>
    <path d="M57 44 Q74 42 76 60 Q67 58 57 54 Z" fill="#FFFFFF"/>
    <path d="M32 48 L40 51 M30 54 L42 54" stroke="#1C2C5B" stroke-width="1"/>
    <path d="M68 48 L60 51 M70 54 L58 54" stroke="#1C2C5B" stroke-width="1"/>
  </svg>`,
  Chelsea: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 10 L88 10 L88 55 Q88 88 50 96 Q12 88 12 55 Z" fill="#034694"/>
    <path d="M38 34 Q37 26 44 24 Q53 26 51 34 L54 52 L51 68 L47 77 L43 77 L43 60 L38 52 Z" fill="#FFFFFF"/>
    <circle cx="45" cy="30" r="6" fill="#FFFFFF"/>
    <rect x="54" y="38" width="12" height="3" rx="1" fill="#FFFFFF" transform="rotate(-20 60 40)"/>
    <rect x="66" y="18" width="2.5" height="52" fill="#FFFFFF"/>
    <circle cx="67.3" cy="18" r="3" fill="#FFFFFF"/>
    <path d="M38 62 Q30 66 32 74 Q34 78 37 74" stroke="#FFFFFF" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  </svg>`,
  BayernMunich: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="bayern_diamond" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="12" height="12" fill="#FFFFFF"/>
        <rect width="6" height="6" fill="#0066B2"/>
        <rect x="6" y="6" width="6" height="6" fill="#0066B2"/>
      </pattern>
    </defs>
    <path d="M12 10 L88 10 L88 55 Q88 88 50 96 Q12 88 12 55 Z" fill="#DC052D"/>
    <circle cx="50" cy="52" r="22" fill="url(#bayern_diamond)" stroke="#FFFFFF" stroke-width="2"/>
  </svg>`,
  Juventus: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs><clipPath id="juve_clip"><path d="M12 10 L88 10 L88 55 Q88 88 50 96 Q12 88 12 55 Z"/></clipPath></defs>
    <g clip-path="url(#juve_clip)">
      <rect x="12" y="10" width="38" height="90" fill="#000000"/>
      <rect x="50" y="10" width="38" height="90" fill="#FFFFFF"/>
    </g>
    <rect x="28" y="42" width="44" height="7" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
    <polygon points="28,42 33,28 38,42" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
    <polygon points="42,42 50,25 58,42" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
    <polygon points="62,42 67,28 72,42" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
    <path d="M12 10 L88 10 L88 55 Q88 88 50 96 Q12 88 12 55 Z" fill="none" stroke="#000000" stroke-width="2"/>
  </svg>`,
  AcMilan: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs><clipPath id="acm_clip"><path d="M12 10 L88 10 L88 55 Q88 88 50 96 Q12 88 12 55 Z"/></clipPath></defs>
    <g clip-path="url(#acm_clip)">
      <rect x="12" y="10" width="15.2" height="90" fill="#FB090B"/>
      <rect x="27.2" y="10" width="15.2" height="90" fill="#000000"/>
      <rect x="42.4" y="10" width="15.2" height="90" fill="#FB090B"/>
      <rect x="57.6" y="10" width="15.2" height="90" fill="#000000"/>
      <rect x="72.8" y="10" width="15.2" height="90" fill="#FB090B"/>
    </g>
    <path d="M12 10 L88 10 L88 55 Q88 88 50 96 Q12 88 12 55 Z" fill="none" stroke="#000000" stroke-width="2"/>
  </svg>`,
  Atletico: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs><clipPath id="atl_clip"><path d="M12 10 L88 10 L88 55 Q88 88 50 96 Q12 88 12 55 Z"/></clipPath></defs>
    <g clip-path="url(#atl_clip)">
      <rect x="12" y="10" width="15.2" height="90" fill="#FFFFFF"/>
      <rect x="27.2" y="10" width="15.2" height="90" fill="#CB3524"/>
      <rect x="42.4" y="10" width="15.2" height="90" fill="#FFFFFF"/>
      <rect x="57.6" y="10" width="15.2" height="90" fill="#CB3524"/>
      <rect x="72.8" y="10" width="15.2" height="90" fill="#FFFFFF"/>
    </g>
    <ellipse cx="40" cy="65" rx="8" ry="6" fill="#272727"/>
    <circle cx="34" cy="57" r="5" fill="#272727"/>
    <rect x="34" y="65" width="2.5" height="8" fill="#272727"/>
    <rect x="42" y="65" width="2.5" height="8" fill="#272727"/>
    <rect x="58" y="54" width="2.5" height="20" fill="#272727"/>
    <ellipse cx="59.3" cy="51" rx="6" ry="8" fill="#272727"/>
    <path d="M12 10 L88 10 L88 55 Q88 88 50 96 Q12 88 12 55 Z" fill="none" stroke="#272727" stroke-width="2"/>
  </svg>`,
  Dortmund: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 10 L88 10 L88 55 Q88 88 50 96 Q12 88 12 55 Z" fill="#FDE100"/>
    <text x="50" y="60" text-anchor="middle" font-family="Inter, -apple-system, sans-serif" font-weight="900" font-size="28" fill="#000000">BVB</text>
    <text x="50" y="78" text-anchor="middle" font-family="Inter, -apple-system, sans-serif" font-weight="700" font-size="10" fill="#000000">09</text>
    <path d="M12 10 L88 10 L88 55 Q88 88 50 96 Q12 88 12 55 Z" fill="none" stroke="#000000" stroke-width="2"/>
  </svg>`,
  PSG: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 10 L88 10 L88 55 Q88 88 50 96 Q12 88 12 55 Z" fill="#003170"/>
    <rect x="12" y="47" width="76" height="7" fill="#DA291C"/>
    <polygon points="50,18 47,30 53,30" fill="#FFFFFF"/>
    <polygon points="46,32 54,32 55,44 45,44" fill="#FFFFFF"/>
    <polygon points="44,45 56,45 58,58 42,58" fill="#FFFFFF"/>
    <polygon points="42,59 58,59 61,80 39,80" fill="#FFFFFF"/>
  </svg>`,
  InterMilan: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs><clipPath id="int_clip"><path d="M12 10 L88 10 L88 55 Q88 88 50 96 Q12 88 12 55 Z"/></clipPath></defs>
    <g clip-path="url(#int_clip)">
      <rect x="0" y="0" width="100" height="100" fill="#010E80"/>
      <g transform="rotate(18 50 50)">
        <rect x="-40" y="-20" width="14" height="160" fill="#000000"/>
        <rect x="-15" y="-20" width="14" height="160" fill="#000000"/>
        <rect x="10" y="-20" width="14" height="160" fill="#000000"/>
        <rect x="35" y="-20" width="14" height="160" fill="#000000"/>
        <rect x="60" y="-20" width="14" height="160" fill="#000000"/>
        <rect x="85" y="-20" width="14" height="160" fill="#000000"/>
      </g>
    </g>
    <path d="M12 10 L88 10 L88 55 Q88 88 50 96 Q12 88 12 55 Z" fill="none" stroke="#000000" stroke-width="2"/>
  </svg>`,
  Ajax: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 10 L88 10 L88 55 Q88 88 50 96 Q12 88 12 55 Z" fill="#FFFFFF"/>
    <text x="50" y="75" text-anchor="middle" font-family="Inter, -apple-system, sans-serif" font-weight="900" font-size="60" fill="#CC0000">A</text>
    <rect x="22" y="42" width="56" height="2.5" fill="#CC0000"/>
    <rect x="22" y="52" width="56" height="2.5" fill="#CC0000"/>
    <rect x="22" y="62" width="56" height="2.5" fill="#CC0000"/>
    <path d="M12 10 L88 10 L88 55 Q88 88 50 96 Q12 88 12 55 Z" fill="none" stroke="#CC0000" stroke-width="2"/>
  </svg>`,
  Tottenham: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 10 L88 10 L88 55 Q88 88 50 96 Q12 88 12 55 Z" fill="#132257"/>
    <circle cx="50" cy="66" r="12" fill="#FFFFFF"/>
    <ellipse cx="50" cy="42" rx="6" ry="9" fill="#FFFFFF"/>
    <polygon points="55,36 64,34 56,43" fill="#FFFFFF"/>
    <path d="M45 35 Q41 27 48 31" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/>
  </svg>`,
  Newcastle: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs><clipPath id="nufc_clip"><path d="M12 10 L88 10 L88 55 Q88 88 50 96 Q12 88 12 55 Z"/></clipPath></defs>
    <g clip-path="url(#nufc_clip)">
      <rect x="0" y="0" width="100" height="100" fill="#FFFFFF"/>
      <rect x="14" y="0" width="13" height="100" fill="#241F20"/>
      <rect x="40" y="0" width="13" height="100" fill="#241F20"/>
      <rect x="66" y="0" width="13" height="100" fill="#241F20"/>
    </g>
    <path d="M12 10 L88 10 L88 55 Q88 88 50 96 Q12 88 12 55 Z" fill="none" stroke="#241F20" stroke-width="2"/>
  </svg>`,
};

const ClubCrest = React.memo(function ClubCrest({ clubKey, size = 48 }) {
  const svg = CLUB_CRESTS[clubKey];
  if (!svg) {
    return (
      <div style={{width:size, height:size, display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:Math.round(size*0.5)}}>⚽</div>
    );
  }
  // dangerouslySetInnerHTML re-parses the SVG string on every render; React.memo
  // above short-circuits when (clubKey, size) are unchanged so the parse + DOM
  // write only happens once per (key, size) pair.
  return (
    <div
      className="club-crest"
      aria-hidden="true"
      style={{width:size, height:size, display:"inline-block", flexShrink:0, filter:"drop-shadow(0 1px 2px rgba(0,0,0,0.25))"}}
      dangerouslySetInnerHTML={{__html: svg}}
    />
  );
});

// ─── SOUND EFFECTS ────────────────────────────────────────────────────────────
// Pure Web-Audio sound synthesis. Honours biq_settings.sound and no-ops on
// environments without AudioContext or with the setting disabled. Reuses a
// single AudioContext across calls (iOS Safari limits to ~4 concurrent ones).
let _audioCtx = null;
function _getAudioCtx() {
  try {
    if (_audioCtx) return _audioCtx;
    const AC = typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext);
    if (!AC) return null;
    _audioCtx = new AC();
    return _audioCtx;
  } catch { return null; }
}
export function playSound(type) {
  try {
    // Honour user sound preference (read synchronously so we can be called from anywhere)
    let enabled = false;
    try {
      const raw = localStorage.getItem("biq_settings");
      if (raw) enabled = JSON.parse(raw)?.sound === true;
    } catch {}
    if (!enabled) return;

    const ctx = _getAudioCtx();
    if (!ctx) return;
    // iOS Safari often keeps the context in "suspended" state until a user gesture.
    // Calling resume() inside a touch handler (where playSound usually fires) is safe.
    if (ctx.state === "suspended" && typeof ctx.resume === "function") {
      try { ctx.resume(); } catch {}
    }
    const now = ctx.currentTime;

    // Helper: schedule a single sine note with a short attack + exponential release
    const note = (freq, start, dur, vol = 0.13, wave = "sine") => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = wave;
      osc.frequency.value = freq;
      const t0 = now + start;
      const tAttackEnd = t0 + 0.02;
      const tEnd = t0 + dur;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(vol, tAttackEnd);
      gain.gain.exponentialRampToValueAtTime(0.0001, tEnd);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(tEnd + 0.05);
    };

    if (type === "correct") {
      // Two-tone ascending chime: C5 → G5, ~600ms total
      note(523.25, 0,    0.28, 0.15);
      note(783.99, 0.22, 0.38, 0.15);
    } else if (type === "wrong") {
      // Soft sine glide 300 → 200Hz over 400ms — gentle, not harsh
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(200, now + 0.4);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.09, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.45);
    } else if (type === "streak") {
      // C5 → E5 → G5, each 150ms, overlapping slightly
      note(523.25, 0.00, 0.22, 0.14);
      note(659.25, 0.12, 0.22, 0.14);
      note(783.99, 0.24, 0.30, 0.14);
    } else if (type === "daily_complete") {
      // Warm celebratory C-major chord with 800ms soft fade
      note(523.25, 0, 0.8, 0.09);
      note(659.25, 0, 0.8, 0.09);
      note(783.99, 0, 0.8, 0.09);
    } else if (type === "levelup") {
      // Ascending 4-note fanfare, 120ms each
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        note(freq, i * 0.12, 0.20, 0.13);
      });
    } else if (type === "soft") {
      // Sprint #78 UU1: short UI-tap tick. Used by local multiplayer's
      // option-pick handler. Was previously falling through to the silent
      // path because no "soft" case existed — soft taps had no audio
      // feedback even with sound enabled. ~60ms 700Hz, low volume.
      note(700, 0, 0.06, 0.08, "triangle");
    }
  } catch {}
}

// Sprint #87: native iOS haptics via @capacitor/haptics. navigator.vibrate is a
// silent no-op on iOS WKWebView so the web-only path produced zero feedback on
// the installed app. On native (Capacitor.isNativePlatform()) we dispatch to the
// system Taptic engine; on the web we keep the navigator.vibrate fallback so
// Android Chrome / installed Android PWAs still buzz.
// Sprint #89 #2: gated on settings.haptics (defaults true). Read synchronously
// from localStorage so the helper can be called from anywhere (matches the
// playSound pattern at line 3082). OS-level haptics disabled silently no-ops
// inside the plugin itself, so no extra guard needed for that case.
export const IS_NATIVE = typeof Capacitor !== "undefined" && Capacitor.isNativePlatform?.();
function challengeEventOnce(kind, ch) {
  try {
    const key = `biq_challenge_${kind}_logged`;
    const tokenKey = `${ch.date}.${ch.score}.${ch.name || ""}`;
    if (localStorage.getItem(key) === tokenKey) return false;
    localStorage.setItem(key, tokenKey);
    return true;
  } catch { return true; }
}

// Retire index.html's pre-boot onboarding shell (#preboot-onboard) — the
// static copy of the onboarding first frame that makes LCP land at first
// paint instead of waiting ~3s for this chunk. Double-rAF so the React tree
// underneath has demonstrably painted before the overlay lifts; idempotent
// (remove() on a gone node is a no-op) because StrictMode double-fires the
// mount effect and the crash path may race the failsafe timer.
function removePrebootOnboard() {
  try {
    const kill = () => { try { document.getElementById('preboot-onboard')?.remove(); } catch {} };
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => requestAnimationFrame(kill));
    else kill();
    // rAF is PAUSED in hidden tabs (verified: the shell sat unremoved in a
    // backgrounded pane until it was fronted). That's the right visual — the
    // overlay lifts on the first frame anyone actually sees — but a tab that
    // is never fronted should still shed it eventually; throttled or not,
    // setTimeout does fire in hidden tabs.
    setTimeout(kill, 1500);
  } catch {}
}

// A stable per-device id so a funnel can be followed across a visit without
// anything resembling a fingerprint. Random, client-issued, and it never
// leaves localStorage — same approach challenge_events already uses.
function visitorId() {
  try {
    let v = localStorage.getItem("biq_vid");
    if (!v) { v = (crypto?.randomUUID?.() || String(Math.random()).slice(2)); localStorage.setItem("biq_vid", v); }
    return /^[0-9a-f-]{36}$/i.test(v) ? v : null;
  } catch { return null; }
}

// ⚠️ This used to fire into Clarity and NOWHERE ELSE, which made it
// write-only: Clarity's export API returns only its own auto-detected smart
// events, so a query for onboard-done-answered / first-game-started /
// clubq-play comes back empty. Three features shipped in August that could
// not be read, and every recommendation about them in scouting report #2 was
// therefore reasoning rather than measurement.
// Now it fans out to BOTH — Clarity keeps session replay lined up with the
// numbers, and funnel_events makes the numbers answerable in SQL forever.
// Fire-and-forget on purpose: measurement must never delay or break a game.
// ⚠️ SYNTHETIC TRAFFIC MUST NOT REACH THE FUNNEL.
//
// Measured 2026-08-21, three hours after funnel_events went live: 905 rows,
// of which 767 were `first-game-started` at ~250/hour, exactly one per
// visitor, arriving in precisely the hours the Playwright suite was running —
// against a real DAU of 13-17. One row was literally named `probe-e2e`.
//
// The cause is a seam, not a bug in anything: the e2e suite runs against
// localhost:4173, localhost reads .env.local, and .env.local points at
// PRODUCTION Supabase because there is no staging project. So every local run
// and every CI run wrote test events into the table the product's decisions
// are supposed to come from. A green suite was quietly corrupting the
// instrument it shares a repo with.
//
// This is worse than having no data, because it looks like data. 767 synthetic
// rows would have drowned real signal at a ratio of roughly 50:1 and made
// every funnel number read as a triumph.
//
// Two signals, both deliberately conservative — when in doubt, DON'T record:
//   navigator.webdriver  is set by every automation driver (Playwright,
//                        Selenium, Puppeteer) and by nothing else.
//   localhost/127.0.0.1  is Alex's own dev browsing, which is not a user
//                        journey either and never should have counted.
// Native builds have neither, so real app traffic is untouched.
function isSyntheticTraffic() {
  try {
    if (IS_NATIVE) return false;
    if (typeof navigator !== "undefined" && navigator.webdriver === true) return true;
    const h = typeof location !== "undefined" ? location.hostname : "";
    return h === "localhost" || h === "127.0.0.1" || h === "[::1]" || h.endsWith(".local");
  } catch { return false; }
}

// Exported so lazy screens can report into the SAME funnel rather than growing
// their own. OnlineMultiplayer needs it for the rivalry prompt; scouting report
// #4's item 5 was "instrument the rating funnel — it has ZERO loopEvents", and
// the way that happens is a feature shipping in a file that could not reach
// this function.
export function loopEvent(name, meta) {
  // Gate BOTH sinks. Clarity session replays of a robot are as useless as
  // funnel rows from one, and Clarity's own quota is finite.
  if (isSyntheticTraffic()) return;
  try {
    if (!IS_NATIVE && typeof window !== "undefined" && typeof window.clarity === "function") window.clarity("event", name);
  } catch {}
  try {
    // ⚠️ NATIVE IS COUNTED, BUT NEVER IDENTIFIED — and the privacy policy says
    // so in those words. Decision recorded 2026-08-23 (Alex, from three
    // options: guard native entirely / anonymous counts / full funnel).
    //
    // The guard above covers Clarity but NOT this RPC, so shipping 1.6.5 as it
    // stood would have made three separate declarations false at once: privacy
    // §4's "does not measure how you use it… this is enforced in code", the
    // App Store privacy label, and the Play Data safety form. Nobody could
    // have caught it after the fact either — funnel_events holds zero native
    // rows precisely because no shipped build has ever had this code, so the
    // contradiction only appears once it is too late to stop.
    //
    // So native sends the event NAME and nothing else: no biq_vid, no meta.
    // We learn which modes get used and where people stop; we cannot follow a
    // person, because there is no key to follow them by. Dropping meta as well
    // as the id is deliberate — meta carries club slugs and surfaces, and a
    // rich enough meta rebuilds a fingerprint even without an explicit id.
    const anon = IS_NATIVE === true;
    supabase.rpc("record_funnel_event", {
      p_event: name,
      p_meta: anon
        ? { native: true, anon: true }
        : (meta ? { ...meta, native: false } : { native: false }),
      p_visitor: anon ? null : visitorId(),
      // ⚠️ Belt AND braces, and the braces are the load-bearing half. Passing
      // p_visitor: null is not enough on its own — the function also records
      // auth.uid(), so a signed-in native player would still be named by their
      // ACCOUNT id, a stronger identifier than the one we just withheld.
      // p_anon makes the server null both, so the guarantee survives a stale
      // bundle or a future call site that forgets. See
      // supabase/migrations/v1_6_funnel_anon_native_and_rate_cap.sql.
      p_anon: anon,
    }).then(({ error }) => {
      // ⚠️ supabase.rpc() RESOLVES on error rather than rejecting — a bare
      // .catch() would silently swallow every failure, which is exactly how
      // two write paths were lost before. Check the error explicitly.
      if (error) Sentry.addBreadcrumb({ category: 'funnel', message: `record_funnel_event failed: ${error.message}`, level: 'warning' });
    });
  } catch {}
}
// Belt-and-braces for index.html's head script: re-apply the native-app class
// (hides the desktop rail and the static site header inside the native shell).
// Covers any case where the bridge wasn't injected before the head script ran.
if (IS_NATIVE) { try { document.documentElement.classList.add("native-app"); } catch {} }
// ⚠️ Attach the push-tap listener at MODULE SCOPE, not in an effect. A cold
// launch from a notification delivers the tap while the app is still booting;
// anything waiting on React mount or on auth resolving is too late, and
// Capacitor does not buffer plugin events. push.js holds the tap until the
// router is set, so the two halves cannot race. (Reported 2026-08-22: tapping
// a game notification did not open the game.)
if (IS_NATIVE) { try { initPushTapRouting(); } catch { /* never break boot */ } }
// Post-Footle App Store nudge (2026-07-16, Alex): the apple-itunes-app smart
// banner never renders inside Threads/IG/X in-app webviews — exactly where
// social traffic lands — and InstallBanner needs a PWA install affordance
// those webviews don't expose. So the social funnel finished Footle with NO
// visible path to the app. Desktop still gets nothing (you cannot install a
// phone app there) — it keeps the PWA InstallBanner.
// iPadOS 13+ reports "Mac" + touch, hence the maxTouchPoints branch.
const IS_IOS_WEB = !IS_NATIVE && typeof navigator !== "undefined" &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent || "") ||
    ((navigator.userAgent || "").includes("Mac") && navigator.maxTouchPoints > 1));
// Google Play went live 2026-07-27. Until then this CTA was iOS-only, so every
// Android visitor finishing Footle on the web — the exact social-funnel moment
// this component exists for — saw nothing at all.
const IS_ANDROID_WEB = !IS_NATIVE && typeof navigator !== "undefined" &&
  /Android/i.test(navigator.userAgent || "") && !/Windows Phone/i.test(navigator.userAgent || "");
export function FootleGetAppCTA({ style }) {
  if (!IS_IOS_WEB && !IS_ANDROID_WEB) return null;
  // The visitor's own store badge — the same one the homepage row and the
  // static pages draw (src/components/StoreBadge.jsx). Was a 📲 emoji button.
  // ⚠️ NO COUNT in the caption. It said "5,000+ quiz questions" until
  // 2026-08-19 — disguise #8 of the binding no-counts rule. Sell breadth.
  return (
    <PlatformStoreBadge
      style={style}
      caption="Streaks, daily reminders and every quiz in one app"
    />
  );
}
// Colour-blind palette state, read where share strings are built so the
// emoji squares match the tiles the player actually saw (🟧🟦 vs 🟩🟨) —
// checked at call time, same lazy-read pattern as haptic()'s settings gate.
export function CB_MODE() {
  try { return document.documentElement.classList.contains("biq-cb"); } catch { return false; }
}

// ⚠️ EVERY CALL IS A NATIVE BRIDGE ROUND TRIP, AND THEY SERIALISE.
// From Alex's device log while tab switching felt slow — ~57 of these back to
// back, each a full JS -> native -> JS hop, with
// `WebProcessProxy::didBecomeUnresponsive` in the same log:
//
//     ⚡️ To Native ->  Haptics impact 120633433
//     ⚡️ TO JS undefined
//     ⚡️ To Native ->  Haptics impact 120633434
//     ⚡️ TO JS undefined      … x57
//
// No amount of browser profiling can see this: there is no bridge in Chrome,
// which is why three rounds of CSS measurement kept saying the app was fine
// while the phone said otherwise. Capacitor builds a fresh
// UIImpactFeedbackGenerator per call and iOS charges latency for one that has
// not been prepare()d, so a burst of taps queues a burst of hops in front of
// the UI work.
//
// 55ms floor for the LIGHT taps only. Two impacts closer together than that
// are not distinguishable by a fingertip anyway, so nothing is lost — while a
// spammed tab bar or a fast Footle typist stops flooding the bridge. The
// meaningful, once-per-moment haptics (correct, wrong, levelup, hardCorrect)
// are deliberately exempt: those must never be swallowed.
let _lastLightHapticAt = 0;
export function haptic(type) {
  try {
    if (type === "soft" || type === "select") {
      const now = Date.now();
      if (now - _lastLightHapticAt < 55) return;
      _lastLightHapticAt = now;
    }
    let enabled = true;
    try {
      const raw = localStorage.getItem("biq_settings");
      if (raw) {
        const v = JSON.parse(raw)?.haptics;
        enabled = v !== false; // default-on: missing/undefined => true
      }
    } catch {}
    if (!enabled) return;
    if (IS_NATIVE) {
      if (type === "correct") Haptics.impact({ style: ImpactStyle.Medium });
      else if (type === "wrong") Haptics.notification({ type: NotificationType.Error });
      else if (type === "soft" || type === "select") Haptics.impact({ style: ImpactStyle.Light });
      else if (type === "heavy") Haptics.impact({ style: ImpactStyle.Heavy });
      else if (type === "hardCorrect") Haptics.notification({ type: NotificationType.Success });
      else if (type === "levelup") {
        Haptics.notification({ type: NotificationType.Success });
        setTimeout(() => { try { Haptics.impact({ style: ImpactStyle.Heavy }); } catch {} }, 220);
      }
      return;
    }
    if (typeof navigator === "undefined" || !navigator.vibrate) return;
    if (type === "correct") navigator.vibrate(40);
    else if (type === "wrong") navigator.vibrate([30, 20, 30]);
    else if (type === "soft" || type === "select") navigator.vibrate(15);
    else if (type === "heavy") navigator.vibrate(100);
    else if (type === "hardCorrect") navigator.vibrate([30, 40, 30, 40, 60]);
    else if (type === "levelup") navigator.vibrate([50, 30, 50, 30, 100]);
  } catch {}
}

/**
 * Settings defaults, in ONE place.
 *
 * ⚠️ A function, not a constant: `sound` depends on IS_NATIVE, and freezing it
 * at module-evaluation time would bake in whatever the platform check said
 * before the native class was applied to <html>.
 */
function SETTINGS_DEFAULTS() {
  return { hints: true, timer: true, sound: IS_NATIVE === true, haptics: true, colorBlind: false };
}

// ─── HOT STREAK ENGINE ────────────────────────────────────────────────────────
function HotStreakEngine({ questions, onComplete, onBack, onHowToPlay, rulesOpen }) {
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [picked, setPicked] = useState(null); // { choice, correct } | null
  const [done, setDone] = useState(false);
  const timerRef = useRef(null);
  // medical correctness-state (low): the per-answer advance setTimeout had no
  // cleanup — if the 60s clock ended during the reveal delay, the pending
  // setIdx fired after unmount (harmless no-op in React 18, but `total: idx`
  // could under-count by one). Mirror TrueFalseEngine's ref+cleanup pattern.
  const advanceTimeoutRef = useRef(null);
  const q = questions[idx % questions.length];

  useEffect(() => () => clearTimeout(advanceTimeoutRef.current), []);

  // The 60s clock PAUSES while the rules sheet is open. The sheet exists to be
  // read, and reading it otherwise costs a chunk of the run — the "?" would be
  // a trap. timeLeft is never reset here, so it resumes exactly where it
  // stopped (contrast QuizEngine, whose timer effect re-seeds timerDuration).
  useEffect(() => {
    if (rulesOpen || done) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); setDone(true); return 0; }
        if (t === 11) { try { haptic("select"); } catch {} }  // 10s warning
        if (t === 6) { try { haptic("wrong"); } catch {} }  // 5s urgent warning
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [rulesOpen, done]);

  useEffect(() => {
    if (done) onComplete({ score, total: idx, bestStreak: score });
  }, [done]);

  /**
   * ⚠️ THE SPRINT SPENT ~45% OF ITS CLOCK ON A WALL YOU COULD NOT SKIP.
   *
   * Scouting report #4 measured the wrong-answer reveal at 1,825ms and 1,820ms
   * with the 60s clock running straight through it (39 → 38 → 37), and
   * confirmed card tap, body click, Enter and Space ALL failed to advance. In
   * the one mode whose entire identity is speed, a player spent about as long
   * watching as playing — and Hot Streak has the worst repeat rate of any core
   * mode (1.75 plays/user against Survival's 6.6).
   *
   * The hold itself is right: it exists so a miss teaches you something, and
   * the explanation is the app's whole differentiator. What was wrong is that
   * it was COMPULSORY. Now it is a maximum, not a minimum — anyone who has read
   * it, or does not want to, taps or presses a key and moves on.
   *
   * ⚠️ Deliberately NOT shortened, and deliberately NOT pausing the clock.
   * Shortening takes the explanation away from the player who wanted it;
   * pausing the clock inflates every score and makes existing personal bests
   * incomparable. Skipping costs neither.
   */
  const advance = useCallback(() => {
    clearTimeout(advanceTimeoutRef.current);
    setPicked(null);
    setIdx(j => j + 1);
  }, []);

  const answer = (i) => {
    if (done || picked) return;
    const correct = i === q.a;
    haptic(correct ? "correct" : "wrong");
    playSound(correct ? "correct" : "wrong");
    if (correct) setScore(s => s + 1);
    setPicked({ choice: i, correct });
    // Give the player time to read the hint on a wrong answer; otherwise advance
    // quickly. Both are now a CEILING — see advance().
    const delay = !correct && q.hint ? 1800 : 400;
    advanceTimeoutRef.current = setTimeout(advance, delay);
  };

  // Keyboard parity with the tap. Enter and Space are what the reviewer tried
  // first and both did nothing.
  useEffect(() => {
    if (!picked || done) return undefined;
    const onKey = (e) => {
      if (e.key !== "Enter" && e.key !== " " && e.key !== "Spacebar") return;
      e.preventDefault();
      advance();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [picked, done, advance]);

  // Tap anywhere that is not itself a control. The options are disabled during
  // the hold, but the back and "how to play" buttons are not — advancing on
  // those would steal the tap that was meant to leave.
  const onHoldTap = (e) => {
    if (!picked || done) return;
    if (e.target.closest && e.target.closest("button")) return;
    advance();
  };

  const pct = (timeLeft / 60) * 100;
  const barColor = timeLeft > 20 ? 'var(--accent)' : timeLeft > 10 ? 'var(--gold)' : 'var(--red)';

  return (
    <div className="quiz-wrap" onClick={onHoldTap}>
      {/* SR countdown at thresholds only — same pattern as QuizEngine.
          Hot Streak runs a 60s clock, so add a 30s waypoint. */}
      <div className="sr-only" role="timer" aria-live="assertive" aria-atomic="true">
        {timeLeft === 30 ? "30 seconds left" : timeLeft === 10 ? "10 seconds left" : timeLeft === 5 ? "5 seconds left" : timeLeft === 0 ? "Time's up" : ""}
      </div>
      <div className="q-top">
        <button className="back-btn" onClick={() => { clearInterval(timerRef.current); onBack(); }} aria-label="Go back">←</button>
        <div className="prog-wrap"><div className="prog-bar" style={{width:`${pct}%`, background:barColor, transition:'width 1s linear'}} /></div>
        <span className="q-ctr" style={{color: timeLeft <= 10 ? 'var(--red)' : 'var(--t2)', fontWeight: timeLeft <= 10 ? 800 : 500}}>{timeLeft}s</span>
        {onHowToPlay && <button className="icon-btn" onClick={onHowToPlay} aria-label="How to play" title="How to play">?</button>}
      </div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <div style={{fontSize:12,color:'var(--t2)',fontFamily:"'Inter',sans-serif",letterSpacing:1}}>⚡🔥 Hot Streak</div>
        <div style={{fontFamily:"'JetBrains Mono','SF Mono',ui-monospace,monospace",fontVariantNumeric:"tabular-nums",fontSize:22,fontWeight:700,color:'var(--accent)'}}>{score} <span style={{fontFamily:"'Inter',sans-serif",fontSize:13,color:'var(--t3)',fontWeight:500}}>pts</span></div>
      </div>
      <div className="q-card">
        <div className="q-tag">{CAT_LABELS[q.cat] || q.cat}</div>
        <div className="q-text">{q.q}</div>
      </div>
      <div className="opts">
        {q.o.map((opt, i) => {
          let cls = 'opt';
          if (picked) {
            if (i === picked.choice) cls += picked.correct ? ' correct' : ' wrong';
            else if (!picked.correct && i === q.a) cls += ' correct';
          }
          // ⚠️ COLOUR WAS THE ONLY SIGNAL HERE. Every other mode swaps the
          // letter badge for a tick or a cross after answering — QuizEngine
          // does it in one line, True/False does it, local multiplayer does it.
          // Hot Streak kept showing A/B/C/D and said right-vs-wrong purely by a
          // green or red tint, which simulates to a contrast ratio of 1.06
          // between the two states for a deuteranope: indistinguishable.
          // Settings has a "Colour-blind tiles" toggle, so an audit asking "is
          // there a colour-blind mode?" ticks the box — it recolours Footle and
          // nothing else. Two characters of information fixes this for every
          // colour-blind player AND every screen-reader user at once, since the
          // glyph is real text in the accessibility tree where a tint is not.
          const mark = picked
            ? (i === q.a ? '✓' : i === picked.choice ? '✗' : ['A','B','C','D'][i])
            : ['A','B','C','D'][i];
          return (
            <button key={i} className={cls} onClick={() => answer(i)} disabled={!!picked}>
              <span className="opt-l">{mark}</span>{opt}
            </button>
          );
        })}
      </div>
      {picked && !picked.correct && q.hint && (
        <div style={{
          marginTop:10,
          padding:"10px 14px",
          background:"var(--s1)",
          border:"1px solid var(--border)",
          borderRadius:10,
          fontSize:13,
          lineHeight:1.5,
          color:"var(--t2)",
          animation:"fadeIn 0.3s ease-out"
        }}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",gap:10,marginBottom:4}}>
            <div style={{fontSize:10,fontWeight:700,color:"var(--t3)",letterSpacing:0.2,fontFamily:"'Inter',sans-serif",display:"flex",alignItems:"center",gap:4}}><Lightbulb size={11} strokeWidth={2.5} aria-hidden="true" /> Why?</div>
            {/* ⚠️ A skip nobody can see is not a skip. The hold is capped at
                1.8s, but a player racing a 60-second clock has no way to know
                a tap will work unless we say so. Muted on purpose — this is
                permission, not an instruction. */}
            <div style={{fontSize:10,fontWeight:600,color:"var(--t3)",fontFamily:"'Inter',sans-serif",whiteSpace:"nowrap",opacity:0.75}}>tap to skip →</div>
          </div>
          <div>{q.hint}</div>
        </div>
      )}
    </div>
  );
}

// ─── TRUE OR FALSE ENGINE ─────────────────────────────────────────────────────
function TrueFalseEngine({ questions, onComplete, onBack, onHowToPlay }) {
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState(null); // { val, correct } | null
  const [done, setDone] = useState(false);
  const total = questions?.length || 0;
  const timeoutRef = useRef(null);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  // Cleanup any pending timeout on unmount
  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  useEffect(() => {
    if (done) onCompleteRef.current({ score, total, bestStreak: score });
  }, [done, score, total]);

  // See the comment on the delay below: the hold is a ceiling, not a minimum.
  // ⚠️ setDone must NOT live inside the setIdx updater. Updaters have to be
  // pure — React can run them twice (StrictMode, and again on a re-render
  // during concurrent work), which would fire the completion side effect
  // twice. Mirrors the original timeout body exactly instead.
  const advance = useCallback(() => {
    clearTimeout(timeoutRef.current);
    setPicked(null);
    if (idx + 1 >= total) setDone(true);
    else setIdx(i => i + 1);
  }, [idx, total]);

  useEffect(() => {
    if (!picked || done) return undefined;
    const onKey = (e) => {
      if (e.key !== "Enter" && e.key !== " " && e.key !== "Spacebar") return;
      e.preventDefault();
      advance();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [picked, done, advance]);

  const onHoldTap = (e) => {
    if (!picked || done) return;
    if (e.target.closest && e.target.closest("button")) return;
    advance();
  };

  const answer = (val) => {
    if (picked) return;
    if (!questions || !questions[idx]) return;
    // Bulletproof: handle both a:true/false (boolean) and a:1/0 (number) formats
    const qCur = questions[idx];
    const qa = qCur?.a;
    const qAsBool = qa === true || qa === 1;
    const correct = val === qAsBool;
    haptic(correct ? "correct" : "wrong");
    playSound(correct ? "correct" : "wrong");
    if (correct) setScore(s => s + 1);
    setPicked({ val, correct });
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    // Extra breathing room on a wrong answer that has a hint.
    // ⚠️ A CEILING, NOT A MINIMUM — same fix as HotStreakEngine. Scouting
    // report #4 only measured Hot Streak, but this mode holds for even LONGER
    // (2,400ms) and was equally unskippable. It does not run a clock, so it
    // costs no score; it still means "I have read it, move on" does nothing,
    // which is the annoyance either way. Fixed here at the same time rather
    // than left as the second implementation of a defect we just closed.
    const delay = !correct && qCur?.hint ? 2400 : 900;
    timeoutRef.current = setTimeout(advance, delay);
  };

  // Safety: if questions missing or done, render nothing (onComplete will have fired)
  if (done || !questions || questions.length === 0) return null;
  const q = questions[idx];
  if (!q) return null;

  const qAsBool = q.a === true || q.a === 1;

  const tfStyle = (isTrueBtn) => {
    const base = { padding:'22px', fontSize:18, fontWeight:800, borderRadius:16, fontFamily:'inherit', cursor: picked ? 'default' : 'pointer', transition:'background 0.2s, color 0.2s, border-color 0.2s' };
    if (!picked) {
      return {
        ...base,
        background: 'var(--s1)',
        border: '2px solid var(--border)',
        color: 'var(--t1)',
      };
    }
    const isCorrectBtn = isTrueBtn === qAsBool;
    const userPickedThis = picked.val === isTrueBtn;
    if (isCorrectBtn) {
      return { ...base, background: 'var(--green)', border: '2px solid var(--green)', color: '#fff' };
    }
    if (userPickedThis) {
      return { ...base, background: 'var(--red)', border: '2px solid var(--red)', color: '#fff' };
    }
    return { ...base, background: 'var(--s2)', border: '2px solid var(--border)', color: 'var(--t3)', opacity: 0.55 };
  };

  return (
    <div className="quiz-wrap" onClick={onHoldTap}>
      <div className="q-top">
        <button className="back-btn" onClick={onBack} aria-label="Go back">←</button>
        <div className="prog-wrap"><div className="prog-bar" style={{width:`${((idx + (picked?1:0)) / total) * 100}%`}} /></div>
        <span className="q-ctr">{idx + 1}/{total}</span>
        {onHowToPlay && <button className="icon-btn" onClick={onHowToPlay} aria-label="How to play" title="How to play">?</button>}
      </div>
      <div style={{textAlign:'center',padding:'8px 0 4px'}}>
        <span style={{fontSize:10,fontFamily:"'Inter',sans-serif",color:'var(--accent)',letterSpacing:2}}>✅ True or False</span>
      </div>
      <div className="q-card" style={{minHeight:140,display:'flex',alignItems:'center',justifyContent:'center',textAlign:'center'}}>
        <div className="q-text" style={{fontSize:18,lineHeight:1.5}}>{q?.s || q?.q}</div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginTop:16}}>
        <button onClick={() => answer(true)} disabled={!!picked} style={tfStyle(true)}>
          ✓ TRUE
        </button>
        <button onClick={() => answer(false)} disabled={!!picked} style={tfStyle(false)}>
          ✗ FALSE
        </button>
      </div>
      {picked && (
        <div style={{textAlign:'center',marginTop:14,fontSize:16,fontWeight:700,color: picked.correct ? 'var(--green)' : 'var(--red)'}}>
          {picked.correct ? '✓ Correct!' : '✗ Incorrect'}
        </div>
      )}
      {/* Right or wrong — see the QuizEngine explanation block. NOT applied to
          HotStreakEngine: that mode runs a 60-second clock, so a paragraph on
          every correct answer would break the thing it is for. */}
      {picked && q.hint && (
        <div style={{
          marginTop:10,
          padding:"10px 14px",
          background:"var(--s1)",
          border:"1px solid var(--border)",
          borderRadius:10,
          fontSize:13,
          lineHeight:1.5,
          color:"var(--t2)",
          animation:"fadeIn 0.3s ease-out"
        }}>
          <div style={{fontSize:10,fontWeight:700,color:"var(--t3)",letterSpacing:0.2,fontFamily:"'Inter',sans-serif",marginBottom:4,display:"flex",alignItems:"center",gap:4}}><Lightbulb size={11} strokeWidth={2.5} aria-hidden="true" /> Why?</div>
          <div>{q.hint}</div>
        </div>
      )}
    </div>
  );
}

// ─── ONLINE LOBBY ─────────────────────────────────────────────────────────────
// ─── ONLINE 1V1 ──────────────────────────────────────────────────────────────
// Self-contained: handles all four screens (Create/Join → Lobby → Playing →
// Results) with realtime sync via a single Supabase channel subscribed to the
// game_rooms row. Both clients drive their own state from the row's status
// and answer arrays — no polling, no shared QuizEngine.

// Sprint #92 GGG3: invite URLs are now path-based (balliq.app/join/CODE)
// so iOS Universal Links can match against the /join/* component declared in
// public/.well-known/apple-app-site-association. The legacy ?join=CODE
// query form still parses on the web (the pendingJoinCode init at AppInner
// reads BOTH path and query) so previously-shared invite links keep working.
// Android App Links wiring is queued for a dedicated Android sprint.
export const INVITE_BASE_URL = "https://balliq.app";
// Single source of truth for invite URLs. This used to be dead code that
// screens/OnlineMultiplayer.jsx hand-duplicated inline; the copies had already
// drifted apart in their share text, so the lobby now calls this.
//
// `name` (the host's display name) is optional and rides as ?n= purely so the
// link UNFURLS as a personalised card — api/join.js reads it to render "Alex
// wants to play you" instead of "A mate wants to play you". It is presentation
// only: the join flow keys off the CODE alone, so a missing, stale or spoofed
// name can never affect which room you land in. The iOS Universal Link is
// matched on the /join/* PATH, so appending a query cannot break it, and the
// boot parser's path regex (/^\/join\/([A-Za-z0-9]+)/) ignores the query too.
export const buildInviteUrl = (code, name) => {
  const base = `${INVITE_BASE_URL}/join/${encodeURIComponent(code)}`;
  const who = String(name || "").trim().slice(0, 22);
  return who ? `${base}?n=${encodeURIComponent(who)}` : base;
};

// v1.6 guest entry — display name for anonymous (invite-link) players. Their
// profile username is a server-generated player_xxxxxxxx, which reads like a
// bug in a lobby, so guests get a football-flavoured name instead. Persisted
// so the same guest keeps their name across rooms; the lobby's rename flow
// (set_player_name) writes back here. Capped at 20 chars to match the RPC's
// server-side limit.
const GUEST_NAME_KEY = "biq_guest_name";
const GUEST_ADJECTIVES = ["Turbo", "Golden", "Flying", "Iron", "Rapid", "Mega", "Prime", "Epic", "Wonder", "Rocket"];
const GUEST_NOUNS = ["Striker", "Keeper", "Winger", "Maestro", "Poacher", "Baller", "Gaffer", "Dribbler", "Sweeper", "Target"];
export function getGuestDisplayName() {
  try {
    const stored = localStorage.getItem(GUEST_NAME_KEY);
    if (stored) return stored;
  } catch {}
  const name = `${GUEST_ADJECTIVES[Math.floor(Math.random() * GUEST_ADJECTIVES.length)]} ${GUEST_NOUNS[Math.floor(Math.random() * GUEST_NOUNS.length)]} ${Math.floor(Math.random() * 90) + 10}`;
  try { localStorage.setItem(GUEST_NAME_KEY, name); } catch {}
  return name;
}
export function setGuestDisplayName(name) {
  const v = String(name || "").trim().slice(0, 20);
  if (!v) return;
  try { localStorage.setItem(GUEST_NAME_KEY, v); } catch {}
}

// ─── STAGE 1: ONLINE MULTIPLAYER ─────────────────────────────────────────────
//
// pickMultiplayerQuestions(count = 10) — pulls random questions from QB
// for a multiplayer game and converts them to the SQL contract shape
// expected by start_game's p_questions param: { prompt, options, correct }.
//
// Stage 1E baseline: all categories, all difficulties, no seen_history
// filter (multiplayer is a shared experience, per-user history would
// create asymmetry between players seeing different filtered pools).
// Defensive type filter restricts to `mcq` with exactly 4 options and a
// numeric correct index — QuestionView assumes this shape.
//
// Stage 1F may add mode picker (Classic 10Q / Sprint 5Q) + difficulty
// picker on OnlineEntry; pickMultiplayerQuestions can then accept
// filter args. Stage 1F may also add seen_history integration if friend
// testing surfaces "we keep seeing the same questions" complaints.
export async function pickMultiplayerQuestions(count = 10, packId = "mixed", { escalate = false } = {}) {
  const { QB } = await loadQuestions();
  let eligible = QB.filter(q =>
    q.type === "mcq" &&
    Array.isArray(q.o) && q.o.length === 4 &&
    typeof q.a === "number" &&
    (!q.tag || !RETIRED_TAGS.has(q.tag))
  );
  // Host-selected pack ("cat:PL" / "club:Arsenal"): narrow the pool to one
  // competition or one club. Falls back to the full mixed pool if the pack
  // can't fill the requested count — a short pack must never produce a
  // short game for the whole room.
  let effectivePack = "mixed";
  if (packId && packId !== "mixed") {
    const sep = String(packId).indexOf(":");
    const kind = String(packId).slice(0, sep), key = String(packId).slice(sep + 1);
    let filtered = kind === "cat" ? eligible.filter(q => q.cat === key)
      : kind === "club" ? eligible.filter(q => q.club === CLUB_PACK_TO_QB[key])
      : eligible;
    // Club/league packs are for invested fans — never serve "easy". Drop it
    // whenever the no-easy pool can still sustain a game (>=10); the count logic
    // below shrinks the round if needed, and only a genuinely thin pool keeps
    // easy to avoid starving the room.
    if (kind === "cat" || kind === "club") {
      const noEasy = filtered.filter(q => q.diff !== "easy");
      if (noEasy.length >= 10) filtered = noEasy;
    }
    // Honour the pack whenever it's viable: full pools play at the requested
    // count; a slightly-short pool (>=10) still plays AS THE PACK with a
    // reduced count — a 13-question Ligue 1 survival beats silently serving
    // Mixed while the lobby's topic card says Ligue 1. Only a genuinely thin
    // pool (<10) falls back, and the caller is told so it can toast.
    if (filtered.length >= count) { eligible = filtered; effectivePack = packId; }
    else if (filtered.length >= 10) { eligible = filtered; count = filtered.length; effectivePack = packId; }
  } else if (!packId || packId === "mixed") {
    effectivePack = "mixed";
  }
  // Drop what this device has played recently. The original note here said a
  // seen-filter would "create asymmetry between players seeing different
  // filtered pools" — that reasoning does not apply, because only the HOST
  // reaches this function. One list is picked, stored on the room row, and
  // served identically to everyone; the filter changes WHICH ten questions the
  // room gets, never who sees what.
  //
  // Alex playtested this against Johannes and got two repeats across two
  // consecutive games. That is not the freak event it sounds like, because
  // they were on a TOPIC pack, not Mixed — both repeated questions are
  // cat:"LaLiga". Measured back-to-back repeat rates per pack:
  //     Mixed (6,400)      2%  ->  a non-issue, which is why this hid so long
  //     LaLiga (270)      34%  ->  7% chance of TWO, which is what he hit
  //     Ligue 1 (89)      72%
  //     chaos (39)        97%  ->  82% chance of two
  // So the defect scales with how narrow the topic is, and topic packs are
  // exactly what invested players choose.
  //
  // applySeenFilter degrades the right way for the thin packs: it never
  // shortens a game, and once a pack is exhausted it tops up with the
  // LEAST-recently-seen rather than resurfacing at random. chaos still
  // repeats — 39 questions cannot fill two 10-question games otherwise — but
  // it now cycles instead of colliding.
  eligible = applySeenFilter(eligible, count, qbHistKey);
  // Math.random() - 0.5 sort is biased but undetectable for casual
  // trivia. Upgrade to Fisher-Yates only if a user complaint surfaces.
  const shuffled = eligible.slice().sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, count);
  // Survival format: escalate easy → medium → hard so the elimination
  // game ramps up instead of dying on a random hard opener.
  if (escalate) {
    const rank = { easy: 0, medium: 1, hard: 2 };
    picked.sort((a, b) => (rank[a.diff] ?? 1) - (rank[b.diff] ?? 1));
  }
  return {
    effectivePack,
    questions: picked.map(q => {
      // Per-game option shuffle: authored order skews correct answers toward
      // A/B and turns rematches into answer-position memory tests.
      const idx = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
      // `id` rides along so a multiplayer report identifies the exact bank row.
      // Without it a report lands with a null question_id and only the prompt
      // text to match on. Additive: existing readers take prompt/options/correct
      // and ignore the rest.
      return { id: q.id, prompt: q.q, options: idx.map(i => q.o[i]), correct: idx.indexOf(q.a) };
    }),
  };
}

// QUESTION_DURATION_MS — keep in sync with server submit_answer's
// v_question_dur (currently 20000ms). See feedback_question_duration_constant.md
// memory note. If you change this, you MUST update the SQL function body
// via a CREATE OR REPLACE FUNCTION migration in the same change set —
// drift between client and server constants causes unfair scoring (client
// thinks 20s, server scores against 30s, or vice versa).
export const QUESTION_DURATION_MS = 20000;

// OnlineEntry: choice screen — "Create Room" or "Join with Code". Calls
// create_room / join_room RPCs directly; on success, navigates to the
// MultiplayerLobby via onLobbyEnter callback. Specific error handling for
// known SQLSTATEs (room full, room not found, room not accepting joins).
/* Online-multiplayer components live in ./screens/OnlineMultiplayer.jsx —
   lazy-loaded via the React.lazy imports near the top of this file. */

// ─── XP + LEVEL SYSTEM ────────────────────────────────────────────────────────
// LEVELS + getLevelInfo extracted to ./lib/scoring.js (Sprint #13 Stage 1).

// Footle XP (opportunity-scan #3): the flagship daily habit previously fed
// ZERO progression — levels/shields/badges exerted no pull on exactly the
// daily-loop users. Won: fewer guesses = more XP (60 → 30); lost: 10 for
// showing up (the streak-keeping visit still counts for something).

// Online multiplayer XP.
//
// It had none. Every other mode feeds the level economy — a solo result screen
// ends on "+N XP earned", Footle pays via getFootleXP, Transfer Trail pays
// 40/10 — and the one mode that asks most of a player (find an opponent,
// coordinate, play live) paid nothing at all. A playtester called the MP
// game-over screen "dull"; the visual pass that followed added a VS board,
// count-ups and a podium, and the screen is not dull any more. It was still the
// only ending in the app with no progression on it.
//
// Same 10-per-correct rate as a standard quiz, because they are the same
// questions and the same effort. The win bonus mirrors the solo perfect bonus:
// 50 for the thing that mode is actually about. The floor exists because unlike
// solo you can play well and still lose to someone who played better, and a
// zero-XP ending is a reason not to come back.
// ⚠️ MP `score` is POINTS (thousands), not a correct-answer count. This
// formula was copied from the solo modes, where `score` is the number correct
// (0-15) — so `score * 10` meant ~150 XP there and ~50,000 here. Measured on
// 2026-08-03: a 5274-point win paid 52,790 XP and a 3329-point LOSS paid
// 33,290, against a site-wide median of 50. Only 2 of 125 profiles were
// inflated, which is why this is worth correcting now rather than never.
//
// The divisor targets parity with a strong solo game (a perfect 15-question
// run pays 200): real race scores run ~1,600-5,900, so /40 pays ~40-150, plus
// a 50 win bonus. Better play still pays more; a match is no longer worth a
// thousand daily quizzes.
export function getMpXP(won, score) {
  return Math.max(15, Math.round((score || 0) / 40) + (won ? 50 : 0));
}



// ─── BRANDED SHARE CARD (NEW, 390×600 PORTRAIT) ─────────────────────────────
// Variants:
//   'wordle'    — Today's Puzzle. Score + emoji-tile grid.
//   'standard'  — Classic / Survival / Daily / Chaos / Legends / WC2026.
//   'hotstreak' — Hot Streak. Big streak number with orange accent.
//
// Returns a Promise<Blob> of a PNG. The card layout is fixed at 390×600
// portrait so it slots nicely into iOS / Android share sheets.

const SHARE_CARD_W = 390;
const SHARE_CARD_H = 600;

// Round-rect helper used for the rounded canvas clip and emoji tiles.
function _roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

// Word-wrap helper. Draws each line via fillText, returns the next y after
// the last line. Used for variable-length labels (BallIQ funny label,
// Hot Streak descriptor) so they don't overflow on long strings.
function _wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text || "").split(/\s+/);
  let line = "";
  let curY = y;
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, curY);
      line = w;
      curY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, curY);
  return curY;
}

// Load an image for canvas compositing (profile-card photo avatar). crossOrigin
// 'anonymous' keeps the canvas untainted so toBlob() works (Supabase public
// storage sends CORS headers). Times out / rejects so a slow or blocked image
// falls back to the emoji avatar rather than hanging the share.
function _loadImage(url, timeoutMs = 3000) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    const t = setTimeout(() => reject(new Error("img timeout")), timeoutMs);
    img.onload = () => { clearTimeout(t); resolve(img); };
    img.onerror = () => { clearTimeout(t); reject(new Error("img error")); };
    // Unique per-load query so the CORS request never reuses a no-CORS cached
    // entry — on WKWebView that opaque cached response would taint the canvas
    // and silently degrade the photo card to text at toBlob().
    img.src = url + (url.includes("?") ? "&" : "?") + "_cb=" + Date.now();
  });
}

// Canvas has no CSS letter-spacing. `ctx.letterSpacing` exists in modern
// WebKit/Chrome but not in older WKWebView, and the rating is the hero — a
// gappy "8 7" on an older phone is not an acceptable degradation. So advance
// manually: measure each glyph and add the tracking ourselves. Works everywhere.
function _trackedText(ctx, text, x, y, tracking) {
  let cx = x;
  for (const ch of String(text)) {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + tracking;
  }
  return cx - tracking - x;   // total advance, for centring callers
}

function _trackedWidth(ctx, text, tracking) {
  let w = 0;
  for (const ch of String(text)) w += ctx.measureText(ch).width + tracking;
  return w - tracking;
}

async function generateShareCard(type, data) {
  // ⚠️ THE IQ CARD GETS ITS OWN CANVAS, AND IT IS THE BIGGEST FIX HERE.
  // 390x600 is a 1x render. Saved to a modern camera roll and opened on a
  // ~1200px-wide phone it is upscaled 3x and looks soft — which is most of why
  // Alex called it "assembled, not designed". Layout cannot rescue resolution.
  // 1080x1350 is 4:5, the tallest ratio Instagram allows in feed and the one
  // people actually post, and it sits inside a 9:16 Story with clean margins.
  const IS_IQ = type === "iq";
  const W = IS_IQ ? 1080 : SHARE_CARD_W, H = IS_IQ ? 1440 : SHARE_CARD_H;
  // The IQ card is authored at full resolution above; every other card is
  // authored in 390x600 coordinates, so give those a 2x backing store and
  // scale the context — same sharpness fix, zero layout-math changes.
  const SCALE = IS_IQ ? 1 : 2;
  const canvas = document.createElement("canvas");
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  const ctx = canvas.getContext("2d");
  if (SCALE !== 1) ctx.scale(SCALE, SCALE);

  // Wait up to 1s for fonts to load. Without this the first card draw can
  // fall back to the platform default which looks off.
  try {
    if (document.fonts && document.fonts.ready) {
      await Promise.race([
        document.fonts.ready,
        new Promise((res) => setTimeout(res, 1000)),
      ]);
    }
  } catch {}

  // Clip to a 20px rounded rect so the share card has soft corners on
  // platforms that render the file as-is (iMessage, Slack image previews).
  ctx.save();
  _roundRectPath(ctx, 0, 0, W, H, IS_IQ ? 0 : 20);
  ctx.clip();

  // Background
  ctx.fillStyle = "#0B0C10";
  ctx.fillRect(0, 0, W, H);

  // ⚠️ SKIPPED FOR THE IQ CARD. This chrome — accent bar, wordmark row, divider,
  // footer URL — wraps the small result cards, and wrapping the rating card in
  // it produced a CARD INSIDE A CARD: two nested rounded rects each with their
  // own border and padding, with the brand stamped THREE times (wordmark, URL
  // top-right, URL again at the foot). That is exactly what "assembled rather
  // than designed" looks like. The IQ card is one object and carries the mark
  // once, placed deliberately.
  const padX = 24;
  const headerY = 38;
  ctx.textBaseline = "alphabetic";
  if (!IS_IQ) {
  ctx.fillStyle = "#58CC02";
  ctx.fillRect(0, 0, W, 6);
  ctx.font = '800 22px Inter, "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "left";
  ctx.fillText(`⚽ ${APP_NAME}`, padX, headerY);

  ctx.font = '500 12px Inter, "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = "#9BA0B8";
  ctx.textAlign = "right";
  ctx.fillText("balliq.app", W - padX, headerY);

  // Divider
  ctx.fillStyle = "#2F3240";
  ctx.fillRect(padX, 56, W - padX * 2, 1);

  // Centered footer URL
  ctx.font = '500 13px Inter, "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = "#9BA0B8";
  ctx.textAlign = "center";
  ctx.fillText("balliq.app", W / 2, H - 24);
  }

  // Per-variant content. All variants set textAlign = "center" by default.
  ctx.textAlign = "center";
  const cx = W / 2;

  if (type === "wordle") {
    const grades = Array.isArray(data?.grades) ? data.grades : [];
    const score = data?.score ?? 0;
    const total = data?.total ?? 6;
    const dateLabel = data?.dateLabel || "";
    const headline = data?.failed ? "Didn't solve today" : `Solved in ${score} ${score === 1 ? "guess" : "guesses"}`;
    const colorMap = { green: "#58CC02", yellow: "#FFC107", grey: "#3A3F55" };

    // Mode label
    ctx.font = '700 13px Inter, "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = "#9BA0B8";
    ctx.fillText("TODAY'S PUZZLE", cx, 110);

    // Date
    ctx.font = '500 12px Inter, "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = "#9BA0B8";
    ctx.fillText(dateLabel, cx, 130);

    // Result headline — explicit "guesses" framing rather than a "N/6"
    // fraction. In Footle fewer guesses is better, so "3/6" read like a
    // quiz score (3-of-6 correct) and undersold a good result. Sprint #99.
    ctx.font = '800 34px Inter, "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = "#58CC02";
    ctx.fillText(headline, cx, 212);

    // Emoji-tile grid. 36×36 tiles, 4px gap, rows centered horizontally.
    const tile = 36;
    const tileGap = 4;
    const rowGap = 4;
    const cols = grades[0]?.length || 5;
    const rowW = cols * tile + (cols - 1) * tileGap;
    const startX = cx - rowW / 2;
    let gy = 250;
    for (const row of grades) {
      for (let i = 0; i < row.length; i++) {
        const color = colorMap[row[i]] || "#3A3F55";
        const tx = startX + i * (tile + tileGap);
        ctx.fillStyle = color;
        _roundRectPath(ctx, tx, gy, tile, tile, 4);
        ctx.fill();
      }
      gy += tile + rowGap;
    }

    // Subtitle
    ctx.font = '700 15px Inter, "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText("Can you beat me? ⚽", cx, Math.min(gy + 28, H - 60));
  } else if (type === "hotstreak") {
    const score = data?.score ?? 0;

    ctx.font = '700 13px Inter, "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = "#9BA0B8";
    ctx.fillText("HOT STREAK", cx, 130);

    ctx.font = '900 88px "JetBrains Mono", "Courier New", monospace';
    ctx.fillStyle = "#FF6A00";
    ctx.fillText(String(score), cx, 260);

    // Descriptor — wrapped to 280px
    ctx.font = '600 15px Inter, "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = "#FFFFFF";
    _wrapText(ctx, "questions answered correctly in a row", cx, 308, 280, 22);

    // Subtitle
    ctx.font = '700 15px Inter, "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText("Can you beat me? ⚽", cx, 520);
  } else if (type === "iq") {
    // ── THE BALL IQ CARD ────────────────────────────────────────────────────
    // Designed as an editorial card, not a screenshot of a screen and not a
    // grid of chips. Three earlier attempts read as "assembled": boxes stacked
    // in horizontal bands, six equal-weight tiles heavier than the rating they
    // were meant to support, and the brand stamped three times. What fixed it:
    //   · the stats are an OPEN LIST on hairlines, not tiles in a box
    //   · the numeral and the avatar are the same optical size, so the top of
    //     the card is one composition rather than a number with a bullet
    //   · one diagonal foil sweep across the whole card, so it is one material
    //   · the invitation gets its own strip below a rule, not the next band down
    //
    // ⚠️ THIS IS THE SAME CARD THE PROFILE SHOWS. The profile renders the 540x620
    // content block; the shared PNG is that block plus a 100px footer carrying
    // "Can you beat me?" and the URL. Nothing is redesigned between them — the
    // whole point is that the card in a chat is the card you find on your own
    // profile after installing. Change one, change both.
    //
    // Drawn at 2x the design (1080x1440) because the mock is authored at 540x720.
    const card = data?.card;
    const t = tierPalette(card?.tier);
    const name = (data?.name || `${APP_NAME} Player`).slice(0, 14);
    const stops = String(t.bg).match(/#[0-9a-f]{6}/gi) || ["#1B1E27", "#080a0f"];
    const S2 = 2;                       // design px -> canvas px
    const px = (n) => n * S2;

    // Ground, bloom, foil sweep — one material.
    const ground = ctx.createLinearGradient(0, 0, W * 0.42, H);
    ground.addColorStop(0, stops[0]);
    ground.addColorStop(0.58, stops[1] || stops[0]);
    ground.addColorStop(1, "#090807");
    ctx.fillStyle = ground;
    ctx.fillRect(0, 0, W, H);
    const bloom = ctx.createRadialGradient(W * 0.16, H * 0.06, 0, W * 0.16, H * 0.06, W * 0.72);
    bloom.addColorStop(0, _tint(t.accent, 0.19));
    bloom.addColorStop(1, _tint(t.accent, 0));
    ctx.fillStyle = bloom;
    ctx.fillRect(0, 0, W, H);
    const sweep = ctx.createLinearGradient(W * 0.9, 0, W * 0.1, H);
    sweep.addColorStop(0.30, _tint(t.accent, 0));
    sweep.addColorStop(0.47, _tint(t.accent, 0.12));
    sweep.addColorStop(0.62, _tint(t.accent, 0));
    ctx.fillStyle = sweep;
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    // Wordmark, once.
    ctx.font = `900 ${px(13)}px Inter, "Helvetica Neue", Arial, sans-serif`;
    ctx.fillStyle = _tint(t.text, 0.5);
    ctx.fillText("B A L L   I Q", px(40), px(52));

    // Rating and avatar: same optical size, held as a pair.
    ctx.font = `800 ${px(150)}px "JetBrains Mono", "Courier New", monospace`;
    ctx.fillStyle = t.accent;
    _trackedText(ctx, String(card?.overall ?? "—"), px(30), px(205), px(-5));

    ctx.font = `900 ${px(11)}px Inter, "Helvetica Neue", Arial, sans-serif`;
    ctx.fillStyle = _tint(t.text, 0.5);
    ctx.fillText("O V E R A L L", px(40), px(231));

    ctx.font = `900 ${px(14)}px Inter, "Helvetica Neue", Arial, sans-serif`;
    ctx.fillStyle = _tint(t.accent, 0.92);
    ctx.fillText((t.label || "").split("").join(" "), px(40), px(261));

    const aR = px(75), aCx = W - px(38) - aR, aCy = px(76) + aR;
    ctx.save();
    ctx.beginPath();
    ctx.arc(aCx, aCy, aR, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    if (data?.avatarImg) {
      ctx.drawImage(data.avatarImg, aCx - aR, aCy - aR, aR * 2, aR * 2);
    } else {
      ctx.fillStyle = data?.avatarBg || "#1F2430";
      ctx.fillRect(aCx - aR, aCy - aR, aR * 2, aR * 2);
      ctx.textAlign = "center";
      ctx.font = `900 ${px(68)}px Inter, "Helvetica Neue", Arial, sans-serif`;
      ctx.fillStyle = "#FFFFFF";
      ctx.textBaseline = "middle";
      ctx.fillText(data?.initial || "?", aCx, aCy + px(3));
      ctx.textBaseline = "alphabetic";
      ctx.textAlign = "left";
    }
    ctx.restore();
    ctx.beginPath();
    ctx.arc(aCx, aCy, aR, 0, Math.PI * 2);
    ctx.strokeStyle = _tint(t.accent, 0.85);
    ctx.lineWidth = px(4);
    ctx.stroke();

    ctx.font = `900 ${px(42)}px Inter, "Helvetica Neue", Arial, sans-serif`;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(name, px(38), px(330));

    if (data?.levelName) {
      ctx.font = `700 ${px(13.5)}px Inter, "Helvetica Neue", Arial, sans-serif`;
      ctx.fillStyle = _tint(t.text, 0.5);
      ctx.fillText(`${data.levelName} · ${Number(data.xp || 0).toLocaleString()} XP`, px(39), px(364));
    }

    // The six, as an open two-column list on hairlines. No tiles.
    const rows = Array.isArray(card?.ratings) ? card.ratings : [];
    const played = rows.filter((r) => r.answered >= MIN_RATED_ANSWERS);
    const bestAbbr = played.length ? played.reduce((a, b) => (b.rating > a.rating ? b : a)).abbr : null;
    const colW = (W - px(76) - px(36)) / 2;
    const listTop = px(404), rowH = px(64);
    rows.forEach((r, i) => {
      const cIdx = i % 2, rIdx = Math.floor(i / 2);
      const x = px(38) + cIdx * (colW + px(36));
      const y = listTop + rIdx * rowH;
      ctx.fillStyle = "rgba(255,255,255,0.10)";
      ctx.fillRect(x, y, colW, 2);
      ctx.beginPath();
      ctx.arc(x + px(4.5), y + px(27), px(4.5), 0, Math.PI * 2);
      ctx.fillStyle = r.color || "#8A8A8A";
      ctx.fill();
      // ⚠️ 16px, not 14. At 14 the label sat at half the value's height and read
      // as a caption, so the numbers floated and the row lost its subject.
      ctx.font = `800 ${px(16)}px Inter, "Helvetica Neue", Arial, sans-serif`;
      ctx.fillStyle = _tint(t.text, 0.72);
      ctx.fillText(r.abbr, x + px(22), y + px(34));
      ctx.textAlign = "right";
      ctx.font = `800 ${px(27)}px "JetBrains Mono", "Courier New", monospace`;
      ctx.fillStyle = r.abbr === bestAbbr ? t.accent : _tint(t.text, 0.92);
      ctx.fillText(r.answered >= MIN_RATED_ANSWERS ? String(r.rating) : "—", x + colW, y + px(36));
      ctx.textAlign = "left";
    });

    // The footer strip — the ONLY thing the profile card does not show.
    ctx.fillStyle = _tint(t.accent, 0.20);
    ctx.fillRect(px(38), H - px(100), W - px(76), 2);
    ctx.textAlign = "center";
    ctx.font = `900 ${px(20)}px Inter, "Helvetica Neue", Arial, sans-serif`;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText("Can you beat me?", W / 2, H - px(58));
    ctx.font = `700 ${px(13)}px Inter, "Helvetica Neue", Arial, sans-serif`;
    ctx.fillStyle = _tint(t.text, 0.45);
    ctx.fillText("balliq.app", W / 2, H - px(30));
  } else {
    // Standard variant — Classic, Survival, Daily, Chaos, Legends, WC2026
    const modeLabel = (data?.modeLabel || "Quiz").toUpperCase();
    const score = data?.score ?? 0;
    const total = data?.total ?? 0;
    const accuracy = total > 0 ? Math.round((score / total) * 100) : 0;
    const streak = data?.streak;

    ctx.font = '700 13px Inter, "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = "#9BA0B8";
    ctx.fillText(modeLabel, cx, 130);

    ctx.font = '900 80px "JetBrains Mono", "Courier New", monospace';
    ctx.fillStyle = "#58CC02";
    ctx.fillText(`${score}/${total}`, cx, 250);

    ctx.font = '700 18px Inter, "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(`${accuracy}% accuracy`, cx, 292);

    // Accuracy bar — fills the band with a real visual instead of dead space.
    const barW = W - padX * 2 - 40, barX = cx - barW / 2, barY = 318, barH = 14;
    _roundRectPath(ctx, barX, barY, barW, barH, 7);
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fill();
    const fillW = Math.max(barH, Math.round(barW * Math.min(100, Math.max(0, accuracy)) / 100));
    _roundRectPath(ctx, barX, barY, fillW, barH, 7);
    ctx.fillStyle = "#58CC02";
    ctx.fill();

    // Tier tagline keyed to accuracy.
    const tier = resultVerdict(accuracy);
    ctx.font = '800 24px Inter, "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(tier, cx, 382);

    if (streak && streak >= 3) {
      ctx.font = '700 15px Inter, "Helvetica Neue", Arial, sans-serif';
      ctx.fillStyle = "#FF6A00";
      ctx.fillText(`🔥 ${streak} in a row`, cx, 416);
    }

    // CTA — filled green pill (matches the profile card).
    const ctaText = "Can you beat me? ⚽";
    ctx.font = '800 16px Inter, "Helvetica Neue", Arial, sans-serif';
    const ctaW = ctx.measureText(ctaText).width + 46;
    const ctaH = 42, ctaY = 470;
    ctx.fillStyle = "#58CC02";
    _roundRectPath(ctx, cx - ctaW / 2, ctaY, ctaW, ctaH, 21);
    ctx.fill();
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#06250F";
    ctx.fillText(ctaText, cx, ctaY + ctaH / 2 + 1);
    ctx.textBaseline = "alphabetic";
  }

  ctx.restore();

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("toBlob returned null"));
    }, "image/png");
  });
}

// Share orchestrator. Tries the file share path first; on any failure falls
// back to a download (with a "Saved!" toast) and finally the text share.
//
//   opts.onToast      - (msg) => void  | optional — used for the Saved/copy toast
//   opts.textFallback - string         | optional — text to share if image flow fails
export async function shareCard(type, data, opts = {}) {
  loopEvent("share-card-" + type);
  const { onToast = () => {}, textFallback = "" } = opts;
  let blob;
  try {
    blob = await generateShareCard(type, data);
  } catch (err) {
    // Couldn't even render the card — fall straight to text.
    if (textFallback) {
      try {
        if (navigator.share) await navigator.share({ text: textFallback, url: "https://balliq.app" });
        else if (navigator.clipboard) {
          await navigator.clipboard.writeText(textFallback);
          onToast("Copied to clipboard 📋");
        }
      } catch {}
    }
    return;
  }

  // Native iOS/Android: the Web Share API's file path is unreliable in the
  // Capacitor WebView (canShare({files}) often returns false, and the
  // <a download> fallback below is a no-op there) — so every share quietly
  // degraded to the plain {text, url} fallback. Targets then diverged:
  // iMessage rendered text + a generic link preview, Snapchat (whose share
  // extension only ingests URLs) showed a bare link. Writing the PNG to the
  // cache dir and sharing the file URI through @capacitor/share hands every
  // image-capable target the actual card. Failure falls through to the
  // existing web chain, so worst case is the old behavior.
  // Companion line under the card — contextual per card type ("Got today's
  // Footle in 3/6 — can you beat me?"). Deliberately a plain-TEXT item with
  // the link inline — NOT a url field. URL items are what share extensions
  // latch onto (a url field is exactly what made Snapchat drop the card and
  // show a bare link). A text item rides along as low priority: iMessage
  // renders card + tappable text bubble; image-first extensions take the
  // PNG and ignore the text.
  const SHARE_LINE = (() => {
    // Deep-link recipients into the APP (or the exact quiz they were just
    // beaten at), never the marketing homepage — the /play boot routing
    // handles ?club= / ?quiz= already. data.deepLink is set by shareScore
    // for club/league results. (opportunity-scan #1)
    const deepPath = (data && typeof data.deepLink === "string" && data.deepLink.startsWith("/")) ? data.deepLink : "/play";
    const link = `⚽ https://balliq.app${deepPath}`;
    try {
      if (type === "wordle") {
        // "3/6" reads as "half right" to non-players — say attempts instead.
        // The PNG card keeps the emoji grid, which carries that context.
        // The puzzle number makes the line comparable across feeds.
        // Footle deep-links to the puzzle itself (/footle boot alias) so
        // recipients land in the game, not on the marketing home. Other card
        // types keep the homepage `link` above.
        const wLink = "⚽ https://balliq.app/footle";
        const n = data.num > 0 ? ` #${data.num}` : "";
        if (data.failed) return `Footle${n} got me — can you do better? ${wLink}`;
        if (data.score === 1) return `Got Footle${n} on my FIRST guess 🎯 ${wLink}`;
        return `Got Footle${n} in ${data.score} guesses — can you beat me? ${wLink}`;
      }
      if (type === "hotstreak") return `I hit a ${data.score}-streak in Hot Streak — beat that ${link}`;
      if (data?.modeLabel && data?.score != null && data?.total != null) {
        return `I scored ${data.score}/${data.total} on ${data.modeLabel} — can you beat me? ${link}`;
      }
    } catch {}
    return `Can you beat it? ${link}`;
  })();

  if (IS_NATIVE) {
    const fname = `balliq-share-${Date.now()}.png`;
    let uri = null;
    try {
      const b64 = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result).split(",")[1]);
        r.onerror = () => reject(new Error("FileReader failed"));
        r.readAsDataURL(blob);
      });
      await Filesystem.writeFile({ path: fname, data: b64, directory: Directory.Cache });
      uri = (await Filesystem.getUri({ path: fname, directory: Directory.Cache })).uri;
    } catch {
      // Couldn't even materialise the file — fall through to the web chain.
      uri = null;
    }
    if (uri) {
      // Preferred: local ShareCardPlugin — card + per-target text item
      // (text withheld from Snapchat-class extensions; see plugin header).
      try {
        await NativeShareCard.share({ fileUrl: uri, text: SHARE_LINE });
        Filesystem.deleteFile({ path: fname, directory: Directory.Cache }).catch(() => {});
        return; // resolves on share AND on sheet-dismiss — both are final
      } catch (err) {
        // Plugin missing ('not implemented') or failed — fall back to the
        // proven file-only sheet via @capacitor/share. No text: text+image
        // is exactly the payload that breaks Snapchat-class extensions.
        try {
          await CapShare.share({ files: [uri] });
          Filesystem.deleteFile({ path: fname, directory: Directory.Cache }).catch(() => {});
          return;
        } catch (err2) {
          Filesystem.deleteFile({ path: fname, directory: Directory.Cache }).catch(() => {});
          // Dismissed sheet surfaces as "Share canceled" — user intent.
          if (/cancel/i.test(err2?.message || "")) return;
          // Anything else: fall through to the web chain below.
        }
      }
    }
  }

  const file = new File([blob], "balliq-result.png", { type: "image/png" });
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
      // files + text (link inline), still no url field — see SHARE_LINE note.
      await navigator.share({ files: [file], text: SHARE_LINE });
      return;
    }
  } catch (err) {
    // Some platforms reject on user dismiss — bail without falling further.
    if (err && err.name === "AbortError") return;
  }

  // Download fallback — works on desktop browsers and mobile platforms that
  // don't expose file share. The user can then attach the PNG anywhere.
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "balliq-result.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    onToast("Saved! Share from your photos 📸");
    return;
  } catch {}

  // Last-ditch text fallback.
  if (textFallback) {
    try {
      if (navigator.share) await navigator.share({ text: textFallback, url: "https://balliq.app" });
      else if (navigator.clipboard) {
        await navigator.clipboard.writeText(textFallback);
        onToast("Copied to clipboard 📋");
      }
    } catch {}
  }
}

// drawScoreCard removed — generateShareCard / shareCard above is the
// canonical share-card path. Plaintext fallbacks live inside shareScore.


// ─── CONFETTI ─────────────────────────────────────────────────────────────────
// ─── COUNT-UP ANIMATION ───────────────────────────────────────────────────────
// Animates a number from 0 to `value` over `duration` ms. Triggers haptic on finish.
export function Confetti() {
  const canvasRef = useRef(null);
  useEffect(() => {
    // Honor prefers-reduced-motion (vestibular disorders / migraine): skip the
    // full-viewport confetti animation entirely. (medical, accessibility.)
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    // visualViewport reflects the actual visible area (excludes a collapsed
    // mobile URL bar). innerWidth/Height fall back for older WebViews.
    canvas.width = window.visualViewport?.width ?? window.innerWidth;
    canvas.height = window.visualViewport?.height ?? window.innerHeight;
    const pieces = Array.from({length:80}, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      w: Math.random() * 10 + 5,
      h: Math.random() * 6 + 3,
      r: Math.random() * Math.PI * 2,
      dr: (Math.random() - 0.5) * 0.2,
      vy: Math.random() * 3 + 2,
      vx: (Math.random() - 0.5) * 2,
      color: ["#58CC02","#FFC800","#FF4B4B","#1CB0F6","#CE82FF","#FF9600"][Math.floor(Math.random()*6)],
    }));
    let alive = true;
    const draw = () => {
      if (!alive) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach(p => {
        p.y += p.vy; p.x += p.vx; p.r += p.dr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
        ctx.fillStyle = p.color; ctx.globalAlpha = Math.max(0, 1 - p.y / canvas.height);
        ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
        ctx.restore();
      });
      if (pieces.some(p => p.y < canvas.height)) requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
    return () => { alive = false; };
  }, []);
  return <canvas ref={canvasRef} aria-hidden="true" style={{position:"fixed",top:0,left:0,pointerEvents:"none",zIndex:500,width:"100%",height:"100%"}} />;
}


// ─── DAILY SOCIAL PROOF ───────────────────────────────────────────────────────
// Shows "You beat X% of players today" based on mock score distribution.
// Uses seeded randomness so the number doesn't change between views.
// Distribution follows a realistic curve: most players score 5-7, few score 10.
// Honest daily-completion badge. The previous DailySocialProof showed a
// fake percentile and fake player count; both were uncalibrated and
// risked falling foul of App Store guideline 2.3 (Accurate Metadata).
// This replacement only states facts about the score the user actually
// got — no fabricated comparisons.
function DailySocialProof({ score, total }) {
  const { emoji, headline, sub } = dailyTierCopy(score, total);
  const safeTotal = total || 7;
  const safeScore = Math.max(0, Math.min(safeTotal, score || 0));

  return (
    <div style={{
      background: "var(--s1)",
      border: "1px solid var(--border)",
      borderRadius: 16,
      padding: "18px 20px",
      marginBottom: 12,
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,transparent 0%,var(--accent) 50%,transparent 100%)",opacity:0.8}} />
      <div style={{
        fontSize: 11,
        fontWeight: 700,
        color: "var(--accent)",
        letterSpacing: 0.16,
        fontFamily: "'Inter',sans-serif",
        marginBottom: 10,
        textTransform: "uppercase",
      }}>
        Daily 7 Complete
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 4 }}>
        <div style={{
          fontSize: 48,
          fontWeight: 900,
          letterSpacing: -2,
          color: "var(--t1)",
          lineHeight: 1,
          fontFamily: "'Inter',sans-serif",
        }}>
          {safeScore}<span style={{ fontSize: 28, color: "var(--t3)" }}>/{safeTotal}</span>
        </div>
        <div style={{ fontSize: 32, lineHeight: 1 }}>{emoji}</div>
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--t1)", marginBottom: 4 }}>
        {headline}
      </div>
      <div style={{ fontSize: 12, color: "var(--t2)" }}>
        {sub}
      </div>
    </div>
  );
}

export function ReviewQuestionCard({ a, index }) {
  const { q, type, cat, options, userIdx, correctIdx, userText, correctText, isCorrect, timedOut } = a;
  return (
    <div className={`dr-q ${isCorrect ? 'dr-q-right' : 'dr-q-wrong'}`}>
      <div className="dr-q-head">
        <span className="dr-q-mark">{isCorrect ? '✓' : '✗'}</span>
        <span className="dr-q-num">Q{index + 1}</span>
        {cat && <span className="dr-q-cat">{cat}</span>}
        {timedOut && <span className="dr-q-timeout">timed out</span>}
      </div>
      <div className="dr-q-text">{q}</div>
      {(type === 'mcq' || type === 'tf') && Array.isArray(options) ? (
        <div className="dr-opts">
          {options.map((opt, idx) => {
            let cls = 'dr-opt';
            if (idx === correctIdx) cls += ' dr-opt-correct';
            if (idx === userIdx && !isCorrect) cls += ' dr-opt-user-wrong';
            return (
              <div key={idx} className={cls}>
                <span className="dr-opt-text">{opt}</span>
                {idx === correctIdx && <span className="dr-opt-tag">correct</span>}
                {idx === userIdx && !isCorrect && <span className="dr-opt-tag dr-opt-tag-user">your pick</span>}
              </div>
            );
          })}
        </div>
      ) : type === 'typed' ? (
        <div className="dr-typed">
          {userText && (
            <div className={isCorrect ? 'dr-typed-row dr-typed-correct' : 'dr-typed-row dr-typed-user-wrong'}>
              <span className="dr-typed-mark">{isCorrect ? '✓' : '✗'}</span>
              <span>You typed: <strong>{userText}</strong></span>
            </div>
          )}
          {!isCorrect && correctText && (
            <div className="dr-typed-row dr-typed-correct">
              <span className="dr-typed-mark">✓</span>
              <span>Correct: <strong>{correctText}</strong></span>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function StatRow({ label, value, valueColor }) {
  return (
    <div style={{
      display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"12px 2px", borderBottom:"1px solid var(--border)",
    }}>
      <span style={{fontSize:14, color:"var(--t2)", fontWeight:500}}>{label}</span>
      <span
        className="numeric-mono"
        style={{fontSize:16, fontWeight:700, color:valueColor || "var(--t1)"}}
      >
        {value}
      </span>
    </div>
  );
}


// ─── CLUB QUIZ SCREEN ────────────────────────────────────────────────────────
// What a fan actually types. CLUB_COLOUR_ALIASES already covers the transfer
// shorthand (spurs, bvb, man utd, atletico…) because the Trail needed the same
// normalisation, so it is reused rather than duplicated — these are only the
// terrace nicknames it lacks. Search-only: never rendered, so a wrong-ish entry
// costs nothing but a stray match.
export const CLUB_SEARCH_NICKNAMES = {
  gunners: "Arsenal", reds: "Liverpool", toffees: "Everton", citizens: "Man City",
  "red devils": "Man United", devils: "Man United", blues: "Chelsea",
  barca: "Barcelona", barça: "Barcelona", madrid: "Real Madrid", juve: "Juventus",
  nerazzurri: "Inter", rossoneri: "AC Milan", gers: "Rangers", hoops: "Celtic",
  magpies: "Newcastle", hammers: "West Ham", villans: "Aston Villa",
  bianconeri: "Juventus", merengues: "Real Madrid", cityzens: "Man City",
  lilywhites: "Tottenham", potters: "Stoke City", baggies: "West Brom",
};

function LeagueQuizScreen({ onStart, onBack }) {
  React.useEffect(() => {
    // Bank warmed in the background — see the club picker above for why. The
    // per-league count this used to compute was rendered in the rows (disguise
    // #9 of the no-counts rule) and is deliberately gone.
    prefetchQuestions();
  }, []);
  return (
    <div className="screen">
      <div className="page-hdr">
        <button className="back-btn" onClick={onBack} aria-label="Go back">←</button>
        <div className="page-title">League Quizzes</div>
      </div>
      <p style={{fontSize:13,color:"var(--t2)",lineHeight:1.7,marginBottom:20}}>
        Pick a competition — every answer builds that league's rating on your player card.
      </p>
      {LEAGUE_QUIZ_SECTIONS.map((section) => (
        <div key={section.label} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--t2)", margin: "0 0 8px 2px" }}>{section.label}</div>
          <div className="mode-list">
            {section.items.map((it) => {
              const lightRow = clubReadableText(it.color) === "#0B0C10";
              const a1 = lightRow ? 0.20 : 0.32, a2 = lightRow ? 0.05 : 0.06;
              return (
                <button key={it.cat} type="button" className="mode-item" onClick={() => { haptic("select"); onStart(it.cat); }}
                  style={{ background: `linear-gradient(90deg, ${clubHexToRgba(it.color, a1)} 0%, ${clubHexToRgba(it.color, a2)} 100%)`, borderColor: clubHexToRgba(it.color, lightRow ? 0.5 : 0.4) }}>
                  <div className="mi-icon" style={{ background: it.color, borderRadius: 11, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, flexShrink: 0, boxShadow: `0 2px 8px ${clubHexToRgba(it.color, 0.45)}` }}>
                    <span style={{ fontWeight: 900, fontSize: 13, letterSpacing: 0.3, color: clubReadableText(it.color) }}>{it.abbr}</span>
                  </div>
                  <div className="mi-body">
                    <div className="mi-name">{it.name}</div>
                    {/* ⚠️ NO COUNT — disguise #9 (2026-08-19). This printed
                        "556 questions" per league: an inventory count in
                        user-facing copy (binding rule), and the thin leagues
                        advertised exactly how thin they were — the same reason
                        the club-page "42 Full set" control was banned. The
                        rating hook is the picker's actual promise, and it
                        cannot rot. */}
                    <div className="mi-desc">{`Builds your ${it.abbr} rating`}</div>
                  </div>
                  <div className="mi-arrow">→</div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Local head-to-head history (Online tab) ─────────────────────────────────
// One record per finished MP room on this device — powers the Online tab's
// W/L record, win streak and recent-opponents rail. Local-only for now; a
// server-side h2h ledger can replace the read side later without UI changes.
const MP_HISTORY_KEY = "biq_mp_history";
export function readMpHistory() {
  try { const h = JSON.parse(localStorage.getItem(MP_HISTORY_KEY) || "[]"); return Array.isArray(h) ? h : []; } catch { return []; }
}
export function recordMpResult(entry) {
  try {
    if (!entry || !entry.roomId) return;
    const h = readMpHistory();
    if (h.some(x => x.roomId === entry.roomId)) return;
    h.unshift(entry);
    localStorage.setItem(MP_HISTORY_KEY, JSON.stringify(h.slice(0, 50)));
  } catch {}
}

function ResetPasswordOverlay() {
  const { passwordRecovery, clearPasswordRecovery, updatePassword } = useAuth();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  if (!passwordRecovery) return null;
  const submit = async () => {
    if (busy) return;
    if (pw.length < 6) { setErr("Password must be at least 6 characters"); return; }
    if (pw !== pw2) { setErr("Passwords don't match"); return; }
    setBusy(true); setErr("");
    const { error } = await updatePassword(pw);
    setBusy(false);
    if (error) { setErr(error.message || "Couldn't update the password — try again"); return; }
    setDone(true);
    setTimeout(() => clearPasswordRecovery(), 1800);
  };
  return (
    <div style={{position:"fixed",inset:0,zIndex:1200,background:"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{width:"100%",maxWidth:360,textAlign:"center"}}>
        <div style={{fontSize:40,marginBottom:10}}>{done ? "✅" : "🔒"}</div>
        <div style={{fontSize:20,fontWeight:900,color:"var(--t1)",marginBottom:6}}>{done ? "Password updated" : "Set a new password"}</div>
        {done ? (
          <div style={{fontSize:14,color:"var(--t2)"}}>You're signed in — welcome back!</div>
        ) : (
          <>
            <div style={{fontSize:13,color:"var(--t2)",lineHeight:1.6,marginBottom:18}}>You're signed in via the reset link — choose a new password to finish.</div>
            <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="New password" autoComplete="new-password"
              style={{width:"100%",padding:"14px 16px",marginBottom:10,borderRadius:12,border:"1px solid var(--border)",background:"var(--s1)",color:"var(--text)",fontSize:16,fontFamily:"inherit",outline:"none"}} />
            <input type="password" value={pw2} onChange={e => setPw2(e.target.value)} placeholder="Repeat new password" autoComplete="new-password"
              onKeyDown={e => { if (e.key === "Enter") submit(); }}
              style={{width:"100%",padding:"14px 16px",marginBottom:14,borderRadius:12,border:"1px solid var(--border)",background:"var(--s1)",color:"var(--text)",fontSize:16,fontFamily:"inherit",outline:"none"}} />
            {err && <div style={{color:"#FF6B6B",fontSize:13,marginBottom:12}}>{err}</div>}
            <button onClick={submit} disabled={busy || !pw || !pw2}
              style={{width:"100%",border:"none",borderRadius:999,background:"var(--accent)",boxShadow:"0 8px 22px -8px rgba(88,204,2,0.55)",padding:15,fontSize:15,fontWeight:800,color:"var(--grn-ink)",cursor:"pointer",fontFamily:"inherit",opacity:(busy || !pw || !pw2) ? 0.6 : 1}}>
              {busy ? "Saving…" : "Save new password"}
            </button>
            <button onClick={clearPasswordRecovery} style={{marginTop:10,background:"transparent",border:"none",color:"var(--t3)",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
          </>
        )}
      </div>
    </div>
  );
}

export function InstallBanner() {
  const { canPromptNative, platform, showBanner, promptInstall, dismiss } = useInstallBanner();
  if (!showBanner) return null;
  return (
    <div className="install-banner" role="region" aria-label="Install Ball IQ">
      <span className="install-banner-icon" aria-hidden="true">⚽</span>
      <div className="install-banner-body">
        <div className="install-banner-title">Never miss a day</div>
        <div className="install-banner-desc">
          {canPromptNative
            ? "Install for a daily reminder when new puzzles drop."
            : platform.isIOSSafari
              ? "Tap Share → Add to Home Screen for daily reminders."
              : "Add to your home screen for daily reminders."}
        </div>
      </div>
      <div className="install-banner-actions">
        {canPromptNative ? (
          <button type="button" className="install-banner-btn" onClick={promptInstall}>Install</button>
        ) : platform.isIOSSafari ? (
          <span className="install-banner-ios" aria-label="iOS install steps">
            <span className="install-banner-ios-step">⤴ Share</span>
            <span className="install-banner-ios-step">Add</span>
          </span>
        ) : null}
        <button
          type="button"
          className="install-banner-dismiss"
          onClick={dismiss}
          aria-label="Dismiss install prompt"
        >×</button>
      </div>
    </div>
  );
}

function NotifBell({ count, onClick, className, style }) {
  return (
    <button
      className={className || "icon-btn"}
      onClick={onClick}
      aria-label={count > 0 ? `Notifications, ${count} new` : "Notifications"}
      style={{ position: "relative", ...style }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
      {count > 0 && <span className="notif-dot" aria-hidden="true" />}
    </button>
  );
}

function NotificationCenter({ open, requests, invites = [], onClose, onRespond, onJoinInvite, onDismissInvite, onOpenFriend }) {
  const panelRef = useRef(null);
  useModalA11y({ isOpen: open, onClose, ref: panelRef });
  if (!open) return null;
  const isEmpty = requests.length === 0 && invites.length === 0;
  return (
    <div className="notif-overlay" onClick={onClose}>
      <div ref={panelRef} tabIndex={-1} className="notif-panel" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Notifications">
        <div className="notif-hdr">
          <span className="notif-title">Notifications</span>
          <button className="notif-close" onClick={onClose} aria-label="Close notifications">✕</button>
        </div>
        {isEmpty ? (
          <div className="notif-empty">
            <div className="notif-empty-ic" aria-hidden="true">🔔</div>
            <div className="notif-empty-t">You're all caught up</div>
            <div className="notif-empty-s">Friend requests and invites show up here.</div>
          </div>
        ) : (
          <div className="notif-list">
            {/* Play invites first — they're time-sensitive (the room is live). */}
            {invites.map(inv => (
              <div key={inv.id} className="notif-item">
                <span className="notif-ava"><ProfilePic value={inv.actor_avatar} name={inv.actor_name} /></span>
                <div className="notif-body">
                  <div className="notif-line"><strong>{inv.actor_name || "A friend"}</strong> invited you to play</div>
                  <div className="notif-actions">
                    <button className="notif-btn notif-accept" onClick={() => onJoinInvite?.(inv)}>Join</button>
                    <button className="notif-btn notif-decline" onClick={() => onDismissInvite?.(inv)}>Dismiss</button>
                  </div>
                </div>
              </div>
            ))}
            {requests.map(r => {
              const p = r.requester || {};
              return (
                <div key={r.id} className="notif-item">
                  <button
                    className="notif-ava"
                    onClick={() => p.id && onOpenFriend?.({ id: p.id, username: p.username, avatar: p.avatar })}
                    aria-label={p.username ? `View ${p.username}'s profile` : "View profile"}
                  >
                    <ProfilePic value={p.avatar} name={p.username} />
                  </button>
                  <div className="notif-body">
                    <div className="notif-line"><strong>{p.username || "Someone"}</strong> wants to be friends</div>
                    <div className="notif-actions">
                      <button className="notif-btn notif-accept" onClick={() => onRespond(r.id, true)}>Accept</button>
                      <button className="notif-btn notif-decline" onClick={() => onRespond(r.id, false)}>Decline</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── HELP / FAQ SCREEN ────────────────────────────────────────────────────────
// Same overlay shape as PrivacyScreen so dark / light backgrounds, scroll
// behaviour and back-arrow affordance are consistent.
const FAQ_ENTRIES = [
  {
    q: "How do I play with friends online?",
    a: `Tap "Play with Friends" on the home screen and choose Online Multiplayer. The host taps "Create Room" and gets a 6-character room code (like ABC123). Share the code with up to seven friends — they tap "Join with Code", enter it, and land in your lobby. Once at least one friend has joined, the host taps "Start Game" and you all play the same questions in real time. Want a quick local game instead? "Local Multiplayer" still works for pass-and-play on a single device.`,
  },
  {
    q: "How do I share a multiplayer invite?",
    a: `Easiest: read out the 6-character room code from your lobby — your friend types it into "Join with Code". You can also share an invite link: balliq.app/join/ABC123 (use your room's code). Anyone tapping the link will land directly in the join flow once they're signed in.`,
  },
  {
    q: "What if my friend joins late or loses connection?",
    a: `Friends can join the lobby any time before the host starts. If someone loses connection during a game, their existing answers stay in the room and the game continues for everyone else. Reconnecting brings them back to the current question with their score intact.`,
  },
  {
    q: "What is Footle?",
    a: "Footle is our daily football word game — guess the name a footballer goes by in 6 attempts. Usually a surname, sometimes a one-name legend like Pelé or Xavi. The same player is shown to everyone each day and resets at midnight.",
  },
  {
    q: "How do I delete my account?",
    a: "Go to Settings → Account → Delete Account. This will permanently remove all your data including your profile, scores, friends, and game history.",
  },
  {
    q: "Does Ball IQ work offline?",
    a: "Most game modes work offline — your scores are saved locally and synced when you're back online.",
  },
  {
    q: "Why can't I find my friend in friend search?",
    a: "Make sure they have signed up and set a username. Search is case-insensitive but the username must match exactly.",
  },
  {
    q: "How do I report an issue?",
    a: "Email us at hello@balliq.app — we read every message.",
  },
];
const HelpScreen = React.memo(function HelpScreen({ onClose }) {
  return (
    <div style={{
      position: "fixed",
      top: 0, right: 0, bottom: 0, left: 0,
      inset: 0,
      background: "var(--bg)",
      color: "var(--text)",
      zIndex: 1000,
      overflowY: "auto",
      WebkitOverflowScrolling: "touch",
      fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,sans-serif",
    }}>
      <div style={{
        position: "sticky", top: 0,
        background: "rgba(11,12,16,0.95)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border2)",
        // Phase 6a Item 1 followup: same safe-area-inset-top fix as
        // PrivacyScreen — back button hidden behind iOS notch in PWA
        // standalone without explicit top padding.
        padding: "calc(14px + env(safe-area-inset-top, 0px)) 20px 14px",
        display: "flex", alignItems: "center", gap: 12,
        zIndex: 1,
      }}>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close help"
          style={{
            width: 36, height: 36, borderRadius: 10,
            background: "var(--s2)", border: "1px solid var(--border2)",
            color: "var(--text)", fontSize: 18, lineHeight: 1,
            cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center",
            WebkitTapHighlightColor: "transparent",
            outline: "none",
          }}
        >←</button>
        <div style={{fontSize: 17, fontWeight: 800, letterSpacing: "-0.3px"}}>Help & FAQ</div>
      </div>
      <div style={{maxWidth: 680, margin: "0 auto", padding: "28px 20px 80px", lineHeight: 1.7}}>
        <div style={{fontSize: 22, fontWeight: 900, color: "var(--accent)", marginBottom: 8}}>⚽ {APP_NAME}</div>
        <div style={{fontSize: 13, color: "var(--t2)", marginBottom: 28}}>Quick answers to common questions.</div>
        {/* Phase 6d Issue 3: reuse privacyH2/privacyP from PrivacyScreen so
            Help and Privacy read as visual siblings (same h2 weight/color,
            same body color, same vertical rhythm). Was using a bright
            var(--accent) on questions which was louder than anywhere else in
            the app. */}
        {FAQ_ENTRIES.map((entry, i) => (
          <React.Fragment key={i}>
            <h2 style={privacyH2}>{entry.q}</h2>
            <p style={privacyP}>{entry.a}</p>
          </React.Fragment>
        ))}
        <p style={{...privacyP, marginTop: 32}}>Still stuck? Reach us at <a href="mailto:hello@balliq.app" style={{color:"var(--accent)",textDecoration:"none"}}>hello@balliq.app</a>.</p>
      </div>
    </div>
  );
});

// Sprint #28 Z2: Known Issues — a public-facing surface that documents
// expected limitations honestly so users don't have to guess. Reduces
// week-1 support volume (per CC's strategic assessment). Same overlay
// shape as HelpScreen / PrivacyScreen — reuses privacyH2 + privacyP
// so the trio reads as visual siblings.
const KNOWN_ISSUES = [
  {
    q: "I had to sign in again after a week — is that normal?",
    a: "Yes. For security, sign-in sessions expire roughly every 7 days. This is intentional, not a bug. Sign back in with Apple, Google, or your email and you're back in seconds — your scores, streak, and history are tied to your account, not the device.",
  },
  {
    q: "I installed Ball IQ on a second device and it asked me to onboard again",
    a: "If you're signed in to an account on both devices, onboarding only runs once and the choice syncs across devices. If you're using guest mode (no email), each new install is treated as a fresh visitor and replays the short intro. Sign up to skip this on future devices.",
  },
  {
    q: "A question seems factually wrong",
    a: "Email hello@balliq.app with the question text and what you think the correct answer is. We hand-review every report — most fixes ship within a few days. Football trivia changes (records broken, players retire, clubs relegated) so even careful research goes stale; reports are how we keep up.",
  },
  {
    q: "My streak / progress didn't sync to my other device",
    a: "If you're signed in, everything except onboarding state (covered above) syncs through your profile. If you played as a guest first and signed in later, only future progress syncs — past guest sessions stay on the device they were played on. Sign up earlier on new devices to avoid this gap.",
  },
  // "White flash at launch" entry removed 2026-06-11 — fixed (and its copy
  // described PWA behavior that doesn't apply to the native app).
];

const KnownIssuesScreen = React.memo(function KnownIssuesScreen({ onClose }) {
  return (
    <div style={{
      position: "fixed",
      top: 0, right: 0, bottom: 0, left: 0,
      inset: 0,
      background: "var(--bg)",
      color: "var(--text)",
      zIndex: 1000,
      overflowY: "auto",
      WebkitOverflowScrolling: "touch",
      fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,sans-serif",
    }}>
      <div style={{
        position: "sticky", top: 0,
        background: "rgba(15,17,23,0.95)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border2)",
        padding: "calc(14px + env(safe-area-inset-top, 0px)) 20px 14px",
        display: "flex", alignItems: "center", gap: 12,
        zIndex: 1,
      }}>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close known issues"
          style={{
            width: 36, height: 36, borderRadius: 10,
            background: "var(--s2)", border: "1px solid var(--border2)",
            color: "var(--text)", fontSize: 18, lineHeight: 1,
            cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center",
            WebkitTapHighlightColor: "transparent",
            outline: "none",
          }}
        >←</button>
        <div style={{fontSize: 17, fontWeight: 800, letterSpacing: "-0.3px"}}>Known issues</div>
      </div>
      <div style={{maxWidth: 680, margin: "0 auto", padding: "28px 20px 80px", lineHeight: 1.7}}>
        <div style={{fontSize: 22, fontWeight: 900, color: "var(--accent)", marginBottom: 8}}>⚽ Known issues</div>
        <div style={{fontSize: 13, color: "var(--t2)", marginBottom: 28}}>
          We're a small team and we know about these. Honest about what's a bug,
          what's a deliberate trade-off, and what's just hard.
        </div>
        {KNOWN_ISSUES.map((entry, i) => (
          <React.Fragment key={i}>
            <h2 style={privacyH2}>{entry.q}</h2>
            <p style={privacyP}>{entry.a}</p>
          </React.Fragment>
        ))}
        <p style={{...privacyP, marginTop: 32}}>Anything else feels off? Email <a href="mailto:hello@balliq.app" style={{color:"var(--accent)",textDecoration:"none"}}>hello@balliq.app</a>.</p>
      </div>
    </div>
  );
});

// ─── XP BAR COMPONENT ─────────────────────────────────────────────────────────
function XPBar({ xp, streak }) {
  const { level, nextLevel, progress } = getLevelInfo(xp);
  return (
    <div className="xp-bar-wrap">
      <div className="xp-bar-top">
        <span className="xp-level-icon"><level.Icon size={13} strokeWidth={2.3} /></span>
        <span className="xp-level-name">{level.name}</span>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {streak > 0 && (
            <span className="xp-streak-pill">
              🔥 {streak}
            </span>
          )}
          <span className="xp-total">{xp} XP</span>
        </div>
      </div>
      <div className="xp-track">
        <div className="xp-fill" style={{width:`${progress}%`}} />
      </div>
      {nextLevel && (
        <div className="xp-next">→ {nextLevel.name} at {nextLevel.xpNeeded} XP</div>
      )}
    </div>
  );
}


// ─── DAILY COUNTDOWN ─────────────────────────────────────────────────────────
function DailyCountdown({ score }) {
  const [timeStr, setTimeStr] = useState("");
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setDate(midnight.getDate() + 1);
      midnight.setHours(0, 0, 0, 0);
      const diff = midnight - now;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      // `score` can arrive as undefined (no prop passed → just show the
      // countdown), or null (the daily was completed but the Supabase score
      // insert failed). Render "—/7" for null so the user still sees the
      // completed-state shape rather than the looks-not-yet-played countdown.
      let prefix;
      if (score === undefined) prefix = "";
      else if (score === null) prefix = "—/7 · ";
      else prefix = `${score}/7 · `;
      setTimeStr(`${prefix}${prefix ? "resets" : "Resets"} in ${h}h ${m}m`);
    };
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, [score]);
  return <span>{timeStr}</span>;
}



// ─── DAILY HERO COUNTDOWN (for home screen hero card) ────────────────────────
export function DailyHeroCountdown() {
  const [timeStr, setTimeStr] = useState("");
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setDate(midnight.getDate() + 1);
      midnight.setHours(0, 0, 0, 0);
      const diff = midnight - now;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTimeStr(`${h}h ${m}m`);
    };
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, []);
  return timeStr;
}

// ─── ERROR BOUNDARY ───────────────────────────────────────────────────────────
// Extracted to ./components/ErrorBoundary.jsx so main.jsx can also wrap the
// marketing tree. Re-exported here because GameRoot imports it
// from './App.jsx'.
export { ErrorBoundary };

// Per-tab error boundary. The root ErrorBoundary above white-screens the WHOLE
// app on any throw; this one isolates a crash to the single tab pane it wraps,
// so a bad render in (say) Profile leaves Home / Daily / Online and the nav bar
// fully usable. "Try again" resets the boundary in place with NO reload —
// transient errors recover without losing app state; a hard crash simply falls
// back again (user-triggered, so no flicker loop). Theme-aware (renders inside
// the app where the CSS vars exist, unlike the root boundary which must survive
// a dead theme). Reports to Sentry tagged with the tab name so per-surface
// crash rates are visible separately from the root boundary.
// Fallback for the lazy game screens while their chunk downloads.
//
// ⚠️ These used to fall back to `null` or a bare empty div, which means a tap
// on Mystery/Trail/Stadiums showed NOTHING until the chunk landed. Report #2
// chased this as "the app feels slow" and measured 17ms paint and healthy DOM
// counts — all true, and the wrong conclusion. The real defect was an empty
// frame nobody was measuring: the screen was blank while a chunk downloaded,
// on a phone radio rather than the desktop the timings came from.
//
// A visible, branded frame does not make the download faster. It makes the
// difference between "the button is broken" and "it's coming", which is the
// part the player actually experiences.
function ScreenLoading({ label = "Loading" }) {
  return (
    <div className="screen" style={{
      minHeight:"60dvh", display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", gap:14,
    }}>
      <div style={{
        width:38, height:38, borderRadius:"50%",
        border:"3px solid var(--line, var(--border2))", borderTopColor:"var(--accent)",
        animation:"biqSpin 0.9s linear infinite",
      }} />
      <div style={{fontSize:13.5, fontWeight:700, color:"var(--t2)", letterSpacing:"-0.2px"}}>
        {label}…
      </div>
    </div>
  );
}

class TabErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error(`[boundary:${this.props.name || "tab"}]`, error?.message || "Unknown error");
    // A crash the player SAW is the worst possible prelude to a rating ask.
    try { markBadReviewMoment(); } catch {}
    // If we crashed before AppInner mounted, the pre-boot onboarding shell
    // (fixed overlay, z 499) would sit on top of this boundary's fallback
    // forever — lift it so the error is at least visible.
    removePrebootOnboard();
    try {
      Sentry.captureException(error, {
        tags: { boundary: "tab", tab: this.props.name || "unknown" },
        contexts: { react: { componentStack: info?.componentStack } },
      });
    } catch {}
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight:"60dvh", display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center", padding:"48px 24px",
          textAlign:"center"
        }}>
          <div style={{fontSize:40, marginBottom:14}}>⚽</div>
          <div style={{fontSize:17, fontWeight:800, color:"var(--t1)", marginBottom:6, letterSpacing:"-0.3px"}}>
            {this.props.onExit ? "This screen hit a snag" : "This tab hit a snag"}
          </div>
          <div style={{fontSize:13.5, color:"var(--t2)", lineHeight:1.7, marginBottom:22, maxWidth:280}}>
            The rest of the app is fine — tap to reload just this screen.
          </div>
          <button
            onClick={() => this.setState({ hasError:false })}
            style={{
              padding:"11px 24px", background:"var(--accent)", border:"none",
              borderRadius:999,boxShadow:"0 8px 22px -8px rgba(88,204,2,0.55)", fontFamily:"Inter,sans-serif", fontSize:13.5,
              fontWeight:700, color:"var(--grn-ink)", cursor:"pointer"
            }}
          >
            Try again
          </button>
          {/* ⚠️ A full-screen game is not a tab: it has no tab bar underneath
              and nothing else on screen, so "Try again" on a deterministic
              crash is a dead end with no way out. Tabs keep the bar and don't
              need this; screens do. */}
          {this.props.onExit && (
            <button
              onClick={() => { this.setState({ hasError:false }); try { this.props.onExit(); } catch {} }}
              style={{
                marginTop:12, padding:"11px 24px", background:"transparent",
                border:"1px solid var(--line, var(--border2))", borderRadius:11,
                fontFamily:"Inter,sans-serif", fontSize:13.5, fontWeight:700,
                color:"var(--t2)", cursor:"pointer"
              }}
            >
              Back to Home
            </button>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

// ProfileScreen, FriendProfileScreen, FriendsSection, CropModal, BADGE_DEFS,
// AVATARS, avatarEmoji extracted to ./screens/ProfileScreen.jsx
// (Sprint #13 Stage 1).
// MonthlyCalendar, StreakHero, DailyTabScreen extracted to
// ./screens/DailyScreen.jsx (Sprint #14 Stage 2).

// League screen (LeagueScreenImpl + getLeagueCohort + getWeekSeed +
// LEAGUE_NAMES + LEAGUE_AVATARS) was cut for v1.0 launch — the simulated
// leaderboard didn't meet the polish floor set by Daily/Wordle/Multiplayer.
// See /tmp/league-v1.1-spec.md for the design that brings League back with
// real backend leaderboards in v1.1.

// Rules sheets, keyed by `mode`. Opened via setHowToPlay(mode) — every entry
// here MUST have a "?" affordance wired to it somewhere (this registry sat
// entirely unreachable for months: a first-time Footle player got a blank grid,
// a keyboard, and no explanation of the colours).
const HOW_TO_PLAY = {
  // "Guesses must be a real footballer's surname" was here and was false —
  // submitGuess only checks that the guess is the right LENGTH. Rather than add
  // validation (our word list is 400-odd puzzle answers, not a dictionary, so
  // it would reject most real footballers and infuriate people), the claim
  // goes. Any surname you like is a legal probe; only the answer is fixed.
  wordle: { title:"Footle", steps:["Guess the name today's footballer goes by — usually a surname, sometimes a one-name legend","Green = right letter, right spot","Yellow = right letter, wrong spot","Grey = not in the name at all","6 guesses, new player at midnight"] },
  hotstreak: { title:"Hot Streak", steps:["You have 60 seconds on the clock","Answer as many questions as you can","No penalty for wrong answers — just keep going!","Score is how many you get correct","Try to beat your personal best"] },
  truefalse: { title:"True or False", steps:["You get 20 football statements","Tap TRUE or FALSE for each one","There's no timer — take your time","Every correct answer earns XP","A perfect 20/20 earns a bonus!"] },
  survival: { title:"Survival", steps:["Answer questions one by one","One wrong answer and the game is over","No timer — accuracy is everything","See how far you can go","Your best streak is saved"] },
};

// Shared hide style so the home-screen tab wrappers reference the same object
// each render (no new allocation on every tab change).
const HIDDEN_STYLE = { display: "none" };

// ─── FOOTBALL WORDLE ──────────────────────────────────────────────────────────
// Surnames are stored uppercase, ASCII-only. The POOL still holds 4-letter
// names (they remain valid guesses), but ANSWERS are 5–8 letters from Footle
// #88 on — a 4-wide board looked wrong next to the keyboard. Days #1–87 keep
// the 4-letter answers they were published with. See WORDLE_ANSWER_POOL.
// Daily seed picks one by index so every player gets the same answer until
// midnight local time.
// WORDLE_PLAYERS + anchor constants + getWordleDayIndex/AnswerForDayIndex/
// Answer extracted to ./lib/wordle.js (Sprint #17 Stage 3).
function dateToDateKey(d) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Returns an array of 7 booleans representing the past 7 days, oldest-first.
// Index 6 is today. A day is "active" if the user played at least one
// quiz/TF question (per biq_seen_history_v2 timestamps) OR completed that
// day's Wordle (per biq_wordle_<date> key). Wordle is daily-locked so its
// presence in storage is a reliable per-day signal.
function computePast7DaysActivity() {
  try {
    const histRaw = localStorage.getItem('biq_seen_history_v2');
    const hist = histRaw ? JSON.parse(histRaw) : {};
    const timestamps = (hist && typeof hist === 'object')
      ? Object.values(hist).filter(t => typeof t === 'number')
      : [];
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(now.getDate() - i);
      day.setHours(0, 0, 0, 0);
      const dayStart = day.getTime();
      const dayEnd = dayStart + 24 * 3600 * 1000;
      let active = timestamps.some(t => t >= dayStart && t < dayEnd);
      if (!active) {
        if (localStorage.getItem(`biq_wordle_${dateToDateKey(day)}`)) active = true;
      }
      days.push(active);
    }
    return days;
  } catch {
    return Array(7).fill(false);
  }
}
// getWordleDateKey + readWordleTodayStatus extracted to ./lib/wordleStatus.js
// (Sprint #14 Stage 2). dateToDateKey stays here because computePast7DaysActivity
// above still uses it.

// Footle solve-streak: walk biq_wordle_<ymd> backward from `today` and count
// consecutive 'won' days. Stops at the first non-won day (loss / unplayed).
// Bounds the walk at 366 days as a defensive cap. Cross-device note: relies
// on the localStorage cache populated by useAuth.jsx's wordleState merge at
// login; first-load on a fresh device may briefly under-count until sync.
// computeFootleStreak + gradeWordleGuess extracted to ./lib/wordle.js
// (Sprint #17 Stage 3).

// Aggregate per-letter keyboard state across all guesses. Green beats yellow
// beats grey beats unseen — once green, never downgraded.
// ── FOOTBALL WORDLE ── lives in ./games/FootballWordle.jsx since 2026-09-05,
// so the static /football-wordle/ page can render the SAME component as an
// island. Everything it needs from this file's scope rides in through
// `services`; the island (src/islands/footle.jsx) passes light equivalents.
const FOOTLE_SERVICES = {
  haptic, playSound, markBadReviewMoment, shareCard, Confetti, InstallBanner,
  GetAppCTA: FootleGetAppCTA, isNative: IS_NATIVE,
  // Cross-device sync — push to profiles.wordle_state via atomic JSON merge.
  onSync: (dateKey, state) => {
    supabase.rpc('upsert_wordle_state', { p_ymd: dateKey, p_state: state })
      .then(({ error }) => {
        if (error) {
          console.warn('[wordle sync]', error.message);
          Sentry.captureException(error, { tags: { area: 'wordle-sync' } });
        }
      })
      .catch(e => {
        console.warn('[wordle sync]', e?.message || e);
        Sentry.captureException(e, { tags: { area: 'wordle-sync' } });
      });
  },
};

// Transfer Trail and Mystery Player take the same seam
// (src/games/dailyServices.js): the app supplies its haptics, sounds and
// confetti; the static /transfer-trail/ and /mystery-player/ islands supply
// stand-ins. Neither screen may import App.jsx — see the note at the top of
// each. No GetAppCTA here: the app has its own install banner.
const DAILY_SERVICES = { haptic, playSound, Confetti };

// ⚠️ THE REPORT CHANNEL WAS BLIND: 55 reports, 0 reasons, 25 in the last week
// alone — p_reason was hardcoded null while the column and the RPC parameter
// sat there unused. Report #3 measured 54% of reports coming from players who
// answered CORRECTLY and still pressed the button, and with no reason there
// was no way to know why. Alex, 2026-08-23: "i really want our question bank
// to be spotless and not insult the intellect of our users" — his own flags
// run at ~100% precision against 3-6% for automated audits, and this sheet
// turns all 92 active players into that same channel.
//
// One sink serves every surface: QuizEngine's reveal, the results review,
// Footle, Trail, Mystery and Stadiums all funnel through reportQuestion, so
// none of them needed a per-site change. Callers flip their "Reported ✓"
// state optimistically before the sheet opens; dismissing therefore still
// sends with reason null — the player DID press report, and losing that
// signal because they declined a second tap would be worse than a blind row.
function ReportReasonSheet({ onPick, onSkip }) {
  const ref = useRef(null);
  useModalA11y({ isOpen: true, onClose: onSkip, ref });
  const REASONS = [
    ["wrong-answer", CircleX, "The answer is wrong"],
    ["unclear", CircleHelp, "Confusing or unclear"],
    ["typo", Pencil, "Typo or bad grammar"],
    ["too-easy", Moon, "Too easy — gives itself away"],
    ["too-hard", BrickWall, "Too hard or unfair"],
  ];
  // Same sheet as the quit confirm (grab, head, stacked rows, quiet exit) so a
  // report feels like the app, not a browser prompt. Rows are the app's row
  // anatomy: icon well, one line, the whole row is the target.
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="What's wrong with this question?" onClick={onSkip}>
      <div ref={ref} tabIndex={-1} className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-grab" aria-hidden="true" />
        <div className="modal-head">
          <div className="modal-title">What&rsquo;s wrong with it?</div>
          <div className="modal-body">One tap — it tells us exactly what to fix.</div>
        </div>
        <div className="report-reasons">
          {REASONS.map(([slug, Icon, label]) => (
            <button key={slug} type="button" className="report-reason" onClick={() => onPick(slug)}>
              <span className="report-reason-well" aria-hidden="true"><Icon size={18} strokeWidth={2.2} /></span>
              <span className="report-reason-label">{label}</span>
            </button>
          ))}
        </div>
        <div className="modal-btns">
          <button type="button" className="modal-btn modal-quiet" onClick={onSkip}>Just flag it</button>
        </div>
      </div>
    </div>
  );
}



// ─── MULTIPLAYER FEATURED CARD (Sprint #12) ─────────────────────────────────
// Replaces the old .util-rail.hero-online rail. Two primary CTAs (Online +
// Local) and a corner Invite pill. Online checks guest state (sign-in toast
// fallback). Local jumps straight into pass-and-play. Invite uses Web Share
// API where available, otherwise copies the URL to clipboard with a toast.
//
// Local CTA hides at desktop sizes via the existing .diff-option-local rule
// in the @media (min-width: 1024px) block (extended in Sprint #12 to also
// hit .mp-card-cta.local) — desktop has no equivalent pass-and-play gesture.
//
// FootleHero + MultiplayerCard extracted to ./components/ (Sprint #17 Stage 3).

// ─── OFFLINE BANNER ───────────────────────────────────────────────────────────
// Informational banner surfaced when the device is offline so users understand
// failed cross-device syncs are a connection issue, not an app bug. Local-first
// features (Daily 7, Wordle, etc.) keep working; sync resumes naturally when
// connection returns. Phase E (audit finding 2.3): banner only — no retry queue,
// no feature gating, no blocking UI.
const OfflineBanner = React.memo(function OfflineBannerImpl() {
  const [online, setOnline] = useState(() => {
    try { return navigator.onLine !== false; } catch { return true; }
  });
  // Briefly show "Back online ✓" for ~2s after reconnect so the user gets a
  // confirmation that things are working again, then fully hide.
  const [showBackOnline, setShowBackOnline] = useState(false);
  const backOnlineTimerRef = useRef(null);

  // Sprint #95: navigator.onLine has well-known false-positives (browser
  // adapter handovers, VPN reconnects, macOS wake-from-sleep). When it
  // reports offline we cross-check by HEAD-ing /version.json with a 3s
  // timeout — a 2xx response means the network IS reachable and we override
  // the false-positive. While the banner stays up, we re-verify every 12s
  // so a transient navigator.onLine flip clears itself without a manual
  // page reload.
  const verifyOnline = useCallback(async () => {
    try {
      const ac = new AbortController();
      const t = setTimeout(() => ac.abort(), 3000);
      const res = await fetch(`/version.json?_=${Date.now()}`, { method: "HEAD", cache: "no-store", signal: ac.signal });
      clearTimeout(t);
      return res.ok || (res.status >= 200 && res.status < 500);
    } catch { return false; }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      setShowBackOnline(true);
      if (backOnlineTimerRef.current) clearTimeout(backOnlineTimerRef.current);
      backOnlineTimerRef.current = setTimeout(() => setShowBackOnline(false), 2000);
    };
    const handleOffline = () => {
      // Cross-check before trusting offline — false positives are common.
      verifyOnline().then(reallyOnline => {
        if (reallyOnline) return;  // false alarm; keep online=true
        setOnline(false);
        setShowBackOnline(false);
        if (backOnlineTimerRef.current) clearTimeout(backOnlineTimerRef.current);
      });
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    // On mount, if navigator.onLine reported false but we can actually reach
    // /version.json (Alex's tab-open false-positive case), correct it now.
    if (!navigator.onLine) {
      verifyOnline().then(reallyOnline => { if (reallyOnline) setOnline(true); });
    }
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (backOnlineTimerRef.current) clearTimeout(backOnlineTimerRef.current);
    };
  }, [verifyOnline]);

  // While the banner is showing, re-verify every 12s so a missed "online"
  // event (visibility change while tab backgrounded, etc.) clears itself.
  useEffect(() => {
    if (online) return;
    const id = setInterval(() => {
      verifyOnline().then(reallyOnline => {
        if (reallyOnline) {
          setOnline(true);
          setShowBackOnline(true);
          if (backOnlineTimerRef.current) clearTimeout(backOnlineTimerRef.current);
          backOnlineTimerRef.current = setTimeout(() => setShowBackOnline(false), 2000);
        }
      });
    }, 12000);
    return () => clearInterval(id);
  }, [online, verifyOnline]);

  if (online && !showBackOnline) return null;
  return (
    <div className={`offline-banner${online ? " reconnected" : ""}`} role="status" aria-live="polite">
      {online ? "✓ Back online" : "You're offline. Your progress will sync when you're back."}
    </div>
  );
});

// 1.1 async challenge: parse a challenge token "SCORE.YYYYMMDD[.Name]" into a
// {score,date,name} object. Shared by the web launch capture and the native
// appUrlOpen handler. Returns null on a malformed token.
function parseChallengeStr(c) {
  if (!c) return null;
  // rest.join("."): dots INSIDE the name must survive. shareDaily encodes
  // them as %2E, but the api/c.js web redirect percent-decodes the token and
  // encodeURIComponent doesn't re-encode "." (unreserved) — so a name like
  // "J.Doe" arrives with a literal dot and the old 3-way destructure
  // truncated it to "J" (fresh-code audit, diff-review).
  const [scoreStr, dateStr, ...rest] = String(c).split(".");
  const nameEnc = rest.join(".");
  const score = parseInt(scoreStr, 10);
  if (isNaN(score) || !/^\d{8}$/.test(dateStr || "")) return null;
  let name = "";
  try { name = nameEnc ? decodeURIComponent(nameEnc) : ""; } catch { name = nameEnc || ""; }
  return { score: Math.max(0, Math.min(7, score)), date: dateStr, name: name.slice(0, 24) };
}

// Challenge-token freshness: 0 = today, 1 = yesterday (honored, but labelled
// "(yesterday's score)" — the Daily 7 is deterministic per day, so their score
// came from a different question set), 2 = out of window (2+ days old, or
// future-dated/garbage — both expire).
function challengeDayOffset(dateStr) {
  const now = new Date();
  if (dateStr === dateToYMD(now).replace(/-/g, "")) return 0;
  const y = new Date(now);
  y.setDate(y.getDate() - 1);
  if (dateStr === dateToYMD(y).replace(/-/g, "")) return 1;
  return 2;
}

// ─── APP ──────────────────────────────────────────────────────────────────────
function AppInner() {
  perfMark('AppInner render (first)');
  useEffect(() => { perfMark('AppInner mounted'); removePrebootOnboard(); }, []);
  const { user, profile: authProfile, isGuest, isAnonUser, signInAsGuest, exitGuestMode, openAuthPrompt } = useAuth();
  const [screen, setScreen] = useState("home");
  // The first natural pause, for the deferred consent banner (see index.html
  // and public/consent.js). Deep-linked players start mid-question; the banner
  // waits for this. Two races matter here: the app boots on screen === "home"
  // BEFORE the ?club= capture launches the quiz, so home only counts once the
  // player has actually been somewhere else — and consent.js (a deferred
  // script) may attach its listener AFTER this fires, so the moment is also
  // recorded on window for it to read at startup.
  const consentAwayRef = useRef(false);
  useEffect(() => {
    if (screen !== "home") consentAwayRef.current = true;
    if (screen === "results" || (screen === "home" && consentAwayRef.current)) {
      try {
        window.__biqConsentMomentFired = true;
        window.dispatchEvent(new Event("biq:consent-moment"));
      } catch {}
    }
  }, [screen]);
  // QA S-03: screens are full-page swaps, but nothing reset the scroll — so
  // quitting a Classic quiz returned you to Home still scrolled wherever you
  // had been, leaving the Daily 7 / Footle cards below the fold. The daily
  // habit should cost one tap, not a scroll. Instant, never smooth: html sets
  // scroll-behavior:smooth, which would otherwise animate a long scroll on
  // every navigation ('instant' is a valid ScrollBehavior; the catch covers
  // engines that reject the enum).
  useEffect(() => {
    try { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); }
    catch { try { window.scrollTo(0, 0); } catch {} }
  }, [screen]);
  // Deep-link recipients play BEFORE onboarding (opportunity-scan #6). A boot
  // that arrives via a share/SEO deep link (footle alias or ?game=footle,
  // ?stump=, ?club=/?quiz= slugs, /c/ Daily-7 challenge, /join/ invite) defers
  // the OnboardingScreen gate for this session — the OG cards promise "no
  // sign-up", so the shared moment must render first. Slugs are validated
  // against the module maps so a dead link doesn't suppress onboarding for
  // nothing. biq_onboarded is NOT written — onboarding still shows, on the
  // first Home visit after the staged screen.
  //
  // Reads BOOT_PATH/BOOT_SEARCH (snapshotted at module eval), NOT live
  // window.location: the pendingJoinCode / pendingChallenge initializers below
  // strip the path+query via replaceState as an initializer SIDE EFFECT, and
  // StrictMode double-invokes useState initializers — so on the second pass
  // this one saw an already-stripped URL, returned false, and that was the
  // value React committed. Every deep-link deferral silently no-op'd in dev,
  // and the ordering was load-bearing in prod (any initializer added above
  // would have broken it the same way). The snapshot makes it idempotent.
  const [deferOnboarding, setDeferOnboarding] = useState(() => {
    if (bootDeferralSpent) return false;
    try {
      const path = BOOT_PATH;
      if (path === "/footle" || path === "/footle/" || /^\/c\/./.test(path)) return true;
      // The code itself survives the deferral: the pendingJoinCode initializer
      // below persists it to localStorage (biq_pending_join) before stripping
      // the path, so the join modal / auto-join still fire. Validated through
      // normalizeJoinCode — the same rule that initializer applies — so a code
      // it would reject can't suppress onboarding for nothing.
      const joinPath = path.match(/^\/join\/([A-Za-z0-9]+)/);
      if (joinPath && normalizeJoinCode(joinPath[1])) return true;
      const sp = new URLSearchParams(BOOT_SEARCH);
      // "mystery" intentionally absent while MYSTERY_ENABLED is false — a shared
      // ?game=mystery link must not hold the boot screen for a hidden mode.
      // The front door (2026-09-03) links every mode as ?game=<mode>; all of
      // them bypass onboarding — a visitor who chose a game must not be walled.
      if (["footle", "trail", "daily", "classic", "survival", "hotstreak", "legends", "chaos", "stadiums", "clubquiz", "leaguequiz", "online", ...(MYSTERY_ENABLED ? ["mystery"] : [])].includes(sp.get("game"))) return true;
      if (/^q_[a-z0-9]+$/.test((sp.get("eq") || "").trim().toLowerCase())) return true; // email answer link — the verdict must not land behind onboarding
      if (normalizeJoinCode(sp.get("join"))) return true; // legacy query-form invite
      if (/^q_[a-z0-9]+$/.test((sp.get("stump") || "").trim().toLowerCase())) return true;
      if (CLUB_SLUG_TO_PACK[(sp.get("club") || "").toLowerCase()]) return true;
      if (QUIZ_SLUG_TO_CAT[(sp.get("quiz") || "").toLowerCase()]) return true;
      if (sp.get("c")) return true; // query-form challenge fallback
    } catch {}
    return false;
  });
  // The deferral lifts on the first RETURN to Home — i.e. once the staged
  // destination has actually rendered (screen left "home") and the user
  // navigates back. Lifting on any screen==="home" render would fire during
  // the async staging window (stump/club launches load the question bank
  // before setScreen), re-blocking the moment the deep link paid for.
  useEffect(() => {
    if (!deferOnboarding) return;
    if (screen !== "home") { bootStagedScreenSeen = true; return; }
    if (bootStagedScreenSeen) { bootDeferralSpent = true; setDeferOnboarding(false); }
  }, [screen, deferOnboarding]);
  // 1.0.2 Feature E: one-time "pick your username" step after a NEW social
  // sign-up. useAuth sets biq_needs_username='1' for fresh Apple/Google
  // accounts (email sign-ups already chose a username). We surface the modal
  // once the signed-in profile has resolved; the flag persists in localStorage
  // until the user commits a name, so a mid-flow quit just re-shows it.
  const [needsUsername, setNeedsUsername] = useState(false);
  useEffect(() => {
    if (!user || isGuest || !authProfile) return;
    try {
      if (localStorage.getItem('biq_needs_username') === '1') setNeedsUsername(true);
    } catch {}
  }, [user?.id, isGuest, authProfile]);
  // Bumped when the home greeting is tapped so the profile screen knows to
  // open the inline name editor.
  const [nameEditNonce, setNameEditNonce] = useState(0);

  // Sprint #61 DD3: push the current screen as a Sentry tag whenever it
  // changes, plus a breadcrumb. Now an error fired from any nested component
  // will carry `screen=home|daily|profile|...` so the launch-day debugger
  // can answer "which surface did this fire on?" without spelunking the
  // breadcrumb log.
  useEffect(() => {
    try {
      Sentry.setTag('screen', screen);
      Sentry.addBreadcrumb({ category: 'nav', message: `screen → ${screen}`, level: 'info' });
    } catch {}
  }, [screen]);

  // Active multiplayer room code — set when create_room / join_room succeeds
  // in OnlineEntry, consumed by MultiplayerLobby. Separate from pendingJoinCode
  // (which holds the deep-link `?join=CODE` value before it's consumed by the
  // auto-join effect) so the deep-link state and the in-flow state stay
  // independently trackable.
  const [stage1RoomCode, setStage1RoomCode] = useState("");
  // 1.1: set by the Home "Invite" button so OnlineEntry auto-creates a room and
  // drops the user in the lobby (where the real /join/CODE invite lives).
  const [onlineAutoCreate, setOnlineAutoCreate] = useState(false);

  // Pending invite code captured from `?join=` on cold start. Persisted to
  // localStorage so it survives the sign-in detour for guests / unsigned
  // users. Cleared once consumed (room joined, dismissed, or signed-out
  // away). The native app wrapper should hand the code in via the same
  // localStorage key after parsing the Universal / App Link.
  const [pendingJoinCode, setPendingJoinCode] = useState(() => {
    try {
      // Sprint #92 GGG3: parse BOTH /join/CODE (new path-based, matches
      // Universal Links) and ?join=CODE (legacy query-based) so previously-
      // shared invite URLs keep routing correctly. Path form takes priority.
      const pathMatch = window.location.pathname.match(/^\/join\/([A-Za-z0-9]+)/);
      const fromPath = pathMatch ? pathMatch[1] : null;
      const params = new URLSearchParams(window.location.search);
      const fromQuery = params.get("join");
      const fromUrl = fromPath || fromQuery;
      if (fromUrl) {
        try { localStorage.setItem("biq_pending_join", JSON.stringify({ c: fromUrl, at: Date.now() })) } catch {}
        // Strip the path/query so a refresh doesn't re-trigger the auto-join —
        // but drop ONLY the /join path + join param, preserving any other params
        // (e.g. a co-present ?c= challenge token, read by the next init).
        try {
          const u = new URL(window.location.href);
          u.pathname = "/"; u.searchParams.delete("join");
          window.history.replaceState({}, "", u.pathname + u.search + u.hash);
        } catch {}
        return normalizeJoinCode(fromUrl);
      }
      const stored = localStorage.getItem("biq_pending_join");
      if (stored) {
        // 2026-08-29: stored codes carry a timestamp and yield to explicit
        // deep-link intent. Before this, a code persisted FOREVER and was
        // never validated against room existence — but the cron deletes rooms
        // at 7 days, so an unconsumed invite became a dead "Join the game"
        // modal over every future visit, including SEO deep links with a
        // quiz clock already running underneath. A bare legacy value is
        // stale by construction and dropped on sight.
        let code = null;
        try {
          const parsed = JSON.parse(stored);
          if (parsed?.c && Date.now() - (parsed.at || 0) < 24 * 3600 * 1000) code = parsed.c;
        } catch { /* legacy bare string */ }
        if (!code) { try { localStorage.removeItem("biq_pending_join"); } catch {} return null; }
        const otherIntent = /[?&](club|quiz|c)=/.test(window.location.search) || /^\/c\//.test(window.location.pathname);
        if (otherIntent) return null;
        return normalizeJoinCode(code);
      }
    } catch {}
    return null;
  });
  // Typed-code guest entry (Login.jsx's joinWithCode): when AppInner is
  // already mounted (local-guest overlay case) the localStorage write alone
  // is invisible — this event carries the code into live state, and the
  // existing gate modal / autoJoin routing takes it from there.
  useEffect(() => {
    const onJoinCode = (e) => {
      const code = String(e?.detail || '').toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g, '').slice(0, 6);
      if (code) setPendingJoinCode(code);
    };
    window.addEventListener('biq:join-code', onJoinCode);
    return () => window.removeEventListener('biq:join-code', onJoinCode);
  }, []);
  const clearPendingJoin = useCallback(() => {
    setPendingJoinCode(null);
    loopEvent("join-token-consumed");
    try { localStorage.removeItem("biq_pending_join"); } catch {}
  }, []);
  // A stored code is re-armed on boot (links, typed codes) — check it still
  // points at a joinable room before the gate can show it. Rooms are reaped at
  // 7 days and end far sooner; a dead code must not become a modal.
  useEffect(() => {
    if (!pendingJoinCode) return undefined;
    let alive = true;
    (async () => {
      const look = await mpLookupRoom(pendingJoinCode);
      if (!alive) return;
      if (look.found === false || (look.found && !look.joinable)) {
        loopEvent("join-token-dead", { state: look.state || "missing" });
        setPendingJoinCode(null);
        try { localStorage.removeItem("biq_pending_join"); } catch {}
      }
    })();
    return () => { alive = false; };
  }, [pendingJoinCode]);

  // v1.6 guest entry — "Play as guest" on the invite gate. Anonymous sign-in
  // gives the guest a real session; the SIGNED_IN listener clears guest mode
  // and the auto-join effect below routes them straight into the room. While
  // the Supabase anonymous provider is disabled (dashboard toggle), the call
  // errors and we fall back to the sign-in prompt — the button is inert-safe.
  const [guestJoining, setGuestJoining] = useState(false);
  const [guestJoinError, setGuestJoinError] = useState("");
  const handleGuestJoin = useCallback(async () => {
    if (guestJoining) return;
    setGuestJoining(true);
    setGuestJoinError("");
    const { error } = await signInAsGuest();
    if (error) {
      console.warn('[handleGuestJoin] signInAsGuest', error.message);
      setGuestJoining(false);
      setGuestJoinError("Guest entry isn't available right now — sign up free instead, it takes a minute.");
      return;
    }
    // No setGuestJoining(false) on success — the SIGNED_IN state change
    // unmounts this modal (user is set, isGuest clears).
  }, [guestJoining, signInAsGuest]);

  // 1.1 async "beat my Daily 7" challenge. A friend's link is balliq.app/?c=
  // SCORE.YYYYMMDD[.Name]. We capture it on launch (web/SPA), persist it, and
  // strip the query so a refresh doesn't re-trigger. Only USED if it's for
  // today (Daily 7 is deterministic per day) and the user hasn't played yet;
  // the head-to-head compare fires when they finish. (Native deep-linking into
  // the installed app needs an AASA path entry — follow-up; web handles it now.)
  // Share-family audit 2026-08-30: a challenge recipient landed on Home with
  // a passive banner — the least committed moment of the loop got the softest
  // ask. When the challenge arrives FROM THE URL THIS BOOT (tap-through, not a
  // stored leftover rehydrating), open a head-to-head interstitial instead.
  const challengeArrivedThisBoot = useRef(false);
  const [pendingChallenge, setPendingChallenge] = useState(() => {
    try {
      // Path form /c/TOKEN (Universal-Link-friendly) takes priority; ?c=TOKEN
      // is kept as a fallback for any query-style links.
      const pathMatch = window.location.pathname.match(/^\/c\/([^/?#]+)/);
      const raw = (pathMatch ? pathMatch[1] : null) || new URLSearchParams(window.location.search).get("c");
      if (raw) {
        // Keep the current pathname — forcing "/" stranded web /play?c=…
        // recipients on the MARKETING home after a refresh (main.jsx renders
        // marketing when path === "/"). Only our own param is stripped,
        // mirroring the ?club=/?quiz= capture. (fresh-code audit)
        let fromId = null;
        try {
          const fRaw = new URLSearchParams(window.location.search).get("f");
          if (fRaw && /^[0-9a-f-]{36}$/i.test(fRaw)) fromId = fRaw;
        } catch {}
        try { const u = new URL(window.location.href); u.searchParams.delete("c"); u.searchParams.delete("f"); window.history.replaceState({}, "", u.pathname + u.search + u.hash); } catch {}
        const challenge = parseChallengeStr(raw);
        if (challenge) {
          if (fromId) challenge.from = fromId;
          challengeArrivedThisBoot.current = true;
          try { localStorage.setItem("biq_pending_challenge", JSON.stringify(challenge)); } catch {}
          return challenge;
        }
      }
      const stored = localStorage.getItem("biq_pending_challenge");
      if (stored) return JSON.parse(stored);
    } catch {}
    return null;
  });
  const [challengeIntro, setChallengeIntro] = useState(() => challengeArrivedThisBoot.current);
  const clearChallenge = useCallback(() => {
    setPendingChallenge(null);
    setChallengeIntro(false);
    try { localStorage.removeItem("biq_pending_challenge"); } catch {}
  }, []);
  // opportunity-scan #9: settled head-to-head outcome — { mine, theirs, name,
  // yesterday } — drives the "Send it back" result modal that replaced the old
  // ~2s toast. Declared up here with the rest of the challenge state (and above
  // the settle effect) so nothing references it before its const exists; null =
  // closed.
  const [challengeResult, setChallengeResult] = useState(null);
  // Social-webview escape hatch (task #22, Alex steer 2026-07-17: "if people
  // share their result it is okay to push the app"). A /c/ challenge tapped
  // inside Snapchat/IG opens their in-app browser, which swallows the Universal
  // Link and is always logged-out — so an app-having friend is stranded on web.
  // Dismissible (the challenge stays guest-playable for the app-less), iOS-web
  // only, and the app-scheme URL deep-links code-intact on the LIVE binary.
  const [challengeAppNudgeDismissed, setChallengeAppNudgeDismissed] = useState(false);

  // Sprint #92 GGG3: Universal Links handler for the installed iOS app.
  // Web users hit /?join=CODE via the original capture above; native users
  // arrive via Universal Link (balliq.app/join/CODE) which Capacitor's
  // @capacitor/app plugin surfaces as appUrlOpen (warm) or getLaunchUrl()
  // (cold). Same normalization as the web capture: uppercase, strip
  // confusing chars (I, O, 0, 1), cap at 6. Persists to localStorage on
  // the same key + sets state, so the existing pendingJoinCode-driven
  // autoJoin routing fires identically to the web flow.
  useEffect(() => {
    if (!Capacitor.isNativePlatform?.()) return;
    // OAuth callback (app.balliq://auth/*) is handled by AuthProvider's
    // listener — AppInner doesn't compete because it isn't mounted while
    // the user is on Login. This effect handles only the Universal Link
    // multiplayer invite path (balliq.app/join/CODE).
    const tryCapture = (url) => {
      if (!url) return;
      try {
        const u = new URL(url);
        if (u.hostname !== 'balliq.app') return;
        const jm = u.pathname.match(/^\/join\/([A-Za-z0-9]+)/);
        if (jm) {
          const code = jm[1].toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g, '').slice(0, 6);
          if (code) {
            try { localStorage.setItem('biq_pending_join', JSON.stringify({ c: code, at: Date.now() })); } catch {}
            setPendingJoinCode(code);
          }
          return;
        }
        // 1.1: async challenge deep link — balliq.app/c/SCORE.YYYYMMDD[.Name]
        const cm = u.pathname.match(/^\/c\/([^/?#]+)/);
        if (cm) {
          const ch = parseChallengeStr(cm[1]);
          if (ch) {
            const fRaw = u.searchParams.get('f');
            if (fRaw && /^[0-9a-f-]{36}$/i.test(fRaw)) ch.from = fRaw;
            try { localStorage.setItem('biq_pending_challenge', JSON.stringify(ch)); } catch {}
            setPendingChallenge(ch);
            setChallengeIntro(true);
          }
        }
      } catch {}
    };
    CapApp.getLaunchUrl().then(r => tryCapture(r?.url)).catch(() => {});
    let handlePromise = CapApp.addListener('appUrlOpen', e => tryCapture(e?.url));
    return () => {
      Promise.resolve(handlePromise).then(h => h?.remove?.()).catch(() => {});
    };
  }, []);
  // A1: Hydrate first-paint state synchronously from localStorage so the Home
  // tab doesn't flash in a default-empty state before the async effects fire.
  const [hasOnboarded, setHasOnboarded] = useState(() => {
    try { return localStorage.getItem("biq_onboarded") === "1"; } catch { return true; }
  });
  const [tab, setTab] = useState("home");
  // 4th usage counter: opening the Profile tab is the stats-appetite signal.
  useEffect(() => { if (tab === 'profile') bumpUsage('stats-view'); }, [tab]);
  const [profile, setProfileState] = useState(() => {
    try {
      const raw = localStorage.getItem("biq_profile");
      if (raw) { const p = JSON.parse(raw); if (p && typeof p === "object") return p; }
    } catch {}
    return { name:"", avatar:"⚽" };
  });
  const [mode, setMode] = useState(null);
  const [diff, setDiff] = useState("medium");
  const [cat, setCat] = useState("All");
  // ⚠️ THE APP NEVER TOLD ANYONE WHERE THEY WERE. Measured 2026-08-23: zero
  // `document.title` assignments in all of src/, and exactly ONE <h1> in the
  // whole product (the Login screen). 179 aria-labels make every automated
  // label check pass, which is why this never surfaced — labels describe
  // CONTROLS, and none of them answers "what screen am I on".
  //
  // The app is a single document that swaps its whole contents, so a screen
  // reader gets no navigation event and no new title: tapping Daily, opening
  // Settings and starting a quiz are all silent. A sighted user sees the
  // screen change; a VoiceOver user gets nothing at all.
  //
  // Two things fix that and neither changes a pixel: keep the tab title in
  // step with the screen, and announce the change in a live region. The live
  // region matters more than the title on iOS, where Safari does not announce
  // title changes in a SPA.
  const SCREEN_TITLES = {
    home: "Home", quiz: "Quiz", results: "Results", settings: "Settings",
    wordle: "Footle", trail: "Transfer Trail", mystery: "Mystery Player",
    stadiums: "Stadiums", review: "Question review", "daily-review": "Daily review",
    "puzzle-review": "Puzzle review", "friend-profile": "Friend profile",
    "blocked-users": "Blocked users", "club-quiz": "Club quiz",
    "league-quiz": "League quiz", stump: "Stump a mate",
    "online-stage1": "Online multiplayer", "online-stage1-lobby": "Lobby",
    "local-setup": "Pass and play",
  };
  const TAB_TITLES = { home: "Home", daily: "Daily", online: "Online", profile: "Profile" };
  const screenTitle = useMemo(() => {
    if (screen === "home") return TAB_TITLES[tab] || "Home";
    return SCREEN_TITLES[screen] || "";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, tab]);
  const [srScreenMsg, setSrScreenMsg] = useState("");
  useEffect(() => {
    if (!screenTitle) return undefined;
    try { document.title = `${screenTitle} — ${APP_NAME}`; } catch { /* non-DOM env */ }
    // Deferred one tick: announcing in the same frame as the DOM swap gets
    // dropped by VoiceOver, which needs the region to change AFTER the new
    // content settles. setTimeout rather than rAF — rAF never fires in a
    // hidden tab, and this has bitten twice already.
    const t = setTimeout(() => setSrScreenMsg(screenTitle), 120);
    return () => clearTimeout(t);
  }, [screenTitle]);
  const [questions, setQuestions] = useState([]);
  const [result, setResult] = useState(null);
  const [wrongAnswers, setWrongAnswers] = useState([]);
  const [dailyReviewState, setDailyReviewState] = useState(null);
  const [puzzleReviewState, setPuzzleReviewState] = useState(null);
  const [stats, setStats] = useState(() => {
    try {
      const raw = localStorage.getItem("biq_stats");
      if (raw) { const p = JSON.parse(raw); if (p && typeof p === "object") return p; }
    } catch {}
    return { gamesPlayed: 0, bestScore: 0, bestStreak: 0 };
  });
  const [settings, setSettings] = useState(() => {
    // ⚠️ sound defaults ON for NATIVE only. The whole audio layer — every
    // correct/wrong tone, the Footle chord, the MP winner beat — shipped
    // switched off, so the largest built-but-dark asset in the product was
    // reaching nobody who had not gone looking in Settings for it.
    // Native only, deliberately: a phone has a hardware mute switch and a
    // game making sound is expected, whereas a browser TAB that starts
    // making noise is hostile (and autoplay policy would half-block it
    // anyway). Web keeps the old default.
    // This changes the DEFAULT, never a choice: stored settings spread over
    // the defaults below, so anyone who has already turned sound off stays
    // off.
    const defaults = SETTINGS_DEFAULTS();
    try {
      const raw = localStorage.getItem("biq_settings");
      if (raw) { const p = JSON.parse(raw); if (p && typeof p === "object") return { ...defaults, ...p }; }
    } catch {}
    return defaults;
  });
  // Colour-blind mode is a document-root class, not per-component state:
  // Footle tiles render in three places (live board, archive board, legend)
  // plus the keyboard, and a root class lets one CSS block recolour all of
  // them — the same pattern real Wordle uses for its high-contrast mode.
  useEffect(() => {
    try { document.documentElement.classList.toggle("biq-cb", settings.colorBlind === true); } catch {}
  }, [settings.colorBlind]);
  // Read today's daily completion synchronously so the Daily hero doesn't flash
  // the "Play today's challenge" state before the async check resolves.
  const [dailyDone, setDailyDone] = useState(() => {
    try {
      const d = new Date();
      const ymd = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
      const raw = localStorage.getItem(`biq_daily_${ymd}`);
      if (raw) return true;
    } catch {}
    return false;
  });
  const [dailyScore, setDailyScore] = useState(() => {
    try {
      const d = new Date();
      const ymd = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
      const raw = localStorage.getItem(`biq_daily_${ymd}`);
      if (raw) { const p = JSON.parse(raw); if (typeof p?.score === "number") return p.score; }
    } catch {}
    return null;
  });

  const [hotstreakBest, setHotstreakBest] = useState(() => {
    try {
      const raw = localStorage.getItem("biq_hotstreak_best");
      if (raw) { const n = parseInt(raw, 10); if (!Number.isNaN(n)) return n; }
    } catch {}
    return 0;
  });
  const [showRatePrompt, setShowRatePrompt] = useState(false);
  const [rateView, setRateView] = useState("ask"); // 'ask' (loving it?) → 'store' (go rate). Unhappy → feedback, never the store.
  const [showFirstQuizTip, setShowFirstQuizTip] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showKnownIssues, setShowKnownIssues] = useState(false);
  const [ratePromptShown, setRatePromptShown] = useState(false);
  const [xp, setXp] = useState(() => {
    try {
      const raw = localStorage.getItem("biq_xp");
      if (raw) { const n = parseInt(raw, 10); if (!Number.isNaN(n)) return n; }
    } catch {}
    return 0;
  });
  const [levelUpOverlay, setLevelUpOverlay] = useState(null);
  const levelUpTimerRef = useRef(null);
  const [howToPlay, setHowToPlay] = useState(null);
  const [loginStreak, setLoginStreak] = useState(() => {
    try {
      const raw = localStorage.getItem("biq_login_streak");
      if (raw) { const p = JSON.parse(raw); if (p && typeof p.streak === "number") return p.streak; }
    } catch {}
    return 0;
  });
  // bestLoginStreak is persisted alongside the current streak under the same
  // biq_login_streak key (extended schema: { streak, lastDay, best }). Older
  // saves without `best` get backfilled from `streak` on first load.
  const [bestLoginStreak, setBestLoginStreak] = useState(() => {
    try {
      const raw = localStorage.getItem("biq_login_streak");
      if (raw) {
        const p = JSON.parse(raw);
        if (p && typeof p.best === "number") return p.best;
        if (p && typeof p.streak === "number") return p.streak;
      }
    } catch {}
    return 0;
  });
  const [streakToast, setStreakToast] = useState(null);
  // Sprint #11 Stage 3: replaced session-stable random taglines with
  // context-aware sub-text computed inline in the greeting block (reflects
  // today's actionable state — Footle done, Today's 7 done, both, neither).
  // Streak chip pulse — fires once per session when the daily-streak load
  // effect bumps loginStreak past the value persisted at last app close.
  // initialStreakRef captures the synchronous useState value on mount;
  // pulsedRef gates against firing more than once per session even if
  // state churns. Same-day re-visits won't pulse (initial === current).
  const initialStreakRef = useRef(loginStreak);
  const pulsedRef = useRef(false);
  const [streakPulsing, setStreakPulsing] = useState(false);
  useEffect(() => {
    if (!pulsedRef.current && loginStreak > initialStreakRef.current && loginStreak > 0) {
      pulsedRef.current = true;
      setStreakPulsing(true);
      const t = setTimeout(() => setStreakPulsing(false), 1500);
      return () => clearTimeout(t);
    }
  }, [loginStreak]);
  const streakToastTimerRef = useRef(null);
  // Audit Phase 5 (H1): cluster-track the 9 unguarded celebration setTimeouts
  // in handleComplete (perfect score, personal bests, streak milestones,
  // comeback, category mastery, IQ best, survival best, rate prompt). Each
  // setTimeout's id gets pushed; cleanup clears all so AppInner unmounting
  // mid-celebration doesn't fire setState/showToast on the unmounted tree.
  const celebrationTimeoutsRef = useRef([]);
  // Read by the +2000ms 'save' auth nudge below. Declared up here because the
  // nudge is SCHEDULED at result time but FIRES later — and whether the name
  // sheet is open by then is only knowable at fire time. A ref, not state:
  // the scheduled closure would otherwise capture a stale `false`.
  // The results-screen 'save' nudge waits here until the player LEAVES results
  // (see goHome). It used to fire on a 2s timer over the results themselves.
  /**
   * ⚠️ THE RATING ASK IS SCHEDULED AT A CELEBRATION AND FIRES UP TO 3.5s LATER.
   *
   * Scouting report #4: the prompt "can land on top of a live game and block
   * every control while the clock runs — and on iOS its twin spends one of
   * Apple's ~3-per-year review tickets, possibly mid-question, on a build where
   * the ratings engine reaches iPhone for the FIRST time."
   *
   * Finish a Classic round, tap straight into another game, and the timer that
   * was queued on the results screen fires over question 1 of the next one.
   *
   * A ref, not state, for the same reason askShareNameRef above is one: the
   * scheduled closure would capture the screen as it was when the timer was
   * created, which is precisely the screen we are trying to detect leaving.
   *
   * ⚠️ Do NOT "fix" this by clearing celebrationTimeoutsRef on a screen-keyed
   * effect — the panel suggested exactly that and the critic caught it.
   * `setScreen("results")` is the LAST statement of handleComplete, in the same
   * synchronous callback that pushes every celebration timer, so a screen-keyed
   * effect would clear the timers that were just queued and delete the entire
   * celebration layer. Gate the ASK, never the timers.
   *
   * Deny-list rather than allow-list: the Footle ask fires deliberately on the
   * `wordle` screen and the Daily-7 ask on `results`, so an allow-list would
   * silently kill real asks. What must never be interrupted is a running clock.
   */
  const screenRef = useRef(screen);
  screenRef.current = screen;
  const ratingAskAllowed = useCallback(() => !RATING_ASK_BLOCKED.has(screenRef.current), []);
  // Single cleanup on unmount: clear any in-flight toast/overlay timers so
  // tabbing away mid-toast doesn't leave dangling setState callbacks.
  useEffect(() => () => {
    if (levelUpTimerRef.current) clearTimeout(levelUpTimerRef.current);
    if (streakToastTimerRef.current) clearTimeout(streakToastTimerRef.current);
    celebrationTimeoutsRef.current.forEach(clearTimeout);
    celebrationTimeoutsRef.current = [];
  }, []);
  const [toast, setToast] = useState(null);
  // showToast lives HERE, right under its state, because the streak-repair
  // callbacks a few hundred lines down call it from inside their bodies — a
  // const declared below them is a TDZ read the moment one of them runs
  // during render (review 2026-09-06, E15; ESLint no-use-before-define now
  // fails the build on that shape).
  const toastTimerRef = useRef(null);
  const showToast = useCallback((msg, duration = 2800) => {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, duration);
  }, []);

  // Phase G (audit finding 2.1): server-authoritative login streak.
  // Replaces the mount-effect-vs-hydrate race that could silently truncate
  // a multi-device user's streak. Signed-in users call tick_login_streak
  // RPC which reads + writes profiles.login_streak atomically server-side;
  // the returned object includes a `ticked` flag (whether server state
  // changed this call) that gates the streak toast. Multi-device same-day
  // opens see ticked=false on the second device → no duplicate toast.
  //
  // Guest users have no remote profile, so the same lastDay logic runs
  // client-side as a fallback. Both paths share the post-tick logic:
  // write local cache, update React state, fire toast on increment.
  //
  // Placed BEFORE the day-rollover useEffect below so that effect's dep
  // array can include tickLoginStreak without hitting a TDZ at render.
  // 1.1: brief confetti on the big habit milestones (7/30/100-day streaks),
  // layered on the existing toast + haptic + sound. Auto-clears after a few
  // seconds so it re-fires cleanly on the next milestone.
  const [milestoneConfetti, setMilestoneConfetti] = useState(false);
  useEffect(() => {
    if (!milestoneConfetti) return;
    const t = setTimeout(() => setMilestoneConfetti(false), 5000);
    return () => clearTimeout(t);
  }, [milestoneConfetti]);

  // Active repair offer ({fell, fellDay}) or null. Set by tickLoginStreak
  // when the RPC/guest tick reports an un-shielded break stamped today;
  // consumed by repairLoginStreak below.
  const [streakRepair, setStreakRepair] = useState(null);

  // Android widget sync (1.6.2). done-count reads per-mode completion the
  // same way the Daily hub does, but from storage directly so this works
  // regardless of which screen is mounted. Fixed total of 4: both frozen
  // schedules run hundreds of days deep, and a rare gap day showing /4 is
  // harmless in a launcher glance.
  const syncDailyWidget = useCallback(() => {
    try {
      const ymd = dateToYMD(new Date());
      const ws = readWordleTodayStatus();
      const footleDone = ws.kind === "won" || ws.kind === "lost";
      let trailDone = false, mysteryDone = false;
      try {
        const t = JSON.parse(localStorage.getItem(`biq_trail_${ymd}`) || "null");
        trailDone = t?.status === "won" || t?.status === "lost";
      } catch {}
      try {
        const m = JSON.parse(localStorage.getItem(`biq_mystery_${ymd}`) || "null");
        mysteryDone = !!(m && (m.won || m.gaveUp));
      } catch {}
      const done = (dailyDone ? 1 : 0) + (footleDone ? 1 : 0) + (trailDone ? 1 : 0) + (mysteryDone ? 1 : 0);
      syncWidget({ date: ymd, done, total: 4, streak: loginStreak || 0 });
    } catch { /* widget is decoration */ }
  }, [dailyDone, loginStreak]);
  useEffect(() => { syncDailyWidget(); }, [syncDailyWidget]);

  const tickLoginStreak = useCallback(async () => {
    // Calendar day in the USER'S timezone (days since epoch of the local
    // date). The previous UTC day (Date.now()/DAY_MS client-side,
    // current_date server-side) broke streaks for anyone west of UTC playing
    // in the evening: consecutive LOCAL days straddled 00:00 UTC and read as
    // a skipped day. The server clamps this value to ±2 of its UTC day.
    const d0 = new Date();
    const localDay = Math.floor((d0.getTime() - d0.getTimezoneOffset() * 60000) / 86400000);
    let result;
    if (user?.id) {
      const { data, error } = await supabase.rpc('tick_login_streak', { p_local_day: localDay });
      if (error) { console.warn('[tick_login_streak]', error.message); return; }
      result = data;
    } else {
      // Guest path — same logic as the RPC, executed client-side.
      const todayNum = localDay;
      let prev = null;
      try {
        const raw = localStorage.getItem('biq_login_streak');
        if (raw) prev = JSON.parse(raw);
      } catch {}
      const prevStreak  = prev?.streak  ?? 0;
      const prevLastDay = prev?.lastDay ?? 0;
      const prevBest    = prev?.best    ?? prev?.streak ?? 0;
      // 1.1 streak freeze: a SINGLE missed day with an available shield freezes
      // the streak — it survives, and today still continues it. xp + shieldsUsed
      // are read from localStorage (not state) so this stays out of
      // tickLoginStreak's deps; it fires on mount, and depending on xp/stats
      // values would make it re-tick on every XP/stats change.
      let xpVal = 0, shieldsUsed = 0;
      try { xpVal = parseInt(localStorage.getItem('biq_xp') || '0', 10) || 0; } catch {}
      try { const s = JSON.parse(localStorage.getItem('biq_stats') || '{}'); shieldsUsed = s.shieldsUsed || 0; } catch {}
      // Capped at 3 banked: an uncapped shield pile lets a high-XP player run
      // an infinite every-other-day "streak", which kills the loss aversion
      // the streak exists to create.
      const shieldsAvail = Math.min(3, Math.max(0, Math.floor(xpVal / 200) - shieldsUsed));
      let newStreak, shieldSaved = false;
      if (prevLastDay > todayNum) {
        // lastDay is AHEAD of today (a legacy UTC tick banked a later day).
        // Never reset for that — keep state as-is and leave lastDay alone.
        result = { lastDay: prevLastDay, streak: prevStreak, best: prevBest, ticked: false, shieldSaved: false };
      } else {
        if (prevLastDay === todayNum) newStreak = prevStreak;
        else if (prevLastDay === todayNum - 1) newStreak = prevStreak + 1;
        else if (prevLastDay === todayNum - 2 && prevStreak > 0 && shieldsAvail > 0) {
          newStreak = prevStreak + 1;
          shieldSaved = true;
          bumpUsage('shield-saved');
        } else newStreak = 1;
        // Un-shielded break: stash the fallen streak for same-day repair,
        // mirroring the RPC (see v1_6_streak_repair.sql + the floor-2 follow-up).
        // Floor dropped 3 -> 2 on 2026-08-21 to match the server: measured in
        // prod, 33 of 179 streak-holders were at 3+ but 54 were at 2+, and a
        // two-day habit is the most fragile one there is. The longest current
        // streak (55 days) does not need coaxing back; day two does.
        // ⚠️ This threshold is duplicated client/server on purpose (guests have
        // no RPC). If one moves, move BOTH or guests and accounts disagree.
        const fellStash = (newStreak === 1 && prevLastDay !== todayNum && prevStreak >= 2)
          ? { fell: prevStreak, fellDay: todayNum } : null;
        result = {
          lastDay: todayNum,
          streak:  newStreak,
          best:    Math.max(prevBest, newStreak),
          ticked:  prevLastDay !== todayNum,
          shieldSaved,
          ...(fellStash || {}),
        };
      }
    }
    if (!result) return;
    // Streak-death acknowledgment (opportunity-scan #8): capture the streak
    // this device last persisted BEFORE the cache write below overwrites it.
    // Read from localStorage, not state — same reason as xp/shieldsUsed
    // above: a state dep would re-create this callback and re-fire the
    // mount-tick effect on every streak change.
    let prevKnownStreak = 0;
    try {
      const raw = localStorage.getItem('biq_login_streak');
      if (raw) { const p = JSON.parse(raw); if (typeof p?.streak === 'number') prevKnownStreak = p.streak; }
    } catch {}
    try {
      localStorage.setItem('biq_login_streak', JSON.stringify({
        lastDay: result.lastDay, streak: result.streak, best: result.best,
        ...(result.fell > 0 ? { fell: result.fell, fellDay: result.fellDay } : {}),
      }));
    } catch {}
    setLoginStreak(result.streak);
    setBestLoginStreak(result.best);
    // Repair window: the stash is only actionable on the local day the break
    // was discovered — the server enforces the same rule, this just gates UI.
    setStreakRepair(result.fell > 0 && result.fellDay === localDay
      ? { fell: result.fell, fellDay: result.fellDay } : null);
    // Keep the UI's shield count in sync. Signed-in: the RPC owns shieldsUsed
    // (in login_streak) and returns it — mirror it into local stats so the
    // Daily-tab banner shows the right number. Guests own it locally.
    if (typeof result.shieldsUsed === "number") {
      setStats(p => ({ ...p, shieldsUsed: result.shieldsUsed }));
    }
    if (result.shieldSaved) {
      // A shield froze the missed day. Guests consume locally; signed-in users
      // were already debited server-side (synced above). Clearer message than
      // the regular streak toast, which is suppressed here.
      if (!user?.id) setStats(p => {
        // Persist the debit (not just React state) so the availability gate,
        // which reads shieldsUsed from localStorage, sees it after a reload —
        // otherwise one earned shield would freeze unlimited separate gaps.
        const updated = { ...p, shieldsUsed: (p.shieldsUsed || 0) + 1 };
        safeSetItem("biq_stats", JSON.stringify(updated));
        return updated;
      });
      showToast(`🛡️ Streak shield used — your ${result.streak}-day streak is safe!`);
      haptic("heavy");
      playSound("streak");
    } else if (result.ticked && result.streak > 1) {
      if (streakToastTimerRef.current) clearTimeout(streakToastTimerRef.current);
      setStreakToast(result.streak);
      haptic("heavy");
      playSound("streak");
      streakToastTimerRef.current = setTimeout(() => setStreakToast(null), TIMINGS.STREAK_TOAST);
    } else if (result.streak < prevKnownStreak && prevKnownStreak >= 3) {
      // The streak died since this device last ticked (normally streak === 1
      // after a reset; a stale multi-device cache can land higher). Without
      // this the counter silently drops — name the loss once and frame the
      // rebuild against the user's best. Ack is keyed on the death's day
      // number so a re-tick or second same-day open can't repeat it, while
      // a later, separate death (new day number) still shows.
      let acked = false;
      try { acked = localStorage.getItem('biq_streak_death_ack') === String(result.lastDay); } catch {}
      if (!acked) {
        try { localStorage.setItem('biq_streak_death_ack', String(result.lastDay)); } catch {}
        const best = (typeof result.best === 'number' && result.best > 0) ? result.best : prevKnownStreak;
        showToast(`💔 Streak reset — day ${result.streak} of the rebuild. Your best: ${best} 🔥`, 4200);
      }
    }
    // Milestone celebration on the day-7/30/100 CROSSING itself (the tick),
    // not only when a game finishes on the milestone day — a user who opens
    // the app on day 7 but plays tomorrow previously never saw it.
    // handleComplete keeps its copy behind the same once-flags. Flags are
    // read from localStorage rather than stats state so deps stay [user?.id]
    // — depending on stats would re-run the mount tick on every stats change
    // (same constraint as the shield read above).
    if (result.ticked && [7, 30, 100].includes(result.streak)) {
      let persisted = {};
      try { persisted = JSON.parse(localStorage.getItem('biq_stats') || '{}') || {}; } catch {}
      const flag = `streak${result.streak}Celebrated`;
      if (!persisted[flag]) {
        const msg = result.streak === 7 ? "🔥 7-day streak — you're building a habit"
          : result.streak === 30 ? "🏆 30-day streak — incredible dedication"
          : "💎 100-day streak — you are a legend";
        // 1200ms so it lands after the regular streak toast/pulse — same
        // delay handleComplete's copy uses.
        celebrationTimeoutsRef.current.push(setTimeout(() => { showToast(msg); haptic("heavy"); playSound("streak"); setMilestoneConfetti(true); }, 1200));
        setStats(p => {
          const updated = { ...p, [flag]: true };
          // Persist directly (setStats alone doesn't write storage) so a
          // reload before the next saveStats can't replay the celebration.
          safeSetItem("biq_stats", JSON.stringify(updated));
          return updated;
        });
      }
    }
  }, [user?.id]);

  // ⚠️ DRAIN THE SCORE OUTBOX ONCE AUTH HAS SETTLED.
  //
  // `scores` was the only game record with no retry and no back-fill, while
  // `wordle_state` has had a sign-in back-sync all along — which is exactly why
  // ~20% of daily completions existed in state and not in scores (137 finished
  // vs 110 rows over the last week, measured against prod). Anything that could
  // not be written at the moment it happened is queued locally; this is where it
  // lands. Idempotent by client-generated id, so running on every auth change
  // cannot double-count.
  useEffect(() => {
    if (!user?.id) return;
    // ⚠️ THE FIRST STEP THAT CAN BE ATTRIBUTED TO A PERSON. Today 907 of 908
    // `first-game-started` rows carry a NULL user_id, because they fire while
    // signed out — which is exactly why the 79 accounts that never played are
    // invisible. Everything in the acct-* chain fires signed in, so
    // record_funnel_event's auth.uid() has something to record.
    markAcctStep(user.id, 'acct-session', loopEvent);
    flushScoreOutbox(user.id)
      .then(({ sent, dropped }) => {
        if (sent) loopEvent('score-outbox-flushed', { sent, dropped });
      })
      .catch(() => { /* still offline; the queue keeps until next time */ });
  }, [user?.id]);



  // ⚠️ THE STREAK NO LONGER TICKS ON OPEN. It used to fire here, once per
  // AppInner mount, which made it a count of days you LAUNCHED the app.
  //
  // That produced two flames showing different numbers on the same evening
  // (Home 🔥1 while Daily said 0), and — worse — made the single most
  // load-bearing number in a daily game reward the one behaviour we don't
  // care about. Measured 2026-08-14: modes with a daily reset retain 62-70%
  // of the people who try them, modes without retain 21-26%. The appointment
  // is the mechanic, so the streak has to be the appointment's counter.
  //
  // It now ticks from the `biq:daily-completed` handler instead, which all
  // four daily modes dispatch (Footle, Daily 7, Trail, Mystery). One trigger,
  // one number, every surface.
  //
  // The server RPC is unchanged and still authoritative — only the caller
  // moved. Existing streaks keep their value; a one-off grace shield
  // (v1_5_streak_grace_shield.sql) absorbs the first missed play-day for
  // anyone who was mid-streak when this shipped.

  // Detect day rollover while the app stays open. dailyDone / dailyScore were
  // hydrated from yesterday's localStorage key on mount; without this effect a
  // user who leaves the tab open past midnight would still see the "already
  // done" toast until they reload. Polls once a minute (cheap, well under the
  // resolution that matters here). After the date flips we also rebuild
  // dailyHistory from localStorage so the Daily tab calendar surfaces the
  // freshly-completed previous day immediately.
  const [dailyHistory, setDailyHistory] = useState({});
  useEffect(() => {
    const dayKey = () => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    };
    const rebuildHistory = () => {
      try {
        const hist = {};
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          const m = k && k.match(/^biq_daily_(\d{4}-\d{2}-\d{2})$/);
          if (!m) continue;
          try {
            const parsed = JSON.parse(localStorage.getItem(k));
            if (typeof parsed?.score === "number") hist[m[1]] = parsed.score;
          } catch {}
        }
        setDailyHistory(hist);
      } catch {}
    };
    // Streak integrity: a day rollover is the CLOCK passing midnight, not the
    // user opening the app. Ticking straight from the poller banked a streak
    // day for an app/tab left open overnight with nobody in front of it, so a
    // flame could climb for days without a single interaction. Phase G's
    // intent — keeping the app open across midnight still earns the day — is
    // preserved, but the credit is now DEFERRED until the app is genuinely
    // used on the new day: a hidden→visible transition (a real open) or a real
    // pointer/key event. If neither happens, the mount tick on the next real
    // open earns the day instead, so nothing is lost.
    // The deferred-credit machinery that used to live here (pendingTick +
    // pointer/key/visibility listeners) existed ONLY to earn a streak day for
    // someone who kept the app open across midnight. The streak is earned by
    // playing now, not by being open, so there is nothing to defer and the
    // three global listeners are gone with it. What remains is the part that
    // was always about state: reset dailyDone, rebuild history, announce the
    // rollover.
    let lastKey = dayKey();
    const id = setInterval(() => {
      const cur = dayKey();
      if (cur === lastKey) return;
      lastKey = cur;
      try {
        const raw = localStorage.getItem(`biq_daily_${cur}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          setDailyDone(true);
          setDailyScore(typeof parsed?.score === "number" ? parsed.score : null);
        } else {
          setDailyDone(false);
          setDailyScore(null);
        }
      } catch {
        setDailyDone(false);
        setDailyScore(null);
      }
      rebuildHistory();
      // 1.1: re-anchor the reminder window to the new "today" (offset 0) so a
      // post-midnight completion cancels the correct reminder id (listened for
      // in the notifications section).
      try { window.dispatchEvent(new CustomEvent('biq:day-rollover')); } catch {}
    }, 60_000);
    return () => { clearInterval(id); };
  }, []);


  const setProfile = useCallback((updater) => {
    setProfileState(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      safeSetItem("biq_profile", JSON.stringify(next));
      return next;
    });
  }, []);

  // Sharing → hooks/useShare.js (E16, 2026-09-06): the score/profile/daily
  // share builders, the card image, and the ask-your-name sheet's state.
  const {
    shareScore, saveCardImage, shareProfile, shareDaily, performDailyShare, submitShareName, resolveChallengerName,
    askShareName, askShareNameRef, shareNameDraft, setShareNameDraft, shareNameRef,
  } = useShare({ user, showToast, profile, setProfile, authProfile, stats, xp, loginStreak, dailyScore });
  const todayKey = useMemo(() => keyForDate(new Date()), []);
  const [activeDailyDate, setActiveDailyDate] = useState(null);
  const [activeClub, setActiveClub] = useState(null);
  const [activeLeague, setActiveLeague] = useState(null);


  // ⚠️ Placed BELOW showToast on purpose: repairLoginStreak lists it as a
  // dep, and a deps array is evaluated during render — referencing the const
  // above its declaration is the TDZ crash this file has been bitten by
  // before (see the settle effect's comment).
  // The comeback: restore an un-shielded broken streak after the player
  // completes one of yesterday's puzzles from the back-catalogue. Server is
  // authoritative for signed-in users (repair_login_streak — single-use,
  // same-day, verified live); guests mirror the exact rule locally. rpc()
  // RESOLVES with {error} — read it, never assume (question_reports rule).
  const repairLoginStreak = useCallback(async () => {
    const d0 = new Date();
    const localDay = Math.floor((d0.getTime() - d0.getTimezoneOffset() * 60000) / 86400000);
    const celebrate = (streakVal) => {
      showToast(`🔥 Streak repaired — ${streakVal} days and counting`);
      haptic("heavy");
      playSound("streak");
      setMilestoneConfetti(true);
    };
    if (user?.id) {
      const { data, error } = await supabase.rpc('repair_login_streak', { p_local_day: localDay });
      if (error) { console.warn('[repair_login_streak]', error.message); return; }
      setStreakRepair(null);
      if (!data?.repaired) return;
      setLoginStreak(data.streak);
      setBestLoginStreak(data.best);
      try { localStorage.setItem('biq_login_streak', JSON.stringify({ lastDay: data.lastDay, streak: data.streak, best: data.best })); } catch {}
      celebrate(data.streak);
    } else {
      try {
        const raw = localStorage.getItem('biq_login_streak');
        if (!raw) return;
        const p = JSON.parse(raw);
        setStreakRepair(null);
        if (!(p?.fell > 0) || p.fellDay !== localDay || p.lastDay !== localDay) return;
        const streakVal = p.fell + p.streak;
        const best = Math.max(p.best || 0, streakVal);
        localStorage.setItem('biq_login_streak', JSON.stringify({ lastDay: p.lastDay, streak: streakVal, best }));
        setLoginStreak(streakVal);
        setBestLoginStreak(best);
        celebrate(streakVal);
      } catch { /* storage unavailable — nothing to repair against */ }
    }
  }, [user?.id, showToast]);

  // Completing YESTERDAY's puzzle in the archive is the repair trigger —
  // any of the four dailies counts, consistent with the A0 rule that any
  // completion counts toward the streak.
  useEffect(() => {
    const onArchiveDone = (e) => {
      if (!streakRepair) return;
      const y = new Date(); y.setDate(y.getDate() - 1);
      if (e?.detail?.ymd === dateToYMD(y)) repairLoginStreak();
    };
    window.addEventListener('biq:archive-completed', onArchiveDone);
    return () => window.removeEventListener('biq:archive-completed', onArchiveDone);
  }, [streakRepair, repairLoginStreak]);

  // ⚠️ THIS BLOCK MUST STAY BELOW showToast. It first sat ~280 lines higher and
  // took production down: handleToggleWebPush lists showToast in its dependency
  // array, that array is evaluated on every render, and a `const` referenced
  // above its own declaration is a temporal dead zone error — so AppInner threw
  // on EVERY render and the whole app rendered the error boundary. The build was
  // green and every unit test passed, because nothing renders AppInner.
  // ── Web Push opt-in (web only; native uses local notifications) ──────────
  // Mirrors the native toggle's shape so Settings can render either behind one
  // identical row.
  const [webPushOn, setWebPushOn] = useState(() => {
    try { return webPushSupported() && Notification.permission === 'granted'; } catch { return false; }
  });

  // Re-assert an existing subscription once per session. Browsers rotate push
  // endpoints on their own schedule and Safari does not fire
  // `pushsubscriptionchange` reliably — without this a rotated endpoint leaves
  // a stale row and the user goes silent with no error anywhere. Never prompts:
  // it returns immediately unless permission is ALREADY granted.
  //
  // Then reconcile the toggle against the REAL subscription. The optimistic
  // init above reads bare permission, and permission ≠ subscription: a
  // granted browser with no live sub (seen in the wild 2026-08-29 — a
  // consent-banner "Allow" misread as the push prompt, sub never created)
  // showed reminders ON while nothing could ever arrive. Runs after the
  // refresh so a sign-in self-heal is reflected, and for signed-out visitors
  // too, where the answer is honestly OFF.
  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        if (!webPushSupported()) return;
        if (user?.id) await refreshWebPushSubscription();
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = reg ? await reg.pushManager.getSubscription() : null;
        if (!dead) setWebPushOn(!!sub && Notification.permission === 'granted');
      } catch { /* keep the optimistic state rather than lying OFF on a flake */ }
    })();
    return () => { dead = true; };
  }, [user?.id]);

  const handleToggleWebPush = useCallback(async (on) => {
    if (on) {
      // Requesting from inside this handler is load-bearing, not incidental:
      // Safari rejects requestPermission() outside a user gesture entirely.
      const ok = await enableWebPush();
      setWebPushOn(ok);
      showToast(ok
        ? 'Daily reminders on 🔔'
        : (webPushPermission() === 'denied'
            ? 'Blocked in your browser — allow notifications for balliq.app'
            : "Couldn't turn reminders on"));
    } else {
      await disableWebPush();
      setWebPushOn(false);
      showToast('Daily reminders off');
    }
  }, [showToast]);


  // Challenge validity: a token is honored on its own calendar day and — since
  // the Daily 7 is deterministic per day, a day-old score came from a different
  // question set — the day AFTER too, labelled "(yesterday's score)" so the
  // compare stays honest. 2+ days old expires with a nudge to send one back;
  // a link opened AFTER already playing settles instantly via the result modal.
  // (The mid-flow compare in handleComplete clears the challenge synchronously
  // with the dailyDone flip, so this effect never double-fires it.)
  // Placed BELOW all its dependencies (pendingChallenge, dailyDone, dailyScore,
  // showToast, clearChallenge): a deps array is evaluated during render, so a
  // dep referenced above its `const` declaration is a temporal-dead-zone crash
  // on every app load — which is exactly what was killing web /play.
  useEffect(() => {
    if (!pendingChallenge) return;
    loopEvent("challenge-arrived");
    // Server-side counterpart of the Clarity event above: Clarity is web-only
    // and unqueryable, so the /c/ loop was invisible to k-factor.sql. The
    // localStorage marker dedupes per TOKEN (this effect re-runs when
    // dailyDone/dailyScore change, and the same token is restored from
    // localStorage on every boot until consumed — without the marker one
    // link would log dozens of opens). rpc() resolves {error} on failure,
    // it never throws — read the field, never assume (question_reports rule).
    if (challengeEventOnce("open", pendingChallenge)) {
      supabase.rpc("record_challenge_event", {
        p_event: "open", p_date: pendingChallenge.date,
        p_score: pendingChallenge.score, p_name: pendingChallenge.name || null,
        p_sender: pendingChallenge.from || null,
      }).then(({ error }) => { if (error) console.warn("[challenge open]", error.message); });
    }
    const age = challengeDayOffset(pendingChallenge.date);
    if (age > 1) {
      showToast(`⏰ ${pendingChallenge.name || "Your friend"}'s challenge has expired — play today's Daily 7 and send one back!`);
      clearChallenge();
    } else if (dailyDone) {
      // Already played today: settle instantly in the result modal (a toast
      // evaporated before anyone could "send it back").
      setChallengeResult({
        mine: dailyScore,
        theirs: pendingChallenge.score,
        name: pendingChallenge.name,
        yesterday: age === 1,
      });
      if (challengeEventOnce("played", pendingChallenge)) {
        supabase.rpc("record_challenge_event", {
          p_event: "played", p_date: pendingChallenge.date,
          p_score: pendingChallenge.score, p_name: pendingChallenge.name || null,
          p_my_score: dailyScore,
          p_sender: pendingChallenge.from || null,
        }).then(({ error }) => { if (error) console.warn("[challenge played]", error.message); });
      }
      clearChallenge();
    }
  }, [pendingChallenge, dailyDone, dailyScore, showToast, clearChallenge]);

  // Question report — a one-tap "report a problem" on the answer reveal writes to
  // question_reports (RPC-only) so we can re-check flagged items. We always thank
  // the player even if the write fails — the point is to defuse "this is wrong"
  // frustration in-app rather than have it become a 1-star review.
  // ⚠️ supabase.rpc() RESOLVES with {data, error} on a Postgres error — it does
  // NOT throw — so a .catch()-only version never fired and we thanked the player
  // regardless. Combined with the button being near-invisible, the result was
  // that public.question_reports held ZERO rows for the entire life of the app,
  // while playtesters were finding real question defects and texting Alex instead.
  // Same failure shape as sendPlayInvite. Read `error`, and only claim success
  // when there was one.
  // Which question is awaiting a reason. Null = sheet closed.
  const [reportPending, setReportPending] = useState(null);
  /**
   * Resolver for the promise `reportQuestion` handed its caller. Held in a ref,
   * not state: it must survive the re-render that opening the sheet causes, and
   * nothing renders from it.
   *
   * ⚠️ Every path out of the sheet MUST settle this or a report button is stuck
   * on "Sending…" forever. Today there are exactly two — onPick and onSkip — and
   * both go through sendQuestionReport, which always settles it. A third way to
   * close the sheet has to settle it too.
   */
  const reportResolveRef = useRef(null);
  const reportQuestion = useCallback((info) => {
    // A report IS a bad moment — suppress the native rating ask for 24h so a
    // player mid-complaint never meets "enjoying Ball IQ?" (review panel lever).
    markBadReviewMoment();
    // Ask WHY before sending. 55 reports had accumulated with reason null —
    // the column existed, the RPC accepted it, the client never sent one — so
    // more than half the channel's rows were unreadable (54% came from players
    // who answered correctly, motive unknown). The sheet resolves the send;
    // dismissing still reports, with reason null, because the tap on "Report"
    // is itself the signal and a second tap must never be the price of it.
    // Resolves only when the RPC has actually answered, so the button can stop
    // claiming success on the strength of a tap. See components/ReportButton.jsx.
    return new Promise((resolve) => {
      // A sheet should never already be open, but if one is, settle its caller
      // rather than stranding that button on "Sending…".
      if (reportResolveRef.current) { try { reportResolveRef.current(false); } catch { /* gone */ } }
      reportResolveRef.current = resolve;
      setReportPending(info || {});
    });
  }, []);
  const sendQuestionReport = useCallback(async (info, reason) => {
    setReportPending(null);
    // "Too easy" is a compliment wearing a complaint's clothing — an engaged
    // player telling us a question was beneath them. reportQuestion() has
    // already suppressed the rating ask for 24h; give it back for this one
    // reason. See clearBadReviewMoment for why the check lives here and not
    // at the marking site.
    if (reason === 'too-easy') clearBadReviewMoment();
    const resolve = reportResolveRef.current;
    reportResolveRef.current = null;
    // Settle the waiting button with the REAL outcome, then return it as before
    // for any caller that awaits sendQuestionReport directly.
    const settle = (ok) => { if (resolve) { try { resolve(ok); } catch { /* gone */ } } return ok; };
    try {
      const { error } = await supabase.rpc("report_question", {
        p_question_id: info?.id != null ? String(info.id) : null,
        p_question_text: info?.q || "(unknown)",
        p_picked: info?.picked ?? null,
        p_correct: info?.correct ?? null,
        p_mode: info?.mode ?? null,
        p_reason: reason || null,
      });
      if (error) {
        console.warn("[report_question]", error.message);
        Sentry.captureException(error, { tags: { area: "question-report" } });
        showToast("Couldn't send that report — we'll look into it");
        return settle(false);
      }
      showToast("Thanks — we'll double-check this one ⚽");
      return settle(true);
    } catch (e) {
      console.warn("[report_question]", e?.message || e);
      showToast("Couldn't send that report — we'll look into it");
      return settle(false);
    }
  }, [showToast]);


  // Audit 2.4: surface localStorage quota exhaustion. safeSetItem fires this
  // event once per session on QuotaExceededError; without this, quota loss
  // is silent and users see "progress not saving" with no explanation.
  useEffect(() => {
    const onQuotaExceeded = () => {
      showToast('⚠️ Storage full — clear browser data to continue saving progress', 5000);
    };
    window.addEventListener('biq:storage-quota-exceeded', onQuotaExceeded);
    return () => window.removeEventListener('biq:storage-quota-exceeded', onQuotaExceeded);
  }, [showToast]);

  // Sprint #71 MM1: shared "biq:show-toast" channel so deeply-nested
  // components (IqRecapOverlay, FootleScreen share fallback) can surface
  // a toast without prop-drilling showToast. Mirrors the storage-quota
  // event pattern above. Detail: string message; optional duration via
  // detail object { msg, duration }.
  useEffect(() => {
    const onShowToast = (e) => {
      const d = e?.detail;
      if (!d) return;
      if (typeof d === 'string') { showToast(d); return; }
      if (d.msg) showToast(String(d.msg), d.duration);
    };
    window.addEventListener('biq:show-toast', onShowToast);
    return () => window.removeEventListener('biq:show-toast', onShowToast);
  }, [showToast]);

  // Multi-player local state
  const [localConfig, setLocalConfig] = useState(null); // { players, mode, diff } set by LocalSetup
  const [localResult, setLocalResult] = useState(null); // populated by LocalGameScreen onComplete

  useEffect(() => {
    // V1.1: prefetch the questions.js chunk in the background as soon as
    // AppInner mounts. By the time the user taps Play (typically 5-30s
    // after first paint), the chunk has already loaded and the lazy
    // getters (getQs / getDailyQs / pickMultiplayerQuestions / etc.)
    // resolve effectively-synchronously. Only users who tap Play
    // within the first ~200ms of paint experience any noticeable wait,
    // and that wait is invisible (Home stays mounted, no spinner).
    // See questions-loader.js + docs/BUNDLE_SPLITTING_ANALYSIS.md.
    //
    // Deferred to IDLE time (2026-07-16): social traffic boots straight into
    // /footle, which imports NOTHING from questions.js — so an eager prefetch
    // was ~424KB of cellular transfer + a main-thread eval competing with the
    // arriving user's first Footle guess. requestIdleCallback runs it only when
    // the main thread is free; quiz users still get it well before they tap Play
    // (idle fires within ~1-2s on Home). setTimeout fallback for WKWebViews
    // without rIC (iOS < 17.4).
    //
    // STAGED (2026-07-29): the single idle prefetch above used to pull the whole
    // bank at t≈1-2s. That is one ~700ms main-thread task landing exactly in the
    // window where a visitor decides what to tap, and it was the entire "INP
    // needs improvement" in Clarity. It cannot be made non-blocking — parsing a
    // module is atomic — so the only levers are shrinking it and moving it.
    //
    //   stage 1, immediately at idle: the INDEX (~13× smaller). Cheap, and the
    //     club/league pickers need it to render their counts.
    //   stage 2, deliberately late: the full bank, for someone who sits on Home
    //     and then taps a mode directly. The picker screens call
    //     prefetchQuestions() on mount, so anyone browsing pulls it forward on
    //     real intent — this timer only covers the direct-tap path.
    //
    // Both are fire-and-forget and dedupe inside questions-loader, so a stage-2
    // timer firing after a picker already started the load is a no-op.
    {
      const idleIndex = () => { try { prefetchQuestionIndex(); } catch {} };
      const idleBank = () => { try { prefetchQuestions(); } catch {} };
      // ⚠️ THE ONLINE TAB CHUNK — the one measured cause of a slow tab switch.
      //
      // Measured 2026-08-22 (Alex: "tab switching is a bit less responsive
      // than I would like"). Three plausible causes were measured and all
      // three were WRONG: click-to-paint is ~17ms (one frame at 60fps), all
      // four panes together hold 733 DOM nodes so toggling `display` costs
      // nothing, and .tab-item already sets touch-action:manipulation so there
      // is no 300ms tap delay.
      //
      // What IS slow is the FIRST tap on Online. OnlineMultiplayer is a ~52kB
      // React.lazy chunk that NOTHING loads until you tap the tab — verified
      // by building without this prefetch and watching the chunk never appear
      // in the resource timeline across a 7s idle load. Until it arrives the
      // Suspense fallback renders an EMPTY tab-pane, so on a phone over
      // cellular the first visit is a blank rectangle for as long as the
      // network takes. It happens exactly once per session, which is why it
      // reads as "sometimes sluggish" rather than broken.
      //
      // ⚠️ ProfileScreen does NOT have this problem, despite being a similar
      // ~56kB lazy chunk: its pane is always mounted (hidden via HIDDEN_STYLE
      // rather than unmounted), so React resolves it at ~190ms on every boot
      // whether or not anyone opens Profile. Warming it here is belt-and-
      // braces for boot paths where that pane is not rendered, and a no-op
      // otherwise — import() dedupes. It is NOT the fix; Online is.
      //
      // Placed after the question index and before the full bank: the index
      // renders the pickers, the bank is the heavy one, and a tab tap is far
      // likelier than a direct mode tap.
      const idleTabs = () => {
        try { import('./screens/ProfileScreen.jsx'); } catch { /* prefetch is best-effort */ }
        try { import('./screens/OnlineMultiplayer.jsx'); } catch { /* prefetch is best-effort */ }
      };
      // ⚠️ NOT ON A GAME DOOR, AND NOT ON A SLOW LINK. Measured 2026-09-04 on
      // /play?game=footle under PageSpeed's mobile profile (1.6 Mbps): the
      // game chunk landed at 3.4s, and behind it this block queued the
      // question index (51 KB gz), the Profile chunk (16) and the Online
      // chunk (17) — 84 KB the visitor cannot use before the board has even
      // painted, on the door where 1,045 first games a month arrive and 5%
      // finish. A door arrival is not "sitting on Home deciding what to tap";
      // the warm-ups wait until the first results screen or 20 seconds, and on
      // Save-Data / 2G-3G links they do not run at all.
      const bootDoor = (() => { try { const sp = new URLSearchParams(BOOT_SEARCH); return !!(sp.get("game") || sp.get("club") || sp.get("quiz") || sp.get("c")) || /^\/(footle|c)(\/|$)/.test(window.location.pathname); } catch { return false; } })();
      const slowLink = (() => { try { const c = navigator.connection; return !!(c && (c.saveData || /(^|-)(2g|3g)$/.test(c.effectiveType || ""))); } catch { return false; } })();
      const warm = () => {
        if (slowLink) return;
        if (typeof requestIdleCallback === 'function') {
          requestIdleCallback(idleIndex, { timeout: 3000 });
          requestIdleCallback(idleTabs, { timeout: 4000 });
          requestIdleCallback(() => setTimeout(() => requestIdleCallback(idleBank, { timeout: 8000 }), 4000), { timeout: 3000 });
        } else {
          setTimeout(idleIndex, 1200); setTimeout(idleTabs, 2500); setTimeout(idleBank, 6000);
        }
      };
      if (bootDoor) { setTimeout(warm, 20000); }
      else if (typeof requestIdleCallback === 'function') {
        warm();
      } else {
        setTimeout(idleIndex, 1200);
        setTimeout(idleTabs, 1800);
        setTimeout(idleBank, 5200);
      }
    }
    // Prune expired seen-question history (>14 days old) on mount
    try { loadSeenHistory(); } catch {}
    // First-run onboarding is decided synchronously by the useState
    // initializer (biq_onboarded); the cross-device sync effect below
    // reconciles against profile.onboarded_at once auth resolves. (An async
    // re-check here used to race that sync — replaying onboarding for
    // already-onboarded users on fresh browsers and on EVERY visit in
    // storage-blocked browsers — removed.)

    try {
      const raw = localStorage.getItem("biq_stats");
      if (raw !== null) setStats(JSON.parse(raw));
    } catch {}
    try {
      const raw = localStorage.getItem(todayKey);
      if (raw !== null) { const d = JSON.parse(raw); setDailyDone(true); setDailyScore(d.score); }
    } catch {}
    // Load full daily history — any biq_daily_YYYY-MM-DD entry
    try {
      const hist = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        const m = k && k.match(/^biq_daily_(\d{4}-\d{2}-\d{2})$/);
        if (!m) continue;
        try {
          const parsed = JSON.parse(localStorage.getItem(k));
          if (typeof parsed?.score === "number") hist[m[1]] = parsed.score;
        } catch {}
      }
      setDailyHistory(hist);
    } catch {}
    try {
      const raw = localStorage.getItem("biq_profile");
      if (raw !== null) setProfileState(JSON.parse(raw));
    } catch {}
    try {
      const raw = localStorage.getItem("biq_xp");
      if (raw !== null) setXp(parseInt(raw) || 0);
    } catch {}
    try {
      const raw = localStorage.getItem("biq_hotstreak_best");
      if (raw !== null) setHotstreakBest(parseInt(raw) || 0);
    } catch {}
    try {
      if (localStorage.getItem("biq_first_tip_shown") === null) setShowFirstQuizTip(true);
    } catch {}
    try {
      if (localStorage.getItem("biq_rate_shown") !== null) setRatePromptShown(true);
    } catch {}
    // Login streak handled by Phase G's tickLoginStreak useEffect — server
    // authoritative for signed-in users via tick_login_streak RPC, local
    // compute for guests. Removed from this mount-effect to eliminate the
    // hydrate-vs-mount-effect race (audit finding 2.1).
    // Load persisted settings.
    //
    // ⚠️ THIS EFFECT USED TO THROW AWAY THE DEFAULTS MERGE. The lazy initialiser
    // above carefully computes `{ ...defaults, ...stored }`; this then ran
    // setSettings(raw) and discarded it, so every key the stored blob happened
    // to lack reverted to undefined.
    //
    // That is not cosmetic in 1.7.0. `sound` defaults to true on native FOR THE
    // FIRST TIME this release, and playSound() reads localStorage DIRECTLY
    // (`JSON.parse(raw)?.sound === true`) rather than React state — so for every
    // existing player, whose stored blob predates the key, the new default
    // evaluated `undefined === true` and the app stayed silent. The default
    // would have shipped to new installs only.
    //
    // So: merge, and PERSIST the merge, because the reader is storage. Spreading
    // stored OVER defaults keeps every explicit choice — someone who turned
    // sound off stays off.
    try {
      const raw = localStorage.getItem("biq_settings");
      if (raw !== null) {
        const stored = JSON.parse(raw);
        if (stored && typeof stored === "object") {
          const merged = { ...SETTINGS_DEFAULTS(), ...stored };
          setSettings(merged);
          // Only write when the merge actually added something, so a normal
          // boot does no storage work.
          const missing = Object.keys(SETTINGS_DEFAULTS()).some((k) => !(k in stored));
          if (missing) safeSetItem("biq_settings", JSON.stringify(merged));
          if (merged.defaultDiff) setDiff(merged.defaultDiff === "med" ? "medium" : merged.defaultDiff);
        }
      }
    } catch {}
  }, []);

  // Sprint #26 X2: cross-device onboarding sync. Runs whenever authProfile
  // is (re-)loaded for the signed-in user. Two directions:
  //   - profile says onboarded, local doesn't → propagate to local (the
  //     cross-device case: completed on Device A, signing in on Device B)
  //   - local says onboarded, profile doesn't → write timestamp to profile
  //     (one-time migration for pre-X2 users)
  // Guests (no user.id) are unaffected — they stay local-only until they
  // create an account, at which point this effect fires.
  // Shared-device edge case (User A pre-X2 leaves local flag, User B signs
  // in): User B's profile gets marked from User A's local flag. This is a
  // PRE-EXISTING limitation of biq_onboarded being device-scoped, not
  // worsened by X2. Real fix is per-user-keyed local storage, out of scope.
  useEffect(() => {
    if (!authProfile || !user?.id) return;
    const localOnboarded = (() => {
      try { return localStorage.getItem("biq_onboarded") === "1"; } catch { return false; }
    })();
    const profileOnboarded = !!authProfile.onboarded_at;
    if (profileOnboarded && !localOnboarded) {
      setHasOnboarded(true);
      try { localStorage.setItem("biq_onboarded", "1"); } catch {}
    } else if (localOnboarded && !profileOnboarded) {
      supabase.from('profiles')
        .update({ onboarded_at: new Date().toISOString() })
        .eq('id', user.id)
        .then(({ error }) => {
          // Same write, second implementation — the migration path for a
          // player who onboarded locally before ever signing in. Both were
          // blind; fixing one would have left the other.
          if (error) {
            console.warn('[onboarding] onboarded_at migration failed', error.message || error);
            Sentry.captureException(error, { tags: { area: 'onboarding-flag', site: 'local-to-profile' } });
          }
        })
        .catch((e) => Sentry.captureException(e, { tags: { area: 'onboarding-flag', site: 'local-to-profile' } }));
    }
  }, [authProfile, user?.id]);

  // Tracks whether we've already toasted the user about a failed score
  // sync this session — we don't want to nag them after every game when
  // their connection is flaky.
  const scoreSyncToastShownRef = useRef(false);

  const saveStats = useCallback((newResult) => {
    const newStreak = newResult.bestStreak || 0;
    const isSpecialMode = mode === "hotstreak" || mode === "truefalse";
    // Weekly tracking — rotate if new week
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0,0,0,0);
    const currentWeekEpoch = weekStart.getTime();
    let gamesThisWeek = (stats.gamesThisWeek || 0) + 1;
    let gamesLastWeek = stats.gamesLastWeek || 0;
    if (stats.weekEpoch && stats.weekEpoch < currentWeekEpoch) {
      gamesLastWeek = stats.gamesThisWeek || 0;
      gamesThisWeek = 1;
    }
    // Per-category accuracy → powers the Ball IQ player-rating card (per-
    // competition ratings). allAnswers already carries { cat, isCorrect }.
    //
    // ⚠️ EXPONENTIAL DECAY, NOT A LIFETIME AVERAGE. The counters used to grow
    // forever, which made the rating a lifetime accuracy — and a lifetime
    // average has a property players read as a bug: once your early games set
    // an anchor, answering "correctly more often than not" still DRAGS THE
    // NUMBER DOWN whenever a session lands under your all-time mean. A real
    // player reported exactly that on 2026-09-01 ("it keeps going down the
    // more I play, even though I answer correctly more often than not") — and
    // he was right about the feel: the old model could never reward current
    // form, only punish it. Each answer now decays the history by 0.98, which
    // makes the effective window ~50 answers (≈34-answer half-life): recent
    // form moves the rating in BOTH directions, a hot streak visibly climbs,
    // and an ancient bad patch stops being a life sentence. The {c,a} shape is
    // unchanged (floats now) so the server jsonb, the hydrate merge and
    // computeCard all keep working; legacy integer counts simply start
    // decaying from here.
    // ⚠️ DIFFICULTY IS EVIDENCE STRENGTH. The bank labels every question
    // easy/medium/hard, and the rating used to ignore it — a hard-question
    // specialist and an easy-question farmer at the same accuracy got the
    // same card (Alex, 2026-09-01: "do the cards accumulate the right rating
    // when people answer correctly and wrongly on easy to hard questions?").
    // Each answer now moves the accuracy ratio with a weight equal to how
    // much it PROVES: a hard question answered correctly is strong evidence
    // you're good (1.3 pulls the ratio up hard); an easy one missed is
    // strong evidence you're not (1.15 pulls it down hard); a hard one
    // missed proves little (0.85); an easy one answered proves little (0.8).
    // A correct answer contributes (w, w) — full marks at that weight — so
    // the ratio stays in [0,1] and the 40–99 mapping is untouched. Bank mix
    // (25/48/27) keeps the average weight ≈1, so nobody's rating jumps on
    // upgrade; only the MARGINS change, in the direction players expect.
    const CAT_DECAY = 0.98;
    const DIFF_CREDIT = { easy: 0.8, medium: 1.0, hard: 1.3 };  // weight when correct
    const DIFF_MISS   = { easy: 1.15, medium: 1.0, hard: 0.85 }; // weight when wrong
    const catStats = { ...(stats.catStats || {}) };
    for (const ans of (newResult.allAnswers || [])) {
      if (!ans || !ans.cat) continue;
      const cur = catStats[ans.cat] || { c: 0, a: 0 };
      const w = ans.isCorrect
        ? (DIFF_CREDIT[ans.diff] || 1.0)
        : (DIFF_MISS[ans.diff] || 1.0);
      catStats[ans.cat] = {
        c: (cur.c || 0) * CAT_DECAY + (ans.isCorrect ? w : 0),
        a: (cur.a || 0) * CAT_DECAY + w,
      };
    }
    const updated = {
      // Preserve any stats keys not explicitly recomputed below — without this
      // spread, saveStats rebuilds from a hand-maintained allow-list and silently
      // drops bestSurvival + streak{7,30,100}Celebrated on every save (they're set
      // via setStats elsewhere but never persisted), causing lying "New Survival
      // record" toasts and duplicate streak-milestone confetti after reload.
      // (2026-07-12 medical, correctness-state, confirmed.)
      ...stats,
      gamesPlayed: stats.gamesPlayed + 1,
      gamesThisWeek,
      gamesLastWeek,
      weekEpoch: currentWeekEpoch,
      catStats,
      shieldsUsed: stats.shieldsUsed || 0,
      // Only count standard quiz scores toward bestScore (max 10)
      bestScore: isSpecialMode ? (stats.bestScore || 0) : Math.max(stats.bestScore || 0, newResult.score),
      bestStreak: Math.max(stats.bestStreak || 0, newStreak),
      totalCorrect: (stats.totalCorrect || 0) + newResult.score,
      // totalAnswered tracks the denominator for the Profile accuracy tile.
      // Older accounts pre-date this field and will see "—" on accuracy
      // until their next game tops it up.
      totalAnswered: (stats.totalAnswered || 0) + (newResult.total || 0),
      bestIQ: stats.bestIQ || null,
      bestHotStreak: mode === "hotstreak" ? Math.max(stats.bestHotStreak || 0, newResult.score) : (stats.bestHotStreak || 0),
      bestTrueFalse: mode === "truefalse" ? Math.max(stats.bestTrueFalse || 0, newResult.score) : (stats.bestTrueFalse || 0),
    };
    setStats(updated);
    safeSetItem("biq_stats", JSON.stringify(updated));

    // Save individual score to Supabase if user is logged in
    if (user?.id && newResult.score !== undefined) {
      saveScore(user?.id, {
        // Club and league quizzes run with mode="classic" (their launchers set
        // activeClub/activeLeague and setMode directly), so every one of them
        // used to land here labelled "classic" — indistinguishable from a real
        // Classic game, forever. Missing data is honest; mislabelled data looks
        // complete and quietly answers the wrong question. startMode clears both
        // and the launchers clear each other, so at most one is ever set.
        game_mode: activeClub ? `club:${activeClub}`
          : activeLeague ? `league:${activeLeague}`
          : (mode || 'classic'),
        score: newResult.score,
        correct_answers: newResult.score,
        total_questions: newResult.total || 10,
      });
    }

    // Sync aggregate stats to user profile if logged in.
    // total_score uses the increment_score RPC (atomic delta) so concurrent
    // game finishes don't clobber each other. games_played / correct_answers
    // are absolute snapshots — same goes for the `stats` jsonb of best-of
    // values. Cross-device max-merge for those happens at sign-in time via
    // useAuth.hydrateLocalFromRemote; per-game writes here just push the
    // current local snapshot.
    if (user?.id) {
      (async () => {
        let syncFailed = false;
        try {
          const scoreDelta = newResult.score || 0;
          if (scoreDelta > 0) {
            const { error: rpcErr } = await supabase.rpc('increment_score', {
              user_id: user.id,
              score_delta: scoreDelta,
            });
            if (rpcErr) {
              console.error("[score sync]", rpcErr?.message || "Unknown error");
              Sentry.captureException(rpcErr, { tags: { area: 'score-sync' } });
              syncFailed = true;
            }
          }
          const { error: updErr } = await supabase.from('profiles').update({
            games_played: updated.gamesPlayed,
            correct_answers: updated.totalCorrect,
            stats: {
              bestScore: updated.bestScore || 0,
              bestStreak: updated.bestStreak || 0,
              bestIQ: updated.bestIQ || 0,
              bestHotStreak: updated.bestHotStreak || 0,
              bestTrueFalse: updated.bestTrueFalse || 0,
              totalAnswered: updated.totalAnswered || 0,
              // Per-competition c/a counts that power the Ball IQ card. Previously
              // saved to localStorage only, so the card reset to a flat baseline on
              // every fresh install / new device (nothing to restore server-side).
              catStats: updated.catStats || {},
            },
          }).eq('id', user.id);
          if (updErr) {
            console.error("[profile sync]", updErr?.message || "Unknown error");
            Sentry.captureException(updErr, { tags: { area: 'profile-sync' } });
            syncFailed = true;
          }
        } catch (e) {
          console.error("[profile sync]", e?.message || "Unknown error");
          Sentry.captureException(e, { tags: { area: 'profile-sync' } });
          syncFailed = true;
        }
        // Surface a single quiet toast per session — flaky connections
        // shouldn't nag the user after every game.
        if (syncFailed && !scoreSyncToastShownRef.current) {
          scoreSyncToastShownRef.current = true;
          showToast("⚠️ Score didn't sync — check your connection");
        }
      })();
    }
  }, [mode, stats, user, showToast, activeClub, activeLeague]);

  const today = new Date().toLocaleDateString("en-GB", { weekday:"long", day:"numeric", month:"short" });

  const startMode = useCallback(async (m) => {
    try {
      haptic("soft");
      // Club/league quizzes bypass startMode entirely (their launchers set
      // activeClub/activeLeague + setMode directly). Any mode reaching this
      // function should clear both so a stale banner doesn't appear next quiz.
      setActiveClub(null);
      setActiveLeague(null);
      // Dismiss first-quiz tip when the user starts ANY game — the tip's job
      // is done the moment they play something (previously only Classic
      // dismissed it, so it lingered after Daily/Footle/Club starts).
      if (showFirstQuizTip) {
        setShowFirstQuizTip(false);
        safeSetItem("biq_first_tip_shown", "1");
      }

      // Online Multiplayer requires a real account — guests have no userId
      // to host or join rooms. Block before any state transition so the home
      // screen doesn't briefly flash and the OnlineEntry never mounts.
      if (m === "online" && (!user || isGuest)) {
        openAuthPrompt("online");
        return;
      }
      setMode(m);
      if (m === "online") { setScreen("online-stage1"); return; }
      if (m === "local") { setScreen("local-setup"); return; }
      if (m === "clubquiz") { setScreen("club-quiz"); return; }
      if (m === "leaguequiz") { setScreen("league-quiz"); return; }
      // Reset category for special modes that ignore it
      if (m === "daily" || m === "survival" || m === "legends" || m === "speed" || m === "hotstreak" || m === "truefalse" || m === "chaos") setCat("All");
      if (m === "daily" && dailyDone) {
        showToast(`📅 Already done today — ${dailyScore}/7, come back tomorrow`);
        return;
      }
      let qs = [];
      if (m === "daily") { qs = await getDailyQs(); setActiveDailyDate(new Date()); }
      else if (m === "survival") { qs = await getQs({ cat: "All", diff, n: 300, includeLegends: true }); }
      else if (m === "legends") { qs = await getQs({ cat: "Legends", diff, n: 10 }); }
      else if (m === "speed") { qs = await getQs({ cat: "All", diff: "medium", n: 5 }); }
      else if (m === "hotstreak") { qs = ((await getQs({ cat: "All", diff, n: 999 })) || []).filter(q => q.type !== "tf"); }
      else if (m === "truefalse") { qs = await getTrueFalseQs(); }
      else if (TOPICAL_PACK && m === TOPICAL_PACK.key) {
        // includeLegends:true is REQUIRED, not incidental. getQs strips
        // cat:"Legends" from every mode that does not opt in, and the
        // summer-2026 pack files its retirements (Milner, Cazorla, Immobile)
        // under Legends — without this the tile would silently drop them.
        // ⚠️ HARD ONLY, and this is the whole lesson of the mode's first day.
        // Alex played it and scored 7/10 — the three he missed were ALL hard,
        // and he cleared every easy and medium. His words: "one question was
        // who won the world cup just a month ago, come on."
        //
        // Difficulty labels are calibrated for the bank as a whole, where
        // "which country won the 2026 World Cup?" is an honest easy question.
        // Inside a pack about THIS SUMMER, served to someone who watched the
        // summer, it is a headline, not a test. The pack was re-cut so the
        // labels tell the truth for this audience (14 headline questions moved
        // to easy, 10 detail ones to hard, 5 telegraphed ones deleted), and
        // the tile now serves only the detail tier: exact fees, appearance
        // counts, who held the record before, which club took the sell-on.
        qs = await getQs({ tag: TOPICAL_PACK.tag, onlyDiff: "hard", n: 10, ramp: true, includeLegends: true, avoidConflicts: true });
        if (!qs || qs.length < 5) { showToast("Not enough questions available for this mode"); return; }
      }
      else if (m === "chaos") {
        // Chaos: quotes / moments / madness. Pull any QB row tagged chaos
        // (cat === "chaos" OR tag === "chaos"), ignore difficulty, shuffle 10.
        const { QB_CHAOS } = await loadQuestions();
        if (QB_CHAOS.length < 5) {
          showToast("Not enough questions available for this mode");
          return;
        }
        const fresh = applySeenFilter(QB_CHAOS, 10, qbHistKey);
        // Shuffle the options like every other MCQ draw does. Chaos was the
        // only mode serving them in bank order, so a repeat player met the
        // same layout twice.
        //
        // ⚠️ Two things deliberately NOT done here, both measured rather than
        // assumed. (1) No leak guard: the 59-row chaos pool contains ZERO
        // conflicting pairs, so pickAvoidingConflicts would be a pure no-op —
        // adding it would look like coverage and buy nothing. (2) This is not
        // a bias fix: the answer-index spread is {0:12, 1:23, 2:14, 3:10},
        // chi-square 6.7 against a critical 7.81 at p=0.05, i.e. B runs high
        // but not significantly. Consistency is the reason; the bias is not.
        qs = shuffle([...fresh]).slice(0, 10).map(q => {
          if (!Array.isArray(q.o)) return { ...q, _histKey: qbHistKey(q) };
          const idx = shuffle([0, 1, 2, 3].slice(0, q.o.length));
          return { ...q, o: idx.map(i => q.o[i]), a: idx.indexOf(q.a), _histKey: qbHistKey(q) };
        });
      }
      // Classic is the ARC (2026-09-06): the full easy→hard range so the ramp
      // has real hard questions at the end. `diff` here is a ceiling, and the
      // Settings default "medium" would have quietly removed every hard one.
      else { qs = await getQs({ cat, diff: "hard", n: 10, ramp: true }); }
      // Sanity check: filter out undefined/malformed questions (T/F uses `s`, others use `q`)
      qs = (qs || []).filter(item => item && typeof item === "object" && (item.q || item.s));
      if (qs.length === 0) {
        showToast("No questions found — try a different category or difficulty");
        return;
      }
      setQuestions(qs);
      setScreen("quiz");
    } catch (err) {
      console.error("[startMode]", err?.message || "Unknown error");
      showToast("⚠️ Couldn't start mode");
      // Sprint #77 SS6: forward to Sentry. This is the entry point for
      // every game mode — chunk-fetch failures on the lazy questions
      // bundle, malformed QB rows, getDailyQs throws, etc., all funnel
      // through here. Without this capture, launch-day "user couldn't
      // start a game" reports have no signal in Sentry. Mode tag lets
      // us filter by which entry failed.
      try {
        Sentry.captureException(err, { tags: { area: 'startMode', mode: m } });
      } catch {}
    }
  }, [user, isGuest, showFirstQuizTip, dailyDone, dailyScore, diff, cat, showToast]);

  // Launch a specific club's quiz directly (used by the picker AND the Home
  // personalised tile). Prefers our verified, hint-bearing QB questions, and
  // remembers the club as the user's favourite so Home shows a "your club" shortcut.
  const launchClubQuiz = useCallback(async (clubKey) => {
    try {
      const pack = CLUB_PACKS[clubKey];
      if (!pack) return;
      haptic("soft");
      let qs = null;
      const qbName = CLUB_PACK_TO_QB[clubKey];
      if (qbName) {
        try {
          const { QB } = await loadQuestions();
          // ⚠️ THE CLUB DRAW BYPASSES getQs, so the retired-tag filter there does
          // not reach it — 26 of the summer-2026 rows still carry a `club`.
          // The second implementation of the same rule, applied at the same time.
          const verified = QB.filter(q => q && q.club === qbName && q.type === "mcq" && Array.isArray(q.o)
            && (!q.tag || !RETIRED_TAGS.has(q.tag)));
          // Club quizzes are for die-hard fans — never serve "easy" (casual-obvious
          // or telegraphed). Fall back to the full pool only if a club is too thin
          // on medium+hard to fill 10 (none currently are; thinnest is ~16).
          // ⚠️ 16, NOT 10 — a pack needs HEADROOM above the ten it serves.
          // Measured 2026-08-23 with the full conflict map: Wrexham leaked in
          // 100% of sessions and Norwich in 32%, because drawing 10 from an
          // eligible pool of 11-12 leaves pickAvoidingConflicts nowhere to go
          // and its top-up path — deliberately preferring a leaked pair over a
          // seven-question "ten-question quiz" — fires almost every time.
          // Widening to the full pack takes both to 0.0%.
          //
          // This does mean 11 thin packs now include "easy" rows, against the
          // die-hard-fans rule above. That is the right trade: a leaked pair IS
          // a free point, so the rule was already being broken, just less
          // visibly. The packs affected are the thinnest we have and the ones
          // club_quiz_results shows nobody plays.
          const noEasy = verified.filter(q => q.diff !== "easy");
          const clubPool = noEasy.length >= 16 ? noEasy : verified;
          if (clubPool.length >= 10) {
            // ⚠️ TONE IS THE POINT, not just the disclosure. The first draft
            // apologised ("you've played most of these") which frames a thin
            // pack as our shortfall and the player's bad luck. The same fact
            // said as something they EARNED reads as a compliment and is
            // equally true — a fan who has exhausted their club's pack is
            // exactly the player we most want to keep.
            //
            // Deliberately promises nothing. "More coming soon" would be the
            // ambitious line, and expanding the packs IS the plan, but a
            // delivery promise in a toast rots the moment the plan slips and
            // there is no way to un-say it to the people who read it.
            //
            // ⚠️ SAY IT OUT LOUD WHEN THE PACK IS SPENT. applySeenFilter tops
            // up from the least-recently-seen and says nothing, so a fan on
            // their third Manchester United round (24 eligible against a round
            // of 10) silently meets questions they answered last week and
            // concludes the app is thin. It is thin — but "you have played
            // most of these" and "this app has no questions" are very
            // different reactions to the same fact, and only one of them is
            // true. Checked BEFORE the draw because applySeenFilter's return
            // value cannot tell you whether it had to top up.
            if (countFreshQuestions(clubPool, qbHistKey) < 10 && shouldWarnPackThin(clubKey)) {
              showToast(`You know the ${pack.name} pack inside out — a few of these will come round again`);
            }
            // Same 14-day seen filter League Quiz applies — without it a club
            // pool of ~20 serves immediate repeats while fresh rows sit unused.
            const freshPool = applySeenFilter(clubPool, 10, qbHistKey);
            // Drop the second half of any answer-leak pair (see
            // src/questionConflicts.js). Applied AFTER the shuffle so which of
            // the two survives varies per session, and after applySeenFilter so
            // the 14-day freshness rule still decides what is eligible at all.
            qs = pickAvoidingConflicts(shuffle([...freshPool]), 10, conflictsWith).map(q => {
              const idx = shuffle([0, 1, 2, 3].slice(0, q.o.length));
              return { ...q, o: idx.map(i => q.o[i]), a: idx.indexOf(q.a), cat: "ClubQuiz", type: "mcq", _histKey: qbHistKey(q) };
            });
          }
        } catch {}
      }
      if (!qs) qs = shuffle(pack.questions).slice(0, 10).map(q => ({ ...q, type: "mcq", cat: "ClubQuiz" }));
      if (!qs.length) { showToast("No questions yet for this club"); return; }
      setActiveLeague(null);
      setActiveClub(clubKey);
      setMode("classic");
      setQuestions(qs);
      setScreen("quiz");
    } catch (e) {
      showToast("⚠️ Couldn't start club quiz");
    }
  }, [showToast]);

  // Launch a single-competition quiz from the league picker. Questions keep
  // their real `cat` (unlike club quiz's cat:"ClubQuiz" re-tag), so each
  // answer feeds the matching competition rating on the Ball IQ card.
  const launchLeagueQuiz = useCallback(async (catKey) => {
    try {
      const lg = LEAGUE_QUIZ_BY_CAT[catKey];
      if (!lg) return;
      haptic("soft");
      const { QB } = await loadQuestions();
      // Retired packs withheld here too — the league draw bypasses getQs, and
      // the summer-2026 rows carry real cats (Transfers, WorldCup, Managers…).
      const pool = QB.filter(q => q && q.cat === catKey && q.type === "mcq" && Array.isArray(q.o)
        && (!q.tag || !RETIRED_TAGS.has(q.tag)));
      // League quizzes are for invested fans — never serve "easy". Fall back to
      // the full pool only if the no-easy pool can't fill 10 (none currently).
      const noEasy = pool.filter(q => q.diff !== "easy");
      const gradedPool = noEasy.length >= 10 ? noEasy : pool;
      if (gradedPool.length < 10) { showToast("No questions yet for this competition"); return; }
      const fresh = applySeenFilter(gradedPool, 10, qbHistKey);
      // ⚠️ The answer-leak guard was fitted to the CLUB draw only and left the
      // league draw on a plain shuffle — the same defect, shipped in the other
      // half. Measured over 3,000 simulated sessions per competition against
      // the pools this code actually serves (medium+hard, post-seen-filter):
      // Primeira leaked in 21.5% of sessions, Ligue1 9.5%, SuperLig 7.7%,
      // SerieA 2.2%. All four go to 0.0% here. The thin pools are the worst
      // hit, which is the opposite of intuition — 73 eligible Primeira rows
      // holding 15 leak pairs means a 10-question draw can hardly avoid one.
      // Applied AFTER the shuffle so which half of a pair survives varies per
      // session, and after applySeenFilter so freshness still decides
      // eligibility — same order as the club draw above.
      const qs = pickAvoidingConflicts(shuffle([...fresh]), 10, conflictsWith).map(q => {
        const idx = shuffle([0, 1, 2, 3].slice(0, q.o.length));
        return { ...q, o: idx.map(i => q.o[i]), a: idx.indexOf(q.a), _histKey: qbHistKey(q) };
      });
      setActiveClub(null);
      setActiveLeague(catKey);
      setMode("classic");
      setQuestions(qs);
      setScreen("quiz");
    } catch (e) {
      showToast("⚠️ Couldn't start league quiz");
    }
  }, [showToast]);

  // SEO deep-links: launch straight into the club/league quiz named in the
  // URL (?club=<slug> / ?quiz=<league-slug>). Fire-once; params are stripped
  // so refresh/share doesn't relaunch. If the visitor still has onboarding
  // ahead of them, the quiz screen is already staged underneath and appears
  // the moment onboarding completes.
  // Stump-a-mate: the bank row a /q?id=… link resolved to (screen "stump").
  const [stumpRow, setStumpRow] = useState(null);
  const seoLaunchRef = useRef(false);
  useEffect(() => {
    if (seoLaunchRef.current) return;
    seoLaunchRef.current = true;
    try {
      // Short share alias: balliq.app/footle → today's puzzle. Share texts use
      // this path because it linkifies reliably even scheme-less in WhatsApp /
      // iMessage (bare domains with query strings often don't). The ?game=footle
      // branch below stays — the /football-wordle/ landing CTA depends on it.
      // Case-insensitive: share cards emit lowercase /footle, but a manually
      // typed /FOOTLE or /Footle (or a platform that capitalises the URL) must
      // still deep-link straight into the puzzle rather than dumping to home.
      const aliasPath = (window.location.pathname || "").toLowerCase();
      if (aliasPath === "/footle" || aliasPath === "/footle/") {
        // Keep search + hash: /footle?utm_source=reddit must stay attributable
        // (the ?game= path below likewise strips only its own params).
        try { window.history.replaceState({}, "", "/play" + window.location.search + window.location.hash); } catch {}
        setScreen("wordle");
        return;
      }
      const sp = new URLSearchParams(window.location.search);
      const clubSlug = (sp.get("club") || "").toLowerCase();
      const quizSlug = (sp.get("quiz") || "").toLowerCase();
      const gameSlug = (sp.get("game") || "").toLowerCase(); // ?game=footle — /football-wordle/ CTA + directory listings
      const stumpId = (sp.get("stump") || "").trim().toLowerCase(); // ?stump=q_… — Stump-a-mate link (api/q.js)
      // ?tab=profile|online|daily|home — the website header's "Sign in" and
      // the doors into account and live rooms. Bare /play redirects to the
      // front door in a browser (main.jsx, 2026-09-05), so every way into the
      // shell from the site names what it is for.
      const tabSlug = (sp.get("tab") || "").toLowerCase();
      if (!clubSlug && !quizSlug && !gameSlug && !stumpId && !tabSlug) return;
      try {
        const u = new URL(window.location.href);
        u.searchParams.delete("club"); u.searchParams.delete("quiz"); u.searchParams.delete("game"); u.searchParams.delete("stump"); u.searchParams.delete("tab");
        window.history.replaceState({}, "", u.pathname + u.search + u.hash);
      } catch {}
      if (["home", "daily", "online", "profile"].includes(tabSlug)) { setScreen("home"); setTab(tabSlug); return; }
      if (gameSlug === "footle") { setScreen("wordle"); return; }
      // ?game=daily — the homepage Daily 7 door. startMode owns the
      // already-played-today case (shows the done state rather than a replay),
      // so this stays a one-liner on purpose.
      if (gameSlug === "daily") { startMode("daily"); return; }
      if (gameSlug === "trail") { setScreen("trail"); return; }
      // Front-door doors (2026-09-03): every card on the website homepage is a
      // link, so every mode needs a URL. startMode owns the mode's own rules
      // (difficulty sheet for classic, done-state for dailies).
      if (["classic", "survival", "hotstreak", "legends", "chaos", "clubquiz", "leaguequiz"].includes(gameSlug)) { startMode(gameSlug); return; }
      if (gameSlug === "stadiums") { setScreen("stadiums"); return; }
      if (gameSlug === "online") { setScreen("home"); setTab("online"); return; }
      // ?game=mystery — the /mystery redirect and the share link land here.
      // Guarded: links to this mode are already out in the world (the web
      // landing page, any shared result), and they must fall through to Home
      // rather than open a game whose search bar cannot find Ronaldo.
      if (gameSlug === "mystery") { if (MYSTERY_ENABLED) { setScreen("mystery"); return; } }
      if (stumpId && /^q_[a-z0-9]+$/.test(stumpId)) {
        // Async on purpose: the bank is lazy-loaded. The stump screen is
        // guest-friendly — recipients answer with zero login (same staging-
        // under-onboarding behavior as the club/league deep-links).
        loadQuestions().then(({ QB }) => {
          const row = QB.find((r) => r && r.id === stumpId && r.type === "mcq" && Array.isArray(r.o));
          if (row) { setStumpRow(row); setScreen("stump"); }
        }).catch(() => {});
        return;
      }
      const packKey = CLUB_SLUG_TO_PACK[clubSlug];
      const catKey = QUIZ_SLUG_TO_CAT[quizSlug];
      if (packKey) launchClubQuiz(packKey);
      else if (catKey) launchLeagueQuiz(catKey);
      // ⚠️ NO SILENT DEAD END. This if/else had no final branch, so a slug
      // missing from either map fell through to a bare Home screen — and the
      // boot code has ALREADY stripped ?club= from the URL by this point, so
      // the reader's intent is gone and there is no back button to recover it.
      // Ten club pages shipped that way. Wave O maps all ten, but the class is
      // structural: the maps live here and the pages are generated elsewhere,
      // so they can drift apart again the next time a page is added. Start a
      // general quiz rather than nothing, and say why.
      else if (clubSlug || quizSlug) {
        showToast("No dedicated pack for that one yet — here's a general quiz");
        startMode("classic");
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When a shared invite link is opened (?join=CODE), once auth resolves and
  // the user is signed in (not guest), route them to OnlineEntry with the
  // pending code. OnlineEntry's autoJoinCode prop triggers an auto-attempt
  // on mount (handleJoin runs, navigates straight to the lobby on success,
  // shows the OnlineEntry error inline on failure so the user can recover).
  // Fire-once via the ref so the effect can re-run for state changes without
  // re-navigating mid-game. Guests/unsigned users are caught by the prompt
  // rendered below — they sign in, AppInner remounts, and this effect routes.
  const autoJoinRoutedRef = useRef(false);
  useEffect(() => {
    if (!pendingJoinCode) { autoJoinRoutedRef.current = false; return; }
    if (!user || isGuest) return;
    if (autoJoinRoutedRef.current) return;
    autoJoinRoutedRef.current = true;
    startMode("online");
    // Audit Phase 5 (H2): user → user?.id. The effect only checks user
    // for truthiness; `!user` and `!user?.id` are equivalent for Supabase
    // auth (user is null OR has an id). Narrowing prevents re-fire on
    // unrelated auth context updates (token refresh, metadata change).
  }, [pendingJoinCode, user?.id, isGuest, startMode]);

  // LocalSetup gives us a fully-formed config — LocalGameScreen owns the rest
  // (questions, turns, scores, eliminations). No legacy state touched here.
  const startLocalGame = useCallback((config) => {
    setActiveClub(null);
    setActiveLeague(null);
    setLocalConfig(config);
    setLocalResult(null);
    setMode("local");
    setScreen("local-game");
  }, []);

  const handleLocalComplete = useCallback((result) => {
    setLocalResult(result);
    setScreen("local-results");
  }, []);

  // ─── 1.1 Local notifications (evening daily reminder) ──────────────────────
  const [notifEnabled, setNotifEnabled] = useState(() => {
    try { return localStorage.getItem('biq_notif_enabled') === '1'; } catch { return false; }
  });
  const [notifPromptOpen, setNotifPromptOpen] = useState(false);
  // ⚠️ ONE NUDGE, ONCE, AFTER A GAME — never a wall.
  //
  // Alex asked for a prompt to set a profile picture "the first time they open
  // the app". The measurement argued it later and he agreed: 36.2% of accounts
  // never play a single game, and the five-star blocker was a MANDATORY step in
  // exactly that gap (the username wall rejecting Apple/Google's own pre-filled
  // names). This fires on the results screen instead — they have just finished
  // something, and it costs no activation.
  //
  // Dismissed state is per ACCOUNT, not per device-forever: a player who
  // uploads a photo on another device should not be nagged here, and
  // avatarUrl already covers that because it comes from the profile.
  const [photoNudgeDismissed, setPhotoNudgeDismissed] = useState(() => {
    try { return localStorage.getItem('biq_photo_nudge') === '1'; } catch { return false; }
  });
  const dismissPhotoNudge = useCallback(() => {
    setPhotoNudgeDismissed(true);
    try { safeSetItem('biq_photo_nudge', '1'); } catch { /* quota */ }
  }, []);
  // First-session audit 2026-08-30 (#3): a guest banks XP, a rating and a
  // streak with zero mention any of it is device-local. That line was a card
  // above the Daily 7 panel; it is a row INSIDE the panel now (DailyDone
  // `save.line`, built in dailyDoneServices) — one place, no dismiss state.

  // ⚠️ role="dialog" without useModalA11y is half an accessibility fix, and the
  // repo's own a11y-structure test enforces the pair — it caught this sheet the
  // moment the role was added. The hook is what actually traps focus and wires
  // Escape; the attribute alone just tells a screen reader to expect behaviour
  // that is not there. Dismissal is counted the same as a backdrop tap: both
  // are "closed without deciding", and the ask is already spent either way.
  const notifSheetRef = useRef(null);
  useModalA11y({
    isOpen: notifPromptOpen,
    onClose: () => { loopEvent("notif-prompt-dismissed"); setNotifPromptOpen(false); },
    ref: notifSheetRef,
  });
  // Holds the deferred notification sheet so it can be cancelled if the player
  // leaves the result before it fires — a sheet that appears after they have
  // navigated away is worse than one that never appears.
  const notifTimerRef = useRef(null);
  useEffect(() => () => { if (notifTimerRef.current) clearTimeout(notifTimerRef.current); }, []);
  const [notifBlocked, setNotifBlocked] = useState(false);

  // Tapping a reminder deep-links to the Daily tab — the notification's whole
  // point is "play today's puzzles", so land the user on them.
  useEffect(() => {
    const off = onReminderTap(() => { setScreen("home"); setTab("daily"); });
    return off;
  }, []);

  // "Continue as guest" from the auth overlay routes here so it lands on Home
  // (the "just let me play" destination), not the screen the overlay was opened
  // from (e.g. Settings' sign-in row). The overlay is a sibling of AppInner in
  // AppGate, so it signals via a window event — same pattern as reminders/pushes.

  // ─── 1.3 Native push (APNs) ────────────────────────────────────────────────
  // Route a push tap: a play invite deep-links straight into the lobby with the
  // room code; anything else lands on the Online tab (where the inbox lives).
  // Set the router once, before registration, so a cold-launch-from-push works.
  useEffect(() => {
    onPushTap((data) => {
      if (data?.type === "play_invite" && data?.code) {
        setStage1RoomCode(String(data.code));
        setScreen("online-stage1-lobby");
      } else {
        setScreen("home"); setTab("online");
      }
    });
  }, []);

  // Register this device's APNs token once the user is signed in (native only;
  // no-ops on web). PASSIVE: never fires the one-shot iOS permission prompt at
  // sign-in — it only registers if permission was already granted (via the
  // notifications toggle / soft pre-prompt, which own the actual prompt).
  useEffect(() => {
    if (user?.id) registerPush(user.id, { requestPermission: false });
  }, [user?.id]);

  // Enable/disable the daily reminder. Enabling fires the OS permission prompt;
  // a denial leaves it off and points the user at iOS Settings.
  const handleToggleNotif = useCallback(async (on) => {
    if (on) {
      const granted = await requestNotifPermission();
      // ⚠️ "Said yes" and "was granted" are DIFFERENT numbers, and only the
      // second earns reach. iOS shows its permission sheet exactly once ever,
      // so a denial here is permanent for that install — which makes the gap
      // between notif-prompt-yes and notif-permission-granted the single most
      // expensive drop in the retention funnel. Measured 2026-08-22: 35 of 209
      // accounts reachable (16.7%), 28 of 93 active players (30%), with no
      // instrumentation anywhere to say why.
      loopEvent(granted ? "notif-permission-granted" : "notif-permission-denied");
      if (!granted) {
        setNotifEnabled(false);
        try { localStorage.removeItem('biq_notif_enabled'); } catch {}
        showToast('Turn on notifications for Ball IQ in iOS Settings to get reminders');
        return;
      }
      try { localStorage.setItem('biq_notif_enabled', '1'); localStorage.removeItem('biq_notif_disabled'); } catch {}
      setNotifEnabled(true);
      // Permission just granted (local + remote share one iOS grant) — register
      // for APNs push too, so the passive sign-in path picks up a token here on.
      if (user?.id) registerPush(user.id, { requestPermission: true });
      const ws = readWordleTodayStatus();
      const playedToday = dailyDone || ws.kind === 'won' || ws.kind === 'lost';
      scheduleReminderWindow({ skipToday: playedToday, streak: loginStreak });
      showToast('Daily reminders on 🔔');
    } else {
      // Explicit opt-out. The 'disabled' marker distinguishes "user turned it
      // off" from "flag never set / evicted" so the reconcile self-heal below
      // won't silently re-enable someone who deliberately said no.
      try { localStorage.removeItem('biq_notif_enabled'); localStorage.setItem('biq_notif_disabled', '1'); } catch {}
      setNotifEnabled(false);
      cancelAllReminders();
      showToast('Daily reminders off');
    }
  }, [dailyDone, showToast, user?.id, loginStreak]);

  // Results-screen "Remind me tomorrow" (2026-08-29): one state string keeps
  // TomorrowTeaser dumb. Native = local notifications (work signed-out);
  // web = push subscription (persists by account, so guests don't see it).
  const resultsRemindState = notificationsSupported()
    ? (notifEnabled ? 'on' : (notifBlocked ? 'blocked' : 'off'))
    : (webPushSupported() && user?.id ? (webPushOn ? 'on' : (webPushPermission() === 'denied' ? 'blocked' : 'off')) : 'unsupported');
  const remindFromResults = useCallback(async () => {
    loopEvent('results-remind-tap', { engine: notificationsSupported() ? 'native' : 'web' });
    if (notificationsSupported()) await handleToggleNotif(true);
    else await handleToggleWebPush(true);
  }, [handleToggleNotif, handleToggleWebPush]);

  // ONE return-loop panel under every decided daily (components/DailyDone.jsx).
  // Everything the panel needs from this file rides in this object: the
  // reminder state + handler, the app's one streak, "still open today" with
  // real navigation, the guest save action, and the analytics sink. Memoised so
  // the React.memo'd game screens don't re-render on every App state change.
  const dailyDoneServices = useMemo(() => {
    const nextUp = [];
    try {
      const ws = readWordleTodayStatus();
      if (ws.kind === "ready" || ws.kind === "in-progress") {
        nextUp.push({ key: "footle", name: ws.kind === "in-progress" ? "Continue today's Footle" : "Today's Footle",
          icon: <span className="fh-tile fh-tile-green" style={{ "--fh-tile": "22px", borderRadius: 6 }} aria-hidden="true">F</span>,
          onTap: () => setScreen("wordle") });
      }
    } catch {}
    if (!dailyDone) nextUp.push({ key: "daily7", name: "Today's Daily 7", icon: <ClipboardList size={18} strokeWidth={2.2} />, onTap: () => startMode("daily") });
    try {
      if (getTrailAnswer() && !["won", "lost"].includes(loadTrailDay()?.status)) {
        nextUp.push({ key: "trail", name: "Today's Transfer Trail", icon: <Route size={18} strokeWidth={2.2} />, onTap: () => setScreen("trail") });
      }
    } catch {}
    try {
      if (MYSTERY_ENABLED) {
        const m = JSON.parse(localStorage.getItem(`biq_mystery_${dateToYMD(new Date())}`) || "null");
        if (!(m && (m.won || m.gaveUp))) nextUp.push({ key: "mystery", name: "Today's Mystery Player", icon: <UserRoundSearch size={18} strokeWidth={2.2} />, onTap: () => setScreen("mystery") });
      }
    } catch {}
    return {
      remind: { state: resultsRemindState, onRemind: remindFromResults },
      // "daily streak" — the cross-mode one; the islands pass the per-game label.
      streak: { count: loginStreak || 0, label: "daily streak" },
      // The guest save line used to be its own card above this panel (Alex,
      // 2026-09-06: "does this look good?" — no). It is a row of the panel now:
      // what lives on this phone only, and the one tap that makes it follow them.
      save: (!user || isGuest) ? {
        onSave: () => { loopEvent("dd-save-tap"); openAuthPrompt?.("save"); },
        line: ((stats?.gamesPlayed || 0) >= 2 || xp > 0) ? `${getLevelInfo(xp).level.name} · ${xp} XP` : null,
      } : null,
      nextUp,
      track: (n, m) => loopEvent(n, m),
    };
    // `screen` is a deliberate dep: the open/closed set changes when a game ends.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultsRemindState, remindFromResults, loginStreak, user, isGuest, dailyDone, startMode, screen, stats?.gamesPlayed, xp]);
  const footleServices = useMemo(() => ({ ...FOOTLE_SERVICES, dailyDone: dailyDoneServices }), [dailyDoneServices]);
  const dailyScreenServices = useMemo(() => ({ ...DAILY_SERVICES, dailyDone: dailyDoneServices }), [dailyDoneServices]);

  // Soft pre-prompt: ask in-app BEFORE spending the one-shot iOS prompt. Caps at
  // 2 lifetime asks (after the first daily, then again at a 3-day streak if the
  // user declined). Only shows while the OS permission is still undecided.
  //
  // Returns true when it actually opened the sheet. Callers need that: the
  // Footle-solve path also wants to ask for an App Store rating, and on a fresh
  // install both fired at once — the iOS rating card rendered ON TOP of this
  // one. Two modals stacked on the first puzzle a person ever finished, with
  // the notification opt-in buried behind the one they'd reflexively dismiss.
  const maybePromptNotif = useCallback(async () => {
    // Min-gap between soft-prompt asks (first-session audit 2026-08-30: the
    // sheet fired twice within ~3 minutes of one session — the second time
    // over a LOSS screen, minutes after being declined). The 2-lifetime-ask
    // cap bounds the total; this bounds the RATE. Shared by both platform
    // paths below.
    try {
      const lastAsk = parseInt(localStorage.getItem('biq_notif_last_ask') || '0', 10);
      if (lastAsk && Date.now() - lastAsk < 24 * 3600 * 1000) {
        loopEvent('notif-prompt-skipped', { reason: 'asked-recently', engine: notificationsSupported() ? 'native' : 'web' });
        return false;
      }
    } catch {}
    // WEB PATH (scouting report, retention 5/C): the delivery engine — sw.js
    // push handlers, the send-web-push edge function, an hourly pg_cron — has
    // been live in prod with ZERO subscribers, because the only surface that
    // ever asked was a Settings toggle nobody visits. The same sheet at the
    // same post-solve moment now asks on the web too; "Yes, remind me" runs
    // enableWebPush() instead of the native toggle.
    //   · signed-in only: persist() upserts by user id, so a guest's subscribe
    //     cannot stick — and the guest already owns this moment via the
    //     save-your-progress nudge, which is worth more while retention is
    //     the binding constraint.
    //   · permission==='default' only: never re-ask a browser that decided.
    //   · same biq_notif_asks cap — localStorage is per-context, so the two
    //     platforms cannot burn each other's two asks.
    if (!notificationsSupported()) {
      try {
        // ⚠️ WHY THE BAIL REASON IS RECORDED. web_push_subscriptions holds ONE
        // row and notif-prompt-shown has never fired, and until now that told
        // us nothing: five different gates return false here and they mean
        // completely different things. "Nobody is signed in" is a product
        // problem, "the browser already denied" is not a problem at all, and
        // "no VAPID key in this build" is a config problem — the same silence
        // for all three.
        //
        // That ambiguity already cost a wrong diagnosis today: .env.local has
        // no VITE_VAPID_PUBLIC_KEY, which reads as "web push is structurally
        // impossible" — until you check the LIVE bundle, where Vercel's copy
        // of the key is present and it works fine. One event name would have
        // settled it in seconds.
        //
        // Cheap and bounded: one row per bail, only at the two moments the
        // prompt is considered at all, and only on web.
        const bail = (reason) => { loopEvent("notif-prompt-skipped", { reason, engine: "web" }); return false; };
        if (!webPushSupported()) return bail("unsupported");
        if (!user?.id) return bail("guest");
        if (webPushOn) return bail("already-on");
        if (webPushPermission() !== 'default') return bail(`perm-${webPushPermission()}`);
        const asks = parseInt(localStorage.getItem('biq_notif_asks_v2') || '0', 10);
        if (asks >= 2) return bail("asks-exhausted");
        // Same rule as the native path — see the note there. Bails are already
        // instrumented, so this one is measurable rather than invisible.
        let webPlays = 0;
        try { webPlays = JSON.parse(localStorage.getItem('biq_stats') || '{}')?.gamesPlayed || 0; } catch {}
        if (webPlays < 2) return bail("too-early");
        if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
        // Spend the ask WHEN THE SHEET OPENS, not at schedule time. A player
        // who closes the tab inside the 7s hold used to burn one of their two
        // lifetime asks on a sheet they never saw — prod showed a visitor at
        // asks-exhausted with notif-prompt-shown fired twice ever.
        // (2026-09-06) The bottom sheet is retired: the results panel (DailyDone)
        // carries "Remind me" and asks for permission on THAT tap. The bails above
        // stay measured; nothing opens here any more.
        return false;
      } catch { return false; }
    }
    const nBail = (reason) => { loopEvent("notif-prompt-skipped", { reason, engine: "native" }); return false; };
    try {
      if (localStorage.getItem('biq_notif_enabled') === '1') return nBail("already-enabled");
      const asks = parseInt(localStorage.getItem('biq_notif_asks_v2') || '0', 10);
      if (asks >= 2) return nBail("asked-twice");
      // ⚠️ NEVER ON A PLAYER'S FIRST RESULT SCREEN.
      // The 7s hold below fixed the sheet COVERING the payoff. It did not fix
      // asking too early: on a clean install the very first thing a new player
      // finishes is also the first time they are asked to accept daily
      // notifications — before the app has shown them anything worth being
      // reminded about. That is the ask most likely to be refused, and iOS
      // gives you exactly one native permission prompt, so a "no" here is
      // permanent. `biq_notif_asks` caps us at 2 tries; this makes sure
      // neither of them is spent on the worst possible moment.
      // Read from the same persisted stats the rest of the app uses, so the
      // gate survives a reload and cannot be reset by remounting.
      let playsSoFar = 0;
      try { playsSoFar = JSON.parse(localStorage.getItem('biq_stats') || '{}')?.gamesPlayed || 0; } catch {}
      if (playsSoFar < 2) return nBail("too-early");

      const perm = await getNotifPermission();
      if (perm !== 'prompt' && perm !== 'prompt-with-rationale') return nBail(`perm-${perm}`);
      // ⏱ HOLD THE SHEET UNTIL THE PAYOFF HAS LANDED.
      // The moment is right — solving is the app's happiest second, and that
      // call stands. The problem was that the sheet opened on the SAME frame
      // as the reveal, so it covered the thing the player had just earned:
      // Footle's "The answer was Sergio Busquets" and the Trail's whole career
      // plus "It was Christian Eriksen". Both times it also buried Share,
      // which is the one action we most want at that moment.
      // Caught while taking store screenshots — the sheet had to be dismissed
      // to photograph either result.
      // The decision stays synchronous (the rating path reads the return value
      // to avoid stacking two modals); only the OPENING is deferred.
      if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
      // 7s, not 3s. Measured on a clean install: the reveal animation alone runs
      // ~1.5s, so a 3s delay showed the answer and then covered Share before
      // anyone could reach it — a glance, not a window. Sharing is the action
      // we most want here, so it gets the beat. The ask still lands on the
      // result screen, which is the moment Alex called correctly.
      // Ask spent at open time, same reason as the web path above.
      // (2026-09-06) The bottom sheet is retired: the results panel (DailyDone)
      // carries "Remind me" and asks for permission on THAT tap. The bails above
      // stay measured; nothing opens here any more.
      return false;
    } catch { return false; }
  }, [user?.id, webPushOn]);

  // (Re)schedule the rolling window on open + whenever today's play state
  // changes (finishing Daily 7 flips dailyDone → reschedule with skipToday).
  useEffect(() => {
    if (!notifEnabled) return;
    const ws = readWordleTodayStatus();
    const playedToday = dailyDone || ws.kind === 'won' || ws.kind === 'lost';
    scheduleReminderWindow({ skipToday: playedToday, streak: loginStreak });
  }, [notifEnabled, dailyDone, loginStreak]);

  // Shared XP award: local level math + persist + level-up celebration +
  // atomic remote delta for signed-in users. Extracted from handleComplete so
  // Footle (via the biq:daily-completed event) feeds the same economy
  // (opportunity-scan #3). MUST be declared ABOVE the daily-completed effect
  // below — its dep array reads this const during render (TDZ crash caught by
  // the e2e verify on first build).
  /**
   * A finished game counts as a game played — in EVERY mode.
   *
   * ⚠️ EIGHT REAL ACCOUNTS SHOW "0 GAMES" WHILE HOLDING 20+ SOLVED PUZZLES.
   * `profiles.games_played` / `correct_answers` were written ONLY by the quiz
   * completion path; Footle, Trail, Mystery and Stadiums wrote a `scores` row
   * and XP and nothing else. Three visible harms, all measured in prod:
   *   · ProfileScreen hides the ENTIRE stat grid when games/correct/best are
   *     all zero, so a friend viewing a 20-Footle player saw a level badge and
   *     blank space.
   *   · The friends mini-leaderboard sorts on total_score, so they sit last
   *     forever.
   *   · The notification ask is gated on biq_stats.gamesPlayed — incremented
   *     in exactly one place, inside the quiz path — so a daily-only player
   *     could never be offered daily reminders. That gate is mine, added
   *     today; it inherited a counter that does not count them.
   *
   * ⚠️ DELIBERATELY DOES NOT TOUCH total_score. For the dailies `score` means
   * ATTEMPTS USED — a Footle solved in 2 scores 2, solved in 6 scores 6 — so
   * it is a lower-is-better number. total_score is higher-is-better and drives
   * the leaderboard. Adding one to the other would rank the worst players top.
   * Making dailies contribute to the leaderboard needs a scoring decision
   * (XP is already the app's cross-mode progression number and dailies do feed
   * it); it is not something to infer inside a bug fix.
   *
   * Also deliberately untouched: bestScore (quiz-specific, capped at 10),
   * catStats (dailies carry no `cat`, and inventing one orphans history), and
   * the weekly counters.
   */
  // ⚠️ 2026-09-04, the same bug one mode further on: six accounts whose only
  // rows in `scores` are mp:race / mp:survival still read games_played = 0,
  // the most recent having played on 1 September. Online was wired into XP
  // and into `scores` in August and into this counter never — so a player
  // whose whole experience of Ball IQ is rooms with friends sees "0 games" on
  // their own profile, and those are exactly the invited players the room
  // funnel converts. Hence the rename: this is recordPlay, not
  // recordDailyPlay, and `wasCorrect` may be null for a mode that has no
  // per-player correct count (MP does not), which adds a game and no answers.
  const recordPlay = useCallback((wasCorrect) => {
    // Base the increment on the PERSISTED snapshot, not on `stats`. Two
    // reasons, both of which have bitten this file before:
    //   · a setStats updater runs at render time, so anything computed inside
    //     it is not readable on the next line — the Supabase push below would
    //     have silently skipped every time;
    //   · these handlers are registered once per effect run and close over
    //     whatever `stats` was then, so reading state here goes stale.
    // localStorage is the authority: every setStats in this file persists the
    // whole object synchronously alongside it, so the two never diverge.
    let base = {};
    try { base = JSON.parse(localStorage.getItem("biq_stats") || "{}") || {}; } catch {}
    const gamesPlayed = (base.gamesPlayed || 0) + 1;
    const totalCorrect = (base.totalCorrect || 0) + (wasCorrect ? 1 : 0);
    safeSetItem("biq_stats", JSON.stringify({ ...base, gamesPlayed, totalCorrect }));
    setStats((prev) => ({ ...prev, gamesPlayed, totalCorrect }));
    if (!user?.id) return;
    (async () => {
      try {
        // ⚠️ A query builder RESOLVES on error — destructure, never bare-await.
        const { error } = await supabase.from('profiles').update({
          games_played: gamesPlayed,
          correct_answers: totalCorrect,
        }).eq('id', user.id);
        if (error) console.warn("[daily stats]", error.message || "Unknown error");
      } catch (e) {
        console.warn("[daily stats]", e?.message || "Unknown error");
      }
    })();
  }, [user?.id]);

  // first-game-finished — the other half of `first-game-started`, and the
  // number the activation work has been flying blind without.
  //
  // Measured in prod 2026-08-26: 57 visitors fired `first-game-started` and
  // 34 of them (59.6%) never fired another event, median footprint 1.3 events
  // over TEN SECONDS. Whether any of that is "started and finished" or
  // "started and bounced" was unanswerable, because no finish event existed.
  //
  // `acct-first-finish` does exist and is NOT this: it is account-scoped and
  // has fired exactly ONCE, because first games are overwhelmingly played
  // before or during sign-up when there is no user id to attribute to — the
  // same reason 907 of 908 `first-game-started` rows carry a NULL user_id.
  // Keep both; they answer different questions.
  //
  // ⚠️ Fires from BOTH completion families — handleComplete (the quiz
  // engines) and the `biq:daily-completed` event (Footle, Trail, Mystery,
  // Stadiums). Wiring only the first would report that nobody ever finishes
  // Footle, which is the most-played mode in the product and writes 381 rows.
  //
  // Declared HERE deliberately: above the biq:daily-completed effect and above
  // handleComplete, both of which name it. A callback placed below a hook that
  // references it is a temporal dead zone error that ESLint, the production
  // build and all 426 tests pass — that exact mistake took the app down on
  // 2026-08-25.
  const markFirstGameFinished = useCallback((meta) => {
    try {
      if (localStorage.getItem("biq_first_game_finished")) return;
      localStorage.setItem("biq_first_game_finished", "1");
      loopEvent("first-game-finished", meta);
    } catch { /* never block a results screen in order to measure it */ }
  }, []);

  const awardXp = useCallback((earned) => {
    if (!earned || earned <= 0) return;
    setXp(prev => {
      const oldInfo = getLevelInfo(prev);
      const newXp = prev + earned;
      const newInfo = getLevelInfo(newXp);
      safeSetItem("biq_xp", String(newXp));
      const leveledUp = newInfo.level.name !== oldInfo.level.name;
      // XP toast intentionally not fired here — every result screen
      // already shows a static "+N XP earned" footer, so the floating
      // toast was duplicating the same indicator. Level-ups still get
      // the full-screen levelUpOverlay below for celebration.
      if (leveledUp) {
        if (levelUpTimerRef.current) clearTimeout(levelUpTimerRef.current);
        levelUpTimerRef.current = setTimeout(() => {
          setLevelUpOverlay({ name: newInfo.level.name, Icon: newInfo.level.Icon }); haptic("levelup"); playSound("levelup");
          levelUpTimerRef.current = setTimeout(() => setLevelUpOverlay(null), TIMINGS.STREAK_TOAST);
        }, 400);
      }
      return newXp;
    });
    // Atomic delta-add to remote xp via RPC. Mirrors increment_score so
    // concurrent game finishes across devices compose correctly. No-op for
    // guests / signed-out — xp stays local-only.
    if (user?.id) {
      supabase.rpc('increment_xp', { user_id: user.id, xp_delta: earned })
        .then(({ error }) => {
          if (error) {
            console.error("[xp sync]", error?.message || "Unknown error");
            Sentry.captureException(error, { tags: { area: 'xp-sync' } });
          }
        });
    }
  }, [user?.id]);

  // A completed daily (Daily 7 or Footle) cancels tonight's reminder and is the
  // trigger for the first soft pre-prompt.
  //
  // The pre-prompt used to be gated on detail.positive — a lost Footle is the
  // only thing that ever sets positive:false, so losers never got asked. This
  // is a soft in-app ask, not the OS dialog, and maybePromptNotif still caps
  // itself at 2 lifetime asks and no-ops once permission is decided.
  useEffect(() => {
    const onDailyDone = (e) => {
      cancelTodayReminder();
      // Every daily mode dispatches this event, so one call covers Footle,
      // Trail, Mystery and Stadiums — the modes handleComplete never sees.
      // Daily 7 reaches BOTH paths; the localStorage guard inside makes the
      // second call a no-op, which is exactly why the guard lives in the
      // helper rather than at each call site.
      markFirstGameFinished({ mode: e?.detail?.game || 'daily', won: e?.detail?.won });
      // ⭐ THE STREAK TICKS HERE, and only here. Every daily mode dispatches
      // this event — Footle, Daily 7, Trail, Mystery — so one call covers all
      // four and adding a fifth mode inherits it for free.
      //
      // Deliberately fires on ANY completion, win or loss. Wordle's rule is
      // that a loss breaks the streak, and NYT lost 5.6 million streaks in a
      // single day to one hard word; for a football bank of uneven difficulty
      // that is a punishment we cannot administer fairly. Turning up and
      // finishing is the habit we want to reward.
      //
      // The RPC is idempotent per local day (lastDay === today → ticked:false),
      // so solving all four modes ticks once and shows one toast.
      tickLoginStreak();
      // The daily_complete chord + heavy haptic used to be Daily 7's private
      // reward (it fires them in handleComplete, whose dispatch above carries
      // no `game` field — hence the named-game gate, which also keeps this
      // from double-firing for the Daily 7). A won Footle/Trail/Mystery is the
      // same "day sealed" moment and deserves the same note. The 600ms delay
      // lets each mode's own instant feedback land first — Footle's correct
      // sound, Trail/Mystery's hardCorrect pulse — then the chord arrives as
      // the closing beat instead of clashing with them.
      const dailyGame = e?.detail?.game;
      if ((dailyGame === 'footle' || dailyGame === 'trail' || dailyGame === 'mystery') && e.detail.won === true) {
        celebrationTimeoutsRef.current.push(setTimeout(() => { haptic('heavy'); playSound('daily_complete'); }, 600));
      }
      // ⭐ The 5-star ask, re-homed here from inside the Footle screen.
      //
      // Alex, 2026-07-29: solving Footle IS the right moment to ask — it is the
      // app's happiest second. The bug was never the moment, it was the
      // collision: on a fresh install the iOS rating card rendered on top of our
      // notification sheet, so a first-time player got two modals at once and
      // the notification opt-in was the one that lost.
      //
      // Two conditions now, and only two:
      //   - the notification sheet did NOT just open (never stack)
      //   - they solved a Footle on an earlier day, so they have a basis for an
      //     opinion. Rating an app on the first puzzle you have ever played is
      //     how you collect three-star "seems fine?" ratings.
      // Everything past that is Apple's to decide — see lib/review.js.
      // Never prompt over a LOSS (Trail/Mystery dispatch positive:false).
      // The event has carried the flag all along; the ask now honors it.
      const askedNotif = e?.detail?.positive === false ? false : maybePromptNotif();
      if (e?.detail?.game === 'footle' && e.detail.won === true) {
        Promise.resolve(askedNotif).then((notifOpened) => {
          if (notifOpened) return;
          if (countPriorFootleSolves() < 1) return;
          if (IS_NATIVE) {
            celebrationTimeoutsRef.current.push(setTimeout(() => {
              if (!ratingAskAllowed()) { loopEvent("rate-prompt-skipped", { reason: "screen-changed", engine: "native", trigger: "footle" }); return; }
              // ⚠️ ASK THE POLICY BEFORE CLAIMING WE SHOWED ANYTHING. maybeRequestReview
              // returns false in silence on a bad moment / cooldown / lifetime cap, so
              // logging "shown" first counted every suppressed ask as a real one — and
              // the suppression levers added all week are exactly what would inflate it.
              const blocked = nativeAskBlockedReason();
              if (blocked) { loopEvent("rate-prompt-skipped", { reason: blocked, engine: "native", trigger: "footle" }); return; }
              loopEvent("rate-prompt-shown", { engine: "native", trigger: "footle" });
              maybeRequestReview();
            }, 3500));
          } else if (webRatePromptEligible() && !ratePromptShown) {
            // Web parity for Alex's chosen moment (2026-07-29: "solving
            // Footle IS the right moment to ask"). Web players are most of
            // the base and previously only ever got asked after a 9/10
            // Classic — a moment most never reached. Same collision guard
            // (the notification sheet did not just open), same prior-solve
            // basis, and the web sheet's unhappy path still deflects to
            // feedback before any store link.
            // ⚠️ THE BUDGET IS SPENT WHERE THE SHEET RENDERS, NOT WHERE IT IS
            // SCHEDULED. markWebRatePromptShown() used to run here, 3.5s before
            // anything appeared — a reviewer reproduced the loss by solving
            // Footle and reloading at 1s: biq_rate_web_count went to 1 with no
            // sheet ever shown. The web budget is THREE asks in a LIFETIME, 60
            // days apart, so each silent burn costs a third of it. My own
            // ratingAskAllowed() gate made it worse by adding a second path
            // that returns without rendering.
            setRatePromptShown(true);
            celebrationTimeoutsRef.current.push(setTimeout(() => {
              if (!ratingAskAllowed()) { loopEvent("rate-prompt-skipped", { reason: "screen-changed", trigger: "footle" }); return; }
              markWebRatePromptShown();
              loopEvent("rate-prompt-shown", { engine: "web", trigger: "footle" });
              setRateView("ask"); setShowRatePrompt(true);
            }, 3500));
          }
        });
      }
      // Footle XP (scan #3). ONLY for game:'footle' — the Daily 7 also fires
      // this event and already earns XP via handleComplete; awarding here for
      // it too would double-pay. Footle's dispatch happens exactly once per
      // day (the won/lost transition), so no dedup guard is needed.
      if (e?.detail?.game === 'footle') {
        awardXp(getFootleXP(e.detail.won === true, e.detail.guesses));
        recordPlay(e.detail.won === true);
        // Footle wrote NOTHING to `scores` until now — its only trace was the
        // wordle_state jsonb. So the most-played mode, the one that owns every
        // long streak, was invisible in the only table anyone would query, and
        // "what do people actually play?" had no answer. Same dispatch that
        // pays XP: fires once per day by construction, so no dedup guard.
        // score/total are guesses-used out of 6 — a loss is 6/6, matching the
        // shape of every other row (correct out of attempted).
        if (user?.id) {
          const used = Math.min(e.detail.guesses || 6, 6);
          saveScore(user?.id, {
            game_mode: 'footle',
            score: e.detail.won === true ? used : 0,
            correct_answers: e.detail.won === true ? 1 : 0,
            total_questions: 1,
          });
        }
      }
      // Transfer Trail — same three loops Footle gets. Wired on launch day
      // (2026-07-29) rather than months later, which is the mistake above.
      // A Trail day is one puzzle in <=5 attempts, so score/total mirror
      // Footle's shape: attempts used out of the max, 1 "question" attempted.
      if (e?.detail?.game === 'trail') {
        awardXp(e.detail.won === true ? 40 : 10);
        recordPlay(e.detail.won === true);
        if (user?.id) {
          const used = Math.min(e.detail.attempts || 5, 5);
          saveScore(user?.id, {
            game_mode: 'trail',
            score: e.detail.won === true ? used : 0,
            correct_answers: e.detail.won === true ? 1 : 0,
            total_questions: 1,
          });
        }
      }
      // Mystery Player. The reward scales with how few guesses it took rather
      // than being flat: solving in 3 is a different achievement from solving
      // in 40, and a flat award would say otherwise.
      //
      // ⚠️ 2026-08-17: this used to note "no lose state, so only a win fires".
      // That was true and it cost us two things — every mystery scores row
      // meant SOLVED, so we had no measure of how many people played and
      // stopped; and it made Mystery the only daily mode where not solving
      // broke the streak, against A0's rule that any completion counts. The
      // mode now has a give-up, so BOTH outcomes arrive here.
      // A give-up earns no XP — it is a completion, not an achievement — but it
      // does write its row and does tick the streak, exactly like a lost Footle.
      if (e?.detail?.game === 'mystery') {
        const tries = Math.max(1, e.detail.attempts || 1);
        const mysteryWon = e.detail.won === true;
        if (mysteryWon) awardXp(tries <= 5 ? 50 : tries <= 15 ? 35 : 20);
        recordPlay(mysteryWon);
        if (user?.id) {
          saveScore(user?.id, {
            game_mode: 'mystery',
            score: mysteryWon ? tries : 0,
            correct_answers: mysteryWon ? 1 : 0,
            total_questions: 1,
          });
        }
      }
    };
    // Stadiums completion: XP scaled by hints (a no-hint clean sweep is a
    // real feat; a letter-by-letter crawl still finished the job), plus a
    // scores row so the mode shows up in the what-do-people-play funnel.
    // Give-ups pay nothing but still write the row — played-and-stopped is
    // exactly the signal Mystery was missing for months.
    const onStadiumsDone = (e) => {
      const d = e?.detail || {};
      if (!d.gaveUp) {
        const xp = d.hints === 0 ? 80 : d.hints <= 3 ? 60 : d.hints <= 10 ? 40 : 25;
        awardXp(xp);
      }
      recordPlay(!d.gaveUp && (d.solved || 0) >= (d.total || 20));
      if (user?.id) {
        saveScore(user?.id, {
          game_mode: 'stadiums',
          score: d.solved || 0,
          correct_answers: d.solved || 0,
          total_questions: d.total || 20,
        });
      }
    };
    window.addEventListener('biq:stadiums-completed', onStadiumsDone);
    // Abandoned runs. Not a score — a partial sweep written into `scores`
    // would skew every average on that table — so it goes to the funnel where
    // "how far do people actually get in Stadiums" is finally answerable.
    const onStadiumsExit = (e) => {
      const d = e?.detail || {};
      loopEvent('stadiums-abandon', { league: d.league, solved: d.solved, total: d.total, hints: d.hints });
    };
    window.addEventListener('biq:stadiums-exit', onStadiumsExit);
    // Widget repaint rides the same event: a SECOND same-day completion
    // leaves loginStreak untouched (tick no-op), so the state-driven sync
    // effect would not re-fire — the direct call covers that gap.
    const onDailyDoneAndSync = (e) => { onDailyDone(e); setTimeout(syncDailyWidget, 400); };
    window.addEventListener('biq:daily-completed', onDailyDoneAndSync);
    return () => {
      // (Also fixes a leak: the stadiums listener was never removed.)
      window.removeEventListener('biq:stadiums-completed', onStadiumsDone);
      window.removeEventListener('biq:stadiums-exit', onStadiumsExit);
      window.removeEventListener('biq:daily-completed', onDailyDoneAndSync);
    };
  }, [maybePromptNotif, awardXp, user?.id, tickLoginStreak, recordPlay, markFirstGameFinished]);

  // Online multiplayer joins the XP economy (it was the only mode outside it).
  // The emitter in OnlineMultiplayer is the once-per-room gate, so no dedup is
  // needed here — same arrangement as Footle's daily-completed dispatch.
  useEffect(() => {
    const onMpDone = (e) => {
      const d = e?.detail || {};
      awardXp(getMpXP(d.won === true, d.score));
      // null, not d.won: room_players carries no per-player correct count, so
      // this adds a game played and leaves correct_answers alone rather than
      // inventing one. Same reasoning as the explicit null on the row below.
      recordPlay(null);
      // Persist the game like every other mode does. Measured 2026-08-28:
      // scores held ZERO mp rows across a week of daily ended rooms — MP was
      // the only mode whose completion event paid XP but never wrote a row,
      // so finished games vanished from server-side history. That also made
      // the guest "save your stats" upgrade pitch empty for MP-only guests,
      // who are most guests (8 of 11 entered through a room invite).
      // score = points as the podium shows them; correct_answers stays null
      // because room_players has no per-player correct count.
      if (user?.id) {
        saveScore(user?.id, {
          game_mode: `mp:${d.mode || 'race'}`,
          score: d.score || 0,
          // Explicit null: omitting the key lets the column default write a 0,
          // which reads as "answered nothing right" when the truth is
          // "per-player correct counts don't exist in MP". Verified live —
          // the first row landed with 0 before this was made explicit.
          correct_answers: null,
          total_questions: Number.isInteger(d.total) ? d.total : null,
        });
      }
    };
    window.addEventListener('biq:mp-completed', onMpDone);
    return () => window.removeEventListener('biq:mp-completed', onMpDone);
  }, [awardXp, user?.id, recordPlay]);

  // Re-ask at the FIRST crossing into a 3-day streak — not on every open of a
  // long-streak user (that would burn both lifetime asks before they ever see a
  // milestone). initialStreakRef is the mount-time streak; a persisted flag makes
  // it fire at most once ever.
  useEffect(() => {
    if (loginStreak >= 3 && initialStreakRef.current < 3) {
      try {
        if (localStorage.getItem('biq_notif_streak_asked') === '1') return;
        localStorage.setItem('biq_notif_streak_asked', '1');
      } catch {}
      maybePromptNotif();
    }
  }, [loginStreak, maybePromptNotif]);

  // Keep the Settings toggle honest: if the user revoked notifications in iOS
  // Settings, the stored 'enabled' flag is stale (scheduleReminderWindow silently
  // no-ops without permission, so the toggle would read ON while nothing fires).
  // Reconcile against the live OS permission on mount and on app foreground.
  useEffect(() => {
    let cancelled = false;
    const reconcile = async () => {
      let enabledFlag, disabledFlag;
      try {
        enabledFlag = localStorage.getItem('biq_notif_enabled') === '1';
        disabledFlag = localStorage.getItem('biq_notif_disabled') === '1';
      } catch { return; }
      const perm = await getNotifPermission();
      if (cancelled) return;
      // Surface a hard denial in Settings. iOS only ever shows its permission
      // sheet ONCE — after a denial requestNotifPermission() resolves false
      // instantly, so the toggle became a dead control: flip it, get a toast,
      // watch it snap back, with no clue that the fix lives in iOS Settings.
      setNotifBlocked(perm === 'denied');
      if (enabledFlag && perm !== 'granted') {
        // Revoked in OS Settings while the toggle read ON — turn it off.
        setNotifEnabled(false);
        try { localStorage.removeItem('biq_notif_enabled'); } catch {}
        cancelAllReminders();
      } else if (!enabledFlag && !disabledFlag && perm === 'granted') {
        // Self-heal the other direction: OS permission is granted (only our
        // prompt or iOS Settings can do that) and the user never explicitly
        // opted out, but the local flag was lost (PWA storage eviction /
        // reinstall). Re-enable — the notifEnabled effect reschedules the
        // window — so a granted user never silently stops getting reminders.
        try { localStorage.setItem('biq_notif_enabled', '1'); } catch {}
        setNotifEnabled(true);
      }
    };
    reconcile();
    const onVis = () => { if (document.visibilityState === 'visible') reconcile(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { cancelled = true; document.removeEventListener('visibilitychange', onVis); };
  }, []);

  // Re-anchor the rolling reminder window when the day flips while the app is
  // left open. Otherwise "today" drifts off offset 0 and cancelTodayReminder()
  // cancels a stale id, nagging the user tonight after they've already played.
  useEffect(() => {
    if (!notifEnabled) return;
    const onRollover = () => { scheduleReminderWindow({ skipToday: false, streak: loginStreak }); };
    window.addEventListener('biq:day-rollover', onRollover);
    return () => window.removeEventListener('biq:day-rollover', onRollover);
  }, [notifEnabled, loginStreak]);


  const handleComplete = useCallback((res) => {
    saveStats(res);

    // ⚠️ A SESSION THAT HURT MUST NOT BE FOLLOWED BY "ENJOYING BALL IQ?"
    //
    // The last two unregistered bad-moment classes on the board were "timeout"
    // and "wrong-answer streak". Both are really one thing — a stretch where
    // the player felt stupid — and neither is worth marking on its own: a
    // single timeout is normal play, and marking every one would suppress the
    // ask so broadly it would undo the rating funnel.
    //
    // Measured against prod before picking the thresholds, not guessed:
    //   · Daily 7 ends at 2/7 or worse on 20.5% of plays (70 of 341, 60d)
    //   · 10-question quizzes end at 3/10 or worse on 8.3% (25 of 301)
    // So the ratio rule marks about one in five Daily 7s — far LESS aggressive
    // than the Footle-loss mark already shipping, which fires on 38% of days
    // Footle is played.
    //
    // ⚠️ Survival excluded: dying is the mode's design, and ~48% of runs end
    // on the very first question. Marking those would suppress the ask for
    // half of Survival's players on a mode working exactly as intended — the
    // same reason the perfect-score celebration already excludes it.
    // Reaching the results screen at all is the end of the funnel: this is the
    // moment a signup becomes a player. 85% of people who get here come back.
    markAcctStep(user?.id, 'acct-first-finish', loopEvent, { mode, total: res.total });
    // Device-scoped twin of the above, so the ~60% of first games played with
    // no user id are counted too. See markFirstGameFinished.
    markFirstGameFinished({ mode, total: res.total, score: res.score });

    const answers = Array.isArray(res.allAnswers) ? res.allAnswers : [];
    let missRun = 0, worstMissRun = 0, timeouts = 0;
    for (const a of answers) {
      if (a?.isCorrect) { missRun = 0; continue; }
      missRun += 1;
      if (missRun > worstMissRun) worstMissRun = missRun;
      if (a?.timedOut) timeouts += 1;
    }
    const ratio = res.total >= 5 ? res.score / res.total : null;
    const bruising = mode !== "survival" && (
      worstMissRun >= 4                      // four misses in a row is a spiral, not a hard question
      || timeouts >= 3                       // ran the clock out repeatedly — stuck, or walked away
      || (ratio !== null && ratio <= 0.3)    // finished having got most of it wrong
    );
    if (bruising) {
      try { markBadReviewMoment(); } catch {}
      loopEvent("bad-moment", { source: "session", mode, worstMissRun, timeouts, score: res.score, total: res.total });
    }

    // Milestone celebrations — ONE-SHOT per milestone value. gamesPlayed is
    // not monotonic on a real device: hydrate max-merges local vs remote at
    // every sign-in, and the false-guest boot bug (2026-09-01) had players
    // flip-flopping between a guest-local count and an account count, so the
    // same total could be re-crossed for days. A player screenshotted
    // "⚡ 175 games played" as the toast that "will not go away". Remember the
    // highest milestone already celebrated and never replay it — persisted
    // immediately, because the streak flags nearby once relied on the next
    // save's spread and replayed after reload (2026-07-12 medical).
    const newTotal = (stats.gamesPlayed || 0) + 1;
    if (newTotal > (stats.lastGamesMilestone || 0)) {
      let milestone = true;
      if (newTotal === 10) showToast("🎉 10 games played, you're on a roll");
      else if (newTotal === 50) showToast(`🔥 50 games — serious ${APP_NAME} energy`);
      else if (newTotal === 100) showToast(`🏆 100 games — you're a ${APP_NAME} legend`);
      else if (newTotal % 25 === 0 && newTotal > 10) showToast(`⚡ ${newTotal} games played, keep going`);
      else milestone = false;
      if (milestone) {
        setStats(p => {
          const next = { ...p, lastGamesMilestone: newTotal };
          safeSetItem("biq_stats", JSON.stringify(next));
          return next;
        });
      }
    }

    // Streak milestones (independent of game count)
    if (loginStreak === 7 && !stats.streak7Celebrated) {
      celebrationTimeoutsRef.current.push(setTimeout(() => { showToast("🔥 7-day streak — you're building a habit"); haptic("heavy"); playSound("streak"); setMilestoneConfetti(true); }, 1200));
      setStats(p => ({...p, streak7Celebrated: true}));
    } else if (loginStreak === 30 && !stats.streak30Celebrated) {
      celebrationTimeoutsRef.current.push(setTimeout(() => { showToast("🏆 30-day streak — incredible dedication"); haptic("heavy"); playSound("streak"); setMilestoneConfetti(true); }, 1200));
      setStats(p => ({...p, streak30Celebrated: true}));
    } else if (loginStreak === 100 && !stats.streak100Celebrated) {
      celebrationTimeoutsRef.current.push(setTimeout(() => { showToast("💎 100-day streak — you are a legend"); haptic("heavy"); playSound("streak"); setMilestoneConfetti(true); }, 1200));
      setStats(p => ({...p, streak100Celebrated: true}));
    }

    // 🎉 PERFECT SCORE celebration
    if (res.score === res.total && res.total >= 5 && mode !== "survival") {
      celebrationTimeoutsRef.current.push(setTimeout(() => showToast("🎉 Perfect — every question right"), 800));
      haptic("levelup");
    }

    // ⭐ 5-star ask — surface the native App Store review sheet after a genuinely
    // good moment, once the user has enough games to have an opinion. The module
    // enforces a long cooldown + lifetime cap (and iOS rate-limits further), so
    // this only actually prompts occasionally. Delayed to land at a lull after
    // the celebration. Skips daily (which already shows the notif pre-prompt).
    const hadGreatMoment =
      (res.score === res.total && res.total >= 5) ||
      (res.total >= 10 && res.score / res.total >= 0.9) ||
      [7, 30, 100].includes(loginStreak);
    // ⚠️ Daily 7 was EXCLUDED from the native ask (`mode !== "daily"`), which
    // silently killed most streak-milestone asks too — streaks tick on daily
    // completions, so the 7/30/100 trigger above and the exclusion cancelled
    // each other out. The #2 mode by players never asked (review panel,
    // 2026-08-19). Daily now asks, with the SAME yields the auth nudge below
    // already documents for this moment: the notification pre-prompt owns a
    // native first-daily, a settling challenge owns its results screen, and
    // guests keep the save-your-progress nudge instead — signing up beats a
    // rating while retention is the binding constraint.
    const notifOwnsDailyMoment = IS_NATIVE && mode === "daily"
      && localStorage.getItem('biq_notif_enabled') !== '1'
      && parseInt(localStorage.getItem('biq_notif_asks_v2') || '0', 10) < 2;
    const challengeOwnsDailyMoment = mode === "daily" && !!pendingChallenge
      && challengeDayOffset(pendingChallenge.date) <= 1;
    const willAskNativeReview = hadGreatMoment && newTotal >= 5
      && (mode !== "daily" || (!isGuest && !notifOwnsDailyMoment && !challengeOwnsDailyMoment));
    if (willAskNativeReview) {
      celebrationTimeoutsRef.current.push(setTimeout(() => {
        if (!ratingAskAllowed()) { loopEvent("rate-prompt-skipped", { reason: "screen-changed", engine: "native", trigger: "results" }); return; }
        // ⚠️ ASK THE POLICY BEFORE CLAIMING WE SHOWED ANYTHING. maybeRequestReview
        // returns false in silence on a bad moment / cooldown / lifetime cap, so
        // logging "shown" first counted every suppressed ask as a real one — and
        // the suppression levers added all week are exactly what would inflate it.
        const blocked = nativeAskBlockedReason();
        if (blocked) { loopEvent("rate-prompt-skipped", { reason: blocked, engine: "native", trigger: "results" }); return; }
        loopEvent("rate-prompt-shown", { engine: "native", trigger: "results" });
        maybeRequestReview();
      }, 3500));
    }

    // 🏅 PERSONAL BEST celebration — only for standard quiz modes (not daily)
    if (mode === "classic" && res.score && res.total === 10 && res.score > (stats.bestScore || 0)) {
      const isFirst = !stats.bestScore;
      celebrationTimeoutsRef.current.push(setTimeout(() => showToast(isFirst ? `🎯 First score: ${res.score}/10!` : `🎯 New personal best: ${res.score}/10!`), 1400));
      haptic("hardCorrect");
    }

    // 🔥 HOT STREAK personal best
    if (mode === "hotstreak" && res.score > (stats.bestHotStreak || 0) && res.score >= 5) {
      const isFirst = !stats.bestHotStreak;
      celebrationTimeoutsRef.current.push(setTimeout(() => showToast(isFirst ? `⚡ Hot Streak record: ${res.score}!` : `⚡ New Hot Streak best: ${res.score}!`), 1400));
      haptic("hardCorrect");
    }

    // 🔄 COMEBACK celebration — got Q1 wrong, then nailed the rest
    if (mode === "classic" && res.wrongAnswers && res.wrongAnswers.length === 1 && res.score >= 8) {
      celebrationTimeoutsRef.current.push(setTimeout(() => showToast("🔄 Great comeback — only missed one after a slow start"), 1600));
    }

    // 🎖️ CATEGORY MASTERY — 10+ correct in a row from same category
    if (mode === "hotstreak" && res.score >= 10 && cat && cat !== "All") {
      celebrationTimeoutsRef.current.push(setTimeout(() => showToast(`🎖️ ${cat} mastery — ${res.score} in a row`), 1600));
    }


    // 💪 SURVIVAL new best (wrong answers = 0 means they only died on one)
    if (mode === "survival" && res.score && res.score > (stats.bestSurvival || 0) && res.score >= 10) {
      celebrationTimeoutsRef.current.push(setTimeout(() => showToast(`💪 New Survival record — ${res.score} questions`), 1400));
      setStats(p => ({...p, bestSurvival: res.score}));
    }

    // Rate prompt — show once after 5+ games with a good score. On native we
    // defer to the native review sheet above (don't double-ask); on web, where
    // that sheet no-ops, this App Store link is the only ask, so keep it.
    // Reviews push 2026-08-20: the persistent gate moved from a once-per-
    // device-EVER boolean into webRatePromptEligible() (3 lifetime, 60 days
    // apart, sentiment-guarded) — the old bar produced ~zero web reviews.
    // ratePromptShown stays as the per-session dedupe.
    const shouldShowRate = !ratePromptShown
      && stats.gamesPlayed >= 4
      && res.score >= 9
      && mode === "classic"
      && !(IS_NATIVE && willAskNativeReview)
      && webRatePromptEligible();
    if (shouldShowRate) {
      // Budget spent at render, not at schedule — see the Footle twin above.
      setRatePromptShown(true);
      celebrationTimeoutsRef.current.push(setTimeout(() => {
        if (!ratingAskAllowed()) { loopEvent("rate-prompt-skipped", { reason: "screen-changed", trigger: "classic" }); return; }
        markWebRatePromptShown();
        loopEvent("rate-prompt-shown", { engine: "web", trigger: "classic" });
        setRateView("ask"); setShowRatePrompt(true);
      }, 1800));
    }

    // Guest→account nudge at the results HIGH (opportunity-scan #4): the
    // reward-framed 'save' auth prompt existed but was only reachable from
    // Settings — guests were never asked at the moment their progress felt
    // worth keeping. Fires ONCE ever, at a peak (Daily 7 done, or a new
    // classic/survival personal best — compared against pre-update stats,
    // this closure's `stats` predates saveStats). Never stacks: skips when
    // the rate prompt claimed this results screen, and on native lets the
    // notification pre-prompt win the first-daily moment (the nudge simply
    // takes the next peak — its once-flag is only set when actually shown).
    try {
      const nudged = localStorage.getItem('biq_save_nudge_shown') === '1';
      const isPB = (mode === "classic" && res.score > (stats.bestScore || 0))
        || (mode === "survival" && res.score > (stats.bestStreak || 0));
      const peak = mode === "daily" || isPB;
      const notifWillClaim = IS_NATIVE && mode === "daily"
        && localStorage.getItem('biq_notif_enabled') !== '1'
        && parseInt(localStorage.getItem('biq_notif_asks_v2') || '0', 10) < 2;
      // Level-up guard (fresh-code audit): the full-screen level-up overlay
      // owns +400..+3900ms; the auth sheet at +2000ms would cover it. Skip
      // and leave the once-flag unset so the nudge takes the next peak.
      // (Note: in the normal path the flag is set at SCHEDULE time, 2s
      // before the sheet is actually displayed.)
      const nudgeEarned = getXPForResult(res.score, res.total, mode === "speed" ? "classic" : mode);
      const willLevelUp = nudgeEarned > 0 && getLevelInfo(xp).level.name !== getLevelInfo(xp + nudgeEarned).level.name;
      // Challenge-settlement guard (caught by the #9 e2e drive): a challenged
      // guest finishing the Daily gets the "Send it back" modal at +1800ms —
      // the auth sheet at +2000ms covered it and blocked its buttons. The
      // challenge result IS the viral moment; the nudge takes the next peak.
      const challengeWillSettle = mode === "daily" && !!pendingChallenge && challengeDayOffset(pendingChallenge.date) <= 1;
      if (isGuest && !nudged && peak && !shouldShowRate && !notifWillClaim && !willLevelUp && !challengeWillSettle) {
        localStorage.setItem('biq_save_nudge_shown', '1');
        // Share-sheet guard, same shape as challengeWillSettle above but checked
        // at FIRE time: a guest who taps Share within 2s of the results lands
        // the name sheet first, and the auth prompt would cover it and eat the
        // share. Clear the once-flag so the nudge simply takes the next peak —
        // exactly what the level-up and challenge guards do.
        // 2026-09-03: NOT a timer any more. The play-through found the sheet
        // covering the results two seconds in — score, accuracy and the
        // "Review N missed answers" panel never seen — on the exact moment the
        // day-1→2 baseline says predicts a return (every returner had finished;
        // no non-finisher ever came back). The ask now waits until the player
        // leaves the results by Back to Home (goHome). Play again keeps it
        // pending for the next exit, so it still fires once, just never over
        // the thing the player just earned.
        // (2026-09-06) No deferred prompt any more: the results panel shows a
        // quiet "Save it" row to a guest with a streak worth saving (DailyDone).
      }
    } catch { /* nudge is never load-bearing */ }

    // Award XP
    const earned = getXPForResult(res.score, res.total, mode === "speed" ? "classic" : mode);
    awardXp(earned);


    // Save daily completion (today or a past "catch-up" day)
    if (mode === "daily") {
      const targetDate = activeDailyDate || new Date();
      const targetYMD = dateToYMD(targetDate);
      const key = keyForDate(targetDate);
      safeSetItem(key, JSON.stringify({
        score: res.score,
        wrongAnswers: res.wrongAnswers || [],
        allAnswers: res.allAnswers || [],
      }));
      // Cross-device sync — push score, wrongAnswers, and allAnswers to
      // profiles via three atomic JSON-merge RPCs. wrongAnswers is kept
      // alongside allAnswers (redundant but harmless; Phase 5x followup
      // can prune later). Skips the WA/AA RPCs when there's nothing to
      // send (perfect score = no wrongAnswers, but allAnswers always
      // has 7 entries on a complete game so it always fires).
      if (user?.id) {
        supabase.rpc('upsert_daily_score', { p_ymd: targetYMD, p_score: res.score })
          .then(({ error }) => {
            if (error) {
              console.warn('[daily sync]', error.message);
              Sentry.captureException(error, { tags: { area: 'daily-sync' } });
            }
          })
          .catch(e => {
            console.warn('[daily sync]', e?.message || e);
            Sentry.captureException(e, { tags: { area: 'daily-sync' } });
          });
        if (res.wrongAnswers && res.wrongAnswers.length > 0) {
          supabase.rpc('upsert_daily_wrong_answers', { p_ymd: targetYMD, p_wrongs: res.wrongAnswers })
            .then(({ error }) => {
              if (error) {
                console.warn('[daily wa sync]', error.message);
                Sentry.captureException(error, { tags: { area: 'daily-wa-sync' } });
              }
            })
            .catch(e => {
              console.warn('[daily wa sync]', e?.message || e);
              Sentry.captureException(e, { tags: { area: 'daily-wa-sync' } });
            });
        }
        if (res.allAnswers && res.allAnswers.length > 0) {
          supabase.rpc('upsert_daily_all_answers', { p_ymd: targetYMD, p_answers: res.allAnswers })
            .then(({ error }) => {
              if (error) {
                console.warn('[daily aa sync]', error.message);
                Sentry.captureException(error, { tags: { area: 'daily-aa-sync' } });
              }
            })
            .catch(e => {
              console.warn('[daily aa sync]', e?.message || e);
              Sentry.captureException(e, { tags: { area: 'daily-aa-sync' } });
            });
        }
      }
      setDailyHistory(prev => ({ ...prev, [targetYMD]: res.score }));
      const todayYMD = dateToYMD(new Date());
      if (targetYMD !== todayYMD) {
        // Yesterday's Daily 7 via catch-up: counts toward streak repair like
        // the other three modes' archive completions.
        try { window.dispatchEvent(new CustomEvent('biq:archive-completed', { detail: { game: 'daily7', ymd: targetYMD } })); } catch {}
      }
      if (targetYMD === todayYMD) {
        setDailyDone(true);
        setDailyScore(res.score);
        // 1.1: completing today's Daily 7 cancels tonight's reminder and is a
        // positive moment to surface the notification pre-prompt.
        try { window.dispatchEvent(new CustomEvent('biq:daily-completed', { detail: { positive: true } })); } catch {}
        // 1.1 async challenge: head-to-head result if a friend's challenge
        // (today's, or yesterday's — labelled) was pending. opportunity-scan #9:
        // a modal with a "Send it back" CTA replaced the old ~2s toast — the
        // re-share is the whole viral loop and a toast never earned one.
        // Delayed like the other celebrations so Results lands first; payload
        // captured eagerly and the challenge cleared synchronously so the
        // settle effect can't double-fire.
        if (pendingChallenge && challengeDayOffset(pendingChallenge.date) <= 1) {
          const payload = {
            mine: res.score,
            theirs: pendingChallenge.score,
            name: pendingChallenge.name,
            yesterday: challengeDayOffset(pendingChallenge.date) === 1,
          };
          if (challengeEventOnce("played", pendingChallenge)) {
            supabase.rpc("record_challenge_event", {
              p_event: "played", p_date: pendingChallenge.date,
              p_score: pendingChallenge.score, p_name: pendingChallenge.name || null,
              p_my_score: res.score,
              p_sender: pendingChallenge.from || null,
            }).then(({ error }) => { if (error) console.warn("[challenge played]", error.message); });
          }
          celebrationTimeoutsRef.current.push(setTimeout(() => setChallengeResult(payload), 1800));
          clearChallenge();
        }
      }
      setActiveDailyDate(null);
      haptic("heavy");
      playSound("daily_complete");
    }

    // (local multiplayer no longer flows through handleComplete — LocalGameScreen handles its own end-of-game.)

    // Save hotstreak personal best
    if (mode === "hotstreak") {
      if (res.score > hotstreakBest) {
        setHotstreakBest(res.score);
        safeSetItem("biq_hotstreak_best", String(res.score));
      }
    }
    // Record the questions actually shown into the 14-day seen history
    try {
      const shownCount = typeof res.total === "number" ? res.total : (questions?.length || 0);
      const shown = (questions || []).slice(0, Math.max(0, shownCount));
      recordSeenQuestions(shown);
    } catch {}
    setResult(res);
    setWrongAnswers(res.wrongAnswers || []);
    setScreen("results");
  }, [mode, stats, loginStreak, cat, ratePromptShown, todayKey, hotstreakBest, saveStats, showToast, activeDailyDate, questions, pendingChallenge, clearChallenge, awardXp, isGuest, openAuthPrompt, xp, markFirstGameFinished]);

  const updateSettings = useCallback((patch) => {
    setSettings(prev => {
      const updated = { ...prev, ...patch };
      safeSetItem("biq_settings", JSON.stringify(updated));
      return updated;
    });
    // Apply defaultDiff immediately
    if (patch.defaultDiff) setDiff(patch.defaultDiff === "med" ? "medium" : patch.defaultDiff);
  }, []);


  // Save / share the rating card as a PNG.
  //
  // Deliberately SEPARATE from shareProfile, which sends a /p?... link. That
  // choice is still right for chat — iMessage strips the caption off a bare
  // image file, and a link gives both a tappable target and the OG preview.
  // But a link is inert in an Instagram story or a camera roll, which is
  // exactly where a rating worth showing off wants to go. Link for chat, image
  // for everywhere else; neither replaces the other.
  //
  // shareCard() already handles the whole ladder: native share sheet, then a
  // download with a "Saved!" toast, then text. So one call covers both "share
  // it" and "save it" without a second code path.


  const clearSeen = useCallback(() => {
    clearSeenHistory();
    showToast("✓ Question history cleared");
  }, [showToast]);

  // Called by SettingsScreen after the delete_user_account RPC has finished.
  // We reset our own in-memory state so the brief moment between the RPC
  // returning and AppGate routing back to the login screen doesn't show a
  // stale leaderboard / IQ history. Errors surface as a toast.
  const onAccountDeleted = useCallback(({ error }) => {
    if (error) {
      showToast("⚠️ Couldn't delete account — please try again");
      return;
    }
    setStats({ gamesPlayed: 0, bestScore: 0, bestStreak: 0 });
    setDailyDone(false);
    setDailyScore(null);
    setDailyHistory({});
    setHotstreakBest(0);
    setLoginStreak(0);
    setXp(0);
    setProfileState(null);
    showToast("Your account has been deleted");
  }, [showToast]);

  // Full stats reset. Phase F (audit finding 1.4): server-authoritative —
  // calls reset_user_stats RPC FIRST, aborts the local clear on failure.
  // Without the RPC, hydrate's max-merge would silently restore remote
  // values on next sign-in, undoing the reset.
  //
  // Preserved keys: biq_settings, biq_profile, biq_seen_history_v2,
  // biq_onboarded, biq_skill_level, and the various UI flags
  // (biq_first_tip_shown, biq_rate_shown, biq_footle_rules_seen,
  // biq_pending_join, biq-splash) — those aren't stats. biq_skill_level in particular is a difficulty
  // preference, not a stat; clearing it would force the user back through
  // the onboarding skill-level picker and produce incoherent state
  // (biq_onboarded=1 with no skill level set).
  //
  // Guest users (no user.id) skip the RPC since they have no remote
  // profile; local-only clear still runs.
  const clearStats = useCallback(async () => {
    if (user?.id) {
      const { error } = await supabase.rpc('reset_user_stats');
      if (error) {
        console.warn('[reset_user_stats]', error.message);
        showToast("Couldn't reset stats — try again when online");
        return;
      }
    }

    const reset = { gamesPlayed: 0, bestScore: 0, bestStreak: 0 };
    setStats(reset);
    setDailyDone(false); setDailyScore(null);
    setDailyHistory({});
    setXp(0);
    setLoginStreak(0);
    setBestLoginStreak(0);
    setHotstreakBest(0);
    try {
      // Single-key wipes — write the empty stats object, delete everything else.
      safeSetItem("biq_stats", JSON.stringify(reset));
      // Prefix wipes collected first — removing while iterating localStorage
      // shifts the key indices and skips entries.
      const doomed = ["biq_xp", "biq_login_streak", "biq_iq_history", "biq_hotstreak_best"];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (/^biq_daily_\d{4}-\d{2}-\d{2}$/.test(k) || /^biq_wordle_/.test(k))) doomed.push(k);
      }
      for (const k of doomed) {
        try { localStorage.removeItem(k); } catch {}
      }
    } catch {}
    showToast("✓ Stats cleared");
  }, [showToast, user?.id]);

  // Ball IQ is dark-only (light theme removed 2026-07-15). Strip a stale
  // `.light` class off html/body for anyone whose saved settings still carry
  // theme:"light" from before the removal — without this they'd keep the old
  // class on every boot and resolve half-missing light tokens.
  useEffect(() => {
    document.body.classList.remove("light");
    document.documentElement.classList.remove("light");
    // "Light" style = light glyphs, for our dark background.
    try {
      if (Capacitor.isNativePlatform?.()) {
        StatusBar.setStyle({ style: StatusBarStyle.Light }).catch(() => {});
      }
    } catch {}
  }, []);

  const inGame = ["quiz","local-game","local-results"].includes(screen);
  // Departure tracking for game-abandon (see the playing effect below).
  const playStartRef = useRef(null);
  const playModeRef = useRef(null);
  const dailyDoneRef = useRef(false);
  useEffect(() => {
    // Footle/Trail/Mystery/Stadiums finish WITHOUT changing screen, so the
    // "results" test cannot see them. This latch is what stops a completed
    // daily being recorded as an abandonment.
    const onDone = () => { dailyDoneRef.current = true; };
    window.addEventListener('biq:daily-completed', onDone);
    window.addEventListener('biq:stadiums-completed', onDone);
    return () => {
      window.removeEventListener('biq:daily-completed', onDone);
      window.removeEventListener('biq:stadiums-completed', onDone);
    };
  }, []);

  // ⚠️ THE STEP THAT SEPARATES "STUCK" FROM "CHOSE NOT TO PLAY". Reaching Home
  // signed in means the app is usable — past auth, past the mandatory username
  // wall, past onboarding. Someone who records acct-session but never
  // acct-home was BLOCKED by something; someone who records acct-home and never
  // acct-first-play looked at the app and did not start. Those are opposite
  // problems with opposite fixes, and right now we cannot tell them apart for
  // any of the 79 accounts that never played.
  useEffect(() => {
    if (!user?.id || screen !== "home") return;
    markAcctStep(user.id, 'acct-home', loopEvent);
  }, [user?.id, screen]);


  // Sprint #64 FF2: toggle body.in-focused-play during quiz / Footle so the
  // web app bar (.fd-appbar, app.css) hides while the user is mid-game. It
  // used to hide the desktop landing chrome too; that chrome was deleted from
  // index.html on 2026-09-05. Empty deps on unmount cleanup so navigating
  // away always strips the class.
  useEffect(() => {
    const playing = inGame || screen === "wordle" || screen === "trail" || screen === "mystery" || screen === "stadiums";
    // first_game_started (scouting panel, onboarding): the activation funnel
    // had install → onboard-done → …nothing until a scores row. This is the
    // missing middle beat, fired at the STATE level rather than in any
    // launcher because launchers multiply (startMode, club/league bypass,
    // the four daily screens, deep links) and this predicate already unifies
    // them — it is the same `playing` the focused-play chrome keys off.
    // Once per device, ever.
    if (playing) {
      try {
        if (!localStorage.getItem("biq_first_game_started")) {
          localStorage.setItem("biq_first_game_started", "1");
          // WHICH game and THROUGH WHICH DOOR. Read 2026-09-04: on the web,
          // 1,045 devices started a first game in 30 days and 53 finished one
          // (5%), against 57% for signed-in players — and the rows could not
          // say whether the leak was the /footle share landing, a club page's
          // door, the front door's doors or an in-app launch. Now they can.
          let entry = "app";
          try {
            const sp = new URLSearchParams(BOOT_SEARCH);
            entry = sp.get("game") ? "door" : sp.get("c") ? "challenge" : sp.get("club") ? "club-door" : sp.get("quiz") ? "quiz-door"
              : (sp.get("join") || /^\/join\//.test(window.location.pathname)) ? "invite"
              : /^\/(footle|c)(\/|$)/.test(window.location.pathname) ? "link" : "app";
          } catch {}
          loopEvent("first-game-started", { mode: mode || screen, entry });
        }
        // Same beat, but attributable: the device-scoped event above cannot be
        // joined to an account, so it can count first games and never say
        // whose. Rides the same unified `playing` predicate rather than a
        // launcher, for the reason given above — launchers multiply.
        markAcctStep(user?.id, 'acct-first-play', loopEvent, { mode });
      } catch {}
    }
    // ⚠️ THE OTHER HALF OF first-game-finished. Measured 2026-09-02 over the
    // window where both events existed: of 62 visitors who started a first game
    // and had a real chance to return, 29 finished it and only 4 ever came back
    // on a later day — and ALL FOUR of the returners were finishers. Zero of
    // the 33 non-finishers returned.
    // So the binding step is not the finish SCREEN, it is reaching one at all:
    // roughly half never do. What we could not answer is WHICH mode they quit
    // and HOW FAR IN, because nothing recorded a departure.
    //
    // Finished vs gave up is read from the signals that already exist rather
    // than plumbing a question index up through the tree: a completed quiz
    // ends on screen "results" (the last statement of handleComplete), and the
    // dailies — Footle, Trail, Mystery, Stadiums — dispatch
    // biq:daily-completed. Anything else that leaves a game is a departure.
    // ⚠️ Duration, not question index, on purpose: `idx` lives inside the quiz
    // components, and threading it up would touch every engine to answer a
    // question that "how long did they last" already answers.
    if (playing) {
      playStartRef.current = Date.now();
      playModeRef.current = mode || screen;
      dailyDoneRef.current = false;
    } else if (playStartRef.current) {
      const secs = Math.round((Date.now() - playStartRef.current) / 1000);
      const finished = screen === "results" || dailyDoneRef.current === true;
      playStartRef.current = null;
      // Under 3s is a bounce off a mis-tap, not an abandoned game; counting it
      // would swamp the signal we actually want.
      if (!finished && secs >= 3) {
        try { loopEvent("game-abandon", { mode: playModeRef.current || "unknown", secs }); } catch {}
      }
    }
    try {
      if (playing) document.body.classList.add("in-focused-play");
      else document.body.classList.remove("in-focused-play");
    } catch {}
    return () => { try { document.body.classList.remove("in-focused-play"); } catch {} };
  }, [inGame, screen]);

  // Belt-and-braces: strip any chaos-tagged item before the TrueFalseEngine
  // sees the questions list. The upstream selection path (getTrueFalseQs)
  // already filters chaos, but any future code path that sets `questions`
  // directly would bypass that filter. Memoized so the engine's questions
  // prop keeps a stable reference across AppInner renders.
  const trueFalseQuestions = useMemo(
    () => (mode === "truefalse" && Array.isArray(questions))
      ? questions.filter(q => q && q.cat !== "chaos")
      : questions,
    [mode, questions]
  );

  const levelInfo = useMemo(() => getLevelInfo(xp), [xp]);
  // Streak badges (roll5/roll30) key off the BEST streak, not the live one —
  // computed from the live value they un-earn themselves the day a streak
  // dies. bestLoginStreak only ratchets (both tick paths persist max(best, streak)).
  const earnedBadges = useMemo(() => computeBadges(stats, xp, Math.max(bestLoginStreak || 0, loginStreak || 0)), [stats, xp, loginStreak, bestLoginStreak]);

  // Cross-device sync: useAuth.hydrateLocalFromRemote dispatches biq:hydrated
  // after merging Supabase profile state with localStorage. Refresh in-memory
  // xp/stats state from the merged values. The xp/stats useState initializers
  // already ran at mount (with whatever was in localStorage at the time), so
  // this listener is the bridge between async hydration and React state.
  useEffect(() => {
    const onHydrated = (e) => {
      const detail = e?.detail;
      if (!detail) return;
      if (typeof detail.xp === 'number') setXp(detail.xp);
      if (detail.stats && typeof detail.stats === 'object') {
        setStats(prev => ({ ...prev, ...detail.stats }));
      }
      // Phase 5v: cross-device daily/wordle/streak sync. Hydrate has
      // already written merged values to localStorage; this re-derives
      // the React state that mounted from pre-hydration localStorage.
      if (detail.dailyScores && typeof detail.dailyScores === 'object') {
        setDailyHistory(detail.dailyScores);
        const todayYMD = dateToYMD(new Date());
        if (todayYMD in detail.dailyScores) {
          setDailyDone(true);
          setDailyScore(detail.dailyScores[todayYMD]);
        }
      }
      // loginStreak removed from biq:hydrated payload in Phase G —
      // tick_login_streak RPC is authoritative; AppInner's tickLoginStreak
      // useEffect updates setLoginStreak / setBestLoginStreak directly.
      // wordleState is in the payload for forward-compat; FootballWordle
      // re-reads localStorage on mount, so no AppInner state to refresh.
    };
    window.addEventListener('biq:hydrated', onHydrated);
    return () => window.removeEventListener('biq:hydrated', onHydrated);
  }, []);
  // Past-7-days activity for the home Streak tile pulse. Recompute when a
  // game completes (gamesPlayed bumps) or the streak changes (day rollover).
  const streakPulseDays = useMemo(
    () => computePast7DaysActivity(),
    [stats.gamesPlayed, loginStreak]
  );

  // Inline join from the Online tab — same RPC + SQLSTATE copy as OnlineEntry,
  // but the code row lives on the tab (no intermediate entry screen).
  const hubJoinRoom = useCallback(async (rawCode) => {
    // Device test 2026-08-30: signed out, a TYPED code hit the auth wall and
    // was silently discarded — while the same room admits link-tapping guests.
    // Route the typed code into pendingJoinCode instead: the join-gate modal
    // (guest primary, sign-in secondary) and autoJoin routing take over, the
    // exact machinery /join/CODE links already use.
    if (!user || isGuest) {
      const code = String(rawCode || "").toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g, "").slice(0, 6);
      if (code.length < 4) { openAuthPrompt("online"); return { ok: false, error: "" }; }
      // ⚠️ CHECK THE ROOM BEFORE PROMISING IT (review 2026-09-06, A1). A typo
      // used to be persisted and greeted with "we'll drop you straight into the
      // room", then re-prompted on every boot. One read-only RPC first.
      const look = await mpLookupRoom(code);
      if (look.found === false) return { ok: false, error: "No room with that code — check with your friend" };
      if (look.found && !look.joinable) return { ok: false, error: look.state === "ended" ? "That game has finished" : "This room is full" };
      try { localStorage.setItem("biq_pending_join", JSON.stringify({ c: code, at: Date.now() })); } catch {}
      setPendingJoinCode(code);
      return { ok: false, error: "" };
    }
    const trimmed = String(rawCode || "").trim().toUpperCase();
    if (trimmed.length !== 6) return { ok: false, error: "Enter the 6-character room code" };
    const result = await mpJoinRoom({
      p_code: trimmed,
      p_name: (authProfile?.username || profile?.name || "Player"),
      p_avatar: (authProfile?.avatar_id || profile?.avatar || ""),
    });
    if (result.error) {
      const msg = result.code === "53300" ? "This room is full"
        : result.code === "P0002" ? "No room with that code — check with your friend"
        : result.code === "42P01" ? "This room isn't accepting joins right now"
        : (result.error || "Couldn't join room");
      return { ok: false, error: msg };
    }
    setStage1RoomCode(result.code || trimmed);
    setScreen("online-stage1-lobby");
    return { ok: true };
  }, [user, isGuest, authProfile?.username, profile?.name, openAuthPrompt, setPendingJoinCode]);

  // Stable callbacks for memoized children
  // ── The one-day archive ────────────────────────────────────────────────────
  // Missing a day is where people quit daily games, and until now missing one
  // meant the puzzle was simply gone. Daily 7 already had catch-up and was the
  // only mode that did; all three generators are deterministic for any date, so
  // the rest was reachability rather than new mechanics.
  //
  // Deliberately ONE day back, not an open archive: a full archive is a content
  // product with its own design (browse, calendar, completion), and shipping a
  // half version of that is worse than shipping the bit that fixes the churn
  // moment. Yesterday is the day people actually want back.
  //
  // Null means "today" everywhere downstream, so nothing changes for a normal
  // play. It MUST reset on exit or the next tap on Footle would silently open
  // yesterday's board.
  const [archiveDate, setArchiveDate] = useState(null);
  const playArchive = useCallback((mode, date) => {
    setArchiveDate(date);
    setScreen(mode);
  }, []);

  const goHome = useCallback(() => {
    // The deferred 'save' nudge (results handler): fire it on the way out of
    // results, once Home has rendered. The share-name sheet keeps precedence,
    // as before — the nudge simply takes the next exit.
    setArchiveDate(null);
    setScreen("home");
    setTab("home");
    // Drop in-game state so we don't keep stale 300/999-question arrays in
    // memory and so a future render loop can't accidentally show last game's
    // result data on the home screen.
    setMode(null);
    setQuestions([]);
    setResult(null);
    setWrongAnswers([]);
    setLocalResult(null);
    setActiveClub(null);
    setActiveLeague(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);
  // Wordmark "Home" handler — wired to the mobile .logo and the BiqNav
  // brand. If the user is currently in a Stage 1 multiplayer room,
  // confirm before bailing so we don't accidentally orphan their seat.
  // Calls leave_room directly (bypassing MultiplayerLobby's actions.leave)
  // since we need to clean up before the screen-state change unmounts the
  // hook. Other players see the resulting room_players DELETE event.
  // The wordmark means THE WEBSITE on the web (Alex, 2026-09-03: "i still end
  // up here to the app design when i hit ball iq top left, that should not
  // even be possible anymore"). In a browser tab the brand goes to "/", the
  // front door; only native and installed PWAs — which have no website to go
  // to — keep the in-app home. A lobby still gets its leave-room confirm first.
  const isWebBrowser = (() => {
    try { return !IS_NATIVE && !(window.matchMedia?.('(display-mode: standalone)')?.matches || window.navigator.standalone === true); } catch { return false; }
  })();
  const [pendingLeaveRoom, setPendingLeaveRoom] = useState(null);
  const handleHomeClick = useCallback(async () => {
    if (isWebBrowser && !(screen === "online-stage1-lobby" && stage1RoomCode)) { window.location.assign('/'); return; }
    if (screen === "online-stage1-lobby" && stage1RoomCode) {
      // Sprint #71 MM1: in-app modal instead of window.confirm. The async
      // leave-room + navigate work is the modal's confirm callback.
      const code = stage1RoomCode;
      setPendingLeaveRoom({
        onConfirm: async () => {
          try { await mpLeaveRoom({ p_code: code }); } catch {}
          setStage1RoomCode("");
          goHome();
        },
      });
      return;
    }
    goHome();
  }, [screen, stage1RoomCode, goHome]);
  const [pendingInviteFriendId, setPendingInviteFriendId] = useState(null);
  const challengeFriend = useCallback((friend) => {
    // Seamless challenge: auto-create a room and drop the challenger straight
    // into the lobby AS HOST (the same one-tap path the Home/Online "Create
    // room" buttons use). Stash the friend's id so that once the room's code is
    // known (onLobbyEnter) we fire an in-app play_invite notification to them —
    // they'll see it in their bell/inbox with a one-tap Join. The share link in
    // the lobby remains as a fallback for non-friends / older clients.
    // (setPendingInviteFriendId is declared above — it was below, which is a TDZ read;
    // which runs at call time — safe, and kept out of deps to avoid a TDZ eval.)
    setPendingInviteFriendId(friend?.id || null);
    setOnlineAutoCreate(true);
    startMode("online");
    showToast(friend?.username ? `Room ready — inviting ${friend.username}` : "Room ready — share the invite link");
  }, [showToast, startMode]);
  // Friend profile screen — full-screen overlay, reachable from any tappable
  // friend row in FriendsSection (Your friends list + Friends leaderboard).
  const [viewingFriendId, setViewingFriendId] = useState(null);
  const openFriendProfile = useCallback((friend) => {
    if (!friend?.id) return;
    setViewingFriendId(friend.id);
    setScreen("friend-profile");
  }, []);

  // Below openFriendProfile on purpose — the listener calls it (E15).
  useEffect(() => {
    const goHome = () => { setScreen("home"); setTab("home"); };
    // Hard-gate dismissal ("Not now" on the online/friends wall) returns to the
    // tab the user was actually on. Home discarded their intent: they tapped
    // Create Room, got walled, and landed somewhere with no trace of the thing
    // they'd asked for — the single worst step in the online funnel.
    const goTab = (e) => { setScreen("home"); setTab(e?.detail?.tab || "home"); };
    // Multiplayer's ended screen asks for a player card. Same window-event
    // pattern as the two above, because OnlineMultiplayer is lazy-loaded and
    // has no path to openFriendProfile. Only the ENDED screen dispatches this —
    // firing it from a live lobby would pull the player out of their room.
    const openFriend = (e) => { const id = e?.detail?.id; if (id) openFriendProfile({ id }); };
    window.addEventListener("biq:go-home", goHome);
    window.addEventListener("biq:auth-dismissed", goTab);
    window.addEventListener("biq:open-friend", openFriend);
    return () => {
      window.removeEventListener("biq:go-home", goHome);
      window.removeEventListener("biq:auth-dismissed", goTab);
      window.removeEventListener("biq:open-friend", openFriend);
    };
  }, []);
  const closeFriendProfile = useCallback(() => {
    setScreen("home");
    setTab("profile");
    setViewingFriendId(null);
  }, []);

  // Notification center → hooks/useNotificationCenter.js (E16, 2026-09-06).
  const {
    notifOpen, setNotifOpen, notifRequests, notifInvites, notifCount,
    loadNotifs, respondFriendRequest, joinInvite, dismissInvite, sendPlayInvite, openNotifs,
  } = useNotificationCenter({ user, isGuest, showToast, setPendingJoinCode });
  // Scroll-aware tab bar → hooks/useScrollAwareTabBar.js (E16, 2026-09-06).
  const tabBarRef = useScrollAwareTabBar({ screen, inGame });
  const openPrivacy = useCallback(() => setShowPrivacy(true), []);
  const closePrivacy = useCallback(() => setShowPrivacy(false), []);
  const openHelp = useCallback(() => setShowHelp(true), []);
  const closeHelp = useCallback(() => setShowHelp(false), []);
  const openKnownIssues = useCallback(() => setShowKnownIssues(true), []);
  const closeKnownIssues = useCallback(() => setShowKnownIssues(false), []);
  const playDaily = useCallback(() => startMode("daily"), [startMode]);
  const suggestMode = useCallback((m) => { startMode(m); }, [startMode]);
  // Email deep link: /play?eq=<bankQuestionId>&ea=<authoredOptionIndex>.
  // The win-back / activate emails put a real bank question IN the inbox and
  // make every option a link, so the tap must keep the email's promise — tell
  // them whether they were right, then open the Daily 7. A link that silently
  // dumps a lapsed player into a quiz is the opposite of winning them back.
  //
  // ea indexes the AUTHORED option order (the email renders q.o as written),
  // so correctness is `ea === q.a`. Unknown id or malformed index degrades to
  // just opening the Daily — never a dead end. Params are stripped
  // immediately (mirrors the ?c=/?f= capture) so a refresh cannot replay it.
  //
  // ⚠️ THE VERDICT MUST LAND BEFORE THE DAILY OPENS. The toast lives in the
  // home subtree; the quiz screen renders a DIFFERENT tree with no toast node
  // at all (verified live: showToast ran with correct data, `.toast` was
  // absent from the DOM, and the daily opened anyway). Firing both in the same
  // tick therefore shows nothing. So: toast first, open the daily after it has
  // been on screen. Timer is cleaned up on unmount so a fast tab-away cannot
  // start a quiz behind the user's back.
  const emailAnswerHandled = useRef(false);
  const emailAnswerTimer = useRef(null);
  useEffect(() => {
    if (emailAnswerHandled.current) return;
    let eq = null, ea = null;
    try {
      const sp = new URLSearchParams(window.location.search);
      eq = sp.get('eq'); ea = sp.get('ea');
    } catch {}
    if (!eq) return;
    emailAnswerHandled.current = true;
    try { const u = new URL(window.location.href); u.searchParams.delete('eq'); u.searchParams.delete('ea'); window.history.replaceState({}, "", u.pathname + u.search + u.hash); } catch {}
    (async () => {
      try {
        const { QB } = await loadQuestions();
        const q = QB.find(x => x.id === eq);
        if (!q || !Array.isArray(q.o)) { playDaily(); return; }
        const idx = parseInt(ea, 10);
        const answered = Number.isInteger(idx) && idx >= 0 && idx < q.o.length;
        const correct = answered && idx === q.a;
        const answerText = q.o[q.a];
        showToast(
          correct
            ? `\u2713 ${answerText} \u2014 correct. Here's today's Daily 7`
            : `\u2717 It was ${answerText} \u2014 today's seven are waiting`,
          4200
        );
        emailAnswerTimer.current = setTimeout(() => { emailAnswerTimer.current = null; playDaily(); }, 2100);
      } catch { playDaily(); }
    })();
    return () => { if (emailAnswerTimer.current) { clearTimeout(emailAnswerTimer.current); emailAnswerTimer.current = null; } };
  }, [playDaily, showToast]);
  // 1.1 streak freeze: shields now AUTO-protect a missed day (consumed in
  // tickLoginStreak for guests / the tick_login_streak RPC for signed-in users),
  // so the old manual "Use Shield" action is gone — spending one by hand would
  // just waste it. The Daily-tab banner is now informational (shieldCount).
  // ⚠️ THE NAME IS MOST OF WHY A CHALLENGE GETS OPENED. Both link builders
  // (buildInviteUrl and the /c/ token) have carried an optional name for a
  // while — but nothing ever ASKED for one, so every guest shared a link that
  // reads "Think you can beat me?" signed by nobody. The plumbing was built
  // and never fed.
  //
  // resolveChallengerName returns "" for exactly that case, and shareDaily now
  // treats "" as ASK ONCE rather than ship-it-anonymous. Answering once writes
  // the name into the local profile, so every later share and invite carries
  // it too — this is the capture point for the whole loop, not just this
  // button. Skipping still shares: a nameless link beats a share the user
  // abandoned because we demanded a form.



  const shieldCount = useMemo(() => Math.min(3, Math.max(0, Math.floor(xp/200) - (stats.shieldsUsed||0))), [xp, stats.shieldsUsed]);

  const [showFriendsPicker, setShowFriendsPicker] = useState(false);
  const friendsPickerRef = useRef(null);
  const joinGateRef = useRef(null);
  // Sprint #68 JJ4: trap focus + ESC-to-close on the three pre-launch
  // bottom-sheet modals that previously had no a11y wiring.
  const ratePromptRef = useRef(null);
  // Sprint #71 MM1: in-app confirm modal for "leave the multiplayer room?"
  // replaces a window.confirm() that rendered as the iOS native dialog.
  // pendingLeaveRoomRef carries the cleanup callback; null = closed.
  const leaveRoomModalRef = useRef(null);
  const howToPlayRef = useRef(null);
  useModalA11y({ isOpen: showFriendsPicker, onClose: () => setShowFriendsPicker(false), ref: friendsPickerRef });
  useModalA11y({ isOpen: !!(pendingJoinCode && (!user || isGuest) && !inGame), onClose: clearPendingJoin, ref: joinGateRef });
  useModalA11y({ isOpen: !!showRatePrompt, onClose: () => setShowRatePrompt(false), ref: ratePromptRef });
  // Dismissing the name sheet (ESC / backdrop / back) must still SHARE — the
  // user asked to share, not to fill in a form. Closing without sharing would
  // turn a growth prompt into a growth blocker.
  // Stable identity, deliberately: useModalA11y's effect deps are
  // [isOpen, onClose, ref], so an inline arrow re-runs the whole effect on
  // EVERY AppInner render while the sheet is open — each re-run does a
  // pushState + a cleanup history.back(). Two cleanups landing before the
  // first popstate arrives overflow the module's single `inhibitNextPopstate`
  // boolean, and the second popstate closes the modal. That is exactly what
  // ate the auto-opened Footle rules sheet: opening during the burst of
  // renders after a screen transition closed it again in the same tick.
  const closeHowToPlay = useCallback(() => setHowToPlay(null), []);
  useModalA11y({ isOpen: !!howToPlay, onClose: closeHowToPlay, ref: howToPlayRef });
  useModalA11y({ isOpen: !!pendingLeaveRoom, onClose: () => setPendingLeaveRoom(null), ref: leaveRoomModalRef });
  // Openers for the HOW_TO_PLAY sheet. Stable identities so the engines can
  // treat them as effect deps (FootballWordle's one-time auto-open does).
  // `openQuizRules` is undefined for modes with no entry, which is what hides
  // the "?" affordance on those screens rather than opening an empty sheet.
  const openFootleRules = useCallback(() => setHowToPlay("wordle"), []);
  const openHotStreakRules = useCallback(() => setHowToPlay("hotstreak"), []);
  const openTrueFalseRules = useCallback(() => setHowToPlay("truefalse"), []);
  const openQuizRules = useCallback(() => setHowToPlay(mode), [mode]);
  // opportunity-scan #9: async-challenge "Send it back" result modal.
  const challengeResultRef = useRef(null);
  useModalA11y({ isOpen: !!challengeResult, onClose: () => setChallengeResult(null), ref: challengeResultRef });
  const challengeIntroRef = useRef(null);
  const challengeIntroOpen = !!(challengeIntro && pendingChallenge && challengeDayOffset(pendingChallenge.date) <= 1 && !dailyDone);
  const closeChallengeIntro = useCallback(() => setChallengeIntro(false), []);
  useModalA11y({ isOpen: challengeIntroOpen, onClose: closeChallengeIntro, ref: challengeIntroRef });

  // ── Android hardware back (opportunity-scan #11) ─────────────────────────
  // Registering ANY Capacitor backButton listener replaces the Android
  // default (WebView history-back, else exit/minimize), so every case the
  // default used to cover must be handled here. iOS never fires backButton
  // and web never runs the registration effect (IS_NATIVE), so the handler
  // itself needs no per-platform gating. Priority ladder:
  //   1. topmost useModalA11y modal → close it via the same popstate path
  //      the browser back button uses (the quit/leave confirms in 2–3 are
  //      handled separately: QuizEngine's is not on that stack)
  //   2. MP lobby/room → the same leave-room confirm as the wordmark click
  //      (the confirm IS on the a11y stack, so a second press dismisses it)
  //   3. mid-game → cancelable biq:hw-back event; QuizEngine claims it and
  //      runs its ← quit-confirm; engines without a confirm (Hot Streak,
  //      True/False, Footle, local play) leave it unclaimed → back out
  //      exactly like their ← buttons (goHome)
  //   4. sub-screens → mirror that screen's visible back target
  //   5. home screen on a non-home tab → Home tab
  //   6. Home/home → background the app (Android home-screen expectation)
  // The handler lives in a ref (mirrored every render, same idea as the
  // onCompleteRef pattern) so the one-shot listener registration below never
  // fires a stale screen/tab closure.
  const hwBackRef = useRef(null);
  useEffect(() => {
    hwBackRef.current = () => {
      if (closeTopModal()) return;
      if (screen === "online-stage1-lobby") { handleHomeClick(); return; }
      if (inGame || screen === "wordle" || screen === "trail" || screen === "mystery" || screen === "stadiums") {
        // dispatchEvent returns false when a listener preventDefault()ed —
        // i.e. the mounted engine claimed the press and owns the quit flow.
        let claimed = false;
        try { claimed = !window.dispatchEvent(new CustomEvent("biq:hw-back", { cancelable: true })); } catch {}
        if (!claimed) goHome();
        return;
      }
      if (screen === "blocked-users" || screen === "review") { setScreen("settings"); return; }
      // Review screens keep the current tab (their visible back only flips
      // screen), unlike goHome which would also reset the tab to home.
      if (screen === "daily-review" || screen === "puzzle-review") { setScreen("home"); return; }
      if (screen === "friend-profile") { closeFriendProfile(); return; }
      if (screen === "stump") { setStumpRow(null); goHome(); return; }
      if (screen === "online-stage1") { clearPendingJoin(); setOnlineAutoCreate(false); setPendingInviteFriendId(null); goHome(); setTab("online"); return; }
      if (screen !== "home") { goHome(); return; }
      if (tab !== "home") { setTab("home"); return; }
      CapApp.minimizeApp().catch(() => {});
    };
  });
  useEffect(() => {
    if (!IS_NATIVE) return;
    let handlePromise = CapApp.addListener("backButton", () => { try { hwBackRef.current?.(); } catch {} });
    return () => {
      Promise.resolve(handlePromise).then(h => h?.remove?.()).catch(() => {});
    };
  }, []);

  // The Classic difficulty sheet and its start handler retired 2026-09-06 (Alex:
  // "not sure we should have difficulty at all"). Classic is the easy→hard arc
  // the engine already builds; the difficulty preference stays in Settings.

  const playDailyForDate = useCallback(async (date) => {
    let qs;
    try {
      qs = await getDailyQsForDate(date);
    } catch (e) {
      console.warn('[playDailyForDate]', e?.message || e);
      showToast("⚠️ Couldn't load questions — check your connection");
      return;
    }
    if (!qs || qs.length === 0) { showToast("No questions available for that day"); return; }
    haptic("soft");
    setActiveDailyDate(date);
    setMode("daily");
    setCat("All");
    setQuestions(qs);
    setScreen("quiz");
  }, [showToast]);

  const viewDailyScore = useCallback((date, score) => {
    const ymd = dateToYMD(date);
    let wrongAnswers = [];
    let allAnswers = [];
    try {
      const raw = localStorage.getItem(`biq_daily_${ymd}`);
      if (raw) {
        const p = JSON.parse(raw);
        if (Array.isArray(p?.wrongAnswers)) wrongAnswers = p.wrongAnswers;
        if (Array.isArray(p?.allAnswers)) allAnswers = p.allAnswers;
      }
    } catch {}
    setDailyReviewState({ date, score, wrongAnswers, allAnswers });
    setScreen("daily-review");
  }, []);

  const viewPuzzleStatus = useCallback((ws) => {
    // Phase 5z — navigate to PuzzleReviewScreen instead of firing a thin
    // toast. Read the persisted guesses + status from biq_wordle_<ymd>;
    // localStorage is the read primary (Phase 5v hydrate writes the
    // synced value back on cross-device sign-in).
    if (ws?.kind !== "won" && ws?.kind !== "lost") return;
    const date = new Date();
    const ymd = dateToYMD(date);
    let guesses = [];
    let status = ws.kind;
    try {
      const raw = localStorage.getItem(`biq_wordle_${ymd}`);
      if (raw) {
        const p = JSON.parse(raw);
        if (Array.isArray(p?.guesses)) guesses = p.guesses;
        if (typeof p?.status === "string") status = p.status;
      }
    } catch {}
    setPuzzleReviewState({ date, guesses, status });
    setScreen("puzzle-review");
  }, []);

  return (
    <>
      <main className="app">
        {/* ⚠️ The app's ONLY <h1> was on the Login screen. Every other screen —
            Home, Daily, Profile, Settings, every game — opened with a styled
            <div>, so a screen reader's "jump to heading" found nothing and the
            document had no title at any level.

            Visually hidden rather than restyling the existing title divs:
            those carry mode-specific layout (the quiz title bar sits inside a
            flex row with the back button and the timer), and swapping their
            tag risks a visual regression on every mode at once for no
            additional benefit — a hidden h1 is a real heading in the
            accessibility tree, which is the whole point. Converting the
            visible titles is a follow-up, not a prerequisite. */}
        {screenTitle && <h1 className="sr-only">{screenTitle}</h1>}
        {/* Screen-change announcer. `polite` on purpose: a screen change is
            context, not an emergency, and `assertive` would cut across the
            timer region the quiz already owns. aria-atomic so the whole
            phrase is read rather than the diff. */}
        <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{srScreenMsg}</div>
        <div className="sbar" />

        {/* ── ONBOARDING — shown to first-time users only. Deep-link boots
            defer it (deferOnboarding) so the shared moment renders first;
            the gate returns on the next organic Home visit. ── */}
        {!hasOnboarded && !deferOnboarding && (
          <OnboardingScreen
            onDone={(startGame) => {
              setHasOnboarded(true);
              // They answered the sample question and pressed "Let's play", so
              // put them IN a game rather than in front of a menu. Footle is
              // the choice because it is where the habit forms (94% of players
              // reaching three active days got there through it) and because
              // it needs nobody else, unlike a room. Deferred a tick so the
              // onboarding unmount completes first.
              if (startGame === true) setTimeout(() => { try { setScreen("wordle"); } catch { /* stay on home */ } }, 0);
              // The component has already written biq_onboarded + any chosen fav_club / skill_level.
              // Pull through the new default difficulty so it takes effect immediately.
              try {
                const raw = localStorage.getItem("biq_settings");
                if (raw) {
                  const s = JSON.parse(raw);
                  setSettings(prev => ({ ...prev, ...s }));
                  if (s.defaultDiff) setDiff(s.defaultDiff === "med" ? "medium" : s.defaultDiff);
                }
              } catch {}
            }}
          />
        )}

        {(hasOnboarded || deferOnboarding) && <>
        {/* Feature E: one-time username confirmation after a new social
            sign-up. Overlays the app (z-index 500) until the user commits a
            name; shown only once onboarding is complete so the two full-screen
            steps don't stack. */}
        {needsUsername && authProfile && (
          <UsernameSetupModal
            user={user}
            authProfile={authProfile}
            onEvent={loopEvent}
            onSaved={(name) => {
              setProfile(p => ({ ...(p || {}), name }));
              try { localStorage.removeItem('biq_needs_username'); } catch {}
              setNeedsUsername(false);
              // ⚠️ THE WALL THIS FUNNEL EXISTS TO WATCH. It is mandatory and
              // non-dismissible, it pre-fills the provider's real name, and it
              // spent eight weeks rejecting its own suggestion for containing
              // a space — the five-star sign-up blocker. `username-step-*`
              // already measures the step itself; this records that the
              // ACCOUNT got past it, which is the part that joins to the 79.
              markAcctStep(user?.id, 'acct-username', loopEvent);
            }}
          />
        )}
        {/* BiqNav (desktop rail) renders during games too now — the handoff
            keeps the rail visible mid-quiz (active="none"). It's CSS-gated to
            >=1024 (display:none on mobile/PWA/native), so this is desktop-only;
            `active` is nulled mid-game so no tab highlights. */}
        {/* THE WEB SHELL (2026-09-03): in a browser tab the app sits under the
            website's own header — wordmark, sections, the club finder — with
            its tabs as a slim bar beneath. The sidebar and the floating tab
            bar are native/PWA furniture and render only there. */}
        {/* Not during a game (review 2026-09-06, A2): the site header + tab strip
            stayed live over a running quiz on the web — a tap on "Daily" left a
            live round with no confirm, and ~110px of a phone viewport was
            chrome while a clock ran. Native hides its bar in-game; so does this. */}
        {isWebBrowser && !inGame && (
          <>
            <SiteHeader signedIn={!!user && !isGuest} onProfile={() => { setScreen("home"); setTab("profile"); }} />
            <AppBar
              tab={tab}
              active={inGame || screen === "results" ? null : screen === "settings" ? "settings" : tab}
              setTab={setTab}
              setScreen={setScreen}
              dailyDone={dailyDone}
              notifCount={notifCount}
              onOpenNotifs={user ? openNotifs : undefined}
            />
          </>
        )}
        {!isWebBrowser && <BiqNav
          onHomeClick={handleHomeClick}
          tab={tab}
          active={inGame || screen === "results" ? null : screen === "settings" ? "settings" : tab}
          setTab={setTab}
          setScreen={setScreen}
          dailyDone={dailyDone}
          showToast={showToast}
          notifCount={notifCount}
          onOpenNotifs={user ? openNotifs : undefined}
        />}
        {!isWebBrowser && !inGame && !(screen === "home" && tab === "home") && (
          <div className="hdr">
            {/* 1.1: drop the wordmark on the main tabbed view (screen==="home")
                — on a tab-bar app the app name on its own home is redundant, and
                the personalised greeting now owns the top. Settings has its own
                header; other sub-screens keep the brand mark as a home anchor. */}
            {/* Hide the global wordmark on screens that already have their own
                page-header — it just stacks a second identifier above the real
                one. The "broader sub-screen audit" this comment used to defer
                was DONE 2026-07-29: every `screen` value was enumerated against
                the ones that render their own header, which caught `trail`,
                `league-quiz` and `stump`. League Quizzes was the giveaway —
                a direct sibling of club-quiz, which was already excluded. */}
            {/* ⚠️ A NEW MODE MUST BE ADDED HERE. `stadiums` shipped after the
                2026-07-29 enumeration and stacked "Ball IQ" above its own
                "Name the Stadium" header on every phone (player-reported
                2026-08-21). The list is the contract: if your screen draws its
                own title, it belongs in it. */}
            {!["settings", "home", "online-stage1", "online-stage1-lobby", "club-quiz", "results", "local-setup", "local-results", "wordle", "trail", "mystery", "stadiums", "league-quiz", "stump", "daily-review", "puzzle-review", "review", "blocked-users", "friend-profile"].includes(screen) && (
              <button
                className="logo"
                onClick={handleHomeClick}
                style={{ background: "none", border: "none", padding: 0, font: "inherit", color: "inherit", cursor: "pointer" }}
                aria-label="Home"
              >
                Ball <em>IQ</em>
              </button>
            )}
            {screen === "home" && (
              <div className="hdr-actions" style={{marginLeft:"auto",display:"flex",gap:8}}>
                {user && <NotifBell count={notifCount} onClick={openNotifs} className="icon-btn hdr-ic" />}
                <button className="icon-btn hdr-ic" aria-label="Settings" onClick={() => setScreen("settings")}><Settings size={18} strokeWidth={2.25} aria-hidden="true" /></button>
              </div>
            )}
          </div>
        )}

        {/* Global toasts */}
        {toast && <div className="toast" role="status" aria-live="polite">{toast}</div>}

        {/* The first-session tip card left the home on 2026-09-06 (critique: the
            first block on the screen had no action but a ✕, and it said "start
            with Footle" above two blocks that said "start with your club"). The
            same flag now reaches HomeScreen as `firstSession`, and the Footle row
            itself reads "Start here". Cleared where it always was — when any
            game starts (see startMode). */}
        {/* Rate prompt */}
        {askShareName && (
          <div style={{position:"fixed",top:0,right:0,bottom:0,left:0,inset:0,background:"rgba(0,0,0,0.75)",zIndex:998,display:"flex",alignItems:"flex-end",animation:"fadeIn 0.2s ease"}} onClick={() => submitShareName("")}>
            <div ref={shareNameRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Add your name to the challenge" style={{width:"100%",maxHeight:"85vh",overflowY:"auto",WebkitOverflowScrolling:"touch",background:"var(--bg)",borderRadius:"20px 20px 0 0",padding:"28px 24px calc(40px + env(safe-area-inset-bottom, 34px))",textAlign:"center",animation:"slideUp 0.3s cubic-bezier(0.22,1,0.36,1)"}} onClick={e => e.stopPropagation()}>
              <div style={{fontSize:44,marginBottom:10}}>⚽</div>
              <div style={{fontSize:20,fontWeight:900,marginBottom:8,color:"var(--t1)"}}>Who should we say it&apos;s from?</div>
              <div style={{fontSize:14,color:"var(--t2)",lineHeight:1.6,marginBottom:20}}>
                Your friends see <b style={{color:"var(--t1)"}}>&ldquo;beat my {dailyScore || 0}/7&rdquo;</b> with your name on it.
              </div>
              <form onSubmit={e => { e.preventDefault(); submitShareName(shareNameDraft); }}>
                <input
                  autoFocus
                  value={shareNameDraft}
                  onChange={e => setShareNameDraft(e.target.value)}
                  maxLength={22}
                  placeholder="First name"
                  aria-label="Your name"
                  enterKeyHint="send"
                  autoComplete="given-name"
                  style={{width:"100%",padding:"14px 16px",fontSize:16,borderRadius:12,border:"1px solid var(--line)",background:"var(--c2)",color:"var(--t1)",fontFamily:"inherit",marginBottom:14,textAlign:"center"}}
                />
                <button className="btn btn-p" type="submit" style={{marginBottom:10}}>Share challenge</button>
              </form>
              <button className="btn btn-s" type="button" onClick={() => submitShareName("")}>Share without a name</button>
            </div>
          </div>
        )}
        {showRatePrompt && (
          <div style={{position:"fixed",top:0,right:0,bottom:0,left:0,inset:0,background:"rgba(0,0,0,0.75)",zIndex:998,display:"flex",alignItems:"flex-end",animation:"fadeIn 0.3s ease"}} onClick={() => { loopEvent("rate-prompt-dismissed", { view: rateView, how: "backdrop" }); setShowRatePrompt(false); }}>
            <div ref={ratePromptRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Rate Ball IQ" style={{width:"100%",maxHeight:"85vh",overflowY:"auto",WebkitOverflowScrolling:"touch",background:"var(--bg)",borderRadius:"20px 20px 0 0",padding:"28px 24px calc(48px + env(safe-area-inset-bottom, 34px))",textAlign:"center"}} onClick={e => e.stopPropagation()}>
              {rateView === "ask" ? (
                <>
                  <div style={{fontSize:48,marginBottom:12}}>⚽</div>
                  <div style={{fontSize:20,fontWeight:900,marginBottom:8,color:"var(--t1)"}}>Enjoying {APP_NAME}?</div>
                  <div style={{fontSize:14,color:"var(--t2)",lineHeight:1.7,marginBottom:24}}>We'd love to know how it's going for you.</div>
                  <button className="btn btn-p" style={{marginBottom:10}} onClick={() => { loopEvent("rate-prompt-loving"); setRateView("store"); }}>Loving it! 😄</button>
                  <button className="btn btn-s" onClick={() => {
                    loopEvent("rate-prompt-not-really");
                    setShowRatePrompt(false);
                    try { window.location.href = `mailto:hello@balliq.app?subject=${encodeURIComponent(APP_NAME + " feedback")}&body=${encodeURIComponent("What could be better?\n\n")}`; } catch {}
                    showToast("Thanks — tell us what we can fix 🙏");
                  }}>Not really</button>
                </>
              ) : (
                <>
                  <div style={{width:56,height:56,margin:"0 auto 12px",borderRadius:16,background:"rgba(255,193,7,0.14)",border:"1px solid rgba(255,193,7,0.3)",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--gold)"}}><Star size={26} strokeWidth={2.25} aria-hidden="true" /></div>
                  <div style={{fontSize:20,fontWeight:900,marginBottom:8,color:"var(--t1)"}}>Glad you're enjoying it!</div>
                  <div style={{fontSize:14,color:"var(--t2)",lineHeight:1.7,marginBottom:24}}>A quick rating helps other football fans find the app — and takes just 5 seconds!</div>
                  <button className="btn btn-p" style={{marginBottom:10}} onClick={() => {
                    setShowRatePrompt(false);
                    const ua = navigator.userAgent || "";
                    if (/iPhone|iPad|iPod|Macintosh/i.test(ua)) {
                      loopEvent("rate-store-tap", { store: "apple" });
                      window.open(`${appStoreUrl()}?action=write-review`, "_blank");
                    } else if (/Android/i.test(ua)) {
                      loopEvent("rate-store-tap", { store: "play" });
                      window.open(PLAY_STORE_URL, "_blank");
                    } else {
                      // ⚠️ Counted as a DIFFERENT outcome. A desktop visitor who
                      // taps through reaches a toast, not a store — grouping it
                      // with the real taps would inflate the only conversion
                      // number this funnel has.
                      loopEvent("rate-store-unreachable", { store: "none" });
                      showToast(`⭐ Search '${APP_NAME}' on the App Store or Google Play`);
                    }
                  }}>Rate {APP_NAME} ⭐</button>
                  <button className="btn btn-s" onClick={() => { loopEvent("rate-prompt-dismissed", { view: "store", how: "maybe-later" }); setShowRatePrompt(false); }}>Maybe later</button>
                </>
              )}
            </div>
          </div>
        )}
        {howToPlay && (
          <div style={{position:"fixed",top:0,right:0,bottom:0,left:0,inset:0,background:"rgba(0,0,0,0.75)",zIndex:998,display:"flex",alignItems:"flex-end",animation:"fadeIn 0.2s ease"}} onClick={() => setHowToPlay(null)}>
            <div ref={howToPlayRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={HOW_TO_PLAY[howToPlay]?.title || "How to play"} style={{width:"100%",maxHeight:"85vh",overflowY:"auto",WebkitOverflowScrolling:"touch",background:"var(--bg)",borderRadius:"20px 20px 0 0",padding:"24px 20px calc(40px + env(safe-area-inset-bottom, 34px))",animation:"slideUp 0.3s cubic-bezier(0.22,1,0.36,1)"}} onClick={e => e.stopPropagation()}>
              <div style={{fontSize:18,fontWeight:800,marginBottom:16,color:"var(--t1)"}}>{HOW_TO_PLAY[howToPlay]?.title}</div>
              {HOW_TO_PLAY[howToPlay]?.steps.map((step, i) => (
                <div key={i} style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:12}}>
                  <div style={{width:24,height:24,borderRadius:"50%",background:"var(--accent)",color:"#0a1a00",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,flexShrink:0}}>{i+1}</div>
                  <div style={{fontSize:14,color:"var(--t2)",lineHeight:1.5}}>{step}</div>
                </div>
              ))}
              <button onClick={() => setHowToPlay(null)} style={{width:"100%",padding:"14px",background:"var(--s2)",border:"none",borderRadius:14,fontSize:15,fontWeight:700,color:"var(--t1)",marginTop:8,cursor:"pointer"}}>Got it ✓</button>
            </div>
          </div>
        )}

        {pendingLeaveRoom && (
          <div
            style={{position:"fixed",top:0,right:0,bottom:0,left:0,inset:0,background:"rgba(0,0,0,0.78)",zIndex:1000,display:"flex",alignItems:"flex-end",justifyContent:"center",animation:"fadeIn 0.2s ease"}}
            onClick={() => setPendingLeaveRoom(null)}
          >
            <div
              ref={leaveRoomModalRef}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-label="Leave room confirmation"
              style={{width:"100%",maxWidth:480,maxHeight:"85vh",overflowY:"auto",WebkitOverflowScrolling:"touch",background:"var(--bg)",borderTop:"1px solid var(--border)",borderRadius:"22px 22px 0 0",padding:"22px 22px 28px",animation:"slideUp 0.3s cubic-bezier(0.22,1,0.36,1)"}}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{fontSize:18,fontWeight:800,color:"var(--text)",marginBottom:8}}>Leave the room?</div>
              <div style={{fontSize:14,color:"var(--t2)",lineHeight:1.5,marginBottom:18}}>You'll exit the multiplayer lobby and return to home. Other players will see you leave.</div>
              <button
                onClick={() => { const cb = pendingLeaveRoom?.onConfirm; setPendingLeaveRoom(null); cb?.(); }}
                style={{width:"100%",padding:14,background:"var(--red)",color:"#fff",border:"none",borderRadius:12,fontFamily:"inherit",fontSize:15,fontWeight:800,cursor:"pointer",marginBottom:8,WebkitTextFillColor:"#fff"}}
              >
                Leave room
              </button>
              <button
                onClick={() => setPendingLeaveRoom(null)}
                style={{width:"100%",padding:14,background:"var(--s2)",color:"var(--text)",border:"1px solid var(--border)",borderRadius:12,fontFamily:"inherit",fontSize:15,fontWeight:700,cursor:"pointer"}}
              >
                Stay
              </button>
            </div>
          </div>
        )}

        {/* opportunity-scan #9: async-challenge head-to-head result. Replaces
            the old ~2s toast — the "Send it back" re-share is the viral step,
            so the outcome needs a persistent surface with a share CTA. */}
        {challengeIntroOpen && (
          <div
            style={{position:"fixed",top:0,right:0,bottom:0,left:0,inset:0,background:"rgba(0,0,0,0.78)",zIndex:1000,display:"flex",alignItems:"flex-end",justifyContent:"center",animation:"fadeIn 0.2s ease"}}
            onClick={closeChallengeIntro}
          >
            <div
              ref={challengeIntroRef}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-label="Daily 7 challenge"
              style={{width:"100%",maxWidth:480,maxHeight:"85vh",overflowY:"auto",WebkitOverflowScrolling:"touch",background:"var(--bg)",borderTop:"1px solid var(--border)",borderRadius:"22px 22px 0 0",padding:"22px 22px calc(28px + env(safe-area-inset-bottom, 0px))",textAlign:"center",animation:"slideUp 0.3s cubic-bezier(0.22,1,0.36,1)"}}
              onClick={(e) => e.stopPropagation()}
            >
              <div aria-hidden="true" style={{width:56,height:56,borderRadius:16,margin:"0 auto 12px",display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(88,204,2,0.14)",border:"1px solid rgba(88,204,2,0.30)"}}>
                <Trophy size={26} strokeWidth={2.25} color="#58CC02" />
              </div>
              <div style={{fontSize:20,fontWeight:900,color:"var(--t1)",marginBottom:6}}>
                {pendingChallenge.name ? `${pendingChallenge.name} scored ${pendingChallenge.score}/7` : `A friend scored ${pendingChallenge.score}/7`}
              </div>
              <div style={{fontSize:14,color:"var(--t2)",lineHeight:1.5,marginBottom:20}}>
                {challengeDayOffset(pendingChallenge.date) === 0
                  ? "Same day, same 7 questions. Beat that score and it's settled."
                  : "That was yesterday's Daily 7 — play today's and settle it."}
              </div>
              <button
                onClick={() => { closeChallengeIntro(); playDaily(); }}
                style={{width:"100%",minHeight:50,padding:"14px",background:"var(--accent)",color:"var(--grn-ink)",border:"none",borderRadius:14,boxShadow:"0 10px 26px -8px rgba(88,204,2,0.55)",fontFamily:"inherit",fontSize:16,fontWeight:800,cursor:"pointer",WebkitTextFillColor:"#0a1a00"}}
              >
                Play the Daily 7
              </button>
              <button
                onClick={closeChallengeIntro}
                style={{marginTop:12,background:"none",border:"none",color:"var(--t3)",fontFamily:"inherit",fontSize:13.5,fontWeight:700,cursor:"pointer",padding:"8px"}}
              >
                Not now
              </button>
            </div>
          </div>
        )}
        {challengeResult && (
          <div
            style={{position:"fixed",top:0,right:0,bottom:0,left:0,inset:0,background:"rgba(0,0,0,0.78)",zIndex:1000,display:"flex",alignItems:"flex-end",justifyContent:"center",animation:"fadeIn 0.2s ease"}}
            onClick={() => setChallengeResult(null)}
          >
            <div
              ref={challengeResultRef}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-label="Challenge result"
              style={{width:"100%",maxWidth:480,maxHeight:"85vh",overflowY:"auto",WebkitOverflowScrolling:"touch",background:"var(--bg)",borderTop:"1px solid var(--border)",borderRadius:"22px 22px 0 0",padding:"22px 22px calc(28px + env(safe-area-inset-bottom, 0px))",textAlign:"center",animation:"slideUp 0.3s cubic-bezier(0.22,1,0.36,1)"}}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{fontSize:44,marginBottom:8}} aria-hidden="true">
                {challengeResult.mine > challengeResult.theirs ? "🏆" : challengeResult.mine === challengeResult.theirs ? "🤝" : "😤"}
              </div>
              <div style={{fontSize:20,fontWeight:900,color:"var(--t1)",marginBottom:16}}>
                {challengeResult.mine > challengeResult.theirs ? `You beat ${challengeResult.name || "your friend"}!`
                  : challengeResult.mine === challengeResult.theirs ? `Level with ${challengeResult.name || "your friend"}`
                  : `${challengeResult.name || "Your friend"} takes this one`}
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:20}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 14px",background:"var(--s2)",border:"1px solid var(--border)",borderRadius:12}}>
                  <span style={{fontSize:14,fontWeight:700,color:"var(--t1)"}}>You</span>
                  <span style={{fontSize:16,fontWeight:900,color:"var(--t1)"}}>{challengeResult.mine}/7</span>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 14px",background:"var(--s2)",border:"1px solid var(--border)",borderRadius:12}}>
                  <span style={{fontSize:14,fontWeight:700,color:"var(--t2)"}}>
                    {challengeResult.name || "Your friend"}{challengeResult.yesterday ? " (yesterday's score)" : ""}
                  </span>
                  <span style={{fontSize:16,fontWeight:900,color:"var(--t2)"}}>{challengeResult.theirs}/7</span>
                </div>
              </div>
              <button
                onClick={() => { setChallengeResult(null); shareDaily(); }}
                style={{width:"100%",padding:14,background:"var(--accent)",color:"var(--grn-ink)",border:"none",borderRadius:999,boxShadow:"0 8px 22px -8px rgba(88,204,2,0.55)",fontFamily:"inherit",fontSize:15,fontWeight:800,cursor:"pointer",marginBottom:8,WebkitTextFillColor:"#0a1a00"}}
              >
                Send it back 🔁
              </button>
              <button
                onClick={() => setChallengeResult(null)}
                style={{width:"100%",padding:14,background:"var(--s2)",color:"var(--text)",border:"1px solid var(--border)",borderRadius:12,fontFamily:"inherit",fontSize:15,fontWeight:700,cursor:"pointer"}}
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* 1.1: streak-milestone confetti (7/30/100-day). Top-level so it
            layers over Home where the milestone toast appears. */}
        {milestoneConfetti && <Confetti />}

        {/* 1.1: soft notification pre-prompt — shown after a positive daily
            completion (or first 3-day streak) before spending the one-shot iOS
            permission prompt. "Yes" routes through the same enable path as the
            Settings toggle. */}
        {levelUpOverlay && (
          <div style={{position:"fixed",top:0,right:0,bottom:0,left:0,inset:0,background:"rgba(0,0,0,0.85)",zIndex:999,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",animation:"fadeIn 0.3s ease"}}>
            <Confetti />
            <div style={{textAlign:"center",padding:"0 32px"}}>
              <div style={{marginBottom:16,animation:"iconPop 0.6s cubic-bezier(0.34,1.56,0.64,1)",display:"flex",justifyContent:"center"}}>
                {levelUpOverlay.Icon && <levelUpOverlay.Icon size={80} strokeWidth={1.6} color="var(--gold)" />}
              </div>
              <div style={{fontSize:14,color:"var(--gold)",fontWeight:700,letterSpacing:0.3,marginBottom:8}}>Level Up!</div>
              <div style={{fontSize:32,fontWeight:900,color:"#fff",letterSpacing:"-0.5px",marginBottom:12}}>{levelUpOverlay.name}</div>
              <div style={{fontSize:14,color:"rgba(255,255,255,0.6)"}}>Keep playing to reach the next level</div>
            </div>
            <button onClick={() => setLevelUpOverlay(null)} style={{marginTop:40,padding:"12px 32px",background:"var(--accent)",color:"var(--grn-ink)",border:"none",borderRadius:999,boxShadow:"0 8px 22px -8px rgba(88,204,2,0.55)",fontSize:15,fontWeight:700,cursor:"pointer"}}>Let's Go ⚽</button>
          </div>
        )}
        {streakToast && <div className="streak-toast" role="status" aria-live="polite"><span>🔥</span><span><strong>{streakToast} day streak!</strong> Keep it up</span></div>}

        {/* ── PLAY WITH FRIENDS SHEET ── */}
        {showFriendsPicker && (
          <div className="diff-overlay" onClick={() => setShowFriendsPicker(false)}>
            <div ref={friendsPickerRef} tabIndex={-1} className="diff-sheet" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
              <div className="diff-sheet-title">Play with Friends</div>
              <div className="diff-sheet-sub">Who's joining?</div>
              <div className="diff-options">
                <button
                  className="diff-option"
                  onClick={() => {
                    setShowFriendsPicker(false);
                    // Multiplayer requires a real account — guests have no
                    // user.id to host or join rooms.
                    if (!user || isGuest) {
                      openAuthPrompt("online");
                      return;
                    }
                    setScreen("online-stage1");
                  }}
                >
                  <span className="diff-option-icon">🌐</span>
                  <div className="diff-option-body">
                    <div className="diff-option-name">Online Multiplayer</div>
                    <div className="diff-option-desc">Real-time with up to 3 friends</div>
                  </div>
                </button>
                <button
                  className="diff-option diff-option-local"
                  onClick={() => { setShowFriendsPicker(false); startMode("local"); }}
                >
                  <span className="diff-option-icon">🤝</span>
                  <div className="diff-option-body">
                    <div className="diff-option-name">Local Multiplayer</div>
                    <div className="diff-option-desc">Pass the phone, same room</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── HOME TAB ── */}
        {/* Home-screen tabs are always mounted together and toggled via display
            so React doesn't pay the remount cost on each tab switch and per-tab
            state (calendar viewDate, profile emoji picker etc.) is preserved.
            Sprint #17 Stage 3 extracted Home into ./screens/HomeScreen.jsx. */}
        {!inGame && screen === "home" && (
          <div className="tab-pane" style={tab === "home" ? undefined : HIDDEN_STYLE}>
            <TabErrorBoundary name="home">
            <HomeScreen
              profile={profile}
              loginStreak={loginStreak}
              streakPulsing={streakPulsing}
              bestLoginStreak={bestLoginStreak}
              stats={stats}
              xp={xp}
              dailyHistory={dailyHistory}
              dailyDone={dailyDone}
              dailyScore={dailyScore}
              setTab={setTab}
              setNameEditNonce={setNameEditNonce}
              setScreen={setScreen}
              showToast={showToast}
              viewPuzzleStatus={viewPuzzleStatus}
              viewDailyScore={viewDailyScore}
              startMode={startMode}
              shareCard={shareCard}
              challenge={(pendingChallenge && challengeDayOffset(pendingChallenge.date) <= 1 && !dailyDone) ? pendingChallenge : null}
              onPlayChallenge={playDaily}
              onDismissChallenge={clearChallenge}
              setOnlineAutoCreate={setOnlineAutoCreate}
              notifCount={notifCount}
              onOpenNotifs={user ? openNotifs : undefined}
              clubPacks={CLUB_PACKS}
              clubAbbr={CLUB_ABBR}
              launchClubQuiz={launchClubQuiz}
              firstSession={showFirstQuizTip}
            />
            </TabErrorBoundary>
          </div>
        )}

        {/* ── DAILY TAB ── */}
        {!inGame && screen === "home" && (
          <div className="tab-pane" style={tab === "daily" ? undefined : HIDDEN_STYLE}>
            <TabErrorBoundary name="daily">
            {/* RESOLVED 2026-08-14 (Alex's call, as the note here asked for).
                The two flames disagreed because loginStreak counted OPENS while
                Daily counted PLAYS. Rather than downgrade Daily, the trigger
                moved: tickLoginStreak now fires from `biq:daily-completed`, so
                loginStreak IS the play streak and one number feeds both. */}
            <DailyTabScreen
              loginStreak={loginStreak}
              bestLoginStreak={bestLoginStreak}
              streakRepair={streakRepair}
              playArchive={playArchive}
              profile={profile}
              xp={xp}
              shieldCount={shieldCount}
              dailyHistory={dailyHistory}
              startMode={startMode}
              setScreen={setScreen}
              dailyDone={dailyDone}
              dailyScore={dailyScore}
              playDailyForDate={playDailyForDate}
            />
            </TabErrorBoundary>
          </div>
        )}

        {/* ── ONLINE TAB ── */}
        {!inGame && screen === "home" && (
          <div className="tab-pane" style={tab === "online" ? undefined : HIDDEN_STYLE}>
            <TabErrorBoundary name="online">
            <OnlineHubTab
              needsAccount={!user || isGuest}
              startMode={startMode}
              setOnlineAutoCreate={setOnlineAutoCreate}
              onChallenge={challengeFriend}
              onJoinCode={hubJoinRoom}
              displayName={(() => {
                const isDef = (nm) => !nm || nm === "Player" || /^player_/i.test(nm);
                if (authProfile?.username && !isDef(authProfile.username)) return authProfile.username;
                if (profile.name && !isDef(profile.name)) return profile.name;
                return "You";
              })()}
              avatarUrl={authProfile?.avatar_url}
              avatarId={authProfile?.avatar_id || profile?.avatar || ""}
            />
            </TabErrorBoundary>
          </div>
        )}

        {/* ── PROFILE TAB ── */}
        {!inGame && screen === "home" && (
          <div className="tab-pane" style={tab === "profile" ? undefined : HIDDEN_STYLE}>
            <TabErrorBoundary name="profile">
            <React.Suspense fallback={<ScreenLoading label="Loading profile" />}>
              <ProfileScreen profile={profile} setProfile={setProfile} stats={stats} xp={xp} loginStreak={loginStreak} bestLoginStreak={bestLoginStreak} level={levelInfo.level} earnedBadges={earnedBadges} onShareProfile={shareProfile} onSaveCard={saveCardImage} onToast={showToast} onChallenge={challengeFriend} onOpenFriend={openFriendProfile} onPlayDaily={playDaily} nameEditNonce={nameEditNonce} isActiveTab={tab === "profile"} />
            </React.Suspense>
            </TabErrorBoundary>
          </div>
        )}

        {/* ── SETTINGS SCREEN ── */}
        {!inGame && screen === "settings" && <SettingsScreen settings={settings} onUpdate={updateSettings} onClearStats={clearStats} onClearSeen={clearSeen} onBack={goHome} onShowPrivacy={openPrivacy} onShowHelp={openHelp} onShowKnownIssues={openKnownIssues} onAccountDeleted={onAccountDeleted} onOpenReview={() => setScreen("review")} onShowBlocked={() => setScreen("blocked-users")} notifEnabled={notifEnabled} onToggleNotif={handleToggleNotif} notifSupported={notificationsSupported()} notifBlocked={notifBlocked} webPushOn={webPushOn} onToggleWebPush={handleToggleWebPush} webPushAvailable={webPushSupported()} webPushBlocked={webPushPermission() === "denied"} />}
        {!inGame && screen === "blocked-users" && (
          <TabErrorBoundary name="blocked-users" onExit={() => setScreen("settings")}>
          <React.Suspense fallback={<ScreenLoading label="Loading" />}>
            <BlockedUsersScreen onBack={() => setScreen("settings")} onToast={showToast} />
          </React.Suspense>
          </TabErrorBoundary>
        )}

        {/* ── QUESTION-BANK REVIEW (gated) ── */}
        {!inGame && screen === "review" && (
          <TabErrorBoundary name="review" onExit={() => setScreen("settings")}>
          <React.Suspense fallback={<ScreenLoading label="Loading review" />}>
            <ReviewScreen onBack={() => setScreen("settings")} />
          </React.Suspense>
          </TabErrorBoundary>
        )}
        {!inGame && screen === "daily-review" && dailyReviewState && (
          <DailyReviewScreen
            date={dailyReviewState.date}
            score={dailyReviewState.score}
            wrongAnswers={dailyReviewState.wrongAnswers}
            allAnswers={dailyReviewState.allAnswers}
            dailyHistory={dailyHistory}
            loginStreak={loginStreak}
            onBack={() => setScreen("home")}
          />
        )}
        {!inGame && screen === "puzzle-review" && puzzleReviewState && (
          <PuzzleReviewScreen
            date={puzzleReviewState.date}
            guesses={puzzleReviewState.guesses}
            status={puzzleReviewState.status}
            onBack={() => setScreen("home")}
          />
        )}
        {!inGame && screen === "friend-profile" && viewingFriendId && (
          <TabErrorBoundary name="friend-profile" onExit={closeFriendProfile}>
          <React.Suspense fallback={<ScreenLoading label="Loading profile" />}>
            <FriendProfileScreen
              friendId={viewingFriendId}
              onBack={closeFriendProfile}
              onChallenge={challengeFriend}
              onToast={showToast}
            />
          </React.Suspense>
          </TabErrorBoundary>
        )}

        {/* Report-reason sheet — opened by reportQuestion, resolves the send.
            Rendered at app level because every mode's report button funnels
            into the same sink. */}
        {reportPending && (
          <ReportReasonSheet
            onPick={(reason) => sendQuestionReport(reportPending, reason)}
            onSkip={() => sendQuestionReport(reportPending, null)}
          />
        )}

        {/* ── PRIVACY POLICY (in-app overlay) ── */}
        {showPrivacy && <PrivacyScreen onClose={closePrivacy} />}
        {showHelp && <HelpScreen onClose={closeHelp} />}
        {showKnownIssues && <KnownIssuesScreen onClose={closeKnownIssues} />}

        {/* Challenge "open in app" nudge — iOS-web only, dismissible top banner.
            Shows when a friend's Daily 7 challenge is pending; deep-links into
            the installed app (which parses /c/ on the live binary) for people
            who have it, while the web challenge stays playable for those who
            don't. See challengeAppNudgeDismissed comment for the why. */}
        {IS_IOS_WEB && pendingChallenge && !challengeAppNudgeDismissed && (
          <div style={{position:"fixed",top:0,left:0,right:0,zIndex:1090,display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"var(--accent)",boxShadow:"0 2px 10px rgba(0,0,0,0.25)",animation:"fadeIn 0.2s ease"}}>
            <span style={{fontSize:20}} aria-hidden="true">🎯</span>
            <div style={{flex:1,fontSize:13,fontWeight:700,color:"#0a1a00",lineHeight:1.3}}>
              {pendingChallenge.name ? `${pendingChallenge.name} challenged you` : "You've got a Daily 7 challenge"} — open it in the app
            </div>
            <button
              onClick={() => {
                try {
                  const c = pendingChallenge;
                  const str = `${c.score}.${c.date}${c.name ? "." + encodeURIComponent(c.name) : ""}`;
                  window.location.href = `app.balliq://balliq.app/c/${str}`;
                } catch {}
              }}
              style={{flexShrink:0,padding:"7px 14px",background:"#0a1a00",color:"var(--accent)",border:"none",borderRadius:9,fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:"pointer"}}
            >
              Open
            </button>
            <button
              onClick={() => setChallengeAppNudgeDismissed(true)}
              aria-label="Dismiss"
              style={{flexShrink:0,width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",background:"transparent",color:"#0a1a00",border:"none",fontSize:18,fontWeight:700,cursor:"pointer"}}
            >
              ×
            </button>
          </div>
        )}

        {/* Shared-invite gate: someone tapped a balliq.app/?join=CODE link
            but they're either signed-out or browsing as a guest. Prompt them
            to sign in; pendingJoinCode persists in localStorage so the
            autoJoinRoutedRef effect picks it up after auth completes. */}
        {/* Never over a live game (review 2026-09-06, A1): the gate waits until
            the player is back on a tab, where the invite is the only thing. */}
        {pendingJoinCode && (!user || isGuest) && !inGame && (
          <div
            style={{position:"fixed",top:0,right:0,bottom:0,left:0,inset:0,background:"rgba(0,0,0,0.78)",zIndex:1100,display:"flex",alignItems:"center",justifyContent:"center",padding:24,animation:"fadeIn 0.2s ease"}}
            onClick={clearPendingJoin}
          >
            <div
              ref={joinGateRef}
              tabIndex={-1}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              style={{width:"100%",maxWidth:360,background:"var(--bg)",border:"1px solid var(--border)",borderRadius:18,padding:"26px 22px",textAlign:"center"}}
            >
              {/* Gamepad2 was ALREADY imported in this file while this modal
                  rendered the emoji version of the same idea. */}
              <div aria-hidden="true" style={{width:56,height:56,borderRadius:16,margin:"0 auto 12px",display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(88,204,2,0.14)",border:"1px solid rgba(88,204,2,0.30)"}}>
                <Gamepad2 size={26} strokeWidth={2.25} color="#58CC02" />
              </div>
              <div style={{fontSize:18,fontWeight:900,color:"var(--t1)",marginBottom:6}}>Join the game</div>
              <div style={{fontSize:13,color:"var(--t2)",lineHeight:1.5,marginBottom:18}}>Your friend's invite code <strong style={{color:"var(--accent)",fontFamily:"'JetBrains Mono','SF Mono',ui-monospace,Menlo,monospace"}}>{pendingJoinCode}</strong> is ready. We'll drop you straight into the room as soon as you're signed in.</div>
              {/* Social in-app webviews (Snapchat/IG/Threads) are a separate,
                  always-logged-out browser AND swallow Universal Links — so
                  users who ARE logged into the installed app hit this gate
                  (task #22, Alex repro 2026-07-17). Custom schemes DO escape
                  those webviews. The scheme URL keeps `balliq.app` as its
                  hostname because the live binary's appUrlOpen parser
                  (tryCapture) hostname-checks before extracting the code —
                  this exact shape deep-links code-intact on build 43+ with
                  no native change. Silent no-op if the app isn't installed,
                  so the sign-in path below stays available. */}
              {IS_IOS_WEB && (
                <button
                  onClick={() => { try { window.location.href = `app.balliq://balliq.app/join/${pendingJoinCode}`; } catch {} }}
                  style={{width:"100%",padding:14,background:"var(--accent)",color:"var(--grn-ink)",border:"none",borderRadius:999,boxShadow:"0 8px 22px -8px rgba(88,204,2,0.55)",fontFamily:"inherit",fontSize:15,fontWeight:800,cursor:"pointer",WebkitTextFillColor:"#0a1a00",marginBottom:8}}
                >
                  📲 Got the app? Open it there
                </button>
              )}
              {/* v1.6 guest entry — the invite loop's biggest leak was this
                  modal demanding an account. Anonymous sign-in drops the
                  friend straight into the room; primary everywhere except
                  iOS web, where "open the app" keeps top billing (the app
                  user is already signed in there). */}
              <button
                onClick={handleGuestJoin}
                disabled={guestJoining}
                style={IS_IOS_WEB
                  ? {width:"100%",padding:12,background:"var(--s2)",color:"var(--text)",border:"1px solid var(--border)",borderRadius:999,boxShadow:"0 8px 22px -8px rgba(88,204,2,0.55)",fontFamily:"inherit",fontSize:14,fontWeight:700,cursor:"pointer",marginBottom:8,opacity:guestJoining?0.6:1}
                  : {width:"100%",padding:14,background:"var(--accent)",color:"var(--grn-ink)",border:"none",borderRadius:12,fontFamily:"inherit",fontSize:15,fontWeight:800,cursor:"pointer",WebkitTextFillColor:"#0a1a00",marginBottom:8,opacity:guestJoining?0.6:1}}
              >
                {guestJoining ? "Joining…" : <><Zap size={16} strokeWidth={2.4} aria-hidden="true" style={{verticalAlign:"-3px",marginRight:6}} />Play as guest</>}
              </button>
              {guestJoinError && (
                <div role="alert" style={{fontSize:12,color:"var(--red)",lineHeight:1.4,marginBottom:8}}>{guestJoinError}</div>
              )}
              <button
                onClick={() => { try { openAuthPrompt?.('online'); } catch {} }}
                style={{width:"100%",padding:12,background:"var(--s2)",color:"var(--text)",border:"1px solid var(--border)",borderRadius:12,fontFamily:"inherit",fontSize:14,fontWeight:600,cursor:"pointer",marginBottom:8}}
              >
                Sign up or sign in
              </button>
              <button
                onClick={clearPendingJoin}
                style={{width:"100%",padding:12,background:"var(--s2)",color:"var(--text)",border:"1px solid var(--border)",borderRadius:12,fontFamily:"inherit",fontSize:14,fontWeight:600,cursor:"pointer"}}
              >
                Not now
              </button>
            </div>
          </div>
        )}


        {/* The separate "Modes" screen has been removed — all mode tiles live on the Home tab. */}

        {/* ── CLUB QUIZ ── */}
        {screen === "club-quiz" && (
          <ClubQuizScreen
            onStart={launchClubQuiz}
            onBack={goHome}
          />
        )}

        {/* ── LEAGUE QUIZ ── */}
        {screen === "league-quiz" && (
          <LeagueQuizScreen
            onStart={launchLeagueQuiz}
            onBack={goHome}
          />
        )}

        {/* ── LOCAL SETUP ── */}
        {screen === "local-setup" && (
          <LocalSetup onStart={startLocalGame} onBack={goHome} />
        )}

        {/* ── LOCAL GAME (unified handoff → question → feedback → summary engine) ── */}
        {screen === "local-game" && localConfig && (
          <LocalGameScreen
            config={localConfig}
            onComplete={handleLocalComplete}
            onExit={goHome}
          />
        )}

        {/* ── ONLINE MULTIPLAYER ── */}
        {screen === "online-stage1" && (
          <div className="mp-cap">
          <TabErrorBoundary name="online-entry" onExit={() => { clearPendingJoin(); setOnlineAutoCreate(false); setPendingInviteFriendId(null); goHome(); setTab("online"); }}>
          <React.Suspense fallback={<ScreenLoading label="Loading multiplayer" />}>
            <OnlineEntry
              onBack={() => { clearPendingJoin(); setOnlineAutoCreate(false); setPendingInviteFriendId(null); goHome(); setTab("online"); }}
              onLobbyEnter={async (c) => {
                setStage1RoomCode(c);
                setScreen("online-stage1-lobby");
                // Challenge flow: fire the play_invite to the stashed friend now
                // that the room code exists, then clear the pending target.
                //
                // This one targets an accepted friend by construction, so the
                // RPC's friend-gate passes and it is the reliable half of the
                // pair. It still says so out loud: a challenge that silently
                // fails (friendship removed, offline) is indistinguishable from
                // one that worked, and you find out by waiting in an empty room.
                if (pendingInviteFriendId) {
                  const target = pendingInviteFriendId;
                  setPendingInviteFriendId(null);
                  const ok = await sendPlayInvite(target, c);
                  showToast(ok
                    ? "Challenge sent — they've been notified"
                    : "Couldn't notify them — share the invite link instead");
                }
              }}
              defaultName={isAnonUser ? getGuestDisplayName() : (authProfile?.username || profile?.name || "")}
              defaultAvatar={authProfile?.avatar_id || profile?.avatar || ""}
              autoJoinCode={pendingJoinCode}
              onAutoJoinConsumed={clearPendingJoin}
              autoCreate={onlineAutoCreate}
              onAutoCreateConsumed={() => setOnlineAutoCreate(false)}
            />
          </React.Suspense>
          </TabErrorBoundary>
          </div>
        )}
        {screen === "online-stage1-lobby" && stage1RoomCode && (
          <div className="mp-cap">
          <TabErrorBoundary name="mp-lobby" onExit={() => { setStage1RoomCode(""); setScreen("home"); setTab("online"); }}>
          <React.Suspense fallback={<ScreenLoading label="Loading lobby" />}>
            <MultiplayerLobby
              onReport={reportQuestion}
              key={stage1RoomCode}
              code={stage1RoomCode}
              // Only when today's Daily 7 is genuinely still open — a door that
              // points at something already finished is worse than no door.
              onPlayDaily={dailyDone ? undefined : () => { setStage1RoomCode(""); playDaily(); }}
              onExit={() => { setStage1RoomCode(""); setScreen("home"); setTab("online"); }}
              defaultName={isAnonUser ? getGuestDisplayName() : (authProfile?.username || profile?.name || "")}
              defaultAvatar={authProfile?.avatar_id || profile?.avatar || ""}
              // Rematch used to spin up a room and leave the opponent unaware —
              // you sat alone in a lobby they had no way of knowing existed,
              // and the only route back was manually sharing a link at the
              // exact moment the adrenaline drops. Challenge already fires a
              // play_invite (see challengeFriend/onLobbyEnter); this gives
              // Rematch the same reach, to everyone who was in the match.
              // …and then say which of those two things actually happened.
              // send_play_invite only reaches accepted FRIENDS, and an online
              // opponent normally arrives by shared link, so for most rematches
              // the honest answer is "nobody was pinged — send them the link".
              // Fire-and-forget left the user believing the opposite while they
              // sat waiting in an empty lobby.
              onRematch={async (c, opponentIds) => {
                setStage1RoomCode(c);
                const ids = (opponentIds || []).filter(Boolean);
                if (!ids.length) return;
                const sent = (await Promise.all(ids.map((id) => sendPlayInvite(id, c)))).filter(Boolean).length;
                showToast(sent
                  ? (sent === 1 ? "Rematch sent — they've been notified" : `Rematch sent — ${sent} players notified`)
                  : "Rematch room ready — share the link to bring them back");
              }}
            />
          </React.Suspense>
          </TabErrorBoundary>
          </div>
        )}

        {/* ── FOOTBALL WORDLE ── */}
        {screen === "wordle" && <FootballWordle date={archiveDate || undefined} onBack={goHome} userId={user?.id} onHowToPlay={openFootleRules} onReport={reportQuestion} services={footleServices} />}
        {screen === "trail" && (() => {
          // ⚠️ The player MUST be resolved for the SAME day the screen is told
          // it is showing. Passing an archive date alongside today's player
          // would store today's answer under yesterday's key — the board would
          // look right and the saved result would be a lie.
          const day = archiveDate || new Date();
          const p = getTrailAnswer(day);
          // No dataset yet -> no puzzle. Send them home rather than render an
          // empty board; a deep link that lands on a blank screen is worse
          // than one that lands somewhere real.
          if (!p) { setTimeout(goHome, 0); return null; }
          // The Mystery chain a Trail loss used to offer is now a "still open today"
          // row in the shared results panel (dailyDoneServices.nextUp).
          return <TabErrorBoundary name="trail" onExit={goHome}><React.Suspense fallback={<ScreenLoading label="Loading Transfer Trail" />}><TransferTrail player={p} date={day} onBack={goHome} onReport={reportQuestion} services={dailyScreenServices} /></React.Suspense></TabErrorBoundary>;
        })()}
        {screen === "mystery" && (
          <TabErrorBoundary name="mystery" onExit={goHome}><React.Suspense fallback={<ScreenLoading label="Loading Mystery Player" />}><MysteryPlayer date={archiveDate || undefined} onExit={goHome} services={dailyScreenServices} /></React.Suspense></TabErrorBoundary>
        )}
        {screen === "stadiums" && (
          <TabErrorBoundary name="stadiums" onExit={goHome}><React.Suspense fallback={<ScreenLoading label="Loading Stadiums" />}><StadiumGame onExit={goHome} /></React.Suspense></TabErrorBoundary>
        )}
        {screen === "stump" && stumpRow && (
          <StumpScreen
            row={stumpRow}
            onPlayFull={() => { const c = stumpRow?.cat; setStumpRow(null); setScreen("home"); if (c) launchLeagueQuiz(c); }}
            onHome={() => { setStumpRow(null); goHome(); }}
          />
        )}

        {/* ── HOT STREAK ── */}
        {screen === "quiz" && mode === "hotstreak" && (
          <HotStreakEngine
            questions={questions}
            onComplete={handleComplete}
            onBack={goHome}
            onHowToPlay={openHotStreakRules}
            rulesOpen={howToPlay === "hotstreak"}
          />
        )}

        {/* ── TRUE OR FALSE ── */}
        {screen === "quiz" && mode === "truefalse" && (
          <TrueFalseEngine
            questions={trueFalseQuestions}
            onComplete={handleComplete}
            onBack={goHome}
            onHowToPlay={openTrueFalseRules}
          />
        )}

        {/* ── QUIZ ── */}
        {screen === "quiz" && mode !== "hotstreak" && mode !== "truefalse" && (
          <div className="quiz-screen-wrap">
            {mode === "legends" && (
              <div style={{marginTop:14,marginBottom:4,textAlign:"center",padding:"10px 0 6px",background:"linear-gradient(135deg,rgba(251,191,36,0.08),rgba(251,191,36,0.03))",borderRadius:12,border:"1px solid rgba(251,191,36,0.15)"}}>
                <div style={{fontSize:10,fontFamily:"'Inter',sans-serif",color:"var(--gold)",fontWeight:700,letterSpacing:0.3,marginBottom:4}}>📜 Legends & History</div>
                <div style={{fontSize:12,color:"var(--t3)",fontStyle:"italic"}}>Take your time. These are the stories that made the game.</div>
              </div>
            )}
            {mode === "chaos" && (
              <div style={{marginTop:14,marginBottom:4,textAlign:"center",padding:"10px 0 6px",background:"linear-gradient(135deg,rgba(88,204,2,0.10),rgba(255,106,0,0.06))",borderRadius:12,border:"1px solid rgba(88,204,2,0.22)"}}>
                <div style={{fontSize:10,fontFamily:"'Inter',sans-serif",color:"var(--grn-soft)",fontWeight:700,letterSpacing:0.3,marginBottom:4}}>🎭 Chaos</div>
                <div style={{fontSize:12,color:"var(--t3)",fontStyle:"italic"}}>Quotes, moments &amp; madness — take a beat and think.</div>
              </div>
            )}
            {activeClub && CLUB_PACKS[activeClub] && (
              <div style={{marginTop:14,marginBottom:6,display:"flex",alignItems:"center",gap:14,padding:"12px 14px",background:clubHexToRgba(CLUB_PACKS[activeClub].color, 0.14),border:`1px solid ${clubHexToRgba(CLUB_PACKS[activeClub].color, 0.4)}`,borderRadius:14}}>
                <div style={{width:46,height:46,borderRadius:12,flexShrink:0,background:CLUB_PACKS[activeClub].color,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 2px 8px ${clubHexToRgba(CLUB_PACKS[activeClub].color, 0.45)}`}}>
                  <span style={{fontWeight:900,fontSize:14,letterSpacing:0.3,color:clubReadableText(CLUB_PACKS[activeClub].color)}}>{CLUB_ABBR[activeClub] || clubInitials(CLUB_PACKS[activeClub].name)}</span>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:11,color:"var(--t3)",fontWeight:600,marginBottom:2}}>Club Quiz</div>
                  <div style={{fontSize:17,fontWeight:800,color:"var(--t1)",letterSpacing:"-0.2px"}}>{CLUB_PACKS[activeClub].name}</div>
                </div>
              </div>
            )}
            {!activeClub && activeLeague && LEAGUE_QUIZ_BY_CAT[activeLeague] && (
              <div style={{marginTop:14,marginBottom:6,display:"flex",alignItems:"center",gap:14,padding:"12px 14px",background:clubHexToRgba(LEAGUE_QUIZ_BY_CAT[activeLeague].color, 0.14),border:`1px solid ${clubHexToRgba(LEAGUE_QUIZ_BY_CAT[activeLeague].color, 0.4)}`,borderRadius:14}}>
                <div style={{width:46,height:46,borderRadius:12,flexShrink:0,background:LEAGUE_QUIZ_BY_CAT[activeLeague].color,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 2px 8px ${clubHexToRgba(LEAGUE_QUIZ_BY_CAT[activeLeague].color, 0.45)}`}}>
                  <span style={{fontWeight:900,fontSize:14,letterSpacing:0.3,color:clubReadableText(LEAGUE_QUIZ_BY_CAT[activeLeague].color)}}>{LEAGUE_QUIZ_BY_CAT[activeLeague].abbr}</span>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:11,color:"var(--t3)",fontWeight:600,marginBottom:2}}>League Quiz</div>
                  <div style={{fontSize:17,fontWeight:800,color:"var(--t1)",letterSpacing:"-0.2px"}}>{LEAGUE_QUIZ_BY_CAT[activeLeague].name}</div>
                </div>
              </div>
            )}
            <QuizEngine
              key={mode}
              questions={questions}
              mode={mode}
              diff={diff}
              timerEnabled={settings.timer !== false}
              timerSecondsOverride={activeClub ? 15 : undefined}
              soundEnabled={settings.sound === true}
              hintsEnabled={settings.hints !== false}
              onComplete={handleComplete}
              onReport={reportQuestion}
              // medical correctness-state (low): without this the in-game
              // Survival PB / "New PB!" badges could never render — QuizEngine
              // gates them on survivalBest > 0 and the prop was never passed.
              survivalBest={stats.bestStreak}
              quizLabel={activeClub && CLUB_PACKS[activeClub] ? CLUB_PACKS[activeClub].name
                : activeLeague && LEAGUE_QUIZ_BY_CAT[activeLeague] ? LEAGUE_QUIZ_BY_CAT[activeLeague].name
                : undefined}
              // Audit #5: a club/league quit stranded the player on Home —
              // send them back to the picker they came from instead.
              onBack={() => {
                if (mode === "daily") { setScreen("home"); setTab("daily"); }
                else if (activeClub) { setScreen("club-quiz"); }
                else if (activeLeague) { setScreen("league-quiz"); }
                else { setScreen("home"); setTab("home"); }
              }}
              // Only modes with a HOW_TO_PLAY entry get the "?" — passing an
              // opener for (say) Classic would open an empty sheet.
              onHowToPlay={HOW_TO_PLAY[mode] ? openQuizRules : undefined}
            />
          </div>
        )}

        {/* ── LOCAL RESULTS ── */}
        {screen === "local-results" && (
          <LocalResults
            result={localResult}
            onHome={goHome}
            onRetry={() => { if (localConfig) startLocalGame(localConfig); }}
            onShare={() => shareScore(0, 0, "local")}
          />
        )}

        {/* ── HOT STREAK RESULTS ── */}
        {screen === "results" && result && mode === "hotstreak" && (
          <HotStreakResults
            result={result}
            prevBest={hotstreakBest}
            onRetry={() => startMode("hotstreak")}
            onShare={() => shareScore(result.score, result.total, "hotstreak")}
            onHome={goHome}
          />
        )}

        {/* ── TRUE OR FALSE RESULTS ── */}
        {screen === "results" && result && mode === "truefalse" && (
          <TrueFalseResults
            result={result}
            onRetry={() => startMode("truefalse")}
            onShare={() => shareScore(result.score, result.total, "truefalse")}
            onHome={goHome}
          />
        )}

        {/* ── RESULTS ── */}
        {screen === "results" && result && mode !== "hotstreak" && mode !== "truefalse" && (
          <Results
            result={result}
            mode={mode}
            onHome={goHome}
            survivalBest={stats.bestStreak}
            wrongAnswers={wrongAnswers}
            onReport={reportQuestion}
            askedQuestions={questions}
            dailyDone={dailyDoneServices}
            photoNudge={(user?.id && !authProfile?.avatar_url && !photoNudgeDismissed) ? (
              <div style={{marginTop:16,padding:"14px 14px 12px",borderRadius:16,background:"var(--s1)",border:"1px solid var(--border)",display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:44,height:44,flexShrink:0}}>
                  <ProfilePic value={authProfile?.avatar_id} url={authProfile?.avatar_url} name={authProfile?.username} />
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:800,color:"var(--t1)",letterSpacing:"-0.2px"}}>Put a face to the name</div>
                  <div style={{fontSize:12.5,color:"var(--t2)",lineHeight:1.4,marginTop:2}}>Your friends see this next to your score.</div>
                </div>
                <button
                  onClick={() => { dismissPhotoNudge(); loopEvent('photo-nudge-tap'); setTab('profile'); setScreen('home'); }}
                  style={{flexShrink:0,padding:"9px 15px",borderRadius:999,background:"var(--accent)",border:"none",color:"var(--grn-ink)",WebkitTextFillColor:"var(--grn-ink)",fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:"pointer"}}
                >
                  Add
                </button>
                {/* A nudge you cannot decline is a wall. */}
                <button
                  onClick={() => { dismissPhotoNudge(); loopEvent('photo-nudge-dismiss'); }}
                  aria-label="Not now"
                  style={{flexShrink:0,padding:"9px 6px",background:"none",border:"none",color:"var(--t3)",fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer"}}
                >
                  Later
                </button>
              </div>
            ) : null}
            classicBest={stats.bestScore || 0}
            label={activeClub && CLUB_PACKS[activeClub] ? CLUB_PACKS[activeClub].name
              : activeLeague && LEAGUE_QUIZ_BY_CAT[activeLeague] ? LEAGUE_QUIZ_BY_CAT[activeLeague].name
              : null}
            onShare={() => (mode === "daily"
              // Daily shares route through shareDaily — the (previously
              // unwired) path that carries the balliq.app/c/ challenge link
              // so the recipient gets the head-to-head compare flow.
              ? shareDaily()
              : shareScore(result?.score, result?.total, mode, { streak: result?.bestStreak, club: activeClub, league: activeLeague }))}
            onRetry={() => { bumpUsage('retry'); startMode(mode); }}
            // Daily results primary CTA: same navigation the Daily tab uses.
            onPlayFootle={() => setScreen("wordle")}
            dailyOpen={!dailyDone}
            onPlayDaily={playDaily}
          />
        )}

        {/* ── TAB BAR ── */}
        {!isWebBrowser && !inGame && screen === "home" && (
          <nav className="tab-bar" ref={tabBarRef}>
            {/* ONE capsule shared by all four tabs, so it can travel. It used to
                be .tab-item.active::after — a pseudo-element on whichever tab
                was active, destroyed on one button and recreated on another,
                which is why no CSS could ever have smoothed it.

                The percentage is set HERE rather than via a CSS variable: a
                transform resolved from var() inside calc() is a discrete change
                and never transitions (measured — it positioned perfectly and
                fired zero transitionstart events). A real inline value is an
                ordinary animatable change.

                Four flex:1 items and no horizontal padding on the bar mean one
                tab is exactly 25%, so index * 100% needs no measuring and cannot
                drift on rotation. Math.max(0,…) parks an unknown tab on Home
                instead of sliding it off-screen left.

                Decorative: the active tab is already announced by aria-current. */}
            <span className="tab-pill" aria-hidden="true"
                  style={{ transform: `translateX(${Math.max(0, ["home","online","daily","profile"].indexOf(tab)) * 100}%)` }}><i /></span>
            {/* ⚠️ NO HAPTIC ON TAB SWITCH — deliberate, do not add one back.
                Every haptic() is a JS→native→JS bridge round trip and Capacitor
                builds a fresh UIImpactFeedbackGenerator per call, so bursts
                serialise and block the main thread. Alex's device log showed
                ~57 queued `Haptics impact` calls followed by
                WebProcessProxy::didBecomeUnresponsive — switching tabs fast was
                literally waiting on the taptic engine. Throttling to 55ms
                helped and was not enough; removing it is the fix.
                It is also the platform convention: Threads and Instagram fire
                nothing on tab change. A tab switch is navigation, not a
                confirmation — the screen changing IS the feedback. Haptics stay
                where they mark a real moment (starting a game, answering,
                winning). Pinned by tests/unit/tab-switch-no-haptic.test.js. */}
            {[
              { id:"home",     Icon: Home,         label:"Home"    },
              { id:"online",   Icon: Globe,        label:"Online"  },
              { id:"daily",    Icon: CalendarDays, label:"History", badge: false },
              { id:"profile",  Icon: User,         label:"Profile" },
            ].map(({ id, Icon, label, badge }) => (
              <button key={id} className={`tab-item${tab===id?" active":""}`} aria-current={tab===id ? "page" : undefined} onClick={() => setTab(id)}>
                <span className="tab-svg"><Icon size={22} strokeWidth={2.25} aria-hidden="true" /></span>
                <span className="tab-label">{label}</span>
                {badge && <span className="tab-badge" />}
              </button>
            ))}
          </nav>
        )}
        </>}
      </main>
      <OfflineBanner />
      <ResetPasswordOverlay />
      <NotificationCenter
        open={notifOpen}
        requests={notifRequests}
        invites={notifInvites}
        onClose={() => setNotifOpen(false)}
        onRespond={respondFriendRequest}
        onJoinInvite={joinInvite}
        onDismissInvite={dismissInvite}
        onOpenFriend={(f) => { setNotifOpen(false); openFriendProfile(f); }}
      />
    </>
  );
}

function AppGate() {
  const { user, isGuest, loading, profile, authPromptOpen, authPromptReason, closeAuthPrompt } = useAuth();
  // Sprint #62 fix 3: keep the splash up until authProfile has loaded
  // (or a safety timeout elapses), so AppInner mounts with profile
  // already in hand and the Sprint #26 X2 cross-device onboarding
  // reconciliation runs on the first render. Without this, fresh-device
  // sign-in for an existing user flashes OnboardingScreen for the
  // 500-2000ms window between AppInner mount and authProfile arrival.
  // Guests skip the wait (no profile to load); brand-new sign-ups still
  // see Onboarding correctly because their profile arrives WITHOUT
  // onboarded_at set and the X2 effect leaves hasOnboarded=false.
  const profileNotReady = !!user && !isGuest && !profile;
  const [profileWaitElapsed, setProfileWaitElapsed] = useState(false);
  useEffect(() => {
    if (!profileNotReady) { setProfileWaitElapsed(false); return; }
    // Safety: cap the wait at 2s. If profile load is slow or fails, mount
    // AppInner anyway — the legacy onboarding flash is preferable to
    // hanging on the splash indefinitely.
    const id = setTimeout(() => setProfileWaitElapsed(true), 2000);
    return () => clearTimeout(id);
  }, [profileNotReady]);
  const effectiveLoading = loading || (profileNotReady && !profileWaitElapsed);

  // Sprint #88 DDD1: coordinated native-splash dismissal. capacitor.config has
  // launchAutoHide:false so the native iOS splash stays up until we explicitly
  // call SplashScreen.hide() — fired the first time effectiveLoading flips
  // false (auth check complete + profile ready / wait elapsed). Hiding the
  // native splash AFTER React is ready means the 1-2s of post-mount jank
  // (React tree settling, useEffects firing, listener attachment) happens
  // behind the splash instead of in the user's face — the "first 2s of
  // laggy scroll after launch" goes away because the user can't scroll the
  // WebView until SplashScreen.hide() resolves. Idempotent via ref.
  const splashHiddenRef = useRef(false);
  perfMark('AppGate render');
  useEffect(() => { perfMark('AppGate mounted'); }, []);
  useEffect(() => {
    if (effectiveLoading || splashHiddenRef.current) return;
    splashHiddenRef.current = true;
    perfMark('AppGate effectiveLoading→false');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        perfMark('SplashScreen.hide() called');
        SplashScreen.hide({ fadeOutDuration: 220 })
          .then(() => perfMark('SplashScreen.hide() resolved'))
          .catch(() => {});
      });
    });
  }, [effectiveLoading]);

  // Sprint #23 U2: splash stays mounted for one 220ms beat after
  // loading→false, fading out while AppInner mounts behind it (the
  // splash is position:fixed inset:0 so AppInner renders underneath).
  // Hides the instant splash→app swap that read as a stutter, and
  // the many on-mount useEffects of AppInner settle while the user
  // is still looking at the fading splash. prefers-reduced-motion
  // collapses this to an instant unmount.
  const [splashMounted, setSplashMounted] = useState(true);
  useEffect(() => {
    if (effectiveLoading) { setSplashMounted(true); return; }
    const reduced = typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;
    if (reduced) { setSplashMounted(false); return; }
    const id = setTimeout(() => setSplashMounted(false), 240);
    return () => clearTimeout(id);
  }, [effectiveLoading]);

  // Render the SAME branded splash markup that index.html injects into #root
  // before React mounts. Reusing the .biq-splash classes (defined inline in
  // index.html's <style>) means the moment React replaces the pre-mount DOM,
  // the user sees an identical wordmark + animated bar — no visible swap.
  const splash = splashMounted ? (
    <div className={`biq-splash${!effectiveLoading ? ' is-leaving' : ''}`} aria-label={`Loading ${APP_NAME}`}>
      <div className="biq-splash-mark">Ball <em>IQ</em></div>
      <div className="biq-splash-dot"></div>
    </div>
  ) : null;

  if (effectiveLoading) return splash;

  // Sprint #100 guest-first: the app is always the front door. By the time
  // effectiveLoading is false, getSession() has resolved and useAuth has
  // either set `user` (returning session) or auto-entered guest mode, so
  // AppInner always renders with a valid user||guest context. The Login
  // screen is an on-demand overlay (authPromptOpen) reached via the in-app
  // "Sign in" affordances and the reward-framed gated-feature prompts.
  return (
    <>
      {splash}
      <AppInner />
      {authPromptOpen && (
        <Login asOverlay promptReason={authPromptReason} onClose={closeAuthPrompt} />
      )}
    </>
  );
}

export default function App() {
  // Sprint #91 FFF1: skip SpeedInsights on Capacitor native — the Vercel
  // analytics endpoint isn't reachable from the bundled capacitor:// scheme
  // and the script fails to load on every launch, producing a console
  // error + a wasted network attempt. Web/PWA path unchanged.
  const isNative = Capacitor.isNativePlatform?.();
  return (
    <>
      {/* Pre-review audit: VersionBanner compares BUILT_SHA against a
          /version.json fetch that can't succeed from the capacitor://
          bundle — the failure path is silent today, but gate it anyway
          so no update-nag UI can ever render inside the native app. */}
      {!isNative && <VersionBanner />}
      <ErrorBoundary><AppGate /></ErrorBoundary>
      {!isNative && <SpeedInsights />}
    </>
  );
}
