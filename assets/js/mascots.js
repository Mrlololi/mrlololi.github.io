// Mascots Logik, Lösung, Live (Identity 21.10.2026, drawings v2 28.10.2026). Without this file they
// stand still in their pose. A click makes one jump; in the hero each hops when the flow line
// lights its node (every round of the line). Stage 6d: the idles are back (bob, blink, eyes that
// follow the pointer), running while the hero loops and stopping with its pause button
// («hero:motion»). The footer three wave when the footer comes into view. Reduced motion: nothing
// moves, a click only shows the happy face for a moment.
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

const mark = (svgs, on) => svgs.forEach((x) => { x.dataset.moving = String(on); });

// A blink every 4-6 s (random) while running; only open eyes blink.
function blinker(gsap, svg) {
  let call = null;
  const blink = () => {
    const eyes = svg.querySelectorAll('.m-eye');
    if (eyes.length) gsap.to(eyes, { scaleY: 0.1, transformOrigin: '50% 50%', duration: 0.07, yoyo: true, repeat: 1, ease: 'power1.in' });
    call = gsap.delayedCall(gsap.utils.random(4, 6), blink);
  };
  return {
    start: () => { call?.kill(); call = gsap.delayedCall(gsap.utils.random(1.5, 4), blink); },
    stop: () => { call?.kill(); call = null; },
  };
}

function heroMotion(gsap, svgs) {
  const visual = document.querySelector('.hero__visual');
  const bobs = svgs.map((svg, i) => {
    const rig = svg.querySelector('[data-part="rig"]');
    const shadow = svg.querySelector('[data-part="shadow"]');
    const ease = 'sine.inOut';
    const tl = gsap.timeline({ repeat: -1, paused: true })
      .to(rig, { y: -4, scaleX: 0.98, scaleY: 1.03, svgOrigin: '50 107', duration: 0.9, ease })
      .to(shadow, { scaleX: 0.85, opacity: 0.08, svgOrigin: '50 110', duration: 0.9, ease }, 0)
      .to(rig, { y: 0, scaleX: 1.04, scaleY: 0.96, svgOrigin: '50 107', duration: 0.8, ease })
      .to(shadow, { scaleX: 1, opacity: 0.13, svgOrigin: '50 110', duration: 0.8, ease }, '<')
      .to(rig, { scaleX: 1, scaleY: 1, svgOrigin: '50 107', duration: 0.35, ease: 'sine.out' });
    tl.progress(i / svgs.length); // not in step with each other
    return tl;
  });
  const blinks = svgs.map((svg) => blinker(gsap, svg));
  // Desktop with a mouse: the eyes look a little towards the pointer.
  const follow = matchMedia('(hover: hover) and (pointer: fine) and (min-width: 800px)').matches
    && svgs.map((svg) => {
      const eyes = svg.querySelector('[data-part="eyes"]');
      return { svg, x: gsap.quickTo(eyes, 'x', { duration: 0.5, ease: 'power3' }), y: gsap.quickTo(eyes, 'y', { duration: 0.5, ease: 'power3' }) };
    });
  let running = false;
  const onMove = (e) => {
    for (const f of follow) {
      const r = f.svg.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height * 0.45);
      const d = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, d / 240);
      f.x((dx / d) * 2.6 * k);
      f.y((dy / d) * 2 * k);
    }
  };
  const set = (on) => {
    if (on === running) return;
    running = on;
    bobs.forEach((tl) => (on ? tl.play() : tl.pause()));
    blinks.forEach((b) => (on ? b.start() : b.stop()));
    if (follow) {
      if (on) addEventListener('pointermove', onMove, { passive: true });
      else { removeEventListener('pointermove', onMove); follow.forEach((f) => { f.x(0); f.y(0); }); }
    }
    mark(svgs, on);
  };
  set(visual?.dataset.motion === 'on');
  document.addEventListener('hero:motion', (e) => set(e.detail));
}

// After GSAP has loaded (main.js).
export function startMascotMotion(gsap) {
  if (reduceMotion.matches || !gsap) return;
  const hero = [...document.querySelectorAll('.mascot-spot .mascot')];
  if (hero.length) heroMotion(gsap, hero);
}
