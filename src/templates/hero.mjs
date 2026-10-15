import { esc, seconds, keepHyphenated } from './util.mjs';

// One status node of the run log: idle (grey), wait (amber), done (green) + check.
// Default CSS shows the finished state; main.js rewinds it for the load animation.
const runNode = `<span class="run__node" aria-hidden="true"><svg viewBox="0 0 20 20" focusable="false"><circle class="run__idle" cx="10" cy="10" r="9"/><circle class="run__wait" cx="10" cy="10" r="9"/><circle class="run__done" cx="10" cy="10" r="9"/><path class="run__check" pathLength="1" d="M5.6 10.3l2.9 2.9 5.9-6.4"/></svg></span>`;
const runLink = `<svg class="run__link" aria-hidden="true" focusable="false" viewBox="0 0 2 10" preserveAspectRatio="none"><path pathLength="1" d="M1 0V10"/></svg>`;

export function hero(t) {
  const steps = t.run.steps
    .map(
      (s, i) => `<li class="run__step" data-seconds="${s.seconds}">
${runNode}
<span class="run__text">${esc(s.text)}</span>
<span class="run__time">${seconds(s.seconds, t.locale)}</span>
${i < t.run.steps.length - 1 ? runLink : ''}
</li>`
    )
    .join('\n');

  return `<section class="hero" aria-labelledby="hero-title">
<div class="wrap hero__grid">
<div class="hero__text">
<h1 id="hero-title">${keepHyphenated(t.hero.h1)}</h1>
<p class="hero__lead lead">${esc(t.hero.lead)}</p>
<div class="hero__ctas">
<a class="btn btn--primary" href="#contact">${esc(t.hero.primary)}</a>
<a class="text-link" href="#pricing">${esc(t.hero.secondary)}</a>
</div>
<p class="hero__small small">${esc(t.hero.small)}</p>
</div>
<figure class="run instrument" aria-labelledby="run-title">
<figcaption class="run__bar"><span class="run__title" id="run-title">${esc(t.run.title)}</span></figcaption>
<ol class="run__steps" role="list">
${steps}
</ol>
<div class="run__foot">
<p class="run__summary">${esc(t.run.summary)}</p>
<button class="run__replay" type="button" hidden>${esc(t.run.replay)}</button>
</div>
<p class="sr-only" id="run-status" role="status" aria-live="polite"></p>
</figure>
</div>
</section>`;
}
