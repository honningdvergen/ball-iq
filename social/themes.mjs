// Reel themes for Shithousery HQ.
//
// Each theme is a genuinely different EDITORIAL angle, not a recolour of one
// template. That distinction is the point: YouTube's inauthentic-content policy
// targets material that is "templated with little to no variation" and "easily
// replicable at scale" — they terminated 16 channels holding 4.7bn lifetime
// views in one January 2026 sweep.
//
// Audience (measured 2026-09-20, Meta dashboard):
//   UK 70.9% · Ireland 6.3%  |  69.8% aged 35+  |  only 6.1% aged 18-24
// So 90s/2000s Premier League is the seam, not current-season fare.

export const THEMES = {
  nostalgia: {
    name: 'Nostalgia ladder',
    palette: { accent:'#00d26a', g1:'#13361f', g2:'#0a1119', optBg:'#0e151e', optBorder:'#1c2430', correctBg:'#052e1b' },
    hook: { top:'Premier League', big:['Nobody','remembers','the third','one.'], sub:'They get older as they go.' },
    pick: (pool) => ordered(pool, [y => y >= 2010, y => y >= 2000 && y < 2010, y => y < 2000]),
  },

  united: {
    name: 'Man United',
    palette: { accent:'#e3372b', g1:'#3a1010', g2:'#120a0a', optBg:'#17100f', optBorder:'#2c1c1a', correctBg:'#2e0a07' },
    hook: { top:'Old Trafford', big:['United','fans','get two','of these.'], sub:'At best.' },
    outro: { big:['Got the','last one?'], sub:'Course you did.' },
    pick: (pool) => byClub(pool, 'Manchester United', /\b(Manchester United|Man Utd|Man United)\b/i),
  },

  arsenal: {
    name: 'Arsenal',
    palette: { accent:'#ef3340', g1:'#3a1216', g2:'#110a0c', optBg:'#170f11', optBorder:'#2b1a1d', correctBg:'#2e0810' },
    hook: { top:'Highbury · Emirates', big:['Gooners','always','get the','last one.'], sub:'Allegedly.' },
    pick: (pool) => byClub(pool, 'Arsenal', /\bArsenal\b/i),
  },

  liverpool: {
    name: 'Liverpool',
    palette: { accent:'#00b2a9', g1:'#0d3330', g2:'#08120f', optBg:'#0c1716', optBorder:'#183029', correctBg:'#042a28' },
    hook: { top:'Anfield', big:['Istanbul','is the','easy one.'], sub:'It gets worse.' },
    pick: (pool) => byClub(pool, 'Liverpool', /\bLiverpool\b/i),
  },

  city: {
    name: 'Man City',
    palette: { accent:'#6CABDD', g1:'#0f2c44', g2:'#080f16', optBg:'#0c1621', optBorder:'#18293a', correctBg:'#08243a' },
    hook: { top:'The Etihad', big:['Most of','you started','watching','in 2012.'], sub:'Be honest.' },
    pick: (pool) => byClub(pool, 'Manchester City', /\b(Manchester City|Man City)\b/i),
  },

  ucl: {
    name: 'European nights',
    palette: { accent:'#4d8cff', g1:'#101f43', g2:'#080c17', optBg:'#0d1322', optBorder:'#1b2740', correctBg:'#0a1b3d' },
    hook: { top:'Champions League', big:['European','nights.','You were','all there.'], sub:'Allegedly.' },
    pick: (pool) => pool.filter(q => q.cat === 'UCL'),
  },

  managers: {
    name: 'The gaffers',
    palette: { accent:'#ffa726', g1:'#3a2a0d', g2:'#120e08', optBg:'#161208', optBorder:'#2c2412', correctBg:'#2e1f05' },
    hook: { top:'The dugout', big:['You','remember','the players.','Not these.'], sub:'Different thing entirely.' },
    outro: { big:['Knew the','gaffer?'], sub:'Thought so.' },
    pick: (pool) => pool.filter(q => q.cat === 'Managers'),
  },

  transfers: {
    name: 'Money talks',
    palette: { accent:'#d4af37', g1:'#33290d', g2:'#110f07', optBg:'#141108', optBorder:'#2a2413', correctBg:'#2a2208' },
    hook: { top:'The transfer market', big:['Everyone','guesses','these','too low.'], sub:'Every single time.' },
    outro: { big:['Guessed','too low?'], sub:'Everyone does.' },
    pick: (pool) => pool.filter(q => q.cat === 'Transfers'),
  },
};

// --- helpers -------------------------------------------------------------

const yearOf = q => {
  const m = (q.q + ' ' + (q.hint || '')).match(/\b(19[5-9]\d|20[0-2]\d)\b/);
  return m ? Number(m[1]) : null;
};

function ordered(pool, bands) {
  const out = [], used = new Set();
  for (const test of bands) {
    const hit = pool.find(q => {
      const y = yearOf(q);
      return y !== null && test(y) && !used.has(q.id);
    });
    if (hit) { out.push(hit); used.add(hit.id); }
  }
  return out;
}

// ⚠️ Match the question's SUBJECT, never its hint.
//
// The hint routinely names rivals ("...19 points ahead of Man Utd"), so matching
// against it put a Man CITY question inside a Man UNITED reel — under a hook
// reading "United fans get two of these". Caught only by watching the render.
// `club` is authoritative where the bank sets it (3,871 of 7,413 entries);
// otherwise fall back to the question text alone.
function byClub(pool, club, re) {
  return pool.filter(q => (q.club ? q.club === club : re.test(q.q)));
}

export const eraLabel = q => {
  const y = yearOf(q);
  return y ? String(y) : (q.cat || '').toUpperCase();
};

export { yearOf, byClub };
