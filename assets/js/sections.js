// «So arbeiten wir zusammen», Referenzen and «Über mich».
// Stage 6c: the process line draws again, each number fills when the line reaches it and its
// pictogram moves; it loops while visible (loops.js) with its pause button.
// Stage 6d: back from before Stage 6 (3a1bd91), scrubbed with the scroll (GSAP): the long screenshot
// scrolls inside the browser frame, the quote stack fans out (it now starts as soon as it enters
// and is fully spread when its centre reaches 60 % of the window), the photo reveal and its blob,
// the timeline line. Without GSAP or with reduced motion all stay final; the stories still open.
// Stage 6f (4.11.2026): no scroll-scrubbed motion on what people read. Timed instead, started by
// IntersectionObserver: the timeline draws in 2 s once 30 % is visible (phones too; before, the GSAP
// media query had no phone branch); the quotes fan out once (0.6 s, CSS); the alexandrafry.ch
// screenshot pans slowly through the conductor (1.5 s top, 12 s pan, 2 s hold, back), holding on
// hover and focus; the «Über mich» chips get a soft highlight one by one. The photo keeps its reveal.
import { demo, reduceMotion, motion } from './loops.js';

export async function init({ motion: gsapReady }) {
  timelineStories();
  processSteps();
  pathLine();
  quoteFan();
  browserPan();
  aboutChips();
  const m = await gsapReady;
  if (!m || reduceMotion.matches) return;
  m.gsap.matchMedia().add({ wide: '(min-width: 768px)', reduce: '(prefers-reduced-motion: reduce)' }, (c) => {
    if (!c.conditions.reduce && c.conditions.wide) aboutPhoto(m.gsap);
  });
}

const calm = () => reduceMotion.matches || motion.paused;
// Once el is at least share visible, run fn (at once without IntersectionObserver).
function once(el, share, fn) {
  if (!('IntersectionObserver' in window)) { fn(); return; }
  const io = new IntersectionObserver((entries) => { if (entries.some((e) => e.intersectionRatio >= share)) { io.disconnect(); fn(); } }, { threshold: [share] });
  io.observe(el);
}

/* ---------- So arbeiten wir zusammen: line, numbers, pictograms (a looping demo) ---------- */
function processSteps() {
  const wrap = document.querySelector('.steps-wrap');
  if (!wrap) return;
  demo(wrap, { tap: '.steps', duration: 3200, rest: 2500 });
}

/* ---------- Über mich: the timeline line draws in 2 s; each dot comes on as it passes ---------- */
function pathLine() {
  const path = document.querySelector('.path');
  if (!path || calm()) return;
  const stops = [...path.querySelectorAll('.path__stop')];
  path.classList.add('is-drawing');
  path.style.setProperty('--draw', '0');
  once(path, 0.3, () => {
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0) / 2000);
      const k = 1 - (1 - p) ** 2;
      path.style.setProperty('--draw', k.toFixed(3));
      stops.forEach((s, i) => s.classList.toggle('is-on', k >= i / (stops.length - 1) - 0.02));
      if (p < 1) requestAnimationFrame(step); else path.classList.remove('is-drawing');
    };
    requestAnimationFrame(step);
  });
}

/* ---------- Referenzen: the long screenshot pans slowly inside the browser frame ---------- */
// 1.5 s at the top, 12 s down, 2 s at the bottom; then the round's rest and back to the top. It holds
// while the pointer or the focus is on the frame. Reduced motion: the frame scrolls by hand (CSS).
function browserPan() {
  const frame = document.querySelector('.ref--site .browser');
  const view = frame?.querySelector('.browser__view');
  const shot = frame?.querySelector('.case__shot');
  if (!view || !shot || !shot.animate) return;
  // Reduced motion or motion paused: a labelled box that scrolls by hand (keyboard too).
  if (calm()) {
    view.tabIndex = 0;
    view.setAttribute('role', 'region');
    view.setAttribute('aria-label', shot.querySelector('img')?.alt || frame.closest('.ref')?.querySelector('h3')?.textContent || '');
    return;
  }
  let anim = null;
  let inside = false;
  const pan = () => -Math.max(0, shot.getBoundingClientRect().height - view.clientHeight);
  const hold = (on) => { inside = on; if (anim) { if (on) anim.pause(); else if (frame.dataset.play === 'run') anim.play(); } };
  frame.addEventListener('pointerenter', () => hold(true));
  frame.addEventListener('pointerleave', () => hold(false));
  frame.addEventListener('focusin', () => hold(true));
  frame.addEventListener('focusout', () => hold(false));
  const T = 15500;
  demo(frame, {
    key: 'refshot',
    duration: T,
    rest: 2500,
    reset: () => { anim?.cancel(); anim = null; },
    finish: () => { anim?.finish(); },
    play: () => {
      const y = pan();
      anim = shot.animate([
        { transform: 'translateY(0)' },
        { transform: 'translateY(0)', offset: 1.5 / 15.5 },
        { transform: `translateY(${y}px)`, offset: 13.5 / 15.5 },
        { transform: `translateY(${y}px)` },
      ], { duration: T, fill: 'forwards', easing: 'linear' });
      if (inside) anim.pause();
      return T;
    },
    held: () => inside,
  });
}

/* ---------- Referenzen: the quote cards fan out from a stack, on every return ---------- */
// Stage 6i (Iva: «больше нет анимации появления?»): while the row is fully out of view the cards lie
// stacked in its middle (slightly turned, overlapping); once 30 % is visible they fan out one after the
// other (0.6 s each, 0.15 s apart) to their tilted places. Transforms only (no layout shift). Never
// restacked while the focus is inside; reduced motion, motion paused or a narrow window: final layout.
const FAN_MS = 600;
const FAN_STEP = 150;
const TURN = [-5, 4, -2, 6];
function quoteFan() {
  const box = document.querySelector('.qcards');
  if (!box || !('IntersectionObserver' in window)) return;
  const cards = [...box.querySelectorAll('.qcard')];
  const wide = matchMedia('(min-width: 900px)');
  let delay = 0;
  let done = 0;
  const final = () => { clearTimeout(delay); clearTimeout(done); box.classList.remove('is-stacked', 'is-fanning'); };
  // Layout positions (offsets ignore transforms): every card goes over the middle of the row.
  const place = () => {
    const at = cards.map((c) => [c.offsetLeft + c.offsetWidth / 2, c.offsetTop + Math.min(c.offsetHeight, 320) / 2]);
    const mx = at.reduce((a, p) => a + p[0], 0) / at.length;
    const my = at.reduce((a, p) => a + p[1], 0) / at.length;
    cards.forEach((c, i) => {
      c.style.setProperty('--sx', `${Math.round(mx - at[i][0] + (i - (cards.length - 1) / 2) * 18)}px`);
      c.style.setProperty('--sy', `${Math.round(my - at[i][1] + i * 6)}px`);
      c.style.setProperty('--st', `${TURN[i % TURN.length]}deg`);
      c.style.setProperty('--i', String(i));
    });
  };
  const stack = () => {
    if (!wide.matches || calm() || box.matches(':focus-within')) { final(); return; }
    clearTimeout(done);
    place();
    box.classList.remove('is-fanning');
    box.classList.add('is-stacked');
  };
  const fan = () => {
    if (!box.classList.contains('is-stacked')) return;
    if (calm()) { final(); return; }
    void box.offsetWidth;
    box.classList.add('is-fanning');
    box.classList.remove('is-stacked');
    done = setTimeout(() => box.classList.remove('is-fanning'), FAN_MS + FAN_STEP * (cards.length - 1) + 80);
  };
  new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) { clearTimeout(delay); stack(); } else if (e.intersectionRatio >= 0.3 && box.classList.contains('is-stacked')) { clearTimeout(delay); delay = setTimeout(fan, 180); }
    }
  }, { threshold: [0, 0.3] }).observe(box);
  document.addEventListener('motion:change', () => { if (motion.paused) final(); });
  wide.addEventListener('change', final);
  reduceMotion.addEventListener?.('change', final);
}

/* ---------- Über mich: a soft highlight moves from chip to chip (1 s each, then a rest) ---------- */
function aboutChips() {
  const row = document.querySelector('.aboutrow[data-demo="about"]');
  const chips = row ? [...row.querySelectorAll('.trust')] : [];
  if (!chips.length) return;
  let timers = [];
  const clear = () => { timers.forEach(clearTimeout); timers = []; chips.forEach((c) => c.classList.remove('is-lit')); };
  demo(row, {
    tap: '.aboutrow__chips',
    frames: 1,
    rest: 3000,
    reset: clear,
    finish: clear,
    play: () => {
      chips.forEach((c, i) => {
        timers.push(setTimeout(() => { chips.forEach((o) => o.classList.toggle('is-lit', o === c)); }, i * 1000));
      });
      timers.push(setTimeout(() => chips.forEach((c) => c.classList.remove('is-lit')), chips.length * 1000));
      return chips.length * 1000;
    },
  });
}

// The photo reveals from 1.08 to 1 inside its mask; the pastel blob behind it drifts slowly.
function aboutPhoto(gsap) {
  const photo = document.querySelector('.about__photo');
  if (!photo) return;
  gsap.fromTo(photo.querySelector('picture'), { scale: 1.08 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: photo, start: 'top 90%', end: 'top 30%', scrub: 1 } });
  gsap.fromTo(photo.querySelector('.about__blob'), { x: -10, y: 16, rotation: -6 }, { x: 14, y: -18, rotation: 8, ease: 'none', scrollTrigger: { trigger: '.about', start: 'top bottom', end: 'bottom top', scrub: 1.5 } });
}

/* ---------- Über mich: each timeline stop opens its two-line story ---------- */
function timelineStories() {
  const path = document.querySelector('.path');
  if (!path) return;
  const stops = [...path.querySelectorAll('.path__stop')];
  const buttons = stops.map((stop) => {
    const label = stop.querySelector('.path__label');
    const story = stop.querySelector('.path__story');
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'path__btn';
    b.textContent = label.textContent;
    b.setAttribute('aria-expanded', 'false');
    b.setAttribute('aria-controls', story.id);
    label.replaceWith(b);
    story.hidden = true;
    b.addEventListener('click', () => {
      const open = b.getAttribute('aria-expanded') !== 'true';
      buttons.forEach((o) => { o.setAttribute('aria-expanded', 'false'); document.getElementById(o.getAttribute('aria-controls')).hidden = true; });
      b.setAttribute('aria-expanded', String(open));
      story.hidden = !open;
    });
    return b;
  });
  path.classList.add('has-buttons');
}
