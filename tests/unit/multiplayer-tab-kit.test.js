// The Multiplayer tab on Home's kit (25 Nov 2026; screens/OnlineHubTab.jsx says why).
// Alex, on the live tab: "and you can also tell we can do better on the multiplayer tab
// here"; on the drawing: "Yes, build it"; on his signed-in tab drawn the same way: "Online
// tab upgrade looks good". What was wrong on his screen is held out here, and so is the
// promise that the tab still DOES what it did: every control calls what it called.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const read = (p) => readFileSync(fileURLToPath(new URL(`../../${p}`, import.meta.url)), 'utf8');
const HUB = read('src/screens/OnlineHubTab.jsx');
const CSS = read('src/screens/onlineHub.css');
const APP = read('src/App.jsx');
const EN = (await import('../../src/i18n/en.js')).default;
const ES = (await import('../../src/i18n/es.js')).default;

describe('the Multiplayer tab is built on the kit', () => {
  it('draws no outline and no glow of its own', () => {
    expect(HUB).not.toContain('boxShadow');
    expect(HUB).not.toMatch(/border:\s*[`"]\d(\.\d)?px (solid|dashed)/);
    expect(HUB, 'the rival yet to come is a plain disc, not a dashed ring round a question mark').not.toMatch(/px dashed/);
    expect(CSS).not.toMatch(/dashed/);
    expect(CSS, 'the only shadow is the field\'s focus line, inside its fill').not.toMatch(/box-shadow:(?!inset |none)/);
    expect(CSS).not.toMatch(/border:1(\.5)?px (solid|dashed) var\(--border/);
    // The one line the tab draws is the hairline between two rows of a card (and the league
    // well's own ring, which is Home's).
    expect(CSS.match(/border-top:1px solid rgba\(255,255,255,0\.07\)/g)).toHaveLength(1);
  });

  it('has one heading style: Home\'s small grey capitals, for every section', () => {
    const heads = HUB.match(/<div className="home-section-title">\{t\("oh\.(\w+)"\)\}<\/div>/g) || [];
    expect(heads.map((h) => h.match(/oh\.(\w+)/)[1]).sort()).toEqual(['challengeFriend', 'codeHead', 'more', 'recent']);
    expect(HUB, 'no heading styled inline beside them').not.toMatch(/textTransform|letterSpacing/);
    expect(CSS).toContain('.online-hub .home-section-title{display:block;margin:26px 4px 10px;padding:0;font-size:11px;line-height:1;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:var(--t3);');
  });

  it('people are rows of one card with a round face, not a card each with a face in a square well', () => {
    expect(HUB).toContain('<div className="oh-list mp-friend-list">');
    expect((HUB.match(/<span className="oh-face" aria-hidden="true"><ProfilePic /g) || []).length).toBe(2);
    expect(HUB, 'no face inside an icon well').not.toMatch(/className="t7s-icon"[^>]*>\s*<span style/);
    expect(CSS).toContain('.online-hub .oh-face{flex:none;display:inline-flex;align-items:center;justify-content:center;width:46px;height:46px;border-radius:50%;');
    expect(CSS).toContain('.online-hub .oh-list{padding:2px 14px;border-radius:20px;background:var(--s1);}');
    expect(CSS).toMatch(/\.online-hub \.oh-list > \.todays-seven-secondary,[^{]*\{min-height:68px;margin:0;padding:11px 0;border:0;border-radius:0;background:none;box-shadow:none;\}/);
  });

  it('the code field and Join are one fill each, on the page', () => {
    expect(CSS).toContain('.online-hub .oh-field{flex:1;min-width:0;display:flex;align-items:center;gap:10px;height:52px;padding:0 16px;border-radius:16px;background:var(--s1);}');
    expect(CSS).toMatch(/\.online-hub \.oh-join-btn\{flex:none;height:52px;padding:0 22px;border:0;border-radius:999px;background:var\(--s1\);/);
    // 16px is the floor for a field: under it iOS zooms the page and never zooms back.
    expect(CSS).toMatch(/\.online-hub \.oh-field input\{[^}]*font-size:16px;/);
    expect(CSS).toMatch(/\.online-hub \.oh-field input\.is-code\{[^}]*font-size:17px;/);
  });

  it('uses lucide for its icons, never a system emoji', () => {
    expect(HUB).not.toContain('🔥');
    expect(HUB).toContain('<Flame size={15} strokeWidth={2.4} aria-hidden="true" />');
  });

  it('every rule of its stylesheet starts at .online-hub, so no other screen can change', () => {
    const body = CSS.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@media[^{]*\{/g, '').replace(/\}\s*\}/g, '}');
    const selectors = [...body.matchAll(/([^{}]+)\{[^{}]*\}/g)].flatMap((m) => m[1].split(',')).map((s) => s.trim()).filter(Boolean);
    expect(selectors.length).toBeGreaterThan(60);
    for (const s of selectors) expect(s.startsWith('.online-hub '), s).toBe(true);
  });
});

describe('the tab does what it did', () => {
  it('create, join, challenge, rematch, a friend\'s profile and local play call what they called', () => {
    expect(HUB).toContain('const createRoom = () => { setOnlineAutoCreate?.(true); startMode("online"); };');
    expect((HUB.match(/className="oh-go" onClick=\{createRoom\}/g) || []).length).toBe(2);
    expect(HUB).toContain('const res = await onJoinCode?.(joinCode);');
    expect(HUB).toContain('onClick={submitJoin} disabled={joining || joinCode.length === 0}');
    expect(HUB).toContain('onClick={() => onChallenge?.({ id: f.id, username: f.username })}');
    expect(HUB).toContain('onClick={() => (o.id && onChallenge) ? onChallenge({ id: o.id, username: o.name }) : createRoom()}');
    expect(HUB).toContain('onClick={() => onOpenFriend?.({ id: f.id, username: f.username, avatar: f.avatar })}');
    expect(HUB).toContain('onClick={() => startMode("local")}');
    // Who is listed has not changed either: friends only while nobody can be rematched, four at most.
    expect(HUB).toContain('useAcceptedFriends(stats.recent.length === 0 ? userId : null)');
    expect(HUB).toContain('{stats.recent.length === 0 && friends.length > 0 && (');
    expect(HUB).toContain('friends.slice(0, 4).map((f) => (');
  });

  it('the bell and the gear moved into the title row with the shared strip\'s own handlers', () => {
    expect(APP).toContain('{!isWebBrowser && !inGame && !(screen === "home" && (tab === "home" || tab === "online")) && (');
    const pane = APP.slice(APP.indexOf('<OnlineHubTab'), APP.indexOf('{/* ── PROFILE TAB ── */}'));
    expect(pane).toContain('showSettings={!isWebBrowser}');
    expect(pane).toContain('onOpenSettings={openSettings}');
    expect(pane).toContain('onOpenNotifs={user ? openNotifs : undefined}');
    expect(pane).toContain('notifCount={notifCount}');
    expect(APP).toContain('const openSettings = useCallback(() => setScreen("settings"), []);');
    // The strip's own, for the tabs that still wear it.
    expect(APP).toContain('{user && <NotifBell count={notifCount} onClick={openNotifs} className="icon-btn hdr-ic" />}');
  });

  it('the league row is Home\'s, counted under its own name', () => {
    expect(HUB).toContain('<LeagueHomeCard onOpen={onOpenLeague} onStart={onStartLeague} wait={leagueWait} from="multiplayer" />');
    expect(APP).toContain('loopEvent("league-create-open", { from: "multiplayer" });');
    expect(APP).toContain('loopEvent("league-create-open", { from: "home" });');
  });
});

describe('the words on the tab', () => {
  it('the six reworded lines and the two new ones, in both languages', () => {
    const want = {
      'oh.rival': ['Your rival', 'Tu rival'],
      'oh.noMatches': ['No matches yet. Your record starts here.', 'Aún no hay partidas. Tu historial empieza aquí.'],
      'oh.pitch': ['Who knows more, you or your mates?', '¿Quién sabe más, tú o tus colegas?'],
      'oh.pitchSub': ['Ten questions, live · up to 8 players', 'Diez preguntas en directo, hasta 8 jugadores'],
      'oh.codeHead': ['Got a code?', '¿Tienes un código?'],
      'oh.codePh': ['Type it here', 'Escríbelo aquí'],
      'oh.localSub': ['Same couch · up to 6 players', 'Mismo sofá · hasta 6 jugadores'],
      'oh.more': ['More ways to play', 'Más formas de jugar'],
    };
    for (const [k, [en, es]] of Object.entries(want)) { expect(EN[k], k).toBe(en); expect(ES[k], k).toBe(es); }
    // The question breaks at its comma in either language (OnlineHubTab.jsx).
    for (const T of [EN, ES]) expect(T['oh.pitch'].split(', ')).toHaveLength(2);
    for (const gone of ['oh.free', 'oh.noAccount', 'oh.joinHead']) { expect(EN[gone]).toBeUndefined(); expect(ES[gone]).toBeUndefined(); expect(HUB).not.toContain(gone); }
  });
});
