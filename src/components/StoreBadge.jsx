// The store badge, as the app and homepage render it — the same glyph + store
// name the generated pages draw (scripts/gen-seo-pages.mjs storeBadgesMini),
// so a visitor sees one badge everywhere instead of "iOS" on the homepage, a
// 📲 emoji under a result and a real badge on the quiz pages (the mix we
// shipped on 2026-09-05 and were rightly asked about).
//
// Styled inline on purpose: it renders inside the static-page islands, where
// the site stylesheet's .store-badge rules are not loaded.
import React from 'react';
import { APPLE_GLYPH_PATH, PLAY_GLYPH_PATH } from '../lib/storeGlyphs.js';
import { PLAY_STORE_URL, appStoreUrl } from '../lib/links.js';

const UA = () => (typeof navigator !== 'undefined' && navigator.userAgent) || '';
export const isAndroidUA = () => /Android/i.test(UA()) && !/Windows Phone/i.test(UA());
export const isIOSUA = () => /iPad|iPhone|iPod/.test(UA()) || (UA().includes('Mac') && typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1);
/** 'ios' | 'android' | null — the store this browser belongs to, if any. */
export function detectStore() {
  if (isAndroidUA()) return 'android';
  if (isIOSUA()) return 'ios';
  return null;
}

const BADGE = {
  display: 'inline-flex', alignItems: 'center', gap: 10, minHeight: 44, padding: '0 20px',
  background: '#000', color: '#fff', border: '1px solid var(--bd2, #2F3240)', borderRadius: 13,
  fontSize: 15, fontWeight: 700, lineHeight: 1, textDecoration: 'none', fontFamily: 'inherit',
  WebkitTextFillColor: '#fff',
};

export function StoreBadge({ store, href, onClick, style, className }) {
  const android = store === 'android';
  return (
    <a
      className={className}
      href={href || (android ? PLAY_STORE_URL : appStoreUrl())}
      rel="noopener noreferrer"
      target="_blank"
      onClick={onClick}
      aria-label={android ? 'Get it on Google Play' : 'Download on the App Store'}
      style={{ ...BADGE, ...(style || {}) }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d={android ? PLAY_GLYPH_PATH : APPLE_GLYPH_PATH} /></svg>
      <span>{android ? 'Google Play' : 'App Store'}</span>
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
