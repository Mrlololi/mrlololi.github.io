import { esc, accent, fill } from './util.mjs';
import { loopButton } from './hero.mjs';

// «Ich arbeite mit»: text pills (no logos). The second list is the marquee's seamless copy.
export function tools(t) {
  const pills = t.tools.items.map((name) => `<li>${esc(name)}</li>`).join('');
  return `<section class="tools bg-peach edge" aria-labelledby="tools-title">
<div class="wrap tools__in">
<p class="tools__label" id="tools-title">${esc(t.tools.label)}</p>
${loopButton(t)}
<div class="marquee">
<div class="marquee__track">
<ul class="marquee__list" role="list">${pills}</ul>
<ul class="marquee__list" role="list" aria-hidden="true">${pills}</ul>
</div>
</div>
</div>
</section>`;
}

// Before/after slider for «Wo es meistens hakt». Both drawings share one 440 x 300 canvas.
// Without JS they stand side by side; with JS the «after» side is clipped by the range value.
const BA_W = [104, 140, 92, 86, 76];
function pill(label, x, y, w, cls) {
  return `<g class="ba__node ${cls}"><rect x="${x}" y="${y}" width="${w}" height="34" rx="12"/><text x="${x + w / 2}" y="${y + 22}" text-anchor="middle">${esc(label)}</text></g>`;
}
function chaosSvg(nodes) {
  const at = [[24, 34], [150, 132], [300, 26], [318, 226], [40, 236]];
  const links = [
    ['M128 51C260 60 250 250 318 243', ''],
    ['M346 60C320 140 120 170 78 236', 'broken'],
    ['M220 132C230 90 300 80 330 60', ''],
    ['M76 68C90 110 120 120 160 132', 'broken'],
    ['M318 250C250 280 160 270 116 254', 'broken'],
    ['M290 149C380 150 400 200 380 226', ''],
  ];
  const lines = links.map(([d, k]) => `<path class="ba__link${k ? ' ba__link--broken' : ''}" d="${d}"/>`).join('');
  const marks = [[214, 143], [104, 103], [214, 270]].map(([x, y]) => `<g class="ba__x"><circle cx="${x}" cy="${y}" r="10"/><path d="M${x - 4} ${y - 4}l8 8M${x + 4} ${y - 4}l-8 8"/></g>`).join('');
  const boxes = nodes.map((n, i) => pill(n, at[i][0], at[i][1], BA_W[i], 'ba__node--grey')).join('');
  return `<svg class="ba__svg" viewBox="0 0 440 300" aria-hidden="true" focusable="false">${lines}${boxes}${marks}</svg>`;
}
function orderSvg(nodes) {
  const at = [[16, 70], [146, 70], [312, 70], [312, 196], [146, 196]];
  const lines = ['M120 87H146', 'M286 87H312', 'M358 104V196', 'M312 213H222'].map((d) => `<path class="ba__link ba__link--ok" d="${d}"/>`).join('');
  const boxes = nodes.map((n, i) => pill(n, at[i][0], at[i][1], BA_W[i], `ba__node--${i + 1}`)).join('');
  const checks = [[133, 87], [299, 87], [358, 150], [267, 213]].map(([x, y]) => `<g class="ba__ok"><circle cx="${x}" cy="${y}" r="9"/><path d="M${x - 4} ${y}l2.6 2.6 5-5.2"/></g>`).join('');
  return `<svg class="ba__svg" viewBox="0 0 440 300" aria-hidden="true" focusable="false">${lines}${boxes}${checks}</svg>`;
}

export function beforeAfter(t) {
  const s = t.problems.slider;
  return `<figure class="ba">
<div class="ba__stage">
<div class="ba__side ba__side--before"><span class="label label--pink ba__tag--before">${esc(s.before)}</span>${chaosSvg(s.nodes)}</div>
<div class="ba__side ba__side--after"><span class="label label--pist ba__tag--after">${esc(s.after)}</span>${orderSvg(s.nodes)}</div>
<span class="ba__divider" aria-hidden="true"></span>
</div>
<label class="ba__control"><span>${esc(s.label)}</span><input class="ba__range" type="range" min="0" max="100" step="1" value="50" aria-valuetext="${esc(fill(s.valuetext, { v: 50 }))}" data-valuetext="${esc(s.valuetext)}"></label>
<figcaption class="sr-only">${esc(s.alt)}</figcaption>
</figure>`;
}

// KI im Kundenservice: an upset mail becomes a draft (marks, chips, then the reply in three tones).
// The HTML is the finished state; demos.js plays it once in view and turns the tones into tabs.
export function kiDemo(t) {
  const k = t.ki;
  let text = esc(k.mail);
  k.marks.forEach((m, i) => { text = text.replace(esc(m), `<mark class="hl hl--${i + 1}">${esc(m)}</mark>`); });
  const chips = k.chips.map((c, i) => `<li class="label label--${['blue', 'pink', 'lav', 'peach'][i]}">${esc(c)}</li>`).join('');
  const tones = k.tones.map(([name, reply]) => `<div class="tone__panel"><p class="tone__label">${esc(name)}</p><p class="tone__text">${esc(reply)}</p></div>`).join('\n');
  return `<li class="tariff__ki">
<section class="kidemo" aria-labelledby="kidemo-title">
<div class="kidemo__head"><h3 class="kidemo__title" id="kidemo-title">${accent(k.h3)}</h3><span class="label">${esc(t.ui.example)}</span></div>
<div class="kidemo__grid">
<div class="kidemo__mail">
<p class="kidemo__from">${esc(k.from)}</p>
<p class="kidemo__text">${text}</p>
<ul class="chips" role="list">${chips}</ul>
</div>
<div class="kidemo__draft">
<p class="kidemo__pill" aria-hidden="true"><span class="sparkle"></span>${esc(k.pill)}</p>
<div class="tone" data-label="${esc(k.toneLabel)}">
${tones}
</div>
<div class="kidemo__actions"><button class="btn btn--primary btn--sm kidemo__approve" type="button" data-done="${esc(k.approved)}">${esc(k.buttons[0])}</button><button class="btn btn--ghost btn--sm kidemo__edit" type="button" data-done="${esc(k.done)}" data-label="${esc(k.editLabel)}">${esc(k.buttons[1])}</button></div>
<p class="kidemo__sent" role="status" hidden>${esc(k.sent)}</p>
<p class="kidemo__note small">${esc(k.note)}</p>
</div>
</div>
<p class="kidemo__caption">${esc(k.caption)}</p>
<button class="kidemo__replay" type="button" hidden>${esc(k.replay)}</button>
</section>
</li>`;
}

// 6 Minuten gegen 1 Minute: the same reply runs along a line at two speeds (example values).
export function speed(t) {
  const s = t.ki.speed;
  const reply = esc(t.ki.tones[0][1]);
  const card = (cls, title) => `<div class="speed__card speed__card--${cls}">
<p class="speed__title">${esc(title)}</p>
<p class="speed__text" aria-hidden="true">${reply}</p>
<span class="speed__bar" aria-hidden="true"><span></span></span>
</div>`;
  return `<div class="speed">
<span class="label">${esc(s.label)}</span>
${card('slow', s.slow)}
${card('fast', s.fast)}
${loopButton(t)}
</div>`;
}

// «Welches Paket passt?»: a static list without JS; three button questions with JS (finder.js maps).
export function finder(t) {
  const f = t.finder;
  const names = Object.fromEntries(t.pricing.groups.flatMap((g) => g.items).map((it) => [it.id, it.name]));
  const list = f.static.map(([text, id]) => `<li><a href="#pkg-${id}">${esc(text)}: <strong>${esc(names[id])}</strong></a></li>`).join('\n');
  const questions = f.questions
    .map(([q, opts], i) => `<fieldset class="finder__q" data-q="${i + 1}"><legend>${esc(q)}</legend><div class="finder__opts">${opts
      .map(([value, label]) => `<button class="finder__opt" type="button" data-value="${value}" aria-pressed="false">${esc(label)}</button>`)
      .join('')}</div></fieldset>`)
    .join('\n');
  const data = { result: f.result, link: f.link, restart: f.restart, soon: f.closing.soon, later: f.closing.later, names };
  return `<section class="section finder bg-lav edge" id="finder" aria-labelledby="finder-title">
<div class="wrap">
<div class="finder__card">
<h2 id="finder-title">${accent(f.h2)}</h2>
<ul class="finder__static" role="list">
${list}
</ul>
<div class="finder__app" hidden>
${questions}
<div class="finder__result" aria-live="polite" data-text="${esc(JSON.stringify(data))}"></div>
</div>
</div>
</div>
</section>`;
}
