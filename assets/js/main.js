// mrlololi: navigation, header, price details, KI-Rechner; loads GSAP and the section modules.
// Progressive enhancement: the HTML/CSS already shows every final state; the modules only
// rewind and play them back. Without GSAP (or with reduced motion) nothing moves.
// Stage 4: motion.js (docking, entrances, hover) and one module per demo section, imported when
// the section comes within a viewport (story.js, which pins, as soon as GSAP is there).
import { calcSavings, formatResult, toNumber } from './calc.js';
import { initRibbon, initMarquee, initBeforeAfter, initSpeed, initFlowNodes } from './demos.js';

const root = document.documentElement;
// GSAP is loaded after the first paint (see loadMotion), so these are filled in later.
let gsap;
let ScrollTrigger;
let hasGsap = false;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const locale = root.lang === 'de' ? 'de-AT' : 'en-GB';
// The calculator's count-up tween; the first keystroke kills it, so it never overwrites the reader's numbers.
let calcCountUp = null;
// matchMedia runs a handler only while at least one condition matches, so both
// widths are listed; otherwise phones without reduced motion would get no handler at all.
const CONDITIONS = {
  isDesktop: '(min-width: 800px)',
  isMobile: '(max-width: 799.98px)',
  reduceMotion: '(prefers-reduced-motion: reduce)',
};

initNav();
initHeader();
initCalculator();
initPriceDetails();
initRibbon();
initMarquee();
initFlowNodes();
initSpeed();
const home = Boolean(document.querySelector('.hero'));
// Mascots (home pages): their own module, so the legal pages never load it.
const mascots = document.querySelector('.mascot') ? import('./mascots.js').then((m) => { m.initMascots(); return m; }).catch(() => null) : null;
// Resolves to { gsap, ScrollTrigger } once the animation code is there, or null (no library).
const motion = home ? loadMotion() : Promise.resolve(null);
const ctx = { motion, reduceMotion, locale };
// The story pins, so it is set up as soon as GSAP is there (a pin added later above the reader would make the page jump).
initBeforeAfter(motion);
if (home) motion.then(() => import('./story.js')).then((m) => m.init(ctx)).catch(report);
lazy('#problems', () => import('./fixdemos.js'));
lazy('.tariff__group--1', () => import('./prices.js'));
lazy('.kidemo', () => import('./kidemo.js'));
lazy('#finder', () => import('./chat.js'));
lazy('#process', () => import('./sections.js'));
lazy('#faq', () => import('./faqbox.js'));
lazy('#contact', () => import('./contact.js'));

function report(e) { console.error(e); }

// Imports a section module when its section is within one viewport of the screen.
function lazy(sel, load) {
  const el = document.querySelector(sel);
  if (!el) return;
  const go = () => load().then((m) => m.init(ctx)).then(() => motion.then((mo) => mo?.refresh())).catch(report);
  if (!('IntersectionObserver' in window)) { go(); return; }
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) { io.disconnect(); go(); }
  }, { rootMargin: '100% 0px' });
  io.observe(el);
}

// The self-hosted GSAP files are fetched only after the page has loaded and painted, so the
// headline (LCP) never waits for 50 KB of animation code on a slow phone.
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
  ({ gsap, ScrollTrigger } = window);
  hasGsap = Boolean(gsap && ScrollTrigger);
  if (!hasGsap) return null;
  gsap.registerPlugin(ScrollTrigger);
  initCalcCountUp();
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

/* ---------- KI-Rechner: the example numbers count up once in view ---------- */
function initCalcCountUp() {
  const form = document.getElementById('ki-rechner');
  if (!form || reduceMotion.matches) return;
  const out = (name) => form.querySelector(`[data-out="${name}"]`);
  const value = (name) => Number(form.elements[name].value) || 0;
  ScrollTrigger.create({
    trigger: form, start: 'top 85%', once: true,
    onEnter: () => {
      if (form.dataset.touched) return; // the reader already typed: show their numbers
      const target = calcSavings({ emailsPerWeek: value('emails'), minutesPerReply: value('minutes'), sharePercent: value('share'), hourlyRate: value('rate') });
      const k = { v: 0 };
      const render = () => {
        const f = formatResult({ hoursPerMonth: target.hoursPerMonth * k.v, savedHours: target.savedHours * k.v, savedEur: target.savedEur * k.v }, form.dataset.locale || locale);
        out('h').textContent = f.h;
        out('savedH').textContent = f.savedH;
        out('savedEur').textContent = f.savedEur;
      };
      calcCountUp = gsap.fromTo(k, { v: 0 }, { v: 1, duration: 1.2, ease: 'power2.out', onUpdate: render, onComplete: () => { calcCountUp = null; } });
    },
  });
}

/* ---------- Price details: height animation on open and close ---------- */
function initPriceDetails() {
  for (const details of document.querySelectorAll('details.price-details')) {
    const summary = details.querySelector('summary');
    const body = details.querySelector('.price-details__body');
    summary.addEventListener('click', (e) => {
      if (!hasGsap || reduceMotion.matches) return; // native, instant toggle
      e.preventDefault();
      const closing = details.classList.contains('is-closing');
      gsap.killTweensOf(body);
      if (!details.open || closing) {
        const from = closing ? body.offsetHeight : 0;
        details.classList.remove('is-closing');
        details.open = true;
        gsap.fromTo(body, { height: from }, { height: 'auto', duration: 0.3, ease: 'power2.out', clearProps: 'height' });
      } else {
        details.classList.add('is-closing');
        gsap.fromTo(body, { height: body.offsetHeight }, {
          height: 0, duration: 0.25, ease: 'power2.in',
          onComplete: () => {
            details.open = false;
            details.classList.remove('is-closing');
            gsap.set(body, { clearProps: 'height' });
          },
        });
      }
    });
  }
}

/* ---------- KI-Rechner ---------- */
function initCalculator() {
  const form = document.getElementById('ki-rechner');
  if (!form) return;
  const fmtLocale = form.dataset.locale || locale;
  const field = (name) => form.elements[name];
  const outs = {
    h: form.querySelector('[data-out="h"]'),
    savedH: form.querySelector('[data-out="savedH"]'),
    savedEur: form.querySelector('[data-out="savedEur"]'),
  };
  const result = form.querySelector('.calc__result');
  const live = document.getElementById('calc-live');
  const read = () => {
    const v = (name) => toNumber(field(name).value, { min: Number(field(name).min), max: Number(field(name).max) });
    return { emailsPerWeek: v('emails'), minutesPerReply: v('minutes'), sharePercent: v('share'), hourlyRate: v('rate') };
  };
  const render = (values, target = outs) => {
    const f = formatResult(values, fmtLocale);
    target.h.textContent = f.h;
    target.savedH.textContent = f.savedH;
    target.savedEur.textContent = f.savedEur;
  };
  // One announcement with the final numbers, not one per animation frame.
  const finalSentence = (values) => {
    const copy = result.cloneNode(true);
    render(values, {
      h: copy.querySelector('[data-out="h"]'),
      savedH: copy.querySelector('[data-out="savedH"]'),
      savedEur: copy.querySelector('[data-out="savedEur"]'),
    });
    return copy.textContent.replace(/\s+/g, ' ').trim();
  };

  const shown = calcSavings(read());
  let liveTimer;
  root.classList.add('calc-ready');
  form.addEventListener('submit', (e) => e.preventDefault());
  form.addEventListener('input', () => {
    form.dataset.touched = '1';
    if (calcCountUp) { calcCountUp.kill(); calcCountUp = null; }
    const target = calcSavings(read());
    if (hasGsap && !reduceMotion.matches) {
      gsap.to(shown, { ...target, duration: 0.4, ease: 'power2.out', overwrite: true, onUpdate: () => render(shown) });
    } else {
      Object.assign(shown, target);
      render(shown);
    }
    clearTimeout(liveTimer);
    liveTimer = setTimeout(() => { live.textContent = finalSentence(target); }, 400);
  });
}
