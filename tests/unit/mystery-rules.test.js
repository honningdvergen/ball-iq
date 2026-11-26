// Mystery Player rebuild, Job A (26 Nov 2026): the rules of the new play
// screen, held to real data. "Hints have to be right": every card and every
// tile below is checked against the careers, nations and birth years it rests
// on, and the owner's own cases are here by name (Xabi Alonso, Wilfried Zaha,
// a one-club player, a guess born the same year, namesakes, brothers).
import { describe, it, expect } from 'vitest';
import {
  tileVerdicts, sharedClubsRanked, nationsOf, primaryNation, regionOf, flagOf,
  hintCards, teammateHint, teammateMainHint, clubHint, careerYearsHint, nationHint, birthYearHint,
  teammateCandidates, nearMainClubs, togetherAt, heldHints, roundHeld, openRounds,
  hintsFromSave, saveHintFields, HINT_ROUNDS, HINT_SAVE_VERSION, startersForDay, starterLine,
  SLOT_WORD, TEAMMATE_YEARS, TEAMMATE_FALLBACK_YEARS, TEAMMATE_FAME_TOP, teammateFameLine,
} from '../../src/lib/mysteryRules.js';
import { withCareerFixes, clubsOf, mainClub, sharedClubs, careerOf } from '../../src/lib/mysteryCareer.js';
import { rankPool, paidCluesFromSave } from '../../src/lib/mysteryPlayer.js';
import pool from '../../src/data/mysteryPool.json';
import answers from '../../src/data/mysteryAnswers.json';
import rawCareers from '../../src/data/mysteryCareers.json';
import fixes from '../../src/data/mysteryCareerFixes.json';
import nations from '../../src/data/mysteryNations.json';
import regions from '../../src/data/nationRegions.json';
import flags from '../../src/data/nationFlags.json';

const careers = withCareerFixes(rawCareers, fixes);
const byId = new Map(pool.map((p) => [p.id, p]));
const ctx = { careers, byId, answers, nations, regions, flags, year: 2026 };
const P = (id) => { const p = byId.get(id); if (!p) throw new Error(`missing ${id}`); return p; };

const XABI = 'Q208104', ZAHA = 'Q713711', KANE = 'Q969725', GERRARD = 'Q459830', LAHM = 'Q43682';
const RONALDO = 'Q11571', MESSI = 'Q615', TOTTI = 'Q20110', BUFFON = 'Q68060';
const FRANK_DE_BOER = 'Q219657', RONALD_DE_BOER = 'Q270075';
const LAMPARD = 'Q41533', LAMPARD_SR = 'Q461633';

describe('Xabi Alonso, the owner\'s case', () => {
  const xabi = P(XABI);
  it('his clubs are the four the owner named, and Real Madrid / Liverpool are within a year of the longest', () => {
    const clubs = [...clubsOf(xabi, careers, 2026).keys()];
    for (const c of ['Real Sociedad', 'Liverpool', 'Real Madrid', 'Bayern Munich']) expect(clubs).toContain(c);
    const near = nearMainClubs(xabi, ctx);
    expect(near.has('Real Madrid')).toBe(true);
    expect(near.has('Liverpool')).toBe(true);
  });
  it('the club card is never Real Madrid or Liverpool (nor Real Sociedad, four years): it is Bayern Munich', () => {
    const c = clubHint(xabi, ctx);
    expect(c.available).toBe(true);
    expect(['Real Madrid', 'Liverpool', 'Real Sociedad']).not.toContain(c.value.club);
    expect(c.value.club).toBe('Bayern Munich');
  });
  it('any of his four clubs shared on a guess is green (same), never gold', () => {
    for (const club of ['Real Sociedad', 'Liverpool', 'Real Madrid', 'Bayern Munich']) {
      const g = pool.find((p) => p.id !== XABI && sharedClubs(xabi, p, careers, null, 2026).some((s) => s.club === club));
      expect(g, club).toBeTruthy();
      const t = tileVerdicts(g, xabi, ctx).club;
      expect(t.state).toBe('same');
    }
    expect(tileVerdicts(P(GERRARD), xabi, ctx).club).toMatchObject({ club: 'Liverpool', state: 'same' });
    expect(tileVerdicts(P(LAHM), xabi, ctx).club).toMatchObject({ club: 'Bayern Munich', state: 'same' });
  });
  it('the round-one teammate is from a club that is not one of his main clubs, with three or more years together', () => {
    const c = teammateHint(xabi, ctx);
    expect(c.available).toBe(true);
    expect(nearMainClubs(xabi, ctx).has(c.value.club)).toBe(false);
    expect(togetherAt(xabi, P(c.value.id), c.value.club, ctx).years).toBeGreaterThanOrEqual(TEAMMATE_YEARS);
  });
  it('the round-two teammate is from his main club, and is not Arbeloa (Liverpool AND Real Madrid would give it away)', () => {
    const c = teammateMainHint(xabi, ctx);
    expect(c.available).toBe(true);
    expect(c.value.club).toBe(mainClub(xabi, careers, 2026));
    const shared = sharedClubs(xabi, P(c.value.id), careers, null, 2026);
    expect(shared).toHaveLength(1);
  });
});

describe('nations: every senior national team, primary first', () => {
  it('Wilfried Zaha represented Ivory Coast and England; Ivory Coast (2017–) is primary over England (2012)', () => {
    expect(nationsOf(P(ZAHA), nations)).toEqual(['Ivory Coast', 'England']);
    expect(primaryNation(P(ZAHA), nations)).toBe('Ivory Coast');
  });
  it('a guess of an England player is green for Zaha; a French one is gold (UEFA, through England); a Brazilian is different', () => {
    expect(tileVerdicts(P(KANE), P(ZAHA), ctx).nation).toMatchObject({ nation: 'England', state: 'same' });
    const french = pool.find((p) => primaryNation(p, nations) === 'France' && nationsOf(p, nations).length === 1);
    expect(tileVerdicts(french, P(ZAHA), ctx).nation.state).toBe('close');
    const brazilian = pool.find((p) => nationsOf(p, nations).join() === 'Brazil');
    expect(tileVerdicts(brazilian, P(ZAHA), ctx).nation).toMatchObject({ nation: 'Brazil', region: 'CONMEBOL', state: 'different' });
  });
  it('the tile shows the GUESS\'s primary nation: Zaha guessed on a Kane day reads Ivory Coast, CAF against UEFA, different', () => {
    expect(tileVerdicts(P(ZAHA), P(KANE), ctx).nation).toMatchObject({ nation: 'Ivory Coast', region: 'CAF', state: 'different' });
  });
  it('the hand edits hold: Cahill was never a Samoa senior player, Davids never Suriname\'s', () => {
    expect(nationsOf(P('Q187238'), nations)).toEqual(['Australia']);
    expect(nationsOf(P('Q185115'), nations)).toEqual(['Netherlands']);
  });
  it('every nation has a confederation; every answer\'s nation has a flag', () => {
    for (const n of nations.n) expect(regionOf(n, regions), n).toMatch(/^(UEFA|CONMEBOL|CONCACAF|CAF|AFC|OFC)$/);
    for (const id of answers) for (const n of nationsOf(P(id), nations)) expect(flagOf(n, flags), n).toMatch(/^flags\/[a-z0-9-]+\.png$/);
  });
  it('football\'s own grouping decides the awkward ones', () => {
    for (const n of ['Turkey', 'Russia', 'Israel', 'Kazakhstan', 'Armenia', 'Georgia']) expect(regionOf(n, regions)).toBe('UEFA');
    expect(regionOf('Australia', regions)).toBe('AFC');
    expect(regionOf('Suriname', regions)).toBe('CONCACAF');
  });
  it('a player with no senior national team has no nation, and his tile says unknown rather than guessing', () => {
    const uncapped = pool.find((p) => !nationsOf(p, nations).length);
    expect(primaryNation(uncapped, nations)).toBe(null);
    expect(tileVerdicts(uncapped, P(XABI), ctx).nation).toMatchObject({ nation: null, state: 'unknown' });
  });
});

describe('the four tiles', () => {
  const xabi = P(XABI);
  it('born: the same year is green with no arrow; within four is gold; the arrow points toward the secret player', () => {
    const same = pool.find((p) => p.id !== XABI && p.born === xabi.born);
    expect(tileVerdicts(same, xabi, ctx).born).toEqual({ year: 1981, arrow: null, state: 'same' });
    const older = pool.find((p) => p.born === xabi.born + 3);
    expect(tileVerdicts(older, xabi, ctx).born).toEqual({ year: 1984, arrow: 'down', state: 'close' });
    const younger = pool.find((p) => p.born === xabi.born - 4);
    expect(tileVerdicts(younger, xabi, ctx).born).toEqual({ year: 1977, arrow: 'up', state: 'close' });
    const far = pool.find((p) => p.born === xabi.born + 5);
    expect(tileVerdicts(far, xabi, ctx).born.state).toBe('different');
  });
  it('position is the four-line word, same or different, never close', () => {
    expect(tileVerdicts(P(GERRARD), xabi, ctx).position).toEqual({ slot: 'MF', word: 'Midfielder', state: 'same' });
    expect(tileVerdicts(P(BUFFON), xabi, ctx).position).toEqual({ slot: 'GK', word: 'Goalkeeper', state: 'different' });
  });
  it('the shared-club tile is never gold, for any guess against any of ten answers', () => {
    for (const id of answers.slice(0, 10)) {
      const s = P(id);
      for (const g of pool.slice(0, 1500)) {
        const t = tileVerdicts(g, s, ctx).club;
        expect(t.state).not.toBe('close');
        if (t.state === 'same' && g.id !== id) expect(sharedClubs(s, g, careers, null, 2026).map((x) => x.club)).toContain(t.club);
      }
    }
  });
  it('several shared clubs: the tile names the one where they overlapped longest', () => {
    const g = pool.find((p) => sharedClubs(xabi, p, careers, null, 2026).length >= 2);
    const ranked = sharedClubsRanked(g, xabi, ctx);
    expect(tileVerdicts(g, xabi, ctx).club.club).toBe(ranked[0].club);
    expect(ranked[0].together).toBeGreaterThanOrEqual(ranked[1].together);
  });
  it('no shared club reads None (null, different)', () => {
    expect(tileVerdicts(P(BUFFON), xabi, ctx).club).toMatchObject({ club: null, state: 'different' });
  });
  it('namesakes are judged by id: the two Frank Lampards get their own birth years', () => {
    const jr = tileVerdicts(P(LAMPARD), P(GERRARD), ctx);
    const sr = tileVerdicts(P(LAMPARD_SR), P(GERRARD), ctx);
    expect(jr.born.year).toBe(1978);
    expect(sr.born.year).toBe(1948);
    expect(jr.born.state).toBe('close');
    expect(sr.born.state).toBe('different');
  });
  it('the answer itself is green on all four', () => {
    const t = tileVerdicts(xabi, xabi, ctx);
    expect([t.club.state, t.position.state, t.nation.state, t.born.state]).toEqual(['same', 'same', 'same', 'same']);
  });
  it('nothing here moves the rank: the ranking module is untouched', () => {
    const ranks = rankPool(pool, xabi, careers, 2026);
    expect(ranks.get(XABI)).toBe(1);
  });
});

describe('hint cards for all curated answers: true and checkable, or not offered', () => {
  const all = answers.map((id) => [P(id), hintCards(P(id), ctx)]);
  it('every round-one teammate: one shared club, not a main club, the stated years really overlap, a curated answer, not a brother', () => {
    for (const [s, cards] of all) {
      for (const c of [cards[1][0], cards[2][0]]) {
        if (!c.available) continue;
        const t = P(c.value.id);
        expect(answers).toContain(t.id);
        expect(t.id).not.toBe(s.id);
        const shared = sharedClubs(s, t, careers, null, 2026);
        expect(shared.map((x) => x.club), `${s.name} / ${t.name}`).toEqual([c.value.club]);
        const tog = togetherAt(s, t, c.value.club, ctx);
        expect(tog.from).toBe(c.value.from);
        expect(tog.years).toBeGreaterThanOrEqual(c.level === 'main' ? TEAMMATE_YEARS : TEAMMATE_FALLBACK_YEARS);
        const last = (n) => n.split(' ').pop().toLowerCase();
        if (s.name.includes(' ')) expect(last(t.name)).not.toBe(last(s.name));
        if (c.key === 'teammate') expect(nearMainClubs(s, ctx).has(c.value.club)).toBe(false);
        else expect(c.value.club).toBe(mainClub(s, careers, 2026));
      }
    }
  });
  it('every club card names a senior club from the career, never the main club or one within a year of it', () => {
    for (const [s, cards] of all) {
      const c = cards[1][1];
      if (!c.available || c.value.oneClub) continue;
      expect(clubsOf(s, careers, 2026).has(c.value.club)).toBe(true);
      expect(nearMainClubs(s, ctx).has(c.value.club), s.name).toBe(false);
      expect(c.value.club).not.toBe(mainClub(s, careers, 2026));
    }
  });
  it('career years are the first start and the last end of the senior career', () => {
    for (const [s, cards] of all) {
      const c = cards[1][2];
      if (!c.available) continue;
      const sp = careerOf(s, careers, 2026);
      expect(c.value.from).toBe(Math.min(...sp.map((x) => x.from)));
      if (c.value.to != null) expect(c.value.to).toBe(Math.max(...sp.map((x) => x.to)));
      else expect(sp.some((x) => x.to == null)).toBe(true);
    }
  });
  it('nation and birth year are the data\'s own', () => {
    for (const [s, cards] of all) {
      const n = cards[2][1];
      if (n.available) expect(n.value.nation).toBe(primaryNation(s, nations));
      const b = cards[2][2];
      if (b.available) expect(b.value.year).toBe(s.born);
    }
  });
  it('R14: every teammate named is among the 300 best-known curated answers, the line read from the data', () => {
    const fames = answers.map((id) => P(id).fame || 0).sort((a, b) => b - a);
    const line = teammateFameLine(ctx);
    expect(line).toBe(fames[TEAMMATE_FAME_TOP - 1]);
    expect(fames.filter((f) => f >= line).length).toBeGreaterThanOrEqual(TEAMMATE_FAME_TOP);
    for (const [, cards] of all) {
      for (const c of [cards[1][0], cards[2][0]]) if (c.available) expect(P(c.value.id).fame || 0).toBeGreaterThanOrEqual(line);
    }
  });
  it('R14: no more than 40 answers are left with no card at all in round one', () => {
    expect(all.filter(([, cards]) => !cards[1].some((c) => c.available)).length).toBeLessThanOrEqual(40);
  });
  it('a one-club player is told as one, and no club is named (Totti)', () => {
    expect(clubHint(P(TOTTI), ctx)).toMatchObject({ available: true, value: { oneClub: true } });
  });
  it('brothers are never each other\'s teammate hint (Frank and Ronald de Boer)', () => {
    const cands = teammateCandidates(P(FRANK_DE_BOER), ctx, { clubs: new Set(clubsOf(P(FRANK_DE_BOER), careers, 2026).keys()), minYears: 1 });
    expect(cands.map((c) => c.id)).not.toContain(RONALD_DE_BOER);
  });
  it('never initials, never the main club as a card of its own', () => {
    for (const r of HINT_ROUNDS) for (const k of r.cards) expect(['initials', 'mainClub', 'position', 'decade']).not.toContain(k);
  });
  it('deterministic: the same player gives the same cards', () => {
    expect(JSON.stringify(hintCards(P(MESSI), ctx))).toBe(JSON.stringify(hintCards(P(MESSI), ctx)));
  });
});

describe('a hint the player already holds is never sold (R4)', () => {
  const xabi = P(XABI);
  const cards = hintCards(xabi, ctx);
  it('a Spanish guess holds the nation card; a 1981 guess holds the birth-year card; Lahm holds the Bayern club card', () => {
    const spaniard = pool.find((p) => p.id !== XABI && primaryNation(p, nations) === 'Spain' && p.born !== 1981);
    const born81 = pool.find((p) => p.id !== XABI && p.born === 1981 && primaryNation(p, nations) !== 'Spain');
    expect(heldHints(cards, [spaniard], xabi, ctx)).toEqual({ nation: true });
    expect(heldHints(cards, [born81], xabi, ctx)).toEqual({ birthYear: true });
    expect(heldHints(cards, [P(LAHM)], xabi, ctx).club).toBe(true);
  });
  it('a Gerrard guess (Liverpool green) does not hold the Bayern club card', () => {
    expect(heldHints(cards, [P(GERRARD)], xabi, ctx).club).toBeUndefined();
  });
  it('guessing the named teammate holds that card', () => {
    const mate = cards[2][0].value.id;
    expect(heldHints(cards, [P(mate)], xabi, ctx).teammateMain).toBe(true);
  });
  it('a round is held when every offered card is held', () => {
    expect(roundHeld([{ key: 'a', available: true }, { key: 'b', available: false }], { a: true })).toBe(true);
    expect(roundHeld([{ key: 'a', available: true }, { key: 'b', available: true }], { a: true })).toBe(false);
  });
});

describe('the ladder and saves', () => {
  it('round one opens at 4 guesses, round two at 8; one card per round', () => {
    expect(openRounds(3)).toEqual([]);
    expect(openRounds(4)).toEqual([1]);
    expect(openRounds(7, [{ round: 1, key: 'club' }])).toEqual([]);
    expect(openRounds(8, [{ round: 1, key: 'club' }])).toEqual([2]);
    expect(openRounds(8)).toEqual([1, 2]);
    expect(openRounds(12, [{ round: 1, key: 'club' }, { round: 2, key: 'nation' }])).toEqual([]);
  });
  it('a new save round-trips, and keeps hintsUsed for anything that reads it', () => {
    const taken = [{ round: 1, key: 'teammate' }, { round: 2, key: 'birthYear' }];
    const fields = saveHintFields(taken);
    expect(fields).toEqual({ clues: HINT_SAVE_VERSION, hints: taken, hintsUsed: 2 });
    expect(hintsFromSave({ won: true, guesses: [], ...fields })).toEqual({ taken, count: 2, legacy: false });
  });
  it('old saves still load: the 16 Oct ladder (clues 3), the 14 Oct ladder (clues 2), and before it', () => {
    expect(hintsFromSave({ hintsUsed: 1, clues: 3 })).toEqual({ taken: [], count: 1, legacy: true });
    expect(hintsFromSave({ hintsUsed: 2, clues: 2 })).toEqual({ taken: [], count: 1, legacy: true });
    expect(hintsFromSave({ hintsUsed: 1 })).toEqual({ taken: [], count: 0, legacy: false });
    expect(hintsFromSave(null)).toEqual({ taken: [], count: 0, legacy: false });
  });
  it('the old screen reads a new save as no clues taken, and does not break on it', () => {
    expect(paidCluesFromSave(saveHintFields([{ round: 1, key: 'club' }]))).toBe(0);
  });
  it('a tampered save cannot claim a card that is not in its round, or two in one round', () => {
    const r = hintsFromSave({ clues: 4, hints: [{ round: 1, key: 'nation' }, { round: 1, key: 'club' }, { round: 1, key: 'teammate' }] });
    expect(r.taken).toEqual([{ round: 1, key: 'club' }]);
  });
});

describe('starters (R5, R7)', () => {
  const answerPlayers = answers.map(P);
  it('three curated players from three different lines, never the answer, a different three on the next day', () => {
    for (let d = 20668; d < 20668 + 60; d++) {
      const s = startersForDay(d, MESSI, answerPlayers);
      expect(s).toHaveLength(3);
      expect(new Set(s.map((p) => p.slot)).size).toBe(3);
      for (const p of s) { expect(answers).toContain(p.id); expect(p.id).not.toBe(MESSI); }
      const next = startersForDay(d + 1, MESSI, answerPlayers);
      expect(next.map((p) => p.id)).not.toEqual(s.map((p) => p.id));
    }
  });
  it('they do not depend on the answer\'s position or era: on any day, a goalkeeper answer and a forward answer get the same three', () => {
    let compared = 0;
    for (let d = 20668; d < 20668 + 120; d++) {
      const a = startersForDay(d, BUFFON, answerPlayers).map((p) => p.id);
      const b = startersForDay(d, MESSI, answerPlayers).map((p) => p.id);
      // Only a day whose own pick is the answer differs (the next one stands in).
      if (a.includes(MESSI) || b.includes(BUFFON)) continue;
      expect(a).toEqual(b);
      compared++;
    }
    expect(compared).toBeGreaterThan(100);
  });
  it('the grey line names the club he is known for: Buffon reads Juventus, not Parma Calcio 1913', () => {
    expect(starterLine(P(BUFFON), ctx)).toEqual({ born: 1978, club: 'Juventus' });
  });
});

describe('words', () => {
  it('slot words', () => expect(SLOT_WORD).toEqual({ GK: 'Goalkeeper', DF: 'Defender', MF: 'Midfielder', FW: 'Forward' }));
  it('the answer list is the one the starters and teammates draw from', () => {
    expect(answers.length).toBe(648);
    expect(RONALDO).toBe('Q11571');
  });
});
