// Stage 6, KI demo on /ki-antwortentwuerfe/: «Links die Kundenmail, rechts der Entwurf». The HTML
// is example 1, finished. A play (loops.js: on entry, at most twice): Lesen (the mail alone), Erkennen
// (the marks light one by one, each with its label), Entwerfen (the arrow draws, the draft appears
// line by line in about 2 s). A tap on the picture skips to the end. The three steps are buttons
// that show their frame (aria-current="step"). «Anderes Beispiel» plays the next of three examples;
// the tone switches the draft at once; «Freigeben» shows «Freigegeben» for a moment.
import { demo } from './loops.js';

const READ = 700;
const MARK = 380;
const ARROW = 350;
const DRAFT = 2000;

export function init() {
  const box = document.querySelector('.kidemo');
  if (!box) return;
  const $ = (sel) => box.querySelector(sel);
  const grid = $('.kidemo__grid');
  const text = $('.kidemo__text');
  const out = $('.kidemo__out');
  const steps = [...box.querySelectorAll('.kisteps__btn')];
  const tones = [...box.querySelectorAll('.kitone')];
  const approve = $('.kidemo__approve');
  const examples = JSON.parse(box.dataset.examples);
  let current = 0;
  let tone = 'sie';
  let timers = [];
  const clear = () => { timers.forEach(clearTimeout); timers = []; };
  const at = (ms, fn) => timers.push(setTimeout(fn, ms));

  const show = (step) => {
    grid.dataset.step = String(step);
    steps.forEach((b, i) => (i === step ? b.setAttribute('aria-current', 'step') : b.removeAttribute('aria-current')));
  };
  const marks = () => [...text.querySelectorAll('.hl')];
  const lines = () => [...out.querySelectorAll('.kidemo__line')];
  const settle = () => { box.classList.remove('is-running'); marks().forEach((m) => m.classList.add('is-on')); lines().forEach((l) => l.classList.add('is-on')); };
  const render = () => {
    const x = examples[current];
    $('.kidemo__sender').textContent = x.from;
    $('.kidemo__subject').textContent = x.subject;
    text.innerHTML = x.body;
    out.innerHTML = x.drafts[tone];
    $('.kidemo__system').textContent = x.system;
  };

  const reset = () => {
    clear();
    box.classList.add('is-running');
    marks().forEach((m) => m.classList.remove('is-on'));
    lines().forEach((l) => l.classList.remove('is-on'));
    show(0);
  };
  const finish = () => { clear(); settle(); show(2); };
  const play = () => {
    const ms = marks();
    const ls = lines();
    at(READ, () => show(1));
    ms.forEach((m, i) => at(READ + i * MARK, () => m.classList.add('is-on')));
    const draftAt = READ + ms.length * MARK + 200;
    at(draftAt, () => show(2));
    ls.forEach((l, i) => at(draftAt + ARROW + (i * DRAFT) / ls.length, () => l.classList.add('is-on')));
    return draftAt + ARROW + DRAFT + 200;
  };
  const d = demo(box, { reset, play, finish, frames: 3, frame: (i) => { clear(); settle(); show(i); } });

  // A tap on the picture skips to the end (never «tap to replay»: phones tap by accident).
  grid.addEventListener('click', () => d?.skip());
  steps.forEach((b, i) => b.addEventListener('click', () => { d?.skip(); clear(); settle(); show(i); }));
  $('.kidemo__other').addEventListener('click', () => {
    current = (current + 1) % examples.length;
    render();
    d?.replay();
  });
  tones.forEach((b) => b.addEventListener('click', () => {
    tone = b.dataset.tone;
    tones.forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
    d?.skip();
    out.innerHTML = examples[current].drafts[tone];
    settle();
    show(2);
  }));
  const label = approve.textContent;
  let back = 0;
  approve.addEventListener('click', () => {
    clearTimeout(back);
    approve.textContent = approve.dataset.done;
    approve.classList.add('is-done');
    back = setTimeout(() => { approve.textContent = label; approve.classList.remove('is-done'); }, 1600);
  });
}
