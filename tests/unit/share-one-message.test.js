// SHARE IS ONE BUTTON THAT SENDS ONE MESSAGE (25 Nov 2026).
//
// The four dailies' finishes offered a choice: "Send it to a mate" (a line and
// the puzzle's link) or "Just share my result" (a picture, or a block of text
// with the date, the number and a streak). Alex, to "one button that sends one
// message, or keep two?": "Yeah go with 1 if you think it's right". On the
// first lines here: "yeah those look way better now, good work". On building
// it: "Yes, build it".
//
// The message: one first line with ONE figure in it, Footle's squares, the
// same-puzzle link. No date and no puzzle number in the sentence (his point on
// the first drawings: "too many numbers"). The link's title, which says who did
// what, is pinned in tests/unit/share-link-title.test.js. The link's PICTURE is
// not part of this: it is undecided, and api/og.js is untouched.
//
// Every end state of the four games is pinned here, in English and in Spanish,
// so the owner can read the whole list in one place.
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const { stubGlobals, bootLang } = await import('./i18n-games.harness.js');
const { __resetI18nForTests } = await import('../../src/i18n/index.js');
const en = (await import('../../src/i18n/en.js')).default;
const es = (await import('../../src/i18n/es.js')).default;
const { shareFirstLine, shareMessage } = await import('../../src/lib/shareMessage.js');
const { challengeToken, parseChallengeToken } = await import('../../src/lib/gameChallenge.js');

const read = (p) => readFileSync(fileURLToPath(new URL(`../../${p}`, import.meta.url)), 'utf8');

let store;
beforeAll(() => { store = stubGlobals(); });
afterAll(() => { vi.unstubAllGlobals(); __resetI18nForTests(); });

// game, score -> the first line. The score is what the link carries: guesses
// or clubs used (0 = not solved), or the number right.
const EN = {
  footle: {
    0: 'Footle beat me. Can you solve it?',
    1: 'Solved Footle in 1. Can you match it?',
    2: 'Solved Footle in 2. Can you beat it?',
    3: 'Solved Footle in 3. Can you beat it?',
    4: 'Solved Footle in 4. Can you beat it?',
    5: 'Solved Footle in 5. Can you beat it?',
    6: 'Solved Footle in 6. Can you beat it?',
  },
  trail: {
    0: 'Transfer Trail beat me. Can you get it?',
    1: 'Got Transfer Trail in 1 club. Can you match it?',
    2: 'Got Transfer Trail in 2 clubs. Can you beat it?',
    3: 'Got Transfer Trail in 3 clubs. Can you beat it?',
    6: 'Got Transfer Trail in 6 clubs. Can you beat it?',
    12: 'Got Transfer Trail in 12 clubs. Can you beat it?',
  },
  top10: {
    0: 'Top 10 beat me. Can you name one?',
    1: 'Named 1 on Top 10. Can you beat it?',
    7: 'Named 7 on Top 10. Can you beat it?',
    9: 'Named 9 on Top 10. Can you beat it?',
    10: 'Named all 10 on Top 10. Can you match it?',
  },
  daily7: {
    0: 'Daily 7 beat me. Can you get one?',
    1: 'Got 1 right on Daily 7. Can you beat it?',
    2: 'Got 2 right on Daily 7. Can you beat it?',
    6: 'Got 6 right on Daily 7. Can you beat it?',
    7: 'Got all 7 right on Daily 7. Can you match it?',
  },
};
const ES = {
  footle: {
    0: 'El Footle pudo conmigo. ¿Lo resuelves tú?',
    1: 'Resolví el Footle a la primera. ¿Lo igualas?',
    2: 'Resolví el Footle en 2. ¿Me superas?',
    3: 'Resolví el Footle en 3. ¿Me superas?',
    4: 'Resolví el Footle en 4. ¿Me superas?',
    5: 'Resolví el Footle en 5. ¿Me superas?',
    6: 'Resolví el Footle en 6. ¿Me superas?',
  },
  trail: {
    0: 'El Transfer Trail pudo conmigo. ¿Lo sacas tú?',
    1: 'Saqué el Transfer Trail con 1 club. ¿Lo igualas?',
    2: 'Saqué el Transfer Trail con 2 clubes. ¿Me superas?',
    3: 'Saqué el Transfer Trail con 3 clubes. ¿Me superas?',
    6: 'Saqué el Transfer Trail con 6 clubes. ¿Me superas?',
    12: 'Saqué el Transfer Trail con 12 clubes. ¿Me superas?',
  },
  top10: {
    0: 'El Top 10 pudo conmigo. ¿Aciertas alguno?',
    1: 'Acerté 1 en el Top 10. ¿Me superas?',
    7: 'Acerté 7 en el Top 10. ¿Me superas?',
    9: 'Acerté 9 en el Top 10. ¿Me superas?',
    10: 'Acerté los 10 del Top 10. ¿Lo igualas?',
  },
  daily7: {
    0: 'El Daily 7 pudo conmigo. ¿Aciertas alguna?',
    1: 'Acerté 1 en el Daily 7. ¿Me superas?',
    2: 'Acerté 2 en el Daily 7. ¿Me superas?',
    6: 'Acerté 6 en el Daily 7. ¿Me superas?',
    7: 'Acerté las 7 del Daily 7. ¿Lo igualas?',
  },
};
const each = (table) => Object.entries(table).flatMap(([game, rows]) => Object.entries(rows).map(([s, line]) => [game, Number(s), line]));

// A Footle solved in three, as the screen hands it over: colours only.
const GRID = '⬛🟨⬛⬛⬛🟨⬛\n⬛⬛🟩⬛🟩⬛⬛\n🟩🟩🟩🟩🟩🟩🟩';
const LOST_GRID = Array(6).fill('⬛🟨⬛⬛⬛🟨⬛').join('\n');

describe('the first line, in English', () => {
  beforeEach(() => bootLang(store, null));
  it.each(each(EN))('%s on %i: "%s"', (game, score, line) => {
    expect(shareFirstLine(game, score)).toBe(line);
  });
  it("the lines Alex approved, word for word", () => {
    expect(shareFirstLine('footle', 3)).toBe('Solved Footle in 3. Can you beat it?');
    expect(shareFirstLine('trail', 3)).toBe('Got Transfer Trail in 3 clubs. Can you beat it?');
    expect(shareFirstLine('top10', 7)).toBe('Named 7 on Top 10. Can you beat it?');
    expect(shareFirstLine('daily7', 2)).toBe('Got 2 right on Daily 7. Can you beat it?');
    expect(shareFirstLine('footle', 0)).toBe('Footle beat me. Can you solve it?');
    expect(shareFirstLine('top10', 10)).toBe('Named all 10 on Top 10. Can you match it?');
  });
  it('one figure a line at most; no date, no puzzle number, no emoji, no "No."', () => {
    for (const [game, score, line] of each(EN)) {
      const figures = line.replace(/Top 10|Daily 7/g, '').match(/\d+/g) || [];
      expect(figures.length, line).toBeLessThanOrEqual(1);
      if (figures.length) expect(Number(figures[0]), line).toBe(score);
      expect(line, line).not.toMatch(/No\.|#|\/|\p{Extended_Pictographic}/u);
      expect(line.split('\n').length).toBe(1);
    }
  });
  it('a result nobody can beat asks to be matched; a puzzle that won asks for less', () => {
    for (const [game, score, line] of each(EN)) {
      const best = score === 1 && (game === 'footle' || game === 'trail') || (game === 'top10' && score === 10) || (game === 'daily7' && score === 7);
      if (score === 0) expect(line, line).toMatch(/ beat me\. Can you (solve it|get it|name one|get one)\?$/);
      else expect(line.endsWith(best ? 'Can you match it?' : 'Can you beat it?'), line).toBe(true);
    }
  });
});

describe('the first line, in Spanish', () => {
  beforeEach(() => bootLang(store, 'es'));
  it.each(each(ES))('%s on %i: "%s"', (game, score, line) => {
    expect(shareFirstLine(game, score)).toBe(line);
  });
  it('every English line has its Spanish, with the same placeholder', () => {
    const keys = Object.keys(en).filter((k) => k.startsWith('share.one.'));
    expect(keys.length).toBe(12);
    for (const k of keys) {
      expect(typeof es[k], k).toBe('string');
      expect(es[k].includes('{n}'), k).toBe(en[k].includes('{n}'));
      expect(es[k], k).toMatch(/^[^¿]+\. ¿[^?]+\?$/);     // a statement, then one question, opened and closed
    }
  });
});

describe('the whole message', () => {
  beforeEach(() => bootLang(store, null));
  const url = 'https://balliq.app/c/f.204.3.Alex?r=ABCDEFGHIJKL';
  it('Footle: the line, a blank line, the squares, the link', () => {
    const m = shareMessage({ game: 'footle', score: 3, grid: GRID, url });
    expect(m.text).toBe(`Solved Footle in 3. Can you beat it?\n\n${GRID}\n`);
    expect(m.url).toBe(url);
    expect(m.full).toBe(`Solved Footle in 3. Can you beat it?\n\n${GRID}\n\n${url}`);
  });
  it('a lost Footle keeps its squares: the mate sees how close it was', () => {
    const u = 'https://balliq.app/c/f.204.0';
    expect(shareMessage({ game: 'footle', score: 0, grid: LOST_GRID, url: u }).full).toBe(`Footle beat me. Can you solve it?\n\n${LOST_GRID}\n\n${u}`);
  });
  it('Transfer Trail, Top 10 and the Daily 7: the line and the link, nothing else', () => {
    for (const [game, score, link, line] of [
      ['trail', 3, 'https://balliq.app/c/t.113.3', 'Got Transfer Trail in 3 clubs. Can you beat it?'],
      ['trail', 0, 'https://balliq.app/c/t.113.0', 'Transfer Trail beat me. Can you get it?'],
      ['top10', 7, 'https://balliq.app/c/x.43.7', 'Named 7 on Top 10. Can you beat it?'],
      ['top10', 10, 'https://balliq.app/c/x.43.10', 'Named all 10 on Top 10. Can you match it?'],
      ['daily7', 2, 'https://balliq.app/c/2.20261125.Alex?f=123e4567-e89b-12d3-a456-426614174000', 'Got 2 right on Daily 7. Can you beat it?'],
      ['daily7', 7, 'https://balliq.app/c/7.20261125', 'Got all 7 right on Daily 7. Can you match it?'],
    ]) {
      expect(shareMessage({ game, score, url: link })).toEqual({ line, text: line, url: link, full: `${line}\n${link}` });
    }
  });
  it('in Spanish the same shape', async () => {
    await bootLang(store, 'es');
    expect(shareMessage({ game: 'footle', score: 3, grid: GRID, url }).full).toBe(`Resolví el Footle en 3. ¿Me superas?\n\n${GRID}\n\n${url}`);
    expect(shareMessage({ game: 'top10', score: 10, url: 'U' }).full).toBe('Acerté los 10 del Top 10. ¿Lo igualas?\nU');
  });
  it('the score in the line is the score on the link', () => {
    for (const [game, score] of [['footle', 3], ['footle', 0], ['trail', 2], ['top10', 7], ['top10', 10]]) {
      const token = challengeToken(game, 204, score, 'Alex');
      expect(parseChallengeToken(token)).toMatchObject({ game, edition: 204, score, name: 'Alex' });
    }
  });
});

describe('who builds it', () => {
  const DD = read('src/components/DailyDone.jsx');
  const SHARE = read('src/hooks/useShare.js');
  it('the finish panel (Footle, Transfer Trail, Top 10) and the Daily 7 share one builder', () => {
    expect(DD).toContain('const { text, full } = shareMessage({ game, score: myScore, grid: challengeGrid, url });');
    expect(SHARE).toContain('const { text: sheetText, full: text } = shareMessage({ game: "daily7", score, url: challengeUrl });');
    // text and link go to the share sheet as two fields; the clipboard gets them as one string
    expect(DD).toContain('if (navigator.share) { await navigator.share({ text, url }); said("sent"); return; }');
    expect(SHARE).toContain('await navigator.share({ title: `${APP_NAME} Daily 7`, text: sheetText, url: challengeUrl });');
    expect(SHARE).toContain('await navigator.clipboard.writeText(text);');
  });
  it('no picture file goes with it', () => {
    const code = (s) => s.replace(/^\s*\/\/.*$/gm, '');
    const send = code(DD.slice(DD.indexOf('const sendChallenge = async () => {'), DD.indexOf('const doChallenge = async () => {')));
    expect(send.length).toBeGreaterThan(400);
    expect(send).not.toMatch(/files|shareCard|canShare/);
    const daily = code(SHARE.slice(SHARE.indexOf('const performDailyShare'), SHARE.indexOf('const shareDaily')));
    expect(daily.length).toBeGreaterThan(400);
    expect(daily).not.toMatch(/files|shareCard|canShare/);
  });
  it('the codes on the link are kept: the reply id (?r=) and the Daily 7 challenger (?f=)', () => {
    // 25 Nov 2026: the link is the same, with the picture's detail joined after it (lib/shareDetail.js,
    // tests/unit/share-detail.test.js); the reply id still comes first.
    expect(DD).toContain('withDetail(`https://balliq.app/c/${token}${rid ? `?r=${rid}` : ""}`, ');
    expect(SHARE).toContain('${user?.id ? `?f=${user.id}` : ""}`;');
  });
  it('one button on every finish: no sheet, no second way, and the old events keep their names', () => {
    expect(DD).toContain('const shareTap = canChallenge ? doChallenge : doShare;');
    expect((DD.match(/onClick=\{shareTap\}/g) || []).length).toBe(2);             // the card's button, the classic panel's
    expect(DD).not.toMatch(/ShareSheet|"dd\.sendMate"|"dd\.shareOnly"|"dd\.sendMateNote"|"dd\.shareOnlyNote"/);
    // a puzzle link sent is still dd-challenge; a share with no puzzle link from this panel is still dd-share
    expect(DD).toContain('track?.("dd-challenge", { game, rival: !!rival });');
    expect(DD).toContain('setBusy(true); track?.("dd-share", { game });');
    // the Daily 7's own three events
    for (const e of ['loopEvent("share-daily");', 'loopEvent("share-daily-done", { via: "sheet" });', 'loopEvent("share-daily-cancel");', 'loopEvent("share-daily-done", { via: "clipboard" });']) expect(SHARE).toContain(e);
  });
  it('the Daily 7 still asks once who it is from, and backing out of the ask still shares nothing', () => {
    expect(SHARE).toContain('if (!who) { setShareNameDraft(""); askShareNameRef.current = true; setAskShareName(true); return false; }');
    expect(SHARE).toMatch(/const cancelShareName = useCallback\(\(\) => \{\n\s*askShareNameRef\.current = false;\n\s*setAskShareName\(false\);\n\s*\}, \[\]\);/);
  });
});
