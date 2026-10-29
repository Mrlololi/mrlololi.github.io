// Stage 6e, «Ablauf selbst ausprobieren»: the run-log demo opens in place under the video. Its CSS
// and this file load only on the first click (main.js); the markup comes from a <template>. While
// open and visible it loops (loops.js, with its pause button): step 1 the form sends, step 2 the
// automation runs and the inbox gets its mails, step 3 the course opens; the log ticks along. One
// pane is in focus at a time; the step buttons jump to their step. The form is real and local:
// it checks the e-mail and plays the run with the typed name (nothing is sent anywhere).
import { demo } from './loops.js';
import { firstName } from './pure.js';

// 30.10.2026: 1 s on the start frame after opening, then about 6.5 s per run and 3 s on the end frame.
const SPEED = 2500; // ms per second of the log's clock (0,2 s ... 2,3 s): slow motion, noted under the screen
const FIRST = 1000;
const LAST = 2.6; // the course pane comes back into focus last
const NODE_AT = [0.2, 0.4, 0.5, 0.6, 1.2, 1.4, 1.9];

export function open(slot, tpl, { locale }) {
  slot.append(tpl.content.cloneNode(true));
  const root = slot.querySelector('.runlog');
  const screen = root.querySelector('.screen');
  const panes = [...screen.querySelectorAll('.pane')];
  const stepButtons = [...root.querySelectorAll('.runlog__step')];
  const nodes = [...screen.querySelectorAll('.anode')];
  const mails = [...screen.querySelectorAll('.pmail')];
  const log = [...screen.querySelectorAll('.run__step')].map((li) => ({ li, time: li.querySelector('.run__time'), s: Number(li.dataset.seconds) }));
  const summary = screen.querySelector('.run__summary');
  const status = root.querySelector('.runlog__status');
  const fmt = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  let timers = [];
  const at = (sec, fn) => timers.push(setTimeout(fn, sec * SPEED));
  const clear = () => { timers.forEach(clearTimeout); timers = []; };

  // The pane in focus (0 form, 1 automation, 2 inbox, 3 course) and the step it belongs to.
  const focus = (i) => {
    panes.forEach((p, k) => p.classList.toggle('is-current', k === i));
    const step = Number(panes[i].dataset.step);
    root.dataset.step = String(step);
    stepButtons.forEach((b, k) => (k === step ? b.setAttribute('aria-current', 'step') : b.removeAttribute('aria-current')));
  };
  // A frame: everything up to a step is done (0, 1 or 2), the rest still waits.
  const frame = (step) => {
    clear();
    const upto = [0.25, 1.4, 2.3][step];
    nodes.forEach((n, i) => n.classList.toggle('is-on', NODE_AT[i] <= upto));
    mails[0].classList.toggle('is-on', step >= 1);
    mails[1].classList.toggle('is-on', step >= 2);
    log.forEach((x) => { x.li.classList.toggle('is-on', x.s <= upto); x.time.textContent = `${fmt.format(x.s)} s`; });
    screen.classList.toggle('is-done', step === 2);
    focus([0, 1, 3][step]);
  };
  const reset = () => {
    clear();
    nodes.forEach((n) => n.classList.remove('is-on'));
    mails.forEach((m) => m.classList.remove('is-on'));
    log.forEach((x) => { x.li.classList.remove('is-on'); x.time.textContent = `${fmt.format(0)} s`; });
    screen.classList.remove('is-done');
    focus(0);
  };
  const finish = () => { frame(2); status.textContent = summary.textContent; };
  const play = () => {
    at(0.25, () => focus(1));
    NODE_AT.forEach((s, i) => at(s, () => nodes[i].classList.add('is-on')));
    log.forEach((x) => at(x.s, () => { x.li.classList.add('is-on'); x.time.textContent = `${fmt.format(x.s)} s`; }));
    at(0.45, () => { focus(2); mails[0].classList.add('is-on'); });
    at(0.9, () => focus(1));
    at(1.9, () => { focus(3); screen.classList.add('is-done'); });
    at(2.3, () => { focus(2); mails[1].classList.add('is-on'); });
    at(LAST, () => focus(3));
    return LAST * SPEED;
  };
  // The first round waits a second, so the opened demo is seen at rest before it moves.
  reset();
  root.dataset.play = 'start';
  let d = null;
  const ready = new Promise((resolve) => setTimeout(() => {
    d = demo(root, { reset, play, finish, rest: 3000, frames: 3, frame, button: root.querySelector('.runlog__ctl .loopctl') });
    resolve(d);
  }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : FIRST));

  stepButtons.forEach((b, i) => b.addEventListener('click', () => { d?.skip(); frame(i); }));
  root.querySelector('.runlog__replay').addEventListener('click', () => d?.replay());
  wireForm(root, () => d?.replay());
  return ready;
}

// Step 1 is a real local form: it checks the e-mail, takes the typed name and plays the run.
function wireForm(root, play) {
  const form = root.querySelector('.story__form');
  if (!form) return;
  const { name, email } = form.elements;
  const error = root.querySelector('.story__error');
  const valid = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
  email.addEventListener('input', () => { if (!error.hidden && valid(email.value)) { error.hidden = true; email.removeAttribute('aria-invalid'); } });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!valid(email.value)) { error.hidden = false; email.setAttribute('aria-invalid', 'true'); email.focus(); return; }
    error.hidden = true;
    email.removeAttribute('aria-invalid');
    const full = name.value.trim() || name.defaultValue;
    root.querySelectorAll('.js-first').forEach((el) => { el.textContent = firstName(full); });
    play();
  });
}
