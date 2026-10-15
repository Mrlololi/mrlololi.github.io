// mrlololi: navigation, hero run log, problems repair, price details, KI-Rechner.
// Progressive enhancement: the HTML/CSS already shows every final state; this file only
// rewinds and plays them back. Without GSAP (or with reduced motion) nothing moves.
import { calcSavings, formatResult, toNumber } from './calc.js';

const root = document.documentElement;
const { gsap, ScrollTrigger, SplitText } = window;
const hasGsap = Boolean(gsap && ScrollTrigger);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const locale = root.lang === 'de' ? 'de-AT' : 'en-GB';
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

if (hasGsap) {
  gsap.registerPlugin(ScrollTrigger, ...(SplitText ? [SplitText] : []));
  const mm = gsap.matchMedia();
  initRun(mm);
  initProblems(mm);
} else {
  root.classList.remove('h1-pending');
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

/* ---------- Hero: the automation run (the one orchestrated load moment) ---------- */
function initRun(mm) {
  const run = document.querySelector('.run');
  if (!run) { root.classList.remove('h1-pending'); return; }
  const h1 = document.querySelector('.hero h1');
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
  let played = false; // the load sequence runs once; later breakpoint changes only rebuild
  let h1Done = false;
  replay.hidden = false;

  const announce = () => {
    status.textContent = '';
    requestAnimationFrame(() => { status.textContent = summary.textContent; });
  };

  mm.add(CONDITIONS, (ctx) => {
    const { isDesktop, reduceMotion: reduced } = ctx.conditions;

    if (reduced) {
      // Final state is the CSS default. Replay just confirms the result for screen readers.
      root.classList.remove('h1-pending');
      replay.addEventListener('click', announce);
      return () => replay.removeEventListener('click', announce);
    }

    const tl = buildRunTimeline(steps, summary, seconds);
    let replayed = false; // announce the result only after a replay, not on page load
    tl.eventCallback('onComplete', () => { if (replayed) { replayed = false; announce(); } });

    const onReplay = () => {
      if (tl.isActive()) return; // ignore clicks while it runs
      replayed = true;
      tl.restart();
    };
    replay.addEventListener('click', onReplay);

    if (played) {
      tl.progress(1);
    } else if (isDesktop && h1 && SplitText && !h1Done) {
      h1Done = true;
      revealHeadline(h1, run).then(() => { played = true; tl.restart(true); });
    } else {
      root.classList.remove('h1-pending');
      // On phones the log sits below the fold: start it when it scrolls into view.
      const start = () => { played = true; tl.restart(true); };
      const r = run.getBoundingClientRect();
      if (r.top < innerHeight * 0.85) start();
      else ScrollTrigger.create({ trigger: run, start: 'top 85%', once: true, onEnter: start });
    }
    return () => replay.removeEventListener('click', onReplay);
  });
}

function buildRunTimeline(steps, summary, seconds) {
  const tl = gsap.timeline({ paused: true, delay: 0.3, defaults: { ease: 'power2.out' } });
  const STEP = 0.28;
  const first = 0.15;
  tl.fromTo(steps.map((s) => s.wait), { autoAlpha: 0 }, { autoAlpha: 0, duration: 0 }, 0)
    .fromTo(steps.map((s) => s.done), { autoAlpha: 0 }, { autoAlpha: 0, duration: 0 }, 0)
    .fromTo(steps.map((s) => s.check), { strokeDashoffset: 1 }, { strokeDashoffset: 1, duration: 0 }, 0)
    .fromTo(steps.map((s) => s.time), { autoAlpha: 0 }, { autoAlpha: 0, duration: 0 }, 0)
    .fromTo(steps.filter((s) => s.link).map((s) => s.link), { strokeDashoffset: 1 }, { strokeDashoffset: 1, duration: 0 }, 0)
    .fromTo(summary, { autoAlpha: 0 }, { autoAlpha: 0, duration: 0 }, 0);

  steps.forEach((s, i) => {
    const at = first + i * STEP;
    const counter = { v: 0 };
    tl.to(s.wait, { autoAlpha: 1, duration: 0.12 }, at)
      .to(s.done, { autoAlpha: 1, duration: 0.16 }, at + 0.16)
      .to(s.check, { strokeDashoffset: 0, duration: 0.2 }, at + 0.2)
      .to(s.time, { autoAlpha: 1, duration: 0.1 }, at + 0.18)
      .fromTo(counter, { v: 0 }, {
        v: s.seconds, duration: 0.24, ease: 'none',
        onUpdate: () => { s.time.textContent = `${seconds.format(counter.v)} s`; },
      }, at + 0.18);
    if (s.link) tl.to(s.link, { strokeDashoffset: 0, duration: 0.2, ease: 'none' }, at + 0.3);
  });
  tl.to(summary, { autoAlpha: 1, duration: 0.25 }, first + steps.length * STEP + 0.12);
  return tl; // about 2.2 s including the 0.3 s delay
}

// Line reveal of the H1 while the log frame comes in, after fonts are ready.
// Skipped if the fonts arrive late, so a reader never sees the headline vanish and come back.
function revealHeadline(h1, frame) {
  return document.fonts.ready.then(() => {
    if (performance.now() > 1500) { root.classList.remove('h1-pending'); return; }
    const split = SplitText.create(h1, { type: 'lines', mask: 'lines' });
    gsap.timeline({ onComplete: () => split.revert() })
      .from(split.lines, { yPercent: 100, duration: 0.7, stagger: 0.08, ease: 'power3.out' }, 0)
      .from(frame, { autoAlpha: 0, y: 16, duration: 0.6, ease: 'power2.out' }, 0.1);
    root.classList.remove('h1-pending');
    return new Promise((resolve) => gsap.delayedCall(0.15, resolve));
  });
}

/* ---------- Problems: scroll-linked repair ---------- */
function initProblems(mm) {
  const section = document.querySelector('.problems');
  if (!section) return;
  const list = section.querySelector('.pairs');
  const pairs = [...list.children];
  const layers = (node) => [node.querySelector('.node__broken'), node.querySelector('.node__fixed')];

  mm.add(CONDITIONS, (ctx) => {
    const { isDesktop, reduceMotion: reduced } = ctx.conditions;
    if (reduced) return; // repaired state stays

    if (isDesktop) {
      const nodes = [...section.querySelectorAll('.flow__node')].map(layers);
      const gaps = [...section.querySelectorAll('.flow__gap')];
      gsap.set(nodes.map(([broken]) => broken), { autoAlpha: 1 });
      gsap.set(nodes.map(([, fixed]) => fixed), { autoAlpha: 0 });
      gsap.set(gaps, { scaleY: 0 });

      // Viewport centre travels over the list from 0 to 1; each node repairs as its pair crosses it.
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: list, start: 'top center', end: 'bottom center', scrub: true },
      });
      const box = list.getBoundingClientRect();
      pairs.forEach((pair, i) => {
        const r = pair.getBoundingClientRect();
        const at = Math.max(0, (r.top + r.height / 2 - box.top) / box.height - 0.1);
        tl.to(gaps[i], { scaleY: 1, duration: 0.05 }, at)
          .to(nodes[i][0], { autoAlpha: 0, duration: 0.04 }, at + 0.03)
          .to(nodes[i][1], { autoAlpha: 1, duration: 0.04 }, at + 0.03);
      });
      tl.set({}, {}, 1); // timeline length 1 = scroll progress 0..1
      return;
    }

    // Phones: each inline node repairs once when its pair enters the viewport.
    const inline = pairs.map((p) => layers(p.querySelector('.pair__node')));
    gsap.set(inline.map(([broken]) => broken), { autoAlpha: 1 });
    gsap.set(inline.map(([, fixed]) => fixed), { autoAlpha: 0 });
    ScrollTrigger.batch(pairs, {
      start: 'top 70%',
      once: true,
      onEnter: (entered) => {
        entered.forEach((pair, i) => {
          const [broken, fixed] = inline[pairs.indexOf(pair)];
          gsap.timeline({ delay: i * 0.12 })
            .to(broken, { autoAlpha: 0, duration: 0.2 })
            .fromTo(fixed, { autoAlpha: 0, scale: 0.85, transformOrigin: '50% 50%' }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'power2.out' }, 0.1);
        });
      },
    });
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
