// Club/topic themes shared by quizlong.mjs (16:9 long-form) and quizshort.mjs (9:16 single-question Short).
import { byClub } from './themes.mjs';

// ---- themes: who the video is for, how it's titled, its colours ----
const club = (name, re, fans, palette, extra = {}) => ({ pick: (p) => byClub(p, name, re), name, fans, palette, ...extra });
export const THEMES = {
  arsenal: club('Arsenal', /\bArsenal\b/i, 'Gooners', { accent: '#ef3340', g1: '#3a1216', g2: '#110a0c', opt: '#170f11', line: '#2b1a1d', ok: '#2e0810' }),
  united: club('Manchester United', /\b(Manchester United|Man Utd|Man United)\b/i, 'United fans', { accent: '#e3372b', g1: '#3a1010', g2: '#120a0a', opt: '#17100f', line: '#2c1c1a', ok: '#2e0a07' }),
  liverpool: club('Liverpool', /\bLiverpool\b/i, 'Liverpool fans', { accent: '#00b2a9', g1: '#0d3330', g2: '#08120f', opt: '#0c1716', line: '#183029', ok: '#042a28' }),
  city: club('Manchester City', /\b(Manchester City|Man City)\b/i, 'City fans', { accent: '#6cabdd', g1: '#10283a', g2: '#0a1118', opt: '#0e1720', line: '#1b2b3a', ok: '#0b2a40' }),
  chelsea: club('Chelsea', /\bChelsea\b/i, 'Chelsea fans', { accent: '#2f6fe0', g1: '#0f1f45', g2: '#0a0d18', opt: '#0f1422', line: '#1c2540', ok: '#0b2358' }),
  spurs: club('Tottenham Hotspur', /\b(Tottenham|Spurs)\b/i, 'Spurs fans', { accent: '#e8e8e8', g1: '#1b2135', g2: '#0b0d14', opt: '#12151f', line: '#242a3c', ok: '#1d2540' }),
  ucl: { pick: (p) => p.filter((q) => q.cat === 'UCL'), name: 'Champions League', fans: 'football fans', palette: { accent: '#4d8cff', g1: '#0d1a3d', g2: '#080b16', opt: '#0e1322', line: '#1a2340', ok: '#0a2150' } },
  transfers: { pick: (p) => p.filter((q) => q.cat === 'Transfers'), name: 'Transfer', fans: 'football fans', palette: { accent: '#e5b53a', g1: '#3a2c0c', g2: '#120e06', opt: '#17130b', line: '#2c2514', ok: '#3a2c05' } },
};

