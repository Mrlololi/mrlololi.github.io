// «So arbeiten wir zusammen», Referenzen and «Über mich».
// Stage 6c: the process line draws again, each number fills when the line reaches it and its
// pictogram moves; it loops while visible (loops.js) with its pause button.
// Stage 6d: back from before Stage 6 (3a1bd91), scrubbed with the scroll (GSAP): the long screenshot
// scrolls inside the browser frame, the quote stack fans out (it now starts as soon as it enters
// and is fully spread when its centre reaches 60 % of the window), the photo reveal and its blob,
// the timeline line. Without GSAP or with reduced motion all stay final; the stories still open.
import { demo } from './loops.js';

export async function init({ motion, reduceMotion }) {
  timelineStories();
  processSteps();
  const m = await motion;
  if (!m || reduceMotion.matches) return;
  const { gsap } = m;
  gsap.matchMedia().add({ wide: '(min-width: 768px)', reduce: '(prefers-reduced-motion: reduce)' }, (c) => {
    if (c.conditions.reduce) return;
    pathLine(gsap);
    browserFrame(gsap);
    if (c.conditions.wide) { quoteFan(gsap); aboutPhoto(gsap); }
  });
}

/* ---------- So arbeiten wir zusammen: line, numbers, pictograms (a looping demo) ---------- */
function processSteps() {
  const wrap = document.querySelector('.steps-wrap');
  if (!wrap) return;
  demo(wrap, { button: wrap.querySelector(':scope > .loopctl'), duration: 3200, rest: 2500 });
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

/* ---------- Referenzen: the long screenshot scrolls inside the browser frame ---------- */
function browserFrame(gsap) {
  const frame = document.querySelector('.ref--site .browser');
  if (!frame) return;
  gsap.fromTo(frame.querySelector('.case__shot'), { yPercent: 0 }, { yPercent: -35, ease: 'none', scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: 0.8 } });
}

// The three quote cards come in stacked and straight, then fan out to their tilts. Stage 6d (Iva:
// «they open too late»): from the moment the stack enters the window until its centre is at 60 %.
function quoteFan(gsap) {
  const cards = [...document.querySelectorAll('.qcard')];
  if (!cards.length) return;
  const tilts = [-2.5, 2, -1.5];
  cards.forEach((card, i) => {
    const toMiddle = () => cards[1].offsetLeft - card.offsetLeft;
    gsap.fromTo(card, { x: toMiddle, rotation: 0, y: i * 8 }, {
      x: 0, rotation: tilts[i], y: 0, ease: 'none',
      scrollTrigger: { trigger: '.qcards', start: 'top bottom', end: 'center 60%', scrub: 0.6, invalidateOnRefresh: true },
    });
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
