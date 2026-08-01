import { readFileSync, writeFileSync } from 'fs';
let s = readFileSync('scouting-c.html', 'utf8');
let n = 0;
const sub = (a, b) => {
  const c = s.split(a).length - 1;
  if (c !== 1) { console.error('EXPECTED 1 GOT ' + c + ': ' + a.slice(0, 60)); process.exit(1); }
  s = s.split(a).join(b); n++;
};

// 1. The board was 42 empty boxes: no game name, no rules, no colour key.
//    Seeding a PLAUSIBLE WRONG guess teaches the whole language in one row.
//    LAPORTE against HAALAND gives one green, one amber, five grey. A wrong
//    guess also cannot be mistaken for the answer, which is what happens on
//    the live site where row one spells a famous complete surname.
sub("var guesses = [], cur = '';", "var guesses = ['LAPORTE'], cur = '';");

const oldHead = '    <h2>Tomorrow</h2>\n' +
  '    <p class="sub">Footle resets at midnight and the Daily 7 lands with it. Everybody in the world gets the identical seven, which is the only reason a score is worth arguing about. Here is today\'s, one guess to try it.</p>';
const newHead = [
  '    <h2>Footle. Football Wordle.</h2>',
  '    <p class="sub">Guess the footballer&rsquo;s surname in six. It resets at midnight, and so does the Daily 7, where everybody in the world gets the identical seven questions. That is the only reason a score is worth arguing about.</p>',
  '    <div class="key">',
  '      <span><i class="k hit"></i>Right letter, right place</span>',
  '      <span><i class="k near"></i>In the surname, wrong place</span>',
  '      <span><i class="k off"></i>Not in it</span>',
  '      <span class="tried">One guess played. Five left.</span>',
  '    </div>'
].join('\n');
sub(oldHead, newHead);

const keyCss = [
  '.key{margin-top:18px;display:flex;flex-wrap:wrap;gap:9px 22px;font-size:14.5px;color:#A8B0A9}',
  '.key span{display:inline-flex;align-items:center;gap:8px}',
  '.key .tried{color:var(--pa);font-weight:600}',
  '.k{width:15px;height:15px;display:inline-block;border:1px solid #3A423C}',
  '.k.hit{background:var(--r5);border-color:var(--r5)}',
  '.k.near{background:var(--r3);border-color:var(--r3)}',
  '.k.off{background:#22271F}',
  '.ftl{margin-top:22px;'
].join('\n');
sub('.ftl{margin-top:24px;', keyCss);

// 2. Footle promoted to the moment someone has just finished playing, which
//    is the only point at which "here is another one" is welcome.
sub('      <a class="btn sec" href="#">Just my club instead</a>',
    '      <a class="btn sec" href="#">Just my club instead</a>\n' +
    '      <a class="btn sec" href="#tomorrow">Today&rsquo;s Footle</a>');
sub('<div class="tom">', '<div class="tom" id="tomorrow">');

// 3. Store marks. Authored SVG, not glyphs: the craft floor refuses unicode
//    standing in for an icon system. PRODUCTION NOTE: these are placeholders.
//    Apple permits its logo only inside the official "Download on the App
//    Store" badge, and Google requires its generated Play badge, so a shipping
//    page must swap these for the official artwork.
const APPLE = '<svg class="mk-i" viewBox="0 0 24 24" aria-hidden="true"><path d="M16.7 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9-.7 0-1.8-.9-3-.8-1.5 0-2.9.9-3.7 2.3-1.6 2.7-.4 6.8 1.1 9 .8 1.1 1.7 2.3 2.9 2.2 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2.1-1.1 2.8-2.2.9-1.2 1.3-2.4 1.3-2.5 0 0-2.5-1-2.5-3.6zM14.4 5.8c.6-.8 1.1-1.9 1-3-.9 0-2.1.6-2.8 1.4-.6.7-1.2 1.8-1 2.9 1 .1 2.1-.5 2.8-1.3z"/></svg>';
const PLAY  = '<svg class="mk-i" viewBox="0 0 24 24" aria-hidden="true"><path d="M3.6 2.2c-.3.3-.5.8-.5 1.4v16.8c0 .6.2 1.1.5 1.4l.1.1 9.4-9.4v-.2L3.7 2.1z"/><path d="M16.3 15.7l-3.1-3.1v-.2l3.1-3.1.1.1 3.7 2.1c1.1.6 1.1 1.6 0 2.2z"/><path d="M16.4 15.8L13.2 12.6 3.6 22.2c.4.4 1 .4 1.7 0z"/><path d="M16.4 8.2L5.3 1.9c-.7-.4-1.3-.4-1.7 0l9.6 9.6z"/></svg>';

sub('      <a class="route" href="#"><b>iPhone</b><span>App Store</span></a>\n' +
    '      <a class="route" href="#"><b>Android</b><span>Google Play</span></a>',
    '      <a class="route" href="#">' + APPLE + '<b>iPhone</b><span>App Store</span></a>\n' +
    '      <a class="route" href="#">' + PLAY + '<b>Android</b><span>Google Play</span></a>');

sub('.route b{font-weight:600}',
    '.route b{font-weight:600}\n' +
    '.mk-i{width:17px;height:17px;flex:0 0 17px;fill:var(--ink);align-self:center}\n' +
    '.route:last-child b{margin-left:27px}');

writeFileSync('scouting-c.html', s);
console.log('edits applied: ' + n);
