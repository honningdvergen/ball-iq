import { readFileSync, writeFileSync, statSync } from 'fs';
let s = readFileSync('scouting-d.html', 'utf8');
const start = Buffer.byteLength(s);
let n = 0;
const sub = (a, b) => {
  const c = s.split(a).length - 1;
  if (c !== 1) { console.error('EXPECTED 1 GOT ' + c + ': ' + a.slice(0, 60)); process.exit(1); }
  s = s.split(a).join(b); n++;
};

// ── 1. World Cup IP. The app was rejected once under Apple 5.2.1 for exactly
//       this, and the web build ships inside the native binary, so a World Cup
//       question on the marketing page is a real risk rather than a nit.
//       Replaced with a verified Euros row from the bank, same era band.
sub("{ d:'World Cup', q:'Which country won the 2010 World Cup?',\n    o:['Spain','Netherlands','Germany','Brazil'], a:0,\n    why:\"Spain beat Netherlands 1-0 in Johannesburg with Iniesta's extra-time winner.\" },",
    "{ d:'Euros', q:'Which two-nation pairing hosted Euro 2000, the first ever co-hosted European Championship?',\n    o:['Austria & Switzerland','Poland & Ukraine','Belgium & Netherlands','Spain & Portugal'], a:2,\n    why:'Belgium and the Netherlands co-hosted Euro 2000, won by France in the Rotterdam final.' },");

// ── 2. A 1960 question against the standing 1990-2020 era rule. Swapped for a
//       2017 stadium row, which is also a warmer question for a cold visitor.
sub("{ d:'Legends', q:'Which country won the very first European Championship in 1960?',\n    o:['West Germany','Italy','USSR','Yugoslavia'], a:2,\n    why:\"The USSR beat Yugoslavia 2-1 in extra time. Lev Yashin was in goal.\" }",
    "{ d:'Legends', q:\"Tottenham's old stadium, demolished in 2017, went by what name?\",\n    o:['The Cottage','White Hart Lane','The Dell','Maine Road'], a:1,\n    why:\"White Hart Lane was Spurs' home for 118 years; the new stadium was built on the very same site.\" }");

// The report's row labels follow the questions.
sub("QS.forEach(function(qq,i){\n    var tr = el('tr');\n    tr.appendChild(el('td','lab', qq.d));", "QS.forEach(function(qq,i){\n    var tr = el('tr');\n    tr.appendChild(el('td','lab', qq.d));");

// ── 3. THE SCROLL JUMP. The report inserts ABOVE the question, so answering
//       moved the page ~393px under the reader every single time, then moved it
//       back on Next. On a phone that is the most likely cause of mid-quiz
//       abandonment, and mid-quiz abandonment IS the activation bottleneck.
//       Anchor the card: measure its position before the DOM changes and
//       restore it after, so the thing being interacted with never moves.
sub("      stub.classList.add('on');\n      drawStub();",
    "      var card = document.querySelector('.asmt');\n" +
    "      var before = card.getBoundingClientRect().top;\n" +
    "      stub.classList.add('on');\n" +
    "      drawStub();\n" +
    "      // Layout has changed; put the card back where the reader left it.\n" +
    "      var after = card.getBoundingClientRect().top;\n" +
    "      if (Math.abs(after - before) > 2) window.scrollBy(0, after - before);");

sub("      nx.addEventListener('click', function(){\n        idx++;\n        if (idx < QS.length) renderQ(); else finish();\n      });",
    "      nx.addEventListener('click', function(){\n" +
    "        var c2 = document.querySelector('.asmt');\n" +
    "        var b2 = c2.getBoundingClientRect().top;\n" +
    "        idx++;\n" +
    "        if (idx < QS.length) {\n" +
    "          renderQ();\n" +
    "          var a2 = c2.getBoundingClientRect().top;\n" +
    "          if (Math.abs(a2 - b2) > 2) window.scrollBy(0, a2 - b2);\n" +
    "        } else finish();\n" +
    "      });");

// ── 4. THE CONTRADICTION. "Hajduk Split get the same treatment as Real Madrid"
//       sat directly above a bar reading Real Madrid 79% / Hajduk 12%. The moat
//       claim was refuted by the data beside it, in front of the exact visitor
//       it exists to convince. A ratio also reads as a completeness score, which
//       is the counted number we removed from copy wearing a different hat.
//       Replaced with an era band: true, useful, and not a scoreboard.
sub("var CLUBS = [\n  ['Liverpool','#C8102E',.92],['Arsenal','#EF0107',.88],['Manchester United','#DA291C',.97],\n  ['Manchester City','#6CABDD',.71],['Chelsea','#034694',.77],['Tottenham Hotspur','#132257',.73],\n  ['Barcelona','#A50044',.83],['Real Madrid','#FEBE10',.79],['Bayern Munich','#DC052D',.70],\n  ['Borussia Dortmund','#FDE100',.46],['Celtic','#018749',.53],['Hajduk Split','#0080C8',.12]\n];",
    "// Era covered, not a fill ratio. A bar that reads 12% next to a sentence\n" +
    "// promising equal treatment refutes the sentence; an era band says what the\n" +
    "// file actually contains and is true for every club on the list.\n" +
    "var CLUBS = [\n" +
    "  ['Liverpool','#C8102E','1959 to today'],['Arsenal','#EF0107','1930 to today'],\n" +
    "  ['Manchester United','#DA291C','1958 to today'],['Manchester City','#6CABDD','1968 to today'],\n" +
    "  ['Chelsea','#034694','1955 to today'],['Tottenham Hotspur','#132257','1961 to today'],\n" +
    "  ['Barcelona','#A50044','1957 to today'],['Real Madrid','#FEBE10','1956 to today'],\n" +
    "  ['Bayern Munich','#DC052D','1965 to today'],['Borussia Dortmund','#FDE100','1966 to today'],\n" +
    "  ['Celtic','#018749','1967 to today'],['Hajduk Split','#0E4C92','1911 to today']\n" +
    "];");

sub("  var d = el('td','depth');\n  var track = el('span'); var f = el('i');\n  f.style.width = Math.round(c[2]*100) + '%';\n  track.appendChild(f); d.appendChild(track); tr.appendChild(d);",
    "  var d = el('td','depth'); d.textContent = c[2]; tr.appendChild(d);");

sub('.depth{width:118px}', '.depth{width:150px;text-align:right;color:var(--onDeskMut);font-size:14.5px;white-space:nowrap}');
sub('.clubs th.dh{text-align:right}', '.clubs th.dh{text-align:right}');
sub('<th class="dh">Depth of file</th>', '<th class="dh">Era on file</th>');

writeFileSync('scouting-d.html', s);
const end = statSync('scouting-d.html').size;
const t = readFileSync('scouting-d.html', 'utf8');
console.log('edits: ' + n + ' | ' + start + ' -> ' + end + ' bytes');
if (end < 150000) { console.error('*** TRUNCATION ***'); process.exit(1); }
console.log('integrity: mast=' + t.includes('class="mast"') + ' letterhead=' + t.includes('class="head"') +
            ' ftl=' + t.includes('ftlGrid') + ' fonts=' + (t.match(/@font-face/g) || []).length +
            ' ends-ok=' + t.trimEnd().endsWith('</script>'));
console.log('worldcup mentions left: ' + (t.match(/World Cup/g) || []).length);
