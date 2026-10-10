// The Draft: eleven real player-seasons in, one league season out.
//
// THE IDEA. You draft the SEASON, not the player. A pick brings what that man
// really did in that league season and nothing else:
//   - his goals, and a share of his club's goals for the games he played
//   - his club's goals conceded, for the games he played
//   - for the games he missed that year, a stand-in from a relegated side
// There is no opinion rating anywhere in here. Every number a pick is worth
// can be read off the row the player is shown.
//
// The two sums are built so that a club's own first eleven adds back up to
// that club's real goals for and against (the generator fits the last step;
// tests/unit/draft.test.js recomputes how close it lands).
//
// Then 38 matches against the league's real finishing places 2 to 20 (their
// average record since 1995), home and away. ⚠️ THE LUCK OF EACH MATCH IS FIXED
// BY THE DAY, not by the team: everyone meets the same 38 rolls. A roll is
// compared with the eleven's own chances in that match, so an eleven that is
// better AT BOTH ENDS (scores more and concedes fewer) can never get a worse
// result in any match than a weaker one on the same day. Two elevens with a
// different balance (one all attack, one all defence) are not ordered that
// strictly: in about one pair in a hundred the one with fewer expected points
// finishes a few points above. Do not promise more than that on the screen.
//
// Pure: no imports, no DOM, no clock, no Math.random. The screen, the
// generator and the tests all use it.

export const POS = ['GK', 'DF', 'MF', 'FW'];
export const FORMATION = { GK: 1, DF: 4, MF: 3, FW: 3 };
export const POS_NAME = { GK: 'Goalkeeper', DF: 'Defender', MF: 'Midfielder', FW: 'Forward' };
export const SPINS = 11;
export const BENCH = 8;
export const GAMES = 38;

const SUB_W = 0.3;   // a substitute appearance counts as this much of a game
const SCORER = 0.5;  // the share of a goal that belongs to the man who scored it
// The other half of each goal is shared by the ten outfield men on the pitch,
// and the weights add up to one across a 4-3-3: 4×.06 + 3×.11 + 3×(.43/3).
const ATT_W = { GK: 0, DF: 0.06, MF: 0.11, FW: 0.43 / 3 };
// Goals against are everyone's, the back of the side most: .20 + 4×.13 + 3×.07 + 3×(.07/3).
const DEF_W = { GK: 0.20, DF: 0.13, MF: 0.07, FW: 0.07 / 3 };
export const HOME = 1.13, AWAY = 0.87;

export const seasonLabel = (y) => `${y}–${String((y + 1) % 100).padStart(2, '0')}`;
export const ordinal = (n) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th'}`;

// How much of the 38 games each man was on the pitch for, 0 to 1.
// Where the source gives starts and substitute appearances, that is read off
// directly. Where it gives one total (Manchester City's tables, among others),
// the split is not known per man, but it is known for the squad: outfield
// starts must come to 10 a game, so the rest of the outfield appearances were
// from the bench. Each outfield man is given the squad's own ratio. A keeper's
// appearances are taken as starts.
function share(sq) {
  if (sq.split) { for (const p of sq.players) p.on = Math.min(1, (p.st + SUB_W * p.su) / sq.played); return; }
  const out = sq.players.filter((p) => p.p !== 'GK');
  const apps = out.reduce((a, p) => a + p.st, 0), starts = 10 * sq.played;
  const k = apps > starts ? (starts + SUB_W * (apps - starts)) / apps : 1;
  for (const p of sq.players) p.on = Math.min(1, (p.p === 'GK' ? p.st : p.st * k) / sq.played);
}

// ── Reading the data file ────────────────────────────────────────────────────
// src/data/draftSquads.json is packed as arrays to keep it small. This turns it
// into objects once, and works out how much of the season each man played.
// A squad is known everywhere by `k`, "2003|Arsenal": saved games and the day's
// board are written in those, never in positions in this array, so adding a
// squad to the data cannot point a saved game at a different one.
export function prepare(raw) {
  const squads = raw.squads.map((s) => {
    const [y, clubIdx, pos, pts, w, d, l, gf, ga, split, rows] = s;
    const players = rows.map(([id, n, p, st, su, g]) => ({ id, n, p: POS[p], st, su, g }));
    const sq = { k: `${y}|${raw.clubs[clubIdx]}`, y, season: seasonLabel(y), club: raw.clubs[clubIdx], pos, pts, w, d, l, gf, ga, played: GAMES, split: !!split, players };
    share(sq);
    return sq;
  });
  return { squads, byKey: new Map(squads.map((s) => [s.k, s])), league: raw.league, fit: raw.fit, table: raw.table, built: raw.built };
}

// ── What one pick is worth ───────────────────────────────────────────────────
// att: goals his presence adds over 38 games. ga: goals against per game on his
// watch. Both include the stand-in for the games he missed.
export function value(p, sq, L) {
  const on = p.on;
  const mine = SCORER * p.g + ATT_W[p.p] * (1 - SCORER) * sq.gf * on;
  const stand = SCORER * (L.repl[0] * GAMES * L.share[POS.indexOf(p.p)] / FORMATION[p.p]) + ATT_W[p.p] * (1 - SCORER) * L.repl[0] * GAMES;
  return { on, att: mine + (1 - on) * stand, ga: on * (sq.ga / sq.played) + (1 - on) * L.repl[1] };
}

// An eleven → goals for and against per game. picks: [{ p, sq }]
export function strength(picks, D) {
  let gf = 0, ga = 0;
  for (const { p, sq } of picks) { const v = value(p, sq, D.league); gf += v.att; ga += DEF_W[p.p] * v.ga; }
  const raw = { lf: gf / GAMES, la: ga };
  // Eleven men cannot cover a season: every club's real first eleven comes out
  // a little short of that club's real goals, because real squads have real
  // reserves and this game gives you a relegated side's. The fit puts a club's
  // own first eleven back on its real goals for and against.
  const f = D.fit;
  return { lf: Math.exp(f.fc) * raw.lf ** f.fk, la: Math.exp(f.ac) * raw.la ** f.ak, raw };
}

// A club's most-used 1-4-3-3, the eleven the fit and its check are made on.
export function firstEleven(sq) {
  return POS.flatMap((pos) => sq.players.filter((p) => p.p === pos).sort((a, b) => b.on - a.on || a.id - b.id).slice(0, FORMATION[pos])).map((p) => ({ p, sq }));
}

// ── The season ───────────────────────────────────────────────────────────────
const CUT = 12; // goals a side, beyond which the chance is nothing
const FACT = [1]; for (let i = 1; i <= CUT; i++) FACT[i] = FACT[i - 1] * i;
const pois = (l) => Array.from({ length: CUT + 1 }, (_, k) => Math.exp(-l) * l ** k / FACT[k]);
// Win, draw and loss chances for Poisson goals.
export function chances(lf, la) {
  const a = pois(lf), b = pois(la);
  let w = 0, d = 0, l = 0;
  for (let i = 0; i <= CUT; i++) for (let j = 0; j <= CUT; j++) { const p = a[i] * b[j]; if (i > j) w += p; else if (i === j) d += p; else l += p; }
  const s = w + d + l;
  return { w: w / s, d: d / s, l: l / s };
}
// A score for a match whose result is already settled: the day's second roll
// picks among the scores that give that result, each by its own chance.
function scoreFor(lf, la, r, v) {
  const a = pois(lf), b = pois(la);
  const fits = (i, j) => (r === 'w' ? i > j : r === 'd' ? i === j : i < j);
  let total = 0;
  for (let i = 0; i <= CUT; i++) for (let j = 0; j <= CUT; j++) if (fits(i, j)) total += a[i] * b[j];
  let acc = 0, last = r === 'w' ? [1, 0] : r === 'd' ? [0, 0] : [0, 1];
  for (let s = 0; s <= 2 * CUT; s++) { // low scores first, the same walk for everyone
    for (let i = Math.max(0, s - CUT); i <= Math.min(CUT, s); i++) {
      const j = s - i;
      if (!fits(i, j)) continue;
      acc += a[i] * b[j]; last = [i, j];
      if (acc >= v * total) return last;
    }
  }
  return last;
}

// mulberry32: the same sequence everywhere JavaScript runs.
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Everything the day decides about the season, the same for every player:
//   rolls   one per fixture, settling its result
//   scores  one per fixture, settling its score once the result is known
//   order   the fixture list: home and away in turn, opponents in a drawn order
// A fixture is numbered 0 to 18 at home to places 2 to 20, then 19 to 37 away.
export function dayLuck(day) {
  const r = rng(Math.imul(day, 2654435761));
  const rolls = Array.from({ length: GAMES }, r), scores = Array.from({ length: GAMES }, r);
  const shuffled = (from) => { const a = Array.from({ length: 19 }, (_, i) => from + i); for (let i = 18; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const home = shuffled(0), away = shuffled(19), order = [];
  for (let i = 0; i < 19; i++) order.push(home[i], away[i]);
  return { rolls, scores, order };
}

// Thirty-eight matches. Returns the record, the goals actually scored in those
// matches, and every match in the day's playing order.
export function playSeason(st, L, luck) {
  const out = { w: 0, d: 0, l: 0, pts: 0, gf: 0, ga: 0, matches: [] };
  for (const n of luck.order) {
    const home = n < 19, place = 2 + (n % 19);
    const [ogf, oga] = L.place[place - 1];
    const lf = st.lf * (oga / L.avg) * (home ? HOME : AWAY), la = st.la * (ogf / L.avg) * (home ? AWAY : HOME);
    const c = chances(lf, la), u = luck.rolls[n];
    const r = u < c.l ? 'l' : u < c.l + c.d ? 'd' : 'w';
    const [f, a] = scoreFor(lf, la, r, luck.scores[n]);
    out[r]++; out.gf += f; out.ga += a;
    out.matches.push({ place, home, r, f, a });
  }
  out.pts = 3 * out.w + out.d;
  return out;
}

// ── The day's board ──────────────────────────────────────────────────────────
// Eleven club-seasons in spin order and a bench of eight behind them. Five that
// finished in the top four, four from 5th to 12th, two from 13th down:
// measured over 40 days, that lets a player who knows nothing land near 52
// points, one who knows the regulars near 72, and perfect play near 91. An even
// draw is mostly mid-table sides and tops out in the low eighties. No club more
// than twice, so a day is never "the Arsenal board".
//
// ⚠️ EVERY SQUAD GETS ITS OWN NUMBER FOR THE DAY (a hash of the day and the
// squad's name) and each tier takes its lowest numbers. It is done this way,
// and not by drawing positions from a list, so that a change to the data moves
// only the boards it touches: a squad added or removed changes a day's board
// only if that squad is on it (tested). Drawing by position reshuffled every
// board of the year whenever one squad was added (measured, 10 Oct 2026).
//
// ⚠️ THIS IS NOT ENOUGH TO MAKE IT A DAILY. A new squad lands on about one
// day's board in thirty, so a batch of thirty new squads changes most days.
// Two players are on the same board only if they hold the same data, and a
// native build holds the data it was built with. Before this game is a daily,
// the squads (or the day's board) must come from the server, as the Top 10
// lists must. Until then "everyone gets the same board" is true of everyone on
// the same version of the site, which is everyone on the web.
const RECIPE = [['top', 5], ['mid', 4], ['low', 2]];
const BENCH_TIERS = ['mid', 'top', 'mid', 'low', 'mid', 'top', 'mid', 'low'];
export const tierOf = (s) => (s.pos <= 4 ? 'top' : s.pos <= 12 ? 'mid' : 'low');
function h32(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15;
  return h >>> 0;
}
export function board(D, day) {
  const line = { top: [], mid: [], low: [] };
  for (const s of D.squads) line[tierOf(s)].push([h32(`${day}:${s.k}`), s]);
  for (const t of Object.keys(line)) line[t].sort((a, b) => a[0] - b[0] || (a[1].k < b[1].k ? -1 : 1));
  const clubs = {};
  const next = (t) => {
    // The lowest number left in the tier whose club is not on the board twice
    // already. A tier that runs out (it cannot on real data: the smallest holds
    // eighty squads) hands over its lowest unused squad regardless of club.
    const free = line[t].filter((x) => x[1]);
    const hit = free.find((x) => (clubs[x[1].club] || 0) < 2) || free[0];
    if (!hit) throw new Error(`draft: no ${t} squads left for day ${day}`);
    const s = hit[1]; hit[1] = null;
    clubs[s.club] = (clubs[s.club] || 0) + 1;
    return s;
  };
  const spins = [];
  for (const [t, n] of RECIPE) for (let k = 0; k < n; k++) spins.push(next(t));
  const bench = BENCH_TIERS.map(next);
  spins.sort((a, b) => h32(`${day}:spin:${a.k}`) - h32(`${day}:spin:${b.k}`) || (a.k < b.k ? -1 : 1));
  return { spins, bench };
}

// ── A game in progress ───────────────────────────────────────────────────────
// Everything about one player's day that is saved. `deal` is the board named by
// squad, `picks` is [squad, player id] per spin taken, `swaps[i]` says how far
// along the bench spin i has moved (absent = the spin as dealt), `used` is how
// much of the bench is spent, `respun` whether the one free choice is gone.
export const SAVE_V = 1;
export function freshGame(D, day) {
  const b = board(D, day);
  return { v: SAVE_V, started: false, hard: false, picks: [], swaps: {}, used: 0, respun: false, seen: false, deal: { spins: b.spins.map((s) => s.k), bench: b.bench.map((s) => s.k) } };
}
export const squadKeyAt = (g, i) => (g.swaps[i] ? g.deal.bench[g.swaps[i] - 1] : g.deal.spins[i]);

// What was saved, if every part of it still makes sense against today's data;
// otherwise null and the day is dealt afresh. Storage can hold anything: an
// older shape, a hand-edited value, a squad or a man the data no longer has.
// A saved game that half-restores is worse than none (the first version of
// this screen crashed on a pick whose player had gone, every time it opened).
export function restoreGame(raw, D) {
  try {
    const g = raw;
    if (!g || typeof g !== 'object' || g.v !== SAVE_V) return null;
    const { deal, picks, swaps } = g;
    const keys = (a, n) => Array.isArray(a) && a.length === n && a.every((k) => typeof k === 'string' && D.byKey.has(k));
    if (!deal || !keys(deal.spins, SPINS) || !keys(deal.bench, BENCH)) return null;
    if (!Array.isArray(picks) || picks.length > SPINS || !swaps || typeof swaps !== 'object' || Array.isArray(swaps)) return null;
    if (!Number.isInteger(g.used) || g.used < 0 || g.used > BENCH) return null;
    for (const [i, n] of Object.entries(swaps)) if (!(+i >= 0 && +i < SPINS) || !Number.isInteger(n) || n < 1 || n > g.used) return null;
    const left = { ...FORMATION }, have = new Set();
    for (let i = 0; i < picks.length; i++) {
      const pk = picks[i];
      if (!Array.isArray(pk) || pk[0] !== squadKeyAt(g, i)) return null;
      const p = D.byKey.get(pk[0]).players.find((x) => x.id === pk[1]);
      if (!p || have.has(p.id) || left[p.p] < 1) return null;
      left[p.p]--; have.add(p.id);
    }
    return { v: SAVE_V, started: !!g.started, hard: !!g.hard, picks, swaps, used: g.used, respun: !!g.respun, seen: !!g.seen && picks.length === SPINS, deal };
  } catch { return null; }
}

// The eleven so far, as squads and men.
export function picksOf(g, D) {
  return g.picks.map(([k, id]) => { const sq = D.byKey.get(k); return { sq, p: sq.players.find((x) => x.id === id) }; });
}

// Who can still be taken: a man whose position has a free place, and who is
// not already in the eleven from another season.
export function openIn(picks) {
  const left = { ...FORMATION }, have = new Set();
  for (const { p } of picks) { left[p.p]--; have.add(p.id); }
  return { left, can: (p) => left[p.p] > 0 && !have.has(p.id) };
}

// The spin the player is looking at, moved along the bench for free for as long
// as nobody in it fits the places still open. Returns the game unchanged when
// the spin is playable (or the bench is spent, which eight swaps would take).
export function settleSpin(g, D) {
  let out = g;
  while (out.picks.length < SPINS && out.used < BENCH) {
    const i = out.picks.length, sq = D.byKey.get(squadKeyAt(out, i));
    if (sq.players.some(openIn(picksOf(out, D)).can)) break;
    out = { ...out, used: out.used + 1, swaps: { ...out.swaps, [i]: out.used + 1 } };
  }
  return out;
}
// The one re-spin the player may ask for.
export function respin(g) {
  if (g.respun || g.picks.length >= SPINS || g.used >= BENCH) return g;
  return { ...g, respun: true, used: g.used + 1, swaps: { ...g.swaps, [g.picks.length]: g.used + 1 } };
}
export function takePick(g, D, id) {
  const i = g.picks.length;
  if (i >= SPINS) return g;
  const sq = D.byKey.get(squadKeyAt(g, i)), p = sq.players.find((x) => x.id === id);
  if (!p || !openIn(picksOf(g, D)).can(p)) return g;
  return { ...g, picks: [...g.picks, [sq.k, id]] };
}

// ── What the points would have meant ─────────────────────────────────────────
// Held against every real final table since 1995-96: where this total would
// have finished, and in how many of those seasons it wins the league. Level on
// points with the real champions counts as winning it.
export function standing(pts, table) {
  const years = Object.keys(table);
  let titles = 0, down = 0; const places = [];
  for (const y of years) {
    const place = Math.min(20, 1 + table[y].filter((x) => x > pts).length);
    places.push(place);
    if (place === 1) titles++;
    if (place >= 18) down++;
  }
  places.sort((a, b) => a - b);
  return { seasons: years.length, titles, down, place: places[places.length >> 1] };
}
