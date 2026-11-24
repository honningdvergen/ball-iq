// BALLPARK IN A TEST BUILD ONLY (24 Nov 2026).
//
// Ballpark is a hidden web prototype: /play?ballpark=1 opens it in a browser and
// nothing links to it. Alex wants to try it inside the phone app from TestFlight,
// and it must not reach the public: not the website, not a store release.
//
// So the way in is a BUILD-TIME flag, read here and nowhere else:
//
//   VITE_BALLPARK_PREVIEW=1 npm run build
//
// Vite replaces import.meta.env.VITE_BALLPARK_PREVIEW with its value while it
// builds, so in every normal build this constant is the literal `false`, and the
// two places that read it (the route in App.jsx, the row in HomeScreen.jsx) are
// removed from the bundle along with their strings.
//
// ⚠️ NEVER put the flag in an env file (.env, .env.production, .env.local): a
// file is read by every build made in that checkout, the store build included.
// It is set on the command line for the one build that needs it.
//
// The row carries the literal BALLPARK_PREVIEW_BUILD. scripts/audit-preview-build.mjs
// (a gate of `npm run build`) fails a build whose dist holds that string without
// the flag, and a release script can refuse any bundle that holds it.
export const BALLPARK_PREVIEW = import.meta.env.VITE_BALLPARK_PREVIEW === '1';
