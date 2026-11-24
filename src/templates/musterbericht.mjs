import { readFileSync } from 'node:fs';
import { esc as escape, absUrl, note } from './util.mjs';

// Musterbericht Technik-Check (docs/PROMPT_Musterbericht_Technik-Check_2026-11-24.md): the sample report Iva
// approved on 22.11.2026, rebuilt as a calm document page in the site shell. All texts come from t.musterbericht
// (word for word); the price of the exit comes from the package data, never from this file. No mascot scene and
// no motion in the body. The PDF at t.musterbericht.pdf is printed from this page (src/tools/musterbericht-pdf.mjs,
// A4, the print rules of assets/css/musterbericht.css).

export const musterberichtCss = readFileSync(new URL('../../assets/css/musterbericht.css', import.meta.url), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\n\s*/g, '\n')
  .replace(/\n{2,}/g, '\n')
  .trim();

// A number and its unit stay on one line («45 €», «1 h», «30 min»): a no-break space, the words unchanged.
const esc = (s) => escape(s).replace(/(\d) (€|h\b|min\b)/g, '$1\u00a0$2');

// Status and risk words: the word carries the meaning, the label colour only repeats it.
const TONE = { kritisch: 'pink', beheben: 'peach', hoch: 'pink', mittel: 'peach', niedrig: 'pist' };
const word = (w) => `<span class="label label--${TONE[w]} mb-tag">${esc(w)}</span>`;

export function musterberichtPage(t, config) {
  const M = t.musterbericht;
  const pkg = t.pricing.groups.flatMap((g) => g.items).find((it) => it.id === M.exitPackage);
  const email = config.contact_email;
  const [cNr, cArea, cFind, cRisk, cEffort, cWho] = M.cols;
  const glance = M.glance.map(([area, status, line]) => `<li class="mb-glance__row">
<span class="mb-glance__area">${esc(area)}</span>${word(status)}<span class="mb-glance__line">${esc(line)}</span>
</li>`).join('\n');
  const rows = M.findings.map(([nr, area, text, how, risk, effort, who]) => `<tr>
<th scope="row" class="mb-nr">${nr}</th>
<td>${esc(area)}</td>
<td>${esc(text)}<span class="mb-how">${esc(how)}</span></td>
<td>${word(risk)}</td>
<td class="mb-effort">${esc(effort)}</td>
<td>${esc(who)}</td>
</tr>`).join('\n');
  const plan = M.plan.map(([when, what]) => `<tr><th scope="row">${esc(when)}</th><td>${esc(what)}</td></tr>`).join('\n');
  return `<article class="mb" data-entry="${M.id}" aria-labelledby="mb-h">
<section class="mb-head bg-hero">
<div class="wrap mb-wrap">
<p class="mb-meta"><strong>${esc(M.head.title)}</strong>${M.head.lines.map((l) => `<span>${esc(l)}</span>`).join('')}</p>
<h1 id="mb-h">${esc(M.h1)}</h1>
<p class="mb-fake card card--note"><strong>${esc(M.fake[0])}</strong> ${esc(M.fake[1])}</p>
<p class="mb-pdf"><a class="text-link" href="${esc(M.pdf)}">${esc(M.pdfLink)}</a></p>
</div>
</section>
<section class="mb-sec" aria-labelledby="mb-glance-h">
<div class="wrap mb-wrap">
<ul class="mb-cards" role="list">
${M.cards.map(([k, text]) => `<li class="card mb-card"><p class="mb-card__k">${esc(k)}</p><p>${esc(text)}</p></li>`).join('\n')}
</ul>
<h2 id="mb-glance-h">${esc(M.glanceTitle)}</h2>
<ul class="mb-glance" role="list">
${glance}
</ul>
<div class="card card--note mb-top3">
<h3>${esc(M.top3Title)}</h3>
<ol>
${M.top3.map(([lead, text]) => `<li><strong>${esc(lead)}</strong> ${esc(text)}</li>`).join('\n')}
</ol>
</div>
</div>
</section>
<section class="mb-sec mb-sec--findings" aria-labelledby="mb-find-h">
<div class="wrap mb-wrap">
<h2 id="mb-find-h">${esc(M.findingsTitle)}</h2>
<p class="mb-note">${esc(M.findingsNote)}</p>
<div class="mb-scroll" role="region" aria-labelledby="mb-find-h" tabindex="0">
<table class="mb-table">
<thead><tr><th scope="col">${esc(cNr)}</th><th scope="col">${esc(cArea)}</th><th scope="col">${esc(cFind)}</th><th scope="col">${esc(cRisk)}</th><th scope="col">${esc(cEffort)}</th><th scope="col">${esc(cWho)}</th></tr></thead>
<tbody>
${rows}
</tbody>
</table>
</div>
</div>
</section>
<section class="mb-sec mb-sec--plan" aria-labelledby="mb-plan-h">
<div class="wrap mb-wrap">
<h2 id="mb-plan-h">${esc(M.planTitle)}</h2>
<table class="mb-plan">
<tbody>
${plan}
</tbody>
</table>
<div class="card card--note mb-price">
<h3>${esc(M.priceTitle)}</h3>
${M.price.map((p, i) => `<p>${esc(i === M.price.length - 1 && note(config, 'credit_winter', 'de') ? `${p} ${note(config, 'credit_winter', 'de')}` : p)}</p>`).join('\n')}
</div>
<h2>${esc(M.notTitle)}</h2>
<p class="mb-note">${esc(M.not)}</p>
<p class="mb-sig">${esc(M.sigLead)} <a href="mailto:${esc(email)}"><strong>${esc(email)}</strong></a> · mrlololi.com<span>${esc(M.sigLine)}</span></p>
<div class="mb-exit">
<p class="mb-exit__lead">${esc(M.exitLead)}</p>
<a class="btn btn--primary" href="${esc(M.exitHref)}">${esc(pkg.name)}, ${esc(pkg.price.replace(/\s*fix$/, ''))}</a>
</div>
</div>
</section>
</article>`;
}

// JSON-LD: the report as a CreativeWork by the Person, about the Technik-Check; the PDF as its second encoding.
// No rating markup, no isBasedOn.
export function musterberichtLd(t, config) {
  const M = t.musterbericht;
  const pkg = t.pricing.groups.flatMap((g) => g.items).find((it) => it.id === M.exitPackage);
  return [{
    '@type': 'CreativeWork',
    name: M.h1,
    headline: M.h1,
    description: M.description,
    url: absUrl(config, M.path),
    inLanguage: 'de',
    dateModified: config.page_dates.musterbericht,
    author: { '@id': absUrl(config, '/#iva') },
    about: { '@type': 'Service', name: pkg.name, provider: { '@id': absUrl(config, '/#business') } },
    encoding: { '@type': 'MediaObject', contentUrl: absUrl(config, M.pdf), encodingFormat: 'application/pdf' },
  }];
}
