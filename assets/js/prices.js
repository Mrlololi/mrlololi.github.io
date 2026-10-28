// Stage 4, prices: the package pictures play on every entry (HTML = finished), the Launch-Box opens
// with the scroll (wide screens), the hour meter fills 1 -> 3 -> 5 h and its switch rolls the total,
// the 30-day strip ticks to the stamp, and Lösung turns his wrench at the promise. Reduced motion:
// all final; the switch still works (instantly).
import { scene } from './loops.js';
import { supportTotal } from './pure.js';

export async function init({ motion, reduceMotion, locale }) {
  const m = await motion;
  const gsap = m && !reduceMotion.matches ? m.gsap : null;
  quickFix();
  techCheck();
  hub(m, reduceMotion);
  website();
  chat();
  meter(gsap, reduceMotion, locale);
  promise(gsap);
}

const later = (ms, fn) => setTimeout(fn, ms);
const restart = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };

function quickFix() {
  const viz = document.querySelector('.viz--quick');
  let timer;
  scene(viz, {
    enter: () => {
      clearTimeout(timer);
      viz.classList.remove('is-fixing');
      viz.classList.add('is-broken');
      timer = later(700, () => { viz.classList.remove('is-broken'); restart(viz, 'is-fixing'); });
    },
    leave: () => { clearTimeout(timer); viz.classList.remove('is-broken', 'is-fixing'); },
  });
}

function techCheck() {
  const viz = document.querySelector('.viz--check');
  const card = viz?.closest('.item');
  const lines = [...viz.querySelectorAll('.scan li')];
  let timers = [];
  const clear = () => { timers.forEach(clearTimeout); timers = []; };
  scene(viz, {
    enter: () => {
      clear();
      lines.forEach((l) => l.classList.remove('is-on'));
      viz.classList.add('is-broken');
      restart(viz, 'is-scanning');
      lines.forEach((l, i) => timers.push(later(250 + i * 380, () => l.classList.add('is-on'))));
      timers.push(later(250 + lines.length * 380, () => viz.classList.remove('is-broken', 'is-scanning')));
    },
    leave: () => { clear(); viz.classList.remove('is-broken', 'is-scanning'); },
  });
  // The rotating border runs only while the card is on screen.
  if (card) scene(card, { enter: () => card.classList.add('is-visible'), leave: () => card.classList.remove('is-visible'), threshold: 0 });
}

// Launch-Box: on wide screens the lid opens and the four tiles move out of the box as you scroll
// past (scrubbed); lines draw and dots travel while it is in view. Phones: open and flat.
function hub(m, reduceMotion) {
  const viz = document.querySelector('.viz--hub');
  scene(viz, { enter: () => restart(viz, 'is-play'), leave: () => viz.classList.remove('is-play') });
  if (!m || reduceMotion.matches) return;
  const { gsap } = m;
  gsap.matchMedia().add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
    const sats = [...viz.querySelectorAll('.hub__sat')];
    const box = viz.querySelector('.lbox');
    const tl = gsap.timeline({ scrollTrigger: { trigger: viz, start: 'top 90%', end: 'center 45%', scrub: 0.8 } });
    tl.fromTo(viz, { '--lid': '0deg' }, { '--lid': '-110deg', ease: 'none', duration: 0.4 }, 0)
      .fromTo(box, { rotationY: -38 }, { rotationY: -18, ease: 'none', duration: 1 }, 0)
      .from(sats, {
        x: (i, el) => viz.clientWidth / 2 - (el.offsetLeft + el.offsetWidth / 2),
        y: (i, el) => viz.clientHeight / 2 - (el.offsetTop + el.offsetHeight / 2),
        scale: 0.4, autoAlpha: 0, ease: 'none', duration: 0.6, stagger: 0.05,
      }, 0.3);
  });
}

function website() {
  const viz = document.querySelector('.viz--site');
  scene(viz, { enter: () => restart(viz, 'is-play'), leave: () => viz.classList.remove('is-play') });
}

// The answer types itself (about 1.6 s) each time the card comes into view.
function chat() {
  const out = document.querySelector('.viz--chat .tchat__text');
  if (!out) return;
  const full = out.textContent;
  let timer;
  scene(out.closest('.viz'), {
    enter: () => {
      clearInterval(timer);
      let n = 0;
      out.textContent = '';
      timer = setInterval(() => { n += 2; out.textContent = full.slice(0, n); if (n >= full.length) clearInterval(timer); }, 1600 / (full.length / 2));
    },
    leave: () => { clearInterval(timer); out.textContent = full; },
  });
}

// Hour meter: on entry 1 h -> 3 h -> 5 h with the total counting along; the switch rolls to 5, 10 or 20 h.
function meter(gsap, reduceMotion, locale) {
  const box = document.querySelector('.meter');
  if (!box) return;
  const hEl = box.querySelector('.meter__h');
  const eurEl = box.querySelector('.meter__eur');
  const live = box.querySelector('.meter__live');
  const opts = [...box.querySelectorAll('.meter__opt')];
  const fmt = new Intl.NumberFormat(locale);
  const state = { h: 5 };
  const render = () => {
    box.style.setProperty('--h', state.h.toFixed(2));
    hEl.textContent = fmt.format(Math.round(state.h));
    eurEl.textContent = fmt.format(Math.round(supportTotal(state.h)));
  };
  const to = (h, opts2 = {}) => {
    if (!gsap) { state.h = h; render(); return null; }
    return gsap.to(state, { h, duration: 0.6, ease: 'power2.out', overwrite: true, onUpdate: render, ...opts2 });
  };
  opts.forEach((b) => b.addEventListener('click', () => {
    const h = Number(b.dataset.h);
    opts.forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
    to(h);
    live.textContent = `${h} h = ${fmt.format(supportTotal(h))} €`;
  }));
  if (!gsap) return;
  scene(box, {
    enter: () => {
      const chosen = Number(opts.find((o) => o.getAttribute('aria-pressed') === 'true')?.dataset.h || 5);
      if (chosen !== 5) return; // the visitor picked their own hours: keep them
      state.h = 0;
      render();
      gsap.timeline().to(state, { h: 1, duration: 0.5, ease: 'power2.out', onUpdate: render })
        .to(state, { h: 3, duration: 0.6, ease: 'power2.out', onUpdate: render }, '+=0.25')
        .to(state, { h: 5, duration: 0.6, ease: 'power2.out', onUpdate: render }, '+=0.25');
    },
    leave: () => { gsap.killTweensOf(state); if (!opts.some((o) => o.getAttribute('aria-pressed') === 'true' && o.dataset.h !== '5')) { state.h = 5; render(); } },
  });
}

// «Meine Zusage»: Tag 1, 14, 30 tick in turn, the stamp lands; it turns slowly while in view.
// Lösung gives his wrench a little turn when the promise line comes into view.
function promise(gsap) {
  const z = document.querySelector('.zusage');
  if (!z) return;
  const days = [...z.querySelectorAll('.zusage__days li')];
  const stamp = z.querySelector('.stamp');
  const solo = z.querySelector('.mscene--promise .mascot');
  let timers = [];
  scene(z, {
    enter: () => {
      timers.forEach(clearTimeout);
      z.classList.remove('is-drawing');
      z.classList.add('is-visible', 'is-off');
      [...days, stamp].forEach((el) => el.classList.remove('is-on'));
      void z.offsetWidth;
      days.forEach((d, i) => timers.push(later(200 + i * 450, () => d.classList.add('is-on'))));
      timers.push(later(250, () => z.classList.add('is-drawing')));
      timers.push(later(200 + days.length * 450, () => { stamp.classList.add('is-on'); }));
      timers.push(later(200 + days.length * 450 + 600, () => z.classList.remove('is-off')));
      if (gsap && solo) {
        const tool = solo.querySelector('[data-part="accessory"]');
        gsap.fromTo(tool, { rotation: 0 }, { rotation: -35, transformOrigin: '50% 85%', duration: 0.25, yoyo: true, repeat: 1, ease: 'sine.inOut' });
      }
    },
    leave: () => { timers.forEach(clearTimeout); z.classList.remove('is-visible', 'is-off'); },
  });
}
