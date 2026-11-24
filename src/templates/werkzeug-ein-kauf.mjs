import { readFileSync } from 'node:fs';
import { esc, absUrl } from './util.mjs';
import { runlog } from './runlog.mjs';
import { mascotScene } from './mascots.mjs';
import { kauf } from '../content/kerne/launch.de.mjs';

// Werkzeug «Ein Kauf: Was, wenn ein Teil fehlt?» (docs/PROMPT_Werkzeug_Ein_Kauf_2026-11-13.md).
// The run-log of 7b (variant 'kauf', end frame), one switch per step above it, and the panel of the step
// that is off next to it (below it on phones). Without JS: the run-log intact and all six panels as six
// readable sections in order; the switches are not there. assets/js/werkzeug-ein-kauf.js makes it a tool:
// one step off at a time (default «zugang», or the step in the hash), «Zurücksetzen» restores the run.
// The price and the package name come from the package data, never from this file.

export const einKaufCss = readFileSync(new URL('../../assets/css/werkzeug.css', import.meta.url), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\n\s*/g, '\n')
  .replace(/\n{2,}/g, '\n')
  .trim();

export const KAUF_IDS = kauf.map((k) => k.id);

function panel(E, k) {
  const R = E.rows;
  const link = k.testLink ? ` ${esc(k.testLink.lead)} <a href="${k.testLink.href}">${esc(k.testLink.text)}</a>.` : '';
  return `<section class="ek-panel" id="${k.id}" data-entry="${k.id}" aria-labelledby="ek-${k.id}-h">
<p class="ek-panel__step"><span class="ek-panel__nr">${k.nr}</span> ${esc(k.titel)}</p>
<h3 id="ek-${k.id}-h">«${esc(k.kaeuferinSatz)}»</h3>
<p class="ek-panel__label"><span class="label label--lav">${esc(E.tag)}</span></p>
<dl class="ek-panel__rows">
<dt>${esc(R.sieht)}</dt><dd>${esc(k.kaeuferinSieht)}</dd>
<dt>${esc(R.sie)}</dt><dd>${esc(k.sieSehen)}</dd>
<dt>${esc(R.wer)}</dt><dd>${esc(k.werMerktEsText)}</dd>
<dt>${esc(R.test)}</dt><dd>${esc(k.testFaengtEs)}${link}</dd>
${k.notfallId ? `<dt>${esc(R.notfall)}</dt><dd data-notfall="${esc(k.notfallId)}"></dd>` : ''}
</dl>
<figure class="ek-mail card card--note">
<figcaption class="label label--peach">${esc(E.mailLabel)}</figcaption>
<blockquote><p>${esc(k.supportMail)}</p></blockquote>
<p class="ek-mail__link"><a class="text-link" href="${E.mailHref}">${esc(E.mailLink)}</a></p>
</figure>
</section>`;
}

export function einKaufPage(t, config = {}) {
  const E = t.einKauf;
  const pkg = t.pricing.groups.flatMap((g) => g.items).find((it) => it.id === E.exitPackage);
  const switches = kauf.map((k) => `<li><button class="ek-switch btn btn--secondary btn--sm" type="button" aria-pressed="false" data-step="${k.id}" data-missing="${k.kommtNichtAn.join(' ')}"><span class="ek-switch__nr" aria-hidden="true">${k.nr}</span><span class="sr-only">${esc(E.switchOff)}: </span><span class="ek-switch__text">${esc(k.titel)}</span><span class="ek-switch__off" aria-hidden="true">${esc(E.switchOn)}</span></button></li>`).join('\n');
  return `<section class="ek-head bg-hero" aria-labelledby="ek-h">
<div class="wrap ek-wrap">
<h1 id="ek-h">${esc(E.h1)}</h1>
<p class="lead">${esc(E.lead)}</p>
<p class="ek-label">${esc(E.label)}</p>
</div>
</section>
<section class="ek-tool bg-pist edge" aria-labelledby="ek-tool-h">
<div class="wrap ek-wrap">
<h2 id="ek-tool-h">${esc(E.toolTitle)}</h2>
<div class="ek-grid">
<div class="ek-log">
<ol class="ek-switches" role="list">
${switches}
</ol>
${runlog(t, { variant: 'kauf', ids: KAUF_IDS, kauf: E })}
</div>
<div class="ek-side">
${mascotScene('kauf', [[0, 'think']], 'ek-logik', 'kauf')}
<div class="ek-panels">
<section class="ek-panel ek-panel--intact" aria-labelledby="ek-intact-h">
<h3 id="ek-intact-h">${esc(E.intactTitle)}</h3>
<p>${esc(E.intactText)}</p>
</section>
${kauf.map((k) => panel(E, k)).join('\n')}
</div>
<p class="ek-actions"><button class="btn btn--secondary btn--sm ek-reset" type="button">${esc(E.reset)}</button></p>
</div>
</div>
</div>
</section>
<section class="ek-sec bg-paper" aria-labelledby="ek-text-h">
<div class="wrap ek-wrap ek-text">
${E.text.map(([h, ps, report], i) => `<h2${i === 0 ? ' id="ek-text-h"' : ''}>${esc(h)}</h2>\n${ps.map((p) => `<p>${esc(p)}</p>`).join('\n')}${report && config.check_report_url ? `\n<p><a class="text-link" href="${esc(config.check_report_url)}">${esc(t.musterbericht.linkText)}</a></p>` : ''}`).join('\n')}
<p class="ek-label ek-label--end">${esc(E.label)}</p>
<div class="ek-exit">
<p class="ek-exit__lead">${esc(E.exitLead)}</p>
<a class="btn btn--primary" href="${esc(E.exitHref)}">${esc(pkg.name)}, ${esc(pkg.price.replace(/\s*fix$/, ''))}</a>${E.talk ? `
<p class="ek-talk"><a class="text-link" href="${esc(E.talkHref)}">${esc(E.talk)}</a></p>` : ''}
</div>
</div>
</section>
<script type="module" src="/assets/js/werkzeug-ein-kauf.js"></script>`;
}

// JSON-LD: the tool and its breadcrumb (Start › Werkzeuge › Ein Kauf; there is no /werkzeuge/ page yet,
// so that crumb carries no item).
export function einKaufLd(t, config) {
  const E = t.einKauf;
  const url = absUrl(config, config.werkzeug_ein_kauf_path);
  return [
    { '@type': 'WebApplication', name: E.h1, url, applicationCategory: 'BusinessApplication', operatingSystem: 'Web', isAccessibleForFree: true, inLanguage: 'de', author: { '@id': absUrl(config, '/#iva') } },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: E.crumbs[0], item: absUrl(config, '/') },
      { '@type': 'ListItem', position: 2, name: E.crumbs[1] },
      { '@type': 'ListItem', position: 3, name: E.crumbs[2], item: url },
    ] },
  ];
}
