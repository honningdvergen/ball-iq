import { ImageResponse } from '@vercel/og';

// Dynamic Open Graph image — renders the player's Ball IQ rating card so a
// shared balliq.app/p?... link previews as their card (overall + tier + six
// competition ratings + photo). Edge runtime; no JSX (plain element trees).

export const config = { runtime: 'edge' };

const h = (type, props, ...children) => ({
  type,
  props: { ...(props || {}), children: children.length === 0 ? undefined : (children.length === 1 ? children[0] : children) },
});

// Ball IQ's own slate → green → violet tier ramp (not metallic bronze/silver/gold).
// Keys must match cardTier() in src/lib/ballIqCard.js.
const TIERS = {
  elite:    { bg: 'linear-gradient(135deg,#241a33 0%,#0c0814 100%)', accent: '#A78BFA', text: '#F3EEFF', label: 'ELITE' },
  pro:      { bg: 'linear-gradient(135deg,#0f2417 0%,#050d08 100%)', accent: '#22C55E', text: '#EAFBF0', label: 'PRO' },
  prospect: { bg: 'linear-gradient(135deg,#161c26 0%,#080b10 100%)', accent: '#8AA4C8', text: '#EDF2F8', label: 'PROSPECT' },
};

// Competitions in the same order as the `r` (ratings) param. Country flags are
// license-safe (unlike the trademarked competition logos).
const COMPS = [
  { abbr: 'PRL', icon: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { abbr: 'UCL', icon: '⭐' },
  { abbr: 'WCP', icon: '🌍' },
  { abbr: 'LAL', icon: '🇪🇸' },
  { abbr: 'BUN', icon: '🇩🇪' },
  { abbr: 'SEA', icon: '🇮🇹' },
];

// Stump-a-mate card (?t=stump): the question, answer redacted — paired with
// api/q.js. Same 1200×630 canvas, app palette (near-black + brand green).
function stumpCard(sp) {
  const qt = (sp.get('qt') || 'A football question is doing the rounds…').slice(0, 160);
  const cat = (sp.get('c') || '').slice(0, 24);
  // Long questions get a smaller face so they never clip the canvas.
  const qSize = qt.length > 110 ? 44 : qt.length > 70 ? 52 : 62;

  const tree = h('div', {
    style: {
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(135deg,#101710 0%,#0A0A0A 60%)',
      borderTop: '9px solid #58CC02', fontFamily: 'sans-serif', position: 'relative',
      padding: '0 72px',
    },
  },
    h('div', { style: { position: 'absolute', top: 30, left: 44, right: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
      h('div', { style: { fontSize: 30, fontWeight: 800, color: '#F0F1F5', display: 'flex' } }, '⚽ Ball IQ'),
      h('div', { style: { fontSize: 22, fontWeight: 500, color: '#F0F1F5', opacity: 0.6, display: 'flex' } }, 'balliq.app'),
    ),
    h('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 26 } },
      h('div', { style: { fontSize: 26, fontWeight: 800, letterSpacing: 4, color: '#58CC02', display: 'flex' } }, 'CAN YOU GET THIS ONE?'),
      h('div', { style: { fontSize: qSize, fontWeight: 900, lineHeight: 1.15, color: '#FFFFFF', display: 'flex' } }, qt),
      h('div', { style: { display: 'flex', alignItems: 'center', gap: 18, marginTop: 8 } },
        h('div', { style: { display: 'flex', fontSize: 24, fontWeight: 800, color: '#0A0A0A', background: '#58CC02', padding: '12px 26px', borderRadius: 999 } }, 'Tap to answer'),
        h('div', { style: { display: 'flex', fontSize: 22, fontWeight: 600, color: '#9BA0B8' } }, cat ? `${cat} · free, no sign-up` : 'Free, no sign-up'),
      ),
    ),
  );
  return new ImageResponse(tree, { width: 1200, height: 630, emoji: 'twemoji' });
}

export default function handler(req) {
  const sp = new URL(req.url).searchParams;
  if (sp.get('t') === 'stump') return stumpCard(sp);
  const name = (sp.get('n') || 'Ball IQ Player').slice(0, 22);
  let img = sp.get('img') || '';
  // SSRF guard: this endpoint fetches `img` server-side, so only proxy images
  // from our own Supabase storage host. Any attacker-controlled ?img= URL is
  // dropped to the emoji fallback rather than fetched.
  if (img) {
    try {
      const u = new URL(img);
      if (u.protocol !== 'https:' || u.hostname !== 'blcisypmngimqkwxrrdm.supabase.co') img = '';
    } catch { img = ''; }
  }
  const emoji = sp.get('e') || '⚽';
  const overall = sp.get('ov') || '—';
  const t = TIERS[sp.get('ti')] || TIERS.prospect;
  const ratings = (sp.get('r') || '').split(',');

  const avatarInner = img
    ? h('img', { src: img, width: 190, height: 190, style: { width: 190, height: 190, borderRadius: 95, objectFit: 'cover' } })
    : h('div', { style: { width: 190, height: 190, borderRadius: 95, background: '#16181F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 100 } }, emoji);
  const avatar = h('div', { style: { display: 'flex', padding: 5, borderRadius: 102, background: t.accent } }, avatarInner);

  const cell = (comp, val) => h('div', { style: { display: 'flex', alignItems: 'center', gap: 12, width: 228 } },
    h('div', { style: { fontSize: 34, display: 'flex' } }, comp.icon),
    h('div', { style: { fontSize: 48, fontWeight: 900, color: t.accent, display: 'flex' } }, val || '—'),
    h('div', { style: { fontSize: 23, fontWeight: 700, color: t.text, opacity: 0.85, display: 'flex' } }, comp.abbr),
  );
  const rows = [];
  for (let i = 0; i < 6; i += 2) {
    rows.push(h('div', { style: { display: 'flex', gap: 26 } }, cell(COMPS[i], ratings[i]), cell(COMPS[i + 1], ratings[i + 1])));
  }

  const tree = h('div', {
    style: {
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      background: t.bg, borderTop: `9px solid ${t.accent}`, fontFamily: 'sans-serif', position: 'relative',
      padding: '0 64px',
    },
  },
    h('div', { style: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 38%)' } }),
    h('div', { style: { position: 'absolute', top: 30, left: 44, right: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
      h('div', { style: { fontSize: 30, fontWeight: 800, color: t.text, display: 'flex' } }, '⚽ Ball IQ'),
      h('div', { style: { fontSize: 22, fontWeight: 500, color: t.text, opacity: 0.6, display: 'flex' } }, 'balliq.app'),
    ),
    h('div', { style: { flex: 1, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 56 } },
      // Overall block
      h('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start' } },
        h('div', { style: { fontSize: 150, fontWeight: 900, color: t.accent, lineHeight: 1, display: 'flex' } }, overall),
        h('div', { style: { fontSize: 24, fontWeight: 800, letterSpacing: 3, color: t.text, opacity: 0.65, marginTop: 6, display: 'flex' } }, 'OVERALL'),
        h('div', { style: { fontSize: 26, fontWeight: 800, letterSpacing: 2, color: t.accent, marginTop: 10, display: 'flex' } }, t.label),
      ),
      // Avatar + name
      h('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center' } },
        avatar,
        h('div', { style: { fontSize: 44, fontWeight: 800, color: t.text, marginTop: 18, display: 'flex' } }, name),
      ),
      // Ratings
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: 24 } }, ...rows),
    ),
  );

  return new ImageResponse(tree, { width: 1200, height: 630, emoji: 'twemoji' });
}
