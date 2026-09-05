// ── THE MYSTERY ISLAND — today's Mystery Player on the static /mystery-player/ page ──
// A Vite entry (vite.config.js `mystery`), mounted by gen-seo-pages.mjs into
// #mystery-today. The pool and careers it ranks against load on the first
// focus of the guess box (src/lib/usePlayerPool.js), so a visitor who only
// reads the page never downloads them. Same storage key as the app
// (biq_mystery_<date>).
import React from 'react';
import MysteryPlayer from '../screens/MysteryPlayer.jsx';
import { haptic, makeFunnel, makeGetAppCTA, mountDaily, toastHost } from './dailyIsland.jsx';

const funnel = makeFunnel('mystery-page');
const SERVICES = { haptic, GetAppCTA: makeGetAppCTA(funnel, 'mystery-result') };

toastHost('mystery-toast');
mountDaily({
  hostId: 'mystery-today',
  game: 'mystery',
  funnel,
  element: <MysteryPlayer services={SERVICES} />,
});
