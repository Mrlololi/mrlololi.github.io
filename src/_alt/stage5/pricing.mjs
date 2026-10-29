import { esc, fill, accent } from './util.mjs';
import { calcSavings, formatResult } from '../../assets/js/calc.js';
import { supportTotal } from '../../assets/js/pure.js';
import { speed } from './demos.mjs';
import { kiDemo } from './ki.mjs';
import { mascotScene } from './mascots.mjs';

// Stage 4: a small picture per package that explains it (decorative; assets/js/prices.js plays
// them on entry). The HTML shows each finished: tidy checkout, ticked list, open Launch-Box, built page, typed draft.
const check = '<svg class="viz-check" viewBox="0 0 16 16" focusable="false"><circle cx="8" cy="8" r="7.5"/><path d="M4.6 8.3l2.2 2.2 4.6-5"/></svg>';
const VIZ = {
  quick: (t) => {
    const q = t.s4.starter.quick;
    return `<div class="viz viz--quick" aria-hidden="true">
<div class="mini-co"><p class="mini-co__title">${esc(q.title)}</p>
<p class="mini-co__row"><span class="mini-co__line"></span><span class="mini-co__bad">${esc(q.broken)}</span><span class="mini-co__ok">${check}${esc(q.fixed)}</span></p>
<p class="mini-co__pay">${esc(q.pay)}</p></div>
<svg class="morph" viewBox="0 0 32 32" focusable="false"><path class="morph__wrench" d="M20.5 5.5a6 6 0 0 0-7.7 7.7L5.5 20.5a2.5 2.5 0 0 0 3.5 3.5l7.3-7.3a6 6 0 0 0 7.7-7.7l-3.6 3.6-3.1-.6-.6-3.1z"/><path class="morph__check" d="M7 16.5l6 6L25 10"/></svg>
</div>`;
  },
  check: (t) => `<div class="viz viz--check" aria-hidden="true"><ul class="scan" role="list">${t.s4.starter.check.map((l) => `<li>${esc(l)}</li>`).join('')}</ul><span class="scan__lens"></span></div>`,
  launch: (t) => {
    const h = t.s4.projects.hub;
    const ends = [[46, 26], [234, 26], [46, 134], [234, 134]];
    const lines = ends.map(([x, y], i) => `<path class="hub__line" pathLength="1" d="M140 80L${x} ${y}"/><circle class="hub__dot hub__dot--${i + 1}" cx="140" cy="80" r="4" style="--dx:${x - 140}px;--dy:${y - 80}px"/>`).join('');
    return `<div class="viz viz--hub" aria-hidden="true">
<svg class="hub__lines" viewBox="0 0 280 160" preserveAspectRatio="none" focusable="false">${lines}</svg>
<div class="lbox"><span class="lbox__face lbox__face--back"></span><span class="lbox__face lbox__face--side"></span><span class="lbox__face lbox__face--front">${esc(h.centre)}</span><span class="lbox__lid"></span></div>
${h.parts.map((p, i) => `<span class="hub__sat hub__sat--${i + 1}">${esc(p)}</span>`).join('')}
</div>`;
  },
  website: (t) => {
    const s = t.s4.projects.site;
    return `<div class="viz viz--site" aria-hidden="true"><div class="mini-browser"><p class="mini-browser__bar"><i></i><i></i><i></i><span>${esc(s.url)}</span></p><div class="mini-browser__page">${s.blocks.map((b, i) => `<span class="blk blk--${i + 1}">${esc(b)}</span>`).join('')}</div></div></div>`;
  },
  ki: (t) => {
    const c = t.s4.projects.chat;
    return `<div class="viz viz--chat" aria-hidden="true"><p class="tchat__q">${esc(c.q)}</p><p class="tchat__a"><span class="tchat__tag">${esc(c.tag)}</span><span class="tchat__text">${esc(c.a)}</span></p></div>`;
  },
};

function item(t, it, email) {
  const extra = it.extra ? `<p class="item__extra"><strong>${esc(it.extra.label)}</strong>, ${esc(it.extra.text)}</p>` : '';
  const details = it.details
    ? `<details class="price-details">
<summary>${esc(t.ui.details)}<span class="sr-only">: ${esc(it.name)}</span></summary>
<div class="price-details__body"><p>${esc(it.details)}</p></div>
</details>`
    : '';
  const bullets = it.bullets ? `<ul class="item__bullets" role="list">${it.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>` : '';
  const badge = it.id === 'check' ? `<span class="label label--lav item__badge">${esc(t.s4.starter.recommended)}</span>` : '';
  // Stage 5: a text link to the package's own page (it sits above the card-wide «Anfragen» link).
  const page = t.services.pages.find((p) => p.key === t.services.byPackage[it.id]);
  const more = page ? `<a class="item__more" href="${page.path}">${esc(t.services.ui.more)} ${esc(page.short)}</a>` : '';
  return `<li class="item item--${it.id}"${it.id ? ` id="pkg-${it.id}"` : ''} data-tilt>
${badge}<h4 class="item__name">${esc(it.name)}</h4>
<p class="item__price">${esc(it.price)}</p>
${VIZ[it.id] ? VIZ[it.id](t) : ''}
${bullets}
<p class="item__summary">${esc(it.summary)}</p>
${extra}
${details}
${more}
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

// Betreuung: an hour meter (1 -> 3 -> 5 h on entry, the total counts along) and a 5/10/20 h switch.
// Without JS the example (5 h = 225 €) stands alone; the switch appears with prices.js.
function meter(t) {
  const s = t.s4.support;
  const h = 5;
  const total = fill(esc(s.total), { h: `<span class="meter__h">${h}</span>`, eur: `<span class="meter__eur">${supportTotal(h)}</span>` });
  const ticks = Array.from({ length: 10 }, () => '<i></i>').join('');
  return `<li class="tariff__meter">
<div class="meter" style="--h:${h}">
<span class="label">${esc(s.label)}</span>
<p class="meter__total">${total}</p>
<span class="meter__bar" aria-hidden="true"><span class="meter__fill"></span><span class="meter__ticks">${ticks}</span></span>
<div class="meter__switch"><div class="meter__opts" role="group" aria-label="${esc(s.meter)}">${s.options.map((o) => `<button class="meter__opt" type="button" aria-pressed="${o === h}" data-h="${o}">${o} h</button>`).join('')}</div><span class="meter__per">${esc(s.switch)}</span></div>
<p class="sr-only meter__live" aria-live="polite"></p>
</div>
</li>`;
}

// «Meine Zusage»: the promise with Lösung (wrench) at the end of its first sentence, then a 30-day
// strip that ticks Tag 1, 14, 30 and ends on a round stamp whose text runs along a circle.
function promise(t) {
  const s = t.s4.support;
  const text = t.pricing.promise;
  const cut = text.indexOf('. ') + 1;
  const lead = mascotScene('promise', [[1, 'idle']]);
  const ring = `${s.stamp} · ${s.stamp} · `;
  return `<div class="zusage">
<p class="zusage__title">${esc(s.promiseTitle)}</p>
<p class="tariff__promise small">${esc(text.slice(0, cut))}${lead}${esc(text.slice(cut))}</p>
<div class="zusage__strip">
<ol class="zusage__days" role="list">${s.days.map((d) => `<li>${esc(d)}</li>`).join('')}</ol>
<svg class="stamp" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><defs><path id="stamp-path" d="M50 50m-37 0a37 37 0 1 1 74 0a37 37 0 1 1-74 0"/></defs><circle class="stamp__ring" cx="50" cy="50" r="47"/><g class="stamp__text"><text><textPath href="#stamp-path" textLength="228">${esc(ring)}</textPath></text></g><circle class="stamp__core" cx="50" cy="50" r="22"/><path class="stamp__check" d="M40 50.5l7 7 13-14"/></svg>
</div>
</div>`;
}

export function pricing(t, config) {
  const groups = t.pricing.groups
    .map(
      (g, gi) => `<section class="tariff__group tariff__group--${gi + 1}" aria-labelledby="group-${gi}">
<div class="tariff__head">
<h3 class="tariff__title" id="group-${gi}" data-enter="lines">${esc(g.title)}</h3>
${g.note ? `<p class="tariff__note">${esc(g.note)}</p>` : ''}
</div>
<ul class="tariff__items" role="list">
${g.items.map((it) => item(t, it, config.contact_email) + (it.calc ? '\n' + kiDemo(t) + '\n' + calculator(t) : '') + (it.id === 'support' ? '\n' + meter(t) : '')).join('\n')}
</ul>
</section>`
    )
    .join('\n');

  return `<section class="section services bg-pink edge" id="services" aria-labelledby="services-title">
<div class="wrap">
<div class="section__head">
<h2 id="services-title" data-enter="lines">${accent(t.pricing.h2)}</h2>
<p class="lead" data-enter="lines">${esc(t.pricing.intro)}</p>
</div>
<div class="tariff" id="pricing">
${groups}
<div class="tariff__notes">
<p class="tariff__hourly">${esc(t.pricing.hourly)}</p>
<p class="small">${esc(t.pricing.smallPrint)}</p>
${promise(t)}
</div>
</div>
</div>
</section>`;
}
