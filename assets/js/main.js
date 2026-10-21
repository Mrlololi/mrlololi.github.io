// mrlololi: navigation, run log, problem cards, path line, price details, KI-Rechner.
// Progressive enhancement: the HTML/CSS already shows every final state; this file only
// rewinds and plays them back. Without GSAP (or with reduced motion) nothing moves.
import { calcSavings, formatResult, toNumber } from './calc.js';
import { initRibbon, initMarquee, initBeforeAfter, initStory, pinStory, initTone, initKiDemo, initSpeed, initFinder, initFaqChat, driftQuotes, initKiActions, initFlowNodes } from './demos.js';

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
initReveals();
initRibbon();
initMarquee();
initBeforeAfter();
initStory();
initTone();
initKiDemo();
initSpeed();
initFinder();
initFaqChat();
initKiActions();
initFlowNodes();
if (document.querySelector('.run')) loadMotion();
else releasePending();

// Drops the class that holds the run log for its entrance (set in <head>).
function releasePending() {
  root.classList.remove('run-pending');
}

// The self-hosted GSAP files are fetched only after the page has loaded and painted, so the
// headline (LCP) never waits for 50 KB of animation code on a slow phone.
async function loadMotion() {
  // The run log sits below the fold, so the animation code can wait for load and an idle moment.
  await new Promise((resolve) => {
    const idle = () => ('requestIdleCallback' in window ? requestIdleCallback(() => resolve(), { timeout: 1200 }) : setTimeout(resolve, 200));
    if (document.readyState === 'complete') idle();
    else addEventListener('load', idle, { once: true });
  });
  const load = (src) => new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.append(s);
  });
  try {
    await load('/assets/vendor/gsap.min.js');
    await load('/assets/vendor/ScrollTrigger.min.js');
  } catch {
    releasePending(); // no animation library: everything stays in its final state
    return;
  }
  ({ gsap, ScrollTrigger } = window);
  hasGsap = Boolean(gsap && ScrollTrigger);
  if (!hasGsap) { releasePending(); return; }
  gsap.registerPlugin(ScrollTrigger);
  const mm = gsap.matchMedia();
  initRun(mm);
  pinStory(gsap, ScrollTrigger);
  driftQuotes(gsap);
  initCalcCountUp();
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

/* ---------- «Was passiert, wenn sich jemand anmeldet»: the run log, once in view ---------- */
function initRun(mm) {
  const run = document.querySelector('.run');
  if (!run) { releasePending(); return; }
  const summary = run.querySelector('.run__summary');
  const replay = run.querySelector('.run__replay');
  const status = document.getElementById('run-status');
  const seconds = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const steps = [...run.querySelectorAll('.run__step')].map((li) => ({
    wait: li.querySelector('.run__wait'),
    done: li.querySelector('.run__done'),
    check: li.querySelector('.run__check'),
    link: li.querySelector('.run__link path'),
    time: li.querySelector('.run__time'),
    seconds: Number(li.dataset.seconds),
  }));
  let played = false; // the run plays once; later breakpoint changes only rebuild
  // The log is step 2 of the story: it counts as seen only while that step is shown and on screen.
  const panel = run.closest('.story__panel');
  const inView = () => (!panel || !panel.closest('.is-tabs') || panel.classList.contains('is-active'))
    && run.getBoundingClientRect().top < innerHeight * 0.85 && run.getBoundingClientRect().bottom > 0;
  // After 2 s the CSS failsafe has shown the finished log. A reader who already sees it
  // never watches it rewind; one who has not scrolled there yet still gets the run.
  const late = () => performance.now() > 1900;

  const announce = () => {
    status.textContent = '';
    requestAnimationFrame(() => { status.textContent = summary.textContent; });
  };

  mm.add(CONDITIONS, (ctx) => {
    const { reduceMotion: reduced } = ctx.conditions;

    if (reduced) {
      // Final state is the CSS default. Replay just confirms the result for screen readers.
      releasePending();
      replay.hidden = false;
      replay.addEventListener('click', announce);
      return () => replay.removeEventListener('click', announce);
    }

    // Built paused; its first tweens render the rewound state right away (same task, no paint).
    const tl = buildRunTimeline(steps, summary, seconds);
    let replayed = false; // announce the result only after a replay, not on the first run
    tl.eventCallback('onComplete', () => { if (replayed) { replayed = false; announce(); } });

    const onReplay = () => {
      if (tl.isActive()) return; // ignore clicks while it runs
      replayed = true;
      tl.restart();
    };
    replay.addEventListener('click', onReplay);

    // The replay button appears only once the run has started (or is shown finished).
    const begin = () => { played = true; replay.hidden = false; tl.restart(true); };

    if (played || (late() && inView())) {
      played = true;
      replay.hidden = false;
      tl.progress(1);
    } else if (inView()) {
      begin();
    }
    // Otherwise wait until the reader reaches it: by scrolling, or by choosing step 2.
    const tryBegin = () => { if (!played && inView()) begin(); };
    const st = played ? null : ScrollTrigger.create({ trigger: run, start: 'top 85%', onEnter: tryBegin });
    document.addEventListener('story:show', tryBegin);
    // The sign-up form in step 1 plays the run again with the visitor's own sign-up.
    const onStoryReplay = () => { played = true; replay.hidden = false; tl.restart(); };
    document.addEventListener('story:replay', onStoryReplay);
    releasePending();
    return () => {
      replay.removeEventListener('click', onReplay);
      document.removeEventListener('story:show', tryBegin);
      document.removeEventListener('story:replay', onStoryReplay);
      st?.kill();
    };
  });
}

function buildRunTimeline(steps, summary, seconds) {
  const tl = gsap.timeline({ paused: true, delay: 0.25, defaults: { ease: 'power2.out' } });
  const STEP = 0.27;
  const first = 0.15;
  tl.fromTo(steps.map((s) => s.wait), { autoAlpha: 0 }, { autoAlpha: 0, duration: 0 }, 0)
    .fromTo(steps.map((s) => s.done), { autoAlpha: 0 }, { autoAlpha: 0, duration: 0 }, 0)
    .fromTo(steps.map((s) => s.check), { strokeDashoffset: 1 }, { strokeDashoffset: 1, duration: 0 }, 0)
    .fromTo(steps.map((s) => s.time), { autoAlpha: 0 }, { autoAlpha: 0, duration: 0 }, 0)
    .fromTo(steps.filter((s) => s.link).map((s) => s.link), { strokeDashoffset: 1 }, { strokeDashoffset: 1, duration: 0 }, 0)
    .fromTo(summary, { autoAlpha: 0 }, { autoAlpha: 0, duration: 0 }, 0);

  // Per step: pending, then done with its check and time, then the connector draws down
  // to the next step, which goes pending only once the line has arrived.
  steps.forEach((s, i) => {
    const at = first + i * STEP;
    const counter = { v: 0 };
    tl.to(s.wait, { autoAlpha: 1, duration: 0.1 }, at)
      .to(s.done, { autoAlpha: 1, duration: 0.12 }, at + 0.1)
      .to(s.check, { strokeDashoffset: 0, duration: 0.12 }, at + 0.12)
      .to(s.time, { autoAlpha: 1, duration: 0.08 }, at + 0.12)
      .fromTo(counter, { v: 0 }, {
        v: s.seconds, duration: 0.2, ease: 'none',
        onUpdate: () => { s.time.textContent = `${seconds.format(counter.v)} s`; },
      }, at + 0.12);
    if (s.link) tl.to(s.link, { strokeDashoffset: 0, duration: 0.09, ease: 'none' }, at + 0.17);
  });
  tl.to(summary, { autoAlpha: 1, duration: 0.25 }, first + steps.length * STEP + 0.05);
  return tl; // 2.07 s of content + 0.25 s delay; with the 0.15 s hand-off from the reveal about 2.5 s
}

/* ---------- Problem cards and the path line: CSS transitions started once in view ---------- */
function initReveals() {
  if (reduceMotion.matches || !('IntersectionObserver' in window)) return; // final state stays
  const targets = document.querySelectorAll('.pc, .path');
  if (!targets.length) return;
  root.classList.add('anim');
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    }
  }, { threshold: 0.35 });
  targets.forEach((el) => io.observe(el));
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
