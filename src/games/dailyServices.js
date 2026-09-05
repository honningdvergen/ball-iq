// The seam between the daily screens (TransferTrail, MysteryPlayer) and the
// environment that hosts them. In the app, App.jsx supplies its haptics,
// sounds and confetti canvas; on the static /transfer-trail/ and
// /mystery-player/ pages the islands supply light stand-ins. The screens must
// never import App.jsx — an island that did would bundle the whole monolith.
// Same shape as FootballWordle's `services` prop, kept separate because these
// two need far less of it.
export const DEFAULT_DAILY_SERVICES = {
  haptic: () => {},
  playSound: () => {},
  Confetti: null,
  // Rendered under the result. The app passes nothing here (native has no
  // store to send anyone to; the web app has its own install banner); the
  // islands pass a phone-only "Get the free app" link.
  GetAppCTA: null,
};

export function resolveDailyServices(services) {
  return { ...DEFAULT_DAILY_SERVICES, ...(services || {}) };
}
