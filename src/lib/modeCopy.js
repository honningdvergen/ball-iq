/**
 * One string per mode, from one place.
 *
 * ⚠️ FOOTLE HAD FOUR DESCRIPTIONS AT ONCE and they read as four different
 * games:
 *   Home hero      "Surname of a footballer in 6 guesses"
 *   Daily row      "Guess the player"
 *   In-game header "Guess the name"
 *   Help sheet     "Guess the name today's footballer goes by…"
 *
 * That is not a typo class, it is a drift class: the strings live next to the
 * components that render them, so a copy change touches whichever one the
 * author happened to be looking at. d60bdee is the proof — it rewrote the
 * prompt in three files and missed the mobile hero, so for a day the app said
 * one thing on desktop and the contradicted thing on every phone, and the
 * reports that prompted the fix kept arriving from the players who never saw
 * it. footle-prompt-copy.test.js exists because of that commit.
 *
 * A fix applied by grepping is only as good as the grep. These are the strings
 * a grep cannot miss, because there is only one of each.
 *
 * ⚠️ THE LONG FORM IS NOT HERE ON PURPOSE. The help sheet's "usually a
 * surname, sometimes a one-name legend" qualifies the claim the short forms
 * make, and it is load-bearing: 33 of the 406 answers are single-name players
 * (PELE, XAVI, RAUL, NEYMAR, WILLIAN, ISCO, PEDRI, ENDRICK and 26 more —
 * counted from WORDLE_FULL_NAMES entries with an empty first-name prefix), so
 * "surname" is literally wrong about one day in twelve. The short forms are
 * short by choice; the sheet and the FAQ carry the nuance. Do not collapse
 * them into one string.
 */

/** Card and hero copy — the full promise. */
export const FOOTLE_TAGLINE = 'Surname of a footballer in 6 guesses';

/** Tight rows (Daily) and the in-game header, where the count is already shown
 *  or irrelevant. Same words, fewer of them — never a different verb. */
export const FOOTLE_SHORT = 'Surname of a footballer';

export const MODE_COPY = {
  footle: { tagline: FOOTLE_TAGLINE, short: FOOTLE_SHORT },
};
