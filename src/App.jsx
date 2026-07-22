import './app.css';
import React, { useState, useEffect, useLayoutEffect, useCallback, useRef, useMemo } from "react";
import * as Sentry from '@sentry/react';
import { useAuth, clearAllUserLocalStorage } from './useAuth.jsx';
import { supabase } from './supabase.js';
import { safeSetItem } from './safeStorage.js';
import { useMultiplayerRoom } from './useMultiplayerRoom.js';
import Login from './Login.jsx';
// Lazy: the 523-line review screen is settings-only, never on the cold/first
// paint — React.lazy keeps it out of the initial bundle (Suspense at render).
const ReviewScreen = React.lazy(() => import('./ReviewScreen.jsx'));
// Desktop left rail (>= 1024px, browser only — hidden in native + installed PWA).
import { BiqNav } from './BiqNav.jsx';
import { loadQuestions, prefetchQuestions } from './questions-loader.js';
// Pure + tested. seededShuffle's integer maths is load-bearing (Math.sin differs
// between JavaScriptCore and V8); pickDailyQuestions is what keeps every player
// on the same Daily 7. See tests/unit/quiz.test.js.
import { seededShuffle, pickDailyQuestions } from './lib/quiz.js';
import { Timer, Flame, Zap, ScrollText, Brain, Sparkles, Trophy, Share, Home, CalendarDays, User, Globe, Users } from 'lucide-react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { mpCreateRoom, mpJoinRoom, mpLeaveRoom, useMpRetryStatus } from './multiplayerRpc.js';
import { useModalA11y, closeTopModal } from './useModalA11y.js';
import VersionBanner from './VersionBanner.jsx';
import { useInstallPrompt, useInstallBanner } from './installPrompt.js';
import { APP_NAME, LEVELS, getLevelInfo, iqPercentile, computeBadges } from './lib/scoring.js';
import { dateToYMD, keyForDate, dayIndexForDate } from './lib/date.js';
import { readWordleTodayStatus, getWordleDateKey } from './lib/wordleStatus.js';
import { notificationsSupported, getNotifPermission, requestNotifPermission, scheduleReminderWindow, cancelTodayReminder, cancelAllReminders, onReminderTap } from './lib/notifications.js';
import { registerPush, onPushTap } from './lib/push.js';
import { maybeRequestReview } from './lib/review.js';
import { computeCard } from './lib/ballIqCard.js';
import {
  WORDLE_PLAYERS, WORDLE_ANCHOR_DAY, WORDLE_ANCHOR_IDX, WORDLE_STRIDE,
  WORDLE_FULL_NAMES,
  getWordleDayIndex, getWordleAnswerForDayIndex, getWordleAnswer,
  gradeWordleGuess, computeFootleStreak, getFootleNumber,
} from './lib/wordle.js';
import { FootleHero } from './components/FootleHero.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { APP_STORE_ID, APP_STORE_URL, PLAY_STORE_URL } from './lib/links.js';
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
// Online multiplayer (~1700 lines) — only loads when a user goes online, never
// on the cold/first paint. Both entry points share the one chunk.
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

// Gated reviewer email — only this account sees the Settings → Review entry
// and can reach the review screen. Server-side RLS on question_review is the
// real security; this is just UI hiding.
const REVIEWER_EMAIL = "alexbo99@hotmail.no";

// (The old async storage shim on window is gone — reads go straight to
// localStorage; writes go through safeSetItem so QuotaExceededError is
// surfaced via the biq:storage-quota-exceeded toast instead of vanishing.)

// ─── APP META ─────────────────────────────────────────────────────────────────
// Single source of truth for the version string — surfaced in Settings → About.
// Bump on every shipping release.
// Web fallback only — on native the About card shows the REAL installed build
// version via CapApp.getInfo(), so this no longer drifts on each release (the
// bug that left it stuck at "1.0.0-beta" through 1.0.1/1.0.2). Keep it roughly
// current for the web build.
const APP_VERSION = "1.1.0";
// APP_STORE_ID / APP_STORE_URL / PLAY_STORE_URL moved to ./lib/links.js
// (single source of truth for every store CTA in src/ — imported above).
// Shared style for the three About-card actions (Rate / Share / Feedback).
const ABOUT_ACTION_STYLE = {
  flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
  padding: "12px 6px", background: "transparent", color: "var(--accent)",
  border: "1.5px solid var(--accent-b)", borderRadius: 12, fontFamily: "inherit",
  fontSize: 12.5, fontWeight: 800, cursor: "pointer", WebkitAppearance: "none",
  appearance: "none", textDecoration: "none",
};

// Centralised durations so we can tune motion/UX feel from one place.
const TIMINGS = {
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
function norm(s) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function shuffle(arr) {
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
const qbHistKey = (origQ) => (origQ && origQ.id ? `q:${origQ.id}` : null);

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
function applySeenFilter(pool, needed, toKey) {
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
function recordSeenQuestions(questions) {
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


async function getQs({ cat, diff, n = 10, ramp = false, includeLegends = false, noEasy = false }) {
  const { QB } = await loadQuestions();
  // Defensive: strip out any undefined entries that might exist from array holes
  let pool = QB.filter(q => q && typeof q === "object");
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
  // Club/league quizzes are for invested fans — drop "easy" (casual-obvious or
  // telegraphed) entirely. Only topic-scoped callers pass noEasy; general modes
  // (Classic, Daily 7, Survival, Hot Streak) keep the full easy→hard range.
  if (noEasy) pool = pool.filter(q => q.diff !== "easy");
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


async function getBallIQQuestions() {
  const { QB } = await loadQuestions();
  const seed = Math.floor(Date.now() / TIMINGS.DAY_MS);
  const mcqOnly = QB.filter(q => q.type === "mcq");
  const shuffled = seededShuffle(mcqOnly, seed * 1013904223);
  const takeFresh = (difficulty, count) => {
    const bucket = shuffled.filter(q => q.diff === difficulty);
    const fresh = applySeenFilter(bucket, count, qbHistKey);
    return fresh.slice(0, count);
  };
  const easy = takeFresh("easy", 5);
  const med  = takeFresh("medium", 6);
  const hard = takeFresh("hard", 4);
  return shuffle([...easy, ...med, ...hard]).map(q => {
    const histKey = qbHistKey(q);
    const indices = [0,1,2,3].slice(0, q.o.length);
    const sh = seededShuffle(indices, seed + easy.indexOf(q) + 1);
    return { ...q, o: sh.map(i => q.o[i]), a: sh.indexOf(q.a), _histKey: histKey };
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


function calcBallIQ(score, total) {
  // Real-IQ-bell-curve inspired mapping in the 60–160 range, pure accuracy.
  //  Calibration targets:
  //    - Perfect 15/15 → 160
  //    - 8/15 correct  → ~99 (roughly average)
  //    - 0/15 correct  → 60
  //  Formula: 60 + pct^1.5 * 100, clamp [60, 160], round.
  if (!total) return 60;
  const pct = Math.max(0, Math.min(1, score / total));
  const iq = 60 + Math.pow(pct, 1.5) * 100;
  return Math.round(Math.max(60, Math.min(160, iq)));
}

// Football-culture rank labels — fun, descriptive, and crucially they make
// no statistical claim. The earlier "Top X% of football fans" version was
// pulled because the buckets weren't derived from real user data, which
// risked falling foul of App Store guideline 2.3 (Accurate Metadata).
//
// Voice: 3rd-person observational across all tiers (channeling/plays/argues/etc).
// Single source of truth — iqLabel() reads from this array.
const IQ_LABELS = [
  { min: 155, label: "Channeling José Mourinho 👑" },
  { min: 150, label: "Pronounces Bruno Fernandes like BROO-no Fer-NANDSH 🇵🇹" },
  { min: 145, label: "Clearly plays Football Manager ⌨️" },
  { min: 140, label: "Smarter than most football pundits 📺" },
  { min: 135, label: "Could manage in the Championship 🧠" },
  { min: 130, label: "Could manage a League Two side ⚽" },
  { min: 125, label: "Watches the U21s for fun 🔭" },
  { min: 120, label: "Knows every Champions League anthem word 🎵" },
  { min: 115, label: "Has a favourite lesser-known league 🌍" },
  { min: 110, label: "Argues about the offside rule correctly 📐" },
  { min: 105, label: "Watches Match of the Day till the end 📺" },
  { min: 100, label: "Solid pub quiz teammate ⚽" },
  { min: 95,  label: "Watches El Clasico but skips the League Cup 👀" },
  { min: 90,  label: "Knows more than most fans' dads 😅" },
  { min: 85,  label: "Calls it soccer sometimes 😬" },
  { min: 80,  label: "Still learning the offside rule 😬" },
  { min: 75,  label: "Thought Zidane was a manager first 😂" },
  { min: 0,   label: "Asked if Ronaldo plays for Brazil 💀" },
];

function iqLabel(iq) {
  for (const tier of IQ_LABELS) {
    if (iq >= tier.min) return tier.label;
  }
  return IQ_LABELS[IQ_LABELS.length - 1].label;
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({length: m+1}, (_, i) => Array.from({length: n+1}, (_, j) => i === 0 ? j : j === 0 ? i : 0));
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++)
    dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}

function checkTyped(input, question) {
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

function getACSuggestions(val) {
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
const CAT_LABELS = {
  WorldCup:"International", Euros:"Euros", UCL:"Champions League",
  PL:"Premier League", LaLiga:"La Liga", Bundesliga:"Bundesliga",
  SerieA:"Serie A", Ligue1:"Ligue 1", SuperLig:"Süper Lig", Primeira:"Primeira Liga",
  Managers:"Managers", Records:"Records & Icons",
  Legends:"Legends & History", Transfers:"Transfers"
};
const CATS = ["All","WorldCup","Euros","UCL","PL","LaLiga","Bundesliga","SerieA","Ligue1","Transfers","Managers","Records","Legends"];



// ─── CSS ──────────────────────────────────────────────────────────────────────



// ─── CLUB QUIZ PACKS (Pro feature — starter content) ────────────────────────
// Maps each club-pack key to its canonical `club` value in the question bank, so
// the club quiz serves our fact-checked, hint-bearing QB questions whenever we
// have >=10 for that club — auto-upgrading each club as content is generated —
// and falls back to the pack's starter questions otherwise.
const CLUB_PACK_TO_QB = {
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
  RedStar: "Red Star Belgrade", DinamoZagreb: "Dinamo Zagreb", Basel: "Basel",
  Forest: "Nottingham Forest", Villa: "Aston Villa", Everton: "Everton",
  Leeds: "Leeds United", WestHam: "West Ham",
  Sunderland: "Sunderland", Ipswich: "Ipswich Town", Palace: "Crystal Palace", Fulham: "Fulham", Brighton: "Brighton",
  Athletic: "Athletic Bilbao", Sevilla: "Sevilla", Betis: "Real Betis",
  Schalke: "Schalke 04", Hamburg: "Hamburger SV",
  Fiorentina: "Fiorentina", Lazio: "Lazio", Torino: "Torino",
  Sporting: "Sporting CP", SaintEtienne: "Saint-Étienne",
};

// League grouping for the club-quiz picker.
const CLUB_LEAGUES = {
  Arsenal: "pl", Liverpool: "pl", ManUtd: "pl", ManCity: "pl", Chelsea: "pl", Tottenham: "pl", Newcastle: "pl",
  Barcelona: "laliga", RealMadrid: "laliga", Atletico: "laliga",
  Juventus: "seriea", AcMilan: "seriea", InterMilan: "seriea", Napoli: "seriea",
  BayernMunich: "bundesliga", Dortmund: "bundesliga",
  PSG: "ligue1",
  Galatasaray: "superlig", Benfica: "primeira", Fenerbahce: "superlig",
  Porto: "primeira", Roma: "seriea",
  Celtic: "scottish", Rangers: "scottish", Marseille: "ligue1",
  // Wave D: PSV + Feyenoord finally give Ajax a real league home — it sat in
  // "other" only because it was the lone Dutch club.
  Ajax: "eredivisie", Feyenoord: "eredivisie", PSV: "eredivisie",
  Anderlecht: "belgian", ClubBrugge: "belgian",
  Besiktas: "superlig", Trabzonspor: "superlig",
  // Wave E: lone clubs from Serbia/Croatia/Switzerland — kept in "other" until a
  // second club from each country justifies its own league section (same rule
  // that gated Scottish/Eredivisie/Belgian until they had 2+ clubs).
  RedStar: "other", DinamoZagreb: "other", Basel: "other",
  Forest: "pl", Villa: "pl", Everton: "pl", Leeds: "pl", WestHam: "pl",
  Sunderland: "pl", Ipswich: "pl", Palace: "pl", Fulham: "pl", Brighton: "pl",
  Athletic: "laliga", Sevilla: "laliga", Betis: "laliga",
  Schalke: "bundesliga", Hamburg: "bundesliga",
  Fiorentina: "seriea", Lazio: "seriea", Torino: "seriea",
  Sporting: "primeira", SaintEtienne: "ligue1",
};
const CLUB_LEAGUE_SECTIONS = [
  { key: "pl", label: "Premier League" },
  { key: "laliga", label: "La Liga" },
  { key: "seriea", label: "Serie A" },
  { key: "bundesliga", label: "Bundesliga" },
  { key: "ligue1", label: "Ligue 1" },
  { key: "superlig", label: "Süper Lig" },
  { key: "primeira", label: "Primeira Liga" },
  { key: "scottish", label: "Scottish Premiership" },
  { key: "eredivisie", label: "Eredivisie" },
  { key: "belgian", label: "Belgian Pro League" },
  { key: "other", label: "More clubs" },
];

// Colour-code helpers for the club rows (no crests — the club colour IS the identity).
function clubInitials(name) {
  const w = String(name).trim().split(/\s+/);
  return (w.length === 1 ? w[0].slice(0, 3) : w.map(x => x[0]).join("")).slice(0, 3).toUpperCase();
}
function clubHexToRgba(hex, a) {
  const h = String(hex).replace("#", "");
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}
function clubReadableText(hex) {
  const h = String(hex).replace("#", "");
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? "#0a0a0a" : "#ffffff";
}

// Broadcast/club-recognised short codes for the row swatches (MUN, FCB, BVB, …),
// not raw initials. Falls back to clubInitials() for any unmapped key.
const CLUB_ABBR = {
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
  RedStar: "CZ", DinamoZagreb: "DIN", Basel: "BAS",
  Forest: "NFO", Villa: "AVL", Everton: "EVE", Leeds: "LEE", WestHam: "WHU",
  Sunderland: "SUN", Ipswich: "IPS", Palace: "CRY", Fulham: "FUL", Brighton: "BHA",
  Athletic: "ATH", Sevilla: "SEV", Betis: "BET", Schalke: "S04", Hamburg: "HSV",
  Fiorentina: "FIO", Lazio: "LAZ", Torino: "TOR", Sporting: "SCP", SaintEtienne: "ASSE",
};

// SEO deep-links: /play?club=<slug> and /play?quiz=<league-slug> land a
// searcher IN the quiz they Googled (the club/league landing pages' CTAs emit
// these — see scripts/gen-seo-pages.mjs ctaBlock). Slugs match scripts/seo.
const CLUB_SLUG_TO_PACK = {
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
  "red-star-belgrade": "RedStar", "dinamo-zagreb": "DinamoZagreb", "basel": "Basel",
  "nottingham-forest": "Forest", "aston-villa": "Villa", "everton": "Everton",
  "leeds-united": "Leeds", "west-ham": "WestHam",
  "sunderland": "Sunderland", "ipswich": "Ipswich", "crystal-palace": "Palace", "fulham": "Fulham", "brighton": "Brighton",
  "athletic-bilbao": "Athletic", "sevilla": "Sevilla", "real-betis": "Betis",
  "schalke-04": "Schalke", "hamburger-sv": "Hamburg",
  "fiorentina": "Fiorentina", "lazio": "Lazio", "torino": "Torino",
  "sporting-cp": "Sporting", "saint-etienne": "SaintEtienne",
};
const QUIZ_SLUG_TO_CAT = {
  "premier-league": "PL", "la-liga": "LaLiga", "serie-a": "SerieA",
  "bundesliga": "Bundesliga", "ligue-1": "Ligue1",
  "super-lig": "SuperLig", "primeira-liga": "Primeira",
  "champions-league": "UCL", "world-cup": "WorldCup", "euros": "Euros",
};
// Reverse maps for share deep-links (opportunity-scan #1): a club/league quiz
// result should link the recipient back into THAT quiz (/play?club=… /
// ?quiz=…), not the marketing homepage — the boot routing above already
// handles these params; shares just never used them.
const PACK_TO_CLUB_SLUG = Object.fromEntries(Object.entries(CLUB_SLUG_TO_PACK).map(([s, k]) => [k, s]));
const CAT_TO_QUIZ_SLUG = Object.fromEntries(Object.entries(QUIZ_SLUG_TO_CAT).map(([s, c]) => [c, s]));

// ─── LEAGUE QUIZ (competition picker) ────────────────────────────────────────
// Solo single-competition quizzes. Unlike the club quiz (which re-tags rows as
// cat:"ClubQuiz"), league-quiz questions KEEP their real cat, so every answer
// feeds the matching competition rating on the Ball IQ card (PRL/UCL/WCP/…).
const LEAGUE_QUIZ_SECTIONS = [
  { label: "Leagues", items: [
    { cat: "PL",         name: "Premier League",   abbr: "PRL", color: "#3D195B" },
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
];
const LEAGUE_QUIZ_BY_CAT = Object.fromEntries(LEAGUE_QUIZ_SECTIONS.flatMap(s => s.items.map(i => [i.cat, i])));

const CLUB_PACKS = {
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
  const items = MP_TOPICS[tab] || [];
  return (
    <div style={{position:"fixed",inset:0,zIndex:999,background:"var(--bg)",display:"flex",flexDirection:"column"}}>
      <div style={{padding:"calc(14px + env(safe-area-inset-top, 0px)) 20px 0",display:"flex",alignItems:"center",gap:12}}>
        <button onClick={onClose} aria-label="Back" style={{width:38,height:38,borderRadius:12,background:"var(--s1)",border:"1px solid var(--border)",color:"var(--t1)",fontSize:16,cursor:"pointer",fontFamily:"inherit"}}>←</button>
        <span style={{fontSize:24,fontWeight:800,letterSpacing:"-0.02em",color:"var(--t1)"}}>Topics</span>
      </div>
      <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",padding:"0 20px 20px"}}>
        <button onClick={() => setDraft("mixed")} style={{width:"100%",marginTop:14,borderRadius:15,textAlign:"left",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:11,padding:"13px 15px",
          ...(draft === "mixed" ? {background:"rgba(88,204,2,0.1)",border:"1.5px solid rgba(88,204,2,0.55)"} : {background:"var(--s1)",border:"1px solid var(--border)"})}}>
          <span style={{fontSize:19}}>🎲</span>
          <span style={{fontSize:14.5,fontWeight:draft === "mixed" ? 800 : 700,color:draft === "mixed" ? "#8AE042" : "var(--t1)"}}>Mixed — all topics</span>
          <span style={{marginLeft:"auto",width:19,height:19,borderRadius:"50%",...(draft === "mixed"
            ? {background:"var(--accent)",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#06230C",fontWeight:900}
            : {border:"1.5px solid #3A3D4A"})}}>{draft === "mixed" ? "✓" : ""}</span>
        </button>
        <div style={{display:"flex",gap:6,marginTop:16,padding:4,borderRadius:14,background:"var(--s1)",border:"1px solid var(--border)"}}>
          {[{ id: "leagues", label: "Leagues" }, { id: "clubs", label: "Clubs" }, { id: "tournaments", label: "Tournaments" }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{flex:1,borderRadius:10,padding:9,textAlign:"center",fontSize:13,cursor:"pointer",fontFamily:"inherit",
              ...(tab === t.id ? {background:"var(--s2)",border:"1px solid #3A3D4A",fontWeight:800,color:"var(--t1)"} : {background:"transparent",border:"1px solid transparent",fontWeight:700,color:"var(--t2)"})}}>{t.label}</button>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginTop:14}}>
          {items.map(it => {
            const sel = draft === it.id;
            return (
              <button key={it.id} onClick={() => setDraft(it.id)} style={{borderRadius:16,padding:14,display:"flex",flexDirection:"column",gap:6,textAlign:"left",cursor:"pointer",fontFamily:"inherit",
                ...(sel ? {background:"rgba(88,204,2,0.1)",border:"1.5px solid rgba(88,204,2,0.55)"} : {background:"var(--s1)",border:"1px solid var(--border)"})}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%"}}>
                  {it.abbr
                    ? <span style={{width:34,height:34,borderRadius:10,background:it.color || (sel ? "rgba(88,204,2,0.14)" : "var(--s2)"),display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900,letterSpacing:"0.04em",color:it.fg || (sel ? "#8AE042" : "var(--t1)"),boxShadow:it.color ? `0 2px 8px ${it.color}55` : undefined}}>{it.abbr}</span>
                    : <span style={{fontSize:24}}>{it.icon}</span>}
                  {sel && <span style={{width:19,height:19,borderRadius:"50%",background:"var(--accent)",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#06230C",fontWeight:900}}>✓</span>}
                </div>
                <span style={{fontSize:14.5,fontWeight:sel ? 800 : 700,color:sel ? "#8AE042" : "var(--t1)",marginTop:2}}>{it.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div style={{borderTop:"1px solid var(--s1)",background:"#0C0E14",padding:"12px 20px calc(12px + env(safe-area-inset-bottom, 0px))"}}>
        <button onClick={() => onDone(draft)} style={{width:"100%",border:"none",borderRadius:15,background:"var(--accent)",boxShadow:"0 8px 24px rgba(88,204,2,0.25)",padding:15,fontSize:15.5,fontWeight:800,color:"#06230C",cursor:"pointer",fontFamily:"inherit"}}>{doneLabel}</button>
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

// ─── TYPED INPUT WITH AUTOCOMPLETE ───────────────────────────────────────────
function TypedInput({ question, diff, hintsEnabled, onAnswer }) {
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
        <div className="hint-note">💡 Starts with "{firstLetter}"</div>
      )}
      <button className="typed-btn" onClick={() => submit()} disabled={!val.trim() || !!state}>Submit →</button>
    </div>
  );
}

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
function playSound(type) {
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
const IS_NATIVE = typeof Capacitor !== "undefined" && Capacitor.isNativePlatform?.();
// Belt-and-braces for index.html's head script: re-apply the native-app class
// that hides desktop landing chrome (.landing-top / .landing-bottom / etc.).
// Covers any case where the bridge wasn't injected before the head script ran.
if (IS_NATIVE) { try { document.documentElement.classList.add("native-app"); } catch {} }
// Post-Footle App Store nudge (2026-07-16, Alex): the apple-itunes-app smart
// banner never renders inside Threads/IG/X in-app webviews — exactly where
// social traffic lands — and InstallBanner needs a PWA install affordance
// those webviews don't expose. So the social funnel finished Footle with NO
// visible path to the app. iOS-web-gated: desktop can't install an iOS app
// and the Play listing isn't live yet (Android keeps the PWA InstallBanner).
// iPadOS 13+ reports "Mac" + touch, hence the maxTouchPoints branch.
const IS_IOS_WEB = !IS_NATIVE && typeof navigator !== "undefined" &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent || "") ||
    ((navigator.userAgent || "").includes("Mac") && navigator.maxTouchPoints > 1));
function FootleGetAppCTA({ style }) {
  if (!IS_IOS_WEB) return null;
  return (
    <>
      <a
        className="wd-share"
        href={APP_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{ background: "var(--accent)", color: "#0a0a0a", fontWeight: 800, textDecoration: "none", ...style }}
      >
        📲 Get the free app
      </a>
      <div style={{ fontSize: 12, color: "var(--t3)", textAlign: "center", marginTop: 2 }}>
        Streaks, daily reminders &amp; 5,000+ quiz questions
      </div>
    </>
  );
}
export function haptic(type) {
  try {
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

  const answer = (i) => {
    if (done || picked) return;
    const correct = i === q.a;
    haptic(correct ? "correct" : "wrong");
    playSound(correct ? "correct" : "wrong");
    if (correct) setScore(s => s + 1);
    setPicked({ choice: i, correct });
    // Give the player time to read the hint on a wrong answer; otherwise advance quickly
    const delay = !correct && q.hint ? 1800 : 400;
    advanceTimeoutRef.current = setTimeout(() => { setPicked(null); setIdx(j => j + 1); }, delay);
  };

  const pct = (timeLeft / 60) * 100;
  const barColor = timeLeft > 20 ? 'var(--accent)' : timeLeft > 10 ? 'var(--gold)' : 'var(--red)';

  return (
    <div className="quiz-wrap">
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
          return (
            <button key={i} className={cls} onClick={() => answer(i)} disabled={!!picked}>
              <span className="opt-l">{['A','B','C','D'][i]}</span>{opt}
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
          <div style={{fontSize:10,fontWeight:700,color:"var(--t3)",letterSpacing:0.2,fontFamily:"'Inter',sans-serif",marginBottom:4}}>💡 Why?</div>
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
    // Extra breathing room on a wrong answer that has a hint
    const delay = !correct && qCur?.hint ? 2400 : 900;
    timeoutRef.current = setTimeout(() => {
      setPicked(null);
      if (idx + 1 >= total) setDone(true);
      else setIdx(i => i + 1);
    }, delay);
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
    <div className="quiz-wrap">
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
          <div style={{fontSize:10,fontWeight:700,color:"var(--t3)",letterSpacing:0.2,fontFamily:"'Inter',sans-serif",marginBottom:4}}>💡 Why?</div>
          <div>{q.hint}</div>
        </div>
      )}
    </div>
  );
}

// ─── QUIZ ENGINE ──────────────────────────────────────────────────────────────
function QuizEngine({ questions, mode, diff, timerEnabled, timerSecondsOverride, soundEnabled, hintsEnabled, onComplete, onBack, survivalBest, onReport, quizLabel, onHowToPlay }) {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);   // MCQ selected index
  const [typedResult, setTypedResult] = useState(null); // 'correct' | 'wrong' | null
  const [reportedKeys, setReportedKeys] = useState(() => new Set()); // questions flagged "report a problem" this run
  const isSpeed = mode === "speed";
  const timerDuration = isSpeed ? 8 : (timerSecondsOverride || 20);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
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
  const [showNext, setShowNext] = useState(false);
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
  useEffect(() => { wrongAnswersRef.current = []; allAnswersRef.current = []; }, [questions]);
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
  useEffect(() => {
    const onHwBack = (e) => {
      e.preventDefault();
      if (showQuit) { setShowQuit(false); return; }
      if (idx === 0) { onBack(); return; }
      setShowQuit(true);
    };
    window.addEventListener("biq:hw-back", onHwBack);
    return () => window.removeEventListener("biq:hw-back", onHwBack);
  }, [idx, showQuit, onBack]);


  const total = questions?.length || 0;
  const q = questions?.[idx];
  // Phase 6b Issue A: Daily 7 is a leisurely review experience; the
  // auto-fail-after-20s signal was creating frustration on re-entry
  // (the timer-at-full initial render read as "stale state"). Daily
  // joins survival/legends/chaos/balliq in skipping the timer.
  const timed = (timerEnabled !== false) && mode !== "survival" && mode !== "legends" && mode !== "chaos" && mode !== "balliq" && mode !== "daily" && q?.type !== "tf";
  const isTyped = q?.type === "typed";
  const isTF = q?.type === "tf";
  const answered = selected !== null || typedResult !== null;

  // ── desktop-web-refresh (Quiz #02): derived values for the >=1024 desktop
  // chrome (top bar + thin progress + circular timer ring). Every element that
  // consumes these is render-always / CSS-revealed (base display:none), so this
  // math is inert on mobile — the mobile chrome (.q-top/.timer-row/.streak-bar/
  // .q-tag) stays byte-identical. quizLabel is the mode/club/league badge passed
  // from the mount site; the per-question category is the secondary label. ──
  const QD_MODE_BADGE = { classic:"Classic", speed:"Speed", daily:"Daily 7", balliq:`${APP_NAME} Test`, legends:"Legends", chaos:"Chaos", survival:"Survival", wc2026:"International", local:"Local" };
  const qdBadge = quizLabel || QD_MODE_BADGE[mode] || "Quiz";
  const qdCat = q ? (CAT_LABELS[q.cat] || q.cat || "") : "";
  const qdCounter = mode === "survival" ? `Q ${idx + 1}` : `Q ${String(idx + 1).padStart(2, "0")} / ${total}`;
  const qdPct = total > 0 ? ((idx + (answered ? 1 : 0)) / total) * 100 : 0;
  const QD_RING_C = 2 * Math.PI * 33; // r=33 → circumference ≈ 207.35
  const qdRatio = timed ? Math.max(0, Math.min(1, timeLeft / timerDuration)) : 1;
  const qdRingColor = qdRatio > 0.5 ? "#58CC02" : qdRatio > 0.25 ? "#FFC107" : "#FF4747";

  const doAdvance = useCallback((ns, nb, correct) => {
    if (mode === "survival" && !correct) {
      Sentry.addBreadcrumb({ category: 'game', message: 'quiz ended (survival fail)', level: 'info', data: { mode, score: ns, answered: idx + 1 } });
      setDone(true); onCompleteRef.current({ score: ns, total: idx + 1, bestStreak: nb, wrongAnswers: wrongAnswersRef.current, allAnswers: allAnswersRef.current }); return;
    }
    if (idx + 1 >= total) {
      Sentry.addBreadcrumb({ category: 'game', message: 'quiz ended', level: 'info', data: { mode, score: ns, total } });
      setDone(true); onCompleteRef.current({ score: ns, total, bestStreak: nb, wrongAnswers: wrongAnswersRef.current, allAnswers: allAnswersRef.current, speedScore: speedScoreRef.current }); return;
    }
    setIdx(i => i + 1); setSelected(null); setTypedResult(null); setShowNext(false);
    if (timed) setTimeLeft(timerDuration);
  }, [idx, total, mode, timed]);

  const advance = useCallback((ns, nb, correct) => {
    if (mode === "survival" && !correct) { doAdvance(ns, nb, correct); return; }
    if (correct === "timeout") { setTimeout(() => doAdvance(ns, nb, false), 800); return; }
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
      wrongAnswersRef.current = [...wrongAnswersRef.current, { q: q.q, correct: q.type === "typed" ? q.typed_a : q.type === "tf" ? (q.a ? "TRUE" : "FALSE") : q.o[q.a], user: userAnswerText, cat: q.cat, hint: q.hint }];
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
        options,
        userIdx: uIdx,
        correctIdx,
        userText: type === 'typed' ? (userAnswerText || null) : null,
        correctText: type === 'typed' ? q.typed_a : (type === 'tf' ? (q.a ? 'TRUE' : 'FALSE') : q.o[q.a]),
        isCorrect: correct === true,
        timedOut: false,
      }];
    }
    if (isSpeed && correct === true) { setSpeedScore(prev => prev + 100 + timeLeftRef.current * 10); }
    advance(ns, nb, correct);
  }, [score, streak, bestStreak, advance]);

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
    setTimeLeft(timerDuration);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        if (t === 6) { try { haptic("select"); } catch {} }  // Subtle warning at 5 seconds left
        return t - 1;
      });
    }, 1000);
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
          options,
          userIdx: -1,
          correctIdx,
          userText: null,
          correctText: type === 'typed' ? tq.typed_a : (type === 'tf' ? (tq.a ? 'TRUE' : 'FALSE') : tq.o[tq.a]),
          isCorrect: false,
          timedOut: true,
        }];
      }
      setScore(s => {
        setStreak(0);
        setBestStreak(b => {
          setSelected(questions[idx]?.a ?? -1);
          advanceRef.current?.(s, b, "timeout");
          return b;
        });
        return s;
      });
    }, timeoutMs);
    return () => { clearInterval(timerRef.current); clearTimeout(answerTimeoutRef.current); };
  }, [idx, timed, done, isTyped]);

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
          if (idx === 0) { onBack(); return; }
          setShowQuit(true);
        }} aria-label="Go back">←</button>
        {mode === "survival" ? (
          <div style={{flex:1}} />
        ) : (
          <div className="prog-wrap"><div className="prog-bar" style={{ width: `${((idx + (answered ? 1 : 0)) / total) * 100}%` }} /></div>
        )}
        <div className="q-top-right">
          {score > 0 && <span className="q-score-live">{score}<span className="q-score-tick"> ✓</span></span>}
          <span className="q-ctr">{mode === "survival" ? `Q${idx + 1}` : `${idx + 1}/${total}`}</span>
          {onHowToPlay && <button className="icon-btn" onClick={onHowToPlay} aria-label="How to play" title="How to play">?</button>}
        </div>
      </div>

      {mode === "survival" && (
        <div className="streak-bar">
          <div className="streak-n">🔥 {streak}</div>
          <div className="streak-info">
            <strong>{streak === 0 ? "Survival Mode" : streak === 1 ? "First one!" : streak < 5 ? "Keep going!" : streak < 10 ? "On fire! 🔥" : "Unstoppable!"}</strong>
            {survivalBest > 0 && <span style={{fontSize:11,color:"var(--t3)",marginLeft:6}}>PB: {survivalBest}</span>}
            {streak > 0 && survivalBest > 0 && streak >= survivalBest && <span style={{fontSize:11,color:"var(--gold)",marginLeft:4,fontWeight:700}}>🏆 New PB!</span>}
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
        <span className="qd-pill qd-pill-streak"><span className="qd-pill-ic">🔥</span>{streak} streak</span>
        {timed && !isTyped ? (
          <div className="qd-ring">
            <svg width="78" height="78" viewBox="0 0 78 78">
              <circle cx="39" cy="39" r="33" fill="none" stroke="#242836" strokeWidth="7"></circle>
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
              <button key={i} className={cls} onClick={() => handleMCQ(i)} disabled={answered}
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

      {answered && q?.hint && (() => {
        const isCorrect = isTF
          ? ((selected === 1) === (q?.a === true || q?.a === 1))
          : (selected === q?.a || typedResult === "correct");
        if (isCorrect) return null;
        return (
          <div style={{
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
            <div style={{fontSize:10,fontWeight:700,color:"var(--t3)",letterSpacing:0.2,fontFamily:"'Inter',sans-serif",marginBottom:4}}>💡 Why?</div>
            <div>{q.hint}</div>
          </div>
        );
      })()}

      {/* role="status" is polite by implication — NOT assertive, which the quiz
          timer already owns; two assertive regions would clobber each other. */}
      {answered && (
        <div role="status" className={`feedback ${(isTF ? ((selected === 1) === (q?.a === true || q?.a === 1)) : (selected === q?.a || typedResult === "correct")) ? "correct" : "wrong"}`}>
          <span style={{flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{(isTF ? ((selected === 1) === (q?.a === true || q?.a === 1)) : (selected === q?.a || typedResult === "correct"))
            ? "✓ Correct!"
            : isTyped
              ? `✗ ${q.typed_a}`
              : "✗ Incorrect"
          }</span>
        </div>
      )}
      {answered && showNext && (
        <button
          className="next-btn-primary"
          onClick={() => doAdvance(showNext.ns, showNext.nb, showNext.correct)}
        >
          {idx + 1 >= total ? "Results →" : "Next →"}
        </button>
      )}
      {answered && onReport && (() => {
        const rkey = q?._histKey || (q?.id != null ? String(q.id) : q?.q);
        const reported = reportedKeys.has(rkey);
        return (
          <button
            type="button"
            disabled={reported}
            onClick={() => {
              if (reported) return;
              const picked = isTF
                ? (selected === 1 ? "True" : selected === 0 ? "False" : null)
                : (typeof selected === "number" && Array.isArray(q?.o) ? q.o[selected] : null);
              const correct = isTF
                ? ((q?.a === true || q?.a === 1) ? "True" : "False")
                : (Array.isArray(q?.o) && typeof q?.a === "number" ? q.o[q.a] : (q?.typed_a || null));
              onReport({ id: q?.id, q: q?.q, picked, correct, mode });
              setReportedKeys(prev => new Set(prev).add(rkey));
            }}
            style={{
              display:"block", margin:"12px auto 0", padding:"6px 10px",
              background:"none", border:"none", cursor: reported ? "default" : "pointer",
              color:"var(--t3)", fontSize:12, fontWeight:600, fontFamily:"inherit",
              opacity: reported ? 0.65 : 1,
              WebkitAppearance:"none", appearance:"none", WebkitTextFillColor:"currentColor"
            }}
          >
            {reported ? "✓ Reported — thanks" : "⚑ Report a problem"}
          </button>
        );
      })()}
      </div>{/* /.qd-play */}

      {showQuit && (
        <div className="modal-overlay" onClick={() => setShowQuit(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Quit this game?</div>
            <div className="modal-body">Your progress will be lost.</div>
            <div className="modal-btns">
              <button className="modal-btn modal-cancel" onClick={() => setShowQuit(false)}>Keep playing</button>
              <button className="modal-btn modal-confirm" onClick={onBack}>Quit</button>
            </div>
          </div>
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
    typeof q.a === "number"
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
      return { prompt: q.q, options: idx.map(i => q.o[i]), correct: idx.indexOf(q.a) };
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

const EMOJIS = ["⚽","🏆","🔥","⚡","🎯","🥅","🧤","👑"];

function LocalSetup({ onStart, onBack }) {
  const [count, setCount] = useState(2);
  const [names, setNames] = useState(Array.from({ length: 6 }, (_, i) => ""));
  const [lmode, setLmode] = useState("classic");
  const [ldiff, setLdiff] = useState("medium");
  const [topic, setTopic] = useState("mixed");
  const [topicOpen, setTopicOpen] = useState(false);

  const setName = (idx, val) => setNames(n => { const copy = n.slice(); copy[idx] = val; return copy; });

  const launch = () => {
    const players = Array.from({ length: count }, (_, i) => ({
      id: i,
      name: (names[i] || "").trim() || `Player ${i + 1}`,
      emoji: EMOJIS[i % EMOJIS.length],
    }));
    onStart({ players, mode: lmode, diff: ldiff, topic });
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
            <div className="player-num">{EMOJIS[i % EMOJIS.length]}</div>
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
            <button onClick={() => setTopicOpen(true)} style={{border:"none",borderRadius:999,padding:"9px 16px",fontSize:13,fontWeight:800,color:"#06230C",background:"var(--accent)",cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>Change</button>
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
          { id:"classic",  icon:"⏱️", name:"Classic",  desc:"10 questions" },
          { id:"sprint",   icon:"⚡",  name:"Sprint",   desc:"5 questions" },
          { id:"survival", icon:"🔥", name:"Survival", desc:"Eliminated on wrong" },
        ].map(m => (
          <button key={m.id} className={`local-mode-chip${lmode===m.id?" on":""}`} onClick={() => setLmode(m.id)}>
            <span className="local-mode-icon">{m.icon}</span>
            <span className="local-mode-name">{m.name}</span>
            <span className="local-mode-desc">{m.desc}</span>
          </button>
        ))}
      </div>

      {/* Difficulty */}
      <div className="ds-eyebrow local-section-label">Difficulty</div>
      <div className="local-diff-row">
        {[
          { id:"easy",   icon:"🌱", name:"Easy" },
          { id:"medium", icon:"⚽", name:"Medium" },
          { id:"hard",   icon:"🧠", name:"Hard" },
        ].map(d => (
          <button key={d.id} className={`local-diff-chip${ldiff===d.id?" on":""}`} onClick={() => setLdiff(d.id)}>
            <span style={{fontSize:18}}>{d.icon}</span>
            <span>{d.name}</span>
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
function LocalGameScreen({ config, onComplete, onExit }) {
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
          const pool = QB.filter(q => q && q.club === clubName && q.type === "mcq" && Array.isArray(q.o));
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

  const revealSurvivalQuestion = (picksSoFar) => {
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
  };

  const revealChunk = (picksSoFar) => {
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
  };

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
        <div className="local-ready-emoji">{currentPlayer?.emoji || "🎮"}</div>
        <div className="local-ready-name">{headline}</div>
        <div className="local-ready-sub">{sub}</div>
        {mode === "survival" && eliminatedIds.length > 0 && (
          <div className="local-out-list">
            {eliminatedIds.map(id => {
              const p = players.find(pp => pp.id === id);
              return p ? <span key={id} className="local-out-chip">{p.emoji} {p.name}</span> : null;
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
        <div className="local-ready-emoji">{currentPlayer?.emoji || "🎮"}</div>
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
          <div style={{marginTop:14,textAlign:"center",fontSize:15,fontWeight:800,color:"var(--info, #FFC107)"}}>
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
                    <span>{p.emoji}</span>
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
              <span>{p.emoji}</span>
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
function LocalResults({ result, onHome, onRetry, onShare }) {
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
        iconTop = "🤝";
        headline = "It's a Tie!";
        const names = tiedAtTop.map(p => p.name).join(" · ");
        subHeadline = `${names} — all on ${topScore}`;
      } else {
        const top = byScore[0];
        iconTop = top?.emoji || "🏆";
        headline = top ? `${top.name} Wins!` : "Game Over";
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
      iconTop = "🤝";
      headline = "It's a Tie!";
      const names = tiedAtTop.map(p => p.name).join(" · ");
      subHeadline = `${names} — all on ${topScore}`;
    } else {
      iconTop = top?.emoji || "🏆";
      headline = top ? `${top.name} wins!` : "Game Over";
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
            <div className="pod-rank">{["🥇","🥈","🥉"][i]}</div>
            <div className="pod-name">{p.emoji} {p.name}</div>
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
              <span style={{fontSize:18}}>{p.emoji}</span>
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
                  {p.emoji} {p.name}
                </span>
              );
            })}
          </div>
        </div>
      )}

      <div className="results-actions" style={{marginTop:16}}>
        <button className="btn-3d" onClick={onRetry}>Play Again</button>
        {onShare && <button className="btn-3d ghost" onClick={onShare}>Share Score</button>}
        <button className="btn-3d ghost" onClick={onHome}>Back to Home</button>
      </div>
    </div>
  );
}


// ─── XP + LEVEL SYSTEM ────────────────────────────────────────────────────────
// LEVELS + getLevelInfo extracted to ./lib/scoring.js (Sprint #13 Stage 1).

// Footle XP (opportunity-scan #3): the flagship daily habit previously fed
// ZERO progression — levels/shields/badges exerted no pull on exactly the
// daily-loop users. Won: fewer guesses = more XP (60 → 30); lost: 10 for
// showing up (the streak-keeping visit still counts for something).
function getFootleXP(won, guesses) {
  if (!won) return 10;
  const g = Math.min(6, Math.max(1, guesses || 6));
  return 30 + (6 - g) * 6;
}

function getXPForResult(score, total, mode) {
  if (mode === "hotstreak") {
    // Hot Streak: 5 XP per correct, bonus tiers
    const tierBonus = score >= 25 ? 100 : score >= 15 ? 50 : score >= 8 ? 20 : 0;
    return score * 5 + tierBonus;
  }
  if (mode === "truefalse") {
    // True/False: 6 XP per correct, perfect bonus
    const perfectBonus = score === total ? 40 : 0;
    return score * 6 + perfectBonus;
  }
  if (mode === "wc2026") {
    // WC2026: same as classic but with World Cup bonus
    const pct = score / total;
    const perfectBonus = score === total ? 60 : 0;
    return Math.round(score * 10 + pct * 20) + perfectBonus;
  }
  const base = score * 10;
  const bonus = mode === "survival" ? Math.floor(score * 1.5) * 10 : 0;
  const perfectBonus = score === total && mode !== "survival" ? 50 : 0;
  return base + bonus + perfectBonus;
}


// ─── BRANDED SHARE CARD (NEW, 390×600 PORTRAIT) ─────────────────────────────
// Variants:
//   'wordle'    — Today's Puzzle. Score + emoji-tile grid.
//   'standard'  — Classic / Survival / Daily / Chaos / Legends / WC2026.
//   'balliq'    — APP_NAME Test. IQ number, funny label, percentile.
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

async function generateShareCard(type, data) {
  const W = SHARE_CARD_W, H = SHARE_CARD_H;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

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
  _roundRectPath(ctx, 0, 0, W, H, 20);
  ctx.clip();

  // Background
  ctx.fillStyle = "#0A0A0A";
  ctx.fillRect(0, 0, W, H);

  // Top accent bar
  ctx.fillStyle = "#58CC02";
  ctx.fillRect(0, 0, W, 6);

  // Header row — wordmark left, URL right
  const padX = 24;
  const headerY = 38;
  ctx.textBaseline = "alphabetic";
  ctx.font = '800 22px Inter, "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "left";
  ctx.fillText(`⚽ ${APP_NAME}`, padX, headerY);

  ctx.font = '500 12px Inter, "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = "#9BA0B8";
  ctx.textAlign = "right";
  ctx.fillText("balliq.app", W - padX, headerY);

  // Divider
  ctx.fillStyle = "#2A2D3A";
  ctx.fillRect(padX, 56, W - padX * 2, 1);

  // Centered footer URL
  ctx.font = '500 13px Inter, "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = "#9BA0B8";
  ctx.textAlign = "center";
  ctx.fillText("balliq.app", W / 2, H - 24);

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
  } else if (type === "balliq") {
    const iq = data?.iq ?? 0;
    const label = data?.label || "";

    ctx.font = '700 13px Inter, "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = "#9BA0B8";
    ctx.fillText("BALL IQ TEST", cx, 130);

    ctx.font = '900 88px "JetBrains Mono", "Courier New", monospace';
    ctx.fillStyle = "#58CC02";
    ctx.fillText(String(iq), cx, 260);

    // Funny label — wrapped to 300px
    ctx.font = '600 16px Inter, "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = "#FFFFFF";
    _wrapText(ctx, label, cx, 308, 300, 22);

    // Subtitle
    ctx.font = '700 15px Inter, "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText("Can you beat me? ⚽", cx, 520);
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
    const tier = accuracy >= 90 ? "Elite ⚽" : accuracy >= 70 ? "Sharp!" : accuracy >= 50 ? "Solid effort" : "Room to grow";
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
async function shareCard(type, data, opts = {}) {
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
      if (type === "balliq")    return `My Ball IQ is ${data.iq} — what's yours? ${link}`;
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
function CountUp({ value, duration = 900, delay = 150, triggerHaptic = false, suffix = "", ...rest }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(null);
  const startRef = useRef(null);
  useEffect(() => {
    const target = Number(value) || 0;
    if (target === 0) { setDisplay(0); return; }
    const timeoutId = setTimeout(() => {
      const step = (t) => {
        if (!startRef.current) startRef.current = t;
        const elapsed = t - startRef.current;
        const progress = Math.min(1, elapsed / duration);
        // easeOutCubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplay(Math.round(target * eased));
        if (progress < 1) {
          rafRef.current = requestAnimationFrame(step);
        } else {
          setDisplay(target);
          if (triggerHaptic && typeof haptic === "function") haptic("correct");
        }
      };
      rafRef.current = requestAnimationFrame(step);
    }, delay);
    return () => {
      clearTimeout(timeoutId);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      startRef.current = null;
    };
  }, [value, duration, delay, triggerHaptic]);
  return <span {...rest}>{display}{suffix}</span>;
}

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


// ─── HARD RIGHT BURST ────────────────────────────────────────────────────────
// Lightweight, quick particle burst used when a user gets a HARD question right.
// Different from full Confetti — faster, more focused, emanates from center-bottom.
function HardRightBurst({ onComplete }) {
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


// ─── BALL IQ RESULTS ─────────────────────────────────────────────────────────
// Extracted into its own component so hooks are never called conditionally
function BallIQResults({ result, iqHistory, onRetry, onShare, onHome }) {
  const iq = calcBallIQ(result.score, result.total);
  const pctile = iqPercentile(iq);
  const label = iqLabel(iq);
  const ringPct = Math.min((iq - 60) / 100, 1);
  const showIQConfetti = iq >= 120;

  const [displayIQ, setDisplayIQ] = useState(60);
  const [ringDisplay, setRingDisplay] = useState(0);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    // Audit Phase 5 (E1): cancelled flag matches Confetti/HardRightBurst
    // pattern in this file. Without it, the rAF chain inside setTimeout
    // continues running setDisplayIQ/setRingDisplay on the unmounted
    // component if the user dismisses results within ~1.8s of mount
    // (400ms delay + 1400ms animation).
    let cancelled = false;
    const delay = setTimeout(() => {
      if (cancelled) return;
      setRevealed(true);
      const start = 60;
      const duration = 1400;
      const startTime = Date.now();
      const tick = () => {
        if (cancelled) return;
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayIQ(Math.round(start + (iq - start) * eased));
        setRingDisplay(ringPct * eased);
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, 400);
    return () => { cancelled = true; clearTimeout(delay); };
  }, []);

  return (
    <div className="screen" style={{paddingTop:8, position:"relative"}}>
      {showIQConfetti && revealed && <Confetti />}
      <ResultsCloseBtn onClose={onHome} />
      <div className={`iq-result${revealed ? " iq-revealed" : ""}`}>
        <div style={{fontSize:13,color:"var(--t2)",fontWeight:600,marginBottom:4}}>Your {APP_NAME}</div>
        <div className="iq-score-wrap">
          <div className={`iq-ring iq-ring-hero${iq >= 120 ? " great" : ""}`} style={{background:`conic-gradient(var(--accent) ${ringDisplay*360}deg, var(--s3) 0deg)`}}>
            <div className="iq-ring-inner iq-ring-inner-hero">
              <div className="iq-num iq-num-hero">{displayIQ}</div>
              <div className="iq-sub">{APP_NAME}</div>
            </div>
          </div>
        </div>
        {/* Funny label rendered as a prominent pill directly below the hero
            ring — leans into the IQ score as the headline metric. */}
        <div className="iq-label-pill" style={{opacity: revealed ? 1 : 0, transform: revealed ? "translateY(0)" : "translateY(6px)", transition:"opacity 0.5s 0.5s,transform 0.5s 0.5s"}}>{label}</div>
        <div className="iq-pct" style={{opacity: revealed ? 1 : 0, transition:"opacity 0.5s 1.6s", lineHeight:1.8}}>
          {pctile >= 90 && <div style={{fontSize:12,color:"var(--gold)",fontWeight:700,marginTop:4}}>🏆 Elite level knowledge!</div>}
          {pctile >= 75 && pctile < 90 && <div style={{fontSize:12,color:"var(--accent)",fontWeight:600,marginTop:4}}>⚡ Sharp — you really know your football</div>}
          {pctile >= 50 && pctile < 75 && <div style={{fontSize:12,color:"var(--t2)",marginTop:4}}>Keep playing to climb higher!</div>}
          {pctile < 50 && <div style={{fontSize:12,color:"var(--t2)",marginTop:4}}>Retake the test to boost your score</div>}
        </div>
      </div>
      <div className="s-row">
        <div className="sbox"><div className="sbox-v" style={{color:"var(--green)"}}>{result.score}</div><div className="sbox-k">Correct</div></div>
        <div className="sbox"><div className="sbox-v" style={{color:"var(--red)"}}>{result.total - result.score}</div><div className="sbox-k">Wrong</div></div>
        {/* Streak tile only when there's an actual streak to brag about. */}
        {(result.bestStreak||0) >= 3 && (
          <div className="sbox"><div className="sbox-v" style={{color:"var(--gold)"}}>{result.bestStreak}</div><div className="sbox-k">Streak</div></div>
        )}
      </div>
      {iqHistory && iqHistory.length > 1 && (
        <div className="iq-history">
          <div className="iq-hist-label">Your last {iqHistory.length} scores</div>
          <div className="iq-hist-bars">
            {iqHistory.map((h, i) => (
              <div key={i} className="iq-hist-col">
                <div className="iq-hist-bar" style={{height:`${Math.round(((h.iq-60)/100)*44)+4}px`, background: h.iq >= 120 ? "var(--accent)" : h.iq >= 100 ? "var(--gold)" : "var(--t3)"}}/>
                <div className="iq-hist-n">{h.iq}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="results-actions">
        <button className="btn-3d" onClick={onRetry}>Retake Test</button>
        <button className="btn-3d ghost" onClick={onShare}>Share Score</button>
        <button className="btn-3d ghost" onClick={onHome}>Back to Home</button>
      </div>
    </div>
  );
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
// Daily-specific tier copy. Returns the same shape DailySocialProof used
// (emoji + headline + sub), but extracted so the Results screen can use
// the headline/sub as the score-tier tagline without rendering the full
// duplicate-card UI. Daily personality preserved, single celebration.
function dailyTierCopy(score, total) {
  const safeTotal = total || 7;
  const safeScore = Math.max(0, Math.min(safeTotal, score || 0));
  if (safeScore === safeTotal) return { emoji: "🏆", headline: "Perfect run!",        sub: "All seven correct — flawless." };
  if (safeScore >= 6)          return { emoji: "🌟", headline: "Excellent!",          sub: "One of those days where it just clicks." };
  if (safeScore >= 4)          return { emoji: "⚽", headline: "Solid challenge.",    sub: "Some tough ones in there today." };
  if (safeScore >= 2)          return { emoji: "📈", headline: "Keep going.",         sub: "Tomorrow's another chance to climb." };
  return                              { emoji: "💪", headline: "Everyone starts somewhere.", sub: "Come back tomorrow for a fresh seven." };
}

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

// Score-tier tagline shown under the score caption on result screens. Maps a
// percentage (0-100) to a one-line emotional beat. Used by Results today;
// other result screens already carry their own emoji+title flavour so they
// don't render this.
function scoreTagline(pct) {
  if (pct <= 30) return "Tough round.";
  if (pct <= 50) return "Solid effort.";
  if (pct <= 70) return "Strong showing.";
  if (pct <= 89) return "Excellent.";
  return "Brilliant!";
}

// Shared close button for result screens. Absolutely positioned in the screen's
// top-right so it doesn't compete with the global wordmark on the left. 44×44px
// touch target. All result screens use this so the affordance is consistent.
function ResultsCloseBtn({ onClose }) {
  return (
    <button
      onClick={onClose}
      aria-label="Close results"
      style={{
        position: "absolute",
        top: 8,
        right: 0,
        width: 44,
        height: 44,
        borderRadius: 12,
        border: "1px solid var(--border)",
        background: "var(--s1)",
        color: "var(--t2)",
        fontSize: 20,
        fontWeight: 600,
        lineHeight: 1,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10,
      }}
    >
      ×
    </button>
  );
}

// ── Stump-a-mate: one-question challenge screen (balliq.app/q?id=… link) ────
// The recipient side of the viral loop: answer a single question with zero
// login, get the reveal + the hint story, then the chain CTA ("pass it on")
// and a full-quiz conversion path. Sender side lives in Results (🥜 button).
const stumpLink = (row) =>
  `https://balliq.app/q?id=${row.id}&qt=${encodeURIComponent(row.q.slice(0, 160))}${row.cat ? `&c=${encodeURIComponent(row.cat)}` : ""}`;

async function shareStumpText(text) {
  try {
    if (navigator.share) { await navigator.share({ text }); return; }
  } catch { return; } // user cancelled the sheet = done
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      window.dispatchEvent(new CustomEvent("biq:show-toast", { detail: "Link copied 📋" }));
    }
  } catch {}
}

function StumpScreen({ row, onPlayFull, onHome }) {
  const [picked, setPicked] = useState(-1);
  const done = picked >= 0;
  const gotIt = done && picked === row.a;

  const onPick = (i) => {
    if (done) return;
    setPicked(i);
    haptic(i === row.a ? "correct" : "wrong");
  };
  const onPass = () => {
    const text = gotIt
      ? `Got it ✅ your turn 😏 ⚽ ${stumpLink(row)}`
      : `It got me too 🙈 can YOU get it? ⚽ ${stumpLink(row)}`;
    shareStumpText(text);
  };

  const optStyle = (i) => {
    const base = { display: "block", width: "100%", textAlign: "left", padding: "14px 16px", marginTop: 10, borderRadius: 12, border: "1.5px solid var(--bd, #2A2D3A)", background: "var(--card, #14161E)", color: "var(--text, #F0F1F5)", fontFamily: "inherit", fontSize: 15, fontWeight: 700, cursor: done ? "default" : "pointer" };
    if (!done) return base;
    if (i === row.a) return { ...base, borderColor: "var(--accent, #58CC02)", background: "rgba(88,204,2,0.12)" };
    if (i === picked) return { ...base, borderColor: "var(--red, #FF5A5A)", background: "rgba(255,90,90,0.10)", opacity: 0.9 };
    return { ...base, opacity: 0.55 };
  };

  return (
    <div className="screen">
      <div className="page-hdr">
        <div className="page-title">🥜 Stump a mate</div>
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t2)", marginBottom: 10 }}>
        A mate bets you can't get this{row.cat ? ` (${row.cat})` : ""}:
      </div>
      <div style={{ fontSize: 19, fontWeight: 800, lineHeight: 1.35, color: "var(--text)", letterSpacing: "-0.2px" }}>{row.q}</div>
      <div style={{ marginTop: 14 }}>
        {row.o.map((opt, i) => (
          <button key={i} style={optStyle(i)} onClick={() => onPick(i)} disabled={done}>{opt}</button>
        ))}
      </div>
      {done && (
        <>
          <div style={{ textAlign: "center", marginTop: 18, fontSize: 17, fontWeight: 800, color: gotIt ? "var(--accent)" : "var(--red, #FF5A5A)" }}>
            {gotIt ? "⚽ You got it!" : "Stumped! 🥜"}
          </div>
          {row.hint && (
            <div style={{ marginTop: 10, padding: "12px 14px", borderRadius: 12, background: "var(--card, #14161E)", border: "1px solid var(--bd, #2A2D3A)", fontSize: 14, lineHeight: 1.5, color: "var(--t2)" }}>
              {row.hint}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginTop: 20 }}>
            <button className="btn-3d" onClick={onPass}>🥜 Pass it on</button>
            <button className="btn-3d ghost" onClick={onPlayFull}>Play the full quiz</button>
            <button className="btn-3d ghost" onClick={onHome}>Explore Ball IQ</button>
          </div>
        </>
      )}
    </div>
  );
}

// Wrong-answer review list — shared by the mobile results stack and the
// desktop rd-card so the learn-loop survives at every width (desktop used to
// silently drop it: the list lived inside .rd-mobile, display:none >= 1024).
function WrongAnswersReview({ wrongAnswers }) {
  if (!wrongAnswers || wrongAnswers.length === 0) return null;
  return (
    <div style={{marginTop:24}}>
      <div className="ds-eyebrow" style={{textAlign:"center", marginBottom:10}}>
        Review {wrongAnswers.length} missed {wrongAnswers.length === 1 ? "answer" : "answers"}
      </div>
      <div className="wrong-review">
        {wrongAnswers.map((w, i) => (
          <div key={i} className="wr-item">
            <div className="wr-q">{w.q}</div>
            {w.user && (
              <div className="wr-user">
                <span className="wr-x">✗</span>{w.user}
              </div>
            )}
            <div className="wr-a"><span className="wr-tick">✓</span>{w.correct}</div>
            {w.hint && <div className="wr-why">{w.hint}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function Results({ result, mode, onHome, onRetry, onShare, onPlayFootle, iqHistory, survivalBest, wrongAnswers, askedQuestions, classicBest, label }) {
  const isPerfect = result && result.score === result.total && result.total >= 10;
  const pct = Math.round((result.score / result.total) * 100);
  useEffect(() => { if (isPerfect) haptic("levelup"); }, [isPerfect]);
  const isSurvival = mode === "survival";
  const isSpeed = mode === "speed";
  const isDaily = mode === "daily";

  if (mode === "balliq") {
    return <BallIQResults result={result} iqHistory={iqHistory} onRetry={onRetry} onShare={onShare} onHome={onHome} />;
  }

  const xpEarned = getXPForResult(result.score, result.total, mode);
  const showConfetti = isSurvival ? result.score >= 10 : pct >= 80;

  // Daily 7 is one-shot: "Play Again" would just re-call startMode('daily')
  // and toast "Already done today" — a dead primary button. Point the CTA at
  // the OTHER daily loop (Footle) while it's still open; when both dailies
  // are done, show a non-button "come back tomorrow" state instead.
  const footleToday = isDaily ? readWordleTodayStatus() : null;
  const footleOpen = footleToday && (footleToday.kind === "ready" || footleToday.kind === "in-progress");
  const footleCta = footleToday?.kind === "in-progress" ? "Continue today's Footle" : "Play today's Footle";

  // Personal best detection
  const eligibleForPB = mode === "classic" && result.total === 10;
  const isNewBest = eligibleForPB && result.score > (classicBest || 0) && result.score > 0;

  // Stump-a-mate ammo (contextual, per Alex's call): prefer the hardest
  // question that got the player (self-deprecating share beats a brag for
  // k-factor), else the hardest one they aced. Plain code, NOT hooks — this
  // sits below the balliq-mode early return. askedQuestions rows are the
  // shuffled play copies, but stumpLink only reads id/q/cat, and the
  // recipient re-resolves the original row from the bank by id.
  const diffRank = { hard: 3, medium: 2, easy: 1 };
  const stumpables = (askedQuestions || []).filter((x) => x && x.id && x.type === "mcq" && Array.isArray(x.o) && x.o.length >= 2);
  const wrongTexts = new Set((wrongAnswers || []).map((w) => w.q));
  const stumpWrong = stumpables.filter((x) => wrongTexts.has(x.q));
  const stumpPool = stumpWrong.length ? stumpWrong : stumpables;
  const stumpQ = stumpPool.length ? stumpPool.slice().sort((a, b) => (diffRank[b.diff] || 0) - (diffRank[a.diff] || 0))[0] : null;
  const onStump = () => {
    if (!stumpQ) return;
    haptic("soft");
    const text = stumpWrong.length
      ? `This one got me 🙈 bet you can't get it either ⚽ ${stumpLink(stumpQ)}`
      : `I got this one — bet you can't 😏 ⚽ ${stumpLink(stumpQ)}`;
    shareStumpText(text);
  };
  const survivalNewBest = isSurvival && result.score > (survivalBest || 0) && result.score >= 3;
  const isNewPersonalBest = isNewBest || survivalNewBest;

  // Huge-score display + caption per mode
  const hugeScore = isSpeed ? (result.speedScore || 0) : result.score;
  const scoreCaption = isSpeed
    ? `${result.score} correct out of ${result.total} · speed bonus included`
    : isSurvival
    ? `${result.score} in a row before missing one`
    : `${result.score} correct out of ${result.total}`;

  // ── desktop-web-refresh (Results #03): values for the >=1024 card (circular
  //  score badge · per-question dots · stat tiles). Render-always / CSS-revealed
  //  via the .rd-desktop wrapper; the mobile results is wrapped in .rd-mobile
  //  (display:contents→none at desktop) so it stays byte-identical. ──
  const RD_MODE_LABEL = { classic:"Classic", speed:"Speed Round", daily:"Daily 7", survival:"Survival", legends:"Legends", chaos:"Chaos", wc2026:"International" };
  const rdSubtitle = [RD_MODE_LABEL[mode] || "Quiz", label].filter(Boolean).join(" · ");
  const rdDots = (() => {
    const arr = Array.isArray(result.allAnswers) ? result.allAnswers.map(a => a.isCorrect === true) : [];
    while (arr.length < result.total) arr.push(false); // timed-out / unanswered → miss
    return arr.slice(0, result.total);
  })();
  const rdTier = isDaily ? dailyTierCopy(result.score, result.total).headline : scoreTagline(pct);
  const rdBestStreak = result.bestStreak != null ? result.bestStreak : 0;

  return (
    <div className="screen" style={{paddingTop:8, position:"relative"}}>
      {(isPerfect || showConfetti) && <Confetti />}
      <div className="rd-mobile">
      <ResultsCloseBtn onClose={onHome} />

      {/* Final score eyebrow + huge green number + caption */}
      <div style={{textAlign:"center", padding:"20px 0 8px"}}>
        <div className="ds-eyebrow">Final score</div>
        <div
          className="numeric"
          style={{
            marginTop:8,
            fontSize:88,
            fontWeight:900,
            color:"#58CC02",
            letterSpacing:"-0.03em",
            lineHeight:1,
            textShadow:"0 8px 32px rgba(88,204,2,0.35)",
          }}
        >
          <CountUp value={hugeScore} duration={900} delay={200} triggerHaptic />
        </div>
        <div style={{marginTop:8, fontSize:15, color:"var(--t2)"}}>{scoreCaption}</div>
        {/* Score-tier tagline. Daily uses the daily-specific tier copy so
            the personality from the old DailySocialProof callout is kept
            ("Tomorrow's another chance to climb" etc.) without the
            duplicate card. Survival skips — its caption + PB callout
            already carry the moment. */}
        {isDaily ? (() => {
          const { headline, sub } = dailyTierCopy(result.score, result.total);
          return (
            <>
              <div style={{marginTop:6, fontSize:15, color:"var(--t1)", fontWeight:700}}>{headline}</div>
              <div style={{marginTop:2, fontSize:13, color:"var(--t3)", fontWeight:500}}>{sub}</div>
            </>
          );
        })() : !isSurvival && (
          <div style={{marginTop:6, fontSize:14, color:"var(--t3)", fontWeight:500}}>
            {scoreTagline(pct)}
          </div>
        )}
        {isNewPersonalBest && (
          <div style={{marginTop:10, display:"inline-flex", alignItems:"center", gap:6, fontSize:13, fontWeight:700, color:"var(--gold)"}}>
            <span>⭐</span>
            <span>Personal best{isNewBest && classicBest ? ` — was ${classicBest}` : survivalNewBest && survivalBest ? ` — was ${survivalBest}` : ""}</span>
          </div>
        )}
        {/* XP indicator promoted into the celebration moment — was a muted
            footer below the buttons; now sits with the score in gold so it
            reads as a reward rather than a footnote. Gold matches XP
            theming elsewhere in the app (toasts, level-up overlay). */}
        {xpEarned > 0 && (
          <div style={{marginTop:14, fontSize:14, color:"var(--gold)", fontWeight:700}}>
            +{xpEarned} XP earned ⚡
          </div>
        )}
      </div>

      {/* Best streak as a small gold pill — reads as an achievement
          badge rather than a stat row. Hides below 3 in a row (anything
          smaller would be ambient noise). */}
      {result.bestStreak != null && result.bestStreak >= 3 && (
        <div style={{textAlign:"center", marginTop:18}}>
          <span style={{
            display:"inline-flex",
            alignItems:"center",
            gap:8,
            padding:"8px 14px",
            background:"rgba(255,200,0,0.08)",
            border:"1px solid rgba(255,200,0,0.25)",
            borderRadius:999,
            fontSize:13,
            fontWeight:700,
            color:"var(--gold)",
          }}>
            <span>🔥</span>
            <span>Best streak: {result.bestStreak} in a row</span>
          </span>
        </div>
      )}

      {result.winner && (
        <div style={{textAlign:"center", margin:"14px 0", fontSize:15, fontWeight:700, color:"var(--gold)"}}>🏆 {result.winner} wins!</div>
      )}

      {/* Two-tier action stack: filled green primary, ghost secondaries.
          Amber Share was dropped for cross-screen consistency — Share is a
          secondary action everywhere now. */}
      <div className="results-actions" style={{marginTop:18}}>
        {!isDaily && <button className="btn-3d" onClick={onRetry}>Play Again</button>}
        {isDaily && footleOpen && <button className="btn-3d" onClick={onPlayFootle}>{footleCta}</button>}
        {isDaily && !footleOpen && (
          <div style={{textAlign:"center", padding:"12px 0 2px", fontSize:14, fontWeight:700, color:"var(--t2)"}}>
            Both dailies done — come back tomorrow 🌙
          </div>
        )}
        <button className="btn-3d ghost" onClick={onShare}>Share Score</button>
        {stumpQ && <button className="btn-3d ghost" onClick={onStump}>🥜 Stump a mate</button>}
        <button className="btn-3d ghost" onClick={onHome}>Back to Home</button>
      </div>

      {/* Wrong answers review — below the buttons */}
      <WrongAnswersReview wrongAnswers={wrongAnswers} />
      </div>{/* /.rd-mobile */}

      {/* ── desktop-web-refresh (Results #03): centered card. display:none <1024;
          revealed at desktop where .rd-mobile is hidden. Standalone PWA resets
          both so installed desktop shells keep the mobile results. ── */}
      <div className="rd-desktop">
        <div className="rd-card">
          <div className="rd-eyebrow">Round complete</div>
          <div className="rd-sub">{rdSubtitle}</div>
          <div className="rd-badge">
            <div className="rd-badge-score">{result.score}<span className="rd-badge-total">/{result.total}</span></div>
            <div className="rd-badge-tier">{rdTier}</div>
          </div>
          <div className="rd-dots" aria-hidden="true">
            {rdDots.map((ok, i) => (
              <span key={i} className={`rd-dot ${ok ? "ok" : "no"}`}>{ok ? "✓" : "✗"}</span>
            ))}
          </div>
          <div className="rd-tiles">
            <div className="rd-tile"><div className="rd-tile-v">{pct}%</div><div className="rd-tile-k">Accuracy</div></div>
            <div className="rd-tile"><div className="rd-tile-v rd-amber">+{xpEarned}</div><div className="rd-tile-k">XP earned</div></div>
            <div className="rd-tile"><div className="rd-tile-v rd-green">{rdBestStreak}</div><div className="rd-tile-k">Best streak</div></div>
          </div>
          <div className="rd-actions">
            {!isDaily && <button className="rd-btn rd-btn-primary" onClick={onRetry}>Play again</button>}
            {isDaily && footleOpen && <button className="rd-btn rd-btn-primary" onClick={onPlayFootle}>{footleCta}</button>}
            {isDaily && !footleOpen && (
              <span style={{alignSelf:"center", fontSize:13.5, fontWeight:700, color:"var(--t2)"}}>Come back tomorrow 🌙</span>
            )}
            <button className="rd-btn rd-btn-ghost" onClick={onHome}>Home</button>
            <button className="rd-btn rd-btn-ghost" onClick={onShare}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"></path><path d="M12 15V4M8 8l4-4 4 4"></path></svg>
              Share
            </button>
            {stumpQ && <button className="rd-btn rd-btn-ghost" onClick={onStump}>🥜 Stump a mate</button>}
          </div>
        </div>
        {/* Same review loop as mobile — constrained to the rd-card column. */}
        <div style={{maxWidth:560, margin:"0 auto"}}>
          <WrongAnswersReview wrongAnswers={wrongAnswers} />
        </div>
      </div>
    </div>
  );
}

// Last-7-days mini-strip used inside DailyReviewScreen. Always renders
// the rolling 7-day window ending on today (universal "your recent
// rhythm" framing — decoupled from the day being reviewed). Reuses the
// MonthlyCalendar's color language: green = done, soft red = missed,
// neutral = before user's first daily, accent ring = today.
function Mini7Strip({ history, today }) {
  const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const firstDailyTime = (() => {
    const keys = history ? Object.keys(history) : [];
    if (!keys.length) return null;
    let earliest = Infinity;
    for (const k of keys) {
      const [Y, M, D] = k.split("-").map(Number);
      if (!Y || !M || !D) continue;
      const t = new Date(Y, M - 1, D).getTime();
      if (t < earliest) earliest = t;
    }
    return earliest === Infinity ? null : earliest;
  })();
  const cells = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(todayMid - i * TIMINGS.DAY_MS);
    const ymd = dateToYMD(d);
    const score = history?.[ymd];
    const isCompleted = typeof score === "number";
    const isToday = d.getTime() === todayMid;
    const isPreJoin = !isCompleted && firstDailyTime !== null && d.getTime() < firstDailyTime && !isToday;
    cells.push({ d, isCompleted, isToday, isPreJoin });
  }
  return (
    <div className="m7-strip" aria-label="Last 7 days">
      {cells.map((c, i) => {
        let cls = "m7-cell";
        if (c.isCompleted) cls += " m7-done";
        else if (c.isPreJoin) cls += " m7-pre";
        else cls += " m7-miss";
        if (c.isToday) cls += " m7-today";
        return (
          <div key={i} className="m7-col">
            <div className={cls} />
            <div className="m7-label">{c.d.toLocaleDateString(undefined, { weekday: "short" })}</div>
          </div>
        );
      })}
    </div>
  );
}

// Phase 5x — single question card on the Daily review screen. Renders
// the question, options (or typed UI), highlighting the user's pick
// (red if wrong) and the correct answer (green).
function ReviewQuestionCard({ a, index }) {
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

// Calm review of a completed Daily 7. Used by:
// - Today's 7 done card on Home and Daily tab
// - Calendar past-completed-day tap on Daily tab
// Deliberately not the full Results screen: no celebration banner, no
// Play Again, no Share. Phase 5x renders the FULL ordered review when
// allAnswers is present; falls back to the wrongAnswers-only block for
// Phase 5u-5w days, or to score-card-only for pre-Phase-5u days.
function DailyReviewScreen({ date, score, wrongAnswers, allAnswers, dailyHistory, loginStreak, onBack }) {
  const todayYMD = dateToYMD(new Date());
  const dateYMD = dateToYMD(date);
  const isToday = dateYMD === todayYMD;
  const dayLabel = date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const dateLabel = isToday ? `Today · ${dayLabel}` : dayLabel;
  const hasAll = Array.isArray(allAnswers) && allAnswers.length > 0;
  const hasWrong = Array.isArray(wrongAnswers) && wrongAnswers.length > 0;
  const today = useMemo(() => new Date(), []);

  const streakLine = (() => {
    if (!loginStreak || loginStreak < 1) return null;
    if (loginStreak === 1) return "🔥 Day 1 of a new streak";
    return `🔥 Day ${loginStreak} of your daily streak`;
  })();

  return (
    <div className="screen">
      <div className="page-hdr">
        <button className="back-btn" onClick={onBack} aria-label="Back">←</button>
        <div className="page-title">Daily review</div>
      </div>
      <div className="settings-card" style={{padding:"22px 20px", textAlign:"center", marginBottom:18}}>
        <div style={{fontSize:13, fontWeight:600, color:"var(--t2)", marginBottom:14}}>
          {dateLabel}
        </div>
        <div style={{fontSize:22, fontWeight:700, color:"var(--t1)", letterSpacing:"-0.4px", marginBottom:6}}>
          You scored <span style={{color:"var(--accent)", fontWeight:800}}>{score}/7</span>
        </div>
        <div style={{fontSize:13, color:"var(--t3)"}}>
          Next challenge in <DailyHeroCountdown />
        </div>
        {streakLine && (
          <div style={{fontSize:13, color:"var(--t2)", marginTop:12, fontWeight:600}}>
            {streakLine}
          </div>
        )}
      </div>
      {/* Return-loop (1.4.0): web players finishing the Daily 7 are a prime
          value moment to convert to an installed shell — install is web's only
          path to the daily reminder. Renders nothing on native/installed. */}
      <InstallBanner />
      <Mini7Strip history={dailyHistory} today={today} />
      {hasAll ? (
        <>
          <div className="ds-eyebrow settings-section-title" style={{display:"flex", alignItems:"center", justifyContent:"space-between", gap:12}}>
            <span>Full review</span>
            <span style={{color:"var(--t3)", fontSize:11, fontWeight:600, letterSpacing:0.4, textTransform:"none"}}>{score}/7 correct</span>
          </div>
          <div className="dr-list">
            {allAnswers.map((a, i) => <ReviewQuestionCard key={i} a={a} index={i} />)}
          </div>
        </>
      ) : hasWrong ? (
        <>
          {/* Legacy Phase 5u–5w fallback: missed-answers-only block. */}
          <div className="ds-eyebrow settings-section-title">
            Missed {wrongAnswers.length === 1 ? "answer" : "answers"}
          </div>
          <div className="wrong-review">
            {wrongAnswers.map((w, i) => (
              <div key={i} className="wr-item">
                <div className="wr-q">{w.q}</div>
                {w.user && (
                  <div className="wr-user">
                    <span className="wr-x">✗</span>{w.user}
                  </div>
                )}
                <div className="wr-a"><span className="wr-tick">✓</span>{w.correct}</div>
                {w.hint && <div className="wr-why">{w.hint}</div>}
              </div>
            ))}
          </div>
        </>
      ) : (
        <div style={{
          fontSize:13,
          color:"var(--t3)",
          fontStyle:"italic",
          textAlign:"center",
          padding:"4px 16px",
          lineHeight:1.5,
        }}>
          Full review wasn't recorded for this day.
        </div>
      )}
    </div>
  );
}

// Phase 5z — calm review of a completed Today's Puzzle (won or lost).
// Mirrors DailyReviewScreen philosophy: no celebration, no Play Again,
// just the calm "here's what you did" surface. Reuses the active
// puzzle's grid CSS (.wd-grid, .wd-row, .wd-tile, .wd-grid--ended) and
// share path (shareCard + the canonical FootballWordle shareText
// template). Wordle streak isn't tracked separately yet — no streak
// line until that's its own state.
function PuzzleReviewScreen({ date, guesses, status, onBack }) {
  // J1/J2 fix: was using `WORDLE_PLAYERS[dayIndex % length]` here, which
  // disagrees with the stride formula used by the active game and the home
  // FootleHero. Result: Review re-graded the user's guesses against the
  // wrong answer — wrong colors AND, when the wrong answer was longer than
  // the user's guesses, an extra empty rightmost column from a too-wide
  // grades array. Now shares getWordleAnswerForDayIndex with the active game.
  const answer = useMemo(() => {
    const dayIndex = Math.floor(date.getTime() / TIMINGS.DAY_MS);
    return getWordleAnswerForDayIndex(dayIndex);
  }, [date]);

  const won = status === "won";
  const lost = status === "lost";
  const hasData = Array.isArray(guesses) && guesses.length > 0;
  const cols = answer.length;

  const resultLine = won
    ? `Solved in ${guesses.length} ${guesses.length === 1 ? "guess" : "guesses"}`
    : lost ? "Better luck tomorrow"
    : "";

  // Performance tier on won state. Skip on lost (the "Better luck
  // tomorrow" already covers tone). Calmly informative — no emoji.
  const tierLine = !won ? null
    : guesses.length === 1 ? "Incredible"
    : guesses.length === 2 ? "Excellent"
    : guesses.length === 3 ? "Great"
    : guesses.length === 4 ? "Good"
    : guesses.length === 5 ? "Phew"
    : guesses.length === 6 ? "Just made it"
    : null;

  const dateLabel = useMemo(
    () => date.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" }),
    [date]
  );

  // Match the active puzzle's share text exactly so users sharing from
  // FootballWordle's "Share result" button vs this review screen get
  // identical output. One source of truth.
  const shareText = useMemo(() => {
    if (!hasData || (!won && !lost)) return "";
    const grid = guesses.map(g => {
      const grades = gradeWordleGuess(g, answer);
      return grades.map(c => c === "green" ? "🟩" : c === "yellow" ? "🟨" : "⬛").join("");
    }).join("\n");
    const num = getFootleNumber(date);
    const tag = num > 0 ? ` #${num}` : "";
    const streak = won ? computeFootleStreak(date) : 0;
    // Wordle-convention first line ("Footle #64 3/6") — the number + compact
    // score is what makes grids comparable between strangers in a feed. The
    // grid right below disambiguates "3/6" (the Sprint #99 concern), so the
    // explicit "guesses" wording lives only on the PNG card headline.
    const head = `⚽ ${APP_NAME} Footle${tag} ${won ? guesses.length : "X"}/6`;
    const streakLine = won && streak > 0 ? `\n🔥 ${streak}-day streak` : "";
    return `${head}${streakLine}\n\n${grid}\n\nballiq.app/footle`;
  }, [guesses, answer, won, lost, hasData, date]);

  const onShare = useCallback(async () => {
    if (!shareText) return;
    const grades = guesses.map(g => gradeWordleGuess(g, answer));
    await shareCard("wordle", {
      score: guesses.length, total: 6, grades, dateLabel, failed: lost, num: getFootleNumber(date),
    }, { onToast: () => {}, textFallback: shareText });
  }, [shareText, guesses, answer, dateLabel, lost, date]);

  // Read-only grid. Phase 5z polish: drop empty rows on won state —
  // show only the rows the user actually used. Lost state keeps all 6
  // rows since the user used them all (guesses.length === 6 by game
  // logic). No flip animation, no shake, no input.
  const totalRows = lost ? 6 : (hasData ? guesses.length : 0);
  const rows = [];
  for (let r = 0; r < totalRows; r++) {
    if (hasData && r < guesses.length) {
      const g = guesses[r];
      const grades = gradeWordleGuess(g, answer);
      rows.push(
        <div className="wd-row" key={r}>
          {Array.from({ length: cols }, (_, i) => (
            <div key={i} className={`wd-tile wd-${grades[i]}`}>{g[i]}</div>
          ))}
        </div>
      );
    } else {
      rows.push(
        <div className="wd-row" key={r}>
          {Array.from({ length: cols }, (_, i) => <div key={i} className="wd-tile" />)}
        </div>
      );
    }
  }

  return (
    <div className="screen">
      {/* Phase 5z polish: dropped the top back-btn chevron. Result
          screens get the bottom "Back to Home" pattern instead.
          Title stays in the page-hdr; left-aligns by default flex. */}
      <div className="page-hdr">
        <div className="page-title">Footle</div>
      </div>

      {hasData ? (
        <>
          <div style={{textAlign:"center", fontSize:15, fontWeight:700, color:"var(--t1)", letterSpacing:"-0.2px", marginBottom: tierLine ? 0 : 18}}>
            {resultLine}
          </div>
          {tierLine && (
            <div style={{textAlign:"center", fontSize:13, fontWeight:600, color:"var(--t2)", marginTop:8, marginBottom:18}}>
              {tierLine}
            </div>
          )}

          <div className="wd-grid wd-grid--ended" style={{ "--wd-cols": cols }}>
            {rows}
          </div>

          {lost && (
            <div style={{textAlign:"center", marginTop:14, fontSize:14, color:"var(--t2)"}}>
              Today's word: <strong style={{color:"var(--accent)", fontWeight:800, letterSpacing:"0.5px"}}>{answer}</strong>
            </div>
          )}

          {(won || lost) && (
            <div style={{display:"flex", flexDirection:"column", alignItems:"center", gap:10, marginTop:20}}>
              {/* width:min(310px, calc(100vw - 80px)) matches the
                  .wd-grid--ended .wd-row max-width — buttons edge-align
                  with the grid above on every viewport. padding:14px 22px
                  bumps height inline (base .wd-share keeps 10px 22px so
                  the active puzzle's share button stays unaffected).
                  marginTop:0 overrides .wd-share's baked-in margin:4px
                  auto 0 so Share and Back share an identical 10px gap
                  from the flex parent. */}
              <button onClick={onShare} className="wd-share" style={{width:"min(310px, calc(100vw - 80px))", padding:"14px 22px", marginTop:0}}>Share result</button>
              {/* Web-only, same rationale as the active-game screen: native's
                  share sheet already offers WhatsApp with the PNG card. */}
              {!IS_NATIVE && shareText && (
                <a className="wd-share wd-share--wa" href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer" style={{width:"min(310px, calc(100vw - 80px))", padding:"14px 22px", marginTop:0}}>Share on WhatsApp</a>
              )}
              {/* Same App Store nudge as the live puzzle's result (archive
                  visitors from the indexed /footle archive are pure web). */}
              <FootleGetAppCTA style={{width:"min(310px, calc(100vw - 80px))", padding:"14px 22px", marginTop:0}} />
              <button onClick={onBack} className="wd-back" style={{width:"min(310px, calc(100vw - 80px))", padding:"14px 22px"}}>Back to Home</button>
            </div>
          )}

          <div style={{textAlign:"center", marginTop:14, fontSize:13, color:"var(--t3)"}}>
            Next puzzle in <DailyHeroCountdown />
          </div>
        </>
      ) : (
        <>
          <div style={{textAlign:"center", padding:"40px 20px", fontSize:14, color:"var(--t3)", fontStyle:"italic"}}>
            Puzzle wasn't recorded for this day.
          </div>
          <div style={{display:"flex", flexDirection:"column", alignItems:"center", gap:10, marginTop:8}}>
            <button onClick={onBack} className="wd-back" style={{width:"min(310px, calc(100vw - 80px))", padding:"14px 22px"}}>Back to Home</button>
          </div>
        </>
      )}
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


// ─── HOT STREAK RESULTS ───────────────────────────────────────────────────────
function HotStreakResults({ result, onRetry, onHome, onShare, prevBest }) {
  const score = result.score;
  const answered = result.total;
  const isNewBest = prevBest === 0 || score > prevBest;
  const isFirstRun = prevBest === 0 && score > 0;
  const pct = answered > 0 ? Math.round((score / answered) * 100) : 0;
  const emoji = score >= 25 ? "🐐" : score >= 15 ? "🔥" : score >= 8 ? "⚡" : "⏱️";
  const title = score >= 25 ? "Unstoppable!" : score >= 15 ? "On Fire!" : score >= 8 ? "Sharp!" : "Keep Practising!";
  const xpEarned = score * 8;
  useEffect(() => { if (isNewBest && !isFirstRun && score >= 5) haptic("levelup"); }, [isNewBest, isFirstRun, score]);
  return (
    <div className="screen" style={{paddingTop:8, position:"relative"}}>
      {score >= 15 && <Confetti />}
      <ResultsCloseBtn onClose={onHome} />
      <div style={{textAlign:"center",padding:"8px 0 4px"}}>
        <span style={{fontSize:10,fontFamily:"'Inter',sans-serif",color:"var(--accent)",letterSpacing:2}}>⚡🔥 Hot Streak</span>
      </div>
      <div className="rc">
        <div className="rc-icon">{emoji}</div>
        <div className="rc-title">{title}</div>
        <div className="score-big" style={{color:"var(--accent)"}}><CountUp value={score} duration={900} delay={250} triggerHaptic /><span style={{fontSize:22,color:"var(--t2)",fontWeight:500}}> correct</span></div>
        <div className="score-pct">in 60 seconds · {answered} answered</div>
      </div>

      {/* 🏆 Personal best callout */}
      {isNewBest && !isFirstRun && prevBest > 0 && <div className="new-best">🏆 New Hot Streak best — was {prevBest}!</div>}
      {isFirstRun && <div className="new-best">⚡ First Hot Streak run: {score} correct</div>}
      {prevBest > 0 && !isNewBest && <div style={{textAlign:"center",fontSize:12,color:"var(--t2)",margin:"4px 0 10px"}}>Personal best: {prevBest}</div>}

      <div className="s-row">
        <div className="sbox"><div className="sbox-v" style={{color:"var(--accent)"}}><CountUp value={score} duration={700} delay={550} /></div><div className="sbox-k">Correct</div></div>
        <div className="sbox"><div className="sbox-v" style={{color:"var(--t2)"}}><CountUp value={answered} duration={700} delay={650} /></div><div className="sbox-k">Answered</div></div>
        <div className="sbox"><div className="sbox-v" style={{color:"var(--gold)"}}><CountUp value={pct} duration={700} delay={750} suffix="%" /></div><div className="sbox-k">Accuracy</div></div>
      </div>
      <div className="results-actions" style={{marginTop:14}}>
        <button className="btn-3d" onClick={onRetry}>⚡ Run It Back</button>
        <button className="btn-3d ghost" onClick={onShare}>Share Score</button>
        <button className="btn-3d ghost" onClick={onHome}>Back to Home</button>
      </div>
      {xpEarned > 0 && (
        <div style={{textAlign:"center", marginTop:10, fontSize:12, color:"var(--t3)", fontWeight:500}}>
          +{xpEarned} XP earned ⚡
        </div>
      )}
    </div>
  );
}

// ─── TRUE OR FALSE RESULTS ────────────────────────────────────────────────────
function TrueFalseResults({ result, onRetry, onHome, onShare }) {
  const { score, total } = result;
  const pct = Math.round((score / total) * 100);
  const isPerfect = score === total;
  useEffect(() => { if (isPerfect) haptic("levelup"); }, [isPerfect]);
  const emoji = pct === 100 ? "🧠" : pct >= 80 ? "✅" : pct >= 60 ? "⚽" : pct >= 40 ? "🤔" : "❌";
  const title = pct === 100 ? "Perfect — You Know Your Football!" : pct >= 80 ? "Sharp!" : pct >= 60 ? "Solid!" : pct >= 40 ? "Room to Improve" : "Back to School!";
  const xpEarned = score * 8;
  return (
    <div className="screen" style={{paddingTop:8, position:"relative"}}>
      {pct >= 80 && <Confetti />}
      <ResultsCloseBtn onClose={onHome} />
      <div style={{textAlign:"center",padding:"8px 0 4px"}}>
        <span style={{fontSize:10,fontFamily:"'Inter',sans-serif",color:"var(--accent)",letterSpacing:2}}>✅ True or False</span>
      </div>
      <div className="rc">
        <div className="rc-icon">{emoji}</div>
        <div className="rc-title">{title}</div>
        <div className="score-big"><CountUp value={score} duration={900} delay={250} triggerHaptic /><span style={{fontSize:30,color:"var(--t2)"}}>/{total}</span></div>
      </div>

      {isPerfect && total >= 10 && <div className="new-best">🎯 Perfect round — no lies slipped past!</div>}

      <div className="s-row">
        <div className="sbox"><div className="sbox-v" style={{color:"var(--green)"}}><CountUp value={score} duration={700} delay={550} /></div><div className="sbox-k">Correct</div></div>
        <div className="sbox"><div className="sbox-v" style={{color:"var(--red)"}}><CountUp value={total - score} duration={700} delay={650} /></div><div className="sbox-k">Wrong</div></div>
        <div className="sbox"><div className="sbox-v" style={{color:"var(--gold)"}}><CountUp value={pct} duration={700} delay={750} suffix="%" /></div><div className="sbox-k">Accuracy</div></div>
      </div>
      <div className="results-actions" style={{marginTop:14}}>
        <button className="btn-3d" onClick={onRetry}>▶ Another Round</button>
        <button className="btn-3d ghost" onClick={onShare}>Share Score</button>
        <button className="btn-3d ghost" onClick={onHome}>Back to Home</button>
      </div>
      {xpEarned > 0 && (
        <div style={{textAlign:"center", marginTop:10, fontSize:12, color:"var(--t3)", fontWeight:500}}>
          +{xpEarned} XP earned ⚡
        </div>
      )}
    </div>
  );
}


// ─── CLUB QUIZ SCREEN ────────────────────────────────────────────────────────
function ClubQuizScreen({ onStart, onBack }) {
  const [showProModal, setShowProModal] = React.useState(false);
  // Show the real (verified) pool size per club; falls back to the pack count.
  const [verifiedCounts, setVerifiedCounts] = React.useState(null);
  React.useEffect(() => {
    let alive = true;
    loadQuestions().then(({ QB }) => {
      if (!alive) return;
      const c = {};
      for (const [k, name] of Object.entries(CLUB_PACK_TO_QB)) c[k] = QB.filter(q => q && q.club === name && q.type === "mcq" && Array.isArray(q.o)).length;
      setVerifiedCounts(c);
    }).catch(() => {});
    return () => { alive = false; };
  }, []);
  // Sprint #68 JJ4: ESC + focus-trap on the upsell modal.
  const proModalRef = useRef(null);
  useModalA11y({ isOpen: showProModal, onClose: () => setShowProModal(false), ref: proModalRef });
  return (
    <div className="screen">
      <div className="page-hdr">
        <button className="back-btn" onClick={onBack} aria-label="Go back">←</button>
        <div className="page-title">Club Quizzes</div>
      </div>
      <p style={{fontSize:13,color:"var(--t2)",lineHeight:1.7,marginBottom:20}}>
        Test your deep knowledge of a specific club — history, players, trophies and iconic moments.
      </p>
      {CLUB_LEAGUE_SECTIONS.map((section) => {
        const clubs = Object.entries(CLUB_PACKS).filter(([key]) => (CLUB_LEAGUES[key] || "other") === section.key);
        if (!clubs.length) return null;
        return (
          <div key={section.key} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--t2)", margin: "0 0 8px 2px" }}>{section.label}</div>
            <div className="mode-list">
              {clubs.map(([key, pack]) => {
                const count = Math.max((verifiedCounts && verifiedCounts[key]) || 0, pack?.questions?.length || 0);
                const lightClub = clubReadableText(pack.color) === "#0a0a0a";
                const a1 = lightClub ? 0.20 : 0.32, a2 = lightClub ? 0.05 : 0.06;
                return (
                  <button key={key} type="button" className="mode-item" onClick={() => { haptic("select"); onStart(key); }}
                    style={{ background: `linear-gradient(90deg, ${clubHexToRgba(pack.color, a1)} 0%, ${clubHexToRgba(pack.color, a2)} 100%)`, borderColor: clubHexToRgba(pack.color, lightClub ? 0.5 : 0.4) }}>
                    <div className="mi-icon" style={{ background: pack.color, borderRadius: 11, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, flexShrink: 0, boxShadow: `0 2px 8px ${clubHexToRgba(pack.color, 0.45)}` }}>
                      <span style={{ fontWeight: 900, fontSize: 13, letterSpacing: 0.3, color: clubReadableText(pack.color) }}>{CLUB_ABBR[key] || clubInitials(pack.name)}</span>
                    </div>
                    <div className="mi-body">
                      <div className="mi-name">{pack.name}</div>
                      <div className="mi-desc">{count} questions</div>
                    </div>
                    <div className="mi-arrow">→</div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      <div style={{marginTop:16,background:"linear-gradient(135deg,rgba(251,191,36,0.08),rgba(251,191,36,0.03))",border:"1px solid rgba(251,191,36,0.2)",borderRadius:16,padding:"18px 20px",textAlign:"center"}}>
        <div style={{fontSize:22,marginBottom:6}}>🏆</div>
        <div style={{fontSize:15,fontWeight:800,color:"var(--t1)",marginBottom:4}}>More clubs coming soon</div>
        <div style={{fontSize:13,color:"var(--t2)",lineHeight:1.6}}>Galatasaray, Benfica, Napoli, Fenerbahçe and more are on the way.</div>
      </div>
      {showProModal && (
        <div style={{position:"fixed",top:0,right:0,bottom:0,left:0,inset:0,background:"rgba(0,0,0,0.75)",zIndex:999,display:"flex",alignItems:"flex-end"}} onClick={() => setShowProModal(false)}>
          <div ref={proModalRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="More club quizzes coming soon" style={{width:"100%",maxHeight:"85vh",overflowY:"auto",WebkitOverflowScrolling:"touch",background:"var(--bg)",borderRadius:"20px 20px 0 0",padding:"28px 24px calc(48px + env(safe-area-inset-bottom, 34px))"}} onClick={e => e.stopPropagation()}>
            <div style={{fontSize:36,textAlign:"center",marginBottom:12}}>🏟️</div>
            <div style={{fontSize:22,fontWeight:900,textAlign:"center",marginBottom:8}}>More Coming Soon</div>
            <div style={{fontSize:14,color:"var(--t2)",textAlign:"center",lineHeight:1.7,marginBottom:24}}>Additional club packs are on the way. Keep playing to stay ready!</div>
            <button className="btn btn-p" onClick={() => setShowProModal(false)}>Got it!</button>
          </div>
        </div>
      )}
    </div>
  );
}


// League-quiz picker — mirrors ClubQuizScreen's colour-coded rows, grouped
// Leagues / Tournaments. Counts show the live QB pool per competition.
function LeagueQuizScreen({ onStart, onBack }) {
  const [counts, setCounts] = React.useState(null);
  React.useEffect(() => {
    let alive = true;
    loadQuestions().then(({ QB }) => {
      if (!alive) return;
      const c = {};
      for (const s of LEAGUE_QUIZ_SECTIONS) for (const it of s.items) c[it.cat] = QB.filter(q => q && q.cat === it.cat && q.type === "mcq" && Array.isArray(q.o)).length;
      setCounts(c);
    }).catch(() => {});
    return () => { alive = false; };
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
              const lightRow = clubReadableText(it.color) === "#0a0a0a";
              const a1 = lightRow ? 0.20 : 0.32, a2 = lightRow ? 0.05 : 0.06;
              return (
                <button key={it.cat} type="button" className="mode-item" onClick={() => { haptic("select"); onStart(it.cat); }}
                  style={{ background: `linear-gradient(90deg, ${clubHexToRgba(it.color, a1)} 0%, ${clubHexToRgba(it.color, a2)} 100%)`, borderColor: clubHexToRgba(it.color, lightRow ? 0.5 : 0.4) }}>
                  <div className="mi-icon" style={{ background: it.color, borderRadius: 11, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, flexShrink: 0, boxShadow: `0 2px 8px ${clubHexToRgba(it.color, 0.45)}` }}>
                    <span style={{ fontWeight: 900, fontSize: 13, letterSpacing: 0.3, color: clubReadableText(it.color) }}>{it.abbr}</span>
                  </div>
                  <div className="mi-body">
                    <div className="mi-name">{it.name}</div>
                    <div className="mi-desc">{counts ? `${counts[it.cat]} questions` : "Loading…"}</div>
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

// ─── ONLINE TAB (hub) ─────────────────────────────────────────────────────────
// Head-to-head direction from the Claude Design handoff (Online Tab.dc.html):
// VS hero (you vs latest rival), W/L/win-rate stat row, flat green Create
// Room CTA (no 3D rim per spec), Join with Code, recent-opponents rail with
// Rematch. All game entry goes through startMode so auth-gating stays in one
// place; Create/Rematch use the one-tap auto-create path into a lobby.
function OnlineHubTab({ startMode, setOnlineAutoCreate, onJoinCode, displayName, avatarUrl, avatarEmoji, onChallenge }) {
  // Inline join-with-code — the code row lives ON the tab (no intermediate
  // entry screen). onJoinCode handles auth-gating, the RPC and navigation.
  const [joinCode, setJoinCode] = React.useState("");
  const [joining, setJoining] = React.useState(false);
  const [joinError, setJoinError] = React.useState("");
  const [joinFocus, setJoinFocus] = React.useState(false);
  const submitJoin = async () => {
    if (joining) return;
    setJoining(true); setJoinError("");
    try {
      const res = await onJoinCode?.(joinCode);
      if (res && !res.ok && res.error) setJoinError(res.error);
    } finally { setJoining(false); }
  };
  // Re-read on mount: the pane unmounts during gameplay (screen !== "home"),
  // so returning from a finished game always re-mounts with fresh history.
  const [history] = React.useState(() => readMpHistory());
  const stats = React.useMemo(() => {
    const games = history.length;
    const wins = history.filter(h => h.won).length;
    let streak = 0;
    for (const h of history) { if (h.won) streak++; else break; }
    const recent = [];
    const seen = new Set();
    for (const h of history) {
      for (const o of (h.opponents || [])) {
        if (!o || seen.has(o.id || o.name)) continue;
        seen.add(o.id || o.name);
        recent.push({ id: o.id, name: o.name, avatar: o.avatar || "⚽", won: (h.myScore ?? 0) >= (o.score ?? 0), line: `${h.myScore ?? 0}–${o.score ?? 0}` });
        if (recent.length >= 3) break;
      }
      if (recent.length >= 3) break;
    }
    return { games, wins, losses: games - wins, winRate: games ? Math.round(100 * wins / games) : null, streak, recent, rival: recent[0] || null };
  }, [history]);
  const createRoom = () => { setOnlineAutoCreate?.(true); startMode("online"); };
  return (
    <div className="screen tab-content online-hub">
      {/* Title + win-streak pill (no local gear — the global header has one) */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 0 16px"}}>
        <div style={{fontSize:28,fontWeight:800,letterSpacing:"-0.02em",color:"var(--t1)"}}>Online</div>
        {stats.streak >= 2 && (
          <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"6px 13px",borderRadius:999,background:"rgba(255,193,7,0.08)",border:"1px solid rgba(255,193,7,0.3)"}}>
            <span style={{fontSize:12}}>🔥</span>
            <span style={{fontSize:13,fontWeight:800,color:"#FFC107",fontVariantNumeric:"tabular-nums"}}>{stats.streak} win streak</span>
          </div>
        )}
      </div>

      {/* desktop-web-refresh (Friends #06 lean): two-column reflow at >=1024.
          The wrappers are display:contents on mobile (no box → byte-identical
          single-column flow) and a grid at desktop: your record (left) + the
          private-match actions (right). Leaderboard deferred to a bigger user
          base, so the left column holds the app's real head-to-head record. */}
      <div className="online-cols">
      <div className="online-col-a">
      {/* VS hero card */}
      <div style={{borderRadius:22,background:"var(--s1)",border:"1px solid var(--border)",padding:"22px 18px",boxShadow:"0 4px 16px rgba(0,0,0,0.35)",marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:22}}>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,width:110}}>
            {avatarUrl
              ? <img src={avatarUrl} crossOrigin="anonymous" alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} style={{width:84,height:84,borderRadius:"50%",objectFit:"cover",border:"2.5px solid var(--accent)",boxShadow:"0 0 0 5px rgba(88,204,2,0.14)"}} />
              : <span style={{width:84,height:84,borderRadius:"50%",border:"2.5px solid var(--accent)",boxShadow:"0 0 0 5px rgba(88,204,2,0.14)",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:40,background:"var(--s2)"}}>{avatarEmoji}</span>}
            <span style={{fontSize:14,fontWeight:800,color:"var(--t1)",maxWidth:110,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{displayName}</span>
          </div>
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:19,fontWeight:800,color:"var(--t3)"}}>VS</span>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,width:110}}>
            {stats.rival
              ? <span style={{width:84,height:84,borderRadius:"50%",border:`2.5px solid ${stats.rival.won ? "var(--accent)" : "#FF6B6B"}`,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:40,background:"var(--s2)"}}>{stats.rival.avatar}</span>
              : <span style={{width:84,height:84,borderRadius:"50%",border:"2.5px dashed #3A3D4A",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:30,color:"var(--t3)"}}>?</span>}
            <span style={{fontSize:13,fontWeight:stats.rival ? 700 : 600,color:stats.rival ? "var(--t1)" : "var(--t3)",maxWidth:110,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{stats.rival ? stats.rival.name : "Your rival here"}</span>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"stretch",marginTop:20,borderTop:"1px solid var(--border)",paddingTop:14}}>
          {[
            { v: stats.wins, label: "Wins", color: "#8AE042" },
            { v: stats.losses, label: "Losses", color: "var(--t1)" },
            { v: stats.winRate == null ? "—" : `${stats.winRate}%`, label: "Win rate", color: "#FFC107" },
          ].map((s, i) => (
            <React.Fragment key={s.label}>
              {i > 0 && <div style={{width:1,background:"var(--border)"}} />}
              <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                {/* Inter for stat numbers (mono is codes-only — its dotted zero reads like an 8 in stats) */}
                <span style={{fontSize:24,fontWeight:800,color:s.color,fontVariantNumeric:"tabular-nums"}}>{s.v}</span>
                <span style={{fontSize:11,fontWeight:600,color:"var(--t2)"}}>{s.label}</span>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      </div>{/* /.online-col-a */}
      <div className="online-col-b">
      {/* Flat green CTA (no 3D rim per design spec) + secondary join */}
      <button onClick={createRoom} style={{width:"100%",border:"none",borderRadius:16,background:"var(--accent)",boxShadow:"0 8px 24px rgba(88,204,2,0.25)",padding:17,display:"flex",alignItems:"center",justifyContent:"center",gap:9,cursor:"pointer",fontFamily:"inherit"}}>
        <span style={{fontSize:16}}>🎮</span><span style={{fontSize:17,fontWeight:800,color:"#06230C"}}>Create Room</span>
      </button>
      {/* Inline join row (design 7a/7b): code field + Join in ONE row. Join
          sits dimmed until there's input, lights green once typing starts. */}
      <div style={{display:"flex",gap:9,marginTop:10}}>
        <div style={{flex:1,minWidth:0,borderRadius:16,background:"var(--s1)",padding:"0 15px",display:"flex",alignItems:"center",gap:10,
          border:joinFocus ? "1.5px solid rgba(88,204,2,0.55)" : "1px solid var(--border)",
          boxShadow:joinFocus ? "0 0 0 4px rgba(88,204,2,0.12)" : undefined}}>
          <span style={{fontSize:14,flexShrink:0}}>🔑</span>
          <input
            type="text"
            value={joinCode}
            onChange={(e) => { setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6)); if (joinError) setJoinError(""); }}
            onKeyDown={(e) => { if (e.key === "Enter" && joinCode.length > 0) submitJoin(); }}
            onFocus={() => setJoinFocus(true)}
            onBlur={() => setJoinFocus(false)}
            placeholder="Got a code? Type it here"
            autoCapitalize="characters"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            maxLength={6}
            disabled={joining}
            enterKeyHint="go"
            aria-label="Room code"
            style={{flex:1,minWidth:0,border:"none",background:"transparent",outline:"none",padding:"15px 0",
              fontSize:joinCode ? 17 : 14.5,fontWeight:joinCode ? 800 : 500,
              letterSpacing:joinCode ? "0.22em" : "normal",
              color:"var(--text)",
              fontFamily:joinCode ? "'JetBrains Mono','SF Mono',ui-monospace,Menlo,monospace" : "inherit"}}
          />
        </div>
        <button onClick={submitJoin} disabled={joining || joinCode.length === 0}
          style={{borderRadius:16,padding:"15px 24px",fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"inherit",flexShrink:0,
            ...(joinCode.length > 0 && !joining
              ? {border:"none",background:"var(--accent)",color:"#06230C",boxShadow:"0 8px 24px rgba(88,204,2,0.25)"}
              : {background:"var(--s1)",border:"1px solid var(--border)",color:"var(--t3)"})}}>
          {joining ? "…" : "Join"}
        </button>
      </div>
      {joinError
        ? <div style={{color:"#FF6B6B",fontSize:12,marginTop:9,paddingLeft:4}}>{joinError}</div>
        : (joinFocus || joinCode) ? <div style={{color:"var(--t3)",fontSize:11.5,marginTop:9,paddingLeft:4}}>Codes are 6 characters — ask your friend for theirs.</div> : null}

      {/* Recent opponents — appears once real games have been recorded */}
      {stats.recent.length > 0 && (
        <>
          <div style={{fontSize:11.5,fontWeight:800,letterSpacing:"0.14em",textTransform:"uppercase",color:"var(--t2)",marginTop:24}}>Recent opponents</div>
          <div style={{display:"flex",gap:9,marginTop:12}}>
            {stats.recent.map((o) => (
              <div key={o.name} style={{flex:1,borderRadius:16,background:"var(--s1)",border:"1px solid var(--border)",padding:"14px 8px",display:"flex",flexDirection:"column",alignItems:"center",gap:7}}>
                <span style={{width:46,height:46,borderRadius:"50%",background:"var(--s2)",border:`2px solid ${o.won ? "var(--accent)" : "#FF6B6B"}`,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:19}}>{o.avatar}</span>
                <span style={{fontSize:13,fontWeight:700,color:"var(--t1)",maxWidth:"100%",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.name}</span>
                <span style={{fontSize:11,fontWeight:800,color:o.won ? "#8AE042" : "#FF6B6B"}}>{o.won ? "Won" : "Lost"} {o.line}</span>
                <button onClick={() => (o.id && onChallenge) ? onChallenge({ id: o.id, username: o.name }) : createRoom()} style={{border:"1.5px solid rgba(88,204,2,0.5)",borderRadius:999,padding:"5px 14px",fontSize:12,fontWeight:800,color:"var(--accent)",background:"rgba(88,204,2,0.06)",cursor:"pointer",fontFamily:"inherit"}}>Rematch</button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Local pass & play — kept reachable (not in the design frame) */}
      <div style={{marginTop:16,display:"flex",alignItems:"center",gap:12,background:"var(--s1)",border:"1px solid var(--border)",borderRadius:16,padding:"13px 14px"}}>
        <span style={{width:44,height:44,borderRadius:12,background:"rgba(88,204,2,0.14)",border:"1px solid rgba(88,204,2,0.3)",display:"inline-flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:"#8AE042"}} aria-hidden="true"><Users size={21} strokeWidth={2} /></span>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:14,fontWeight:800,color:"var(--t1)"}}>Local pass &amp; play</div>
          <div style={{fontSize:12,color:"var(--t2)"}}>Same couch, one phone — up to 6 players.</div>
        </div>
        <button onClick={() => startMode("local")} style={{padding:"9px 16px",borderRadius:10,border:"1px solid var(--accent-b)",background:"transparent",color:"var(--accent)",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>Play</button>
      </div>
      </div>{/* /.online-col-b */}
      </div>{/* /.online-cols */}
    </div>
  );
}

// Password-recovery overlay — mounts app-wide when AuthProvider sees the
// PASSWORD_RECOVERY event (the balliq.app/reset email link). The recovery
// session is already active at that point, so updateUser only needs the new
// password. Renders above everything at z 1200.
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
              style={{width:"100%",padding:"14px 16px",marginBottom:10,borderRadius:12,border:"1px solid var(--border)",background:"var(--s1)",color:"var(--text)",fontSize:15,fontFamily:"inherit",outline:"none"}} />
            <input type="password" value={pw2} onChange={e => setPw2(e.target.value)} placeholder="Repeat new password" autoComplete="new-password"
              onKeyDown={e => { if (e.key === "Enter") submit(); }}
              style={{width:"100%",padding:"14px 16px",marginBottom:14,borderRadius:12,border:"1px solid var(--border)",background:"var(--s1)",color:"var(--text)",fontSize:15,fontFamily:"inherit",outline:"none"}} />
            {err && <div style={{color:"#FF6B6B",fontSize:13,marginBottom:12}}>{err}</div>}
            <button onClick={submit} disabled={busy || !pw || !pw2}
              style={{width:"100%",border:"none",borderRadius:14,background:"var(--accent)",padding:15,fontSize:15,fontWeight:800,color:"#06230C",cursor:"pointer",fontFamily:"inherit",opacity:(busy || !pw || !pw2) ? 0.6 : 1}}>
              {busy ? "Saving…" : "Save new password"}
            </button>
            <button onClick={clearPasswordRecovery} style={{marginTop:10,background:"transparent",border:"none",color:"var(--t3)",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
          </>
        )}
      </div>
    </div>
  );
}

function SettingsToggle({ val, onChange }) {
  return (
    <button className={`toggle ${val ? "on" : "off"}`} onClick={() => onChange(!val)}>
      <div className="toggle-knob" />
    </button>
  );
}

// Sprint #34 BB2: PWA install affordance. Renders nothing when the app is
// already installed, the user has dismissed (within the 30-day TTL window),
// or the platform has no install path (iOS Chrome/Firefox/Edge, etc).
// Android/Chrome shows a single Install button driven by the pre-React
// stashed `beforeinstallprompt` event; iOS Safari shows a Share → Add to
// Home Screen → Add visual sequence since there's no install API on iOS.
// Sprint #64 FF1: install banner shown inside the Footle won-result block
// on solve. Discoverability companion to InstallCard — fresh users who
// never visit Settings still see an install nudge at a moment they've
// just succeeded. Hidden when already installed (incl. "installed ever"
// to catch the EE3 iOS Safari reopen case), when display-mode is
// standalone, and for 30 days after dismiss.
function InstallBanner() {
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

function InstallCard() {
  const { canPromptNative, platform, showCard, promptInstall, dismiss } = useInstallPrompt();
  if (!showCard) return null;
  return (
    <div className="settings-section">
      <div className="ds-eyebrow settings-section-title">Install</div>
      <div className="settings-card install-card">
        <div className="install-card-header">
          <div className="install-card-icon" aria-hidden="true">⚽</div>
          <div className="install-card-body">
            <div className="install-card-title">Install Ball IQ</div>
            <div className="install-card-desc">Full-screen, offline-ready, one tap from your home screen.</div>
          </div>
          <button
            type="button"
            className="install-card-dismiss"
            onClick={dismiss}
            aria-label="Dismiss install prompt"
          >×</button>
        </div>
        <div className="install-card-action">
          {canPromptNative ? (
            <button
              type="button"
              className="install-card-btn"
              onClick={promptInstall}
            >Install</button>
          ) : platform.isIOSSafari ? (
            <div className="install-card-ios" aria-label="iOS install instructions">
              <span className="install-card-step">
                <span className="install-card-step-icon" aria-hidden="true">⤴</span>
                <span className="install-card-step-label">Share</span>
              </span>
              <span className="install-card-pair">
                <span className="install-card-arrow" aria-hidden="true">→</span>
                <span className="install-card-step">
                  <span className="install-card-step-label">Add to Home Screen</span>
                </span>
              </span>
              <span className="install-card-pair">
                <span className="install-card-arrow" aria-hidden="true">→</span>
                <span className="install-card-step">
                  <span className="install-card-step-label">Add</span>
                </span>
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SettingsScreenImpl({ settings, onUpdate, onClearStats, onClearSeen, onBack, onShowPrivacy, onShowHelp, onShowKnownIssues, onAccountDeleted, onOpenReview, onShowBlocked, notifEnabled, onToggleNotif, notifSupported }) {
  const { user, profile, isGuest, signOut, exitGuestMode, openAuthPrompt } = useAuth();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmClearStats, setConfirmClearStats] = useState(false);
  // 1.1: surface the REAL installed build version (native) instead of the
  // hardcoded constant that drifted. Falls back to APP_VERSION on web.
  const [appVer, setAppVer] = useState(APP_VERSION);
  useEffect(() => {
    let alive = true;
    try { CapApp.getInfo?.().then(i => { if (alive && i?.version) setAppVer(i.version); }).catch(() => {}); } catch {}
    return () => { alive = false; };
  }, []);
  const shareApp = async () => {
    const url = APP_STORE_ID ? APP_STORE_URL : "balliq.app";
    const text = `⚽ Ball IQ — the football quiz for real fans. ${url}`;
    try { if (navigator.share) { await navigator.share({ text }); return; } } catch { return; }
    try { await navigator.clipboard.writeText(text); window.dispatchEvent(new CustomEvent('biq:show-toast', { detail: '📋 Link copied' })); } catch {}
  };
  const rateApp = () => {
    if (!APP_STORE_ID) { window.dispatchEvent(new CustomEvent('biq:show-toast', { detail: 'App Store rating opens once we’re live 🙌' })); return; }
    try { window.open(`${APP_STORE_URL}?action=write-review`, '_blank'); } catch {}
  };
  // Sprint #71 MM1: replace native confirm() for Sign Out with an in-app
  // modal matching the existing Reset-stats / Delete-account design. Native
  // Apple-system dialog was off-brand.
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const clearStatsModalRef = useRef(null);
  const deleteModalRef = useRef(null);
  const signOutModalRef = useRef(null);
  useModalA11y({ isOpen: confirmClearStats, onClose: () => setConfirmClearStats(false), ref: clearStatsModalRef });
  useModalA11y({ isOpen: confirmDelete, onClose: () => !deleting && setConfirmDelete(false), ref: deleteModalRef });
  useModalA11y({ isOpen: confirmSignOut, onClose: () => setConfirmSignOut(false), ref: signOutModalRef });
  // Audit Phase 5 (B3): performDelete catch could fire setState on the
  // unmounted component if the RPC throws after signOut → AppGate route.
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  // Permanent account deletion — required by App Store guideline 5.1.1(v)
  // for any app that supports account creation. Calls the server-side RPC
  // (which scopes deletes to auth.uid()), clears every biq_* key from
  // local storage, lets AppInner reset its in-memory state, and finally
  // signs the user out so AppGate routes back to the login screen.
  const performDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      // Set sentinel BEFORE the server-side delete RPC. delete_user_account
      // invalidates the auth.users row server-side; any background refresh
      // that fires between this RPC and the explicit signOut() below would
      // get 401 -> SIGNED_OUT fires -> without the sentinel, would surface
      // a "session expired" banner during account deletion (misleading).
      try { localStorage.setItem('biq_signout_intentional_at', String(Date.now())) } catch {}

      const { error } = await supabase.rpc("delete_user_account");
      if (error) {
        setDeleting(false);
        setConfirmDelete(false);
        if (typeof onAccountDeleted === "function") onAccountDeleted({ error });
        return;
      }
      clearAllUserLocalStorage();
      // biq_onboarded is device-scoped (preserved on signOut so same-device
      // re-sign-in doesn't replay onboarding), but account deletion is the
      // user nuking everything — clear it explicitly so a re-signup on this
      // device gets the onboarding flow again.
      try { localStorage.removeItem('biq_onboarded') } catch {}
      if (typeof onAccountDeleted === "function") onAccountDeleted({ error: null });
      // Audit Phase 5 (B2): surface signOut failures in the console.
      // Server-side delete already succeeded, so the user's data is
      // gone; signOut failure here means the local session lingers
      // until next auto-refresh. Visible debug trail beats silence.
      try { await signOut(); } catch (e) { console.warn('[performDelete signOut]', e?.message || e); }
    } catch (e) {
      if (mountedRef.current) {
        setDeleting(false);
        setConfirmDelete(false);
      }
      if (typeof onAccountDeleted === "function") onAccountDeleted({ error: e });
    }
  };

  return (
    <div className="screen settings-screen" style={{background:"var(--bg)"}}>
      <div className="page-hdr">
        <button className="back-btn" onClick={onBack} aria-label="Go back">←</button>
        <div className="page-title">Settings</div>
      </div>

      <div className="settings-section">
        <div className="ds-eyebrow settings-section-title">Account</div>
        <div className="settings-card">
          {user && profile ? (
            <>
              <div className="settings-row" style={{cursor:"default"}}>
                <div className="sr-left">
                  <div className="sr-label">Signed in as</div>
                  <div className="sr-desc">{profile.username}</div>
                  {/* 1.1: show the account email so users recognise which
                      account they're on. Apple's Hide-My-Email gives a cryptic
                      @privaterelay.appleid.com address — show a friendly label
                      instead of the raw relay. */}
                  {user.email && (
                    <div className="sr-desc" style={{marginTop:2,opacity:0.7}}>
                      {/@privaterelay\.appleid\.com$/i.test(user.email) ? "Apple · Hide My Email" : user.email}
                    </div>
                  )}
                </div>
              </div>
              <button
                type="button"
                className="settings-row danger"
                style={{width:"100%",background:"none",border:"none",textAlign:"left"}}
                onClick={() => setConfirmSignOut(true)}
              >
                <div className="sr-left">
                  <div className="sr-label">Sign out</div>
                </div>
                <div className="sr-right"><div className="sr-arrow">›</div></div>
              </button>
            </>
          ) : user ? (
            <>
              <div className="settings-row" style={{cursor:"default"}}>
                <div className="sr-left">
                  <div className="sr-label">Signed in</div>
                  <div className="sr-desc">{user.email} — profile loading…</div>
                </div>
              </div>
              <button className="settings-row danger" style={{width:"100%",background:"none",border:"none",textAlign:"left"}} onClick={() => setConfirmSignOut(true)}>
                <div className="sr-left">
                  <div className="sr-label">Sign out</div>
                </div>
                <div className="sr-right"><div className="sr-arrow">›</div></div>
              </button>
            </>
          ) : (
            <>
              <div className="settings-row" style={{cursor:"default"}}>
                <div className="sr-left">
                  <div className="sr-label">Playing as guest</div>
                  <div className="sr-desc">Sign up to unlock leaderboards and online play</div>
                </div>
              </div>
              <button className="settings-row" onClick={() => openAuthPrompt?.('save')} style={{cursor:"pointer",width:"100%",background:"none",border:"none",textAlign:"left",padding:"14px 16px"}}>
                <div className="sr-left">
                  <div className="sr-label" style={{color:"var(--accent)"}}>Sign in / Create account</div>
                </div>
                <div className="sr-right"><div className="sr-arrow">›</div></div>
              </button>
            </>
          )}
        </div>
      </div>

      <InstallCard />
      <div className="settings-section">
        <div className="ds-eyebrow settings-section-title">Gameplay</div>
        <div className="settings-card">
          <div className="settings-row">
            <div className="sr-left">
              <div className="sr-label">Show Hints</div>
              <div className="sr-desc">First-letter hints on typed questions (Easy mode)</div>
            </div>
            <div className="sr-right">
              <SettingsToggle val={settings.hints} onChange={v => onUpdate({hints:v})} />
            </div>
          </div>
          <div className="settings-row">
            <div className="sr-left">
              <div className="sr-label">Timer</div>
              <div className="sr-desc">Enable countdown timer in Standard, Speed and WC2026 modes</div>
            </div>
            <div className="sr-right">
              <SettingsToggle val={settings.timer} onChange={v => onUpdate({timer:v})} />
            </div>
          </div>
          <div className="settings-row">
            <div className="sr-left">
              <div className="sr-label">Sound Effects</div>
              <div className="sr-desc">Audio feedback on correct and wrong answers</div>
            </div>
            <div className="sr-right">
              <SettingsToggle val={settings.sound} onChange={v => onUpdate({sound:v})} />
            </div>
          </div>
          <div className="settings-row">
            <div className="sr-left">
              <div className="sr-label">Haptics</div>
              <div className="sr-desc">Taps and vibrations on answers, streaks, and button presses</div>
            </div>
            <div className="sr-right">
              <SettingsToggle val={settings.haptics !== false} onChange={v => onUpdate({haptics:v})} />
            </div>
          </div>
        </div>
      </div>

      {/* 1.1: notifications. Native-only (the daily reminder is meaningless on
          web, which can't fire while closed). Toggling on requests the OS
          permission; toggling off cancels all scheduled reminders. */}
      {notifSupported && (
        <div className="settings-section">
          <div className="ds-eyebrow settings-section-title">Notifications</div>
          <div className="settings-card">
            <div className="settings-row">
              <div className="sr-left">
                <div className="sr-label">Daily reminders</div>
                <div className="sr-desc">An evening nudge if you haven't played yet — keeps your streak alive</div>
              </div>
              <div className="sr-right">
                <SettingsToggle val={notifEnabled} onChange={onToggleNotif} />
              </div>
            </div>
          </div>
        </div>
      )}

      {(onShowHelp || onShowPrivacy || onShowKnownIssues) && (
        <div className="settings-section">
          <div className="ds-eyebrow settings-section-title">Help</div>
          <div className="settings-card">
            {onShowHelp && (
              <button
                type="button"
                className="settings-row"
                style={{width:"100%",background:"none",border:"none",textAlign:"left"}}
                onClick={onShowHelp}
              >
                <div className="sr-left">
                  <div className="sr-label">Help & FAQ</div>
                  <div className="sr-desc">Common questions and how to reach us</div>
                </div>
                <div className="sr-right"><div className="sr-arrow">›</div></div>
              </button>
            )}
            {onShowKnownIssues && (
              <button
                type="button"
                className="settings-row"
                style={{width:"100%",background:"none",border:"none",textAlign:"left"}}
                onClick={onShowKnownIssues}
              >
                <div className="sr-left">
                  <div className="sr-label">Known issues</div>
                  <div className="sr-desc">Honest list of things to expect</div>
                </div>
                <div className="sr-right"><div className="sr-arrow">›</div></div>
              </button>
            )}
            {onShowPrivacy && (
              <button
                type="button"
                className="settings-row"
                style={{width:"100%",background:"none",border:"none",textAlign:"left"}}
                onClick={onShowPrivacy}
              >
                <div className="sr-left">
                  <div className="sr-label">Privacy Policy</div>
                  <div className="sr-desc">How your data is handled</div>
                </div>
                <div className="sr-right"><div className="sr-arrow">›</div></div>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Hidden reviewer entry — only rendered for the gated email. The
          server-side RLS on question_review is the actual security; this
          UI gate just hides the link from non-reviewers. */}
      {onOpenReview && user?.email === REVIEWER_EMAIL && (
        <div className="settings-section">
          <div className="ds-eyebrow settings-section-title">Reviewer</div>
          <div className="settings-card">
            <button
              type="button"
              className="settings-row"
              style={{width:"100%",background:"none",border:"none",textAlign:"left"}}
              onClick={onOpenReview}
            >
              <div className="sr-left">
                <div className="sr-label">Review questions</div>
                <div className="sr-desc">Internal question-bank review</div>
              </div>
              <div className="sr-right"><div className="sr-arrow">›</div></div>
            </button>
          </div>
        </div>
      )}

      <div className="settings-section">
        <div className="ds-eyebrow settings-section-title">About</div>
        {/* Sprint #34 BB1 F-S3: about-card-card + about-card-brand wrappers
            let desktop CSS flip this to a horizontal "ball+name+version |
            feedback" row. At mobile (no desktop CSS rule), the wrappers are
            plain divs and the centered-vertical layout is preserved. */}
        <div className="settings-card about-card-card" style={{padding:"24px 18px 18px",textAlign:"center"}}>
          <div className="about-card-brand">
            <div className="about-card-ball" style={{fontSize:48,lineHeight:1,marginBottom:8}} aria-hidden="true">⚽</div>
            <div className="about-card-meta-wrap">
              <div className="about-card-name" style={{fontSize:24,fontWeight:900,color:"var(--t1)",letterSpacing:"-0.4px"}}>Ball <em style={{color:"var(--accent)",fontStyle:"normal"}}>IQ</em></div>
              <div style={{fontSize:13,color:"var(--t2)",marginTop:4}}>The football quiz for real fans</div>
              {/* 1.1: real installed build version (no more stale "1.0.0 BETA"). */}
              <div style={{fontSize:12,color:"var(--t3)",marginTop:3}}>v{appVer}</div>
            </div>
          </div>
          {/* 1.1: three high-value actions — Rate (reviews drive ranking),
              Share (referral growth), Feedback. Equal ghost buttons. */}
          <div style={{display:"flex",gap:8,marginTop:18}}>
            <button onClick={rateApp} style={ABOUT_ACTION_STYLE} aria-label="Rate Ball IQ on the App Store">
              <span style={{fontSize:18}} aria-hidden="true">⭐</span>
              <span>Rate</span>
            </button>
            <button onClick={shareApp} style={ABOUT_ACTION_STYLE} aria-label="Share Ball IQ">
              <span style={{fontSize:18}} aria-hidden="true">↗</span>
              <span>Share</span>
            </button>
            <a href="mailto:hello@balliq.app" style={ABOUT_ACTION_STYLE} aria-label="Send feedback">
              <span style={{fontSize:18}} aria-hidden="true">✉️</span>
              <span>Feedback</span>
            </a>
          </div>
          <div style={{fontSize:12,color:"var(--t3)",marginTop:14}}>Built solo in Norway 🇳🇴</div>
        </div>
      </div>

      <div className="settings-section">
        <div className="ds-eyebrow settings-section-title">Data</div>
        <div className="settings-card">
          <button className="settings-row danger" style={{width:"100%",background:"none",border:"none",textAlign:"left"}} onClick={() => setConfirmClearStats(true)}>
            <div className="sr-left">
              <div className="sr-label">Clear My Stats</div>
              <div className="sr-desc">Reset games played, best score and streak</div>
            </div>
            <div className="sr-right"><div className="sr-arrow">›</div></div>
          </button>
          {onClearSeen && (
            <button
              type="button"
              className="settings-row"
              style={{width:"100%",background:"none",border:"none",textAlign:"left"}}
              onClick={onClearSeen}
            >
              <div className="sr-left">
                <div className="sr-label">Clear question history</div>
                <div className="sr-desc">Allow recently-seen questions to reappear now</div>
              </div>
              <div className="sr-right"><div className="sr-arrow">›</div></div>
            </button>
          )}
        </div>
      </div>

      {/* Sprint #84 AAA3 — Account moderation section. Signed-in only;
         hidden for guests since they have no friend graph. Sits above the
         danger zone so destructive Delete-account stays the visual floor. */}
      {user && onShowBlocked && (
        <div className="settings-section" style={{marginTop:24}}>
          <div className="settings-card">
            <button className="settings-row" style={{width:"100%",background:"none",border:"none",textAlign:"left"}} onClick={onShowBlocked}>
              <div className="sr-left">
                <div className="sr-label">Blocked users</div>
                <div className="sr-desc">Manage who you've blocked from friend search</div>
              </div>
              <div className="sr-right"><div className="sr-arrow">›</div></div>
            </button>
          </div>
        </div>
      )}

      {/* Danger zone — bottom of the screen so destructive actions are
         clearly separated from everyday settings. The same row appears in
         three states (signed-in, mid-auth, guest) but always at this
         position so users know where to find it. */}
      <div className="settings-section" style={{marginTop:24}}>
        <div className="settings-card">
          {user ? (
            <button className="settings-row danger" style={{width:"100%",background:"none",border:"none",textAlign:"left"}} onClick={() => setConfirmDelete(true)}>
              <div className="sr-left">
                <div className="sr-label" style={{color:"var(--red, #FF5A5A)"}}>Delete account</div>
                <div className="sr-desc">Permanently remove your profile and data</div>
              </div>
              <div className="sr-right"><div className="sr-arrow">›</div></div>
            </button>
          ) : (
            <div className="settings-row" style={{cursor:"default",opacity:0.5}}>
              <div className="sr-left">
                <div className="sr-label">Delete account</div>
                <div className="sr-desc">Sign in to manage your account</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {confirmClearStats && (
        <div
          style={{position:"fixed",top:0,right:0,bottom:0,left:0,inset:0,background:"rgba(0,0,0,0.78)",zIndex:1000,display:"flex",alignItems:"flex-end",justifyContent:"center",animation:"fadeIn 0.2s ease"}}
          onClick={() => setConfirmClearStats(false)}
        >
          <div
            ref={clearStatsModalRef}
            tabIndex={-1}
            style={{width:"100%",maxWidth:480,maxHeight:"85vh",overflowY:"auto",WebkitOverflowScrolling:"touch",background:"var(--bg)",borderTop:"1px solid var(--border)",borderRadius:"22px 22px 0 0",padding:"22px 22px 28px",animation:"slideUp 0.3s cubic-bezier(0.22,1,0.36,1)"}}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div style={{fontSize:18,fontWeight:800,color:"var(--text)",marginBottom:8}}>Reset all stats?</div>
            <div style={{fontSize:14,color:"var(--t2)",lineHeight:1.5,marginBottom:10}}>This will reset:</div>
            <ul style={{paddingLeft:20,marginBottom:14,fontSize:14,color:"var(--t2)",lineHeight:1.6}}>
              <li>Games played, scores, streaks</li>
              <li>XP and level</li>
              <li>Login streak</li>
              <li>Daily challenge progress</li>
              <li>Ball IQ history</li>
              <li>Hot Streak best</li>
            </ul>
            <div style={{fontSize:13,color:"var(--t3)",marginBottom:18}}>Your username, avatar, and settings are kept. Stats are cleared on all your devices. This cannot be undone.</div>
            <button
              onClick={() => { setConfirmClearStats(false); onClearStats?.(); }}
              style={{width:"100%",padding:14,background:"var(--red)",color:"#fff",border:"none",borderRadius:12,fontFamily:"inherit",fontSize:15,fontWeight:800,cursor:"pointer",marginBottom:8,WebkitTextFillColor:"#fff"}}
            >
              Reset stats
            </button>
            <button
              onClick={() => setConfirmClearStats(false)}
              style={{width:"100%",padding:14,background:"var(--s2)",color:"var(--text)",border:"1px solid var(--border)",borderRadius:12,fontFamily:"inherit",fontSize:15,fontWeight:700,cursor:"pointer"}}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {confirmSignOut && (
        <div
          style={{position:"fixed",top:0,right:0,bottom:0,left:0,inset:0,background:"rgba(0,0,0,0.78)",zIndex:1000,display:"flex",alignItems:"flex-end",justifyContent:"center",animation:"fadeIn 0.2s ease"}}
          onClick={() => setConfirmSignOut(false)}
        >
          <div
            ref={signOutModalRef}
            tabIndex={-1}
            style={{width:"100%",maxWidth:480,maxHeight:"85vh",overflowY:"auto",WebkitOverflowScrolling:"touch",background:"var(--bg)",borderTop:"1px solid var(--border)",borderRadius:"22px 22px 0 0",padding:"22px 22px 28px",animation:"slideUp 0.3s cubic-bezier(0.22,1,0.36,1)"}}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Sign out confirmation"
          >
            <div style={{fontSize:18,fontWeight:800,color:"var(--text)",marginBottom:8}}>Sign out?</div>
            <div style={{fontSize:14,color:"var(--t2)",lineHeight:1.5,marginBottom:18}}>Sign out of your {APP_NAME} account on this device? Your progress stays synced — sign back in any time to pick up where you left off.</div>
            <button
              onClick={async () => { setConfirmSignOut(false); await signOut(); }}
              style={{width:"100%",padding:14,background:"var(--red)",color:"#fff",border:"none",borderRadius:12,fontFamily:"inherit",fontSize:15,fontWeight:800,cursor:"pointer",marginBottom:8,WebkitTextFillColor:"#fff"}}
            >
              Sign out
            </button>
            <button
              onClick={() => setConfirmSignOut(false)}
              style={{width:"100%",padding:14,background:"var(--s2)",color:"var(--text)",border:"1px solid var(--border)",borderRadius:12,fontFamily:"inherit",fontSize:15,fontWeight:700,cursor:"pointer"}}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div
          style={{position:"fixed",top:0,right:0,bottom:0,left:0,inset:0,background:"rgba(0,0,0,0.78)",zIndex:1000,display:"flex",alignItems:"flex-end",justifyContent:"center",animation:"fadeIn 0.2s ease"}}
          onClick={() => !deleting && setConfirmDelete(false)}
        >
          <div
            ref={deleteModalRef}
            tabIndex={-1}
            style={{width:"100%",maxWidth:480,maxHeight:"85vh",overflowY:"auto",WebkitOverflowScrolling:"touch",background:"var(--bg)",borderTop:"1px solid var(--border)",borderRadius:"22px 22px 0 0",padding:"22px 22px 28px",animation:"slideUp 0.3s cubic-bezier(0.22,1,0.36,1)"}}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div style={{fontSize:18,fontWeight:800,color:"var(--text)",marginBottom:8}}>Delete Account</div>
            <div style={{fontSize:14,color:"var(--t2)",lineHeight:1.5,marginBottom:18}}>
              This will permanently delete your profile, scores, friends and all game history. This cannot be undone.
            </div>
            <button
              onClick={performDelete}
              disabled={deleting}
              style={{width:"100%",padding:14,background:"var(--red)",color:"#fff",border:"none",borderRadius:12,fontFamily:"inherit",fontSize:15,fontWeight:800,cursor:deleting?"default":"pointer",marginBottom:8,opacity:deleting?0.7:1,WebkitTextFillColor:"#fff"}}
            >
              {deleting ? "Deleting…" : "Delete Forever"}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              disabled={deleting}
              style={{width:"100%",padding:14,background:"var(--s2)",color:"var(--text)",border:"1px solid var(--border)",borderRadius:12,fontFamily:"inherit",fontSize:15,fontWeight:700,cursor:deleting?"default":"pointer"}}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
const SettingsScreen = React.memo(SettingsScreenImpl);

// ── Notification bell + center (Phase 1: friend requests) ──────────────────
// A globally-placed bell (mobile header, Home header, desktop rail) with an
// unread badge = pending incoming friend-request count, opening a modal inbox.
// Data + accept/decline live in AppInner (reusing the friendships table); these
// are pure presentation. Play-invites + native push extend this later.
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
                <span className="notif-ava" aria-hidden="true">{inv.actor_avatar || "🎮"}</span>
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
                    {p.avatar || "⚽"}
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

// ─── PRIVACY POLICY SCREEN ────────────────────────────────────────────────────
// Full-screen in-app overlay. Content is hardcoded (no network fetch, no
// CORS/asset-path pitfalls, no flash of a blank iframe). Rendered above the
// app when showPrivacy is true.
//
// IMPORTANT — KEEP IN SYNC WITH public/privacy.html. The standalone HTML is
// linked from index.html footer + sitemap.xml so external visitors must see
// the same policy as in-app users. Sprint #83 ZZ7 caught a drift; Sprint #84
// AAA1 re-synced them. Edit both files in the same commit and bump
// "Last updated" in both when the policy materially changes.
const PrivacyScreen = React.memo(function PrivacyScreen({ onClose }) {
  return (
    <div style={{
      position: "fixed",
      top: 0, right: 0, bottom: 0, left: 0,
      inset: 0,
      background: "#0a0a0a",
      color: "#F0F1F5",
      zIndex: 1000,
      overflowY: "auto",
      WebkitOverflowScrolling: "touch",
      fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,sans-serif",
    }}>
      <div style={{
        position: "sticky", top: 0,
        background: "rgba(10,10,10,0.95)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid #2A2D3A",
        // Phase 6a Item 1: safe-area-inset-top so the back button isn't
        // hidden behind the iOS status bar / notch in PWA standalone mode.
        // The outer position:fixed inset:0 ignores safe area by design;
        // the sticky header has to push itself down explicitly.
        padding: "calc(14px + env(safe-area-inset-top, 0px)) 20px 14px",
        display: "flex", alignItems: "center", gap: 12,
        zIndex: 1,
      }}>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close privacy policy"
          style={{
            width: 36, height: 36, borderRadius: 10,
            background: "#14161E", border: "1px solid #2A2D3A",
            color: "#F0F1F5", fontSize: 18, lineHeight: 1,
            cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center",
            WebkitTapHighlightColor: "transparent",
            outline: "none",
          }}
        >←</button>
        <div style={{fontSize: 17, fontWeight: 800, letterSpacing: "-0.3px"}}>Privacy Policy</div>
      </div>
      <div style={{maxWidth: 680, margin: "0 auto", padding: "28px 20px 80px", lineHeight: 1.7}}>
        <div style={{fontSize: 22, fontWeight: 900, color: "var(--accent)", marginBottom: 8}}>⚽ {APP_NAME}</div>
        {/* Sprint #77 SS5: hard-coded revision date. Previously rendered
            `new Date().toLocaleDateString()` which falsely claimed the
            policy was updated every day the user viewed it. Bump this
            string whenever the policy content materially changes. */}
        <div style={{fontSize: 13, color: "#9BA0B8", marginBottom: 28}}>Last updated: 5 July 2026</div>

        <div style={{
          background: "#14161E", borderRadius: 16,
          padding: "18px 20px", margin: "12px 0 24px",
          border: "1px solid #2A2D3A",
        }}>
          <p style={{fontSize: 15, color: "#9BA0B8", margin: 0}}>
            <span style={{color: "#58CC02", fontWeight: 600}}>The short version:</span>{" "}
            Play as a guest and nothing is collected — your progress lives on your device only. Sign in and we store the minimum needed to sync your account across devices: email, username, scores, and game history. The app shows no ads and runs no usage tracking. Our website (balliq.app) shows ads via Google, which uses cookies, alongside privacy-friendly cookieless analytics — but the app itself stays ad-free and cookie-free. We never sell your data.
          </p>
        </div>

        <h2 style={privacyH2}>1. Two ways to play</h2>
        <p style={privacyP}><strong>Guest mode</strong> — open {APP_NAME} without signing in. Your scores, streaks, settings and game history are stored only in your device's local storage. Nothing is sent to our servers. If you clear your browser data or uninstall the app, that progress is gone.</p>
        <p style={privacyP}><strong>Signed-in mode</strong> — sign in with email to back up your progress and play online multiplayer. We store the minimum needed to deliver those features (detail in §2 below). You can delete your account at any time from Settings → Account → Delete Account, which removes everything we hold about you.</p>

        <h2 style={privacyH2}>2. What we store when you sign in</h2>
        <p style={privacyP}>When you have an account, the following lives on our servers (hosted by Supabase, see §5):</p>
        <ul style={{paddingLeft: 20, marginBottom: 12}}>
          <li style={privacyLi}><strong>Email address</strong> — used only for sign-in (password authentication) and account-confirmation email at signup. Never used for marketing.</li>
          <li style={privacyLi}><strong>Username + avatar</strong> — visible to other signed-in players in friend search and friend profiles.</li>
          <li style={privacyLi}><strong>Game results</strong> — Daily 7 scores, Footle history, total games played, total XP, best streaks, and the questions you got wrong (for the review screen).</li>
          <li style={privacyLi}><strong>Friendships</strong> — friend requests sent + accepted, so your friends list works across devices.</li>
          <li style={privacyLi}><strong>Onboarded flag</strong> — a single timestamp so we don't replay onboarding on every device.</li>
        </ul>
        <p style={privacyP}>That's the full list. We do not collect your real name, location, device fingerprint, or any contact list. We never sell or share this data with third parties for marketing.</p>

        <h2 style={privacyH2}>3. Error monitoring</h2>
        <p style={privacyP}>We use Sentry to catch crashes and bugs. When something goes wrong in the app, Sentry receives a stack trace, the browser version, and a short trail of recent actions ("breadcrumbs") — no question text, no personal data. We strip your email and auth tokens from every event before it leaves your device. We use this only to fix bugs, never for tracking.</p>

        <h2 style={privacyH2}>4. Analytics &amp; ads</h2>
        <p style={privacyP}>The {APP_NAME} <strong>app</strong> uses no analytics tools, tracking pixels, or advertising SDKs. It does not measure how you use it, shows no ads, and works with no ad networks. This is enforced in code: the ad and analytics scripts are blocked from ever loading inside the app.</p>
        <p style={privacyP}>Our <strong>website (balliq.app)</strong> uses Vercel Web Analytics — a privacy-friendly, cookieless analytics service — to understand aggregate traffic, such as how many people visit a page. It sets no cookies, does not track you across other websites, and does not identify you personally.</p>
        <p style={privacyP}>Our <strong>website (balliq.app)</strong> also displays ads through <strong>Google AdSense</strong>. To serve and measure ads, Google and its partners may set and read cookies or similar identifiers in your browser, and — where you agree — use them to show more relevant ads. This applies to the website only; the app remains ad-free and sets no advertising cookies. If you are in the EEA, UK, or Switzerland, you will be asked for your consent choices through a Google-certified consent prompt before any personalised ads are shown, and you can change your choice at any time. You can review how Google uses data from sites that use its services at <span style={{color:"#58CC02"}}>policies.google.com/technologies/partner-sites</span>, and manage ad personalisation at <span style={{color:"#58CC02"}}>adssettings.google.com</span>.</p>

        <h2 style={privacyH2}>5. Third-party services we use</h2>
        <ul style={{paddingLeft: 20, marginBottom: 12}}>
          <li style={privacyLi}><strong>Supabase (database, auth, storage):</strong> When you sign in, your email, username, profile data, game results and avatar image are stored on Supabase servers (EU region). Supabase is our data processor.</li>
          <li style={privacyLi}><strong>Sentry (error monitoring):</strong> Crash reports are sent to Sentry with email and tokens scrubbed before transmission.</li>
          <li style={privacyLi}><strong>Vercel (hosting + website analytics):</strong> Serves {APP_NAME} over HTTPS and may log standard request data (IP, timestamp, URL) for operational purposes. On our website (balliq.app) we also use Vercel Web Analytics for aggregate, cookieless usage metrics — no cookies, no cross-site tracking, no personal identification.</li>
          <li style={privacyLi}><strong>Google AdSense (website ads):</strong> Our website (balliq.app) displays ads through Google AdSense. Google and its ad partners may set cookies or similar identifiers to serve, measure, and (with consent) personalise ads. This runs on the website only — never in the app. See policies.google.com/technologies/ads.</li>
          <li style={privacyLi}><strong>Google Fonts:</strong> We load the Inter and JetBrains Mono fonts from fonts.googleapis.com. Google may log your IP address when fonts are fetched.</li>
          <li style={privacyLi}><strong>Cropper.js (CDN):</strong> When you upload a profile picture, we load an image-cropping library from cdnjs.cloudflare.com. The CDN provider may log your IP address.</li>
        </ul>

        <h2 style={privacyH2}>6. Children's Privacy</h2>
        <p style={privacyP}>{APP_NAME} is not directed at children under 13. Guest mode requires no account or personal data. To sign in you must provide an email address — please don't sign in if you are under 13. The app's content is suitable for all ages.</p>

        <h2 style={privacyH2}>7. Changes to This Policy</h2>
        <p style={privacyP}>If we make changes to this privacy policy, we will update the date at the top of this page. Continued use of the app after any changes constitutes acceptance of the new policy.</p>

        <h2 style={privacyH2}>8. Contact</h2>
        <p style={privacyP}>If you have any questions about this privacy policy, please contact us at: <a href="mailto:privacy@balliq.app" style={{color:"var(--accent)",textDecoration:"none"}}>privacy@balliq.app</a></p>

        <p style={{marginTop: 48, fontSize: 13, color: "#9BA0B8"}}>© 2026 {APP_NAME}. All rights reserved.</p>
      </div>
    </div>
  );
});
const privacyH2 = {fontSize: 17, fontWeight: 700, color: "#F0F1F5", margin: "28px 0 10px"};
const privacyP = {fontSize: 15, color: "#9BA0B8", marginBottom: 12};
const privacyLi = {fontSize: 15, color: "#9BA0B8", marginBottom: 6};

// ─── HELP / FAQ SCREEN ────────────────────────────────────────────────────────
// Same overlay shape as PrivacyScreen so dark / light backgrounds, scroll
// behaviour and back-arrow affordance are consistent.
const FAQ_ENTRIES = [
  {
    q: "How do I play with friends online?",
    a: `Tap "Play with Friends" on the home screen and choose Online Multiplayer. The host taps "Create Room" and gets a 6-character room code (like ABC123). Share the code with up to three friends — they tap "Join with Code", enter it, and land in your lobby. Once at least one friend has joined, the host taps "Start Game" and you all play the same questions in real time. Want a quick local game instead? "Local Multiplayer" still works for pass-and-play on a single device.`,
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
    q: "How does the Ball IQ Test work?",
    a: "The Ball IQ Test asks you 15 carefully calibrated questions across difficulty levels. Your score is mapped to an IQ-like scale from 60 to 160 based on accuracy. There's no time limit — answer at your own pace.",
  },
  {
    q: "What is Footle?",
    a: "Footle is our daily football word game — guess a footballer's surname in 6 attempts. The same player is shown to everyone each day and resets at midnight.",
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
      background: "#0a0a0a",
      color: "#F0F1F5",
      zIndex: 1000,
      overflowY: "auto",
      WebkitOverflowScrolling: "touch",
      fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,sans-serif",
    }}>
      <div style={{
        position: "sticky", top: 0,
        background: "rgba(10,10,10,0.95)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid #2A2D3A",
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
            background: "#14161E", border: "1px solid #2A2D3A",
            color: "#F0F1F5", fontSize: 18, lineHeight: 1,
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
        <div style={{fontSize: 13, color: "#9BA0B8", marginBottom: 28}}>Quick answers to common questions.</div>
        {/* Phase 6d Issue 3: reuse privacyH2/privacyP from PrivacyScreen so
            Help and Privacy read as visual siblings (same h2 weight/color,
            same body color, same vertical rhythm). Was using a bright
            #58CC02 on questions which was louder than anywhere else in
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
      background: "#0A0A0A",
      color: "#F0F1F5",
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
        borderBottom: "1px solid #2A2D3A",
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
            background: "#14161E", border: "1px solid #2A2D3A",
            color: "#F0F1F5", fontSize: 18, lineHeight: 1,
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
        <div style={{fontSize: 13, color: "#9BA0B8", marginBottom: 28}}>
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

// ─── IQ RECAP OVERLAY ─────────────────────────────────────────────────────────
// Lightweight modal shown when the user taps the home-screen IQ chip and
// already has at least one APP_NAME result. Displays the most recent score,
// its label/percentile, the date taken, and share / retake actions.
function IqRecapOverlay({ entry, onClose, onRetake }) {
  if (!entry) return null;
  const iq = entry.iq;
  const label = iqLabel(iq);
  const when = entry.date
    ? new Date(entry.date).toLocaleDateString(undefined, { day:"numeric", month:"short", year:"numeric" })
    : null;
  const doShare = async () => {
    const msg = `🧠 My ${APP_NAME} is ${iq}\n${label}\n\nCould you beat me?\nballiq.app`;
    try {
      if (navigator.share) { await navigator.share({ title: APP_NAME, text: msg }); return; }
      if (navigator.clipboard) { await navigator.clipboard.writeText(msg); try { window.dispatchEvent(new CustomEvent('biq:show-toast', { detail: '📋 Copied to clipboard' })); } catch {} return; }
    } catch {}
  };
  return (
    <div
      onClick={onClose}
      style={{
        position:"fixed", top:0, right:0, bottom:0, left:0, inset:0, zIndex:999,
        background:"rgba(0,0,0,0.75)",
        display:"flex", alignItems:"flex-end",
        animation:"fadeIn 0.2s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width:"100%", background:"var(--bg)",
          borderRadius:"20px 20px 0 0",
          padding:"28px 24px calc(36px + env(safe-area-inset-bottom, 34px))",
          animation:"slideUp 0.3s cubic-bezier(0.22,1,0.36,1)",
          textAlign:"center",
        }}
      >
        <div className="ds-eyebrow" style={{marginBottom:6}}>Your {APP_NAME}</div>
        <div
          className="numeric"
          style={{
            fontSize:72, fontWeight:900, color:"#58CC02",
            letterSpacing:"-0.03em", lineHeight:1,
            textShadow:"0 8px 32px rgba(88,204,2,0.35)",
          }}
        >{iq}</div>
        <div style={{marginTop:10, fontSize:17, fontWeight:800, color:"var(--t1)", letterSpacing:"-0.01em"}}>{label}</div>
        {when && <div style={{marginTop:10, fontSize:12, color:"var(--t3)"}}>Tested {when}</div>}
        <div style={{marginTop:22}}>
          <button className="btn-3d ghost" onClick={doShare} style={{marginBottom:14}}>Share Score</button>
          <button className="btn-3d" onClick={() => { onClose(); onRetake(); }} style={{marginBottom:14}}>Retake Test</button>
          <button className="btn-3d ghost" onClick={onClose} aria-label="Close IQ recap">Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── XP BAR COMPONENT ─────────────────────────────────────────────────────────
function XPBar({ xp, streak }) {
  const { level, nextLevel, progress } = getLevelInfo(xp);
  return (
    <div className="xp-bar-wrap">
      <div className="xp-bar-top">
        <span className="xp-level-icon">{level.icon}</span>
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


// ─── ONBOARDING ───────────────────────────────────────────────────────────────
// 2-step flow shown once per device after auth. Persists:
//   biq_skill_level  — "casual" | "fan" | "expert" (or absent → medium default)
//   biq_onboarded    — "1" once completed OR skipped
//
// The pure-copy "Welcome to Ball IQ" step was deleted (it had no skip control).
// Step 1 is now the sample question; Skip is present on every step — see `skip`.
const SKILL_OPTIONS = [
  { id: "casual", icon: "🌱", name: "Casual Fan", desc: "I watch the big games and know the top teams.",           diff: "easy"   },
  { id: "fan",    icon: "⚽", name: "Football Fan", desc: "I follow a league or two and the major competitions.",   diff: "medium" },
  { id: "expert", icon: "🧠", name: "Expert",      desc: "I know obscure facts and follow football history.",      diff: "hard"   },
];

// One easy, universally-fun taster so a brand-new player tastes the trivia
// within seconds — kept deliberately light (still fully skippable, no login).
// Reviewer-facing first impression (App Review sees this screen on every fresh
// install) — keep it 100% free of competition/tournament branding.
const ONBOARD_SAMPLE = { q: "Who has scored the most goals in men's international football?", o: ["Lionel Messi", "Cristiano Ronaldo", "Pelé", "Neymar"], a: 1 };

function OnboardingScreen({ onDone }) {
  const [step, setStep] = useState(0);
  const [skillLevel, setSkillLevel] = useState(null);
  const [sampleAnswered, setSampleAnswered] = useState(null);
  const TOTAL = 2;
  const stepW = `${100 / TOTAL}%`;

  const persistAndFinish = () => {
    try {
      if (skillLevel) {
        localStorage.setItem("biq_skill_level", skillLevel);
        const diffFor = SKILL_OPTIONS.find(s => s.id === skillLevel)?.diff;
        if (diffFor) {
          try {
            const raw = localStorage.getItem("biq_settings");
            const s = raw
              ? JSON.parse(raw)
              : { defaultDiff: "medium", hints: true, timer: true, sound: false, haptics: true };
            s.defaultDiff = diffFor;
            localStorage.setItem("biq_settings", JSON.stringify(s));
          } catch {}
        }
      }
      localStorage.setItem("biq_onboarded", "1");
    } catch {}
    // Sprint #26 X2: persist to profile so the flag survives across devices.
    // Guest users (no signed-in session) stay local-only; the migration on
    // first sign-in propagates the local flag to their profile.
    try {
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user?.id) {
          supabase.from('profiles')
            .update({ onboarded_at: new Date().toISOString() })
            .eq('id', data.user.id)
            .then(() => {});
        }
      });
    } catch {}
    onDone?.();
  };

  const next = () => {
    haptic("soft");
    if (step < TOTAL - 1) setStep(s => s + 1);
    else persistAndFinish();
  };
  // Skip exits the flow; it used to be byte-identical to `next`.
  // persistAndFinish() writes biq_onboarded + profiles.onboarded_at, so a
  // skipper is never re-prompted; skillLevel left null keeps the medium
  // default (biq_settings is not touched when it's null).
  const skip = () => {
    haptic("soft");
    persistAndFinish();
  };

  return (
    <div className="onboard-wrap">
      <div className="onboard-progress">
        {Array.from({ length: TOTAL }).map((_, i) => (
          <div
            key={i}
            className={`onboard-bar${i < step ? " done" : ""}${i === step ? " active" : ""}`}
          />
        ))}
      </div>

      <div className="onboard-viewport">
        <div className="onboard-track" style={{ width: `${TOTAL * 100}%`, transform: `translateX(-${step * (100 / TOTAL)}%)` }}>
          {/* 1. Taste it — one quick question (the casual hook). */}
          <div className="onboard-step" style={{ width: stepW }}>
            <div className="onboard-step-top">
              <div className="onboard-title" style={{ marginTop: 16 }}>Quick one — give it a go ⚽</div>
              <div className="onboard-body" style={{ marginBottom: 14 }}>{ONBOARD_SAMPLE.q}</div>
              <div className="onboard-sample-opts">
                {ONBOARD_SAMPLE.o.map((opt, i) => {
                  const answered = sampleAnswered !== null;
                  const isCorrect = i === ONBOARD_SAMPLE.a;
                  let cls = "onboard-sample-opt";
                  if (answered && isCorrect) cls += " correct";
                  else if (answered && sampleAnswered === i) cls += " wrong";
                  return (
                    <button
                      key={i}
                      className={cls}
                      disabled={answered}
                      onClick={() => { haptic(isCorrect ? "heavy" : "soft"); setSampleAnswered(i); }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              <div className="onboard-sample-fb">
                {sampleAnswered === null ? "" : (sampleAnswered === ONBOARD_SAMPLE.a
                  ? "Nice — you're a natural ⚽"
                  : `It's ${ONBOARD_SAMPLE.o[ONBOARD_SAMPLE.a]} — the all-time record holder. You'll pick these up fast!`)}
              </div>
            </div>
            <div className="onboard-actions">
              <button className="onboard-skip" onClick={skip}>Skip</button>
              <button className="onboard-btn onboard-btn-inline" onClick={next}>{sampleAnswered === null ? "Next" : "Continue"}</button>
            </div>
          </div>

          {/* 2. Skill Level — optional; Skip lands straight in the app. */}
          <div className="onboard-step" style={{ width: stepW }}>
            <div style={{width:"100%"}}>
              <div className="onboard-title" style={{marginTop:16}}>How's your football knowledge?</div>
              <div className="onboard-body">We'll tune the default difficulty to match.</div>
            </div>
            <div className="onboard-skill-list">
              {SKILL_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  className={`onboard-skill${skillLevel === opt.id ? " on" : ""}`}
                  onClick={() => { haptic("soft"); setSkillLevel(opt.id); }}
                  aria-pressed={skillLevel === opt.id}
                >
                  <span className="onboard-skill-icon">{opt.icon}</span>
                  <div className="onboard-skill-body">
                    <div className="onboard-skill-name">{opt.name}</div>
                    <div className="onboard-skill-desc">{opt.desc}</div>
                  </div>
                </button>
              ))}
            </div>
            <div className="onboard-actions">
              <button className="onboard-skip" onClick={skip}>Skip</button>
              <button className="onboard-btn onboard-btn-inline" onClick={next}>Finish</button>
            </div>
          </div>
        </div>
      </div>
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
function DailyHeroCountdown() {
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
            This tab hit a snag
          </div>
          <div style={{fontSize:13.5, color:"var(--t2)", lineHeight:1.7, marginBottom:22, maxWidth:280}}>
            The rest of the app is fine — tap to reload just this screen.
          </div>
          <button
            onClick={() => this.setState({ hasError:false })}
            style={{
              padding:"11px 24px", background:"#58CC02", border:"none",
              borderRadius:11, fontFamily:"Inter,sans-serif", fontSize:13.5,
              fontWeight:700, color:"#0a1a00", cursor:"pointer"
            }}
          >
            Try again
          </button>
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
  wordle: { title:"⚽ Footle", steps:["Guess today's footballer surname","Green = right letter, right spot","Yellow = right letter, wrong spot","Guesses must be a real player or manager surname","6 guesses, new player at midnight"] },
  hotstreak: { title:"⚡🔥 Hot Streak", steps:["You have 60 seconds on the clock","Answer as many questions as you can","No penalty for wrong answers — just keep going!","Score is how many you get correct","Try to beat your personal best"] },
  truefalse: { title:"✅ True or False", steps:["You get 20 football statements","Tap TRUE or FALSE for each one","There's no timer — take your time","Every correct answer earns XP","A perfect 20/20 earns a bonus!"] },
  wc2026: { title:"🌍 International", steps:["15 questions on international football","National teams and their stars","Questions on history, players and format","No timer — test your knowledge","See how much you know!"] },
  survival: { title:"🔥 Survival", steps:["Answer questions one by one","One wrong answer and the game is over","No timer — accuracy is everything","See how far you can go","Your best streak is saved"] },
  balliq: { title:`🧠 ${APP_NAME} Test`, steps:["15 questions across all categories","Difficulty ramps up as you go","Your score maps to a 60–160 scale","Earn a football-culture rank label","Your history is saved for tracking"] },
};

// Shared hide style so the home-screen tab wrappers reference the same object
// each render (no new allocation on every tab change).
const HIDDEN_STYLE = { display: "none" };

// ─── FOOTBALL WORDLE ──────────────────────────────────────────────────────────
// Surnames are stored uppercase, ASCII-only, 4–8 letters. Daily seed picks one
// by index so every player gets the same answer until midnight local time.
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
function getWordleKeyState(letter, guesses, answer) {
  let best = null;
  for (const g of guesses) {
    const grades = gradeWordleGuess(g, answer);
    for (let i = 0; i < g.length; i++) {
      if (g[i] !== letter) continue;
      const c = grades[i];
      if (c === "green") return "green";
      if (c === "yellow" && best !== "green") best = "yellow";
      if (c === "grey" && !best) best = "grey";
    }
  }
  return best;
}

const WORDLE_KB_ROWS = [
  ["Q","W","E","R","T","Y","U","I","O","P"],
  ["A","S","D","F","G","H","J","K","L"],
  ["Z","X","C","V","B","N","M","DEL"],
];

const FootballWordle = React.memo(function FootballWordle({ onBack, userId, onHowToPlay, onPlayDaily }) {
  // One puzzle per day — answer + storage key derive from today's date and
  // automatically resync on the day-rollover reload below.
  const dateKey = getWordleDateKey();
  const storageKey = `biq_wordle_${dateKey}`;
  const answer = useMemo(getWordleAnswer, [dateKey]);

  // Audit Phase 5 (C2): track shake (450ms) + reveal (~2-3s) setTimeouts
  // so we can clear them on unmount. Without this, setShake(false) and
  // setRevealed(true) could fire on unmounted component if the user backs
  // out mid-animation.
  const timeoutsRef = useRef([]);
  useEffect(() => () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.guesses)) return parsed;
      }
    } catch {}
    return { guesses: [], status: "playing" };
  });
  const [current, setCurrent] = useState("");
  const [shake, setShake] = useState(false);
  const [countdown, setCountdown] = useState("");
  const [revealed, setRevealed] = useState(() => {
    // If the user already finished today's puzzle, reveal the result card on
    // mount instead of waiting for the flip-animation timer.
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed?.status === "won" || parsed?.status === "lost";
      }
    } catch {}
    return false;
  });

  // 1.1: whether today's puzzle was ALREADY finished when this screen
  // mounted. Distinguishes a fresh solve (fire confetti once) from re-opening
  // a solved puzzle later in the day (no confetti on every revisit).
  const wasFinishedAtMount = useRef(state.status !== "playing");

  // Auto-open the rules ONCE, for a first-time Footle player only: nothing on
  // the grid says what green/yellow/grey mean or that a guess must be a real
  // surname. Only fires on a genuinely untouched puzzle — someone mid-grid (or
  // re-opening a finished one) has already worked it out and doesn't need a
  // sheet over it.
  const rulesAutoOpenedRef = useRef(false);
  useEffect(() => {
    if (rulesAutoOpenedRef.current || !onHowToPlay) return;
    if (wasFinishedAtMount.current || state.guesses.length > 0) return;
    try {
      if (localStorage.getItem("biq_footle_rules_seen") === "1") return;
      localStorage.setItem("biq_footle_rules_seen", "1");
    } catch {}
    rulesAutoOpenedRef.current = true;
    onHowToPlay();
    // Mount-only by construction (the ref latches, and guesses.length is read
    // from the mount-time state); deps kept minimal deliberately.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onHowToPlay]);

  // Persist on every change to the game state.
  useEffect(() => {
    safeSetItem(storageKey, JSON.stringify(state));
    // Cross-device sync — push to profiles.wordle_state via atomic JSON
    // merge. Skip the empty-grid initial state to avoid a useless write.
    if (userId && state.guesses.length > 0) {
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
    }
  }, [state, storageKey, userId, dateKey]);

  // Live "new player tomorrow" countdown. Ticks once per second.
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const ms = tomorrow - now;
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setCountdown(`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Detect day rollover while the screen is open — full reload so the new
  // day's answer, storageKey and game state all resync together.
  useEffect(() => {
    const id = setInterval(() => {
      if (getWordleDateKey() !== dateKey) window.location.reload();
    }, 5000);
    return () => clearInterval(id);
  }, [dateKey]);

  const submitGuess = useCallback(() => {
    if (state.status !== "playing") return;
    if (current.length !== answer.length) {
      setShake(true);
      timeoutsRef.current.push(setTimeout(() => setShake(false), 450));
      return;
    }
    const newGuesses = [...state.guesses, current];
    let newStatus = "playing";
    if (current === answer) newStatus = "won";
    else if (newGuesses.length >= 6) newStatus = "lost";
    setState({ guesses: newGuesses, status: newStatus });
    setCurrent("");
    if (newStatus !== "playing") {
      setRevealed(false);
      timeoutsRef.current.push(setTimeout(() => setRevealed(true), answer.length * TIMINGS.WORDLE_FLIP_MS + 200));
      // Win/loss feedback at the moment of truth (scan #3) — playSound
      // self-gates on the user's sound setting.
      if (newStatus === "won") { try { haptic("correct"); playSound("correct"); } catch {} }
      else { try { haptic("wrong"); playSound("wrong"); } catch {} }
      // 1.1: completing today's Footle cancels tonight's reminder; a solve is
      // also a positive moment to surface the notification pre-prompt.
      // game/won/guesses ride along so the app shell can award Footle XP
      // exactly once (this transition fires once per day by construction —
      // finished puzzles never re-enter submitGuess).
      try { window.dispatchEvent(new CustomEvent('biq:daily-completed', { detail: { positive: newStatus === "won", game: 'footle', won: newStatus === "won", guesses: newGuesses.length } })); } catch {}
      // ⭐ 5-star ask at a Footle emotional peak — a fast solve (≤3 guesses) is a
      // genuine "I'm good at this" moment. maybeRequestReview enforces a long
      // cooldown + lifetime cap + native-only, so it only occasionally prompts.
      if (newStatus === "won" && newGuesses.length <= 3) {
        timeoutsRef.current.push(setTimeout(() => { maybeRequestReview(); }, 3500));
      }
    }
  }, [state, current, answer]);

  const handleKey = useCallback((key) => {
    if (state.status !== "playing") return;
    if (key === "ENTER") return submitGuess();
    if (key === "DEL") { setCurrent((c) => c.slice(0, -1)); return; }
    if (/^[A-Z]$/.test(key)) {
      setCurrent((c) => (c.length < answer.length ? c + key : c));
    }
  }, [state.status, submitGuess, answer.length]);

  // Audit Phase 5 (C3): ref-stabilize handleKey so the global keydown
  // listener attaches once per mount instead of once per keystroke.
  // handleKey's deps cascade through submitGuess → current, so handleKey
  // identity changes on every letter typed; without the ref the effect
  // below tore down and re-added the window listener ~6 times per puzzle.
  // Keypress correctness preserved: handleKeyRef.current always returns
  // the freshest callback at fire time.
  const handleKeyRef = useRef(handleKey);
  useEffect(() => { handleKeyRef.current = handleKey; });

  // Physical keyboard support. Ignore when modifier keys are held so we don't
  // hijack browser shortcuts (cmd-R, etc.).
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Enter") { e.preventDefault(); handleKeyRef.current("ENTER"); }
      else if (e.key === "Backspace") { e.preventDefault(); handleKeyRef.current("DEL"); }
      else if (/^[a-zA-Z]$/.test(e.key)) handleKeyRef.current(e.key.toUpperCase());
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const dateLabel = useMemo(() => {
    return new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }, [dateKey]);

  // Build all 6 grid rows: completed guesses get coloured, current row shows
  // the in-progress entry, future rows are blanks.
  const rows = [];
  for (let r = 0; r < 6; r++) {
    if (r < state.guesses.length) {
      const g = state.guesses[r];
      const grades = gradeWordleGuess(g, answer);
      rows.push(
        <div className="wd-row" key={r}>
          {Array.from({ length: answer.length }, (_, i) => (
            <div
              key={i}
              className={`wd-tile wd-${grades[i]} wd-flip`}
              style={{ animationDelay: `${i * 280}ms` }}
              aria-label={`${g[i]}, ${grades[i] === "green" ? "correct" : grades[i] === "yellow" ? "wrong position" : "not in the name"}`}
            >{g[i]}</div>
          ))}
        </div>
      );
    } else if (r === state.guesses.length && state.status === "playing") {
      rows.push(
        <div className={`wd-row${shake ? " wd-shake" : ""}`} key={r}>
          {Array.from({ length: answer.length }, (_, i) => (
            <div
              key={i}
              className={`wd-tile${current[i] ? " wd-filled" : ""}`}
            >{current[i] || ""}</div>
          ))}
        </div>
      );
    } else {
      rows.push(
        <div className="wd-row" key={r}>
          {Array.from({ length: answer.length }, (_, i) => (
            <div key={i} className="wd-tile" />
          ))}
        </div>
      );
    }
  }

  // Build the share text: emoji grid built from each actual guess. ⬛ for grey
  // matches the in-app dark theme rather than NYT Wordle's ⬜. Layout:
  //   ⚽ APP_NAME — Today's Puzzle
  //   {score}/6
  //   <blank line>
  //   <emoji grid, one row per guess>
  //   <blank line>
  //   balliq.app
  // The URL is also passed via navigator.share's `url` field so apps that
  // recognise it (Snapchat, WhatsApp, iMessage, Twitter) render it as a
  // tappable link rather than inline text.
  const shareText = useMemo(() => {
    if (state.status === "playing") return "";
    const won = state.status === "won";
    const grid = state.guesses.map((g) => {
      const grades = gradeWordleGuess(g, answer);
      return grades.map((c) => (c === "green" ? "🟩" : c === "yellow" ? "🟨" : "⬛")).join("");
    }).join("\n");
    const num = getFootleNumber();
    const tag = num > 0 ? ` #${num}` : "";
    const streak = won ? computeFootleStreak(new Date()) : 0;
    // Same Wordle-convention format as the review screen's builder — the two
    // MUST stay in sync (one puzzle, one share format).
    const head = `⚽ ${APP_NAME} Footle${tag} ${won ? state.guesses.length : "X"}/6`;
    const streakLine = won && streak > 0 ? `\n🔥 ${streak}-day streak` : "";
    return `${head}${streakLine}\n\n${grid}\n\nballiq.app/footle`;
  }, [state, answer]);

  const onShare = useCallback(async () => {
    if (!shareText) return;
    // Build the per-guess grades grid for the canvas card. Each guess is an
    // array of "green" | "yellow" | "grey" matching the in-app tile colours.
    const grades = state.guesses.map((g) => gradeWordleGuess(g, answer));
    await shareCard("wordle", {
      score: state.guesses.length,
      total: 6,
      grades,
      dateLabel,
      failed: state.status === "lost",
      num: getFootleNumber(),
    }, {
      onToast: (msg) => { try { window.dispatchEvent(new CustomEvent('biq:show-toast', { detail: String(msg) })); } catch {} },
      textFallback: shareText,
    });
  }, [shareText, state.guesses, state.status, answer, dateLabel]);

  return (
    <div className="wd-screen">
      <div className="wd-header">
        <button className="back-btn" onClick={onBack} aria-label="Back">←</button>
        <div className="wd-header-text">
          <div className="wd-title">Footle</div>
          {/* Shortened when the "?" joined this row: the button + its gap take
              56px out of the flex:1 text column, which wrapped the old
              "Player or manager — guess the surname" onto a 3rd line and pushed
              the grid + keyboard down (measured 375px: header 56→71.5px). The
              player-or-manager rule it carried now lives in the rules sheet
              (step 4), which auto-opens for first-timers. Measured with the "?"
              present: header 44px @375, 56px @320 — at or under the pre-"?"
              baseline at both. Re-measure both if this string grows. */}
          <div className="wd-sub">Guess the surname</div>
        </div>
        {onHowToPlay && (
          <button className="icon-btn" onClick={onHowToPlay} aria-label="How to play Footle" title="How to play">?</button>
        )}
        <div className="wd-countdown" title="New player tomorrow">
          <div className="wd-countdown-label">Next</div>
          <div className="wd-countdown-time">{countdown}</div>
        </div>
      </div>

      <div className={`wd-grid${state.status !== "playing" ? " wd-grid--ended" : ""}`} style={{ "--wd-cols": answer.length }}>
        {rows}
      </div>

      {state.status !== "playing" && revealed && (
        <div className="wd-result">
          {/* 1.1: celebrate a fresh solve. Gated on !wasFinishedAtMount so
              re-opening today's solved puzzle doesn't re-fire the confetti. */}
          {state.status === "won" && !wasFinishedAtMount.current && <Confetti />}
          <div className="wd-result-title">
            {state.status === "won" ? "⚽ Brilliant!" : "Better luck tomorrow"}
          </div>
          {/* Sprint #81 YY2: reveal renders proper-cased full name from
              WORDLE_FULL_NAMES (tuple [firstNamePrefix, properSurname]).
              First name (if present) inherits the muted .wd-result-sub
              color; surname stays accent via <strong>. Empty prefix →
              single-name brand (Pelé, Neymar) renders just the surname
              with no leading whitespace. Falls back to raw uppercase
              answer if a pool entry is unmapped (defensive). */}
          {(() => {
            const [prefix, surname] = WORDLE_FULL_NAMES[answer] || ["", answer];
            return (
              <div className="wd-result-sub">
                The answer was {prefix && <>{prefix} </>}<strong>{surname}</strong>
              </div>
            );
          })()}
          {/* Static earned-XP footer, mirroring every other result screen —
              the daily hero now visibly feeds the same progression economy. */}
          <div style={{fontSize:13,fontWeight:700,color:"var(--accent)",marginBottom:10}}>
            +{getFootleXP(state.status === "won", state.guesses.length)} XP
          </div>
          <button className="wd-share" onClick={onShare}>Share result</button>
          {/* wa.me is web-only: inside the Capacitor WebView it often loads
              the wa.me web page instead of app-switching, and the native
              share sheet (shareCard's IS_NATIVE branch) already surfaces
              WhatsApp with the PNG card — strictly better there. */}
          {!IS_NATIVE && shareText && (
            <a className="wd-share wd-share--wa" href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer">Share on WhatsApp</a>
          )}
          {/* Strong post-game App Store nudge for the social-webview funnel
              (see FootleGetAppCTA def) — the result moment is where
              Wordle-likes convert. */}
          <FootleGetAppCTA />
          <div className="wd-result-foot">New player in {countdown}</div>
          {/* Second-play CTA. Rendered on won AND lost; hidden once today's
              Daily 7 is done (the mount site passes no handler then, since
              startMode would only toast "already done today"). */}
          {onPlayDaily && (
            <button className="wd-back" onClick={onPlayDaily} style={{margin:"2px auto 0"}}>
              Not done yet? Play today's Daily 7 →
            </button>
          )}
          {/* Sprint #64 FF1: post-Footle install nudge. Now rendered on any
              TERMINAL state, not won-only — install is web's only return
              mechanism (web has no notifications) and losers were excluded.
              The internal hook still gates on already-installed, installed-ever
              (iOS Safari reopen edge case from EE3), display-mode standalone,
              install-affordance available, and a 30-day dismiss cooldown. */}
          <InstallBanner />
        </div>
      )}

      {state.status === "playing" && (
        <div className="wd-keyboard">
          {WORDLE_KB_ROWS.map((row, ri) => (
            <div className="wd-kb-row" key={ri}>
              {row.map((k) => {
                const isAction = k === "DEL";
                const st = isAction ? null : getWordleKeyState(k, state.guesses, answer);
                const cls = isAction ? `wd-key wd-key-action` : `wd-key wd-key-${st || "idle"}`;
                // Append the key's revealed state so SR users get the same
                // feedback the colors carry (medical accessibility).
                const stDesc = st === "green" ? ", correct" : st === "yellow" ? ", wrong position" : st === "grey" ? ", not in the name" : "";
                return (
                  <button key={k} className={cls} onClick={() => handleKey(k)} aria-label={k === "DEL" ? "Delete last letter" : `${k}${stDesc}`}>
                    {k === "DEL" ? "⌫" : k}
                  </button>
                );
              })}
            </div>
          ))}
          <button className="wd-key-enter" onClick={() => handleKey("ENTER")} aria-label="Enter key — submit guess">ENTER</button>
        </div>
      )}
    </div>
  );
});

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
  useEffect(() => { perfMark('AppInner mounted'); }, []);
  const { user, profile: authProfile, isGuest, exitGuestMode, openAuthPrompt } = useAuth();
  const [screen, setScreen] = useState("home");
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
      if (sp.get("game") === "footle") return true;
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
        try { localStorage.setItem("biq_pending_join", fromUrl); } catch {}
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
      if (stored) return normalizeJoinCode(stored);
    } catch {}
    return null;
  });
  const clearPendingJoin = useCallback(() => {
    setPendingJoinCode(null);
    try { localStorage.removeItem("biq_pending_join"); } catch {}
  }, []);

  // 1.1 async "beat my Daily 7" challenge. A friend's link is balliq.app/?c=
  // SCORE.YYYYMMDD[.Name]. We capture it on launch (web/SPA), persist it, and
  // strip the query so a refresh doesn't re-trigger. Only USED if it's for
  // today (Daily 7 is deterministic per day) and the user hasn't played yet;
  // the head-to-head compare fires when they finish. (Native deep-linking into
  // the installed app needs an AASA path entry — follow-up; web handles it now.)
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
        try { const u = new URL(window.location.href); u.searchParams.delete("c"); window.history.replaceState({}, "", u.pathname + u.search + u.hash); } catch {}
        const challenge = parseChallengeStr(raw);
        if (challenge) {
          try { localStorage.setItem("biq_pending_challenge", JSON.stringify(challenge)); } catch {}
          return challenge;
        }
      }
      const stored = localStorage.getItem("biq_pending_challenge");
      if (stored) return JSON.parse(stored);
    } catch {}
    return null;
  });
  const clearChallenge = useCallback(() => {
    setPendingChallenge(null);
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
            try { localStorage.setItem('biq_pending_join', code); } catch {}
            setPendingJoinCode(code);
          }
          return;
        }
        // 1.1: async challenge deep link — balliq.app/c/SCORE.YYYYMMDD[.Name]
        const cm = u.pathname.match(/^\/c\/([^/?#]+)/);
        if (cm) {
          const ch = parseChallengeStr(cm[1]);
          if (ch) {
            try { localStorage.setItem('biq_pending_challenge', JSON.stringify(ch)); } catch {}
            setPendingChallenge(ch);
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
    const defaults = { hints:true, timer:true, sound:false, haptics:true };
    try {
      const raw = localStorage.getItem("biq_settings");
      if (raw) { const p = JSON.parse(raw); if (p && typeof p === "object") return { ...defaults, ...p }; }
    } catch {}
    return defaults;
  });
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

  const [iqHistory, setIqHistory] = useState(() => {
    try {
      const raw = localStorage.getItem("biq_iq_history");
      if (raw) { const p = JSON.parse(raw); if (Array.isArray(p)) return p; }
    } catch {}
    return [];
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
  const [showBallIQIntro, setShowBallIQIntro] = useState(false);
  const [showFirstQuizTip, setShowFirstQuizTip] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showKnownIssues, setShowKnownIssues] = useState(false);
  const [iqRecap, setIqRecap] = useState(null); // { iq, date } or null
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
  // Single cleanup on unmount: clear any in-flight toast/overlay timers so
  // tabbing away mid-toast doesn't leave dangling setState callbacks.
  useEffect(() => () => {
    if (levelUpTimerRef.current) clearTimeout(levelUpTimerRef.current);
    if (streakToastTimerRef.current) clearTimeout(streakToastTimerRef.current);
    celebrationTimeoutsRef.current.forEach(clearTimeout);
    celebrationTimeoutsRef.current = [];
  }, []);
  const [toast, setToast] = useState(null);

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
        } else newStreak = 1;
        result = {
          lastDay: todayNum,
          streak:  newStreak,
          best:    Math.max(prevBest, newStreak),
          ticked:  prevLastDay !== todayNum,
          shieldSaved,
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
      }));
    } catch {}
    setLoginStreak(result.streak);
    setBestLoginStreak(result.best);
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

  // Phase G: fires once per AppInner mount (or when user.id transitions
  // for in-flight loading sessions). No race with hydrate because hydrate
  // no longer reads or writes login_streak — the server-side RPC is the
  // single source of truth for signed-in users.
  useEffect(() => {
    tickLoginStreak();
  }, [tickLoginStreak]);

  // Detect day rollover while the app stays open. dailyDone / dailyScore were
  // hydrated from yesterday's localStorage key on mount; without this effect a
  // user who leaves the tab open past midnight would still see the "already
  // done" toast until they reload. Polls once a minute (cheap, well under the
  // resolution that matters here). After the date flips we also rebuild
  // dailyHistory from localStorage so the Daily tab calendar surfaces the
  // freshly-completed previous day immediately.
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
    let lastKey = dayKey();
    let pendingTick = false;
    const earnRolloverTick = () => {
      if (document.visibilityState !== "visible") return;
      // Re-check the date here rather than trusting the poller to have set
      // pendingTick: timers do NOT run while the app is backgrounded (iOS
      // suspends the webview, browsers freeze the tab), so on the suspend-
      // across-midnight path — the single most common way this fires — the
      // poller never observed the flip and resume order is
      // visibilitychange → earnRolloverTick → pendingTick still false.
      const cur = dayKey();
      if (cur !== lastKey) { lastKey = cur; pendingTick = true; }
      if (!pendingTick) return;
      pendingTick = false;
      tickLoginStreak();
    };
    const onVisibility = () => { if (document.visibilityState === "visible") earnRolloverTick(); };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pointerdown", earnRolloverTick, { passive: true });
    window.addEventListener("keydown", earnRolloverTick);
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
      // Phase G: re-tick login streak on day rollover so users who keep the
      // app open across midnight get the streak credit + toast for the new
      // day, same as if they'd reopened the app — but only once they actually
      // use it (see earnRolloverTick above).
      pendingTick = true;
      // 1.1: re-anchor the reminder window to the new "today" (offset 0) so a
      // post-midnight completion cancels the correct reminder id (listened for
      // in the notifications section).
      try { window.dispatchEvent(new CustomEvent('biq:day-rollover')); } catch {}
    }, 60_000);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointerdown", earnRolloverTick);
      window.removeEventListener("keydown", earnRolloverTick);
    };
  }, [tickLoginStreak]);


  const setProfile = useCallback((updater) => {
    setProfileState(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      safeSetItem("biq_profile", JSON.stringify(next));
      return next;
    });
  }, []);

  const todayKey = useMemo(() => keyForDate(new Date()), []);
  const [dailyHistory, setDailyHistory] = useState({});
  const [activeDailyDate, setActiveDailyDate] = useState(null);
  const [activeClub, setActiveClub] = useState(null);
  const [activeLeague, setActiveLeague] = useState(null);

  const toastTimerRef = useRef(null);
  const showToast = useCallback((msg, duration = 2800) => {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, duration);
  }, []);

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
      clearChallenge();
    }
  }, [pendingChallenge, dailyDone, dailyScore, showToast, clearChallenge]);

  // Question report — a one-tap "report a problem" on the answer reveal writes to
  // question_reports (RPC-only) so we can re-check flagged items. We always thank
  // the player even if the write fails — the point is to defuse "this is wrong"
  // frustration in-app rather than have it become a 1-star review.
  const reportQuestion = useCallback((info) => {
    supabase.rpc("report_question", {
      p_question_id: info?.id != null ? String(info.id) : null,
      p_question_text: info?.q || "(unknown)",
      p_picked: info?.picked ?? null,
      p_correct: info?.correct ?? null,
      p_mode: info?.mode ?? null,
      p_reason: null,
    }).catch((e) => { try { console.warn("report_question failed", e); } catch {} });
    showToast("Thanks — we'll double-check this one ⚽");
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
    {
      const idlePrefetch = () => { try { prefetchQuestions(); } catch {} };
      if (typeof requestIdleCallback === 'function') requestIdleCallback(idlePrefetch, { timeout: 3000 });
      else setTimeout(idlePrefetch, 1200);
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
      const raw = localStorage.getItem("biq_iq_history");
      if (raw !== null) setIqHistory(JSON.parse(raw));
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
    // Load persisted settings
    try {
      const raw = localStorage.getItem("biq_settings");
      if (raw !== null) {
        const s = JSON.parse(raw);
        setSettings(s);
        if (s.defaultDiff) setDiff(s.defaultDiff === "med" ? "medium" : s.defaultDiff);
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
        .then(() => {});
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
    const catStats = { ...(stats.catStats || {}) };
    for (const ans of (newResult.allAnswers || [])) {
      if (!ans || !ans.cat) continue;
      const cur = catStats[ans.cat] || { c: 0, a: 0 };
      catStats[ans.cat] = { c: cur.c + (ans.isCorrect ? 1 : 0), a: cur.a + 1 };
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
      supabase.from('scores').insert({
        user_id: user.id,
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
      }).then(({ error }) => {
        if (error) {
          console.error("[score save]", error?.message || "Unknown error");
          Sentry.captureException(error, { tags: { area: 'score-save' } });
          showToast("⚠️ Score didn't save — check your connection");
        }
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

      // "balliq_confirmed" is only used as a transient signal from the
      // intro modal — store it as plain "balliq" so every downstream check
      // (results routing, history save, share card, best-IQ toast) works.
      // Online Multiplayer requires a real account — guests have no userId
      // to host or join rooms. Block before any state transition so the home
      // screen doesn't briefly flash and the OnlineEntry never mounts.
      if (m === "online" && (!user || isGuest)) {
        openAuthPrompt("online");
        return;
      }
      setMode(m === "balliq_confirmed" ? "balliq" : m);
      if (m === "online") { setScreen("online-stage1"); return; }
      if (m === "local") { setScreen("local-setup"); return; }
      if (m === "clubquiz") { setScreen("club-quiz"); return; }
      if (m === "leaguequiz") { setScreen("league-quiz"); return; }
      // Reset category for special modes that ignore it
      if (m === "balliq" || m === "daily" || m === "survival" || m === "legends" || m === "speed" || m === "hotstreak" || m === "wc2026" || m === "truefalse" || m === "chaos") setCat("All");
      if (m === "daily" && dailyDone) {
        showToast(`📅 Already done today — ${dailyScore}/7, come back tomorrow`);
        return;
      }
      let qs = [];
      if (m === "balliq") { setShowBallIQIntro(true); return; }
      if (m === "balliq_confirmed") { qs = await getBallIQQuestions(); }
      else if (m === "daily") { qs = await getDailyQs(); setActiveDailyDate(new Date()); }
      else if (m === "survival") { qs = await getQs({ cat: "All", diff, n: 300, includeLegends: true }); }
      else if (m === "legends") { qs = await getQs({ cat: "Legends", diff, n: 10 }); }
      else if (m === "speed") { qs = await getQs({ cat: "All", diff: "medium", n: 5 }); }
      else if (m === "hotstreak") { qs = ((await getQs({ cat: "All", diff, n: 999 })) || []).filter(q => q.type !== "tf"); }
      else if (m === "wc2026") {
        const { QB_WC2026 } = await loadQuestions();
        if (QB_WC2026.length < 5) {
          showToast("Not enough questions available for this mode");
          return;
        }
        const fresh = applySeenFilter(QB_WC2026, 15, qbHistKey);
        qs = seededShuffle([...fresh], Date.now()).slice(0, 15).map(q => ({ ...q, _histKey: qbHistKey(q) }));
      }
      else if (m === "truefalse") { qs = await getTrueFalseQs(); }
      else if (m === "chaos") {
        // Chaos: quotes / moments / madness. Pull any QB row tagged chaos
        // (cat === "chaos" OR tag === "chaos"), ignore difficulty, shuffle 10.
        const { QB_CHAOS } = await loadQuestions();
        if (QB_CHAOS.length < 5) {
          showToast("Not enough questions available for this mode");
          return;
        }
        const fresh = applySeenFilter(QB_CHAOS, 10, qbHistKey);
        qs = shuffle([...fresh]).slice(0, 10).map(q => ({ ...q, _histKey: qbHistKey(q) }));
      }
      else { qs = await getQs({ cat, diff, n: 10, ramp: true }); }
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
          const verified = QB.filter(q => q && q.club === qbName && q.type === "mcq" && Array.isArray(q.o));
          // Club quizzes are for die-hard fans — never serve "easy" (casual-obvious
          // or telegraphed). Fall back to the full pool only if a club is too thin
          // on medium+hard to fill 10 (none currently are; thinnest is ~16).
          const noEasy = verified.filter(q => q.diff !== "easy");
          const clubPool = noEasy.length >= 10 ? noEasy : verified;
          if (clubPool.length >= 10) {
            // Same 14-day seen filter League Quiz applies — without it a club
            // pool of ~20 serves immediate repeats while fresh rows sit unused.
            const freshPool = applySeenFilter(clubPool, 10, qbHistKey);
            qs = shuffle([...freshPool]).slice(0, 10).map(q => {
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
      const pool = QB.filter(q => q && q.cat === catKey && q.type === "mcq" && Array.isArray(q.o));
      // League quizzes are for invested fans — never serve "easy". Fall back to
      // the full pool only if the no-easy pool can't fill 10 (none currently).
      const noEasy = pool.filter(q => q.diff !== "easy");
      const gradedPool = noEasy.length >= 10 ? noEasy : pool;
      if (gradedPool.length < 10) { showToast("No questions yet for this competition"); return; }
      const fresh = applySeenFilter(gradedPool, 10, qbHistKey);
      const qs = shuffle([...fresh]).slice(0, 10).map(q => {
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
      if (!clubSlug && !quizSlug && !gameSlug && !stumpId) return;
      try {
        const u = new URL(window.location.href);
        u.searchParams.delete("club"); u.searchParams.delete("quiz"); u.searchParams.delete("game"); u.searchParams.delete("stump");
        window.history.replaceState({}, "", u.pathname + u.search + u.hash);
      } catch {}
      if (gameSlug === "footle") { setScreen("wordle"); return; }
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
  useEffect(() => {
    const goHome = () => { setScreen("home"); setTab("home"); };
    window.addEventListener("biq:go-home", goHome);
    return () => window.removeEventListener("biq:go-home", goHome);
  }, []);

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
      scheduleReminderWindow({ skipToday: playedToday });
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
  }, [dailyDone, showToast, user?.id]);

  // Soft pre-prompt: ask in-app BEFORE spending the one-shot iOS prompt. Caps at
  // 2 lifetime asks (after the first daily, then again at a 3-day streak if the
  // user declined). Only shows while the OS permission is still undecided.
  const maybePromptNotif = useCallback(async () => {
    if (!notificationsSupported()) return;
    try {
      if (localStorage.getItem('biq_notif_enabled') === '1') return;
      const asks = parseInt(localStorage.getItem('biq_notif_asks') || '0', 10);
      if (asks >= 2) return;
      const perm = await getNotifPermission();
      if (perm !== 'prompt' && perm !== 'prompt-with-rationale') return;
      localStorage.setItem('biq_notif_asks', String(asks + 1));
      setNotifPromptOpen(true);
    } catch { /* noop */ }
  }, []);

  // (Re)schedule the rolling window on open + whenever today's play state
  // changes (finishing Daily 7 flips dailyDone → reschedule with skipToday).
  useEffect(() => {
    if (!notifEnabled) return;
    const ws = readWordleTodayStatus();
    const playedToday = dailyDone || ws.kind === 'won' || ws.kind === 'lost';
    scheduleReminderWindow({ skipToday: playedToday });
  }, [notifEnabled, dailyDone]);

  // Shared XP award: local level math + persist + level-up celebration +
  // atomic remote delta for signed-in users. Extracted from handleComplete so
  // Footle (via the biq:daily-completed event) feeds the same economy
  // (opportunity-scan #3). MUST be declared ABOVE the daily-completed effect
  // below — its dep array reads this const during render (TDZ crash caught by
  // the e2e verify on first build).
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
          setLevelUpOverlay({ name: newInfo.level.name, icon: newInfo.level.icon }); haptic("levelup"); playSound("levelup");
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
      maybePromptNotif();
      // Footle XP (scan #3). ONLY for game:'footle' — the Daily 7 also fires
      // this event and already earns XP via handleComplete; awarding here for
      // it too would double-pay. Footle's dispatch happens exactly once per
      // day (the won/lost transition), so no dedup guard is needed.
      if (e?.detail?.game === 'footle') {
        awardXp(getFootleXP(e.detail.won === true, e.detail.guesses));
        // Footle wrote NOTHING to `scores` until now — its only trace was the
        // wordle_state jsonb. So the most-played mode, the one that owns every
        // long streak, was invisible in the only table anyone would query, and
        // "what do people actually play?" had no answer. Same dispatch that
        // pays XP: fires once per day by construction, so no dedup guard.
        // score/total are guesses-used out of 6 — a loss is 6/6, matching the
        // shape of every other row (correct out of attempted).
        if (user?.id) {
          const used = Math.min(e.detail.guesses || 6, 6);
          supabase.from('scores').insert({
            user_id: user.id,
            game_mode: 'footle',
            score: e.detail.won === true ? used : 0,
            correct_answers: e.detail.won === true ? 1 : 0,
            total_questions: 1,
          }).then(({ error }) => {
            if (error) {
              console.warn('[footle score]', error.message);
              Sentry.captureException(error, { tags: { area: 'footle-score' } });
            }
          });
        }
      }
    };
    window.addEventListener('biq:daily-completed', onDailyDone);
    return () => window.removeEventListener('biq:daily-completed', onDailyDone);
  }, [maybePromptNotif, awardXp, user?.id]);

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
    const onRollover = () => { scheduleReminderWindow({ skipToday: false }); };
    window.addEventListener('biq:day-rollover', onRollover);
    return () => window.removeEventListener('biq:day-rollover', onRollover);
  }, [notifEnabled]);

  const handleComplete = useCallback((res) => {
    // Don't pollute stats with BallIQ (different total) or daily (counted separately)
    if (mode !== "balliq") saveStats(res);

    // Milestone celebrations
    const newTotal = (stats.gamesPlayed || 0) + 1;
    if (newTotal === 10) showToast("🎉 10 games played, you're on a roll");
    else if (newTotal === 50) showToast(`🔥 50 games — serious ${APP_NAME} energy`);
    else if (newTotal === 100) showToast(`🏆 100 games — you're a ${APP_NAME} legend`);
    else if (newTotal % 25 === 0 && newTotal > 10) showToast(`⚡ ${newTotal} games played, keep going`);

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
    const willAskNativeReview = hadGreatMoment && newTotal >= 5 && mode !== "daily";
    if (willAskNativeReview) {
      celebrationTimeoutsRef.current.push(setTimeout(() => { maybeRequestReview(); }, 3500));
    }

    // 🏅 PERSONAL BEST celebration — only for standard quiz modes (not daily/balliq)
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

    // 🏆 BALL IQ new high
    if (mode === "balliq" && res.iq && res.iq > (stats.bestIQ || 0)) {
      const isFirst = !stats.bestIQ;
      celebrationTimeoutsRef.current.push(setTimeout(() => showToast(isFirst ? `🧠 Your ${APP_NAME}: ${res.iq}!` : `🧠 New ${APP_NAME} high: ${res.iq}!`), TIMINGS.ANSWER_REVEAL));
      haptic("hardCorrect");
    }

    // 💪 SURVIVAL new best (wrong answers = 0 means they only died on one)
    if (mode === "survival" && res.score && res.score > (stats.bestSurvival || 0) && res.score >= 10) {
      celebrationTimeoutsRef.current.push(setTimeout(() => showToast(`💪 New Survival record — ${res.score} questions`), 1400));
      setStats(p => ({...p, bestSurvival: res.score}));
    }

    // Rate prompt — show once after 5+ games with a good score. On native we
    // defer to the native review sheet above (don't double-ask); on web, where
    // that sheet no-ops, this App Store link is the only ask, so keep it.
    const shouldShowRate = !ratePromptShown
      && stats.gamesPlayed >= 4
      && res.score >= 9
      && mode === "classic"
      && !(IS_NATIVE && willAskNativeReview);
    if (shouldShowRate) {
      setRatePromptShown(true);
      safeSetItem("biq_rate_shown", "1");
      celebrationTimeoutsRef.current.push(setTimeout(() => { setRateView("ask"); setShowRatePrompt(true); }, 1800));
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
        && parseInt(localStorage.getItem('biq_notif_asks') || '0', 10) < 2;
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
        celebrationTimeoutsRef.current.push(setTimeout(() => { try { openAuthPrompt?.('save'); } catch {} }, 2000));
      }
    } catch { /* nudge is never load-bearing */ }

    // Award XP
    const earned = getXPForResult(res.score, res.total, mode === "speed" ? "classic" : mode);
    awardXp(earned);

    // Save BallIQ history (last 7 scores) + best IQ in stats
    if (mode === "balliq") {
      const iq = calcBallIQ(res.score, res.total);
      try {
        const raw = localStorage.getItem("biq_profile");
        if (raw !== null) setProfileState(JSON.parse(raw));
      } catch {}
      try {
        const hist = (() => { try { const raw = localStorage.getItem("biq_iq_history"); return raw !== null ? JSON.parse(raw) : []; } catch { return []; } })();
        const updated = [...hist, { iq, date: Date.now() }].slice(-7);
        safeSetItem("biq_iq_history", JSON.stringify(updated));
      } catch {}
      setStats(prev => {
        const updated = { ...prev, bestIQ: Math.max(prev.bestIQ || 0, iq) };
        safeSetItem("biq_stats", JSON.stringify(updated));
        return updated;
      });
    }

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
  }, [mode, stats, loginStreak, cat, ratePromptShown, todayKey, hotstreakBest, saveStats, showToast, activeDailyDate, questions, pendingChallenge, clearChallenge, awardXp, isGuest, openAuthPrompt, xp]);

  const updateSettings = useCallback((patch) => {
    setSettings(prev => {
      const updated = { ...prev, ...patch };
      safeSetItem("biq_settings", JSON.stringify(updated));
      return updated;
    });
    // Apply defaultDiff immediately
    if (patch.defaultDiff) setDiff(patch.defaultDiff === "med" ? "medium" : patch.defaultDiff);
  }, []);

  const shareScore = useCallback(async (score, total, mode, extras = {}) => {
    // Per-mode plaintext fallback (used only when the image share path
    // fails). Game-result focused — no profile bits.
    const pct = total ? Math.round(score / total * 100) : 0;
    const beat = "Can you beat me? ⚽";
    // opportunity-scan #1: deep-link recipients into the app — and for
    // club/league results, into the exact quiz they were just beaten at.
    const clubSlug = extras?.club ? PACK_TO_CLUB_SLUG[extras.club] : null;
    const quizSlug = extras?.league ? CAT_TO_QUIZ_SLUG[extras.league] : null;
    const deepLink = clubSlug ? `/play?club=${clubSlug}` : quizSlug ? `/play?quiz=${quizSlug}` : "/play";
    const url = `balliq.app${deepLink}`;
    const msgs = {
      daily: (() => {
        const dots = Array.from({length: total}, (_, i) => i < score ? '🟢' : '🔴').join('');
        return `⚽ ${APP_NAME} — Daily 7\n${dots}\n${score}/${total} correct · ${pct}% accuracy\n${beat}\n${url}`;
      })(),
      balliq: (() => {
        const iq = calcBallIQ(score, total);
        const label = iqLabel(iq);
        return `🧠 ${APP_NAME} Test\nMy ${APP_NAME}: ${iq}\n${label}\n${score}/${total} correct · ${pct}% accuracy\n${beat}\n${url}`;
      })(),
      classic: (() => {
        const medal = pct === 100 ? '🏆' : pct >= 80 ? '🔥' : pct >= 60 ? '⚽' : '😅';
        return `${medal} ${APP_NAME} — Classic Quiz\n${score}/${total} correct · ${pct}% accuracy\n${beat}\n${url}`;
      })(),
      speed:     `⚡ ${APP_NAME} — Speed Round\n${score}/${total} correct · ${pct}% accuracy\n${beat}\n${url}`,
      survival:  `🔥 ${APP_NAME} — Survival\n${score} in a row before missing one\n${beat}\n${url}`,
      hotstreak: `⚡🔥 ${APP_NAME} — Hot Streak\n${score} correct in 60 seconds (${total} answered)\n${beat}\n${url}`,
      truefalse: `✅ ${APP_NAME} — True or False\n${score}/${total} correct · ${pct}% accuracy\n${beat}\n${url}`,
      legends:   `📜 ${APP_NAME} — Legends & History\n${score}/${total} correct · ${pct}% accuracy\n${beat}\n${url}`,
      wc2026:    `🌍 ${APP_NAME} — International\n${score}/${total} correct · ${pct}% accuracy\n${beat}\n${url}`,
      local:     `🤝 ${APP_NAME} — Local Multiplayer\nFinal scores in — settle it on the rematch.\n${beat}\n${url}`,
      chaos:     `🎭 ${APP_NAME} — Chaos\n${score}/${total} correct · ${pct}% accuracy\n${beat}\n${url}`,
    };
    const text = msgs[mode] || msgs.classic;

    // Couch multiplayer (mode "local"): players rotate through ONE shared
    // question list, so there is no per-player score/total fraction — the
    // standard image card would render a bogus "0/0 · 0% accuracy". Share the
    // podium plaintext directly instead of a card.
    if (mode === "local") {
      try {
        if (IS_NATIVE) {
          await CapShare.share({ title: APP_NAME, text, dialogTitle: "Share result" });
          return;
        }
        if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
          await navigator.share({ title: APP_NAME, text });
          return;
        }
      } catch (err) {
        if (err && (err.name === "AbortError" || /cancel/i.test(err?.message || ""))) return;
      }
      try {
        await navigator.clipboard.writeText(text);
        showToast("Copied to clipboard 📋");
      } catch {}
      return;
    }

    // Pick the right card variant + payload for shareCard.
    const MODE_LABELS = {
      classic: "Classic Quiz",
      daily: "Daily 7",
      survival: "Survival",
      hotstreak: "Hot Streak",
      truefalse: "True or False",
      balliq: `${APP_NAME} Test`,
      speed: "Speed Round",
      legends: "Legends & History",
      wc2026: "International",
      local: "Local Multiplayer",
      chaos: "Chaos Quiz",
    };
    let cardType = "standard";
    let cardData;
    if (mode === "balliq") {
      const iq = calcBallIQ(score, total);
      cardType = "balliq";
      cardData = { iq, label: iqLabel(iq) };
    } else if (mode === "hotstreak") {
      cardType = "hotstreak";
      cardData = { score };
    } else {
      // Club/league quizzes run under mode:"classic" — surface the tribal
      // identity ("Arsenal Quiz — 9/10") instead of a generic Classic label;
      // the club/league name is the single most shareable element.
      const packLabel = extras?.club && CLUB_PACKS[extras.club] ? `${CLUB_PACKS[extras.club].name} Quiz`
        : extras?.league && LEAGUE_QUIZ_BY_CAT[extras.league] ? `${LEAGUE_QUIZ_BY_CAT[extras.league].name} Quiz`
        : null;
      cardData = {
        modeLabel: packLabel || MODE_LABELS[mode] || "Quiz",
        score,
        total,
        streak: extras?.streak,
      };
    }
    cardData = { ...cardData, deepLink };
    await shareCard(cardType, cardData, { onToast: showToast, textFallback: text });
  }, [showToast]);

  const shareProfile = useCallback(async () => {
    // 1.1: share a balliq.app/p?... LINK that renders the player's Ball IQ card as
    // its Open Graph preview (server-rendered via /api/og). On iMessage a single
    // image FILE attaches but iOS strips the caption/link off it — a URL instead
    // gives a tappable link AND a rich card preview across iMessage/WhatsApp/
    // Twitter/Slack. Requires balliq.app to be deployed with api/og + api/p.
    const { level } = getLevelInfo(xp);
    const iq = stats.bestIQ || 0;
    const correct = stats.totalCorrect || 0;
    const answered = stats.totalAnswered || 0;
    const accuracy = (answered === 0 || correct > answered) ? "—" : `${Math.round(100 * correct / answered)}%`;
    const card = computeCard(stats.catStats || {}, (answered > 0 && correct <= answered) ? correct / answered : 0.4);
    const params = new URLSearchParams({
      n: (() => {
        // Prefer the server username (where the set name actually lives) over the
        // local profile.name, mirroring the Home greeting — otherwise a signed-in
        // user's card shows "<App> Player" instead of their name.
        const isDef = (nm) => !nm || nm === "Player" || /^player_/i.test(nm);
        const u = authProfile?.username;
        if (u && !isDef(u)) return u;
        if (profile.name && !isDef(profile.name)) return profile.name;
        return `${APP_NAME} Player`;
      })(),
      l: level.name || "",
      li: level.icon || "⚽",
      x: String(xp || 0),
      g: String(stats.gamesPlayed || 0),
      s: String(loginStreak || 0),
      a: accuracy,
      e: profile.avatar || "⚽",
      iq: String(iq || 0),
      ov: String(card.overall),
      ti: card.tier,
      r: card.ratings.map(x => x.rating).join(","),
    });
    const avatarUrl = authProfile?.avatar_url;
    if (avatarUrl) params.set("img", avatarUrl);
    const url = `https://balliq.app/p?${params.toString()}`;
    const text = `Can you beat me at ${APP_NAME}? ⚽`;
    try {
      if (IS_NATIVE) {
        await CapShare.share({ title: APP_NAME, text, url, dialogTitle: "Share your profile" });
        return;
      }
      if (navigator.share) { await navigator.share({ title: APP_NAME, text, url }); return; }
      if (navigator.clipboard) { await navigator.clipboard.writeText(`${text} ${url}`); showToast("Link copied 📋"); return; }
    } catch (e) {
      if (e && (e.name === "AbortError" || /cancel/i.test(e?.message || ""))) return; // user dismissed the sheet
      try { if (navigator.clipboard) { await navigator.clipboard.writeText(`${text} ${url}`); showToast("Link copied 📋"); } } catch {}
    }
  }, [xp, stats, profile, loginStreak, showToast, authProfile]);

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
    setIqHistory([]);
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
    setIqHistory([]);
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

  // Sprint #64 FF2: toggle body.in-focused-play during quiz / Footle so the
  // desktop-browser landing chrome (top nav + bottom features/signup grid
  // from index.html) hides while the user is mid-game. Empty deps on
  // unmount cleanup so navigating away always strips the class. The
  // matching CSS rule lives in the AppInner css string further down.
  useEffect(() => {
    const playing = inGame || screen === "wordle";
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
    if (!user || isGuest) { openAuthPrompt("online"); return { ok: false, error: "" }; }
    const trimmed = String(rawCode || "").trim().toUpperCase();
    if (trimmed.length !== 6) return { ok: false, error: "Enter the 6-character room code" };
    const result = await mpJoinRoom({
      p_code: trimmed,
      p_name: (authProfile?.username || profile?.name || "Player"),
      p_avatar: "⚽",
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
  }, [user, isGuest, authProfile?.username, profile?.name, openAuthPrompt]);

  // Stable callbacks for memoized children
  const goHome = useCallback(() => {
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
  }, []);
  // Wordmark "Home" handler — wired to the mobile .logo and the BiqNav
  // brand. If the user is currently in a Stage 1 multiplayer room,
  // confirm before bailing so we don't accidentally orphan their seat.
  // Calls leave_room directly (bypassing MultiplayerLobby's actions.leave)
  // since we need to clean up before the screen-state change unmounts the
  // hook. Other players see the resulting room_players DELETE event.
  const handleHomeClick = useCallback(async () => {
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
  const challengeFriend = useCallback((friend) => {
    // Seamless challenge: auto-create a room and drop the challenger straight
    // into the lobby AS HOST (the same one-tap path the Home/Online "Create
    // room" buttons use). Stash the friend's id so that once the room's code is
    // known (onLobbyEnter) we fire an in-app play_invite notification to them —
    // they'll see it in their bell/inbox with a one-tap Join. The share link in
    // the lobby remains as a fallback for non-friends / older clients.
    // (setPendingInviteFriendId is defined below; referenced only in the body,
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
  const closeFriendProfile = useCallback(() => {
    setScreen("home");
    setTab("profile");
    setViewingFriendId(null);
  }, []);

  // ── Notification center (Phase 1: friend requests) ──────────────────────
  // Surfaces INCOMING pending friend requests globally (a bell + badge + inbox
  // overlay) using the EXISTING friendships table — no new schema. Accept/Decline
  // flip the same status column FriendsSection uses. The badge count is simply
  // the number of pending incoming requests, so it self-clears as they're
  // actioned — no read-state to persist. Play-invites (which need a server
  // record) and native push land in later phases alongside a generic
  // notifications table. Guests have no friendships, so this stays empty for them.
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifRequests, setNotifRequests] = useState([]);   // incoming friend requests (from friendships)
  const [notifInvites, setNotifInvites] = useState([]);     // play invites (from notifications table)
  const loadNotifs = useCallback(async () => {
    if (!user?.id) { setNotifRequests([]); setNotifInvites([]); return; }
    // Friend requests — incoming pending rows from friendships.
    try {
      const cols = "id,requester_id,requester:profiles!requester_id(id,username,avatar:avatar_id)";
      const { data } = await supabase
        .from("friendships")
        .select(cols)
        .eq("addressee_id", user.id)
        .eq("status", "pending")
        .limit(50);
      setNotifRequests(Array.isArray(data) ? data : []);
    } catch { /* soft-fail: the bell just shows no badge */ }
    // Play invites — unread rows from the notifications table (v1_3 migration).
    try {
      const { data } = await supabase
        .from("notifications")
        .select("id,type,actor_name,actor_avatar,payload,created_at")
        .eq("user_id", user.id)
        .eq("read", false)
        .order("created_at", { ascending: false })
        .limit(50);
      setNotifInvites(Array.isArray(data) ? data : []);
    } catch { /* table may not exist yet on older deploys — soft-fail */ }
  }, [user?.id]);
  useEffect(() => { loadNotifs(); }, [loadNotifs]);
  // Refresh when the tab regains focus (an event may have arrived while away).
  // Cheap indexed queries; no realtime dependency (free-tier realtime doesn't
  // reliably deliver postgres_changes — see the Stage-1 spike notes).
  useEffect(() => {
    const onFocus = () => loadNotifs();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadNotifs]);
  // Interval poll while signed in + tab visible (2026-07-16). Free-tier realtime
  // doesn't deliver postgres_changes, and focus-only refresh means the bell stays
  // silent for a friend request / play invite that arrives while the app is open
  // and focused. A cheap 30s indexed re-fetch closes that gap on web — the only
  // delivery channel until native APNs banners land in build 45. Skips guests and
  // pauses when hidden so it costs nothing in the background.
  useEffect(() => {
    if (!user?.id || isGuest) return;
    const id = setInterval(() => {
      if (typeof document === "undefined" || document.visibilityState === "visible") loadNotifs();
    }, 30000);
    return () => clearInterval(id);
  }, [user?.id, isGuest, loadNotifs]);
  const notifCount = notifRequests.length + notifInvites.length;
  const respondFriendRequest = useCallback(async (id, accept) => {
    setNotifRequests(prev => prev.filter(r => r.id !== id)); // optimistic
    try {
      await supabase.from("friendships").update({ status: accept ? "accepted" : "declined" }).eq("id", id);
      showToast(accept ? "✓ Friend added" : "Request declined");
    } catch {
      showToast("Couldn't update — try again");
      loadNotifs();
    }
  }, [showToast, loadNotifs]);
  // Play-invite actions. Join sets pendingJoinCode — the auto-join effect above
  // then routes into the lobby. Both mark the notification read so it clears.
  const joinInvite = useCallback(async (inv) => {
    const code = inv?.payload?.code;
    setNotifInvites(prev => prev.filter(n => n.id !== inv.id)); // optimistic
    setNotifOpen(false);
    try { await supabase.from("notifications").update({ read: true }).eq("id", inv.id); } catch { /* best-effort */ }
    if (code) setPendingJoinCode(String(code).toUpperCase());
    else showToast("This invite's room has expired");
  }, [showToast]);
  const dismissInvite = useCallback(async (inv) => {
    setNotifInvites(prev => prev.filter(n => n.id !== inv.id)); // optimistic
    try { await supabase.from("notifications").update({ read: true }).eq("id", inv.id); } catch { /* best-effort */ }
  }, []);
  // A specific friend can be invited to play: challengeFriend stashes their id;
  // once the auto-created room's code is known (onLobbyEnter) we fire the invite.
  const [pendingInviteFriendId, setPendingInviteFriendId] = useState(null);
  const sendPlayInvite = useCallback(async (addresseeId, code) => {
    if (!addresseeId || !code) return;
    try { await supabase.rpc("send_play_invite", { p_addressee: addresseeId, p_code: code }); }
    catch { /* soft-fail: the share link in the lobby still works as a fallback */ }
  }, []);
  const openNotifs = useCallback(() => { setNotifOpen(true); loadNotifs(); }, [loadNotifs]);
  const openPrivacy = useCallback(() => setShowPrivacy(true), []);
  const closePrivacy = useCallback(() => setShowPrivacy(false), []);
  const openHelp = useCallback(() => setShowHelp(true), []);
  const closeHelp = useCallback(() => setShowHelp(false), []);
  const openKnownIssues = useCallback(() => setShowKnownIssues(true), []);
  const closeKnownIssues = useCallback(() => setShowKnownIssues(false), []);
  const openIqChip = useCallback(() => {
    // Empty history → send them straight into the APP_NAME Test.
    // Otherwise show a recap of their most recent score with share options.
    if (!iqHistory || iqHistory.length === 0) {
      startMode("balliq");
      return;
    }
    haptic("soft");
    setIqRecap(iqHistory[iqHistory.length - 1]);
  }, [iqHistory, startMode]);
  const closeIqRecap = useCallback(() => setIqRecap(null), []);
  const retakeIqTest = useCallback(() => startMode("balliq"), [startMode]);
  const playDaily = useCallback(() => startMode("daily"), [startMode]);
  const suggestMode = useCallback((m) => { startMode(m); }, [startMode]);
  // 1.1 streak freeze: shields now AUTO-protect a missed day (consumed in
  // tickLoginStreak for guests / the tick_login_streak RPC for signed-in users),
  // so the old manual "Use Shield" action is gone — spending one by hand would
  // just waste it. The Daily-tab banner is now informational (shieldCount).
  const shareDaily = useCallback(async () => {
    // Daily share is intentionally TEXT-ONLY. Combined files+text shares strip
    // one or the other on iOS Safari → WhatsApp / Twitter / Instagram, and the
    // canvas→Blob path can silently fail. Plain text works universally.
    const score = dailyScore || 0;
    const total = 7;
    const dateStr = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    const grid = Array.from({ length: total }, (_, i) => i < score ? "✅" : "❌").join("");
    const streakLine = loginStreak > 0
      ? `🔥 ${loginStreak}-day streak`
      : "";
    // 1.1 async challenge: encode score + date (+ challenger name) into the
    // link so a friend who opens it sees "beat my X/7" on today's deterministic
    // Daily 7 and gets a head-to-head compare after they finish. Format:
    // balliq.app/?c=SCORE.YYYYMMDD[.Name]
    const ymd = (() => { const d = new Date(); return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`; })();
    const challengerName = (authProfile?.username && authProfile.username !== "Player" && !/^player_/i.test(authProfile.username))
      ? authProfile.username
      : ((profile?.name && profile.name !== "Player") ? profile.name : "");
    const challengeUrl = `${INVITE_BASE_URL}/c/${score}.${ymd}${challengerName ? "." + encodeURIComponent(challengerName).replace(/\./g, "%2E") : ""}`;
    const text = [
      `⚽ ${APP_NAME} Daily 7`,
      `📅 ${dateStr}`,
      `🎯 ${score}/${total}`,
      streakLine,
      "",
      grid,
      "",
      "Think you can beat me?",
      challengeUrl,
    ].filter(Boolean).join("\n");

    try {
      if (navigator.share) {
        await navigator.share({ text });
        return;
      }
    } catch {
      // User cancelled or share failed — fall through to clipboard
    }
    try {
      await navigator.clipboard.writeText(text);
      showToast("📋 Copied to clipboard");
    } catch {
      showToast("Couldn't share — try again");
    }
  }, [dailyScore, loginStreak, showToast, authProfile, profile]);
  const shieldCount = useMemo(() => Math.min(3, Math.max(0, Math.floor(xp/200) - (stats.shieldsUsed||0))), [xp, stats.shieldsUsed]);

  const [showDiffPicker, setShowDiffPicker] = useState(false);
  const [showFriendsPicker, setShowFriendsPicker] = useState(false);
  const diffPickerRef = useRef(null);
  const friendsPickerRef = useRef(null);
  const joinGateRef = useRef(null);
  // Sprint #68 JJ4: trap focus + ESC-to-close on the three pre-launch
  // bottom-sheet modals that previously had no a11y wiring.
  const ballIQIntroRef = useRef(null);
  const ratePromptRef = useRef(null);
  // Sprint #71 MM1: in-app confirm modal for "leave the multiplayer room?"
  // replaces a window.confirm() that rendered as the iOS native dialog.
  // pendingLeaveRoomRef carries the cleanup callback; null = closed.
  const [pendingLeaveRoom, setPendingLeaveRoom] = useState(null);
  const leaveRoomModalRef = useRef(null);
  const howToPlayRef = useRef(null);
  useModalA11y({ isOpen: showDiffPicker,    onClose: () => setShowDiffPicker(false),    ref: diffPickerRef });
  useModalA11y({ isOpen: showFriendsPicker, onClose: () => setShowFriendsPicker(false), ref: friendsPickerRef });
  useModalA11y({ isOpen: !!(pendingJoinCode && (!user || isGuest)), onClose: clearPendingJoin, ref: joinGateRef });
  useModalA11y({ isOpen: !!showBallIQIntro, onClose: () => setShowBallIQIntro(false), ref: ballIQIntroRef });
  useModalA11y({ isOpen: !!showRatePrompt, onClose: () => setShowRatePrompt(false), ref: ratePromptRef });
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
      if (inGame || screen === "wordle") {
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

  const startClassicWithDiff = useCallback(async (d) => {
    // Build a Classic game with the explicitly-chosen difficulty — don't rely
    // on the async setDiff → startMode closure, build the questions inline.
    setShowDiffPicker(false);
    haptic("soft");
    setDiff(d);
    setActiveClub(null);
    setActiveLeague(null);
    let qs;
    try {
      qs = await getQs({ cat: "All", diff: d, n: 10, ramp: true });
    } catch (e) {
      console.warn('[startClassicWithDiff]', e?.message || e);
      showToast("⚠️ Couldn't load questions — check your connection");
      return;
    }
    if (!qs || qs.length === 0) { showToast("No questions — try another difficulty"); return; }
    setMode("classic");
    setCat("All");
    setQuestions(qs);
    setScreen("quiz");
  }, [showToast]);

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
        <div className="sbar" />

        {/* ── ONBOARDING — shown to first-time users only. Deep-link boots
            defer it (deferOnboarding) so the shared moment renders first;
            the gate returns on the next organic Home visit. ── */}
        {!hasOnboarded && !deferOnboarding && (
          <OnboardingScreen
            onDone={() => {
              setHasOnboarded(true);
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
            onSaved={(name) => {
              setProfile(p => ({ ...(p || {}), name }));
              try { localStorage.removeItem('biq_needs_username'); } catch {}
              setNeedsUsername(false);
            }}
          />
        )}
        {/* BiqNav (desktop rail) renders during games too now — the handoff
            keeps the rail visible mid-quiz (active="none"). It's CSS-gated to
            >=1024 (display:none on mobile/PWA/native), so this is desktop-only;
            `active` is nulled mid-game so no tab highlights. */}
        <BiqNav
          onHomeClick={handleHomeClick}
          tab={tab}
          active={inGame || screen === "results" ? null : screen === "settings" ? "settings" : tab}
          setTab={setTab}
          setScreen={setScreen}
          dailyDone={dailyDone}
          showToast={showToast}
          notifCount={notifCount}
          onOpenNotifs={user ? openNotifs : undefined}
        />
        {!inGame && !(screen === "home" && tab === "home") && (
          <div className="hdr">
            {/* 1.1: drop the wordmark on the main tabbed view (screen==="home")
                — on a tab-bar app the app name on its own home is redundant, and
                the personalised greeting now owns the top. Settings has its own
                header; other sub-screens keep the brand mark as a home anchor. */}
            {/* 1.1: hide the global wordmark on screens that already have their
                own page-header (Settings, the online MP setup + lobby) — it just
                stacks a second identifier. (Broader sub-screen audit deferred.) */}
            {!["settings", "home", "online-stage1", "online-stage1-lobby", "club-quiz", "results", "local-setup", "local-results", "wordle", "daily-review", "puzzle-review", "review", "blocked-users", "friend-profile"].includes(screen) && (
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
                <button className="icon-btn hdr-ic" aria-label="Settings" onClick={() => setScreen("settings")}>⚙️</button>
              </div>
            )}
          </div>
        )}

        {/* Global toasts */}
        {toast && <div className="toast" role="status" aria-live="polite">{toast}</div>}

        {/* First-session tip. Was position:fixed over the mode grid it was
            meant to explain; now an inline card above the home content — with
            nothing to cover, the old bottom-sheet suppression guards and the
            .first-quiz-tip desktop re-anchoring class are both gone. Points at
            Footle rather than Daily 7. */}
        {showFirstQuizTip && !inGame && screen === "home" && tab === "home" && (
          <div style={{margin:"0 0 12px"}}>
            <div style={{background:"var(--accent)",color:"#0a1a00",borderRadius:14,padding:"14px 18px",boxShadow:"0 6px 24px rgba(88,204,2,0.3)",display:"flex",alignItems:"center",gap:12}}>
              <div style={{fontSize:28,lineHeight:1}}>⚽</div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:800,marginBottom:2}}>Welcome to {APP_NAME}!</div>
                <div style={{fontSize:12,fontWeight:500,opacity:0.85}}>Start with today's Footle — one puzzle, everyone gets the same player.</div>
              </div>
              <button onClick={() => { setShowFirstQuizTip(false); safeSetItem("biq_first_tip_shown","1"); }} style={{background:"rgba(0,0,0,0.2)",border:"none",borderRadius:22,minWidth:44,minHeight:44,width:44,height:44,fontSize:16,fontWeight:800,color:"#fff",cursor:"pointer",flexShrink:0}} aria-label="Dismiss tip">×</button>
            </div>
          </div>
        )}
        {/* APP_NAME Intro */}
        {showBallIQIntro && (
          <div style={{position:"fixed",top:0,right:0,bottom:0,left:0,inset:0,background:"rgba(0,0,0,0.8)",zIndex:997,display:"flex",alignItems:"flex-end"}} onClick={() => setShowBallIQIntro(false)}>
            <div ref={ballIQIntroRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={`About the ${APP_NAME} Test`} style={{width:"100%",maxHeight:"85vh",overflowY:"auto",WebkitOverflowScrolling:"touch",background:"var(--bg)",borderRadius:"20px 20px 0 0",padding:"28px 24px calc(48px + env(safe-area-inset-bottom, 34px))",textAlign:"center"}} onClick={e => e.stopPropagation()}>
              <div style={{fontSize:48,marginBottom:12}}>🧠</div>
              <div style={{fontSize:22,fontWeight:900,marginBottom:8,color:"var(--t1)"}}>{APP_NAME} Test</div>
              <div style={{display:"flex",justifyContent:"center",gap:12,marginBottom:20,flexWrap:"wrap"}}>
                {[["📋","15 questions"],["⏱️","No timer"],["🎯","MCQ only"],["📊","Get your IQ"]].map(([icon,label]) => (
                  <div key={label} style={{background:"var(--s2)",border:"1px solid var(--border)",borderRadius:10,padding:"8px 12px",fontSize:12,fontWeight:600,color:"var(--t2)",display:"flex",alignItems:"center",gap:4}}>
                    <span>{icon}</span><span>{label}</span>
                  </div>
                ))}
              </div>
              <div style={{fontSize:13,color:"var(--t2)",lineHeight:1.7,marginBottom:24}}>Answer 15 questions across all categories. Your score determines your {APP_NAME} — from 60 (beginner) to 160 (elite). The test is the same for everyone so scores are comparable.</div>
              <button className="btn btn-p" onClick={() => { setShowBallIQIntro(false); startMode("balliq_confirmed"); }}>Start Test 🧠</button>
              <button className="btn btn-s" style={{marginTop:8}} onClick={() => setShowBallIQIntro(false)}>Maybe later</button>
            </div>
          </div>
        )}
        {/* Rate prompt */}
        {showRatePrompt && (
          <div style={{position:"fixed",top:0,right:0,bottom:0,left:0,inset:0,background:"rgba(0,0,0,0.75)",zIndex:998,display:"flex",alignItems:"flex-end",animation:"fadeIn 0.3s ease"}} onClick={() => setShowRatePrompt(false)}>
            <div ref={ratePromptRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Rate Ball IQ" style={{width:"100%",maxHeight:"85vh",overflowY:"auto",WebkitOverflowScrolling:"touch",background:"var(--bg)",borderRadius:"20px 20px 0 0",padding:"28px 24px calc(48px + env(safe-area-inset-bottom, 34px))",textAlign:"center"}} onClick={e => e.stopPropagation()}>
              {rateView === "ask" ? (
                <>
                  <div style={{fontSize:48,marginBottom:12}}>⚽</div>
                  <div style={{fontSize:20,fontWeight:900,marginBottom:8,color:"var(--t1)"}}>Enjoying {APP_NAME}?</div>
                  <div style={{fontSize:14,color:"var(--t2)",lineHeight:1.7,marginBottom:24}}>We'd love to know how it's going for you.</div>
                  <button className="btn btn-p" style={{marginBottom:10}} onClick={() => setRateView("store")}>Loving it! 😄</button>
                  <button className="btn btn-s" onClick={() => {
                    setShowRatePrompt(false);
                    try { window.location.href = `mailto:hello@balliq.app?subject=${encodeURIComponent(APP_NAME + " feedback")}&body=${encodeURIComponent("What could be better?\n\n")}`; } catch {}
                    showToast("Thanks — tell us what we can fix 🙏");
                  }}>Not really</button>
                </>
              ) : (
                <>
                  <div style={{fontSize:48,marginBottom:12}}>⭐</div>
                  <div style={{fontSize:20,fontWeight:900,marginBottom:8,color:"var(--t1)"}}>Glad you're enjoying it!</div>
                  <div style={{fontSize:14,color:"var(--t2)",lineHeight:1.7,marginBottom:24}}>A quick rating helps other football fans find the app — and takes just 5 seconds!</div>
                  <button className="btn btn-p" style={{marginBottom:10}} onClick={() => {
                    setShowRatePrompt(false);
                    const ua = navigator.userAgent || "";
                    if (/iPhone|iPad|iPod|Macintosh/i.test(ua)) {
                      window.open(APP_STORE_URL, "_blank");
                    } else if (/Android/i.test(ua)) {
                      window.open(PLAY_STORE_URL, "_blank");
                    } else {
                      showToast(`⭐ Search '${APP_NAME}' on the App Store or Google Play`);
                    }
                  }}>Rate {APP_NAME} ⭐</button>
                  <button className="btn btn-s" onClick={() => setShowRatePrompt(false)}>Maybe later</button>
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
                style={{width:"100%",padding:14,background:"var(--accent)",color:"#0a1a00",border:"none",borderRadius:12,fontFamily:"inherit",fontSize:15,fontWeight:800,cursor:"pointer",marginBottom:8,WebkitTextFillColor:"#0a1a00"}}
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
        {notifPromptOpen && (
          <div
            style={{position:"fixed",inset:0,top:0,right:0,bottom:0,left:0,background:"rgba(0,0,0,0.6)",zIndex:1100,display:"flex",alignItems:"flex-end",justifyContent:"center"}}
            onClick={() => setNotifPromptOpen(false)}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{width:"100%",maxWidth:440,background:"var(--s1)",borderTopLeftRadius:20,borderTopRightRadius:20,border:"1px solid var(--border)",borderBottom:"none",padding:"24px 22px calc(24px + env(safe-area-inset-bottom))",boxShadow:"0 -8px 40px rgba(0,0,0,0.5)"}}
            >
              <div style={{fontSize:40,textAlign:"center",marginBottom:8}} aria-hidden="true">🔔</div>
              <div style={{fontSize:19,fontWeight:800,color:"var(--t1)",textAlign:"center",marginBottom:8,letterSpacing:"-0.3px"}}>Keep your streak alive</div>
              <div style={{fontSize:14,color:"var(--t2)",textAlign:"center",lineHeight:1.5,marginBottom:20}}>
                Get one friendly reminder each evening if you haven't played yet — never spammy, and you can turn it off anytime in Settings.
              </div>
              <button
                onClick={async () => { setNotifPromptOpen(false); await handleToggleNotif(true); }}
                style={{width:"100%",minHeight:48,padding:"14px",background:"var(--accent)",color:"#0a1a00",border:"none",borderRadius:14,fontFamily:"inherit",fontSize:16,fontWeight:800,cursor:"pointer",WebkitTextFillColor:"#0a1a00",marginBottom:8}}
              >
                Yes, remind me
              </button>
              <button
                onClick={() => setNotifPromptOpen(false)}
                style={{width:"100%",minHeight:44,padding:"12px",background:"none",color:"var(--t3)",border:"none",fontFamily:"inherit",fontSize:15,fontWeight:600,cursor:"pointer"}}
              >
                Not now
              </button>
            </div>
          </div>
        )}

        {levelUpOverlay && (
          <div style={{position:"fixed",top:0,right:0,bottom:0,left:0,inset:0,background:"rgba(0,0,0,0.85)",zIndex:999,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",animation:"fadeIn 0.3s ease"}}>
            <Confetti />
            <div style={{textAlign:"center",padding:"0 32px"}}>
              <div style={{fontSize:80,marginBottom:16,animation:"iconPop 0.6s cubic-bezier(0.34,1.56,0.64,1)"}}>{levelUpOverlay.icon}</div>
              <div style={{fontSize:14,color:"var(--gold)",fontWeight:700,letterSpacing:0.3,marginBottom:8}}>Level Up!</div>
              <div style={{fontSize:32,fontWeight:900,color:"#fff",letterSpacing:"-0.5px",marginBottom:12}}>{levelUpOverlay.name}</div>
              <div style={{fontSize:14,color:"rgba(255,255,255,0.6)"}}>Keep playing to reach the next level</div>
            </div>
            <button onClick={() => setLevelUpOverlay(null)} style={{marginTop:40,padding:"12px 32px",background:"var(--accent)",color:"#0a1a00",border:"none",borderRadius:24,fontSize:15,fontWeight:700,cursor:"pointer"}}>Let's Go ⚽</button>
          </div>
        )}
        {streakToast && <div className="streak-toast" role="status" aria-live="polite"><span>🔥</span><span><strong>{streakToast} day streak!</strong> Keep it up</span></div>}

        {/* ── CLASSIC DIFFICULTY SHEET ── */}
        {showDiffPicker && (
          <div className="diff-overlay" onClick={() => setShowDiffPicker(false)}>
            <div ref={diffPickerRef} tabIndex={-1} className="diff-sheet" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
              <div className="diff-sheet-title">Choose Difficulty</div>
              <div className="diff-sheet-sub">10 questions, 20 seconds each</div>
              <div className="diff-options">
                {[
                  { id:"easy",   icon:"🌱", name:"Easy",   desc:"Gentle warm-up questions" },
                  { id:"medium", icon:"⚽", name:"Medium", desc:"Balanced challenge — a solid test" },
                  { id:"hard",   icon:"🧠", name:"Hard",   desc:"Deep knowledge — some typed answers" },
                ].map(opt => (
                  <button
                    key={opt.id}
                    className={`diff-option${opt.id === "medium" ? " default" : ""}`}
                    onClick={() => startClassicWithDiff(opt.id)}
                  >
                    <span className="diff-option-icon">{opt.icon}</span>
                    <div className="diff-option-body">
                      <div className="diff-option-name">{opt.name}</div>
                      <div className="diff-option-desc">{opt.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

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
              setShowDiffPicker={setShowDiffPicker}
              shareCard={shareCard}
              challenge={(pendingChallenge && challengeDayOffset(pendingChallenge.date) <= 1 && !dailyDone) ? pendingChallenge : null}
              onPlayChallenge={playDaily}
              onDismissChallenge={clearChallenge}
              setOnlineAutoCreate={setOnlineAutoCreate}
              notifCount={notifCount}
              onOpenNotifs={user ? openNotifs : undefined}
            />
            </TabErrorBoundary>
          </div>
        )}

        {/* ── DAILY TAB ── */}
        {!inGame && screen === "home" && (
          <div className="tab-pane" style={tab === "daily" ? undefined : HIDDEN_STYLE}>
            <TabErrorBoundary name="daily">
            {/* Home's 🔥 and Daily's 🔥 show DIFFERENT numbers on purpose, and
                that's the open question — not a wiring bug. Home renders
                loginStreak (days you OPENED the app, owned by tickLoginStreak);
                Daily renders its own `unbeaten` run (days you PLAYED a puzzle).
                Both are labelled "day streak" under the same flame, which is
                what actually confuses people. Passing loginStreak down here
                would make them agree by downgrading Daily to count opens —
                a product decision, so it's Alex's call, not a silent prop. */}
            <DailyTabScreen
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
              avatarEmoji={profile.avatar || "⚽"}
            />
            </TabErrorBoundary>
          </div>
        )}

        {/* ── PROFILE TAB ── */}
        {!inGame && screen === "home" && (
          <div className="tab-pane" style={tab === "profile" ? undefined : HIDDEN_STYLE}>
            <TabErrorBoundary name="profile">
            <React.Suspense fallback={<div className="tab-pane" />}>
              <ProfileScreen profile={profile} setProfile={setProfile} stats={stats} xp={xp} loginStreak={loginStreak} bestLoginStreak={bestLoginStreak} level={levelInfo.level} earnedBadges={earnedBadges} onShareProfile={shareProfile} onToast={showToast} onChallenge={challengeFriend} onOpenFriend={openFriendProfile} nameEditNonce={nameEditNonce} />
            </React.Suspense>
            </TabErrorBoundary>
          </div>
        )}

        {/* ── SETTINGS SCREEN ── */}
        {!inGame && screen === "settings" && <SettingsScreen settings={settings} onUpdate={updateSettings} onClearStats={clearStats} onClearSeen={clearSeen} onBack={goHome} onShowPrivacy={openPrivacy} onShowHelp={openHelp} onShowKnownIssues={openKnownIssues} onAccountDeleted={onAccountDeleted} onOpenReview={() => setScreen("review")} onShowBlocked={() => setScreen("blocked-users")} notifEnabled={notifEnabled} onToggleNotif={handleToggleNotif} notifSupported={notificationsSupported()} />}
        {!inGame && screen === "blocked-users" && (
          <React.Suspense fallback={<div className="tab-pane" />}>
            <BlockedUsersScreen onBack={() => setScreen("settings")} onToast={showToast} />
          </React.Suspense>
        )}

        {/* ── QUESTION-BANK REVIEW (gated) ── */}
        {!inGame && screen === "review" && (
          <React.Suspense fallback={<div className="tab-pane" />}>
            <ReviewScreen onBack={() => setScreen("settings")} />
          </React.Suspense>
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
          <React.Suspense fallback={<div className="tab-pane" />}>
            <FriendProfileScreen
              friendId={viewingFriendId}
              onBack={closeFriendProfile}
              onChallenge={challengeFriend}
              onToast={showToast}
            />
          </React.Suspense>
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
        {pendingJoinCode && (!user || isGuest) && (
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
              <div style={{fontSize:48,marginBottom:10}} aria-hidden="true">🎮</div>
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
                  style={{width:"100%",padding:14,background:"var(--accent)",color:"#0a1a00",border:"none",borderRadius:12,fontFamily:"inherit",fontSize:15,fontWeight:800,cursor:"pointer",WebkitTextFillColor:"#0a1a00",marginBottom:8}}
                >
                  📲 Got the app? Open it there
                </button>
              )}
              <button
                onClick={() => { try { openAuthPrompt?.('online'); } catch {} }}
                style={IS_IOS_WEB
                  ? {width:"100%",padding:12,background:"var(--s2)",color:"var(--text)",border:"1px solid var(--border)",borderRadius:12,fontFamily:"inherit",fontSize:14,fontWeight:600,cursor:"pointer",marginBottom:8}
                  : {width:"100%",padding:14,background:"var(--accent)",color:"#0a1a00",border:"none",borderRadius:12,fontFamily:"inherit",fontSize:15,fontWeight:800,cursor:"pointer",WebkitTextFillColor:"#0a1a00",marginBottom:8}}
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

        {/* ── IQ RECAP OVERLAY ── */}
        {iqRecap && <IqRecapOverlay entry={iqRecap} onClose={closeIqRecap} onRetake={retakeIqTest} />}

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
          <React.Suspense fallback={<div className="screen" />}>
            <OnlineEntry
              onBack={() => { clearPendingJoin(); setOnlineAutoCreate(false); setPendingInviteFriendId(null); goHome(); setTab("online"); }}
              onLobbyEnter={(c) => {
                setStage1RoomCode(c);
                setScreen("online-stage1-lobby");
                // Challenge flow: fire the play_invite to the stashed friend now
                // that the room code exists, then clear the pending target.
                if (pendingInviteFriendId) { sendPlayInvite(pendingInviteFriendId, c); setPendingInviteFriendId(null); }
              }}
              defaultName={authProfile?.username || profile?.name || ""}
              autoJoinCode={pendingJoinCode}
              onAutoJoinConsumed={clearPendingJoin}
              autoCreate={onlineAutoCreate}
              onAutoCreateConsumed={() => setOnlineAutoCreate(false)}
            />
          </React.Suspense>
          </div>
        )}
        {screen === "online-stage1-lobby" && stage1RoomCode && (
          <div className="mp-cap">
          <React.Suspense fallback={<div className="screen" />}>
            <MultiplayerLobby
              key={stage1RoomCode}
              code={stage1RoomCode}
              onExit={() => { setStage1RoomCode(""); setScreen("home"); setTab("online"); }}
              defaultName={authProfile?.username || profile?.name || ""}
              onRematch={(c) => setStage1RoomCode(c)}
            />
          </React.Suspense>
          </div>
        )}

        {/* ── FOOTBALL WORDLE ── */}
        {screen === "wordle" && <FootballWordle onBack={goHome} userId={user?.id} onHowToPlay={openFootleRules} onPlayDaily={dailyDone ? undefined : playDaily} />}
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
            {mode === "balliq" && (
              <div style={{marginTop:14,marginBottom:4}}>
                <div style={{fontSize:10,fontFamily:"'Inter',sans-serif",color:"var(--accent)",fontWeight:500,letterSpacing:0.2,marginBottom:4}}>{APP_NAME} Test · 20 Questions</div>
                <div style={{fontSize:13,color:"var(--t2)"}}>Mixed difficulty — answer as many as you can</div>
              </div>
            )}
            {mode === "legends" && (
              <div style={{marginTop:14,marginBottom:4,textAlign:"center",padding:"10px 0 6px",background:"linear-gradient(135deg,rgba(251,191,36,0.08),rgba(251,191,36,0.03))",borderRadius:12,border:"1px solid rgba(251,191,36,0.15)"}}>
                <div style={{fontSize:10,fontFamily:"'Inter',sans-serif",color:"var(--gold)",fontWeight:700,letterSpacing:0.3,marginBottom:4}}>📜 Legends & History</div>
                <div style={{fontSize:12,color:"var(--t3)",fontStyle:"italic"}}>Take your time. These are the stories that made the game.</div>
              </div>
            )}
            {mode === "chaos" && (
              <div style={{marginTop:14,marginBottom:4,textAlign:"center",padding:"10px 0 6px",background:"linear-gradient(135deg,rgba(88,204,2,0.10),rgba(255,106,0,0.06))",borderRadius:12,border:"1px solid rgba(88,204,2,0.22)"}}>
                <div style={{fontSize:10,fontFamily:"'Inter',sans-serif",color:"#8AE042",fontWeight:700,letterSpacing:0.3,marginBottom:4}}>🎭 Chaos</div>
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
              onBack={() => { if(mode==="daily"){setScreen("home");setTab("daily");}else{setScreen("home");setTab("home");} }}
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
            iqHistory={iqHistory}
            wrongAnswers={wrongAnswers}
            askedQuestions={questions}
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
            onRetry={() => startMode(mode)}
            // Daily results primary CTA: same navigation the Daily tab uses.
            onPlayFootle={() => setScreen("wordle")}
          />
        )}

        {/* ── TAB BAR ── */}
        {!inGame && screen === "home" && (
          <nav className="tab-bar">
            {[
              { id:"home",     Icon: Home,         label:"Home"    },
              { id:"online",   Icon: Globe,        label:"Online"  },
              { id:"daily",    Icon: CalendarDays, label:"Daily",  badge: !dailyDone },
              { id:"profile",  Icon: User,         label:"Profile" },
            ].map(({ id, Icon, label, badge }) => (
              <button key={id} className={`tab-item${tab===id?" active":""}`} aria-current={tab===id ? "page" : undefined} onClick={() => { haptic("soft"); setTab(id); }}>
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
