// Stage 4 motion system (docs/superpowers/specs/2026-10-21-stage4-motion.md): corner docking between
// sections, entrances that replay on every re-entry and the hero shapes' parallax. Runs once GSAP is
// there; reduced motion gets no handler at all (CSS shows every final state).
// Stage 6d: the entrances are back as before Stage 6; no hover effects (no tilt, no magnet, no
// letter wave: they blurred text and made the cursor jump on the cards).
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
    if (wide) parallax(gsap);
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
// transform on an ancestor would break the pinned element's fixed position. The thin tool band does
// not drift either: it would carry «Ich arbeite mit» out of its peach band (Iva 29.10.2026).
function dock(gsap, wide) {
  for (const sec of document.querySelectorAll('main > .edge, .site-footer.edge')) {
    const tl = gsap.timeline({ scrollTrigger: { trigger: sec, start: 'top bottom', end: 'top top', scrub: true } });
    tl.fromTo(sec, { '--dock': 1 }, { '--dock': 0, ease: 'none' }, 0);
    const before = sec.previousElementSibling;
    const inner = before?.querySelector(':scope > .wrap');
    if (wide && inner && !before.querySelector('[data-pin]') && !before.classList.contains('tools')) {
      tl.fromTo(inner, { y: 0 }, { y: () => -0.06 * innerHeight, ease: 'none', immediateRender: false }, 0);
    }
  }
}

/* ---------- Entrances: once, as soon as any part is on screen; never hidden again ---------- */
// Stage 6d: back as before Stage 6 (3a1bd91). [data-enter="lines"]: headings by lines on wide screens
// (SplitText), whole on phones. [data-enter="stagger"]: the children of a list, one by one.
// Stage 6e (Iva: sections stayed empty when he scrolled up or not far enough): an element enters as
// soon as its top reaches the bottom of the window, only once (no reverse, no reset on a fast
// scroll), and anything already on screen or above when this runs is simply shown.
function entrances(gsap, wide, getSplit) {
  const st = (el) => ({ trigger: el, start: 'top bottom', once: true });
  const splits = [];
  for (const el of document.querySelectorAll('[data-enter]')) {
    if (el.getBoundingClientRect().top < innerHeight) continue;
    const kind = el.dataset.enter;
    if (kind === 'stagger') {
      gsap.from(el.children, { y: 24, opacity: 0, duration: 0.5, ease: 'power3.out', stagger: 0.07, scrollTrigger: st(el) });
    } else if (kind === 'lines' && getSplit) {
      getSplit().then((SplitText) => {
        if (!SplitText) return;
        splits.push(SplitText.create(el, {
          // aria none: the words stay in the DOM as text (aria-label is not allowed on <p>).
          type: 'lines', mask: 'lines', autoSplit: true, aria: 'none',
          onSplit: (self) => gsap.from(self.lines, { yPercent: 100, duration: 0.6, ease: 'power3.out', stagger: 0.07, scrollTrigger: st(el) }),
        }));
      });
    } else {
      gsap.from(el, { y: kind === 'lines' ? 16 : 32, opacity: 0, duration: 0.5, ease: 'power3.out', scrollTrigger: st(el) });
    }
  }
  return () => splits.forEach((x) => x.revert());
}

/* ---------- Hero: the pastel shapes drift a little slower than the page ---------- */
function parallax(gsap) {
  const hero = document.querySelector('.hero');
  for (const [i, blob] of [...document.querySelectorAll('.hero__blob')].entries()) {
    gsap.to(blob, { yPercent: i ? -18 : 24, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 1 } });
  }
}
