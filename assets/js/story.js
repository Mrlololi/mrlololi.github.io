// Stage 4, «Was passiert, wenn sich jemand anmeldet»: one screen, four panes running together.
// The HTML is the finished run. With motion it plays on every entry (with «Anna K.») and on submit
// (with the typed name), about 4 s; «Nochmal abspielen» and the pause button sit in the frame.
// Wide screens: pinned for at most one screen while it plays. Phones: the panes are tabs that
// follow the run. Reduced motion or no GSAP: final state; submit only puts the name in.
import { scene } from './loops.js';
import { firstName } from './pure.js';

// ms on the demo clock for each log step (0,2 s ... 2,3 s are its labels): 1.5x slower to watch.
const SPEED = 1500;
const PHASES = ['form', 'flow', 'phone', 'course'];

export async function init({ motion, reduceMotion, locale }) {
  const root = document.querySelector('.story');
  if (!root) return;
  const m = await motion;
  const gsap = m?.gsap;
  const screen = root.querySelector('.screen');
  const panes = [...screen.querySelectorAll('.pane')];
  const legend = [...root.querySelectorAll('.story__step')];
  const nodes = [...screen.querySelectorAll('.anode')];
  const mails = [...screen.querySelectorAll('.pmail')];
  const toasts = [...screen.querySelectorAll('.toast')];
  const run = screen.querySelector('.run');
  const steps = [...run.querySelectorAll('.run__step')].map((li) => ({ li, time: li.querySelector('.run__time'), seconds: Number(li.dataset.seconds) }));
  const summary = run.querySelector('.run__summary');
  const replay = run.querySelector('.run__replay');
  const status = document.getElementById('run-status');
  const pause = screen.querySelector('.loop-btn');
  const fmt = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const tabs = mobileTabs(screen, panes);
  const narrow = matchMedia('(max-width: 767.98px)');

  const setName = (full) => {
    document.querySelectorAll('.js-first').forEach((el) => { el.textContent = firstName(full); });
    document.querySelectorAll('.js-name').forEach((el) => { el.textContent = full; });
  };
  const announce = () => { status.textContent = ''; requestAnimationFrame(() => { status.textContent = summary.textContent; }); };

  // Everything off (the start of a run) or on (the HTML's finished state).
  const show = (on) => {
    screen.classList.toggle('is-off', !on);
    for (const el of [...nodes, ...mails, ...toasts, ...steps.map((s) => s.li), ...panes, ...legend]) el.classList.toggle('is-on', on);
    steps.forEach((s) => { s.time.textContent = `${fmt.format(s.seconds)} s`; });
    root.style.setProperty('--progress', on ? '1' : '0');
  };
  const phase = (i) => {
    legend.forEach((li, k) => li.classList.toggle('is-active', k === Math.min(2, Math.max(0, i - 1))));
    panes.forEach((p, k) => p.classList.toggle('is-current', k === i));
    if (narrow.matches && !tabs.picked) tabs.select(i, false);
  };

  replay.hidden = false;
  if (!gsap || reduceMotion.matches) {
    // No motion: the finished run stays; submit and «Nochmal» only confirm it.
    wireForm(() => { announce(); tabs?.select(3, false); }, setName);
    replay.addEventListener('click', announce);
    return;
  }

  const tl = gsap.timeline({ paused: true, onComplete: () => { screen.classList.remove('is-running'); announce(); } });
  const at = (s) => s * SPEED / 1000;
  const start = () => { show(false); screen.classList.add('is-running'); if (tabs) tabs.picked = false; phase(0); panes[0].classList.add('is-on'); legend[0].classList.add('is-on'); };
  tl.to(root, { '--progress': 1, duration: at(2.6), ease: 'none' }, 0)
    .call(() => { screen.querySelector('.story__form .btn')?.classList.add('is-pressed'); }, null, 0.1)
    .call(() => { screen.querySelector('.story__form .btn')?.classList.remove('is-pressed'); phase(1); panes[1].classList.add('is-on'); legend[1].classList.add('is-on'); }, null, at(0.25));
  // Nodes light in order along the log's clock.
  const nodeAt = [0.2, 0.4, 0.5, 0.6, 1.2, 1.4, 1.9];
  nodes.forEach((n, i) => tl.call(() => n.classList.add('is-on'), null, at(nodeAt[i])));
  steps.forEach((s, i) => {
    const k = { v: 0 };
    tl.call(() => s.li.classList.add('is-on'), null, at(s.seconds) - 0.15)
      .fromTo(k, { v: i ? steps[i - 1].seconds : 0 }, { v: s.seconds, duration: 0.15, ease: 'none', onUpdate: () => { s.time.textContent = `${fmt.format(k.v)} s`; } }, at(s.seconds) - 0.15);
  });
  tl.call(() => { phase(2); panes[2].classList.add('is-on'); mails[0].classList.add('is-on'); }, null, at(0.45))
    .call(() => { phase(1); }, null, at(0.9))
    .call(() => { phase(3); panes[3].classList.add('is-on'); legend[2].classList.add('is-on'); }, null, at(1.9))
    .call(() => { phase(2); mails[1].classList.add('is-on'); }, null, at(2.3))
    .call(() => phase(3), null, at(2.6));
  toasts.forEach((x, i) => tl.call(() => x.classList.add('is-on'), null, at([0.2, 1.4, 1.9, 2.3][i] ?? 2.3)));
  tl.call(() => {}, null, at(2.3) + 0.8); // let the last toast and the party breathe

  let paused = false;
  const play = () => { if (paused) return; start(); tl.restart(); };
  const finish = () => { tl.pause(); show(true); screen.classList.remove('is-running'); phase(3); };
  replay.addEventListener('click', () => { paused = false; syncPause(); play(); });
  wireForm(play, setName);

  // The pause button holds the run (and the bouncing trio and confetti, via .is-paused).
  const syncPause = () => {
    pause.classList.toggle('is-paused', paused);
    screen.classList.toggle('is-paused', paused);
    const label = paused ? pause.dataset.play : pause.dataset.pause;
    pause.setAttribute('aria-label', label);
    pause.querySelector('.loop-btn__tip').textContent = label;
  };
  pause.hidden = false;
  pause.addEventListener('click', () => {
    paused = !paused;
    syncPause();
    if (paused) tl.pause();
    else if (tl.progress() < 1) tl.resume();
  });

  // Auto-plays on every entry with «Anna K.» (or the name typed before); stops when it leaves.
  scene(screen, { enter: play, leave: finish, threshold: 0.45 });
  reduceMotion.addEventListener('change', () => { if (reduceMotion.matches) finish(); });

  // Wide screens: held in place for part of a screen while it plays (at most one viewport).
  gsap.matchMedia().add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
    if (root.offsetHeight > innerHeight - 120) return undefined; // too tall to pin here
    m.ScrollTrigger.create({ trigger: root, pin: true, start: 'center center', end: '+=70%', refreshPriority: 1 });
    return undefined;
  });
  m.refresh();
}

// Step 1 is a real local form: it checks the e-mail, takes the typed name and plays the run.
function wireForm(play, setName) {
  const form = document.querySelector('.story__form');
  if (!form) return;
  const { name, email } = form.elements;
  const error = document.getElementById(email.getAttribute('aria-describedby'));
  const valid = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
  email.addEventListener('input', () => {
    if (!error.hidden && valid(email.value)) { error.hidden = true; email.removeAttribute('aria-invalid'); }
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!valid(email.value)) {
      error.hidden = false;
      email.setAttribute('aria-invalid', 'true');
      email.focus();
      return;
    }
    error.hidden = true;
    email.removeAttribute('aria-invalid');
    setName(name.value.trim() || name.defaultValue);
    play();
  });
}

// Phones: the four panes become tabs (arrow keys, Home, End); the run moves the selection along
// unless the visitor picked a tab themselves. Wide screens: all four stand side by side.
function mobileTabs(screen, panes) {
  const list = document.createElement('div');
  list.className = 'screen__tabs';
  list.setAttribute('role', 'tablist');
  list.setAttribute('aria-label', screen.getAttribute('aria-label'));
  let current = 0;
  const tabs = panes.map((pane, i) => {
    const title = pane.querySelector('.pane__title');
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'screen__tab';
    tab.id = `story-tab-${i + 1}`;
    tab.textContent = title.textContent;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', pane.id);
    pane.setAttribute('role', 'tabpanel');
    pane.setAttribute('aria-labelledby', tab.id);
    list.append(tab);
    return tab;
  });
  const select = (i, focus) => {
    current = i;
    tabs.forEach((tab, k) => { tab.setAttribute('aria-selected', String(k === i)); tab.tabIndex = k === i ? 0 : -1; });
    panes.forEach((p, k) => p.classList.toggle('is-shown', k === i));
    if (focus) tabs[i].focus();
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => { api.picked = true; select(i, false); });
    tab.addEventListener('keydown', (e) => {
      const to = { ArrowRight: current + 1, ArrowLeft: current - 1, Home: 0, End: tabs.length - 1 }[e.key];
      if (to === undefined) return;
      e.preventDefault();
      api.picked = true;
      select((to + tabs.length) % tabs.length, true);
    });
  });
  screen.querySelector('.screen__panes').before(list);
  screen.classList.add('has-tabs');
  const api = { select, picked: false };
  select(0, false);
  return api;
}
