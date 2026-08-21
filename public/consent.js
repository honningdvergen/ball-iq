/* Ball IQ — analytics consent banner.
 *
 * Loaded LAZILY, and only by visitors who actually have a decision to make:
 * the inline gate in index.html (and in the SEO generator's head()) works out
 * the region and reads the stored choice, and only then injects this file.
 * Visitors outside Europe, and anyone who has already chosen, never fetch it.
 * That is why this is a separate file rather than more inline script — the
 * banner is ~4KB of markup and CSS that most page loads must not pay for.
 *
 * What it gates: Microsoft Clarity (project xqwevk9brq), which records session
 * replays. Nothing else on the site sets a non-essential cookie — AdSense is
 * commented out, and funnel_events is first-party and consent-exempt, so
 * declining costs replays and heatmaps but leaves every number intact.
 *
 * ⚠️ ACCEPT AND DECLINE ARE DELIBERATELY EQUAL IN WEIGHT. Same size, same
 * shape, same tap target, adjacent. Under EDPB guidance a "reject" that is
 * harder to find or visually quieter than "accept" invalidates the consent it
 * collects — so a prettier green Allow beside a grey text-link Decline would
 * be worse than no banner at all, because it would look compliant while not
 * being so. If someone later asks for the Allow button to stand out, that is
 * the conversation to have BEFORE changing it.
 *
 * The whole thing is deliberately dependency-free and framework-free: it runs
 * identically on the React app and on the static club pages, which share no
 * JavaScript otherwise. Built with DOM calls rather than innerHTML — every
 * string here is a literal, but the app is a public repo and "no innerHTML
 * anywhere" is a cheaper rule to keep than one with an exception in it.
 */
(function () {
  'use strict';

  var KEY = 'biq_consent_analytics';
  var CLARITY_TAG = 'https://www.clarity.ms/tag/xqwevk9brq';

  if (document.getElementById('biq-consent')) return;

  function remember(value) {
    try { localStorage.setItem(KEY, value); } catch (e) { /* private mode: honour for this page load only */ }
  }

  function loadClarity() {
    if (document.querySelector('script[src="' + CLARITY_TAG + '"]')) return;
    window.clarity = window.clarity || function () {
      (window.clarity.q = window.clarity.q || []).push(arguments);
    };
    var s = document.createElement('script');
    s.async = true;
    s.src = CLARITY_TAG;
    document.head.appendChild(s);
  }

  // The banner is position:fixed, so without this it sits ON TOP of whatever
  // is at the bottom of the page. On the club pages that is the playable
  // taster's answer options — the single surface measured to convert best —
  // and burying C and D behind a consent bar would trade a conversion for a
  // compliance control we can have both of. Reserve real space instead, and
  // give it back on dismiss.
  var prevPad = null;
  function reserveSpace(el) {
    try {
      if (prevPad === null) prevPad = document.body.style.paddingBottom || '';
      document.body.style.paddingBottom = el.offsetHeight + 'px';
    } catch (e) { /* layout is a nicety; the banner still works without it */ }
  }
  function releaseSpace() {
    try { if (prevPad !== null) document.body.style.paddingBottom = prevPad; } catch (e) {}
  }

  function dismiss(el) {
    el.setAttribute('data-leaving', '1');
    releaseSpace();
    // Match the CSS transition, then remove. A plain remove() would skip the
    // fade; a transitionend listener would never fire under reduced motion.
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 220);
  }

  var css = [
    '#biq-consent{position:fixed;left:0;right:0;bottom:0;z-index:2147483000;',
    'display:flex;flex-wrap:wrap;align-items:center;gap:14px;',
    'padding:16px 20px calc(16px + env(safe-area-inset-bottom,0px));',
    'background:#141414;border-top:1px solid #2A2A2A;',
    'box-shadow:0 -8px 32px rgba(0,0,0,0.45);',
    'font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;',
    'color:#E8E8E8;transform:translateY(0);opacity:1;',
    'transition:transform .2s ease,opacity .2s ease}',
    '#biq-consent[data-leaving]{transform:translateY(100%);opacity:0}',
    '#biq-consent .biq-c-txt{flex:1 1 340px;font-size:13px;line-height:1.55;margin:0}',
    '#biq-consent .biq-c-txt a{color:#58CC02;text-decoration:underline}',
    '#biq-consent .biq-c-btns{display:flex;gap:10px;flex:0 0 auto}',
    /* Equal weight, and a 44px min height so both clear the tap-target floor. */
    '#biq-consent button{font:inherit;font-size:13px;font-weight:600;',
    'min-height:44px;padding:0 20px;border-radius:10px;cursor:pointer;',
    'border:1px solid #3A3A3A;background:#1F1F1F;color:#E8E8E8;',
    'transition:background .15s ease,border-color .15s ease}',
    '#biq-consent button:hover{background:#2A2A2A;border-color:#4A4A4A}',
    '#biq-consent button:focus-visible{outline:2px solid #58CC02;outline-offset:2px}',
    '@media (max-width:520px){#biq-consent .biq-c-btns{flex:1 1 100%}',
    '#biq-consent button{flex:1}}',
    '@media (prefers-reduced-motion:reduce){#biq-consent{transition:none}}',
  ].join('');

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  var bar = document.createElement('div');
  bar.id = 'biq-consent';
  // Not role="dialog": it does not trap focus and the page stays fully usable
  // behind it. A region with a label is the honest description.
  bar.setAttribute('role', 'region');
  bar.setAttribute('aria-label', 'Analytics consent');

  var text = document.createElement('p');
  text.className = 'biq-c-txt';
  text.appendChild(document.createTextNode(
    'We’d like to use Microsoft Clarity to see how people move through ' +
    'Ball IQ, so we can fix what’s confusing. It records anonymous ' +
    'session replays. No ads, and nothing is sold. '
  ));
  var policy = document.createElement('a');
  policy.href = '/privacy';
  policy.target = '_blank';
  policy.rel = 'noopener';
  policy.textContent = 'Privacy policy';
  text.appendChild(policy);

  var btns = document.createElement('div');
  btns.className = 'biq-c-btns';

  var decline = document.createElement('button');
  decline.type = 'button';
  decline.textContent = 'Decline';
  decline.addEventListener('click', function () {
    remember('denied');
    dismiss(bar);
  });

  var accept = document.createElement('button');
  accept.type = 'button';
  accept.textContent = 'Allow';
  accept.addEventListener('click', function () {
    remember('granted');
    loadClarity();
    dismiss(bar);
  });

  // Decline first in the DOM, so it is also first in the tab order.
  btns.appendChild(decline);
  btns.appendChild(accept);
  bar.appendChild(text);
  bar.appendChild(btns);

  /* Stay out of the way of the onboarding overlay.
   *
   * `.onboard-wrap` is a full-screen fixed layer (z-index 500) that first-time
   * visitors land on, and it is the highest-stakes screen in the product —
   * activation was measured at 15%, so anything competing for attention there
   * is expensive. A consent bar across its lower third is exactly that.
   *
   * Hiding costs us NOTHING in compliance, which is the point: the duty is to
   * ask before tracking, not to ask immediately, and Clarity has already been
   * withheld by the inline gate. During onboarding we collect nothing and owe
   * nothing; we ask once the user is through.
   *
   * ⚠️ This is a SYNC, not a one-shot check, and that is the whole design.
   * The first version checked once at startup and always lost the race: this
   * script is deferred and therefore runs BEFORE React has painted, so it saw
   * an empty page, concluded there was no onboarding, and mounted anyway. An
   * observer that simply mirrors "is the overlay up right now?" is immune to
   * the ordering — it is correct whether the overlay arrives before us, after
   * us, or twice.
   *
   * If onboarding never finishes we never ask and never track: the failure
   * mode points the safe way, so there is deliberately no timeout fallback. */
  function onboardingUp() { return !!document.querySelector('.onboard-wrap'); }

  var syncQueued = false;
  function syncVisibility() {
    syncQueued = false;
    if (!bar.parentNode) return;
    if (onboardingUp()) {
      bar.style.display = 'none';
      releaseSpace();
    } else if (bar.style.display === 'none') {
      bar.style.display = '';
      reserveSpace(bar);
    }
  }
  function queueSync() {
    if (syncQueued) return;
    syncQueued = true;
    // Coalesce: React renders fire this observer in bursts.
    (window.requestAnimationFrame || setTimeout)(syncVisibility, 0);
  }

  function mount() {
    document.body.appendChild(bar);
    // After append, so offsetHeight is the real wrapped height — it differs
    // between one and two lines of text, and between phone and desktop.
    reserveSpace(bar);
    if (window.ResizeObserver) {
      try { new ResizeObserver(function () { reserveSpace(bar); }).observe(bar); } catch (e) {}
    }
    // Hide immediately if onboarding is already up, then keep mirroring it.
    syncVisibility();
    if (window.MutationObserver) {
      try {
        new MutationObserver(queueSync)
          .observe(document.body, { childList: true, subtree: true });
      } catch (e) { /* worst case the banner shows during onboarding */ }
    }
  }
  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount);
})();
