// The store badge, as the app and homepage render it — the same official
// artwork the generated pages use (scripts/gen-seo-pages.mjs storeBadges),
// so a visitor sees one badge everywhere instead of "iOS" on the homepage, a
// 📲 emoji under a result and a real badge on the quiz pages (the mix we
// shipped on 2026-09-05 and were rightly asked about).
//
// Styled inline on purpose: it renders inside the static-page islands, where
// the site stylesheet's .store-badge rules are not loaded.
import React from 'react';
import { playStoreUrl, appStoreUrl } from '../lib/links.js';

const UA = () => (typeof navigator !== 'undefined' && navigator.userAgent) || '';
export const isAndroidUA = () => /Android/i.test(UA()) && !/Windows Phone/i.test(UA());
export const isIOSUA = () => /iPad|iPhone|iPod/.test(UA()) || (UA().includes('Mac') && typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1);
/** 'ios' | 'android' | null — the store this browser belongs to, if any. */
export function detectStore() {
  if (isAndroidUA()) return 'android';
  if (isIOSUA()) return 'ios';
  return null;
}

// The official artwork (Apple Marketing Tools, Google Play badge page; added
// 16 Oct 2026 on Alex's yes): a visitor trusts the badge they know, and both
// stores ask for their own art rather than a home-made lookalike. 40px is
// Apple's minimum on-screen height; the two keep one height side by side.
export const BADGE_ART = {
  ios: { src: '/badges/app-store.svg', ratio: 119.664 / 40, alt: 'Download on the App Store' },
  android: { src: '/badges/google-play.png', ratio: 564 / 168, alt: 'Get it on Google Play' },
};

export function StoreBadge({ store, href, onClick, style, className, height }) {
  const android = store === 'android';
  const art = BADGE_ART[android ? 'android' : 'ios'];
  // Callers sized the old drawn badge with minHeight/padding/fontSize; the
  // height carries over (never under 40), the rest no longer applies.
  const { minHeight, padding, fontSize, ...rest } = style || {};
  const h = Math.max(40, height || minHeight || 44);
  return (
    <a
      className={className}
      href={href || (android ? playStoreUrl() : appStoreUrl())}
      rel="noopener noreferrer"
      target="_blank"
      onClick={onClick}
      style={{ display: 'inline-flex', lineHeight: 0, borderRadius: 9, ...rest }}
    >
      <img src={art.src} alt={art.alt} width={Math.round(h * art.ratio)} height={h} draggable={false} style={{ display: 'block', height: h, width: 'auto' }} />
    </a>
  );
}

/**
 * One badge, the visitor's own store; nothing on a desktop, where there is no
 * store to send anyone to. `onClick(store)` gets 'ios' | 'android'.
 */
export function PlatformStoreBadge({ onClick, style, caption }) {
  const store = detectStore();
  if (!store) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <StoreBadge store={store} onClick={onClick ? () => onClick(store) : undefined} style={style} />
      {caption ? <div style={{ fontSize: 12, color: 'var(--t3)', textAlign: 'center' }}>{caption}</div> : null}
    </div>
  );
}
