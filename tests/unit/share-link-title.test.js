// THE SHARE LINK'S TITLE (25 Nov 2026): what a chat app prints under the picture
// of a /c/ link. One figure, and no question.
//
// The message the link arrives in already asks ("Solved Footle in 3. Can you
// beat it?", tests/unit/share-one-message.test.js), and the title sat right
// under it saying the dare, the puzzle's number and the score again: "A mate
// solved Footle No. 204 in 3. Can you beat it?". Alex on the drawings: "too
// many numbers"; on the build: "Yes, build it".
//
// Only the title changed. The description is the one it had, and the picture
// (/api/og) is the address it was: which picture to draw is not decided.
// English only: a crawler reads this page, and the link does not say which
// language the sender plays in.
import { describe, it, expect, vi } from 'vitest';

const handler = (await import('../../api/c.js')).default;

describe("the link's title (api/c.js)", () => {
  const meta = async (token, q = '') => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    // localhost: the handler writes its hit row only for a production host.
    const res = await handler(new Request(`http://localhost/api/c?t=${token}${q}`));
    spy.mockRestore();
    const html = await res.text();
    const get = (p) => (html.match(new RegExp(`<meta (?:property|name)="${p}" content="([^"]*)"`)) || [])[1];
    return { html, title: get('og:title'), twitter: get('twitter:title'), desc: get('og:description'), image: get('og:image'), page: (html.match(/<title>([^<]*)<\/title>/) || [])[1], to: (html.match(/http-equiv="refresh" content="0; url=([^"]*)"/) || [])[1] };
  };
  const TITLES = [
    ['f.204.3', 'A mate solved Footle in 3'],
    ['f.204.1', 'A mate solved Footle in 1'],
    ['f.204.6', 'A mate solved Footle in 6'],
    ['f.204.0', 'Footle beat a mate'],
    ['f.204.3.Alex', 'Alex solved Footle in 3'],
    ['f.204.0.Alex', 'Footle beat Alex'],
    ['t.113.3', 'A mate got Transfer Trail in 3 clubs'],
    ['t.113.1', 'A mate got Transfer Trail in 1 club'],
    ['t.113.0', 'Transfer Trail beat a mate'],
    ['t.113.2.Kim', 'Kim got Transfer Trail in 2 clubs'],
    ['x.43.7', 'A mate named 7 on Top 10'],
    ['x.43.1', 'A mate named 1 on Top 10'],
    ['x.43.10', 'A mate named all 10 on Top 10'],
    ['x.43.0', 'Top 10 beat a mate'],
    ['x.43.8.Sam', 'Sam named 8 on Top 10'],
    ['2.20261125', 'A mate got 2 right on Daily 7'],
    ['1.20261125', 'A mate got 1 right on Daily 7'],
    ['7.20261125', 'A mate got all 7 right on Daily 7'],
    ['0.20261125', 'Daily 7 beat a mate'],
    ['5.20261125.Ana', 'Ana got 5 right on Daily 7'],
  ];
  it.each(TITLES)('/c/%s: "%s"', async (token, title) => {
    const m = await meta(token);
    expect(m.title).toBe(title);
    expect(m.twitter).toBe(title);
    expect(m.page).toBe(title);
  });
  it('one figure, no question, no puzzle number, no date', async () => {
    for (const [token, title] of TITLES) {
      expect((title.replace(/Top 10|Daily 7/g, '').match(/\d+/g) || []).length, title).toBeLessThanOrEqual(1);
      expect(title, token).not.toMatch(/\?|No\.|\/|204|113|43|2026|\p{Extended_Pictographic}/u);
    }
  });
  it('the description is the one it had', async () => {
    expect((await meta('f.204.3')).desc).toBe('Same puzzle, one go. Free, no sign-up.');
    expect((await meta('x.43.7.Sam')).desc).toBe('Same puzzle, one go. Free, no sign-up.');
    expect((await meta('2.20261125')).desc).toBe('Same 7 questions, one try — beat it before midnight. Free, no sign-up.');
    expect((await meta('2.20261125.Ana')).desc).toBe('Same 7 questions, one try — beat them before midnight. Free, no sign-up.');
  });
  it('the picture is the address it was: this change draws nothing', async () => {
    expect((await meta('f.204.3.Alex')).image).toBe('http://localhost/api/og?t=gch&amp;g=f&amp;s=3&amp;no=204&amp;n=Alex');
    expect((await meta('2.20261125.Ana')).image).toBe('http://localhost/api/og?t=challenge&amp;s=2&amp;n=Ana&amp;d=25+Nov');
  });
  it('the codes ride through to the app: ?r= as gr, ?f= as f', async () => {
    expect((await meta('f.204.3.Alex', '&r=ABCDEFGHIJKL')).to).toBe('http://localhost/play?game=footle&amp;gc=f.204.3.Alex&amp;gr=ABCDEFGHIJKL');
    expect((await meta('2.20261125.Ana', '&f=123e4567-e89b-12d3-a456-426614174000')).to).toBe('http://localhost/play?c=2.20261125.Ana&amp;f=123e4567-e89b-12d3-a456-426614174000');
  });
  it('a name is escaped, and a link that is not one keeps the plain card', async () => {
    const m = await meta('f.204.3.%3Cb%3EJo');
    expect(m.title).toBe('bJo solved Footle in 3');
    expect(m.html).not.toContain('<b>Jo');
    expect((await meta('9.2026')).title).toBe('Daily 7 challenge ⚽');
  });
});
