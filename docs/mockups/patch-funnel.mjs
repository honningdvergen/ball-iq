import { readFileSync, writeFileSync, statSync } from 'fs';
let s = readFileSync('scouting-d.html', 'utf8');
const start = Buffer.byteLength(s);
let n = 0;
const sub = (a, b) => {
  const c = s.split(a).length - 1;
  if (c !== 1) { console.error('EXPECTED 1 GOT ' + c + ': ' + a.slice(0, 70)); process.exit(1); }
  s = s.split(a).join(b); n++;
};

// ── 1. THE EXAMPLE ROW WAS EATING A GUESS ───────────────────────────────
// Seeding LAPORTE into row one taught the colour language at a glance, which
// was the point, but it spent one of the reader's six attempts to do it. The
// counter was then rewritten to explain the shortfall ("five guesses are
// yours") -- describing the theft rather than stopping it. The example now
// sits ABOVE the board as its own labelled strip and all six rows are theirs.
sub("var guesses = ['LAPORTE'], cur = '', mine = 0;", "var guesses = [], cur = '', mine = 0;");

sub('        <div class="grid" id="ftlGrid" role="group" aria-label="Footle board, six guesses of seven letters"></div>',
`        <div class="eg">
          <div class="eglab">For example, if you guessed Laporte</div>
          <div class="grid egrid" id="ftlEg" aria-hidden="true"></div>
        </div>
        <div class="grid" id="ftlGrid" role="group" aria-label="Footle board, six guesses of seven letters"></div>`);

sub('.grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:8px}',
`.grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:8px}
/* The worked example, moved out of the six rows it used to occupy. Smaller and
   set back, so it reads as a caption to the board rather than as play. */
.eg{margin-bottom:20px;padding-bottom:18px;border-bottom:1px solid var(--deskline)}
.eglab{font:600 12px/1.4 'Archivo',sans-serif;letter-spacing:.055em;
       text-transform:uppercase;color:var(--onDeskMut);margin-bottom:9px}
.egrid{grid-template-columns:repeat(7,minmax(0,32px));gap:5px;justify-content:start}
.egrid .tile{width:32px;height:32px;font-size:15px}
@media (max-width:640px){
  .egrid{grid-template-columns:repeat(7,1fr)}
  .egrid .tile{width:auto;height:auto;aspect-ratio:1;font-size:13px}
}`);

// The counter no longer has an example to discount: every row is the reader's,
// so `mine` and the board agree and the special cases go.
sub(`  var used = guesses.length, rem = ROWS - used;
  // Rows counts the example; the reader does not. Everything the counter says
  // about THEM is counted from \`mine\`, and only "left" reads off the board.
  if (guesses[guesses.length-1] === ANSWER){ left.textContent = 'Solved in ' + WORD[mine] + '.'; return; }
  if (used === 0){ left.textContent = 'Six guesses, none played yet.'; return; }
  if (!mine){ left.textContent = 'Laporte is an example. Five guesses are yours.'; return; }
  left.textContent = CAPWORD[mine] + (mine === 1 ? ' guess played. ' : ' guesses played. ')
    + (rem === 0 ? 'None left.' : CAPWORD[rem] + ' left.');`,
`  var used = guesses.length, rem = ROWS - used;
  // Every row on the board belongs to the reader now, so \`mine\` and
  // \`guesses.length\` are the same number and the counter needs no exceptions.
  if (guesses[guesses.length-1] === ANSWER){ left.textContent = 'Solved in ' + WORD[used] + '.'; return; }
  if (used === 0){ left.textContent = 'Six guesses.'; return; }
  left.textContent = CAPWORD[used] + (used === 1 ? ' guess played. ' : ' guesses played. ')
    + (rem === 0 ? 'None left.' : CAPWORD[rem] + ' left.');`);

// Render the example from the same scorer the real board uses, so it can never
// drift from the rules it is teaching.
sub('drawStub(); renderQ(); drawGrid(); drawKb();',
`(function drawExample(){
  var eg = document.getElementById('ftlEg'); if (!eg) return;
  var g = 'LAPORTE', marks = score(g);
  for (var i = 0; i < LEN; i++) eg.appendChild(el('span', 'tile ' + marks[i], g[i]));
})();
drawStub(); renderQ(); drawGrid(); drawKb();`);

// ── 2. THE APP FUNNEL ───────────────────────────────────────────────────
// Downloads are a stated goal and the page asked at the worst possible moment:
// a store rail in the masthead, before the visitor has any reason to want it,
// and NOTHING at the verdict, the one point where they have just been graded
// and are looking for what happens next. Framed as keeping the report rather
// than as an install, and set in the report's own material so it belongs to
// the document instead of hanging off it.
sub(`    <div class="vcta">`,
`    <div class="keep">
      <div class="keept">Keep this report</div>
      <p class="keepp">The full test scores you 60 to 160 and remembers it. Your streak, your clubs, your card.</p>
      <div class="keepl">
        <a href="#" class="keepa">iPhone<span>App Store</span></a>
        <a href="#" class="keepa">Android<span>Google Play</span></a>
      </div>
    </div>
    <div class="vcta">`);

sub('.vcta{display:flex;gap:10px;padding:0 26px 26px;flex-wrap:wrap}',
`.vcta{display:flex;gap:10px;padding:0 26px 26px;flex-wrap:wrap}
.keep{margin:20px 26px 0;padding:17px 18px;border-top:2px solid var(--ink);background:var(--pa2)}
.keept{font-family:'Archivo Narrow',sans-serif;font-weight:700;text-transform:uppercase;
       font-size:19px;letter-spacing:.03em;line-height:1}
.keepp{margin-top:7px;font-size:15px;line-height:1.5;color:var(--mut);max-width:46ch}
.keepl{margin-top:13px;display:flex;gap:9px;flex-wrap:wrap}
.keepa{display:inline-flex;align-items:center;gap:8px;min-height:46px;padding:0 17px;
       border:1px solid var(--ink);font-weight:600;font-size:15.5px;
       transition:background-color .15s,color .15s}
.keepa span{font-size:13px;color:var(--mut)}
@media (hover:hover){.keepa:hover{background:var(--ink);color:var(--pa)}
                     .keepa:hover span{color:var(--pa3)}}
@media (max-width:640px){.keepa{width:100%;justify-content:space-between}}`);

writeFileSync('scouting-d.html', s);
const end = statSync('scouting-d.html').size;
const t = readFileSync('scouting-d.html', 'utf8');
console.log('edits: ' + n + ' | ' + start + ' -> ' + end + ' bytes');
if (end < 100000) { console.error('*** TRUNCATION ***'); process.exit(1); }
console.log('integrity: fonts=' + (t.match(/@font-face/g) || []).length +
            ' mast=' + t.includes('class="mast"') + ' ftl=' + t.includes('ftlGrid') +
            ' doctype=' + t.trimStart().toLowerCase().startsWith('<!doctype') +
            ' ends-ok=' + t.trimEnd().endsWith('</script>'));
