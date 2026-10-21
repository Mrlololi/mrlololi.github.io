import { esc, accent } from './util.mjs';

// Each card names the problem; its «Lösung» panel sits below it. With motion, main.js
// holds the panel under the card's edge and slides it up once the card is in view.
export function problems(t) {
  const cards = t.problems.items
    .map(
      (item) => `<li class="pc">
<div class="pc__problem"><span class="pc__tag pc__tag--problem">${esc(t.ui.problem)}</span>
<h3 class="pc__title">${esc(item.problem)}</h3></div>
<div class="pc__fix"><span class="pc__tag pc__tag--fix">${esc(t.ui.fix)}</span>
<p>${esc(item.fix)}</p></div>
</li>`
    )
    .join('\n');

  return `<section class="section problems" id="problems" aria-labelledby="problems-title">
<div class="wrap">
<div class="section__head">
<h2 id="problems-title">${accent(t.problems.h2)}</h2>
<p class="lead">${esc(t.problems.intro)}</p>
</div>
<ul class="pcs" role="list">
${cards}
</ul>
</div>
</section>`;
}
