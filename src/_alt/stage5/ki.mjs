import { esc, accent } from './util.mjs';
import { KI_EXAMPLES, KI_TABS } from '../content/ki-examples.mjs';

// Highlight types in legend order, with their pastel (blue, pink, lavender, peach).
export const KI_TYPES = ['anliegen', 'fehlt', 'stimmung', 'dringlichkeit'];

// The mail with its highlights as <mark>s (assets/js/kidemo.js turns them into buttons with a popover).
export function markedBody(x) {
  let out = '';
  let rest = x.body;
  x.marks.forEach((m, i) => {
    const at = rest.indexOf(m.text);
    out += esc(rest.slice(0, at)) + `<mark class="hl hl--${m.type}" data-mark="${i}" data-reason="${esc(m.reason)}" data-action="${esc(m.action)}">${esc(m.text)}</mark>`;
    rest = rest.slice(at + m.text.length);
  });
  return (out + esc(rest)).replace(/\n/g, '<br>');
}

// The data the browser loads on first view (/assets/data/ki-de.json, ki-en.json; written by the build).
export function kiData(t) {
  const lang = t.lang;
  return { tabs: KI_TABS[lang], examples: KI_EXAMPLES[lang] };
}

// Stage 4 KI demo: three sticky steps «Lesen, Erkennen, Entwerfen», the legend, example 1 as the
// finished state (mail with marks, draft in three tones, «Was das System tun würde»). Without JS
// the other 19 examples are in a <details> list; kidemo.js loads them all as JSON instead.
export function kiDemo(t) {
  const k = t.ki;
  const s = t.s4.ki;
  const x = KI_EXAMPLES[t.lang][0];
  const steps = s.steps.map(([title, text], i) => `<li class="kisteps__step${i ? '' : ' is-active'}"><span class="kisteps__bar" aria-hidden="true"></span><span class="kisteps__n" aria-hidden="true">${i + 1}</span><span class="kisteps__title">${esc(title)}</span><span class="kisteps__text">${esc(text)}</span></li>`).join('\n');
  const legend = KI_TYPES.map((type) => `<li class="kilegend__item kilegend__item--${type}"><span class="hl hl--${type}">${esc(s.legend[type])}</span></li>`).join('');
  const tones = k.tones.map(([name], i) => `<div class="tone__panel"><p class="tone__label">${esc(name)}</p><p class="tone__text">${esc(x.drafts[['sie', 'du', 'locker'][i]])}</p></div>`).join('\n');
  const more = KI_EXAMPLES[t.lang].slice(1).map((e) => `<li class="kimore__item"><p class="kimore__head"><strong>${esc(e.title)}</strong> · ${esc(e.from)} · ${esc(s.mood)}: ${esc(e.mood)}</p><p class="kimore__body">${markedBody(e)}</p><p class="kimore__draft"><span class="kidemo__tag">${esc(s.tag)}</span> ${esc(e.drafts.sie)}</p><p class="kimore__system"><strong>${esc(s.system)}:</strong> ${esc(e.system)}</p></li>`).join('\n');
  const labels = { why: s.why, draftDoes: s.draftDoes, close: s.close, legend: s.legend, counter: s.counter, next: s.next, random: s.random, inbox: s.inbox, unread: s.unread, subject: s.subject, mood: s.mood, tones: k.tones.map(([name]) => name) };
  return `<li class="tariff__ki">
<section class="kidemo" id="ki-demo" aria-labelledby="kidemo-title" data-src="/assets/data/ki-${t.lang}.json" data-labels="${esc(JSON.stringify(labels))}">
<div class="kidemo__head"><h3 class="kidemo__title" id="kidemo-title">${accent(k.h3)}</h3><span class="label">${esc(t.ui.example)}</span></div>
<div class="kidemo__layout">
<ol class="kisteps" role="list">
${steps}
</ol>
<div class="kidemo__card">
<div class="kibox"></div>
<ul class="kilegend" role="list" aria-label="${esc(s.legendLabel)}">${legend}</ul>
<div class="kidemo__grid">
<div class="kidemo__mail">
<p class="kidemo__from"><span class="kidemo__sender">${esc(x.from)}</span> · <span class="kidemo__subject">${esc(x.subject)}</span></p>
<p class="kidemo__text">${markedBody(x)}</p>
<div class="kipop" role="dialog" aria-modal="false" hidden></div>
</div>
<div class="kidemo__draft">
<p class="kidemo__pill" aria-hidden="true"><span class="sparkle"></span>${esc(k.pill)}</p>
<span class="kidemo__tag">${esc(s.tag)}</span>
<div class="tone" data-label="${esc(k.toneLabel)}">
${tones}
</div>
<div class="kidemo__actions"><button class="btn btn--primary btn--sm kidemo__approve" type="button" data-done="${esc(k.approved)}">${esc(k.buttons[0])}</button><button class="btn btn--ghost btn--sm kidemo__edit" type="button" data-done="${esc(k.done)}" data-label="${esc(k.editLabel)}">${esc(k.buttons[1])}</button></div>
<p class="kidemo__sent" role="status" hidden>${esc(k.sent)}</p>
<p class="kidemo__note small">${esc(k.note)}</p>
<p class="kidemo__system"><strong>${esc(s.system)}:</strong> <span>${esc(x.system)}</span></p>
</div>
</div>
<p class="kidemo__caption">${esc(k.caption)}</p>
</div>
</div>
<details class="kimore">
<summary>${esc(s.more)}</summary>
<ol class="kimore__list" role="list">
${more}
</ol>
</details>
</section>
</li>`;
}
