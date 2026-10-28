// Stage 4 motion system (docs/superpowers/specs/2026-10-21-stage4-motion.md): corner docking between
// sections, entrances that replay on every re-entry, the hero shapes' parallax and the hover effects.
// Runs once GSAP is there; reduced motion gets no handler at all (CSS shows every final state).
// Entrances fade with opacity only (never visibility), so hidden-until-scrolled text stays in the
// accessibility tree and headings keep their order for screen readers.
const WIDE = '(min-width: 768px)';

export function initMotion(gsap, ScrollTrigger, loadScript) {
  ScrollTrigger.config({ ignoreMobileResize: true });
  // A refresh briefly unpins pinned blocks (moves them out of their spacer), which drops keyboard
  // focus inside them: give it back without scrolling.
  let focused = null;
  ScrollTrigger.addEventListener('refreshInit', () => { focused = document.activeElement; });
  ScrollTrigger.addEventListener('refresh', () => {
    if (focused && focused !== document.body && focused !== document.activeElement && focused.isConnected) focused.focus({ preventScroll: true });
    focused = null;
  });
  let split = null; // SplitText, fetched on desktop only
  const getSplit = () => (split ||= loadScript('/assets/vendor/SplitText.min.js').then(() => {
    gsap.registerPlugin(window.SplitText);
    return window.SplitText;
  }).catch(() => null));

  const mm = gsap.matchMedia();
  mm.add({ wide: WIDE, narrow: '(max-width: 767.98px)', reduce: '(prefers-reduced-motion: reduce)' }, (c) => {
    const { wide, reduce } = c.conditions;
    if (reduce) return undefined;
    dock(gsap, wide);
    const undo = entrances(gsap, wide, wide ? getSplit : null);
    if (wide) { parallax(gsap); hover(gsap, getSplit); }
    return undo;
  });

  let timer;
  const api = {
    gsap, ScrollTrigger, getSplit,
    // Debounced: several modules may add triggers or change heights in the same moment.
    refresh: () => { clearTimeout(timer); timer = setTimeout(() => ScrollTrigger.refresh(), 120); },
  };
  document.fonts?.ready.then(api.refresh);
  // Demos that load later (KI examples, the chat, tabs) change the page height: re-measure the triggers.
  let height = document.body.offsetHeight;
  new ResizeObserver(() => { if (Math.abs(document.body.offsetHeight - height) > 2) { height = document.body.offsetHeight; api.refresh(); } }).observe(document.body);
  return api;
}

/* ---------- Docking: each pastel section lays its rounded top over the one before ---------- */
// The radius (48 px, 24 px on phones, from CSS) goes to 0 as the section reaches the top. On wide
// screens the section before drifts up a little. Sections that hold a pin are left still: a
// transform on an ancestor would break the pinned element's fixed position.
function dock(gsap, wide) {
  for (const sec of document.querySelectorAll('main > .edge, .site-footer.edge')) {
    const tl = gsap.timeline({ scrollTrigger: { trigger: sec, start: 'top bottom', end: 'top top', scrub: true } });
    tl.fromTo(sec, { '--dock': 1 }, { '--dock': 0, ease: 'none' }, 0);
    const before = sec.previousElementSibling;
    const inner = before?.querySelector(':scope > .wrap');
    if (wide && inner && !before.querySelector('[data-pin]')) {
      tl.fromTo(inner, { y: 0 }, { y: () => -0.06 * innerHeight, ease: 'none', immediateRender: false }, 0);
    }
  }
}

/* ---------- Entrances: replay on every re-entry, reverse when scrolled back above ---------- */
// [data-enter="lines"]: headings and leads, by lines on wide screens (SplitText), whole on phones.
// [data-enter="up"]: a card or photo. [data-enter="stagger"]: the children of a list, one by one.
function entrances(gsap, wide, getSplit) {
  const st = (el) => ({ trigger: el, start: 'top 85%', toggleActions: 'play none none reverse' });
  const splits = [];
  for (const el of document.querySelectorAll('[data-enter]')) {
    const kind = el.dataset.enter;
    if (kind === 'stagger') {
      gsap.from(el.children, { y: 24, opacity: 0, duration: 0.5, ease: 'power3.out', stagger: 0.07, scrollTrigger: st(el) });
    } else if (kind === 'lines' && getSplit) {
      // Hidden until split, so the lines never flash at full opacity first.
      gsap.set(el, { opacity: 0 });
      getSplit().then((SplitText) => {
        if (!SplitText) { gsap.set(el, { opacity: 1 }); return; }
        splits.push(SplitText.create(el, {
          // aria none: the words stay in the DOM as text (aria-label is not allowed on <p>).
          type: 'lines', mask: 'lines', autoSplit: true, aria: 'none',
          onSplit: (self) => {
            gsap.set(el, { opacity: 1 });
            return gsap.from(self.lines, { yPercent: 100, duration: 0.6, ease: 'power3.out', stagger: 0.07, scrollTrigger: st(el) });
          },
        }));
      });
    } else {
      gsap.from(el, { y: kind === 'lines' ? 16 : 32, opacity: 0, duration: 0.5, ease: 'power3.out', scrollTrigger: st(el) });
    }
  }
  return () => splits.forEach((s) => s.revert());
}

/* ---------- Hero: the pastel shapes drift a little slower than the page ---------- */
function parallax(gsap) {
  const hero = document.querySelector('.hero');
  for (const [i, blob] of [...document.querySelectorAll('.hero__blob')].entries()) {
    gsap.to(blob, { yPercent: i ? -18 : 24, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 1 } });
  }
}

/* ---------- Hover (mouse only): magnetic CTAs, letter wave, card tilt ---------- */
function hover(gsap, getSplit) {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  for (const btn of document.querySelectorAll('[data-magnet]')) {
    const x = gsap.quickTo(btn, 'x', { duration: 0.3, ease: 'power3.out' });
    const y = gsap.quickTo(btn, 'y', { duration: 0.3, ease: 'power3.out' });
    btn.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect();
      x(((e.clientX - r.left) / r.width - 0.5) * 12);
      y(((e.clientY - r.top) / r.height - 0.5) * 8);
    });
    btn.addEventListener('pointerleave', () => { x(0); y(0); });
  }
  const waves = document.querySelectorAll('[data-wave]');
  if (waves.length) {
    getSplit().then((SplitText) => {
      if (!SplitText) return;
      for (const btn of waves) {
        const target = btn.querySelector('.btn__text') || btn;
        const { chars } = SplitText.create(target, { type: 'chars', aria: 'auto' });
        btn.addEventListener('pointerenter', () => {
          gsap.fromTo(chars, { y: 0 }, { keyframes: [{ y: -5, duration: 0.15, ease: 'power2.out' }, { y: 0, duration: 0.25, ease: 'power2.in' }], stagger: 0.06, overwrite: true });
        });
      }
    });
  }
  for (const card of document.querySelectorAll('[data-tilt]')) {
    card.classList.add('is-tilting');
    const rx = gsap.quickTo(card, 'rotationX', { duration: 0.4, ease: 'power3.out' });
    const ry = gsap.quickTo(card, 'rotationY', { duration: 0.4, ease: 'power3.out' });
    gsap.set(card, { transformPerspective: 900 });
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      ry(((e.clientX - r.left) / r.width - 0.5) * 8);
      rx(-((e.clientY - r.top) / r.height - 0.5) * 8);
    });
    card.addEventListener('pointerleave', () => { rx(0); ry(0); });
  }
}
