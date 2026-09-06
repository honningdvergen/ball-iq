// App-level constants shared by Settings and the about copy. Split out of the
// Settings screen so that screen can be a lazy chunk.
// Centralised durations so we can tune motion/UX feel from one place.
// ─── APP META ─────────────────────────────────────────────────────────────────
// Single source of truth for the version string — surfaced in Settings → About.
// Bump on every shipping release.
// Web fallback only — on native the About card shows the REAL installed build
// version via CapApp.getInfo(), so this no longer drifts on each release (the
// bug that left it stuck at "1.0.0-beta" through 1.0.1/1.0.2). Keep it roughly
// current for the web build.
// Injected from package.json at build time (vite.config.js); never hand-edited here.
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || "1.7.3";
// Gated reviewer email — only this account sees the Settings → Review entry
// and can reach the review screen. Server-side RLS on question_review is the
// real security; this is just UI hiding.
export const REVIEWER_EMAIL = "alexbo99@hotmail.no";

// (The old async storage shim on window is gone — reads go straight to
// localStorage; writes go through safeSetItem so QuotaExceededError is
// surfaced via the biq:storage-quota-exceeded toast instead of vanishing.)

// The visible label lives in a sibling .sr-label div, so to a screen reader
// this button was an unnamed control with no state — five of them in a row,
// all announced as just "button" (WCAG 4.1.2). role=switch + aria-checked
// makes the on/off state readable, and `label` names it.
// APP_STORE_ID / APP_STORE_URL / PLAY_STORE_URL moved to ./lib/links.js
// (single source of truth for every store CTA in src/ — imported above).
// Shared style for the three About-card actions (Rate / Share / Feedback).
export const ABOUT_ACTION_STYLE = {
  flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
  padding: "12px 6px", background: "transparent", color: "var(--accent)",
  border: "1.5px solid var(--accent-b)", borderRadius: 12, fontFamily: "inherit",
  fontSize: 12.5, fontWeight: 800, cursor: "pointer", WebkitAppearance: "none",
  appearance: "none", textDecoration: "none",
};

