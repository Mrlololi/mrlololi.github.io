import { esc, fill, accent } from './util.mjs';
import { calcSavings, formatResult } from '../../assets/js/calc.js';
import { kiDemo, speed } from './demos.mjs';

function item(t, it, email) {
  const extra = it.extra ? `<p class="item__extra"><strong>${esc(it.extra.label)}</strong>, ${esc(it.extra.text)}</p>` : '';
  const details = it.details
    ? `<details class="price-details">
<summary>${esc(t.ui.details)}<span class="sr-only">: ${esc(it.name)}</span></summary>
<div class="price-details__body"><p>${esc(it.details)}</p></div>
</details>`
    : '';
  const bullets = it.bullets ? `<ul class="item__bullets" role="list">${it.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>` : '';
  return `<li class="item"${it.id ? ` id="pkg-${it.id}"` : ''}>
<h4 class="item__name">${esc(it.name)}</h4>
<p class="item__price">${esc(it.price)}</p>
${bullets}
<p class="item__summary">${esc(it.summary)}</p>
${extra}
${details}
<a class="btn btn--sm item__cta" href="mailto:${email}?subject=${encodeURIComponent(t.pricing.subjectPrefix + it.name)}">${esc(t.pricing.cta)}<span class="sr-only">: ${esc(it.name)}</span></a>
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
${speed(t)}
</li>`;
}

export function pricing(t, config) {
  const groups = t.pricing.groups
    .map(
      (g, gi) => `<section class="tariff__group tariff__group--${gi + 1}" aria-labelledby="group-${gi}">
<div class="tariff__head">
<h3 class="tariff__title" id="group-${gi}">${esc(g.title)}</h3>
${g.note ? `<p class="tariff__note">${esc(g.note)}</p>` : ''}
</div>
<ul class="tariff__items" role="list">
${g.items.map((it) => item(t, it, config.contact_email) + (it.calc ? '\n' + kiDemo(t) + '\n' + calculator(t) : '')).join('\n')}
</ul>
</section>`
    )
    .join('\n');

  return `<section class="section services bg-pink edge" id="services" aria-labelledby="services-title">
<div class="wrap">
<div class="section__head">
<h2 id="services-title">${accent(t.pricing.h2)}</h2>
<p class="lead">${esc(t.pricing.intro)}</p>
</div>
<div class="tariff" id="pricing">
${groups}
<div class="tariff__notes">
<p class="tariff__hourly">${esc(t.pricing.hourly)}</p>
<p class="small">${esc(t.pricing.smallPrint)}</p>
<p class="tariff__promise small">${esc(t.pricing.promise)}</p>
</div>
</div>
</div>
</section>`;
}
