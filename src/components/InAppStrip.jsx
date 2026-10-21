// One quiet line for a visitor playing inside a social app's own browser:
// "Streaks and reminders live in the app · Get it". Website audit 2026-10-15,
// item 7: Apple's Smart App Banner never shows in the Instagram, Threads,
// Facebook, TikTok or X browsers, so a social visitor had no app path above a
// finished board.
//
// ⚠️ IT IS A ROW, AND THE HEIGHT BUDGET PAYS FOR IT. Footle sizes its tiles so
// ENTER stays on a small phone's screen (--wd-chrome in footle.css). The host
// adds `has-inapp` to .wd-screen while this shows, and footle.css subtracts
// --wd-inapp-h (the strip plus one flex gap) from the tile cap, so the board
// gives up a few pixels per tile instead of pushing the keyboard down.
//
// Never in the native app (isNativeShell covers both platforms), never on a
// desktop (no store to send anyone to), and gone for good once dismissed.
import React, { useCallback, useState } from 'react';
import { inAppSource, isNativeShell } from '../lib/inAppBrowser.js';
import { useT } from '../i18n/index.js';

const KEY = 'biq_inapp_strip_off';

function isPhone() {
  try {
    const ua = navigator.userAgent || '';
    if (/Android|iPhone|iPad|iPod/.test(ua)) return true;
    // iPadOS reports a Mac user agent; touch points give it away.
    return /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  } catch { return false; }
}

function dismissed() {
  try { return localStorage.getItem(KEY) === '1'; } catch { return false; }
}

/** { src, dismiss }: src is the /get source slug, or null when the strip stays hidden. */
export function useInAppStrip() {
  const [src, setSrc] = useState(() => {
    try {
      if (isNativeShell() || !isPhone() || dismissed()) return null;
      return inAppSource({ ua: navigator.userAgent, search: location.search });
    } catch { return null; }
  });
  const dismiss = useCallback(() => {
    try { localStorage.setItem(KEY, '1'); } catch { /* private mode: hide for this visit only */ }
    setSrc(null);
  }, []);
  return { src, dismiss };
}

export default function InAppStrip({ src, onDismiss }) {
  const t = useT();
  if (!src) return null;
  return (
    <div className="wd-inapp" role="note">
      {/* The short line from 350px down: at 320 the long one ellipsised mid-word. */}
      <span className="wd-inapp-line"><span className="wd-inapp-long">{t('inapp.long')}</span><span className="wd-inapp-short">{t('inapp.short')}</span></span>
      <a className="wd-inapp-go" href={`/get?src=${src}-inapp`}>{t('inapp.go')}<span aria-hidden="true"> →</span></a>
      <button type="button" className="wd-inapp-x" onClick={onDismiss} aria-label={t('inapp.hide')}>×</button>
    </div>
  );
}
