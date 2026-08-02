import { readFileSync, writeFileSync, statSync } from 'fs';
let s = readFileSync('scouting-d.html', 'utf8');
const start = Buffer.byteLength(s);
let n = 0;
const sub = (a, b) => {
  const c = s.split(a).length - 1;
  if (c !== 1) { console.error('EXPECTED 1 GOT ' + c + ': ' + a.slice(0, 70)); process.exit(1); }
  s = s.split(a).join(b); n++;
};

// ── THE EXAMPLE WAS UNVERIFIABLE ────────────────────────────────────────
// The tile colours were arithmetically correct, but they were scored against
// TODAY'S hidden answer -- so a reader could not check a single one of them.
// A worked example nobody can check teaches nothing; it just asks for trust
// in colours that look arbitrary. Alex spotted this as "the colours are not
// right", and the underlying complaint is exactly right even though the maths
// was.
//
// Fix: reveal a PAST answer and score the example against that, out loud.
// Today's answer moves to something else so nothing is given away.
// HAALAND stays the teaching case because it is the clearest one available:
// against LAPORTE it produces one green, one amber and five grey, so all
// three states appear once and each is checkable by eye.

// Today's hidden answer moves.
sub("var ANSWER = 'HAALAND', ROWS = 6, LEN = 7;",
    "var ANSWER = 'ALISSON', ROWS = 6, LEN = 7;\n" +
    "// The teaching example is scored against a REVEALED past answer, never\n" +
    "// against today's, so every tile in it can be checked by the reader.\n" +
    "var EG_ANSWER = 'HAALAND', EG_GUESS = 'LAPORTE';");

// The scorer takes an answer, so the example cannot silently follow today's.
sub(`function score(g){
  var out = new Array(LEN).fill('off'), pool = {};
  for (var i=0;i<LEN;i++){ if (g[i]===ANSWER[i]) out[i]='hit'; else pool[ANSWER[i]]=(pool[ANSWER[i]]||0)+1; }
  for (var j=0;j<LEN;j++){ if (out[j]==='hit') continue;
    if (pool[g[j]]>0){ out[j]='near'; pool[g[j]]--; } }
  return out;
}`,
`function score(g, answer){
  var A = answer || ANSWER;
  var out = new Array(LEN).fill('off'), pool = {};
  for (var i=0;i<LEN;i++){ if (g[i]===A[i]) out[i]='hit'; else pool[A[i]]=(pool[A[i]]||0)+1; }
  for (var j=0;j<LEN;j++){ if (out[j]==='hit') continue;
    if (pool[g[j]]>0){ out[j]='near'; pool[g[j]]--; } }
  return out;
}`);

sub("  var g = 'LAPORTE', marks = score(g);", "  var g = EG_GUESS, marks = score(g, EG_ANSWER);");

writeFileSync('scouting-d.html', s);
const end = statSync('scouting-d.html').size;
const t = readFileSync('scouting-d.html', 'utf8');
console.log('edits: ' + n + ' | ' + start + ' -> ' + end + ' bytes');
if (end < 100000) { console.error('*** TRUNCATION ***'); process.exit(1); }
console.log('integrity: fonts=' + (t.match(/@font-face/g) || []).length +
            ' mast=' + t.includes('class="mast"') + ' ftl=' + t.includes('ftlGrid') +
            ' doctype=' + t.trimStart().toLowerCase().startsWith('<!doctype') +
            ' ends-ok=' + t.trimEnd().endsWith('</script>'));
