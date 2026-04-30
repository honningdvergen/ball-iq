import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useAuth } from './useAuth.jsx';
import { supabase } from './supabase.js';
import Login from './Login.jsx';
import ReviewScreen from './ReviewScreen.jsx';
import { DesktopNav } from './DesktopNav.jsx';
import { QB, TF_STATEMENTS } from './questions.js';

// Gated reviewer email — only this account sees the Settings → Review entry
// and can reach the review screen. Server-side RLS on question_review is the
// real security; this is just UI hiding.
const REVIEWER_EMAIL = "alexbo99@hotmail.no";

// ─── STORAGE SHIM ─────────────────────────────────────────────────────────────
// Provides window.storage API using localStorage as fallback when deployed.
// This ensures game progress persists across sessions on Vercel/mobile.
if (typeof window !== 'undefined' && !window.storage) {
  window.storage = {
    get: async (key) => {
      try {
        const value = localStorage.getItem(key);
        return value !== null ? { key, value } : null;
      } catch { return null; }
    },
    set: async (key, value) => {
      try {
        localStorage.setItem(key, String(value));
        return { key, value };
      } catch { return null; }
    },
    delete: async (key) => {
      try {
        localStorage.removeItem(key);
        return { key, deleted: true };
      } catch { return null; }
    },
    list: async (prefix) => {
      try {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (!prefix || k.startsWith(prefix)) keys.push(k);
        }
        return { keys, prefix };
      } catch { return { keys: [] }; }
    },
  };
}

// ─── APP META ─────────────────────────────────────────────────────────────────
// Single source of truth for the version string — surfaced in Settings → About.
// Bump on every shipping release.
const APP_VERSION = "1.0.0-beta";
const APP_NAME = "Ball IQ";

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



// Post-QB normalization: give Chaos questions a default diff of "medium" so the
// standard difficulty filters (easy/medium/hard buckets, ramp, APP_NAME) treat
// them as first-class citizens. Chaos mode's own cat/tag filter still catches
// them regardless of diff, so there's no collision.
for (const q of QB) {
  if (q && q.cat === "chaos" && !q.diff) q.diff = "medium";
}

// Pre-bucketed QB slices for the modes that pull a fixed subset on launch.
// QB is a module-level const that never mutates after this point, so building
// these once at module load is strictly better than re-filtering 3700+ rows
// every time the user taps the mode tile (or every render, if anything ever
// drifts onto the render path).
const QB_WC2026 = QB.filter(q => q && q.tag === "wc2026");
const QB_CHAOS  = QB.filter(q => q && (q.cat === "chaos" || q.tag === "chaos"));

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
  const fresh = pool.filter(q => {
    const k = toKey(q);
    return !k || !seen.has(k);
  });
  if (fresh.length >= needed) return fresh;
  if (import.meta.env.DEV) {
    console.log("[seen] pool exhausted for this category — serving full pool");
  }
  return pool;
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


function getQs({ cat, diff, n = 10, ramp = false }) {
  // Defensive: strip out any undefined entries that might exist from array holes
  let pool = QB.filter(q => q && typeof q === "object");
  // Category match: primary q.cat OR league-tagged chaos questions (q.league === cat)
  // so e.g. the Eden Hazard ball-boy chaos question (league:"PL") shows up in a
  // Premier League quiz alongside regular PL entries.
  if (cat && cat !== "All") pool = pool.filter(q => q.cat === cat || q.league === cat);
  // Honesty over silence: if a category has nothing to offer, return empty
  // so the caller can show a "not enough questions" toast. If we have some
  // but fewer than `n`, return the shuffled pool — better to play 7 real
  // Ligue 1 questions than a 10-pack secretly padded with other leagues.
  if (pool.length < 5) {
    return [];
  }
  if (diff === "easy") pool = pool.filter(q => q.diff === "easy" && (q.type === "mcq" || q.type === "tf"));
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
    const easy = pick("easy", 3);
    const med  = pick("medium", 4);
    const hard = pick("hard", 3);
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

function seededShuffle(arr, seed) {
  // Fast seeded shuffle using mulberry32 PRNG — no indexOf, O(n) not O(n²)
  let s = seed >>> 0;
  const prng = () => { s ^= s << 13; s ^= s >> 17; s ^= s << 5; return (s >>> 0) / 4294967296; };
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getBallIQQuestions() {
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

function dateToYMD(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
function keyForDate(date) { return `biq_daily_${dateToYMD(date)}`; }
function dayIndexForDate(date) {
  // Use UTC midnight of the local date so the seed is stable across timezones
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / TIMINGS.DAY_MS);
}

function getDailyQsForDate(date) {
  // MCQ only for daily — consistent experience, no typed surprises
  const seed = dayIndexForDate(date);
  const mcqOnly = QB.filter(q => q.type === "mcq");
  const sorted = [...mcqOnly].sort((a, b) => {
    const sa = Math.sin(seed * 2654435769 + mcqOnly.indexOf(a) * 1013904223) - 0.5;
    const sb = Math.sin(seed * 2654435769 + mcqOnly.indexOf(b) * 1013904223) - 0.5;
    return sa - sb;
  });
  // Hide questions seen within the last 14 days (falls back to full pool if < 7 remain)
  const filtered = applySeenFilter(sorted, 7, qbHistKey);
  return filtered.slice(0, 7).map(q => {
    const histKey = qbHistKey(q);
    const indices = [0,1,2,3].slice(0, q.o.length);
    const sh = shuffle(indices);
    return { ...q, o: sh.map(i => q.o[i]), a: sh.indexOf(q.a), _histKey: histKey };
  });
}
function getDailyQs() { return getDailyQsForDate(new Date()); }


// Keyword match table used to surface league-relevant TF_STATEMENTS when the
// user picks "True or False" from the League Quiz mode sheet. Matching is a
// case-insensitive substring against the statement text. If fewer than 10
// league-specific statements match, the launcher falls back to the general pool.
const LEAGUE_TF_KEYWORDS = {
  PL: ["premier league", "manchester united", "manchester city", "liverpool", "arsenal", "chelsea", "tottenham", "leicester", "newcastle", "everton", "west ham", "aston villa"],
  LaLiga: ["la liga", "real madrid", "barcelona", "atletico madrid", "atlético madrid", "sevilla", "valencia", "real sociedad", "villarreal"],
  Bundesliga: ["bundesliga", "bayern munich", "borussia dortmund", "dortmund", "leverkusen", "leipzig", "schalke", "bayer"],
  SerieA: ["serie a", "juventus", "ac milan", "inter milan", "napoli", " roma", "lazio", " milan"],
  Ligue1: ["ligue 1", "psg", "paris saint-germain", "marseille", "lyon", "saint-étienne", "saint-etienne", "monaco", "lille", "bordeaux", "nice"],
  UCL: ["champions league", "european cup"],
};

function getTrueFalseQs() {
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

function iqPercentile(iq) {
  // Numeric percentile aligned with the iqPercentileLabel buckets below
  // (155+ → top 1%, 145 → top 3%, …). Used for the BallIQResults ring
  // and any numeric "Better than X%" rendering.
  if (iq >= 155) return 99;
  if (iq >= 145) return 97;
  if (iq >= 135) return 92;
  if (iq >= 125) return 85;
  if (iq >= 115) return 75;
  if (iq >= 105) return 60;
  if (iq >= 95)  return 45;
  if (iq >= 85)  return 30;
  return 15;
}

function iqPercentileLabel(iq) {
  // Football-culture rank labels — fun, descriptive, and crucially they make
  // no statistical claim. The earlier "Top X% of football fans" version was
  // pulled because the buckets weren't derived from real user data, which
  // risked falling foul of App Store guideline 2.3 (Accurate Metadata).
  if (iq >= 155) return "You are José Mourinho 👑";
  if (iq >= 150) return "Pronounces Bruno Fernandes like BROO-no Fer-NANDSH 🇵🇹";
  if (iq >= 145) return "Clearly plays Football Manager ⌨️";
  if (iq >= 140) return "Smarter than most football pundits 📺";
  if (iq >= 135) return "Could manage in the Championship 🧠";
  if (iq >= 130) return "Could manage a League Two side ⚽";
  if (iq >= 125) return "Watches the U21s for fun 🔭";
  if (iq >= 120) return "Knows every Champions League anthem word 🎵";
  if (iq >= 115) return "Has a favourite lesser-known league 🌍";
  if (iq >= 110) return "Argues about the offside rule correctly 📐";
  if (iq >= 105) return "Watches Match of the Day till the end 📺";
  if (iq >= 100) return "Solid pub quiz teammate ⚽";
  if (iq >= 95)  return "Watches El Clasico but skips the League Cup 👀";
  if (iq >= 90)  return "Still know more than my dad 😅";
  if (iq >= 85)  return "Calls it soccer sometimes 😬";
  if (iq >= 80)  return "Still learning the offside rule 😬";
  if (iq >= 75)  return "Thought Zidane was a manager first 😂";
  return "Asked if Ronaldo plays for Brazil 💀";
}

const IQ_LABELS = [
  { min: 155, label: "You are José Mourinho 👑" },
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
  { min: 90,  label: "Still know more than my dad 😅" },
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

// ─── GAME ROOMS (online multiplayer backend) ─────────────────────────────────
// Supabase-backed persistence for multiplayer rooms. Before this, rooms lived
// in localStorage via the window.storage shim — which meant Player A's room
// was invisible to Player B's device and every join returned "Room not found".
// Expected Supabase schema (public.game_rooms):
//   code         text primary key
//   host_name    text not null
//   guest_name   text
//   questions    jsonb not null
//   host_score   int  default 0
//   guest_score  int  default 0
//   created_at   timestamptz default now()
// RLS: enable select/insert/update for the `authenticated` and/or `anon` role.
// Pull every field off a Supabase/PostgREST error object so we never lose the
// real reason (column missing, RLS denial, schema-cache mismatch, etc.).
function _fullRoomErr(e) {
  if (!e) return null;
  const out = {};
  for (const k of ['message','code','details','hint','status','statusCode','name','error','body','cause']) {
    try { if (e[k] !== undefined) out[k] = e[k]; } catch {}
  }
  try { for (const k of Object.getOwnPropertyNames(e)) if (out[k] === undefined) out[k] = e[k]; } catch {}
  return out;
}

// ─── ONLINE GAME ROOM HELPERS ────────────────────────────────────────────────
// All writes target a single game_rooms row keyed on `code`. Realtime drives
// every UI transition: clients subscribe to UPDATE events and react to the
// fields that changed. The schema is documented in the SQL migration shipped
// alongside this file.

async function gameRoomCreate({ code, hostId, hostName }) {
  const row = {
    code,
    status: 'waiting',
    host_id: hostId,
    host_name: hostName,
    guest_id: null,
    guest_name: null,
    questions: [],
    host_answers: [],
    guest_answers: [],
    host_score: 0,
    guest_score: 0,
    current_question: 0,
    host_finished: false,
    guest_finished: false,
    mode: 'classic',
    difficulty: 'medium',
  };
  const { data, error } = await supabase.from('game_rooms').insert(row).select().single();
  if (error) console.error("[room] create failed", error?.message || "Unknown error");
  return { data, error };
}

async function gameRoomGet(code) {
  const { data, error } = await supabase.from('game_rooms').select('*').eq('code', code).maybeSingle();
  if (error) console.error("[room] get failed", error?.message || "Unknown error");
  return { data, error };
}

// Atomic guest-seat claim. Filters on status=waiting AND guest_id IS NULL so
// two simultaneous joiners can't both win the seat.
async function gameRoomJoin({ code, guestId, guestName }) {
  const { data, error } = await supabase
    .from('game_rooms')
    .update({ guest_id: guestId, guest_name: guestName, status: 'lobby' })
    .eq('code', code)
    .eq('status', 'waiting')
    .is('guest_id', null)
    .select()
    .maybeSingle();
  if (error) console.error("[room] join failed", error?.message || "Unknown error");
  return { data, error };
}

// Host-only: write the chosen mode + question set, flip status to playing.
async function gameRoomStart({ code, mode, questions }) {
  const { data, error } = await supabase
    .from('game_rooms')
    .update({
      status: 'playing',
      mode,
      questions,
      current_question: 0,
      host_answers: [],
      guest_answers: [],
      host_score: 0,
      guest_score: 0,
      host_finished: false,
      guest_finished: false,
    })
    .eq('code', code)
    .select()
    .maybeSingle();
  if (error) console.error("[room] start failed", error?.message || "Unknown error");
  return { data, error };
}

// Each player writes their own answers + score with a single update. When
// the player has answered the last question, finished=true is included so
// the opposite client sees them transition.
async function gameRoomSubmitAnswer({ code, isHost, answers, score, finished }) {
  const patch = isHost
    ? { host_answers: answers, host_score: score, host_finished: !!finished }
    : { guest_answers: answers, guest_score: score, guest_finished: !!finished };
  const { error } = await supabase.from('game_rooms').update(patch).eq('code', code);
  if (error) console.error("[room] submit failed", error?.message || "Unknown error");
  return { error };
}

// Move the room into the terminal state — only the host calls this, either
// when both players have finished or when the 60s grace window expires after
// the first finisher.
async function gameRoomMarkFinished(code) {
  const { error } = await supabase.from('game_rooms').update({ status: 'finished' }).eq('code', code);
  if (error) console.error("[room] mark finished failed", error?.message || "Unknown error");
  return { error };
}

// NOTE: game_rooms rows persist after a game finishes; the opener's realtime
// channel may still be reading the row when the other player's game ends, so
// deleting from the client would race. Instead OnlineLobby's mount effect
// calls the cleanup_old_game_rooms RPC (server-side, atomic, 24h TTL) on each
// entry into the lobby.

const LETTERS = ["A","B","C","D"];
const CAT_LABELS = {
  WorldCup:"World Cup", Euros:"Euros", UCL:"Champions League",
  PL:"Premier League", LaLiga:"La Liga", Bundesliga:"Bundesliga",
  SerieA:"Serie A", Managers:"Managers", Records:"Records & Icons",
  Legends:"Legends & History"
};
const CATS = ["All","WorldCup","Euros","UCL","PL","LaLiga","Bundesliga","SerieA","Managers","Records","Legends"];



// ─── CSS ──────────────────────────────────────────────────────────────────────
const css = `
*{box-sizing:border-box;margin:0;padding:0;}

/* ── DARK THEME (default) ── */
:root{
  /* APP_NAME Dark — Option A: True neutral dark, Duolingo-proven accent */
  --bg:#0F1117;          /* near-black — neutral, no colour tint */
  --s1:#1A1D27;          /* cards — clean dark navy-grey */
  --s2:#22263A;          /* inset surfaces */
  --s3:#2C3050;          /* tertiary / pressed */
  --border:#2E3147;      /* subtle separator */
  --border2:#3A3F60;     /* stronger border */
  --text:#FFFFFF;        /* pure white — max contrast */
  --t2:#8B8FA8;          /* neutral muted */
  --t3:#4A4E68;          /* very muted */
  --accent:#22c55e;      /* Muted green — easier on the eyes than bright Duolingo */
  --accent-dim:rgba(34,197,94,0.10);
  --accent-b:rgba(34,197,94,0.28);
  --green:#22c55e;
  --green-l:rgba(34,197,94,0.10);
  --red:#FF4B4B;         /* Duolingo red — energetic */
  --red-l:rgba(255,75,75,0.10);
  --gold:#FFC800;        /* Duolingo gold — warm and celebratory */
  --gold-l:rgba(255,200,0,0.10);
  --info:#3B82F6;        /* Tailwind blue-500 — info / locked-in indicator */
  --r:14px;
  --sh:0 2px 12px rgba(0,0,0,0.5),0 1px 3px rgba(0,0,0,0.3);
  --sh-lg:0 8px 40px rgba(0,0,0,0.6),0 2px 8px rgba(0,0,0,0.3);
}

/* ── LIGHT THEME ── */
.light{
  /* iOS system palette — clean, airy, premium */
  background:#F2F2F7;
  color:#1C1C1E;
  --bg:#F2F2F7;
  --s1:#FFFFFF;
  --s2:#F2F2F7;
  --s3:#E5E5EA;
  --border:#E5E5EA;
  --border2:#C7C7CC;
  --text:#1C1C1E;
  --t1:#1C1C1E;
  --t2:#48484A;          /* darker secondary — readable on white */
  --t3:#6E6E73;          /* darker tertiary — readable on white */
  --accent:#34A853;
  --accent-dim:rgba(52,168,83,0.10);
  --accent-b:rgba(52,168,83,0.25);
  --info:#2563EB;        /* Tailwind blue-600 — slightly darker for contrast on light bg */
  --green:#34C759;
  --green-l:rgba(52,199,89,0.12);
  --red:#FF3B30;
  --red-l:rgba(255,59,48,0.09);
  --gold:#FF9500;       /* iOS system orange */
  --gold-l:rgba(255,149,0,0.09);
  --r:14px;
  --sh:0 1px 0 rgba(0,0,0,0.05),0 1px 6px rgba(0,0,0,0.07);
  --sh-lg:0 4px 20px rgba(0,0,0,0.10),0 1px 4px rgba(0,0,0,0.06);
}

/* ─── iOS-STYLE LIGHT OVERRIDES ─── */

/* All cards go borderless — shadow does the lifting */
.light .cta,
.light .mode-item,
.light .q-card,
.light .sbar-box,
.light .lcard,
.light .rc,
.light .settings-card,
.light .settings-panel,
.light .rc,
.light .sbox,
.light .pc,
.light .chip,
.light .icon-btn,
.light .back-btn {
  border:none;
  box-shadow:var(--sh);
}

/* Hover states — lift gently */
.light .cta:hover         { box-shadow:var(--sh-lg); }
.light .mode-item:hover   { box-shadow:var(--sh-lg); background:var(--s1); }
.light .chip:hover:not(.on){ background:var(--s1); }

/* Challenge CTA = white card */
.light .cta-challenge { background:var(--s1); }

/* Answer options — white base, grey hover */
.light .opt {
  border:none;
  box-shadow:var(--sh);
  background:var(--s1);
}
.light .opt:hover:not(:disabled){ background:var(--s3); box-shadow:var(--sh); }

/* iOS-style grouped settings: hairline separators inside white card */
.light .settings-card { border-radius:12px; overflow:hidden; }
.light .settings-row  { border-bottom:0.5px solid var(--border); }
.light .settings-row:last-child { border-bottom:none; }

/* Autocomplete */
.light .ac-list { box-shadow:var(--sh-lg); border:none; }

/* Toast */
.light .toast { border:none; box-shadow:var(--sh-lg); background:var(--s1); }

/* Text input */
.light .typed-inp { border:none; box-shadow:var(--sh); background:var(--s1); }
.light .typed-inp:focus { box-shadow:0 0 0 3px var(--accent-b),var(--sh); }

/* Mode icon bg */
.light .mi-icon { background:var(--s2); }
.light .app { background:var(--bg); }
.light .tab-bar { background:rgba(242,242,247,0.95); border-top:0.5px solid #D1D1D6; box-shadow:0 -1px 0 rgba(0,0,0,0.08); }
.light .tab-item.active .tab-icon { color:var(--accent); }
.light .tab-item .tab-label { color:var(--t2); }
.light .tab-item.active .tab-label { color:var(--accent); }
.light .mode-item { border:0.5px solid #E5E5EA; box-shadow:0 1px 4px rgba(0,0,0,0.06); }
.light .mode-item:hover { box-shadow:0 2px 12px rgba(0,0,0,0.10); }
.light .page-hdr { border-bottom:0.5px solid #E5E5EA; }
.light .q-card { box-shadow:0 2px 12px rgba(0,0,0,0.08); border:0.5px solid #E5E5EA; }
.light .rc { box-shadow:0 2px 16px rgba(0,0,0,0.08); border:0.5px solid #E5E5EA; }
.light .sbox { box-shadow:0 1px 4px rgba(0,0,0,0.06); }
.light .feedback.correct { background:rgba(52,199,89,0.12); border-color:rgba(52,199,89,0.3); }
.light .feedback.wrong { background:rgba(255,59,48,0.08); border-color:rgba(255,59,48,0.2); }
.light .opt { border:1px solid #E5E5EA; box-shadow:0 1px 3px rgba(0,0,0,0.06); }
.light .opt:hover:not(:disabled) { background:#F9F9F9; box-shadow:0 2px 8px rgba(0,0,0,0.10); border-color:#D1D1D6; }
.light .logo { color:#1C1C1E; }
.light .back-btn { background:#FFFFFF; border:0.5px solid #E5E5EA; color:#1C1C1E; box-shadow:0 1px 3px rgba(0,0,0,0.08); }
.light .xp-bar-track { background:#E5E5EA; }
.light .settings-panel { background:#FFFFFF; box-shadow:0 2px 12px rgba(0,0,0,0.08); }
.light .daily-hero { background:linear-gradient(135deg,#34A853,#2D9247); }
.light .daily-hero-title { color:#FFFFFF; }
.light .daily-hero-date { color:rgba(255,255,255,0.82); }
.light .daily-hero-sub { color:rgba(255,255,255,0.92); }
.light .badge-tile.locked { background:#F2F2F7; border-color:#E5E5EA; }
.light .badge-tile.earned { background:rgba(52,168,83,0.08); border-color:rgba(52,168,83,0.2); }

/* Eyebrow — full opacity in light */

/* Play CTA — vibrant green with warm shadow */
.light .cta-play { box-shadow:0 4px 20px rgba(48,168,85,0.28),0 1px 4px rgba(48,168,85,0.18); }
.light .cta-play:hover { box-shadow:0 6px 28px rgba(48,168,85,0.35),0 2px 6px rgba(48,168,85,0.20); }

/* Progress bar track */
.light .prog-track { background:var(--s3); }

/* Size/chip buttons in settings */
.light .size-btn { background:var(--s2); border:none; }
.light .size-btn.on { background:var(--accent); color:#fff; }

/* Correct/wrong opt states in light */
.light .opt.correct { border:1.5px solid var(--green); background:rgba(34,197,94,0.09); }
.light .opt.wrong   { border:1.5px solid var(--red); background:rgba(255,59,48,0.07); }

/* Smooth theme transitions */
.cta,.opt,.mode-item,.q-card,.settings-card,.settings-panel,.sbar-box,.rc,.sbox,.pc,.icon-btn,.back-btn,.chip,.typed-inp{
  transition:background 0.18s,border-color 0.15s,color 0.18s;
}
/* Global: kill the grey/white tap flash Safari draws on every tappable element. */
*{-webkit-tap-highlight-color:transparent;}
a{-webkit-tap-highlight-color:transparent;}
html,#root{background:var(--bg);min-height:100vh;min-height:100dvh;scroll-behavior:smooth;}
body{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif;background:var(--bg);color:var(--text);min-height:100vh;min-height:100dvh;-webkit-font-smoothing:antialiased;transition:color 0.18s;-webkit-overflow-scrolling:touch;scroll-behavior:smooth;overscroll-behavior-y:contain;}

/* ── DESIGN-SYSTEM UTILITIES ─────────────────────────────────────────── */
/* Numeric displays (scores, timers, IQ, streak counters). Tabular-nums prevents
   digit jitter. .numeric stays Inter for inline UI copy; .numeric-mono uses
   JetBrains Mono for timers and monospace numeric tickers. */
.numeric{font-variant-numeric:tabular-nums;font-weight:900;letter-spacing:-0.02em;}
.numeric-mono{font-family:'JetBrains Mono','SF Mono',ui-monospace,Menlo,monospace;font-variant-numeric:tabular-nums;font-weight:700;}

/* Eyebrow label — small uppercase pill-less header */
.ds-eyebrow{font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:var(--t3);font-family:'Inter',sans-serif;}

/* 3D "Duolingo" primary button — bright green face, darker rim, press translates Y.
   Use only for the signature primary CTA of a screen. Applied via the .btn-3d
   class so existing non-CTA greens stay on the toned-down accent (#22c55e). */
.btn-3d{position:relative;display:inline-flex;align-items:center;justify-content:center;gap:6px;width:100%;min-height:54px;padding:14px 20px;background:#58CC02;color:#0A0A0A;border:none;border-radius:14px;font-family:'Inter',sans-serif;font-size:16px;font-weight:800;letter-spacing:0.01em;cursor:pointer;transition:opacity 120ms ease,filter 120ms ease;-webkit-appearance:none;appearance:none;-webkit-text-fill-color:#0A0A0A;}
.btn-3d:hover{filter:brightness(1.06);}
.btn-3d:active,.btn-3d.is-pressed{opacity:0.85;}
.btn-3d:disabled{opacity:0.5;cursor:not-allowed;pointer-events:none;filter:none;}
.btn-3d:focus-visible{outline:3px solid rgba(88,204,2,0.4);outline-offset:2px;}
.btn-3d.amber{background:#FFC800;color:#3D2A00;-webkit-text-fill-color:#3D2A00;}
.btn-3d.amber:active,.btn-3d.amber.is-pressed{opacity:0.85;}
.btn-3d.dark{background:#242836;color:var(--t1);-webkit-text-fill-color:var(--t1);}
.btn-3d.dark:active,.btn-3d.dark.is-pressed{opacity:0.85;}
.btn-3d.ghost{background:transparent;color:var(--text);box-shadow:none;border:1.5px solid var(--border);-webkit-text-fill-color:var(--text);}
.btn-3d.ghost:hover{filter:none;background:var(--s1);}
.btn-3d.ghost:active,.btn-3d.ghost.is-pressed{transform:translateY(1px);box-shadow:none;}
.btn-3d.ghost:disabled{opacity:0.5;cursor:not-allowed;pointer-events:none;box-shadow:none;}

/* Results-screen button stack — lighter than the default .btn-3d, with a
   shorter rim and tighter spacing so the action column doesn't dominate. */
.results-actions{display:flex;flex-direction:column;gap:8px;}
.results-actions .btn-3d{min-height:0;padding:12px 20px;font-size:15px;margin:0!important;}
.results-actions .btn-3d:active,.results-actions .btn-3d.is-pressed{opacity:0.85;}
.results-actions .btn-3d.ghost:active,.results-actions .btn-3d.ghost.is-pressed{opacity:0.85;}

/* Pill utility — small uppercase tone-tinted badge. */
.pill{display:inline-flex;align-items:center;gap:4px;font-family:'Inter',sans-serif;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;padding:4px 10px;border-radius:999px;white-space:nowrap;}
.pill--green{background:rgba(88,204,2,0.15);color:#8AE042;}
.pill--amber{background:rgba(255,193,7,0.15);color:#FFC107;}
.pill--neutral{background:rgba(255,255,255,0.08);color:var(--t2);}
.app{max-width:420px;margin:0 auto;padding:0 20px 100px;min-height:100vh;min-height:100dvh;background:var(--bg);transition:none;-webkit-overflow-scrolling:touch;scroll-behavior:smooth;}
.mi-name,.sr-label,.sr-desc,.settings-row,.tab-label,.lcard-t,.lcard-s,.rc-title,.score-pct,.sbox-k,.daily-hero-sub,.badge-name,.profile-iq-line,.profile-level-badge{font-size:14px;}
.q-text{font-size:18px !important;}
.sbar{position:sticky;top:0;z-index:10;height:env(safe-area-inset-top,0);background:var(--bg);}
.hdr{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:22px 0 4px;}
.logo{font-size:19px;font-weight:800;letter-spacing:-0.4px;color:var(--text);flex-shrink:0;}
.hdr-xp{flex:1;min-width:80px;display:flex;align-items:center;gap:8px;}
.hdr-xp-lbl{font-family:'Inter',sans-serif;font-size:11px;font-weight:700;color:var(--t3);letter-spacing:0.02em;flex-shrink:0;font-variant-numeric:tabular-nums;}
.hdr-xp-track{flex:1;height:6px;background:var(--s2);border-radius:999px;overflow:hidden;}
.hdr-xp-fill{height:100%;background:#58CC02;border-radius:999px;transition:width 0.6s cubic-bezier(0.22,1,0.36,1);will-change:width;}
.light .hdr-xp-track{background:#E5E5EA;}
.logo em{color:var(--accent);font-style:normal;}
.hdr-actions{display:flex;align-items:center;gap:8px;}
.icon-btn{min-width:44px;min-height:44px;width:44px;height:44px;border-radius:10px;border:1px solid var(--border);background:var(--s1);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;color:var(--t2);transition:all 0.15s;flex-shrink:0;}
.icon-btn:hover{background:var(--s2);border-color:var(--border2);color:var(--text);}
.screen{animation:none;opacity:1;-webkit-overflow-scrolling:touch;scroll-behavior:smooth;}
.tab-content{animation:none;opacity:1;-webkit-overflow-scrolling:touch;scroll-behavior:smooth;}
@keyframes sIn{from{transform:translateY(4px);}to{transform:translateY(0);}}
.cta{border-radius:var(--r);padding:15px 16px 15px 18px;cursor:pointer;transition:all 0.2s cubic-bezier(0.22,1,0.36,1);border:1px solid var(--border);text-align:left;display:flex;align-items:center;justify-content:space-between;gap:12px;background:var(--s1);position:relative;overflow:hidden;color:var(--t1);font-family:inherit;}
.cta:hover{transform:translateY(-1px);border-color:var(--border2);}
/* ── HOME STAT CHIPS (top row: IQ / Streak / Games) ── */
/* Home section title — sentence-case header for grouped content (Daily,
   More modes). Different from .ds-eyebrow (which stays UPPERCASE/muted
   for in-card eyebrows and other screen uses). Flex container so the
   Daily header can host a streak chip on the right; "More modes" with
   a single child sits left as expected via justify-content:space-between. */
.home-section-title{display:flex;align-items:center;justify-content:space-between;gap:12px;font-family:'Inter',sans-serif;font-size:15px;font-weight:800;letter-spacing:-0.01em;color:var(--t1);margin:0 0 12px;}
/* Optional small uppercase eyebrow above .home-section-title — used to
   give a section a touch more presence. Kept declarative ("Game modes",
   not marketing copy). */
.home-section-eyebrow{font-family:'Inter',sans-serif;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:var(--t3);margin:0 0 4px;}
/* Coming Soon — demoted to a single muted text line so it doesn't
   compete visually with available game modes. Was a 3-card grid that
   looked nearly identical to active modes. */
.coming-soon-list{margin-top:18px;font-size:12px;line-height:1.5;color:var(--t3);}
/* Streak chip rendered next to the Daily section title when login streak
   > 0. Outline-only treatment so it reads as a peer to the title rather
   than competing for attention. */
.hst-streak{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;background:linear-gradient(135deg,#FF6B35 0%,#F23131 100%);border:none;border-radius:999px;font-family:'Inter',sans-serif;font-size:12px;font-weight:800;color:#FFFFFF;-webkit-text-fill-color:#FFFFFF;letter-spacing:0;text-transform:none;box-shadow:0 1px 4px rgba(242,49,49,0.15);will-change:transform;}
/* Pulse fires once per session when loginStreak exceeds the value
   captured at AppInner mount (i.e. user just earned today's streak day).
   Subtle by design — celebrating the moment, not demanding attention. */
.hst-streak.is-pulsing{animation:streakPulse 1.5s cubic-bezier(0.22,1,0.36,1);}
@keyframes streakPulse{
  0%   { transform: scale(1);    box-shadow: 0 1px 4px rgba(242,49,49,0.15); }
  18%  { transform: scale(1.08); box-shadow: 0 0 0 4px rgba(242,49,49,0.18), 0 3px 10px rgba(242,49,49,0.28); }
  36%  { transform: scale(1.04); box-shadow: 0 0 0 2px rgba(242,49,49,0.10), 0 2px 8px rgba(242,49,49,0.18); }
  100% { transform: scale(1);    box-shadow: 0 1px 4px rgba(242,49,49,0.15); }
}
.home-stat-row{display:flex;gap:10px;margin-bottom:24px;}
.home-stat-chip{flex:1;padding:10px 12px;border-radius:14px;background:var(--s1);border:1px solid var(--border);contain:layout paint style;display:flex;align-items:center;gap:10px;}
.home-stat-chip-desktop-only{display:none;}
.home-stat-chip.tappable{background:var(--s2);border:1px solid rgba(88,204,2,0.28);cursor:pointer;font-family:inherit;text-align:left;color:inherit;touch-action:manipulation;-webkit-appearance:none;appearance:none;transition:background 0.15s,border-color 0.15s,transform 0.1s;}
.home-stat-chip.tappable:hover{background:var(--s3);border-color:rgba(88,204,2,0.45);}
.home-stat-chip.tappable:active{transform:scale(0.98);}
.hsc-left{flex-shrink:0;display:flex;flex-direction:column;}
.hsc-right{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center;gap:5px;}
.home-stat-hint{font-family:'Inter',sans-serif;font-size:9px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--accent);margin-top:2px;}
.home-stat-label{font-family:'Inter',sans-serif;font-size:10px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:var(--t3);}
.home-stat-val{font-family:'JetBrains Mono','SF Mono',ui-monospace,Menlo,monospace;font-variant-numeric:tabular-nums;font-size:18px;font-weight:700;color:var(--t1);margin-top:2px;letter-spacing:-0.02em;}
.home-stat-val.green{color:var(--accent);}
.home-stat-val.flame{color:#FF6A00;}

/* ── Streak pulse: 7-day activity dots ────────────────────────────────────── */
/* Each dot is a flexible square that fills available right-side width; on
   iPhone SE it shrinks to ~5px, on wide phones it caps at 9px. Active dots
   take the brand accent; inactive dots get a faint outlined fill. */
.streak-pulse{display:flex;gap:3px;align-items:center;}
.streak-pulse-dot{flex:1 1 auto;aspect-ratio:1;min-width:5px;max-width:9px;border-radius:50%;background:var(--s3);border:1px solid var(--border);box-sizing:border-box;}
.streak-pulse-dot.active{background:var(--accent);border-color:var(--accent);}
.hsc-meta{font-family:'Inter',sans-serif;font-size:9.5px;font-weight:600;color:var(--t3);letter-spacing:0.04em;line-height:1;}

/* ── IQ rank bar: 5-segment tier visual ──────────────────────────────────── */
/* Segments 1-5 represent 60-80, 80-100, 100-120, 120-140, 140-160. Active
   segments are filled with the brand accent up to and including the user's
   tier. Empty bar shown when no IQ score yet. */
.iq-rank-bar{display:flex;gap:2px;width:100%;}
.iq-rank-seg{flex:1;height:6px;background:var(--s3);border-radius:2px;transition:background 0.2s;}
.iq-rank-seg.active{background:var(--accent);}

/* ── HOME HERO: DAILY (flame gradient, dark Play pill) ── */
.hero-daily{position:relative;overflow:hidden;border-radius:22px;padding:13px 20px;min-height:90px;margin-bottom:12px;background:linear-gradient(135deg,#FF6A00 0%,#FFC107 100%);color:#1A0F05;cursor:pointer;border:none;width:100%;text-align:left;font-family:inherit;-webkit-appearance:none;appearance:none;-webkit-text-fill-color:#1A0F05;contain:layout paint style;}

/* ── HOME HERO: ONLINE 1V1 (dark card with green glow) ── */
.hero-online{position:relative;overflow:hidden;border-radius:22px;padding:13px 20px;min-height:90px;margin-bottom:24px;background:linear-gradient(180deg,rgba(255,255,255,0.05) 0%,var(--s1) 60%);color:var(--t1);cursor:pointer;border:1px solid var(--border);box-shadow:0 0 0 1px rgba(88,204,2,0.15),0 8px 24px rgba(88,204,2,0.08);width:100%;text-align:left;font-family:inherit;-webkit-appearance:none;appearance:none;contain:layout paint style;}
.hero-online-eyebrow{font-family:'Inter',sans-serif;font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#58CC02;}
.hero-online-title{font-size:26px;font-weight:900;line-height:1.05;margin-top:6px;letter-spacing:-0.02em;color:var(--t1);}
.hero-online-sub{font-family:'Inter',sans-serif;font-size:12.5px;color:var(--t3);margin-top:4px;}
.hero-online-sub-mobile{display:inline;}
.hero-online-sub-desktop{display:none;}
.hero-online-emoji{position:absolute;right:-6px;bottom:-14px;font-size:92px;filter:drop-shadow(0 4px 18px rgba(0,0,0,0.5));pointer-events:none;opacity:0.95;}
/* Mobile-only tightening for the Multiplayer hero + slim hdr chrome.
   Desktop padding/emoji stay at base values; .hdr is display:none on
   desktop. PWA standalone is included here (always <1024px viewport
   on phones). */
@media (max-width: 1023px) {
  .hdr { padding: 12px 0 4px; }
  .logo { font-size: 16px; letter-spacing: -0.3px; }
  .hdr .icon-btn {
    width: 36px;
    min-width: 36px;
    height: 36px;
    min-height: 36px;
    padding: 4px;
    border: none;
    background: transparent;
  }
  .hdr .icon-btn:hover { background: var(--s1); }
  .hero-online {
    padding: 8px 16px;
    min-height: 64px;
  }
  .hero-online-emoji {
    font-size: 48px;
    bottom: 4px;
    right: 4px;
  }
}
.hero-online-cta{margin-top:14px;display:inline-flex;align-items:center;justify-content:center;padding:10px 20px;background:#58CC02;color:#0A0A0A;border:none;border-radius:12px;font-family:'Inter',sans-serif;font-size:14px;font-weight:800;letter-spacing:0.01em;cursor:pointer;transition:opacity 120ms ease;-webkit-appearance:none;appearance:none;-webkit-text-fill-color:#0A0A0A;}
.hero-online:active .hero-online-cta{opacity:0.85;}

/* ── MORE MODES section eyebrow ── */
/* .more-modes-eyebrow — layout-only wrapper; visual tokens come from .ds-eyebrow. */
.more-modes-eyebrow{margin:4px 0 10px;padding-left:2px;}

/* ── HOME MODE GRID (icon-top vertical tiles) ── */
.play-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:2px;}
.play-card{position:relative;display:flex;flex-direction:column;align-items:flex-start;gap:4px;padding:14px;min-height:104px;background:var(--s1);border:1px solid var(--border);border-radius:16px;cursor:pointer;font-family:inherit;text-align:left;color:var(--t1);transition:background 0.15s,border-color 0.15s,transform 0.1s;box-shadow:0 2px 10px rgba(0,0,0,0.22);overflow:hidden;-webkit-appearance:none;appearance:none;touch-action:manipulation;-webkit-tap-highlight-color:transparent;contain:layout paint style;}
.play-card:hover{background:var(--s2);border-color:var(--border2);}
.play-card:active{transform:scale(0.98);}
.light .play-card{border:1px solid #E5E5EA;box-shadow:0 1px 6px rgba(0,0,0,0.06);}
.play-card-icon{display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:10px;background:var(--s2);font-size:20px;line-height:1;margin-bottom:6px;border:1px solid var(--border);}
.play-card-body{display:flex;flex-direction:column;gap:1px;width:100%;min-width:0;}
.play-card-name{display:block;font-size:15px;font-weight:800;color:var(--t1);letter-spacing:-0.2px;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.play-card-desc{font-size:12px;color:var(--t2);line-height:1.3;font-weight:500;white-space:normal;overflow:hidden;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;}
.play-card-badge{position:absolute;top:8px;right:8px;font-size:8px;font-weight:800;letter-spacing:0.4px;padding:2px 6px;border-radius:20px;background:var(--accent);color:#fff;}
/* Play-card "coming soon" modifier — amber pill in the top-right + muted look. */
.play-card.coming-soon{opacity:0.78;}
.play-card.coming-soon .play-card-badge{position:absolute;top:8px;right:8px;background:rgba(255,193,7,0.15);color:#FFC107;font-size:9px;letter-spacing:0.12em;padding:3px 8px;text-transform:uppercase;}
/* Smaller-than-active variant for the dedicated "Coming Soon" section
   below the play grid. Tiles render at ~72% of an active tile's height,
   sit at lower opacity, and have hover/active interactions disabled so
   they read as a teaser shelf rather than an action surface. */
.play-card.soon-tile{min-height:75px;max-height:85px;padding:11px 12px;opacity:0.7;}
.play-card.soon-tile:hover{background:var(--s1);border-color:var(--border);opacity:0.85;transform:none;}
.play-card.soon-tile:active{transform:none;}
.play-card.soon-tile .play-card-icon{width:30px;height:30px;font-size:17px;margin-bottom:4px;}
.play-card.soon-tile .play-card-name{font-size:13px;}
.play-card.soon-tile .play-card-desc{font-size:11px;-webkit-line-clamp:1;}

/* ── CLASSIC DIFFICULTY SHEET ── */
.diff-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:410;display:flex;align-items:flex-end;animation:fadeIn 0.18s ease;}
.diff-sheet{width:100%;background:var(--s1);border-radius:20px 20px 0 0;padding:22px 20px calc(24px + env(safe-area-inset-bottom,34px));animation:slideUp 0.25s cubic-bezier(0.22,1,0.36,1);}
.diff-sheet-title{font-size:17px;font-weight:900;color:var(--t1);text-align:center;margin-bottom:6px;letter-spacing:-0.3px;}
.diff-sheet-sub{font-size:13px;color:var(--t3);text-align:center;margin-bottom:18px;}
.diff-options{display:flex;flex-direction:column;gap:10px;}
.diff-option{display:flex;align-items:center;gap:14px;padding:14px 16px;background:var(--s2);border:2px solid var(--border);border-radius:14px;cursor:pointer;font-family:inherit;text-align:left;color:var(--text);transition:background 0.15s,border-color 0.15s,transform 0.1s;}
.diff-option:hover{background:var(--s3);}
.diff-option:active{transform:scale(0.98);}
.diff-option.default{border-color:var(--accent);background:var(--accent-dim);}
.diff-option.coming-soon{opacity:0.55;cursor:not-allowed;}
.diff-option.coming-soon:hover{background:var(--s2);}
.diff-option.coming-soon:active{transform:none;}
.diff-option-icon{font-size:26px;flex-shrink:0;}
.diff-option-body{flex:1;min-width:0;}
.diff-option-name{font-size:15px;font-weight:800;color:var(--t1);}
.diff-option-desc{font-size:12px;color:var(--t2);margin-top:2px;font-weight:500;}

.dhero-compact{width:100%;display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--s1);border:1px solid rgba(34,197,94,0.25);border-radius:12px;cursor:pointer;font-family:inherit;color:var(--t1);transition:background 0.15s,transform 0.1s,border-color 0.15s;box-shadow:0 1px 6px rgba(0,0,0,0.18);}
.dhero-compact:hover{background:var(--s2);border-color:rgba(34,197,94,0.4);}
.dhero-compact:active{transform:scale(0.99);}

/* ── WORLD CUP 2026 COUNTDOWN ── */
.wc-card{position:relative;width:100%;margin:0 0 24px;padding:14px 16px;border:1px solid rgba(234,179,8,0.25);border-radius:14px;background:linear-gradient(180deg,rgba(255,255,255,0.05) 0%,transparent 50%),linear-gradient(120deg,#1a0f05 0%,#2d1a09 45%,#0a1f12 100%);color:#fff;cursor:pointer;font-family:inherit;overflow:hidden;display:flex;align-items:center;gap:12px;transition:transform 0.1s,border-color 0.15s;text-align:left;touch-action:manipulation;-webkit-tap-highlight-color:transparent;contain:layout paint style;}
.wc-card::before{content:"";position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,#006847 0%,#FFFFFF 50%,#CE1126 100%);opacity:0.9;}
.wc-card:hover{border-color:rgba(234,179,8,0.45);box-shadow:0 4px 18px rgba(234,179,8,0.18);}
.wc-card:active{transform:scale(0.99);}
.light .wc-card{background:linear-gradient(120deg,#fff7ed 0%,#fef3c7 45%,#dcfce7 100%);color:#1C1C1E;border-color:rgba(234,179,8,0.35);}
.wc-label{font-size:10px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;color:#FFC800;margin-bottom:3px;display:flex;align-items:center;gap:5px;}
.light .wc-label{color:#B45309;}
.wc-days{font-size:22px;font-weight:900;line-height:1.1;letter-spacing:-0.4px;color:#fff;}
.light .wc-days{color:#1C1C1E;}
.wc-days em{font-family:'JetBrains Mono','SF Mono',ui-monospace,Menlo,monospace;font-variant-numeric:tabular-nums;font-style:normal;color:#FFC800;}
.light .wc-days em{color:#B45309;}
.wc-sub{font-size:12px;color:rgba(255,255,255,0.7);margin-top:2px;font-weight:500;}
.light .wc-sub{color:#48484A;}
.wc-cta{display:inline-flex;align-items:center;padding:6px 12px;background:#FFC800;color:#1A0F05;border-radius:999px;font-family:'Inter',sans-serif;font-size:12px;font-weight:800;letter-spacing:0.01em;flex-shrink:0;margin-left:auto;-webkit-text-fill-color:#1A0F05;}
.light .wc-cta{background:#B45309;color:#FFFFFF;-webkit-text-fill-color:#FFFFFF;}
@keyframes hardRightBadge{0%{opacity:0;transform:translate(-50%,-30%) scale(0.8);}15%{opacity:1;transform:translate(-50%,-50%) scale(1.1);}30%{transform:translate(-50%,-50%) scale(1);}80%{opacity:1;}100%{opacity:0;transform:translate(-50%,-70%) scale(0.9);}}
/* ── Play button: neutral elevated (accent reserved for Daily action) ── */
.cta-play{background:var(--s1);border:1px solid var(--border);}
@media (hover: hover) { .cta-play:hover{background:var(--s2);border-color:var(--border2);} }
.cta-play .cta-title{color:var(--t1);}
.cta-play .cta-desc{color:var(--t2);}
.cta-play .cta-icon{color:var(--accent);}
.cta-iq{background:var(--s1);border:1px solid var(--border);}
@media (hover: hover) { .cta-iq:hover{background:var(--s2);border-color:var(--border2);} }
.cta-challenge{background:var(--s1);border:1px solid var(--border);}
@media (hover: hover) { .cta-challenge:hover{background:var(--s2);border-color:var(--border2);} }
.cta-challenge .cta-title{color:var(--t1);}
.cta-challenge .cta-desc{color:var(--t2);}
.cta-challenge .cta-icon{color:#9b82ff;}
.cta-daily:hover{border-color:rgba(251,191,36,0.3);}
.cta-daily-done{opacity:0.65;}
.cta-daily-done:hover{border-color:var(--border2)!important;}
.cta-title{font-size:15px;font-weight:700;letter-spacing:-0.2px;color:var(--text);}
.cta-desc{font-size:12px;color:var(--t2);margin-top:1px;}
.cta-icon{font-size:20px;}
/* ── Quick Play row ── */
.quick-play{margin-top:14px;}
.quick-play-scroll{display:flex;gap:10px;overflow-x:auto;overflow-y:hidden;scrollbar-width:none;-ms-overflow-style:none;margin:0 -20px;padding:0 20px 4px;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;scroll-behavior:smooth;}
.quick-play-scroll::-webkit-scrollbar{display:none;}
.qp-chip{display:flex;flex-direction:column;align-items:flex-start;gap:2px;flex-shrink:0;background:var(--s1);border:1px solid var(--border);border-radius:14px;padding:12px 14px;cursor:pointer;transition:all 0.18s cubic-bezier(0.22,1,0.36,1);text-align:left;scroll-snap-align:start;touch-action:manipulation;-webkit-tap-highlight-color:transparent;user-select:none;min-width:118px;color:var(--t1);font-family:inherit;}
@media (hover: hover) { .qp-chip:hover{background:var(--s2);border-color:var(--border2);transform:translateY(-1px);} }
.qp-chip:active{transform:scale(0.97);}
.sbar-box{background:var(--s1);border:none;border-radius:12px;padding:14px 10px;text-align:center;box-shadow:0 2px 10px rgba(0,0,0,0.3);}
.page-hdr{display:flex;align-items:center;gap:12px;padding:18px 0 22px;}
.back-btn{min-width:44px;min-height:44px;width:44px;height:44px;border-radius:10px;border:1px solid var(--border);background:var(--s1);cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--t2);transition:all 0.15s;}
.back-btn:hover{background:var(--s2);border-color:var(--border2);color:var(--text);}
.page-title{font-size:19px;font-weight:700;letter-spacing:-0.4px;}
.settings-panel{background:var(--s1);border:1px solid var(--border);border-radius:var(--r);padding:16px 18px;margin-bottom:12px;}
.sp-section{margin-bottom:16px;}
.sp-section:last-child{margin-bottom:0;}
.chip{padding:6px 12px;border-radius:7px;font-size:12px;font-weight:500;border:1px solid var(--border);background:var(--s2);color:var(--t2);cursor:pointer;transition:all 0.15s;white-space:nowrap;}
.chip.on{background:var(--accent-dim);border-color:var(--accent-b);color:var(--accent);}
.chip:hover:not(.on){border-color:var(--border2);color:var(--text);}
.cat-scroll-wrap{overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;scroll-behavior:smooth;}
.cat-scroll-wrap::-webkit-scrollbar{display:none;}
.cat-scroll-inner{display:flex;gap:6px;padding-bottom:2px;}
.mode-list{display:flex;flex-direction:column;gap:8px;}
.mode-item{background:var(--s1);border:none;border-radius:var(--r);padding:15px 16px;cursor:pointer;transition:background 0.18s,transform 0.12s;display:flex;align-items:center;gap:13px;box-shadow:0 2px 12px rgba(0,0,0,0.35);touch-action:manipulation;-webkit-tap-highlight-color:transparent;user-select:none;color:var(--text);font-family:inherit;}
@media (hover: hover) { .mode-item:hover{border-color:var(--border2);background:var(--s2);transform:translateX(2px);} }
.mode-item:active{background:var(--s2);transform:scale(0.98);}
.mi-icon{font-size:18px;flex-shrink:0;width:38px;height:38px;background:var(--s2);border-radius:9px;display:flex;align-items:center;justify-content:center;}
.mode-item:hover .mi-icon{background:var(--s3);}
.mi-body{flex:1;}
.mi-name{font-size:14px;font-weight:600;letter-spacing:-0.1px;margin-bottom:2px;}
.mi-desc{font-size:12px;color:var(--t2);line-height:1.4;}
.mi-arrow{font-size:13px;color:var(--t2);}
.quiz-wrap{padding-top:20px;padding-bottom:16px;min-height:calc(100vh - 40px);}
.q-top{display:flex;align-items:center;gap:10px;margin-bottom:18px;}
.prog-wrap{flex:1;height:3px;background:var(--border);border-radius:2px;overflow:hidden;}
.prog-bar{height:100%;background:var(--accent);border-radius:1px;transition:width 0.45s cubic-bezier(0.22,1,0.36,1);}
.q-top-right{display:flex;align-items:center;gap:8px;flex-shrink:0;}
.q-ctr{font-family:'JetBrains Mono','SF Mono',ui-monospace,Menlo,monospace;font-variant-numeric:tabular-nums;font-size:11px;color:var(--t3);white-space:nowrap;font-weight:500;letter-spacing:0.04em;}
.q-score-live{font-family:'JetBrains Mono','SF Mono',ui-monospace,Menlo,monospace;font-variant-numeric:tabular-nums;font-size:13px;font-weight:700;color:var(--accent);white-space:nowrap;animation:scorePop 0.25s cubic-bezier(0.34,1.56,0.64,1);}
.q-score-tick{font-size:11px;font-weight:600;}
@keyframes scorePop{from{transform:scale(1.4);}to{transform:scale(1);}}
.q-card{background:var(--s1);border:none;border-radius:18px;padding:26px 22px;margin-bottom:14px;box-shadow:0 4px 24px rgba(0,0,0,0.45),0 1px 4px rgba(0,0,0,0.3);}
/* .q-tag rebases onto .pill tokens; per-category colours below override tint. */
.q-tag{display:inline-flex;align-items:center;gap:5px;font-family:'Inter',sans-serif;font-size:12px;font-weight:700;color:#8AE042;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:14px;background:rgba(88,204,2,0.15);padding:4px 10px;border-radius:999px;white-space:nowrap;}
.q-text{font-size:20px;font-weight:800;line-height:1.6;letter-spacing:-0.3px;color:var(--text);}
.opts{display:flex;flex-direction:column;gap:9px;}
.opt{background:var(--s1);border:1.5px solid var(--border);border-radius:14px;padding:14px 14px;font-family:'Inter',sans-serif;font-size:15px;font-weight:700;color:var(--text);cursor:pointer;text-align:left;transition:background 0.15s,border-color 0.15s,color 0.15s,transform 0.1s;display:flex;align-items:center;gap:12px;width:100%;}
.opt:hover:not(:disabled){border-color:var(--border2);background:var(--s2);transform:translateX(2px);}
.opt:disabled{cursor:default;}
/* Correct / wrong feedback — matches design-system quiz-answers spec */
.opt.correct{border-color:rgba(88,204,2,0.55);background:rgba(88,204,2,0.12);color:#8AE042;}
.opt.wrong{border-color:rgba(255,59,48,0.55);background:rgba(255,59,48,0.10);color:#FF8080;}
.opt.neutral-after{opacity:0.65;color:var(--t2);}
/* Letter chip (A/B/C/D) */
.opt-l{width:30px;height:30px;border-radius:9px;background:var(--s2);font-size:13px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-family:'Inter',sans-serif;color:var(--t3);border:1px solid var(--border);transition:background 0.15s,color 0.15s,border-color 0.15s;}
.opt.correct .opt-l{background:#58CC02;color:#0A0A0A;border-color:#58CC02;}
.opt.wrong .opt-l{background:#FF3B30;color:#fff;border-color:#FF3B30;}
.opt.neutral-after .opt-l{background:var(--s2);color:var(--t2);}
.feedback{border-radius:9px;padding:10px 14px;margin-top:9px;font-size:13px;font-weight:500;display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;}
.feedback.correct{background:rgba(34,197,94,0.08);color:var(--green);border:1px solid rgba(34,197,94,0.18);}
.feedback.wrong{background:rgba(248,113,113,0.08);color:var(--red);border:1px solid rgba(248,113,113,0.18);}
.typed-outer{position:relative;}
.typed-inp{width:100%;padding:14px 16px;background:var(--s1);border:1px solid var(--border);border-radius:11px;font-family:'Inter',sans-serif;font-size:16px;font-weight:500;color:var(--text);outline:none;transition:border-color 0.15s;}
.typed-inp:focus{border-color:var(--accent-b);}
.typed-inp.correct{border-color:var(--green);background:rgba(34,197,94,0.06);}
.typed-inp.wrong{border-color:var(--red);background:rgba(248,113,113,0.06);}
.ac-list{position:absolute;top:calc(100% + 5px);left:0;right:0;background:var(--s2);border:1px solid var(--border2);border-radius:11px;overflow:hidden;z-index:100;box-shadow:var(--sh-lg);}
.ac-row{padding:11px 15px;font-size:14px;font-weight:500;cursor:pointer;transition:background 0.1s;border-bottom:1px solid var(--border);color:var(--text);}
.ac-row:last-child{border-bottom:none;}
.ac-row:hover{background:var(--s3);}
.ac-hi{color:var(--accent);font-weight:600;}
.typed-btn{width:100%;margin-top:9px;padding:13px;background:var(--accent);border:none;border-radius:11px;font-family:'Inter',sans-serif;font-size:14px;font-weight:700;color:#0a1a00;cursor:pointer;transition:all 0.15s;}
.typed-btn:hover{background:#22c55e;transform:translateY(-1px);}
.typed-btn:disabled{opacity:0.25;cursor:default;transform:none;}
.hint-note{font-size:12px;color:var(--t3);margin-top:7px;font-style:italic;}
.timer-row{display:flex;align-items:center;gap:10px;margin-bottom:12px;}
.timer-track{flex:1;height:4px;background:var(--border);border-radius:2px;overflow:hidden;}
.timer-fill{height:100%;border-radius:2px;transition:width 0.9s linear,background 0.3s;will-change:width;}
.timer{font-family:'JetBrains Mono','SF Mono',ui-monospace,Menlo,monospace;font-variant-numeric:tabular-nums;font-size:15px;font-weight:700;color:var(--t2);min-width:28px;text-align:right;}
.timer.urgent{color:var(--red);animation:tp 0.5s ease infinite alternate;}
@keyframes tp{from{opacity:1;}to{opacity:0.4;}}
/* Slim inline label row for Survival's streak indicator. Demoted from
   the previous gold-tinted card so it doesn't compete with the question
   card below. Reads as a quiet status line above the question. */
.streak-bar{background:transparent;border:none;border-radius:0;padding:0 2px 8px;display:flex;align-items:baseline;gap:8px;margin-bottom:8px;}
.streak-n{font-size:18px;font-weight:800;color:var(--gold);line-height:1;flex-shrink:0;}
.streak-info{font-size:11px;color:var(--t3);display:flex;align-items:baseline;gap:6px;flex-wrap:wrap;}
.streak-info strong{color:var(--gold);font-size:12px;font-weight:700;}
.pc{background:var(--s1);border:1px solid var(--border);border-radius:10px;padding:10px 12px;text-align:center;}
.pc.me{border-color:var(--accent-b);background:var(--accent-dim);}
.pc-score{font-size:24px;font-weight:800;color:var(--text);}
.pc.me .pc-score{color:var(--accent);}
.rc{background:var(--s1);border:none;border-radius:var(--r);padding:26px 20px;text-align:center;margin-bottom:14px;box-shadow:0 4px 20px rgba(0,0,0,0.4);}
.rc-icon{font-size:40px;margin-bottom:10px;animation:iconPop 0.5s cubic-bezier(0.34,1.56,0.64,1);}
@keyframes iconPop{from{transform:scale(0.3);opacity:0;}to{transform:scale(1);opacity:1;}}
.score-big{animation:scoreReveal 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.15s both;}
@keyframes scoreReveal{from{transform:scale(0.5) translateY(10px);opacity:0;}to{transform:scale(1) translateY(0);opacity:1;}}
.rc-title{animation:sIn 0.4s cubic-bezier(0.22,1,0.36,1) 0.05s both;}
.rc-title{font-size:24px;font-weight:800;letter-spacing:-0.4px;margin-bottom:4px;}
.rc-sub{font-size:13px;color:var(--t2);}
.score-big{font-family:'JetBrains Mono','SF Mono',ui-monospace,Menlo,monospace;font-variant-numeric:tabular-nums;font-size:60px;font-weight:700;color:var(--accent);line-height:1;margin:12px 0 2px;letter-spacing:-2px;}
.score-pct{font-family:'JetBrains Mono','SF Mono',ui-monospace,Menlo,monospace;font-variant-numeric:tabular-nums;font-size:11px;color:var(--t3);}
.s-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;margin-bottom:14px;}
.sbox{background:var(--s1);border:1px solid var(--border);border-radius:12px;padding:13px 10px;text-align:center;animation:sboxIn 0.4s cubic-bezier(0.22,1,0.36,1) both;}
.s-row .sbox:nth-child(1){animation-delay:0.55s;}
.s-row .sbox:nth-child(2){animation-delay:0.65s;}
.s-row .sbox:nth-child(3){animation-delay:0.75s;}
@keyframes sboxIn{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
.sbox-v{font-size:22px;font-weight:800;letter-spacing:-0.5px;}
.sbox-k{font-family:'Inter',sans-serif;font-size:9px;color:var(--t3);margin-top:3px;letter-spacing:0.8px;}
/* New best / category breakdown callouts */
.new-best{animation:bestPop 0.6s cubic-bezier(0.34,1.56,0.64,1) 1.0s both;text-align:center;margin:10px 0 6px;padding:10px 14px;background:linear-gradient(135deg,rgba(255,204,0,0.15),rgba(255,149,0,0.10));border:1px solid rgba(255,204,0,0.35);border-radius:10px;font-size:14px;font-weight:800;color:var(--gold);letter-spacing:0.2px;}
@keyframes bestPop{from{opacity:0;transform:scale(0.85);}60%{transform:scale(1.04);}to{opacity:1;transform:scale(1);}}
.iq-result{text-align:center;padding:26px 0 8px;transition:opacity 0.4s;}
.iq-revealed .iq-label{animation:sIn 0.5s cubic-bezier(0.22,1,0.36,1);}
.iq-score-wrap{display:flex;justify-content:center;margin:0 0 4px;}
.iq-ring{width:152px;height:152px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:18px auto 8px;transition:transform 0.3s;}
.iq-ring.great{animation:iqPulse 1.5s ease infinite;}
@keyframes iqPulse{0%,100%{transform:scale(1);}50%{transform:scale(1.04);}}
.iq-ring-inner{width:120px;height:120px;border-radius:50%;background:var(--s1);display:flex;flex-direction:column;align-items:center;justify-content:center;}
.iq-num{font-family:'JetBrains Mono','SF Mono',ui-monospace,Menlo,monospace;font-variant-numeric:tabular-nums;font-size:44px;font-weight:700;letter-spacing:-2px;color:var(--text);}
.iq-sub{font-size:9px;color:var(--t3);font-family:'Inter',sans-serif;letter-spacing:0.2px;margin-top:2px;}
.iq-label{font-size:21px;font-weight:800;letter-spacing:-0.3px;margin-bottom:5px;}
.iq-pct{font-size:14px;color:var(--t2);margin-bottom:24px;}
.iq-pct strong{color:var(--accent);font-weight:700;}

/* APP_NAME hero variant — larger ring, stronger green glow, bigger number.
   Applied via .iq-ring-hero / .iq-num-hero modifier classes so the non-
   results uses of the same .iq-ring (e.g. profile screen) stay intact. */
.iq-ring-hero{width:200px;height:200px;margin:24px auto 12px;box-shadow:0 0 60px rgba(88,204,2,0.25),0 0 120px rgba(88,204,2,0.18);}
.iq-ring-hero.great{box-shadow:0 0 80px rgba(88,204,2,0.45),0 0 160px rgba(88,204,2,0.25);}
.iq-ring-inner-hero{width:160px;height:160px;}
.iq-num-hero{font-size:64px;letter-spacing:-3px;}

/* Funny label as a prominent pill below the ring — pops on reveal. */
.iq-label-pill{display:inline-block;margin:6px auto 12px;padding:10px 22px;background:rgba(88,204,2,0.12);border:1px solid rgba(88,204,2,0.4);border-radius:999px;font-size:16px;font-weight:800;letter-spacing:-0.2px;color:var(--text);max-width:92%;}

/* XP pop — used wherever +XP earned is shown. Brief scale-in on mount so
   the reward registers visually instead of fading in like a stat row. */
.xp-earned-pop{animation:xpEarnedPop 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.4s both;}
@keyframes xpEarnedPop{from{opacity:0;transform:scale(0.7);}60%{opacity:1;transform:scale(1.08);}to{opacity:1;transform:scale(1);}}
.btn{width:100%;padding:14px;border-radius:11px;font-family:'Inter',sans-serif;font-size:14px;font-weight:700;cursor:pointer;transition:all 0.18s cubic-bezier(0.22,1,0.36,1);border:none;letter-spacing:-0.1px;}
.btn-p{background:linear-gradient(135deg,#22c55e,#16a34a);color:#0a1a00;box-shadow:0 4px 20px rgba(34,197,94,0.28);}
.btn-p:hover{background:linear-gradient(135deg,#22c55e,#22c55e);transform:translateY(-1px);}
.btn-s{background:var(--s1);color:var(--text);border:1px solid var(--border);}
.btn-s:hover{border-color:var(--border2);background:var(--s2);}
.btn+.btn{margin-top:8px;}
.btn-share{background:transparent;color:var(--accent);border:1.5px solid var(--accent-b);margin-bottom:2px;}
.btn-share:hover{background:var(--accent-dim);}
.lcard{background:var(--s1);border:none;border-radius:var(--r);padding:20px;margin-bottom:12px;box-shadow:0 2px 12px rgba(0,0,0,0.35);}
.lcard-t{font-size:16px;font-weight:700;margin-bottom:4px;letter-spacing:-0.2px;}
.lcard-s{font-size:13px;color:var(--t2);line-height:1.7;margin-bottom:16px;}
.inp-lbl{font-family:'Inter',sans-serif;font-size:9px;font-weight:500;color:var(--t3);letter-spacing:0.2px;display:block;margin-bottom:7px;}
.inp{width:100%;padding:12px 15px;border:1px solid var(--border);border-radius:10px;font-family:'Inter',sans-serif;font-size:16px;color:var(--text);background:var(--s2);transition:all 0.15s;outline:none;margin-bottom:12px;font-weight:500;}
.inp:focus{border-color:var(--accent-b);background:var(--s1);}
.code-box{background:var(--accent-dim);border:1px solid var(--accent-b);border-radius:11px;padding:18px;text-align:center;margin-bottom:13px;}
.code-val{font-family:'JetBrains Mono','SF Mono',ui-monospace,Menlo,monospace;font-variant-numeric:tabular-nums;font-size:28px;font-weight:700;color:var(--accent);letter-spacing:8px;}
.code-hint{font-size:12px;color:var(--t2);margin-top:5px;}
.wdot{width:6px;height:6px;border-radius:50%;background:var(--s3);}
.wdot.on{background:var(--green);animation:dp 1.2s ease infinite;}
@keyframes dp{0%,100%{opacity:1;}50%{opacity:0.2;}}
.cdown{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:65vh;}
.player-input-row{display:flex;align-items:center;gap:9px;margin-bottom:8px;}
.player-num{width:28px;height:28px;border-radius:7px;background:var(--s2);border:1px solid var(--border);font-size:11px;font-weight:600;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--t3);font-family:'Inter',sans-serif;}
.player-inp{flex:1;padding:11px 13px;border:1px solid var(--border);border-radius:9px;font-family:'Inter',sans-serif;font-size:14px;color:var(--text);background:var(--s1);outline:none;transition:all 0.15s;font-weight:500;}
.player-inp:focus{border-color:var(--accent-b);background:var(--s2);}
.remove-btn{width:28px;height:28px;border-radius:7px;border:none;background:var(--s2);color:var(--t3);font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all 0.15s;}
.remove-btn:hover{background:rgba(248,113,113,0.12);color:var(--red);}
.add-player-btn{width:100%;padding:11px;border-radius:9px;border:1px dashed var(--border);background:transparent;color:var(--t2);font-family:'Inter',sans-serif;font-size:13px;font-weight:500;cursor:pointer;transition:all 0.15s;margin-bottom:14px;}
.add-player-btn:hover{border-color:var(--accent-b);color:var(--accent);background:var(--accent-dim);}

/* ── LOCAL MULTIPLAYER SETUP ── */
.local-section-label{margin:12px 0 8px;}
.local-count-row{display:flex;gap:8px;margin-bottom:4px;}
.local-count-btn{flex:1;min-height:46px;padding:10px;background:var(--s1);border:1.5px solid var(--border);border-radius:12px;color:var(--t1);font-family:inherit;font-size:18px;font-weight:800;cursor:pointer;transition:background 0.15s,border-color 0.15s,transform 0.1s;-webkit-appearance:none;appearance:none;-webkit-text-fill-color:currentColor;}
.local-count-btn:hover{background:var(--s2);}
.local-count-btn.on{background:var(--accent-dim);border-color:var(--accent);color:var(--accent);}
.local-count-btn:active{transform:scale(0.96);}
.local-names{display:flex;flex-direction:column;gap:6px;margin-bottom:4px;}
.local-mode-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;}
.local-mode-chip{display:flex;flex-direction:column;align-items:flex-start;gap:2px;padding:12px;background:var(--s1);border:1.5px solid var(--border);border-radius:12px;cursor:pointer;font-family:inherit;text-align:left;color:var(--t1);transition:background 0.15s,border-color 0.15s,transform 0.1s;-webkit-appearance:none;appearance:none;-webkit-text-fill-color:currentColor;}
.local-mode-chip:hover{background:var(--s2);}
.local-mode-chip:active{transform:scale(0.97);}
.local-mode-chip.on{background:var(--accent-dim);border-color:var(--accent);}
.local-mode-icon{font-size:22px;line-height:1;}
.local-mode-name{font-size:13px;font-weight:800;color:var(--t1);margin-top:2px;}
.local-mode-chip.on .local-mode-name{color:var(--accent);}
.local-mode-desc{font-size:10px;color:var(--t3);line-height:1.3;}
.local-diff-row{display:flex;gap:8px;}
.local-diff-chip{flex:1;display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:12px;background:var(--s1);border:1.5px solid var(--border);border-radius:12px;cursor:pointer;font-family:inherit;font-size:13px;font-weight:700;color:var(--t1);transition:background 0.15s,border-color 0.15s,transform 0.1s;-webkit-appearance:none;appearance:none;-webkit-text-fill-color:currentColor;}
.local-diff-chip:hover{background:var(--s2);}
.local-diff-chip:active{transform:scale(0.97);}
.local-diff-chip.on{background:var(--accent-dim);border-color:var(--accent);color:var(--accent);}

/* ── LOCAL GAME: READY/HANDOFF SCREEN (must reveal nothing about the question) ── */
.local-ready{position:relative;min-height:calc(100vh - 120px);min-height:calc(100dvh - 120px);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 24px;text-align:center;gap:12px;}
/* Visual tokens come from .ds-eyebrow. */
.local-ready-emoji{font-size:84px;line-height:1;filter:drop-shadow(0 6px 16px rgba(0,0,0,0.35));}
.local-ready-name{font-size:28px;font-weight:900;color:var(--t1);letter-spacing:-0.5px;}
.local-ready-sub{font-size:14px;color:var(--t2);max-width:300px;line-height:1.5;margin-bottom:8px;}
.local-out-list{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:6px 0 10px;max-width:340px;}
.local-out-chip{display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:20px;background:var(--s2);border:1px solid var(--border);font-size:11px;color:var(--t3);opacity:0.65;}

/* ── LOCAL GAME: ROUND SUMMARY (between-question flash) ── */
.local-summary-overlay{position:fixed;inset:0;background:rgba(10,10,10,0.85);z-index:450;display:flex;align-items:center;justify-content:center;padding:24px;animation:fadeIn 0.18s ease;}
.local-summary-card{width:100%;max-width:340px;background:var(--s1);border:1px solid var(--border);border-radius:18px;padding:20px 18px;box-shadow:var(--sh-lg);animation:slideUp 0.25s cubic-bezier(0.22,1,0.36,1);}
.local-summary-title{font-size:13px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:var(--t3);text-align:center;margin-bottom:12px;}
.local-summary-row{display:flex;align-items:center;gap:10px;padding:8px 6px;border-bottom:0.5px solid var(--border);font-size:14px;}
.local-summary-row:last-child{border-bottom:none;}
.local-summary-score{font-family:'JetBrains Mono',ui-monospace,Menlo,monospace;font-variant-numeric:tabular-nums;font-weight:800;color:var(--accent);}

/* ── LOCAL GAME: LOCKED ANSWER STATE (neutral blue highlight on picked option) ── */
.opt.locked{border-color:rgba(59,130,246,0.55) !important;background:rgba(59,130,246,0.12) !important;color:#8FB4FF !important;}
.opt.locked .opt-l{background:#3B82F6 !important;color:#fff !important;border-color:#3B82F6 !important;}

/* ── LOCAL GAME: REVEAL SCREEN (all picks shown at once) ── */
.local-reveal{padding:24px 20px 40px;display:flex;flex-direction:column;gap:12px;}
.local-reveal-eyebrow{text-align:center;}
.local-reveal-q{font-size:16px;font-weight:700;color:var(--t1);line-height:1.4;text-align:center;margin:4px 8px;}
.local-reveal-correct{font-size:13px;color:var(--t2);text-align:center;margin-bottom:6px;}
.local-reveal-correct strong{color:var(--accent);font-weight:800;}
.local-reveal-list{background:var(--s1);border:1px solid var(--border);border-radius:14px;overflow:hidden;}
.local-reveal-row{display:flex;align-items:center;gap:10px;padding:11px 14px;font-size:14px;border-bottom:0.5px solid var(--border);}
.local-reveal-row:last-child{border-bottom:none;}
.local-reveal-row.ok{background:rgba(88,204,2,0.06);}
.local-reveal-row.no{background:rgba(255,59,48,0.05);}
.local-reveal-row.out{opacity:0.7;}
.local-reveal-chose{font-size:12px;color:var(--t3);max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.local-reveal-mark{font-size:16px;font-weight:800;width:22px;text-align:right;}
.local-reveal-row.ok .local-reveal-mark{color:var(--accent);}
.local-reveal-row.no .local-reveal-mark{color:var(--red);}
.local-reveal-qn{font-family:'JetBrains Mono',ui-monospace,monospace;font-variant-numeric:tabular-nums;font-size:11px;font-weight:700;color:var(--t3);width:34px;flex-shrink:0;}
.local-reveal-eliminate{text-align:center;font-size:15px;font-weight:800;color:var(--red);margin-top:4px;padding:10px;border-radius:12px;background:rgba(255,59,48,0.08);border:1px solid rgba(255,59,48,0.2);}
.local-reveal-tally{text-align:center;font-family:'JetBrains Mono',ui-monospace,monospace;font-variant-numeric:tabular-nums;font-size:18px;font-weight:800;color:var(--accent);margin-top:4px;}
.handoff{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;text-align:center;padding:20px 0;}
.handoff-chip{padding:5px 11px;border-radius:7px;background:var(--s1);border:1px solid var(--border);font-size:12px;font-weight:500;color:var(--t2);}
.handoff-chip strong{color:var(--text);}
.podium{display:flex;flex-direction:column;gap:7px;margin-bottom:14px;}
.podium-row{display:flex;align-items:center;gap:12px;background:var(--s1);border:1px solid var(--border);border-radius:11px;padding:13px 15px;}
.podium-row.gold{border-color:rgba(251,191,36,0.25);background:rgba(251,191,36,0.04);}
.pod-rank{font-size:17px;width:26px;text-align:center;}
.pod-name{flex:1;font-size:14px;font-weight:600;}
.pod-score{font-family:'Inter',sans-serif;font-size:13px;font-weight:500;color:var(--t2);}
.podium-row.gold .pod-score{color:var(--gold);}
.settings-section{margin-bottom:20px;}
/* .settings-section-title — layout-only; visual tokens from .ds-eyebrow. */
.settings-section-title{margin-bottom:8px;}
.settings-card{background:var(--s1);border:none;border-radius:var(--r);overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.35);}
.settings-row{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid var(--border);cursor:pointer;transition:background 0.13s;}
.settings-row:last-child{border-bottom:none;}
.settings-row:hover{background:var(--s2);}
.settings-row.danger:hover{background:rgba(248,113,113,0.05);}
.sr-left{display:flex;flex-direction:column;gap:2px;}
.sr-label{font-size:14px;font-weight:600;letter-spacing:-0.1px;}
.sr-desc{font-size:12px;color:var(--t2);}
.settings-row.danger .sr-label{color:var(--red);}
.sr-right{display:flex;align-items:center;gap:8px;}
.sr-value{font-size:12px;color:var(--t2);}
.sr-arrow{font-size:12px;color:var(--t3);}
.toggle{width:42px;height:24px;border-radius:12px;border:none;cursor:pointer;transition:background 0.2s;position:relative;flex-shrink:0;}
.toggle.on{background:var(--accent);}
.toggle.off{background:var(--s3);}
.toggle-knob{width:18px;height:18px;border-radius:50%;background:white;position:absolute;top:3px;transition:left 0.2s cubic-bezier(0.22,1,0.36,1);box-shadow:0 1px 3px rgba(0,0,0,0.3);}
.toggle.on .toggle-knob{left:21px;}
.toggle.off .toggle-knob{left:3px;}
.size-btns{display:flex;gap:5px;}
.size-btn{padding:8px 14px;min-height:36px;border-radius:6px;font-size:12px;font-weight:600;border:1px solid var(--border);background:var(--s2);color:var(--t2);cursor:pointer;transition:all 0.13s;}
.size-btn.on{background:var(--accent-dim);border-color:var(--accent-b);color:var(--accent);}
/* ── TAB BAR ── */
/* ── TAB BAR — frosted glass, pill indicator ── */
.tab-bar{
  position:fixed;bottom:0;left:50%;transform:translateX(-50%);
  width:100%;max-width:420px;
  background:rgba(13,15,20,0.85);
  backdrop-filter:blur(28px);-webkit-backdrop-filter:blur(28px);
  border-top:0.5px solid rgba(255,255,255,0.08);
  display:flex;align-items:stretch;z-index:100;
  padding-top:6px;
  padding-bottom:max(env(safe-area-inset-bottom,34px),34px);
  /* Height matches the padding so .tab-item (align-items:stretch) gets a real
     inner box on every device, even when env(safe-area-inset-bottom) resolves
     to 0 (Android, iPad portrait, desktop browsers). Without this parity the
     icons get squeezed and clip at the top of the bar. */
  height:calc(58px + max(env(safe-area-inset-bottom,34px),34px));
}
.tab-item{
  flex:1;display:flex;flex-direction:column;align-items:center;
  justify-content:center;gap:4px;cursor:pointer;border:none;
  background:transparent;padding:4px 4px 4px;min-height:0;
  touch-action:manipulation;
  -webkit-tap-highlight-color:transparent;position:relative;
  transition:transform 0.12s cubic-bezier(0.34,1.56,0.64,1);
}
.tab-item:active{transform:scale(0.88);}
/* Pill indicator above active icon */
.tab-item.active::before{
  content:'';position:absolute;top:6px;
  width:32px;height:3px;border-radius:2px;
  background:var(--accent);
}
.tab-svg{width:22px;height:22px;color:var(--t3);transition:color 0.18s,transform 0.18s;}
.tab-svg svg{width:100%;height:100%;}
.tab-item.active .tab-svg{color:var(--accent);transform:translateY(1px);}
.tab-label{font-size:10px;font-weight:600;letter-spacing:0.2px;color:var(--t3);transition:color 0.18s;font-family:'Inter',sans-serif;}
.tab-item.active .tab-label{color:var(--accent);}
.tab-badge{position:absolute;top:4px;right:calc(50% - 20px);width:7px;height:7px;border-radius:50%;background:#FF4B4B;border:1.5px solid rgba(15,17,23,0.9);}
.tab-content{padding-bottom:calc(66px + max(env(safe-area-inset-bottom,34px),34px));background:var(--bg);}
/* Light mode: add thin border back to borderless cards since shadows are subtle on white */
.light .q-card,.light .mode-item,.light .rc,.light .sbar-box,.light .lcard,
.light .streak-section,.light .league-table,.light .li-card,.light .profile-card,
.light .daily-hero,.light .badge-tile,.light .settings-card{
  border:0.5px solid var(--border);box-shadow:var(--sh);
}

.light .tab-bar{background:rgba(255,255,255,0.88);border-top-color:rgba(0,0,0,0.08);}
.light .tab-badge{border-color:rgba(255,255,255,0.9);}

/* ── DAILY SCREEN ── */
.daily-hero{background:var(--s1);border:none;border-radius:18px;padding:24px 20px;margin-bottom:14px;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,0.45);}
.daily-hero-date{font-family:'Inter',sans-serif;font-size:10px;color:var(--t3);letter-spacing:0.2px;margin-bottom:10px;}
.daily-hero-title{font-size:22px;font-weight:800;letter-spacing:-0.4px;margin-bottom:8px;}
.daily-hero-sub{font-size:13px;color:var(--t2);line-height:1.6;margin-bottom:18px;}
.daily-hero-btn{width:100%;padding:14px;border-radius:12px;border:none;font-family:'Inter',sans-serif;font-size:15px;font-weight:700;cursor:pointer;transition:all 0.18s;}
.daily-hero-btn.available{background:#58CC02;color:#0A0A0A;transition:opacity 120ms ease,filter 120ms ease;}
.daily-hero-btn.available:hover{filter:brightness(1.06);}
.daily-hero-btn.available:active{opacity:0.85;}
.daily-hero-btn.done{background:var(--s2);color:var(--t2);cursor:default;}
.streak-section{background:var(--s1);border:none;border-radius:14px;padding:16px;margin-bottom:12px;box-shadow:0 2px 12px rgba(0,0,0,0.32);}
.streak-sec-title{font-family:'Inter',sans-serif;font-size:10px;color:var(--t3);letter-spacing:0.2px;margin-bottom:14px;}
.streak-day{display:flex;flex-direction:column;align-items:center;gap:4px;flex:1;}
.streak-dot{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;}
.streak-dot.done{background:var(--accent);color:#0a1a00;}
.streak-dot.today{background:var(--accent-dim);border:1.5px solid var(--accent-b);color:var(--accent);}
.streak-dot.missed{background:var(--s2);color:var(--t3);}

/* ── MONTHLY CALENDAR ── */
.cal-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;gap:10px;}
.cal-nav{min-width:44px;min-height:44px;width:44px;height:44px;border-radius:10px;border:1px solid var(--border);background:var(--s2);color:var(--t1);cursor:pointer;font-size:16px;font-weight:600;font-family:inherit;display:flex;align-items:center;justify-content:center;transition:background 0.15s;flex-shrink:0;}
.cal-nav:hover:not(:disabled){background:var(--s3);}
.cal-nav:disabled{opacity:0.35;cursor:not-allowed;}
.cal-month{font-size:14px;font-weight:700;color:var(--t1);letter-spacing:-0.2px;text-align:center;flex:1;}
.cal-dow{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:6px;}
.cal-dow-cell{font-size:9px;font-weight:700;color:var(--t3);text-align:center;letter-spacing:0.8px;font-family:'Inter',sans-serif;padding:4px 0;}
.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;}
.cal-cell{aspect-ratio:1;border:1px solid var(--border);border-radius:8px;background:var(--s2);color:var(--t1);font-size:13px;font-weight:600;cursor:pointer;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:inherit;padding:0;transition:background 0.15s,border-color 0.15s,transform 0.1s;gap:1px;min-height:36px;}
.cal-cell:hover:not(:disabled):not(.cal-future):not(.cal-empty){background:var(--s3);}
.cal-cell:active:not(:disabled):not(.cal-future):not(.cal-empty){transform:scale(0.94);}
.cal-cell.cal-empty{background:transparent;border-color:transparent;pointer-events:none;visibility:hidden;}
.cal-cell.cal-done{background:var(--accent);border-color:var(--accent);color:#fff;}
.cal-cell.cal-done .cal-num{color:#fff;}
.cal-cell.cal-today{border-color:var(--accent);border-width:2px;font-weight:800;background:var(--accent-dim);color:var(--accent);}
.cal-cell.cal-today.cal-done{background:var(--accent);color:#fff;}
.cal-cell.cal-future{opacity:0.35;cursor:not-allowed;color:var(--t3);background:transparent;border-style:dashed;}
.cal-cell.cal-missed{background:rgba(239,68,68,0.05);color:var(--t3);border-color:rgba(239,68,68,0.18);}
.cal-cell.cal-missed .cal-num{text-decoration:line-through;text-decoration-color:rgba(239,68,68,0.55);text-decoration-thickness:1.5px;}
.cal-num{font-family:'JetBrains Mono','SF Mono',ui-monospace,Menlo,monospace;font-variant-numeric:tabular-nums;line-height:1;font-size:13px;}
.cal-check{position:absolute;bottom:3px;right:4px;font-size:9px;font-weight:800;}
.cal-legend{display:flex;gap:12px;flex-wrap:wrap;justify-content:center;margin-top:12px;font-size:10px;color:var(--t3);font-family:'Inter',sans-serif;letter-spacing:0.5px;}
.cal-legend-item{display:flex;align-items:center;gap:5px;}
.cal-legend-dot{width:10px;height:10px;border-radius:3px;}

/* ── LEAGUE SCREEN ── */
.league-header{text-align:center;padding:8px 0 18px;}
.league-title{font-size:22px;font-weight:800;letter-spacing:-0.4px;margin-bottom:4px;}
.league-sub{font-size:13px;color:var(--t2);}
.league-timer{font-family:'Inter',sans-serif;font-size:11px;color:var(--t3);margin-top:4px;}
.league-info{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px;}
.li-card{background:var(--s1);border:none;border-radius:12px;padding:12px 14px;box-shadow:0 2px 10px rgba(0,0,0,0.3);}
.li-label{font-family:'Inter',sans-serif;font-size:9px;color:var(--t3);letter-spacing:0.2px;margin-bottom:6px;}
.li-val{font-family:'JetBrains Mono','SF Mono',ui-monospace,Menlo,monospace;font-variant-numeric:tabular-nums;font-size:16px;font-weight:700;letter-spacing:-0.3px;}
.league-table{background:var(--s1);border:none;border-radius:14px;overflow:hidden;margin-bottom:14px;box-shadow:0 4px 20px rgba(0,0,0,0.4);}
.lt-header{display:grid;grid-template-columns:32px 1fr 60px;gap:8px;padding:10px 14px;border-bottom:1px solid var(--border);}
.lt-hcol{font-family:'Inter',sans-serif;font-size:9px;color:var(--t3);letter-spacing:0.2px;font-weight:600;}
.lt-row{display:grid;grid-template-columns:32px 1fr 60px;gap:8px;padding:11px 14px;border-bottom:1px solid var(--border);align-items:center;}
.lt-row:last-child{border-bottom:none;}
.lt-row.you{background:var(--accent-dim);border-left:3px solid var(--accent);}
.lt-row.promote{background:rgba(34,197,94,0.04);}
.lt-row.relegate{background:rgba(248,113,113,0.04);}
.lt-rank{font-family:'JetBrains Mono','SF Mono',ui-monospace,Menlo,monospace;font-variant-numeric:tabular-nums;font-size:12px;font-weight:700;color:var(--t3);text-align:center;}
.lt-row.you .lt-rank{color:var(--accent);}
.lt-name{font-size:13px;font-weight:600;display:flex;align-items:center;gap:6px;}
.lt-xp{font-family:'JetBrains Mono','SF Mono',ui-monospace,Menlo,monospace;font-variant-numeric:tabular-nums;font-size:12px;font-weight:600;color:var(--t2);text-align:right;}
.lt-row.you .lt-xp{color:var(--accent);}

/* ── PROFILE SCREEN ── */
.profile-card{background:var(--s1);border:none;border-radius:20px;padding:24px 20px;margin-bottom:14px;display:flex;flex-direction:column;align-items:center;gap:10px;box-shadow:0 4px 24px rgba(0,0,0,0.45);}
.profile-avatar-wrap{position:relative;}
.profile-avatar{width:72px;height:72px;border-radius:50%;background:var(--accent-dim);border:2px solid var(--accent-b);display:flex;align-items:center;justify-content:center;font-size:32px;cursor:pointer;transition:all 0.2s;}
.profile-avatar:active{transform:scale(0.93);}
.profile-avatar-edit{position:absolute;bottom:-2px;right:-2px;width:28px;height:28px;border-radius:50%;background:var(--accent);border:2px solid var(--s1);display:flex;align-items:center;justify-content:center;font-size:13px;color:#0a1a00;font-weight:800;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,0.25);transition:transform 0.12s;}
.profile-avatar-edit:hover{transform:scale(1.05);}
.profile-avatar-edit:active{transform:scale(0.95);}
.profile-name{font-size:20px;font-weight:800;letter-spacing:-0.3px;cursor:pointer;}
.profile-name-input{font-size:18px;font-weight:700;text-align:center;background:transparent;border:none;border-bottom:1.5px solid var(--accent);color:var(--text);font-family:'Inter',sans-serif;outline:none;width:100%;max-width:220px;padding:2px 4px;}
/* .profile-level-badge uses .pill--neutral tokens with a little extra gap/padding for the emoji+text+XP layout. */
.profile-level-badge{display:inline-flex;align-items:center;gap:6px;background:rgba(88,204,2,0.10);color:#8AE042;padding:5px 12px;border-radius:999px;font-family:'Inter',sans-serif;font-size:12px;font-weight:700;letter-spacing:0.04em;}
.profile-iq-line{font-size:13px;color:var(--t2);}
.profile-iq-line strong{font-family:'JetBrains Mono','SF Mono',ui-monospace,Menlo,monospace;font-variant-numeric:tabular-nums;color:var(--accent);}
.share-profile-btn{width:100%;padding:14px;border-radius:12px;background:transparent;border:1.5px solid var(--accent-b);color:var(--accent);font-family:'Inter',sans-serif;font-size:14px;font-weight:700;cursor:pointer;transition:all 0.15s;margin-bottom:12px;}
.share-profile-btn:hover{background:var(--accent-dim);}
/* ── YOUR JOURNEY (league pyramid) ── */
.journey-section{margin:2px 0 16px;background:var(--s1);border:1px solid var(--border);border-radius:14px;padding:14px 14px 10px;box-shadow:0 2px 10px rgba(0,0,0,0.28);}
.journey-title{font-size:14px;font-weight:800;color:var(--t1);letter-spacing:-0.2px;margin-bottom:12px;display:flex;align-items:center;gap:8px;}
.journey-list{position:relative;display:flex;flex-direction:column;}
.journey-line{position:absolute;left:24px;top:22px;bottom:22px;width:2px;background:var(--border);border-radius:2px;z-index:0;}
.journey-row{display:flex;align-items:center;gap:12px;padding:7px 8px;border-radius:10px;position:relative;z-index:1;transition:background 0.15s;}
.journey-row + .journey-row{margin-top:2px;}
.journey-dot{width:34px;height:34px;border-radius:50%;background:var(--s2);border:2px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;transition:background 0.2s,border-color 0.2s;}
.journey-row.current{background:var(--accent-dim);border:1px solid rgba(34,197,94,0.3);padding:7px 9px;}
.journey-row.current .journey-dot{background:var(--accent);border-color:var(--accent);box-shadow:0 0 0 4px rgba(34,197,94,0.18);}
.journey-row.current .journey-name{color:var(--accent);}
.journey-row.done{opacity:0.6;}
.journey-row.done .journey-dot{background:rgba(34,197,94,0.12);border-color:rgba(34,197,94,0.3);color:var(--accent);font-weight:800;}
.journey-body{flex:1;min-width:0;}
.journey-name{font-size:14px;font-weight:700;color:var(--t1);line-height:1.2;}
.journey-sub{font-size:11px;color:var(--t3);margin-top:2px;font-weight:500;}
/* .journey-badge reuses the .pill tokens (tone variants map: current=green solid, next=pill--green, goal=pill--amber). */
.journey-badge{display:inline-flex;align-items:center;font-family:'Inter',sans-serif;font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;padding:4px 10px;border-radius:999px;white-space:nowrap;flex-shrink:0;}
.journey-badge.current{background:var(--accent);color:#fff;}
.journey-badge.next{background:rgba(88,204,2,0.15);color:#8AE042;}
.journey-badge.goal{background:rgba(255,193,7,0.15);color:#FFC107;}

.club-crest svg{width:100%;height:100%;display:block;}

.badges-section{margin-bottom:14px;}
.badges-title{font-family:'Inter',sans-serif;font-size:10px;color:var(--t3);letter-spacing:0.2px;margin-bottom:12px;}

/* ── FRIENDS ── */
.friends-section{margin:16px 0;background:var(--s1);border:1px solid var(--border);border-radius:14px;padding:14px;box-shadow:0 2px 10px rgba(0,0,0,0.28);}
.friends-search-wrap{margin-bottom:10px;}
.friends-search-inp{width:100%;padding:10px 12px;border-radius:10px;border:1px solid var(--border);background:var(--s2);color:var(--t1);font-family:'Inter',sans-serif;font-size:16px;outline:none;transition:border-color 0.15s,background 0.15s;-webkit-appearance:none;appearance:none;}
.friends-search-inp:focus{border-color:var(--accent);background:var(--s1);}
.friends-results{display:flex;flex-direction:column;gap:6px;margin-bottom:10px;max-height:320px;overflow-y:auto;-webkit-overflow-scrolling:touch;}
.friends-block{margin-top:14px;}
.friends-block-title{font-family:'Inter',sans-serif;font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:var(--t3);margin-bottom:8px;}
.friends-row{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:10px;background:var(--s2);}
/* Tap-area button inside .friends-row — wraps the avatar + meta and opens
   the friend's profile when tapped. Sits next to the Challenge button as
   a sibling so they don't nest (avoids button-inside-button). */
.friends-row-tap{flex:1;display:flex;align-items:center;gap:10px;background:transparent;border:none;padding:0;cursor:pointer;font-family:inherit;text-align:left;color:inherit;-webkit-appearance:none;appearance:none;-webkit-text-fill-color:currentColor;min-width:0;border-radius:6px;transition:opacity 0.12s;}
.friends-row-tap:hover{opacity:0.85;}
.friends-row-tap:active{opacity:0.7;}
/* Leaderboard row when interactive (i.e. not the user's own row, which
   stays a div). Same layout as .friends-lb-row, just button styling reset. */
button.friends-lb-row{width:100%;font-family:inherit;text-align:left;color:inherit;cursor:pointer;-webkit-appearance:none;appearance:none;-webkit-text-fill-color:currentColor;transition:background 0.12s,border-color 0.12s;}
button.friends-lb-row:hover{background:var(--s3);}
.friends-avatar{width:32px;height:32px;flex-shrink:0;border-radius:50%;background:var(--s3);display:flex;align-items:center;justify-content:center;font-size:18px;line-height:1;}
.friends-meta{flex:1;min-width:0;}
.friends-name{font-size:14px;font-weight:700;color:var(--t1);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.friends-sub{font-size:11px;color:var(--t3);margin-top:2px;}
.friends-action{background:var(--s3);border:1px solid var(--border);color:var(--t1);font-family:'Inter',sans-serif;font-size:12px;font-weight:700;padding:8px 14px;min-height:36px;border-radius:8px;cursor:pointer;white-space:nowrap;flex-shrink:0;-webkit-tap-highlight-color:transparent;touch-action:manipulation;}
.friends-action:active{transform:scale(0.97);}
.friends-action.accept{background:var(--accent);color:#0a1a00;border-color:transparent;}
.friends-action.decline{background:transparent;color:var(--t3);}
.friends-action.challenge{background:var(--accent);color:#0a1a00;border-color:transparent;}
.friends-muted{font-size:12px;color:var(--t3);padding:6px 2px;}
.friends-lb{display:flex;flex-direction:column;gap:4px;}
.friends-lb-row{display:flex;align-items:center;gap:10px;padding:6px 10px;border-radius:8px;background:var(--s2);}
.friends-lb-row.you{background:rgba(88,204,2,0.12);border:1px solid rgba(88,204,2,0.3);}
.friends-lb-rank{font-size:12px;font-weight:800;color:var(--t3);min-width:28px;}
.friends-lb-row.you .friends-lb-rank{color:#8AE042;}
.friends-lb-score{font-size:13px;font-weight:800;color:var(--t1);}
.friends-you-pill{margin-left:6px;font-size:9px;background:var(--accent);color:#0a1a00;padding:1px 5px;border-radius:4px;font-weight:800;letter-spacing:0.04em;vertical-align:middle;}
.badges-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;}
.badge-tile{background:var(--s1);border:none;border-radius:12px;padding:10px 6px;display:flex;flex-direction:column;align-items:center;gap:4px;box-shadow:0 2px 8px rgba(0,0,0,0.28);contain:layout paint style;}
.badge-tile.earned{border-color:var(--accent-b);background:var(--accent-dim);}
.badge-tile.locked{opacity:0.4;}
.badge-icon{font-size:20px;}
.badge-name{font-size:9px;font-weight:600;color:var(--t2);text-align:center;line-height:1.3;font-family:'Inter',sans-serif;}
.badge-tile.earned .badge-name{color:var(--accent);}
.avatar-spinner{width:28px;height:28px;border-radius:50%;border:3px solid rgba(34,197,94,0.25);border-top-color:var(--accent);animation:spin 0.8s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}
.avatar-menu{display:flex;flex-direction:column;gap:8px;padding:4px 0 8px;}
.avatar-menu-row{display:flex;align-items:center;gap:14px;padding:14px 16px;background:var(--s2);border:1px solid var(--border);border-radius:12px;cursor:pointer;font-family:inherit;text-align:left;color:var(--text);transition:background 0.15s,transform 0.1s;-webkit-appearance:none;appearance:none;}
.avatar-menu-row:hover{background:var(--s3);}
.avatar-menu-row:active{transform:scale(0.98);}

/* ── IMAGE CROP MODAL ── */
.crop-overlay{position:fixed;inset:0;background:#0a0a0a;z-index:600;display:flex;flex-direction:column;color:#fff;animation:fadeIn 0.18s ease;}
.crop-header{padding:calc(18px + env(safe-area-inset-top,0)) 20px 12px;text-align:center;font-size:16px;font-weight:800;letter-spacing:-0.2px;color:#fff;flex-shrink:0;}
.crop-stage{flex:1;position:relative;overflow:hidden;background:#0a0a0a;min-height:0;display:flex;align-items:center;justify-content:center;}
.crop-stage img{display:block;max-width:100%;max-height:100%;}
.crop-circle-mask .cropper-view-box,.crop-circle-mask .cropper-face{border-radius:50%;}
.crop-circle-mask .cropper-view-box{outline:2px solid #fff;outline-color:rgba(255,255,255,0.85);}
.crop-status{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.7);font-size:14px;padding:24px;text-align:center;}
.crop-status-err{color:var(--red);}
.crop-actions{display:flex;gap:10px;padding:14px 20px calc(16px + env(safe-area-inset-bottom,34px));background:#0a0a0a;flex-shrink:0;}
.light .crop-overlay{background:rgba(0,0,0,0.85);}
.light .crop-stage{background:#1a1a1a;}
.light .crop-actions{background:#1a1a1a;border-top:1px solid #2a2a2a;}
.crop-btn{flex:1;min-height:52px;padding:14px;border-radius:14px;font-family:inherit;font-size:16px;font-weight:800;cursor:pointer;border:none;transition:background 0.15s,transform 0.1s,opacity 0.15s;-webkit-appearance:none;appearance:none;}
.crop-btn:disabled{opacity:0.5;cursor:not-allowed;}
.crop-btn.primary{background:var(--accent);color:#fff;box-shadow:0 4px 20px rgba(34,197,94,0.28);}
.crop-btn.primary:hover:not(:disabled){background:#16a34a;}
.crop-btn.primary:active:not(:disabled){transform:scale(0.98);}
.crop-btn.secondary{background:rgba(255,255,255,0.1);color:#fff;}
.crop-btn.secondary:hover:not(:disabled){background:rgba(255,255,255,0.18);}
.crop-btn.secondary:active:not(:disabled){transform:scale(0.98);}

.emoji-picker-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:400;display:flex;align-items:flex-end;}
.emoji-picker-sheet{width:100%;background:var(--s1);border-radius:20px 20px 0 0;padding:20px 20px calc(20px + env(safe-area-inset-bottom,34px));animation:slideUp 0.25s cubic-bezier(0.22,1,0.36,1);}
.emoji-picker-title{font-size:14px;font-weight:700;margin-bottom:14px;text-align:center;color:var(--t2);}
/* Responsive grid: as many 44px+ columns as the sheet width allows. iPhone
   SE (~280px sheet content) gets 5 columns; standard phones 6-7; large phones
   up to 8. Tile padding pushes the tappable area to ~44px (Apple HIG). */
.emoji-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(44px,1fr));gap:6px;}
.emoji-opt{font-size:24px;padding:10px;border-radius:8px;border:none;background:transparent;cursor:pointer;transition:background 0.1s;display:flex;align-items:center;justify-content:center;}
.emoji-opt:hover,.emoji-opt.selected{background:var(--accent-dim);}

.toast{position:fixed;bottom:28px;left:50%;transform:translateX(-50%);background:var(--s2);color:var(--text);border:1px solid var(--border);padding:10px 18px;border-radius:9px;font-size:13px;font-weight:600;z-index:999;white-space:nowrap;box-shadow:var(--sh-lg);}

.cat-WorldCup .q-tag{color:#F59E0B;background:rgba(245,158,11,0.1);border-color:rgba(245,158,11,0.25);}
.cat-PL .q-tag{color:#8B5CF6;background:rgba(139,92,246,0.1);border-color:rgba(139,92,246,0.25);}
.cat-UCL .q-tag{color:#3B82F6;background:rgba(59,130,246,0.1);border-color:rgba(59,130,246,0.25);}
.cat-Euros .q-tag{color:#06B6D4;background:rgba(6,182,212,0.1);border-color:rgba(6,182,212,0.25);}
.cat-LaLiga .q-tag{color:#EF4444;background:rgba(239,68,68,0.1);border-color:rgba(239,68,68,0.25);}
.cat-Bundesliga .q-tag{color:#F97316;background:rgba(249,115,22,0.1);border-color:rgba(249,115,22,0.25);}
.cat-SerieA .q-tag{color:#10B981;background:rgba(16,185,129,0.1);border-color:rgba(16,185,129,0.25);}
.cat-Managers .q-tag{color:#6366F1;background:rgba(99,102,241,0.1);border-color:rgba(99,102,241,0.25);}
.cat-Records .q-tag{color:#EC4899;background:rgba(236,72,153,0.1);border-color:rgba(236,72,153,0.25);}
.cat-Legends .q-tag{color:#FBBF24;background:rgba(251,191,36,0.1);border-color:rgba(251,191,36,0.25);}

/* ── CATEGORY COLOUR ACCENTS ── */
.q-card{position:relative;overflow:hidden;}
.q-card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:4px;border-radius:18px 0 0 18px;}
.cat-WorldCup .q-card::before{background:#F59E0B;}
.cat-PL .q-card::before{background:#8B5CF6;}
.cat-UCL .q-card::before{background:#3B82F6;}
.cat-Euros .q-card::before{background:#06B6D4;}
.cat-LaLiga .q-card::before{background:#EF4444;}
.cat-Bundesliga .q-card::before{background:#F97316;}
.cat-SerieA .q-card::before{background:#10B981;}
.cat-Managers .q-card::before{background:#6366F1;}
.cat-Records .q-card::before{background:#EC4899;}
.cat-Legends .q-card::before{background:#FBBF24;}
.cat-ClubQuiz .q-card::before{background:var(--accent);}
/* Matching q-tag colours */
.cat-WorldCup .q-tag{color:#F59E0B;}
.cat-PL .q-tag{color:#8B5CF6;}
.cat-UCL .q-tag{color:#3B82F6;}
.cat-Euros .q-tag{color:#06B6D4;}
.cat-LaLiga .q-tag{color:#EF4444;}
.cat-Bundesliga .q-tag{color:#F97316;}
.cat-SerieA .q-tag{color:#10B981;}
.cat-Managers .q-tag{color:#6366F1;}
.cat-Records .q-tag{color:#EC4899;}
.cat-Legends .q-tag{color:#FBBF24;}

/* ── STAT GRID (used in Profile) ── */
@keyframes slideUp{from{transform:translateY(100%);}to{transform:translateY(0);}}
.stat-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:16px;}
.stat-tile{background:var(--s1);border:1px solid var(--border);border-radius:12px;padding:14px 10px;text-align:center;contain:layout paint style;}
.st-val{font-family:'JetBrains Mono','SF Mono',ui-monospace,Menlo,monospace;font-variant-numeric:tabular-nums;font-size:24px;font-weight:700;letter-spacing:-0.5px;line-height:1.1;}
/* .st-key — layout-only; visual tokens from .ds-eyebrow. */
.st-key{margin-top:4px;}

/* ── XP BAR ── */
.xp-bar-wrap{background:var(--s1);border:1px solid var(--border);border-radius:12px;padding:11px 14px 10px;margin-top:14px;}
.xp-bar-top{display:flex;align-items:center;gap:7px;margin-bottom:8px;}
.xp-level-icon{font-size:16px;}
.xp-level-name{font-size:13px;font-weight:700;letter-spacing:-0.1px;flex:1;}
.xp-total{font-family:'JetBrains Mono','SF Mono',ui-monospace,Menlo,monospace;font-variant-numeric:tabular-nums;font-size:11px;color:var(--t2);font-weight:600;}
.xp-track{height:6px;background:var(--s3);border-radius:3px;overflow:hidden;}
.xp-fill{height:100%;background:linear-gradient(90deg,#22c55e,#16a34a);border-radius:3px;transition:width 0.6s cubic-bezier(0.22,1,0.36,1);will-change:width;}
.xp-next{font-size:10.5px;color:var(--t3);margin-top:5px;font-weight:500;opacity:0.8;}
/* ── XP TOAST ── */
.xp-toast{position:fixed;bottom:72px;left:50%;transform:translateX(-50%);background:var(--accent);color:#0a1a00;padding:10px 18px;border-radius:20px;font-size:13px;font-weight:700;z-index:998;display:flex;align-items:center;gap:7px;box-shadow:0 4px 20px rgba(34,197,94,0.35);animation:xpPop 0.3s cubic-bezier(0.22,1,0.36,1);}
@keyframes xpPop{from{opacity:0;transform:translateX(-50%) scale(0.85);}to{opacity:1;transform:translateX(-50%) scale(1);}}
.xp-t-icon{font-size:16px;}
.wr-summary{font-family:'Inter',sans-serif;font-size:11px;font-weight:600;color:var(--t2);letter-spacing:0.2px;cursor:pointer;padding:10px 0;list-style:none;display:flex;align-items:center;gap:6px;}
.wr-summary::before{content:"▶";font-size:8px;transition:transform 0.2s;}
details[open] .wr-summary::before{transform:rotate(90deg);}

.wrong-review{background:var(--s1);border:1px solid var(--border);border-radius:14px;padding:14px 16px;margin-bottom:12px;}
.wr-item{padding:10px 0;border-bottom:1px solid var(--border);}
.wr-item:last-child{border-bottom:none;padding-bottom:0;}
.wr-q{font-size:13px;color:var(--t2);line-height:1.5;margin-bottom:5px;}
.wr-a{font-size:13px;font-weight:700;color:var(--green);display:flex;align-items:center;gap:6px;}
.wr-tick{width:18px;height:18px;background:var(--green);color:#0a1a00;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;flex-shrink:0;}
.xp-streak-pill{background:rgba(251,191,36,0.12);border:1px solid rgba(251,191,36,0.25);color:var(--gold);font-size:11px;font-weight:700;padding:2px 8px;border-radius:20px;font-family:'Inter',sans-serif;}
.streak-toast{position:fixed;bottom:72px;left:50%;transform:translateX(-50%);background:var(--gold);color:#1a0a00;padding:10px 18px;border-radius:20px;font-size:13px;font-weight:700;z-index:998;display:flex;align-items:center;gap:7px;box-shadow:0 4px 20px rgba(251,191,36,0.4);animation:xpPop 0.3s cubic-bezier(0.22,1,0.36,1);white-space:nowrap;}
.xp-earned-badge{text-align:center;font-size:13px;font-weight:700;color:var(--accent);background:var(--accent-dim);border:1px solid var(--accent-b);border-radius:8px;padding:8px 14px;margin-bottom:8px;}

/* ── IQ HISTORY ── */
.iq-history{background:var(--s2);border-radius:12px;padding:14px 16px;margin-bottom:12px;}
.iq-hist-label{font-family:'Inter',sans-serif;font-size:9px;color:var(--t3);letter-spacing:0.2px;margin-bottom:10px;}
.iq-hist-bars{display:flex;align-items:flex-end;gap:6px;height:52px;}
.iq-hist-col{display:flex;flex-direction:column;align-items:center;gap:4px;flex:1;}
.iq-hist-bar{width:100%;border-radius:3px 3px 0 0;min-height:4px;transition:height 0.4s cubic-bezier(0.22,1,0.36,1);}
.iq-hist-n{font-family:'JetBrains Mono','SF Mono',ui-monospace,Menlo,monospace;font-variant-numeric:tabular-nums;font-size:9px;color:var(--t3);font-weight:500;}


/* ── SOCIAL HUB ── */
.social-intro{font-size:14px;color:var(--t2);line-height:1.7;margin-bottom:18px;}
.social-card{background:var(--s1);border-radius:16px;padding:18px 16px;display:flex;align-items:flex-start;gap:14px;cursor:pointer;margin-bottom:12px;transition:background 0.18s,transform 0.12s;box-shadow:0 2px 12px rgba(0,0,0,0.35);touch-action:manipulation;-webkit-tap-highlight-color:transparent;}
.social-card:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(0,0,0,0.4);}
.social-card:active{transform:scale(0.98);}
.social-tip{font-size:12px;color:var(--t3);background:var(--s1);border-radius:12px;padding:12px 14px;line-height:1.6;margin-top:4px;box-shadow:0 1px 6px rgba(0,0,0,0.2);}

/* ── ONBOARDING ── */
.onboard-wrap{position:fixed;inset:0;background:radial-gradient(ellipse at 50% 0%, #1a1d27 0%, #0a0a0a 65%);z-index:500;display:flex;flex-direction:column;padding:24px 0 0;color:var(--text);overflow:hidden;}
.light .onboard-wrap{background:radial-gradient(ellipse at 50% 0%, #FFFFFF 0%, #F2F2F7 65%);}
.onboard-progress{display:flex;gap:6px;padding:0 24px;margin-bottom:24px;}
.onboard-bar{flex:1;height:4px;border-radius:2px;background:rgba(255,255,255,0.12);transition:background 0.25s;}
.light .onboard-bar{background:rgba(0,0,0,0.08);}
.onboard-bar.done{background:var(--accent);}
.onboard-bar.active{background:var(--accent);box-shadow:0 0 8px rgba(34,197,94,0.5);}
.onboard-viewport{flex:1;overflow:hidden;width:100%;}
.onboard-track{display:flex;height:100%;width:200%;transition:transform 0.38s cubic-bezier(0.22,1,0.36,1);}
.onboard-step{width:50%;flex-shrink:0;display:flex;flex-direction:column;align-items:center;padding:8px 24px 24px;overflow-y:auto;-webkit-overflow-scrolling:touch;text-align:center;}
.onboard-step-top{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;}
.onboard-icon{font-size:88px;line-height:1;filter:drop-shadow(0 6px 16px rgba(0,0,0,0.35));margin-bottom:18px;}
.onboard-title{font-size:26px;font-weight:900;letter-spacing:-0.6px;color:var(--text);margin-bottom:10px;}
.onboard-body{font-size:15px;color:var(--t2);line-height:1.6;max-width:320px;margin-bottom:24px;}
.onboard-btn{position:relative;width:100%;max-width:340px;padding:16px;background:#58CC02;border:none;border-radius:14px;font-family:inherit;font-size:16px;font-weight:800;color:#0A0A0A;cursor:pointer;letter-spacing:0.01em;transition:opacity 120ms ease,filter 120ms ease;-webkit-appearance:none;appearance:none;-webkit-text-fill-color:#0A0A0A;}
.onboard-btn:hover{filter:brightness(1.06);}
.onboard-btn:active{opacity:0.85;}
.onboard-btn-inline{max-width:180px;flex:1;}
.onboard-skip{background:none;border:none;color:var(--t3);font-size:14px;cursor:pointer;font-family:inherit;font-weight:600;padding:12px 16px;-webkit-appearance:none;appearance:none;-webkit-text-fill-color:currentColor;}
.onboard-skip:hover{color:var(--t2);}
.onboard-actions{display:flex;gap:10px;align-items:center;justify-content:center;width:100%;max-width:340px;margin-top:14px;padding-bottom:8px;}
.onboard-club-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;width:100%;max-width:360px;margin:8px 0 12px;}
.onboard-club{display:flex;flex-direction:column;align-items:center;gap:6px;padding:12px 6px;background:var(--s1);border:2px solid var(--border);border-radius:12px;cursor:pointer;font-family:inherit;color:var(--text);transition:border-color 0.15s,background 0.15s,transform 0.1s;-webkit-appearance:none;appearance:none;-webkit-text-fill-color:currentColor;}
.onboard-club:hover{background:var(--s2);}
.onboard-club:active{transform:scale(0.97);}
.onboard-club.on{border-color:var(--accent);background:var(--accent-dim);box-shadow:0 0 0 3px rgba(34,197,94,0.15);}
.onboard-club-name{font-size:11px;font-weight:700;color:var(--t1);line-height:1.2;text-align:center;}
.onboard-skill-list{display:flex;flex-direction:column;gap:10px;width:100%;max-width:360px;}
.onboard-skill{display:flex;align-items:center;gap:14px;padding:14px 16px;background:var(--s1);border:2px solid var(--border);border-radius:14px;cursor:pointer;text-align:left;font-family:inherit;color:var(--text);transition:border-color 0.15s,background 0.15s,transform 0.1s;-webkit-appearance:none;appearance:none;-webkit-text-fill-color:currentColor;}
.onboard-skill:hover{background:var(--s2);}
.onboard-skill:active{transform:scale(0.98);}
.onboard-skill.on{border-color:var(--accent);background:var(--accent-dim);box-shadow:0 0 0 3px rgba(34,197,94,0.15);}
.onboard-skill-icon{font-size:28px;flex-shrink:0;}
.onboard-skill-body{flex:1;min-width:0;}
.onboard-skill-name{font-size:15px;font-weight:800;color:var(--t1);margin-bottom:2px;}
.onboard-skill-desc{font-size:12px;color:var(--t2);line-height:1.4;}


/* ── QUIT MODAL ── */
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.55);display:flex;align-items:center;justify-content:center;z-index:200;padding:20px;padding-bottom:max(env(safe-area-inset-bottom,0px),20px);animation:fadeIn 0.15s ease;}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes profileSkeletonPulse{0%,100%{opacity:0.4}50%{opacity:0.7}}
.modal-box{background:var(--s1);border-radius:18px;padding:24px 22px;width:100%;max-width:320px;box-shadow:var(--sh-lg);}
.modal-title{font-size:17px;font-weight:800;letter-spacing:-0.3px;color:var(--text);margin-bottom:8px;}
.modal-body{font-size:14px;color:var(--t2);line-height:1.6;margin-bottom:20px;}
.modal-btns{display:flex;gap:10px;}
.modal-btn{flex:1;padding:13px;border-radius:11px;font-family:'Inter',sans-serif;font-size:14px;font-weight:700;cursor:pointer;border:none;transition:opacity 0.15s;}
.modal-cancel{background:var(--s2);color:var(--text);}
.modal-confirm{background:var(--red);color:#fff;}
.modal-cancel:hover{opacity:0.85;}
.modal-confirm:hover{opacity:0.85;}

/* ── NEXT BUTTON ── */
.feedback{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;}
.next-btn{padding:9px 18px;background:var(--s1);border:1.5px solid var(--border2);border-radius:10px;font-family:'Inter',sans-serif;font-size:13px;font-weight:700;color:var(--text);cursor:pointer;white-space:nowrap;transition:all 0.15s;flex-shrink:0;}
.next-btn:hover{background:var(--s2);border-color:var(--accent);color:var(--accent);}
.next-btn-primary{position:sticky;bottom:16px;z-index:5;width:100%;min-height:54px;padding:16px;margin-top:14px;background:#58CC02;color:#0A0A0A;border:none;border-radius:14px;font-family:'Inter',sans-serif;font-size:16px;font-weight:800;letter-spacing:0.01em;cursor:pointer;transition:opacity 120ms ease,filter 120ms ease;display:flex;align-items:center;justify-content:center;gap:6px;-webkit-appearance:none;appearance:none;-webkit-text-fill-color:#0A0A0A;box-shadow:0 6px 20px rgba(10,10,10,0.4);}
.next-btn-primary:hover{filter:brightness(1.06);}
.next-btn-primary:active{opacity:0.85;}
.next-btn-primary:disabled{opacity:0.5;cursor:not-allowed;pointer-events:none;}

/* ── ONLINE 1V1 ────────────────────────────────────────────────────────── */
.og-code-input{font-family:'JetBrains Mono','SF Mono',ui-monospace,Menlo,monospace;letter-spacing:8px;font-size:24px;text-align:center;text-transform:uppercase;}
.og-code-box{background:var(--s1);border:1px solid var(--border);border-radius:18px;padding:20px 16px;text-align:center;cursor:pointer;margin-bottom:18px;transition:background 0.15s,border-color 0.15s;}
.og-code-box:hover{background:var(--s2);border-color:var(--border2);}
.og-code-label{font-size:10px;font-weight:800;letter-spacing:0.18em;color:var(--t3);text-transform:uppercase;}
.og-code-val{font-family:'JetBrains Mono','SF Mono',ui-monospace,Menlo,monospace;font-size:42px;font-weight:800;letter-spacing:8px;color:var(--accent);margin-top:8px;}
.og-code-hint{font-size:11px;color:var(--t3);margin-top:6px;}
.og-waiting{display:flex;flex-direction:column;align-items:center;gap:10px;padding:20px 0;}
.og-waiting-text{font-size:14px;color:var(--t2);font-weight:600;}
.og-pulse{display:flex;gap:6px;}
.og-pulse span{width:8px;height:8px;border-radius:50%;background:var(--accent);animation:ogPulse 1.2s ease infinite;}
.og-pulse span:nth-child(2){animation-delay:0.2s;}
.og-pulse span:nth-child(3){animation-delay:0.4s;}
@keyframes ogPulse{0%,100%{opacity:0.3;transform:scale(0.85);}50%{opacity:1;transform:scale(1.1);}}

.og-vs{display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:center;margin:18px 0 4px;}
.og-player{position:relative;display:flex;flex-direction:column;align-items:center;gap:6px;padding:18px 12px;background:var(--s1);border:1px solid var(--border);border-radius:16px;}
.og-player-avatar{font-size:36px;line-height:1;}
.og-player-name{font-size:14px;font-weight:800;color:var(--text);max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.og-ready{font-size:11px;color:var(--accent);font-weight:700;letter-spacing:0.04em;}
.og-you{position:absolute;top:6px;right:6px;background:var(--accent);color:#0A0A0A;font-size:9px;font-weight:800;padding:2px 6px;border-radius:6px;letter-spacing:0.04em;}
.og-vs-divider{font-size:14px;font-weight:900;color:var(--t3);letter-spacing:0.12em;}

.og-mode-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
.og-mode-card{display:flex;flex-direction:column;align-items:flex-start;gap:3px;padding:12px;border-radius:12px;background:var(--s1);border:1px solid var(--border);cursor:pointer;font-family:inherit;text-align:left;color:var(--text);transition:background 0.15s,border-color 0.15s,transform 0.05s;-webkit-appearance:none;appearance:none;}
.og-mode-card:hover{background:var(--s2);border-color:var(--border2);}
.og-mode-card:active{transform:scale(0.97);}
.og-mode-card.selected{border-color:var(--accent);background:rgba(88,204,2,0.1);}
.og-mode-icon{font-size:22px;line-height:1;}
.og-mode-name{font-size:13px;font-weight:800;color:var(--text);margin-top:2px;}
.og-mode-desc{font-size:11px;color:var(--t3);line-height:1.3;}

.og-progress{display:grid;grid-template-columns:1fr 2fr 1fr;gap:10px;align-items:center;margin:12px 0 18px;padding:12px;background:var(--s1);border:1px solid var(--border);border-radius:14px;}
.og-progress-mine{text-align:left;}
.og-progress-opp{text-align:right;}
.og-progress-label{font-size:10px;font-weight:800;letter-spacing:0.12em;color:var(--t3);text-transform:uppercase;}
.og-progress-val{font-family:'JetBrains Mono','SF Mono',ui-monospace,Menlo,monospace;font-size:15px;font-weight:800;color:var(--text);font-variant-numeric:tabular-nums;}
.og-progress-bar{height:6px;background:var(--s2);border-radius:999px;overflow:hidden;}
.og-progress-fill{height:100%;background:linear-gradient(90deg,#58CC02,#46A302);border-radius:999px;transition:width 0.4s cubic-bezier(0.22,1,0.36,1);}

.og-q{padding:18px 12px 22px;background:var(--s1);border:1px solid var(--border);border-radius:16px;margin-bottom:14px;text-align:center;}
.og-q-number{font-size:11px;font-weight:800;letter-spacing:0.14em;color:var(--accent);text-transform:uppercase;margin-bottom:10px;}
.og-q-text{font-size:17px;font-weight:700;color:var(--text);line-height:1.4;}
.og-options{display:flex;flex-direction:column;gap:8px;}
.og-option{display:flex;align-items:center;gap:12px;width:100%;padding:14px 14px;background:var(--s1);border:1px solid var(--border);border-radius:12px;color:var(--text);font-family:inherit;text-align:left;cursor:pointer;transition:background 0.15s,border-color 0.15s,transform 0.05s;-webkit-appearance:none;appearance:none;}
.og-option:hover:not(:disabled){background:var(--s2);border-color:var(--border2);}
.og-option:active:not(:disabled){transform:scale(0.98);}
.og-option.picked{border-color:var(--accent);background:rgba(88,204,2,0.14);}
.og-option.locked{cursor:not-allowed;opacity:0.7;}
.og-option-letter{flex-shrink:0;width:30px;height:30px;border-radius:8px;background:var(--s2);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;color:var(--t2);}
.og-option.picked .og-option-letter{background:var(--accent);color:#0A0A0A;}
.og-option-text{flex:1;font-size:14px;font-weight:600;line-height:1.35;}
.og-locked{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:14px;padding:10px 14px;background:rgba(88,204,2,0.12);border:1px solid rgba(88,204,2,0.4);border-radius:12px;font-size:13px;font-weight:700;color:var(--accent);}

.og-finished{display:flex;flex-direction:column;align-items:center;text-align:center;padding:40px 16px;background:var(--s1);border:1px solid var(--border);border-radius:18px;}
.og-finished-title{font-size:18px;font-weight:800;color:var(--text);}
.og-finished-sub{font-size:13px;color:var(--t2);margin-top:6px;}
.og-finished-sub strong{color:var(--accent);}

.og-results-headline{text-align:center;font-size:22px;font-weight:800;color:var(--text);padding:14px 0 8px;}
.og-results-headline strong{color:var(--accent);}
.og-result-vs{display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:center;}
.og-result-side{position:relative;padding:18px 10px;background:var(--s1);border:1px solid var(--border);border-radius:16px;text-align:center;}
.og-result-side.winner{border-color:var(--accent);background:rgba(88,204,2,0.08);box-shadow:0 4px 18px rgba(88,204,2,0.15);}
.og-result-name{font-size:13px;font-weight:700;color:var(--t2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.og-result-score{font-family:'JetBrains Mono','SF Mono',ui-monospace,Menlo,monospace;font-size:46px;font-weight:900;color:var(--text);font-variant-numeric:tabular-nums;line-height:1;margin-top:6px;}
.og-result-side.winner .og-result-score{color:var(--accent);}
.og-result-divider{font-size:22px;font-weight:900;color:var(--t3);}

.og-breakdown{display:flex;flex-direction:column;gap:6px;background:var(--s1);border:1px solid var(--border);border-radius:14px;padding:8px;}
.og-breakdown-row{display:flex;align-items:center;gap:10px;padding:8px;border-radius:8px;}
.og-breakdown-row:nth-child(odd){background:rgba(255,255,255,0.02);}
.light .og-breakdown-row:nth-child(odd){background:rgba(0,0,0,0.02);}
.og-breakdown-q{flex:1;min-width:0;font-size:12px;color:var(--t2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.og-breakdown-marks{display:flex;gap:6px;flex-shrink:0;}
.og-mark{width:22px;height:22px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;background:rgba(255,90,90,0.16);color:#FF5A5A;}
.og-mark.ok{background:rgba(88,204,2,0.16);color:var(--accent);}

/* ── FOOTBALL WORDLE ────────────────────────────────────────────────────── */
.wd-screen{display:flex;flex-direction:column;gap:14px;padding:10px 0 8px;min-height:calc(100vh - 100px);min-height:calc(100dvh - 100px);}
.wd-header{display:flex;align-items:center;gap:12px;}
.wd-header-text{flex:1;min-width:0;}
.wd-title{font-size:18px;font-weight:800;letter-spacing:-0.3px;color:var(--text);}
.wd-sub{font-size:11px;color:var(--t3);margin-top:2px;letter-spacing:0.02em;}
.wd-countdown{flex-shrink:0;text-align:right;padding:6px 10px;background:var(--s1);border:1px solid var(--border);border-radius:10px;}
.wd-countdown-label{font-size:9px;font-weight:700;letter-spacing:0.16em;color:var(--t3);text-transform:uppercase;}
.wd-countdown-time{font-family:'JetBrains Mono','SF Mono',ui-monospace,Menlo,monospace;font-variant-numeric:tabular-nums;font-size:13px;font-weight:700;color:var(--accent);margin-top:1px;}

.wd-grid{display:flex;flex-direction:column;gap:6px;align-items:center;justify-content:flex-start;flex:0 0 auto;margin-top:auto;padding:8px 0;}
/* Once the game has ended the keyboard collapses and a result card slides in
   below, so the grid no longer needs to fill remaining space. Hug content,
   tighten internal gaps, and leave a clean 14px breathing zone above the
   result card. Row max-width drops ~20% so the tile block feels less
   imposing on wider devices. iPhone SE is unaffected — the 100vw-80px
   ceiling already constrained it before. */
.wd-grid.wd-grid--ended{flex:0 0 auto;gap:4px;padding:4px 0;margin:0 0 14px;}
.wd-grid.wd-grid--ended .wd-row{gap:4px;max-width:min(310px,calc((100vw - 80px)));}
.wd-grid.wd-grid--ended .wd-tile{font-size:clamp(16px,5.2vw,24px);}
.wd-row{display:grid;grid-template-columns:repeat(var(--wd-cols),1fr);gap:6px;width:100%;max-width:min(440px,calc((100vw - 32px)));}
.wd-tile{aspect-ratio:1/1;display:flex;align-items:center;justify-content:center;font-size:clamp(20px,6.5vw,30px);font-weight:800;letter-spacing:-0.5px;color:var(--text);background:transparent;border:2px solid var(--border);border-radius:6px;text-transform:uppercase;user-select:none;transition:transform 80ms ease;}
.wd-tile.wd-filled{border-color:var(--border2);transform:scale(1.04);}
.wd-tile.wd-green{background:#58CC02;border-color:#58CC02;color:#0A0A0A;}
.wd-tile.wd-yellow{background:#FFC107;border-color:#FFC107;color:#0A0A0A;}
.wd-tile.wd-grey{background:var(--s2);border-color:var(--s2);color:var(--text);}
.html.light .wd-tile.wd-grey,.light .wd-tile.wd-grey{background:#9CA0AB;border-color:#9CA0AB;color:#fff;}
.wd-flip{animation:wdFlip 600ms ease forwards;animation-fill-mode:both;}
@keyframes wdFlip{
  0%{transform:rotateX(0deg);}
  45%{transform:rotateX(90deg);background:transparent;border-color:var(--border);color:var(--text);}
  55%{transform:rotateX(90deg);}
  100%{transform:rotateX(0deg);}
}
.wd-shake{animation:wdShake 420ms cubic-bezier(.36,.07,.19,.97);}
@keyframes wdShake{
  10%,90%{transform:translateX(-2px);}
  20%,80%{transform:translateX(4px);}
  30%,50%,70%{transform:translateX(-8px);}
  40%,60%{transform:translateX(8px);}
}

.wd-result{background:var(--s1);border:1px solid var(--border);border-radius:14px;padding:14px;text-align:center;display:flex;flex-direction:column;gap:8px;animation:wdFadeIn 320ms ease;}
@keyframes wdFadeIn{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}
.wd-result-title{font-size:18px;font-weight:800;letter-spacing:-0.3px;color:var(--text);}
.wd-result-sub{font-size:14px;color:var(--t2);}
.wd-result-sub strong{color:var(--accent);letter-spacing:0.5px;font-weight:800;}
.wd-result-foot{font-size:11px;color:var(--t3);margin-top:2px;}
.wd-share{margin:4px auto 0;padding:10px 22px;background:#58CC02;color:#0A0A0A;border:none;border-radius:10px;font-family:inherit;font-size:14px;font-weight:800;cursor:pointer;transition:opacity 120ms ease;-webkit-text-fill-color:#0A0A0A;}
.wd-share:active{opacity:0.85;}

.wd-keyboard{display:flex;flex-direction:column;gap:6px;padding:2px 0 4px;margin-bottom:auto;}
.wd-kb-row{display:flex;justify-content:center;gap:5px;}
.wd-key{flex:1;min-width:0;height:48px;display:flex;align-items:center;justify-content:center;background:var(--s3);color:var(--text);border:none;border-radius:6px;font-family:inherit;font-size:14px;font-weight:700;cursor:pointer;text-transform:uppercase;user-select:none;-webkit-tap-highlight-color:transparent;transition:background 0.12s,transform 0.05s;padding:0;}
.wd-key:active{transform:scale(0.96);}
.wd-key-action{flex:1.6;font-size:11px;letter-spacing:0.1em;background:var(--s1);border:1px solid var(--border);}
.wd-key-green{background:#58CC02;color:#0A0A0A;}
.wd-key-yellow{background:#FFC107;color:#0A0A0A;}
.wd-key-grey{background:#3a3f55;color:rgba(255,255,255,0.6);}
.light .wd-key-grey{background:#9CA0AB;color:#fff;}
.wd-key-enter{display:flex;align-items:center;justify-content:center;width:100%;height:52px;margin-top:2px;background:#58CC02;color:#0A0A0A;border:none;border-radius:8px;font-family:inherit;font-size:16px;font-weight:800;letter-spacing:0.08em;cursor:pointer;-webkit-appearance:none;appearance:none;-webkit-tap-highlight-color:transparent;-webkit-text-fill-color:#0A0A0A;box-shadow:0 4px 0 #46A302;transform:translateY(0);transition:transform 80ms ease,box-shadow 80ms ease,filter 120ms;user-select:none;padding:0;}
.wd-key-enter:hover{filter:brightness(1.06);}
.wd-key-enter:active{transform:translateY(2px);box-shadow:0 2px 0 #46A302;}

/* Home middle row — Wordle + Multiplayer side by side. Sits between the
   full-width Daily hero and the WC2026 banner. */
.hero-pair{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;}
.hero-pair-card{position:relative;display:flex;flex-direction:column;align-items:flex-start;gap:4px;padding:14px 14px 16px;min-height:118px;background:var(--s1);color:var(--text);border:1px solid var(--border);border-radius:16px;cursor:pointer;font-family:inherit;text-align:left;transition:background 0.15s,border-color 0.15s,transform 0.1s;box-shadow:0 2px 10px rgba(0,0,0,0.22);overflow:hidden;-webkit-appearance:none;appearance:none;-webkit-tap-highlight-color:transparent;contain:layout paint style;}
.hero-pair-card:hover{background:var(--s2);border-color:var(--border2);}
.hero-pair-card:active{transform:scale(0.98);}
.hero-pair-eyebrow{font-size:10px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:var(--accent);}
.hero-pair-status{font-size:11.5px;color:var(--t3);margin-top:auto;line-height:1.3;}
.hero-pair-status strong{color:var(--accent);font-weight:700;}
.hero-pair-card.wordle .hero-pair-eyebrow{color:#FFC107;}

/* Daily section — Challenge + Wordle paired cards. The Challenge card keeps
   the flame gradient from the original hero so the Daily Challenge identity
   stays recognisable; the Wordle half uses the standard surface treatment
   with a green eyebrow and green emoji. */
.daily-section-eyebrow{margin-top:4px;margin-bottom:8px;}
.daily-pair{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:24px;}
.daily-pair-card{position:relative;display:flex;flex-direction:column;align-items:flex-start;gap:3px;padding:13px 14px 16px;min-height:128px;border-radius:16px;cursor:pointer;font-family:inherit;text-align:left;overflow:hidden;-webkit-appearance:none;appearance:none;-webkit-tap-highlight-color:transparent;border:1px solid var(--border);background:var(--s1);color:var(--text);transition:background 0.15s,border-color 0.15s,transform 0.1s;box-shadow:0 2px 10px rgba(0,0,0,0.22);contain:layout paint style;}
.daily-pair-card:hover{background:var(--s2);border-color:var(--border2);}
.daily-pair-card:active{transform:scale(0.98);}
.daily-pair-card.challenge{background:linear-gradient(135deg,#FF6A00 0%,#FFC107 100%);border-color:transparent;color:#1A0F05;-webkit-text-fill-color:#1A0F05;}
.daily-pair-card.challenge:hover{background:linear-gradient(135deg,#FF7A14 0%,#FFCD2A 100%);border-color:transparent;}
.daily-pair-eyebrow{font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:var(--accent);}
.daily-pair-card.challenge .daily-pair-eyebrow{color:rgba(10,10,10,0.7);}
/* Today's Puzzle — deep indigo gradient pairs with Today's 7's orange via
   warm/cool contrast. Cool tones signal puzzle/cognition; orange signals
   urgency/action. Each card registers as its own thing instead of two
   warm CTAs competing for the same kind of attention. */
.daily-pair-card.wordle{background:linear-gradient(135deg,#3B1F8A 0%,#7C3AED 100%);border-color:transparent;color:#FFFFFF;-webkit-text-fill-color:#FFFFFF;}
.daily-pair-card.wordle:hover{background:linear-gradient(135deg,#472999 0%,#8B4FFA 100%);border-color:transparent;}
.daily-pair-card.wordle .daily-pair-eyebrow{color:rgba(255,255,255,0.78);}
.daily-pair-card.wordle .daily-pair-status{color:rgba(255,255,255,0.85);}
.daily-pair-card.wordle .daily-pair-status strong{color:#FFFFFF;font-weight:800;}
.daily-pair-title{font-size:22px;font-weight:900;line-height:1.05;letter-spacing:-0.6px;margin-top:3px;color:inherit;}
.daily-pair-status{font-size:11.5px;line-height:1.3;margin-top:auto;color:var(--t3);}
.daily-pair-card.challenge .daily-pair-status{color:rgba(10,10,10,0.78);}
.daily-pair-status strong{font-weight:800;color:var(--accent);}
.daily-pair-card.challenge .daily-pair-status strong{color:#1A0F05;}
.daily-pair-emoji{position:absolute;right:-6px;bottom:-10px;font-size:54px;opacity:0.9;pointer-events:none;filter:drop-shadow(0 4px 12px rgba(0,0,0,0.3));}

/* ════════════════════════════════════════════════════════════════════
   DESKTOP NAV (Phase 2/5)
   ────────────────────────────────────────────────────────────────────
   Left sidebar navigation, fixed to the viewport at desktop sizes only.
   Hidden by default; shown at >= 1024px in regular browser mode; reset
   to hidden in PWA standalone. Phase 3 will hide the existing tab bar
   at desktop so this becomes the sole navigation.
   ════════════════════════════════════════════════════════════════════ */
.desktop-nav { display: none; }
.dn-brand {
  font-family: 'Inter', sans-serif;
  font-size: 19px;
  font-weight: 900;
  letter-spacing: -0.02em;
  color: var(--t1);
  padding: 0 12px 8px;
}
.dn-brand em {
  color: var(--accent);
  font-style: normal;
}
.dn-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.dn-list button {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  width: 100%;
  padding: 10px 12px 10px 16px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: var(--t2);
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
}
.dn-list button::before {
  content: '';
  position: absolute;
  left: 0; top: 8px; bottom: 8px;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: transparent;
  transition: background 0.12s;
}
.dn-list button:hover { background: var(--s1); color: var(--t1); }
.dn-list button[data-active="true"] {
  color: var(--t1);
  background: var(--s1);
}
.dn-list button[data-active="true"]::before {
  background: var(--accent);
}
.dn-divider {
  height: 1px;
  margin: 10px 16px;
  background: var(--border);
}
.dn-dot {
  display: inline-block;
  width: 7px; height: 7px;
  border-radius: 50%;
  background: #FF4B4B;
  margin-left: 4px;
}
.dn-cta {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px 12px;
  border-top: 1px solid var(--border);
}
.dn-cta-eyebrow {
  font-family: 'Inter', sans-serif;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--t3);
  margin-bottom: 4px;
}
.dn-cta-badge {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 12px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--t2);
  border-radius: 9px;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 700;
  text-decoration: none;
  transition: background 0.12s, color 0.12s, border-color 0.12s;
}
.dn-cta-badge:hover {
  background: var(--s1);
  color: var(--t1);
  border-color: var(--border2);
}

/* ════════════════════════════════════════════════════════════════════
   DESKTOP APP REFLOW (Tier 1 + Tier 2)
   ────────────────────────────────────────────────────────────────────
   At >= 1024px viewport in regular browser mode:
     - .app widens 420 -> 640px (Tier 1)
     - .play-grid (mode grid) goes 2 -> 3 cols (Tier 1)
     - .tab-bar repositions from bottom-fixed to top-sticky (Tier 2)
     - .tab-item active-pill flips top -> bottom (Tier 2)

   PWA standalone (any size) and mobile (< 1024px): byte-identical to
   the original mobile experience. The standalone killswitch at the
   bottom uses !important to defend against the desktop rules also
   matching when an installed PWA happens to run at >= 1024 width.

   No React changes — this is pure CSS responding to viewport.
   ════════════════════════════════════════════════════════════════════ */
@media (min-width: 1024px) {
  .app {
    max-width: 640px;
    padding: 0 24px 40px;
  }
  .play-grid {
    grid-template-columns: 1fr 1fr 1fr;
  }
  .tab-bar {
    /* Phase 3: tab bar replaced by DesktopNav at desktop sizes. The
       Tier 2 repositioning rules below are inert when display:none
       but kept for revert-path clarity. */
    display: none;
    position: sticky;
    top: 52px;
    bottom: auto;
    left: auto;
    transform: none;
    width: 100%;
    max-width: none;
    height: 56px;
    margin: 0;
    padding-top: 0;
    padding-bottom: 0;
    border-top: none;
    border-bottom: 1px solid var(--border);
    border-radius: 0;
    box-shadow: none;
  }
  .tab-item.active::before {
    top: auto;
    bottom: 4px;
  }
  .home-stat-chip-desktop-only { display: flex; }
  /* Local multiplayer requires passing a single device — desktop has no
     equivalent gesture. Hide the option in the friends-picker sheet at
     desktop sizes; the Multiplayer hero card on Home routes straight to
     Online 1v1 in that case. PWA standalone reset defends below. */
  .diff-option-local { display: none; }
  /* Multiplayer hero subtitle — swap mobile copy ("Online or local") for
     the desktop variant ("Challenge someone online") since Local is
     hidden above. Two spans toggled via display so users can still
     select/copy the visible variant. */
  .hero-online-sub-mobile { display: none; }
  .hero-online-sub-desktop { display: inline; }
  .desktop-nav {
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 52px;
    left: 0;
    width: 220px;
    height: calc(100vh - 52px);
    overflow-y: auto;
    padding: 14px 12px 16px;
    background: var(--bg);
    border-right: 1px solid var(--border);
    z-index: 40;
  }
  .ds-eyebrow {
    font-size: 12px;
    color: var(--t2);
  }
  /* Hover-only effect — touch devices won't match @media (hover: hover). */
  @media (hover: hover) {
    .play-card:hover {
      border-color: rgba(88,204,2,0.45);
      box-shadow: 0 2px 10px rgba(0,0,0,0.22), 0 0 0 1px rgba(88,204,2,0.35), 0 4px 24px rgba(88,204,2,0.12);
    }
  }
}
@media (min-width: 1280px) {
  /* Widen the main column at >= 1280px and anchor it 40px from the
     sidebar so the two read as adjacent UI rather than separated by a
     dead zone. Pure centering (margin: 0 auto) put a ~410px gap between
     sidebar and column at 1920+ which read as abandoned space. Anchor-
     left at 640px (commit 0cfc95c) ALSO felt abandoned because the
     column lacked presence; 880 with a 40px breath has enough weight
     to feel intentional. All viewport variance gets absorbed by the
     right-side margin (margin-right: auto). */
  .app {
    max-width: 880px;
    margin-left: 40px;
    margin-right: auto;
  }
}
@media (min-width: 1024px) {
  /* Drop the in-app wordmark at desktop — DesktopNav owns branding. */
  .hdr .logo { display: none; }
  /* Hide the entire .hdr at desktop. Level bar was removed (Profile
     screen carries level info via .profile-level-badge), and the
     Settings cog is redundant on desktop because DesktopNav has its
     own Settings button. With nothing to render, .hdr becomes pure
     vertical padding — kill it so greeting is the first content. */
  .hdr { display: none; }
}
@media (display-mode: standalone) {
  .app {
    max-width: 420px !important;
    padding: 0 20px 100px !important;
    margin-left: auto !important;
    margin-right: auto !important;
  }
  .play-grid {
    grid-template-columns: 1fr 1fr !important;
  }
  .tab-bar {
    display: flex !important;
    position: fixed !important;
    top: auto !important;
    bottom: 0 !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    width: 100% !important;
    max-width: 420px !important;
    height: calc(58px + max(env(safe-area-inset-bottom,34px),34px)) !important;
    margin: 0 !important;
    padding-top: 6px !important;
    padding-bottom: max(env(safe-area-inset-bottom,34px),34px) !important;
    border-top: 0.5px solid rgba(255,255,255,0.08) !important;
    border-bottom: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
  }
  .tab-item.active::before {
    top: 6px !important;
    bottom: auto !important;
  }
  .home-stat-chip-desktop-only { display: none !important; }
  .diff-option-local { display: flex !important; }
  .hero-online-sub-mobile { display: inline !important; }
  .hero-online-sub-desktop { display: none !important; }
  .desktop-nav { display: none !important; }
  .hdr { display: flex !important; }
  .hdr .logo { display: block !important; }
  .ds-eyebrow {
    font-size: 11px !important;
    color: var(--t3) !important;
  }
  .play-card:hover {
    border-color: var(--border2) !important;
    box-shadow: 0 2px 10px rgba(0,0,0,0.22) !important;
  }
}
`;



// ─── CLUB QUIZ PACKS (Pro feature — starter content) ────────────────────────
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
    name: "Real Madrid", icon: "⚪", color: "#FEBE10",
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
};

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
    onAnswer(correct);
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
    }
  } catch {}
}

function haptic(type) {
  try {
    if (typeof navigator === "undefined" || !navigator.vibrate) return;
    if (type === "correct") navigator.vibrate(40);
    else if (type === "wrong") navigator.vibrate([30, 20, 30]);
    else if (type === "soft" || type === "select") navigator.vibrate(15);
    else if (type === "heavy") navigator.vibrate(100);
    else if (type === "hardCorrect") navigator.vibrate([30, 40, 30, 40, 60]);  // Triumphant triple-buzz for hard questions
    else if (type === "levelup") navigator.vibrate([50, 30, 50, 30, 100]);
  } catch {}
}

// ─── HOT STREAK ENGINE ────────────────────────────────────────────────────────
function HotStreakEngine({ questions, onComplete, onBack }) {
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [picked, setPicked] = useState(null); // { choice, correct } | null
  const [done, setDone] = useState(false);
  const timerRef = useRef(null);
  const q = questions[idx % questions.length];

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); setDone(true); return 0; }
        if (t === 11) { try { haptic("select"); } catch {} }  // 10s warning
        if (t === 6) { try { haptic("wrong"); } catch {} }  // 5s urgent warning
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

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
    setTimeout(() => { setPicked(null); setIdx(j => j + 1); }, delay);
  };

  const pct = (timeLeft / 60) * 100;
  const barColor = timeLeft > 20 ? 'var(--accent)' : timeLeft > 10 ? 'var(--gold)' : 'var(--red)';

  return (
    <div className="quiz-wrap">
      <div className="q-top">
        <button className="back-btn" onClick={() => { clearInterval(timerRef.current); onBack(); }} aria-label="Go back">←</button>
        <div className="prog-wrap"><div className="prog-bar" style={{width:`${pct}%`, background:barColor, transition:'width 1s linear'}} /></div>
        <span className="q-ctr" style={{color: timeLeft <= 10 ? 'var(--red)' : 'var(--t2)', fontWeight: timeLeft <= 10 ? 800 : 500}}>{timeLeft}s</span>
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
function TrueFalseEngine({ questions, onComplete, onBack }) {
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
function QuizEngine({ questions, mode, diff, timerEnabled, soundEnabled, hintsEnabled, onComplete, onBack, survivalBest }) {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);   // MCQ selected index
  const [typedResult, setTypedResult] = useState(null); // 'correct' | 'wrong' | null
  const isSpeed = mode === "speed";
  const timerDuration = isSpeed ? 8 : 20;
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timerDuration);
  const [speedScore, setSpeedScore] = useState(0);
  const [done, setDone] = useState(false);
  const timerRef = useRef(null);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  const [showQuit, setShowQuit] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const advanceRef = useRef(null);
  const [wrongAnswers, setWrongAnswers] = useState([]);
  const [hardRightBurst, setHardRightBurst] = useState(false);
  const hardRightBurstTimerRef = useRef(null);
  useEffect(() => () => {
    if (hardRightBurstTimerRef.current) clearTimeout(hardRightBurstTimerRef.current);
  }, []);


  const total = questions?.length || 0;
  const q = questions?.[idx];
  const timed = (timerEnabled !== false) && mode !== "survival" && mode !== "legends" && mode !== "chaos" && mode !== "balliq" && q?.type !== "tf";
  const isTyped = q?.type === "typed";
  const isTF = q?.type === "tf";
  const answered = selected !== null || typedResult !== null;

  const doAdvance = useCallback((ns, nb, correct) => {
    if (mode === "survival" && !correct) { setDone(true); onCompleteRef.current({ score: ns, total: idx + 1, bestStreak: nb, wrongAnswers }); return; }
    if (idx + 1 >= total) { setDone(true); onCompleteRef.current({ score: ns, total, bestStreak: nb, wrongAnswers, speedScore }); return; }
    setIdx(i => i + 1); setSelected(null); setTypedResult(null); setShowNext(false);
    if (timed) setTimeLeft(timerDuration);
  }, [idx, total, mode, timed]);

  const advance = useCallback((ns, nb, correct) => {
    if (mode === "survival" && !correct) { doAdvance(ns, nb, correct); return; }
    if (correct === "timeout") { setTimeout(() => doAdvance(ns, nb, false), 800); return; }
    setShowNext({ ns, nb, correct });
  }, [mode, doAdvance]);
  useEffect(() => { advanceRef.current = advance; }, [advance]);

  const registerAnswer = useCallback((correct) => {
    clearInterval(timerRef.current);
    const ns = correct ? score + 1 : score;
    const nst = correct ? streak + 1 : 0;
    const nb = Math.max(bestStreak, nst);
    setScore(ns); setStreak(nst); setBestStreak(nb);
    if (!correct && q && correct !== "timeout") {
      setWrongAnswers(prev => [...prev, { q: q.q, correct: q.type === "typed" ? q.typed_a : q.type === "tf" ? (q.a ? "TRUE" : "FALSE") : q.o[q.a], cat: q.cat }]);
    }
    if (isSpeed && correct === true) { setSpeedScore(prev => prev + 100 + timeLeft * 10); }
    if (isSpeed && correct) {
      const timeBonus = timeLeft * 10;
      setSpeedScore(prev => prev + 100 + timeBonus);
    }
    advance(ns, nb, correct);
  }, [score, streak, bestStreak, advance]);

  const handleMCQ = useCallback((i) => {
    if (answered || done) return;
    setSelected(i);
    // T/F questions store answer as boolean OR number; MCQ stores as index
    const qAsBool = q.a === true || q.a === 1;
    const correct = q.type === "tf" ? ((i === 1) === qAsBool) : (i === q.a);
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
    registerAnswer(correct);
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
    const timeoutId = setTimeout(() => {
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
    return () => { clearInterval(timerRef.current); clearTimeout(timeoutId); };
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
    <div className={`quiz-wrap${q?.cat ? ` cat-${q.cat}` : ""}`}>
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
              background: (timeLeft/timerDuration) > 0.5 ? "var(--accent)" : (timeLeft/timerDuration) > 0.25 ? "var(--gold)" : "var(--red)"
            }}/>
          </div>
          <span className={`timer${(timeLeft/timerDuration)<=0.25?" urgent":""}`}>{timeLeft}s</span>
        </div>
      )}

      <div className="q-card">
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
        <TypedInput key={idx} question={q} diff={diff} hintsEnabled={hintsEnabled} onAnswer={(correct) => {
          setTypedResult(correct ? "correct" : "wrong");
          if (correct && q.diff === "hard") {
            haptic("hardCorrect");
            setHardRightBurst(true);
            if (hardRightBurstTimerRef.current) clearTimeout(hardRightBurstTimerRef.current);
            hardRightBurstTimerRef.current = setTimeout(() => setHardRightBurst(false), TIMINGS.ANSWER_REVEAL);
          }
          registerAnswer(correct);
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

      {answered && (
        <div className={`feedback ${(isTF ? ((selected === 1) === (q?.a === true || q?.a === 1)) : (selected === q?.a || typedResult === "correct")) ? "correct" : "wrong"}`}>
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

// True/False is hidden everywhere it's user-selectable — see the play grid
// and league mode picker. Reinstate this entry when the mode comes back.
const ONLINE_MODES = [
  { id: "classic",   icon: "⏱️",  name: "Classic",     desc: "10 mixed-difficulty questions" },
  { id: "survival",  icon: "🔥",  name: "Survival",    desc: "10 questions — keep your nerve" },
  { id: "hotstreak", icon: "⚡🔥", name: "Hot Streak",   desc: "10 questions — pick fast" },
];

function pickOnlineQuestions(mode) {
  if (mode === "truefalse") {
    // Convert TF statements into the same {q, o, a} shape the playing screen
    // renders, so the UI doesn't need a separate path.
    const tfRaw = (typeof getTrueFalseQs === "function" ? getTrueFalseQs() : []).slice(0, 10);
    return tfRaw.map(t => ({
      q: t.s,
      o: ["True", "False"],
      a: (t.a === true || t.a === 1) ? 0 : 1,
      cat: t.cat || "TF",
      diff: t.diff || "medium",
      type: "mcq",
    }));
  }
  // Classic / Survival / Hot Streak all share the mcq pool. The mode tag is
  // recorded on the room for the results screen but doesn't change play.
  const pool = (getQs({ cat: "All", diff: "medium", n: 30, ramp: true }) || [])
    .filter(q => q && q.type !== "tf" && q.type !== "typed" && Array.isArray(q.o));
  return pool.slice(0, 10);
}

// NOTE for future native app build: when wrapping the PWA in a native iOS or
// Android shell (Capacitor / PWABuilder), configure Universal Links / App
// Links so that balliq.app/?join=CODE opens the installed app directly with
// the join code intact. The web flow already reads the URL parameter and
// routes here; the native side just needs the link configuration to dispatch
// the URL to the WKWebView / Android WebView.
const INVITE_BASE_URL = "https://balliq.app";
const buildInviteUrl = (code) => `${INVITE_BASE_URL}/?join=${encodeURIComponent(code)}`;
const buildInviteText = (code) => `⚽ Play me at ${APP_NAME}! Tap to join: ${buildInviteUrl(code)}`;

function OnlineGame({ onBack, userId, defaultName, autoJoinCode }) {
  // Top-level view: 'menu' | 'create-input' | 'join-input' | 'create-waiting'
  //                 | 'lobby' | 'playing' | 'results'
  const [view, setView] = useState("menu");
  const [name, setName] = useState(defaultName || "");
  const [code, setCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [room, setRoom] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [selectedMode, setSelectedMode] = useState("classic");
  const [toast, setToast] = useState(null);

  // Per-game playing state. Each player drives their own progress; the
  // opposite player's progress is read from room.host_answers/guest_answers.
  const [picked, setPicked] = useState(null);
  const [locked, setLocked] = useState(false);
  // Surfaced when the realtime channel goes CLOSED / CHANNEL_ERROR /
  // TIMED_OUT — Supabase only reports our own connection state, not the
  // opponent's, so this is the honest "your link is dead" indicator.
  const [connectionLost, setConnectionLost] = useState(false);
  // Countdown shown while we wait to see if the opponent reconnects.
  // Null when not active. See the abandon-timer effect below.
  const [abandonCountdown, setAbandonCountdown] = useState(null);
  const abandonTimerRef = useRef(null);
  // Per-button busy flags so users don't double-tap during the network call
  // and end up with two rooms / two failed joins.
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  const channelRef = useRef(null);
  const advanceTimerRef = useRef(null);
  const finishTimeoutRef = useRef(null);
  const subscribedCodeRef = useRef(null);
  // Watchdog for the channel.subscribe() handshake. If we don't see a
  // SUBSCRIBED status within 12s we tear the channel down, toast the user
  // and bail to the menu instead of leaving them staring at a frozen
  // "Waiting for opponent" screen.
  const subscribeTimeoutRef = useRef(null);
  const t$ = useCallback((m, dur = TIMINGS.TOAST_DURATION) => { setToast(m); setTimeout(() => setToast(null), dur); }, []);

  // Pick up the auth profile name if it arrives after mount
  useEffect(() => { if (!name && defaultName) setName(defaultName); }, [defaultName, name]);

  // Auto-join from a shared invite link (e.g. https://balliq.app/?join=ABC234).
  // Pre-fills the join screen with the code; if we already have a name we
  // also fire onJoin once so the friend lands straight in the lobby.
  const autoJoinFiredRef = useRef(false);
  useEffect(() => {
    if (!autoJoinCode) return;
    if (autoJoinFiredRef.current) return;
    setJoinCode(autoJoinCode);
    setView("join-input");
    if (!userId) return; // wait for sign-in; the spec routes guests via AppGate
    if (!name.trim()) return; // need a name first; user can tap Join manually
    autoJoinFiredRef.current = true;
    // Defer one tick so React commits joinCode/name before onJoin reads them.
    const id = setTimeout(() => { onJoin(); }, 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoJoinCode, userId, name]);

  // Best-effort cleanup of stale rows older than 24h on entry to the lobby.
  useEffect(() => { (async () => { try { await supabase.rpc("cleanup_old_game_rooms"); } catch {} })(); }, []);

  // Subscribe to the room row. Called after create/join. Tears down any
  // existing channel first so we never end up with two listeners. The
  // .subscribe() callback exposes the channel's lifecycle — if Supabase
  // closes the channel or it errors out we surface a "connection lost"
  // overlay so the player isn't left staring at a frozen screen.
  const subscribeRoom = useCallback((rc) => {
    if (channelRef.current && subscribedCodeRef.current !== rc) {
      try { supabase.removeChannel(channelRef.current); } catch {}
      channelRef.current = null;
    }
    if (channelRef.current) return;
    if (subscribeTimeoutRef.current) clearTimeout(subscribeTimeoutRef.current);
    // 12s watchdog — if SUBSCRIBED never arrives we assume Supabase
    // realtime is hung and bail back to the menu.
    subscribeTimeoutRef.current = setTimeout(() => {
      if (channelRef.current) {
        try { supabase.removeChannel(channelRef.current); } catch {}
        channelRef.current = null;
      }
      subscribedCodeRef.current = null;
      subscribeTimeoutRef.current = null;
      setRoom(null);
      setCode("");
      setIsHost(false);
      setView("menu");
      t$("Couldn't connect — please try again");
    }, TIMINGS.ONLINE_SUBSCRIBE_TIMEOUT);
    const ch = supabase
      .channel(`room2:${rc}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "game_rooms", filter: `code=eq.${rc}` },
        (payload) => { if (payload.new) setRoom(payload.new); }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          if (subscribeTimeoutRef.current) {
            clearTimeout(subscribeTimeoutRef.current);
            subscribeTimeoutRef.current = null;
          }
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          if (subscribeTimeoutRef.current) {
            clearTimeout(subscribeTimeoutRef.current);
            subscribeTimeoutRef.current = null;
          }
          setConnectionLost(true);
        }
      });
    channelRef.current = ch;
    subscribedCodeRef.current = rc;
  }, [t$]);

  // Unmount cleanup: kill the channel + any pending timers.
  useEffect(() => () => {
    if (channelRef.current) { try { supabase.removeChannel(channelRef.current); } catch {} channelRef.current = null; }
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current);
    if (abandonTimerRef.current) clearInterval(abandonTimerRef.current);
    if (subscribeTimeoutRef.current) clearTimeout(subscribeTimeoutRef.current);
  }, []);

  // Abandon timer — when our channel drops while a game is in flight, we
  // can't tell whether *we* lost connection or the opponent did. Either
  // way the game can't continue, so start a 60s countdown after which we
  // mark the room finished with whatever scores we have. If the channel
  // somehow recovers (we toggle connectionLost back to false) or the user
  // navigates away, the countdown is cancelled.
  useEffect(() => {
    if (!connectionLost || view !== "playing") {
      if (abandonTimerRef.current) {
        clearInterval(abandonTimerRef.current);
        abandonTimerRef.current = null;
      }
      setAbandonCountdown(null);
      return;
    }
    setAbandonCountdown(60);
    const id = setInterval(() => {
      setAbandonCountdown((s) => {
        if (s == null) return s;
        if (s <= 1) {
          clearInterval(id);
          abandonTimerRef.current = null;
          // Best-effort write — even if the WebSocket is dead the REST
          // update may still go through. Either way we transition our
          // local UI to results so the player isn't stuck.
          if (room?.code) gameRoomMarkFinished(room.code).catch(() => {});
          setView("results");
          return null;
        }
        return s - 1;
      });
    }, 1000);
    abandonTimerRef.current = id;
    return () => {
      clearInterval(id);
      abandonTimerRef.current = null;
    };
  }, [connectionLost, view, room?.code]);

  // React to room.status transitions. Drives every screen change after the
  // first time the user enters a room.
  useEffect(() => {
    if (!room) return;
    if (room.status === "lobby" && (view === "create-waiting" || view === "join-input")) {
      setView("lobby");
    } else if (room.status === "playing" && view !== "playing") {
      setPicked(null);
      setLocked(false);
      setView("playing");
    } else if (room.status === "finished" && view !== "results") {
      setView("results");
    }
  }, [room?.status, view]);

  useEffect(() => {
    if (view !== "results") return;
    try { recordSeenQuestions(room?.questions || []); } catch {}
  }, [view, room?.questions]);

  // Host-only: when one player is finished, give the other a 60s grace
  // window. Mark the room finished as soon as both are done OR the window
  // elapses, whichever comes first.
  useEffect(() => {
    if (!room || view !== "playing" || !isHost) return;
    const both = room.host_finished && room.guest_finished;
    const some = room.host_finished || room.guest_finished;
    if (both) {
      gameRoomMarkFinished(room.code);
      return;
    }
    if (some) {
      if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current);
      finishTimeoutRef.current = setTimeout(() => {
        gameRoomMarkFinished(room.code);
      }, TIMINGS.ONLINE_ABANDON_GRACE);
      return () => { if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current); };
    }
  }, [room?.host_finished, room?.guest_finished, view, isHost, room?.code]);

  // ── Actions ──────────────────────────────────────────────────────────────

  const onCreate = useCallback(async () => {
    if (creating) return;
    if (!name.trim()) return t$("Enter your name");
    if (!userId)       return t$("Sign in to play online");
    setCreating(true);
    try {
      const rc = generateCode();
      const { data, error } = await gameRoomCreate({ code: rc, hostId: userId, hostName: name.trim() });
      if (error || !data) { t$("⚠️ Couldn't create room"); return; }
      setRoom(data);
      setCode(rc);
      setIsHost(true);
      subscribeRoom(rc);
      setView("create-waiting");
    } finally {
      setCreating(false);
    }
  }, [name, userId, subscribeRoom, t$, creating]);

  // Re-share helper used by both the create-and-share flow and the
  // "Share invite again" button on the waiting screen. Falls back to the
  // clipboard when the Web Share API is unavailable (desktop browsers).
  const shareInvite = useCallback(async (rc) => {
    if (!rc) return;
    const text = buildInviteText(rc);
    const url = buildInviteUrl(rc);
    try {
      if (navigator.share) {
        await navigator.share({ text, url });
        return;
      }
    } catch { /* user cancelled or share failed silently */ }
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        t$("📋 Invite link copied");
      }
    } catch {}
  }, [t$]);

  // Primary "Create & invite a friend" action — creates the room and pops the
  // share sheet immediately so the host can fire the link off in one tap.
  // After share resolves (success or cancel) the host stays on the waiting
  // screen for the friend to join.
  const onCreateAndShare = useCallback(async () => {
    if (creating) return;
    if (!name.trim()) {
      // Without a name we can't host — drop into the create-input flow so the
      // user can type one, then tap Create.
      setView("create-input");
      return;
    }
    if (!userId) return t$("Sign in to play online");
    setCreating(true);
    try {
      const rc = generateCode();
      const { data, error } = await gameRoomCreate({ code: rc, hostId: userId, hostName: name.trim() });
      if (error || !data) { t$("⚠️ Couldn't create room"); return; }
      setRoom(data);
      setCode(rc);
      setIsHost(true);
      subscribeRoom(rc);
      setView("create-waiting");
      // Fire and forget — the share sheet runs on top of the waiting screen
      // so cancellation lands the user exactly where they need to be.
      shareInvite(rc);
    } finally {
      setCreating(false);
    }
  }, [name, userId, subscribeRoom, shareInvite, t$, creating]);

  const onJoin = useCallback(async () => {
    if (joining) return;
    if (!name.trim()) return t$("Enter your name");
    if (!userId)       return t$("Sign in to play online");
    const rc = joinCode.toUpperCase().trim();
    if (rc.length < 4) return t$("Enter a valid room code");
    setJoining(true);
    try {
      const { data: existing, error: getErr } = await gameRoomGet(rc);
      if (getErr) { t$("⚠️ Couldn't look up room"); return; }
      if (!existing) { t$("Room not found — check the code and try again"); return; }
      if (existing.status === "playing" || existing.status === "finished") { t$("This game has already started"); return; }
      if (existing.guest_id && existing.guest_id !== userId) { t$("This room is already full"); return; }
      const { data: joined, error: joinErr } = await gameRoomJoin({ code: rc, guestId: userId, guestName: name.trim() });
      if (joinErr) { t$("⚠️ Couldn't join room"); return; }
      if (!joined) { t$("This room is already full"); return; }
      setRoom(joined);
      setCode(rc);
      setIsHost(false);
      subscribeRoom(rc);
      // Status transition effect will swing us to 'lobby' once the row
      // arrives via realtime; set explicitly here so the UI updates
      // immediately too.
      setView("lobby");
    } finally {
      setJoining(false);
    }
  }, [name, userId, joinCode, subscribeRoom, t$, joining]);

  const onStartGame = useCallback(async () => {
    if (!room || !isHost) return;
    const qs = pickOnlineQuestions(selectedMode);
    if (!qs || qs.length < 5) return t$("Not enough questions for this mode");
    const { error } = await gameRoomStart({ code: room.code, mode: selectedMode, questions: qs });
    if (error) t$("⚠️ Couldn't start game");
  }, [room, isHost, selectedMode, t$]);

  const onPickOption = useCallback(async (optIdx) => {
    if (locked || !room || !room.questions) return;
    const myAnswers = (isHost ? room.host_answers : room.guest_answers) || [];
    const currentIdx = myAnswers.length;
    if (currentIdx >= room.questions.length) return;
    const q = room.questions[currentIdx];
    if (!q) return;
    const correct = optIdx === q.a;
    const myScore = (isHost ? room.host_score : room.guest_score) || 0;
    const newAnswers = [...myAnswers, { idx: currentIdx, picked: optIdx, correct }];
    const newScore = myScore + (correct ? 1 : 0);
    const finished = newAnswers.length >= room.questions.length;
    setPicked(optIdx);
    setLocked(true);
    await gameRoomSubmitAnswer({ code: room.code, isHost, answers: newAnswers, score: newScore, finished });
    advanceTimerRef.current = setTimeout(() => {
      setPicked(null);
      setLocked(false);
    }, 1500);
  }, [locked, room, isHost]);

  const onPlayAgain = useCallback(() => {
    // Clear local state and return to the create/join menu — both players go
    // their separate ways and can spin up a new room.
    if (channelRef.current) { try { supabase.removeChannel(channelRef.current); } catch {} channelRef.current = null; }
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current);
    if (abandonTimerRef.current) clearInterval(abandonTimerRef.current);
    if (subscribeTimeoutRef.current) clearTimeout(subscribeTimeoutRef.current);
    abandonTimerRef.current = null;
    subscribeTimeoutRef.current = null;
    subscribedCodeRef.current = null;
    setRoom(null);
    setCode("");
    setJoinCode("");
    setIsHost(false);
    setPicked(null);
    setLocked(false);
    setConnectionLost(false);
    setAbandonCountdown(null);
    setCreating(false);
    setJoining(false);
    setView("menu");
  }, []);

  const copyCode = useCallback(() => {
    if (!code) return;
    navigator.clipboard?.writeText(code).then(() => t$("📋 Code copied")).catch(() => {});
  }, [code, t$]);

  // ── Renders ──────────────────────────────────────────────────────────────

  // Connection lost trumps every other view. Supabase only reports our own
  // socket state, so we can't say definitively whether the opponent left or
  // we did — surface a single honest message and a way out.
  if (connectionLost) {
    const inPlay = view === "playing";
    return (
      <div className="screen">
        <div className="page-hdr"><button className="back-btn" onClick={onBack} aria-label="Go back">←</button><div className="page-title">Online 1v1</div></div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"60vh",gap:14,padding:"0 24px",textAlign:"center"}}>
          <div style={{fontSize:42}}>📡</div>
          <div style={{fontSize:18,fontWeight:800,color:"var(--text)"}}>
            {inPlay ? "Opponent may have disconnected" : "Connection lost"}
          </div>
          <div style={{fontSize:14,color:"var(--t2)",lineHeight:1.5,maxWidth:300}}>
            {inPlay
              ? <>Game will end in <strong style={{color:"var(--accent)",fontVariantNumeric:"tabular-nums"}}>{abandonCountdown ?? 60}</strong> seconds if they don't come back.</>
              : "Couldn't stay connected to the room. Try again in a moment."}
          </div>
          <button className="btn-3d" onClick={onBack} style={{marginTop:6,maxWidth:240}}>Back to Home</button>
          {!inPlay && <button className="btn-3d ghost" onClick={onPlayAgain} style={{maxWidth:240}}>Try a new room</button>}
        </div>
      </div>
    );
  }

  // Menu — Create-and-invite is the primary path; manual code entry sits
  // below as the secondary path for users who already have a code.
  if (view === "menu") {
    return (
      <div className="screen">
        <div className="page-hdr"><button className="back-btn" onClick={onBack} aria-label="Go back">←</button><div className="page-title">Online 1v1</div></div>
        <p style={{fontSize:14, color:"var(--t2)", lineHeight:1.7, marginBottom:18}}>
          Challenge a friend in real time. Send them a link they can tap to join.
        </p>

        {/* Primary CTA — create + share in one tap. Tall on purpose. */}
        <button
          className="btn-3d"
          onClick={() => {
            if (!name.trim()) { setView("create-input"); return; }
            onCreateAndShare();
          }}
          disabled={creating}
          style={{minHeight:104,padding:"18px 20px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,marginBottom:24,opacity:creating?0.7:1}}
        >
          <span style={{fontSize:17,fontWeight:800}}>{creating ? "Creating room…" : "📩 Create & invite a friend"}</span>
          <span style={{fontSize:12,fontWeight:500,opacity:0.85}}>Send a link your friend can tap to join</span>
        </button>

        <div className="ds-eyebrow" style={{marginBottom:8,color:"var(--t3)"}}>Already have a code?</div>
        <button
          className="btn-3d ghost"
          onClick={() => setView("join-input")}
          style={{minHeight:48,fontSize:14}}
        >
          Join with code
        </button>

        {toast && <div className="toast">{toast}</div>}
      </div>
    );
  }

  if (view === "create-input") {
    return (
      <div className="screen">
        <div className="page-hdr"><button className="back-btn" onClick={() => setView("menu")} aria-label="Go back">←</button><div className="page-title">Create a Room</div></div>
        <div className="lcard">
          <div className="lcard-s">A 6-character code will be generated for your friend.</div>
          <label className="inp-lbl" htmlFor="create-name-input">Your name</label>
          <input id="create-name-input" className="inp" placeholder="e.g. Marcus" value={name} onChange={e => setName(e.target.value)} maxLength={20} />
          <button className="btn-3d" onClick={onCreate} disabled={creating} style={{marginTop:6, opacity: creating ? 0.7 : 1}}>
            {creating ? "Creating…" : "Create room →"}
          </button>
        </div>
        {toast && <div className="toast">{toast}</div>}
      </div>
    );
  }

  if (view === "join-input") {
    return (
      <div className="screen">
        <div className="page-hdr"><button className="back-btn" onClick={() => setView("menu")} aria-label="Go back">←</button><div className="page-title">Join a Room</div></div>
        <div className="lcard">
          <div className="lcard-s">Enter your name and your friend's room code.</div>
          <label className="inp-lbl" htmlFor="join-name-input">Your name</label>
          <input id="join-name-input" className="inp" placeholder="e.g. Luka" value={name} onChange={e => setName(e.target.value)} maxLength={20} />
          <label className="inp-lbl" htmlFor="room-code-input">Room code</label>
          <input
            id="room-code-input"
            className="inp og-code-input"
            placeholder="XXXXXX"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g, ''))}
            inputMode="text"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            maxLength={6}
          />
          <button className="btn-3d" onClick={onJoin} disabled={joining} style={{marginTop:6, opacity: joining ? 0.7 : 1}}>
            {joining ? "Joining…" : "Join →"}
          </button>
        </div>
        {toast && <div className="toast">{toast}</div>}
      </div>
    );
  }

  // Host's "waiting for opponent" screen — share-link CTA leads, code below.
  if (view === "create-waiting") {
    return (
      <div className="screen">
        <div className="page-hdr">
          <button className="back-btn" onClick={onPlayAgain} aria-label="Go back">←</button>
          <div className="page-title">Room created</div>
        </div>

        <button
          className="btn-3d"
          onClick={() => shareInvite(code)}
          style={{minHeight:64,marginBottom:18}}
        >
          📩 Share invite link
        </button>

        <div className="og-code-box" onClick={copyCode}>
          <div className="og-code-label">Or share this code</div>
          <div className="og-code-val">{code}</div>
          <div className="og-code-hint">Tap to copy</div>
        </div>

        <div className="og-waiting">
          <div className="og-pulse"><span/><span/><span/></div>
          <div className="og-waiting-text">Waiting for opponent…</div>
        </div>

        <button
          className="btn-3d ghost"
          onClick={() => { setView("menu"); setRoom(null); setCode(""); setIsHost(false); }}
          style={{marginTop:18,minHeight:48,fontSize:14}}
        >
          Cancel
        </button>

        {toast && <div className="toast">{toast}</div>}
      </div>
    );
  }

  // Lobby — both players present, host picks a mode and starts.
  if (view === "lobby") {
    // Defensive: if the room row was deleted server-side (cleanup RPC,
    // host quit, RLS revoked) the realtime channel might leave us in
    // 'lobby' view with `room` null. Show a friendly error rather than
    // a blank render, and give the user a way home.
    if (!room) {
      return (
        <div className="screen">
          <div className="page-hdr"><button className="back-btn" onClick={onBack} aria-label="Go back">←</button><div className="page-title">Online 1v1</div></div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"60vh",gap:14,padding:"0 24px",textAlign:"center"}}>
            <div style={{fontSize:42}}>🚪</div>
            <div style={{fontSize:18,fontWeight:800,color:"var(--text)"}}>Room not found</div>
            <div style={{fontSize:14,color:"var(--t2)",lineHeight:1.5,maxWidth:300}}>
              It may have expired or the host left. Start a new room to play again.
            </div>
            <button className="btn-3d" onClick={onBack} style={{marginTop:6,maxWidth:240}}>Back to Home</button>
            <button className="btn-3d ghost" onClick={onPlayAgain} style={{maxWidth:240}}>Try a new room</button>
          </div>
        </div>
      );
    }
    const hostName = room.host_name || "Host";
    const guestName = room.guest_name || "Guest";
    return (
      <div className="screen">
        <div className="page-hdr">
          <button className="back-btn" onClick={onPlayAgain} aria-label="Go back">←</button>
          <div className="page-title">Lobby</div>
        </div>
        <div className="og-vs">
          <div className="og-player">
            <div className="og-player-avatar">⚽</div>
            <div className="og-player-name">{hostName}</div>
            <div className="og-ready">● Ready</div>
            {isHost && <div className="og-you">YOU</div>}
          </div>
          <div className="og-vs-divider">VS</div>
          <div className="og-player">
            <div className="og-player-avatar">🥅</div>
            <div className="og-player-name">{guestName}</div>
            <div className="og-ready">● Ready</div>
            {!isHost && <div className="og-you">YOU</div>}
          </div>
        </div>

        {isHost ? (
          <>
            <div className="ds-eyebrow" style={{marginTop:14, marginBottom:10}}>Choose a mode</div>
            <div className="og-mode-grid">
              {ONLINE_MODES.map(m => (
                <button
                  key={m.id}
                  className={`og-mode-card${selectedMode === m.id ? " selected" : ""}`}
                  onClick={() => setSelectedMode(m.id)}
                >
                  <span className="og-mode-icon">{m.icon}</span>
                  <span className="og-mode-name">{m.name}</span>
                  <span className="og-mode-desc">{m.desc}</span>
                </button>
              ))}
            </div>
            <button className="btn-3d" onClick={onStartGame} style={{marginTop:18}}>Start Game</button>
          </>
        ) : (
          <div className="og-waiting" style={{marginTop:24}}>
            <div className="og-pulse"><span/><span/><span/></div>
            <div className="og-waiting-text">Waiting for host to start…</div>
            <div style={{fontSize:12, color:"var(--t3)", marginTop:6}}>The host is choosing a mode</div>
          </div>
        )}
        {toast && <div className="toast">{toast}</div>}
      </div>
    );
  }

  // Playing — both players answer simultaneously.
  if (view === "playing") {
    if (!room || !Array.isArray(room.questions) || room.questions.length === 0) {
      return (
        <div className="screen" style={{textAlign:"center", paddingTop:60}}>
          <div style={{fontSize:32, marginBottom:12}}>⚽</div>
          <div style={{fontSize:14, color:"var(--t2)"}}>Loading questions…</div>
        </div>
      );
    }
    const myAnswers = (isHost ? room.host_answers : room.guest_answers) || [];
    const oppAnswers = (isHost ? room.guest_answers : room.host_answers) || [];
    const myFinished = isHost ? room.host_finished : room.guest_finished;
    const total = room.questions.length;
    const currentIdx = myAnswers.length;
    const q = room.questions[currentIdx];
    const oppName = (isHost ? room.guest_name : room.host_name) || "Opponent";

    if (myFinished || !q) {
      // Player has answered all questions — wait for opponent (host has 60s
      // grace timer that flips the room to finished).
      return (
        <div className="screen" style={{paddingTop:24}}>
          <div className="og-finished">
            <div style={{fontSize:48, marginBottom:6}}>✅</div>
            <div className="og-finished-title">All answers locked in</div>
            <div className="og-finished-sub">Waiting for {oppName}… <strong>{oppAnswers.length}/{total}</strong></div>
            <div className="og-pulse" style={{marginTop:14}}><span/><span/><span/></div>
          </div>
        </div>
      );
    }

    return (
      <div className="screen">
        <div className="og-progress">
          <div className="og-progress-mine">
            <div className="og-progress-label">You</div>
            <div className="og-progress-val">{myAnswers.length}/{total}</div>
          </div>
          <div className="og-progress-bar"><div className="og-progress-fill" style={{width:`${(myAnswers.length / total) * 100}%`}}/></div>
          <div className="og-progress-opp">
            <div className="og-progress-label">{oppName}</div>
            <div className="og-progress-val">{oppAnswers.length}/{total}</div>
          </div>
        </div>

        <div className="og-q">
          <div className="og-q-number">Question {currentIdx + 1} of {total}</div>
          <div className="og-q-text">{q.q}</div>
        </div>

        <div className="og-options">
          {(q.o || []).map((opt, i) => {
            const isPicked = picked === i;
            return (
              <button
                key={i}
                className={`og-option${isPicked ? " picked" : ""}${locked ? " locked" : ""}`}
                onClick={() => onPickOption(i)}
                disabled={locked}
              >
                <span className="og-option-letter">{String.fromCharCode(65 + i)}</span>
                <span className="og-option-text">{opt}</span>
              </button>
            );
          })}
        </div>

        {locked && (
          <div className="og-locked">
            <span style={{fontSize:18}}>🔒</span>
            <span>Answer locked in ✓</span>
          </div>
        )}
      </div>
    );
  }

  // Results — both finished or 60s timeout fired.
  if (view === "results") {
    if (!room) return null;
    const hostName = room.host_name || "Host";
    const guestName = room.guest_name || "Guest";
    const hScore = room.host_score || 0;
    const gScore = room.guest_score || 0;
    const total = (room.questions || []).length;
    const tied = hScore === gScore;
    const hostWon = hScore > gScore;
    const winnerName = tied ? null : (hostWon ? hostName : guestName);
    const youWon = !tied && ((isHost && hostWon) || (!isHost && !hostWon));
    const myScore = isHost ? hScore : gScore;
    const oppScore = isHost ? gScore : hScore;

    const breakdown = (room.questions || []).map((q, i) => {
      const ha = (room.host_answers || [])[i];
      const ga = (room.guest_answers || [])[i];
      return { q: q?.q, correct: q?.o?.[q?.a], host: ha, guest: ga };
    });

    const onShare = async () => {
      const myName = isHost ? hostName : guestName;
      const result = tied ? "tied" : (youWon ? "won" : "lost");
      const text = `🎮 ${APP_NAME} — Online 1v1\n${myName} ${myScore}  ${oppScore} ${tied ? "" : (isHost ? guestName : hostName)}\n${tied ? "🤝 Tied game" : youWon ? "🏆 I won!" : "GG — rematch?"}\nCan you beat me? ⚽\nballiq.app`;
      try {
        if (navigator.share) {
          await navigator.share({ text, url: "https://balliq.app" });
          return;
        }
      } catch {}
      try { await navigator.clipboard?.writeText(text); t$("📋 Result copied"); } catch {}
    };

    return (
      <div className="screen">
        <div className="page-hdr"><div className="page-title">Results</div></div>

        <div className="og-results-headline">
          {tied
            ? <>🤝 <strong>Tied game</strong></>
            : <>🏆 <strong>{winnerName}</strong> wins!</>
          }
        </div>

        <div className="og-result-vs">
          <div className={`og-result-side${!tied && hostWon ? " winner" : ""}`}>
            <div className="og-result-name">{hostName}</div>
            <div className="og-result-score">{hScore}</div>
            {isHost && <div className="og-you">YOU</div>}
          </div>
          <div className="og-result-divider">—</div>
          <div className={`og-result-side${!tied && !hostWon ? " winner" : ""}`}>
            <div className="og-result-name">{guestName}</div>
            <div className="og-result-score">{gScore}</div>
            {!isHost && <div className="og-you">YOU</div>}
          </div>
        </div>

        {breakdown.length > 0 && (
          <>
            <div className="ds-eyebrow" style={{marginTop:18, marginBottom:8}}>Question breakdown</div>
            <div className="og-breakdown">
              {breakdown.map((b, i) => (
                <div key={i} className="og-breakdown-row">
                  <div className="og-breakdown-q">{i + 1}. {b.q}</div>
                  <div className="og-breakdown-marks">
                    <span className={`og-mark${b.host?.correct ? " ok" : ""}`} title={hostName}>{b.host?.correct ? "✓" : "✗"}</span>
                    <span className={`og-mark${b.guest?.correct ? " ok" : ""}`} title={guestName}>{b.guest?.correct ? "✓" : "✗"}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="results-actions" style={{marginTop:18}}>
          <button className="btn-3d" onClick={onShare}>Share Result 📤</button>
          <button className="btn-3d ghost" onClick={onPlayAgain}>Play Again</button>
          <button className="btn-3d ghost" onClick={onBack}>Back to Home</button>
        </div>
        {toast && <div className="toast">{toast}</div>}
      </div>
    );
  }

  return null;
}

// ─── LOCAL MULTIPLAYER SETUP ──────────────────────────────────────────────────
const EMOJIS = ["⚽","🏆","🔥","⚡","🎯","🥅","🧤","👑"];

// ─── SOCIAL HUB ───────────────────────────────────────────────────────────────
const SOCIAL_MODES = [
  { m:"classic", icon:"⏱️", label:"Standard Quiz",  desc:"10 questions, 20s each" },
  { m:"speed",   icon:"⚡", label:"Speed Round",    desc:"5 questions, 8s each" },
  { m:"survival",icon:"🔥", label:"Survival",       desc:"One wrong ends the game" },
  { m:"legends", icon:"📜", label:"Legends",        desc:"Classic football history" },
];

function SocialHub({ onOnline, onLocal, onBack }) {
  const [picked, setPicked] = useState("classic");
  const { user, isGuest } = useAuth();
  const onlineLocked = !user || isGuest;
  return (
    <div className="screen">
      <div className="page-hdr">
        <button className="back-btn" onClick={onBack} aria-label="Go back">←</button>
        <div className="page-title">Challenge a Friend</div>
      </div>
      <div className="social-intro">Pick a game mode, then choose how to play:</div>
      <div className="mode-list" style={{marginBottom:20}}>
        {SOCIAL_MODES.map(({m,icon,label,desc}) => (
          <div key={m} className={`mode-item${picked===m?" mode-item-sel":""}`} onClick={() => setPicked(m)}>
            <div className="mi-icon">{icon}</div>
            <div className="mi-body"><div className="mi-name">{label}</div><div className="mi-desc">{desc}</div></div>
            {picked===m && <div style={{color:"var(--accent)",fontSize:18,fontWeight:700}}>✓</div>}
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <button
          className="btn btn-p"
          onClick={() => onOnline(picked)}
          aria-disabled={onlineLocked || undefined}
          style={{
            background:"var(--accent)",
            color:"#fff",
            display:"flex",
            flexDirection:"column",
            alignItems:"center",
            gap:2,
            opacity: onlineLocked ? 0.55 : 1,
          }}
        >
          <span>{onlineLocked ? "🔒 Online 1v1" : "🌐 Online 1v1"}</span>
          {onlineLocked && <span style={{fontSize:10,fontWeight:600,opacity:0.85}}>Sign in required</span>}
        </button>
        <button className="btn" onClick={() => onLocal(picked)} style={{background:"var(--s2)",border:"1px solid var(--border2)",color:"var(--text)"}}>🤝 Local</button>
      </div>
      <div className="social-tip" style={{marginTop:12}}>Online: create a room code, friend joins on their device. Local: pass the phone between players.</div>
    </div>
  );
}

function LocalSetup({ onStart, onBack }) {
  const [count, setCount] = useState(2);
  const [names, setNames] = useState(Array.from({ length: 6 }, (_, i) => ""));
  const [lmode, setLmode] = useState("classic");
  const [ldiff, setLdiff] = useState("medium");

  const setName = (idx, val) => setNames(n => { const copy = n.slice(); copy[idx] = val; return copy; });

  const launch = () => {
    const players = Array.from({ length: count }, (_, i) => ({
      id: i,
      name: (names[i] || "").trim() || `Player ${i + 1}`,
      emoji: EMOJIS[i % EMOJIS.length],
    }));
    onStart({ players, mode: lmode, diff: ldiff });
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
  const { players, mode, diff } = config;
  const TARGETS = { classic: 10, sprint: 5, survival: 30 };
  const target = TARGETS[mode] || 10;
  const CHUNK_SIZE = mode === "survival" ? 1 : 3;

  const [questions] = useState(() => {
    const raw = getQs({ cat: "All", diff, n: target, ramp: mode === "classic" });
    return (raw || []).filter(q => q && q.type !== "tf" && q.type !== "typed");
  });
  const totalQs = questions.length;

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
  const currentQ = questions[currentQIdx];

  // End-of-game:
  // - Classic/Sprint: ran off the end of the question list → rank by score.
  // - Survival — three ways to finish:
  //     last-standing : exactly one player alive
  //     total-wipe    : all remaining players answered wrong on the same question
  //     questions-out : pool exhausted with 2+ survivors still alive (rank by score among them)
  useEffect(() => {
    if (phase === "done") return;
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

  if (phase === "done" || !currentQ) {
    return (
      <div className="screen" style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh",flexDirection:"column",gap:14}}>
        <div style={{fontSize:36}}>⚽</div>
        <div style={{fontSize:14,color:"var(--t2)"}}>Finishing up…</div>
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

  // reveal (2s) → summary (classic/sprint) OR advance (survival)
  useEffect(() => {
    if (phase !== "reveal") return;
    const t = setTimeout(() => {
      if (mode === "survival") {
        const allOut = [...eliminatedIds, ...newEliminatedIds];
        setEliminatedIds(allOut);
        setNewEliminatedIds([]);
        const nextSurvivors = players.filter(p => !allOut.includes(p.id));
        // Total wipe or sole survivor → end-game effect fires (sees survivors.length <= 1).
        if (nextSurvivors.length <= 1) return;
        const nextQ = currentQIdx + 1;
        // Questions-out with 2+ alive → bump currentQIdx past the pool so the end-game
        // effect catches it and fires with endReason = 'questions-out'.
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

  // summary (1.2s) → next chunk handoff
  useEffect(() => {
    if (phase !== "summary") return;
    const t = setTimeout(() => {
      const nextStart = chunkEndQ + 1;
      if (nextStart >= totalQs) {
        // Game ends via effect above
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
          <div style={{marginTop:14,textAlign:"center",fontSize:15,fontWeight:800,color:"var(--info, #3B82F6)"}}>
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
function LocalResults({ result, onHome, onRetry }) {
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
        <button className="btn-3d ghost" onClick={onHome}>Back to Home</button>
      </div>
    </div>
  );
}


// ─── XP + LEVEL SYSTEM ────────────────────────────────────────────────────────
const LEVELS = [
  { name:"Sunday League",  xpNeeded:0,    icon:"⚽" },
  { name:"Non-League",     xpNeeded:100,  icon:"🌱" },
  { name:"Championship",   xpNeeded:300,  icon:"📈" },
  { name:"Premier League", xpNeeded:700,  icon:"🏟️" },
  { name:"Champions League",xpNeeded:1500, icon:"⭐" },
  { name:"Legend",         xpNeeded:3000, icon:"🐐" },
];

function getLevelInfo(xp) {
  let level = LEVELS[0];
  let nextLevel = LEVELS[1];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xpNeeded) {
      level = LEVELS[i];
      nextLevel = LEVELS[i + 1] || null;
      break;
    }
  }
  const progress = nextLevel
    ? Math.round(((xp - level.xpNeeded) / (nextLevel.xpNeeded - level.xpNeeded)) * 100)
    : 100;
  return { level, nextLevel, progress };
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
    const scoreLabel = data?.failed ? `X/${total}` : `${score}/${total}`;
    const colorMap = { green: "#58CC02", yellow: "#FFC107", grey: "#3A3F55" };

    // Mode label
    ctx.font = '700 13px Inter, "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = "#9BA0B8";
    ctx.fillText("TODAY'S PUZZLE", cx, 110);

    // Date
    ctx.font = '500 12px Inter, "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = "#9BA0B8";
    ctx.fillText(dateLabel, cx, 130);

    // Score — JetBrains Mono for the numeric display
    ctx.font = '900 72px "JetBrains Mono", "Courier New", monospace';
    ctx.fillStyle = "#58CC02";
    ctx.fillText(scoreLabel, cx, 218);

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
    const pctileLbl = data?.pctileLbl || "";

    ctx.font = '700 13px Inter, "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = "#9BA0B8";
    ctx.fillText("BALL IQ TEST", cx, 130);

    ctx.font = '900 88px "JetBrains Mono", "Courier New", monospace';
    ctx.fillStyle = "#58CC02";
    ctx.fillText(String(iq), cx, 260);

    // Funny label — wrapped to 300px
    ctx.font = '600 16px Inter, "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = "#FFFFFF";
    const labelEnd = _wrapText(ctx, label, cx, 308, 300, 22);

    // Percentile
    ctx.font = '500 13px Inter, "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = "#9BA0B8";
    ctx.fillText(pctileLbl, cx, labelEnd + 28);

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

    ctx.font = '600 18px Inter, "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(`${accuracy}% accuracy`, cx, 290);

    if (streak && streak >= 3) {
      ctx.font = '700 15px Inter, "Helvetica Neue", Arial, sans-serif';
      ctx.fillStyle = "#FFC107";
      ctx.fillText(`🔥 ${streak} in a row`, cx, 326);
    }

    ctx.font = '700 15px Inter, "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText("Can you beat me? ⚽", cx, 520);
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

  const file = new File([blob], "balliq-result.png", { type: "image/png" });
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
      await navigator.share({ files: [file], url: "https://balliq.app" });
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

function Confetti() {
  const canvasRef = useRef(null);
  useEffect(() => {
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
      color: ["#22c55e","#FFC800","#FF4B4B","#1CB0F6","#CE82FF","#FF9600"][Math.floor(Math.random()*6)],
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
  return <canvas ref={canvasRef} style={{position:"fixed",top:0,left:0,pointerEvents:"none",zIndex:500,width:"100%",height:"100%"}} />;
}


// ─── HARD RIGHT BURST ────────────────────────────────────────────────────────
// Lightweight, quick particle burst used when a user gets a HARD question right.
// Different from full Confetti — faster, more focused, emanates from center-bottom.
function HardRightBurst({ onComplete }) {
  const canvasRef = useRef(null);
  useEffect(() => {
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
        color: ["#22c55e", "#FFC800", "#FBBF24", "#16a34a"][Math.floor(Math.random() * 4)],
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
  return <canvas ref={canvasRef} style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:500}} />;
}


// ─── BALL IQ RESULTS ─────────────────────────────────────────────────────────
// Extracted into its own component so hooks are never called conditionally
function BallIQResults({ result, iqHistory, onRetry, onShare, onHome }) {
  const iq = calcBallIQ(result.score, result.total);
  const pctile = iqPercentile(iq);
  const label = iqLabel(iq);
  const pctileLbl = iqPercentileLabel(iq);
  const ringPct = Math.min((iq - 60) / 100, 1);
  const showIQConfetti = iq >= 120;

  const [displayIQ, setDisplayIQ] = useState(60);
  const [ringDisplay, setRingDisplay] = useState(0);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const delay = setTimeout(() => {
      setRevealed(true);
      const start = 60;
      const duration = 1400;
      const startTime = Date.now();
      const tick = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayIQ(Math.round(start + (iq - start) * eased));
        setRingDisplay(ringPct * eased);
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, 400);
    return () => clearTimeout(delay);
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
          <strong>{pctileLbl}</strong>
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
function DailySocialProof({ score, total }) {
  const safeTotal = total || 7;
  const safeScore = Math.max(0, Math.min(safeTotal, score || 0));
  const { emoji, headline, sub } = (() => {
    if (safeScore === safeTotal) return { emoji: "🏆", headline: "Perfect run!",        sub: "All seven correct — flawless." };
    if (safeScore >= 6)          return { emoji: "🌟", headline: "Excellent!",          sub: "One of those days where it just clicks." };
    if (safeScore >= 4)          return { emoji: "⚽", headline: "Solid challenge.",    sub: "Some tough ones in there today." };
    if (safeScore >= 2)          return { emoji: "📈", headline: "Keep going.",         sub: "Tomorrow's another chance to climb." };
    return                              { emoji: "💪", headline: "Everyone starts somewhere.", sub: "Come back tomorrow for a fresh seven." };
  })();

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
        Daily Challenge Complete
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

function Results({ result, mode, onHome, onRetry, onShare, iqHistory, survivalBest, wrongAnswers, askedQuestions, classicBest }) {
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

  // Personal best detection
  const eligibleForPB = mode === "classic" && result.total === 10;
  const isNewBest = eligibleForPB && result.score > (classicBest || 0) && result.score > 0;
  const survivalNewBest = isSurvival && result.score > (survivalBest || 0) && result.score >= 3;
  const isNewPersonalBest = isNewBest || survivalNewBest;

  // Huge-score display + caption per mode
  const hugeScore = isSpeed ? (result.speedScore || 0) : result.score;
  const scoreCaption = isSpeed
    ? `${result.score} correct out of ${result.total} · speed bonus included`
    : isSurvival
    ? `${result.score} in a row before missing one`
    : `${result.score} correct out of ${result.total}`;

  return (
    <div className="screen" style={{paddingTop:8, position:"relative"}}>
      {(isPerfect || showConfetti) && <Confetti />}
      <ResultsCloseBtn onClose={onHome} />

      {/* Daily social proof — only Daily Challenge */}
      {isDaily && <DailySocialProof score={result.score} total={result.total} />}

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
        {/* Score-tier tagline. Survival is streak-based so percentage doesn't
            cleanly map; the existing "X in a row" caption + personal-best
            callout already carry the moment for that mode. */}
        {!isSurvival && (
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
      </div>

      {/* Best streak still surfaces when it's actually notable — anything below
          3 in a row reads as ambient noise on the results screen. Accuracy was
          dropped: the percentage is implicit in "X correct out of Y" already. */}
      {result.bestStreak != null && result.bestStreak >= 3 && (
        <>
          <div style={{height:1, background:"var(--border)", margin:"18px 0 4px"}} />
          <StatRow label="Best streak" value={`${result.bestStreak} in a row`} />
        </>
      )}

      {result.winner && (
        <div style={{textAlign:"center", margin:"14px 0", fontSize:15, fontWeight:700, color:"var(--gold)"}}>🏆 {result.winner} wins!</div>
      )}

      {/* Two-tier action stack: filled green primary, ghost secondaries.
          Amber Share was dropped for cross-screen consistency — Share is a
          secondary action everywhere now. */}
      <div className="results-actions" style={{marginTop:18}}>
        <button className="btn-3d" onClick={onRetry}>Play Again</button>
        <button className="btn-3d ghost" onClick={onShare}>Share Score</button>
        <button className="btn-3d ghost" onClick={onHome}>Back to Home</button>
      </div>

      {/* XP earned moved from a full-width pill to a small footer note — it's
          a footnote-tier reward, not a primary fact. */}
      {xpEarned > 0 && (
        <div style={{textAlign:"center", marginTop:10, fontSize:12, color:"var(--t3)", fontWeight:500}}>
          +{xpEarned} XP earned ⚡
        </div>
      )}

      {/* Wrong answers review — below the buttons */}
      {wrongAnswers && wrongAnswers.length > 0 && (
        <div style={{marginTop:24}}>
          <div className="ds-eyebrow" style={{textAlign:"center", marginBottom:10}}>
            Review {wrongAnswers.length} missed {wrongAnswers.length === 1 ? "answer" : "answers"}
          </div>
          <div className="wrong-review">
            {wrongAnswers.map((w, i) => (
              <div key={i} className="wr-item">
                <div className="wr-q">{w.q}</div>
                <div className="wr-a"><span className="wr-tick">✓</span>{w.correct}</div>
              </div>
            ))}
          </div>
        </div>
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
  return (
    <div className="screen">
      <div className="page-hdr">
        <button className="back-btn" onClick={onBack} aria-label="Go back">←</button>
        <div className="page-title">Club Quizzes</div>
      </div>
      <p style={{fontSize:13,color:"var(--t2)",lineHeight:1.7,marginBottom:20}}>
        Test your deep knowledge of a specific club — history, players, trophies and iconic moments.
      </p>
      <div className="mode-list">
        {Object.entries(CLUB_PACKS).map(([key, pack]) => (
          <div key={key} className="mode-item" onClick={() => { haptic("select"); onStart(key); }}>
            <div className="mi-icon" style={{background:"transparent", padding:0, width:56, height:56, display:"flex", alignItems:"center", justifyContent:"center"}}>
              <ClubCrest clubKey={key} size={48} />
            </div>
            <div className="mi-body">
              <div className="mi-name">{pack.name}</div>
              <div className="mi-desc">{(pack?.questions?.length) || 0} questions</div>
            </div>
            <div className="mi-arrow">→</div>
          </div>
        ))}
      </div>
      <div style={{marginTop:16,background:"linear-gradient(135deg,rgba(251,191,36,0.08),rgba(251,191,36,0.03))",border:"1px solid rgba(251,191,36,0.2)",borderRadius:16,padding:"18px 20px",textAlign:"center"}}>
        <div style={{fontSize:22,marginBottom:6}}>🏆</div>
        <div style={{fontSize:15,fontWeight:800,color:"var(--t1)",marginBottom:4}}>More clubs coming soon</div>
        <div style={{fontSize:13,color:"var(--t2)",marginBottom:12,lineHeight:1.6}}>International club packs — Napoli, Celtic, Ajax deep dive, PSV and more — are on the way.</div>
        <div style={{fontSize:11,color:"var(--t3)",letterSpacing:1,fontWeight:600}}>Free update · No purchase needed</div>
      </div>
      {showProModal && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:999,display:"flex",alignItems:"flex-end"}} onClick={() => setShowProModal(false)}>
          <div style={{width:"100%",background:"var(--bg)",borderRadius:"20px 20px 0 0",padding:"28px 24px calc(48px + env(safe-area-inset-bottom, 34px))"}} onClick={e => e.stopPropagation()}>
            <div style={{fontSize:36,textAlign:"center",marginBottom:12}}>🏟️</div>
            <div style={{fontSize:22,fontWeight:900,textAlign:"center",marginBottom:8}}>More Coming Soon</div>
            <div style={{fontSize:14,color:"var(--t2)",textAlign:"center",lineHeight:1.7,marginBottom:24}}>Additional club packs will be available as a free update. Keep playing to stay ready!</div>
            <button className="btn btn-p" onClick={() => setShowProModal(false)}>Got it!</button>
          </div>
        </div>
      )}
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

function SettingsScreenImpl({ settings, onUpdate, onClearStats, onClearSeen, onBack, onShowPrivacy, onShowHelp, onAccountDeleted, onOpenReview }) {
  const { user, profile, isGuest, signOut, exitGuestMode } = useAuth();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmClearStats, setConfirmClearStats] = useState(false);

  // Permanent account deletion — required by App Store guideline 5.1.1(v)
  // for any app that supports account creation. Calls the server-side RPC
  // (which scopes deletes to auth.uid()), clears every biq_* key from
  // local storage, lets AppInner reset its in-memory state, and finally
  // signs the user out so AppGate routes back to the login screen.
  const performDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      const { error } = await supabase.rpc("delete_user_account");
      if (error) {
        setDeleting(false);
        setConfirmDelete(false);
        if (typeof onAccountDeleted === "function") onAccountDeleted({ error });
        return;
      }
      try {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith("biq_")) keys.push(k);
        }
        for (const k of keys) localStorage.removeItem(k);
      } catch {}
      if (typeof onAccountDeleted === "function") onAccountDeleted({ error: null });
      try { await signOut(); } catch {}
    } catch (e) {
      setDeleting(false);
      setConfirmDelete(false);
      if (typeof onAccountDeleted === "function") onAccountDeleted({ error: e });
    }
  };

  return (
    <div className="screen" style={{background:"var(--bg)"}}>
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
                </div>
              </div>
              <div className="settings-row danger" onClick={async () => {
                if (confirm(`Sign out of your ${APP_NAME} account?`)) {
                  await signOut();
                }
              }}>
                <div className="sr-left">
                  <div className="sr-label">Sign out</div>
                </div>
                <div className="sr-right"><div className="sr-arrow">›</div></div>
              </div>
            </>
          ) : user ? (
            <>
              <div className="settings-row" style={{cursor:"default"}}>
                <div className="sr-left">
                  <div className="sr-label">Signed in</div>
                  <div className="sr-desc">{user.email} — profile loading…</div>
                </div>
              </div>
              <button className="settings-row danger" style={{width:"100%",background:"none",border:"none",textAlign:"left"}} onClick={async () => {
                if (confirm(`Sign out of your ${APP_NAME} account?`)) {
                  await signOut();
                }
              }}>
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
              <button className="settings-row" onClick={() => exitGuestMode()} style={{cursor:"pointer",width:"100%",background:"none",border:"none",textAlign:"left",padding:"14px 16px"}}>
                <div className="sr-left">
                  <div className="sr-label" style={{color:"var(--accent)"}}>Sign in / Create account</div>
                </div>
                <div className="sr-right"><div className="sr-arrow">›</div></div>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="settings-section">
        <div className="ds-eyebrow settings-section-title">Appearance</div>
        <div className="settings-card">
          <div className="settings-row">
            <div className="sr-left">
              <div className="sr-label">Theme</div>
              <div className="sr-desc">Light or dark interface</div>
            </div>
            <div className="sr-right">
              <div className="size-btns">
                {["dark","light"].map(thm => (
                  <button key={thm} className={`size-btn${settings.theme===thm?" on":""}`} onClick={() => onUpdate({theme:thm})}>
                    {thm === "dark" ? "🌙 Dark" : "☀️ Light"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
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
        </div>
      </div>

      {(onShowHelp || onShowPrivacy) && (
        <div className="settings-section">
          <div className="ds-eyebrow settings-section-title">Help</div>
          <div className="settings-card">
            {onShowHelp && (
              <div className="settings-row" onClick={onShowHelp}>
                <div className="sr-left">
                  <div className="sr-label">Help & FAQ</div>
                  <div className="sr-desc">Common questions and how to reach us</div>
                </div>
                <div className="sr-right"><div className="sr-arrow">›</div></div>
              </div>
            )}
            {onShowPrivacy && (
              <div className="settings-row" onClick={onShowPrivacy}>
                <div className="sr-left">
                  <div className="sr-label">Privacy Policy</div>
                  <div className="sr-desc">How your data is handled</div>
                </div>
                <div className="sr-right"><div className="sr-arrow">›</div></div>
              </div>
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
            <div className="settings-row" onClick={onOpenReview}>
              <div className="sr-left">
                <div className="sr-label">Review questions</div>
                <div className="sr-desc">Internal question-bank review</div>
              </div>
              <div className="sr-right"><div className="sr-arrow">›</div></div>
            </div>
          </div>
        </div>
      )}

      <div className="settings-section">
        <div className="ds-eyebrow settings-section-title">About</div>
        <div className="settings-card" style={{padding:"24px 18px",textAlign:"center"}}>
          <div style={{fontSize:48,lineHeight:1,marginBottom:10}} aria-hidden="true">⚽</div>
          <div style={{fontSize:24,fontWeight:900,color:"var(--t1)",letterSpacing:"-0.4px"}}>{APP_NAME}</div>
          {/* Version + beta pill. Splitting "1.0.0-beta" so the version stays
              numeric/muted and "BETA" gets its own amber pill — clear pre-
              release signal without dominating the card. */}
          <div style={{display:"inline-flex",alignItems:"center",gap:6,marginTop:4,fontSize:13,color:"var(--t3)"}}>
            <span>v{APP_VERSION.replace(/-beta$/i, "")}</span>
            {/-beta$/i.test(APP_VERSION) && (
              <span style={{
                display:"inline-block",
                padding:"1px 7px",
                borderRadius:999,
                background:"rgba(255,200,0,0.15)",
                color:"var(--gold)",
                fontSize:10,
                fontWeight:800,
                letterSpacing:"0.08em",
              }}>BETA</span>
            )}
          </div>
          <div style={{fontSize:12,color:"var(--t3)",marginTop:14}}>Made with ⚽ in Norway</div>
          {/* Ghost outlined to match the secondary-action discipline used on
              result screens — filled green is reserved for primary actions. */}
          <a
            href="mailto:hello@balliq.app"
            style={{display:"inline-flex",alignItems:"center",justifyContent:"center",marginTop:18,padding:"10px 18px",background:"transparent",color:"var(--accent)",border:"1.5px solid var(--accent-b)",borderRadius:10,fontSize:14,fontWeight:800,textDecoration:"none"}}
          >
            Send feedback
          </a>
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
            <div className="settings-row" onClick={onClearSeen}>
              <div className="sr-left">
                <div className="sr-label">Clear question history</div>
                <div className="sr-desc">Allow recently-seen questions to reappear now</div>
              </div>
              <div className="sr-right"><div className="sr-arrow">›</div></div>
            </div>
          )}
        </div>
      </div>

      {/* Danger zone — bottom of the screen so destructive actions are
         clearly separated from everyday settings. The same row appears in
         three states (signed-in, mid-auth, guest) but always at this
         position so users know where to find it. */}
      <div className="settings-section" style={{marginTop:24}}>
        <div className="settings-card">
          {user ? (
            <button className="settings-row danger" style={{width:"100%",background:"none",border:"none",textAlign:"left"}} onClick={() => setConfirmDelete(true)}>
              <div className="sr-left">
                <div className="sr-label" style={{color:"var(--red, #FF5A5A)"}}>🗑️ Delete account</div>
                <div className="sr-desc">Permanently remove your profile and data</div>
              </div>
              <div className="sr-right"><div className="sr-arrow">›</div></div>
            </button>
          ) : (
            <div className="settings-row" style={{cursor:"default",opacity:0.5}}>
              <div className="sr-left">
                <div className="sr-label">🗑️ Delete account</div>
                <div className="sr-desc">Sign in to manage your account</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {confirmClearStats && (
        <div
          style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.78)",zIndex:1000,display:"flex",alignItems:"flex-end",justifyContent:"center",animation:"fadeIn 0.2s ease"}}
          onClick={() => setConfirmClearStats(false)}
        >
          <div
            style={{width:"100%",maxWidth:480,background:"var(--bg)",borderTop:"1px solid var(--border)",borderRadius:"22px 22px 0 0",padding:"22px 22px 28px",animation:"slideUp 0.3s cubic-bezier(0.22,1,0.36,1)"}}
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
            <div style={{fontSize:13,color:"var(--t3)",marginBottom:18}}>Your username, avatar, and settings are kept. This cannot be undone.</div>
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

      {confirmDelete && (
        <div
          style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.78)",zIndex:1000,display:"flex",alignItems:"flex-end",justifyContent:"center",animation:"fadeIn 0.2s ease"}}
          onClick={() => !deleting && setConfirmDelete(false)}
        >
          <div
            style={{width:"100%",maxWidth:480,background:"var(--bg)",borderTop:"1px solid var(--border)",borderRadius:"22px 22px 0 0",padding:"22px 22px 28px",animation:"slideUp 0.3s cubic-bezier(0.22,1,0.36,1)"}}
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

// ─── PRIVACY POLICY SCREEN ────────────────────────────────────────────────────
// Full-screen in-app overlay. Content is hardcoded (mirrors public/privacy.html)
// so there's no network fetch, no CORS/asset-path pitfalls, and no flash of a
// blank iframe. Rendered above the app when showPrivacy is true.
const PrivacyScreen = React.memo(function PrivacyScreen({ onClose }) {
  return (
    <div style={{
      position: "fixed",
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
        padding: "14px 20px",
        display: "flex", alignItems: "center", gap: 12,
        zIndex: 1,
      }}>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close privacy policy"
          style={{
            width: 36, height: 36, borderRadius: 10,
            background: "#1A1D27", border: "1px solid #2A2D3A",
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
        <div style={{fontSize: 13, color: "#9BA0B8", marginBottom: 28}}>Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>

        <div style={{
          background: "#1A1D27", borderRadius: 16,
          padding: "18px 20px", margin: "12px 0 24px",
          border: "1px solid #2A2D3A",
        }}>
          <p style={{fontSize: 15, color: "#9BA0B8", margin: 0}}>
            <span style={{color: "#58CC02", fontWeight: 600}}>The short version:</span>{" "}
            {APP_NAME} does not collect, store or share any personal data. All your game progress is stored locally on your device and never leaves it.
          </p>
        </div>

        <h2 style={privacyH2}>1. Information We Collect</h2>
        <p style={privacyP}>{APP_NAME} does not collect any personal information. We do not require you to create an account, provide an email address, or share any identifying information to use the app.</p>

        <h2 style={privacyH2}>2. Data Storage</h2>
        <p style={privacyP}>All app data — including your scores, XP, badges, settings and game history — is stored locally on your device using your browser's local storage. This data:</p>
        <ul style={{paddingLeft: 20, marginBottom: 12}}>
          <li style={privacyLi}>Never leaves your device</li>
          <li style={privacyLi}>Is never transmitted to our servers</li>
          <li style={privacyLi}>Is never shared with third parties</li>
          <li style={privacyLi}>Can be cleared at any time by clearing your browser or app data</li>
        </ul>

        <h2 style={privacyH2}>3. Analytics</h2>
        <p style={privacyP}>{APP_NAME} does not use any analytics tools, tracking pixels, or third-party SDKs that collect usage data. We do not track how you use the app.</p>

        <h2 style={privacyH2}>4. Advertising</h2>
        <p style={privacyP}>{APP_NAME} does not display advertisements and does not work with any advertising networks.</p>

        <h2 style={privacyH2}>5. Third-party services we use</h2>
        <ul style={{paddingLeft: 20, marginBottom: 12}}>
          <li style={privacyLi}><strong>Supabase (database and authentication):</strong> When you sign in with email or play Online 1v1 multiplayer, your username, profile data, scores, and game results are stored on Supabase servers. Online multiplayer also uses Supabase Realtime to sync game state between players. Avatar images are uploaded to Supabase Storage.</li>
          <li style={privacyLi}><strong>Google Fonts:</strong> We load the Inter and JetBrains Mono fonts from fonts.googleapis.com. Google may log your IP address when these fonts are loaded.</li>
          <li style={privacyLi}><strong>Cropper.js (CDN):</strong> When you upload a profile picture, we load an image cropping library from cdnjs.cloudflare.com. The CDN provider may log your IP address.</li>
        </ul>
        <p style={privacyP}>We do not run any analytics, tracking pixels, or advertising. We do not sell or share any user data with third parties for marketing purposes.</p>

        <h2 style={privacyH2}>6. Children's Privacy</h2>
        <p style={privacyP}>{APP_NAME} does not knowingly collect any information from children under the age of 13. The app contains no inappropriate content and is suitable for all ages.</p>

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
    q: "How do I play Online 1v1?",
    a: `Sign in to your account first, then tap the "Play with Friends" hero on the home screen and choose "Online 1v1". Create a room and share the 6-character code with your friend, or join their code.`,
  },
  {
    q: "How does the Ball IQ Test work?",
    a: "The Ball IQ Test asks you 15 carefully calibrated questions across difficulty levels. Your score is mapped to an IQ-like scale from 60 to 160 based on accuracy. There's no time limit — answer at your own pace.",
  },
  {
    q: "What is Today's Puzzle?",
    a: "Today's Puzzle is a daily word game where you guess a footballer's surname in 6 attempts. The same player is shown to everyone each day and resets at midnight.",
  },
  {
    q: "How do I delete my account?",
    a: "Go to Settings → Account → Delete Account. This will permanently remove all your data including your profile, scores, friends, and game history.",
  },
  {
    q: "Does Ball IQ work offline?",
    a: "Most game modes work offline — your scores are saved locally and synced when you're back online. Online 1v1 requires an internet connection.",
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
        padding: "14px 20px",
        display: "flex", alignItems: "center", gap: 12,
        zIndex: 1,
      }}>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close help"
          style={{
            width: 36, height: 36, borderRadius: 10,
            background: "#1A1D27", border: "1px solid #2A2D3A",
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
        {FAQ_ENTRIES.map((entry, i) => (
          <div key={i} style={{marginBottom: 24}}>
            <div style={{fontSize: 16, fontWeight: 800, color: "#58CC02", marginBottom: 8}}>{entry.q}</div>
            <p style={{fontSize: 15, color: "#9BA0B8", margin: 0, lineHeight: 1.6}}>{entry.a}</p>
          </div>
        ))}
        <p style={{fontSize: 13, color: "#9BA0B8", marginTop: 32}}>Still stuck? Reach us at <a href="mailto:hello@balliq.app" style={{color:"#58CC02",textDecoration:"none"}}>hello@balliq.app</a>.</p>
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
  const pctileLbl = iqPercentileLabel(iq);
  const when = entry.date
    ? new Date(entry.date).toLocaleDateString(undefined, { day:"numeric", month:"short", year:"numeric" })
    : null;
  const doShare = async () => {
    const msg = `🧠 My ${APP_NAME} is ${iq}\n${label} — ${pctileLbl}\n\nCould you beat me?\nballiq.app`;
    try {
      if (navigator.share) { await navigator.share({ title: APP_NAME, text: msg }); return; }
      if (navigator.clipboard) { await navigator.clipboard.writeText(msg); alert("Copied to clipboard!"); return; }
    } catch {}
  };
  return (
    <div
      onClick={onClose}
      style={{
        position:"fixed", inset:0, zIndex:999,
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
        <div style={{
          marginTop:10,
          display:"inline-flex", alignItems:"center",
          padding:"6px 14px", borderRadius:999,
          background:"rgba(88,204,2,0.15)", color:"#8AE042",
          fontSize:12, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase",
        }}>{pctileLbl}</div>
        {when && <div style={{marginTop:10, fontSize:12, color:"var(--t3)"}}>Tested {when}</div>}
        <div style={{marginTop:22}}>
          <button className="btn-3d ghost" onClick={doShare} style={{marginBottom:14}}>Share Score</button>
          <button className="btn-3d" onClick={() => { onClose(); onRetake(); }} style={{marginBottom:14}}>Retake Test</button>
          <button className="btn-3d ghost" onClick={onClose}>Close</button>
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
// 2-step welcome flow shown once per device after auth. Persists:
//   biq_skill_level  — "casual" | "fan" | "expert" (or absent)
//   biq_onboarded    — "1" once completed (or skipped to end)
const SKILL_OPTIONS = [
  { id: "casual", icon: "🌱", name: "Casual Fan", desc: "I watch the big games and know the top teams.",           diff: "easy"   },
  { id: "fan",    icon: "⚽", name: "Football Fan", desc: "I follow a league or two and the major competitions.",   diff: "medium" },
  { id: "expert", icon: "🧠", name: "Expert",      desc: "I know obscure facts and follow football history.",      diff: "hard"   },
];

function OnboardingScreen({ onDone }) {
  const [step, setStep] = useState(0);
  const [skillLevel, setSkillLevel] = useState(null);
  const TOTAL = 2;

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
              : { defaultDiff: "medium", hints: true, timer: true, theme: "dark", sound: false };
            s.defaultDiff = diffFor;
            localStorage.setItem("biq_settings", JSON.stringify(s));
          } catch {}
        }
      }
      localStorage.setItem("biq_onboarded", "1");
    } catch {}
    try { window.storage?.set("biq_onboarded", "1").catch(() => {}); } catch {}
    onDone?.();
  };

  const next = () => {
    haptic("soft");
    if (step < TOTAL - 1) setStep(s => s + 1);
    else persistAndFinish();
  };
  const skip = () => {
    haptic("soft");
    if (step < TOTAL - 1) setStep(s => s + 1);
    else persistAndFinish();
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
        <div className="onboard-track" style={{ transform: `translateX(-${step * 50}%)` }}>
          {/* 1. Welcome */}
          <div className="onboard-step">
            <div className="onboard-step-top">
              <div className="onboard-icon">⚽</div>
              <div className="onboard-title">Welcome to {APP_NAME}</div>
              <div className="onboard-body">
                The ultimate football quiz. Test your knowledge, beat your mates, climb the league.
              </div>
            </div>
            <button className="onboard-btn" onClick={next}>Get Started</button>
          </div>

          {/* 2. Skill Level */}
          <div className="onboard-step">
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
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("[boundary]", error?.message || "Unknown error");
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight:"100dvh", display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center", padding:"32px 24px",
          background:"#0F1117", fontFamily:"Inter,sans-serif", textAlign:"center"
        }}>
          <div style={{fontSize:48, marginBottom:16}}>⚽</div>
          <div style={{fontSize:20, fontWeight:800, color:"#F0F1F5", marginBottom:8, letterSpacing:"-0.3px"}}>
            Something went wrong
          </div>
          <div style={{fontSize:14, color:"#9BA0B8", lineHeight:1.7, marginBottom:28}}>
            Even the best teams have bad days. Tap below to restart.
          </div>
          <button
            onClick={() => { this.setState({ hasError:false, error:null }); window.location.reload(); }}
            style={{
              padding:"13px 28px", background:"#22c55e", border:"none",
              borderRadius:11, fontFamily:"Inter,sans-serif", fontSize:14,
              fontWeight:700, color:"#0a1a00", cursor:"pointer"
            }}
          >
            Restart App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}


// ─── BADGE SYSTEM ─────────────────────────────────────────────────────────────
const BADGE_DEFS = [
  ["first_blood", "🎯", "First Whistle", "Complete your first game"],
  ["roll5",       "🔥", "On a Roll",     "5-day streak"],
  ["roll30",      "🔥", "Obsessed",      "30-day streak"],
  ["speed_demon", "⚡", "Speed Demon",   "Score 600+ Speed Round"],
  ["big_brain",   "🧠", "Big Brain",     `${APP_NAME} 120+`],
  ["goat",        "🐐", "The GOAT",      `${APP_NAME} 140+`],
  ["perfect",     "💎", "Perfectionist", "Score 10/10"],
  ["survivor",    "🏆", "Survivor",      "20+ in Survival"],
  ["scholar",     "📚", "Scholar",       "500 correct answers"],
  ["faithful",    "⚽", "Faithful",      "Play 50 games"],
  ["legend_xp",   "👑", "Legend",        "Reach 3000 XP"],
  ["world_class", "🌍", "World Class",   "100 World Cup Qs"]
];

function computeBadges(stats, xp, loginStreak) {
  const e = new Set();
  if ((stats.gamesPlayed||0) >= 1)     e.add("first_blood");
  if (loginStreak >= 5)                 e.add("roll5");
  if (loginStreak >= 30)                e.add("roll30");
  if ((stats.bestSpeedScore||0) >= 600) e.add("speed_demon");
  if ((stats.bestIQ||0) >= 120)         e.add("big_brain");
  if ((stats.bestIQ||0) >= 140)         e.add("goat");
  if ((stats.bestScore||0) >= 10)       e.add("perfect");
  if ((stats.bestStreak||0) >= 20)      e.add("survivor");
  if ((stats.totalCorrect||0) >= 500)   e.add("scholar");
  if ((stats.gamesPlayed||0) >= 50)     e.add("faithful");
  if (xp >= 3000)                       e.add("legend_xp");
  return e;
}

const AVATARS = ["⚽","🏆","🔥","⭐","🧠","🎯","👑","🌍","🐐","💎","🦁","🦅","🐺","🐉","🚀","⚡","🏅","🥇","🥈","🥉","🔮","🌟","💫","🌈","🎭","🎨","🦊","🐬","🦋","🎵","🌺","🏄"];

// ─── IMAGE CROPPER (cropperjs from CDN) ──────────────────────────────────────
let _cropperPromise = null;
function ensureCropperLoaded() {
  if (_cropperPromise) return _cropperPromise;
  const loader = new Promise((resolve, reject) => {
    try {
      if (typeof window !== "undefined" && window.Cropper) {
        resolve(window.Cropper);
        return;
      }
      if (typeof document === "undefined") {
        reject(new Error("No document"));
        return;
      }
      // Inject CSS once
      if (!document.querySelector('link[data-cropperjs]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.2/cropper.min.css";
        link.setAttribute("data-cropperjs", "1");
        document.head.appendChild(link);
      }
      // Reuse an existing script tag if present
      let script = document.querySelector('script[data-cropperjs]');
      if (!script) {
        script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.2/cropper.min.js";
        script.async = true;
        script.setAttribute("data-cropperjs", "1");
        document.head.appendChild(script);
      }
      script.addEventListener("load", () => {
        if (window.Cropper) resolve(window.Cropper);
        else reject(new Error("Cropper global missing after load"));
      }, { once: true });
      script.addEventListener("error", () => reject(new Error("cropper.js failed to load")), { once: true });
      // Already loaded edge case
      if (window.Cropper) resolve(window.Cropper);
    } catch (e) {
      reject(e);
    }
  });
  // 10s ceiling on the CDN fetch — if cdnjs is slow or unreachable the user
  // gets a toast and the modal closes instead of an indefinite spinner.
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("cropper.js load timed out")), 10000)
  );
  _cropperPromise = Promise.race([loader, timeout]).catch((err) => {
    // Allow a retry on the next attempt — leaving the rejected promise cached
    // would mean the crop modal stays broken until a full reload.
    _cropperPromise = null;
    throw err;
  });
  return _cropperPromise;
}

function CropModal({ file, onCancel, onConfirm, onLoadError }) {
  const imgRef = useRef(null);
  const cropperRef = useRef(null);
  const [imgUrl, setImgUrl] = useState(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  // Build an object URL for the selected file
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImgUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Load cropperjs from CDN (cached after first call)
  useEffect(() => {
    let cancelled = false;
    ensureCropperLoaded()
      .then(() => { if (!cancelled) setReady(true); })
      .catch((e) => {
        if (cancelled) return;
        const isTimeout = /timed out/i.test(e?.message || "");
        setError(isTimeout ? "Couldn't load image editor" : "Something went wrong — try again");
        onLoadError?.();
      });
    return () => { cancelled = true; };
  }, [onLoadError]);

  // Initialize Cropper once the library is loaded AND the image element is in the DOM
  useEffect(() => {
    if (!ready || !imgUrl || !imgRef.current) return;
    const Cropper = window.Cropper;
    if (!Cropper) return;
    const node = imgRef.current;
    const init = () => {
      try {
        cropperRef.current = new Cropper(node, {
          aspectRatio: 1,
          viewMode: 1,
          dragMode: "move",
          autoCropArea: 1,
          background: false,
          responsive: true,
          restore: false,
          zoomable: true,
          scalable: false,
          cropBoxMovable: false,
          cropBoxResizable: false,
          toggleDragModeOnDblclick: false,
          guides: false,
          center: true,
          movable: true,
        });
      } catch (e) {
        setError("Something went wrong — try again");
      }
    };
    if (node.complete && node.naturalWidth > 0) init();
    else {
      const onLoad = () => init();
      node.addEventListener("load", onLoad, { once: true });
      node.addEventListener("error", () => setError("Image failed to load"), { once: true });
      // Cleanup listener if the effect tears down before load
      return () => {
        node.removeEventListener("load", onLoad);
        if (cropperRef.current) { try { cropperRef.current.destroy(); } catch {} cropperRef.current = null; }
      };
    }
    return () => {
      if (cropperRef.current) { try { cropperRef.current.destroy(); } catch {} cropperRef.current = null; }
    };
  }, [ready, imgUrl]);

  const handleUse = async () => {
    if (!cropperRef.current || busy) return;
    setBusy(true);
    try {
      const canvas = cropperRef.current.getCroppedCanvas({
        width: 400,
        height: 400,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: "high",
      });
      if (!canvas) throw new Error("Could not get cropped canvas");
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("Canvas toBlob returned null"))),
          "image/jpeg",
          0.9
        );
      });
      await onConfirm?.(blob);
    } catch (e) {
      setError("Something went wrong — try again");
      setBusy(false);
    }
  };

  return (
    <div className="crop-overlay" role="dialog" aria-modal="true" aria-label="Crop your photo">
      <div className="crop-header">Crop your photo</div>
      <div className="crop-stage crop-circle-mask">
        {imgUrl && (
          <img
            ref={imgRef}
            src={imgUrl}
            alt=""
            style={{ maxWidth: "100%", maxHeight: "100%", display: "block" }}
          />
        )}
        {!ready && !error && (
          <div className="crop-status">Loading cropper…</div>
        )}
        {error && <div className="crop-status crop-status-err">{error}</div>}
      </div>
      <div className="crop-actions">
        <button
          className="crop-btn secondary"
          onClick={onCancel}
          disabled={busy}
        >
          Cancel
        </button>
        <button
          className="crop-btn primary"
          onClick={handleUse}
          disabled={!ready || busy || !!error}
        >
          {busy ? "Uploading…" : "Use Photo"}
        </button>
      </div>
    </div>
  );
}

// ─── FRIENDS SECTION ──────────────────────────────────────────────────────────
// Lives inside ProfileScreen. Requires an authenticated user (userId). When
// isActive is true the section loads friendships on mount and after any action
// so counts + lists stay fresh when the user returns to the Profile tab.
// Map any legacy string IDs (a pre-emoji convention that survives in some
// older profile rows — see useAuth.jsx fallback) onto their emoji equivalent.
// Real emojis pass through unchanged. Unknown legacy strings default to ⚽
// rather than render as plain text "ball" / "lion" / etc.
const LEGACY_AVATAR_IDS = {
  ball: "⚽", trophy: "🏆", fire: "🔥", star: "⭐", brain: "🧠",
  target: "🎯", crown: "👑", world: "🌍", goat: "🐐", diamond: "💎",
  lion: "🦁", eagle: "🦅", wolf: "🐺", dragon: "🐉", rocket: "🚀",
};
function avatarEmoji(v) {
  if (!v || typeof v !== "string") return "⚽";
  if (LEGACY_AVATAR_IDS[v]) return LEGACY_AVATAR_IDS[v];
  // Plain ASCII looks like an unmapped legacy id — fall back rather than
  // render text. Real emojis are non-ASCII so they sail through.
  if (/^[a-z_-]+$/i.test(v)) return "⚽";
  return v;
}

function FriendsSection({ userId, currentUserScore, currentUserName, currentUserAvatar, onChallenge, onToast, onOpenFriend }) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [friendships, setFriendships] = useState([]);
  const [loading, setLoading] = useState(false);
  const toast = onToast || (() => {});

  const loadFriendships = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("friendships")
        .select("*,requester:profiles!requester_id(id,username,avatar:avatar_id,total_score),addressee:profiles!addressee_id(id,username,avatar:avatar_id,total_score)")
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);
      if (error) throw error;
      setFriendships(data || []);
    } catch (e) {
      console.error("[friends] load", e?.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) loadFriendships();
  }, [userId, loadFriendships]);

  // Realtime: surface incoming friend requests as soon as they're inserted on
  // Supabase, so the user doesn't have to leave and re-enter Friends to see
  // them. Subscribed only while the section is mounted.
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`friendships:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "friendships", filter: `addressee_id=eq.${userId}` },
        async (payload) => {
          const requesterId = payload?.new?.requester_id;
          let name = "someone";
          if (requesterId) {
            try {
              const { data } = await supabase.from("profiles").select("username").eq("id", requesterId).maybeSingle();
              if (data?.username) name = data.username;
            } catch {}
          }
          toast(`📩 New friend request from ${name}`);
          loadFriendships();
        }
      )
      .subscribe();
    return () => { try { supabase.removeChannel(channel); } catch {} };
  }, [userId, loadFriendships, toast]);

  // Derived lists
  const incoming = friendships.filter(f => f.status === "pending" && f.addressee_id === userId);
  const outgoing = friendships.filter(f => f.status === "pending" && f.requester_id === userId);
  const accepted = friendships.filter(f => f.status === "accepted");

  // Set of user ids we shouldn't show in search (already friended or pending)
  const excludedIds = useMemo(() => {
    const s = new Set([userId]);
    friendships.forEach(f => {
      if (f.status === "declined") return;
      s.add(f.requester_id); s.add(f.addressee_id);
    });
    return s;
  }, [friendships, userId]);

  // Debounced search
  useEffect(() => {
    const q = search.trim();
    if (q.length < 2) { setResults([]); setSearching(false); return; }
    let cancelled = false;
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const filterExpr = `%${q}%`;
        if (import.meta.env.DEV) {
          console.log("[friends] ── search start ──");
          console.log("[friends] raw input:", search);
          console.log("[friends] trimmed term:", q);
          console.log("[friends] ilike pattern:", filterExpr);
          console.log("[friends] my userId:", userId);
          console.log("[friends] excludedIds (will filter these out):", Array.from(excludedIds));
        }
        const { data, error } = await supabase
          .from("profiles")
          .select("id,username,avatar:avatar_id,total_score")
          .ilike("username", filterExpr)
          .limit(10);
        if (import.meta.env.DEV) {
          console.log("[friends] supabase data:", data);
          console.log("[friends] supabase error:", error);
        }
        if (cancelled) return;
        if (error) throw error;
        // DIAGNOSTIC: temporarily bypass the excludedIds filter so we can see
        // every row Supabase returns (including the user themselves and
        // already-friended users). Restore the filter once the empty-results
        // bug is understood.
        const rawRows = data || [];
        const filteredRows = rawRows.filter(p => !excludedIds.has(p.id));
        if (import.meta.env.DEV) {
          console.log("[friends] rows from supabase:", rawRows.length);
          console.log("[friends] rows after excludedIds filter:", filteredRows.length);
          if (rawRows.length && !filteredRows.length) {
            console.log("[friends] ⚠️ all rows were filtered out by excludedIds — friend may already be in friendships table");
          }
        }
        setResults(import.meta.env.DEV ? rawRows : filteredRows);
      } catch (e) {
        console.error("[friends] search", e?.message || "Unknown error", e);
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [search, excludedIds]);

  const sendRequest = async (target) => {
    if (!userId) return;
    try {
      const { error } = await supabase
        .from("friendships")
        .insert({ requester_id: userId, addressee_id: target.id });
      if (error) throw error;
      toast(`Friend request sent to ${target.username} ✉️`);
      setResults(prev => prev.filter(p => p.id !== target.id));
      loadFriendships();
    } catch (e) {
      console.error("[friends] sendRequest", e?.message || "Unknown error");
      toast("Couldn't send request — try again");
    }
  };

  const setStatus = async (friendshipId, status) => {
    try {
      const { error } = await supabase
        .from("friendships")
        .update({ status })
        .eq("id", friendshipId);
      if (error) throw error;
      loadFriendships();
    } catch (e) {
      console.error("[friends] setStatus", e?.message || "Unknown error");
      toast("Couldn't update — try again");
    }
  };

  const cancelRequest = async (friendshipId) => {
    try {
      const { error } = await supabase
        .from("friendships")
        .delete()
        .eq("id", friendshipId);
      if (error) throw error;
      loadFriendships();
    } catch (e) {
      console.error("[friends] cancel", e?.message || "Unknown error");
      toast("Couldn't cancel — try again");
    }
  };

  // Mini-leaderboard: accepted friends + me, sorted by total_score desc.
  // Depend on `friendships` (stable state ref) not on derived `accepted` which
  // is a fresh array every render — otherwise the memo never actually hits.
  const leaderboard = useMemo(() => {
    const rows = friendships
      .filter(f => f.status === "accepted")
      .map(f => {
        const other = f.requester_id === userId ? f.addressee : f.requester;
        return other ? { id: other.id, username: other.username, avatar: other.avatar, score: other.total_score || 0, isMe: false } : null;
      })
      .filter(Boolean);
    rows.push({ id: userId, username: currentUserName || "You", avatar: avatarEmoji(currentUserAvatar), score: currentUserScore || 0, isMe: true });
    rows.sort((a, b) => b.score - a.score);
    return rows;
  }, [friendships, userId, currentUserScore, currentUserName, currentUserAvatar]);

  const otherOf = (f) => f.requester_id === userId ? f.addressee : f.requester;

  return (
    <div className="friends-section">
      {/* Search */}
      <div className="friends-search-wrap">
        <input
          className="friends-search-inp"
          type="search"
          inputMode="search"
          autoCorrect="off"
          autoCapitalize="none"
          placeholder="Find a friend by username…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      {search.trim().length >= 2 && (
        <div className="friends-results">
          {searching && <div className="friends-muted">Searching…</div>}
          {!searching && results.length === 0 && (() => {
            const term = search.trim();
            const hasSpace = /\s/.test(term);
            const hasSpecial = /[^A-Za-z0-9_-]/.test(term.replace(/\s/g, ""));
            return (
              <div className="friends-muted" style={{display:"flex",flexDirection:"column",gap:4}}>
                <div>No players found — try a different username</div>
                <div style={{fontSize:12,color:"var(--t3)"}}>Make sure you've typed their username exactly</div>
                {(hasSpace || hasSpecial) && (
                  <div style={{fontSize:12,color:"var(--t3)"}}>Tip: usernames don't contain spaces</div>
                )}
              </div>
            );
          })()}
          {results.map(r => (
            <div key={r.id} className="friends-row">
              <div className="friends-avatar">{avatarEmoji(r.avatar)}</div>
              <div className="friends-meta">
                <div className="friends-name">{r.username}</div>
                <div className="friends-sub numeric-mono">Score {(r.total_score || 0).toLocaleString()}</div>
              </div>
              <button className="friends-action" onClick={() => sendRequest(r)}>Add</button>
            </div>
          ))}
        </div>
      )}

      {/* Incoming pending */}
      {incoming.length > 0 && (
        <div className="friends-block">
          <div className="friends-block-title">Incoming requests</div>
          {incoming.map(f => {
            const p = otherOf(f);
            if (!p) return null;
            return (
              <div key={f.id} className="friends-row">
                <div className="friends-avatar">{avatarEmoji(p.avatar)}</div>
                <div className="friends-meta">
                  <div className="friends-name">{p.username}</div>
                  <div className="friends-sub numeric-mono">Score {(p.total_score || 0).toLocaleString()}</div>
                </div>
                <div style={{display:"flex", gap:6}}>
                  <button className="friends-action accept" onClick={() => setStatus(f.id, "accepted")}>Accept</button>
                  <button className="friends-action decline" onClick={() => setStatus(f.id, "declined")}>Decline</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Outgoing pending */}
      {outgoing.length > 0 && (
        <div className="friends-block">
          <div className="friends-block-title">Pending</div>
          {outgoing.map(f => {
            const p = otherOf(f);
            if (!p) return null;
            return (
              <div key={f.id} className="friends-row">
                <div className="friends-avatar">{avatarEmoji(p.avatar)}</div>
                <div className="friends-meta">
                  <div className="friends-name">{p.username}</div>
                  <div className="friends-sub">Pending…</div>
                </div>
                <button className="friends-action decline" onClick={() => cancelRequest(f.id)}>Cancel</button>
              </div>
            );
          })}
        </div>
      )}

      {/* Friends list */}
      <div className="friends-block">
        <div className="friends-block-title">Your friends{accepted.length > 0 ? ` · ${accepted.length}` : ""}</div>
        {loading && accepted.length === 0 && <div className="friends-muted">Loading…</div>}
        {!loading && accepted.length === 0 && <div className="friends-muted">No friends yet — search above to add some.</div>}
        {accepted.map(f => {
          const p = otherOf(f);
          if (!p) return null;
          return (
            <div key={f.id} className="friends-row">
              <button className="friends-row-tap" onClick={() => onOpenFriend && onOpenFriend(p)} aria-label={`View ${p.username}'s profile`}>
                <div className="friends-avatar">{avatarEmoji(p.avatar)}</div>
                <div className="friends-meta">
                  <div className="friends-name">{p.username}</div>
                  <div className="friends-sub numeric-mono">Score {(p.total_score || 0).toLocaleString()}</div>
                </div>
              </button>
              <button className="friends-action challenge" onClick={() => onChallenge && onChallenge(p)}>Challenge</button>
            </div>
          );
        })}
      </div>

      {/* Leaderboard */}
      {leaderboard.length > 1 && (
        <div className="friends-block">
          <div className="friends-block-title">Friends leaderboard</div>
          <div className="friends-lb">
            {leaderboard.map((row, i) => {
              const inner = (
                <>
                  <div className="friends-lb-rank numeric-mono">#{i + 1}</div>
                  <div className="friends-avatar">{avatarEmoji(row.avatar)}</div>
                  <div className="friends-name" style={{flex:1}}>{row.username}{row.isMe && <span className="friends-you-pill">YOU</span>}</div>
                  <div className="friends-lb-score numeric-mono">{row.score.toLocaleString()}</div>
                </>
              );
              if (row.isMe) {
                return <div key={row.id} className="friends-lb-row you">{inner}</div>;
              }
              return (
                <button key={row.id} className="friends-lb-row" onClick={() => onOpenFriend && onOpenFriend(row)}>
                  {inner}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── FRIEND PROFILE SCREEN ────────────────────────────────────────────────────
// Read-only profile screen for viewing another user. Mirrors the user's own
// Profile layout but: no avatar/name edit affordances, no friends list, no
// badges grid (those are personal). Day Streak tile is intentionally omitted
// because login streak is local-only and never persisted to Supabase.
function FriendProfileScreenImpl({ friendId, onBack, onChallenge }) {
  const [data, setData] = useState(null); // null = loading, false = error, object = loaded
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: row, error } = await supabase
          .from('profiles')
          .select('id, username, avatar_id, total_score, games_played, correct_answers, xp, stats')
          .eq('id', friendId)
          .maybeSingle();
        if (cancelled) return;
        if (error || !row) { setData(false); return; }
        setData(row);
      } catch {
        if (!cancelled) setData(false);
      }
    })();
    return () => { cancelled = true; };
  }, [friendId]);

  if (data === null) {
    return (
      <div className="screen">
        <div className="page-hdr">
          <button className="back-btn" onClick={onBack} aria-label="Back">←</button>
          <div className="page-title">Loading…</div>
        </div>
        <div style={{padding:"40px 20px",color:"var(--t3)",textAlign:"center"}}>Loading profile…</div>
      </div>
    );
  }
  if (data === false) {
    return (
      <div className="screen">
        <div className="page-hdr">
          <button className="back-btn" onClick={onBack} aria-label="Back">←</button>
          <div className="page-title">Profile</div>
        </div>
        <div style={{padding:"40px 20px",color:"var(--t3)",textAlign:"center"}}>Couldn't load this profile.</div>
      </div>
    );
  }

  const friendXp = data.xp || 0;
  const { level } = getLevelInfo(friendXp);
  const friendStats = (data.stats && typeof data.stats === 'object') ? data.stats : {};
  const totalCorrect = data.correct_answers || 0;
  const totalAnswered = friendStats.totalAnswered || 0;
  const gamesPlayed = data.games_played || 0;
  const avatar = avatarEmoji(data.avatar_id);
  const username = data.username || 'Player';
  const hasAnyStats = gamesPlayed > 0 || totalCorrect > 0 || (friendStats.bestScore || 0) > 0;

  return (
    <div className="screen">
      <div className="page-hdr">
        <button className="back-btn" onClick={onBack} aria-label="Back">←</button>
        <div className="page-title">{username}</div>
      </div>
      <div className="profile-card">
        <div className="profile-avatar-wrap">
          <div className="profile-avatar" style={{cursor:'default'}}>{avatar}</div>
        </div>
        <div className="profile-name" style={{cursor:'default'}}>{username}</div>
        <div className="profile-level-badge">{level.icon} {level.name} <span style={{fontSize:11,color:"var(--t3)",marginLeft:4}}>{friendXp.toLocaleString()} XP</span></div>
      </div>
      {hasAnyStats && (
        <div className="stat-grid" style={{marginBottom:16}}>
          <div className="stat-tile"><div className="st-val">{gamesPlayed}</div><div className="ds-eyebrow st-key">Games</div></div>
          <div className="stat-tile"><div className="st-val" style={{color:"var(--accent)"}}>{totalCorrect}</div><div className="ds-eyebrow st-key">Correct</div></div>
          <div className="stat-tile"><div className="st-val" style={{color:"var(--t1)"}}>{friendStats.bestScore||0}<span style={{fontSize:12,color:"var(--t3)"}}>/10</span></div><div className="ds-eyebrow st-key">Best Score</div></div>
          <div className="stat-tile"><div className="st-val" style={{color:"var(--t1)"}}>{friendStats.bestStreak||0}</div><div className="ds-eyebrow st-key">Best Streak</div></div>
          <div className="stat-tile"><div className="st-val" style={{color:"var(--accent)"}}>{(() => {
            if (totalAnswered === 0 || totalCorrect > totalAnswered) return "—";
            return `${Math.round(100 * totalCorrect / totalAnswered)}%`;
          })()}</div><div className="ds-eyebrow st-key">Accuracy</div></div>
          {friendStats.bestIQ > 0 && <div className="stat-tile"><div className="st-val" style={{color:"var(--accent)"}}>{friendStats.bestIQ}</div><div className="ds-eyebrow st-key">Best IQ</div></div>}
          {friendStats.bestHotStreak > 0 && <div className="stat-tile"><div className="st-val" style={{color:"var(--gold)"}}>{friendStats.bestHotStreak}</div><div className="ds-eyebrow st-key">⚡ Hot Streak</div></div>}
          {friendStats.bestTrueFalse > 0 && <div className="stat-tile"><div className="st-val" style={{color:"var(--t1)"}}>{friendStats.bestTrueFalse}<span style={{fontSize:12,color:"var(--t3)"}}>/20</span></div><div className="ds-eyebrow st-key">✅ T/F Best</div></div>}
        </div>
      )}
      {(() => {
        const currentIdx = LEVELS.indexOf(level);
        const topIdx = LEVELS.length - 1;
        const ordered = LEVELS.map((l, i) => ({ ...l, idx: i }));
        return (
          <div className="journey-section">
            <div className="journey-title">🏆 {username}'s Journey</div>
            <div className="journey-list">
              <div className="journey-line" />
              {ordered.map(tier => {
                const isCurrent = tier.idx === currentIdx;
                const isDone = tier.idx < currentIdx;
                const isNext = tier.idx === currentIdx + 1;
                const isTop = tier.idx === topIdx;
                const state = isCurrent ? "current" : isDone ? "done" : "";
                const xpToGo = Math.max(0, tier.xpNeeded - friendXp);
                return (
                  <div key={tier.name} className={`journey-row ${state}`}>
                    <div className="journey-dot">{isDone ? "✓" : tier.icon}</div>
                    <div className="journey-body">
                      <div className="journey-name">{tier.name}</div>
                      <div className="journey-sub">{tier.xpNeeded.toLocaleString()} XP</div>
                    </div>
                    {isCurrent && <div className="journey-badge current">CURRENT</div>}
                    {isNext && <div className="journey-badge next">{xpToGo.toLocaleString()} XP to go</div>}
                    {!isCurrent && !isNext && !isDone && isTop && (
                      <div className="journey-badge goal">Ultimate goal</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
      <button
        className="btn-3d"
        style={{marginTop:16,marginBottom:8}}
        onClick={() => onChallenge && onChallenge({ id: data.id, username, avatar: data.avatar_id })}
      >
        Challenge {username}
      </button>
    </div>
  );
}
const FriendProfileScreen = React.memo(FriendProfileScreenImpl);

// ─── PROFILE SCREEN ───────────────────────────────────────────────────────────
function ProfileScreenImpl({ profile, setProfile, stats, xp, loginStreak, level: levelProp, earnedBadges, onShareProfile, onShowWeekly, onToast, onChallenge, onOpenFriend, nameEditNonce }) {
  const { user, profile: authProfile, isGuest, uploadAvatar, exitGuestMode } = useAuth();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingCrop, setPendingCrop] = useState(null); // File awaiting crop
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const fileInputRef = useRef(null);
  // Auth profile is fetched async after `user` resolves — show a skeleton in
  // that gap so a returning user doesn't briefly see "Player".
  const authLoading = !!user && !authProfile;
  const localName = (profile?.name || "").trim();
  const hasUsername = !!authProfile?.username && authProfile.username !== "Player";
  const showNameCTA = !authLoading && !hasUsername && (!localName || localName.toLowerCase() === "player");
  const startNameEdit = () => {
    setNameDraft(localName);
    setEditingName(true);
  };
  const saveName = () => {
    const v = nameDraft.trim();
    setProfile(p => ({ ...p, name: v }));
    setEditingName(false);
    // Mirror the change up to Supabase so leaderboards and other devices
    // see the new username. Guests stay local-only.
    if (v && user && !isGuest) {
      supabase.from('profiles').update({ username: v }).eq('id', user.id).then(({ error }) => {
        if (error) toast("⚠️ Couldn't sync name change — check your connection");
      }).catch(() => {
        toast("⚠️ Couldn't sync name change — check your connection");
      });
    }
  };
  // Open the inline editor when the home greeting tells us to.
  useEffect(() => {
    if (nameEditNonce && showNameCTA) startNameEdit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nameEditNonce]);
  // Prefer memoized values from the parent; fall back for any legacy caller.
  const level = levelProp || getLevelInfo(xp).level;
  const earned = earnedBadges || computeBadges(stats, xp, loginStreak);
  const iq = stats.bestIQ || null;
  const pctile = iq ? iqPercentile(iq) : null;
  const avatarUrl = authProfile?.avatar_url || null;
  const toast = onToast || ((m) => { try { window.alert(m); } catch {} });

  const openAvatarPicker = () => {
    if (uploading) return;
    // Guests can only use emoji — logged-in users get the full menu
    if (user && !isGuest) setShowAvatarMenu(true);
    else setShowEmojiPicker(true);
  };

  const pickFromLibrary = () => {
    setShowAvatarMenu(false);
    fileInputRef.current?.click();
  };

  const handleFileChosen = (e) => {
    const file = e.target.files && e.target.files[0];
    // Reset the input so selecting the same file again still triggers onChange
    if (e.target) e.target.value = "";
    if (!file) return;
    if (!uploadAvatar) { toast("Photo upload unavailable"); return; }
    // Defer upload — route through the crop modal first
    setPendingCrop(file);
  };

  const handleCropCancel = () => {
    setPendingCrop(null);
  };

  const handleCropConfirm = async (blob) => {
    setPendingCrop(null);
    if (!blob) return;
    setUploading(true);
    try {
      const result = await uploadAvatar(blob);
      if (result?.error) {
        toast("Could not upload photo — try again");
      } else {
        toast("Profile photo updated ✓");
      }
    } catch {
      toast("Could not upload photo — try again");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="tab-content" style={{background:"var(--bg)"}}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChosen}
        style={{display:"none"}}
      />
      {isGuest && (stats?.gamesPlayed || 0) > 0 && (
        <div style={{
          background:"linear-gradient(135deg, rgba(34,197,94,0.18), rgba(34,197,94,0.06))",
          border:"1px solid var(--accent-b)",
          borderRadius:16,
          padding:"18px 18px 16px",
          marginBottom:14,
          display:"flex",
          flexDirection:"column",
          alignItems:"flex-start",
          gap:6,
        }}>
          <div style={{fontSize:16,fontWeight:800,color:"var(--t1)",letterSpacing:"-0.2px"}}>🌟 Save your progress</div>
          <div style={{fontSize:13,color:"var(--t2)",lineHeight:1.4}}>Sign up to keep your stats, friends and IQ across devices.</div>
          <button
            onClick={() => { try { exitGuestMode?.(); } catch {} }}
            style={{marginTop:8,alignSelf:"stretch",padding:"12px 18px",background:"var(--accent)",color:"#0a1a00",border:"none",borderRadius:12,fontFamily:"inherit",fontSize:15,fontWeight:800,cursor:"pointer",WebkitTextFillColor:"#0a1a00",transition:"opacity 120ms ease"}}
          >
            Sign up free
          </button>
        </div>
      )}
      <div className="profile-card">
        <div className="profile-avatar-wrap" style={authLoading ? {opacity:0.4, animation:"profileSkeletonPulse 1.4s ease-in-out infinite"} : undefined}>
          <div
            className="profile-avatar"
            onClick={openAvatarPicker}
            style={avatarUrl ? {padding:0, overflow:"hidden", background:"var(--s2)"} : undefined}
          >
            {uploading ? (
              <span className="avatar-spinner" aria-label="Uploading" />
            ) : avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
                style={{width:"100%", height:"100%", objectFit:"cover", borderRadius:"50%", display:"block"}}
              />
            ) : (
              avatarEmoji(profile?.avatar)
            )}
          </div>
          <div className="profile-avatar-edit" onClick={openAvatarPicker} aria-label="Edit profile photo">✏️</div>
        </div>
        {authLoading ? (
          <div className="profile-name" style={{opacity:0.4, animation:"profileSkeletonPulse 1.4s ease-in-out infinite"}}>
            Loading…
          </div>
        ) : editingName ? (
          <input
            className="profile-name-input"
            value={nameDraft}
            onChange={e => setNameDraft(e.target.value.slice(0, 24))}
            onKeyDown={e => {
              if (e.key === "Enter") saveName();
              else if (e.key === "Escape") setEditingName(false);
            }}
            onBlur={saveName}
            placeholder="Your name"
            autoFocus
            aria-label="Your display name"
          />
        ) : showNameCTA ? (
          <>
            <button
              className="profile-name"
              onClick={startNameEdit}
              style={{background:"none",border:"none",padding:0,fontFamily:"inherit",color:"var(--t2)"}}
              aria-label="Set your name"
            >
              Player
            </button>
            <button
              onClick={startNameEdit}
              style={{background:"none",border:"none",padding:"4px 8px",marginTop:2,fontSize:12,fontWeight:600,color:"var(--accent)",cursor:"pointer",fontFamily:"inherit"}}
              aria-label="Set your name"
            >
              ✏️ Tap to set your name
            </button>
          </>
        ) : (
          <div className="profile-name" style={{cursor:"default"}}>
            {authProfile?.username || profile?.name || "Player"}
          </div>
        )}
        <div className="profile-level-badge">{level.icon} {level.name} <span style={{fontSize:11,color:"var(--t3)",marginLeft:4}}>{xp.toLocaleString()} XP</span></div>
        {iq && <div className="profile-iq-line">{APP_NAME}: <strong>{iq}</strong> — Top <strong>{100-pctile}%</strong> of players</div>}
      </div>
      {/* Two peer secondary actions. Both are ghost buttons; the gap-based
          flex container replaces the previous marginTop:-4 hack that was
          overlapping the .share-profile-btn bottom margins. */}
      <div style={{display:"flex", flexDirection:"column", gap:8, marginBottom:12}}>
        <button className="share-profile-btn" style={{marginBottom:0}} onClick={onShareProfile}>Share Profile Card</button>
        {onShowWeekly && (
          <button className="share-profile-btn" style={{marginBottom:0}} onClick={onShowWeekly}>Weekly Summary</button>
        )}
      </div>
      {(stats.gamesPlayed || 0) === 0 ? (
        <div style={{
          background:"var(--s1)",
          border:"1px solid var(--border)",
          borderRadius:14,
          padding:"22px 16px",
          marginBottom:16,
          textAlign:"center",
        }}>
          <div style={{fontSize:32, marginBottom:8}}>⚽</div>
          <div style={{fontSize:14, fontWeight:700, color:"var(--text)", marginBottom:4}}>No stats yet</div>
          <div style={{fontSize:12, color:"var(--t2)", lineHeight:1.5}}>Play your first game to see your stats here</div>
        </div>
      ) : (
        <div className="stat-grid" style={{marginBottom:16}}>
          <div className="stat-tile"><div className="st-val">{stats.gamesPlayed||0}</div><div className="ds-eyebrow st-key">Games</div></div>
          <div className="stat-tile"><div className="st-val" style={{color:"var(--gold)"}}>🔥 {loginStreak}</div><div className="ds-eyebrow st-key">Day Streak</div></div>
          <div className="stat-tile"><div className="st-val" style={{color:"var(--accent)"}}>{stats.totalCorrect||0}</div><div className="ds-eyebrow st-key">Correct</div></div>
          <div className="stat-tile"><div className="st-val" style={{color:"var(--t1)"}}>{stats.bestScore||0}<span style={{fontSize:12,color:"var(--t3)"}}>/10</span></div><div className="ds-eyebrow st-key">Best Score</div></div>
          <div className="stat-tile"><div className="st-val" style={{color:"var(--t1)"}}>{stats.bestStreak||0}</div><div className="ds-eyebrow st-key">Best Streak</div></div>
          <div className="stat-tile"><div className="st-val" style={{color:"var(--accent)"}}>{(() => {
            const c = stats.totalCorrect || 0;
            const t = stats.totalAnswered || 0;
            // Hide when no data, or when totalCorrect > totalAnswered (legacy
            // data from before totalAnswered was tracked, or cross-device
            // hydration drift) — better to show "—" than nonsense like 528%.
            if (t === 0 || c > t) return "—";
            return `${Math.round(100 * c / t)}%`;
          })()}</div><div className="ds-eyebrow st-key">Accuracy</div></div>
          {stats.bestIQ > 0 && <div className="stat-tile"><div className="st-val" style={{color:"var(--accent)"}}>{stats.bestIQ}</div><div className="ds-eyebrow st-key">Best IQ</div></div>}
          {stats.bestHotStreak > 0 && <div className="stat-tile"><div className="st-val" style={{color:"var(--gold)"}}>{stats.bestHotStreak}</div><div className="ds-eyebrow st-key">⚡ Hot Streak</div></div>}
          {stats.bestTrueFalse > 0 && <div className="stat-tile"><div className="st-val" style={{color:"var(--t1)"}}>{stats.bestTrueFalse}<span style={{fontSize:12,color:"var(--t3)"}}>/20</span></div><div className="ds-eyebrow st-key">✅ T/F Best</div></div>}
        </div>
      )}
      {(() => {
        const currentIdx = LEVELS.indexOf(level);
        const topIdx = LEVELS.length - 1;
        // Ascending order: current level lands at the top so the user
        // immediately sees "you are here" without scrolling, with progression
        // reading top→bottom toward the ultimate-goal tier.
        const ordered = LEVELS.map((l, i) => ({ ...l, idx: i }));
        return (
          <div className="journey-section">
            <div className="journey-title">🏆 Your Journey</div>
            <div className="journey-list">
              <div className="journey-line" />
              {ordered.map(tier => {
                const isCurrent = tier.idx === currentIdx;
                const isDone = tier.idx < currentIdx;
                const isNext = tier.idx === currentIdx + 1;
                const isTop = tier.idx === topIdx;
                const state = isCurrent ? "current" : isDone ? "done" : "";
                const xpToGo = Math.max(0, tier.xpNeeded - xp);
                return (
                  <div key={tier.name} className={`journey-row ${state}`}>
                    <div className="journey-dot">{isDone ? "✓" : tier.icon}</div>
                    <div className="journey-body">
                      <div className="journey-name">{tier.name}</div>
                      <div className="journey-sub">{tier.xpNeeded.toLocaleString()} XP</div>
                    </div>
                    {isCurrent && <div className="journey-badge current">YOU ARE HERE</div>}
                    {isNext && <div className="journey-badge next">{xpToGo.toLocaleString()} XP to go</div>}
                    {!isCurrent && !isNext && !isDone && isTop && (
                      <div className="journey-badge goal">Ultimate goal</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
      {user && !isGuest && (
        <FriendsSection
          userId={user.id}
          currentUserScore={authProfile?.total_score || 0}
          currentUserName={authProfile?.username || profile?.name || "You"}
          currentUserAvatar={avatarEmoji(authProfile?.avatar_id || profile?.avatar)}
          onChallenge={onChallenge}
          onToast={onToast}
          onOpenFriend={onOpenFriend}
        />
      )}
      <div className="badges-section">
        <div className="badges-title">Badges — {earned.size}/{BADGE_DEFS.length} earned</div>
        {earned.size === 0 && (
          <div style={{textAlign:"center",padding:"12px 0",color:"var(--t3)",fontSize:13,marginBottom:8}}>
            Play games to unlock your first badge 🎖️
          </div>
        )}
        <div className="badges-grid">
          {/* Earned badges sort to the front so the user's accomplishments
              read first. Locked tiles still show, just demoted. Within each
              group the original BADGE_DEFS order is preserved. */}
          {[...BADGE_DEFS].sort((a, b) => {
            const aE = earned.has(a[0]);
            const bE = earned.has(b[0]);
            if (aE === bE) return 0;
            return aE ? -1 : 1;
          }).map(([id,icon,name]) => (
            <div key={id} className={`badge-tile ${earned.has(id)?"earned":"locked"}`}
              style={earned.has(id) ? {background:"rgba(34,197,94,0.1)",borderColor:"rgba(34,197,94,0.25)"} : {}}>
              <span className="badge-icon" style={{filter:earned.has(id)?"none":"grayscale(1) opacity(0.35)"}}>{icon}</span>
              <span className="badge-name" style={{color:earned.has(id)?"var(--t1)":"var(--t3)"}}>{name}</span>
            </div>
          ))}
        </div>
      </div>
      {showAvatarMenu && (
        <div className="emoji-picker-overlay" onClick={() => setShowAvatarMenu(false)}>
          <div className="emoji-picker-sheet" onClick={e => e.stopPropagation()}>
            <div className="emoji-picker-title">Profile photo</div>
            <div className="avatar-menu">
              <button className="avatar-menu-row" onClick={pickFromLibrary}>
                <span style={{fontSize:22}}>🖼️</span>
                <div style={{flex:1, minWidth:0}}>
                  <div style={{fontSize:14, fontWeight:700, color:"var(--t1)"}}>Choose from library</div>
                  <div style={{fontSize:12, color:"var(--t3)"}}>Upload a photo from your device</div>
                </div>
              </button>
              <button className="avatar-menu-row" onClick={() => { setShowAvatarMenu(false); setShowEmojiPicker(true); }}>
                <span style={{fontSize:22}}>😀</span>
                <div style={{flex:1, minWidth:0}}>
                  <div style={{fontSize:14, fontWeight:700, color:"var(--t1)"}}>Choose emoji avatar</div>
                  <div style={{fontSize:12, color:"var(--t3)"}}>Pick from the emoji set</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
      {showEmojiPicker && (
        <div className="emoji-picker-overlay" onClick={() => setShowEmojiPicker(false)}>
          <div className="emoji-picker-sheet" onClick={e => e.stopPropagation()}>
            <div className="emoji-picker-title">Choose your avatar</div>
            <div className="emoji-grid">
              {AVATARS.map(em => (
                <button key={em} className={`emoji-opt${profile?.avatar===em?" selected":""}`}
                  onClick={() => {
                    setProfile(p => ({...p, avatar:em}));
                    setShowEmojiPicker(false);
                    // Sync emoji choice to Supabase so friend lists and
                    // leaderboards see the new avatar across devices.
                    if (user && !isGuest) {
                      supabase.from('profiles').update({ avatar_id: em }).eq('id', user.id).then(({ error }) => {
                        if (error) toast("⚠️ Couldn't sync avatar — check your connection");
                      }).catch(() => {
                        toast("⚠️ Couldn't sync avatar — check your connection");
                      });
                    }
                  }}>
                  {em}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {pendingCrop && (
        <CropModal
          file={pendingCrop}
          onCancel={handleCropCancel}
          onConfirm={handleCropConfirm}
          onLoadError={() => {
            onToast?.("⚠️ Couldn't load image editor — check your connection");
            handleCropCancel();
          }}
        />
      )}
    </div>
  );
}
const ProfileScreen = React.memo(ProfileScreenImpl);

function MonthlyCalendar({ history, today, viewDate, setViewDate, onPlayDate, onViewScore }) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const monthLabel = viewDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

  // Disable forward nav when the viewed month is the current month or later
  const viewedMonthIdx = year * 12 + month;
  const todayMonthIdx = today.getFullYear() * 12 + today.getMonth();
  const atCurrentMonth = viewedMonthIdx >= todayMonthIdx;

  return (
    <div className="streak-section">
      <div className="cal-header">
        <button className="cal-nav" onClick={() => setViewDate(new Date(year, month - 1, 1))} aria-label="Previous month">←</button>
        <div className="cal-month">{monthLabel}</div>
        <button className="cal-nav" onClick={() => setViewDate(new Date(year, month + 1, 1))} disabled={atCurrentMonth} aria-label="Next month">→</button>
      </div>
      <div className="cal-dow">
        {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => (
          <div key={d} className="cal-dow-cell">{d}</div>
        ))}
      </div>
      <div className="cal-grid">
        {cells.map((d, i) => {
          if (!d) return <div key={`e-${i}`} className="cal-cell cal-empty" />;
          const ymd = dateToYMD(d);
          const score = history[ymd];
          const isCompleted = typeof score === "number";
          const dTime = d.getTime();
          const isToday = dTime === todayMidnight;
          const isFuture = dTime > todayMidnight;
          const isPastMissed = dTime < todayMidnight && !isCompleted;

          let cls = "cal-cell";
          if (isCompleted) cls += " cal-done";
          if (isToday) cls += " cal-today";
          if (isFuture) cls += " cal-future";
          else if (isPastMissed) cls += " cal-missed";

          const handleClick = () => {
            if (isFuture) return;
            if (isCompleted) onViewScore(d, score);
            else onPlayDate(d);
          };

          return (
            <button key={ymd} className={cls} onClick={handleClick} disabled={isFuture} aria-label={`${ymd}${isCompleted ? ` completed ${score}/7` : isToday ? " today" : isPastMissed ? " missed" : ""}`}>
              <span className="cal-num">{d.getDate()}</span>
              {isCompleted && <span className="cal-check">✓</span>}
            </button>
          );
        })}
      </div>
      <div className="cal-legend">
        <span className="cal-legend-item"><span className="cal-legend-dot" style={{background:"var(--accent)"}} />Done</span>
        <span className="cal-legend-item"><span className="cal-legend-dot" style={{background:"var(--accent-dim)", border:"1.5px solid var(--accent)"}} />Today</span>
        <span className="cal-legend-item"><span className="cal-legend-dot" style={{background:"rgba(239,68,68,0.05)", border:"1px solid rgba(239,68,68,0.25)"}} />Missed</span>
      </div>
    </div>
  );
}


// ─── DAILY TAB SCREEN ─────────────────────────────────────────────────────────
function DailyTabScreenImpl({ stats, dailyDone, dailyScore, loginStreak, onPlay, iqHistory, onSuggest, xp, onUseShield, shieldActive, onShare, dailyHistory, onPlayDate, onViewScore }) {
  const today = useMemo(() => new Date(), []);
  const [viewDate, setViewDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  // Defensive: derive done-state from BOTH the dailyDone prop AND a fresh
  // localStorage read. Catches edge cases where parent state didn't
  // propagate (memo skip, async write race, storage write failure that
  // resets state on reload but storage is actually present).
  const todayYMD = dateToYMD(today);
  let localDone = false;
  let localScore = dailyScore;
  try {
    const raw = localStorage.getItem(`biq_daily_${todayYMD}`);
    if (raw) {
      localDone = true;
      try { const p = JSON.parse(raw); if (typeof p?.score === "number") localScore = p.score; } catch {}
    }
  } catch {}
  const isDone = dailyDone || localDone;
  const shownScore = dailyScore != null ? dailyScore : localScore;
  return (
    <div className="tab-content">
      <div className="daily-hero">
        <div className="daily-hero-title">{isDone ? "Challenge Complete!" : "Today's Challenge"}</div>
        <div className="daily-hero-sub">
          {isDone ? (
            <>You scored {shownScore}/7 today. <DailyCountdown /></>
          ) : "7 questions. One chance per day."}
        </div>
        <button className={`daily-hero-btn ${isDone?"done":"available"}`} onClick={onPlay} disabled={isDone}>
          {isDone ? <DailyCountdown score={shownScore} /> : "Play Today's Challenge"}
        </button>
        {isDone && onShare && (
          <button className="btn-3d amber" onClick={onShare} style={{marginTop:14}}>
            Share Result 📤
          </button>
        )}
      </div>
      {shieldActive && (
        <div style={{background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.2)",borderRadius:12,padding:"12px 14px",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:20}}>🛡️</span>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:"var(--t1)"}}>Streak Shield available</div>
              <div style={{fontSize:11,color:"var(--t2)"}}>Earned at {Math.floor((xp||0)/200)*200} XP — protects your streak once</div>
            </div>
          </div>
          <button onClick={onUseShield} style={{background:"var(--accent)",border:"none",borderRadius:8,padding:"6px 12px",fontSize:12,fontWeight:700,color:"#fff",cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>Use 🛡️</button>
        </div>
      )}
      {(stats?.gamesThisWeek !== undefined) && (
        <div style={{background:"var(--s1)",border:"1px solid var(--border)",borderRadius:12,padding:"12px 14px",marginBottom:12}}>
          <div style={{fontSize:10,fontWeight:700,color:"var(--t3)",letterSpacing:0.2,fontFamily:"'Inter',sans-serif",marginBottom:8}}>This Week</div>
          <div style={{display:"flex",alignItems:"baseline",gap:12}}>
            <div style={{fontSize:28,fontWeight:900,color:"var(--t1)",lineHeight:1}}>{stats?.gamesThisWeek || 0}</div>
            <div style={{fontSize:13,color:"var(--t2)"}}>games played</div>
            {stats?.gamesLastWeek > 0 && (() => {
              const diff = (stats?.gamesThisWeek || 0) - stats.gamesLastWeek;
              return <div style={{marginLeft:"auto",fontSize:12,fontWeight:700,color: diff >= 0 ? "var(--accent)" : "var(--t3)"}}>{diff >= 0 ? "↑" : "↓"} {Math.abs(diff)} vs last week</div>;
            })()}
          </div>
        </div>
      )}
      <MonthlyCalendar
        history={dailyHistory}
        today={today}
        viewDate={viewDate}
        setViewDate={setViewDate}
        onPlayDate={onPlayDate}
        onViewScore={onViewScore}
      />
      {isDone && (
        <div style={{background:"var(--s1)",borderRadius:16,padding:"16px 18px",marginTop:12,marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:700,color:"var(--t1)",marginBottom:10}}>While you wait for tomorrow…</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {[
              {icon:"🧠", label:`Take the ${APP_NAME} Test`, action:"balliq"},
              {icon:"⚡🔥", label:"Try Hot Streak", action:"hotstreak"},
              {icon:"🔥", label:"Try Survival Mode", action:"survival"},
            ].map(({icon, label, action}) => (
              <button key={action} className="mode-item" onClick={() => onSuggest(action)} style={{padding:"12px 14px"}}>
                <div className="mi-icon" style={{fontSize:18}}>{icon}</div>
                <div className="mi-body"><div className="mi-name" style={{fontSize:14}}>{label}</div></div>
                <div className="mi-arrow">→</div>
              </button>
            ))}
          </div>
        </div>
      )}
      {iqHistory && iqHistory.length > 0 && (
        <div className="streak-section">
          <div className="streak-sec-title">{APP_NAME} History</div>
          <div className="iq-hist-bars" style={{height:52,alignItems:"flex-end"}}>
            {iqHistory.map((h,i) => (
              <div key={i} className="iq-hist-col">
                <div className="iq-hist-bar" style={{height:`${Math.round(((h.iq-60)/100)*44)+4}px`,background:h.iq>=120?"var(--accent)":h.iq>=100?"var(--gold)":"var(--t3)"}}/>
                <div className="iq-hist-n">{h.iq}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
const DailyTabScreen = React.memo(DailyTabScreenImpl);

// ─── LEAGUE SCREEN ────────────────────────────────────────────────────────────
// 9 narrative-placeholder opponents — combined with the user, the league
// table renders a clean 10. Dropping the last index leaves indices 0–8
// stable across the PRNG seeded distribution (existing weekly cohort
// arrangements unaffected; users just won't see Bjorn anymore).
const LEAGUE_NAMES = ["Carlos","Mikkel","Priya","Tomas","Yuki","Fatima","Ollie","Zara","Nnamdi"];
const LEAGUE_AVATARS = ["🇧🇷","🇩🇰","🇮🇳","🇪🇸","🇯🇵","🇳🇬","🇬🇧","🇩🇪","🇦🇷"];

function getWeekSeed() {
  const now = new Date();
  return now.getFullYear() * 100 + Math.floor((now.getMonth()*31 + now.getDate()) / 7);
}

function getLeagueCohort(userXp, weekSeed) {
  const s = (weekSeed * 1013904223) >>> 0;
  const prng = (n) => { let x = (s ^ n*2654435769)>>>0; x^=x>>16; x^=x<<5; x^=x>>8; return (x>>>0)/4294967296; };
  const base = Math.max(50, userXp);
  return LEAGUE_NAMES.map((name, i) => ({
    name, avatar: LEAGUE_AVATARS[i],
    xp: Math.max(10, Math.round(base + (prng(i*7+1)-0.3)*base*0.8)),
    isYou: false
  }));
}

function LeagueScreenImpl({ xp, weeklyXp, profile, isActive = true }) {
  const myWeeklyXp = weeklyXp || 0;
  const weekSeed = getWeekSeed();
  const baseOpponents = getLeagueCohort(Math.max(myWeeklyXp, 50), weekSeed);
  // Simulate opponents earning XP since week start — gives a live feel
  const [liveXP, setLiveXP] = useState(() =>
    baseOpponents.map((o, i) => {
      const minutesSinceMonday = ((Date.now() / 60000) % (7*24*60));
      const rate = 0.3 + (i % 3) * 0.15; // different activity rates per player
      return { ...o, xp: o.xp + Math.floor(minutesSinceMonday * rate) };
    })
  );
  // Tick one random opponent every 8s to feel alive — paused when the tab is
  // hidden so it doesn't wake React up while the user is on Home / Daily / Profile.
  useEffect(() => {
    if (!isActive) return;
    const id = setInterval(() => {
      setLiveXP(prev => {
        const idx = Math.floor(Math.random() * prev.length);
        return prev.map((o, i) => i === idx ? { ...o, xp: o.xp + Math.floor(Math.random() * 15 + 5) } : o);
      });
    }, 8000);
    return () => clearInterval(id);
  }, [isActive]);

  const you = { name: profile?.name||"You", avatar: profile?.avatar||"⚽", xp, isYou:true };
  const all = [...liveXP, you].sort((a,b) => b.xp - a.xp);
  const yourRank = all.findIndex(p => p.isYou) + 1;
  const now = new Date();
  const monday = new Date(now); monday.setDate(now.getDate() + ((7-now.getDay()+1)%7||7)); monday.setHours(0,0,0,0);
  const daysLeft = Math.ceil((monday-now)/TIMINGS.DAY_MS);
  const { level } = getLevelInfo(xp);
  if (xp === 0) {
    return (
      <div className="tab-content">
        <div style={{textAlign:"center",padding:"40px 20px"}}>
          <div style={{fontSize:48,marginBottom:16}}>🏆</div>
          <div style={{fontSize:20,fontWeight:800,color:"var(--t1)",marginBottom:8}}>Join the League</div>
          <div style={{fontSize:14,color:"var(--t2)",lineHeight:1.7,marginBottom:24}}>Play your first game to earn XP and join this week's league. Top 3 players promote every week.</div>
          <div style={{background:"var(--s1)",borderRadius:16,padding:"16px",marginBottom:16,textAlign:"left"}}>
            <div style={{fontSize:12,color:"var(--t3)",marginBottom:8,fontWeight:600,letterSpacing:1}}>HOW IT WORKS</div>
            {[
              ["⚽","Play any game mode to earn XP"],
              ["📈","Climb the weekly leaderboard"],
              ["🥇","Top 3 promote to a higher league"],
              ["🔄","Resets every Monday"],
            ].map(([icon, text]) => (
              <div key={text} style={{display:"flex",gap:10,alignItems:"center",marginBottom:8}}>
                <span style={{fontSize:18}}>{icon}</span>
                <span style={{fontSize:13,color:"var(--t2)"}}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tab-content">
      <div className="league-header">
        <div className="league-title">{level.icon} {level.name}</div>
        <div className="league-sub">Week {Math.floor(weekSeed%52)+1} — Rank #{yourRank} of {all.length}</div>
        <div className="league-sub" style={{color: myWeeklyXp > 0 ? "var(--accent)" : "var(--t3)", fontWeight: myWeeklyXp > 0 ? 700 : 500, marginTop:2}}>{myWeeklyXp} XP this week</div>
        <div className="league-timer">Resets in {daysLeft} day{daysLeft!==1?"s":""}</div>
      </div>
      <div style={{background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.15)",borderRadius:12,padding:"10px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:20}}>⚡</span>
        <span style={{fontSize:12,color:"var(--t2)",lineHeight:1.5}}>Play any game to earn XP and climb. <span style={{color:"var(--accent)",fontWeight:700}}>Top 3 promote</span> · <span style={{color:"#FF4B4B",fontWeight:700}}>bottom 3 relegate</span> every Monday.</span>
      </div>
      <div style={{fontSize:11,color:"var(--t3)",textAlign:"center",lineHeight:1.5,marginBottom:10,fontStyle:"italic"}}>
        Practice league · joining real players soon
      </div>
      <div className="league-table">
        <div className="lt-header"><div className="lt-hcol">#</div><div className="lt-hcol">Player</div><div className="lt-hcol" style={{textAlign:"right"}}>XP</div></div>
        {all.map((p,i) => {
          const rank=i+1; const medal=rank===1?"🥇":rank===2?"🥈":rank===3?"🥉":null;
          const rc=p.isYou?"you":rank<=3?"promote":rank>=8?"relegate":"";
          return (
            <div key={i} className={`lt-row ${rc}`}>
              <div className="lt-rank">{medal||rank}</div>
              <div className="lt-name"><span>{p.avatar}</span>{p.name}{p.isYou&&<span style={{fontSize:10,background:"var(--accent)",color:"#0a1a00",borderRadius:4,padding:"1px 5px",marginLeft:4,fontWeight:700}}>YOU</span>}</div>
              <div className="lt-xp">{p.xp.toLocaleString()}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
const LeagueScreen = React.memo(LeagueScreenImpl);


const HOW_TO_PLAY = {
  hotstreak: { title:"⚡🔥 Hot Streak", steps:["You have 60 seconds on the clock","Answer as many questions as you can","No penalty for wrong answers — just keep going!","Score is how many you get correct","Try to beat your personal best"] },
  truefalse: { title:"✅ True or False", steps:["You get 20 football statements","Tap TRUE or FALSE for each one","There's no timer — take your time","Every correct answer earns XP","A perfect 20/20 earns a bonus!"] },
  wc2026: { title:"🌍 World Cup 2026", steps:["15 questions about the 2026 World Cup","All 48 competing nations covered","Questions on history, players and format","No timer — test your knowledge","Great prep for the tournament!"] },
  survival: { title:"🔥 Survival", steps:["Answer questions one by one","One wrong answer and the game is over","No timer — accuracy is everything","See how far you can go","Your best streak is saved"] },
  balliq: { title:`🧠 ${APP_NAME} Test`, steps:["20 questions across all categories","Difficulty ramps up as you go","Your score maps to an IQ number","Compare your percentile with others","Your history is saved for tracking"] },
};

// Shared hide style so the home-screen tab wrappers reference the same object
// each render (no new allocation on every tab change).
const HIDDEN_STYLE = { display: "none" };

// ─── FOOTBALL WORDLE ──────────────────────────────────────────────────────────
// Surnames are stored uppercase, ASCII-only, 4–8 letters. Daily seed picks one
// by index so every player gets the same answer until midnight local time.
const WORDLE_PLAYERS = [
  // 4 letters
  "KANE","COLE","OWEN","MANE","PELE","BEST","INCE","RUSH","CASE","NEAL",
  "BABB","KAHN","LAHM","OZIL","REUS","TONI","STAM","ZOLA","RAUL","XAVI",
  "ALBA","JOTA","MATA","NANI","PARK","EVRA","DIAZ","RICE","SAKA","ISCO",
  // 5 letters
  "MESSI","SALAH","HENRY","TERRY","GIGGS","VIDIC","TEVEZ","KLOPP","BANKS","MOORE",
  "HURST","ADAMS","PIRES","DIXON","KEANE","IRWIN","BRUCE","JONES","SMITH","KLOSE",
  "NEUER","GOTZE","KROOS","TOTTI","NESTA","PIRLO","VIERI","PUYOL","PIQUE","RAMOS",
  "VILLA","SILVA","PEDRO","ALVES","COSTA","EVANS","JAMES","VARDY","BRADY","KEOWN",
  "POGBA","MARIA","FODEN","MOUNT","NUNEZ","ONANA","MENDY","DEPAY","TOURE","MIKEL",
  // 6 letters
  "NEYMAR","MBAPPE","MODRIC","BUFFON","ZIDANE","ROONEY","AGUERO","SUAREZ","WENGER","CRUYFF",
  "PUSKAS","YASHIN","PETERS","HODDLE","WADDLE","WRIGHT","VIEIRA","HUGHES","ROBSON","KEEGAN",
  "HANSEN","FOWLER","BERGER","MULLER","RIBERY","ROBBEN","PERSIE","GULLIT","KOEMAN","DAVIDS",
  "BARESI","BAGGIO","VIALLI","HIERRO","TORRES","HAZARD","MORATA","DROGBA","MAHREZ","MILNER",
  "DYBALA","ICARDI","KOUNDE","THIAGO","CHIESA","FOFANA","HALLER","LUKAKU","LLORIS","VARANE",
  "DAVIES","HAKIMI","CAVANI","FALCAO","GALLAS","CRESPO",
  // 7 letters
  "RONALDO","HAALAND","BENZEMA","BECKHAM","GERRARD","LAMPARD","SHEARER","SCHOLES","FIRMINO","SHANKLY",
  "EUSEBIO","PLATINI","LINEKER","CANTONA","WILKINS","BUTCHER","SHILTON","FLOWERS","TOSHACK","SOUNESS",
  "KENNEDY","BALLACK","BOATENG","HUMMELS","SNIJDER","SEEDORF","MALDINI","GATTUSO","INZAGHI","MILITAO",
  "ASENSIO","HERRERA","VERATTI","MERTENS","HIGUAIN","RAFINHA","CARRICK","ALISSON","EDERSON","MAGUIRE",
  "RUDIGER","KIMMICH","DEMBELE","ENDRICK","WALCOTT",
  // 8 letters
  "CASILLAS","MOURINHO","FERGUSON","DALGLISH","MARADONA","CHARLTON","BERGKAMP","CLEMENCE","REDKNAPP","MATTHAUS",
  "BIERHOFF","PODOLSKI","RIJKAARD","BUSQUETS","FABREGAS","COUTINHO","COURTOIS","JORGINHO","VINICIUS","GREALISH",
  "GVARDIOL","CASEMIRO","VALVERDE","MARTINEZ","LINDELOF","SMALLING","STERLING","MAKELELE","MAZRAOUI","VLAHOVIC",
  "HEIGHWAY","CAMPBELL",
];

// Day index from local-midnight epoch — same value for everyone in the same UTC
// day. Using getTime() / TIMINGS.DAY_MS means the puzzle rolls over at UTC midnight,
// which keeps "everyone gets the same player" simple across timezones.
function getWordleDayIndex() { return Math.floor(Date.now() / TIMINGS.DAY_MS); }
function getWordleAnswer() { return WORDLE_PLAYERS[getWordleDayIndex() % WORDLE_PLAYERS.length]; }
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
function getWordleDateKey() { return dateToDateKey(new Date()); }
// Read today's puzzle progress for the home-screen card. Returns one of:
//   { kind: "ready" } | { kind: "in-progress", used: N } | { kind: "won", used: N } | { kind: "lost" }
function readWordleTodayStatus() {
  try {
    const raw = localStorage.getItem(`biq_wordle_${getWordleDateKey()}`);
    if (!raw) return { kind: "ready" };
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.guesses)) return { kind: "ready" };
    if (parsed.status === "won") return { kind: "won", used: parsed.guesses.length };
    if (parsed.status === "lost") return { kind: "lost" };
    if (parsed.guesses.length > 0) return { kind: "in-progress", used: parsed.guesses.length };
    return { kind: "ready" };
  } catch { return { kind: "ready" }; }
}

// Standard Wordle two-pass colouring: greens first (locking those answer slots),
// then yellows that consume remaining-letter counts. This is what stops a guess
// of "OOOO" against "BOAT" from showing 4 yellows for the single O.
function gradeWordleGuess(guess, answer) {
  const n = answer.length;
  const result = new Array(n).fill("grey");
  const remaining = [];
  for (let i = 0; i < n; i++) {
    if (guess[i] === answer[i]) result[i] = "green";
    else remaining.push(answer[i]);
  }
  for (let i = 0; i < n; i++) {
    if (result[i] === "green") continue;
    const idx = remaining.indexOf(guess[i]);
    if (idx !== -1) {
      result[i] = "yellow";
      remaining.splice(idx, 1);
    }
  }
  return result;
}

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

const FootballWordle = React.memo(function FootballWordle({ onBack }) {
  // One puzzle per day — answer + storage key derive from today's date and
  // automatically resync on the day-rollover reload below.
  const dateKey = getWordleDateKey();
  const storageKey = `biq_wordle_${dateKey}`;
  const answer = useMemo(getWordleAnswer, [dateKey]);

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

  // Persist on every change to the game state.
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch {}
  }, [state, storageKey]);

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
      setTimeout(() => setShake(false), 450);
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
      setTimeout(() => setRevealed(true), answer.length * TIMINGS.WORDLE_FLIP_MS + 200);
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

  // Physical keyboard support. Ignore when modifier keys are held so we don't
  // hijack browser shortcuts (cmd-R, etc.).
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Enter") { e.preventDefault(); handleKey("ENTER"); }
      else if (e.key === "Backspace") { e.preventDefault(); handleKey("DEL"); }
      else if (/^[a-zA-Z]$/.test(e.key)) handleKey(e.key.toUpperCase());
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleKey]);

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
    const grid = state.guesses.map((g) => {
      const grades = gradeWordleGuess(g, answer);
      return grades.map((c) => (c === "green" ? "🟩" : c === "yellow" ? "🟨" : "⬛")).join("");
    }).join("\n");
    const score = state.status === "won" ? `${state.guesses.length}/6` : `X/6`;
    return `⚽ ${APP_NAME} — Today's Puzzle\n${score}\n\n${grid}\n\nballiq.app`;
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
    }, {
      onToast: (msg) => alert(msg),
      textFallback: shareText,
    });
  }, [shareText, state.guesses, state.status, answer, dateLabel]);

  return (
    <div className="wd-screen">
      <div className="wd-header">
        <button className="back-btn" onClick={onBack} aria-label="Back">←</button>
        <div className="wd-header-text">
          <div className="wd-title">⚽ Today's Puzzle</div>
          <div className="wd-sub">Guess today's footballer</div>
        </div>
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
          <div className="wd-result-title">
            {state.status === "won" ? "⚽ Brilliant!" : "Better luck tomorrow"}
          </div>
          <div className="wd-result-sub">
            The answer was <strong>{answer}</strong>
          </div>
          <button className="wd-share" onClick={onShare}>Share result</button>
          <div className="wd-result-foot">New player in {countdown}</div>
        </div>
      )}

      {state.status === "playing" && (
        <div className="wd-keyboard">
          {WORDLE_KB_ROWS.map((row, ri) => (
            <div className="wd-kb-row" key={ri}>
              {row.map((k) => {
                const isAction = k === "DEL";
                const cls = isAction ? `wd-key wd-key-action` : `wd-key wd-key-${getWordleKeyState(k, state.guesses, answer) || "idle"}`;
                return (
                  <button key={k} className={cls} onClick={() => handleKey(k)} aria-label={k === "DEL" ? "Delete last letter" : k}>
                    {k === "DEL" ? "⌫" : k}
                  </button>
                );
              })}
            </div>
          ))}
          <button className="wd-key-enter" onClick={() => handleKey("ENTER")} aria-label="ENTER">ENTER</button>
        </div>
      )}
    </div>
  );
});

// ─── APP ──────────────────────────────────────────────────────────────────────
function AppInner() {
  const { user, profile: authProfile, isGuest, exitGuestMode } = useAuth();
  const [screen, setScreen] = useState("home");
  // Bumped when the home greeting is tapped so the profile screen knows to
  // open the inline name editor.
  const [nameEditNonce, setNameEditNonce] = useState(0);
  // Pending invite code captured from `?join=` on cold start. Persisted to
  // localStorage so it survives the sign-in detour for guests / unsigned
  // users. Cleared once consumed (room joined, dismissed, or signed-out
  // away). The native app wrapper should hand the code in via the same
  // localStorage key after parsing the Universal / App Link.
  const [pendingJoinCode, setPendingJoinCode] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const fromUrl = params.get("join");
      if (fromUrl) {
        try { localStorage.setItem("biq_pending_join", fromUrl); } catch {}
        // Strip the param so a refresh doesn't re-trigger the auto-join.
        try {
          const cleanUrl = `${window.location.pathname}${window.location.hash || ""}`;
          window.history.replaceState({}, "", cleanUrl);
        } catch {}
        return fromUrl.toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g, "").slice(0, 6) || null;
      }
      const stored = localStorage.getItem("biq_pending_join");
      if (stored) return stored.toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g, "").slice(0, 6) || null;
    } catch {}
    return null;
  });
  const clearPendingJoin = useCallback(() => {
    setPendingJoinCode(null);
    try { localStorage.removeItem("biq_pending_join"); } catch {}
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
  const [stats, setStats] = useState(() => {
    try {
      const raw = localStorage.getItem("biq_stats");
      if (raw) { const p = JSON.parse(raw); if (p && typeof p === "object") return p; }
    } catch {}
    return { gamesPlayed: 0, bestScore: 0, bestStreak: 0 };
  });
  const [settings, setSettings] = useState(() => {
    const defaults = { hints:true, timer:true, theme:"dark", sound:false };
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
  const [showBallIQIntro, setShowBallIQIntro] = useState(false);
  const [showFirstQuizTip, setShowFirstQuizTip] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [iqRecap, setIqRecap] = useState(null); // { iq, date } or null
  const [ratePromptShown, setRatePromptShown] = useState(false);
  const [xp, setXp] = useState(() => {
    try {
      const raw = localStorage.getItem("biq_xp");
      if (raw) { const n = parseInt(raw, 10); if (!Number.isNaN(n)) return n; }
    } catch {}
    return 0;
  });
  const [xpToast, setXpToast] = useState(null);
  const xpToastTimerRef = useRef(null);
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
  // Rotating product-voice tagline shown under the greeting on home.
  // Initializer runs once per AppInner mount → stable for the session.
  const [homeTagline] = useState(() => {
    const taglines = [
      "How well do you know the game?",
      "Today's challenge awaits.",
      "Pick your battle.",
      "Think you know your stuff?",
      "The pitch is calling.",
    ];
    return taglines[Math.floor(Math.random() * taglines.length)];
  });
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
  // Single cleanup on unmount: clear any in-flight toast/overlay timers so
  // tabbing away mid-toast doesn't leave dangling setState callbacks.
  useEffect(() => () => {
    if (xpToastTimerRef.current) clearTimeout(xpToastTimerRef.current);
    if (levelUpTimerRef.current) clearTimeout(levelUpTimerRef.current);
    if (streakToastTimerRef.current) clearTimeout(streakToastTimerRef.current);
  }, []);
  const [toast, setToast] = useState(null);

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
    }, 60_000);
    return () => clearInterval(id);
  }, []);


  const setProfile = useCallback((updater) => {
    setProfileState(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      window.storage?.set("biq_profile", JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const todayKey = useMemo(() => keyForDate(new Date()), []);
  const [dailyHistory, setDailyHistory] = useState({});
  const [activeDailyDate, setActiveDailyDate] = useState(null);
  const [activeClub, setActiveClub] = useState(null);

  const toastTimerRef = useRef(null);
  const showToast = useCallback((msg, duration = 2800) => {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, duration);
  }, []);

  // Multi-player local state
  const [localConfig, setLocalConfig] = useState(null); // { players, mode, diff } set by LocalSetup
  const [localResult, setLocalResult] = useState(null); // populated by LocalGameScreen onComplete

  useEffect(() => {
    // Prune expired seen-question history (>14 days old) on mount
    try { loadSeenHistory(); } catch {}
    // Check if first-time user — show onboarding if not seen before
    window.storage?.get("biq_onboarded").then(r => {
      if (!r) setHasOnboarded(false);
    }).catch(() => setHasOnboarded(false));

    window.storage?.get("biq_stats").then(res => {
      if (res) { try { setStats(JSON.parse(res.value)); } catch {} }
    }).catch(() => {});
    window.storage?.get(todayKey).then(res => {
      if (res) { try { const d = JSON.parse(res.value); setDailyDone(true); setDailyScore(d.score); } catch {} }
    }).catch(() => {});
    // Load full daily history — any biq_daily_YYYY-MM-DD entry
    (async () => {
      try {
        const listRes = await window.storage?.list("biq_daily_");
        const keys = listRes?.keys || [];
        const hist = {};
        for (const k of keys) {
          const m = k.match(/^biq_daily_(\d{4}-\d{2}-\d{2})$/);
          if (!m) continue;
          try {
            const r = await window.storage?.get(k);
            if (!r) continue;
            const parsed = JSON.parse(r.value);
            if (typeof parsed?.score === "number") hist[m[1]] = parsed.score;
          } catch {}
        }
        setDailyHistory(hist);
      } catch {}
    })();
    window.storage?.get("biq_profile").then(r => { if(r) { try { setProfileState(JSON.parse(r.value)); } catch {} } }).catch(()=>{});
    window.storage?.get("biq_iq_history").then(res => {
      if (res) { try { setIqHistory(JSON.parse(res.value)); } catch {} }
    }).catch(() => {});
    window.storage?.get("biq_xp").then(res => {
      if (res) { try { setXp(parseInt(res.value) || 0); } catch {} }
    }).catch(() => {});
    window.storage?.get("biq_hotstreak_best").then(res => {
      if (res) { try { setHotstreakBest(parseInt(res.value) || 0); } catch {} }
    }).catch(() => {});
    window.storage?.get("biq_first_tip_shown").then(res => {
      if (!res) setShowFirstQuizTip(true);
    }).catch(() => {});
    window.storage?.get("biq_rate_shown").then(res => {
      if (res) setRatePromptShown(true);
    }).catch(() => {});
    // Login streak — check if we played yesterday, update streak. Also tracks
    // `best` (all-time best login streak) in the same storage object.
    (async () => {
      try {
        const todayNum = Math.floor(Date.now() / TIMINGS.DAY_MS);
        const res = await window.storage?.get("biq_login_streak");
        const data = res ? JSON.parse(res.value) : { streak: 0, lastDay: 0, best: 0 };
        const prevBest = typeof data.best === "number" ? data.best : (data.streak || 0);
        let newStreak = data.streak;
        if (data.lastDay === todayNum) {
          // Already counted today
          newStreak = data.streak;
        } else if (data.lastDay === todayNum - 1) {
          // Consecutive day — increment
          newStreak = data.streak + 1;
          if (newStreak > 1) {
            if (streakToastTimerRef.current) clearTimeout(streakToastTimerRef.current);
            setStreakToast(newStreak);
            haptic("heavy");
            playSound("streak");
            streakToastTimerRef.current = setTimeout(() => setStreakToast(null), TIMINGS.STREAK_TOAST);
          }
        } else if (data.lastDay < todayNum - 1) {
          // Streak broken
          newStreak = 1;
        } else {
          // First time ever
          newStreak = 1;
        }
        const newBest = Math.max(prevBest, newStreak);
        await window.storage?.set(
          "biq_login_streak",
          JSON.stringify({ streak: newStreak, lastDay: todayNum, best: newBest })
        );
        setLoginStreak(newStreak);
        setBestLoginStreak(newBest);
      } catch {}
    })();
    // Load persisted settings
    window.storage?.get("biq_settings").then(res => {
      if (res) { try {
        const s = JSON.parse(res.value);
        setSettings(s);
        if (s.defaultDiff) setDiff(s.defaultDiff === "med" ? "medium" : s.defaultDiff);
      } catch {} }
    }).catch(() => {});
  }, []);

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
    const updated = {
      gamesPlayed: stats.gamesPlayed + 1,
      gamesThisWeek,
      gamesLastWeek,
      weekEpoch: currentWeekEpoch,
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
    window.storage?.set("biq_stats", JSON.stringify(updated)).catch(() => {});

    // Save individual score to Supabase if user is logged in
    if (user?.id && newResult.score !== undefined) {
      supabase.from('scores').insert({
        user_id: user.id,
        game_mode: mode || 'classic',
        score: newResult.score,
        correct_answers: newResult.score,
        total_questions: newResult.total || 10,
      }).then(({ error }) => {
        if (error) {
          console.error("[score save]", error?.message || "Unknown error");
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
            },
          }).eq('id', user.id);
          if (updErr) {
            console.error("[profile sync]", updErr?.message || "Unknown error");
            syncFailed = true;
          }
        } catch (e) {
          console.error("[profile sync]", e?.message || "Unknown error");
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
  }, [mode, stats, user, showToast]);

  const today = new Date().toLocaleDateString("en-GB", { weekday:"long", day:"numeric", month:"short" });

  const startMode = useCallback((m) => {
    try {
      haptic("soft");
      // Club quiz bypasses startMode entirely (it sets activeClub + setMode directly).
      // Any mode reaching this function should clear it so a stale crest banner
      // doesn't appear on the next quiz. Same for League — `launchLeagueInMode`
      // sets leagueMode and never re-enters startMode, so any stale value here
      // would leak the league header onto the next mode the user picks.
      setActiveClub(null);
      setLeagueMode(null);
      // Dismiss first-quiz tip when user starts a game
      if (showFirstQuizTip && m === "classic") {
        setShowFirstQuizTip(false);
        try { window.storage?.set("biq_first_tip_shown", "1"); } catch {}
      }

      // "balliq_confirmed" is only used as a transient signal from the
      // intro modal — store it as plain "balliq" so every downstream check
      // (results routing, history save, share card, best-IQ toast) works.
      // Online 1v1 requires a real account — guests have no userId to host
      // or join rooms. Block before any state transition so the home screen
      // doesn't briefly flash and the OnlineGame component never mounts.
      if (m === "online" && (!user || isGuest)) {
        showToast("🔐 Sign in to play Online 1v1");
        return;
      }
      setMode(m === "balliq_confirmed" ? "balliq" : m);
      if (m === "online") { setScreen("online"); return; }
      if (m === "social") { setScreen("social"); return; }
      if (m === "local") { setScreen("local-setup"); return; }
      if (m === "clubquiz") { setScreen("club-quiz"); return; }
      // Reset category for special modes that ignore it
      if (m === "balliq" || m === "daily" || m === "survival" || m === "legends" || m === "speed" || m === "hotstreak" || m === "wc2026" || m === "truefalse" || m === "chaos") setCat("All");
      if (m === "daily" && dailyDone) {
        showToast(`📅 Already done today — ${dailyScore}/7, come back tomorrow`);
        return;
      }
      let qs = [];
      if (m === "balliq") { setShowBallIQIntro(true); return; }
      if (m === "balliq_confirmed") { qs = getBallIQQuestions(); }
      else if (m === "daily") { qs = getDailyQs(); setActiveDailyDate(new Date()); }
      else if (m === "survival") { qs = getQs({ cat: "All", diff, n: 300 }); }
      else if (m === "legends") { qs = getQs({ cat: "Legends", diff, n: 10 }); }
      else if (m === "speed") { qs = getQs({ cat: "All", diff: "medium", n: 5 }); }
      else if (m === "hotstreak") { qs = (getQs({ cat: "All", diff, n: 999 }) || []).filter(q => q.type !== "tf"); }
      else if (m === "wc2026") {
        if (QB_WC2026.length < 5) {
          showToast("Not enough questions available for this mode");
          return;
        }
        const fresh = applySeenFilter(QB_WC2026, 15, qbHistKey);
        qs = seededShuffle([...fresh], Date.now()).slice(0, 15).map(q => ({ ...q, _histKey: qbHistKey(q) }));
      }
      else if (m === "truefalse") { qs = getTrueFalseQs(); }
      else if (m === "chaos") {
        // Chaos: quotes / moments / madness. Pull any QB row tagged chaos
        // (cat === "chaos" OR tag === "chaos"), ignore difficulty, shuffle 10.
        if (QB_CHAOS.length < 5) {
          showToast("Not enough questions available for this mode");
          return;
        }
        const fresh = applySeenFilter(QB_CHAOS, 10, qbHistKey);
        qs = shuffle([...fresh]).slice(0, 10).map(q => ({ ...q, _histKey: qbHistKey(q) }));
      }
      else { qs = getQs({ cat, diff, n: 10, ramp: true }); }
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
    }
  }, [user, isGuest, showFirstQuizTip, dailyDone, dailyScore, diff, cat, showToast]);

  // When a shared invite link is opened (?join=CODE), once auth resolves and
  // the user is signed in (not guest), route them straight into Online 1v1.
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
  }, [pendingJoinCode, user, isGuest, startMode]);

  // LocalSetup gives us a fully-formed config — LocalGameScreen owns the rest
  // (questions, turns, scores, eliminations). No legacy state touched here.
  const startLocalGame = useCallback((config) => {
    setActiveClub(null);
    setLocalConfig(config);
    setLocalResult(null);
    setMode("local");
    setScreen("local-game");
  }, []);

  const handleLocalComplete = useCallback((result) => {
    setLocalResult(result);
    setScreen("local-results");
  }, []);

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
      setTimeout(() => { showToast("🔥 7-day streak — you're building a habit"); haptic("heavy"); playSound("streak"); }, 1200);
      setStats(p => ({...p, streak7Celebrated: true}));
    } else if (loginStreak === 30 && !stats.streak30Celebrated) {
      setTimeout(() => { showToast("🏆 30-day streak — incredible dedication"); haptic("heavy"); playSound("streak"); }, 1200);
      setStats(p => ({...p, streak30Celebrated: true}));
    } else if (loginStreak === 100 && !stats.streak100Celebrated) {
      setTimeout(() => { showToast("💎 100-day streak — you are a legend"); haptic("heavy"); playSound("streak"); }, 1200);
      setStats(p => ({...p, streak100Celebrated: true}));
    }

    // 🎉 PERFECT SCORE celebration
    if (res.score === res.total && res.total >= 5 && mode !== "survival") {
      setTimeout(() => showToast("🎉 Perfect — every question right"), 800);
      try { navigator.vibrate?.([60, 40, 60, 40, 60]); } catch {}
    }

    // 🏅 PERSONAL BEST celebration — only for standard quiz modes (not daily/balliq)
    if (mode === "classic" && res.score && res.total === 10 && res.score > (stats.bestScore || 0)) {
      const isFirst = !stats.bestScore;
      setTimeout(() => showToast(isFirst ? `🎯 First score: ${res.score}/10!` : `🎯 New personal best: ${res.score}/10!`), 1400);
      try { navigator.vibrate?.([40, 50, 40]); } catch {}
    }

    // 🔥 HOT STREAK personal best
    if (mode === "hotstreak" && res.score > (stats.bestHotStreak || 0) && res.score >= 5) {
      const isFirst = !stats.bestHotStreak;
      setTimeout(() => showToast(isFirst ? `⚡ Hot Streak record: ${res.score}!` : `⚡ New Hot Streak best: ${res.score}!`), 1400);
      try { navigator.vibrate?.([40, 50, 40]); } catch {}
    }

    // 🔄 COMEBACK celebration — got Q1 wrong, then nailed the rest
    if (mode === "classic" && res.wrongAnswers && res.wrongAnswers.length === 1 && res.score >= 8) {
      setTimeout(() => showToast("🔄 Great comeback — only missed one after a slow start"), 1600);
    }

    // 🎖️ CATEGORY MASTERY — 10+ correct in a row from same category
    if (mode === "hotstreak" && res.score >= 10 && cat && cat !== "All") {
      setTimeout(() => showToast(`🎖️ ${cat} mastery — ${res.score} in a row`), 1600);
    }

    // 🏆 BALL IQ new high
    if (mode === "balliq" && res.iq && res.iq > (stats.bestIQ || 0)) {
      const isFirst = !stats.bestIQ;
      setTimeout(() => showToast(isFirst ? `🧠 Your ${APP_NAME}: ${res.iq}!` : `🧠 New ${APP_NAME} high: ${res.iq}!`), TIMINGS.ANSWER_REVEAL);
      try { navigator.vibrate?.([40, 50, 40]); } catch {}
    }

    // 💪 SURVIVAL new best (wrong answers = 0 means they only died on one)
    if (mode === "survival" && res.score && res.score > (stats.bestSurvival || 0) && res.score >= 10) {
      setTimeout(() => showToast(`💪 New Survival record — ${res.score} questions`), 1400);
      setStats(p => ({...p, bestSurvival: res.score}));
    }

    // Rate prompt — show once after 5+ games with a good score
    const shouldShowRate = !ratePromptShown
      && stats.gamesPlayed >= 4
      && res.score >= 7
      && mode === "classic";
    if (shouldShowRate) {
      setRatePromptShown(true);
      window.storage?.set("biq_rate_shown", "1").catch(() => {});
      setTimeout(() => setShowRatePrompt(true), 1800);
    }

    // Award XP
    const earned = getXPForResult(res.score, res.total, mode === "speed" ? "classic" : mode);
    if (earned > 0) {
      setXp(prev => {
        const oldInfo = getLevelInfo(prev);
        const newXp = prev + earned;
        const newInfo = getLevelInfo(newXp);
        window.storage?.set("biq_xp", String(newXp)).catch(() => {});
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
            if (error) console.error("[xp sync]", error?.message || "Unknown error");
          });
      }
    }

    // Save BallIQ history (last 7 scores) + best IQ in stats
    if (mode === "balliq") {
      const iq = calcBallIQ(res.score, res.total);
      window.storage?.get("biq_profile").then(r => { if(r) { try { setProfileState(JSON.parse(r.value)); } catch {} } }).catch(()=>{});
    window.storage?.get("biq_iq_history").then(r => {
        const hist = (() => { try { return r ? JSON.parse(r.value) : []; } catch { return []; } })();
        const updated = [...hist, { iq, date: Date.now() }].slice(-7);
        window.storage?.set("biq_iq_history", JSON.stringify(updated)).catch(() => {});
      }).catch(() => {});
      setStats(prev => {
        const updated = { ...prev, bestIQ: Math.max(prev.bestIQ || 0, iq) };
        window.storage?.set("biq_stats", JSON.stringify(updated)).catch(() => {});
        return updated;
      });
    }

    // Save daily completion (today or a past "catch-up" day)
    if (mode === "daily") {
      const targetDate = activeDailyDate || new Date();
      const targetYMD = dateToYMD(targetDate);
      const key = keyForDate(targetDate);
      window.storage?.set(key, JSON.stringify({ score: res.score })).catch(() => {});
      setDailyHistory(prev => ({ ...prev, [targetYMD]: res.score }));
      const todayYMD = dateToYMD(new Date());
      if (targetYMD === todayYMD) {
        setDailyDone(true);
        setDailyScore(res.score);
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
        window.storage?.set("biq_hotstreak_best", String(res.score)).catch(() => {});
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
  }, [mode, stats, loginStreak, cat, ratePromptShown, todayKey, hotstreakBest, saveStats, showToast, activeDailyDate, questions]);

  const updateSettings = useCallback((patch) => {
    setSettings(prev => {
      const updated = { ...prev, ...patch };
      window.storage?.set("biq_settings", JSON.stringify(updated)).catch(() => {});
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
    const url = "balliq.app";
    const msgs = {
      daily: (() => {
        const dots = Array.from({length: total}, (_, i) => i < score ? '🟢' : '🔴').join('');
        return `⚽ ${APP_NAME} — Daily Challenge\n${dots}\n${score}/${total} correct · ${pct}% accuracy\n${beat}\n${url}`;
      })(),
      balliq: (() => {
        const iq = calcBallIQ(score, total);
        const label = iqLabel(iq);
        const pctileLbl = iqPercentileLabel(iq);
        return `🧠 ${APP_NAME} Test\nMy ${APP_NAME}: ${iq} — ${pctileLbl}\n${label}\n${score}/${total} correct · ${pct}% accuracy\n${beat}\n${url}`;
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
      wc2026:    `🌍 ${APP_NAME} — World Cup 2026\n${score}/${total} correct · ${pct}% accuracy\n${beat}\n${url}`,
      local:     `🤝 ${APP_NAME} — Local Multiplayer\nFinal scores in — settle it on the rematch.\n${beat}\n${url}`,
      chaos:     `🎭 ${APP_NAME} — Chaos\n${score}/${total} correct · ${pct}% accuracy\n${beat}\n${url}`,
    };
    const text = msgs[mode] || msgs.classic;

    // Pick the right card variant + payload for shareCard.
    const MODE_LABELS = {
      classic: "Classic Quiz",
      daily: "Daily Challenge",
      survival: "Survival",
      hotstreak: "Hot Streak",
      truefalse: "True or False",
      balliq: `${APP_NAME} Test`,
      speed: "Speed Round",
      legends: "Legends & History",
      wc2026: "World Cup 2026",
      local: "Local Multiplayer",
      chaos: "Chaos Quiz",
    };
    let cardType = "standard";
    let cardData;
    if (mode === "balliq") {
      const iq = calcBallIQ(score, total);
      cardType = "balliq";
      cardData = { iq, label: iqLabel(iq), pctileLbl: iqPercentileLabel(iq) };
    } else if (mode === "hotstreak") {
      cardType = "hotstreak";
      cardData = { score };
    } else {
      cardData = {
        modeLabel: MODE_LABELS[mode] || "Quiz",
        score,
        total,
        streak: extras?.streak,
      };
    }
    await shareCard(cardType, cardData, { onToast: showToast, textFallback: text });
  }, [showToast]);

  const shareProfile = useCallback(() => {
    const { level } = getLevelInfo(xp);
    const iq = stats.bestIQ;
    const lines = [
      (profile.avatar||"⚽") + " " + (profile.name||`${APP_NAME} Player`),
      level.icon + " " + level.name + " — " + xp + " XP",
      iq ? APP_NAME + ": " + iq + " — " + iqPercentileLabel(iq) : null,
      "Games: " + (stats.gamesPlayed||0) + " — Streak: " + loginStreak + " days",
      "#BallIQ"
    ].filter(Boolean).join("\n");
    if (navigator.share) navigator.share({ text: lines }).catch(()=>{});
    else navigator.clipboard?.writeText(lines).then(()=>showToast("📋 Profile copied")).catch(()=>{});
  }, [xp, stats, profile, loginStreak]);

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

  // Full local-stats reset. Wipes every stats-related localStorage key and
  // resets the matching React state so the UI reflects a clean slate without
  // requiring a reload. Preserved keys: biq_settings, biq_profile,
  // biq_seen_history_v2, biq_onboarded, and the various UI flags
  // (biq_first_tip_shown, biq_rate_shown, biq_pending_join, biq-splash) —
  // those aren't stats and resetting them would replay onboarding/UI hints.
  const clearStats = useCallback(() => {
    const reset = { gamesPlayed: 0, bestScore: 0, bestStreak: 0 };
    setStats(reset);
    setDailyDone(false); setDailyScore(null);
    setDailyHistory({});
    setXp(0);
    setLoginStreak(0);
    setBestLoginStreak(0);
    setIqHistory([]);
    setHotstreakBest(0);
    (async () => {
      try {
        // Single-key wipes — write the empty stats object, delete everything else.
        await Promise.all([
          window.storage?.set("biq_stats", JSON.stringify(reset)),
          window.storage?.delete("biq_xp"),
          window.storage?.delete("biq_login_streak"),
          window.storage?.delete("biq_iq_history"),
          window.storage?.delete("biq_hotstreak_best"),
          window.storage?.delete("biq_skill_level"),
        ].map(p => Promise.resolve(p).catch(() => {})));
        // Prefix wipes — daily completions and wordle state.
        const listRes = await window.storage?.list();
        const keys = listRes?.keys || [];
        for (const k of keys) {
          if (/^biq_daily_\d{4}-\d{2}-\d{2}$/.test(k) || /^biq_wordle_/.test(k)) {
            await window.storage?.delete(k).catch(() => {});
          }
        }
      } catch {}
    })();
    showToast("✓ Stats cleared");
  }, [showToast]);

  // Apply theme and font size to document root
  useEffect(() => {
    const body = document.body;
    const root = document.documentElement;
    // Theme — apply .light to both html and body so edge surfaces (html, #root)
    // can also resolve var(--bg) to the light palette.
    if (settings.theme === "light") {
      body.classList.add("light");
      root.classList.add("light");
    } else {
      body.classList.remove("light");
      root.classList.remove("light");
    }
  }, [settings.theme]);

  const inGame = ["quiz","local-game","local-results"].includes(screen);

  // Belt-and-braces: strip any chaos-tagged item before the TrueFalseEngine
  // sees the questions list. Both upstream selection paths (getTrueFalseQs +
  // launchLeagueInMode's T/F branch) already filter chaos, but any future code
  // path that sets `questions` directly would bypass those filters. Memoized so
  // the engine's questions prop keeps a stable reference across AppInner renders.
  const trueFalseQuestions = useMemo(
    () => (mode === "truefalse" && Array.isArray(questions))
      ? questions.filter(q => q && q.cat !== "chaos")
      : questions,
    [mode, questions]
  );

  const levelInfo = useMemo(() => getLevelInfo(xp), [xp]);
  const earnedBadges = useMemo(() => computeBadges(stats, xp, loginStreak), [stats, xp, loginStreak]);

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
    setLeagueMode(null);
  }, []);
  const challengeFriend = useCallback((friend) => {
    // No native invite flow yet — drop the challenger into the online lobby
    // with a toast hinting at the friend's name so they can share the code.
    showToast(friend ? `Share your room code with ${friend.username}` : "Online lobby");
    startMode("online");
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
  const openPrivacy = useCallback(() => setShowPrivacy(true), []);
  const closePrivacy = useCallback(() => setShowPrivacy(false), []);
  const openHelp = useCallback(() => setShowHelp(true), []);
  const closeHelp = useCallback(() => setShowHelp(false), []);
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
  const useShield = useCallback(() => {
    setStats(p => ({...p, shieldsUsed:(p.shieldsUsed||0)+1}));
    showToast("🛡️ Streak shield activated — your streak is safe today");
  }, [showToast]);
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
    const text = [
      `⚽ ${APP_NAME} Daily Challenge`,
      `📅 ${dateStr}`,
      `🎯 ${score}/${total}`,
      streakLine,
      "",
      grid,
      "",
      "Think you can beat me?",
      "balliq.app",
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
  }, [dailyScore, loginStreak, showToast]);
  const shieldActive = useMemo(() => Math.floor(xp/200) > (stats.shieldsUsed||0), [xp, stats.shieldsUsed]);

  const [showDiffPicker, setShowDiffPicker] = useState(false);
  const [showLeaguePicker, setShowLeaguePicker] = useState(false);
  const [showFriendsPicker, setShowFriendsPicker] = useState(false);
  const [leagueMode, setLeagueMode] = useState(null); // { id, name } once a league is picked; null otherwise

  const pickLeague = useCallback((leagueId, leagueName) => {
    haptic("soft");
    setShowLeaguePicker(false);
    setLeagueMode({ id: leagueId, name: leagueName });
  }, []);

  const backToLeagues = useCallback(() => {
    haptic("soft");
    setLeagueMode(null);
    setShowLeaguePicker(true);
  }, []);

  const launchLeagueInMode = useCallback((modeId) => {
    if (!leagueMode) return;
    const leagueId = leagueMode.id;
    haptic("soft");
    setLeagueMode(null);
    setActiveClub(null);
    setCat(leagueId);

    let qs = [];
    if (modeId === "classic") {
      setDiff("medium");
      qs = getQs({ cat: leagueId, diff: "medium", n: 10, ramp: false }) || [];
    } else if (modeId === "survival") {
      qs = getQs({ cat: leagueId, diff: "medium", n: 300 }) || [];
    } else if (modeId === "hotstreak") {
      qs = (getQs({ cat: leagueId, diff: "medium", n: 999 }) || []).filter(q => q.type !== "tf");
    } else if (modeId === "truefalse") {
      // Keyword-match league-specific T/F; fall back to the general pool if too few.
      // Chaos-tagged statements are excluded — they don't suit the T/F format.
      const keywords = LEAGUE_TF_KEYWORDS[leagueId] || [];
      const indexed = TF_STATEMENTS
        .map((s, i) => ({ ...s, _tfIdx: i }))
        .filter(s => s.cat !== "chaos");
      const leagueTF = keywords.length
        ? indexed.filter(s => keywords.some(kw => s.s.toLowerCase().includes(kw)))
        : [];
      if (leagueTF.length >= 10) {
        qs = shuffle(leagueTF).slice(0, 20).map(s => ({ ...s, _histKey: `tf:${s.id}` }));
      } else {
        qs = getTrueFalseQs();
      }
    }

    qs = (qs || []).filter(item => item && typeof item === "object" && (item.q || item.s));
    if (qs.length === 0) { showToast("Not enough questions for this league yet"); return; }

    setMode(modeId);
    setQuestions(qs);
    setScreen("quiz");
  }, [leagueMode, showToast]);

  const startClassicWithDiff = useCallback((d) => {
    // Build a Classic game with the explicitly-chosen difficulty — don't rely
    // on the async setDiff → startMode closure, build the questions inline.
    setShowDiffPicker(false);
    haptic("soft");
    setDiff(d);
    setActiveClub(null);
    const qs = getQs({ cat: "All", diff: d, n: 10, ramp: true });
    if (!qs || qs.length === 0) { showToast("No questions — try another difficulty"); return; }
    setMode("classic");
    setCat("All");
    setQuestions(qs);
    setScreen("quiz");
  }, [showToast]);

  const playDailyForDate = useCallback((date) => {
    const qs = getDailyQsForDate(date);
    if (!qs || qs.length === 0) { showToast("No questions available for that day"); return; }
    haptic("soft");
    setActiveDailyDate(date);
    setMode("daily");
    setCat("All");
    setQuestions(qs);
    setScreen("quiz");
  }, [showToast]);

  const viewDailyScore = useCallback((date, score) => {
    const label = date.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
    showToast(`🏅 ${label} — you scored ${score}/7`);
  }, [showToast]);

  return (
    <>
      <style>{css}</style>
      <div className={`app${settings.theme === "light" ? " light" : ""}`}>
        <div className="sbar" />

        {/* ── ONBOARDING — shown to first-time users only ── */}
        {!hasOnboarded && (
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

        {hasOnboarded && <>
        {!inGame && (
          <DesktopNav
            tab={tab}
            setTab={setTab}
            setScreen={setScreen}
            dailyDone={dailyDone}
            showToast={showToast}
          />
        )}
        {!inGame && (
          <div className="hdr">
            {/* Settings already has its own page-header (← Settings) so the
                global wordmark would just stack a second identifier on top.
                Hide it on that one screen; every other screen still keeps
                the brand mark. */}
            {screen !== "settings" && <div className="logo">Ball <em>IQ</em></div>}
            {screen === "home" && (
              <div className="hdr-actions">
                <button className="icon-btn" aria-label="Settings" onClick={() => setScreen("settings")}>⚙️</button>
              </div>
            )}
          </div>
        )}

        {/* Global toasts */}
        {toast && <div className="toast">{toast}</div>}

        {/* First quiz tip */}
        {showFirstQuizTip && !inGame && screen === "home" && (
          <div style={{position:"fixed",bottom:80,left:16,right:16,zIndex:996,pointerEvents:"none"}}>
            <div style={{background:"var(--accent)",color:"#0a1a00",borderRadius:14,padding:"14px 18px",boxShadow:"0 6px 24px rgba(34,197,94,0.3)",pointerEvents:"auto",display:"flex",alignItems:"center",gap:12}}>
              <div style={{fontSize:28,lineHeight:1}}>⚽</div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:800,marginBottom:2}}>Welcome to {APP_NAME}!</div>
                <div style={{fontSize:12,fontWeight:500,opacity:0.85}}>Tap "Play" to start your first quiz. New questions daily!</div>
              </div>
              <button onClick={() => { setShowFirstQuizTip(false); window.storage?.set("biq_first_tip_shown","1").catch(()=>{}); }} style={{background:"rgba(0,0,0,0.2)",border:"none",borderRadius:22,minWidth:44,minHeight:44,width:44,height:44,fontSize:16,fontWeight:800,color:"#fff",cursor:"pointer",flexShrink:0}} aria-label="Dismiss tip">×</button>
            </div>
          </div>
        )}
        {/* APP_NAME Intro */}
        {showBallIQIntro && (
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",zIndex:997,display:"flex",alignItems:"flex-end"}} onClick={() => setShowBallIQIntro(false)}>
            <div style={{width:"100%",background:"var(--bg)",borderRadius:"20px 20px 0 0",padding:"28px 24px calc(48px + env(safe-area-inset-bottom, 34px))",textAlign:"center"}} onClick={e => e.stopPropagation()}>
              <div style={{fontSize:48,marginBottom:12}}>🧠</div>
              <div style={{fontSize:22,fontWeight:900,marginBottom:8,color:"var(--t1)"}}>{APP_NAME} Test</div>
              <div style={{display:"flex",justifyContent:"center",gap:12,marginBottom:20,flexWrap:"wrap"}}>
                {[["📋","20 questions"],["⏱️","No timer"],["🎯","MCQ only"],["📊","Get your IQ"]].map(([icon,label]) => (
                  <div key={label} style={{background:"var(--s2)",border:"1px solid var(--border)",borderRadius:10,padding:"8px 12px",fontSize:12,fontWeight:600,color:"var(--t2)",display:"flex",alignItems:"center",gap:4}}>
                    <span>{icon}</span><span>{label}</span>
                  </div>
                ))}
              </div>
              <div style={{fontSize:13,color:"var(--t2)",lineHeight:1.7,marginBottom:24}}>Answer 20 questions across all categories. Your score determines your {APP_NAME} — from 62 (beginner) to 145 (elite). The test is the same for everyone so scores are comparable.</div>
              <button className="btn btn-p" onClick={() => { setShowBallIQIntro(false); startMode("balliq_confirmed"); }}>Start Test 🧠</button>
              <button className="btn btn-s" style={{marginTop:8}} onClick={() => setShowBallIQIntro(false)}>Maybe later</button>
            </div>
          </div>
        )}
        {/* Rate prompt */}
        {showRatePrompt && (
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:998,display:"flex",alignItems:"flex-end",animation:"fadeIn 0.3s ease"}} onClick={() => setShowRatePrompt(false)}>
            <div style={{width:"100%",background:"var(--bg)",borderRadius:"20px 20px 0 0",padding:"28px 24px calc(48px + env(safe-area-inset-bottom, 34px))",textAlign:"center"}} onClick={e => e.stopPropagation()}>
              <div style={{fontSize:48,marginBottom:12}}>⭐</div>
              <div style={{fontSize:20,fontWeight:900,marginBottom:8,color:"var(--t1)"}}>Enjoying {APP_NAME}?</div>
              <div style={{fontSize:14,color:"var(--t2)",lineHeight:1.7,marginBottom:24}}>A quick rating helps other football fans find the app — and takes just 5 seconds!</div>
              <button className="btn btn-p" style={{marginBottom:10}} onClick={() => {
                setShowRatePrompt(false);
                const ua = navigator.userAgent || "";
                if (/iPhone|iPad|iPod|Macintosh/i.test(ua)) {
                  window.open("https://apps.apple.com/app/ball-iq", "_blank");
                } else if (/Android/i.test(ua)) {
                  window.open("https://play.google.com/store/apps/details?id=com.balliq.app", "_blank");
                } else {
                  showToast(`⭐ Search '${APP_NAME}' on the App Store or Google Play`);
                }
              }}>Rate {APP_NAME} ⭐</button>
              <button className="btn btn-s" onClick={() => setShowRatePrompt(false)}>Maybe later</button>
            </div>
          </div>
        )}
        {xpToast && (
          <div className="xp-toast" style={xpToast.leveledUp ? {background:"var(--gold)",color:"#0a0a00",padding:"12px 24px",fontSize:14} : {}}>
            {xpToast.leveledUp
              ? <><span className="xp-t-icon">{xpToast.icon}</span><span>Level Up! <strong>{xpToast.levelName}</strong></span></>
              : <><span className="xp-t-icon">⚡</span><span>+{xpToast.earned} XP</span></>}
          </div>
        )}

        {howToPlay && (
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:998,display:"flex",alignItems:"flex-end",animation:"fadeIn 0.2s ease"}} onClick={() => setHowToPlay(null)}>
            <div style={{width:"100%",background:"var(--bg)",borderRadius:"20px 20px 0 0",padding:"24px 20px calc(40px + env(safe-area-inset-bottom, 34px))",animation:"slideUp 0.3s cubic-bezier(0.22,1,0.36,1)"}} onClick={e => e.stopPropagation()}>
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

        {levelUpOverlay && (
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:999,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",animation:"fadeIn 0.3s ease"}}>
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
        {streakToast && <div className="streak-toast"><span>🔥</span><span><strong>{streakToast} day streak!</strong> Keep it up</span></div>}

        {/* ── CLASSIC DIFFICULTY SHEET ── */}
        {showDiffPicker && (
          <div className="diff-overlay" onClick={() => setShowDiffPicker(false)}>
            <div className="diff-sheet" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
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

        {/* ── LEAGUE QUIZ SHEET (step 1: pick a league) ── */}
        {showLeaguePicker && (
          <div className="diff-overlay" onClick={() => setShowLeaguePicker(false)}>
            <div className="diff-sheet" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
              <div className="diff-sheet-title">Pick a League</div>
              <div className="diff-sheet-sub">Choose a competition, then a game mode</div>
              <div className="diff-options">
                {[
                  { id:"PL",         icon:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", name:"Premier League",   desc:"England's top flight" },
                  { id:"LaLiga",     icon:"🇪🇸", name:"La Liga",          desc:"Spanish football's finest" },
                  { id:"Bundesliga", icon:"🇩🇪", name:"Bundesliga",       desc:"German powerhouses" },
                  { id:"SerieA",     icon:"🇮🇹", name:"Serie A",          desc:"Italian tactical masters" },
                  { id:"Ligue1",     icon:"🇫🇷", name:"Ligue 1",          desc:"Coming soon", comingSoon:true },
                  { id:"UCL",        icon:"🏆", name:"Champions League", desc:"Europe's elite" },
                ].map(opt => (
                  <button
                    key={opt.id}
                    // We render this as a regular (non-disabled) button when
                    // comingSoon is true so the onClick still fires and the
                    // user gets a toast. The .coming-soon CSS keeps the
                    // visual "disabled" treatment (opacity + not-allowed).
                    className={`diff-option${opt.comingSoon ? " coming-soon" : ""}`}
                    aria-disabled={opt.comingSoon || undefined}
                    onClick={() => opt.comingSoon
                      ? showToast(`${opt.icon} ${opt.name} is coming soon — stay tuned`)
                      : pickLeague(opt.id, opt.name)}
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

        {/* ── LEAGUE QUIZ SHEET (step 2: pick a mode) ── */}
        {leagueMode && (
          <div className="diff-overlay" onClick={() => setLeagueMode(null)}>
            <div className="diff-sheet" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
              <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:4}}>
                <button
                  type="button"
                  className="back-btn"
                  onClick={backToLeagues}
                  aria-label="Back to league picker"
                >←</button>
                <div className="diff-sheet-title" style={{margin:0}}>{leagueMode.name} — Choose mode</div>
              </div>
              <div className="diff-sheet-sub">How do you want to play?</div>
              <div className="diff-options">
                {[
                  { id:"classic",   icon:"⏱️",  name:"Classic",      desc:"10 questions, 20 seconds each" },
                  { id:"survival",  icon:"🔥",  name:"Survival",     desc:"One wrong and it's over" },
                  { id:"hotstreak", icon:"⚡🔥", name:"Hot Streak",   desc:"60-second sprint" },
                  { id:"truefalse", icon:"✅",  name:"True or False", desc:"Coming soon", comingSoon:true },
                ].map(opt => (
                  <button
                    key={opt.id}
                    // Same pattern as the league picker: keep onClick wired
                    // when comingSoon so the user gets a toast. The
                    // .coming-soon CSS handles the visual disabled state.
                    className={`diff-option${opt.comingSoon ? " coming-soon" : ""}`}
                    aria-disabled={opt.comingSoon || undefined}
                    onClick={() => opt.comingSoon
                      ? showToast(`${opt.icon} ${opt.name} is coming soon — stay tuned`)
                      : launchLeagueInMode(opt.id)}
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
            <div className="diff-sheet" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
              <div className="diff-sheet-title">Play with Friends</div>
              <div className="diff-sheet-sub">Who's joining?</div>
              <div className="diff-options">
                <button
                  className="diff-option"
                  onClick={() => { setShowFriendsPicker(false); startMode("online"); }}
                >
                  <span className="diff-option-icon">🌐</span>
                  <div className="diff-option-body">
                    <div className="diff-option-name">Online 1v1</div>
                    <div className="diff-option-desc">Play someone anywhere with a room code</div>
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
            state (calendar viewDate, profile emoji picker etc.) is preserved. */}
        {!inGame && screen === "home" && (
          <div className="screen tab-content" style={tab === "home" ? undefined : HIDDEN_STYLE}>
            {/* Greeting row */}
            {(() => {
              const homeAuthLoading = !!user && !authProfile;
              const homeLocalName = (profile?.name || "").trim();
              const homeHasUsername = !!authProfile?.username && authProfile.username !== "Player";
              const homeShowCTA = !homeAuthLoading && !homeHasUsername && (!homeLocalName || homeLocalName.toLowerCase() === "player");
              const greeting = (() => { const h = new Date().getHours(); return h < 12 ? "Good morning," : h < 18 ? "Good afternoon," : "Good evening,"; })();
              return (
                <div style={{padding:"10px 0 12px"}}>
                  <div style={{display:"flex", alignItems:"baseline", gap:10}}>
                    <div style={{fontSize:15, color:"var(--t2)", fontWeight:600}}>{greeting}</div>
                    {homeAuthLoading ? (
                      <div style={{fontSize:15, color:"var(--t1)", fontWeight:700, opacity:0.4, animation:"profileSkeletonPulse 1.4s ease-in-out infinite"}}>Loading…</div>
                    ) : (
                      <div style={{fontSize:15, color:"var(--t2)", fontWeight:600}}>
                        {authProfile?.username || profile?.name || "Guest"}
                      </div>
                    )}
                  </div>
                  <div style={{fontSize:13, color:"var(--t3)", marginTop:4}}>
                    {homeTagline}
                  </div>
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

            {/* ── DAILY SECTION: Challenge + Puzzle paired ── */}
            <div className="home-section-title">
              <span>Daily</span>
              {loginStreak > 0 && (
                <span className={`hst-streak${streakPulsing ? ' is-pulsing' : ''}`} aria-label={`${loginStreak}-day streak`}>
                  🔥 {loginStreak}
                </span>
              )}
            </div>
            <div className="daily-pair">
              <button
                className="daily-pair-card challenge"
                onClick={() => dailyDone ? setTab("daily") : startMode("daily")}
                aria-label={dailyDone ? `Daily challenge complete: ${dailyScore} out of 7. View daily tab.` : "Play today's daily challenge"}
              >
                <div className="daily-pair-eyebrow">Daily Challenge</div>
                <div className="daily-pair-title">Today's 7</div>
                <div className="daily-pair-status">
                  {dailyDone
                    ? <>✅ Done · <strong>{dailyScore}/7</strong></>
                    : <>Resets in <DailyHeroCountdown /></>}
                </div>
                <div className="daily-pair-emoji">🔥</div>
              </button>
              {(() => {
                const ws = readWordleTodayStatus();
                const wordleStatus =
                  ws.kind === "won"   ? <>✅ Solved in <strong>{ws.used}/6</strong></> :
                  ws.kind === "lost"  ? <>❌ Better luck tomorrow</> :
                  ws.kind === "in-progress" ? <><strong>{ws.used}/6</strong> used · Resets in <DailyHeroCountdown /></> :
                  <>Resets in <DailyHeroCountdown /></>;
                return (
                  <button
                    className="daily-pair-card wordle"
                    onClick={() => setScreen("wordle")}
                    aria-label="Play today's puzzle"
                  >
                    <div className="daily-pair-eyebrow">Daily Puzzle</div>
                    <div className="daily-pair-title">Today's Puzzle</div>
                    <div className="daily-pair-status">{wordleStatus}</div>
                  </button>
                );
              })()}
            </div>

            {/* ── HERO: PLAY WITH FRIENDS (online or local) ── */}
            <button className="hero-online" onClick={() => setShowFriendsPicker(true)} aria-label="Play with friends">
              <div className="hero-online-eyebrow">Multiplayer</div>
              <div className="hero-online-title">Play with Friends</div>
              <div className="hero-online-sub">
                <span className="hero-online-sub-mobile">Online or local — challenge someone</span>
                <span className="hero-online-sub-desktop">Challenge someone online</span>
              </div>
              <div className="hero-online-cta">Play</div>
              <div className="hero-online-emoji">🤝</div>
            </button>

            {/* ── WORLD CUP 2026 COUNTDOWN ── */}
            {(() => {
              const kickoff = new Date(2026, 5, 11);
              const now = new Date();
              const msPerDay = TIMINGS.DAY_MS;
              const dayNow = Math.floor(now.getTime() / msPerDay);
              const dayKick = Math.floor(kickoff.getTime() / msPerDay);
              const daysTo = dayKick - dayNow;
              const started = daysTo <= 0;
              return (
                <button className="wc-card" onClick={() => startMode("wc2026")} aria-label="World Cup 2026 quiz">
                  <div style={{flex:1, minWidth:0}}>
                    <div className="wc-label">🏆 World Cup 2026</div>
                    {started ? (
                      <div className="wc-days"><em>It's here!</em></div>
                    ) : (
                      <div className="wc-days"><em>{daysTo}</em> day{daysTo === 1 ? "" : "s"} to go</div>
                    )}
                    <div className="wc-sub">{started ? "Tap to play the tournament quiz" : "North America awaits"}</div>
                  </div>
                  <div className="wc-cta">Play →</div>
                </button>
              );
            })()}

            {/* ── MORE MODES ── */}
            <div className="home-section-title">More modes</div>
            <div className="play-grid">
              {[
                { key:"classic",   icon:"⏱️",  name:"Classic",       desc:"10 Qs, 20s each",   onTap:() => setShowDiffPicker(true) },
                { key:"league",    icon:"🏆",  name:"League Quiz",   desc:"Pick your league",  onTap:() => setShowLeaguePicker(true) },
                { key:"survival",  icon:"🔥",  name:"Survival",      desc:"Die on wrong" },
                { key:"hotstreak", icon:"⚡🔥", name:"Hot Streak",    desc:"60-second sprint" },
                { key:"legends",   icon:"📜",  name:"Legends",       desc:"Pre-2000 greats" },
                { key:"balliq",    icon:"🧠",  name:`${APP_NAME} Test`,  desc:"What's your IQ?" },
                { key:"chaos",     icon:"🎭",  name:"Chaos",         desc:"Quotes & chaos" },
              ].map(({ key, icon, name, desc, onTap }) => (
                <button
                  key={key}
                  className="play-card"
                  onClick={onTap || (() => startMode(key))}
                >
                  <span className="play-card-icon">{icon}</span>
                  <span className="play-card-body">
                    <span className="play-card-name">{name}</span>
                    <span className="play-card-desc">{desc}</span>
                  </span>
                </button>
              ))}
            </div>
            {/* Coming-Soon shelf — teaser cards for modes that aren't ready
                yet. True or False is intentionally NOT surfaced here; its
                runtime logic stays in place but the entry point remains
                hidden. Section auto-hides if the array is empty. */}
            {(() => {
              const COMING_SOON = [
                { key:"tikitakatoe", icon:"🎯",  name:"Tiki Taka Toe",    desc:"Tic-tac-toe with football connections" },
                { key:"guessplayer", icon:"🔍",  name:"Guess the Player", desc:"Identify the mystery player from clues" },
                { key:"clubquiz",    icon:"🏟️", name:"Club Quiz",         desc:"Deep-dive trivia for your favourite club" },
              ];
              if (COMING_SOON.length === 0) return null;
              return (
                <div className="coming-soon-list">
                  Coming soon: {COMING_SOON.map(m => m.name).join(' · ')}
                </div>
              );
            })()}
          </div>
        )}

        {/* ── LEAGUE TAB ── */}
        {!inGame && screen === "home" && (
          <div style={tab === "league" ? undefined : HIDDEN_STYLE}>
            <LeagueScreen xp={xp} profile={profile} isActive={tab === "league"} />
          </div>
        )}

        {/* ── DAILY TAB ── */}
        {!inGame && screen === "home" && (
          <div style={tab === "daily" ? undefined : HIDDEN_STYLE}>
            <DailyTabScreen stats={stats} dailyDone={dailyDone} dailyScore={dailyScore} loginStreak={loginStreak} iqHistory={iqHistory} onPlay={playDaily} onSuggest={suggestMode} xp={xp} shieldActive={shieldActive} onUseShield={useShield} onShare={shareDaily} dailyHistory={dailyHistory} onPlayDate={playDailyForDate} onViewScore={viewDailyScore} />
          </div>
        )}

        {/* ── PROFILE TAB ── */}
        {!inGame && screen === "home" && (
          <div style={tab === "profile" ? undefined : HIDDEN_STYLE}>
            <ProfileScreen profile={profile} setProfile={setProfile} stats={stats} xp={xp} loginStreak={loginStreak} level={levelInfo.level} earnedBadges={earnedBadges} onShareProfile={shareProfile} onToast={showToast} onChallenge={challengeFriend} onOpenFriend={openFriendProfile} nameEditNonce={nameEditNonce} />
          </div>
        )}

        {/* ── SOCIAL HUB ── */}
        {screen === "social" && (
          <SocialHub
            onOnline={() => startMode("online")}
            onLocal={() => setScreen("local-setup")}
            onBack={goHome}
          />
        )}

        {/* ── SETTINGS SCREEN ── */}
        {!inGame && screen === "settings" && <SettingsScreen settings={settings} onUpdate={updateSettings} onClearStats={clearStats} onClearSeen={clearSeen} onBack={goHome} onShowPrivacy={openPrivacy} onShowHelp={openHelp} onAccountDeleted={onAccountDeleted} onOpenReview={() => setScreen("review")} />}

        {/* ── QUESTION-BANK REVIEW (gated) ── */}
        {!inGame && screen === "review" && <ReviewScreen onBack={() => setScreen("settings")} />}
        {!inGame && screen === "friend-profile" && viewingFriendId && (
          <FriendProfileScreen
            friendId={viewingFriendId}
            onBack={closeFriendProfile}
            onChallenge={challengeFriend}
          />
        )}

        {/* ── PRIVACY POLICY (in-app overlay) ── */}
        {showPrivacy && <PrivacyScreen onClose={closePrivacy} />}
        {showHelp && <HelpScreen onClose={closeHelp} />}

        {/* Shared-invite gate: someone tapped a balliq.app/?join=CODE link
            but they're either signed-out or browsing as a guest. Prompt them
            to sign in; pendingJoinCode persists in localStorage so the
            autoJoinRoutedRef effect picks it up after auth completes. */}
        {pendingJoinCode && (!user || isGuest) && (
          <div
            style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.78)",zIndex:1100,display:"flex",alignItems:"center",justifyContent:"center",padding:24,animation:"fadeIn 0.2s ease"}}
            onClick={clearPendingJoin}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              style={{width:"100%",maxWidth:360,background:"var(--bg)",border:"1px solid var(--border)",borderRadius:18,padding:"26px 22px",textAlign:"center"}}
            >
              <div style={{fontSize:48,marginBottom:10}} aria-hidden="true">🎮</div>
              <div style={{fontSize:18,fontWeight:900,color:"var(--t1)",marginBottom:6}}>Sign in to join the game</div>
              <div style={{fontSize:13,color:"var(--t2)",lineHeight:1.5,marginBottom:18}}>Your friend's invite code <strong style={{color:"var(--accent)",fontFamily:"'JetBrains Mono','SF Mono',ui-monospace,Menlo,monospace"}}>{pendingJoinCode}</strong> is ready. We'll drop you straight into the room as soon as you're signed in.</div>
              <button
                onClick={() => { try { exitGuestMode?.(); } catch {} }}
                style={{width:"100%",padding:14,background:"var(--accent)",color:"#0a1a00",border:"none",borderRadius:12,fontFamily:"inherit",fontSize:15,fontWeight:800,cursor:"pointer",WebkitTextFillColor:"#0a1a00",marginBottom:8}}
              >
                Sign in
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
            onStart={(clubKey) => {
              const pack = CLUB_PACKS[clubKey];
              const qs = shuffle(pack.questions).slice(0, 10).map(q => ({...q, type:"mcq", cat:"ClubQuiz"}));
              setActiveClub(clubKey);
              setMode("classic");
              setQuestions(qs);
              setScreen("quiz");
            }}
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

        {/* ── ONLINE ── */}
        {screen === "online" && (
          <OnlineGame
            onBack={() => { clearPendingJoin(); goHome(); }}
            userId={user?.id}
            defaultName={authProfile?.username || profile?.name || ""}
            autoJoinCode={pendingJoinCode}
          />
        )}

        {/* ── FOOTBALL WORDLE ── */}
        {screen === "wordle" && <FootballWordle onBack={goHome} />}

        {/* ── HOT STREAK ── */}
        {screen === "quiz" && mode === "hotstreak" && (
          <HotStreakEngine
            questions={questions}
            onComplete={handleComplete}
            onBack={goHome}
          />
        )}

        {/* ── TRUE OR FALSE ── */}
        {screen === "quiz" && mode === "truefalse" && (
          <TrueFalseEngine
            questions={trueFalseQuestions}
            onComplete={handleComplete}
            onBack={goHome}
          />
        )}

        {/* ── QUIZ ── */}
        {screen === "quiz" && mode !== "hotstreak" && mode !== "truefalse" && (
          <div>
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
              <div style={{marginTop:14,marginBottom:4,textAlign:"center",padding:"10px 0 6px",background:"linear-gradient(135deg,rgba(168,85,247,0.10),rgba(255,106,0,0.06))",borderRadius:12,border:"1px solid rgba(168,85,247,0.22)"}}>
                <div style={{fontSize:10,fontFamily:"'Inter',sans-serif",color:"#c084fc",fontWeight:700,letterSpacing:0.3,marginBottom:4}}>🎭 Chaos</div>
                <div style={{fontSize:12,color:"var(--t3)",fontStyle:"italic"}}>Quotes, moments &amp; madness — take a beat and think.</div>
              </div>
            )}
            {activeClub && CLUB_PACKS[activeClub] && (
              <div style={{marginTop:14,marginBottom:6,display:"flex",alignItems:"center",gap:14,padding:"10px 14px",background:"var(--s1)",border:"1px solid var(--border)",borderRadius:14}}>
                <ClubCrest clubKey={activeClub} size={80} />
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:11,color:"var(--t3)",fontWeight:600,marginBottom:2}}>Club Quiz</div>
                  <div style={{fontSize:17,fontWeight:800,color:"var(--t1)",letterSpacing:"-0.2px"}}>{CLUB_PACKS[activeClub].name}</div>
                </div>
              </div>
            )}
            <QuizEngine
              key={mode}
              questions={questions}
              mode={mode}
              diff={diff}
              timerEnabled={settings.timer !== false}
              soundEnabled={settings.sound === true}
              hintsEnabled={settings.hints !== false}
              onComplete={handleComplete}
              onBack={() => { if(mode==="daily"){setScreen("home");setTab("daily");}else{setScreen("home");setTab("home");} }}
            />
          </div>
        )}

        {/* ── LOCAL RESULTS ── */}
        {screen === "local-results" && (
          <LocalResults
            result={localResult}
            onHome={goHome}
            onRetry={() => { if (localConfig) startLocalGame(localConfig); }}
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
            onShare={() => shareScore(result?.score, result?.total, mode, { streak: result?.bestStreak })}
            onRetry={() => startMode(mode)}
          />
        )}

        {/* ── TAB BAR ── */}
        {!inGame && screen === "home" && (
          <nav className="tab-bar">
            {[
              { id:"home",     icon:"⚽", label:"Home"    },
              { id:"league",   icon:"🏆", label:"League"  },
              { id:"daily",    icon:"📅", label:"Daily",  badge: !dailyDone },
              { id:"profile",  icon:"👤", label:"Profile" },
            ].map(({ id, icon, label, badge }) => (
              <button key={id} className={`tab-item${tab===id?" active":""}`} onClick={() => { haptic("soft"); setTab(id); }}>
                <span className="tab-icon">{icon}</span>
                <span className="tab-label">{label}</span>
                {badge && <span className="tab-badge" />}
              </button>
            ))}
          </nav>
        )}
        </>}
      </div>
    </>
  );
}

function AppGate() {
  const { user, isGuest, loading } = useAuth();

  if (loading) {
    // Render the SAME branded splash markup that index.html injects into #root
    // before React mounts. Reusing the .biq-splash classes (defined inline in
    // index.html's <style>) means the moment React replaces the pre-mount DOM,
    // the user sees an identical wordmark + animated bar — no visible swap,
    // no flash to a different "Loading..." treatment.
    return (
      <div className="biq-splash" aria-label={`Loading ${APP_NAME}`}>
        <div className="biq-splash-mark">Ball <em>IQ</em></div>
        <div className="biq-splash-dot"></div>
      </div>
    );
  }

  if (!user && !isGuest) {
    return <Login />;
  }

  return <AppInner />;
}

export default function App() { return <ErrorBoundary><AppGate /></ErrorBoundary>; }
