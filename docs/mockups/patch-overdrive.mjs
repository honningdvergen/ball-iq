import { readFileSync, writeFileSync, statSync } from 'fs';
let s = readFileSync('scouting-d.html', 'utf8');
const start = Buffer.byteLength(s);
let n = 0;
const sub = (a, b) => {
  const c = s.split(a).length - 1;
  if (c !== 1) { console.error('EXPECTED 1 GOT ' + c + ': ' + a.slice(0, 60)); process.exit(1); }
  s = s.split(a).join(b); n++;
};

// ══ OVERDRIVE ═══════════════════════════════════════════════════════════
// Everything before this was a rectangle stacked in one 943px column. The
// palette changed twice and the composition never did, which is why it kept
// reading safe. Three moves, all structural, none decorative:
//   1. the desk becomes a real surface (authored grain, not a flat fill)
//   2. the report becomes a physical sheet ON it: wider than the column,
//      off-square, overlapping the headline, lit from one direction
//   3. the verdict stops being a third card and arrives as a stamped event

// ── 1. The surface ──────────────────────────────────────────────────────
sub("body{background:var(--desk);color:var(--onDesk);",
    "body{background:var(--desk);color:var(--onDesk);position:relative;\n" +
    "     background-image:var(--grain);background-repeat:repeat;");

// ── 2. The sheet ────────────────────────────────────────────────────────
// Wider than its column and pulled left, so it breaks the centre spine.
// Rotated a half-degree: enough to read as a placed object, not enough to
// look like a gimmick. One light source, top-left, so the shadow falls
// bottom-right and the paper's top edge catches a highlight.
sub('.file{background:var(--pa);color:var(--ink);padding:0;margin-top:26px;\n      box-shadow:0 30px 70px -26px rgba(0,0,0,.85), 0 2px 0 rgba(255,255,255,.05)}',
`.file{position:relative;z-index:3;background:var(--pa);color:var(--ink);padding:0;
      width:calc(100% + 132px);margin:-52px 0 0 -66px;
      transform:rotate(-.45deg);transform-origin:52% 0;
      box-shadow:
        26px 44px 84px -28px rgba(0,0,0,.92),
        4px 8px 22px -10px rgba(0,0,0,.7),
        inset 0 1px 0 rgba(255,255,255,.9);
      outline:1px solid rgba(0,0,0,.35);outline-offset:0}
/* The second sheet under it: the file is a stack, not a page. */
.file::after{content:'';position:absolute;inset:12px -9px -11px 8px;z-index:-1;
             background:#CBCFC7;transform:rotate(1.1deg);
             box-shadow:14px 26px 46px -22px rgba(0,0,0,.8)}
@media (max-width:640px){
  .file{width:calc(100% + 22px);margin:-18px 0 0 -11px;transform:rotate(-.3deg)}
  .file::after{inset:8px -5px -7px 5px}
}`);

// The hero has to give the sheet room to climb over it.
sub('.open{padding:34px 0 22px}', '.open{padding:34px 0 64px;position:relative;z-index:1}');

// ── 3. The verdict as an event ──────────────────────────────────────────
// It was a third card in a stack. Now it arrives stamped: rotated against
// the sheet, ruled heavily, the number at a scale nothing else on the page
// reaches. The grade is the loudest object in the document, which is the
// whole premise.
sub('.verdict{display:none;border:1px solid var(--ink);border-top:0}',
`.verdict{display:none;position:relative;margin:26px 28px 28px;
         border:2px solid var(--ink);background:var(--pa);
         transform:rotate(.7deg);
         box-shadow:8px 12px 0 rgba(20,23,26,.09)}`);
sub('.verdict.on{display:block}',
`.verdict.on{display:block;animation:land .42s cubic-bezier(.2,1.3,.4,1) both}
@keyframes land{from{transform:rotate(2.6deg) scale(1.045);opacity:0}
                to{transform:rotate(.7deg) scale(1);opacity:1}}
@media (prefers-reduced-motion:reduce){.verdict.on{animation:none}}`);
sub('.vnum{font-family:\'Archivo Narrow\',sans-serif;font-weight:700;font-size:76px;line-height:.82;\n      font-variant-numeric:tabular-nums}',
    '.vnum{font-family:\'Archivo Narrow\',sans-serif;font-weight:700;\n' +
    '      font-size:clamp(96px,13vw,168px);line-height:.76;letter-spacing:-.03em;\n' +
    '      font-variant-numeric:tabular-nums}');
sub('.vtier{font-family:\'Archivo Narrow\',sans-serif;font-weight:700;text-transform:uppercase;\n       font-size:26px;letter-spacing:.03em;line-height:1}',
    '.vtier{font-family:\'Archivo Narrow\',sans-serif;font-weight:700;text-transform:uppercase;\n' +
    '       font-size:clamp(30px,4.4vw,52px);letter-spacing:.01em;line-height:.98;\n' +
    '       border-bottom:3px solid var(--ink);padding-bottom:7px;display:inline-block}');

// ── The section heads break the column too ──────────────────────────────
sub("h2{font-family:'Archivo Narrow',sans-serif;font-weight:700;text-transform:uppercase;\n   font-size:clamp(30px,5vw,58px);line-height:1.02;letter-spacing:-.012em;color:var(--onDeskHi)}",
    "h2{font-family:'Archivo Narrow',sans-serif;font-weight:700;text-transform:uppercase;\n" +
    "   font-size:clamp(34px,7.4vw,86px);line-height:.96;letter-spacing:-.022em;\n" +
    "   color:var(--onDeskHi);margin-left:-4px}");

writeFileSync('scouting-d.html', s);
const end = statSync('scouting-d.html').size;
const t = readFileSync('scouting-d.html', 'utf8');
console.log('overdrive edits: ' + n + ' | ' + start + ' -> ' + end);
if (end < 150000) { console.error('*** TRUNCATION ***'); process.exit(1); }
console.log('integrity: mast=' + t.includes('class="mast"') + ' fonts=' + (t.match(/@font-face/g) || []).length +
            ' ends-ok=' + t.trimEnd().endsWith('</script>'));
