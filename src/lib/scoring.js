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

export const LEVELS = [
  { name:"Sunday League",  xpNeeded:0,    icon:"⚽" },
  { name:"Non-League",     xpNeeded:100,  icon:"🌱" },
  { name:"Championship",   xpNeeded:300,  icon:"📈" },
  { name:"Premier League", xpNeeded:700,  icon:"🏟️" },
  { name:"Champions League",xpNeeded:1500, icon:"⭐" },
  { name:"Legend",         xpNeeded:3000, icon:"🐐" },
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
