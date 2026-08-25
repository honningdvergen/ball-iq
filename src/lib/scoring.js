import { Footprints, Sprout, TrendingUp, Shield, Sparkles, Award, Medal, Trophy } from 'lucide-react';
export const APP_NAME = "Ball IQ";

export function iqPercentile(iq) {
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

// The ladder EXTENDS UPWARD; the first six thresholds are frozen.
//
// The problem: a perfect 15-question game pays 200 XP, so the old ceiling
// (Legend at 3,000) was ~15 good games — an engaged player finished the whole
// progression in about a fortnight and then XP meant nothing forever. With
// retention as the actual bottleneck, a hook that stops pulling after two
// weeks is a leak.
//
// The obvious fix — stretch every threshold — was MEASURED against the live
// profiles and rejected: it demoted 9 of 9 active users, including one who
// would have lost a Legend badge they had genuinely earned. Taking away a
// rank someone earned is a worse harm than a short ladder. So the existing
// six are untouched (nobody moves) and the climb continues above them.
//
// Icon ≈ 8 weeks of daily play, Immortal ≈ 6 months. Both are deliberately
// far: they exist so the bar is never empty, not to be finished.
// ⚠️ TWO GLYPH FIELDS, AND BOTH ARE LOAD-BEARING.
//
// `Icon` is a lucide component and is what every IN-APP surface renders: the
// journey ladder, the level pills, the level-up overlay. The ladder sits
// directly above the badge grid on Profile, and once the badges became icons
// a column of eight OS emoji beside them looked worse than it had before —
// consistency cuts both ways.
//
// `icon` is the EMOJI and must stay a string. It is serialised into the share
// payload at App.jsx (`li:`), and api/og.js renders that as TEXT at 100px on
// the card. A React component there stringifies to "[object Object]" and the
// share image breaks — which is exactly the kind of thing that survives review
// because nobody opens the card.
//
// Ladder icons are deliberately disjoint from BADGE_DEFS: both sets are on
// screen together, and a glyph that means "Legend the rank" in one grid and
// "Legend the badge" in the other is worse than either.
export const LEVELS = [
  { name:"Sunday League",   xpNeeded:0,     icon:"⚽",  Icon:Footprints },
  { name:"Non-League",      xpNeeded:100,   icon:"🌱",  Icon:Sprout },
  { name:"Championship",    xpNeeded:300,   icon:"📈",  Icon:TrendingUp },
  { name:"Premier League",  xpNeeded:700,   icon:"🏟️",  Icon:Shield },
  { name:"Champions League",xpNeeded:1500,  icon:"⭐",  Icon:Sparkles },
  { name:"Legend",          xpNeeded:3000,  icon:"🐐",  Icon:Award },
  { name:"Icon",            xpNeeded:8000,  icon:"👑",  Icon:Medal },
  { name:"Immortal",        xpNeeded:20000, icon:"🏆",  Icon:Trophy },
];

export function getLevelInfo(xp) {
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

export function computeBadges(stats, xp, loginStreak) {
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
