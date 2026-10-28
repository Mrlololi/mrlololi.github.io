// Stage 4: «So arbeiten wir zusammen», Referenzen and «Über mich». Scrubbed with the scroll (GSAP):
// the process line and its numbers, the browser frame and the long screenshot inside it, the quote
// fan, the photo reveal, the timeline line. Without GSAP or with reduced motion all stay final; the
// timeline stories and the tool rows' pause still work.
import { loop } from './loops.js';

export async function init({ motion, reduceMotion }) {
  timelineStories();
  toolRows();
  const m = await motion;
  if (!m || reduceMotion.matches) return;
  const { gsap } = m;
  const mm = gsap.matchMedia();
  mm.add({ wide: '(min-width: 768px)', narrow: '(max-width: 767.98px)', reduce: '(prefers-reduced-motion: reduce)' }, (c) => {
    if (c.conditions.reduce) return;
    processLine(gsap);
    pathLine(gsap);
    if (c.conditions.wide) {
      browserFrame(gsap);
      quoteFan(gsap);
      aboutPhoto(gsap);
    }
  });
}

/* ---------- So arbeiten wir zusammen: the line draws; each number fills when it reaches it ---------- */
function processLine(gsap) {
  const wrap = document.querySelector('.steps-wrap');
  if (!wrap) return;
  const steps = [...wrap.querySelectorAll('.step')];
  const n = steps.length;
  const sync = (p) => steps.forEach((s, i) => {
    const reached = p >= i / (n - 1) - 0.02;
    s.classList.toggle('is-off', !reached);
    if (reached && !s.classList.contains('is-reached')) s.classList.add('is-reached');
    if (!reached) s.classList.remove('is-reached');
  });
  const k = { p: 0 };
  gsap.fromTo(k, { p: 0 }, {
    p: 1, ease: 'none',
    onUpdate: () => { wrap.style.setProperty('--draw', k.p.toFixed(3)); sync(k.p); },
    scrollTrigger: { trigger: wrap, start: 'top 75%', end: 'bottom 55%', scrub: 0.8 },
  });
  return () => { wrap.style.removeProperty('--draw'); steps.forEach((s) => s.classList.remove('is-off', 'is-reached')); };
}

/* ---------- Über mich: the timeline line draws; each dot comes on as it passes ---------- */
function pathLine(gsap) {
  const path = document.querySelector('.path');
  if (!path) return;
  const stops = [...path.querySelectorAll('.path__stop')];
  const k = { p: 0 };
  path.classList.add('is-drawing');
  gsap.fromTo(k, { p: 0 }, {
    p: 1, ease: 'none',
    onUpdate: () => {
      path.style.setProperty('--draw', k.p.toFixed(3));
      stops.forEach((s, i) => s.classList.toggle('is-on', k.p >= i / (stops.length - 1) - 0.02));
    },
    scrollTrigger: { trigger: path, start: 'top 85%', end: 'bottom 55%', scrub: 0.8 },
  });
}

/* ---------- Referenzen: the frame grows 0.94 -> 1, the long screenshot scrolls inside ---------- */
function browserFrame(gsap) {
  const frame = document.querySelector('.browser');
  if (!frame) return;
  const st = { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: 0.8 };
  gsap.fromTo(frame, { scale: 0.94 }, { scale: 1, ease: 'none', scrollTrigger: { ...st, end: 'center center' } });
  gsap.fromTo(frame.querySelector('.case__shot'), { yPercent: 0 }, { yPercent: -35, ease: 'none', scrollTrigger: st });
}

// The three quote cards come in stacked and straight, then fan out to their tilts (a light orbit).
function quoteFan(gsap) {
  const cards = [...document.querySelectorAll('.qcard')];
  if (!cards.length) return;
  const tilts = [-2.5, 2, -1.5];
  cards.forEach((card, i) => {
    const toMiddle = () => cards[1].offsetLeft - card.offsetLeft;
    gsap.fromTo(card, { x: toMiddle, rotation: 0, y: i * 8 }, {
      x: 0, rotation: tilts[i], y: 0, ease: 'none',
      scrollTrigger: { trigger: '.qcards', start: 'top 90%', end: 'top 35%', scrub: 1, invalidateOnRefresh: true },
    });
    // On hover a card straightens and lifts.
    card.addEventListener('pointerenter', () => gsap.to(card, { rotation: 0, y: -6, duration: 0.3, ease: 'power2.out', overwrite: 'auto' }));
    card.addEventListener('pointerleave', () => gsap.to(card, { rotation: tilts[i], y: 0, duration: 0.3, ease: 'power2.out', overwrite: 'auto' }));
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

// Two slow marquee rows of tools in opposite directions: one row each from the start (no reflow),
// moving only while on screen and not paused with their button.
function toolRows() {
  const box = document.querySelector('.trows');
  if (!box || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const rows = [...box.querySelectorAll('.trow-wrap')];
  rows.forEach((r) => r.classList.add('is-moving', 'is-paused'));
  loop({
    root: box,
    button: box.querySelector('.loop-btn'),
    play: () => rows.forEach((r) => r.classList.remove('is-paused')),
    pause: () => rows.forEach((r) => r.classList.add('is-paused')),
  });
}

