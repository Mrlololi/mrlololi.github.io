import { readFileSync, existsSync } from 'node:fs';
import { esc, fill, formatDate } from './util.mjs';
import { icon } from '../../assets/js/kit/icons.mjs';

// Qualität (docs/PROMPT_Qualitaet_und_Wortfilter_2026-11-17.md, part B): /qualitaet/ «Prüfprotokoll dieser
// Website». Every number on the page comes from src/content/qualitaet.json, which src/qa/protokoll.mjs
// writes before every publish; the texts come from t.qualitaet. This file writes no number of its own
// (tests/qualitaet.test.mjs checks it). A value that is not met is shown as it is.

const DATA = new URL('../content/qualitaet.json', import.meta.url);
export const loadProtokoll = () => (existsSync(DATA) ? JSON.parse(readFileSync(DATA, 'utf8')) : null);

// Page-only CSS, inlined on /qualitaet/ alone (page.css).
export const qualitaetCss = readFileSync(new URL('../../assets/css/qualitaet.css', import.meta.url), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\n\s*/g, '\n')
  .replace(/\n{2,}/g, '\n')
  .trim();

const num = (n, locale) => new Intl.NumberFormat(locale, { maximumFractionDigits: 4 }).format(n);
const day = (iso, locale) => formatDate(new Date(iso), locale); // «YYYY-MM-DD» is UTC midnight: the same day in Vienna

// The rows: [key, met, values].
function rows(Q, d, locale) {
  const s = d.summary;
  const checksOk = d.tests.fail === 0 && d.gates.fail === 0;
  return [
    ['speed', s.perfMin >= s.perfLimit, { min: s.perfMin, max: s.perfMax, pages: s.pages, runs: d.lighthouseRuns }],
    ['cls', s.clsMax === 0, { cls: num(s.clsMax, locale) }],
    ['keyboard', s.keyboardPassed === s.keyboardTotal, { passed: s.keyboardPassed, total: s.keyboardTotal }],
    ['axe', s.axeSerious === 0, { axe: s.axeSerious }],
    ['privacy', s.cookies === 0 && s.external === 0, { cookies: s.cookies, external: s.external }],
    ['form', Boolean(d.form_live), { date: d.form_live ? day(d.form_live, locale) : '' }],
    ['checks', checksOk, { tests: d.tests.total, gates: d.gates.total, failed: d.tests.fail + d.gates.fail }],
  ].map(([key, met, v]) => {
    const [what, result, tool] = Q.rows[key];
    let text = fill(esc(result), Object.fromEntries(Object.entries(v).map(([k, x]) => [k, esc(x)])));
    if (key === 'form' && !d.form_live) text = esc(Q.rows.formNone);
    if (key === 'checks' && !checksOk) text = fill(esc(Q.rows.checksFailed), { tests: d.tests.total, gates: d.gates.total, failed: v.failed });
    return { key, met, what, text, tool: fill(esc(tool), { runs: d.lighthouseRuns }) };
  });
}

export function qualitaetPage(t, d) {
  const Q = t.qualitaet;
  const tools = [`Lighthouse ${d.tools.lighthouse}`, `Chromium ${d.tools.chromium} (Playwright ${d.tools.playwright})`, `axe-core ${d.tools.axe}`, `Node ${d.tools.node}`].join(', ');
  const label = fill(esc(d.dirty ? Q.labelDirty : Q.label), { measured: esc(day(d.measured, t.locale)), tools: esc(tools), commit: `<code>${esc(d.commit)}</code>` });
  const pkg = t.pricing.groups.flatMap((g) => g.items).find((it) => it.id === Q.exitPackage);
  const [cWhat, cResult, cTool] = Q.cols;
  const body = rows(Q, d, t.locale).map((r) => `<tr role="row" class="q-row${r.met ? '' : ' q-row--open'}">
<th role="rowheader" scope="row">${r.met ? `<span class="i-tile q-row__ico">${icon('check')}</span>` : ''}<span>${esc(r.what)}</span></th>
<td role="cell" data-label="${esc(cResult)}"><strong>${r.text}</strong><span class="q-row__state">${esc(r.met ? Q.met : Q.notMet)}</span></td>
<td role="cell" data-label="${esc(cTool)}">${r.tool}</td>
</tr>`).join('\n');
  return `<section class="q-head bg-hero" aria-labelledby="q-h">
<div class="wrap q-wrap">
<h1 id="q-h">${esc(Q.h1)}</h1>
<p class="lead">${esc(Q.lead)}</p>
<p class="q-label">${label}</p>
</div>
</section>
<section class="q-sec bg-pist edge" aria-labelledby="q-table-h">
<div class="wrap q-wrap">
<h2 id="q-table-h">${esc(Q.tableTitle)}</h2>
<table class="q-table" role="table" aria-labelledby="q-table-h">
<thead role="rowgroup"><tr role="row"><th role="columnheader" scope="col">${esc(cWhat)}</th><th role="columnheader" scope="col">${esc(cResult)}</th><th role="columnheader" scope="col">${esc(cTool)}</th></tr></thead>
<tbody role="rowgroup">
${body}
</tbody>
</table>
</div>
</section>
<section class="q-sec bg-peach edge" aria-labelledby="q-gaps-h">
<div class="wrap q-wrap">
<h2 id="q-gaps-h">${esc(Q.gapsTitle)}</h2>
<ul class="q-gaps" role="list">
${Q.gaps.map((g) => `<li class="card card--row card--note q-gap"><span class="card__text">${esc(g)}</span></li>`).join('\n')}
</ul>
<div class="q-exit">
<p class="q-exit__lead">${esc(Q.exitLead)}</p>
<a class="btn btn--primary" href="${esc(Q.exitHref)}">${esc(pkg.name)}, ${esc(pkg.price)}</a>
</div>
</div>
</section>`;
}
