// Phase-1 monetization instrumentation (agreed 2026-06-25, built 2026-08-29):
// LOCAL-ONLY feature-usage counters, so the eventual Pro bundle is decided on
// a month of evidence instead of a guess. Deliberately never transmitted —
// the store privacy label declares no analytics in the native app, and these
// ride inside it. localStorage, one JSON blob, monotonic counts.
//
// Landed inert-by-design: nothing reads these yet. The reading surface (a
// hidden dev panel) comes later; what matters is that the data starts today.
const KEY = 'biq_usage_v1';

export function bumpUsage(name) {
  try {
    const raw = localStorage.getItem(KEY);
    const data = raw ? JSON.parse(raw) : {};
    data[name] = (data[name] || 0) + 1;
    data._since = data._since || new Date().toISOString().slice(0, 10);
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch { /* counters are best-effort — never break a feature over one */ }
}

export function readUsage() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
}
