// ── THE TRAIL ISLAND — today's Transfer Trail on the static /transfer-trail/ page ──
// A Vite entry (vite.config.js `trail`), mounted by gen-seo-pages.mjs into
// #trail-today. The app's own screen, with stand-ins for what App.jsx normally
// supplies (see src/games/dailyServices.js). Same storage key as the app
// (biq_trail_<date>): a guest who plays here and installs later finds today
// already done, and the homepage Today card reads it the same way.
import React from 'react';
import TransferTrail from '../screens/TransferTrail.jsx';
import { getTrailAnswer } from '../lib/trail.js';
import { dateToYMD } from '../lib/date.js';
import { haptic, makeFunnel, makeGetAppCTA, mountDaily, toastHost } from './dailyIsland.jsx';

const funnel = makeFunnel('trail-page');
const SERVICES = { haptic, GetAppCTA: makeGetAppCTA(funnel, 'trail-result') };

// On a loss the app chains into Mystery Player when today's is unplayed; here
// that is the sibling page. Same gate as App.jsx so a finished Mystery is not
// offered twice.
const mysteryOffer = (() => {
  try {
    const m = JSON.parse(localStorage.getItem(`biq_mystery_${dateToYMD(new Date())}`) || 'null');
    if (m && (m.won || m.gaveUp)) return undefined;
  } catch {}
  return () => { location.assign('/mystery-player/'); };
})();

toastHost('trail-toast');
// Resolved at runtime, not build time: a generated page can sit unbuilt for
// days and yesterday's career under today's number is worse than none.
mountDaily({
  hostId: 'trail-today',
  game: 'trail',
  funnel,
  element: <TransferTrail player={getTrailAnswer(new Date())} services={SERVICES} onPlayMystery={mysteryOffer} embedded />,
});
