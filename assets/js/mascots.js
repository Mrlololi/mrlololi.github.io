// Mascots Logik, Lösung, Live (Identity 21.10.2026, drawings v2 28.10.2026). Without this file they
// stand still in their pose. A click makes one jump; in the hero each hops when the flow line
// lights its node (every round of the line). Stage 6d: the idles are back (bob, blink, eyes that
// follow the pointer), running while the hero loops and stopping with its pause button
// («hero:motion»). The footer three wave when the footer comes into view. Reduced motion: nothing
// moves, a click only shows the happy face for a moment.
// Stage 7a (11.11.2026): the reactions, the bubbles and the group buttons live in the mascot kit
// (assets/js/kit/mascot-react.js, shared with Webprojekte); this file adds the hero, the footer wave
// and the idles on top of it.
import { setPose, jump, react, initPoke } from './kit/mascot-react.js';
import { reduceMotion, motion } from './kit/motion.js';

export { setPose };

// The moments the hero line lights each node (ms after the line starts, as in the CSS).
const LIT = { 1: 300, 2: 1400, 3: 2500, 4: 3600 };

export function initMascots() {
  const spots = [...document.querySelectorAll('.mascot-spot')];
  for (const b of spots) {
    const svg = b.querySelector('.mascot');
    b.querySelector('.mascot-btn').addEventListener('click', () => { react(svg, 30); });
    // Choosing a flow node also greets it.
    document.querySelector(`.hf__btn--${b.dataset.node}`)?.addEventListener('click', () => jump(svg, 18));
  }
  const flow = document.querySelector('.hero__flow');
  if (flow && spots.length && !reduceMotion.matches && !motion.paused) {
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
  initPoke({ lines: say, groups: GROUPS });
  // The reading Logik in the FAQ chat answers a click too, without a tab stop in the middle of the chat.
  document.addEventListener('click', (e) => {
    const reader = e.target.closest?.('svg.faq__logik');
    if (reader) { react(reader, 18); }
  });
}

/* ---------- Stage 6g: every mascot reacts (Iva's wish) ---------- */
// Each group of mascots (a scene, the footer three, the 404 picture) becomes one button: one tab stop,
// a name («Logik, Lösung und Live winken»), a visible focus ring, at least 44 px. A click or Enter /
// Space: a hop (only the happy face under reduced motion) and a small bubble with one short line;
// the line is also told to screen readers (polite). The reading Logik in the FAQ chat answers a click
// too, without a tab stop in the middle of the chat. Groups added later (thank-you panels, the chat)
// are prepared when they appear.
const GROUPS = '.mscene, .footer-mascots, .nf__scene';
// Stage 7a: the footer three are on every page now (data-say="footer"), Logik on the legal pages.
const say = (() => { try { return JSON.parse(document.getElementById('mascot-say')?.textContent || 'null'); } catch { return null; } })();
// Footer: each time it comes into view all three wave three times (about 2 s), then rest.
function footer() {
  const box = document.querySelector('.footer-mascots');
  if (!box || reduceMotion.matches || !('IntersectionObserver' in window)) return;
  let seen = false;
  new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) { seen = false; return; }
    if (seen || document.hidden || motion.paused) return;
    seen = true;
    // Asked again each time: a click swaps the arms (pose), so older ones are gone.
    const arms = [...box.querySelectorAll('svg:not([data-jumping]) .m-wave')];
    for (const arm of arms) {
      arm.style.transformBox = 'view-box';
      arm.style.transformOrigin = arm.dataset.origin.split(' ').map((v) => `${v}px`).join(' ');
    }
    arms.forEach((arm, i) => arm.animate?.([{ transform: 'rotate(0)' }, { transform: 'rotate(-22deg)' }, { transform: 'rotate(0)' }], { duration: 600, iterations: 3, delay: i * 150, easing: 'ease-in-out' }));
  }, { threshold: 0.6 }).observe(box);
}

const mark = (svgs, on) => svgs.forEach((x) => { x.dataset.moving = String(on); });

// A blink every 4-6 s (random) while running; only open eyes blink.
function blinker(gsap, svg) {
  let call = null;
  const blink = () => {
    const eyes = svg.querySelectorAll('.m-eye');
    // Rule 7 (18.11.2026): no movement shorter than 200 ms, so a blink takes 2 x 110 ms, eased both ways.
    if (eyes.length) gsap.to(eyes, { scaleY: 0.1, transformOrigin: '50% 50%', duration: 0.11, yoyo: true, repeat: 1, ease: 'sine.inOut' });
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
  if (reduceMotion.matches || motion.paused || !gsap) return;
  const hero = [...document.querySelectorAll('.mascot-spot .mascot')];
  if (hero.length) heroMotion(gsap, hero);
}
