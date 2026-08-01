import fs from 'fs';
const P = '/private/tmp/claude-501/-Users-alexanderbrynolsen-ball-iq-src/c6c4d416-cca9-4515-bc5c-315a9e6d20f0/scratchpad/scouting-d.html';
let s = fs.readFileSync(P, 'utf8');
const before = Buffer.byteLength(s);
let n = 0;
function rep(find, replace, label) {
  const i = s.indexOf(find);
  if (i < 0) throw new Error('MISS: ' + label);
  if (s.indexOf(find, i + 1) >= 0) throw new Error('AMBIGUOUS: ' + label);
  s = s.slice(0, i) + replace + s.slice(i + find.length);
  n++;
}

/* ============ 1. DOCUMENT ============ */
rep(
  `<meta charset="utf-8">\n<title>Ball IQ</title>`,
  `<!doctype html>\n<html lang="en">\n<meta charset="utf-8">\n<title>Ball IQ</title>`,
  'doctype+lang'
);

/* ============ 2. CSS ============ */

// 2a. no horizontal scroll anywhere; the sheet is meant to bleed off the desk,
//     not to drag a scrollbar with it.
rep(
  `html{-webkit-text-size-adjust:100%}`,
  `html{-webkit-text-size-adjust:100%;overflow-x:clip}\n@supports not (overflow-x:clip){html{overflow-x:hidden}}`,
  'overflow-x'
);

// 2b. a screen-reader-only utility, and a hit-area expander that moves nothing
rep(
  `a{color:inherit;text-decoration:none}`,
  `.vh{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;
     clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0}
/* 44px of finger on a 23px-tall link, without moving the link a pixel. */
.tap{position:relative}
.tap::after{content:'';position:absolute;left:-6px;right:-6px;top:50%;
     transform:translateY(-50%);height:44px;min-height:100%}
a{color:inherit;text-decoration:none}`,
  'vh+tap'
);

// 2c. the sheet's overhang becomes one token, so it can be bounded per band
rep(
  `.file{position:relative;z-index:3;background:var(--pa);color:var(--ink);padding:0;
      width:calc(100% + 132px);margin:-52px 0 0 -66px;`,
  `.file{--over:66px;
      position:relative;z-index:3;background:var(--pa);color:var(--ink);padding:0;
      width:calc(100% + var(--over)*2);margin:-52px 0 0 calc(var(--over)*-1);`,
  'file --over'
);
rep(
  `@media (max-width:640px){
  .file{width:calc(100% + 22px);margin:-18px 0 0 -11px;transform:rotate(-.3deg)}
  .file::after{inset:8px -5px -7px 5px}
}`,
  `/* Between the phone and the wide desk there is no side margin to overhang into,
   so a 66px bleed pushed the report's own 40px of margin to 2px off the screen
   edge. The sheet still runs past its column here; it just stops eating the text. */
@media (max-width:1180px) and (min-width:641px){.file{--over:26px}}
@media (max-width:640px){
  .file{--over:11px;margin-top:-18px;transform:rotate(-.3deg)}
  .file::after{inset:8px -5px -7px 5px}
}`,
  'file mid band'
);

// 2d. the option is the page's primary control and its only boundary was a
//     1.53:1 hairline against a fill identical to the sheet behind it.
rep(
  `  --ink:#14171A; --mut:#4A524C; --rule:#B9BFB6;`,
  `  --ink:#14171A; --mut:#4A524C; --rule:#B9BFB6;
  /* Table rules stay hairline-pale. A rule that has to say "this is a control"
     is a different job: --rule is 1.53:1 on the paper, --rule2 is 3.31:1, which
     is what WCAG 1.4.11 asks of a component boundary. Same weight, same world. */
  --rule2:#7A8078;`,
  'rule2 token'
);
rep(
  `.opt{display:flex;align-items:center;gap:12px;text-align:left;padding:14px;
     border:1px solid var(--rule);background:var(--pa);font-size:var(--t-body);font-weight:500;`,
  `.opt{display:flex;align-items:center;gap:12px;text-align:left;padding:14px;
     border:1px solid var(--rule2);background:var(--pa);font-size:var(--t-body);font-weight:500;`,
  'opt border'
);
rep(
  `.opt u{flex:0 0 24px;height:24px;display:grid;place-items:center;text-decoration:none;
       border:1px solid var(--rule);font-size:var(--t-lab);font-weight:700;color:var(--mut)}`,
  `.opt u{flex:0 0 24px;height:24px;display:grid;place-items:center;text-decoration:none;
       border:1px solid var(--rule2);font-size:var(--t-lab);font-weight:700;color:var(--mut)}`,
  'opt u border'
);

// 2e. the three you did not pick: recessed by ink, not by opacity. .58 put the
//     option text at 4.13:1 and its letter at 2.61:1 — both under 4.5:1.
rep(
  `/* The three you did not pick stay readable — after answering, people re-read
   the options. .42 recessed them past legibility to make a point. */
.opt.dim{opacity:.58}`,
  `/* The three you did not pick stay readable — after answering, people re-read
   the options. Measured: .42 opacity read 3.0:1 and .58 read 4.13:1, with the
   A/B/C/D chip down at 2.61:1. Opacity cannot recess text and keep it legible
   at the same time, so this recedes in ink instead: #4A524C on #DEE1DB is
   6.11:1, plainly quieter than the ink of the answer and still readable. */
.opt.dim{background:var(--pa2);border-color:var(--rule);color:var(--mut)}
.opt.dim u{border-color:var(--rule)}`,
  'opt dim'
);

// 2f. hover is not a state a phone can reach, and on touch it sticks after the tap
rep(
  `.opt:hover:not(:disabled){border-color:var(--ink);background:#fff}`,
  `@media (hover:hover){.opt:hover:not(:disabled){border-color:var(--ink);background:#fff}}`,
  'opt hover'
);
rep(`.getapp:hover{background:#fff}`, `@media (hover:hover){.getapp:hover{background:#fff}}`, 'getapp hover');
rep(
  `.mn a:hover{color:var(--onDeskHi);text-decoration:underline;text-underline-offset:4px}`,
  `@media (hover:hover){.mn a:hover{color:var(--onDeskHi);text-decoration:underline;text-underline-offset:4px}}`,
  'mn hover'
);
rep(`.dist a:hover{background:#fff}`, `@media (hover:hover){.dist a:hover{background:#fff}}`, 'dist hover');
rep(
  `.crow:hover{background:#1E241F}`,
  `@media (hover:hover){.crow:hover{background:#1E241F}
  .crow:hover em{color:var(--onDeskHi)}}`,
  'crow hover'
);
rep(`.crow:hover em{color:var(--onDeskHi)}\n`, '', 'crow hover em old');
rep(
  `.kr button:hover{background:#333B34;border-color:#5A655C}`,
  `@media (hover:hover){.kr button:hover{background:#333B34;border-color:#5A655C}}`,
  'kb hover'
);
rep(
  `.btn.pri:hover,.next:hover{background:#2B3136}
.btn.alt{border:1px solid var(--ink)}
.btn.alt:hover{background:var(--ink);color:var(--pa)}`,
  `.btn.alt{border:1px solid var(--ink)}
@media (hover:hover){
  .btn.pri:hover,.next:hover{background:#2B3136}
  .btn.alt:hover{background:var(--ink);color:var(--pa)}
}`,
  'btn hover'
);
rep(
  `.footin .dist a:hover{background:#242B25}`,
  `@media (hover:hover){.footin .dist a:hover{background:#242B25}}`,
  'footin dist hover'
);

// 2g. a used key is still a key you can press. .36 opacity took its own label
//     down to 2.33:1 against its own face.
rep(
  `.kr button.used{opacity:.36}`,
  `/* Measured: opacity .36 fades the label AND the face together, leaving the
   letter at 2.33:1 against the key it is printed on — and these keys stay
   pressable, so they are not exempt as inactive controls. Spent, in ink. */
.kr button.used{background:#191E1A;border-color:#2F362F;color:#8A948B}`,
  'used key'
);

// 2h. the ad band reserves its label's height and nothing else; a 90px creative
//     would push the whole footer down on arrival.
rep(
  `.adslot{margin:var(--s6) 0 0;padding:var(--s3) 0;text-align:center;
        border-top:1px solid var(--deskline);border-bottom:1px solid var(--deskline)}`,
  `.adslot{margin:var(--s6) 0 0;padding:var(--s3) 0;text-align:center;
        min-height:106px;display:grid;place-items:center;
        border-top:1px solid var(--deskline);border-bottom:1px solid var(--deskline)}`,
  'adslot reserve'
);

// 2i. shake for a guess that is not a guess yet — feedback, tied to the press
rep(
  `.kb{margin-top:var(--s3);display:grid;gap:7px}`,
  `.kb{margin-top:var(--s3);display:grid;gap:7px;min-width:0}
.grid.short{animation:nudge .34s cubic-bezier(.36,.07,.19,.97)}
@keyframes nudge{10%,90%{transform:translateX(-2px)}30%,70%{transform:translateX(4px)}
                 50%{transform:translateX(-4px)}}
.fsay{margin-top:var(--s2);font-size:var(--t-sec);color:var(--onDeskHi);min-height:1.5em;
      line-height:1.5}`,
  'kb shake'
);

// 2j. 320px: the keyboard's min-content was 326px and it dragged the whole
//     Footle track past the viewport. minmax(0,1fr) lets it shrink to the phone.
rep(
  `@media (max-width:900px){
  .ftl{grid-template-columns:1fr;gap:var(--s4)}
  .board{max-width:none}`,
  `@media (max-width:900px){
  .ftl{grid-template-columns:minmax(0,1fr);gap:var(--s4)}
  .board{max-width:none;min-width:0}`,
  'ftl minmax'
);
rep(
  `  .grid{gap:5px}
  .kr button{max-width:none;height:48px}`,
  `  .grid{gap:5px}
  .kr button{max-width:none;height:48px}
  .mast{padding:10px 12px}`,
  'mast pad narrow'
);

// 2k. below 360 the seven tiles and ten keys need every pixel back
rep(
  `  .key{grid-template-columns:1fr}
}
</style>`,
  `  .key{grid-template-columns:1fr}
}
@media (max-width:359px){
  .w{padding:0 11px}
  .grid{gap:4px}
  .kr{gap:4px}
  .kb{gap:5px}
}
</style>`,
  'sub-360'
);

/* ============ 3. HTML ============ */

rep(
  `<div class="mast">
  <span class="mk">Ball IQ</span>
  <span class="mn mid"><a href="#">Clubs</a><a href="#">Records</a><a href="#">Daily</a><a href="#">About</a></span>
  <span class="mr"><a class="getapp" href="#">Get the app</a></span>
</div>

<div class="w">`,
  `<a class="vh" href="#assessment">Skip to the assessment</a>
<header class="mast">
  <span class="mk">Ball IQ</span>
  <nav class="mn mid" aria-label="Sections"><a class="tap" href="#">Clubs</a><a class="tap" href="#">Records</a><a class="tap" href="#">Daily</a><a class="tap" href="#">About</a></nav>
  <span class="mr"><a class="getapp" href="#">Get the app</a></span>
</header>

<main class="w" id="main">`,
  'masthead landmarks'
);

rep(
  `  <div class="file">
    <div class="head">`,
  `  <div class="file" id="report">
    <div class="head">`,
  'file id'
);

rep(
  `        <div class="meta">Subject: not yet assessed</div>`,
  `        <div class="meta" id="subject">Subject: not yet assessed</div>`,
  'subject id'
);

rep(
  `  <div class="asmt">
    <div class="ah"><span class="t">Assessment</span><span class="c" id="counter">1 of 5</span></div>
    <div class="ab" id="ab"></div>
  </div>`,
  `  <section class="asmt" id="assessment" aria-labelledby="asmtT">
    <div class="ah"><span class="t" id="asmtT">Assessment</span><span class="c" id="counter">1 of 5</span></div>
    <div class="ab" id="ab">
      <noscript><p class="q">This part of the page is the test itself, and it needs
      JavaScript to ask you anything. The clubs below, and the app, do not.</p></noscript>
    </div>
  </section>`,
  'asmt section'
);

rep(
  `  <div class="verdict" id="verdict">`,
  `  <div class="verdict" id="verdict" role="status" tabindex="-1">`,
  'verdict status'
);

rep(
  `<div class="tom" id="tomorrow">
  <div class="w">
    <h2>Footle. Football Wordle.</h2>`,
  `</main>

<section class="tom" id="tomorrow" aria-labelledby="tomT">
  <div class="w">
    <h2 id="tomT">Footle. Football Wordle.</h2>`,
  'tom section'
);

rep(
  `      <div class="board">
        <div class="grid" id="ftlGrid"></div>
        <div class="kb" id="ftlKb"></div>
      </div>`,
  `      <div class="board">
        <div class="grid" id="ftlGrid" role="group" aria-label="Footle board, six guesses of seven letters"></div>
        <div class="kb" id="ftlKb" role="group" aria-label="On-screen keyboard">
          <noscript><p class="fsay">The board needs JavaScript. The real one is in the app.</p></noscript>
        </div>
        <p class="fsay" id="ftlSay" role="status"></p>
      </div>`,
  'board a11y'
);

rep(
  `      <div class="clock">
        <div class="clab">Next one in</div>
        <div class="ctime" id="clock">00:00:00</div>`,
  `      <div class="clock">
        <div class="clab" id="clabT">Next one in</div>
        <div class="ctime" id="clock" role="timer" aria-live="off" aria-labelledby="clabT">--:--:--</div>`,
  'clock semantics'
);

rep(
  `          <span class="tried">One guess played. Five left.</span>`,
  `          <span class="tried" id="ftlLeft"></span>`,
  'tried live'
);

rep(
  `</div>

<div class="w">
  <div class="sec">
    <h2>Seventy-two clubs on file</h2>`,
  `</section>

<div class="w">
  <section class="sec" aria-labelledby="clubsT">
    <h2 id="clubsT">Seventy-two clubs on file</h2>`,
  'clubs section'
);

rep(
  `    <div class="clubs" id="clubBody"></div>
    <a class="more" href="#">See all seventy-two</a>
    <div class="adslot"><span class="adlab">Advertisement</span></div>
  </div>
</div>`,
  `    <div class="clubs" id="clubBody">
      <noscript><p class="sub">The index needs JavaScript. Every club named above has a
      file of its own in the app.</p></noscript>
    </div>
    <a class="more tap" href="#">See all seventy-two</a>
    <div class="adslot"><span class="adlab">Advertisement</span></div>
  </section>
</div>`,
  'clubs body'
);

rep(
  `<div class="w">
  <div class="foot">`,
  `<div class="w">
  <footer class="foot">`,
  'footer open'
);
rep(
  `      </div>
    </div>
  </div>
</div>

<script>`,
  `      </div>
    </div>
  </footer>
</div>

<script>`,
  'footer close'
);

rep(
  `<a href="#"><svg class="mk-i" viewBox="0 0 24 24" aria-hidden="true"><path d="M16.7 12.6`,
  `<a class="tap" href="#"><svg class="mk-i" viewBox="0 0 24 24" aria-hidden="true"><path d="M16.7 12.6`,
  'iphone tap'
);
rep(
  `<a href="#"><svg class="mk-i" viewBox="0 0 24 24" aria-hidden="true"><path d="M3.6 2.2`,
  `<a class="tap" href="#"><svg class="mk-i" viewBox="0 0 24 24" aria-hidden="true"><path d="M3.6 2.2`,
  'android tap'
);

/* ============ 4. SCRIPT ============ */

rep(
  `var metaEl = document.querySelector('.head .meta');`,
  `var metaEl = document.getElementById('subject');
var asmtEl = document.querySelector('.asmt');`,
  'cache asmt'
);

// 4a. the stub becomes a real table: a caption, and a row header per discipline
rep(
  `    var tr = el('tr');
    tr.appendChild(el('td','lab', qq.d));`,
  `    var tr = el('tr');
    var th = el('th','lab', qq.d); th.scope = 'row';
    tr.appendChild(th);`,
  'stub th'
);
rep(
  `function drawStub(){
  stubTable.textContent = '';`,
  `function drawStub(){
  stubTable.textContent = '';
  var cap = el('caption','vh','The report so far, by discipline');
  stubTable.appendChild(cap);`,
  'stub caption'
);
rep(
  `.stub td{padding:9px 10px;font-size:var(--t-sec);border-bottom:1px solid var(--rule);color:var(--ink)}`,
  `.stub td,.stub th{padding:9px 10px;font-size:var(--t-sec);border-bottom:1px solid var(--rule);
      color:var(--ink);text-align:left;font-weight:400}`,
  'stub th css'
);

// 4b. the A/B/C/D chip is a printed marker, not part of the option's name
rep(
  `    b.appendChild(el('u',null,'ABCD'[i]));`,
  `    var chip = el('u',null,'ABCD'[i]); chip.setAttribute('aria-hidden','true');
    b.appendChild(chip);`,
  'chip aria-hidden'
);

// 4c. answering disabled the button that had focus, which dropped focus to the
//     body — from there "Next question" is 40-odd tab stops back up the page.
rep(
  `      var nx = el('button','next'); nx.type = 'button';
      nx.textContent = (idx === QS.length-1) ? 'File the report' : 'Next question';
      nx.addEventListener('click', function(){
        var c2 = document.querySelector('.asmt');
        var b2 = c2.getBoundingClientRect().top;
        idx++;
        if (idx < QS.length) {
          renderQ();
          var a2 = c2.getBoundingClientRect().top;
          if (Math.abs(a2 - b2) > 2) window.scrollBy(0, a2 - b2);
        } else finish();
      });
      ab.appendChild(nx);`,
  `      var nx = el('button','next'); nx.type = 'button';
      nx.textContent = (idx === QS.length-1) ? 'File the report' : 'Next question';
      nx.addEventListener('click', function(){
        // A double-tap used to fire this twice; the second click landed on
        // whatever the re-rendered layout had moved under the finger.
        if (nx.disabled) return;
        nx.disabled = true;
        var b2 = asmtEl.getBoundingClientRect().top;
        idx++;
        if (idx < QS.length) {
          renderQ();
          var a2 = asmtEl.getBoundingClientRect().top;
          if (Math.abs(a2 - b2) > 2) window.scrollBy(0, a2 - b2);
          var q2 = ab.querySelector('.q');
          if (q2) q2.focus({preventScroll:true});
        } else finish();
      });
      ab.appendChild(nx);
      // Focus follows the reader to the only thing left to do.
      nx.focus({preventScroll:true});`,
  'next guard+focus'
);

rep(
  `  ab.appendChild(el('p','q', qq.q));`,
  `  var qEl = el('p','q', qq.q); qEl.tabIndex = -1;
  ab.appendChild(qEl);`,
  'q focusable'
);

rep(
  `  var why = el('div','why'); why.style.display = 'none';`,
  `  var why = el('div','why'); why.style.display = 'none';
  why.setAttribute('role','status');`,
  'why status'
);

rep(
  `      var card = document.querySelector('.asmt');
      var before = card.getBoundingClientRect().top;
      stub.classList.add('on');
      drawStub();
      // Layout has changed; put the card back where the reader left it.
      var after = card.getBoundingClientRect().top;`,
  `      var before = asmtEl.getBoundingClientRect().top;
      stub.classList.add('on');
      drawStub();
      // Layout has changed; put the card back where the reader left it.
      var after = asmtEl.getBoundingClientRect().top;`,
  'answer reflow cache'
);

rep(
  `  document.querySelector('.asmt').style.display = 'none';`,
  `  asmtEl.style.display = 'none';`,
  'finish hide'
);

rep(
  `  document.getElementById('verdict').classList.add('on');
}`,
  `  var v = document.getElementById('verdict');
  v.classList.add('on');
  // The box that held focus has just been hidden; without this, focus is on
  // <body> and the verdict is 50 tab stops away.
  v.focus({preventScroll:true});
}`,
  'verdict focus'
);

// 4d. Footle: state that is not only colour, guesses that end, and a reply to a
//     press that cannot be honoured
rep(
  `      grid.appendChild(el('span', cls, txt[c] || ''));`,
  `      var t = el('span', cls, txt[c] || '');
      if (marks) t.setAttribute('aria-label', txt[c] + ', ' + MARKWORD[marks[c]]);
      else t.setAttribute('aria-hidden','true');
      grid.appendChild(t);`,
  'tile aria'
);
rep(
  `function score(g){`,
  `var MARKWORD = {hit:'right letter, right place', near:'in the surname, wrong place', off:'not in it'};
var say = document.getElementById('ftlSay');
var left = document.getElementById('ftlLeft');
function report(msg){ if (say) say.textContent = msg; }
function drawLeft(){
  if (!left) return;
  var used = guesses.length, rem = ROWS - used;
  left.textContent = used === 0 ? 'Six guesses, none played yet.'
    : used + (used === 1 ? ' guess played. ' : ' guesses played. ')
      + (rem === 0 ? 'None left.' : rem + (rem === 1 ? ' left.' : ' left.'));
}
function score(g){`,
  'footle helpers'
);

rep(
  `function press(ch){
  if (guesses.length >= ROWS) return;
  if (ch === '\\u232b') { cur = cur.slice(0,-1); }
  else if (ch === '\\u21b5') {
    if (cur.length !== LEN) return;`,
  `var over = false;
function press(ch){
  if (over || guesses.length >= ROWS) return;
  if (ch === '\\u232b') { cur = cur.slice(0,-1); report(''); }
  else if (ch === '\\u21b5') {
    // A press the board cannot honour used to do nothing at all, silently.
    if (cur.length !== LEN) {
      report(cur.length ? 'Seven letters. That is ' + cur.length + '.' : 'Type a surname first \\u2014 seven letters.');
      grid.classList.remove('short'); void grid.offsetWidth; grid.classList.add('short');
      return;
    }`,
  'press guards'
);

rep(
  `    guesses.push(cur); cur = '';
    document.getElementById('cnote').textContent = (guesses[guesses.length-1] === ANSWER)
      ? 'Got it. There is a new one every midnight, and a streak to keep.'
      : 'That is one of six. The rest is waiting in the app, and it resets tonight.';
    drawKb();
  }`,
  `    var played = cur;
    var counts = marks.reduce(function(a,m){ a[m]++; return a; }, {hit:0,near:0,off:0});
    guesses.push(cur); cur = '';
    var won = played === ANSWER;
    over = won || guesses.length >= ROWS;
    document.getElementById('cnote').textContent = won
      ? 'Got it. There is a new one every midnight, and a streak to keep.'
      : (guesses.length >= ROWS
          ? 'Six played, and that is the day. A new surname lands at midnight.'
          : 'That is one of six. The rest is waiting in the app, and it resets tonight.');
    report(won ? played + '. All seven, first name on the sheet.'
      : played + '. ' + counts.hit + ' in place, ' + counts.near + ' in the surname, ' + counts.off + ' not in it.');
    drawKb(); drawLeft();
  }`,
  'press submit'
);

rep(
  `function drawKb(){
  kb.textContent = '';`,
  `function drawKb(){
  kb.textContent = '';
  if (over){
    var p = el('p','fsay', guesses[guesses.length-1] === ANSWER
      ? 'Solved. The next surname lands at midnight.'
      : 'Six played. The next surname lands at midnight.');
    kb.appendChild(p); return;
  }`,
  'kb over'
);

rep(
  `      b.setAttribute('aria-label', wide ? (ch === '\\u21b5' ? 'Submit guess' : 'Delete letter') : ('Letter ' + ch));`,
  `      b.setAttribute('aria-label', wide ? (ch === '\\u21b5' ? 'Submit guess' : 'Delete letter')
        : ('Letter ' + ch + (usedLetters[ch] ? ', not in the surname' : '')));`,
  'key aria state'
);

// 4e. the global key listener answered to Cmd+R and to any letter typed while
//     the reader was inside the assessment
rep(
  `document.addEventListener('keydown', function(e){
  var k = e.key.toUpperCase();
  if (k === 'ENTER') press('\\u21b5');
  else if (k === 'BACKSPACE') press('\\u232b');
  else if (/^[A-Z]$/.test(k)) press(k);
});`,
  `document.addEventListener('keydown', function(e){
  if (!e.key || e.metaKey || e.ctrlKey || e.altKey) return;   // Cmd+R typed an R
  var t = e.target;
  // Typing belongs to whatever the reader is actually in. Only the board and
  // the bare page hand their keys to Footle.
  if (t && t.closest && t.closest('a,button,input,textarea,select,[contenteditable]')
      && !t.closest('#tomorrow')) return;
  var k = e.key.toUpperCase();
  if (k === 'ENTER') { if (t && t.closest && t.closest('button,a')) return; press('\\u21b5'); }
  else if (k === 'BACKSPACE') press('\\u232b');
  else if (/^[A-Z]$/.test(k)) press(k);
});`,
  'keydown guards'
);

// 4f. the clock: honest across the rollover, and asleep in a background tab
rep(
  `function tick(){
  var now = new Date();
  var mid = new Date(now.getFullYear(), now.getMonth(), now.getDate()+1, 0, 0, 0);
  var s = Math.max(0, Math.floor((mid - now)/1000));
  var p = function(n){ return String(n).padStart(2,'0'); };
  document.getElementById('clock').textContent =
    p(Math.floor(s/3600)) + ':' + p(Math.floor(s/60)%60) + ':' + p(s%60);
}

drawStub(); renderQ(); drawGrid(); drawKb(); tick(); setInterval(tick, 1000);`,
  `var clockEl = document.getElementById('clock'), cnoteEl = document.getElementById('cnote');
var day = new Date().getDate();
function tick(){
  var now = new Date();
  var mid = new Date(now.getFullYear(), now.getMonth(), now.getDate()+1, 0, 0, 0);
  var s = Math.max(0, Math.floor((mid - now)/1000));
  var p = function(n){ return String(n).padStart(2,'0'); };
  clockEl.textContent = p(Math.floor(s/3600)) + ':' + p(Math.floor(s/60)%60) + ':' + p(s%60);
  // Midnight passed with the page still open. The board on screen is yesterday's,
  // and saying "next one in 23:59:58" over it would be a lie.
  if (now.getDate() !== day){
    day = now.getDate();
    cnoteEl.textContent = 'Midnight passed. Today\\u2019s surname is live \\u2014 reload for it.';
    report('A new surname is live. Reload the page for today\\u2019s board.');
  }
}
var timer = null;
function runClock(){
  if (timer) clearInterval(timer);
  tick();
  if (!document.hidden) timer = setInterval(tick, 1000);
}
document.addEventListener('visibilitychange', runClock);

drawStub(); renderQ(); drawGrid(); drawKb(); drawLeft(); runClock();`,
  'clock hardening'
);

fs.writeFileSync(P, s);
const after = Buffer.byteLength(s);
console.log('edits applied:', n, '| bytes', before, '->', after, '(' + (after - before >= 0 ? '+' : '') + (after - before) + ')');
