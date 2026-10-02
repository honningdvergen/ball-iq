// First-touch attribution: where did this visitor come from the FIRST time?
//
// WHY. PR #5 records a utm-landing funnel event per tagged visit, which
// answers "did social send anyone who played". It cannot answer the two
// questions that matter for the business: which channel produced ACCOUNTS,
// and which produced APP INSTALLS. Signups run ~10-20 a week (prod, Aug-Sep
// 2026) and nothing says where any of them came from; the signup_attribution
// table was written for this on 2026-08-05 and never wired up.
//
// What this module does, web only:
//   1. captureFirstTouch() — on the first ever page load, stores the landing's
//      utm tags, the referring HOSTNAME and the landing path in localStorage.
//      First touch wins: never overwritten, so a player who arrives from
//      Instagram, leaves, and comes back direct a week later counts as
//      Instagram.
//   2. recordSignupAttribution(userId) — on a brand-new account, writes that
//      first touch into public.signup_attribution (insert-only, own row, once;
//      the primary key makes a second insert fail harmlessly).
//   3. storeSource() — the first-touch source, so store links can carry it
//      (Play's referrer param; App Store campaign token once we have one).
//
// Privacy: hostname only, never the full referrer URL (a URL can carry a
// search query or a private link). Every value is clipped to a short slug.
// Native builds do nothing here: the app promises no identifiers, and native
// installs are attributed by the stores themselves.
import { Capacitor } from '@capacitor/core';

const KEY = 'biq_ft';
const OWN_HOSTS = /(^|\.)balliq\.app$/;

const slug = (v, n = 40) => (v || '').toLowerCase().replace(/[^a-z0-9_.-]/g, '').slice(0, n);

function isNative() {
  try { return Capacitor.isNativePlatform(); } catch { return false; }
}

export function readFirstTouch() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function captureFirstTouch(loc = window.location, ref = document.referrer) {
  if (isNative()) return null;
  try {
    const existing = readFirstTouch();
    if (existing) return existing;
    const up = new URLSearchParams(loc.search || '');
    let refHost = '';
    try { refHost = ref ? new URL(ref).hostname.toLowerCase() : ''; } catch {}
    if (OWN_HOSTS.test(refHost)) refHost = '';
    const ft = {
      utm_source: slug(up.get('utm_source')) || null,
      utm_medium: slug(up.get('utm_medium')) || null,
      utm_campaign: slug(up.get('utm_campaign')) || null,
      utm_content: slug(up.get('utm_content')) || null,
      referrer: slug(refHost, 80) || null,
      landing_path: (loc.pathname || '/').toLowerCase().slice(0, 80),
    };
    localStorage.setItem(KEY, JSON.stringify(ft));
    return ft;
  } catch { return null; }
}

// The channel to credit for a store tap: the first-touch utm_source, else the
// referring site, else nothing (an untagged store link, same as before).
export function storeSource() {
  const ft = readFirstTouch();
  return (ft && (ft.utm_source || ft.referrer)) || '';
}

export async function recordSignupAttribution(supabase, userId) {
  if (!userId || isNative()) return false;
  const ft = readFirstTouch();
  try {
    const { error } = await supabase.from('signup_attribution').insert({
      user_id: userId,
      referrer: ft?.referrer ?? null,
      utm_source: ft?.utm_source ?? null,
      utm_medium: ft?.utm_medium ?? null,
      utm_campaign: ft?.utm_campaign ?? null,
      landing_path: ft?.landing_path ?? null,
      platform: 'web',
    });
    // 23505 = this account already has its row (first touch is kept).
    return !error || error.code === '23505';
  } catch { return false; }
}
