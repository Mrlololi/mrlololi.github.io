import { esc, accent, fill, extLink } from './util.mjs';
import { KI_EXAMPLES } from '../content/ki-examples.mjs';
import { calcSavings, formatResult } from '../../assets/js/calc.js';
import { loopButton } from './hero.mjs';

// Highlight types (blue, pink, lavender, peach).
export const KI_TYPES = ['anliegen', 'fehlt', 'stimmung', 'dringlichkeit'];
// Stage 6: three examples on /ki-antwortentwuerfe/ (one per topic: access, payment, cancellation);
// all 20 stay on mrlololi.com/Webprojekte/ki-kundenservice/ only.
export const KI_PICK = [0, 4, 8];
const TONES = ['sie', 'du', 'locker'];

// The mail with each highlight as a <mark> and its label right at the mark (no legend row).
export function markedBody(x, legend) {
  let out = '';
  let rest = x.body;
  x.marks.forEach((m, i) => {
    const at = rest.indexOf(m.text);
    out += esc(rest.slice(0, at)) + `<mark class="hl hl--${m.type}" data-mark="${i}">${esc(m.text)}<span class="hl__tag">${esc(legend[m.type])}</span></mark>`;
    rest = rest.slice(at + m.text.length);
  });
  return (out + esc(rest)).replace(/\n/g, '<br>');
}

// The draft in sentences, one per line, so it can appear line by line.
export const sentences = (text) => text.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g).map((s) => s.trim());
const draftHtml = (text) => sentences(text).map((s) => `<span class="kidemo__line">${esc(s)}</span>`).join(' ');

// Stage 6 KI demo: the HTML is example 1, finished (marks lit, draft written, step 3 current).
// assets/js/kidemo.js resets it off-screen and plays Lesen -> Erkennen -> Entwerfen on entry;
// a tap on the picture skips to the end. Controls: «Anderes Beispiel», the tone, «Freigeben».
export function kiDemo(t, config, { live = {} } = {}) {
  const k = t.ki;
  const s = t.s4.ki;
  const d = t.s6.ki;
  const all = KI_EXAMPLES[t.lang];
  const picks = KI_PICK.map((i) => all[i]);
  const x = picks[0];
  const data = picks.map((e) => ({ from: e.from, subject: e.subject, body: markedBody(e, s.legend), drafts: Object.fromEntries(TONES.map((tn) => [tn, draftHtml(e.drafts[tn])])), system: e.system }));
  const steps = d.steps.map((title, i) => `<li><button class="kisteps__btn chip" type="button" data-step="${i}"${i === 2 ? ' aria-current="step"' : ''}><span class="kisteps__n" aria-hidden="true">${i + 1}</span>${esc(title)}</button></li>`).join('');
  const tones = k.tones.map(([name], i) => `<button class="kitone chip" type="button" data-tone="${TONES[i]}" aria-pressed="${i === 0}">${esc(name)}</button>`).join('');
  // Only when the page answered 200 at build time (as in Stage 5).
  const portfolio = live.kiPortfolio ? `<p class="kidemo__all">${extLink(config.ki_portfolio_url, esc(d.all), t)}</p>` : '';
  return `<section class="kidemo card demo" id="ki-demo" data-demo="ki" aria-labelledby="kidemo-title" data-examples="${esc(JSON.stringify(data))}">
<div class="kidemo__head"><h3 class="kidemo__title" id="kidemo-title">${accent(k.h3)}</h3><span class="label">${esc(t.ui.example)}</span></div>
<p class="kidemo__top">${esc(d.top)}</p>
<ol class="kisteps" role="list" aria-label="${esc(d.stepsLabel)}">${steps}</ol>
<div class="kidemo__grid" data-step="2">
<div class="kidemo__mail">
<p class="kidemo__label">${esc(d.mail)}</p>
<p class="kidemo__from"><span class="kidemo__sender">${esc(x.from)}</span> · <span class="kidemo__subject">${esc(x.subject)}</span></p>
<p class="kidemo__text">${data[0].body}</p>
</div>
<svg class="kidemo__arrow" viewBox="0 0 48 24" aria-hidden="true" focusable="false"><path pathLength="1" d="M3 12h40M35 5l8 7-8 7"/></svg>
<div class="kidemo__draft">
<p class="kidemo__label">${esc(d.draft)} <span class="kidemo__tag">${esc(s.tag)}</span></p>
<p class="kidemo__out" aria-live="polite">${data[0].drafts.sie}</p>
<div class="kidemo__tones" role="group" aria-label="${esc(d.tone)}">${tones}</div>
<button class="btn btn--primary btn--sm kidemo__approve" type="button" data-done="${esc(d.approved)}">${esc(d.approve)}</button>
<p class="kidemo__note small">${esc(k.note)}</p>
</div>
</div>
<div class="kidemo__controls">
<button class="kidemo__other btn btn--secondary btn--sm" type="button">${esc(d.other)}</button>
${loopButton(t, 'ki')}
</div>
<details class="kidemo__bg">
<summary>${esc(d.background)}</summary>
<p class="kidemo__system">${esc(x.system)}</p>
</details>
${portfolio}
</section>`;
}

// Stage 6 calculator: four inputs; the answer as two bars (by hand, with drafts, per month) that
// follow the inputs, and the saving that counts up once per change (assets/js/kicalc.js).
export function calculator(t) {
  const d = t.s6.ki.calc;
  const defaults = Object.fromEntries(t.calc.inputs.map((i) => [i.id, i.value]));
  const v = calcSavings({ emailsPerWeek: defaults.emails, minutesPerReply: defaults.minutes, sharePercent: defaults.share, hourlyRate: defaults.rate });
  const r = formatResult(v, t.locale);
  const draft = formatResult({ hoursPerMonth: v.hoursPerMonth - v.savedHours, savedHours: 0, savedEur: 0 }, t.locale).h;
  const k = v.hoursPerMonth ? (v.hoursPerMonth - v.savedHours) / v.hoursPerMonth : 0;
  const fields = t.calc.inputs.map((i) => `<div class="calc__field">
<label for="calc-${i.id}">${esc(i.label)}</label>
<input id="calc-${i.id}" name="${i.id}" type="number" inputmode="numeric" min="${i.min}" max="${i.max}" step="${i.step}" value="${i.value}">
</div>`).join('\n');
  const bar = (cls, label, out, value, scale) => `<div class="bar bar--${cls}"><p class="bar__label">${esc(label)}</p><span class="bar__track" aria-hidden="true"><span class="bar__fill" style="transform:scaleX(${scale.toFixed(3)})"></span></span><p class="bar__value"><strong data-out="${out}">${value}</strong> ${esc(d.unit)}</p></div>`;
  const saving = fill(esc(d.saving), { h: `<strong data-out="savedH">${r.savedH}</strong>`, eur: `<strong data-out="savedEur">${r.savedEur}</strong>` });
  return `<form class="calc card" id="ki-rechner" aria-labelledby="calc-title" novalidate data-locale="${t.locale}">
<h3 class="calc__title" id="calc-title">${esc(t.calc.h3)}</h3>
<div class="calc__grid">
<div class="calc__fields">
${fields}
</div>
<div class="calc__answer">
${bar('hand', d.hand, 'h', r.h, 1)}
${bar('draft', d.draft, 'draftH', draft, k)}
<p class="calc__saving">${saving}</p>
</div>
</div>
<p class="calc__note small">${esc(t.calc.note)}</p>
<p class="sr-only" id="calc-live" aria-live="polite"></p>
</form>`;
}
