import './app.css';
import React, { useState, useEffect, useLayoutEffect, useCallback, useRef, useMemo } from "react";
import * as Sentry from '@sentry/react';
import { useAuth, clearAllUserLocalStorage } from './useAuth.jsx';
import { supabase } from './supabase.js';
import { safeSetItem } from './safeStorage.js';
import { useMultiplayerRoom } from './useMultiplayerRoom.js';
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
import { seededShuffle, pickAvoidingConflicts, TOPICAL_PACK, RETIRED_TAGS } from './lib/quiz.js';
import { MYSTERY_ENABLED } from './lib/mysteryPlayer.js';
import { Timer, Flame, Zap, ScrollText, Brain, Sparkles, Trophy, Share, Home, CalendarDays, User, Globe, Users, KeyRound, Gamepad2, Settings, Bell, Lightbulb, Star, Mail, ArrowUpRight, Check, X, ClipboardList, Route, ListOrdered, UserRoundSearch, CircleX, CircleHelp, Pencil, Moon, BrickWall, Flag, Handshake, Smartphone } from 'lucide-react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { mpCreateRoom, mpJoinRoom, mpLeaveRoom, mpLookupRoom, useMpRetryStatus } from './multiplayerRpc.js';
import { useModalA11y, closeTopModal } from './useModalA11y.js';
import VersionBanner from './VersionBanner.jsx';
import { useInstallPrompt, useInstallBanner } from './installPrompt.js';
import { FOOTLE_SHORT } from './lib/modeCopy.js';
import { APP_NAME, LEVELS, getLevelInfo, computeBadges, getXPForResult } from './lib/scoring.js';
import { levelName } from './i18n/names.js';
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
import { computeCard, CARD_TIERS, recordAnswers, cardDelta, storeCardDelta, drainPendingRounds } from './lib/ballIqCard.js';
// The club tables are LAZY (src/data/clubPacks.js); this is the only way in.
import { loadClubData, useClubData } from './lib/clubData.js';
import { CLUB_INDEX } from './marketing/clubIndex.js';
import { liveStreak, localDayNow, shieldsAvailable } from './lib/streak.js';
import { getTrailAnswer, loadTrailDay } from './lib/trail.js';
import { isTop10Live, loadTop10Day } from './lib/top10.js';
import { OnboardingScreen } from './screens/OnboardingScreen.jsx';
import { privacyH2, privacyP } from './screens/privacyStyles.js';
import { useNotificationCenter } from './hooks/useNotificationCenter.js';
import { useScrollAwareTabBar } from './hooks/useScrollAwareTabBar.js';
import { useT, useLang, isLangLoaded, hasEnglish, getLang, t as tl } from './i18n/index.js';
import { useQuestionText, useLiveQuestion, questionText } from './i18n/questionText.js';
import { rich } from './i18n/rich.jsx';
import { useShare } from './hooks/useShare.js';
import { useWebPush } from './hooks/useWebPush.js';
import { useJoinGate } from './hooks/useJoinGate.js';
import { useLocalNotifications } from './hooks/useLocalNotifications.js';
import { dailyTierCopy, scoreTagline } from './lib/resultsCopy.js';
import { stumpLink, shareStumpText, shareSenderName } from './lib/stump.js';
import {
  WORDLE_PLAYERS, WORDLE_ANCHOR_DAY, WORDLE_ANCHOR_IDX, WORDLE_STRIDE,
  getWordleDayIndex, getWordleAnswerForDayIndex, getWordleAnswer,
  gradeWordleGuess, computeFootleStreak, getFootleNumber,
} from './lib/wordle.js';
import { PlatformStoreBadge } from './components/StoreBadge.jsx';
import { parseChallengeToken, storeChallenge } from './lib/gameChallenge.js';
import { getFootleXP } from './lib/footleXp.js';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { APP_STORE_ID, APP_STORE_URL, PLAY_STORE_URL, appStoreUrl } from './lib/links.js';
import { captureFirstTouch } from './lib/firstTouch.js';
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
// Login is an ON-DEMAND OVERLAY, never on the boot path — guest-first means
// AppInner always has a user||guest context and the sign-in screen appears
// only behind authPromptOpen. It was 34 KB sitting in the eager Home chunk for
// a screen most sessions never open. Genuinely conditional, so unlike the tab
// panes below this chunk is not merely deferred: it is never fetched at all
// unless someone taps a sign-in affordance.
const Login = withSuspense(React.lazy(() => import('./Login.jsx')), "Loading sign-in");
// ⚠️ OnlineHubTab is DEFERRED, NOT ELIMINATED, and the difference matters when
// reading the budget. Its pane renders whenever Home is up (hidden via
// HIDDEN_STYLE off-tab) to keep tab state alive, so this chunk still loads —
// just after paint, in parallel, instead of inside the bytes Home blocks on.
// Same treatment and same caveat as ProfileScreen above.
const OnlineHubTab = withSuspense(lazyNamed(() => import('./screens/OnlineHubTab.jsx'), 'OnlineHubTab'), "Loading online");
// The History tab (DailyTabScreen), 47 KB and the largest screen left in the
// eager chunk. Same pane pattern and the same caveat as OnlineHubTab: it is
// DEFERRED, not eliminated. `tab` defaults to "home" (see useState below), so
// this never blocks the first paint — but its pane does render whenever Home
// is up, so the chunk still arrives shortly after, in parallel.
const DailyTabScreen = withSuspense(lazyNamed(() => import('./screens/DailyScreen.jsx'), 'DailyTabScreen'), "Loading history");
// Footle's board (33 KB) was a STATIC import for a screen entered by a tap, so
// it rode GameRoot's boot path for everyone. The /football-wordle/ island keeps
// its own direct import; only the app's copy is deferred.
const FootballWordle = withSuspense(lazyNamed(() => import('./games/FootballWordle.jsx'), 'FootballWordle'), "Loading Footle");
// The three finish screens. ⚠️ These are the ONE place a Suspense fallback
// would actually hurt — the moment a player finishes is the emotional peak of
// the session, and a spinner there is worse than the bytes. So they are lazy
// AND prefetched the instant a game starts (see the effect below): a ten-
// question quiz is about a minute of warning for a same-origin chunk, so in
// practice the module is resolved long before anyone can reach it, and the
// fallback exists only for the pathological case.
//
// This became possible by moving resultVerdict — six pure lines — out to
// lib/resultVerdict.js. It was imported by the canvas share-card painter and
// by useShare, and those two eager importers were pinning the whole screen.
const Results = withSuspense(lazyNamed(() => import('./screens/ResultsScreen.jsx'), 'Results'), "Loading results");
const HotStreakResults = withSuspense(lazyNamed(() => import('./screens/ModeResults.jsx'), 'HotStreakResults'), "Loading results");
const TrueFalseResults = withSuspense(lazyNamed(() => import('./screens/ModeResults.jsx'), 'TrueFalseResults'), "Loading results");
const SettingsScreen = withSuspense(lazyNamed(() => import('./screens/SettingsScreen.jsx'), 'SettingsScreen'), "Loading settings");
const DailyReviewScreen = withSuspense(lazyNamed(() => import('./screens/ReviewScreens.jsx'), 'DailyReviewScreen'), "Loading review");
const PuzzleReviewScreen = withSuspense(lazyNamed(() => import('./screens/ReviewScreens.jsx'), 'PuzzleReviewScreen'), "Loading review");
const ClubQuizScreen = withSuspense(lazyNamed(() => import('./screens/ClubQuizScreen.jsx'), 'ClubQuizScreen'), "Loading clubs");
// The Quiz screen (16 Oct 2026): one door for Classic, Chaos, Legends, the
// league/tournament/theme quizzes and Stadiums. Lazy so Home carries only the
// row that opens it; the chips call the same launchers the old tiles did.
const QuizScreen = withSuspense(lazyNamed(() => import('./screens/QuizScreen.jsx'), 'QuizScreen'), "Loading quiz");
// The quiz engine (i18n step 5, 21 Oct 2026). It was a STATIC import, and it
// statically imports the results screen, which imports DailyDone: three play
// screens and every English string they print rode Home's eager path. Lazy
// now, warmed with the question index at idle and again the moment play starts
// (see the effects below), so the fallback is the pathological case only.
const loadQuizEngine = () => import('./screens/QuizEngine.jsx');
const QuizEngine = withSuspense(lazyNamed(loadQuizEngine, 'QuizEngine'), "Loading quiz");
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
const Top10 = React.lazy(() => import('./screens/Top10.jsx'));
const Top10Library = React.lazy(() => import('./screens/Top10Library.jsx'));
// Numbered (Draft No. N) but not one of the four dailies: see the note in the screen.
const Draft = React.lazy(() => import('./screens/Draft.jsx'));
const StadiumGame = React.lazy(() => import('./screens/StadiumGame.jsx'));
const MysteryPlayer = React.lazy(() => import('./screens/MysteryPlayer.jsx'));
const OnlineEntry = React.lazy(() => import('./screens/OnlineMultiplayer.jsx').then(m => ({ default: m.OnlineEntry })));
const MultiplayerLobby = React.lazy(() => import('./screens/OnlineMultiplayer.jsx').then(m => ({ default: m.MultiplayerLobby })));
// Mates' leagues (phase 1, web only): the table and both sheets in one lazy
// chunk, so Home's eager budget (scripts/audit-home-budget.mjs) never carries them.
const LeagueScreen = React.lazy(() => import('./screens/LeagueScreen.jsx'));
// Stitch-up (web only, 16 Oct 2026): build a Trail for a mate. Lazy, like the
// leagues: nothing of it is in Home's eager graph but this line and the route.
const StitchUp = React.lazy(() => import('./screens/StitchUp.jsx'));
const LeagueCreateSheet = lazyNamed(() => import('./screens/LeagueScreen.jsx'), 'LeagueCreateSheet');
const LeagueJoinSheet = lazyNamed(() => import('./screens/LeagueScreen.jsx'), 'LeagueJoinSheet');
import { HomeScreen } from './screens/HomeScreen.jsx';
import { currentAvatarId } from './lib/currentAvatar.js';
import { isIOSUA, isAndroidUA } from './components/StoreBadge.jsx';
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
  WORDLE_FLIP_MS: 180,
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
export const normalizeJoinCode = s => (s || "").toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g, "").slice(0, 6) || null;

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
  const { QB, conflictsWith } = await loadQuestions();
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
  // The frozen log (33 KB of generated answers) is imported HERE rather than at
  // the top of the file: it moved to lib/dailyDraw.js so it stops riding into
  // the eager Home chunk via lib/quiz.js. Both awaits resolve in parallel and
  // the draw cannot run without QB anyway.
  const [{ QB }, { pickDailyQuestions }] = await Promise.all([
    loadQuestions(),
    import('./lib/dailyDraw.js'),
  ]);
  // Selection lives in src/lib/quiz.js — pure and tested. It must depend on the
  // date and nothing else (the Daily 7 feeds /c/ challenge links and an OG card),
  // and the reasons why are documented there. We still RECORD into seen-history
  // via _histKey below — other modes consume it; the daily just never reads it.
  // Cached completions in biq_daily_<ymd> are unaffected. Option order below is
  // deliberately per-player random: it doesn't change WHICH seven you get.
  // An installed app plays from the log the SITE serves when it holds a good
  // copy, so it stays on the website's seven after the log is regenerated
  // (lib/dailyRemote.js; the bundled copy is the fallback). If this build has
  // never asked the site, it asks now and waits a moment, so a fresh install
  // does not open its first daily on a set the website is not playing.
  // (Capacitor read directly: IS_NATIVE is declared further down the file.)
  let log;
  if (Capacitor.isNativePlatform?.()) {
    try {
      const remote = await import('./lib/dailyRemote.js');
      if (!remote.askedSiteForDaily()) await Promise.race([remote.refreshDailyLog(), new Promise((r) => setTimeout(r, 1500))]);
      log = remote.cachedDailyLog() || undefined;
    } catch { log = undefined; }
  }
  return pickDailyQuestions(QB, dayIndexForDate(date), log).map(q => {
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
  // ⚠️ A CATEGORY LABEL MUST NOT INVENT WORDS THE CARD DOES NOT USE. The chip
  // read "RECORDS & ICONS" while the card face beside it reads "RECORDS" and
  // CARD_COMPS calls it "Records & Managers" — three names for one thing, and
  // "Icons" appears nowhere else in the product. Same for "Legends & History"
  // against a "LEGENDS" face. The chip now names the category exactly as the
  // card labels the face it feeds, so a player can connect the two.
  Managers:"Managers", Records:"Records",
  Legends:"Legends", History:"History", Transfers:"Transfers",
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
// A category's display name. Spanish renames a few (the cat.* keys in
// i18n/en.js, same English as above); every other category keeps its
// CAT_LABELS name, the same in both languages (Premier League, La Liga …).
// LEAGUE_QUIZ_SECTIONS' names are the same words for the same cat.
export const catLabel = (t, c) => (hasEnglish(`cat.${c}`) ? t(`cat.${c}`) : CAT_LABELS[c] || c);
const CATS = ["All","WorldCup","Euros","UCL","PL","LaLiga","Bundesliga","SerieA","Ligue1","Transfers","Managers","Records","Legends"];



// ─── CSS ──────────────────────────────────────────────────────────────────────



// ─── CLUB QUIZ PACKS ─────────────────────────────────────────────────────────
// The per-club tables (CLUB_PACKS, CLUB_PACK_TO_QB, CLUB_LEAGUES, CLUB_ORDER,
// CLUB_LEAGUE_SECTIONS, CLUB_ABBR, CLUB_SLUG_TO_PACK, PACK_TO_CLUB_SLUG,
// CLUB_SEARCH_NICKNAMES) moved to src/data/clubPacks.js on 2026-10-16 and load
// on demand through lib/clubData.js: ~25 KB that Home blocked on and does not
// paint. Read them with `await loadClubData()` in async paths, or the `clubs`
// state in AppInner at render. Never import that file statically here.
//
// Started now, at module load, so it is in flight while Home paints and has
// landed (registering the card's club routes) long before anyone can tap a
// club. Nothing waits on this call; a failure is retried by the next caller.
loadClubData().catch(() => {});

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

// SEO deep-links: /play?quiz=<league-slug> lands a searcher IN the quiz they
// Googled (the league landing pages' CTAs emit it — see scripts/gen-seo-pages.mjs
// ctaBlock). Its club twin, CLUB_SLUG_TO_PACK, lives in src/data/clubPacks.js.
const QUIZ_SLUG_TO_CAT = {
  "premier-league": "PL", "la-liga": "LaLiga", "serie-a": "SerieA",
  "bundesliga": "Bundesliga", "ligue-1": "Ligue1",
  "super-lig": "SuperLig", "primeira-liga": "Primeira",
  "champions-league": "UCL", "world-cup": "WorldCup", "euros": "Euros",
  // The three theme pages whose CTA pointed at a slug this map did not carry.
  "legends": "Legends", "managers": "Managers", "football-records": "Records",
};
// Reverse map for share deep-links: a league quiz result links the recipient
// back into THAT quiz (?quiz=…). Its club twin is PACK_TO_CLUB_SLUG.
export const CAT_TO_QUIZ_SLUG = Object.fromEntries(Object.entries(QUIZ_SLUG_TO_CAT).map(([s, c]) => [c, s]));

// ─── LEAGUE QUIZ (competition picker) ────────────────────────────────────────
// Solo single-competition quizzes. Unlike the club quiz (which re-tags rows as
// cat:"ClubQuiz"), league-quiz questions KEEP their real cat, so every answer
// feeds the matching competition rating on the Ball IQ card (EPL/UCL/INT/…).
// ⚠️ STADIUMS IS A QUIZ, AND IT WAS INVISIBLE TO THE CARD.
// Twenty graded questions per run, already tagged with the league they belong
// to — and none of it reached catStats, because Stadiums has its own screen
// and never passes through handleComplete. 340 answers across 12 players, ~28
// each, contributing nothing to their rating. Alex: "if people think we are
// ripping them off on the scorecard by not including areas where they are
// good, that is a good reason to uninstall."
//
// ⚠️ THE LINE IS "N GRADED QUESTIONS", NOT "IS IT KNOWLEDGE". Trail, Mystery
// and Footle stay out and that is deliberate: each is ONE binary outcome per
// day, after up to five attempts with progressive clue reveals. Scoring that
// as "one answer" would import the exact defect this whole day was spent
// removing — a unit that means something different per mode. That is how
// `score` became 680 "correct answers" and how chaos read 91%. Those modes
// build the STREAK; graded questions build the RATING.
const STADIUM_LEAGUE_TO_CAT = {
  "premier-league": "PL", "la-liga": "LaLiga", "serie-a": "SerieA",
  "bundesliga": "Bundesliga", "ligue-1": "Ligue1",
};

export const LEAGUE_QUIZ_SECTIONS = [
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
    // ⚠️ Legends and Records are CARD FACES since the 2026-09-10 re-cut, so their
    // colours are pinned to CARD_COMPS by card-comp-colours.test.js. Changing
    // one here without the other is the drift that test exists to catch.
    // Legends moved off gold because the card already spends gold on INT, and
    // two gold rows adjacent on a six-row card are unreadable.
    { cat: "Legends",  name: "Legends",          abbr: "LEG", color: "#B03A2E" },
    { cat: "Managers", name: "Managers",         abbr: "MGR", color: "#37474F" },
    { cat: "Records",  name: "Records",          abbr: "REC", color: "#1B7F79" },
  ]},
];
export const LEAGUE_QUIZ_BY_CAT = Object.fromEntries(LEAGUE_QUIZ_SECTIONS.flatMap(s => s.items.map(i => [i.cat, i])));




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
  // Robots must not vote here either. All three record_challenge_event writes
  // go through this helper, so the gate belongs IN it rather than at each call
  // site -- three guards is three chances for one to be forgotten, which is
  // exactly how challenge_events came to be the one funnel table with no
  // synthetic check while isSyntheticTraffic() sat 75 lines below.
  // (It is a function declaration, so referring to it above its definition is
  // hoisted and allowed by the no-use-before-define rule's functions:false.)
  if (isSyntheticTraffic()) return false;
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

// ⭐ The ONE exception to "native sends the name and nothing else" (below):
// the rating funnel, and only a fixed set of low-cardinality words.
//
// ASO deep-dive, 2026-10-04: native logged 103 rate-prompt-shown against 668
// rate-prompt-skipped in five weeks, skips rising every week — and every one of
// those rows reads {native, anon}, so nobody can say whether the cooldown, a
// bad moment or a screen change eats 87% of the happy moments. Ratings are
// also per STORE, and the rows could not even tell iOS from Android.
//
// Why this still keeps the promise in privacy §4 ("no identifier of any
// kind… nothing links one count to another"): every value here is one word
// from a short closed list (cooldown, footle, ios…). There is no id, no club
// slug, no surface path, no number — nothing that varies per person, so no
// combination of these fields can single anyone out or join two rows. Keys
// outside the list, and values that are not a short lowercase word, are
// dropped rather than trusted, so a future call site cannot widen it by
// accident.
const NATIVE_RATE_EVENT = /^rate-(prompt|link)-/;
const NATIVE_RATE_KEYS = ["reason", "trigger", "engine", "store", "surface"];
const NATIVE_RATE_WORD = /^[a-z][a-z-]{0,23}$/;
function nativeRateMeta(name, meta) {
  const out = { native: true, anon: true };
  if (!NATIVE_RATE_EVENT.test(name)) return out;
  try {
    const p = Capacitor.getPlatform?.();
    if (p === "ios" || p === "android") out.platform = p;
    if (meta) for (const k of NATIVE_RATE_KEYS) {
      const v = meta[k];
      if (typeof v === "string" && NATIVE_RATE_WORD.test(v)) out[k] = v;
    }
  } catch {}
  return out;
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
  // PostHog mirror (web only, consent-gated: biqTrack exists only once
  // public/ph.js has been allowed to load).
  try {
    if (!IS_NATIVE && typeof window !== "undefined" && typeof window.biqTrack === "function") window.biqTrack(name, meta);
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
    // So native sends the event NAME and nothing else: no biq_vid, no meta
    // (the rating funnel's closed word list in nativeRateMeta is the only
    // exception, and it carries no identifier either).
    // We learn which modes get used and where people stop; we cannot follow a
    // person, because there is no key to follow them by. Dropping meta as well
    // as the id is deliberate — meta carries club slugs and surfaces, and a
    // rich enough meta rebuilds a fingerprint even without an explicit id.
    const anon = IS_NATIVE === true;
    supabase.rpc("record_funnel_event", {
      p_event: name,
      p_meta: anon
        ? nativeRateMeta(name, meta)
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

// ── MATES' LEAGUES: WEB ONLY IN PHASE 1 ──
// Installed apps carry the web code they were built with, so phase 1 must not
// reach them: every league surface is gated on this, detected the way the
// rest of the app detects a native shell (capacitor: protocol, the
// html.native-app class, or the bridge itself).
const LEAGUES_WEB = (() => {
  try {
    return !IS_NATIVE && window.location.protocol !== "capacitor:" && !document.documentElement.classList.contains("native-app");
  } catch { return false; }
})();
// The league sheet's step survives AppInner's remount when a guest signs in
// (AppGate unmounts it while the new session's profile loads). Same key and
// shape as lib/leagues.js saveLeagueUi, inlined to keep that file out of
// Home's eager graph.
const LEAGUE_UI_KEY = "biq_league_ui";
// While the sheet's chunk loads: its backdrop, so the tap visibly landed.
// A function, so its label is read in the player's language at render time.
const leagueSheetFallback = () => <div aria-busy="true" aria-label={tl("ld.loading")} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.72)" }} />;
function readLeagueUiInline() {
  try { const v = JSON.parse(localStorage.getItem(LEAGUE_UI_KEY) || "null"); return v && Date.now() - v.at < 15 * 60000 ? v : null; } catch { return null; }
}
function writeLeagueUiInline(v) {
  try { if (v) localStorage.setItem(LEAGUE_UI_KEY, JSON.stringify({ ...v, at: Date.now() })); else localStorage.removeItem(LEAGUE_UI_KEY); } catch {}
}
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
  const t = useT();
  if (!IS_IOS_WEB && !IS_ANDROID_WEB) return null;
  // The visitor's own store badge — the same one the homepage row and the
  // static pages draw (src/components/StoreBadge.jsx). Was a 📲 emoji button.
  // ⚠️ NO COUNT in the caption. It said "5,000+ quiz questions" until
  // 2026-08-19 — disguise #8 of the binding no-counts rule. Sell breadth.
  return (
    <PlatformStoreBadge
      style={style}
      caption={t("ib.cta")}
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
const HOT_STREAK_MISS_S = 3;
function HotStreakEngine({ questions, onComplete, onBack, onHowToPlay, rulesOpen }) {
  const t = useT();
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
    // ⚠️ A WRONG ANSWER COSTS THREE SECONDS (14 Oct 2026). With no cost,
    // tapping at random won: a play-tester answered 34 at 29% and was called
    // "Poacher's instinct". Knowing now beats mashing. Best scores set before
    // this were set under softer rules.
    else if (timeLeft <= HOT_STREAK_MISS_S) {
      // The miss spends the last seconds: end now, not on the next tick, or a
      // fresh question shows at "0s" and can still be scored.
      clearInterval(timerRef.current); setTimeLeft(0); setDone(true);
    } else setTimeLeft(t => Math.max(0, t - HOT_STREAK_MISS_S));
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
  // What the player reads (i18n/questionText.js); scoring above keeps `q`.
  const qv = useLiveQuestion(q);

  return (
    <div className="quiz-wrap" onClick={onHoldTap}>
      {/* SR countdown at thresholds only — same pattern as QuizEngine.
          Hot Streak runs a 60s clock, so add a 30s waypoint. */}
      <div className="sr-only" role="timer" aria-live="assertive" aria-atomic="true">
        {timeLeft === 30 || timeLeft === 10 || timeLeft === 5 ? t("quiz.secsLeft", { n: timeLeft }) : timeLeft === 0 ? t("quiz.timesUp") : ""}
      </div>
      <div className="q-top">
        <button className="back-btn" onClick={() => { clearInterval(timerRef.current); onBack(); }} aria-label={t("game.goBack")}>←</button>
        <div className="prog-wrap"><div className="prog-bar" style={{width:`${pct}%`, background:barColor, transition:'width 1s linear'}} /></div>
        {picked && !picked.correct && <span className="hs-miss" aria-hidden="true">&minus;{HOT_STREAK_MISS_S}s</span>}
        <span className="q-ctr" style={{color: timeLeft <= 10 ? 'var(--red)' : 'var(--t2)', fontWeight: timeLeft <= 10 ? 800 : 500}}>{timeLeft}s</span>
        {onHowToPlay && <button className="icon-btn" onClick={onHowToPlay} aria-label={t("game.howTo")} title={t("game.howTo")}>?</button>}
      </div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <div style={{fontSize:12,color:'var(--t2)',fontFamily:"'Inter',sans-serif",letterSpacing:1}}>{t("hs.header")}</div>
        <div style={{fontFamily:"'JetBrains Mono','SF Mono',ui-monospace,monospace",fontVariantNumeric:"tabular-nums",fontSize:22,fontWeight:700,color:'var(--accent)'}}>{score} <span style={{fontFamily:"'Inter',sans-serif",fontSize:13,color:'var(--t3)',fontWeight:500}}>{t("hs.pts")}</span></div>
      </div>
      <div className="q-card">
        <div className="q-tag">{catLabel(t, q.cat)}</div>
        <div className="q-text">{qv.q}</div>
      </div>
      <div className="opts">
        {qv.o.map((opt, i) => {
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
      {picked && !picked.correct && qv.hint && (
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
            <div style={{fontSize:10,fontWeight:700,color:"var(--t3)",letterSpacing:0.2,fontFamily:"'Inter',sans-serif",display:"flex",alignItems:"center",gap:4}}><Lightbulb size={11} strokeWidth={2.5} aria-hidden="true" /> {t("quiz.why")}</div>
            {/* ⚠️ A skip nobody can see is not a skip. The hold is capped at
                1.8s, but a player racing a 60-second clock has no way to know
                a tap will work unless we say so. Muted on purpose — this is
                permission, not an instruction. */}
            <div style={{fontSize:10,fontWeight:600,color:"var(--t3)",fontFamily:"'Inter',sans-serif",whiteSpace:"nowrap",opacity:0.75}}>{t("hs.skip")}</div>
          </div>
          <div>{qv.hint}</div>
        </div>
      )}
    </div>
  );
}

// ─── TRUE OR FALSE ENGINE ─────────────────────────────────────────────────────
function TrueFalseEngine({ questions, onComplete, onBack, onHowToPlay }) {
  const t = useT();
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

  // What the player reads (i18n/questionText.js); answer() above keeps `q`.
  // A hook, so above the early returns; nothing is on screen once done.
  const qv = useLiveQuestion(done ? null : questions?.[idx]);

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
        <button className="back-btn" onClick={onBack} aria-label={t("game.goBack")}>←</button>
        <div className="prog-wrap"><div className="prog-bar" style={{width:`${((idx + (picked?1:0)) / total) * 100}%`}} /></div>
        <span className="q-ctr">{idx + 1}/{total}</span>
        {onHowToPlay && <button className="icon-btn" onClick={onHowToPlay} aria-label={t("game.howTo")} title={t("game.howTo")}>?</button>}
      </div>
      <div style={{textAlign:'center',padding:'8px 0 4px'}}>
        <span style={{fontSize:10,fontFamily:"'Inter',sans-serif",color:'var(--accent)',letterSpacing:2}}>{t("tf.label")}</span>
      </div>
      <div className="q-card" style={{minHeight:140,display:'flex',alignItems:'center',justifyContent:'center',textAlign:'center'}}>
        <div className="q-text" style={{fontSize:18,lineHeight:1.5}}>{qv?.s || qv?.q}</div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginTop:16}}>
        <button onClick={() => answer(true)} disabled={!!picked} style={tfStyle(true)}>
          {"✓ " + t("quiz.true")}
        </button>
        <button onClick={() => answer(false)} disabled={!!picked} style={tfStyle(false)}>
          {"✗ " + t("quiz.false")}
        </button>
      </div>
      {picked && (
        <div style={{textAlign:'center',marginTop:14,fontSize:16,fontWeight:700,color: picked.correct ? 'var(--green)' : 'var(--red)'}}>
          {picked.correct ? t("quiz.right") : t("quiz.wrong")}
        </div>
      )}
      {/* Right or wrong — see the QuizEngine explanation block. NOT applied to
          HotStreakEngine: that mode runs a 60-second clock, so a paragraph on
          every correct answer would break the thing it is for. */}
      {picked && qv.hint && (
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
          <div style={{fontSize:10,fontWeight:700,color:"var(--t3)",letterSpacing:0.2,fontFamily:"'Inter',sans-serif",marginBottom:4,display:"flex",alignItems:"center",gap:4}}><Lightbulb size={11} strokeWidth={2.5} aria-hidden="true" /> {t("quiz.why")}</div>
          <div>{qv.hint}</div>
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
    const packToQb = kind === "club" ? (await loadClubData()).CLUB_PACK_TO_QB : {};
    let filtered = kind === "cat" ? eligible.filter(q => q.cat === key)
      : kind === "club" ? eligible.filter(q => q.club === packToQb[key])
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



// The share-card renderer lives in lib/shareCardRender.js and loads on the
// first share, so its canvas code stays out of Home's eager JS.

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
    const { generateShareCard } = await import('./lib/shareCardRender.js');
    blob = await generateShareCard(type, data);
  } catch (err) {
    // Couldn't even render the card — fall straight to text.
    if (textFallback) {
      try {
        if (navigator.share) await navigator.share({ text: textFallback, url: "https://balliq.app" });
        else if (navigator.clipboard) {
          await navigator.clipboard.writeText(textFallback);
          onToast(tl("share.copied"));
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
        // A clued result says so here as on the card (lib/wordle.js).
        const cl = data.clue ? tl("share.lineClue") : "";
        // The line is the sharer's language (i18n step 6); the card stays English.
        if (data.failed) return tl("share.lineFootleFail", { n, cl, link: wLink });
        if (data.score === 1) return tl("share.lineFootleFirst", { n, link: wLink });
        return tl("share.lineFootle", { n, score: data.score, cl, link: wLink });
      }
      if (type === "hotstreak") return tl("share.lineHot", { score: data.score, link });
      if (data?.modeLabel && data?.score != null && data?.total != null) {
        return tl("share.lineScore", { score: data.score, total: data.total, label: data.shareLabel || data.modeLabel, link });
      }
    } catch {}
    return tl("share.lineAny", { link });
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
        const res = await NativeShareCard.share({ fileUrl: uri, text: SHARE_LINE });
        Filesystem.deleteFile({ path: fname, directory: Directory.Cache }).catch(() => {});
        // Resolves on share AND on sheet-dismiss. iOS says which in `completed`
        // (Android's chooser cannot know, and always reports true).
        return res?.completed !== false;
      } catch (err) {
        // Plugin missing ('not implemented') or failed — fall back to the
        // proven file-only sheet via @capacitor/share. No text: text+image
        // is exactly the payload that breaks Snapchat-class extensions.
        try {
          await CapShare.share({ files: [uri] });
          Filesystem.deleteFile({ path: fname, directory: Directory.Cache }).catch(() => {});
          return true;
        } catch (err2) {
          Filesystem.deleteFile({ path: fname, directory: Directory.Cache }).catch(() => {});
          // Dismissed sheet surfaces as "Share canceled" — user intent.
          if (/cancel/i.test(err2?.message || "")) return false;
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
      return true;
    }
  } catch (err) {
    // Some platforms reject on user dismiss — bail without falling further.
    if (err && err.name === "AbortError") return false;
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
    onToast(tl("share.saved"));
    return;
  } catch {}

  // Last-ditch text fallback.
  if (textFallback) {
    try {
      if (navigator.share) await navigator.share({ text: textFallback, url: "https://balliq.app" });
      else if (navigator.clipboard) {
        await navigator.clipboard.writeText(textFallback);
        onToast(tl("share.copied"));
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
  const t = useT();
  // The record stays English; the card prints it in the player's language.
  const { q, type, cat, options, userIdx, correctIdx, userText, correctText, isCorrect, timedOut } = useQuestionText().answer(a);
  // A true-or-false question stores its options as TRUE / FALSE.
  const optLabel = (opt) => (type === 'tf' && (opt === 'TRUE' || opt === 'FALSE') ? t(opt === 'TRUE' ? 'quiz.true' : 'quiz.false') : opt);
  return (
    <div className={`dr-q ${isCorrect ? 'dr-q-right' : 'dr-q-wrong'}`}>
      <div className="dr-q-head">
        <span className="dr-q-mark">{isCorrect ? '✓' : '✗'}</span>
        <span className="dr-q-num">{rich(t('quiz.qTight'), { n: index + 1 })}</span>
        {cat && <span className="dr-q-cat">{catLabel(t, cat)}</span>}
        {timedOut && <span className="dr-q-timeout">{t('rw.timedOut')}</span>}
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
                <span className="dr-opt-text">{optLabel(opt)}</span>
                {idx === correctIdx && <span className="dr-opt-tag">{t('rw.correctTag')}</span>}
                {idx === userIdx && !isCorrect && <span className="dr-opt-tag dr-opt-tag-user">{t('rw.yourPick')}</span>}
              </div>
            );
          })}
        </div>
      ) : type === 'typed' ? (
        <div className="dr-typed">
          {userText && (
            <div className={isCorrect ? 'dr-typed-row dr-typed-correct' : 'dr-typed-row dr-typed-user-wrong'}>
              <span className="dr-typed-mark">{isCorrect ? '✓' : '✗'}</span>
              <span>{rich(t('rw.typed'), { x: <strong>{userText}</strong> })}</span>
            </div>
          )}
          {!isCorrect && correctText && (
            <div className="dr-typed-row dr-typed-correct">
              <span className="dr-typed-mark">✓</span>
              <span>{rich(t('rw.correctIs'), { x: <strong>{correctText}</strong> })}</span>
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
  useT();
  const { passwordRecovery, clearPasswordRecovery, updatePassword } = useAuth();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  if (!passwordRecovery) return null;
  const submit = async () => {
    if (busy) return;
    if (pw.length < 6) { setErr(tl("au.pwShort")); return; }
    if (pw !== pw2) { setErr(tl("ap.pwMismatch")); return; }
    setBusy(true); setErr("");
    const { error } = await updatePassword(pw);
    setBusy(false);
    // The server's own message in English, as before; the app's words otherwise.
    if (error) { setErr((getLang() === "en" && error.message) || tl("ap.pwFail")); return; }
    setDone(true);
    setTimeout(() => clearPasswordRecovery(), 1800);
  };
  return (
    <div style={{position:"fixed",inset:0,zIndex:1200,background:"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{width:"100%",maxWidth:360,textAlign:"center"}}>
        <div style={{fontSize:40,marginBottom:10}}>{done ? "✅" : "🔒"}</div>
        <div style={{fontSize:20,fontWeight:900,color:"var(--t1)",marginBottom:6}}>{done ? tl("ap.pwUpdated") : tl("ap.pwSet")}</div>
        {done ? (
          <div style={{fontSize:14,color:"var(--t2)"}}>{tl("ap.pwWelcome")}</div>
        ) : (
          <>
            <div style={{fontSize:13,color:"var(--t2)",lineHeight:1.6,marginBottom:18}}>{tl("ap.pwSub")}</div>
            <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder={tl("ap.pwNew")} autoComplete="new-password"
              style={{width:"100%",padding:"14px 16px",marginBottom:10,borderRadius:12,border:"1px solid var(--border)",background:"var(--s1)",color:"var(--text)",fontSize:16,fontFamily:"inherit",outline:"none"}} />
            <input type="password" value={pw2} onChange={e => setPw2(e.target.value)} placeholder={tl("ap.pwRepeat")} autoComplete="new-password"
              onKeyDown={e => { if (e.key === "Enter") submit(); }}
              style={{width:"100%",padding:"14px 16px",marginBottom:14,borderRadius:12,border:"1px solid var(--border)",background:"var(--s1)",color:"var(--text)",fontSize:16,fontFamily:"inherit",outline:"none"}} />
            {err && <div style={{color:"#FF6B6B",fontSize:13,marginBottom:12}}>{err}</div>}
            <button onClick={submit} disabled={busy || !pw || !pw2}
              style={{width:"100%",border:"none",borderRadius:999,background:"var(--accent)",boxShadow:"0 8px 22px -8px rgba(88,204,2,0.55)",padding:15,fontSize:15,fontWeight:800,color:"var(--grn-ink)",cursor:"pointer",fontFamily:"inherit",opacity:(busy || !pw || !pw2) ? 0.6 : 1}}>
              {busy ? tl("ap.saving") : tl("ap.pwSave")}
            </button>
            <button onClick={clearPasswordRecovery} style={{marginTop:10,background:"transparent",border:"none",color:"var(--t3)",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>{tl("st.cancel")}</button>
          </>
        )}
      </div>
    </div>
  );
}

export function InstallBanner() {
  const t = useT();
  const { canPromptNative, platform, showBanner, promptInstall, dismiss } = useInstallBanner();
  // PHONES GET THE REAL APP, NOT THE WEB ONE (15 Oct 2026). On an iPhone or an
  // Android phone this banner told a player who had just won to add the
  // website to the home screen "for daily reminders": the native app's own
  // selling point, given away at the moment of highest intent. Phones now see
  // only the store badge in the finish panel (FootleGetAppCTA); the home-screen
  // install stays for desktop and tablets without a store app.
  if (IS_IOS_WEB || IS_ANDROID_WEB) return null;
  if (!showBanner) return null;
  return (
    <div className="install-banner" role="region" aria-label={t("ib.label")}>
      <span className="install-banner-icon" aria-hidden="true">⚽</span>
      <div className="install-banner-body">
        <div className="install-banner-title">{t("ib.title")}</div>
        <div className="install-banner-desc">
          {canPromptNative
            ? t("ib.native")
            : platform.isIOSSafari
              ? t("ib.ios")
              : t("ib.other")}
        </div>
      </div>
      <div className="install-banner-actions">
        {canPromptNative ? (
          <button type="button" className="install-banner-btn" onClick={promptInstall}>{t("ib.install")}</button>
        ) : platform.isIOSSafari ? (
          <span className="install-banner-ios" aria-label={t("ib.iosSteps")}>
            <span className="install-banner-ios-step">{t("ib.share")}</span>
            <span className="install-banner-ios-step">{t("ib.add")}</span>
          </span>
        ) : null}
        <button
          type="button"
          className="install-banner-dismiss"
          onClick={dismiss}
          aria-label={t("ib.dismiss")}
        >×</button>
      </div>
    </div>
  );
}

function NotifBell({ count, onClick, className, style }) {
  const t = useT();
  return (
    <button
      className={className || "icon-btn"}
      onClick={onClick}
      aria-label={count > 0 ? t("nav.notificationsNew", { count }) : t("nav.notifications")}
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

// "12 min ago": an invite is only worth joining while the room is live.
const agoLabel = (iso) => {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  return m < 1 ? tl("nc.justNow") : m < 60 ? tl("nc.minAgo", { n: m }) : tl("nc.hAgo", { n: Math.round(m / 60) });
};

function NotificationCenter({ open, requests, invites = [], onClose, onRespond, onJoinInvite, onDismissInvite, onClearInvites, onOpenFriend }) {
  useT();
  const panelRef = useRef(null);
  useModalA11y({ isOpen: open, onClose, ref: panelRef });
  if (!open) return null;
  const isEmpty = requests.length === 0 && invites.length === 0;
  return (
    <div className="notif-overlay" onClick={onClose}>
      <div ref={panelRef} tabIndex={-1} className="notif-panel" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={tl("nc.title")}>
        <div className="notif-hdr">
          <span className="notif-title">{tl("nc.title")}</span>
          <div className="notif-hdr-r">
            {invites.length > 1 && onClearInvites && (
              <button type="button" className="notif-clear" onClick={onClearInvites}>{tl("nc.clearAll")}</button>
            )}
            <button className="notif-close" onClick={onClose} aria-label={tl("nc.close")}>✕</button>
          </div>
        </div>
        {isEmpty ? (
          <div className="notif-empty">
            <div className="notif-empty-ic" aria-hidden="true">🔔</div>
            <div className="notif-empty-t">{tl("nc.empty")}</div>
            <div className="notif-empty-s">{tl("nc.emptySub")}</div>
          </div>
        ) : (
          <div className="notif-list">
            {/* Play invites first — they're time-sensitive (the room is live). */}
            {invites.map(inv => (
              <div key={inv.id} className="notif-item">
                <span className="notif-ava"><ProfilePic value={inv.actor_avatar} name={inv.actor_name} /></span>
                <div className="notif-body">
                  <div className="notif-line">{rich(tl("nc.invited"), { name: <strong>{inv.actor_name || tl("nc.someone")}</strong> })}</div>
                  <div className="notif-when">{agoLabel(inv.created_at)}</div>
                  <div className="notif-actions">
                    <button className="notif-btn notif-accept" onClick={() => onJoinInvite?.(inv)}>{tl("nc.join")}</button>
                    <button className="notif-btn notif-decline" onClick={() => onDismissInvite?.(inv)}>{tl("nc.dismiss")}</button>
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
                    aria-label={p.username ? tl("nc.viewProfile", { name: p.username }) : tl("nc.viewProfileBare")}
                  >
                    <ProfilePic value={p.avatar} name={p.username} />
                  </button>
                  <div className="notif-body">
                    <div className="notif-line">{rich(tl("nc.wants"), { name: <strong>{p.username || tl("nc.someone")}</strong> })}</div>
                    <div className="notif-actions">
                      <button className="notif-btn notif-accept" onClick={() => onRespond(r.id, true)}>{tl("nc.accept")}</button>
                      <button className="notif-btn notif-decline" onClick={() => onRespond(r.id, false)}>{tl("nc.decline")}</button>
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
// The words are the faq.* keys (i18n step 7), question and answer.
const FAQ_ENTRIES = [
  { q: "faq.online.q", a: "faq.online.a" },
  { q: "faq.invite.q", a: "faq.invite.a" },
  { q: "faq.late.q", a: "faq.late.a" },
  { q: "faq.footle.q", a: "faq.footle.a" },
  { q: "faq.delete.q", a: "faq.delete.a" },
  { q: "faq.offline.q", a: "faq.offline.a" },
  { q: "faq.search.q", a: "faq.search.a" },
  { q: "faq.report.q", a: "faq.report.a" },
];
const HelpScreen = React.memo(function HelpScreen({ onClose }) {
  useT();
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
          aria-label={tl("faq.close")}
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
        <div style={{fontSize: 17, fontWeight: 800, letterSpacing: "-0.3px"}}>{tl("faq.title")}</div>
      </div>
      <div style={{maxWidth: 680, margin: "0 auto", padding: "28px 20px 80px", lineHeight: 1.7}}>
        <div style={{fontSize: 22, fontWeight: 900, color: "var(--accent)", marginBottom: 8}}>⚽ {APP_NAME}</div>
        <div style={{fontSize: 13, color: "var(--t2)", marginBottom: 28}}>{tl("faq.sub")}</div>
        {/* Phase 6d Issue 3: reuse privacyH2/privacyP from PrivacyScreen so
            Help and Privacy read as visual siblings (same h2 weight/color,
            same body color, same vertical rhythm). Was using a bright
            var(--accent) on questions which was louder than anywhere else in
            the app. */}
        {FAQ_ENTRIES.map((entry, i) => (
          <React.Fragment key={i}>
            <h2 style={privacyH2}>{tl(entry.q)}</h2>
            <p style={privacyP}>{tl(entry.a)}</p>
          </React.Fragment>
        ))}
        <p style={{...privacyP, marginTop: 32}}>{rich(tl("faq.stuck"), { mail: <a href="mailto:hello@balliq.app" style={{color:"var(--accent)",textDecoration:"none"}}>hello@balliq.app</a> })}</p>
      </div>
    </div>
  );
});

// Sprint #28 Z2: Known Issues — a public-facing surface that documents
// expected limitations honestly so users don't have to guess. Reduces
// week-1 support volume (per CC's strategic assessment). Same overlay
// shape as HelpScreen / PrivacyScreen — reuses privacyH2 + privacyP
// so the trio reads as visual siblings.
// The words are the ki.* keys (i18n step 7), question and answer.
const KNOWN_ISSUES = [
  { q: "ki.session.q", a: "ki.session.a" },
  { q: "ki.device.q", a: "ki.device.a" },
  { q: "ki.wrong.q", a: "ki.wrong.a" },
  { q: "ki.sync.q", a: "ki.sync.a" },
  // "White flash at launch" entry removed 2026-06-11 — fixed (and its copy
  // described PWA behavior that doesn't apply to the native app).
];

const KnownIssuesScreen = React.memo(function KnownIssuesScreen({ onClose }) {
  useT();
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
          aria-label={tl("ki.close")}
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
        <div style={{fontSize: 17, fontWeight: 800, letterSpacing: "-0.3px"}}>{tl("ki.title")}</div>
      </div>
      <div style={{maxWidth: 680, margin: "0 auto", padding: "28px 20px 80px", lineHeight: 1.7}}>
        <div style={{fontSize: 22, fontWeight: 900, color: "var(--accent)", marginBottom: 8}}>⚽ {tl("ki.title")}</div>
        <div style={{fontSize: 13, color: "var(--t2)", marginBottom: 28}}>
          {tl("ki.sub")}
        </div>
        {KNOWN_ISSUES.map((entry, i) => (
          <React.Fragment key={i}>
            <h2 style={privacyH2}>{tl(entry.q)}</h2>
            <p style={privacyP}>{tl(entry.a)}</p>
          </React.Fragment>
        ))}
        <p style={{...privacyP, marginTop: 32}}>{rich(tl("ki.else"), { mail: <a href="mailto:hello@balliq.app" style={{color:"var(--accent)",textDecoration:"none"}}>hello@balliq.app</a> })}</p>
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
  const lang = useLang();
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
      setTimeStr(tl("time.hm", { h, m }));
    };
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, [lang]);
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
// How long a screen may show its spinner before it owns up. A screen's code is
// in the app on a phone and in the service worker's cache on the web, so it
// normally arrives in well under a second.
const SCREEN_SLOW_MS = 8000;

// A ScreenLoading label is the screen's English name, which is also its error
// boundary's name in the logs; what the player reads is its ld.* key (i18n
// step 7). A label missing here prints as it is.
const LOADING_KEY = {
  "Loading": "ld.loading", "Loading sign-in": "ld.signin", "Loading online": "ld.online",
  "Loading history": "ld.history", "Loading Footle": "ld.footle", "Loading results": "ld.results",
  "Loading settings": "ld.settings", "Loading review": "ld.review", "Loading clubs": "ld.clubs",
  "Loading quiz": "ld.quiz", "Loading profile": "ld.profile", "Loading multiplayer": "ld.multiplayer",
  "Loading lobby": "ld.lobby", "Loading Transfer Trail": "ld.trail", "Loading Top 10": "ld.top10",
  "Loading Stitch-up": "ld.stitch", "Loading the table": "ld.table", "Loading Top 10 lists": "ld.top10lib",
  "Loading Draft": "ld.draft", "Loading Mystery Player": "ld.mystery", "Loading Stadiums": "ld.stadiums",
  "Getting your questions": "ld.questions",
};
function ScreenLoading({ label = "Loading" }) {
  const t = useT();
  // ⚠️ A SPINNER WITH NO WAY OUT (Alex, 9 Oct 2026: he finished Daily 7 on a
  // flight and the app sat on "Loading results…" for good). When a screen's
  // code is neither on the device nor reachable, the request does not always
  // fail: on in-flight or hotel Wi-Fi it simply never answers, so nothing
  // throws, no boundary catches anything, and the spinner turns for ever with
  // the back gesture as the only exit. After a few seconds this says so and
  // offers Home. The load itself is left running: if the connection comes
  // back, the screen appears by itself.
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), SCREEN_SLOW_MS);
    return () => clearTimeout(t);
  }, []);
  // handleComplete stores a finished quiz before it asks for the results
  // screen, so for that screen this can be said, and Home will show the score.
  const savedNote = /results/i.test(label) ? t("ld.saved") : "";
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
        {LOADING_KEY[label] ? t(LOADING_KEY[label]) : label}…
      </div>
      {slow && (
        <div role="status" style={{display:"flex", flexDirection:"column", alignItems:"center", gap:14, padding:"6px 28px 0", textAlign:"center"}}>
          <div style={{fontSize:13.5, lineHeight:1.55, color:"var(--t2)", maxWidth:290}}>
            {t("ld.slow")}{savedNote}
          </div>
          <button
            type="button"
            onClick={() => { try { window.dispatchEvent(new Event("biq:go-home")); } catch { /* no window */ } }}
            style={{
              minHeight:44, padding:"11px 24px", background:"var(--accent)", border:"none", borderRadius:999,
              color:"var(--grn-ink)", fontFamily:"inherit", fontSize:14.5, fontWeight:800, cursor:"pointer",
            }}>
            {t("quiz.backHome")}
          </button>
        </div>
      )}
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
    if (window.__biqReloading) return; // stale chunk; main.jsx is reloading
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
            {this.props.onExit ? tl("ap.snagScreen") : tl("ap.snagTab")}
          </div>
          <div style={{fontSize:13.5, color:"var(--t2)", lineHeight:1.7, marginBottom:22, maxWidth:280}}>
            {tl("ap.snagSub")}
          </div>
          <button
            onClick={() => this.setState({ hasError:false })}
            style={{
              padding:"11px 24px", background:"var(--accent)", border:"none",
              borderRadius:999,boxShadow:"0 8px 22px -8px rgba(88,204,2,0.55)", fontFamily:"Inter,sans-serif", fontSize:13.5,
              fontWeight:700, color:"var(--grn-ink)", cursor:"pointer"
            }}
          >
            {tl("pf.retry")}
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
              {tl("quiz.backHome")}
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
  // i18n step 3: the two sheets of in-scope modes (Footle, Survival) keep their
  // lines in src/i18n/en.js as `${stepKey}.1`..`.5`; HotStreak and True or
  // False are other engines and move with them.
  wordle: { title:"Footle", stepKey:"help.footle" },
  // Step 6: Hot Streak and True or False moved too (help.hotstreak.*, help.truefalse.*).
  hotstreak: { titleKey:"home.mode.hotstreak", stepKey:"help.hotstreak" },
  truefalse: { titleKey:"help.truefalse.title", stepKey:"help.truefalse" },
  survival: { titleKey:"home.mode.survival", stepKey:"help.survival" },
};
// A sheet's title and lines in the current language.
function howToPlaySheet(mode, t) {
  const e = HOW_TO_PLAY[mode];
  if (!e) return null;
  return {
    title: e.titleKey ? t(e.titleKey) : e.title,
    steps: e.steps || [1, 2, 3, 4, 5].map((i) => t(`${e.stepKey}.${i}`)),
  };
}

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
// each. GetAppCTA too (15 Oct 2026): it read "No GetAppCTA here: the app has
// its own install banner", which is true inside the app, where the component
// draws nothing, and wrong on the website's /play, where a phone visitor who
// finished Transfer Trail, Top 10 or Mystery Player saw no way to the app.
const DAILY_SERVICES = { haptic, playSound, Confetti, GetAppCTA: FootleGetAppCTA, shareCard };

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
function ReportReasonSheet({ onPick, onSkip, onCancel }) {
  const ref = useRef(null);
  // ⚠️ onClose IS CANCEL, NOT SKIP. Escape and the backdrop used to call onSkip,
  // which FILES A REPORT — so there was no way out of this sheet that did not
  // write a row, and backing out of a sheet you opened by accident was
  // impossible. I filed one against a perfectly good question that way while
  // testing on 2026-09-07 (q_3d34d9, since deleted).
  //
  // The design note this preserves is real: "a second tap must never be the
  // price of" reporting. That is what "Just flag it" is for — one deliberate
  // tap, no reason, row written. What it never justified was treating a
  // DISMISSAL as a submission. 98 of 114 rows carry no reason, and an unknown
  // share of them are people who backed out; the channel cannot be read while
  // its loudest signal is ambiguous.
  useModalA11y({ isOpen: true, onClose: onCancel, ref });
  useT();
  // The labels are the rp.* keys (i18n step 7); the slug is what is stored.
  const REASONS = [
    ["wrong-answer", CircleX, tl("rp.wrong")],
    ["unclear", CircleHelp, tl("rp.unclear")],
    ["typo", Pencil, tl("rp.typo")],
    ["too-easy", Moon, tl("rp.easy")],
    ["too-hard", BrickWall, tl("rp.hard")],
  ];
  // Same sheet as the quit confirm (grab, head, stacked rows, quiet exit) so a
  // report feels like the app, not a browser prompt. Rows are the app's row
  // anatomy: icon well, one line, the whole row is the target.
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={tl("rp.aria")} onClick={onCancel}>
      <div ref={ref} tabIndex={-1} className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-grab" aria-hidden="true" />
        <div className="modal-head">
          <div className="modal-title">{tl("rp.title")}</div>
          <div className="modal-body">{tl("rp.sub")}</div>
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
          {/* Three exits, three MEANINGS. Pick a reason (above) is the useful
              one; "Just flag it" reports without one; "Cancel" writes nothing.
              Before this, all three did the same thing. */}
          <button type="button" className="modal-btn modal-quiet" onClick={onSkip}>{tl("rp.flag")}</button>
          <button type="button" className="modal-btn modal-quiet report-cancel" onClick={onCancel}>{tl("st.cancel")}</button>
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
  useT();
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
      {online ? tl("ap.backOnline") : tl("ap.offline")}
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
  // The chip the Quiz screen opens on: the last topic started this session, or
  // Everything. Not persisted; a cold start opens on Everything, as the mock.
  const [quizTopic, setQuizTopic] = useState("classic");
  // Mates' leagues (web only): the open table, and the create / join sheet.
  const [leagueId, setLeagueId] = useState(null);
  // Stitch-up: the link's token (null = the builder). Web only (LEAGUES_WEB).
  const [stitchToken, setStitchToken] = useState(null);
  const [leagueSheet, setLeagueSheetRaw] = useState(() => {
    if (!LEAGUES_WEB) return null;
    const v = readLeagueUiInline();
    return v && (v.kind === "join" || v.kind === "create") ? v : null;
  });
  const setLeagueSheet = useCallback((v) => { writeLeagueUiInline(v); setLeagueSheetRaw(v); }, []);
  const openLeagueTable = useCallback((id) => {
    if (!id) return;
    setLeagueSheet(null);
    setLeagueId(id);
    setScreen("league");
  }, [setLeagueSheet]);
  // A join or a create announces the table (lib/leagues.js announceLeagueOpen),
  // possibly from a sheet that this remount replaced: honour it either way.
  useEffect(() => {
    if (!LEAGUES_WEB) return undefined;
    const v = readLeagueUiInline();
    if (v && v.kind === "open" && v.id) openLeagueTable(v.id);
    const onOpen = (e) => openLeagueTable(e?.detail?.id);
    const onClaim = (e) => loopEvent("league-claim", { moved: Number(e?.detail?.moved) || 0 });
    window.addEventListener("biq:league-open", onOpen);
    window.addEventListener("biq:league-claimed", onClaim);
    // "Make it a league?" in the results panel (components/DailyDone.jsx).
    window.__biqOpenLeague = (opts) => {
      loopEvent("league-create-open", { from: opts?.from || "h2h" });
      const g = opts?.h2hGame;
      setLeagueSheet({ kind: "create", seed: ["footle", "trail", "top10", "daily7"].includes(g) ? `h2h_${g}` : "manual", vs: opts?.vs || "", h2h: opts?.h2h || null });
    };
    return () => {
      window.removeEventListener("biq:league-open", onOpen);
      window.removeEventListener("biq:league-claimed", onClaim);
      try { delete window.__biqOpenLeague; } catch {}
    };
  }, [openLeagueTable, setLeagueSheet]);
  const openLeagueCreateFromDaily = useCallback(() => {
    loopEvent("league-create-open", { from: "daily" });
    setLeagueSheet({ kind: "create", seed: "manual", vs: "", h2h: null });
  }, [setLeagueSheet]);
  // Joining or creating needs a session: a guest gets an anonymous one (the
  // /join/CODE mechanism); if that is switched off, the sign-in sheet opens.
  const ensureLeagueSession = useCallback(async () => {
    if (user) return true;
    const { error } = await signInAsGuest();
    if (error) { openAuthPrompt?.("league"); return false; }
    return true;
  }, [user, signInAsGuest, openAuthPrompt]);
  // The name a league table shows: the profile's, unless it is a server
  // default (player_…), else the guest name the app already uses.
  const leagueDisplayName = useMemo(() => {
    const u = authProfile?.username;
    if (user && !isAnonUser && u && !/^player_/i.test(u)) return u;
    return LEAGUES_WEB ? getGuestDisplayName() : "";
  }, [user, isAnonUser, authProfile?.username]);
  // Results that waited for a session go once there is one, sent with the
  // session's own token (lib/leagueResults.js, reached through lib/leagues.js).
  const leagueUid = user?.id || null;
  useEffect(() => {
    if (!LEAGUES_WEB || !leagueUid) return;
    import("./lib/leagues.js").then((m) => {
      m.setLeagueTokenSource(async () => {
        try { return (await supabase.auth.getSession()).data.session?.access_token || null; } catch { return null; }
      });
      return m.flushLeagueOutbox();
    }).catch(() => {});
  }, [leagueUid]);
  // One Top 10 list opened by name (?game=top10&list=<id>). Null is today's.
  const [top10ListId, setTop10ListId] = useState(null);
  // "lib" when a list was opened from the Top 10 browser, so Back returns there.
  const [top10From, setTop10From] = useState(null);
  // A list opened by name is for that one visit: leaving Top 10 any way at all
  // (Back, the tab bar, Home) forgets it, or Home's daily Top 10 row would
  // reopen yesterday's club list instead of today's.
  useEffect(() => { if (screen !== "top10") { setTop10ListId(null); setTop10From(null); } }, [screen]);
  // An installed app carries the Top 10 schedule it was built with. The site
  // serves the current one, and this fetches it a moment after start and
  // whenever the app comes back to the front (lib/top10Remote.js: checked
  // before it is kept, asked for at most every three hours, the bundled copy
  // always the fallback). The website never asks: its own bundle is the newest.
  // The tick is handed to Home so its row appears as soon as a longer schedule
  // has been kept; Home is memoised and would not otherwise draw again.
  const [top10Tick, setTop10Tick] = useState(0);
  useEffect(() => {
    if (!IS_NATIVE) return undefined;
    let live = true, told = false, toldDaily = false, toldSchedules = false;
    const bump = () => { if (live) setTop10Tick((n) => n + 1); };
    // The Daily 7 log comes through the same door at the same moments
    // (lib/dailyRemote.js). Nothing to redraw when it changes: the daily is
    // drawn when it is started, from whatever is kept by then.
    const goDaily = () => import('./lib/dailyRemote.js')
      .then((m) => m.refreshDailyLog())
      .then((r) => { if (r === 'rejected' && !toldDaily) { toldDaily = true; try { Sentry.captureMessage('daily7: the site\'s log was rejected by this build', 'warning'); } catch {} } })
      .catch(() => {});
    const goTop10 = () => import('./lib/top10Remote.js')
      .then((m) => m.refreshTop10())
      .then((r) => {
        if (r === 'updated') bump();
        // A build that can no longer read the site's file has gone dry and
        // nobody would know. Say so once a session.
        if (r === 'rejected' && !told) { told = true; try { Sentry.captureMessage('top10: the site\'s lists were rejected by this build', 'warning'); } catch {} }
      })
      .catch(() => {});
    // The Transfer Trail log and the Mystery schedule come through the same
    // door at the same moments (lib/scheduleRemote.js). Nothing to redraw:
    // each screen reads what is kept when it opens.
    const goSchedules = () => import('./lib/scheduleRemote.js')
      .then((m) => m.refreshSchedules())
      .then((r) => {
        const bad = Object.keys(r).filter((k) => r[k] === 'rejected');
        if (bad.length && !toldSchedules) { toldSchedules = true; try { Sentry.captureMessage(`schedules: the site's ${bad.join(' and ')} log was rejected by this build`, 'warning'); } catch {} }
      })
      .catch(() => {});
    const go = () => { goDaily(); goTop10(); goSchedules(); };
    const t = setTimeout(go, 2500);
    const onVis = () => { if (document.visibilityState === 'visible') go(); };
    document.addEventListener('visibilitychange', onVis);
    // The Top 10 screen fetches for itself when it has no list for the day.
    window.addEventListener('biq:top10-updated', bump);
    return () => { live = false; clearTimeout(t); document.removeEventListener('visibilitychange', onVis); window.removeEventListener('biq:top10-updated', bump); };
  }, []);
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
  // Join gate → hooks/useJoinGate.js (E16, 2026-09-06): the pending code from
  // the URL, the boot-time dead-code drop, the auto-join route (startMode is
  // declared further down, hence the ref), and the two refs the modal uses.
  const startModeRef = useRef(null);
  const { pendingJoinCode, setPendingJoinCode, clearPendingJoin, stage1RoomCode, setStage1RoomCode, joinGateRef, autoJoinRoutedRef } = useJoinGate({ user, isGuest, startModeRef });
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
      // A league invite (/l/TOKEN, or ?league= from api/l.js) shows its join
      // screen first: the card promised "free", not a tour.
      if (LEAGUES_WEB && (/^\/l\/./.test(path) || /[?&](league|leaguenew)=/.test(BOOT_SEARCH))) return true;
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
      if (["footle", "trail", "top10", "top10lists", "draft", "daily", "classic", "survival", "hotstreak", "legends", "chaos", "stadiums", "clubquiz", "leaguequiz", "online", ...(MYSTERY_ENABLED ? ["mystery"] : [])].includes(sp.get("game"))) return true;
      if (/^q_[a-z0-9]+$/.test((sp.get("eq") || "").trim().toLowerCase())) return true; // email answer link — the verdict must not land behind onboarding
      if (normalizeJoinCode(sp.get("join"))) return true; // legacy query-form invite
      if (/^q_[a-z0-9]+$/.test((sp.get("stump") || "").trim().toLowerCase())) return true;
      // Synchronous, so it cannot wait for the lazy CLUB_SLUG_TO_PACK. The club
      // index Home already carries has the identical slug set, and
      // club-routes-registered.test.js holds the two equal.
      const clubSlugQ = (sp.get("club") || "").toLowerCase();
      if (clubSlugQ && CLUB_INDEX.some((r) => r.s === clubSlugQ)) return true;
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
  // 1.1: set by the Home "Invite" button so OnlineEntry auto-creates a room and
  // drops the user in the lobby (where the real /join/CODE invite lives).
  const [onlineAutoCreate, setOnlineAutoCreate] = useState(false);

  // Pending invite code captured from `?join=` on cold start. Persisted to
  // localStorage so it survives the sign-in detour for guests / unsigned
  // users. Cleared once consumed (room joined, dismissed, or signed-out
  // away). The native app wrapper should hand the code in via the same
  // localStorage key after parsing the Universal / App Link.
  // Typed-code guest entry (Login.jsx's joinWithCode): when AppInner is
  // already mounted (local-guest overlay case) the localStorage write alone
  // is invisible — this event carries the code into live state, and the
  // existing gate modal / autoJoin routing takes it from there.
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
      setGuestJoinError(tl("au.guestOff"));
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
  // "Make it a league?" was offered under the Daily 7 head-to-head.
  useEffect(() => { if (LEAGUES_WEB && challengeResult) loopEvent("league-offer-shown", { game: "daily7" }); }, [challengeResult]);
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
  // The titles are keys (i18n step 7): tt.<screen>, the tabs' own tab.<tab>.
  const SCREEN_TITLES = {
    home: "tab.home", quiz: "tt.quiz", results: "tt.results", settings: "tt.settings",
    wordle: "tt.wordle", trail: "tt.trail", top10: "tt.top10", draft: "tt.draft", mystery: "tt.mystery",
    stadiums: "tt.stadiums", review: "tt.review", "daily-review": "tt.dailyReview",
    "puzzle-review": "tt.puzzleReview", "friend-profile": "tt.friendProfile",
    "blocked-users": "tt.blocked", "club-quiz": "tt.clubQuiz",
    "quiz-topics": "tt.quiz", stump: "tt.stump",
    "online-stage1": "tt.online", "online-stage1-lobby": "tt.lobby",
    "local-setup": "tt.local",
  };
  const TAB_TITLES = { home: "tab.home", daily: "tab.daily", online: "tab.online", profile: "tab.profile" };
  const titleLang = useLang();
  const screenTitle = useMemo(() => {
    if (screen === "home") return tl(TAB_TITLES[tab] || "tab.home");
    return SCREEN_TITLES[screen] ? tl(SCREEN_TITLES[screen]) : "";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, tab, titleLang]);
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
  // Set while startMode is awaiting its questions. The question bank is a lazy
  // ~2.4 MB chunk and on a cold cache — or a Save-Data connection, where it is
  // never prefetched — that await is seconds long with NOTHING rendered. Same
  // defect the lazy game screens had before ScreenLoading: "reads as a dead
  // button, not as loading", and this is the very first tap of a fresh install.
  const [startingQuiz, setStartingQuiz] = useState(false);
  const [result, setResult] = useState(null);
  const [wrongAnswers, setWrongAnswers] = useState([]);
  const [dailyReviewState, setDailyReviewState] = useState(null);
  const [puzzleReviewState, setPuzzleReviewState] = useState(null);
  const [cardDeltaState, setCardDelta] = useState(null); // what the last round did to the card (results screen)
  const [stats, setStats] = useState(() => {
    try {
      const raw = localStorage.getItem("biq_stats");
      if (raw) { const p = JSON.parse(raw); if (p && typeof p === "object") return p; }
    } catch {}
    return { gamesPlayed: 0, bestScore: 0, bestStreak: 0 };
  });
  // ── THE WEB'S ROUNDS, ONCE PER BOOT (2026-09-09) ──────────────────────────
  // A club page on this origin queues the answers of a round it finished; they
  // reach the card here, through the SAME writer every in-app round uses. Card
  // only — a website round earns no XP, no streak, no gamesPlayed.
  // ⚠️ DRAINED ONLY ONCE THE CLUB TABLES HAVE LANDED. These are club-page
  // answers, and the card files a club answer by the routes loadClubData()
  // registers; drained before that, they would land on the wrong face for
  // good. If the tables fail to load the queue simply waits for the next boot.
  useEffect(() => {
    loadClubData().then(() => {
      const pending = drainPendingRounds();
      if (!pending.length) return;
      setStats((prev) => {
        const next = { ...prev, catStats: recordAnswers(prev.catStats || {}, pending, { c: prev.totalCorrect || 0, a: prev.totalAnswered || 0 }) };
        safeSetItem("biq_stats", JSON.stringify(next));
        return next;
      });
    }, () => {});
  }, []);

  // ── YOUR LEAGUE ON THE CARD ───────────────────────────────────────────────
  // The card's first face is the player's own league. pickLeagueFace works it
  // out from what they answer and gets it right for most people, but it cannot
  // help the 7% of rated cards with NO league-category answers at all: they
  // wear the Premier League by pure fallback. Alex: "there might be germans
  // people that mostly watch bundesliga or spanish people that mostly watch la
  // liga you know."
  //
  // Stored on `stats` rather than `settings` because it belongs to the card,
  // and because stats is what syncs to the profile — a choice made on a phone
  // should survive a reinstall, which is the whole complaint that produced the
  // catStats merge in useAuth. `null` clears it back to automatic.
  const setCardLeague = useCallback((cat) => {
    setStats((prev) => {
      const next = { ...prev };
      if (cat) next.cardLeague = cat; else delete next.cardLeague;
      safeSetItem("biq_stats", JSON.stringify(next));
      return next;
    });
  }, []);

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
  // A promotion earned on a DAILY finish: { game, name, Icon }. It is shown as
  // one quiet line inside that game's DailyDone panel, never as the overlay
  // above (return research, 16 Oct 2026: the overlay covered the result the
  // player had just earned). Cleared when the player is back on Home.
  const [dailyPromotion, setDailyPromotion] = useState(null);
  const [howToPlay, setHowToPlay] = useState(null);
  // ⚠️ A STORED STREAK IS NOT AUTOMATICALLY A LIVE ONE — run it through
  // liveStreak(), which is the single rule for "is this still going today".
  // Printing the raw stored number would resurrect a streak that died weeks
  // ago; printing 0 whenever localStorage is empty is the bug this replaces.
  // See src/lib/streak.js.
  const [loginStreak, setLoginStreak] = useState(() => {
    try {
      const raw = localStorage.getItem("biq_login_streak");
      if (!raw) return 0;
      const p = JSON.parse(raw);
      let xpVal = 0, used = 0;
      try { xpVal = parseInt(localStorage.getItem("biq_xp") || "0", 10) || 0; } catch { /* fresh install */ }
      try { used = (JSON.parse(localStorage.getItem("biq_stats") || "{}") || {}).shieldsUsed || 0; } catch { /* fresh install */ }
      return liveStreak(p, localDayNow(), shieldsAvailable(xpVal, used));
    } catch { return 0; }
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
      // The fourth daily is Top 10 on a day it has a list and Mystery Player
      // otherwise (Top 10 took its place, 9 Oct 2026), so the widget's total
      // stays four and never counts a puzzle Home does not list in Today.
      const top10Live = isTop10Live();
      const fourthDone = top10Live ? loadTop10Day(ymd)?.status === "done" : mysteryDone;
      const done = (dailyDone ? 1 : 0) + (footleDone ? 1 : 0) + (trailDone ? 1 : 0) + (fourthDone ? 1 : 0);
      syncWidget({ date: ymd, done, total: 4, streak: loginStreak || 0 });
    } catch { /* widget is decoration */ }
    // top10Tick: which game is fourth can change when a longer schedule arrives
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyDone, loginStreak, top10Tick]);
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
      showToast(tl("ts.shield", { n: result.streak }));
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
        showToast(tl("ts.reset", { n: result.streak, best }), 4200);
      }
    }
    // Milestone celebration on the day-7/30/100 CROSSING itself (the tick),
    // not only when a game finishes on the milestone day — a user who opens
    // the app on day 7 but plays tomorrow previously never saw it.
    // handleComplete keeps its copy behind the same once-flags. Flags are
    // read from localStorage rather than stats state so deps stay [user?.id]
    // — depending on stats would re-run the mount tick on every stats change
    // (same constraint as the shield read above).
    // Day 3 joined 2026-10-04: it is the first day a run reads as a habit
    // rather than a coincidence, and before this the first celebration was a
    // week away. Toast and haptic only; confetti stays for 7/30/100.
    if (result.ticked && [3, 7, 30, 100].includes(result.streak)) {
      let persisted = {};
      try { persisted = JSON.parse(localStorage.getItem('biq_stats') || '{}') || {}; } catch {}
      const flag = `streak${result.streak}Celebrated`;
      if (!persisted[flag]) {
        const msg = tl({ 3: "ts.streak3", 7: "ts.streak7", 30: "ts.streak30" }[result.streak] || "ts.streak100");
        // 1200ms so it lands after the regular streak toast/pulse — same
        // delay handleComplete's copy uses.
        celebrationTimeoutsRef.current.push(setTimeout(() => { showToast(msg); haptic("heavy"); playSound("streak"); if (result.streak !== 3) setMilestoneConfetti(true); }, 1200));
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
    askShareName, askShareNameRef, shareNameDraft, setShareNameDraft, shareNameRef, cancelShareName,
  } = useShare({ user, showToast, profile, setProfile, authProfile, stats, xp, loginStreak, dailyScore });
  const todayKey = useMemo(() => keyForDate(new Date()), []);
  const [activeDailyDate, setActiveDailyDate] = useState(null);
  const [activeClub, setActiveClub] = useState(null);
  // The lazy club tables (null until they land, normally before Home finishes
  // painting). activeClub is only ever set by launchClubQuiz, which has
  // awaited them, so `activePack` is never null for a real club round.
  const clubs = useClubData();
  const activePack = (activeClub && clubs?.CLUB_PACKS[activeClub]) || null;
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
      showToast(tl("ts.repaired", { n: streakVal }));
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
  // Web push → hooks/useWebPush.js (E16, 2026-09-06).
  const { webPushOn, handleToggleWebPush } = useWebPush({ user, showToast });



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
      showToast(tl("ts.chExpired", { name: pendingChallenge.name || tl("ts.yourFriend") }));
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
  /**
   * Back out of the report sheet without filing anything.
   *
   * ⚠️ IT MUST STILL SETTLE THE PROMISE. reportQuestion() handed its caller a
   * promise and ReportButton is sitting on it showing "Sending…"; a cancel that
   * only closed the sheet would strand that button forever. Settles FALSE, so
   * the button returns to its idle "Report a problem" state rather than
   * claiming a success that never happened.
   *
   * No toast: a cancel is not an event, and confirming one is noise.
   */
  const cancelQuestionReport = useCallback(() => {
    setReportPending(null);
    const resolve = reportResolveRef.current;
    reportResolveRef.current = null;
    if (resolve) { try { resolve(false); } catch { /* gone */ } }
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
        showToast(tl("ts.reportFail"));
        return settle(false);
      }
      showToast(tl("ts.reportThanks"));
      return settle(true);
    } catch (e) {
      console.warn("[report_question]", e?.message || e);
      showToast(tl("ts.reportFail"));
      return settle(false);
    }
  }, [showToast]);


  // Audit 2.4: surface localStorage quota exhaustion. safeSetItem fires this
  // event once per session on QuotaExceededError; without this, quota loss
  // is silent and users see "progress not saving" with no explanation.
  useEffect(() => {
    const onQuotaExceeded = () => {
      showToast(tl('ts.storage'), 5000);
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
      const idleIndex = () => { try { prefetchQuestionIndex(); } catch {} loadQuizEngine().catch(() => {}); };
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
    // ⚠️ IN FOUR MODES `score` IS NOT A NUMBER OF CORRECT ANSWERS, and adding
    // it to totalCorrect is what makes the Profile "Accuracy" tile lie.
    // Measured across every row in `scores` (2026-09-10), score ÷ questions:
    //   mp:race 29,584%  ·  mystery 2,606%  ·  footle 358%  ·  trail 126%
    // against a sane 52-68% for every real quiz mode. Those four contribute
    // 26,081 of the 32,769 "correct answers" the app has ever counted — 80% of
    // the total — because they report POINTS, GUESSES and STEPS. One player's
    // tile read 67% off 209 Mystery points from nine games and 142 Footle
    // guesses; his real accuracy, from the per-answer log AND his daily rows
    // independently, is 50%. That tile sits on the same screen as the Ball IQ
    // card, so the card looked broken while it was the only honest number
    // there — Alex: "if he has 67% accuracy then the card does not make sense."
    // hotstreak and truefalse ARE correct-counts (60.7% / real), which is why
    // this is a different set from isSpecialMode above: that one is about
    // "score out of 10", this one about "score means answers".
    const scoreIsCorrectCount = !(mode === "mystery" || mode === "footle" || mode === "trail" || String(mode || "").startsWith("mp:"));
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
    // ⚠️ SUPERSEDED 2026-09-09 — the arithmetic moved to recordAnswers() in
    // lib/ballIqCard.js, beside the model that reads it, where it is unit-
    // tested: difficulty-weighted accuracy (Alex: "61% on easy equals 61; 61%
    // at medium should be 10% more rewarding, hard 20%"), per-answer decay
    // 0.995, faces fed by club play, and a legacy record's lifetime top-up
    // materialised on the first scored write. Read that file's header.
    const catStats = recordAnswers(stats.catStats || {}, newResult.allAnswers || [], { c: stats.totalCorrect || 0, a: stats.totalAnswered || 0 });
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
      // Both halves of the accuracy ratio move together or not at all — see
      // scoreIsCorrectCount. Counting one and not the other is how the
      // numerator ran away from the denominator in the first place.
      totalCorrect: (stats.totalCorrect || 0) + (scoreIsCorrectCount ? newResult.score : 0),
      // totalAnswered tracks the denominator for the Profile accuracy tile.
      // Older accounts pre-date this field and will see "—" on accuracy
      // until their next game tops it up.
      totalAnswered: (stats.totalAnswered || 0) + (scoreIsCorrectCount ? (newResult.total || 0) : 0),
      bestIQ: stats.bestIQ || null,
      bestHotStreak: mode === "hotstreak" ? Math.max(stats.bestHotStreak || 0, newResult.score) : (stats.bestHotStreak || 0),
      bestTrueFalse: mode === "truefalse" ? Math.max(stats.bestTrueFalse || 0, newResult.score) : (stats.bestTrueFalse || 0),
    };
    // THE CARD DELTA (2026-09-09): the results screen shows what this round
    // did to the card — "63 → 65 · UCL 56 → 68". Computed here, from the same
    // two records the writer just had, so the number on the results screen and
    // the number on the Profile can never disagree.
    try {
      const d = cardDelta(stats.catStats || {}, catStats,
        { c: stats.totalCorrect || 0, a: stats.totalAnswered || 0 },
        { c: updated.totalCorrect || 0, a: updated.totalAnswered || 0 },
        stats.cardLeague);
      setCardDelta(d);
      storeCardDelta(d); // the share line reads it back the same day
    } catch { setCardDelta(null); }
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
          showToast(tl("ts.syncFail"));
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
      // The League Quiz picker became the Quiz screen (16 Oct 2026). Old doors
      // (?game=leaguequiz, the site's League Quiz card) land on it with a
      // competition already picked, so they still arrive at "pick a league".
      if (m === "leaguequiz") { setQuizTopic((t) => (LEAGUE_QUIZ_BY_CAT[t] && t !== "Legends" ? t : "PL")); setScreen("quiz-topics"); return; }
      // Reset category for special modes that ignore it
      if (m === "daily" || m === "survival" || m === "legends" || m === "hotstreak" || m === "truefalse" || m === "chaos") setCat("All");
      if (m === "daily" && dailyDone) {
        showToast(tl("ts.d7Done", { n: dailyScore }));
        return;
      }
      setStartingQuiz(true);
      let qs = [];
      // ⚠️ diff:"hard" MEANS THE FULL RANGE, not hard-only (see getQs: it is a
      // ceiling, not a floor). Survival, Legends and Hot Streak used to pass the
      // `diff` state, which defaulted to "medium" -- and "medium" filters OUT
      // every q.diff==="hard" question. The difficulty pickers were the only UI
      // that ever wrote that state and they were retired on 2026-09-06; Classic
      // and Local were handed "hard" at the time and these three were missed.
      // So every player onboarded since has had a Survival that could not serve
      // a hard question, which is the exact harm 333d24b said it was removing.
      if (m === "daily") { qs = await getDailyQs(); setActiveDailyDate(new Date()); }
      else if (m === "survival") { qs = await getQs({ cat: "All", diff: "hard", n: 300, includeLegends: true }); }
      else if (m === "legends") { qs = await getQs({ cat: "Legends", diff: "hard", n: 10 }); }
      else if (m === "hotstreak") { qs = ((await getQs({ cat: "All", diff: "hard", n: 999 })) || []).filter(q => q.type !== "tf"); }
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
        if (!qs || qs.length < 5) { showToast(tl("ts.notEnough")); return; }
      }
      else if (m === "chaos") {
        // Chaos: quotes / moments / madness. Pull any QB row tagged chaos
        // (cat === "chaos" OR tag === "chaos"), ignore difficulty, shuffle 10.
        const { QB_CHAOS } = await loadQuestions();
        if (QB_CHAOS.length < 5) {
          showToast(tl("ts.notEnough"));
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
        showToast(tl("ts.noneFound"));
        return;
      }
      setQuestions(qs);
      setScreen("quiz");
    } catch (err) {
      console.error("[startMode]", err?.message || "Unknown error");
      showToast(tl("ts.modeFail"));
      // Sprint #77 SS6: forward to Sentry. This is the entry point for
      // every game mode — chunk-fetch failures on the lazy questions
      // bundle, malformed QB rows, getDailyQs throws, etc., all funnel
      // through here. Without this capture, launch-day "user couldn't
      // start a game" reports have no signal in Sentry. Mode tag lets
      // us filter by which entry failed.
      try {
        Sentry.captureException(err, { tags: { area: 'startMode', mode: m } });
      } catch {}
    } finally {
      // finally, not the happy path: every early return above this point
      // happens BEFORE the flag is raised, but a throw after it must not
      // leave the overlay stuck over a Home screen the player can still see.
      setStartingQuiz(false);
    }
  }, [user, isGuest, showFirstQuizTip, dailyDone, dailyScore, cat, showToast]);
  startModeRef.current = startMode;

  // Launch a specific club's quiz directly (used by the picker AND the Home
  // personalised tile). Prefers our verified, hint-bearing QB questions, and
  // remembers the club as the user's favourite so Home shows a "your club" shortcut.
  const launchClubQuiz = useCallback(async (clubKey) => {
    try {
      // Lazy tables: in hand already unless this is the very first tap of a
      // cold boot on a slow line (App.jsx starts the load at module eval).
      const { CLUB_PACKS, CLUB_PACK_TO_QB } = await loadClubData();
      const pack = CLUB_PACKS[clubKey];
      if (!pack) return;
      haptic("soft");
      let qs = null;
      const qbName = CLUB_PACK_TO_QB[clubKey];
      if (qbName) {
        try {
          const { QB, conflictsWith } = await loadQuestions();
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
              showToast(tl("ts.packDone", { name: pack.name }));
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
              return { ...q, o: idx.map(i => q.o[i]), a: idx.indexOf(q.a), realCat: q.cat, cat: "ClubQuiz", type: "mcq", _histKey: qbHistKey(q) };
            });
          }
        } catch {}
      }
      // Legacy inline fallback, loaded only on this path so its ~20 KB stays
      // off the eager GameRoot chunk (see src/data/legacyClubQuestions.js).
      if (!qs) {
        let legacy = [];
        try { legacy = (await import("./data/legacyClubQuestions.js")).LEGACY_CLUB_QUESTIONS[clubKey] || []; } catch {}
        qs = shuffle(legacy).slice(0, 10).map(q => ({ ...q, realCat: q.cat, type: "mcq", cat: "ClubQuiz" }));
      }
      if (!qs.length) { showToast(tl("ts.noClubQs")); return; }
      setActiveLeague(null);
      setActiveClub(clubKey);
      setMode("classic");
      setQuestions(qs);
      setScreen("quiz");
    } catch (e) {
      showToast(tl("ts.clubFail"));
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
      const { QB, conflictsWith } = await loadQuestions();
      // Retired packs withheld here too — the league draw bypasses getQs, and
      // the summer-2026 rows carry real cats (Transfers, WorldCup, Managers…).
      const pool = QB.filter(q => q && q.cat === catKey && q.type === "mcq" && Array.isArray(q.o)
        && (!q.tag || !RETIRED_TAGS.has(q.tag)));
      // League quizzes are for invested fans — never serve "easy". Fall back to
      // the full pool only if the no-easy pool can't fill 10 (none currently).
      const noEasy = pool.filter(q => q.diff !== "easy");
      const gradedPool = noEasy.length >= 10 ? noEasy : pool;
      if (gradedPool.length < 10) { showToast(tl("ts.noCompQs")); return; }
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
      showToast(tl("ts.leagueFail"));
    }
  }, [showToast]);
  // The profile card's Play button, per face. Most faces are a league quiz;
  // CLUBS is the one with none (its rating is built from the club packs), and
  // handing "Clubs" to launchLeagueQuiz returned silently: Alex tapped Play
  // under "Needs work · CLUBS" and nothing happened (23 Oct). It opens the
  // club quizzes instead.
  const playCardFace = useCallback((catKey) => {
    if (LEAGUE_QUIZ_BY_CAT[catKey]) { launchLeagueQuiz(catKey); return; }
    if (catKey === "Clubs") { haptic("soft"); setScreen("club-quiz"); }
  }, [launchLeagueQuiz]);

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
    // First-touch store (lib/firstTouch.js): kept for signup attribution and
    // for tagging store links. No-op on native and after the first visit.
    captureFirstTouch();
    // utm-landing — the only place a social short link's tag is recorded.
    // Until 2026-10-02 /t /ig /tt /x /yt /bs and every story sticker carried
    // utm_source all the way into the URL and nothing wrote it down, so "does
    // social send anyone?" had no answer (audit_2026-09-30/business.md §1.1).
    // One row per tagged landing; join to first-game-played on visitor_id to
    // read "tapped, then actually played". Values are clipped to a short
    // slug charset so a hand-edited URL cannot stuff free text into meta.
    try {
      const up = new URLSearchParams(window.location.search);
      const clean = (v) => (v || "").toLowerCase().replace(/[^a-z0-9_.-]/g, "").slice(0, 40);
      const src = clean(up.get("utm_source"));
      if (src) {
        const meta = { utm_source: src, path: (window.location.pathname || "").toLowerCase().slice(0, 40) };
        const content = clean(up.get("utm_content"));
        const medium = clean(up.get("utm_medium"));
        const campaign = clean(up.get("utm_campaign"));
        if (content) meta.utm_content = content;
        if (medium) meta.utm_medium = medium;
        if (campaign) meta.utm_campaign = campaign;
        loopEvent("utm-landing", meta);
      }
    } catch {}
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
      // Mates' leagues (web only): /l/TOKEN or ?league=TOKEN (api/l.js) opens
      // the join screen; ?leaguenew=SEED, from "Make it a league?" on a static
      // island, opens the create sheet. The /l/ path is NOT in the deep-link
      // files on purpose (spec section 10): old app builds would catch it.
      try {
        if (LEAGUES_WEB) {
          const lsp = new URLSearchParams(window.location.search);
          const pathTok = (window.location.pathname.match(/^\/l\/([^/?#]+)/) || [])[1];
          let lt = lsp.get("league");
          if (!lt && pathTok) { try { lt = decodeURIComponent(pathTok); } catch { lt = pathTok; } }
          const ln = lsp.get("leaguenew");
          if (lt || ln) {
            const u = new URL(window.location.href);
            ["league", "leaguenew", "vs", "h2h"].forEach((k) => u.searchParams.delete(k));
            window.history.replaceState({}, "", (u.pathname.startsWith("/l/") ? "/play" : u.pathname) + u.search + u.hash);
            if (lt) {
              try { localStorage.setItem("biq_league_invite", JSON.stringify({ token: lt, at: Date.now() })); } catch {}
              setLeagueSheet({ kind: "join", token: lt });
            } else {
              const h = (lsp.get("h2h") || "").split(".");
              const h2h = h.length === 4 && ["footle", "trail", "top10", "daily7"].includes(h[0])
                ? { game: h[0], edition: parseInt(h[1], 10) || 0, mine: parseInt(h[2], 10) || 0, theirs: parseInt(h[3], 10) || 0 } : null;
              const seed = ["h2h_footle", "h2h_trail", "h2h_top10", "h2h_daily7"].includes(ln) ? ln : "manual";
              loopEvent("league-create-open", { from: seed === "manual" ? "daily" : "h2h" });
              setLeagueSheet({ kind: "create", seed, vs: (lsp.get("vs") || "").slice(0, 22), h2h });
            }
            return;
          }
        }
      } catch {}
      // Stitch-up (web only): ?stitch=TOKEN from api/s.js (/s/ never reaches
      // the SPA: vercel.json sends it to the edge page), and ?stitch=new from
      // the Trail page's "Stitch up a mate". The screen parses and checks the
      // token itself. Kept this short on purpose: these bytes are Home's.
      try {
        const st = LEAGUES_WEB && new URLSearchParams(window.location.search).get("stitch");
        if (st) {
          window.history.replaceState({}, "", "/play");
          setStitchToken(st === "new" ? null : st.slice(0, 80));
          setScreen("stitch");
          return;
        }
      } catch {}
      // A Footle / Trail / Top 10 challenge (16 Oct 2026): ?gc=TOKEN from
      // api/c.js, or /c/TOKEN when a universal link opens the native app.
      // Stored for the game screen and the finish panel (lib/gameChallenge.js).
      try {
        const gcRaw = new URLSearchParams(window.location.search).get("gc") || (window.location.pathname.match(/^\/c\/([ftx]\.[^/?#]+)/) || [])[1];
        const gc = parseChallengeToken(gcRaw);
        if (gc) {
          storeChallenge(gc);
          const u = new URL(window.location.href);
          u.searchParams.delete("gc"); u.searchParams.delete("game");
          window.history.replaceState({}, "", (u.pathname.startsWith("/c/") ? "/play" : u.pathname) + u.search + u.hash);
          setScreen(gc.game === "footle" ? "wordle" : gc.game);
          return;
        }
      } catch {}
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
      const listSlug = (sp.get("list") || "").trim().toLowerCase(); // only read with ?game=top10
      if (!clubSlug && !quizSlug && !gameSlug && !stumpId && !tabSlug) return;
      try {
        const u = new URL(window.location.href);
        u.searchParams.delete("club"); u.searchParams.delete("quiz"); u.searchParams.delete("game"); u.searchParams.delete("stump"); u.searchParams.delete("tab"); u.searchParams.delete("list");
        window.history.replaceState({}, "", u.pathname + u.search + u.hash);
      } catch {}
      if (["home", "daily", "online", "profile"].includes(tabSlug)) { setScreen("home"); setTab(tabSlug); return; }
      if (gameSlug === "footle") { setScreen("wordle"); return; }
      // ?game=daily — the homepage Daily 7 door. startMode owns the
      // already-played-today case (shows the done state rather than a replay),
      // so this stays a one-liner on purpose.
      if (gameSlug === "daily") { startMode("daily"); return; }
      if (gameSlug === "trail") { setScreen("trail"); return; }
      // ?game=top10 opens today's list; &list=<id> opens one list by name, as
      // an archive play that never counts toward the day.
      if (gameSlug === "top10") { setTop10ListId(listSlug || null); setScreen("top10"); return; }
      if (gameSlug === "top10lists") { setScreen("top10lib"); return; }
      if (gameSlug === "draft") { setScreen("draft"); return; }
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
      // The slug map is lazy, so a ?club= link waits for it (already in flight
      // since module load); everything else routes synchronously as before.
      const routeDeepLink = (slugToPack) => {
        const packKey = slugToPack[clubSlug];
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
          showToast(tl("ts.noPack"));
          startMode("classic");
        }
      };
      if (clubSlug) loadClubData().then((d) => routeDeepLink(d.CLUB_SLUG_TO_PACK), () => routeDeepLink({}));
      else routeDeepLink({});
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
  // Local notifications → hooks/useLocalNotifications.js (E16, 2026-09-06):
  // the toggle, the reminder-window scheduling, the in-app prompt gate, the
  // permission reconcile and the midnight rollover.
  const { notifEnabled, setNotifEnabled, notifBlocked, notifTimerRef, handleToggleNotif, resultsRemindState, remindFromResults, maybePromptNotif } =
    useLocalNotifications({ user, dailyDone, loginStreak, showToast, initialStreakRef, webPushOn, handleToggleWebPush });
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

  // Tapping a reminder lands on Home — the notification's whole point is "play
  // today's puzzles", so land the user ON them. This used to send to the Daily
  // tab, which was right until 2026-09-06: that day the four daily rows moved
  // to Home and the tab became History. From then until now every reminder tap
  // arrived on a countdown, a streak strip and a table with no way to start
  // today's puzzle. The comment stayed true while the code stopped being.
  useEffect(() => {
    const off = onReminderTap(() => { setScreen("home"); setTab("home"); });
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

  // Results-screen "Remind me tomorrow" (2026-08-29): one state string keeps
  // TomorrowTeaser dumb. Native = local notifications (work signed-out);
  // web = push subscription (persists by account, so guests don't see it).

  // ONE return-loop panel under every decided daily (components/DailyDone.jsx).
  // Everything the panel needs from this file rides in this object: the
  // reminder state + handler, the app's one streak, "still open today" with
  // real navigation, the guest save action, and the analytics sink. Memoised so
  // the React.memo'd game screens don't re-render on every App state change.
  // The promotion line belongs to the finish that earned it. Back on Home the
  // level pill already says the new name, so the line is not carried into a
  // later Review of the same puzzle or another day's panel.
  useEffect(() => { if (screen === "home") setDailyPromotion(null); }, [screen]);
  // The panel's words follow the language (tl is i18n's t: this memo runs above AppInner's own `t`).
  const uiLang = useLang();
  const uiReady = isLangLoaded(uiLang);
  const dailyDoneServices = useMemo(() => {
    const nextUp = [];
    // `short`: the chip's name, the product's own.
    const today = (key, g) => ({ key, name: tl("dd.today", { g }), short: g });
    try {
      const ws = readWordleTodayStatus();
      if (ws.kind === "ready" || ws.kind === "in-progress") {
        nextUp.push({ ...(ws.kind === "in-progress" ? { key: "footle", name: tl("dd.contToday", { g: "Footle" }) } : today("footle", "Footle")),
          icon: <span className="fh-tile fh-tile-green" style={{ "--fh-tile": "22px", borderRadius: 6 }} aria-hidden="true">F</span>,
          onTap: () => setScreen("wordle") });
      }
    } catch {}
    if (!dailyDone) nextUp.push({ ...today("daily7", "Daily 7"), icon: <ClipboardList size={18} strokeWidth={2.2} />, onTap: () => startMode("daily") });
    try {
      if (getTrailAnswer() && !["won", "lost"].includes(loadTrailDay()?.status)) {
        nextUp.push({ ...today("trail", "Transfer Trail"), icon: <Route size={18} strokeWidth={2.2} />, onTap: () => setScreen("trail") });
      }
    } catch {}
    try {
      if (isTop10Live() && loadTop10Day(dateToYMD(new Date()))?.status !== "done") {
        nextUp.push({ ...today("top10", "Top 10"), icon: <ListOrdered size={18} strokeWidth={2.2} />, onTap: () => setScreen("top10") });
      }
    } catch {}
    try {
      // Not a daily on a day Top 10 has a list, so it is not "still open today".
      if (MYSTERY_ENABLED && !isTop10Live()) {
        const m = JSON.parse(localStorage.getItem(`biq_mystery_${dateToYMD(new Date())}`) || "null");
        if (!(m && (m.won || m.gaveUp))) nextUp.push({ ...today("mystery", "Mystery Player"), icon: <UserRoundSearch size={18} strokeWidth={2.2} />, onTap: () => setScreen("mystery") });
      }
    } catch {}
    // The day's dailies, for the Next up card's progress bar (16 Oct 2026).
    let dayKeys = ["footle", "daily7", "trail"];
    try { dayKeys = [...dayKeys, ...(isTop10Live() ? ["top10"] : MYSTERY_ENABLED ? ["mystery"] : [])]; } catch {}
    return {
      // `who`: the name a challenge link carries ('Alex solved it in 3').
      day: { keys: dayKeys, who: resolveChallengerName },
      remind: { state: resultsRemindState, onRemind: remindFromResults },
      // "daily streak" — the cross-mode one; the islands pass the per-game label.
      // keepsOnLoss: this streak ticks on ANY finished daily, a loss included
      // (onDailyDone -> tickLoginStreak), so the panel may say "Streak safe".
      // shields: banked freezes (one per 200 XP, max 3, lib/streak.js). Shown by
      // the streak so a player knows a missed day is covered BEFORE one is spent
      // (return research, 16 Oct 2026: they were only ever named after use).
      streak: { count: loginStreak || 0, label: tl("dd.l.daily"), keepsOnLoss: true, shields: Math.min(3, Math.max(0, Math.floor((xp || 0) / 200) - (stats?.shieldsUsed || 0))) },
      // The guest save line used to be its own card above this panel (Alex,
      // 2026-09-06: "does this look good?" — no). It is a row of the panel now:
      // what lives on this phone only, and the one tap that makes it follow them.
      save: (!user || isGuest) ? {
        onSave: () => { loopEvent("dd-save-tap"); openAuthPrompt?.("save"); },
        // The next rung is the one long-horizon come-back-tomorrow hook a guest
        // already has, and it lived three screens away on Profile ("192 XP to
        // go"). It now rides the line the player reads for a minute (critique
        // 2026-09-08, F1). getLevelInfo already computes it — no new data.
        line: ((stats?.gamesPlayed || 0) >= 2 || xp > 0) ? (() => {
          const li = getLevelInfo(xp);
          const toNext = li.nextLevel ? Math.max(0, (li.nextLevel.xpNeeded || 0) - xp) : 0;
          return `${levelName(li.level.name)} · ${xp} XP${li.nextLevel && toNext > 0 ? tl("dd.toNext", { n: toNext, name: levelName(li.nextLevel.name) }) : ''}`;
        })() : null,
      } : null,
      nextUp,
      // A promotion this daily finish earned; DailyDone shows it only under
      // the game that earned it ({ game, name, Icon } or null).
      promoted: dailyPromotion,
      track: (n, m) => loopEvent(n, m),
      // "Stitch up a mate" on the Trail's finish panel (web only).
      stitch: LEAGUES_WEB ? () => { setStitchToken(null); setScreen("stitch"); } : null,
    };
    // `screen` is a deliberate dep: the open/closed set changes when a game ends.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // top10Tick: the "still open today" rows name Top 10 or Mystery, whichever is today's fourth
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultsRemindState, remindFromResults, loginStreak, user, isGuest, dailyDone, startMode, screen, stats?.shieldsUsed, stats?.gamesPlayed, xp, top10Tick, resolveChallengerName, dailyPromotion, uiLang, uiReady]);
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

  // (Re)schedule the rolling window on open + whenever today's play state
  // changes (finishing Daily 7 flips dailyDone → reschedule with skipToday).

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
    // ⚠️ THE DENOMINATOR TOO. This path bumped totalCorrect on a right answer
    // and never bumped totalAnswered, so the Profile accuracy tile
    // (totalCorrect / totalAnswered) read 100% for a guest who had just gone
    // 6/7 on the Daily 7 — photographed by the 2026-09-08 critique (F5).
    const totalAnswered = (base.totalAnswered || 0) + 1;
    safeSetItem("biq_stats", JSON.stringify({ ...base, gamesPlayed, totalCorrect, totalAnswered }));
    setStats((prev) => ({ ...prev, gamesPlayed, totalCorrect, totalAnswered }));
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

  // opts.daily: the daily's key ('footle' | 'daily7' | 'trail' | 'top10' |
  // 'mystery'). A promotion on a daily finish becomes a quiet line inside that
  // finish (dailyPromotion -> DailyDone `promoted`), never the overlay. Every
  // other mode keeps the full-screen celebration.
  const awardXp = useCallback((earned, opts) => {
    if (!earned || earned <= 0) return;
    const dailyKey = opts?.daily || null;
    setXp(prev => {
      const oldInfo = getLevelInfo(prev);
      const newXp = prev + earned;
      const newInfo = getLevelInfo(newXp);
      safeSetItem("biq_xp", String(newXp));
      const leveledUp = newInfo.level.name !== oldInfo.level.name;
      // XP toast intentionally not fired here — every result screen
      // already shows a static "+N XP earned" footer, so the floating
      // toast was duplicating the same indicator. Level-ups outside the
      // dailies still get the full-screen levelUpOverlay below.
      if (leveledUp && dailyKey) {
        // Out of the updater (a state set inside another state's updater is
        // render-phase work). No haptic, no sound, no confetti: the result is
        // the moment, the promotion is a footnote to it.
        setTimeout(() => setDailyPromotion({ game: dailyKey, name: newInfo.level.name, Icon: newInfo.level.Icon }), 0);
      } else if (leveledUp) {
        if (levelUpTimerRef.current) clearTimeout(levelUpTimerRef.current);
        levelUpTimerRef.current = setTimeout(() => {
          setLevelUpOverlay({ name: newInfo.level.name, Icon: newInfo.level.Icon }); haptic("levelup"); playSound("levelup");
          levelUpTimerRef.current = setTimeout(() => setLevelUpOverlay(null), TIMINGS.STREAK_TOAST);
        // 1600, not 400 (2026-10-07): at 400 the overlay covered the result
        // while its score was still counting up (200ms delay + 900ms), so the
        // player never saw the number land. The score finishes first, then the
        // level-up takes the screen.
        }, 1600);
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
      // Top 10 has no "solved": a round that found at least half the list is
      // the good day there (its dispatch says so in `positive`).
      const sealed = dailyGame === 'top10' ? e.detail.positive === true : e.detail.won === true;
      if ((dailyGame === 'footle' || dailyGame === 'trail' || dailyGame === 'mystery' || dailyGame === 'top10') && sealed) {
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
        awardXp(getFootleXP(e.detail.won === true, e.detail.guesses), { daily: 'footle' });
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
        awardXp(e.detail.won === true ? 40 : 10, { daily: 'trail' });
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
        if (mysteryWon) awardXp(tries <= 5 ? 50 : tries <= 15 ? 35 : 20, { daily: 'mystery' });
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
      // Top 10. Every finish is a completion (it ticked the streak above, like
      // a lost Footle), and the XP follows the score: four a name, fifteen more
      // for all ten. The scores row has a quiz round's shape, names found out of
      // ten, so "what do people play, and how well" reads it without a special
      // case. Wired on the day the mode was built, per the Trail's lesson.
      if (e?.detail?.game === 'top10') {
        const found = Math.max(0, Math.min(10, e.detail.score || 0));
        awardXp(found * 4 + (e.detail.won === true ? 15 : 0), { daily: 'top10' });
        recordPlay(e.detail.positive === true);
        if (user?.id) {
          saveScore(user?.id, {
            game_mode: 'top10',
            score: found,
            correct_answers: found,
            total_questions: 10,
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
      // ⚠️ THE RUN FEEDS THE CARD. `solved` of `total` grounds in a named
      // league is a clean ratio against a known face — the one mode outside
      // handleComplete that is genuinely rateable. Difficulty is "unknown"
      // because the stadium list carries no per-question grade; recordAnswers
      // files those in the `u` bucket at average weight rather than quietly
      // paying them the medium multiplier.
      const scat = STADIUM_LEAGUE_TO_CAT[d.league];
      const stot = Math.max(0, d.total || 0);
      if (scat && stot > 0) {
        const got = Math.max(0, Math.min(stot, d.solved || 0));
        const rows = Array.from({ length: stot }, (_, i) => ({
          cat: scat, diff: "unknown", isCorrect: i < got,
        }));
        // ⚠️ catStats ONLY — recordPlay below already moves the aggregate
        // counters, and it counts a whole run as ONE answer. Adding the twenty
        // here as well made a single sweep worth 21 answers and 15 correct.
        // The card reads catStats (rawAccuracy), so the real per-question
        // detail lands where it is used, and the coarse legacy counters keep
        // the convention every other daily mode already follows.
        setStats((prev) => {
          const next = { ...prev, catStats: recordAnswers(prev.catStats || {}, rows, { c: prev.totalCorrect || 0, a: prev.totalAnswered || 0 }) };
          safeSetItem("biq_stats", JSON.stringify(next));
          return next;
        });
      }
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
    // The Draft: a start and a finish, nothing more. It is not one of the four
    // dailies yet (screens/Draft.jsx), so no XP, no streak and no `scores` row:
    // its points run to ninety and would sit beside quiz scores out of ten in
    // that table. The funnel pair answers "how many start it, and finish".
    const onDraftStart = (e) => {
      const d = e?.detail || {};
      loopEvent('draft-start', { no: d.no, practice: !!d.practice });
    };
    const onDraftFinish = (e) => {
      const d = e?.detail || {};
      loopEvent('draft-finish', { no: d.no, points: d.points, par: d.par, practice: !!d.practice });
    };
    window.addEventListener('biq:draft-started', onDraftStart);
    window.addEventListener('biq:draft-completed', onDraftFinish);
    // Widget repaint rides the same event: a SECOND same-day completion
    // leaves loginStreak untouched (tick no-op), so the state-driven sync
    // effect would not re-fire — the direct call covers that gap.
    const onDailyDoneAndSync = (e) => { onDailyDone(e); setTimeout(syncDailyWidget, 400); };
    window.addEventListener('biq:daily-completed', onDailyDoneAndSync);
    return () => {
      // (Also fixes a leak: the stadiums listener was never removed.)
      window.removeEventListener('biq:stadiums-completed', onStadiumsDone);
      window.removeEventListener('biq:stadiums-exit', onStadiumsExit);
      window.removeEventListener('biq:draft-started', onDraftStart);
      window.removeEventListener('biq:draft-completed', onDraftFinish);
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

  // Keep the Settings toggle honest: if the user revoked notifications in iOS
  // Settings, the stored 'enabled' flag is stale (scheduleReminderWindow silently
  // no-ops without permission, so the toggle would read ON while nothing fires).
  // Reconcile against the live OS permission on mount and on app foreground.

  // Re-anchor the rolling reminder window when the day flips while the app is
  // left open. Otherwise "today" drifts off offset 0 and cancelTodayReminder()
  // cancels a stale id, nagging the user tonight after they've already played.


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
      if (newTotal === 10) showToast(tl("ts.games10"));
      else if (newTotal === 50) showToast(tl("ts.games50", { app: APP_NAME }));
      else if (newTotal === 100) showToast(tl("ts.games100", { app: APP_NAME }));
      else if (newTotal % 25 === 0 && newTotal > 10) showToast(tl("ts.gamesN", { n: newTotal }));
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
    if (loginStreak === 3 && !stats.streak3Celebrated) {
      celebrationTimeoutsRef.current.push(setTimeout(() => { showToast(tl("ts.streak3")); haptic("heavy"); playSound("streak"); }, 1200));
      setStats(p => ({...p, streak3Celebrated: true}));
    } else if (loginStreak === 7 && !stats.streak7Celebrated) {
      celebrationTimeoutsRef.current.push(setTimeout(() => { showToast(tl("ts.streak7")); haptic("heavy"); playSound("streak"); setMilestoneConfetti(true); }, 1200));
      setStats(p => ({...p, streak7Celebrated: true}));
    } else if (loginStreak === 30 && !stats.streak30Celebrated) {
      celebrationTimeoutsRef.current.push(setTimeout(() => { showToast(tl("ts.streak30")); haptic("heavy"); playSound("streak"); setMilestoneConfetti(true); }, 1200));
      setStats(p => ({...p, streak30Celebrated: true}));
    } else if (loginStreak === 100 && !stats.streak100Celebrated) {
      celebrationTimeoutsRef.current.push(setTimeout(() => { showToast(tl("ts.streak100")); haptic("heavy"); playSound("streak"); setMilestoneConfetti(true); }, 1200));
      setStats(p => ({...p, streak100Celebrated: true}));
    }

    // 🎉 PERFECT SCORE celebration
    if (res.score === res.total && res.total >= 5 && mode !== "survival") {
      celebrationTimeoutsRef.current.push(setTimeout(() => showToast(tl("ts.perfect")), 800));
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
      celebrationTimeoutsRef.current.push(setTimeout(() => showToast(tl(isFirst ? "ts.firstScore" : "ts.pb", { n: res.score })), 1400));
      haptic("hardCorrect");
    }

    // 🔥 HOT STREAK personal best
    if (mode === "hotstreak" && res.score > (stats.bestHotStreak || 0) && res.score >= 5) {
      const isFirst = !stats.bestHotStreak;
      celebrationTimeoutsRef.current.push(setTimeout(() => showToast(tl(isFirst ? "ts.hotFirst" : "ts.hotBest", { n: res.score })), 1400));
      haptic("hardCorrect");
    }

    // 🔄 COMEBACK celebration — got Q1 wrong, then nailed the rest
    if (mode === "classic" && res.wrongAnswers && res.wrongAnswers.length === 1 && res.score >= 8) {
      celebrationTimeoutsRef.current.push(setTimeout(() => showToast(tl("ts.comeback")), 1600));
    }

    // 🎖️ CATEGORY MASTERY — 10+ correct in a row from same category
    if (mode === "hotstreak" && res.score >= 10 && cat && cat !== "All") {
      celebrationTimeoutsRef.current.push(setTimeout(() => showToast(tl("ts.mastery", { cat: getLang() === "en" ? cat : catLabel(tl, cat), n: res.score })), 1600));
    }


    // SURVIVAL new best. ⚠️ Saved for EVERY new best, not only from 10 up: the
    // screen's "PB" read the Daily 7's best run instead (stats.bestStreak) and
    // a real Survival best under 10 was never kept (play-test, 14 Oct 2026).
    // The toast still waits for a run worth announcing.
    if (mode === "survival" && res.score && res.score > (stats.bestSurvival || 0)) {
      if (res.score >= 10 || (stats.bestSurvival || 0) > 0) {
        celebrationTimeoutsRef.current.push(setTimeout(() => showToast(tl("ts.survivalBest", { n: res.score })), 1400));
      }
      // Written straight to storage, as setCardLeague does: saveStats ran
      // earlier in this handler from the old stats, so a state update alone
      // was lost when the app closed (review, 14 Oct 2026).
      setStats(p => { const next = {...p, bestSurvival: res.score}; safeSetItem("biq_stats", JSON.stringify(next)); return next; });
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
        || (mode === "survival" && res.score > (stats.bestSurvival || 0));
      const peak = mode === "daily" || isPB;
      const notifWillClaim = IS_NATIVE && mode === "daily"
        && localStorage.getItem('biq_notif_enabled') !== '1'
        && parseInt(localStorage.getItem('biq_notif_asks_v2') || '0', 10) < 2;
      // Level-up guard (fresh-code audit): the full-screen level-up overlay
      // owns +400..+3900ms; the auth sheet at +2000ms would cover it. Skip
      // and leave the once-flag unset so the nudge takes the next peak.
      // (Note: in the normal path the flag is set at SCHEDULE time, 2s
      // before the sheet is actually displayed.)
      const nudgeEarned = getXPForResult(res.score, res.total, mode);
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
    const earned = getXPForResult(res.score, res.total, mode);
    awardXp(earned, mode === "daily" ? { daily: "daily7" } : undefined);


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
    // ⚠️ The result carries its OWN mode and daily edition. startMode() sets
    // the new mode before it awaits the next question set, so the results
    // screen re-rendered for a moment with mode "daily" and the PREVIOUS
    // game's result. DailyDone then recorded that score as today's Daily 7:
    // daily_results held buckets of 8 and 10 out of 7 (2026-09-22 to 10-03).
    // Archive replays also recorded into today's edition, since the date was
    // cleared before the results screen read it.
    const dailyDay = mode === "daily" ? dayIndexForDate(activeDailyDate || new Date()) : null;
    // `prevBest`: the Survival best from BEFORE this run, so the results screen
    // can say "Personal best, was N" (stats.bestSurvival already holds the new one).
    setResult({ ...res, mode, ...(mode === "survival" ? { prevBest: stats.bestSurvival || 0 } : {}), ...(dailyDay != null ? { dailyEdition: dailyDay, dailyArchive: dailyDay !== dayIndexForDate(new Date()) } : {}) });
    setWrongAnswers(res.wrongAnswers || []);
    setScreen("results");
  }, [mode, stats, loginStreak, cat, ratePromptShown, todayKey, hotstreakBest, saveStats, showToast, activeDailyDate, questions, pendingChallenge, clearChallenge, awardXp, isGuest, openAuthPrompt, xp, markFirstGameFinished]);

  const updateSettings = useCallback((patch) => {
    setSettings(prev => {
      const updated = { ...prev, ...patch };
      safeSetItem("biq_settings", JSON.stringify(updated));
      return updated;
    });
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
    showToast(tl("ts.histCleared"));
  }, [showToast]);

  // Called by SettingsScreen after the delete_user_account RPC has finished.
  // We reset our own in-memory state so the brief moment between the RPC
  // returning and AppGate routing back to the login screen doesn't show a
  // stale leaderboard / IQ history. Errors surface as a toast.
  const onAccountDeleted = useCallback(({ error }) => {
    if (error) {
      showToast(tl("ts.deleteFail"));
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
    showToast(tl("ts.deleted"));
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
        showToast(tl("ts.resetFail"));
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
    showToast(tl("ts.statsCleared"));
  }, [showToast, user?.id]);

  // Ball IQ is dark-only (light theme removed 2026-07-15). Strip a stale
  // `.light` class off html/body for anyone whose saved settings still carry
  // theme:"light" from before the removal — without this they'd keep the old
  // class on every boot and resolve half-missing light tokens.
  useEffect(() => {
    document.body.classList.remove("light");
    document.documentElement.classList.remove("light");
    // ⚠️ Style.Dark, NOT Style.Light. Capacitor names the style after the
    // BACKGROUND it is for: Dark = light glyphs on a dark app. This line said
    // Light under a comment that read it the other way round, so the clock and
    // signal icons were dark on a dark screen on every screen of the iPhone app
    // (seen in the simulator and in Alex's own screenshots, 2026-10-08), and it
    // overrode capacitor.config.json, which has had "DARK" right all along.
    try {
      if (Capacitor.isNativePlatform?.()) {
        StatusBar.setStyle({ style: StatusBarStyle.Dark }).catch(() => {});
      }
    } catch {}
  }, []);

  const inGame = ["quiz","local-game","local-results"].includes(screen);
  // EVERY screen where a round is actually running. `inGame` covers only the
  // three shared-quiz screens; Footle, Trail, Mystery and Stadiums are just as
  // much "in a game", and every guard that used the narrower value let
  // something interrupt a live round on them. This expression existed three
  // times -- twice inline, once inside an effect -- which is exactly how the
  // join gate and the web chrome came to disagree with the analytics that
  // already counted all seven. One value, so they cannot drift again.
  const playing = inGame || ["wordle","trail","top10","draft","mystery","stadiums"].includes(screen);
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
    window.addEventListener('biq:draft-completed', onDone);
    // A finished Trail or Top 10 opened again to look at it. Those screens no
    // longer re-announce the finish (that paid the XP twice), so they say this
    // instead: no XP, no scores row, only "this visit is not an abandonment".
    window.addEventListener('biq:daily-reviewed', onDone);
    return () => {
      window.removeEventListener('biq:daily-reviewed', onDone);
      window.removeEventListener('biq:daily-completed', onDone);
      window.removeEventListener('biq:stadiums-completed', onDone);
      window.removeEventListener('biq:draft-completed', onDone);
    };
  }, []);

  // ⚠️ THE STEP THAT SEPARATES "STUCK" FROM "CHOSE NOT TO PLAY". Reaching Home
  // signed in means the app is usable — past auth, past the mandatory username
  // wall, past onboarding. Someone who records acct-session but never
  // acct-home was BLOCKED by something; someone who records acct-home and never
  // acct-game-reached looked at the app and did not start. Those are opposite
  // problems with opposite fixes, and right now we cannot tell them apart for
  // any of the 79 accounts that never played.
  useEffect(() => {
    if (!user?.id || screen !== "home") return;
    markAcctStep(user.id, 'acct-home', loopEvent);
  }, [user?.id, screen]);


  // ⚠️ WARM THE FINISH SCREENS THE MOMENT PLAY STARTS. Results/ModeResults are
  // lazy so Home does not carry them, but the screen they paint is the peak of
  // the session and must never wait on a network round trip. `playing` covers
  // every mode (quiz, Footle, Trail, Mystery, Stadiums) from the same predicate
  // the other play-time effects use, so this fires once, early, and the chunk
  // is resolved minutes before a finish is possible.
  //
  // Failure is deliberately silent: this is an optimisation, and if the
  // prefetch does not land the Suspense fallback still renders the screen.
  useEffect(() => {
    if (!playing) return;
    import('./screens/ResultsScreen.jsx').catch(() => {});
    import('./screens/ModeResults.jsx').catch(() => {});
    loadQuizEngine().catch(() => {});
  }, [playing]);

  // first-game-played — the honest counterpart to first-game-reached.
  //
  // "Reached" fires on render and therefore counts arrivals; this one requires
  // the player to actually DO something inside a game. It listens for the first
  // pointerdown or keydown while `playing` is true, which is deliberately
  // mode-agnostic: a tap on a Footle key, a quiz option, a Trail row and a
  // Stadiums guess are four different code paths and one gesture. Hooking the
  // launchers instead would mean seven hooks that drift apart — the same reason
  // the comment above gives for keying off `playing` rather than a launcher.
  //
  // Once per device, like its sibling, under its own key so devices that
  // already fired the old event are not excluded from this new series.
  // Gated on isSyntheticTraffic() through loopEvent, which every writer here
  // passes through.
  //
  // One gesture, TWO writers: the anonymous device event and the attributable
  // account step. ⚠️ Their guards are separate on purpose — the device key must
  // not gate the account step, or a device that already recorded the anonymous
  // event would never record acct-game-played for a NEW account signing in on
  // it, which is precisely the person this funnel exists to find.
  useEffect(() => {
    if (!playing) return;
    let deviceDone;
    try { deviceDone = !!localStorage.getItem("biq_first_game_played"); } catch { return; }
    if (deviceDone && !user?.id) return;   // nothing left for either writer to say
    const fire = () => {
      try {
        if (!localStorage.getItem("biq_first_game_played")) {
          localStorage.setItem("biq_first_game_played", "1");
          loopEvent("first-game-played", { mode: mode || screen });
        }
      } catch { /* private mode: no counting, no crashing */ }
      // Its own per-account, per-device guard lives inside markAcctStep.
      markAcctStep(user?.id, 'acct-game-played', loopEvent, { mode: mode || screen });
    };
    // { once: true } on each, and capture, so a handler that stops propagation
    // inside a game screen cannot swallow the signal.
    const opts = { once: true, capture: true, passive: true };
    window.addEventListener("pointerdown", fire, opts);
    window.addEventListener("keydown", fire, opts);
    return () => {
      window.removeEventListener("pointerdown", fire, true);
      window.removeEventListener("keydown", fire, true);
    };
  }, [playing, mode, screen, user?.id]);

  // Sprint #64 FF2: toggle body.in-focused-play during quiz / Footle so the
  // web app bar (.fd-appbar, app.css) hides while the user is mid-game. It
  // used to hide the desktop landing chrome too; that chrome was deleted from
  // index.html on 2026-09-05. Empty deps on unmount cleanup so navigating
  // away always strips the class.
  useEffect(() => {
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
          // ⚠️ RENAMED, NOT REPOINTED (2026-09-07). This fires on RENDER: the
          // predicate above is `playing`, which is derived from `screen`, and
          // the boot router sets `screen` straight from the URL. So every
          // /footle share landing, every ?game= door and every club-page
          // hand-off counted as "started a game" without anybody touching
          // anything. Its denominator was landings, not plays — which is why
          // the "1,045 started, 53 finished, 5%" figure is not a rate, and no
          // decision should cite it as one.
          //
          // The name changes rather than the meaning, deliberately. Repointing
          // `first-game-started` at real input would silently redefine 30 days
          // of existing rows; renaming leaves them queryable and correct as
          // what they always were — arrivals at a game screen. The honest
          // series starts fresh under first-game-played, below.
          loopEvent("first-game-reached", { mode: mode || screen, entry });
        }
        // The attributable twin of the event above: same beat, but the device
        // event cannot be joined to an account, so it can count first games and
        // never say whose. Rides the same unified `playing` predicate rather
        // than a launcher, for the reason given above — launchers multiply.
        //
        // ⚠️ RENAMED FROM acct-first-play (the change its own comment here said
        // it deserved). It inherits `playing`'s render-fired defect, so it
        // counts arrivals; the honest counterpart is acct-game-played, fired
        // from the gesture listener further down alongside first-game-played.
        markAcctStep(user?.id, 'acct-game-reached', loopEvent, { mode });
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
  }, [inGame, screen, playing]);

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
      // ⚠️ THE SERVER'S STREAK IS APPLIED HERE — see src/lib/streak.js and the
      // note in useAuth's hydrate. This block used to say loginStreak was
      // removed "because AppInner's tickLoginStreak useEffect updates it
      // directly"; there is no such useEffect, the tick only fires on
      // daily-puzzle completion, and the result was a signed-in player with a
      // 58-day best being shown "0 day streak" on any device that had not
      // already cached it locally.
      //
      // ⚠️ READ ONLY. Hydrating must never advance a streak — opening the app
      // is not playing. liveStreak() only decides whether what the server
      // already stored is still alive today; the RPC keeps ownership of
      // ticking it. `best` is taken straight through, since a personal best
      // does not expire.
      if (detail.loginStreak && typeof detail.loginStreak === 'object') {
        const rec = detail.loginStreak;
        let xpVal = 0, used = 0;
        try { xpVal = parseInt(localStorage.getItem('biq_xp') || '0', 10) || 0; } catch { /* no local xp yet */ }
        try { used = (JSON.parse(localStorage.getItem('biq_stats') || '{}') || {}).shieldsUsed || 0; } catch { /* no local stats yet */ }
        const live = liveStreak(rec, localDayNow(), shieldsAvailable(xpVal, used));
        setLoginStreak(live);
        setBestLoginStreak(b => Math.max(b || 0, Number(rec.best) || 0, live));
        // Cache it so the next cold start renders the right number before the
        // network answers — the gap this whole fix is about.
        try {
          localStorage.setItem('biq_login_streak', JSON.stringify({
            streak: Number(rec.streak) || 0, lastDay: Number(rec.lastDay) || 0,
            best: Math.max(Number(rec.best) || 0, live),
          }));
        } catch { /* storage full or blocked: display still correct this session */ }
      }
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
      if (look.found === false) return { ok: false, error: tl("mp.noRoom") };
      if (look.found && !look.joinable) return { ok: false, error: look.state === "ended" ? tl("ap.gameFinished") : tl("mp.full") };
      try { localStorage.setItem("biq_pending_join", JSON.stringify({ c: code, at: Date.now() })); } catch {}
      setPendingJoinCode(code);
      return { ok: false, error: "" };
    }
    const trimmed = String(rawCode || "").trim().toUpperCase();
    if (trimmed.length !== 6) return { ok: false, error: tl("mp.enterCode") };
    const result = await mpJoinRoom({
      p_code: trimmed,
      p_name: (authProfile?.username || profile?.name || "Player"),
      p_avatar: (currentAvatarId(authProfile, profile)),
    });
    if (result.error) {
      // The server's own text in English, as before; the app's words otherwise.
      const msg = result.code === "53300" ? tl("mp.full")
        : result.code === "P0002" ? tl("mp.noRoom")
        : result.code === "42P01" ? tl("mp.notAccepting")
        : ((getLang() === "en" && result.error) || tl("ap.joinFail"));
      return { ok: false, error: msg };
    }
    setStage1RoomCode(result.code || trimmed);
    setScreen("online-stage1-lobby");
    return { ok: true };
  }, [user, isGuest, authProfile?.username, profile?.name, openAuthPrompt, setPendingJoinCode]);
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
    showToast(friend?.username ? tl("ts.roomInviting", { name: friend.username }) : tl("ts.roomReady"));
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
    loadNotifs, respondFriendRequest, joinInvite, dismissInvite, clearInvites, sendPlayInvite, openNotifs,
  } = useNotificationCenter({ user, isGuest, showToast, setPendingJoinCode });
  // Scroll-aware tab bar → hooks/useScrollAwareTabBar.js (E16, 2026-09-06).
  const tabBarRef = useScrollAwareTabBar({ screen, inGame });
  // i18n (step 1 pilot): the tab bar labels go through t(); useT() re-renders
  // AppInner when the language changes in Settings. See src/i18n/index.js.
  const t = useT();
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
        // The answer as the player reads it (i18n/questionText.js), the toast in their language.
        const answerText = questionText.q(q).o[q.a];
        showToast(tl(correct ? "toast.emailRight" : "toast.emailWrong", { a: answerText }), 4200);
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
  // Sprint #68 JJ4: trap focus + ESC-to-close on the three pre-launch
  // bottom-sheet modals that previously had no a11y wiring.
  const ratePromptRef = useRef(null);
  // Sprint #71 MM1: in-app confirm modal for "leave the multiplayer room?"
  // replaces a window.confirm() that rendered as the iOS native dialog.
  // pendingLeaveRoomRef carries the cleanup callback; null = closed.
  const leaveRoomModalRef = useRef(null);
  const howToPlayRef = useRef(null);
  useModalA11y({ isOpen: showFriendsPicker, onClose: () => setShowFriendsPicker(false), ref: friendsPickerRef });
  // Escape and the back gesture close the sheet through here; the backdrop and
  // "Maybe later" already log rate-prompt-dismissed with their `how`, and this
  // exit did not — so a third of dismissals were invisible to the funnel.
  useModalA11y({ isOpen: !!showRatePrompt, onClose: () => { loopEvent("rate-prompt-dismissed", { view: rateView, how: "escape" }); setShowRatePrompt(false); }, ref: ratePromptRef });
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
  useModalA11y({ isOpen: !!(pendingJoinCode && (!user || isGuest) && !playing), onClose: clearPendingJoin, ref: joinGateRef });
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
      // A list opened from the Top 10 browser goes back to the browser, as the
      // on-screen Back does (review, 15 Oct 2026).
      if (screen === "top10" && top10From === "lib") { setTop10From(null); setTop10ListId(null); setScreen("top10lib"); return; }
      if (playing) {
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
  // the engine already builds. There is no difficulty preference anywhere now:
  // SettingsScreen has no such row, and the `diff` state the pickers wrote was
  // removed on 2026-09-07 once it was found to be silently capping three modes.

  const playDailyForDate = useCallback(async (date) => {
    let qs;
    try {
      qs = await getDailyQsForDate(date);
    } catch (e) {
      console.warn('[playDailyForDate]', e?.message || e);
      showToast(tl("ts.loadFail"));
      return;
    }
    if (!qs || qs.length === 0) { showToast(tl("ts.noDay")); return; }
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
    let clue = false, hard = false;
    try {
      const raw = localStorage.getItem(`biq_wordle_${ymd}`);
      if (raw) {
        const p = JSON.parse(raw);
        if (Array.isArray(p?.guesses)) guesses = p.guesses;
        if (typeof p?.status === "string") status = p.status;
        clue = !!p?.clue;
        hard = !!p?.hard;
      }
    } catch {}
    setPuzzleReviewState({ date, guesses, status, clue, hard });
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

        {/* The first Play tap of a fresh install waits on a ~2.4 MB question
            chunk. The overlay fades in AFTER 260ms (CSS animation-delay), so a
            warm cache — the overwhelming majority of taps — never flashes it,
            and only a wait long enough to read as broken ever shows anything. */}
        {startingQuiz && (
          <div className="starting-quiz" role="status" aria-live="polite">
            <ScreenLoading label="Getting your questions" />
          </div>
        )}

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
        {isWebBrowser && !playing && (
          <>
            <SiteHeader signedIn={!!user && !isGuest} onProfile={() => { setScreen("home"); setTab("profile"); }} />
            <AppBar
              tab={tab}
              active={playing || screen === "results" ? null : screen === "settings" ? "settings" : tab}
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
            {!["settings", "home", "online-stage1", "online-stage1-lobby", "club-quiz", "results", "local-setup", "local-results", "wordle", "trail", "top10", "top10lib", "draft", "mystery", "stadiums", "quiz-topics", "stump", "daily-review", "puzzle-review", "review", "blocked-users", "friend-profile"].includes(screen) && (
              <button
                className="logo"
                onClick={handleHomeClick}
                style={{ background: "none", border: "none", padding: 0, font: "inherit", color: "inherit", cursor: "pointer" }}
                aria-label={t("tab.home")}
              >
                Ball <em>IQ</em>
              </button>
            )}
            {screen === "home" && (
              <div className="hdr-actions" style={{marginLeft:"auto",display:"flex",gap:8}}>
                {user && <NotifBell count={notifCount} onClick={openNotifs} className="icon-btn hdr-ic" />}
                <button className="icon-btn hdr-ic" aria-label={t("nav.settings")} onClick={() => setScreen("settings")}><Settings size={18} strokeWidth={2.25} aria-hidden="true" /></button>
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
          <div style={{position:"fixed",top:0,right:0,bottom:0,left:0,inset:0,background:"rgba(0,0,0,0.75)",zIndex:998,display:"flex",alignItems:"flex-end",animation:"fadeIn 0.2s ease"}} onClick={cancelShareName}>
            <div ref={shareNameRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={t("sn.aria")} style={{width:"100%",maxHeight:"85vh",overflowY:"auto",WebkitOverflowScrolling:"touch",background:"var(--bg)",borderRadius:"20px 20px 0 0",padding:"28px 24px calc(40px + env(safe-area-inset-bottom, 34px))",textAlign:"center",animation:"slideUp 0.3s cubic-bezier(0.22,1,0.36,1)"}} onClick={e => e.stopPropagation()}>
              <div style={{fontSize:44,marginBottom:10}}>⚽</div>
              <div style={{fontSize:20,fontWeight:900,marginBottom:8,color:"var(--t1)"}}>{t("sn.title")}</div>
              <div style={{fontSize:14,color:"var(--t2)",lineHeight:1.6,marginBottom:20}}>
                {rich(t("sn.body"), { b: <b style={{color:"var(--t1)"}}>{t("sn.quote", { n: dailyScore || 0 })}</b> })}
              </div>
              <form onSubmit={e => { e.preventDefault(); submitShareName(shareNameDraft); }}>
                <input
                  autoFocus
                  value={shareNameDraft}
                  onChange={e => setShareNameDraft(e.target.value)}
                  maxLength={22}
                  placeholder={t("sn.placeholder")}
                  aria-label={t("sn.nameAria")}
                  enterKeyHint="send"
                  autoComplete="given-name"
                  style={{width:"100%",padding:"14px 16px",fontSize:16,borderRadius:12,border:"1px solid var(--line)",background:"var(--c2)",color:"var(--t1)",fontFamily:"inherit",marginBottom:14,textAlign:"center"}}
                />
                <button className="btn btn-p" type="submit" style={{marginBottom:10}}>{t("sn.share")}</button>
              </form>
              <button className="btn btn-s" type="button" onClick={() => submitShareName("")}>{t("sn.noName")}</button>
            </div>
          </div>
        )}
        {showRatePrompt && (
          <div style={{position:"fixed",top:0,right:0,bottom:0,left:0,inset:0,background:"rgba(0,0,0,0.75)",zIndex:998,display:"flex",alignItems:"flex-end",animation:"fadeIn 0.3s ease"}} onClick={() => { loopEvent("rate-prompt-dismissed", { view: rateView, how: "backdrop" }); setShowRatePrompt(false); }}>
            <div ref={ratePromptRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={t("rt.aria", { app: APP_NAME })} style={{width:"100%",maxHeight:"85vh",overflowY:"auto",WebkitOverflowScrolling:"touch",background:"var(--bg)",borderRadius:"20px 20px 0 0",padding:"28px 24px calc(48px + env(safe-area-inset-bottom, 34px))",textAlign:"center"}} onClick={e => e.stopPropagation()}>
              {rateView === "ask" ? (
                <>
                  <div style={{fontSize:48,marginBottom:12}}>⚽</div>
                  <div style={{fontSize:20,fontWeight:900,marginBottom:8,color:"var(--t1)"}}>{t("rt.enjoying", { app: APP_NAME })}</div>
                  <div style={{fontSize:14,color:"var(--t2)",lineHeight:1.7,marginBottom:24}}>{t("rt.sub")}</div>
                  <button className="btn btn-p" style={{marginBottom:10}} onClick={() => { loopEvent("rate-prompt-loving"); setRateView("store"); }}>{t("rt.loving")}</button>
                  <button className="btn btn-s" onClick={() => {
                    loopEvent("rate-prompt-not-really");
                    setShowRatePrompt(false);
                    try { window.location.href = `mailto:hello@balliq.app?subject=${encodeURIComponent(t("rt.mailSubject", { app: APP_NAME }))}&body=${encodeURIComponent(t("rt.mailBody"))}`; } catch {}
                    showToast(t("rt.thanks"));
                  }}>{t("rt.notReally")}</button>
                </>
              ) : (
                <>
                  <div style={{width:56,height:56,margin:"0 auto 12px",borderRadius:16,background:"rgba(255,193,7,0.14)",border:"1px solid rgba(255,193,7,0.3)",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--gold)"}}><Star size={26} strokeWidth={2.25} aria-hidden="true" /></div>
                  <div style={{fontSize:20,fontWeight:900,marginBottom:8,color:"var(--t1)"}}>{t("rt.glad")}</div>
                  <div style={{fontSize:14,color:"var(--t2)",lineHeight:1.7,marginBottom:24}}>{t("rt.gladSub")}</div>
                  <button className="btn btn-p" style={{marginBottom:10}} onClick={() => {
                    setShowRatePrompt(false);
                    // ⚠️ ONE store detector, not a fourth hand-rolled UA regex. The
                    // old test counted every Mac desktop as an Apple tap because
                    // 'Macintosh' stood in for 'iPadOS in desktop mode', inflating the
                    // only conversion number this prompt has. isIOSUA() is the repo's
                    // answer (Mac counts only with navigator.maxTouchPoints > 1) — do
                    // NOT delete 'Macintosh' outright; real iPads send that UA.
                    if (isIOSUA()) {
                      loopEvent("rate-store-tap", { store: "apple" });
                      window.open(`${appStoreUrl({ campaign: false })}?action=write-review`, "_blank");
                    } else if (isAndroidUA()) {
                      loopEvent("rate-store-tap", { store: "play" });
                      window.open(PLAY_STORE_URL, "_blank");
                    } else {
                      // ⚠️ Counted as a DIFFERENT outcome. A desktop visitor who
                      // taps through reaches a toast, not a store — grouping it
                      // with the real taps would inflate the only conversion
                      // number this funnel has.
                      loopEvent("rate-store-unreachable", { store: "none" });
                      showToast(t("rt.search", { app: APP_NAME }));
                    }
                  }}>{t("rt.rate", { app: APP_NAME })}</button>
                  <button className="btn btn-s" onClick={() => { loopEvent("rate-prompt-dismissed", { view: "store", how: "maybe-later" }); setShowRatePrompt(false); }}>{t("rt.later")}</button>
                </>
              )}
            </div>
          </div>
        )}
        {howToPlay && (
          <div style={{position:"fixed",top:0,right:0,bottom:0,left:0,inset:0,background:"rgba(0,0,0,0.75)",zIndex:998,display:"flex",alignItems:"flex-end",animation:"fadeIn 0.2s ease"}} onClick={() => setHowToPlay(null)}>
            <div ref={howToPlayRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={howToPlaySheet(howToPlay, t)?.title || t("game.howTo")} style={{width:"100%",maxHeight:"85vh",overflowY:"auto",WebkitOverflowScrolling:"touch",background:"var(--bg)",borderRadius:"20px 20px 0 0",padding:"24px 20px calc(40px + env(safe-area-inset-bottom, 34px))",animation:"slideUp 0.3s cubic-bezier(0.22,1,0.36,1)"}} onClick={e => e.stopPropagation()}>
              <div style={{fontSize:18,fontWeight:800,marginBottom:16,color:"var(--t1)"}}>{howToPlaySheet(howToPlay, t)?.title}</div>
              {howToPlaySheet(howToPlay, t)?.steps.map((step, i) => (
                <div key={i} style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:12}}>
                  <div style={{width:24,height:24,borderRadius:"50%",background:"var(--accent)",color:"#0a1a00",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,flexShrink:0}}>{i+1}</div>
                  <div style={{fontSize:14,color:"var(--t2)",lineHeight:1.5}}>{step}</div>
                </div>
              ))}
              <button onClick={() => setHowToPlay(null)} style={{width:"100%",padding:"14px",background:"var(--s2)",border:"none",borderRadius:14,fontSize:15,fontWeight:700,color:"var(--t1)",marginTop:8,cursor:"pointer"}}>{t("help.gotIt")}</button>
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
              aria-label={t("lr.aria")}
              style={{width:"100%",maxWidth:480,maxHeight:"85vh",overflowY:"auto",WebkitOverflowScrolling:"touch",background:"var(--bg)",borderTop:"1px solid var(--border)",borderRadius:"22px 22px 0 0",padding:"22px 22px 28px",animation:"slideUp 0.3s cubic-bezier(0.22,1,0.36,1)"}}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{fontSize:18,fontWeight:800,color:"var(--text)",marginBottom:8}}>{t("lr.title")}</div>
              <div style={{fontSize:14,color:"var(--t2)",lineHeight:1.5,marginBottom:18}}>{t("lr.body")}</div>
              <button
                onClick={() => { const cb = pendingLeaveRoom?.onConfirm; setPendingLeaveRoom(null); cb?.(); }}
                style={{width:"100%",padding:14,background:"var(--red)",color:"#fff",border:"none",borderRadius:12,fontFamily:"inherit",fontSize:15,fontWeight:800,cursor:"pointer",marginBottom:8,WebkitTextFillColor:"#fff"}}
              >
                {t("lr.leave")}
              </button>
              <button
                onClick={() => setPendingLeaveRoom(null)}
                style={{width:"100%",padding:14,background:"var(--s2)",color:"var(--text)",border:"1px solid var(--border)",borderRadius:12,fontFamily:"inherit",fontSize:15,fontWeight:700,cursor:"pointer"}}
              >
                {t("lr.stay")}
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
              aria-label={t("ch.aria")}
              style={{width:"100%",maxWidth:480,maxHeight:"85vh",overflowY:"auto",WebkitOverflowScrolling:"touch",background:"var(--bg)",borderTop:"1px solid var(--border)",borderRadius:"22px 22px 0 0",padding:"22px 22px calc(28px + env(safe-area-inset-bottom, 0px))",textAlign:"center",animation:"slideUp 0.3s cubic-bezier(0.22,1,0.36,1)"}}
              onClick={(e) => e.stopPropagation()}
            >
              <div aria-hidden="true" style={{width:56,height:56,borderRadius:16,margin:"0 auto 12px",display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(88,204,2,0.14)",border:"1px solid rgba(88,204,2,0.30)"}}>
                <Trophy size={26} strokeWidth={2.25} color="#58CC02" />
              </div>
              <div style={{fontSize:20,fontWeight:900,color:"var(--t1)",marginBottom:6}}>
                {pendingChallenge.name ? t("ch.scored", { name: pendingChallenge.name, n: pendingChallenge.score }) : t("ch.friendScored", { n: pendingChallenge.score })}
              </div>
              <div style={{fontSize:14,color:"var(--t2)",lineHeight:1.5,marginBottom:20}}>
                {challengeDayOffset(pendingChallenge.date) === 0
                  ? t("ch.sameDay")
                  : t("ch.yesterday")}
              </div>
              <button
                onClick={() => { closeChallengeIntro(); playDaily(); }}
                style={{width:"100%",minHeight:50,padding:"14px",background:"var(--accent)",color:"var(--grn-ink)",border:"none",borderRadius:14,boxShadow:"0 10px 26px -8px rgba(88,204,2,0.55)",fontFamily:"inherit",fontSize:16,fontWeight:800,cursor:"pointer",WebkitTextFillColor:"#0a1a00"}}
              >
                {t("ch.play")}
              </button>
              <button
                onClick={closeChallengeIntro}
                style={{marginTop:12,background:"none",border:"none",color:"var(--t3)",fontFamily:"inherit",fontSize:13.5,fontWeight:700,cursor:"pointer",padding:"8px"}}
              >
                {t("lg.notNow")}
              </button>
            </div>
          </div>
        )}
        {/* Mates' leagues (web only): the create and join sheets, lazy. */}
        {LEAGUES_WEB && leagueSheet?.kind === "join" && (
          <TabErrorBoundary name="league-join" onExit={() => setLeagueSheet(null)}><React.Suspense fallback={leagueSheetFallback()}><LeagueJoinSheet
            token={leagueSheet.token}
            displayName={leagueDisplayName}
            isGuest={!user || !!isAnonUser}
            ensureSession={ensureLeagueSession}
            onClose={() => setLeagueSheet(null)}
            onJoined={(r) => openLeagueTable(r?.id)}
            track={loopEvent}
          /></React.Suspense></TabErrorBoundary>
        )}
        {LEAGUES_WEB && leagueSheet?.kind === "create" && (
          <TabErrorBoundary name="league-create" onExit={() => setLeagueSheet(null)}><React.Suspense fallback={leagueSheetFallback()}><LeagueCreateSheet
            seed={leagueSheet.seed}
            vs={leagueSheet.vs}
            h2h={leagueSheet.h2h}
            displayName={leagueDisplayName}
            ensureSession={ensureLeagueSession}
            onClose={() => setLeagueSheet(null)}
            onOpenTable={openLeagueTable}
            track={loopEvent}
          /></React.Suspense></TabErrorBoundary>
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
              aria-label={t("ch.resultAria")}
              style={{width:"100%",maxWidth:480,maxHeight:"85vh",overflowY:"auto",WebkitOverflowScrolling:"touch",background:"var(--bg)",borderTop:"1px solid var(--border)",borderRadius:"22px 22px 0 0",padding:"22px 22px calc(28px + env(safe-area-inset-bottom, 0px))",textAlign:"center",animation:"slideUp 0.3s cubic-bezier(0.22,1,0.36,1)"}}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{fontSize:44,marginBottom:8}} aria-hidden="true">
                {challengeResult.mine > challengeResult.theirs ? "🏆" : challengeResult.mine === challengeResult.theirs ? "🤝" : "😤"}
              </div>
              <div style={{fontSize:20,fontWeight:900,color:"var(--t1)",marginBottom:16}}>
                {challengeResult.mine > challengeResult.theirs ? t("ch.beat", { name: challengeResult.name || t("ch.yourFriendLc") })
                  : challengeResult.mine === challengeResult.theirs ? t("ch.level", { name: challengeResult.name || t("ch.yourFriendLc") })
                  : t("ch.takes", { name: challengeResult.name || t("ts.yourFriend") })}
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:20}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 14px",background:"var(--s2)",border:"1px solid var(--border)",borderRadius:12}}>
                  <span style={{fontSize:14,fontWeight:700,color:"var(--t1)"}}>{t("mp.youCap")}</span>
                  <span style={{fontSize:16,fontWeight:900,color:"var(--t1)"}}>{challengeResult.mine}/7</span>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 14px",background:"var(--s2)",border:"1px solid var(--border)",borderRadius:12}}>
                  <span style={{fontSize:14,fontWeight:700,color:"var(--t2)"}}>
                    {challengeResult.name || t("ts.yourFriend")}{challengeResult.yesterday ? t("ch.yesterdayScore") : ""}
                  </span>
                  <span style={{fontSize:16,fontWeight:900,color:"var(--t2)"}}>{challengeResult.theirs}/7</span>
                </div>
              </div>
              <button
                onClick={() => { setChallengeResult(null); shareDaily(); }}
                style={{width:"100%",padding:14,background:"var(--accent)",color:"var(--grn-ink)",border:"none",borderRadius:999,boxShadow:"0 8px 22px -8px rgba(88,204,2,0.55)",fontFamily:"inherit",fontSize:15,fontWeight:800,cursor:"pointer",marginBottom:8,WebkitTextFillColor:"#0a1a00"}}
              >
                {t("ch.sendBack")}
              </button>
              {/* Mates' leagues (web only): the same seed as the results panel's. */}
              {LEAGUES_WEB && (
                <button
                  type="button"
                  onClick={() => {
                    const c = challengeResult;
                    loopEvent("league-make-tap", { game: "daily7" });
                    loopEvent("league-create-open", { from: "h2h" });
                    setChallengeResult(null);
                    setLeagueSheet({ kind: "create", seed: "h2h_daily7", vs: c.name || "", h2h: { game: "daily7", edition: dayIndexForDate(new Date()), mine: c.mine, theirs: c.theirs } });
                  }}
                  style={{display:"block",margin:"2px auto 12px",background:"none",border:"none",color:"var(--t2)",WebkitTextFillColor:"var(--t2)",fontFamily:"inherit",fontSize:13,fontWeight:700,textDecoration:"underline",textUnderlineOffset:3,cursor:"pointer",padding:"6px 8px"}}
                >
                  {t("ch.league")}
                </button>
              )}
              <button
                onClick={() => setChallengeResult(null)}
                style={{width:"100%",padding:14,background:"var(--s2)",color:"var(--text)",border:"1px solid var(--border)",borderRadius:12,fontFamily:"inherit",fontSize:15,fontWeight:700,cursor:"pointer"}}
              >
                {t("ch.done")}
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
          <div style={{position:"fixed",top:0,right:0,bottom:0,left:0,inset:0,background:"rgba(11,12,16,0.97)",zIndex:999,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",animation:"fadeIn 0.3s ease"}}>
            <Confetti />
            <div style={{textAlign:"center",padding:"0 32px"}}>
              <div style={{marginBottom:16,animation:"iconPop 0.6s cubic-bezier(0.34,1.56,0.64,1)",display:"flex",justifyContent:"center"}}>
                {levelUpOverlay.Icon && <levelUpOverlay.Icon size={80} strokeWidth={1.6} color="var(--gold)" />}
              </div>
              <div style={{fontSize:14,color:"var(--gold)",fontWeight:700,letterSpacing:0.3,marginBottom:8}}>{t("lu.promoted")}</div>
              <div style={{fontSize:32,fontWeight:900,color:"#fff",letterSpacing:"-0.5px",marginBottom:12}}>{levelName(levelUpOverlay.name)}</div>
              <div style={{fontSize:14,color:"rgba(255,255,255,0.6)"}}>{t("lu.keep")}</div>
            </div>
            <button onClick={() => setLevelUpOverlay(null)} style={{marginTop:40,padding:"12px 32px",background:"var(--accent)",color:"var(--grn-ink)",border:"none",borderRadius:999,boxShadow:"0 8px 22px -8px rgba(88,204,2,0.55)",fontSize:15,fontWeight:700,cursor:"pointer"}}>{t("lu.go")}</button>
          </div>
        )}
        {streakToast && <div className="streak-toast" role="status" aria-live="polite"><span>🔥</span><span>{rich(t("ts.dayStreak"), { s: <strong>{t("ts.dayStreakB", { n: streakToast })}</strong> })}</span></div>}

        {/* ── PLAY WITH FRIENDS SHEET ── */}
        {showFriendsPicker && (
          <div className="diff-overlay" onClick={() => setShowFriendsPicker(false)}>
            <div ref={friendsPickerRef} tabIndex={-1} className="diff-sheet" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
              <div className="diff-sheet-title">{t("tab.online")}</div>
              <div className="diff-sheet-sub">{t("fp.who")}</div>
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
                    <div className="diff-option-name">{t("mp.title")}</div>
                    <div className="diff-option-desc">{t("fp.onlineSub")}</div>
                  </div>
                </button>
                <button
                  className="diff-option diff-option-local"
                  onClick={() => { setShowFriendsPicker(false); startMode("local"); }}
                >
                  <span className="diff-option-icon">🤝</span>
                  <div className="diff-option-body">
                    <div className="diff-option-name">{t("lp.title")}</div>
                    <div className="diff-option-desc">{t("fp.localSub")}</div>
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
              top10Tick={top10Tick}
              showSettings={!isWebBrowser}
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
              clubPacks={clubs?.CLUB_PACKS}
              clubAbbr={clubs?.CLUB_ABBR}
              launchClubQuiz={launchClubQuiz}
              firstSession={showFirstQuizTip}
              onOpenLeague={LEAGUES_WEB ? openLeagueTable : undefined}
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
              key={`daily-${top10Tick}` /* its history columns follow the schedule the device holds */}
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
              onStartLeague={LEAGUES_WEB ? openLeagueCreateFromDaily : undefined}
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
              // Signed-in id only: a guest has no friendships to read, and
              // passing one would fire a query that can only come back empty.
              userId={(user && !isGuest) ? user.id : null}
              startMode={startMode}
              setOnlineAutoCreate={setOnlineAutoCreate}
              onChallenge={challengeFriend}
              onOpenFriend={openFriendProfile}
              onJoinCode={hubJoinRoom}
              displayName={(() => {
                const isDef = (nm) => !nm || nm === "Player" || /^player_/i.test(nm);
                if (authProfile?.username && !isDef(authProfile.username)) return authProfile.username;
                if (profile.name && !isDef(profile.name)) return profile.name;
                return t("mp.youCap");
              })()}
              avatarUrl={authProfile?.avatar_url}
              avatarId={currentAvatarId(authProfile, profile)}
            />
            </TabErrorBoundary>
          </div>
        )}

        {/* ── PROFILE TAB ── */}
        {!inGame && screen === "home" && (
          <div className="tab-pane" style={tab === "profile" ? undefined : HIDDEN_STYLE}>
            <TabErrorBoundary name="profile">
            <React.Suspense fallback={<ScreenLoading label="Loading profile" />}>
              <ProfileScreen profile={profile} setProfile={setProfile} stats={stats} xp={xp} loginStreak={loginStreak} bestLoginStreak={bestLoginStreak} level={levelInfo.level} earnedBadges={earnedBadges} onShareProfile={shareProfile} onSaveCard={saveCardImage} onToast={showToast} onChallenge={challengeFriend} onOpenFriend={openFriendProfile} onPlayLeague={playCardFace}
            onPlayDaily={playDaily} onSetCardLeague={setCardLeague} nameEditNonce={nameEditNonce} isActiveTab={tab === "profile"} />
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
            clue={puzzleReviewState.clue}
            hard={puzzleReviewState.hard}
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
            onCancel={cancelQuestionReport}
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
              {t("ch.nudge", { who: pendingChallenge.name ? t("ch.challengedYou", { name: pendingChallenge.name }) : t("ch.gotOne") })}
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
              {t("ch.open")}
            </button>
            <button
              onClick={() => setChallengeAppNudgeDismissed(true)}
              aria-label={t("nc.dismiss")}
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
        {pendingJoinCode && (!user || isGuest) && !playing && (
          /* THE HOUSE SHEET, not a hand-rolled box (review C13). This was the
             last centred modal with its own overlay, its own radius and four
             stacked buttons of near-equal weight, all in inline styles. The
             quit confirm and the report sheet already share .modal-overlay /
             .modal-box / .modal-head / .modal-btns; this is the third. The
             2026-09-06 status line claimed there was nothing to convert here
             because the "join modal" was the inline Online-tab field -- that
             was wrong, this is a real modal and it was never touched. */
          <div className="modal-overlay" onClick={clearPendingJoin}>
            <div
              ref={joinGateRef}
              tabIndex={-1}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label={t("jg.title")}
              className="modal-box"
            >
              <div className="modal-grab" aria-hidden="true" />
              <div className="modal-head">
                <div aria-hidden="true" style={{width:52,height:52,borderRadius:15,margin:"0 auto 4px",display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(88,204,2,0.14)",border:"1px solid rgba(88,204,2,0.30)"}}>
                  <Gamepad2 size={24} strokeWidth={2.25} color="#58CC02" />
                </div>
                <div className="modal-title">{t("jg.title")}</div>
                <div className="modal-body">
                  {rich(t("jg.body"), { code: <strong style={{fontFamily:"'JetBrains Mono','SF Mono',ui-monospace,Menlo,monospace",color:"var(--accent)"}}>{pendingJoinCode}</strong> })}
                </div>
              </div>
              <div className="modal-btns">
                {/* Social in-app webviews (Snapchat/IG/Threads) are a separate,
                    always-logged-out browser AND swallow Universal Links — so
                    users who ARE logged into the installed app hit this gate
                    (task #22, Alex repro 2026-07-17). Custom schemes DO escape
                    those webviews. The scheme URL keeps `balliq.app` as its
                    hostname because the live binary's appUrlOpen parser
                    (tryCapture) hostname-checks before extracting the code.
                    Silent no-op if the app isn't installed, so the sign-in
                    path below stays available. The 📲 that led this button is
                    gone — an emoji standing in for an icon (review C8). */}
                {IS_IOS_WEB && (
                  <button type="button" className="btn-3d modal-btn" onClick={() => { try { window.location.href = `app.balliq://balliq.app/join/${pendingJoinCode}`; } catch {} }}>
                    <Smartphone size={16} strokeWidth={2.4} aria-hidden="true" style={{verticalAlign:"-3px",marginRight:6}} />
                    {t("jg.app")}
                  </button>
                )}
                {/* v1.6 guest entry — the invite loop's biggest leak was this
                    modal demanding an account. Anonymous sign-in drops the
                    friend straight into the room; primary everywhere except
                    iOS web, where "open the app" keeps top billing (the app
                    user is already signed in there). */}
                <button
                  type="button"
                  className={IS_IOS_WEB ? "btn-3d ghost modal-btn" : "btn-3d modal-btn"}
                  onClick={handleGuestJoin}
                  disabled={guestJoining}
                  style={guestJoining ? {opacity:0.6} : undefined}
                >
                  {guestJoining ? t("lg.joining") : <><Zap size={16} strokeWidth={2.4} aria-hidden="true" style={{verticalAlign:"-3px",marginRight:6}} />{t("jg.guest")}</>}
                </button>
                {guestJoinError && (
                  <div role="alert" style={{fontSize:12,color:"var(--red)",lineHeight:1.4,textAlign:"center",padding:"2px 8px"}}>{guestJoinError}</div>
                )}
                <button type="button" className="btn-3d ghost modal-btn" onClick={() => { try { openAuthPrompt?.('online'); } catch {} }}>
                  {t("jg.signIn")}
                </button>
                <button type="button" className="modal-btn modal-quiet" onClick={clearPendingJoin}>{t("lg.notNow")}</button>
              </div>
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

        {/* ── QUIZ (topic picker) ── */}
        {screen === "quiz-topics" && (
          <QuizScreen
            initialTopic={quizTopic}
            onStartMode={(m, t) => { setQuizTopic(t); startMode(m); }}
            onStartCat={(c, t) => { setQuizTopic(t); launchLeagueQuiz(c); }}
            onStadiums={() => setScreen("stadiums")}
            onBack={goHome}
            catStats={stats?.catStats}
            cardLeague={stats?.cardLeague}
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
                    ? tl("ts.chSent")
                    : tl("ts.notifyFail"));
                }
              }}
              defaultName={isAnonUser ? getGuestDisplayName() : (authProfile?.username || profile?.name || "")}
              defaultAvatar={currentAvatarId(authProfile, profile)}
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
              defaultAvatar={currentAvatarId(authProfile, profile)}
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
                  ? (sent === 1 ? tl("ts.rematchOne") : tl("ts.rematchN", { n: sent }))
                  : tl("ts.rematchRoom"));
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
          // Keyed by the day: the screen holds its attempts in state, so an app
          // left open past midnight showed the new day's clubs with yesterday's
          // guesses and guard (review, 12 Oct 2026). A new day is a new screen.
          return <TabErrorBoundary name="trail" onExit={goHome}><React.Suspense fallback={<ScreenLoading label="Loading Transfer Trail" />}><TransferTrail key={dateToYMD(day)} player={p} date={day} onBack={goHome} onReport={reportQuestion} services={dailyScreenServices} /></React.Suspense></TabErrorBoundary>;
        })()}
        {screen === "top10" && (
          <TabErrorBoundary name="top10" onExit={goHome}><React.Suspense fallback={<ScreenLoading label="Loading Top 10" />}><Top10 key={top10ListId || "day"} date={archiveDate || undefined} listId={top10ListId || undefined} onBack={top10From === "lib" ? () => { setTop10From(null); setTop10ListId(null); setScreen("top10lib"); } : goHome} onMoreLists={top10From === "lib" ? undefined : () => setScreen("top10lib")} onReport={reportQuestion} services={dailyScreenServices} /></React.Suspense></TabErrorBoundary>
        )}
        {screen === "stitch" && LEAGUES_WEB && (
          <TabErrorBoundary name="stitch" onExit={goHome}><React.Suspense fallback={<ScreenLoading label="Loading Stitch-up" />}><StitchUp
            key={stitchToken || "build"}
            token={stitchToken}
            onBack={goHome}
            onReport={reportQuestion}
            services={dailyScreenServices}
            track={loopEvent}
            defaultName={resolveChallengerName}
            onPlayTrail={() => { setArchiveDate(null); setScreen("trail"); }}
          /></React.Suspense></TabErrorBoundary>
        )}
        {screen === "league" && LEAGUES_WEB && leagueId && (
          <TabErrorBoundary name="league" onExit={goHome}><React.Suspense fallback={<ScreenLoading label="Loading the table" />}><LeagueScreen
            key={leagueId}
            leagueId={leagueId}
            onBack={goHome}
            nextUp={dailyDoneServices.nextUp}
            isAnon={!!isAnonUser}
            onSave={() => openAuthPrompt?.("save")}
            track={loopEvent}
            inviter={leagueDisplayName}
          /></React.Suspense></TabErrorBoundary>
        )}
        {screen === "top10lib" && (
          <TabErrorBoundary name="top10lib" onExit={goHome}><React.Suspense fallback={<ScreenLoading label="Loading Top 10 lists" />}><Top10Library
            onBack={goHome}
            onPlay={(id) => { setTop10ListId(id); setTop10From("lib"); setScreen("top10"); }}
            clubInfo={(slug) => { const key = clubs?.CLUB_SLUG_TO_PACK[slug]; const pack = key && clubs.CLUB_PACKS[key]; return pack ? { name: pack.name, color: pack.color, abbr: clubs.CLUB_ABBR[key] || pack.name.slice(0, 3).toUpperCase() } : null; }}
          /></React.Suspense></TabErrorBoundary>
        )}
        {screen === "draft" && (
          <TabErrorBoundary name="draft" onExit={goHome}><React.Suspense fallback={<ScreenLoading label="Loading Draft" />}><Draft onBack={goHome} services={dailyScreenServices} /></React.Suspense></TabErrorBoundary>
        )}
        {screen === "mystery" && (
          <TabErrorBoundary name="mystery" onExit={goHome}><React.Suspense fallback={<ScreenLoading label="Loading Mystery Player" />}><MysteryPlayer date={archiveDate || undefined} onExit={goHome} services={dailyScreenServices} /></React.Suspense></TabErrorBoundary>
        )}
        {screen === "stadiums" && (
          <TabErrorBoundary name="stadiums" onExit={goHome}><React.Suspense fallback={<ScreenLoading label="Loading Stadiums" />}><StadiumGame onExit={goHome} shareCard={shareCard} /></React.Suspense></TabErrorBoundary>
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
                <div style={{fontSize:10,fontFamily:"'Inter',sans-serif",color:"var(--gold)",fontWeight:700,letterSpacing:0.3,marginBottom:4}}>{t("qb.legends")}</div>
                <div style={{fontSize:12,color:"var(--t3)",fontStyle:"italic"}}>{t("qb.legendsSub")}</div>
              </div>
            )}
            {mode === "chaos" && (
              <div style={{marginTop:14,marginBottom:4,textAlign:"center",padding:"10px 0 6px",background:"linear-gradient(135deg,rgba(88,204,2,0.10),rgba(255,106,0,0.06))",borderRadius:12,border:"1px solid rgba(88,204,2,0.22)"}}>
                <div style={{fontSize:10,fontFamily:"'Inter',sans-serif",color:"var(--grn-soft)",fontWeight:700,letterSpacing:0.3,marginBottom:4}}>{t("qb.chaos")}</div>
                <div style={{fontSize:12,color:"var(--t3)",fontStyle:"italic"}}>{t("qb.chaosSub")}</div>
              </div>
            )}
            {activePack && (
              <div style={{marginTop:14,marginBottom:6,display:"flex",alignItems:"center",gap:14,padding:"12px 14px",background:clubHexToRgba(activePack.color, 0.14),border:`1px solid ${clubHexToRgba(activePack.color, 0.4)}`,borderRadius:14}}>
                <div style={{width:46,height:46,borderRadius:12,flexShrink:0,background:activePack.color,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 2px 8px ${clubHexToRgba(activePack.color, 0.45)}`}}>
                  <span style={{fontWeight:900,fontSize:14,letterSpacing:0.3,color:clubReadableText(activePack.color)}}>{clubs.CLUB_ABBR[activeClub] || clubInitials(activePack.name)}</span>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:11,color:"var(--t3)",fontWeight:600,marginBottom:2}}>{t("cat.ClubQuiz")}</div>
                  <div style={{fontSize:17,fontWeight:800,color:"var(--t1)",letterSpacing:"-0.2px"}}>{activePack.name}</div>
                </div>
              </div>
            )}
            {!activeClub && activeLeague && LEAGUE_QUIZ_BY_CAT[activeLeague] && (
              <div style={{marginTop:14,marginBottom:6,display:"flex",alignItems:"center",gap:14,padding:"12px 14px",background:clubHexToRgba(LEAGUE_QUIZ_BY_CAT[activeLeague].color, 0.14),border:`1px solid ${clubHexToRgba(LEAGUE_QUIZ_BY_CAT[activeLeague].color, 0.4)}`,borderRadius:14}}>
                <div style={{width:46,height:46,borderRadius:12,flexShrink:0,background:LEAGUE_QUIZ_BY_CAT[activeLeague].color,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 2px 8px ${clubHexToRgba(LEAGUE_QUIZ_BY_CAT[activeLeague].color, 0.45)}`}}>
                  <span style={{fontWeight:900,fontSize:14,letterSpacing:0.3,color:clubReadableText(LEAGUE_QUIZ_BY_CAT[activeLeague].color)}}>{LEAGUE_QUIZ_BY_CAT[activeLeague].abbr}</span>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:11,color:"var(--t3)",fontWeight:600,marginBottom:2}}>{t("cat.LeagueQuiz")}</div>
                  <div style={{fontSize:17,fontWeight:800,color:"var(--t1)",letterSpacing:"-0.2px"}}>{catLabel(t, activeLeague)}</div>
                </div>
              </div>
            )}
            <QuizEngine
              key={mode}
              questions={questions}
              mode={mode}
              timerEnabled={settings.timer !== false}
              timerSecondsOverride={activeClub ? 15 : undefined}
              soundEnabled={settings.sound === true}
              hintsEnabled={settings.hints !== false}
              onComplete={handleComplete}
              onReport={reportQuestion}
              // medical correctness-state (low): without this the in-game
              // Survival PB / "New PB!" badges could never render — QuizEngine
              // gates them on survivalBest > 0 and the prop was never passed.
              survivalBest={stats.bestSurvival || 0}
              quizLabel={activePack ? activePack.name
                : activeLeague && LEAGUE_QUIZ_BY_CAT[activeLeague] ? catLabel(t, activeLeague)
                : undefined}
              // Audit #5: a club/league quit stranded the player on Home —
              // send them back to the picker they came from instead.
              onBack={() => {
                // A daily came from Home's Today block, so back is Home — the
                // same "return to the picker you came from" rule as the club and
                // league branches below. It sent to the History tab until
                // 2026-09-06 moved the rows; that left the row you just played
                // and its three siblings a tab away, and 66% of players who play
                // one daily play a second the same day.
                if (mode === "daily") { setScreen("home"); setTab("home"); }
                else if (activeClub) { setScreen("club-quiz"); }
                else if (activeLeague) { setQuizTopic(activeLeague); setScreen("quiz-topics"); }
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
            mode={result.mode || mode}
            cardDelta={cardDeltaState}
            onHome={goHome}
            survivalBest={result?.prevBest ?? (stats.bestSurvival || 0)}
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
                  <div style={{fontSize:14,fontWeight:800,color:"var(--t1)",letterSpacing:"-0.2px"}}>{t("pn.title")}</div>
                  <div style={{fontSize:12.5,color:"var(--t2)",lineHeight:1.4,marginTop:2}}>{t("pn.sub")}</div>
                </div>
                <button
                  onClick={() => { dismissPhotoNudge(); loopEvent('photo-nudge-tap'); setTab('profile'); setScreen('home'); }}
                  style={{flexShrink:0,padding:"9px 15px",borderRadius:999,background:"var(--accent)",border:"none",color:"var(--grn-ink)",WebkitTextFillColor:"var(--grn-ink)",fontFamily:"inherit",fontSize:13,fontWeight:800,cursor:"pointer"}}
                >
                  {t("pn.add")}
                </button>
                {/* A nudge you cannot decline is a wall. */}
                <button
                  onClick={() => { dismissPhotoNudge(); loopEvent('photo-nudge-dismiss'); }}
                  aria-label={t("lg.notNow")}
                  style={{flexShrink:0,padding:"9px 6px",background:"none",border:"none",color:"var(--t3)",fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer"}}
                >
                  {t("pn.later")}
                </button>
              </div>
            ) : null}
            classicBest={stats.bestScore || 0}
            label={activePack ? activePack.name
              : activeLeague && LEAGUE_QUIZ_BY_CAT[activeLeague] ? catLabel(t, activeLeague)
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
              { id:"home",     Icon: Home,         label:t("tab.home")    },
              { id:"online",   Icon: Globe,        label:t("tab.online") },
              { id:"daily",    Icon: CalendarDays, label:t("tab.daily"), badge: false },
              { id:"profile",  Icon: User,         label:t("tab.profile") },
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
        onClearInvites={clearInvites}
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
    <div className={`biq-splash${!effectiveLoading ? ' is-leaving' : ''}`} aria-label={tl("ap.loadingApp", { app: APP_NAME })}>
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
  // The /_vercel/* script only exists on Vercel; a local preview gets
  // index.html back and throws "Unexpected token '<'" (BALL-IQ-X).
  const onVercel = !isNative && typeof location !== 'undefined' && !/^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/.test(location.hostname);
  return (
    <>
      {/* Pre-review audit: VersionBanner compares BUILT_SHA against a
          /version.json fetch that can't succeed from the capacitor://
          bundle — the failure path is silent today, but gate it anyway
          so no update-nag UI can ever render inside the native app. */}
      {!isNative && <VersionBanner />}
      <ErrorBoundary><AppGate /></ErrorBoundary>
      {onVercel && <SpeedInsights />}
    </>
  );
}
