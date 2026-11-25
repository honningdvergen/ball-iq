// i18n step 4: every user-visible string on the finish panels (DailyDone,
// ResultFoot, ChallengeBanner), the results screens, the answer review, the
// History tab, Profile, Settings and Onboarding goes through t()
// (src/i18n/en.js), with Spanish in es.js.
//
//   • ENGLISH IS BYTE-IDENTICAL. Each surface is rendered in the states listed
//     in i18n-screens.scenarios.js and compared with i18n-screens.golden.json:
//     the markup the same scenarios produced on main before step 4 (12708880).
//     Do not regenerate the golden to make this pass: a diff here IS an
//     English regression. (The five "challenge banner" entries were replaced
//     on purpose on 18 Nov 2026, twice: when the floating pill became the
//     header's second line, and when that line became a chip. ChallengeBanner.jsx
//     says why. Nothing else was touched.)
//     (Three finish-panel entries were replaced on purpose on 21 Nov 2026, when
//     the reminder's unlabelled bell became a labelled button under the streak
//     row for a player's first days: "dd: footle won in 3, everything on,
//     loading" and the two Daily 7 results. DailyDone.jsx says why. The only
//     difference in each is that button.)
//   • Every key step 4 added is pinned to its exact English
//     (i18n-screens.keys.js), and the tables the game keeps in English for
//     its share texts (levels, tiers, badges, verdicts …) must agree with them.
//   • Spanish renders with biq_lang=es, with no step 4 English left.
// INTENDED CHANGE, 25 Nov 2026 (the SIGNED-IN Profile on a phone; Alex, on its drawing: "Yes, build it").
// Eleven entries were replaced, and only those: the eleven signed-in Profile entries (every "profile: ..."
// that is not a guest's or the invite-link player's). The new render was dumped with a temporary copy of
// this test; 87 of 98 entries were byte-identical, among them the three not-signed-in Profile entries and
// every friend entry (the shared card component gained a `kit` switch, which only the signed-in phone
// column turns on). For each of the eleven a script cut the old and the new entry at the same two
// landmarks (<div class="profile-mobile-identity"> and <div class="profile-col-right">, each asserted to
// be there exactly once) and proved: (1) everything before the phone column is byte-identical (the wide
// window's header, rating card and league grid); (2) everything after it (the wide window's scouting card
// and Share, the ladder in full, the friends block, the badge grid and whichever sheet the scenario has
// open) is byte-identical once " pd-wide-only" is taken off the class of the column under the two, where
// it appears exactly once; (3) so only the phone column differs. There the card is set in the screen's
// sizes with the rank and the kind of player on one line and "Share my card" inside it, and under it are
// the Mates card, Next up and one Badges row where the Share bar, the scouting report (or the "No stats
// yet" box) stood. Three entries were ADDED, for the screens behind that column's rows: "profile: signed
// in, the ladder at the top rank", "profile: signed in, the badge wall open on a badge" and "profile:
// signed in, the mates screen with requests and a search" (101 entries in all). The scenarios' state keys
// moved with the code: FriendsSection's state is the useFriends hook's now, in the same order
// ("useFriends:3" where "FriendsSection:3" was), with `loaded` added last (7), and ProfileScreenImpl has
// one more, `sub` (10), after the ten that were there. tests/unit/profile-signed-in.test.js holds what
// the new column shows.
// INTENDED CHANGE, 25 Nov 2026, later (the follow-up to that screen). Thirteen entries were replaced,
// and only those: every signed-in Profile entry but the ladder. The new render was dumped with a
// temporary copy of this test; 88 of 101 entries were byte-identical, and in each of the thirteen
// everything outside the phone column (cut at the same two landmarks as before) is byte-identical,
// proven by script; the wide window's badge grid keeps its twelve tiles. Inside the phone column
// exactly these moved: (1) in the eleven entries that show the card, one inline value on the league
// row's arrow (margin-left:5px is margin-left:var(--bq-chev, 5px), the same 5px unless the stylesheet
// brings it in at 320 wide for "BUNDESLIGA"); (2) the Badges row counts the badges that can be won
// ("4 of 11" where it read "4 of 12": Globetrotter has no rule in computeBadges); (3) the badge wall
// has eleven tiles and its heading says "4 of 11"; (4) the mates screen's field and heading say
// "Find a mate by username…" and "Your mates" where they said friend and friends.
// INTENDED CHANGE, 25 Nov 2026 (the Profile of a player who is NOT signed in; Alex: "good, build when
// ready please"). Three entries were replaced, and only those: "profile: guest, first visit (the
// example card)", "profile: guest, 4 answered, example dismissed" and "profile: anonymous invite
// player, rated". The new render was dumped with a temporary copy of this test; 95 of 98 entries were
// byte-identical, every signed-in Profile entry among them (that screen is not approved and must not
// move). For each of the three a script cut the OLD entry at its own landmarks (each asserted to be
// there exactly once) and rebuilt the new one from the old entry's own bytes with only these regions
// swapped for the new render's, byte for byte equal to the new render: (1) first visit: the EXAMPLE
// pop-up, the "No stats yet" box, the journey ladder and the empty badge grid are gone, the "?" card
// is the card in gold and not yet unlocked ("10 answers to unlock your card", ten empty segments), and
// the framed "Saved on this phone only" row is a row for today's Daily 7, the solid "Create free
// account" and its line; (2) four answers: the same card with four segments lit and "6 answers", the
// row is the started Footle ("Continue"), and the Share row carries the class gp-quiet, with the
// scouting report, journey and badges untouched; (3) the invite-link player, rated: on the real card
// the green default face with its pencil is a shirt in a ring, the "Save this account" row is the
// button ("Save my account") and its line, and the Share row carries gp-quiet; nothing else. The two
// guest scenarios gained an `openDailies` prop (i18n-screens.scenarios.js), which only this state reads.
// INTENDED CHANGE, 25 Nov 2026 (the ordinary quiz ends on the result card; Alex chose variant B of
// the drawn rounds and said "Yeah go ahead"). Eight entries were replaced, and only those: the eight
// results that are not a Daily 7 ("results: classic 7/10, new best over 5, footle open", "results:
// classic 3/10, daily open (the daily is the primary), one more to rate", "results: legends 10/10,
// footle done, just rated", "results: chaos 5/10, rated and moved", "results: chaos 2/10, rating
// held", "results: survival 0 (first-question death)", "results: survival 12, new best over 8",
// "results: speed 4/10 with a winner"). The new render was dumped with a temporary copy of this
// test; 90 of 98 entries were byte-identical. For each of the eight a script took the OLD entry's
// phone layout apart (each part asserted to be there exactly once) and rebuilt the new one from the
// old entry's own content, byte for byte equal to the new render, with the wide-screen card after
// it untouched: (1) the arrow in the corner is the arrow alone in the finish header's row; (2) the
// text header ("Final score" or the quiz's name, the 88px number, the tagline, the best run, the
// personal best, the XP) is the result card: the game named on its top line (with a club's name
// after it), the number (no "/N" on a Survival run), the old tagline as the verdict ("in a row" /
// "Run over" on Survival), the XP under it, the ten marks where the answers on hand add up to the
// score (read off the wide-screen card's own dots), the personal best and best run as the line
// under them, and one Share button ("Share my N/10"; "Share my result" at 30 percent or under and
// on Survival); (3) a winner's line is carried over whole; (4) the outlined rating box is one
// caption line with the old box's own words and numbers, without the spaced "Ball IQ" label (a
// rating that moved keeps "Ball IQ" as plain words); (5) the buttons are one list: a daily not yet
// played with Play, then "Play again" / "Go again". Two differ from the old primary on purpose:
// with the Daily 7 and a started Footle both open, Footle leads (it is played more), and a Survival
// death on the first question, which offered no daily, offers one second; (6) "Back to Home" is the
// filled pill, the missed list is carried over whole, and the pill follows it again.
// INTENDED CHANGE, 25 Nov 2026 (Share is one button that sends one message; Alex: "Yes, build it"): on
// the classic finish panel of a game with a puzzle link (Footle, Transfer Trail, Top 10) the solid
// "Send it to a mate", the line under it and the quiet "Just share my result" are ONE solid Share.
// Eleven entries were replaced, and only those (every "dd: ..." panel of those three games): the new
// render was dumped with a temporary copy of this test, 87 of 98 entries were byte-identical, and each
// of the eleven equals, byte for byte, its old entry with these edits made by script: (1) in the seven
// with no mate's challenge waiting, <button class="dd-share">lucide-swords, " Send it to a mate"
// </button><p class="dd-share-note">They get the same puzzle and try to beat you.</p> becomes <button
// class="dd-share" aria-label="Share your result">lucide-share, " Share result"</button>, the very
// markup the Mystery panel's button has; (2) in all eleven the quiet button under it is gone
// (<button class="dd-share-alt">: "Just share my result", "Shared" in "dd: shared, no label", and
// "Share result" in the four where a mate's challenge waits, whose solid "Send it back" is untouched);
// (3) in six of them the row that held it (<div class="dd-share-alts">) held nothing else and is gone
// too. The Daily 7 and Mystery panels, which never had a second way, are byte-identical.
// INTENDED CHANGE, 25 Nov 2026 (the missed list is one card per question): on a finish, "N you missed"
// was one outlined box of rows; each miss is now its own card (components/WrongAnswersReview.jsx says
// why). Four entries were replaced, and only those (the four results with a missed list: "results:
// classic 7/10, new best over 5, footle open", "results: classic 3/10, daily open (the daily is the
// primary), one more to rate", "results: survival 12, new best over 8" and "results: daily 7 on 5,
// the panel"): the new render was dumped with a temporary copy of this test, 94 of 98 entries were
// byte-identical, and each of the four equals, byte for byte, its old entry with the two lists in it
// (phone and wide screen) rebuilt by script from their own pieces. The rules: <div class="wrong-review">
// becomes <div class="wm-list">; each row (number, question, right answer, "Your answer: …" when there
// was one, explanation when there was one, flag) becomes a card of the same pieces in a new order
// (<span class="wm-n">Question N</span> and the flag on one line, the question, the right answer after
// lucide's tick, the player's answer after lucide's cross, the explanation); the flag's button is
// unchanged but for its inline box (36 by 36 with margin -6px -8px 0 0 and a 10px corner becomes 44 by
// 44 with margin -12px -12px -12px 0 and a 12px corner). N is the question's own number where the
// scenario's answers add up with its list (the Daily 7: 6 and 7) and the list's own count where they
// do not (the other three). The heading and everything outside the lists are untouched, and the three
// "review: daily 7 ..." entries, whose rows share the old class names, are byte-identical.
// INTENDED CHANGE, 25 Nov 2026 (a way out at the bottom): a Daily 7 with questions missed ends on a
// second "Back to Home" pill under the last missed question. One entry was replaced, and only that
// one ("results: daily 7 on 5, the panel", the only Daily 7 result here whose phone layout has a
// missed list): the new render was dumped with a temporary copy of this test, 97 of 98 entries were
// byte-identical, and the one differs by exactly the first pill's own markup repeated at the end of
// the phone layout, proven by inserting it into the old entry by script and comparing byte for byte.
// The wide-screen card is untouched.
// INTENDED CHANGE, 25 Nov 2026 (the reminder goes quiet): on the two card finishes the reminder asked
// for in words is a quiet line with a small "Turn on" pill, not a wide yellow button. Two entries
// were replaced, and only those ("results: daily 7 on 5, the panel" and "results: daily 7 on 7", the
// two that show the ask): the new render was dumped with a temporary copy of this test, 96 of 98
// entries were byte-identical, and in each of the two the only difference is that one element, proven
// by making the edit to the old entry by script (<button class="dd-remind" title=T>bell, WORDS</button>
// becomes <div class="dd-line is-ask"><span>WORDS</span><button class="dd-pill" aria-label="Turn on a
// daily reminder at 19:00" title=T>Turn on</button></div>) and comparing byte for byte. The classic
// panel's yellow button (Transfer Trail, Top 10: "dd: footle won in 3, everything on, loading") is
// untouched. The same day's flame-first streak chip changed no entry.
// (24 Nov 2026, after the independent review of the finishes: in the three "results: daily 7" entries the
// streak chip gained a wrapper, <span class="dd-stk-slot">, so the chip can give way to the day in a tight
// header. Proven by script to be the only difference; the other 95 entries are byte-identical.)
// INTENDED CHANGE, 24 Nov 2026 (round two of the finishes): the Daily 7 ends on the layout Footle
// has (Alex chose one drawing for both). The three "results: daily 7 ..." entries were replaced,
// and only those: the new render was dumped with a temporary copy of this test and 95 of 98
// entries were byte-identical. For each of the three, the phone layout of the OLD entry was taken
// apart by script into its pieces (the date, the streak and its shields, the card, the countdown,
// the next game, the reminder, the missed list) and the new phone layout was built from those
// pieces by the rules of the change; the result equals the new render byte for byte. The rules:
// the lone back arrow is a header (back, "Daily 7" with its day, "7 questions", the streak chip);
// the card loses its top line and gains the Share button ("Share my 5/7"; "Share my result" on a
// 1) and is otherwise unchanged, its XP included; the framed panel with its solid "Share result"
// is one caption ("Today 3 of 4", the countdown) and one list row ending in Play, with the
// reminder button under the list; Back to Home is the filled pill and comes before the missed
// list. The wide-screen card after the phone layout is byte-identical in all three.
// INTENDED CHANGE, 24 Nov 2026 (the grade fixes): the day's dashes on a finish panel fill from
// the left in one colour (one finished Daily 7 lit the SECOND dash and read "step 2 of 4"). Nine
// entries were replaced, and only those (every panel that draws the bar: the seven "dd: ..." game
// panels with a day and the two "results: daily 7 ..."): the new render was dumped with a
// temporary copy of this test, 89 of 98 entries were byte-identical, and in each of the nine the
// only difference is inside .dd-day-bar, proven by making the edit to the old entry by hand (each
// dash loses its inline --dd-c, and the lit dashes come first, a lost one last of the lit).
// INTENDED CHANGE, 24 Nov 2026 (later): the Daily 7's XP is on its result card, in yellow under
// the verdict. The three "results: daily 7 ..." entries were replaced, and only those: the new
// render was dumped with a temporary copy of this test and 95 of 98 entries were byte-identical.
// In each of the three, exactly four things differ, proven by making those four edits to the old
// entry by hand and comparing: the card's hero carries "is-foot"; the sentence under the verdict
// (.rc-sub) is the XP (.rc-xp); that sentence is the line under the marks (.rc-note; none of the
// three had a line of its own); and the streak row under the card no longer repeats the XP
// (.dd-trow and .dd-xp are gone, the title stands alone). The marks' new colours are stylesheet
// only and change no markup.
// INTENDED CHANGE, 24 Nov 2026: Stump a mate is no longer offered on a finish screen (26 shares and
// 2 answers since September; Alex: "let us maybe just scrap that idea"). Five entries lost exactly
// that button and nothing else, proven by deleting the button from the old golden: the Footle panel
// with everything on, the Daily 7 panel, and the classic 7/10, classic 3/10 and survival results.
// INTENDED CHANGE, 23 Nov 2026: numbers are Inter with tabular figures, not the
// mono face (its dotted zero read as an eight). Six History entries changed in
// one inline font-family only, proven by replacing that string in the old golden.
// INTENDED CHANGE, 22 Nov 2026: the Daily 7 ends on the result card
// (components/ResultCard.jsx). In the three "results: daily 7 ..." entries the
// text header (eyebrow, 88px number, tier lines, XP line) is replaced by the
// card above the panel, the XP rides the streak's title line, and the crowd's
// row with its hairline is gone from the panel's foot. Checked entry by entry
// that the rest of each panel is byte-identical.
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const S = vi.hoisted(() => ({ calls: {}, state: null, auth: null }));
vi.mock('react', async (orig) => {
  const R = await orig();
  const { overriddenUseState } = await import('./i18n-screens.harness.js');
  const useState = overriddenUseState(S, R.useState);
  return { ...R, default: { ...R.default, useState }, useState };
});
// A static render cannot portal; the sheets Profile portals to document.body
// render in place instead.
vi.mock('react-dom', async (orig) => {
  const R = await orig();
  const createPortal = (c) => c;
  return { ...R, default: { ...R.default, createPortal }, createPortal };
});
vi.mock('../../src/useAuth.jsx', async (orig) => ({ ...(await orig()), useAuth: () => S.auth }));

const { stubGlobals, bootLang } = await import('./i18n-games.harness.js');
const { pinDefaultLocale, stubWalkableStorage } = await import('./i18n-screens.harness.js');
const { renderAll, buildScenarios } = await import('./i18n-screens.scenarios.js');
const { STEP4_EN } = await import('./i18n-screens.keys.js');
const { STEP5_EN } = await import('./i18n-leftovers.keys.js');
const { STEP6_EN } = await import('./i18n-last-english.keys.js');
const { STEP7_EN } = await import('./i18n-step7.keys.js');
const { t, getLang, __resetI18nForTests } = await import('../../src/i18n/index.js');
const { levelName, tierName, compName } = await import('../../src/i18n/names.js');
const en = (await import('../../src/i18n/en.js')).default;
const es = (await import('../../src/i18n/es.js')).default;
const { LEVELS } = await import('../../src/lib/scoring.js');
const { CARD_TIERS, CARD_COMPS } = await import('../../src/lib/ballIqCard.js');
const { BADGE_DEFS } = await import('../../src/screens/ProfileScreen.jsx');
const { REPORT_REASONS } = await import('../../src/lib/userReports.js');
const { dailyTierCopy, scoreTagline } = await import('../../src/lib/resultsCopy.js');
const { resultVerdict } = await import('../../src/lib/resultVerdict.js');
const { ONBOARD_SAMPLE } = await import('../../src/screens/OnboardingScreen.jsx');
const { comparisonLine } = await import('../../src/lib/dailyResults.js');
const { scoreLabel, challengeLine } = await import('../../src/lib/gameChallenge.js');
const { reportLabel } = await import('../../src/components/ResultFoot.jsx');
const { catLabel, CAT_LABELS, LEAGUE_QUIZ_SECTIONS } = await import('../../src/App.jsx');
const GOLDEN = JSON.parse(readFileSync(fileURLToPath(new URL('./i18n-screens.golden.json', import.meta.url)), 'utf8'));
const read = (p) => readFileSync(fileURLToPath(new URL(`../../src/${p}`, import.meta.url)), 'utf8');
// The first byte where two renders part, with context.
function firstDiff(was, now) {
  if (was === now) return null;
  let i = 0;
  while (was[i] === now[i]) i++;
  return `at ${i}\n  was: …${was.slice(Math.max(0, i - 80), i + 80)}…\n  now: …${String(now).slice(Math.max(0, i - 80), i + 80)}…`;
}

let store;
// Noon on 20 Oct 2026, as the golden was rendered.
beforeAll(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 20, 12, 0, 0));
  pinDefaultLocale();
  store = stubGlobals();
  stubWalkableStorage(store);
});
afterAll(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); __resetI18nForTests(); });

describe('English is byte-identical (golden markup from main before step 4)', () => {
  it('every scenario still has a golden, and nothing extra', () => {
    expect(buildScenarios().map(([name]) => name).sort()).toEqual(Object.keys(GOLDEN).sort());
  });
  it('the finish panels, results, review, History, Profile, Settings and Onboarding render exactly as before', async () => {
    __resetI18nForTests();
    await bootLang(store, null);
    expect(getLang()).toBe('en');
    const now = renderAll(S, store);
    for (const name of Object.keys(GOLDEN)) expect(firstDiff(GOLDEN[name], now[name]), name).toBe(null);
  });
  it('an explicit biq_lang=en is the same English', async () => {
    __resetI18nForTests();
    await bootLang(store, 'en');
    const now = renderAll(S, store);
    for (const name of Object.keys(GOLDEN)) expect(firstDiff(GOLDEN[name], now[name]), name).toBe(null);
  });
});

describe('the step 4 keys', () => {
  it('each one prints its pinned English', () => {
    for (const [k, v] of Object.entries(STEP4_EN)) expect(en[k], k).toBe(v);
  });
  it('the pinned list is every key step 4 added (from dd.aria up to step 5\'s, i18n-leftovers.keys.js)', () => {
    const keys = Object.keys(en);
    expect(keys.slice(keys.indexOf('dd.aria')).filter((k) => !Object.hasOwn(STEP5_EN, k) && !Object.hasOwn(STEP6_EN, k) && !Object.hasOwn(STEP7_EN, k)).sort()).toEqual(Object.keys(STEP4_EN).sort());
  });
  it('each one has a Spanish value', () => {
    expect(Object.keys(STEP4_EN).filter((k) => typeof es[k] !== 'string' || !es[k])).toEqual([]);
  });
  it('product names stay untranslated in Spanish', () => {
    for (const k of Object.keys(STEP4_EN)) {
      for (const name of ['Footle', 'Daily 7', 'Transfer Trail', 'Mystery Player', 'Top 10', 'Draft', 'Ball IQ']) {
        if (en[k].includes(name)) expect(es[k], `${k} keeps "${name}"`).toContain(name);
      }
    }
    // The shared vocabulary: Hot Streak = Crono, Survival = A muerte.
    for (const k of ['hs.newBest', 'st.r6', 'bd.speed_demon.d']) expect(es[k], k).toContain('Crono');
    for (const k of ['hi.survNever', 'bd.survivor.d']) expect(es[k], k).toContain('A muerte');
  });
});

// The game keeps some of these words in English tables, for share texts and
// the share card that go to someone else. The keys must say what they say.
describe('the English tables and their keys agree', () => {
  beforeAll(async () => { __resetI18nForTests(); await bootLang(store, null); });
  it('levels, tiers, competitions, badges and report reasons', () => {
    expect(LEVELS.map((l) => levelName(l.name))).toEqual(LEVELS.map((l) => l.name));
    expect(levelName('Not a level')).toBe('Not a level');
    for (const tier of Object.keys(CARD_TIERS)) expect(tierName(tier), tier).toBe(CARD_TIERS[tier].label);
    for (const c of CARD_COMPS) {
      expect(compName(c), c.cat).toBe(c.name);
      expect(compName(c, true), `${c.cat} short`).toBe(c.short || c.name);
    }
    for (const [id, , name, desc] of BADGE_DEFS) {
      expect(t(`bd.${id}`), id).toBe(name);
      expect(t(`bd.${id}.d`), `${id} desc`).toBe(desc);
    }
    for (const r of REPORT_REASONS) expect(t(`pf.rr.${r.value}`), r.value).toBe(r.label);
  });
  it('the result tiers and verdicts', () => {
    for (let s = 0; s <= 7; s++) {
      const band = ['h0', 'h1', 'h2', 'h3', 'h4'].findIndex((h) => t(`d7.${h}`) === dailyTierCopy(s, 7).headline);
      expect(band, `${s}/7`).toBeGreaterThanOrEqual(0);
      expect(t(`d7.s${band}`)).toBe(dailyTierCopy(s, 7).sub);
    }
    for (let p = 0; p <= 100; p++) expect([0, 1, 2, 3, 4].map((i) => t(`tag.${i}`))).toContain(scoreTagline(p));
    expect([100, 80, 60, 40, 0].map((p) => t(`rv.${p}`))).toEqual([100, 80, 60, 40, 0].map(resultVerdict));
  });
  it('the onboarding question, and the category names', () => {
    expect(t('ob.q')).toBe(ONBOARD_SAMPLE.q);
    for (const c of Object.keys(CAT_LABELS)) expect(catLabel(t, c), c).toBe(CAT_LABELS[c]);
    for (const s of LEAGUE_QUIZ_SECTIONS) for (const it of s.items) expect(catLabel(t, it.cat), it.cat).toBe(it.name);
  });
});

// Strings no static render reaches (a toast, a fetch, a lib line), and the ones
// built from parts: each must still print the old English.
describe('English that only appears after a tap or is built from parts', () => {
  beforeAll(async () => { __resetI18nForTests(); await bootLang(store, null); });
  it('the line about everyone else', () => {
    const e = (o) => Object.entries(o).map(([b, c]) => [Number(b), c]);
    expect(comparisonLine(e({ 3: 5, 4: 10 }), 15, { outOf: null, mine: 3, won: true })).toBe('Only 33% matched you');
    expect(comparisonLine(e({ 3: 1, 4: 10 }), 11, { outOf: null, mine: 3, won: true })).toBe('Nobody did better');
    expect(comparisonLine(e({ 2: 10, 3: 50, 4: 40 }), 100, { outOf: null, mine: 3, won: true })).toBe('Same as 50% of players');
    expect(comparisonLine(e({ 1: 5, 2: 10, 4: 85 }), 100, { outOf: null, mine: 2, won: true })).toBe('Top 15%');
    expect(comparisonLine(e({ 2: 30, 4: 30, 5: 40 }), 100, { outOf: 7, mine: 4, won: true })).toBe('Better than 30%');
  });
  it('the challenge lines: the banner in the language, the outgoing text in English', () => {
    expect(challengeLine({ game: 'footle', score: 3, name: 'Alex' })).toBe('Alex solved it in 3');
    expect(challengeLine({ game: 'top10', score: 7, name: '' })).toBe('A mate got 7/10');
    expect(challengeLine({ game: 'trail', score: 0, name: 'Jo' })).toBe('Jo missed this one');
    expect(challengeLine({ game: 'trail', score: 1, name: 'Jo' })).toBe('Jo got him with 1 club');
    expect(challengeLine({ game: 'trail', score: 2, name: 'Jo' })).toBe('Jo got him with 2 clubs');
    expect([scoreLabel('trail', 1, t), scoreLabel('trail', 3, t), scoreLabel('trail', 0, t)]).toEqual(['1 club', '3 clubs', 'missed']);
    expect(reportLabel('Career')).toBe('Career looks wrong? Tell us');
  });
  it('the toasts and the sheets a tap opens', () => {
    expect(t('pf.newReq', { name: 'Sam' })).toBe('📩 New friend request from Sam');
    expect(t('pf.reqSent', { name: 'Sam' })).toBe('Friend request sent to Sam ✉️');
    expect(t('st.signOutBody', { app: 'Ball IQ' })).toBe('Sign out of your Ball IQ account on this device? Your progress stays synced — sign back in any time to pick up where you left off.');
    expect(t('ob.wrong', { a: ONBOARD_SAMPLE.o[ONBOARD_SAMPLE.a] })).toBe("It's Cristiano Ronaldo — the all-time record holder. You'll pick these up fast!");
    expect(t('rw.solvedIn', { count: 1 })).toBe('Solved in 1 guess');
    expect(t('rw.solvedIn', { count: 4 })).toBe('Solved in 4 guesses');
    expect([1, 2, 3, 4, 5, 6].map((n) => t(`rw.t${n}`))).toEqual(['Incredible', 'Excellent', 'Great', 'Good', 'Phew', 'Just made it']);
    expect(t('dd.shieldsAria', { count: 1 })).toBe('1 streak shield banked: each covers one missed day');
    expect(t('dd.shieldsAria', { count: 2 })).toBe('2 streak shields banked: each covers one missed day');
    expect(t('dd.today', { g: 'Top 10' }) + ' / ' + t('dd.contToday', { g: 'Footle' })).toBe("Today's Top 10 / Continue today's Footle");
    expect(`Non-League · 120 XP${t('dd.toNext', { n: 180, name: 'Championship' })}`).toBe('Non-League · 120 XP · 180 to Championship');
    expect(t('hi.gapN', { a: 'Oct 12', b: 'Oct 17', n: 6 })).toBe('6 days off');
    expect(t('pf.badgeAria', { name: 'Scholar', s: t('pf.locked') })).toBe('Scholar — locked. Tap for details.');
    expect(t('cf.prov', { c: 'International', r: 61, n: 4, min: 10 })).toBe('International 61, provisional — 4 of 10 answered');
  });
});

describe('Spanish (biq_lang=es)', () => {
  let now;
  beforeAll(async () => {
    __resetI18nForTests();
    await bootLang(store, 'es');
    expect(getLang()).toBe('es');
    now = renderAll(S, store);
  });
  afterAll(() => { __resetI18nForTests(); });
  // Unescaped, and without React's text-node separators: "Récord personal (antes 5)".
  const unq = (s) => s.replace(/<!-- -->/g, '').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');
  it(`no English string of a step 4 key is left in any of the ${Object.keys(GOLDEN).length} renders`, () => {
    // Whole-string English values, as a text node or an attribute. Values the
    // same in both languages are skipped, and so is what the scenarios pass in
    // themselves (a host's streak label, a "Next up" name, a save line, a
    // player called "Unknown"): the app hands those over translated.
    const english = Object.keys(STEP4_EN).filter((k) => es[k] !== en[k] && !/\{\w+\}/.test(en[k]) && !/^dd\.l\./.test(k) && k !== 'pf.unknown').map((k) => en[k]);
    const left = [];
    for (const [name, markup] of Object.entries(now)) {
      const m = unq(markup);
      for (const e of english) if (m.includes(`>${e}<`) || m.includes(`="${e}"`)) left.push(`${name}: "${e}"`);
    }
    expect(left).toEqual([]);
  });
  it('the finish panel', () => {
    const won = unq(now['dd: footle won in 3, everything on, loading']);
    for (const s of ['Mañana serán <', '> · nuevos retos en <', '>Recuérdamelo cada día a las 19:00<', 'Asciendes a <strong>Regional<', 'aria-label="Compartir tu resultado"', ' Compartir resultado<', '>Ahora toca', '>Siete preguntas · 3 min<', '>Jugar<', ' hechos<', 'aria-label="Tras el reto de hoy"']) expect(won, s).toContain(s);
    // 25 Nov 2026: one Share button; the two old ways and the note under the first are not drawn.
    for (const s of ['Envíaselo a un colega', 'Recibe el mismo reto e intenta ganarte.', 'Solo compartir mi resultado']) expect(won, s).not.toContain(s);
    expect(unq(now['dd: footle lost, streak safe, reminder on, early numbers'])).toContain('>Racha a salvo<');
    expect(unq(now['dd: daily 7 on 5, headcounts'])).toContain('>Mejor que el 44%<');
    expect(unq(now['dd: daily 7 on 5, headcounts'])).toContain('>4,6/7<');
    expect(unq(now['dd: daily 7 on 5, headcounts'])).toContain('1240');
    expect(unq(now['dd: trail won on 2, yesterday stands in'])).toContain('"Ayer, N.º 74"');
    expect(unq(now['dd: trail won on 2, yesterday stands in'])).toContain('Llegas pronto hoy. <strong class="dd-num">77%</strong> resolvió el de ayer.');
    expect(unq(now['dd: top 10 on 7, a mate beat it'])).toContain('>Esta la gana Sam<');
    expect(unq(now['dd: trail missed, mate got it on 1'])).toContain('>fallado<');
    expect(unq(now['dd: mystery won, all done today (clean sweep)'])).toContain('>Pleno<');
    expect(unq(now['dd: guest save, 4-day streak, no line'])).toContain('>Tu racha de <strong class="dd-num">4 días</strong>: solo en este móvil.<');
    expect(unq(now['dd: shared, no label'])).toContain('>2 días de racha<');
    expect(unq(now['challenge banner: trail on 3 clubs'])).toContain('>3 clubes<');
    expect(unq(now['challenge banner: trail on 3 clubs'])).toContain('>¿Le ganas?<');
    expect(unq(now['resultfoot: career report and the way out'])).toContain('¿Trayectoria errónea? Avísanos');
  });
  it('the results', () => {
    const c = unq(now['results: classic 7/10, new best over 5, footle open']);
    // 25 Nov 2026: the quiz ends on the result card. "Resultado final" over the number is gone (the
    // card's top line names the game); the other dailies are a list row ("Footle de hoy") with "Jugar".
    for (const s of ['>Quiz<', '>Buena actuación.<', '>Récord personal (antes 5)<', 'Te faltan 3 respuestas para tener media', '>Footle de hoy<', '>Juega al Footle de hoy<', '>Jugar otra vez<', '>Otras 10 preguntas<', '>Compartir mi 7/10<', '>Repasa tus fallos (2)<', '>Ronda completada<', '>Clásico<', '>XP ganados<']) expect(c, s).toContain(s);
    expect(c).not.toContain('>Resultado final<');
    expect(unq(now['results: classic 3/10, daily open (the daily is the primary), one more to rate'])).toContain('Te falta 1 respuesta para tener media');
    // A Survival run on the card: the number, "seguidas" beside it, the best as the gold line.
    for (const s of ['>A muerte<', '>seguidas<', '>Récord personal (antes 8)<', '>Un fallo y se acaba<', '>Compartir mi resultado<']) expect(unq(now['results: survival 12, new best over 8']), s).toContain(s);
    expect(unq(now['results: daily 7 on 5, the panel'])).toContain('>Hoy había alguna difícil.<');
    expect(unq(now['hot streak: first run, 3'])).toContain('>Crono<');
    expect(unq(now['true or false: perfect 10'])).toContain('>Nivel Balón de Oro<');
  });
  it('the review', () => {
    const r = unq(now['review: daily 7 today, full review, day 1 streak']);
    for (const s of ['>Hoy · martes, 20 de octubre<', '>Repaso completo<', '>VERDADERO<', '>Tu respuesta: ', '>Se acabó el tiempo<', '>Escribiste: <', '>mié<']) expect(r, s).toContain(s);
    expect(unq(now['review: footle lost'])).toContain('>Mañana será otro día<');
    expect(unq(now['review: footle won in 4, clue, hard'])).toContain('>Resuelto en 4 intentos<');
  });
  it('History', () => {
    const h = unq(now['history: two weeks with gaps, yesterday open']);
    for (const s of ['>Historial<', '>Nuevos en<', '>1 día de racha<', '>HACE 2 SEM<', '>Días<', '>Ayer<', '>dom<', '>18 oct<', '>2 días libres<', '>1 escudo de racha listo<', '>5,0 / 7<']) expect(h, s).toContain(s);
    expect(unq(now['history: all done today, yesterday open, streak broke'])).toContain('>Se rompió tu racha de 9 días<');
    expect(unq(now['history: a new player, nothing played'])).toContain('Termina cualquiera de los cuatro retos de hoy');
  });
  it('Profile, a friend, blocked users', () => {
    const p = unq(now['profile: signed in, rated, friends and requests']);
    for (const s of ['>Perfil<', '>Tu Ball IQ<', ' Nivel europeo · 1640 XP<', '>MEDIA<', '>ORO<', '>Medias por liga<', '>Selecciones<', '>Informe del ojeador<', '>A mejorar<', ' Tu camino<', '>AQUÍ<', '>Faltan 1360 XP<', '>20.000 XP<', '>Solicitudes recibidas<', '>Puntos 900<', '>Clasificación de amigos<', '>TÚ<', '>Insignias: 4/12 conseguidas<', '>Velocista<', '>12 en Crono<', '>✓ Conseguida<']) expect(p, s).toContain(s);
    // 25 Nov 2026: the signed-in phone column. The scouting report's heading and its quoted verdict
    // left it (the wide window keeps its own "Informe del ojeador"); the verdict is the card's second
    // line, and the Mates card, Next up and the Badges row are under it.
    for (const s of ['>Nivel europeo · Especialista en Premier League<', 'Compartir mi carta<', '>Colegas<', '>Añadir colega<', '>1 solicitud<', '>Invitar<', '>Ahora toca<', '>Faltan 1360 XP<', '>Veterano<', '>1640 de 3000 XP<', '>Jugar<', '>Insignias<', '>4 de 11<']) expect(p, s).toContain(s);
    expect(p).not.toContain('"Especialista en Premier League"');
    const m = unq(now['profile: signed in, the mates screen with requests and a search']);
    for (const s of ['placeholder="Busca a un colega por su nombre…"', '>Solicitudes recibidas<', '>Aceptar<', 'aria-label="Rechazar"', '>Pendientes<', '>Tus colegas · 2<', '>Retar<']) expect(m, s).toContain(s);
    const l = unq(now['profile: signed in, the ladder at the top rank']);
    for (const s of ['>Tu camino<', '>Inmortal<', '>Nivel máximo alcanzado<', '>La escalera<', '>Estás aquí<']) expect(l, s).toContain(s);
    // 25 Nov 2026: a player who is not signed in no longer gets the EXAMPLE pop-up or the "?" card;
    // their card is the one not yet unlocked, with the account under it.
    const g0 = unq(now['profile: guest, first visit (the example card)']);
    for (const s of ['TU CARTA<', '>Pon tu nombre<', '>10 respuestas para desbloquear tu carta<', '>Daily 7 de hoy<', '>Jugar<', '>Crea tu cuenta gratis<', '>Tu carta, en cualquier móvil<', '>Entrar<']) expect(g0, s).toContain(s);
    expect(g0).not.toContain('>EJEMPLO<');
    const g4 = unq(now['profile: guest, 4 answered, example dismissed']);
    for (const s of ['>6 respuestas para desbloquear tu carta<', '>Footle de hoy<', '>Seguir<']) expect(g4, s).toContain(s);
    expect(unq(now['profile: anonymous invite player, rated'])).toContain('>Guardar mi cuenta<');
    expect(unq(now['profile: league picker open'])).toContain('>40 respondidas<');
    expect(unq(now['friend: loaded'])).toContain('>Retar a Jo<');
    expect(unq(now['friend: loaded'])).toContain(' El camino de Jo<');
    expect(unq(now['friend: report sheet'])).toContain('>Nombre ofensivo<');
    expect(unq(now['blocked users: none'])).toContain('>No has bloqueado a nadie.<');
  });
  it('Settings and Onboarding', () => {
    const s = unq(now['settings: signed in, native reminders, help rows']);
    for (const x of ['>Ajustes<', '>Cuenta<', '>Cerrar sesión<', '>Temporizador<', '>Avisos diarios<', '>Ayuda y preguntas frecuentes<', '>Acerca de<', '>Borrar mis estadísticas<', '>Eliminar cuenta<']) expect(s, x).toContain(x);
    expect(unq(now['settings: reset stats sheet'])).toContain('>Récord en Crono<');
    expect(unq(now['onboarding: answered wrong'])).toContain('Es Cristiano Ronaldo, el máximo goleador');
  });
  it('plurals and numbers in the Spanish way', () => {
    expect(t('hi.dayStreak', { count: 1 })).toBe('{n} día de racha');
    expect(t('rs.correctOf', { count: 1, n: 1, total: 10 })).toBe('1 acierto de 10');
    expect(t('gc.gotHim', { who: 'Jo', count: 2 })).toBe('Jo lo sacó con 2 clubes');
    expect(scoreLabel('trail', 1, t)).toBe('1 club');
    expect(challengeLine({ game: 'footle', score: 3, name: '' })).toBe('Un colega lo resolvió en 3');
    expect(levelName('Cult Hero')).toBe('Ídolo de culto');
    expect(tierName('silver')).toBe('PLATA');
  });
});

describe('no copy left behind in the source', () => {
  const FILES = ['components/DailyDone.jsx', 'components/ResultFoot.jsx', 'components/ChallengeBanner.jsx', 'components/WrongAnswersReview.jsx', 'components/BallIqCardFace.jsx', 'components/InstallCard.jsx', 'screens/ModeResults.jsx', 'screens/ResultsScreen.jsx', 'screens/ReviewScreens.jsx', 'screens/DailyScreen.jsx', 'screens/ProfileScreen.jsx', 'screens/SettingsScreen.jsx', 'screens/OnboardingScreen.jsx'];
  it('the step 4 screens print no English literal a step 4 key replaced', () => {
    // Not scanned: words that are also ids, data or the English tables kept
    // for share texts. ProfileScreen's BADGE_DEFS keeps the badges' English
    // (their keys are pinned above); "Player" is the server's default username;
    // "earned"/"locked"/" correct" are class names; ONBOARD_SAMPLE keeps its
    // English question, which the pre-boot shell in index.html must match.
    const DATA = new Set(['Save', 'Share', 'Rate', 'Player', 'Unknown', 'Install', 'Correct', 'correct', ' correct', 'missed', 'Help', 'earned', 'locked']);
    const kept = new Set([...BADGE_DEFS.flatMap(([, , n, d]) => [n, d]), ONBOARD_SAMPLE.q]);
    const literals = Object.values(STEP4_EN).filter((v) => !/\{\w+\}/.test(v) && v.trim().length > 3 && !DATA.has(v) && !kept.has(v));
    const found = [];
    for (const f of FILES) {
      // Code only: comments quote old copy on purpose.
      const code = read(f).replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
      for (const v of literals) {
        if (code.includes(`>${v}<`) || code.includes(`"${v}"`) || code.includes(`'${v}'`) || code.includes(`\`${v}\``) || new RegExp(`>\\s*${v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*<`).test(code)) found.push(`${f}: ${v}`);
      }
    }
    expect(found).toEqual([]);
  });
  it('each screen component subscribes to the language (useT/useLang), so a switch re-renders it', () => {
    for (const f of FILES) expect(read(f), f).toMatch(/useT\(\)|useLang\(\)/);
    const p = read('screens/ProfileScreen.jsx');
    for (const fn of ['function CropModal(', 'function FriendsSection(', 'function FriendProfileScreenImpl(', 'function BlockedUsersScreenImpl(', 'function ProfileScreenImpl(']) {
      expect(p.slice(p.indexOf(fn), p.indexOf(fn) + 1200), fn).toMatch(/const t = useT\(\);/);
    }
    const app = read('App.jsx');
    expect(app.slice(app.indexOf('export function ReviewQuestionCard('), app.indexOf('export function ReviewQuestionCard(') + 120)).toContain('const t = useT();');
    expect(app).toMatch(/const uiLang = useLang\(\);[\s\S]{0,200}const dailyDoneServices = useMemo/);
  });
  it('dates and numbers follow the language (fmtLocale), never a hard-coded undefined', () => {
    for (const f of ['screens/ReviewScreens.jsx', 'screens/DailyScreen.jsx', 'screens/ProfileScreen.jsx', 'components/DailyDone.jsx']) {
      // The one exception says so on its line: the Footle share card's date, English like its text.
      const code = read(f).split('\n').filter((l) => !l.includes('share card')).join('\n');
      expect(code, f).not.toMatch(/toLocale(Date)?String\(undefined/);
      expect(code, f).not.toMatch(/\.toLocaleString\(\)/);
    }
  });
  it('the share texts: step 5 put them in the sharer\'s language (i18n-leftovers.test.js pins their English); the card verdict stays English', () => {
    // 25 Nov 2026: the panel's message is the one share message, still in the sharer's language
    // (share.one.*, tests/unit/share-one-message.test.js); share.challenge stays in the table, unused.
    expect(read('components/DailyDone.jsx')).toContain('const { text, full } = shareMessage({ game, score: myScore, grid: challengeGrid, url });');
    expect(read('lib/shareMessage.js')).toMatch(/import \{ t \} from '\.\.\/i18n\/index\.js';/);
    expect(en['share.challenge']).toBe('{what} No. {edition}: {score}. Can you beat it?');
    expect(read('screens/SettingsScreen.jsx')).toContain('const text = t("share.app");');
    expect(en['share.app']).toBe('⚽ Ball IQ — the football quiz for real fans. https://balliq.app/get');
    expect(read('lib/resultVerdict.js')).toContain('"Ballon d\'Or form"');
  });
  it('es.js stays lazy: nothing in src/ imports it statically', () => {
    for (const f of [...FILES, 'App.jsx', 'i18n/names.js', 'lib/dailyResults.js', 'lib/gameChallenge.js', 'lib/resultsCopy.js']) {
      expect(read(f), f).not.toMatch(/from ['"][./]*i18n\/es\.js['"]|from ['"]\.\/es\.js['"]/);
    }
  });
  it('nothing the edge functions import pulls in i18n (api/og.js imports ballIqCard → scoring)', () => {
    for (const f of ['lib/ballIqCard.js', 'lib/scoring.js']) expect(read(f), f).not.toMatch(/i18n/);
  });
});
