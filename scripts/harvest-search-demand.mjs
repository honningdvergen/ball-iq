// Google's public suggest endpoint returns real completions, popularity-ordered.
const SEEDS = [
  'football quiz','football trivia','soccer quiz','football quiz questions',
  'guess the footballer','football game','football wordle','name the player',
  'premier league quiz','football questions','football players quiz',
  'who am i football','football puzzle','football quiz with answers',
];
const seen = new Map();
async function suggest(q) {
  const u = `https://suggestqueries.google.com/complete/search?client=firefox&hl=en&q=${encodeURIComponent(q)}`;
  try {
    const r = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(15000) });
    if (!r.ok) return [];
    const j = JSON.parse(await r.text());
    return Array.isArray(j?.[1]) ? j[1] : [];
  } catch { return []; }
}
for (const seed of SEEDS) {
  const base = await suggest(seed);
  base.forEach((s, i) => seen.set(s, Math.min(seen.get(s) ?? 99, i)));
  // a-z expansion surfaces the long tail Google ranks under each seed
  for (const c of 'abcdefghijklmnopqrstuvwxyz') {
    const more = await suggest(`${seed} ${c}`);
    more.forEach((s, i) => seen.set(s, Math.min(seen.get(s) ?? 99, i + 10)));
    await new Promise(r => setTimeout(r, 120));
  }
  process.stderr.write('.');
}
const rows = [...seen.entries()].sort((a, b) => a[1] - b[1]);
console.log(JSON.stringify(rows.map(([q, rank]) => ({ q, rank })), null, 0));
