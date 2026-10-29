import { esc, fill } from './util.mjs';

// Stage 6e: the «Chaos / Geordnet» slider is back as the opener of «Wo es meistens hakt» (from
// 3a1bd91), compact: the same two drawings at about 60 % of their height (positions scaled, the
// letters not). The «after» drawing sits in a mask moved with transforms around a counter-shifted
// inner layer; the visitor drags the divider (mouse, pen, finger) or uses the range (arrow keys).
// No loop: on first entry the handle nudges once (assets/js/slider.js). Without JS: «after» only.
const K = 0.6;
const H = 180;
const BA_W = [104, 140, 92, 86, 76];
const y = (v) => Math.round(v * K);
function pill(label, x, top, w, cls) {
  return `<g class="ba__node ${cls}"><rect x="${x}" y="${top}" width="${w}" height="32" rx="12"/><text x="${x + w / 2}" y="${top + 22}" text-anchor="middle">${esc(label)}</text></g>`;
}
const links = (paths, cls) => `<g transform="scale(1 ${K})">${paths.map(([d, k]) => `<path class="ba__link${k ? ` ${k}` : ''}${cls ? ` ${cls}` : ''}" vector-effect="non-scaling-stroke" d="${d}"/>`).join('')}</g>`;
function chaosSvg(nodes) {
  const at = [[24, 34], [150, 132], [300, 26], [318, 226], [40, 236]];
  const lines = links([
    ['M128 51C260 60 250 250 318 243', ''],
    ['M346 60C320 140 120 170 78 236', 'ba__link--broken'],
    ['M220 132C230 90 300 80 330 60', ''],
    ['M76 68C90 110 120 120 160 132', 'ba__link--broken'],
    ['M318 250C250 280 160 270 116 254', 'ba__link--broken'],
    ['M290 149C380 150 400 200 380 226', ''],
  ]);
  const marks = [[214, 143], [104, 103], [214, 270]].map(([x, v]) => `<g class="ba__x"><circle cx="${x}" cy="${y(v)}" r="9"/><path d="M${x - 4} ${y(v) - 4}l8 8M${x + 4} ${y(v) - 4}l-8 8"/></g>`).join('');
  const boxes = nodes.map((n, i) => pill(n, at[i][0], y(at[i][1]), BA_W[i], 'ba__node--grey')).join('');
  return `<svg class="ba__svg" viewBox="0 0 440 ${H}" aria-hidden="true" focusable="false">${lines}${boxes}${marks}</svg>`;
}
function orderSvg(nodes) {
  const at = [[16, 70], [146, 70], [312, 70], [312, 196], [146, 196]];
  const lines = links(['M120 87H146', 'M286 87H312', 'M358 104V196', 'M312 213H222'].map((d) => [d, '']), 'ba__link--ok');
  const boxes = nodes.map((n, i) => pill(n, at[i][0], y(at[i][1]), BA_W[i], `ba__node--${i + 1}`)).join('');
  const checks = [[133, 87], [299, 87], [358, 150], [267, 213]].map(([x, v]) => `<g class="ba__ok"><circle cx="${x}" cy="${y(v)}" r="8"/><path d="M${x - 4} ${y(v)}l2.6 2.6 5-5.2"/></g>`).join('');
  return `<svg class="ba__svg" viewBox="0 0 440 ${H}" aria-hidden="true" focusable="false">${lines}${boxes}${checks}</svg>`;
}

export function beforeAfter(t) {
  const s = t.problems.slider;
  return `<figure class="ba">
<div class="ba__stage">
<div class="ba__side ba__side--before"><span class="label label--pink ba__tag--before">${esc(s.before)}</span>${chaosSvg(s.nodes)}</div>
<div class="ba__mask"><div class="ba__inner"><div class="ba__side ba__side--after"><span class="label label--pist ba__tag--after">${esc(s.after)}</span>${orderSvg(s.nodes)}</div></div></div>
<span class="ba__track" aria-hidden="true"><span class="ba__divider"></span></span>
</div>
<label class="ba__control"><span>${esc(s.label)}</span><input class="ba__range" type="range" min="0" max="100" step="1" value="50" aria-valuetext="${esc(fill(s.valuetext, { v: 50 }))}" data-valuetext="${esc(s.valuetext)}"></label>
<figcaption class="sr-only">${esc(s.alt)}</figcaption>
</figure>`;
}
