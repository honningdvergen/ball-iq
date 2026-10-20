// English — THE SOURCE OF TRUTH for every UI string that goes through t().
// Statically imported by src/i18n/index.js, so these bytes are on Home's eager
// path: keep it to UI copy (question text is not i18n's job).
//
// Adding a string: add the key HERE first (English exactly as it renders
// today), then the same key in es.js, then call t('the.key') at the site.
// Keys are flat 'area.name' strings. Placeholders are {name}. Plurals are two
// keys, 'area.thing_one' and 'area.thing_other', chosen by t(key, { count }).
export default {
  // Bottom tab bar (App.jsx, the mobile/native tab bar).
  'tab.home': 'Home',
  'tab.online': 'Multiplayer',
  'tab.daily': 'History',
  'tab.profile': 'Profile',

  // Home greeting (components/HomeGreeting.jsx). Time of day, no name.
  'home.greeting.night': 'Still up',
  'home.greeting.morning': 'Good morning',
  'home.greeting.afternoon': 'Good afternoon',
  'home.greeting.evening': 'Good evening',

  // Settings → language row (the option names are endonyms in i18n/index.js).
  'settings.language': 'Language',
};
