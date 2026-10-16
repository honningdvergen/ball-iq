// clubData.js — the ONE door to src/data/clubPacks.js.
//
// The per-club tables left the eager Home chunk on 2026-10-16 (see the header
// of src/data/clubPacks.js). This module is tiny and eager; the tables are not.
//
//   loadClubData()  -> Promise of the clubPacks module. Started by App.jsx at
//                      boot, awaited by questions-loader.js before the bank is
//                      handed out, and by every async club path (club launch,
//                      ?club= deep link, multiplayer club packs).
//   clubData()      -> the module once loaded, else null. For synchronous
//                      readers that can only run after a club round or a bank
//                      load (share links, the results header).
//   useClubData()   -> the same, as React state that fills in when it lands.
//
// ⚠️ THE CARD'S CLUB ROUTES ARE REGISTERED HERE, BEFORE THE PROMISE RESOLVES.
// ballIqCard.js files a club answer under its league's face and must have the
// map before any club answer can be recorded. That used to be a module-level
// line in App.jsx; it is now the first thing that happens when the tables
// arrive, and every source of club answers waits for them: bank rounds
// (questions-loader awaits this), and the web rounds queued by a club page
// (App.jsx drains those only after this resolves). tests/unit/
// club-routes-registered.test.js pins all three.
import { useEffect, useSyncExternalStore } from 'react';
import { setClubRoutes } from './ballIqCard.js';
import { buildClubRoutes } from './clubFaceRoute.js';

let loaded = null;
let inFlight = null;
// Mounted useClubData() hooks. A failed first load leaves them null; whichever
// later call succeeds (a club tap retries) fills every one of them in.
const listeners = new Set();

export function loadClubData() {
  if (loaded) return Promise.resolve(loaded);
  if (inFlight) return inFlight;
  inFlight = import('../data/clubPacks.js').then((mod) => {
    setClubRoutes(buildClubRoutes(mod.CLUB_PACK_TO_QB, mod.CLUB_LEAGUES));
    loaded = mod;
    inFlight = null;
    for (const fn of listeners) fn();
    return mod;
  }).catch((err) => {
    inFlight = null; // allow a retry on the next call
    throw err;
  });
  return inFlight;
}

export function clubData() {
  return loaded;
}

const subscribe = (fn) => { listeners.add(fn); return () => { listeners.delete(fn); }; };

export function useClubData() {
  const data = useSyncExternalStore(subscribe, clubData, clubData);
  useEffect(() => {
    if (!loaded) loadClubData().catch(() => { /* a later call retries and notifies */ });
  }, []);
  return data;
}
