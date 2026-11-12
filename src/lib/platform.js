// The one answer to "are we inside the native shell?". Lived in App.jsx until
// 11 Nov 2026; every screen that needed it had to import the whole app to ask.
import { Capacitor } from '@capacitor/core';

export const IS_NATIVE = typeof Capacitor !== "undefined" && Capacitor.isNativePlatform?.();
