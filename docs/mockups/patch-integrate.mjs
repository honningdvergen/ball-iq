import { readFileSync, writeFileSync, statSync } from 'fs';
let s = readFileSync('scouting-d.html', 'utf8');
const startBytes = Buffer.byteLength(s);
let n = 0;
const sub = (a, b) => {
  const c = s.split(a).length - 1;
  if (c !== 1) { console.error('EXPECTED 1 GOT ' + c + ': ' + a.slice(0, 60)); process.exit(1); }
  s = s.split(a).join(b); n++;
};

// ── BUG 1 ───────────────────────────────────────────────────────────────
// `.btn.sec` (secondary button) and `.sec` (section spacing) both matched
// <a class="btn sec">. The bare .sec won on padding, so two of the three
// verdict CTAs rendered 134px tall with ZERO horizontal padding, text flush
// against both borders, at the highest-intent moment on the page.
sub('.btn.sec{border:1px solid var(--ink)}', '.btn.alt{border:1px solid var(--ink)}');
sub('.btn.sec:hover{background:var(--ink);color:var(--pa)}', '.btn.alt:hover{background:var(--ink);color:var(--pa)}');
sub('<a class="btn sec" href="#">Just my club instead</a>', '<a class="btn alt" href="#">Just my club instead</a>');
sub('<a class="btn sec" href="#tomorrow">Today&rsquo;s Footle</a>', '<a class="btn alt" href="#tomorrow">Today&rsquo;s Footle</a>');

// ── BUG 2 ───────────────────────────────────────────────────────────────
// el(tag, className, text) -- 'Why' was landing in className, so the label
// that carries the product's second positioning claim rendered as an empty
// <b> on every single explanation.
sub("why.appendChild(el('b','Why'));", "why.appendChild(el('b', null, 'Why'));");

// ── BUG 3 ───────────────────────────────────────────────────────────────
// Report rows inherited the dark-ground text colour onto the paper card.
// Explicit, so no future ground change can wash them out again.
sub('.stub td{padding:9px 10px;font-size:15px;border-bottom:1px solid var(--rule)}',
    '.stub td{padding:9px 10px;font-size:15px;border-bottom:1px solid var(--rule);color:var(--ink)}');
sub('.file{background:var(--pa);color:var(--ink);padding:28px;margin-top:26px;',
    '.file{background:var(--pa);color:var(--ink);padding:0;margin-top:26px;');

// ── THE INTEGRATION ─────────────────────────────────────────────────────
// The store rail was a third visual treatment floating in the hero, matching
// neither the desk nor the paper. A scouting report has a letterhead with a
// reference and a distribution line; "where you can play this" IS a
// distribution line. Folding it in makes it part of the document instead of
// an object resting near it.
sub('.routes{border:1px solid var(--deskline);background:var(--desk2);align-self:start}',
`.head{display:flex;align-items:flex-end;gap:20px;flex-wrap:wrap;
       padding:20px 28px 16px;border-bottom:2px solid var(--ink)}
.head .who{font-family:'Archivo Narrow',sans-serif;font-weight:700;text-transform:uppercase;
           font-size:23px;letter-spacing:.03em;line-height:1}
.head .meta{font-size:13px;color:var(--mut);margin-top:5px}
.dist{margin-left:auto;display:flex;align-items:center;gap:0}
.dist .dl{font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;
          color:var(--mut);margin-right:13px}
.dist a{display:inline-flex;align-items:center;gap:7px;padding:8px 13px;font-size:14.5px;
        font-weight:600;border:1px solid var(--rule);border-right-width:0;
        transition:background-color .15s}
.dist a:last-child{border-right-width:1px}
.dist a:hover{background:#fff}
.body{padding:24px 28px 28px}
.routes{border:1px solid var(--deskline);background:var(--desk2);align-self:start}`);

sub('.mk-i{width:17px;height:17px;flex:0 0 17px;fill:var(--onDeskHi);align-self:center}',
    '.mk-i{width:17px;height:17px;flex:0 0 17px;fill:var(--onDeskHi);align-self:center}\n' +
    '.dist .mk-i{fill:var(--ink)}');

// Hero returns to a single column; the headline gets the full width it wants.
sub('@media (min-width:900px){\n  .open{display:grid;grid-template-columns:1fr 268px;gap:44px;align-items:start}\n}', '');

const APPLE = '<svg class="mk-i" viewBox="0 0 24 24" aria-hidden="true"><path d="M16.7 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9-.7 0-1.8-.9-3-.8-1.5 0-2.9.9-3.7 2.3-1.6 2.7-.4 6.8 1.1 9 .8 1.1 1.7 2.3 2.9 2.2 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2.1-1.1 2.8-2.2.9-1.2 1.3-2.4 1.3-2.5 0 0-2.5-1-2.5-3.6zM14.4 5.8c.6-.8 1.1-1.9 1-3-.9 0-2.1.6-2.8 1.4-.6.7-1.2 1.8-1 2.9 1 .1 2.1-.5 2.8-1.3z"/></svg>';
const PLAY  = '<svg class="mk-i" viewBox="0 0 24 24" aria-hidden="true"><path d="M3.6 2.2c-.3.3-.5.8-.5 1.4v16.8c0 .6.2 1.1.5 1.4l.1.1 9.4-9.4v-.2L3.7 2.1z"/><path d="M16.3 15.7l-3.1-3.1v-.2l3.1-3.1.1.1 3.7 2.1c1.1.6 1.1 1.6 0 2.2z"/><path d="M16.4 15.8L13.2 12.6 3.6 22.2c.4.4 1 .4 1.7 0z"/><path d="M16.4 8.2L5.3 1.9c-.7-.4-1.3-.4-1.7 0l9.6 9.6z"/></svg>';

// Remove the floating rail from the hero.
const OLD_ROUTES = [
  '    <div class="routes">',
  '      <div class="rh">Play it anywhere</div>',
  '      <a class="route" href="#">' + APPLE + '<b>iPhone</b><span>App Store</span></a>',
  '      <a class="route" href="#">' + PLAY + '<b>Android</b><span>Google Play</span></a>',
  '      <a class="route" href="#"><b>This browser</b><span>Nothing to install</span></a>',
  '    </div>'
].join('\n');
sub('\n' + OLD_ROUTES, '');

// And rebuild it as the file's letterhead.
const HEAD = [
  '    <div class="head">',
  '      <div>',
  '        <div class="who">Ball IQ &mdash; scouting report</div>',
  '        <div class="meta">Subject: not yet assessed &middot; Five questions &middot; No account</div>',
  '      </div>',
  '      <div class="dist">',
  '        <span class="dl">Also on</span>',
  '        <a href="#">' + APPLE + 'iPhone</a>',
  '        <a href="#">' + PLAY + 'Android</a>',
  '      </div>',
  '    </div>',
  '    <div class="body">'
].join('\n');

sub('  <div class="file">\n  <div class="stub" id="stub">', '  <div class="file">\n' + HEAD + '\n  <div class="stub" id="stub">');
sub('      <a class="btn alt" href="#tomorrow">Today&rsquo;s Footle</a>\n    </div>\n  </div>\n  </div>',
    '      <a class="btn alt" href="#tomorrow">Today&rsquo;s Footle</a>\n    </div>\n  </div>\n  </div>\n  </div>');

// ── CTR: the club rows were plain text, so the section that should be the
// internal link mesh into 72 pages emitted exactly one link.
sub("  td.appendChild(sw); td.appendChild(document.createTextNode(c[0]));\n  tr.appendChild(td);",
    "  var a = el('a'); a.href = '#'; a.className = 'clublink';\n" +
    "  a.appendChild(sw); a.appendChild(document.createTextNode(c[0]));\n" +
    "  td.appendChild(a); tr.appendChild(td);");
sub('.clubs tr:hover td{background:#1E241F}',
    '.clubs tr:hover td{background:#1E241F}\n' +
    '.clublink{display:flex;align-items:center;min-height:26px}\n' +
    '.clubs tr:hover .clublink::after{content:"Play";margin-left:14px;font-size:13px;\n' +
    '  font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--onDeskMut)}');

writeFileSync('scouting-d.html', s);
const endBytes = statSync('scouting-d.html').size;
console.log('edits: ' + n + ' | ' + startBytes + ' -> ' + endBytes + ' bytes');
if (endBytes === 131072 || endBytes < 150000) { console.error('*** TRUNCATION SUSPECTED ***'); process.exit(1); }
const t = readFileSync('scouting-d.html', 'utf8');
console.log('integrity: mast=' + t.includes('class="mast"') + ' letterhead=' + t.includes('class="head"') +
            ' ftl=' + t.includes('ftlGrid') + ' fonts=' + (t.match(/@font-face/g) || []).length +
            ' ends-ok=' + t.trimEnd().endsWith('</script>'));
