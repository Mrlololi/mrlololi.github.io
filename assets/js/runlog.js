// Stage 6f (4.11.2026), the run-log in the video frame's second tab: one purchase in six steps.
// Stage 7b (design system 5.4): a picture story under the conductor (kit/motion.js), one demo() with
// idle: 'end' and no private timer loop.
// - One beat per step, BEAT = 1800 ms: 0 to 0.4 s the dot travels to the next node, 0.4 to 1.0 s the
//   step's picto arrives on the stage and its m part moves once (CSS), 1.0 to 1.8 s reading: the node
//   gets its check, the log line lights. End: Live hops once, the summary shows, hold 4 s, soft reset
//   (450 ms fade, the conductor's is-fading), 3 rounds, then the end frame.
// - Start: «Anna» is prefilled; «Anmelden» runs the story with the typed name. Without an action it
//   starts by itself 4 s after the tab opens; focus or typing in the field cancels that.
// - A round the visitor started («Anmelden», «Nochmal abspielen») claims the stage and plays even with
//   the pointer inside; automatic rounds obey the default hold (pointer, focus or a selection inside).
// - «Zurück» / «Weiter» step by hand and stop the loop; the run-log's own «Pause» holds it.
// - Reduced motion, «Bewegung pausieren», no JS: the end frame; the buttons swap scenes at once.
// - The result is announced (polite) only after a visitor's action. Nothing is sent anywhere.
import { reduceMotion, motion, demo, stage, BEAT } from './kit/motion.js';
import { react } from './kit/mascot-react.js';

const HOLD = 4000;
const AUTO = 4000;
const ROUNDS = 3;
const READ = 1000; // after the dot (0.4 s) and the picto (0.6 s): the node check and the log line

export function open(root) {
  const steps = [...root.querySelectorAll('.rl__step')];
  const nodes = [...root.querySelectorAll('.rl__node')];
  const logs = [...root.querySelectorAll('.rl__log')];
  const total = steps.length;
  const form = root.querySelector('.rl__start');
  const input = form.querySelector('input');
  const count = root.querySelector('.rl__count');
  const status = root.querySelector('.rl__status');
  const summary = root.querySelector('.rl__summary').textContent;
  const pause = root.querySelector('.rl__pause');
  const live = root.querySelector('.rl__live svg.mascot');
  let step = total - 1;
  let clock = 0; // the beat clock of a round (it stands while the visitor paused the run-log)
  let armed = false; // the tab is open and the 4 s are over (or the visitor started it)
  let active = false;
  let userPaused = false;
  let announce = false;
  let d = null;
  const calm = () => reduceMotion.matches || motion.paused;
  const clear = () => { clearInterval(clock); clock = 0; };

  // A frame: s = current step (-1: before the first). read: its node check and log line are lit.
  const show = (s, read = true) => {
    step = s;
    root.dataset.step = String(s);
    root.style.setProperty('--at', String(Math.max(0, s)));
    steps.forEach((el, i) => { el.classList.toggle('is-done', i < s); el.classList.toggle('is-current', i === s); });
    nodes.forEach((el, i) => { el.classList.toggle('is-current', i === s); el.classList.toggle('is-done', i < s || (i === s && read)); });
    logs.forEach((el, i) => el.classList.toggle('is-on', i < s || (i === s && read)));
    root.classList.toggle('is-end', s === total - 1 && read);
    count.textContent = root.dataset.stepOf.replace('{n}', String(Math.max(1, s + 1))).replace('{total}', String(total));
    if (s === total - 1 && read && announce) { status.textContent = summary; announce = false; }
  };
  // The beats of one round, on a clock that stops while the run-log is held (paused by the visitor).
  const beats = () => {
    clear();
    const plan = [];
    for (let i = 0; i < total; i++) {
      plan.push([i * BEAT, () => show(i, false)]);
      plan.push([i * BEAT + READ, () => show(i, true)]);
    }
    plan.push([(total - 1) * BEAT + READ + 100, () => { if (live) react(live, 22); }]);
    let elapsed = 0;
    const tick = () => {
      while (plan.length && plan[0][0] <= elapsed) plan.shift()[1]();
      if (!plan.length) clear();
    };
    tick();
    // Real time counts (an interval runs late); the clock stands while the visitor paused the run-log.
    let last = performance.now();
    clock = setInterval(() => { const now = performance.now(); if (!userPaused) { elapsed += now - last; tick(); } last = now; }, 50);
    return total * BEAT;
  };
  const paint = () => {
    pause.hidden = calm() || !d?.looping;
    pause.setAttribute('aria-pressed', String(userPaused));
    pause.firstChild.textContent = userPaused ? pause.dataset.playLabel : pause.dataset.pauseLabel;
  };

  d = demo(root, {
    idle: 'end',
    duration: total * BEAT,
    rest: HOLD,
    rounds: ROUNDS,
    reset: () => { clear(); show(-1, false); },
    play: () => { const ms = beats(); queueMicrotask(paint); return ms; },
    finish: () => { clear(); show(total - 1, true); queueMicrotask(paint); },
    // Waits for its tab and its 4 s; holds while the visitor paused it.
    held: () => !armed || !active || userPaused,
  });

  // A round the visitor started: it claims the stage for its length and plays now.
  const start = () => {
    clearTimeout(auto);
    announce = true;
    if (calm()) { show(total - 1, true); return; }
    armed = true;
    userPaused = false;
    stage.claim(root, total * BEAT + HOLD);
    d.replay();
    paint();
  };
  let auto = 0;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = input.value.trim() || input.defaultValue;
    root.querySelectorAll('.rl__name').forEach((el) => { el.textContent = name; });
    start();
  });
  const cancelAuto = () => clearTimeout(auto);
  input.addEventListener('focus', cancelAuto);
  input.addEventListener('input', cancelAuto);
  // By hand: the loop stops (held by the visitor), the scene changes at once.
  const byHand = (s) => { clearTimeout(auto); clear(); userPaused = true; announce = true; show(s, true); paint(); };
  root.querySelector('.rl__back').addEventListener('click', () => byHand(Math.max(0, step - 1)));
  root.querySelector('.rl__next').addEventListener('click', () => byHand(Math.min(total - 1, step + 1)));
  root.querySelector('.rl__again').addEventListener('click', start);
  pause.addEventListener('click', () => { userPaused = !userPaused; paint(); });
  const settle = () => { if (calm()) { clearTimeout(auto); clear(); show(total - 1, true); } paint(); };
  reduceMotion.addEventListener('change', settle);
  document.addEventListener('motion:change', settle);
  root.addEventListener('demo:run', paint);

  // The tab tells the demo when it is shown or hidden.
  return {
    shown() {
      active = true;
      if (calm()) { show(total - 1, true); paint(); return; }
      if (armed) return;
      clearTimeout(auto);
      auto = setTimeout(() => { if (document.activeElement !== input) { armed = true; d.replay(); } }, AUTO);
    },
    hidden() { active = false; clearTimeout(auto); },
  };
}
