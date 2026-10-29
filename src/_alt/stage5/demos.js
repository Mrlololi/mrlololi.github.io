// Stage 2 demos (hero ribbon, marquee, before/after, 6 vs 1, flow nodes). Every demo starts from its final state in the HTML; these functions only
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
  // The hero's mascots follow the same switch (on screen, tab visible, not paused): mascots.js
  // reads data-motion and listens for «hero:motion».
  const visual = document.querySelector('.hero__visual');
  const tell = (on) => { visual.dataset.motion = on ? 'on' : 'off'; document.dispatchEvent(new CustomEvent('hero:motion', { detail: on })); };
  loop({
    root: visual,
    button: document.querySelector('.hero .loop-btn'),
    play: () => {
      if (!begun) { begun = true; anims.forEach((a) => a.beginElement()); }
      svgs.forEach((svg) => svg.unpauseAnimations());
      tell(true);
    },
    pause: () => { svgs.forEach((svg) => svg.pauseAnimations()); tell(false); },
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

/* ---------- Before/after: «Geordnet» covers «Chaos» from the left (wide screens) ---------- */
// p (0-100) is the divider's place and the share of «Geordnet»; the range, a drag on the picture and,
// with motion, the scroll (pinned for one screen) all set it. Transforms only: the mask moves by
// p - 100 %, its inner layer back by the same amount, the divider's track by p %.
export function initBeforeAfter(motion) {
  const fig = document.querySelector('.ba');
  if (!fig) return;
  const stage = fig.querySelector('.ba__stage');
  const mask = fig.querySelector('.ba__mask');
  const inner = fig.querySelector('.ba__inner');
  const track = fig.querySelector('.ba__track');
  const range = fig.querySelector('.ba__range');
  const wide = matchMedia('(min-width: 768px)');
  const set = (p, fromRange = false) => {
    const v = Math.round(p);
    mask.style.transform = `translateX(${p - 100}%)`;
    inner.style.transform = `translateX(${100 - p}%)`;
    track.style.transform = `translateX(${p}%)`;
    if (!fromRange) range.value = String(v);
    range.setAttribute('aria-valuetext', range.dataset.valuetext.replace('{v}', String(100 - v)));
  };
  // The scroll's wipe leaves the divider alone for a moment after the reader set it by hand.
  let byHand = 0;
  range.addEventListener('input', () => { byHand = performance.now(); set(Number(range.value), true); });
  set(Number(range.value));
  // The picture itself can be dragged (mouse, pen, finger); vertical swipes still scroll the page.
  let dragging = false;
  const fromPointer = (e) => {
    byHand = performance.now();
    const r = stage.getBoundingClientRect();
    set(Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100)));
  };
  stage.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || !wide.matches) return;
    dragging = true;
    stage.setPointerCapture(e.pointerId);
    fromPointer(e);
  });
  stage.addEventListener('pointermove', (e) => { if (dragging) fromPointer(e); });
  const stop = () => { dragging = false; };
  stage.addEventListener('pointerup', stop);
  stage.addEventListener('pointercancel', stop);

  // Wide screens with motion: pinned for one screen while the divider wipes left to right.
  // Phones: the two drawings stand one under the other and fade in.
  motion.then((m) => {
    if (!m) return;
    const { gsap } = m;
    gsap.matchMedia().add({ wide: '(min-width: 768px)', reduce: '(prefers-reduced-motion: reduce)' }, (c) => {
      if (c.conditions.reduce) return;
      if (!c.conditions.wide) {
        for (const side of fig.querySelectorAll('.ba__side')) {
          gsap.from(side, { y: 24, opacity: 0, duration: 0.5, ease: 'power3.out', scrollTrigger: { trigger: side, start: 'top 85%', toggleActions: 'play none none reverse' } });
        }
        return;
      }
      const k = { p: 0 };
      gsap.to(k, {
        p: 100, ease: 'none',
        onUpdate: () => { if (performance.now() - byHand > 1500) set(k.p); },
        // Pins are measured first (refreshPriority), so triggers created earlier further down count their space.
        scrollTrigger: { trigger: fig, pin: true, start: 'center center', end: '+=100%', scrub: 1, refreshPriority: 1 },
      });
      return () => set(50);
    });
  });
}

/* ---------- 6 Minuten gegen 1 Minute: two lines of the same reply at two speeds ---------- */
export function initSpeed() {
  const box = document.querySelector('.speed');
  if (!box) return;
  const cards = [...box.querySelectorAll('.speed__card')].map((card) => {
    const p = card.querySelector('.speed__text');
    const span = document.createElement('span');
    span.textContent = p.textContent;
    p.textContent = '';
    p.append(span);
    return { card, p, span };
  });
  const CYCLE = 9000; // the slow line needs the whole cycle, the fast one a sixth of it
  const dur = [CYCLE, CYCLE / 6];
  let raf = 0;
  let t0 = 0;
  const frame = (now) => {
    if (!t0) t0 = now;
    const t = (now - t0) % (CYCLE + 1200);
    cards.forEach(({ card, p, span }, i) => {
      const k = Math.min(1, t / dur[i]);
      const dist = Math.max(0, span.scrollWidth - p.clientWidth);
      card.style.setProperty('--p', k.toFixed(3));
      span.style.setProperty('--x', `${(-dist * k).toFixed(1)}px`);
    });
    raf = requestAnimationFrame(frame);
  };
  loop({
    root: box,
    button: box.querySelector('.loop-btn'),
    play: () => { t0 = 0; raf = requestAnimationFrame(frame); },
    pause: () => { cancelAnimationFrame(raf); cards.forEach(({ card, span }) => { card.style.removeProperty('--p'); span.style.removeProperty('--x'); }); },
  });
}

/* ---------- Hero flow: each node explains its step in one line under the diagram ---------- */
export function initFlowNodes() {
  const buttons = [...document.querySelectorAll('.hf__btn')];
  if (!buttons.length) return;
  const show = (i) => buttons.forEach((b, k) => {
    b.setAttribute('aria-expanded', String(k === i));
    document.getElementById(b.getAttribute('aria-controls')).classList.toggle('is-active', k === i);
  });
  buttons.forEach((b, i) => {
    b.addEventListener('click', () => show(i));
    b.addEventListener('focus', () => show(i));
  });
}
