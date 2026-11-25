// What the Home JS budget (scripts/audit-home-budget.mjs) adds for the parts of
// Sentry that production ships and the build being measured does not have.
// Two parts, each read from the build itself, never assumed from the machine:
//
//   the SDK        65 KB of Home's eager JS (measured 24 Nov 2026, SDK
//                  10.76.2). In the bytes when the build had a DSN; a build
//                  without one (CI, a worktree with no .env.local) tree-shakes
//                  it away and is charged for it.
//   the debug IDs  about 6 KB: one small snippet per eager chunk, stamped by
//                  the Sentry vite plugin. Until 25 Nov 2026 only Vercel's
//                  build had them (the plugin was off without a token), and
//                  every other machine was charged 6 KB on trust. vite.config
//                  .js now stamps them in every build, so they are normally
//                  in the bytes and the charge is 0; the 6 stays for a build
//                  made with the plugin off.
//
// The old single constant, 71, was these two added together.
export const SENTRY_SDK_KB = 65;
export const SENTRY_DEBUG_ID_KB = 6;

/** A chunk the Sentry plugin stamped carries this marker next to its ID. */
export const hasDebugId = (code) => /sentry-dbid-[0-9a-f]{8}-/.test(code);
/** The SDK is in a chunk when the DSN's ingest host is. */
export const hasSentrySdk = (code) => /ingest(\.[a-z]+)?\.sentry\.io/.test(code);

/**
 * KB to add to the measured total, and why.
 * dsnInEnv: VITE_SENTRY_DSN is in this process's environment (Vercel), so the
 * SDK is bundled whatever the text search says.
 */
export function sentryCharge({ dsnInEnv, sdkInBuild, debugIdsInBuild }) {
  const sdk = dsnInEnv || sdkInBuild ? 0 : SENTRY_SDK_KB;
  const ids = debugIdsInBuild ? 0 : SENTRY_DEBUG_ID_KB;
  const why = [];
  if (sdk) why.push('the Sentry SDK (no DSN in this build)');
  if (ids) why.push('Sentry debug IDs (this build was not stamped)');
  return { kb: sdk + ids, why: why.join(' + ') };
}
