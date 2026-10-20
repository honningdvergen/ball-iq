// Spanish — Castilian, kept neutral enough for Latin America: "tú", standard
// football vocabulary, no vosotros-only forms and no regional slang.
// LAZY: loaded by src/i18n/index.js with import('./es.js') for Spanish players
// only. Never import this file statically from app code, or English players
// pay for it on Home.
//
// Every key here must exist in en.js (a test enforces it). A key missing here
// is fine: t() falls back to the English string.
export default {
  'tab.home': 'Inicio',
  'tab.online': 'Multijugador',
  'tab.daily': 'Historial',
  'tab.profile': 'Perfil',

  // "Still up" at 00:00–04:59. "Trasnochando" is gender-neutral, unlike
  // "¿Sigues despierto/a?", and reads the same in Spain and Latin America.
  'home.greeting.night': 'Trasnochando',
  'home.greeting.morning': 'Buenos días',
  'home.greeting.afternoon': 'Buenas tardes',
  'home.greeting.evening': 'Buenas noches',

  'settings.language': 'Idioma',
};
