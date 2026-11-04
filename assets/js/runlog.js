// Stage 6f (4.11.2026), the run-log in the video frame's second tab: one purchase in six steps.
// - Forward only: about 1 s per step, one step lights at a time with its log line; nothing goes back
//   by itself and nothing lights all at once. After the last step 4 s on the end frame, then a soft
//   reset and again; after 3 rounds it stops on the end frame («Nochmal abspielen»).
// - Start: «Anna» is prefilled; «Anmelden» runs the story with the typed name. Without an action it
//   starts by itself after 4 s; focus or typing in the field cancels that.
// - It holds while the pointer or the focus is inside, off-screen, in a hidden tab, while the visitor
//   paused it, and with the global «Bewegung pausieren». A round the visitor started (Anmelden,
//   Nochmal abspielen) plays even with the pointer inside; the automatic rounds after it wait. Zurück / Weiter step by hand.
// - Reduced motion (or motion paused): the end frame, every button works, nothing plays by itself.
// - The result is announced (polite) only after a visitor's action. Nothing is sent anywhere.
import { reduceMotion, motion } from './loops.js';

const STEP = 1000;
const HOLD = 4000;
const ROUNDS = 3;
const AUTO = 4000;

export function open(root) {
  const steps = [...root.querySelectorAll('.rl__step')];
  const logs = [...root.querySelectorAll('.rl__log')];
  const total = steps.length;
  const form = root.querySelector('.rl__start');
  const input = form.querySelector('input');
  const count = root.querySelector('.rl__count');
  const status = root.querySelector('.rl__status');
  const summary = root.querySelector('.rl__summary').textContent;
  const pause = root.querySelector('.rl__pause');
  let step = total - 1;
  let round = 0;
  let timer = 0;
  let auto = 0;
  let playing = false;
  let userPaused = false;
  let inside = false;
  let visible = true;
  let active = false;
  let announce = false;
  let userRun = false;
  const calm = () => reduceMotion.matches || motion.paused;

  // The frame for a step: earlier steps done, this one current, later ones waiting (-1: none yet).
  const show = (s) => {
    step = s;
    root.dataset.step = String(s);
    steps.forEach((el, i) => { el.classList.toggle('is-done', i < s); el.classList.toggle('is-current', i === s); });
    logs.forEach((el, i) => el.classList.toggle('is-on', i <= s));
    root.classList.toggle('is-end', s === total - 1);
    count.textContent = root.dataset.stepOf.replace('{n}', String(Math.max(1, s + 1))).replace('{total}', String(total));
    if (s === total - 1 && announce) { status.textContent = summary; announce = false; }
  };
  const held = () => (inside && !userRun) || !visible || !active || userPaused || calm();
  const clear = () => { clearTimeout(timer); timer = 0; };
  // One beat: wait while held, then do fn.
  const later = (ms, fn) => { clear(); timer = setTimeout(function go() { if (held()) { timer = setTimeout(go, 250); return; } fn(); }, ms); };
  const tick = () => {
    if (step < total - 1) { show(step + 1); later(step < total - 1 ? STEP : HOLD, tick); return; }
    round += 1;
    userRun = false;
    if (round >= ROUNDS) { playing = false; paint(); return; }
    root.classList.add('is-resetting');
    later(400, () => { root.classList.remove('is-resetting'); show(-1); later(STEP, tick); });
  };
  const play = () => { playing = true; round = 0; userPaused = false; show(-1); later(STEP, tick); paint(); };
  const stop = () => { clear(); playing = false; paint(); };
  const paint = () => {
    pause.hidden = calm() || !playing;
    pause.setAttribute('aria-pressed', String(userPaused));
    pause.firstChild.textContent = userPaused ? pause.dataset.playLabel : pause.dataset.pauseLabel;
  };
  const names = (n) => root.querySelectorAll('.rl__name').forEach((el) => { el.textContent = n; });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearTimeout(auto);
    names(input.value.trim() || input.defaultValue);
    announce = true;
    if (calm()) { show(total - 1); return; }
    userRun = true;
    play();
  });
  const cancelAuto = () => clearTimeout(auto);
  input.addEventListener('focus', cancelAuto);
  input.addEventListener('input', cancelAuto);
  root.querySelector('.rl__back').addEventListener('click', () => { stop(); userPaused = true; show(Math.max(0, step - 1)); });
  root.querySelector('.rl__next').addEventListener('click', () => { stop(); userPaused = true; announce = true; show(Math.min(total - 1, step + 1)); });
  root.querySelector('.rl__again').addEventListener('click', () => { clearTimeout(auto); announce = true; if (calm()) { show(total - 1); return; } userRun = true; play(); });
  pause.addEventListener('click', () => { userPaused = !userPaused; paint(); });
  root.addEventListener('pointerenter', () => { inside = true; });
  root.addEventListener('pointerleave', () => { inside = false; });
  root.addEventListener('focusin', () => { inside = true; });
  root.addEventListener('focusout', (e) => { if (!root.contains(e.relatedTarget)) inside = false; });
  if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(root);
  const settle = () => { if (calm()) { stop(); clearTimeout(auto); show(total - 1); } paint(); };
  reduceMotion.addEventListener('change', settle);
  document.addEventListener('motion:change', settle);

  // The tab tells the demo when it is shown or hidden.
  return {
    shown() {
      active = true;
      if (calm()) { show(total - 1); paint(); return; }
      if (playing) return;
      show(-1);
      clearTimeout(auto);
      auto = setTimeout(() => { if (document.activeElement !== input) play(); }, AUTO);
    },
    hidden() { active = false; clearTimeout(auto); },
  };
}
