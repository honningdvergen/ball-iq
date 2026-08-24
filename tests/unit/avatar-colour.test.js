import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { AVATAR_COLOURS, avatarColour, defaultAvatarId, avatarHash } from '../../src/lib/avatarColour.js';

/**
 * Every player looks like a different person.
 *
 * ⚠️ MEASURED 2026-08-24: 204 of 219 accounts (93.2%) had no uploaded photo and
 * `handle_new_user` hardcoded avatar_id='ball' for all of them, while
 * ProfilePic read `url || BALL_SRC` and ignored avatar_id entirely. So every
 * friends list, leaderboard and lobby was a wall of identical balls — and the
 * six players who HAD picked an emoji avatar were shown a ball anyway.
 *
 * Names were never the problem: only 5.9% carry an auto-generated
 * 'player_xxxx'. The anonymity was one component.
 *
 * ⚠️ NOT A PICKER. Alex, explicitly: "i do not want an emoji picker". Two
 * avatar paths exist and neither asks the player anything — an uploaded photo,
 * or this auto-assigned colour.
 */

// ⚠️ ProfilePic was extracted to its own module so App.jsx can render an
// avatar without pulling the 72 kB lazy ProfileScreen into the main bundle.
// Both files are read: the component lives in one, the call sites in the other.
const PIC = readFileSync(fileURLToPath(new URL('../../src/components/ProfilePic.jsx', import.meta.url)), 'utf8');
const SCREEN = readFileSync(fileURLToPath(new URL('../../src/screens/ProfileScreen.jsx', import.meta.url)), 'utf8');
const APP = readFileSync(fileURLToPath(new URL('../../src/App.jsx', import.meta.url)), 'utf8');
const PROFILE = PIC + SCREEN + APP;
const SQL = readFileSync(fileURLToPath(new URL('../../supabase/migrations/v1_7_varied_default_avatar.sql', import.meta.url)), 'utf8');

describe('per-player default avatar', () => {
  it('the palette is well-formed and avoids the brand green', () => {
    expect(AVATAR_COLOURS.length).toBe(16);
    const ids = AVATAR_COLOURS.map(c => c.id);
    expect(new Set(ids).size, 'colourway ids must be unique').toBe(16);
    for (const c of AVATAR_COLOURS) {
      expect(c.bg).toMatch(/^#[0-9A-F]{6}$/i);
      expect(c.ink).toMatch(/^#[0-9A-F]{6}$/i);
      // ⚠️ A player whose avatar is #58CC02 reads as a UI element, not a person.
      expect(c.bg.toUpperCase()).not.toBe('#58CC02');
    }
  });

  it('the same player always gets the same colour', () => {
    // The whole point of persisting it: your friends see what you see.
    const id = 'c3b00a7b-ef63-4dee-811d-a16d5eff7167';
    expect(defaultAvatarId(id)).toBe(defaultAvatarId(id));
    expect(avatarColour(defaultAvatarId(id)).bg).toBe(avatarColour(defaultAvatarId(id)).bg);
  });

  it('real uuids spread across the palette rather than clumping', () => {
    // A hash that piles everyone onto three colours would technically "vary"
    // and still look like a wall.
    //
    // ⚠️ MUST USE REAL UUIDS. The first version of this test built seeds as
    // `${i}-4f2a-8b1c-${i}aaaaaaaaaa` — identical suffix, incrementing prefix —
    // and reached only 8 of 16, which reads exactly like a broken hash. It is
    // not: that is pathologically low-entropy input, the kind that defeats a
    // small hash's avalanche in the low bits. Against genuine uuids the same
    // function uses all 16 with a 93-155 spread on 2,000 samples (expected
    // 125). The test was wrong, not the code.
    const used = new Set();
    for (let i = 0; i < 1000; i++) used.add(defaultAvatarId(randomUUID()));
    expect(used.size, 'should reach every colourway').toBe(16);
  });

  it('legacy values still resolve instead of breaking', () => {
    // 'ball' and the six leftover emoji are real rows in prod. None may return
    // null and fall back to the single shared ball this change removes.
    for (const legacy of ['ball', '⚽', '🏆', '🧠', '🔮', '💎', '🎵', '', null, undefined]) {
      const c = avatarColour(legacy, 'seed-x');
      expect(c, `${legacy} must resolve`).toBeTruthy();
      expect(c.bg).toMatch(/^#[0-9A-F]{6}$/i);
    }
  });

  it('ProfilePic actually uses the value it is given', () => {
    // ⚠️ THE ORIGINAL BUG. It read `url || BALL_SRC` and dropped `value`.
    expect(PROFILE).toMatch(/avatarColour\(value, seed\)/);
    expect(PROFILE, 'an uploaded photo must still win').toMatch(/if \(url\) \{/);
    // A dead photo URL must NOT fall back to the shared ball.
    expect(PROFILE).not.toMatch(/currentTarget\.src = BALL_SRC/);
  });

  it('renders the initial, with the ball only when there is no name', () => {
    // Alex chose the initial over the ball after seeing both at real avatar
    // size: the ball's panel detail turns to mush at 28-44px, and every avatar
    // reading as "a ball" is most of what this change exists to fix.
    expect(PROFILE).toMatch(/const initial = String\(name \|\| ''\)/);
    expect(PROFILE, 'the initial must be uppercased').toMatch(/\.charAt\(0\)\.toUpperCase\(\)/);
    // 5.9% of accounts have no usable name, and rows mid-load have none either
    // — a blank coloured disc would look broken.
    expect(PROFILE).toMatch(/\{initial \|\| \(/);
    // Size must scale with the container: these render from 28px to 96px.
    expect(PROFILE).toMatch(/fontSize: "42%"/);
  });

  it('every render site passes a name', () => {
    // ⚠️ A site that forgets it silently shows a ball while its neighbours show
    // letters — two treatments in one list, which reads as a bug rather than a
    // fallback.
    // ⚠️ Strip comments first. The naive regex matched a `<ProfilePic />`
    // written inside an explanatory comment and reported it as an unnamed
    // render site — a false positive in the test, not a real one in the app.
    const code = PROFILE
      .split('\n')
      .filter(l => !/^\s*(\/\/|\*|\/\*)/.test(l))
      .join('\n');
    const calls = [...code.matchAll(/<ProfilePic[^>]*>/g)].map(m => m[0]);
    expect(calls.length, 'ProfilePic should still be used across the app').toBeGreaterThanOrEqual(8);
    const missing = calls.filter(c => !/\bname=\{/.test(c));
    expect(
      missing,
      '\n  Every ProfilePic needs name={...} or it falls back to the ball while\n' +
      '  the rows around it show initials.\n',
    ).toEqual([]);
  });

  it('the server assigns a colourway, and no new account gets the old ball', () => {
    expect(SQL).toMatch(/create or replace function public\.handle_new_user/);
    expect(SQL, 'the trigger must assign a colourway').toMatch(/v_colour text/);
    // The literal that caused this: every account inserted with 'ball'.
    const insertBlock = SQL.slice(SQL.indexOf('insert into public.profiles'), SQL.indexOf('return new;'));
    expect(insertBlock, "handle_new_user must not hardcode 'ball' again").not.toMatch(/'ball'/);
    expect(SQL, 'existing players must be backfilled').toMatch(/update public\.profiles/);
  });

  it('hashing is stable, not incidental', () => {
    expect(avatarHash('abc')).toBe(avatarHash('abc'));
    expect(avatarHash('abc')).not.toBe(avatarHash('abd'));
    expect(Number.isInteger(avatarHash('x'))).toBe(true);
  });
});
