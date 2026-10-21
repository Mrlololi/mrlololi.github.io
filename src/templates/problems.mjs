import { esc, accent } from './util.mjs';
import { beforeAfter } from './demos.mjs';

// Each card names the problem; its «Lösung» panel sits below it. With motion, main.js
// holds the panel under the card's edge and slides it up once the card is in view.
export function problems(t) {
  const names = Object.fromEntries(t.pricing.groups.flatMap((g) => g.items).map((it) => [it.id, it.name]));
  const cards = t.problems.items
    .map(
      (item) => `<li class="pc">
<div class="pc__problem"><span class="label label--pink">${esc(t.ui.problem)}</span>
<h3 class="pc__title">${esc(item.problem)}</h3></div>
<div class="pc__fix"><span class="label label--pist">${esc(t.ui.fix)}</span>
<p>${esc(item.fix)}</p>
<a class="pc__link" href="#pkg-${item.pkg}">${esc(t.ui.matching)} ${esc(names[item.pkg])}</a></div>
</li>`
    )
    .join('\n');

  return `<section class="section problems bg-blue edge" id="problems" aria-labelledby="problems-title">
<div class="wrap">
<div class="section__head">
<h2 id="problems-title">${accent(t.problems.h2)}</h2>
<p class="lead">${esc(t.problems.intro)}</p>
</div>
${beforeAfter(t)}
<ul class="pcs" role="list">
${cards}
</ul>
</div>
</section>`;
}
