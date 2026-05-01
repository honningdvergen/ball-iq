// Quota-aware localStorage.setItem wrapper.
//
// On iOS Safari especially, localStorage quota can be exhausted silently —
// every setItem after that throws QuotaExceededError, and the app loses
// local progress without any user-visible signal. This helper detects
// quota errors and dispatches a one-shot `biq:storage-quota-exceeded`
// event so the app can surface a toast. Other errors stay silent
// (preserving the existing try/catch-and-swallow behavior at every
// setItem call site).
//
// Usage:
//   import { safeSetItem } from './safeStorage';
//   safeSetItem('biq_xp', String(xp));
//
// Listener (in AppInner):
//   useEffect(() => {
//     const onQuota = () => showToast('⚠️ Storage full — clear browser data to continue saving progress', 5000);
//     window.addEventListener('biq:storage-quota-exceeded', onQuota);
//     return () => window.removeEventListener('biq:storage-quota-exceeded', onQuota);
//   }, [showToast]);

let quotaToastFired = false;

export function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    if (isQuotaError(e) && !quotaToastFired) {
      quotaToastFired = true;
      try {
        window.dispatchEvent(new CustomEvent('biq:storage-quota-exceeded', { detail: { key } }));
      } catch {}
    }
    return false;
  }
}

function isQuotaError(e) {
  if (!e) return false;
  // Modern browsers (incl. iOS Safari): name === 'QuotaExceededError'.
  // Older WebKit: code === 22. Older Firefox: code === 1014 + name === 'NS_ERROR_DOM_QUOTA_REACHED'.
  return (
    e.name === 'QuotaExceededError' ||
    e.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    e.code === 22 ||
    e.code === 1014
  );
}
