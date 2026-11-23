// 23 Nov 2026, found on the design walk. The league sheet's step is kept in
// localStorage for fifteen minutes so it survives the remount when a guest
// signs in. It also survived the player leaving: one tap on "Start a league",
// then any game opened in the next quarter of an hour had the sheet on top of
// it, a Daily 7 in progress included.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../../src/App.jsx', import.meta.url), 'utf8');

describe('a stored league sheet does not open on top of a game', () => {
  it('a page opened on a game, quiz, challenge, room or tab is not a return to the sheet', () => {
    const re = new RegExp(app.match(/return \/(\[\?&\]\(game\|[^/]+)\/\.test\(window\.location\.search/)[1]);
    for (const q of ['?game=daily', '?game=footle&x=1', '?utm=a&club=arsenal', '?quiz=premier-league', '?join=ABC234', '?c=xyz', '?tab=profile', '?stump=q_ab12']) expect(re.test(q), q).toBe(true);
    for (const q of ['', '?code=abc&state=def', '?utm_source=x', '?gameplay=1', '?l=token']) expect(re.test(q), q).toBe(false);
  });
  it('the sheet is dropped, and cleared, when the page opened on something', () => {
    const init = app.slice(app.indexOf('const [leagueSheet, setLeagueSheetRaw] = useState(() => {'), app.indexOf('const setLeagueSheet = useCallback('));
    expect(init).toContain('if (openedOnSomething()) { writeLeagueUiInline(null); return null; }');
    expect(init.indexOf('openedOnSomething()')).toBeLessThan(init.lastIndexOf('return v;'));
  });
  it('and so is a stored "open this table"', () => {
    expect(app).toContain('if (v && v.kind === "open" && v.id) { if (openedOnSomething()) writeLeagueUiInline(null); else openLeagueTable(v.id); }');
  });
});
