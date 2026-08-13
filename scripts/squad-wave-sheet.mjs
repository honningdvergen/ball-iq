// squad-wave-sheet.mjs — render a finished squad wave as a contact sheet, using
// the disc treatment we intend to ship rather than the one currently shipping.
//
//   node scripts/squad-wave-sheet.mjs > /tmp/squad-sheet.html
//
// ⚠️ THE FRAMING NUMBERS HERE ARE THE PROPOSAL, not the live ones. Live is
// face 40% / crown pad 5%, which Alex correctly called out as still looking
// wrong: at 40% the head fills the circle with no shoulders, and a 5% pad
// leaves the crown jammed against the rim. FotMob's discs read as head AND
// shoulders with air above. These are the values that produce that.
import { readFileSync, existsSync } from 'fs';
import { execFileSync } from 'child_process';

const FACE = 0.32;      // face box width as a share of the disc (was 0.40)
const CROWN_PAD = 0.12; // minimum air above the crown (was 0.05)
const D = 74;

const wave = JSON.parse(readFileSync('/tmp/squad-wave/wave.json', 'utf8'));
const winners = wave.filter((r) => r.winner && existsSync(r.winner.out));

const cards = winners.map((r) => {
  const box = JSON.parse(execFileSync('/tmp/facebox', [r.winner.out], { encoding: 'utf8', timeout: 30000 }));
  const cm = Array.isArray(box) ? box[0] : box;
  if (!cm || !cm.w) return '';
  const b64 = readFileSync(r.winner.out).toString('base64');
  const w = FACE * D / cm.w, h = w;
  const left = D / 2 - (cm.x + cm.w / 2) * w;
  let top = D * 0.44 - (cm.y + cm.h * 0.5) * h;
  const t = r.winner.top;
  if (t != null) top = Math.max(top, D * CROWN_PAD - t * h);
  return `<figure><div class="disc"><img src="data:image/png;base64,${b64}" style="width:${w.toFixed(1)}px;height:${h.toFixed(1)}px;left:${left.toFixed(1)}px;top:${top.toFixed(1)}px"></div><figcaption>${r.name}</figcaption></figure>`;
}).filter(Boolean);

const missing = wave.filter((r) => !r.winner);

process.stdout.write(`<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1">
<title>Manchester United — current squad</title><style>
body{margin:0;background:#08090C;color:#F2F4F8;font:15px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}
.wrap{max-width:900px;margin:0 auto;padding:28px 18px 70px}
h1{margin:0 0 8px;font-size:22px;letter-spacing:-.025em}
p{margin:0;color:#A8B0BF;font-size:14px;max-width:74ch}
.k{display:flex;gap:18px;margin:14px 0 0;font:700 11px/1 ui-monospace,monospace;letter-spacing:.06em;color:#6E7686;flex-wrap:wrap}
.k b{color:#88E040}
.pitch{margin-top:22px;border-radius:18px;padding:26px 20px 30px;
  background:linear-gradient(#123019,#0b1f10);border:1px solid #1d2a20;
  display:flex;flex-wrap:wrap;gap:18px;justify-content:center}
figure{margin:0;width:88px;display:flex;flex-direction:column;align-items:center;gap:7px}
/* ⚠️ The disc reads as a LENS, not a green hole. The old flat radial green
   competed with the kit; this is a near-neutral well with a cool rim light, so
   the player is the only saturated thing in the circle. */
.disc{position:relative;width:74px;height:74px;border-radius:50%;overflow:hidden;
  background:radial-gradient(120% 100% at 50% 12%,#2a3340 0%,#141a22 55%,#0b0f14 100%);
  box-shadow:0 6px 16px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.16), 0 0 0 2px rgba(255,255,255,.66)}
.disc img{position:absolute;max-width:none;display:block;
  -webkit-mask-image:linear-gradient(to bottom,#000 0%,#000 84%,rgba(0,0,0,.45) 93%,transparent 100%);
  mask-image:linear-gradient(to bottom,#000 0%,#000 84%,rgba(0,0,0,.45) 93%,transparent 100%);
  filter:drop-shadow(0 2px 3px rgba(0,0,0,.5))}
figcaption{font-size:10.5px;font-weight:600;color:#eaf2ec;text-align:center;line-height:1.25;
  background:rgba(0,0,0,.55);padding:3px 7px;border-radius:6px}
.miss{margin-top:22px;color:#8B93A5;font-size:13px}
.miss b{color:#FFC53D}
</style><div class=wrap>
<h1>Manchester United — the current squad, to standard</h1>
<p>Every player found afresh from Commons and held to a hard gate: licence clean, source ≥700px, exactly one face in the finished cutout, ≥320px of real crop, and the crown of the head clear of the frame. Framing is the proposed treatment — face at ${Math.round(FACE * 100)}% of the disc with ${Math.round(CROWN_PAD * 100)}% air above, so you get head and shoulders instead of a face pressed into a circle.</p>
<div class="k"><span><b>${cards.length}</b> to standard</span><span>${missing.length} still blank</span><span>face ${FACE} · pad ${CROWN_PAD}</span></div>
<div class=pitch>${cards.join('')}</div>
${missing.length ? `<p class=miss><b>No cutout yet:</b> ${missing.map((m) => m.name).join(', ')} — nothing on Commons cleared the bar, so they keep their monogram rather than showing a poor face.</p>` : ''}
</div>`);
