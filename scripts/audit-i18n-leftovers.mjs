#!/usr/bin/env node
// Audit what a Spanish player would still see in English, before I18N_LIVE flips.
//
//   node scripts/audit-i18n-leftovers.mjs            report (exit 0)
//   node scripts/audit-i18n-leftovers.mjs --strict   exit 1 if anything is reported
//
// (a) every key in src/i18n/en.js that src/i18n/es.js lacks (the runtime falls
//     back to English for those);
// (b) English literals in src/screens, src/components, src/App.jsx and
//     src/games that do not pass through t()/useT(): JSX text, string props
//     (placeholder, aria-label, title, alt, label...), toast / alert / confirm
//     strings and user-facing object fields (label, title, desc, hint...).
//
// Not reported: proper nouns, club / player names and the game names (NAMES
// below), strings with no word in them, anything inside t()/tNow()/rich(), and
// the few sites listed in INTENTIONAL (kept English on purpose, with the reason).
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parse } from '@babel/parser';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const strict = process.argv.includes('--strict');

// Product, game and brand names; a string made only of these (and punctuation)
// is not translatable text.
const NAMES = [
  'Ball IQ', 'Footle', 'Daily 7', 'Transfer Trail', 'Mystery Player', 'Top 10', 'Draft', 'Stadiums',
  'Hot Streak', 'Tiki Taka Toe', 'Shithousery HQ', 'Shithousery', 'Stump a mate', 'Stitch-up', 'Stitch up',
  'True or False', 'Premier League', 'La Liga', 'Bundesliga', 'Serie A', 'Ligue 1', 'Champions League',
  'Europa League', 'World Cup', 'Instagram', 'TikTok', 'WhatsApp', 'iMessage', 'Messenger', 'Telegram',
  'Facebook', 'Reddit', 'Threads', 'Bluesky', 'YouTube', 'Google', 'Apple', 'App Store', 'Google Play',
  'TestFlight', 'Supabase', 'Twitter', 'Snapchat', 'Discord', 'Spotify', 'Trail', 'Mystery', 'Hot Streak', 'CC BY-SA 4.0', 'Sentry', 'PostHog', 'Vercel', 'Clarity',
];
const NAME_RE = new RegExp('\\b(?:' + [...NAMES].sort((a, b) => b.length - a.length).map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')\\b', 'gi');

// Sites kept English on purpose: "file:snippet" (snippet matched as a substring
// of the literal) -> reason. Keep this list short; every entry is repeated in the PR.
const INTENTIONAL = {
  'src/screens/PrivacyScreen.jsx': 'the privacy policy is a legal text, kept English until a lawyer-checked Spanish version exists',
  'src/components/ErrorBoundary.jsx': 'crash screen: carries its own en/es copy (CRASH_COPY) so it needs no i18n runtime',
  'src/components/FootleHero.jsx': 'component is not mounted anywhere (only pickTeaserPair is imported, by a test)',
  'src/screens/DailyScreen.jsx#field sub': 'todayModes sub/subLong are never rendered (only name, done and onTap are read)',
  'src/screens/DailyScreen.jsx#field cta': 'todayModes cta is never rendered (see above)',
  'src/screens/DailyScreen.jsx:=Start your streak today': 'tacticsSubtitle() is never called',
  'src/App.jsx:=Daily 7 Complete': 'DailySocialProof is never mounted',
  'src/App.jsx:=Leagues': 'section name, translated at render by qz.* (QuizScreen)',
  'src/App.jsx:=Tournaments': 'section name, translated at render by qz.* (QuizScreen)',
  'src/App.jsx:=Themes': 'section name, translated at render by qz.* (QuizScreen)',
  'src/App.jsx:Loading': 'ScreenLoading looks the label up in LOADING_KEY (ld.*) and prints t(key)',
  'src/App.jsx:=Getting your questions': 'ScreenLoading looks the label up in LOADING_KEY (ld.questions)',
  'src/components/TopicPickerSheet.jsx#field label': 'MP_TOPICS names: topicLabel() prints tp.mixed / catLabel (cat.*), proper league names stay',
  'src/App.jsx:=Ball': 'the "Ball IQ" wordmark (Ball + <em>IQ</em>)',
  'src/screens/OnboardingScreen.jsx:=Ball': 'the "Ball IQ" wordmark (Ball + <em>IQ</em>)',
  'src/screens/SettingsScreen.jsx:=Ball': 'the "Ball IQ" wordmark (Ball + <em>IQ</em>)',
  'src/App.jsx:@balliq.app': 'an e-mail address',
};

const TARGETS = ['src/screens', 'src/components', 'src/App.jsx', 'src/games'];
const PROP_ATTRS = new Set(['placeholder', 'aria-label', 'aria-description', 'aria-roledescription', 'aria-valuetext', 'title', 'alt', 'label', 'ariaLabel', 'caption', 'subtitle', 'heading', 'description', 'emptyText', 'confirmLabel', 'cancelLabel', 'cta', 'text', 'message']);
const OBJ_KEYS = new Set(['label', 'title', 'subtitle', 'sub', 'subLong', 'desc', 'description', 'hint', 'text', 'msg', 'placeholder', 'caption', 'cta', 'body', 'heading', 'tagline', 'blurb', 'ariaLabel', 'emptyText', 'error', 'note']);
const SETTER_RE = /^set(?:\w*)(?:Toast|Msg|Message|Error|Err|Notice|Status|Hint|Banner|Note|Feedback|Label|Title|Text)$/;
const CALL_RE = /^(?:alert|confirm|prompt|toast|showToast|notify|flash)$/;
const SAFE_CALL_RE = /^(?:t|tNow|rich|useT|require|import|querySelector|querySelectorAll|getElementById|addEventListener|removeEventListener|dispatchEvent|getItem|setItem|removeItem|matchMedia|fetch|Event|CustomEvent|log|warn|error|info|debug|track|trackEvent|logEvent|capture|from|rpc|select|eq|neq|order|insert|update|delete|upsert|filter|ilike|like|in|is|not|or|and|gte|lte|gt|lt|single|maybeSingle|limit|range|channel|on|off|once|emit|postMessage|push|includes|startsWith|endsWith|indexOf|split|join|replace|replaceAll|match|test|has|get|set|add|delete|createElement|setAttribute|getAttribute|toLocaleDateString|toLocaleTimeString|toLocaleString|DateTimeFormat|NumberFormat|PluralRules|Intl|import|lazy|memo|forwardRef|createContext|useRef|useState|useReducer|useMemo|useCallback|useEffect|useLayoutEffect|useContext|cn|clsx|classNames|encodeURIComponent|decodeURIComponent|parseInt|parseFloat|Number|String|Boolean|Symbol|Array|Object|Date|Map|Set|RegExp|Error|TypeError|URL|URLSearchParams)$/;

const walkFiles = (p, out = []) => {
  const abs = join(ROOT, p);
  const st = statSync(abs);
  if (st.isFile()) { if (/\.(jsx|js)$/.test(abs)) out.push(p); return out; }
  for (const f of readdirSync(abs).sort()) walkFiles(join(p, f), out);
  return out;
};

const words = (s) => s.replace(NAME_RE, ' ').replace(/https?:\/\/\S+/g, ' ').match(/[A-Za-z]{2,}/g) || [];
// English-looking: has a word of 2+ letters left once the names are removed, and
// is not an identifier-ish token (camelCase, snake_case, kebab-case, CSS value, path, number unit).
function isEnglishText(s) {
  const raw = s.replace(/\s+/g, ' ').trim();
  if (!raw) return false;
  if (!words(raw).length) return false;
  if (/^[\w.:/#%-]+$/.test(raw) && !/^[A-Z][a-z]{2,}$/.test(raw)) return false; // token / path / class / key
  if (/^(?:#|\.|\/|https?:|rgba?\(|hsl|var\(|calc\(|translate|linear-gradient|data:|[0-9.]+(?:px|em|rem|%|s|ms|vh|vw|deg)\b)/.test(raw)) return false;
  if (/^[a-z]+(?:[A-Z][a-z]*)+$/.test(raw)) return false; // camelCase
  if (/^[A-Za-z]+(?:[-_][A-Za-z0-9]+)+$/.test(raw)) return false; // kebab / snake
  const ws = words(raw);
  // a lone lowercase word is almost always a code token (a state name, a mode id)
  if (ws.length === 1 && !raw.includes(' ') && /^[a-z]+$/.test(ws[0]) && !/[.!?…]$/.test(raw)) return false;
  return true;
}

const isStr = (n) => n && (n.type === 'StringLiteral' || (n.type === 'TemplateLiteral'));
const strOf = (n) => n.type === 'StringLiteral' ? n.value : n.quasis.map((q) => q.value.cooked ?? '').join('{}');

function calleeName(c) {
  if (!c) return '';
  if (c.type === 'Identifier') return c.name;
  if (c.type === 'MemberExpression' && !c.computed && c.property.type === 'Identifier') return c.property.name;
  return '';
}

function scan(file) {
  const src = readFileSync(join(ROOT, file), 'utf8');
  let ast;
  try {
    ast = parse(src, { sourceType: 'module', plugins: ['jsx'], errorRecovery: true });
  } catch (e) {
    return [{ line: 0, kind: 'parse', text: String(e.message) }];
  }
  const hits = [];
  const add = (node, kind, text) => {
    const clean = text.replace(/\s+/g, ' ').trim();
    if (!isEnglishText(clean)) return;
    for (const k of Object.keys(INTENTIONAL)) {
      const c = k.indexOf(':');
      const h = k.indexOf('#');
      if (h >= 0 && (c < 0 || h < c)) { if (k.slice(0, h) === file && kind.startsWith(k.slice(h + 1))) return; continue; }
      const f = c < 0 ? k : k.slice(0, c);
      if (f !== file) continue;
      if (c < 0) return;
      const snip = k.slice(c + 1);
      if (snip.startsWith('=') ? clean === snip.slice(1) : clean.includes(snip)) return;
    }
    hits.push({ line: node.loc.start.line, kind, text: clean });
  };

  // Walk with an "inside a safe call" flag so t('key', { x: 'literal' }) etc. are skipped.
  const visit = (node, ctx) => {
    if (!node || typeof node.type !== 'string') return;
    switch (node.type) {
      case 'JSXElement': {
        const nm = node.openingElement.name;
        const tag = nm.type === 'JSXIdentifier' ? nm.name : '';
        if (tag === 'style' || tag === 'script' || tag === 'code' || tag === 'pre') return;
        break;
      }
      case 'JSXText':
        add(node, 'jsx-text', node.value);
        return;
      case 'JSXAttribute': {
        const name = node.name.type === 'JSXIdentifier' ? node.name.name : '';
        const v = node.value;
        if (PROP_ATTRS.has(name)) {
          if (v && v.type === 'StringLiteral') add(v, `prop ${name}`, v.value);
          else if (v && v.type === 'JSXExpressionContainer') literalsIn(v.expression, `prop ${name}`);
        }
        if (v && v.type === 'JSXExpressionContainer') visit(v.expression, ctx);
        return;
      }
      case 'JSXExpressionContainer':
        if (ctx.jsxChild) literalsIn(node.expression, 'jsx-expr');
        break;
      case 'CallExpression': {
        const name = calleeName(node.callee);
        if (CALL_RE.test(name)) for (const a of node.arguments) literalsIn(a, `${name}()`);
        if (SAFE_CALL_RE.test(name) && name !== 'push') {
          visit(node.callee, ctx);
          for (const a of node.arguments) visitSkippingStrings(a, ctx);
          return;
        }
        if (SETTER_RE.test(name)) for (const a of node.arguments) literalsIn(a, `${name}()`);
        break;
      }
      case 'ObjectProperty': {
        const k = node.key.type === 'Identifier' ? node.key.name : node.key.type === 'StringLiteral' ? node.key.value : '';
        if (k === 'detail' || OBJ_KEYS.has(k)) {
          // `detail:` is the biq:show-toast payload
          if (isStr(node.value) || node.value.type === 'ConditionalExpression' || node.value.type === 'LogicalExpression') {
            const s = isStr(node.value) ? strOf(node.value) : null;
            if (s !== null) { if (k === 'detail' || /\s/.test(s) || /^[A-Z]/.test(s)) add(node.value, `field ${k}`, s); }
            else literalsIn(node.value, `field ${k}`);
          }
        }
        break;
      }
      case 'VariableDeclarator':
        if (node.id.type === 'Identifier' && /(?:label|title|text|msg|message|copy|hint|desc|caption|heading|banner|note|tagline)s?$/i.test(node.id.name)) literalsIn(node.init, `const ${node.id.name}`);
        break;
      case 'ReturnStatement':
        if (node.argument && isStr(node.argument) && /\s/.test(strOf(node.argument).trim()) && /^[A-Z]/.test(strOf(node.argument).trim())) literalsIn(node.argument, 'return');
        break;
      case 'ArrayExpression':
        if (node.elements.length > 1 && node.elements.every((e) => e && e.type === 'StringLiteral') && node.elements.some((e) => /^[A-Z]/.test(e.value) && /\s/.test(e.value) && /\s[a-z]{3,}\b/.test(e.value))) for (const e of node.elements) add(e, 'array', e.value);
        break;
      default:
    }
    for (const key of Object.keys(node)) {
      if (key === 'loc' || key === 'start' || key === 'end' || key === 'leadingComments' || key === 'trailingComments' || key === 'innerComments') continue;
      const child = node[key];
      const childCtx = (node.type === 'JSXElement' || node.type === 'JSXFragment') && key === 'children' ? { ...ctx, jsxChild: true } : { ...ctx, jsxChild: false };
      if (Array.isArray(child)) for (const c of child) visit(c, childCtx);
      else if (child && typeof child.type === 'string') visit(child, childCtx);
    }
  };
  const visitSkippingStrings = (n, ctx) => {
    if (n && (n.type === 'StringLiteral' || n.type === 'TemplateLiteral')) {
      if (n.type === 'TemplateLiteral') for (const e of n.expressions) visit(e, ctx);
      return;
    }
    visit(n, ctx);
  };
  // English string literals reachable as a value: the literal itself, ternary / || / && / ?? branches, template quasi text.
  function literalsIn(n, kind) {
    if (!n) return;
    if (n.type === 'StringLiteral') { add(n, kind, n.value); return; }
    if (n.type === 'TemplateLiteral') { add(n, kind, strOf(n)); return; }
    if (n.type === 'ConditionalExpression') { literalsIn(n.consequent, kind); literalsIn(n.alternate, kind); return; }
    if (n.type === 'LogicalExpression') { literalsIn(n.right, kind); if (n.operator === '??' || n.operator === '||') literalsIn(n.left, kind); return; }
    if (n.type === 'ParenthesizedExpression') literalsIn(n.expression, kind);
  }
  visit(ast.program, { jsxChild: false });
  const seen = new Set();
  return hits.filter((h) => { const k = `${h.line}|${h.kind}|${h.text}`; if (seen.has(k)) return false; seen.add(k); return true; }).sort((a, b) => a.line - b.line);
}

// ── (a) en keys missing from es ──────────────────────────────────────────────
const en = (await import(pathToFileURL(join(ROOT, 'src/i18n/en.js')).href)).default;
const es = (await import(pathToFileURL(join(ROOT, 'src/i18n/es.js')).href)).default;
const missing = Object.keys(en).filter((k) => !(k in es) || typeof es[k] !== 'string' || es[k] === '');
const untranslated = Object.keys(en).filter((k) => typeof es[k] === 'string' && es[k] === en[k] && /[a-z]{4,}\s+[a-z]{3,}/i.test(en[k]) && words(en[k]).length > 2);

console.log('i18n leftovers audit');
console.log('====================');
console.log(`\n(a) keys in en.js missing from es.js: ${missing.length}`);
for (const k of missing) console.log(`    ${k}: ${JSON.stringify(en[k])}`);
console.log(`    (info) es value identical to English, multi-word: ${untranslated.length}`);
for (const k of untranslated) console.log(`    ${k}: ${JSON.stringify(en[k])}`);

// ── (b) English literals outside t() ─────────────────────────────────────────
const files = TARGETS.flatMap((p) => walkFiles(p)).filter((f) => !/\.(css)$/.test(f) && !f.endsWith('privacyStyles.js'));
let total = 0;
const byFile = [];
for (const f of files) {
  const hits = scan(f);
  if (hits.length) { byFile.push([f, hits]); total += hits.length; }
}
console.log(`\n(b) English literals not passing through t(): ${total} in ${byFile.length} files`);
for (const [f, hits] of byFile) {
  console.log(`\n  ${relative(ROOT, join(ROOT, f))}`);
  for (const h of hits) console.log(`    ${String(h.line).padStart(5)}  [${h.kind}] ${JSON.stringify(h.text.length > 110 ? h.text.slice(0, 107) + '...' : h.text)}`);
}
if (Object.keys(INTENTIONAL).length) {
  console.log('\nKept English on purpose:');
  for (const [k, why] of Object.entries(INTENTIONAL)) console.log(`    ${k} — ${why}`);
}
console.log(`\nTOTAL: ${missing.length} missing keys, ${total} literals`);
if (strict && (missing.length || total)) process.exit(1);
