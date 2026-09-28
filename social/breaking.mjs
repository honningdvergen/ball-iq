// Breaking-news watcher: polls football news feeds every 10 min and EXITS when a new, big story
// appears, so a background run wakes the live session to act (X quote-post ≤15 min, Threads ≤30,
// a reel ≤3h). X itself can't be polled from a script (syndication 429s), so we read the outlets
// that relay Romano/Ornstein within minutes (Google News) plus BBC/Guardian/Sky/ESPN.
//
//   node social/breaking.mjs [--every 600] [--max 10800] [--min 3] [--seed]
//
// --seed marks everything currently in the feeds as seen and prints the top items (use once per day).
// Exit 0 + a report on stdout = new story. Exit 3 = heartbeat (max runtime reached, nothing new).
import fs from 'node:fs';

const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > -1 ? process.argv[i + 1] : d; };
const EVERY = Number(arg('every', 600)) * 1000, MAX = Number(arg('max', 10800)) * 1000, MIN = Number(arg('min', 5));
const SEEN_FILE = new URL('./state/breaking_seen.json', import.meta.url);
const seen = new Set(fs.existsSync(SEEN_FILE) ? JSON.parse(fs.readFileSync(SEEN_FILE)) : []);
const gn = q => `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-GB&gl=GB&ceid=GB:en`;
const FEEDS = [
  ['romano', gn('"Fabrizio Romano" when:1h')],
  ['ornstein', gn('Ornstein football when:1h')],
  ['herewego', gn('"here we go" football when:1h')],
  ['sacked', gn('manager sacked football when:1h')],
  ['bbc', 'https://feeds.bbci.co.uk/sport/football/rss.xml'],
  ['guardian', 'https://www.theguardian.com/football/rss'],
  ['sky', 'https://www.skysports.com/rss/12040'],
];
const ESPN = ['eng.1', 'uefa.champions', 'esp.1'].map(l => `https://site.api.espn.com/apis/site/v2/sports/soccer/${l}/news?limit=15`);

const VERBS = /here we go|sacked|\bsack\b|appointed|agreed|\bsigns?\b|signed|confirmed|official|banned|sanction|points? deduction|relegat|charged|verdict|resign|walk(s|ed)? out|bid\b|record fee|stripped|appeal|breaks? silence|hits? back|slams|admits|double contract|11[45] charges/i;
const NAMES = /man(chester)? city|man(chester)? utd|manchester united|arsenal|liverpool|chelsea|tottenham|spurs|real madrid|barcelona|bayern|psg|haaland|salah|mbapp|ronaldo|messi|kane|guardiola|\bpep\b|carrick|klopp|arteta|slot|mourinho|yamal|bellingham|rodri|palmer|saka/gi;
const SKIP = /died|death|dies|tragedy|funeral|cancer|betting|odds|nfl|darts|cricket|rugby|tennis|f1\b/i;

function score(src, title) {
  if (SKIP.test(title)) return 0;
  const names = new Set((title.match(NAMES) || []).map(s => s.toLowerCase())).size;
  return (VERBS.test(title) ? 2 : 0) + Math.min(names, 3) + (['romano', 'ornstein', 'herewego'].includes(src) ? 1 : 0);
}

async function fetchAll() {
  const items = [];
  await Promise.all(FEEDS.map(async ([src, url]) => {
    try {
      const s = await (await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(15000) })).text();
      for (const it of s.match(/<item>[\s\S]*?<\/item>/g) || []) {
        const t = (it.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/) || [])[1];
        const d = (it.match(/<pubDate>(.*?)<\/pubDate>/) || [])[1];
        const l = (it.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/) || [])[1];
        if (t) items.push({ src, title: t.trim(), at: d ? new Date(d) : new Date(), link: l });
      }
    } catch { /* one dead feed never stops the others */ }
  }));
  await Promise.all(ESPN.map(async url => {
    try {
      const j = await (await fetch(url, { signal: AbortSignal.timeout(15000) })).json();
      for (const a of j.articles || []) items.push({ src: 'espn', title: a.headline, at: new Date(a.published), link: a.links?.web?.href });
    } catch { }
  }));
  const key = i => i.title.toLowerCase().replace(/ - [^-]+$/, '').replace(/\W+/g, ' ').trim().slice(0, 90);
  return items.map(i => ({ ...i, key: key(i), score: score(i.src, i.title) }));
}

const save = () => fs.writeFileSync(SEEN_FILE, JSON.stringify([...seen].slice(-3000)));
const fmt = i => `${String(i.score)} ${i.at.toLocaleTimeString('en-GB', { timeZone: 'Europe/Oslo', hour: '2-digit', minute: '2-digit' })} [${i.src}] ${i.title}${i.link ? '\n    ' + i.link : ''}`;
const start = Date.now();

if (process.argv.includes('--seed')) {
  const items = await fetchAll();
  items.forEach(i => seen.add(i.key)); save();
  const fresh = items.filter(i => Date.now() - i.at < 6 * 3600e3).sort((a, b) => b.score - a.score || b.at - a.at);
  console.log(`seeded ${items.length} items. Top of the last 6h:`); fresh.slice(0, 12).forEach(i => console.log(fmt(i)));
  process.exit(0);
}

for (;;) {
  const items = await fetchAll();
  const hits = items.filter(i => !seen.has(i.key) && i.score >= MIN && Date.now() - i.at < 90 * 60e3)
    .sort((a, b) => b.score - a.score || b.at - a.at);
  items.forEach(i => seen.add(i.key)); save();
  if (hits.length) {
    console.log(`BREAKING (${new Date().toLocaleTimeString('en-GB', { timeZone: 'Europe/Oslo' })} Oslo), ${hits.length} new:`);
    hits.slice(0, 8).forEach(i => console.log(fmt(i)));
    process.exit(0);
  }
  if (Date.now() - start + EVERY > MAX) { console.log('heartbeat: nothing new'); process.exit(3); }
  await new Promise(r => setTimeout(r, EVERY));
}
