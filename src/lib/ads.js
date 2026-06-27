// Google AdSense loader — WEB ONLY, fully gated and dormant by default.
//
// HOW TO ENABLE (when you have an AdSense account + the privacy policy is
// updated to disclose ads — see the v1.2 ad-prereqs):
//   1. Set AD_CLIENT below to your publisher ID, e.g. 'ca-pub-1234567890123456'.
//   2. Fill in each slot's `slotId` from your AdSense dashboard (and uncomment
//      the slots you want live). The selectors match the reserved, CLS-safe
//      containers already in index.html.
//   3. That's it — initAds() (called from main.jsx after first paint) does the
//      rest: loads adsbygoogle.js once, lazy-mounts each unit via
//      IntersectionObserver so off-screen slots don't request until near view.
//
// SAFETY: ads NEVER load in the installed PWA, the native (Capacitor) app, or
// mid-game (the index.html killswitches hide those slots; this script also
// refuses to run in those contexts). With AD_CLIENT empty, this whole module
// is a no-op, so it's safe to ship dormant.

export const AD_CLIENT = ''; // '' = ads OFF. Set to 'ca-pub-…' to enable.

// Reserved slot containers live in index.html (.ad-slot-* — CLS-safe fixed
// dimensions). slotId comes from the AdSense dashboard per unit.
const AD_SLOTS = [
  // { selector: '.ad-slot-sidebar-left',  slotId: '', format: 'vertical'   },
  // { selector: '.ad-slot-sidebar-right', slotId: '', format: 'vertical'   },
  // { selector: '.ad-slot-banner',        slotId: '', format: 'horizontal' },
  // { selector: '.ad-slot-mobile',        slotId: '', format: 'auto'       },
];

let scriptLoaded = false;

// Web only — never in the installed PWA or the native app.
function adsAllowed() {
  if (!AD_CLIENT) return false;
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  const standalone = window.matchMedia?.('(display-mode: standalone)')?.matches
    || window.navigator.standalone === true;
  if (standalone) return false;
  if (window.Capacitor?.isNativePlatform?.()) return false;
  if (document.documentElement.classList.contains('native-app')) return false;
  return true;
}

function loadScript() {
  if (scriptLoaded) return;
  scriptLoaded = true;
  const s = document.createElement('script');
  s.async = true;
  s.crossOrigin = 'anonymous';
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${AD_CLIENT}`;
  document.head.appendChild(s);
}

function mountUnit(container, cfg) {
  if (container.dataset.adMounted) return;
  container.dataset.adMounted = '1';
  const ins = document.createElement('ins');
  ins.className = 'adsbygoogle';
  ins.style.display = 'block';
  ins.style.width = '100%';
  ins.style.height = '100%';
  ins.setAttribute('data-ad-client', AD_CLIENT);
  if (cfg.slotId) ins.setAttribute('data-ad-slot', cfg.slotId);
  if (cfg.format) ins.setAttribute('data-ad-format', cfg.format);
  ins.setAttribute('data-full-width-responsive', 'true');
  container.appendChild(ins);
  try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch {}
}

// Call once, after first paint (main.jsx). No-op unless configured + on web.
export function initAds() {
  if (!adsAllowed() || AD_SLOTS.length === 0) return;
  loadScript();
  const io = new IntersectionObserver((entries, obs) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const cfg = AD_SLOTS.find(c => e.target.matches(c.selector));
      if (cfg) mountUnit(e.target, cfg);
      obs.unobserve(e.target);
    }
  }, { rootMargin: '200px' }); // mount slightly before they scroll into view
  for (const cfg of AD_SLOTS) {
    document.querySelectorAll(cfg.selector).forEach(el => io.observe(el));
  }
}
