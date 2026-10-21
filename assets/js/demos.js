// Stage 2 demos. Every demo starts from its final state in the HTML; these functions only
// add motion or interaction on top. Loops go through loops.js (pause button, off-screen stop).
import { loop } from './loops.js';

/* ---------- Hero ribbon: SMIL text along two curves ---------- */
export function initRibbon() {
  const svgs = [...document.querySelectorAll('.ribbon')];
  if (!svgs.length) return;
  // Each text holds the steps three times; moving it by one third loops seamlessly.
  const anims = svgs.map((svg, i) => {
    const third = svg.querySelector('text').getComputedTextLength() / 3;
    const a = svg.querySelector('animate');
    a.setAttribute('from', i ? String(-third) : '0');
    a.setAttribute('to', i ? '0' : String(-third));
    return a;
  });
  let begun = false;
  loop({
    root: document.querySelector('.hero__visual'),
    button: document.querySelector('.hero .loop-btn'),
    play: () => {
      if (!begun) { begun = true; anims.forEach((a) => a.beginElement()); }
      svgs.forEach((svg) => svg.unpauseAnimations());
    },
    pause: () => svgs.forEach((svg) => svg.pauseAnimations()),
  });
}

/* ---------- Tool marquee: CSS loop, hover pauses in CSS ---------- */
export function initMarquee() {
  const marquee = document.querySelector('.marquee');
  if (!marquee) return;
  loop({
    root: marquee,
    button: marquee.parentElement.querySelector('.loop-btn'),
    play: () => marquee.classList.add('is-running'),
    pause: () => marquee.classList.remove('is-running'),
  });
}
