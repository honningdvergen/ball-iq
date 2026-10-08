// The letters a plain keyboard cannot type, and what people type instead.
//
// ONE table, shared by the Trail's grader (lib/trail.js) and by the name search
// every guess box uses (normaliseName in lib/mysteryPlayer.js). They used to be
// separate: the grader knew that Ødegaard is typed "odegaard", the search did
// not, so the suggestions list came back empty for the obvious spelling of
// about 150 of the pool's players (Ødegaard, Højbjerg, Yıldız, Błaszczykowski)
// while the game underneath would have accepted it.
//
// Note what is NOT here: é č ö ü å ñ ş all DECOMPOSE, so stripping combining
// marks after NFD already handles them. These are their own characters, so NFD
// leaves them alone and a mark-strip followed by an a-z filter DELETES them.
export const LETTER_FOLD = {
  ø: "o", æ: "ae", œ: "oe", ß: "ss", ł: "l", đ: "d", ð: "d", þ: "th",
  ı: "i", ŧ: "t", ħ: "h", ŋ: "n", ĸ: "k",
};
const LETTER_RE = /[øæœßłđðþıŧħŋĸ]/g;

/** Lowercase, with every non-decomposing letter swapped for its plain form. */
export function foldLetters(s) {
  return String(s || "").toLowerCase().replace(LETTER_RE, (c) => LETTER_FOLD[c] || c);
}

// German and Nordic spelling admits TWO correct plain-ascii forms: Müller is
// written "Muller" or "Mueller", Ødegaard "Odegaard" or "Oedegaard", and both
// are things a real person types. One fold cannot satisfy both, so a name has a
// second spelling with these written out.
export const DIGRAPH_FOLD = { "ü": "ue", "ö": "oe", "ä": "ae", "ø": "oe", "å": "aa" };
const DIGRAPH_RE = /[üöäøå]/g;

/** Lowercase, with ü ö ä ø å written as the two letters they stand for. */
export function foldDigraphs(s) {
  return String(s || "").toLowerCase().replace(DIGRAPH_RE, (c) => DIGRAPH_FOLD[c] || c);
}
