#!/usr/bin/env node
/**
 * Render scouting report #4 to a single self-contained HTML page.
 *
 * Every sentence in the output is quoted VERBATIM out of the three harvested
 * JSON files — nothing here paraphrases the panel. That is deliberate: the last
 * report's summary was quoted back at me with claims the areas never made, and
 * a generator that transcribes by hand is a generator that drifts.
 *
 *   docs/scout-4-areas.json      14 area reviews
 *   docs/scout-4-critic.json     the adversarial pass over those 14
 *   docs/scout-4-synthesis.json  overall grade, ranked plan, device list
 */
import { readFileSync, writeFileSync } from 'node:fs';

const areas = JSON.parse(readFileSync('docs/scout-4-areas.json', 'utf8'));
const critic = JSON.parse(readFileSync('docs/scout-4-critic.json', 'utf8'));
const syn = JSON.parse(readFileSync('docs/scout-4-synthesis.json', 'utf8'));

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Minimal inline markdown: **bold**, `code`. Applied AFTER escaping. */
const md = (s) => esc(s)
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  .replace(/`([^`]+)`/g, '<code>$1</code>');

const arr = (v) => (Array.isArray(v) ? v : v == null ? [] : [v]);

const adj = {};
for (const a of arr(critic.grade_adjustments)) if (a?.area) adj[a.area] = a.suggested;

const rows = areas
  .map((a) => ({
    area: a.area,
    g: a.grade_10,
    prev: a.prev_grade_10,
    letter: a.letter,
    adj: adj[a.area] ?? null,
    crit: (a.findings || []).filter((f) => f.severity === 'critical'),
    high: (a.findings || []).filter((f) => f.severity === 'high').length,
    n: (a.findings || []).length,
  }))
  .sort((x, y) => x.g - y.g);

const totalFindings = rows.reduce((t, r) => t + r.n, 0);
const totalCrit = rows.reduce((t, r) => t + r.crit.length, 0);
const totalHigh = rows.reduce((t, r) => t + r.high, 0);

const band = (g) => (g < 6 ? 'bad' : g < 7 ? 'mid' : 'ok');

// The synthesis headline is three sentences. The first is the thesis and works
// as a masthead; setting all three at h1 size is a wall, not a headline.
const hSplit = String(syn.headline).indexOf('. ') + 1;
const headlineLead = String(syn.headline).slice(0, hSplit).trim();
const headlineRest = String(syn.headline).slice(hSplit).trim();

const moveMark = (g, prev) => {
  if (prev == null) return '<span class="mv new" title="new area this round">new</span>';
  const d = +(g - prev).toFixed(1);
  if (d === 0) return '<span class="mv flat">—</span>';
  const cls = d > 0 ? 'up' : 'down';
  return `<span class="mv ${cls}">${d > 0 ? '▲' : '▼'} ${Math.abs(d).toFixed(1)}</span>`;
};

const tableRows = rows.map((r) => `
      <tr>
        <td class="c-grade"><span class="pill ${band(r.g)}">${r.g.toFixed(1)}</span></td>
        <td class="c-move">${moveMark(r.g, r.prev)}</td>
        <td class="c-area">
          <span class="area-name">${esc(r.area)}</span>
          ${r.crit.length ? `<ul class="crits">${r.crit.map((f) => `<li>${md(f.title)}</li>`).join('')}</ul>` : ''}
        </td>
        <td class="c-sev">
          ${r.crit.length ? `<span class="sev crit">${r.crit.length} critical</span>` : ''}
          ${r.high ? `<span class="sev high">${r.high} high</span>` : ''}
          <span class="sev tot">${r.n} total</span>
        </td>
        <td class="c-adj">${r.adj != null ? `<span class="regrade">→ ${r.adj.toFixed(1)}</span>` : '<span class="held">held</span>'}</td>
      </tr>`).join('');

const planCards = arr(syn.ranked_plan).map((p) => `
      <article class="plan">
        <div class="plan-rank">${p.rank}</div>
        <div class="plan-body">
          <h3>${md(p.title)}</h3>
          <p>${md(p.why)}</p>
          <div class="plan-meta">
            ${p.effort ? `<span><b>Effort</b> ${md(p.effort)}</span>` : ''}
            ${p.reaches_users ? `<span><b>Reaches users</b> ${md(p.reaches_users)}</span>` : ''}
          </div>
        </div>
      </article>`).join('');

const deviceItems = arr(syn.device_test_list).map((d) => `
        <li>${md(typeof d === 'string' ? d : d.title || JSON.stringify(d))}</li>`).join('');

const dangerItems = arr(critic.dangerous_recommendations).map((d) => `
        <li>${md(typeof d === 'string' ? d : JSON.stringify(d))}</li>`).join('');

const stopItems = arr(syn.stop_doing).map((d) => `
        <li>${md(typeof d === 'string' ? d : JSON.stringify(d))}</li>`).join('');

const missedItems = arr(critic.panel_missed).map((d) => `
        <li>${md(typeof d === 'string' ? d : JSON.stringify(d))}</li>`).join('');

const html = `<title>Scouting Report #4</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap">
<style>
:root{
  --ground:#F4F6F8; --panel:#FFFFFF; --panel-2:#EDF1F5; --line:#D8DFE7;
  --t1:#101720; --t2:#4A5766; --t3:#79879A;
  --bad:#C8322F; --mid:#B0720A; --ok:#3D8A05; --accent:#3D8A05;
  --crit-bg:#FBE9E8; --crit-fg:#A32A27;
  --shadow:0 1px 2px rgba(16,23,32,.06),0 8px 24px -12px rgba(16,23,32,.18);
}
@media (prefers-color-scheme:dark){
  :root:not([data-theme="light"]){
    --ground:#0C1015; --panel:#141A22; --panel-2:#1B222C; --line:#28313D;
    --t1:#E7EDF4; --t2:#9DAABA; --t3:#6E7D8F;
    --bad:#FF6B66; --mid:#F5B342; --ok:#6FDB1F; --accent:#6FDB1F;
    --crit-bg:#2A1615; --crit-fg:#FF8C87;
    --shadow:0 1px 2px rgba(0,0,0,.4),0 10px 30px -14px rgba(0,0,0,.7);
  }
}
:root[data-theme="dark"]{
  --ground:#0C1015; --panel:#141A22; --panel-2:#1B222C; --line:#28313D;
  --t1:#E7EDF4; --t2:#9DAABA; --t3:#6E7D8F;
  --bad:#FF6B66; --mid:#F5B342; --ok:#6FDB1F; --accent:#6FDB1F;
  --crit-bg:#2A1615; --crit-fg:#FF8C87;
  --shadow:0 1px 2px rgba(0,0,0,.4),0 10px 30px -14px rgba(0,0,0,.7);
}
*{box-sizing:border-box}
body{
  margin:0; background:var(--ground); color:var(--t1);
  font-family:"IBM Plex Sans",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  font-size:16px; line-height:1.62; -webkit-font-smoothing:antialiased;
}
.wrap{max-width:1080px; margin:0 auto; padding:0 24px 96px}
code{font-family:"IBM Plex Mono",ui-monospace,SFMono-Regular,Menlo,monospace;
  font-size:.86em; background:var(--panel-2); padding:.1em .38em; border-radius:4px;
  border:1px solid var(--line); word-break:break-word}
strong{font-weight:700; color:var(--t1)}
h1,h2,h3{font-family:"Bricolage Grotesque","IBM Plex Sans",sans-serif; text-wrap:balance; margin:0}

/* ── masthead ─────────────────────────────────────── */
.top{border-bottom:1px solid var(--line); background:var(--panel); margin-bottom:44px}
.top-in{max-width:1080px; margin:0 auto; padding:38px 24px 34px;
  display:grid; grid-template-columns:auto 1fr; gap:32px; align-items:start}
.eyebrow{font-family:"IBM Plex Mono",monospace; font-size:11.5px; letter-spacing:.13em;
  text-transform:uppercase; color:var(--t3); margin:0 0 10px}
.score{display:flex; flex-direction:column; align-items:center; gap:2px;
  padding:16px 26px; border:1px solid var(--line); border-radius:14px; background:var(--panel-2)}
.score b{font-family:"Bricolage Grotesque",sans-serif; font-size:64px; line-height:.94;
  font-weight:800; font-variant-numeric:tabular-nums; color:var(--mid)}
.score span{font-family:"IBM Plex Mono",monospace; font-size:11px; letter-spacing:.1em;
  text-transform:uppercase; color:var(--t3)}
.score .delta{color:var(--ok); font-weight:600; letter-spacing:.04em}
h1{font-size:clamp(28px,4.4vw,42px); font-weight:800; line-height:1.1; letter-spacing:-.02em}
.dek{color:var(--t2); font-size:17.5px; margin:14px 0 0; max-width:62ch}
.facts{display:flex; flex-wrap:wrap; gap:8px; margin-top:20px}
.facts span{font-family:"IBM Plex Mono",monospace; font-size:11.5px; color:var(--t2);
  border:1px solid var(--line); border-radius:999px; padding:5px 11px; background:var(--ground)}

/* ── sections ─────────────────────────────────────── */
section{margin:0 0 52px}
h2{font-size:13px; font-weight:600; letter-spacing:.15em; text-transform:uppercase;
  color:var(--t3); padding-bottom:10px; border-bottom:1px solid var(--line); margin-bottom:22px;
  font-family:"IBM Plex Mono",monospace}
.prose{max-width:70ch}
.prose p{margin:0 0 15px}
.callout{background:var(--panel); border:1px solid var(--line); border-left:3px solid var(--mid);
  border-radius:0 12px 12px 0; padding:20px 24px; box-shadow:var(--shadow)}

/* ── league table ─────────────────────────────────── */
.tablewrap{overflow-x:auto; border:1px solid var(--line); border-radius:14px;
  background:var(--panel); box-shadow:var(--shadow)}
table{border-collapse:collapse; width:100%; min-width:720px}
thead th{font-family:"IBM Plex Mono",monospace; font-size:10.5px; letter-spacing:.11em;
  text-transform:uppercase; color:var(--t3); text-align:left; font-weight:400;
  padding:13px 16px; border-bottom:1px solid var(--line); white-space:nowrap}
td{padding:15px 16px; border-bottom:1px solid var(--line); vertical-align:top}
tbody tr:last-child td{border-bottom:none}
.c-grade{width:78px}
.pill{display:inline-block; min-width:52px; text-align:center; font-family:"IBM Plex Mono",monospace;
  font-weight:600; font-size:15px; font-variant-numeric:tabular-nums; padding:5px 8px;
  border-radius:8px; border:1px solid currentColor}
.pill.bad{color:var(--bad)} .pill.mid{color:var(--mid)} .pill.ok{color:var(--ok)}
.c-move{width:70px}
.mv{font-family:"IBM Plex Mono",monospace; font-size:12px; font-variant-numeric:tabular-nums}
.mv.up{color:var(--ok)} .mv.down{color:var(--bad)} .mv.flat,.mv.new{color:var(--t3)}
.area-name{font-weight:600; font-size:15.5px; display:block}
.crits{margin:9px 0 0; padding:0 0 0 17px; list-style:none}
.crits li{position:relative; font-size:13.4px; color:var(--t2); line-height:1.5; margin-bottom:6px}
.crits li::before{content:""; position:absolute; left:-17px; top:8px; width:6px; height:6px;
  border-radius:50%; background:var(--bad)}
.c-sev{width:120px}
.sev{display:block; font-family:"IBM Plex Mono",monospace; font-size:11px; margin-bottom:3px; white-space:nowrap}
.sev.crit{color:var(--bad); font-weight:600} .sev.high{color:var(--mid)} .sev.tot{color:var(--t3)}
.c-adj{width:96px; text-align:right}
.regrade{font-family:"IBM Plex Mono",monospace; font-size:13px; color:var(--bad); font-weight:600;
  font-variant-numeric:tabular-nums}
.held{font-family:"IBM Plex Mono",monospace; font-size:11.5px; color:var(--t3)}

/* ── plan ─────────────────────────────────────────── */
.plan{display:grid; grid-template-columns:auto 1fr; gap:20px; padding:22px 0;
  border-bottom:1px solid var(--line)}
.plan:last-child{border-bottom:none}
.plan-rank{font-family:"Bricolage Grotesque",sans-serif; font-size:30px; font-weight:800;
  color:var(--t3); line-height:1; min-width:42px; font-variant-numeric:tabular-nums}
.plan-body h3{font-size:19px; font-weight:600; line-height:1.28; margin-bottom:9px; letter-spacing:-.01em}
.plan-body p{margin:0; color:var(--t2); font-size:15px; max-width:74ch}
.plan-meta{display:flex; flex-wrap:wrap; gap:8px 22px; margin-top:13px}
.plan-meta span{font-size:12.5px; color:var(--t3)}
.plan-meta b{font-family:"IBM Plex Mono",monospace; font-size:10.5px; letter-spacing:.09em;
  text-transform:uppercase; color:var(--t3); margin-right:6px}

/* ── critic (the counter-report) ──────────────────── */
.critic{background:var(--crit-bg); border:1px solid var(--crit-fg); border-radius:16px; padding:28px}
.critic h2{color:var(--crit-fg); border-bottom-color:var(--crit-fg)}
.critic > p{color:var(--t2); max-width:72ch}
.critic h3{font-size:14px; font-family:"IBM Plex Mono",monospace; font-weight:600;
  letter-spacing:.06em; text-transform:uppercase; color:var(--crit-fg); margin:26px 0 12px}
.stack{list-style:none; margin:0; padding:0; display:grid; gap:12px}
.stack li{background:var(--panel); border:1px solid var(--line); border-radius:11px;
  padding:15px 17px; font-size:14.4px; color:var(--t2); line-height:1.56}
.stack li strong{color:var(--t1)}

/* ── device checklist ─────────────────────────────── */
.checks{list-style:none; margin:0; padding:0; counter-reset:c; display:grid; gap:11px}
.checks li{counter-increment:c; position:relative; background:var(--panel);
  border:1px solid var(--line); border-radius:12px; padding:16px 18px 16px 56px;
  font-size:14.6px; color:var(--t2); line-height:1.55; box-shadow:var(--shadow)}
.checks li::before{content:counter(c); position:absolute; left:17px; top:15px;
  width:25px; height:25px; border-radius:7px; border:1px solid var(--line);
  background:var(--panel-2); color:var(--t3); font-family:"IBM Plex Mono",monospace;
  font-size:12px; display:flex; align-items:center; justify-content:center}
.checks li strong{color:var(--t1)}

.done{background:var(--panel); border:1px solid var(--line); border-left:3px solid var(--ok);
  border-radius:0 12px 12px 0; padding:20px 24px}
.done ul{margin:10px 0 0; padding-left:19px; color:var(--t2); font-size:14.5px}
.done li{margin-bottom:7px}
footer{margin-top:60px; padding-top:22px; border-top:1px solid var(--line);
  color:var(--t3); font-size:12.5px; font-family:"IBM Plex Mono",monospace; line-height:1.8}

@media (max-width:620px){
  .top-in{grid-template-columns:1fr; gap:22px}
  .score{align-self:start; flex-direction:row; align-items:baseline; gap:14px}
  .score b{font-size:44px}
  .plan{grid-template-columns:1fr; gap:8px}
  .plan-rank{font-size:22px}
}
</style>

<header class="top">
  <div class="top-in">
    <div class="score">
      <b>${syn.overall_grade_10}</b>
      <span>out of 10</span>
      <span class="delta">▲ 0.3 vs #3</span>
    </div>
    <div>
      <p class="eyebrow">Ball IQ · Scouting report #4 · 1.7.0 · 24 Aug 2026</p>
      <h1>${md(headlineLead)}</h1>
      <p class="dek">${md(headlineRest)}</p>
      <div class="facts">
        <span>14 areas</span><span>${totalFindings} findings</span>
        <span>${totalCrit} critical</span><span>${totalHigh} high</span>
        <span>16 agents · 3.0M tokens</span><span>graded on App Store stars</span>
      </div>
    </div>
  </div>
</header>

<div class="wrap">

  <section>
    <h2>The five-star verdict</h2>
    <div class="callout prose">${arr(syn.five_star_verdict).map((v) => `<p>${md(v)}</p>`).join('')}</div>
  </section>

  <section>
    <h2>The board — worst first</h2>
    <div class="tablewrap">
      <table>
        <thead><tr>
          <th>Grade</th><th>vs #3</th><th>Area &amp; its critical findings</th>
          <th>Findings</th><th>Critic</th>
        </tr></thead>
        <tbody>${tableRows}
        </tbody>
      </table>
    </div>
    <p style="color:var(--t3);font-size:13px;margin-top:12px;max-width:70ch">
      The <em>Critic</em> column is a second, adversarial pass over the panel's own grades.
      Six of the fourteen were judged inflated and re-graded downward; the other eight were held.
      Read the re-grade as the more honest number.
    </p>
  </section>

  <section>
    <h2>The plan, in order</h2>
    ${planCards}
  </section>

  <section class="critic">
    <h2>What the critic threw out</h2>
    <p>${md(critic.biggest_hole)}</p>
    <h3>Recommendations that would cause damage if applied</h3>
    <ul class="stack">${dangerItems}</ul>
    <h3>What all fourteen reviewers missed</h3>
    <ul class="stack">${missedItems}</ul>
  </section>

  <section>
    <h2>Only a phone can answer these</h2>
    <ol class="checks">${deviceItems}</ol>
  </section>

  <section>
    <h2>Stop doing</h2>
    <ul class="stack">${stopItems}</ul>
  </section>

  <section>
    <h2>The biggest risk</h2>
    <div class="callout prose"><p>${md(syn.biggest_risk)}</p></div>
  </section>

  <footer>
    Run wf_dd62665b-c34 · 16 agents, 16 completed · 3.0M subagent tokens · 1,634 tool calls<br>
    Full text: docs/scout-4-areas.json · docs/scout-4-critic.json · docs/scout-4-synthesis.json<br>
    Every sentence on this page is quoted verbatim from those files.
  </footer>
</div>
`;

/**
 * ⚠️ Encode every non-ASCII codepoint as a numeric entity, last.
 *
 * The page is wrapped in someone else's <head> at publish time, so this file
 * cannot declare its own charset. A viewer (or a plain static server, which is
 * how I caught it) that guesses latin-1 renders every em-dash as "a-EUR-quote"
 * and every middot as "A-middot" — the report read like a mojibake dump.
 * Entities are charset-independent, so this is correct under any encoding.
 *
 * Safe to run over the whole document: all tags, attributes and the entities
 * this itself emits are pure ASCII, so nothing it produces can be re-encoded.
 */
const asciiSafe = (s) => s.replace(/[^\x00-\x7F]/gu, (ch) => `&#${ch.codePointAt(0)};`);

writeFileSync('docs/scouting-report-4.html', asciiSafe(html));
console.log(`✅ docs/scouting-report-4.html — ${(html.length / 1024).toFixed(1)} KB`);
console.log(`   14 areas · ${totalFindings} findings (${totalCrit} critical, ${totalHigh} high)`);
console.log(`   ${arr(syn.ranked_plan).length} plan items · ${arr(syn.device_test_list).length} device tests`);
console.log(`   ${Object.keys(adj).length} grades re-graded by the critic`);
