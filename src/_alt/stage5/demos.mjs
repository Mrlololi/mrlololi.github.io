import { esc, accent, fill } from './util.mjs';
import { loopButton } from './hero.mjs';
import { mascotScene } from './mascots.mjs';

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

// Before/after for «Wo es meistens hakt». Both drawings share one 440 x 300 canvas.
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

// Stage 4: the «after» drawing sits in a mask (moved with xPercent) around a counter-shifted inner
// layer, so the wipe is transforms only. Wide screens: it covers from the left as the divider moves
// right (pinned and scrubbed with motion, dragged or set with the range). Phones and no JS: stacked.
export function beforeAfter(t) {
  const s = t.problems.slider;
  return `<figure class="ba" data-pin>
<div class="ba__stage">
<div class="ba__side ba__side--before"><span class="label label--pink ba__tag--before">${esc(s.before)}</span>${chaosSvg(s.nodes)}</div>
<div class="ba__mask"><div class="ba__inner"><div class="ba__side ba__side--after"><span class="label label--pist ba__tag--after">${esc(s.after)}</span>${orderSvg(s.nodes)}</div></div></div>
<span class="ba__track" aria-hidden="true"><span class="ba__divider"></span></span>
</div>
<label class="ba__control"><span>${esc(s.label)}</span><input class="ba__range" type="range" min="0" max="100" step="1" value="50" aria-valuetext="${esc(fill(s.valuetext, { v: 50 }))}" data-valuetext="${esc(s.valuetext)}"></label>
<figcaption class="sr-only">${esc(s.alt)}</figcaption>
</figure>`;
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

// «Welches Paket passt?» (Stage 4): a static link list without JS; with JS a pre-programmed chat
// (assets/js/chat.js): three questions with typing dots, chip answers, the last bubble grows into
// the package card. Lösung is the small avatar in the header. Honest label: no real AI, nothing sent.
export function finder(t, config) {
  const f = t.finder;
  const c = t.s4.finder;
  const items = t.pricing.groups.flatMap((g) => g.items);
  const names = Object.fromEntries(items.map((it) => [it.id, it.name]));
  const prices = Object.fromEntries(items.map((it) => [it.id, it.price]));
  const list = f.static.map(([text, id]) => `<li><a href="#pkg-${id}">${esc(text)}: <strong>${esc(names[id])}</strong></a></li>`).join('\n');
  const data = {
    hello: c.hello, progress: c.progress, typing: c.typing, questions: f.questions, names, prices, lines: c.lines,
    link: f.link, ask: c.ask, restart: f.restart, soon: f.closing.soon, later: f.closing.later,
    mail: config.contact_email, subject: t.pricing.subjectPrefix,
  };
  return `<section class="section finder bg-lav edge" id="finder" aria-labelledby="finder-title">
<div class="wrap">
<div class="finder__card">
<h2 id="finder-title" data-enter="lines">${accent(f.h2)}</h2>
<ul class="finder__static" role="list">
${list}
</ul>
<div class="chat" hidden data-text="${esc(JSON.stringify(data))}">
<div class="chat__head">${mascotScene('avatar', [[1, 'idle']])}<div><p class="chat__name">${esc(c.title)}<span class="chat__demo"> · ${esc(c.demo)}</span></p><p class="chat__note">${esc(c.note)}</p></div><p class="chat__progress" aria-live="polite"></p></div>
<div class="chat__log" role="log"></div>
<div class="chat__chips" role="group"></div>
</div>
</div>
</div>
</section>`;
}

