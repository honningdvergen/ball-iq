#!/usr/bin/env node
/**
 * Where are our ratings, really?
 *
 * ⚠️ THE THING THIS EXISTS TO ANSWER. Apple gives EVERY COUNTRY STOREFRONT its
 * own separate ratings pool. There is no aggregate view anywhere — not in App
 * Store Connect, not on the product page, not in the API. A visitor in the US
 * sees only ratings left by US-storefront accounts.
 *
 * That is why the App Store looked like it had 2 reviews when Alex knew of at
 * least four: on 2026-08-23 we held 3 in GB, 2 in NO and 1 in FR, and ZERO in
 * the US — which is the storefront every default link pointed at until that
 * day. Six ratings, four shelves, no single page showing more than three.
 *
 * So this walks every storefront we could plausibly have a user in and prints
 * the whole picture in one place. No auth, no key: it uses the public iTunes
 * lookup endpoint, which reports averageUserRating and userRatingCount per
 * country.
 *
 * Usage:
 *   node scripts/store-ratings.mjs              # markets with ratings
 *   node scripts/store-ratings.mjs --all        # every storefront checked
 *   node scripts/store-ratings.mjs --json       # machine-readable
 *
 * ⚠️ Google Play has no equivalent public endpoint and its ratings are ALSO
 * country-specific (since late 2021), plus device-type-specific. Play Console
 * → Quality → Ratings has a country breakdown; there is no way to read it
 * from here, so this tool is honest about covering Apple only.
 */
const APP_ID = '6775975961';

// Every storefront in APPLE_STOREFRONTS (src/lib/links.js) plus the markets
// the SEO pages are localised for — those are where visitors actually come
// from, so they are where ratings can appear.
const MARKETS = [
  ['us', 'United States'], ['gb', 'United Kingdom'], ['no', 'Norway'],
  ['de', 'Germany'], ['es', 'Spain'], ['fr', 'France'], ['it', 'Italy'],
  ['br', 'Brazil'], ['tr', 'Türkiye'], ['id', 'Indonesia'], ['nl', 'Netherlands'],
  ['se', 'Sweden'], ['dk', 'Denmark'], ['fi', 'Finland'], ['ie', 'Ireland'],
  ['pt', 'Portugal'], ['pl', 'Poland'], ['ca', 'Canada'], ['au', 'Australia'],
  ['mx', 'Mexico'], ['ar', 'Argentina'], ['in', 'India'], ['za', 'South Africa'],
  ['be', 'Belgium'], ['at', 'Austria'], ['ch', 'Switzerland'], ['cz', 'Czechia'],
  ['gr', 'Greece'], ['hu', 'Hungary'], ['ro', 'Romania'], ['sa', 'Saudi Arabia'],
  ['ae', 'United Arab Emirates'], ['eg', 'Egypt'], ['ng', 'Nigeria'],
  ['jp', 'Japan'], ['kr', 'South Korea'],
];

const ALL = process.argv.includes('--all');
const AS_JSON = process.argv.includes('--json');

async function fetchMarket(cc) {
  const url = `https://itunes.apple.com/lookup?id=${APP_ID}&country=${cc}`;
  try {
    const res = await fetch(url, { headers: { 'user-agent': 'ball-iq-ratings/1.0' } });
    if (!res.ok) return { cc, error: `http ${res.status}` };
    const body = await res.json();
    if (!body.resultCount) return { cc, available: false };
    const r = body.results[0];
    return {
      cc,
      available: true,
      rating: r.averageUserRating || 0,
      count: r.userRatingCount || 0,
      version: r.version || null,
      released: r.currentVersionReleaseDate || null,
    };
  } catch (e) {
    return { cc, error: String(e.message || e) };
  }
}

const rows = [];
// Serial on purpose — 36 requests against a public endpoint, and a burst can
// get throttled into a wrong ZERO, which is exactly the failure this tool must
// never produce.
for (const [cc, name] of MARKETS) {
  const r = await fetchMarket(cc);
  rows.push({ ...r, name });
}

if (AS_JSON) {
  console.log(JSON.stringify(rows, null, 2));
  process.exit(0);
}

const withRatings = rows.filter((r) => r.available && r.count > 0);
const listed = rows.filter((r) => r.available);
const errored = rows.filter((r) => r.error);

const total = withRatings.reduce((s, r) => s + r.count, 0);
const weighted = total
  ? withRatings.reduce((s, r) => s + r.rating * r.count, 0) / total
  : 0;

console.log('\n  BALL IQ — App Store ratings by storefront');
console.log('  ' + '─'.repeat(58));
console.log(`  ${'Market'.padEnd(24)} ${'Rating'.padStart(8)} ${'Count'.padStart(7)}`);
console.log('  ' + '─'.repeat(58));

for (const r of (ALL ? listed : withRatings).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))) {
  const stars = r.count ? `${r.rating.toFixed(1)}★` : '—';
  const note = r.count === 0 ? '  (no ratings yet)' : '';
  console.log(`  ${r.name.padEnd(24)} ${stars.padStart(8)} ${String(r.count).padStart(7)}${note}`);
}

console.log('  ' + '─'.repeat(58));
console.log(`  ${'TOTAL across storefronts'.padEnd(24)} ${(weighted ? weighted.toFixed(2) + '★' : '—').padStart(8)} ${String(total).padStart(7)}`);
console.log('  ' + '─'.repeat(58));

// ⚠️ The single most important line in this output. Without it a reader sees
// the total and assumes it is what a visitor sees. Nobody ever sees it.
console.log(`
  ⚠️  NOBODY SEES THAT TOTAL. Apple shows each visitor only their OWN
      storefront's ratings, so the best any single person can see today is
      ${withRatings.length ? Math.max(...withRatings.map((r) => r.count)) : 0} — in ${withRatings.length ? withRatings.sort((a, b) => b.count - a.count)[0].name : 'no market'}.
      ${withRatings.length} of ${listed.length} listed markets have any ratings at all.`);

if (listed.length && listed[0].version) {
  console.log(`\n  Live version: ${listed[0].version}  (released ${String(listed[0].released).slice(0, 10)})`);
}
if (errored.length) {
  console.log(`\n  ⚠️  ${errored.length} market(s) could not be read: ${errored.map((r) => r.cc).join(', ')}`);
  console.log('      Treat those as UNKNOWN, not as zero.');
}
console.log(`
  Also check by hand:
    · App Store Connect → your app → Ratings and Reviews → territory picker
      (the only place to READ review text and reply to it)
    · Play Console → Quality → Ratings → country breakdown
      (Play ratings are country-specific too, and device-type-specific)
`);
