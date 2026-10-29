// mrlololi: navigation, header, the hero line; loads GSAP (home pages) and the section modules.
// Progressive enhancement: the HTML/CSS already shows every end frame; the modules only reset
// and play them (through loops.js). Without JS, without GSAP or with reduced motion nothing moves.
// Stage 6: each demo module is imported when its section comes within a viewport. Stage 6c: every
// demo loops while visible (loops.js), each with its pause button.
import { demo } from './loops.js';

const root = document.documentElement;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const locale = root.lang === 'de' ? 'de-AT' : 'en-GB';
const CONDITIONS = { isDesktop: '(min-width: 800px)' };

initNav();
initHeader();
initFlowNodes();
initHeroLine();
initMarquee();
initRunlog();
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
lazy('#process', () => import('./sections.js'));
lazy('#faq', () => import('./faq.js'));
lazy('#contact', () => import('./contact.js'));
lazy('.nf__scene', () => import('./notfound.js'), true);

function report(e) { console.error(e); }

// Imports a section module when its section is within one viewport of the screen (now: at once).
function lazy(sel, load, now = false) {
  const el = document.querySelector(sel);
  if (!el) return;
  const go = () => load().then((m) => m.init(ctx)).then(() => motion.then((mo) => mo?.refresh())).catch(report);
  if (now || !('IntersectionObserver' in window)) { go(); return; }
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) { io.disconnect(); go(); }
  }, { rootMargin: '100% 0px' });
  io.observe(el);
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
  d = demo(flow, { duration: 4300, rest: 3000, loadMs: Math.max(0, 4300 - performance.now()), button: flow.querySelector(':scope > .loopctl'), state: () => queueMicrotask(tell) });
  if (d && !d.paused && d.timer) { d.phase = 'load'; tell(); }
  flow.querySelector(':scope > .loopctl')?.addEventListener('click', () => queueMicrotask(tell));
}

/* ---------- Tool row: a marquee while visible (ambient: it never takes the focus), with its button ---------- */
// The «Über mich» row (Stage 6e) is the same component.
function initMarquee() {
  for (const box of document.querySelectorAll('.tools__in[data-demo="tools"], .aboutrow[data-demo="about"]')) {
    demo(box, { ambient: true, duration: 2147483000, rest: 0, button: box.querySelector(':scope > .loopctl') });
  }
}

/* ---------- «Ablauf selbst ausprobieren»: the run-log demo, its CSS and JS on the first click ---------- */
function initRunlog() {
  const button = document.querySelector('.runlog__open');
  if (!button) return;
  const slot = document.getElementById('runlog');
  const label = button.textContent;
  let loaded = null;
  button.addEventListener('click', async () => {
    const open = button.getAttribute('aria-expanded') !== 'true';
    button.setAttribute('aria-expanded', String(open));
    button.textContent = open ? button.dataset.close : label;
    slot.hidden = !open;
    if (!open || loaded) return;
    loaded = new Promise((resolve) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/assets/css/runlog.css';
      link.onload = resolve;
      link.onerror = resolve;
      document.head.append(link);
    }).then(() => import('./runlog.js')).then((m) => m.open(slot, document.getElementById('runlog-tpl'), { locale })).catch(report);
  });
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
