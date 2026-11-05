// mrlololi: navigation, header, the hero line; loads GSAP (home pages) and the section modules.
// Progressive enhancement: the HTML/CSS already shows every end frame; the modules only reset
// and play them (through loops.js). Without JS, without GSAP or with reduced motion nothing moves.
// Stage 6: each demo module is imported when its section comes within a viewport. Stage 6c: every
// demo loops while visible (loops.js), each with its pause button.
import { demo, initMotionToggle } from './loops.js';

const root = document.documentElement;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const locale = root.lang === 'de' ? 'de-AT' : 'en-GB';
const CONDITIONS = { isDesktop: '(min-width: 800px)' };

initNav();
initHeader();
initFlowNodes();
initHeroLine();
initMarquee();
initTabs();
initMotionToggle();
const home = Boolean(document.querySelector('.hero'));
// Mascots: their own module, so pages without mascots never load it.
const mascots = document.querySelector('.mascot') ? import('./mascots.js').then((m) => { m.initMascots(); return m; }).catch(report) : null;
// Resolves to { gsap, ScrollTrigger, refresh } once the animation code is there, or null.
const motion = home ? loadMotion() : Promise.resolve(null);
const ctx = { motion, reduceMotion, locale };
lazy('#problems', () => import('./fixdemos.js'));
lazy('.ba', () => import('./slider.js'));
lazy('[data-video]', () => import('./video.js'));
lazy('#pricing', () => import('./prices.js'));
lazy('.kidemo', () => import('./kidemo.js'));
lazy('#ki-rechner', () => import('./kicalc.js'));
lazy('#process, #references, #about', () => import('./sections.js'));
lazy('#faq', () => import('./faq.js'));
lazy('.contact__form', () => import('./contact.js'), ['paket', 'quelle'].some((k) => new URLSearchParams(location.search).has(k)));
lazy('.nf__scene', () => import('./notfound.js'), true);

function report(e) { console.error(e); }

// Imports a section module when its section is within one viewport of the screen (now: at once).
// Stage 6f: sel may name several sections (a jump to the last one also loads the module).
function lazy(sel, load, now = false) {
  const els = [...document.querySelectorAll(sel)];
  if (!els.length) return;
  const go = () => load().then((m) => m.init(ctx)).then(() => motion.then((mo) => mo?.refresh())).catch(report);
  if (now || !('IntersectionObserver' in window)) { go(); return; }
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) { io.disconnect(); go(); }
  }, { rootMargin: '100% 0px' });
  els.forEach((el) => io.observe(el));
}

// The self-hosted GSAP files are fetched only after the page has loaded and painted, so the
// headline (LCP) never waits for animation code on a slow phone.
async function loadMotion() {
  await new Promise((resolve) => {
    const idle = () => ('requestIdleCallback' in window ? requestIdleCallback(() => resolve(), { timeout: 1200 }) : setTimeout(resolve, 200));
    if (document.readyState === 'complete') idle();
    else addEventListener('load', idle, { once: true });
  });
  try {
    await loadScript('/assets/vendor/gsap.min.js');
    await loadScript('/assets/vendor/ScrollTrigger.min.js');
  } catch {
    return null; // no animation library: everything stays in its final state
  }
  const { gsap, ScrollTrigger } = window;
  if (!gsap || !ScrollTrigger) return null;
  gsap.registerPlugin(ScrollTrigger);
  mascots?.then((m) => m?.startMascotMotion(gsap));
  const { initMotion } = await import('./motion.js');
  return initMotion(gsap, ScrollTrigger, loadScript);
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.append(s);
  });
}

/* ---------- Hero line: plays from CSS on load (4.2 s), then loops while visible (loops.js) ---------- */
// The mascot idles follow the loop: «hero:motion» on (looping) or off (paused, away, hidden).
function initHeroLine() {
  const flow = document.querySelector('.hero__flow');
  if (!flow) return;
  let d = null;
  const tell = () => {
    const on = Boolean(d && (d.looping || d.phase === 'load')) && !d.paused;
    flow.closest('.hero__visual').dataset.motion = on ? 'on' : 'off';
    document.dispatchEvent(new CustomEvent('hero:motion', { detail: on }));
  };
  d = demo(flow, { duration: 4300, rest: 3000, loadMs: Math.max(0, 4300 - performance.now()), tap: '.hf-wrap', state: () => queueMicrotask(tell) });
  if (d && !d.paused && d.timer) { d.phase = 'load'; tell(); }
  flow.addEventListener('click', () => queueMicrotask(tell));
}

/* ---------- Tool row: a marquee while visible (ambient: it never takes the focus), with its button ---------- */
// Stage 6f: the «Über mich» row is static chips now (sections.js).
function initMarquee() {
  for (const box of document.querySelectorAll('.tools__in[data-demo="tools"]')) {
    // About 20 px a second, whatever the row's width (Stage 6f).
    const speed = () => { const tr = box.querySelector('.marquee__track'); if (tr) box.style.setProperty('--marquee-s', `${Math.max(20, Math.round(tr.scrollWidth / 2 / 20))}s`); };
    demo(box, { duration: 2147483000, rest: 0, frames: 1, tap: '.marquee', state: (p) => { if (p === 'run') speed(); } });
  }
}

/* ---------- Video frame: «Video | Schritt für Schritt» (Stage 6f), the run-log loads on its tab ---------- */
// Proper tabs: arrow keys, Home and End move between them, aria-selected, one panel at a time. The
// video pauses when the other tab opens. runlog.js loads the first time its tab opens.
function initTabs() {
  for (const box of document.querySelectorAll('.vtabs')) {
    const tabs = [...box.querySelectorAll('[role="tab"]')];
    const panels = tabs.map((tab) => document.getElementById(tab.getAttribute('aria-controls')));
    let rl = null;
    const select = (i, focus = false) => {
      tabs.forEach((tab, k) => {
        const on = k === i;
        tab.setAttribute('aria-selected', String(on));
        tab.tabIndex = on ? 0 : -1;
        panels[k].hidden = !on;
        panels[k].classList.toggle('is-active', on);
      });
      if (focus) tabs[i].focus();
      if (i !== 0) panels[0].querySelectorAll('video').forEach((v) => v.pause());
      const root = panels[i].querySelector('.rl');
      if (root && !rl) rl = import('./runlog.js').then((m) => m.open(root)).catch(report);
      rl?.then((api) => { if (!api) return; if (root) api.shown(); else api.hidden(); });
    };
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(i));
      tab.addEventListener('keydown', (e) => {
        const n = tabs.length;
        const to = { ArrowRight: (i + 1) % n, ArrowLeft: (i - 1 + n) % n, Home: 0, End: n - 1 }[e.key];
        if (to == null) return;
        e.preventDefault();
        select(to, true);
      });
    });
    box.classList.add('is-ready');
    select(0);
  }
}

/* ---------- Hero flow: each node explains its step in one line under the diagram ---------- */
function initFlowNodes() {
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

/* ---------- Navigation: disclosure menu below 800 px ---------- */
function initNav() {
  const nav = document.querySelector('.site-nav');
  if (!nav) return;
  const button = nav.querySelector('.site-nav__toggle');
  const list = nav.querySelector('.site-nav__list');
  const setOpen = (open) => {
    nav.classList.toggle('is-open', open);
    button.setAttribute('aria-expanded', String(open));
  };
  button.hidden = false;
  root.classList.add('nav-ready');
  button.addEventListener('click', () => setOpen(button.getAttribute('aria-expanded') !== 'true'));
  list.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) { setOpen(false); button.focus(); }
  });
  matchMedia(CONDITIONS.isDesktop).addEventListener('change', (e) => { if (e.matches) setOpen(false); });
}

/* ---------- Header: hides on scroll down, returns on scroll up (CSS transition) ---------- */
function initHeader() {
  const header = document.querySelector('[data-header]');
  if (!header) return;
  const nav = header.querySelector('.site-nav');
  let lastY = scrollY;
  let ticking = false;
  const update = () => {
    const y = scrollY;
    const keep = header.contains(document.activeElement) || nav?.classList.contains('is-open');
    header.classList.toggle('is-scrolled', y > 8);
    if (keep || y < 120 || y < lastY - 4) header.classList.remove('is-hidden');
    else if (y > lastY + 4) header.classList.add('is-hidden');
    lastY = y;
    ticking = false;
  };
  addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  header.addEventListener('focusin', () => header.classList.remove('is-hidden'));
}
