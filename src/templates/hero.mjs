import { esc, headline } from './util.mjs';
import { heroMascots } from './mascots.mjs';

// Stage 6: one button style for every demo (Nochmal ansehen / Watch again), bottom right, at least
// 44 x 44 px, icon plus text. Hidden without JS; assets/js/loops.js shows it in the end state.
export const replayButton = (t, cls = '') => `<button class="replay btn btn--secondary btn--sm${cls ? ` ${cls}` : ''}" type="button" hidden><svg class="replay__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4 4.5v4h4"/></svg><span>${esc(t.s6.replay)}</span></button>`;

// Hero diagram: four nodes on a zigzag, three wires. The HTML/CSS shows every node lit (the end
// frame); with JS the line plays once from unlit to lit, again on re-entry (loops.js, at most twice).
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

// Stage 6: eyebrow, H1, one sentence, one primary button with its micro line right under it, then
// prices as a text link (Stage 6b), and one trust line. The tool row under the hero is static (no marquee, WCAG 2.2.2).
export function hero(t) {
  const h = t.hero;
  return `<section class="hero bg-hero" aria-labelledby="hero-title">
<span class="hero__blob hero__blob--1" aria-hidden="true"></span><span class="hero__blob hero__blob--2" aria-hidden="true"></span>
<div class="wrap hero__grid">
<div class="hero__text">
<p class="hero__eyebrow">${esc(h.eyebrow)}</p>
<h1 id="hero-title">${headline(h.h1)}</h1>
<p class="hero__lead lead">${esc(h.lead)}</p>
<div class="hero__ctas">
<a class="btn btn--primary" href="#contact">${esc(h.primary)}</a>
<p class="hero__micro small">${esc(h.micro)}</p>
<a class="text-link" href="#pricing">${esc(h.secondary)}</a>
</div>
<p class="hero__proof">${esc(h.trust)}</p>
</div>
<div class="hero__visual">
<figure class="hero__flow demo" data-demo="hero" aria-label="${esc(h.flow.label)}">
<a class="hero__chip" href="#about"><picture><source type="image/avif" srcset="/assets/img/avatar-44.avif 1x, /assets/img/avatar-88.avif 2x"><source type="image/webp" srcset="/assets/img/avatar-44.webp 1x, /assets/img/avatar-88.webp 2x"><img src="/assets/img/avatar-44.jpg" srcset="/assets/img/avatar-88.jpg 2x" width="44" height="44" loading="lazy" decoding="async" alt=""></picture>${esc(h.flow.chip)}</a>
<div class="hf-wrap">
${flowSvg(h.flow.nodes)}
${h.flow.nodes.map((n, i) => {
  const btn = `<button class="hf__btn hf__btn--${i + 1}" type="button" aria-expanded="false" aria-controls="hf-line-${i + 1}">${esc(n)}</button>`;
  // Each mascot button next to its node in Tab order; Live stands left of and above «Kurs offen», so it comes first.
  return i === 3 ? heroMascots(t, 4) + btn : btn + heroMascots(t, i + 1);
}).join('')}
</div>
<ul class="hf__lines" role="list">${h.flow.lines.map((l, i) => `<li id="hf-line-${i + 1}">${esc(l)}</li>`).join('')}</ul>
${replayButton(t)}
</figure>
</div>
</div>
</section>`;
}

// «Ich arbeite mit»: one static row of text pills (no logos, no marquee).
export function tools(t) {
  return `<section class="tools bg-peach edge" aria-labelledby="tools-title">
<div class="wrap tools__in">
<p class="tools__label" id="tools-title">${esc(t.tools.label)}</p>
<ul class="tools__list" role="list">${t.tools.items.map((name) => `<li>${esc(name)}</li>`).join('')}</ul>
</div>
</section>`;
}
