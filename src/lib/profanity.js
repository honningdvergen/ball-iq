// Hand-rolled username profanity filter. Covers EN/DE/ES/FR/IT/PT.
//
// IMPORTANT — KEEP IN SYNC WITH SQL TRIGGER `is_profane_username()` in
// the supabase migration that ships with Sprint #84 AAA2. Client-side
// filter is for UX (immediate error before Supabase round-trip); the
// SQL trigger is the bypass-proof gate. If you edit TERMS or WHITELIST
// here, mirror the change in the migration in the same commit.
//
// Scope (deliberately narrow):
//   - Racial / ethnic / homophobic / transphobic / ableist slurs
//   - The hard-four English curses ("fuck", "shit", "cunt", "bitch")
//   - 1–3 hard slur stems per supported non-English language
//
// Excluded (intentional):
//   - Colloquial expletives ("merde", "scheiße", "mierda", "porra",
//     "cazzo", "con") — everyday in their language. Blocking them
//     would over-reject native-speaker usernames.
//   - Anatomical terms that aren't slurs ("ass" blocks Bassani; skip).
//
// Algorithm:
//   1. Lowercase + leet-substitute (@↔a, 4↔a, 3↔e, 1↔i, !↔i, 0↔o,
//      $↔s, 5↔s, 7↔t).
//   2. Strip non-letters (so "f.u.c.k" and "f_u_c_k" still match).
//   3. Mask WHITELIST occurrences first so legit football names whose
//      substrings overlap a slur (Scunthorpe contains "cunt", Arsenal
//      contains "arse") don't trigger false positives.
//   4. Substring-match against TERMS in the remaining text.

const TERMS = [
  // English — hard four
  'fuck', 'shit', 'cunt', 'bitch',
  // English — racial / ethnic / homophobic / transphobic slurs
  'nigg', 'fag', 'faggot', 'tranny', 'kike', 'spic', 'chink', 'gook', 'wetback',
  // English — ableist / sexual violence
  'retard', 'rape', 'pedo', 'molest',
  // German — slurs (excluding colloquial 'scheisse')
  'neger', 'judensau', 'fotze',
  // Spanish — slurs (excluding colloquial 'mierda')
  'maricon', 'puto', 'pendejo',
  // French — slurs (excluding colloquial 'merde' / 'con')
  'pute', 'salope', 'pede', 'encule',
  // Italian — slurs (excluding colloquial 'cazzo')
  'frocio', 'troia', 'stronzo',
  // Portuguese — slurs (excluding colloquial 'porra' / 'caralho')
  'viado', 'puta', 'bicha',
];

const WHITELIST = [
  // Football names that contain near-matches to TERMS entries
  'scunthorpe',   // contains 'cunt'
  'penistone',    // English non-league side
  'arsenal',      // contains 'arse'
  'arshavin',     // Andrey Arshavin
  'mexes',        // Philippe Mexès
  'esposito',     // Italian footballers
  'shittu',       // Danny Shittu, Nigerian defender
];

function normalize(s) {
  if (!s) return '';
  let n = s.toLowerCase();
  n = n
    .replace(/[@4]/g, 'a')
    .replace(/3/g, 'e')
    .replace(/[1!]/g, 'i')
    .replace(/0/g, 'o')
    .replace(/[$5]/g, 's')
    .replace(/7/g, 't');
  n = n.replace(/[^a-zà-ÿ]/g, '');
  return n;
}

export function isProfaneUsername(name) {
  let n = normalize(name);
  if (!n) return false;
  for (const w of WHITELIST) {
    if (!w) continue;
    n = n.split(w).join('_');
  }
  for (const t of TERMS) {
    if (n.includes(t)) return true;
  }
  return false;
}

// Exposed only so the keep-in-sync check between this file and the
// SQL trigger can compare term counts in a future test. Not meant
// for runtime callers — use isProfaneUsername() instead.
export const _PROFANITY_TERMS = TERMS;
export const _PROFANITY_WHITELIST = WHITELIST;
