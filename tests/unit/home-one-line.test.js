// Home, 25 Nov 2026: every row is one line of title and one grey line, so the
// rows of a list are one height (Alex: "looks bad when some pills are longer
// vertically than others"). No script measures text: lib/rowLine.jsx cuts the
// grey line into pieces and app.css lays them in a row one line high that
// wraps, so the second piece falls out of sight where both do not fit.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createElement, Fragment } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { rowLine, withStrong } from '../../src/lib/rowLine.jsx';

const read = (p) => readFileSync(fileURLToPath(new URL(`../../src/${p}`, import.meta.url)), 'utf8');
const html = (node) => renderToStaticMarkup(node);
const text = (s) => s.replace(/<[^>]+>/g, '');

describe('rowLine: a grey line as pieces', () => {
  it('a line with no separator is one piece', () => {
    expect(html(rowLine('Whose career is this?'))).toBe('<span class="t7s-p">Whose career is this?</span>');
  });
  it('a line is cut at " · " and the separator rides with the piece after it', () => {
    expect(html(rowLine('Start here · six guesses'))).toBe('<span class="t7s-p">Start here</span><span class="t7s-p"> · six guesses</span>');
  });
  it('the text of the line is the string in the table, untouched', () => {
    for (const s of ['Start here · six guesses', 'Done · today\'s player', 'Surname of a footballer', 'a · b · c']) expect(text(html(rowLine(s)))).toBe(s.replace(/'/g, '&#x27;'));
  });
  it('values go in <strong>, and a value that holds the separator is not cut', () => {
    expect(html(rowLine('In progress · {n} of 6', { n: 3 }))).toBe('<span class="t7s-p">In progress</span><span class="t7s-p"> · <strong>3</strong> of 6</span>');
    expect(html(rowLine('{place} here', { place: 'a · b' }))).toBe('<span class="t7s-p"><strong>a · b</strong> here</span>');
    expect(html(createElement(Fragment, null, withStrong('Solved in {n}', { n: 4 })))).toBe('Solved in <strong>4</strong>');
  });
  it('nothing in, nothing broken', () => {
    expect(html(rowLine(undefined))).toBe('<span class="t7s-p"></span>');
  });
});

describe('every grey line on Home goes through it, and every name has its own box', () => {
  const FILES = ['screens/HomeScreen.jsx', 'components/MultiplayerCard.jsx', 'components/LeagueStartRow.jsx', 'components/LeagueHomeCard.jsx'];
  it('no row prints its grey line as bare text', () => {
    for (const f of FILES) {
      const code = read(f);
      for (const m of code.matchAll(/className="(?:t7s-sub|lg-home-line)">\{([^\n]*)/g)) expect(m[1].startsWith('rowLine(') || m[1].startsWith('r.sub}'), `${f}: ${m[0]}`).toBe(true);
      for (const m of code.matchAll(/className="(?:t7s-title|lg-home-name)">([^\n]{0,30})/g)) expect(m[1].startsWith('<span className="t7s-name">'), `${f}: ${m[0]}`).toBe(true);
    }
  });
  it('in every rendered state of Home, each grey line is pieces and each title starts with its name', () => {
    // The four dailies build their lines in a table, so this reads the render (the golden of
    // i18n-home-nav.test.js, which that test holds to the live markup).
    const golden = JSON.parse(readFileSync(fileURLToPath(new URL('./i18n-home-nav.golden.json', import.meta.url)), 'utf8'));
    let lines = 0;
    for (const [name, markup] of Object.entries(golden)) {
      for (const m of markup.matchAll(/<span class="t7s-sub">(.{0,20})/g)) { lines++; expect(m[1], name).toBe('<span class="t7s-p">'); }
      for (const m of markup.matchAll(/<span class="t7s-title">(.{0,23})/g)) expect(m[1], name).toBe('<span class="t7s-name">');
    }
    expect(lines).toBeGreaterThan(90);
  });
});

describe('app.css: both lines are a row one line high that wraps', () => {
  const css = read('app.css');
  it('the title: the name stays, what follows it gives way', () => {
    expect(css).toMatch(/\.home-screen \.t7s-title,\.home-screen \.lg-home-name\{display:flex;flex-wrap:wrap;align-items:baseline;[^}]*height:1\.1em;[^}]*overflow:hidden;white-space:nowrap;/);
    expect(css).toMatch(/\.home-screen \.t7s-name\{flex:none;[^}]*max-width:100%;[^}]*overflow:hidden;text-overflow:ellipsis;\}/);
  });
  it('the grey line: a piece that does not fit falls to a line that is not drawn; alone and too long, an ellipsis', () => {
    expect(css).toMatch(/\.home-screen \.t7s-sub,\.home-screen \.lg-home-line\{display:flex;flex-wrap:wrap;[^}]*height:1\.3em;line-height:1\.3;overflow:hidden;/);
    expect(css).toMatch(/\.home-screen \.t7s-p\{flex:none;max-width:100%;white-space:pre;overflow:hidden;text-overflow:ellipsis;\}/);
  });
  it('the pill keeps its one line, and the font sizes are the ones they were', () => {
    expect(css).toMatch(/\.home-screen \.t7s-cta\{white-space:nowrap;\}/);
    expect(css).toMatch(/\.t7s-cta\{[^}]*flex-shrink:0;/);
    expect(css).toMatch(/\.t7s-sub\{font-size:12\.5px;line-height:1\.3;/);
    expect(css).toMatch(/\.t7s-title\{font-size:14px;font-weight:900;line-height:1\.1;/);
  });
  it('the smallest phones give the words their margins, on the pane (it is contain:content)', () => {
    expect(css).toMatch(/@media \(max-width: 359px\)\{[^@]*\.tab-pane-home\{margin-left:-4px;margin-right:-4px;\}/);
    expect(read('App.jsx')).toMatch(/<div className="tab-pane tab-pane-home" style=\{tab === "home" \? undefined : HIDDEN_STYLE\}>/);
  });
});
