// The analytics consent bar (public/consent.js) speaks Spanish inside the app
// when the app does, and is unchanged everywhere else (i18n step 7). The file is
// plain browser script with no exports, so it runs here against a tiny fake DOM.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const CODE = readFileSync(new URL('../../public/consent.js', import.meta.url), 'utf8');

function el(tag) {
  const attrs = {};
  return {
    tagName: tag, children: [], attrs, style: { setProperty() {}, removeProperty() {} }, offsetHeight: 100,
    appendChild(c) { this.children.push(c); c.parentNode = this; return c; },
    removeChild(c) { this.children = this.children.filter((x) => x !== c); c.parentNode = null; },
    get firstChild() { return this.children[0] || null; },
    setAttribute(k, v) { attrs[k] = String(v); },
    getAttribute(k) { return k in attrs ? attrs[k] : null; },
    addEventListener() {},
  };
}

function run({ htmlLang = 'en', root = 'empty', store = {}, device = 'en-GB' } = {}) {
  const html = el('html');
  html.setAttribute('lang', htmlLang);
  const body = el('body');
  const rootEl = root ? el('div') : null;
  if (root === 'painted') rootEl.appendChild(el('div'));
  const document = {
    documentElement: html, head: el('head'), body,
    getElementById: (id) => (id === 'root' ? rootEl : id === 'biq-consent' ? null : null),
    createElement: el,
    createTextNode: (s) => ({ nodeValue: s }),
    querySelector: () => null,
    addEventListener() {},
  };
  const window = { addEventListener() {}, removeEventListener() {}, getComputedStyle: () => ({}), requestAnimationFrame: (f) => f() };
  const localStorage = { getItem: (k) => (k in store ? store[k] : null), setItem() {} };
  new Function('document', 'window', 'localStorage', 'navigator', CODE)(document, window, localStorage, { language: device });
  const bar = body.children[0];
  const [p, btns] = bar.children;
  return {
    aria: bar.getAttribute('aria-label'),
    text: p.children[0].nodeValue,
    policy: p.children[1].textContent,
    buttons: btns.children.map((b) => b.textContent),
  };
}

const ENGLISH = {
  aria: 'Analytics consent',
  text: 'We’d like to use Microsoft Clarity and PostHog to see how people move through Ball IQ, so we can fix what’s confusing. Clarity records anonymous session replays. No ads, and nothing is sold. ',
  policy: 'Privacy policy',
  buttons: ['Decline', 'Allow'],
};

describe('consent bar language', () => {
  it('English is the words it always had', () => {
    expect(run()).toEqual(ENGLISH);
  });

  it('Spanish when the app has set <html lang="es">', () => {
    const es = run({ htmlLang: 'es', root: 'painted' });
    expect(es.aria).toBe('Consentimiento de analítica');
    expect(es.policy).toBe('Política de privacidad');
    expect(es.buttons, 'Decline still first, same weight').toEqual(['Rechazar', 'Permitir']);
    expect(es.text).toMatch(/Microsoft Clarity y PostHog/);
    expect(es.text).toMatch(/Sin anuncios, y no vendemos nada\. $/);
  });

  it('before the app paints, the pre-boot rule decides (same as index.html)', () => {
    expect(run({ store: { biq_lang: 'es' } }).buttons).toEqual(['Rechazar', 'Permitir']);
    expect(run({ store: { biq_i18n_live: '1' }, device: 'es-ES' }).buttons).toEqual(['Rechazar', 'Permitir']);
    // Not live yet: a Spanish device alone changes nothing.
    expect(run({ device: 'es-ES' })).toEqual(ENGLISH);
    expect(run({ store: { biq_lang: 'en', biq_i18n_live: '1' }, device: 'es-ES' })).toEqual(ENGLISH);
  });

  it('once the app has painted in English, a stale hint does not win', () => {
    expect(run({ root: 'painted', store: { biq_lang: 'es' } })).toEqual(ENGLISH);
  });

  it('the static SEO pages (no #root) stay English', () => {
    expect(run({ root: null, store: { biq_lang: 'es' }, device: 'es-ES' })).toEqual(ENGLISH);
  });
});
