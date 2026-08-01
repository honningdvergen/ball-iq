import { readFileSync, writeFileSync } from 'fs';
let s = readFileSync('scouting-c.html', 'utf8');
let n = 0;
const sub = (a, b) => {
  const c = s.split(a).length - 1;
  if (c !== 1) { console.error('EXPECTED 1 GOT ' + c + ': ' + a.slice(0, 70)); process.exit(1); }
  s = s.split(a).join(b); n++;
};

// ── THE ONE MOVE ────────────────────────────────────────────────────────
// The page already owned a ground inversion and spent it once, at the very
// end. Amplifying what the system owns (rather than adding effects, which the
// bolder playbook calls the opposite of bold): the page becomes the desk, and
// the report becomes the single lit object on it. A file under a lamp.
sub(':root{\n  --pa:#E7E9E4; --pa2:#DEE1DB; --pa3:#D5D8D2;',
    ':root{\n  --desk:#0E1110; --desk2:#161A17; --deskline:#252B26;\n' +
    '  --onDesk:#C3CBC3; --onDeskHi:#F2F5F1; --onDeskMut:#98A199;\n' +
    '  --pa:#E7E9E4; --pa2:#DEE1DB; --pa3:#D5D8D2;');

sub("body{background:var(--pa);color:var(--ink);",
    "body{background:var(--desk);color:var(--onDesk);");

// Masthead sits on the desk.
sub('.mast{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:18px;\n      padding:13px 28px;border-bottom:2px solid var(--ink)}',
    '.mast{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:18px;\n      padding:14px 28px;border-bottom:1px solid var(--deskline)}');
sub('.ref{font-size:13px;color:var(--mut)}', '.ref{font-size:13px;color:var(--onDeskMut)}');
sub('.mn{display:flex;gap:26px;font-size:15px;font-weight:500;color:var(--mut)}',
    '.mn{display:flex;gap:26px;font-size:15px;font-weight:500;color:var(--onDeskMut)}');
sub('.mn a:hover{color:var(--ink);text-decoration:underline;text-underline-offset:4px}',
    '.mn a:hover{color:var(--onDeskHi);text-decoration:underline;text-underline-offset:4px}');
sub(".getapp{display:inline-flex;align-items:center;min-height:40px;padding:0 16px;\n        background:var(--ink);color:var(--pa);",
    ".getapp{display:inline-flex;align-items:center;min-height:40px;padding:0 16px;\n        background:var(--pa);color:var(--ink);");
sub('.getapp:hover{background:#2B3136}', '.getapp:hover{background:#fff}');

// Opening: display type at full strength. It was clamped to 68px inside a
// 1000px column, which is the type opting out of its own scale.
sub('h1{font-family:\'Archivo Narrow\',sans-serif;font-weight:700;text-transform:uppercase;\n   font-size:clamp(36px,6.2vw,68px);line-height:1.04;letter-spacing:-.012em;\n   max-width:21ch}',
    'h1{font-family:\'Archivo Narrow\',sans-serif;font-weight:700;text-transform:uppercase;\n   font-size:clamp(42px,8.4vw,104px);line-height:.98;letter-spacing:-.018em;\n   max-width:15ch;color:var(--onDeskHi)}');
sub('.lede{margin-top:15px;font-size:19px;line-height:1.5;color:var(--mut);max-width:46ch}',
    '.lede{margin-top:18px;font-size:20px;line-height:1.5;color:var(--onDesk);max-width:44ch}');

// Store routes, on the desk.
sub('.routes{border:1px solid var(--ink);align-self:start}',
    '.routes{border:1px solid var(--deskline);background:var(--desk2);align-self:start}');
sub(".rh{padding:9px 14px;background:var(--ink);color:var(--pa);",
    ".rh{padding:9px 14px;background:var(--pa);color:var(--ink);");
sub('.route{display:flex;align-items:baseline;gap:10px;padding:12px 14px;\n       border-bottom:1px solid var(--rule);font-size:15.5px}',
    '.route{display:flex;align-items:baseline;gap:10px;padding:13px 14px;\n       border-bottom:1px solid var(--deskline);font-size:15.5px;color:var(--onDeskHi)}');
sub('.route:hover{background:#fff}', '.route:hover{background:#1E241F}');
sub('.route span{margin-left:auto;font-size:13.5px;color:var(--mut);white-space:nowrap}',
    '.route span{margin-left:auto;font-size:13.5px;color:var(--onDeskMut);white-space:nowrap}');
sub('.mk-i{width:17px;height:17px;flex:0 0 17px;fill:var(--ink);align-self:center}',
    '.mk-i{width:17px;height:17px;flex:0 0 17px;fill:var(--onDeskHi);align-self:center}');

// ── THE FILE: the one lit object on the desk ────────────────────────────
// Real elevation, offset and blur, no coloured halo.
sub('.stub{display:none;border-top:1px solid var(--rule);border-bottom:1px solid var(--rule);\n      padding:6px 0}',
    '.file{background:var(--pa);color:var(--ink);padding:28px;margin-top:34px;\n      box-shadow:0 30px 70px -26px rgba(0,0,0,.85), 0 2px 0 rgba(255,255,255,.05)}\n' +
    '.file .stub{display:none;border-top:1px solid var(--rule);border-bottom:1px solid var(--rule);\n      padding:6px 0}');

// Sections now sit on the desk.
sub('.sec+.sec{border-top:1px solid var(--rule)}', '.sec+.sec{border-top:1px solid var(--deskline)}');
sub("h2{font-family:'Archivo Narrow',sans-serif;font-weight:700;text-transform:uppercase;\n   font-size:clamp(27px,3.6vw,40px);line-height:1.06;letter-spacing:-.005em}",
    "h2{font-family:'Archivo Narrow',sans-serif;font-weight:700;text-transform:uppercase;\n   font-size:clamp(30px,5vw,58px);line-height:1.02;letter-spacing:-.012em;color:var(--onDeskHi)}");
sub('.sub{margin-top:11px;font-size:17px;color:var(--mut);max-width:58ch;line-height:1.55}',
    '.sub{margin-top:13px;font-size:17.5px;color:var(--onDesk);max-width:58ch;line-height:1.55}');
sub('.clubs th{padding:0 10px 8px;text-align:left;font-size:12.5px;font-weight:700;\n          letter-spacing:.045em;text-transform:uppercase;color:var(--mut);\n          border-bottom:1px solid var(--ink)}',
    '.clubs th{padding:0 10px 8px;text-align:left;font-size:12.5px;font-weight:700;\n          letter-spacing:.045em;text-transform:uppercase;color:var(--onDeskMut);\n          border-bottom:1px solid var(--pa)}');
sub('.clubs td{padding:10px;border-bottom:1px solid var(--rule);font-size:16px}',
    '.clubs td{padding:11px 10px;border-bottom:1px solid var(--deskline);font-size:16px;color:var(--onDeskHi)}');
sub('.clubs tr:hover td{background:#fff}', '.clubs tr:hover td{background:#1E241F}');
sub('.depth span{display:block;height:7px;background:var(--pa3);border:1px solid var(--rule)}',
    '.depth span{display:block;height:7px;background:#20261F;border:1px solid var(--deskline)}');
sub('.depth i{display:block;height:100%;background:var(--ink)}',
    '.depth i{display:block;height:100%;background:var(--pa)}');
sub('.more{display:inline-block;margin-top:16px;font-weight:600;\n      border-bottom:1px solid var(--ink);padding-bottom:1px}',
    '.more{display:inline-block;margin-top:18px;font-weight:600;color:var(--onDeskHi);\n      border-bottom:1px solid var(--onDeskHi);padding-bottom:2px}');

// Footle band differentiates by going one step lighter than the desk, not
// darker: the desk is already the dark. Its own rhythm, per the playbook.
sub('.tom{background:var(--ink);color:var(--pa)}', '.tom{background:var(--desk2);border-top:1px solid var(--deskline);border-bottom:1px solid var(--deskline)}');
sub('.tom h2{color:var(--pa)}', '.tom h2{color:var(--onDeskHi)}');
sub('.tom .sub{color:#A8B0A9}', '.tom .sub{color:var(--onDesk)}');
sub('.clock{border-left:1px solid #3A423C;padding-left:30px}', '.clock{border-left:1px solid var(--deskline);padding-left:30px}');
sub('.clab{font-size:12.5px;letter-spacing:.13em;text-transform:uppercase;color:#8C948D}',
    '.clab{font-size:12.5px;letter-spacing:.13em;text-transform:uppercase;color:var(--onDeskMut)}');
sub('.ctime{font-family:\'Archivo Narrow\',sans-serif;font-weight:700;font-size:52px;line-height:1;\n       font-variant-numeric:tabular-nums;margin-top:7px}',
    '.ctime{font-family:\'Archivo Narrow\',sans-serif;font-weight:700;font-size:clamp(44px,5.4vw,72px);line-height:1;\n       font-variant-numeric:tabular-nums;margin-top:8px;color:var(--onDeskHi)}');
sub('.cnote{margin-top:13px;font-size:15px;color:#A8B0A9;max-width:26ch;line-height:1.5}',
    '.cnote{margin-top:14px;font-size:15px;color:var(--onDeskMut);max-width:26ch;line-height:1.5}');
sub('.key{margin-top:18px;display:flex;flex-wrap:wrap;gap:9px 22px;font-size:14.5px;color:#A8B0A9}',
    '.key{margin-top:18px;display:flex;flex-wrap:wrap;gap:9px 22px;font-size:14.5px;color:var(--onDeskMut)}');
sub('.key .tried{color:var(--pa);font-weight:600}', '.key .tried{color:var(--onDeskHi);font-weight:600}');
sub('.foot{padding:22px 0 30px;font-size:14.5px;color:var(--mut);line-height:1.6;max-width:66ch}',
    '.foot{padding:26px 0 40px;font-size:14.5px;color:var(--onDeskMut);line-height:1.6;max-width:66ch}');
sub(':focus-visible{outline:2px solid var(--ink);outline-offset:3px}',
    ':focus-visible{outline:2px solid var(--onDeskHi);outline-offset:3px}\n.file :focus-visible{outline-color:var(--ink)}');
sub('.adslot{margin:34px 0 0;border:1px solid var(--rule);background:var(--pa2);\n        padding:16px;text-align:center}',
    '.adslot{margin:38px 0 0;border:1px solid var(--deskline);background:var(--desk2);\n        padding:16px;text-align:center}');
sub('.adlab{font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--mut)}',
    '.adlab{font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--onDeskMut)}');
sub('       padding:16px;border:1px dashed var(--rule);color:var(--mut);font-size:13.5px;',
    '       padding:16px;border:1px dashed var(--deskline);color:var(--onDeskMut);font-size:13.5px;');

// ── MARKUP: wrap the file, and move Footle above the clubs ──────────────
sub('  <div class="stub" id="stub"><table id="stubTable"></table></div>',
    '  <div class="file">\n  <div class="stub" id="stub"><table id="stubTable"></table></div>');
sub('      <a class="btn sec" href="#tomorrow">Today&rsquo;s Footle</a>\n    </div>\n  </div>',
    '      <a class="btn sec" href="#tomorrow">Today&rsquo;s Footle</a>\n    </div>\n  </div>\n  </div>');

writeFileSync('scouting-d.html', s);
console.log('bolder edits: ' + n);
