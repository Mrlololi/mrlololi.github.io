import { esc, fill } from './util.mjs';
import { calcSavings, formatResult } from '../../assets/js/calc.js';

function item(t, it) {
  const tiers = it.tiers
    ? `<ul class="item__tiers" role="list">
${it.tiers.map(([hours, price]) => `<li><span>${esc(hours)}</span><span class="item__leader" aria-hidden="true"></span><span class="item__tier-price">${esc(price)}</span></li>`).join('\n')}
</ul>`
    : '';
  const details = it.details
    ? `<details class="price-details">
<summary>${esc(t.ui.details)}<span class="sr-only">: ${esc(it.name)}</span></summary>
<div class="price-details__body"><p>${esc(it.details)}</p></div>
</details>`
    : '';
  return `<li class="item${it.tiers ? ' item--tiers' : ''}">
<div class="item__head">
<h4 class="item__name">${esc(it.name)}</h4>
<span class="item__leader" aria-hidden="true"></span>
<p class="item__price">${esc(it.price)}</p>
</div>
${tiers}
<p class="item__summary">${esc(it.summary)}</p>
${details}
</li>`;
}

export function calculator(t) {
  const defaults = Object.fromEntries(t.calc.inputs.map((i) => [i.id, i.value]));
  const r = formatResult(
    calcSavings({ emailsPerWeek: defaults.emails, minutesPerReply: defaults.minutes, sharePercent: defaults.share, hourlyRate: defaults.rate }),
    t.locale
  );
  const sentence = fill(esc(t.calc.sentence), {
    h: `<strong data-out="h">${r.h}</strong>`,
    saved_h: `<strong data-out="savedH">${r.savedH}</strong>`,
    saved_eur: `<strong data-out="savedEur">${r.savedEur}</strong>`,
  });
  const fields = t.calc.inputs
    .map(
      (i) => `<div class="calc__field">
<label for="calc-${i.id}">${esc(i.label)}</label>
<input id="calc-${i.id}" name="${i.id}" type="number" inputmode="numeric" min="${i.min}" max="${i.max}" step="${i.step}" value="${i.value}">
</div>`
    )
    .join('\n');
  return `<li class="tariff__calc">
<form class="calc instrument" id="ki-rechner" aria-labelledby="calc-title" novalidate data-locale="${t.locale}">
<h4 class="calc__title" id="calc-title">${esc(t.calc.h3)}</h4>
<div class="calc__fields">
${fields}
</div>
<p class="calc__result">${sentence}</p>
<p class="calc__note small">${esc(t.calc.note)}</p>
<p class="sr-only" id="calc-live" aria-live="polite"></p>
</form>
</li>`;
}

export function pricing(t) {
  const groups = t.pricing.groups
    .map(
      (g, gi) => `<section class="tariff__group" aria-labelledby="group-${gi}">
<h3 class="tariff__title" id="group-${gi}">${esc(g.title)}</h3>
<ul class="tariff__items" role="list">
${g.items.map((it) => item(t, it) + (it.calc ? '\n' + calculator(t) : '')).join('\n')}
</ul>
</section>`
    )
    .join('\n');

  return `<section class="section services" id="services" aria-labelledby="services-title">
<div class="wrap">
<div class="section__head">
<h2 id="services-title">${esc(t.pricing.h2)}</h2>
<p class="lead">${esc(t.pricing.intro)}</p>
</div>
<div class="tariff" id="pricing">
${groups}
<div class="tariff__notes">
<p class="tariff__hourly">${esc(t.pricing.hourly)}</p>
<p class="small">${esc(t.pricing.smallPrint)}</p>
</div>
</div>
</div>
</section>`;
}
