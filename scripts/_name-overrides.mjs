// Curated corrections to Wikidata player labels, keyed by QID.
//
// ⚠️ WHY THIS FILE EXISTS. src/data/mysteryPool.json is generated from
// Wikidata, and Wikidata labels are the text we render to players. That means
// ANYONE CAN EDIT WHAT OUR APP SAYS. There is no review step between a wiki
// edit and a name on a live daily puzzle, and the same string ships inside the
// iOS and Android binaries.
//
// Found 2026-08-05: Jude Bellingham — the most guessable player at Real
// Madrid, and a scheduled answer — was in the pool as "Jude Belligoal". Not a
// stale snapshot; that is still the live label, with a matching vandalised
// alias ("Jude Victor William Belligoal"). A player typing "Bellingham" was
// told no such player existed. This was mistaken for a MISSING player for two
// days because a search for "Bellingham" found nothing.
//
// A football pun is the benign version. The same path carries anything else.
//
// RULES FOR THIS MAP
//  - Key by QID, never by name — the name is the thing that is wrong.
//  - One line of WHY per entry. An override with no reason is indistinguishable
//    from a typo of our own.
//  - This is a correction layer, not an editorial one. Use it to restore the
//    name a football fan would type, not to pick a preferred nickname.
//  - Re-check periodically: if Wikidata is fixed upstream, the override becomes
//    a no-op, which scripts/fix-pool-names.mjs reports rather than hides.
export const NAME_OVERRIDES = {
  // Vandalised label, live as of 2026-08-05. Real name: Jude Victor William
  // Bellingham. Real Madrid, England, b. 2003-06-29.
  Q66241169: 'Jude Bellingham',
};

// Players Wikidata places in a squad they have never been part of, or who are
// not footballers at all. fetch-squads' filters cannot catch these because the
// underlying statement is simply false rather than malformed.
//
// ⚠️ NEVER remove a QID that appears in src/data/mysterySchedule.json — the
// schedule is frozen and a removed answer makes that day unplayable. The script
// refuses rather than letting it through.
export const NOT_IN_SQUAD = {
  // Basketball player. Wikidata gives him a P54 membership of Real Madrid CF
  // (the football club) rather than Real Madrid Baloncesto, so the men's-only
  // and football-class filters both pass him. His other teams are Valencia BC,
  // CB Prat, Joventut Badalona and Spain's national BASKETBALL team.
  Q19845456: 'Alberto Abalde — basketball player, mis-linked to Real Madrid CF',
  // Mexican forward (Tigres, Sporting KC). Carries an open-ended Real Madrid CF
  // membership on Wikidata that never happened.
  Q2617208: 'Alan Pulido — never played for Real Madrid',
};
