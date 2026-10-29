// mrlololi: navigation, header, the hero line; loads GSAP (home pages) and the section modules.
// Progressive enhancement: the HTML/CSS already shows every end frame; the modules only reset
// and play them (through loops.js). Without JS, without GSAP or with reduced motion nothing moves.
// Stage 6: each demo module is imported when its section comes within a viewport.
import { demo } from './loops.js';

const root = document.documentElement;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const locale = root.lang === 'de' ? 'de-AT' : 'en-GB';
const CONDITIONS = { isDesktop: '(min-width: 800px)' };

initNav();
initHeader();
initFlowNodes();
initHeroLine();
const home = Boolean(document.querySelector('.hero'));
// Mascots: their own module, so pages without mascots never load it.
if (document.querySelector('.mascot')) import('./mascots.js').then((m) => m.initMascots()).catch(report);
// Resolves to { gsap, ScrollTrigger, refresh } once the animation code is there, or null.
const motion = home ? loadMotion() : Promise.resolve(null);
const ctx = { motion, reduceMotion, locale };
lazy('#problems', () => import('./fixdemos.js'));
lazy('[data-video]', () => import('./video.js'));
lazy('.kidemo', () => import('./kidemo.js'));
lazy('#ki-rechner', () => import('./kicalc.js'));
lazy('.path', () => import('./sections.js'));
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

/* ---------- Hero line: plays from CSS on load (4.2 s), then again on re-entry via loops.js ---------- */
function initHeroLine() {
  const flow = document.querySelector('.hero__flow');
  if (!flow) return;
  demo(flow, { duration: 4300, loadMs: Math.max(0, 4300 - performance.now()), frames: 2 });
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
