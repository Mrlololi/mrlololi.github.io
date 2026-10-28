// Mascots Logik, Lösung, Live (Identity 21.10.2026, drawings v2 28.10.2026). Without this file they stand still in their
// pose. initMascots (no GSAP): a click makes one jump, and in the hero each hops when the pulse
// lights its flow node. startMascotMotion (after GSAP has loaded): idle bob with a little squash
// and stretch, a blink every 4-6 s, eyes that follow the pointer on desktop, waving in the footer.
// Loops run only on screen (hero: the same switch as the ribbon, including its pause button).
// Reduced motion: nothing moves; a click only shows the happy face for a moment.
import { parts } from './mascot-art.js';
import { loop } from './loops.js';

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

// Swaps eyes, mouth, arms and accessory for another emotion (the body stays).
export function setPose(svg, emo) {
  if (svg.dataset.emo === emo) return;
  const p = parts(Number(svg.dataset.mascot), emo);
  for (const [name, html] of Object.entries(p)) svg.querySelector(`[data-part="${name}"]`).innerHTML = html;
  svg.dataset.emo = emo;
}

// A jump (click) or a smaller hop (node lit), happy face while in the air. Web Animations on the
// <svg> box, so it is there before GSAP and never fights GSAP's bob on the inner rig.
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

export function initMascots() {
  for (const b of document.querySelectorAll('.mascot-spot')) {
    const svg = b.querySelector('.mascot');
    b.querySelector('.mascot-btn').addEventListener('click', () => jump(svg));
    // Choosing a flow node also greets it.
    document.querySelector(`.hf__btn--${b.dataset.node}`)?.addEventListener('click', () => jump(svg, 18));
  }
  heroRun();
}

// Stage 4, hero: on wide screens with motion the three hop together along the flow wires with the
// pulse, from «Formular» to «Kurs offen» (a little conga line), land there happy and walk back to
// their own nodes: about 5 s, synced to the CSS flow. Once per visit; again each time the hero
// comes back into view after it was left. Phones: they just stand at their nodes.
const SPOT = { w: 58, h: 58 * 124 / 120, fx: 58 * 58 / 120, fy: (58 * 124 / 120) * (113 / 124) }; // units of the 340 grid
const WIRE_AT = [[600, 1450], [1700, 2550], [2800, 3650]]; // ms, as the CSS pulses
const BACK = [4150, 4800];
const TOTAL = 5200;
const LAG = 130;

function heroRun() {
  const wrap = document.querySelector('.hf-wrap');
  if (!wrap || reduceMotion.matches) return;
  const wide = matchMedia('(min-width: 768px)');
  const spots = [...wrap.querySelectorAll('.mascot-spot')];
  const wires = [...wrap.querySelectorAll('.hf__wire')];
  const flow = [...wrap.querySelectorAll('.hf__pulse, .hf__node rect, .hf__check')];
  const ref = () => wrap.querySelector('.hf__pulse')?.getAnimations?.()[0];
  let anims = [];
  let timers = [];

  // Feet positions over time for one mascot (k = its place in the line), in grid units.
  const path = (home, k) => {
    const pts = [];
    const lag = k * LAG;
    const at = (wire, f) => { const w = wires[wire]; const p = w.getPointAtLength(w.getTotalLength() * f); return [p.x, p.y]; };
    pts.push([0, home]);
    pts.push([WIRE_AT[0][0] + lag, at(0, 0)]);
    WIRE_AT.forEach(([a, b], wi) => {
      const n = 18;
      for (let i = 1; i <= n; i++) {
        const f = i / n;
        const [x, y] = at(wi, f);
        pts.push([a + lag + (b - a) * f, [x, y - 14 * Math.abs(Math.sin(Math.PI * 3 * f))]]);
      }
      // A quick hop over the node to the next wire's start.
      if (wires[wi + 1]) pts.push([WIRE_AT[wi + 1][0] + lag, at(wi + 1, 0)]);
    });
    pts.push([BACK[0] + lag, pts.at(-1)[1]]);
    pts.push([BACK[1] + lag, home]);
    pts.push([TOTAL, home]);
    return pts;
  };
  const homeOf = (spot) => {
    const r = spot.getBoundingClientRect();
    const w = wrap.getBoundingClientRect();
    const u = w.width / 340;
    return [(r.left - w.left) / u + SPOT.fx, (r.top - w.top) / u + SPOT.fy];
  };

  const stop = () => {
    anims.forEach((a) => a.cancel());
    timers.forEach(clearTimeout);
    anims = [];
    timers = [];
    spots.forEach((s) => setPose(s.querySelector('.mascot'), s.querySelector('.mascot').dataset.base));
  };
  const run = (from = 0) => {
    stop();
    // Live leads (it ends at «Kurs offen»), Lösung and Logik follow.
    const order = [2, 1, 0];
    spots.forEach((spot, i) => {
      const k = order.indexOf(i);
      const home = homeOf(spot);
      const frames = path(home, k).map(([ms, [x, y]]) => ({
        offset: ms / TOTAL,
        transform: `translate(${(((x - home[0]) / SPOT.w) * 100).toFixed(2)}%, ${(((y - home[1]) / SPOT.h) * 100).toFixed(2)}%)`,
      }));
      const a = spot.animate(frames, { duration: TOTAL, easing: 'linear' });
      a.currentTime = from;
      anims.push(a);
      const svg = spot.querySelector('.mascot');
      const later = (ms, fn) => { if (ms >= from) timers.push(setTimeout(fn, ms - from)); };
      later(0, () => setPose(svg, 'wow'));
      later(WIRE_AT[2][1] + k * LAG, () => setPose(svg, 'joy'));
      later(BACK[1] + k * LAG, () => setPose(svg, svg.dataset.base));
    });
  };
  const restartFlow = () => flow.forEach((el) => el.getAnimations().forEach((a) => { a.currentTime = 0; a.play(); }));

  // First visit: join the CSS flow where it is now (main.js arrives a moment after first paint).
  const now = ref()?.currentTime ?? Infinity;
  if (wide.matches && now < WIRE_AT[0][0]) run(now);
  let left = false;
  new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) { left = true; stop(); return; }
    if (!left || !wide.matches || reduceMotion.matches || document.hidden) return;
    left = false;
    restartFlow();
    run(0);
  }, { threshold: 0.5 }).observe(wrap);
  wide.addEventListener('change', () => { if (!wide.matches) stop(); });
}

const mark = (svgs, on) => svgs.forEach((s) => { s.dataset.moving = String(on); });

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

// Footer: each time it comes into view all three wave three times (about 2 s), then rest.
function footerMotion(gsap, box) {
  const svgs = [...box.querySelectorAll('.mascot')];
  const tl = gsap.timeline({ paused: true, onComplete: () => mark(svgs, false) });
  svgs.forEach((svg, i) => {
    // The arm turns around its own shoulder (each body shape has it elsewhere).
    const arm = svg.querySelector('.m-wave');
    tl.fromTo(arm, { rotation: 0 }, { rotation: -22, svgOrigin: arm.dataset.origin, duration: 0.3, ease: 'sine.inOut', yoyo: true, repeat: 5, immediateRender: false }, i * 0.15);
  });
  loop({
    root: box,
    threshold: 0.6,
    play: () => { if (tl.progress() === 1) tl.restart(); else tl.play(); mark(svgs, true); },
    pause: () => { tl.pause(); mark(svgs, false); },
  });
}

export function startMascotMotion(gsap) {
  if (reduceMotion.matches || !gsap) return;
  const hero = [...document.querySelectorAll('.mascot-spot .mascot')];
  if (hero.length) heroMotion(gsap, hero);
  const footer = document.querySelector('.footer-mascots');
  if (footer) footerMotion(gsap, footer);
}
