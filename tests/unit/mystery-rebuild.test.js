// Mystery Player rebuild, 14 Oct 2026.
//
// A play-tester's day: the answer was Joachim Löw as a player, Maradona,
// Careca and Ramón Díaz came back "boiling" with no visible reason, the clues
// were "Born in the 1960s" and "Played for 7 clubs", and the reveal showed no
// career. Fun 3/10. These tests hold the four fixes to real data:
//   1. famous answers only from 15 Oct, and the played days never change
//   2. every guess carries the reasons it is close, and the rank agrees
//   3. the clue ladder: position, a club, initials — never nationality
//   4. the career the reveal prints
import { describe, it, expect } from 'vitest';
import {
  rankPool, bandFor, bandLimits, explainGuess, reasonLine, hasCloseLink, clueLadder, CLUE_AFTER,
} from '../../src/lib/mysteryPlayer.js';
import { careerOf, clubName, mainClub, spellYears, initials, isSeniorClub } from '../../src/lib/mysteryCareer.js';
import { answerBar, FIRST_FAMOUS_DAY } from '../../scripts/mystery-answer-bar.mjs';
import schedule from '../../src/data/mysterySchedule.json';
import pool from '../../src/data/mysteryPool.json';
import careers from '../../src/data/mysteryCareers.json';
import roles from '../../src/data/mysteryRoles.json';
import exclusions from '../../src/data/mysteryExclusions.json';

const byName = (n) => pool.find((p) => p.name === n);
const byId = new Map(pool.map((p) => [p.id, p]));

// The log as it stood when the rebuild landed: Mystery Player No. 1 to No. 73,
// 3 Aug to 14 Oct 2026. Public record. Nothing may change any of it.
const SERVED = [
  'Q615', 'Q703269', 'Q20469', 'Q4261', 'Q41533', 'Q161054', 'Q26517', 'Q23762815', 'Q248141', 'Q96072055',
  'Q12897', 'Q14327453', 'Q2058682', 'Q211451', 'Q482955', 'Q10560', 'Q1912', 'Q44073', 'Q188720', 'Q316681',
  'Q357984', 'Q189686', 'Q192635', 'Q311191', 'Q459830', 'Q184205', 'Q228616', 'Q20110', 'Q150921', 'Q47548',
  'Q2091463', 'Q195953', 'Q185572', 'Q21621995', 'Q192131', 'Q80471', 'Q30148558', 'Q43926', 'Q310612', 'Q184177',
  'Q184277', 'Q10520', 'Q6298063', 'Q161089', 'Q313316', 'Q43913', 'Q485697', 'Q39444', 'Q309532', 'Q11571',
  'Q11948', 'Q379805', 'Q763465', 'Q3195361', 'Q146907', 'Q171583', 'Q29950055', 'Q160472', 'Q48330', 'Q66743376',
  'Q273715', 'Q93563', 'Q382269', 'Q188632', 'Q529207', 'Q185115', 'Q19509544', 'Q177686', 'Q213002', 'Q558887',
  'Q306351', 'Q160206', 'Q4462',
];

describe('the schedule: famous answers from 15 Oct, the past untouched', () => {
  it('keeps every served day exactly as it was, today (Löw) included', () => {
    expect(FIRST_FAMOUS_DAY).toBe(SERVED.length);
    expect(schedule.slice(0, FIRST_FAMOUS_DAY)).toEqual(SERVED);
    expect(byId.get(schedule[72]).name).toBe('Joachim Löw');
  });

  it('keeps its length', () => {
    expect(schedule.length).toBe(400);
  });

  it('never repeats an answer from tomorrow on, nor serves one already served', () => {
    const future = schedule.slice(FIRST_FAMOUS_DAY);
    expect(new Set(future).size).toBe(future.length);
    expect(future.filter((id) => SERVED.includes(id))).toEqual([]);
  });

  it('only schedules players who clear the fame bar', () => {
    const below = schedule.slice(FIRST_FAMOUS_DAY)
      .map((id) => ({ p: byId.get(id), bar: answerBar(byId.get(id), { careers, roles, exclusions, pool }) }))
      .filter((x) => !x.bar.ok)
      .map((x) => `${x.p?.name}: ${x.bar.why.join('; ')}`);
    expect(below).toEqual([]);
  });

  it('turns away the kind of answer the play-tester got, and keeps the stars', () => {
    const bar = (n) => answerBar(byName(n), { careers, roles, exclusions, pool });
    expect(bar('Joachim Löw').ok).toBe(false);
    expect(bar('Rafa Benítez').ok).toBe(false);
    // Henry is a household name whose careers record is missing Arsenal
    // 1999-2007: the reveal would print a career without it.
    expect(bar('Thierry Henry').why.join()).toMatch(/hole/);
    for (const n of ['Zinedine Zidane', 'Diego Maradona', 'Johan Cruyff', 'Mohamed Salah', 'Erling Haaland']) {
      expect(bar(n).why, n).toEqual([]);
    }
  });
});

describe('every guess explains itself, and the rank agrees', () => {
  const low = byName('Joachim Löw');
  const zz = byName('Zinedine Zidane');
  const lowRanks = rankPool(pool, low, careers);
  const zzRanks = rankPool(pool, zz, careers);
  const line = (g, a) => reasonLine(explainGuess(byName(g), a, careers));
  const band = (ranks, g) => bandFor(ranks.get(byName(g).id), pool.length);

  it('no longer calls Maradona, Careca or Ramón Díaz boiling on the Löw day', () => {
    // Measured before the rebuild: 73, 70 and 61, all boiling, all for being
    // forwards born near 1960 (plus 150 points of unreliable nationality).
    for (const n of ['Diego Maradona', 'Careca', 'Ramón Díaz']) {
      expect(band(lowRanks, n), n).not.toBe('hot');
      expect(line(n, low), n).toBe('No shared club · Same position · Same era');
    }
  });

  it('ranks a real club link first and names the club', () => {
    // Klinsmann followed Löw at Stuttgart: the one famous name with a link.
    expect(band(lowRanks, 'Jürgen Klinsmann')).toBe('hot');
    expect(line('Jürgen Klinsmann', low)).toBe('Shared VfB Stuttgart · Same position · Same era');
  });

  it('puts Zidane\'s team-mates on top and says where they played together', () => {
    expect(zzRanks.get(byName('Didier Deschamps').id)).toBeLessThanOrEqual(5);
    expect(line('Didier Deschamps', zz)).toBe('Teammates at Juventus · Same position · Same era');
    expect(band(zzRanks, 'Alessandro Del Piero')).toBe('hot');
    expect(line('Alessandro Del Piero', zz)).toBe('Teammates at Juventus · Same era');
    expect(line('Luís Figo', zz)).toBe('Teammates at Real Madrid · Same era');
  });

  it('pays a shared club that never overlapped less than team-mates, and says so', () => {
    // Cristiano Ronaldo played for both of Zidane's big clubs, years later.
    expect(line('Cristiano Ronaldo', zz)).toBe('Shared Juventus & Real Madrid · Different era');
    expect(zzRanks.get(byName('Cristiano Ronaldo').id)).toBeGreaterThan(zzRanks.get(byName('Alessandro Del Piero').id));
  });

  it('says so plainly when nothing matches', () => {
    expect(line('Diego Maradona', zz)).toBe('No shared club, different era');
    expect(band(zzRanks, 'Diego Maradona')).toBe('cold');
  });

  it('never calls anyone boiling without a shared club, or the same position in the same era', () => {
    // Every fourth day of the log, past and future, and today.
    const { hot } = bandLimits(pool.length);
    const days = [...new Set([72, ...schedule.map((_, i) => i).filter((i) => i % 4 === 0)])];
    const unexplained = [];
    for (const d of days) {
      const a = byId.get(schedule[d]);
      const ranks = rankPool(pool, a, careers);
      for (const [id, r] of ranks) {
        if (r === 1 || r > hot) continue;
        const x = explainGuess(byId.get(id), a, careers);
        if (!hasCloseLink(x)) unexplained.push(`day ${d} ${a.name}: #${r} ${byId.get(id).name} (${reasonLine(x)})`);
      }
    }
    expect(unexplained).toEqual([]);
  });

  it('gives nothing for the answer himself', () => {
    expect(explainGuess(zz, zz, careers)).toBeNull();
  });
});

describe('the clue ladder', () => {
  it('is position, then his main club, then initials, after 3, 6 and 9 guesses', () => {
    const ladder = clueLadder(byName('Zinedine Zidane'), careers, roles);
    expect(ladder.map((c) => [c.key, c.value, c.after])).toEqual([
      ['position', 'Midfielder', 3],
      ['club', 'Juventus', 6],
      ['initials', 'Z. Z.', 9],
    ]);
    expect(CLUE_AFTER).toEqual([3, 6, 9]);
  });

  it('never prints nationality', () => {
    for (const id of schedule.slice(FIRST_FAMOUS_DAY, FIRST_FAMOUS_DAY + 60)) {
      const p = byId.get(id);
      const text = clueLadder(p, careers, roles).map((c) => c.value).join(' ');
      if (p.nat) expect(text, p.name).not.toContain(p.nat);
    }
  });

  it('has all three clues for every famous day', () => {
    const short = schedule.slice(FIRST_FAMOUS_DAY)
      .map((id) => byId.get(id))
      .filter((p) => clueLadder(p, careers, roles).length !== 3)
      .map((p) => p.name);
    expect(short).toEqual([]);
  });

  it('names the club a fan knows him for when two are close in years', () => {
    // Five years at Auxerre, five at United: the better-known club wins.
    expect(mainClub(byName('Eric Cantona'), careers)).toBe('Manchester United');
    expect(mainClub(byName('Lionel Messi'), careers)).toBe('Barcelona');
  });

  it('says when a player goes by one name', () => {
    expect(clueLadder(byName('Eusébio'), careers, roles).find((c) => c.key === 'initials').value).toBe('E. (one name)');
    expect(initials('Robin van Persie')).toBe('R. P.');
  });
});

describe('the career on the reveal', () => {
  it('lists the senior clubs with years, oldest first', () => {
    expect(careerOf(byName('Zinedine Zidane'), careers).map((s) => `${s.club} ${spellYears(s)}`)).toEqual([
      'Cannes 1989–1992', 'Bordeaux 1992–1996', 'Juventus 1996–2001', 'Real Madrid 2001–2006',
    ]);
  });

  it('leaves out youth and reserve sides, and boyhood spells under a senior name', () => {
    const messi = careerOf(byName('Lionel Messi'), careers).map((s) => s.club);
    expect(messi).not.toContain("Newell's Old Boys"); // aged eight to thirteen
    expect(messi.some((c) => /Atlètic|Juvenil| C$/.test(c))).toBe(false);
    expect(messi[0]).toBe('Barcelona');
    expect(isSeniorClub('Real Madrid Castilla')).toBe(false);
    expect(isSeniorClub('Q8343694')).toBe(false);
  });

  it('prints club names the way a fan says them', () => {
    expect(clubName('Real Madrid Club de Fútbol')).toBe('Real Madrid');
    expect(clubName('Manchester United F.C.')).toBe('Manchester United');
    expect(clubName('AFC Ajax')).toBe('Ajax');
    expect(clubName('A.C. Milan')).toBe('AC Milan');
    expect(clubName('SC Freiburg')).toBe('Freiburg');
    expect(clubName('VfB Stuttgart')).toBe('VfB Stuttgart');
    expect(clubName('Parma Calcio 1913')).toBe('Parma');
  });

  it('writes a running spell as "now"', () => {
    expect(spellYears({ from: 2022, to: null })).toBe('2022–now');
    expect(spellYears({ from: 2015, to: 2015 })).toBe('2015');
  });
});
