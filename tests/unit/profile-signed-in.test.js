// The Profile tab for a SIGNED-IN player on a phone (25 Nov 2026; screens/ProfileScreen.jsx).
// Alex, of the scouting report it replaced: "This has to have value for the players, do they care
// about their accuracy, daystreak and longest run? I do not really think so?"; of a mates table that
// has already started, his own row first: "this i really liked actually a lot"; of the eighth drawing:
// "Yes, build it" (ball-iq-audit/2026-11-24/finish/profile-signed-in-8.png).
// What this file holds: what that player sees and no longer sees, that the wide window and the
// not-signed-in Profile kept their own, that nothing the friends block did was dropped, and the kit's
// rules for this screen (four type sizes, no outlines, no emoji). The sums behind the rows are in
// profile-next.test.js.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const read = (p) => readFileSync(fileURLToPath(new URL(`../../${p}`, import.meta.url)), 'utf8');
const PROFILE = read('src/screens/ProfileScreen.jsx');
const FACE = read('src/components/BallIqCardFace.jsx');
const CSS = read('src/screens/signedProfile.css');
const APPCSS = read('src/app.css');
const GOLDEN = JSON.parse(read('tests/unit/i18n-screens.golden.json'));
const EN = (await import('../../src/i18n/en.js')).default;
const ES = (await import('../../src/i18n/es.js')).default;

// The phone column of a render: what a phone shows (a wide window hides it and keeps its own cards).
const phoneOf = (g) => g.slice(g.indexOf('<div class="profile-mobile-identity">'), g.indexOf('<div class="profile-col-right">'));
const text = (s) => s.replace(/<!-- -->/g, '').replace(/<[^>]+>/g, '|').replace(/&#x27;/g, "'").replace(/&amp;/g, '&').replace(/\|+/g, '|');
const rated = phoneOf(GOLDEN['profile: signed in, rated, friends and requests']);
const alone = phoneOf(GOLDEN['profile: signed in, no friends yet, badge locked open, no rating yet']);

describe('what a signed-in player sees on a phone', () => {
  it('the card: the name with one pencil, one line under it, Share inside it', () => {
    expect(text(rated)).toContain('|Alex|');
    expect((rated.match(/lucide-pencil/g) || []).length, 'one pencil').toBe(1);
    // Rank and kind of player on ONE line; the XP and "Top N%" are off the card.
    expect(text(rated)).toContain('|Continental · Premier League Specialist|');
    expect(text(rated)).not.toMatch(/1,?640 XP|Top \d+%/);
    const card = rated.slice(0, rated.indexOf('home-section-title'));
    expect(card).toContain('class="sp-share"');
    expect(text(card)).toContain('|Share my card|');
    expect(rated, 'the solid green Share bar under the card').not.toContain('card-action-primary');
  });
  it('mates on rating, the player among them in their place, then the empty seat', () => {
    const mates = rated.slice(rated.indexOf('sp-mates'), rated.indexOf('>Next up<'));
    // Jo and Sam Lee carry no record in the scenario, so neither has a rating: a dash, after the
    // rated player, the higher total score first.
    expect(text(mates)).toMatch(/\|1\|Alex\|\d+\|2\|Jo\|–\|3\|Sam Lee\|–\|4\|Add a mate\|1 request waiting\|Invite\|/);
    expect((mates.match(/class="sp-mate is-me"/g) || []).length).toBe(1);
    // A mate's row is a button that opens their profile; the player's own row is not.
    expect(mates).toContain('<button type="button" class="sp-mate" aria-label="View Jo&#x27;s profile">');
    // Alone and nothing loaded yet: the player's row with no place printed, and the seat.
    const solo = alone.slice(alone.indexOf('sp-mates'), alone.indexOf('>Next up<'));
    expect(text(solo)).toMatch(/^[^|]*\|Alex\|–\|Add a mate\|Invite\|/);
  });
  it('next up: the next rank, the nearest badge, the weakest area with a Play; then one Badges row', () => {
    const next = text(rated.slice(rated.indexOf('>Next up<')));
    // 1,640 XP: Cult Hero is at 3,000. The nearest badge is Veteran (3,000 XP, 55% of the way),
    // ahead of Obsessed (day 6 of 30) and Faithful (24 of 50 games).
    expect(next).toMatch(/\|Cult Hero\|1,360 XP to go\|/);
    expect(next).toMatch(/\|Veteran\|1,640 of 3,000 XP\|/);
    expect(next).toMatch(/\|Needs work\|Legends · \d+\|Play\|/);
    expect(next).toMatch(/\|Badges\|4 of 12\|/);
    // No rating yet: no weakest area is named, so Next up is two rows.
    const cold = text(alone.slice(alone.indexOf('>Next up<')));
    expect(cold).not.toContain('Needs work');
    expect(cold).toMatch(/\|Cult Hero\|1,360 XP to go\|Veteran\|1,640 of 3,000 XP\|Badges\|0 of 12\|/);
  });
  it('gone from that page: the scouting report, the ladder in full, the friends block, the badge grid', () => {
    for (const p of [rated, alone]) {
      for (const gone of ['scouting-report', 'Scouting Report', 'Accuracy', 'Day streak', 'Best run', 'journey-section', 'friends-section', 'badges-section', 'No stats yet', 'YOU ARE HERE']) expect(p, gone).not.toContain(gone);
    }
    expect(EN['pf.noStats']).toBeUndefined(); expect(ES['pf.noStats']).toBeUndefined();
    expect(EN['pf.noStatsSub']).toBeUndefined(); expect(ES['pf.noStatsSub']).toBeUndefined();
  });
  it('no system emoji anywhere on it, on any of its screens', () => {
    const emoji = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{1F1E6}-\u{1F1FF}]/u;
    for (const k of Object.keys(GOLDEN).filter((n) => n.startsWith('profile: ') && !/^profile: (guest|anonymous)/.test(n))) {
      // The sheets a tap opens over the page (the photo menu, the league picker) are not this screen.
      const p = phoneOf(GOLDEN[k]);
      expect(emoji.test(p), `${k}: ${(p.match(emoji) || [])[0]}`).toBe(false);
    }
  });
});

describe('the screens behind its rows', () => {
  const ladder = phoneOf(GOLDEN['profile: signed in, the ladder at the top rank']);
  const wall = phoneOf(GOLDEN['profile: signed in, the badge wall open on a badge']);
  const mates = phoneOf(GOLDEN['profile: signed in, the mates screen with requests and a search']);
  it('each replaces the page and starts with a back arrow', () => {
    for (const p of [ladder, wall, mates]) {
      expect(p).toContain('<div class="hdr hdr-guest sp-top"><button type="button" class="icon-btn hdr-ic" aria-label="Back">');
      expect(p, 'the page is not drawn under it').not.toContain('sp-mates');
      expect(p).not.toContain('sp-share');
    }
  });
  it('the ladder: the rank held, the XP, a bar, every rank; at the top rank it says so', () => {
    expect(text(ladder)).toMatch(/\|Your Journey\|Immortal\|21,500 XP\|Top rank reached\|The ladder\|Sunday League\|0 XP\|/);
    expect(ladder).toContain('style="width:100%"');
    expect((ladder.match(/class="sp-rung is-done"/g) || []).length).toBe(7);
    expect(text(ladder)).toMatch(/\|Immortal\|20,000 XP\|You are here\|/);
    expect(ladder).not.toContain('XP to go');
  });
  it('the badge wall: twelve tiles, held first, and the tapped one says what it takes', () => {
    expect((wall.match(/class="sp-badge[ "]/g) || []).length).toBe(12);
    expect(text(wall)).toMatch(/^[^|]*\|Badges\| · \|4 of 12\|First Whistle\|On a Roll\|Speed Demon\|Perfectionist\|Obsessed\|/);
    expect(text(wall)).toMatch(/\|Obsessed\|30-day streak\|Locked\|$/);
  });
  it('the mates screen does everything the friends block did', () => {
    const t = text(mates);
    expect(mates).toContain('placeholder="Find a friend by username…"');
    expect(t).toMatch(/\|Joan\|Score 1,234\|Add\|/);                       // a found player, and the ask
    expect(t).toMatch(/\|Incoming requests\|Kim\|Score 900\|Accept\|Pending\|/);          // Decline is the round cross beside it
    expect(mates).toContain('<button type="button" class="t7s-cta sp-quiet sp-no" aria-label="Decline">');
    expect(t).toMatch(/\|Pending\|Rob\|Pending…\|Cancel\|/);
    expect(t).toMatch(/\|Your friends · 2\|Jo\|Score 5,200\|Challenge\|Sam Lee\|Score 1,800\|Challenge\|/);
    expect(mates).toContain('<button type="button" class="mp-row-open" aria-label="View Jo&#x27;s profile">');
    // One source for both: the wide block and this screen draw what the same hook holds.
    expect(PROFILE).toContain('const fr = useFriends({ userId: (user && !isGuest) ? user.id : null, onToast });');
    expect((PROFILE.match(/useFriends\(\{/g) || []).length).toBe(2); // its definition and that one call
    for (const call of ['sendRequest(r)', 'setStatus(f.id, "accepted")', 'setStatus(f.id, "declined")', 'cancelRequest(f.id)', 'onOpenFriend && onOpenFriend(p)', 'onChallenge && onChallenge(p)', 'onClick={loadFriendships}', 'onClick={onShareProfile}']) {
      const manage = PROFILE.slice(PROFILE.indexOf('function MatesManage('), PROFILE.indexOf('// ─── PROFILE SCREEN ───'));
      expect(manage, call).toContain(call);
    }
  });
  it('back closes the open screen first: the hook every sheet uses, so App.jsx\'s back handler finds it', () => {
    expect(PROFILE).toContain('useModalA11y({ isOpen: subOpen, onClose: closeSub, ref: subRef, focusContainer: true });');
    expect(PROFILE).toContain('const subOpen = !!sub && !guestView && isActiveTab;');
    expect(PROFILE).toContain('useEffect(() => { if ((!isActiveTab || guestView) && sub) setSub(null); }, [isActiveTab, guestView, sub]);');
    expect(read('src/App.jsx')).toMatch(/if \(closeTopModal\(\)\) return;/);
    // The strip over the tab steps aside only while one is open, and the class leaves with it.
    expect(PROFILE).toContain('root.classList.add("pf-sub");');
    expect(PROFILE).toContain('root.classList.remove("pf-sub");');
    expect(CSS).toContain('html.pf-sub .hdr:not(.sp-top){display:none !important;}');
  });
});

describe('the wide window and the not-signed-in Profile kept their own', () => {
  it('a signed-in player\'s lower column is the wide window\'s alone, shown exactly where .pd-left is', () => {
    expect(PROFILE).toContain('<div className={guestView ? "profile-col-below" : "profile-col-below pd-wide-only"}>');
    expect(APPCSS).toContain('.profile-col-below.pd-wide-only{display:none;}');
    expect(APPCSS).toContain('  .profile-col-below.pd-wide-only { display: block; }');
    expect(APPCSS).toContain('  .pd-hdr, .pd-left, .profile-col-right, .profile-col-below.pd-wide-only { display: none !important; }');
    // It is still rendered for the wide window, whole: the ladder, the friends block, the badge grid.
    const g = GOLDEN['profile: signed in, rated, friends and requests'];
    const below = g.slice(g.indexOf('<div class="profile-col-below pd-wide-only">'));
    for (const kept of ['journey-section', 'friends-section', 'friends-lb', 'badges-section', 'badge-detail-card']) expect(below, kept).toContain(kept);
    // A not-signed-in player's column does not carry the class.
    for (const k of ['profile: guest, 4 answered, example dismissed', 'profile: anonymous invite player, rated']) expect(GOLDEN[k], k).not.toContain('pd-wide-only');
  });
  it('the kit sizes on the card are asked for by this screen alone', () => {
    expect(PROFILE).toContain('kit={!guestView}');
    expect(FACE).toContain('kit = false, footer }');
    // A friend's card and a not-signed-in player's: 86 for the rating, 21 for the six, as before.
    for (const k of ['friend: loaded', 'profile: anonymous invite player, rated']) {
      expect(GOLDEN[k], k).toContain('font-size:86px');
      expect(GOLDEN[k], k).not.toContain('font-size:92px');
    }
  });
  it('the stylesheet starts every rule at the signed-in phone column', () => {
    const body = CSS.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@media[^{]*\{/g, '').replace(/\}\s*\}/g, '}');
    const selectors = [...body.matchAll(/([^{}]+)\{[^{}]*\}/g)].flatMap((m) => m[1].split(',')).map((s) => s.trim()).filter(Boolean);
    expect(selectors.length).toBeGreaterThan(60);
    for (const s of selectors) expect(/^\.profile-screen (\.sp$|\.sp[ .]|\.sp-|button\.sp-)|^html\.pf-sub \.hdr:not\(\.sp-top\)$/.test(s), s).toBe(true);
  });
});

describe('the kit\'s rules on this screen', () => {
  it('type at 11, 13.5, 16 and 24, and nothing between (the rating is the card\'s own 92)', () => {
    const sizes = new Set([...CSS.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/font-size:([\d.]+)px/g)].map((m) => m[1]));
    expect([...sizes].sort((a, b) => a - b)).toEqual(['11', '13.5', '16']); // 24 is the name's, from the kit's own .gp-name
    expect(read('src/screens/guestProfile.css')).toMatch(/\.profile-screen \.gp-name\{[^}]*font-size:24px;/);
    // On the page itself (rated, with mates): every size set inline is one of the card's.
    const inline = new Set([...rated.matchAll(/font-size:([\d.]+)px/g)].map((m) => m[1]));
    expect([...inline].sort((a, b) => a - b)).toEqual(['11', '16', '92']);
  });
  it('filled, not outlined; no glow', () => {
    const code = CSS.replace(/\/\*[\s\S]*?\*\//g, '');
    expect(code).not.toMatch(/border:1(\.5)?px solid var\(--border/);
    expect(code).toMatch(/\.profile-screen \.sp \.t7s-icon\{border:0;\}/);
    // The only shadows are lines inside a fill and the ring round the rung the player stands on.
    for (const m of code.matchAll(/box-shadow:([^;}]+)/g)) expect(/^(none|inset 0 0 0 [\d.]+px |0 0 0 5px rgba\(255,193,7,0\.18\)$)/.test(m[1]), m[1]).toBe(true);
  });
  it('yellow is called yellow', () => {
    const fresh = PROFILE.slice(PROFILE.indexOf('// ─── THE SIGNED-IN PROFILE ON A PHONE: ITS ROWS'), PROFILE.indexOf('// ─── PROFILE SCREEN ───'))
      + PROFILE.slice(PROFILE.indexOf('// ── THE SIGNED-IN PHONE COLUMN'), PROFILE.indexOf('  return (\n    <div className="tab-content profile-screen"'));
    for (const src of [CSS, fresh, read('src/lib/profileNext.js')]) expect(/amber/i.test(src)).toBe(false);
  });
  it('the mates query brings what a rating is computed from, and no more', () => {
    expect(PROFILE).toContain('const who = "id,username,avatar:avatar_id,photo:avatar_url,total_score,correct_answers,stats";');
  });
});

describe('the words', () => {
  it('every new line, in both languages', () => {
    const want = {
      'sp.share': ['Share my card', 'Compartir mi carta'],
      'sp.mates': ['Mates', 'Colegas'],
      'sp.addMate': ['Add a mate', 'Añadir colega'],
      'sp.reqWaiting_one': ['{n} request waiting', '{n} solicitud'],
      'sp.reqWaiting_other': ['{n} requests waiting', '{n} solicitudes'],
      'sp.matesFail': ['Could not load', 'Sin cargar'],
      'sp.topRank': ['Top rank reached', 'Nivel máximo alcanzado'],
      'sp.badges': ['Badges', 'Insignias'],
      'sp.nOfM': ['{n} of {m}', '{n} de {m}'],
      'sp.earned': ['Earned', 'Conseguida'],
      'sp.bd.day': ['Day {n} of {m}', 'Día {n} de {m}'],
      'sp.bd.best': ['Best {n} of {m}', 'Mejor marca: {n} de {m}'],
      'sp.bd.games': ['{n} of {m} games', '{n} de {m} partidas'],
      'sp.bd.correct': ['{n} of {m} correct', '{n} de {m} aciertos'],
      'sp.bd.xp': ['{n} of {m} XP', '{n} de {m} XP'],
      'sp.ladder': ['The ladder', 'La escalera'],
      'sp.here': ['You are here', 'Estás aquí'],
      'sp.xpTo': ['{n} XP to {name}', 'Faltan {n} XP para {name}'],
    };
    for (const [k, [en, es]] of Object.entries(want)) { expect(EN[k], k).toBe(en); expect(ES[k], k).toBe(es); }
    expect(Object.keys(EN).filter((k) => k.startsWith('sp.')).sort()).toEqual(Object.keys(want).sort());
    // Every one of them is drawn: a key nothing reads is a key to remove.
    for (const k of Object.keys(want)) {
      const stem = k.replace(/_(one|other)$/, '');
      const used = PROFILE.includes(`"${stem}"`) || (stem.startsWith('sp.bd.') && PROFILE.includes('`sp.bd.${nb.kind}`'));
      expect(used, k).toBe(true);
    }
    // The Spanish is marked for a native read, the way the file marks it.
    const esSrc = read('src/i18n/es.js');
    expect(esSrc.slice(esSrc.indexOf("'sp.share'") - 200, esSrc.indexOf("'sp.share'"))).toContain('// Not yet read by a native reviewer.');
  });
});
