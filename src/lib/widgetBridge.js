// The JS side of the Android home-screen widget (1.6.2). One function, one
// direction: push today's snapshot to WidgetBridgePlugin, which persists it
// and repaints every placed widget. The widget decides staleness itself by
// comparing the snapshot date to the device date — see DailyWidgetProvider.
//
// iOS has no widget yet; the platform guard keeps this a silent no-op there
// and on web. Failure is always swallowed: the widget is decoration, and no
// game flow may ever break because a launcher repaint failed.
import { Capacitor, registerPlugin } from '@capacitor/core';

const WidgetBridge = registerPlugin('WidgetBridge');

export async function syncWidget({ date, done, total, streak }) {
  try {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') return;
    await WidgetBridge.update({ date, done, total, streak });
  } catch { /* decoration only */ }
}
