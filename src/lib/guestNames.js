// The name a player gets before they have typed one (25 Nov 2026).
//
// It was an adjective, a noun and a number ("Turbo Striker 42"). Alex, on the
// Profile tab as a guest: "and do not call the default player mega winger 61
// haha. give him a funny football community inside joke type of name"; and of
// the first ones put to him: "var victim is funny, hoofball enjoyer is funny,
// stat padder is funny". So the pool is football's own in-jokes, in that tone:
// no real people, no clubs, nothing a stranger would mind being called.
//
// It is the name on the Profile card, in a league table and in a room, so:
// - 20 characters at most (set_player_name and the league's name rule cap it),
//   and every one passes the username filter (tests/unit/guest-names.test.js).
// - No number on the end. Two guests in one room can therefore draw the same
//   name; a player is told apart by their id everywhere it matters, and the
//   name is one tap from being their own.
// - Spanish has its own, written as a Spanish fan would say them, not
//   translated word for word.
// The name is made once and kept on the device (App.jsx, getGuestDisplayName):
// a guest who already has one keeps it.
export const GUEST_NAMES = {
  en: [
    "VAR Victim", "Hoofball Enjoyer", "Stat Padder",
    "Offside Enjoyer", "Panenka Enjoyer", "xG Enjoyer", "Tap-In Merchant", "Long Throw Merchant",
    "Nutmeg Victim", "Unused Substitute", "Bench Warmer", "Dodgy Keeper", "Kit Man",
    "Half-Time Orange", "Row Z Finisher", "Injury Time Hero", "Agent of Chaos", "Throw-In Specialist",
  ],
  es: [
    "Víctima del VAR", "Fan del Pelotazo", "Goleador de Penaltis",
    "Fuera de Juego", "Panenka Fallado", "Experto en xG", "Gol de Rebote", "Saque de Banda",
    "Víctima del Caño", "Suplente de Lujo", "Calientabanquillos", "Rey de la Cantada", "El Utillero",
    "Tarjeta Tonta", "Tiro a la Grada", "Héroe del Descuento", "Agente del Caos", "Rey del Piscinazo",
  ],
};

/** One name from the pool of the player's language (English for any other). */
export function pickGuestName(lang, random = Math.random) {
  const pool = GUEST_NAMES[lang] || GUEST_NAMES.en;
  return pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))];
}
