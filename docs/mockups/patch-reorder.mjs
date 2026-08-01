import { readFileSync, writeFileSync } from 'fs';
let s = readFileSync('scouting-d.html', 'utf8');

// Move the Footle band ABOVE the club list. It is the return loop and the
// most-played mode; burying it under a 12-row table made it the last thing
// anyone found. Reading order is markup order, so this is a real move and not
// a CSS one.
const TOM_START = '<div class="tom" id="tomorrow">';
const FOOT_START = '<div class="w">\n  <div class="foot">';
const CLUBS_START = '  <div class="sec">\n    <h2>Seventy-two clubs on file</h2>';

for (const [name, mark] of [['tom', TOM_START], ['foot', FOOT_START], ['clubs', CLUBS_START]]) {
  const c = s.split(mark).length - 1;
  if (c !== 1) { console.error('anchor "' + name + '" found ' + c + ' times'); process.exit(1); }
}

const tomAt = s.indexOf(TOM_START);
const footAt = s.indexOf(FOOT_START);
if (footAt < tomAt) { console.error('foot precedes tom, layout not as expected'); process.exit(1); }

const tomBlock = s.slice(tomAt, footAt).trimEnd();
if (!tomBlock.includes('ftlGrid') || tomBlock.length > 3000) {
  console.error('extracted block looks wrong (' + tomBlock.length + ' chars)'); process.exit(1);
}

// Cut it out.
s = s.slice(0, tomAt) + s.slice(footAt);

// The clubs section lives inside a .w wrapper; close that wrapper, drop the
// full-bleed Footle band in, then reopen a wrapper for the clubs.
s = s.replace(CLUBS_START, '</div>\n\n' + tomBlock + '\n\n<div class="w">\n' + CLUBS_START);

writeFileSync('scouting-d.html', s);

const openDivs = (s.match(/<div/g) || []).length;
const closeDivs = (s.match(/<\/div>/g) || []).length;
console.log('reordered. div balance: ' + openDivs + ' open / ' + closeDivs + ' close');
if (openDivs !== closeDivs) { console.error('DIV IMBALANCE'); process.exit(1); }
