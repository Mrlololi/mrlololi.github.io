import { esc } from './util.mjs';
import { loopButton } from './hero.mjs';

// «Ich arbeite mit»: text pills (no logos). The second list is the marquee's seamless copy.
export function tools(t) {
  const pills = t.tools.items.map((name) => `<li>${esc(name)}</li>`).join('');
  return `<section class="tools" aria-labelledby="tools-title">
<div class="wrap tools__in">
<p class="tools__label" id="tools-title">${esc(t.tools.label)}</p>
<div class="marquee">
<div class="marquee__track">
<ul class="marquee__list" role="list">${pills}</ul>
<ul class="marquee__list" role="list" aria-hidden="true">${pills}</ul>
</div>
</div>
${loopButton(t)}
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
<div class="ba__side ba__side--before"><span class="ba__tag ba__tag--before">${esc(s.before)}</span>${chaosSvg(s.nodes)}</div>
<div class="ba__side ba__side--after"><span class="ba__tag ba__tag--after">${esc(s.after)}</span>${orderSvg(s.nodes)}</div>
<span class="ba__divider" aria-hidden="true"></span>
</div>
<label class="ba__control"><span>${esc(s.label)}</span><input class="ba__range" type="range" min="0" max="100" step="1" value="50"></label>
<figcaption class="sr-only">${esc(s.alt)}</figcaption>
</figure>`;
}
