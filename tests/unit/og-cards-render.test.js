import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import ogHandler from '../../api/og.js';

/**
 * Every share card still renders.
 *
 * ⚠️ `api/og.js` carried the comment "No test covers this file" and it was
 * true. That file is the entire share surface — profile cards, Ball IQ rating
 * cards, stump-a-mate, challenges, room invites and club cards — and this
 * project has already shipped a silent, total failure of it once: a
 * `Disallow: /api/` in robots.txt nullified three sprints of share work and
 * every card on every surface unfurled blank, with nothing in the code wrong.
 *
 * Written while upgrading @vercel/og 0.11.1 → 1.0.1 (a SEMVER MAJOR, taken to
 * clear four high libvips CVEs in the sharp it pulls). All six cards came out
 * byte-for-byte identical across the upgrade — same SHA, same byte count —
 * which is the strongest form of "no regression" available for a renderer.
 *
 * ⚠️ THIS DOES NOT PIN HASHES. A hash lock would fail on every legitimate copy
 * or colour change and would be deleted within a month. It pins the things
 * that must never break: a real PNG, the exact 1200×630 the OG spec wants, and
 * six cards that are actually DIFFERENT from one another.
 *
 * ⚠️ The last assertion is the load-bearing one. While writing the upgrade
 * check I passed `?o=78` to the rating card — a parameter it does not read —
 * so the "before" and "after" renders were a mostly-default card compared
 * against itself. It matched perfectly and proved almost nothing. Two cards
 * collapsing to the same output is exactly what that mistake looks like, so
 * the test now refuses it.
 */

// Each card's REAL parameters, taken from the handler rather than guessed.
const CARDS = {
  profile:   '?n=Alexander&e=%F0%9F%A6%81&ov=78',
  iq:        '?t=iq&n=Alexander&b=ARS&r=ELITE&iq=842&sc=6%2F7&c=EF0107',
  stump:     '?t=stump&qt=Who%20scored%20the%20first%20Premier%20League%20goal%3F&c=Records',
  challenge: '?t=challenge&s=6&n=Alexander&d=24%20Aug',
  invite:    '?t=invite&c=ABC123&n=Alexander',
  club:      '?t=club&n=Arsenal&b=ARS&k=Club%20Quiz&c=EF0107',
};

async function render(qs) {
  const res = await ogHandler(new Request('https://balliq.app/api/og' + qs));
  const buf = Buffer.from(await res.arrayBuffer());
  return {
    status: res.status,
    isPng: buf.slice(1, 4).toString() === 'PNG',
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
    bytes: buf.length,
    sha: createHash('sha256').update(buf).digest('hex'),
  };
}

describe('OG share cards', () => {
  const rendered = {};

  it('every card type renders a real 1200x630 PNG', async () => {
    for (const [name, qs] of Object.entries(CARDS)) {
      const r = await render(qs);
      rendered[name] = r;
      expect(r.status, `${name} card should return 200`).toBe(200);
      expect(r.isPng, `${name} card should be a PNG`).toBe(true);
      expect(`${r.width}x${r.height}`, `${name} card wrong size`).toBe('1200x630');
      // A near-empty PNG is the shape of a card that rendered nothing.
      expect(r.bytes, `${name} card suspiciously small — did it render?`).toBeGreaterThan(10000);
    }
  }, 60000);

  it('the six cards are actually different from each other', () => {
    // ⚠️ The assertion that catches a mis-parameterised test. If two card types
    // produce identical bytes, at least one fell through to a default and is
    // not really being exercised.
    const shas = Object.entries(rendered).map(([k, v]) => [k, v.sha]);
    expect(shas.length).toBe(6);
    const seen = new Map();
    const collisions = [];
    for (const [name, sha] of shas) {
      if (seen.has(sha)) collisions.push(`${seen.get(sha)} === ${name}`);
      seen.set(sha, name);
    }
    expect(
      collisions,
      '\n  Two card types rendered identical bytes. Either a `t=` branch is not\n' +
      '  being reached, or the params below no longer match what the handler\n' +
      '  reads — both mean this file is testing a default card against itself.\n',
    ).toEqual([]);
  });

  it('content changes actually change the image', async () => {
    // Proves the fingerprint is sensitive: without this, a renderer that
    // emitted the same placeholder for everything would pass everything above.
    const a = await render('?t=invite&c=ABC123&n=Alexander');
    const b = await render('?t=invite&c=ZZZ999&n=Alexander');
    expect(a.sha).not.toBe(b.sha);
  }, 30000);

  it('an attacker-supplied image host is refused', async () => {
    // The SSRF guard: ?img= is fetched SERVER-SIDE, so only our own Supabase
    // host may be proxied. Anything else must fall back rather than be fetched.
    const evil = await render('?n=Alexander&img=https%3A%2F%2Fevil.example.com%2Fx.png');
    const none = await render('?n=Alexander&img=');
    expect(evil.status).toBe(200);
    expect(evil.sha, 'a foreign img host must be dropped, not fetched').toBe(none.sha);
  }, 30000);
});
