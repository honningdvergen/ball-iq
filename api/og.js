import { ImageResponse } from '@vercel/og';
import { CARD_TIERS, CARD_COMPS } from '../src/lib/ballIqCard.js';

// Dynamic Open Graph image — renders the player's Ball IQ rating card so a
// shared balliq.app/p?... link previews as their card (overall + tier + six
// competition ratings + photo). Edge runtime; no JSX (plain element trees).
//
// Tier palettes + the competition list (order must match the `r` ratings param)
// come from the SAME module the in-app card renders from, so the share preview
// can never drift from the app again — a hand-copied palette here once shipped
// a violet ELITE while the app showed gold. No test covers this file, so assert
// the import shape at module load instead.
if (!Array.isArray(CARD_COMPS) || CARD_COMPS.length !== 6) {
  throw new Error(`api/og: expected 6 CARD_COMPS from ballIqCard.js, got ${CARD_COMPS?.length}`);
}

export const config = { runtime: 'edge' };

const h = (type, props, ...children) => ({
  type,
  props: { ...(props || {}), children: children.length === 0 ? undefined : (children.length === 1 ? children[0] : children) },
});

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

// Daily-7 challenge card (opportunity-scan #2): a /c/ link in a group chat
// unfurls as a visible taunt — challenger name, score dots, "beat it today".
function challengeCard(sp) {
  const score = Math.min(7, Math.max(0, parseInt(sp.get('s') || '0', 10) || 0));
  const name = (sp.get('n') || '').slice(0, 22);
  const dateLabel = (sp.get('d') || '').slice(0, 12);
  const who = name || 'A mate';

  const dots = Array.from({ length: 7 }, (_, i) =>
    h('div', {
      key: i,
      style: {
        width: 74, height: 74, borderRadius: 20, display: 'flex',
        alignItems: 'center', justifyContent: 'center', fontSize: 40,
        background: i < score ? '#58CC02' : '#1A1D27',
        border: i < score ? 'none' : '2px solid #2A2E3C',
      },
    }, i < score ? '✓' : '')
  );

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
      h('div', { style: { fontSize: 22, fontWeight: 500, color: '#F0F1F5', opacity: 0.6, display: 'flex' } }, dateLabel ? `Daily 7 · ${dateLabel}` : 'balliq.app'),
    ),
    h('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 30 } },
      h('div', { style: { fontSize: 26, fontWeight: 800, letterSpacing: 4, color: '#58CC02', display: 'flex' } }, 'DAILY 7 CHALLENGE'),
      h('div', { style: { fontSize: 62, fontWeight: 900, lineHeight: 1.1, color: '#FFFFFF', display: 'flex' } }, `${who} scored ${score}/7`),
      h('div', { style: { display: 'flex', gap: 14 } }, ...dots),
      h('div', { style: { display: 'flex', alignItems: 'center', gap: 18, marginTop: 6 } },
        h('div', { style: { display: 'flex', fontSize: 24, fontWeight: 800, color: '#0A0A0A', background: '#58CC02', padding: '12px 26px', borderRadius: 999 } }, 'Beat it today'),
        h('div', { style: { display: 'flex', fontSize: 22, fontWeight: 600, color: '#9BA0B8' } }, 'Same 7 questions · free, no sign-up'),
      ),
    ),
  );
  return new ImageResponse(tree, { width: 1200, height: 630, emoji: 'twemoji' });
}

export default function handler(req) {
  const sp = new URL(req.url).searchParams;
  if (sp.get('t') === 'stump') return stumpCard(sp);
  if (sp.get('t') === 'challenge') return challengeCard(sp);
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
  // Clamp every free-text param — this is a compute-billed edge function, so
  // unbounded inputs are a cost/abuse vector (n/qt/c were already sliced; e/ov/r
  // were not — medical security-client finding). Ratings also caps its entry
  // count so a giant CSV can't fan out the render.
  const emoji = (sp.get('e') || '⚽').slice(0, 8);
  const overall = (sp.get('ov') || '—').slice(0, 4);
  // Own-property guard: prototype keys like ti=constructor resolve truthy on a
  // plain object lookup and would render the card with undefined styling
  // (fresh-code audit — no crash, but deterministic fallback is better).
  const tiKey = sp.get('ti');
  const t = (tiKey && Object.prototype.hasOwnProperty.call(CARD_TIERS, tiKey)) ? CARD_TIERS[tiKey] : CARD_TIERS.prospect;
  const ratings = (sp.get('r') || '').slice(0, 64).split(',').slice(0, 6);
  // `s` = day streak (same param the /p description line uses). ≥2 earns a flame
  // chip — a 0/1 "streak" is noise, not a brag.
  const streak = Math.min(9999, Math.max(0, parseInt((sp.get('s') || '0').slice(0, 5), 10) || 0));
  // Strongest league = highest of the six ratings (first wins ties); its chip
  // gets an accent ring. -1 (no valid numbers) elevates nothing.
  let bestIdx = -1;
  let bestVal = -Infinity;
  ratings.forEach((v, i) => {
    const num = parseInt(v, 10);
    if (Number.isFinite(num) && num > bestVal) { bestVal = num; bestIdx = i; }
  });

  const avatarInner = img
    ? h('img', { src: img, width: 190, height: 190, style: { width: 190, height: 190, borderRadius: 95, objectFit: 'cover' } })
    : h('div', { style: { width: 190, height: 190, borderRadius: 95, background: '#16181F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 100 } }, emoji);
  const avatar = h('div', { style: { display: 'flex', padding: 5, borderRadius: 102, background: t.accent } }, avatarInner);

  // Every cell carries the same border/padding (transparent when not the best)
  // so the elevated chip doesn't knock the grid out of alignment.
  const cell = (comp, val, isBest) => h('div', {
    style: {
      display: 'flex', alignItems: 'center', gap: 12, width: 228,
      padding: '6px 12px', borderRadius: 14,
      border: isBest ? `2px solid ${t.accent}` : '2px solid transparent',
      background: isBest ? 'rgba(255,255,255,0.07)' : 'transparent',
    },
  },
    h('div', { style: { fontSize: 34, display: 'flex' } }, comp.icon),
    h('div', { style: { fontSize: 48, fontWeight: 900, color: t.accent, display: 'flex' } }, val || '—'),
    h('div', { style: { fontSize: 23, fontWeight: 700, color: t.text, opacity: 0.85, display: 'flex' } }, comp.abbr),
  );
  const rows = [];
  for (let i = 0; i < 6; i += 2) {
    rows.push(h('div', { style: { display: 'flex', gap: 26 } },
      cell(CARD_COMPS[i], ratings[i], i === bestIdx),
      cell(CARD_COMPS[i + 1], ratings[i + 1], i + 1 === bestIdx)));
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
      // Avatar + name (+ streak chip when the streak is worth bragging about)
      h('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center' } },
        avatar,
        h('div', { style: { fontSize: 44, fontWeight: 800, color: t.text, marginTop: 18, display: 'flex' } }, name),
        ...(streak >= 2 ? [
          h('div', { style: { display: 'flex', alignItems: 'center', fontSize: 24, fontWeight: 800, color: t.text, background: 'rgba(255,255,255,0.08)', padding: '8px 20px', borderRadius: 999, marginTop: 14 } }, `🔥 ${streak} day streak`),
        ] : []),
      ),
      // Ratings
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: 24 } }, ...rows),
    ),
    // Challenge line — same tone as the Daily-7 card's "Beat it today" CTA.
    h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, paddingBottom: 30 } },
      h('div', { style: { display: 'flex', fontSize: 24, fontWeight: 800, color: '#0A0A0A', background: t.accent, padding: '10px 24px', borderRadius: 999 } }, 'Think you can beat this?'),
      h('div', { style: { display: 'flex', fontSize: 22, fontWeight: 600, color: t.text, opacity: 0.65 } }, 'Free football trivia · balliq.app'),
    ),
  );

  return new ImageResponse(tree, { width: 1200, height: 630, emoji: 'twemoji' });
}
