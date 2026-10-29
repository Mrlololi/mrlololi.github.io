// Mascots Logik, Lösung, Live (Identity 21.10.2026, drawings v2 28.10.2026). Without this file they
// stand still in their pose. Stage 6, calm: no idle loops. A click makes one jump; in the hero each
// hops once when the flow line lights its node (on load and on every replay of the line); the
// footer three wave once when the footer comes into view. Reduced motion: nothing moves, a click
// only shows the happy face for a moment.
import { parts } from './mascot-art.js';
import { reduceMotion } from './loops.js';

// Swaps eyes, mouth, arms and accessory for another emotion (the body stays).
export function setPose(svg, emo) {
  if (svg.dataset.emo === emo) return;
  const p = parts(Number(svg.dataset.mascot), emo);
  for (const [name, html] of Object.entries(p)) svg.querySelector(`[data-part="${name}"]`).innerHTML = html;
  svg.dataset.emo = emo;
}

// A jump (click) or a smaller hop (node lit), happy face while in the air (Web Animations).
// A click while one is still in the air starts it again (every click answers).
const flights = new WeakMap();
function jump(svg, height = 30) {
  const prev = flights.get(svg);
  if (prev) { prev.cancel?.(); clearTimeout(prev.timer); }
  svg.dataset.jumping = 'true';
  const land = () => { flights.delete(svg); delete svg.dataset.jumping; setPose(svg, svg.dataset.base); };
  setPose(svg, 'joy');
  if (reduceMotion.matches || !svg.animate) { flights.set(svg, { timer: setTimeout(land, 1200) }); return; }
  const a = svg.animate([
    { transform: 'translateY(0) scale(1.1, 0.9)', easing: 'ease-out' },
    { transform: `translateY(-${height}%) scale(0.94, 1.06)`, offset: 0.45, easing: 'ease-in' },
    { transform: 'translateY(0) scale(1.08, 0.92)', offset: 0.82, easing: 'ease-out' },
    { transform: 'none' },
  ], { duration: 650 });
  a.onfinish = land;
  flights.set(svg, a);
}

// The moments the hero line lights each node (ms after the line starts, as in the CSS).
const LIT = { 1: 300, 2: 1400, 3: 2500, 4: 3600 };

export function initMascots() {
  const spots = [...document.querySelectorAll('.mascot-spot')];
  for (const b of spots) {
    const svg = b.querySelector('.mascot');
    b.querySelector('.mascot-btn').addEventListener('click', () => jump(svg));
    // Choosing a flow node also greets it.
    document.querySelector(`.hf__btn--${b.dataset.node}`)?.addEventListener('click', () => jump(svg, 18));
  }
  const flow = document.querySelector('.hero__flow');
  if (flow && spots.length && !reduceMotion.matches) {
    let timers = [];
    const hops = (since = 0) => {
      timers.forEach(clearTimeout);
      timers = spots.map((b) => setTimeout(() => jump(b.querySelector('.mascot'), 16), Math.max(0, LIT[b.dataset.node] + 350 - since)));
    };
    // The line already plays from CSS on load: join it where it is now.
    if (performance.now() < LIT[4] + 300) hops(performance.now());
    flow.addEventListener('demo:run', () => hops(0));
  }
  footer();
}

// Footer: each time it comes into view all three wave three times (about 2 s), then rest.
function footer() {
  const box = document.querySelector('.footer-mascots');
  if (!box || reduceMotion.matches || !('IntersectionObserver' in window)) return;
  const arms = [...box.querySelectorAll('.m-wave')];
  for (const arm of arms) {
    arm.style.transformBox = 'view-box';
    arm.style.transformOrigin = arm.dataset.origin.split(' ').map((v) => `${v}px`).join(' ');
  }
  let seen = false;
  new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) { seen = false; return; }
    if (seen || document.hidden) return;
    seen = true;
    arms.forEach((arm, i) => arm.animate?.([{ transform: 'rotate(0)' }, { transform: 'rotate(-22deg)' }, { transform: 'rotate(0)' }], { duration: 600, iterations: 3, delay: i * 150, easing: 'ease-in-out' }));
  }, { threshold: 0.6 }).observe(box);
}
