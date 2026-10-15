import { esc } from './util.mjs';

// Status node: a broken layer (amber "!" or red "x") over a fixed layer (green check).
// Default CSS shows the fixed layer (static end state); main.js breaks it first, then repairs.
export function nodeSvg(severity) {
  const glyph =
    severity === 'error'
      ? '<path class="node__glyph node__glyph--light" d="M14.5 14.5l11 11M25.5 14.5l-11 11"/>'
      : '<path class="node__glyph" d="M20 11.5v10"/><circle class="node__dot" cx="20" cy="27.5" r="2"/>';
  return `<svg class="node__svg" viewBox="0 0 40 40" aria-hidden="true" focusable="false"><g class="node__broken"><circle class="node__ring node__ring--${severity}" cx="20" cy="20" r="18"/>${glyph}</g><g class="node__fixed"><circle class="node__ring node__ring--run" cx="20" cy="20" r="18"/><path class="node__glyph node__glyph--light" d="M12.5 20.5l5 5 10-11"/></g></svg>`;
}

export function problems(t) {
  const flow = t.problems.items
    .map(
      (item, i) => `<span class="flow__seg"><span class="flow__gap" data-i="${i}"></span></span>
<span class="flow__node node node--${item.severity}" data-i="${i}">${nodeSvg(item.severity)}</span>`
    )
    .join('\n');

  const pairs = t.problems.items
    .map(
      (item, i) => `<li class="pair" data-i="${i}">
<span class="pair__node node node--${item.severity}" aria-hidden="true">${nodeSvg(item.severity)}</span>
<h3 class="pair__problem"><span class="sr-only">${esc(t.ui.problem)} </span>${esc(item.problem)}</h3>
<p class="pair__fix"><span class="sr-only">${esc(t.ui.fix)} </span>${esc(item.fix)}</p>
</li>`
    )
    .join('\n');

  return `<section class="section problems" id="problems" aria-labelledby="problems-title">
<div class="wrap">
<div class="section__head">
<h2 id="problems-title">${esc(t.problems.h2)}</h2>
<p class="lead">${esc(t.problems.intro)}</p>
</div>
<div class="problems__grid">
<div class="flow" aria-hidden="true">
<span class="flow__end"></span>
${flow}
<span class="flow__seg flow__seg--last"></span>
<span class="flow__end"></span>
</div>
<ul class="pairs" role="list">
${pairs}
</ul>
</div>
</div>
</section>`;
}
