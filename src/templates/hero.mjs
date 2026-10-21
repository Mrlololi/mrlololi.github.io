import { esc, seconds, accent, headline } from './util.mjs';

// One status node of the run log: idle (grey), wait (amber), done (green) + check.
// Default CSS shows the finished state; main.js rewinds it when the log comes into view.
const runNode = `<span class="run__node" aria-hidden="true"><svg viewBox="0 0 20 20" focusable="false"><circle class="run__idle" cx="10" cy="10" r="9"/><circle class="run__wait" cx="10" cy="10" r="9"/><circle class="run__done" cx="10" cy="10" r="9"/><path class="run__check" pathLength="1" d="M5.6 10.3l2.9 2.9 5.9-6.4"/></svg></span>`;
const runLink = `<svg class="run__link" aria-hidden="true" focusable="false" viewBox="0 0 2 10" preserveAspectRatio="none"><path pathLength="1" d="M1 0V10"/></svg>`;

// Hero diagram: four nodes on a zigzag, three wires. CSS plays it once (pulses travel the
// wires, nodes light up with a check); the static state is all nodes lit.
const NODES = [[8, 22], [176, 112], [8, 200], [176, 288]];
const WIRES = ['M86 62C86 100 254 82 254 112', 'M254 152C254 190 86 170 86 200', 'M86 240C86 278 254 258 254 288'];
function flowSvg(nodes) {
  const wires = WIRES.map((d) => `<path class="hf__wire" d="${d}"/>`).join('');
  const pulses = WIRES.map((d, i) => `<path class="hf__pulse hf__pulse--${i + 1}" pathLength="100" d="${d}"/>`).join('');
  const boxes = nodes
    .map((label, i) => {
      const [x, y] = NODES[i];
      return `<g class="hf__node hf__node--${i + 1}"><rect x="${x}" y="${y}" width="156" height="40" rx="14"/><text x="${x + 14}" y="${y + 25}">${esc(label)}</text><g class="hf__check"><circle cx="${x + 138}" cy="${y + 20}" r="9"/><path d="M${x + 134} ${y + 20.5}l2.8 2.8 5.2-5.6"/></g></g>`;
    })
    .join('');
  return `<svg class="hf" viewBox="0 0 340 340" aria-hidden="true" focusable="false">${wires}${pulses}${boxes}</svg>`;
}

export function hero(t) {
  return `<section class="hero" aria-labelledby="hero-title">
<div class="wrap hero__grid">
<div class="hero__text">
<h1 id="hero-title">${headline(t.hero.h1)}</h1>
<p class="hero__lead lead">${esc(t.hero.lead)}</p>
<div class="hero__ctas">
<a class="btn btn--primary" href="#contact">${esc(t.hero.primary)}</a>
<a class="text-link" href="#pricing">${esc(t.hero.secondary)}</a>
</div>
<p class="hero__small small">${esc(t.hero.small)}</p>
</div>
<figure class="hero__flow" aria-label="${esc(t.hero.flow.label)}">
<p class="hero__chip"><img src="/assets/img/portrait-260.webp" width="44" height="44" loading="lazy" decoding="async" alt="">${esc(t.hero.flow.chip)}</p>
${flowSvg(t.hero.flow.nodes)}
</figure>
</div>
</section>`;
}

// «Was passiert, wenn sich jemand anmeldet»: the run log as a card, played once in view.
export function signup(t) {
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

  return `<section class="section signup" id="signup" aria-labelledby="signup-title">
<div class="wrap signup__grid">
<div class="section__head">
<h2 id="signup-title">${accent(t.run.h2)}</h2>
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
