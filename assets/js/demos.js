// Stage 2 demos. Every demo starts from its final state in the HTML; these functions only
// add motion or interaction on top. Loops go through loops.js (pause button, off-screen stop).
import { loop } from './loops.js';

/* ---------- Hero ribbon: SMIL text along two curves ---------- */
export function initRibbon() {
  const svgs = [...document.querySelectorAll('.ribbon')];
  if (!svgs.length) return;
  // Each text holds the steps three times; moving it by one third loops seamlessly.
  const anims = svgs.map((svg, i) => {
    const third = svg.querySelector('text').getComputedTextLength() / 3;
    const a = svg.querySelector('animate');
    a.setAttribute('from', i ? String(-third) : '0');
    a.setAttribute('to', i ? '0' : String(-third));
    return a;
  });
  let begun = false;
  loop({
    root: document.querySelector('.hero__visual'),
    button: document.querySelector('.hero .loop-btn'),
    play: () => {
      if (!begun) { begun = true; anims.forEach((a) => a.beginElement()); }
      svgs.forEach((svg) => svg.unpauseAnimations());
    },
    pause: () => svgs.forEach((svg) => svg.pauseAnimations()),
  });
}

/* ---------- Tool marquee: CSS loop, hover pauses in CSS ---------- */
export function initMarquee() {
  const marquee = document.querySelector('.marquee');
  if (!marquee) return;
  loop({
    root: marquee,
    button: marquee.parentElement.querySelector('.loop-btn'),
    play: () => marquee.classList.add('is-running'),
    pause: () => marquee.classList.remove('is-running'),
  });
}

/* ---------- Before/after: the range value moves the clip and the divider ---------- */
export function initBeforeAfter() {
  const fig = document.querySelector('.ba');
  if (!fig) return;
  const stage = fig.querySelector('.ba__stage');
  const range = fig.querySelector('.ba__range');
  const set = () => stage.style.setProperty('--pos', `${range.value}%`);
  range.addEventListener('input', set);
  set();
}

/* ---------- 3-step story: tabs everywhere, pinned and scroll-driven on wide screens ---------- */
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
let story = null;

export function initStory() {
  const root = document.querySelector('.story');
  if (!root) return;
  const list = root.querySelector('.story__steps');
  const panels = [...root.querySelectorAll('.story__panel')];
  list.setAttribute('role', 'tablist');
  const tabs = [...list.children].map((li, i) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'story__tab';
    tab.id = `story-tab-${i + 1}`;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panels[i].id);
    tab.append(...li.childNodes);
    li.append(tab);
    li.setAttribute('role', 'presentation');
    panels[i].setAttribute('role', 'tabpanel');
    panels[i].setAttribute('aria-labelledby', tab.id);
    return tab;
  });
  let current = -1;
  let pick = null; // set while pinned: a tab then scrolls to its step
  let pinned = false;
  const show = (i) => {
    if (i === current) return;
    current = i;
    tabs.forEach((tab, k) => { tab.setAttribute('aria-selected', String(k === i)); tab.tabIndex = k === i ? 0 : -1; });
    panels.forEach((p, k) => { p.classList.toggle('is-active', k === i); p.inert = k !== i; });
    if (!pinned) root.style.setProperty('--progress', String((i + 1) / panels.length));
    document.dispatchEvent(new CustomEvent('story:show', { detail: i }));
  };
  const choose = (i) => (pick ? pick(i) : show(i));
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => choose(i));
    tab.addEventListener('keydown', (e) => {
      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      const n = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : step ? (current + step + tabs.length) % tabs.length : -1;
      if (n < 0) return;
      e.preventDefault();
      choose(n);
      tabs[n].focus();
    });
  });
  root.classList.add('is-tabs');
  show(0);
  story = {
    root, show, panels,
    get current() { return current; },
    pin(fn) { pick = fn; pinned = Boolean(fn); root.classList.toggle('is-pinned', pinned); },
  };
  initFormFill();
  initToasts();
}

// Wide screens, motion allowed: the story stays in place while the scroll moves it through
// its three steps (the progress bar follows the scroll). matchMedia undoes it on resize.
export function pinStory(gsap, ScrollTrigger) {
  if (!story) return;
  gsap.matchMedia().add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
    const { root, panels } = story;
    if (root.offsetHeight > innerHeight - 140) return undefined; // too tall to pin here: tabs stay
    const st = ScrollTrigger.create({
      trigger: root,
      pin: true,
      start: 'center center',
      end: () => `+=${Math.round(innerHeight * 1.5)}`,
      onUpdate: (self) => {
        root.style.setProperty('--progress', self.progress.toFixed(3));
        story.show(Math.min(panels.length - 1, Math.floor(self.progress * panels.length)));
      },
    });
    story.pin((i) => window.scrollTo({ top: st.start + (st.end - st.start) * ((i + 0.5) / panels.length), behavior: 'auto' }));
    return () => story.pin(null);
  });
}

// Step 1: the form fills itself each time the step is shown (motion allowed).
function initFormFill() {
  const values = [...document.querySelectorAll('.story__form .story__value')];
  if (!values.length || reduceMotion.matches) return;
  const texts = values.map((v) => v.textContent);
  let timer;
  document.addEventListener('story:show', (e) => {
    if (e.detail !== 0) return;
    clearInterval(timer);
    values.forEach((v) => { v.textContent = ''; });
    let field = 0;
    let n = 0;
    timer = setInterval(() => {
      n += 1;
      values[field].textContent = texts[field].slice(0, n);
      if (n >= texts[field].length) { field += 1; n = 0; }
      if (field >= values.length) clearInterval(timer);
    }, 55);
  });
}

// Step 3: notifications pop in one by one and stack; loops while shown and on screen.
function initToasts() {
  const box = document.querySelector('.toasts');
  if (!box) return;
  const toasts = [...box.querySelectorAll('.toast')];
  const panel = box.closest('.story__panel');
  let timers = [];
  const clear = () => { timers.forEach(clearTimeout); timers = []; };
  const cycle = () => {
    toasts.forEach((t) => t.classList.remove('is-in'));
    toasts.forEach((t, i) => timers.push(setTimeout(() => t.classList.add('is-in'), 500 + i * 900)));
    timers.push(setTimeout(() => toasts.forEach((t) => t.classList.remove('is-in')), 500 + toasts.length * 900 + 2600));
    timers.push(setTimeout(cycle, 500 + toasts.length * 900 + 3300));
  };
  const ctl = loop({
    root: box,
    button: box.querySelector('.loop-btn'),
    when: () => !panel || panel.classList.contains('is-active'),
    play: () => { box.classList.add('is-live'); clear(); cycle(); },
    pause: () => { clear(); box.classList.remove('is-live'); },
  });
  if (ctl) document.addEventListener('story:show', ctl.sync);
}
