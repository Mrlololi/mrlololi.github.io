// Stage 4, «Welches Paket passt?» as a pre-programmed chat (no real AI, nothing is sent). The
// assistant asks the three questions with typing dots (500-900 ms); each chip the visitor picks
// becomes their bubble; the last answer grows into the package card (Zum Paket, Anfragen, Neu
// starten). Reduced motion: no dots, bubbles at once. Without JS the static link list stays.
import { pickPackage } from './finder.js';
import { mailtoHref } from './pure.js';

export function init({ reduceMotion }) {
  const chat = document.querySelector('.chat');
  if (!chat) return;
  const d = JSON.parse(chat.dataset.text);
  const log = chat.querySelector('.chat__log');
  const chips = chat.querySelector('.chat__chips');
  const progress = chat.querySelector('.chat__progress');
  const avatar = chat.querySelector('.mscene--avatar');
  chat.closest('.finder__card').querySelector('.finder__static').hidden = true;
  chat.hidden = false;
  let answers = [];
  let timer;
  let started = false;

  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const scrollLog = () => { log.scrollTop = log.scrollHeight; };
  const say = (text, then) => {
    clearTimeout(timer);
    const fast = reduceMotion.matches;
    const row = el('div', 'chat__row');
    const bubble = el('p', 'bubble bubble--bot');
    if (fast) { bubble.textContent = text; row.append(bubble); log.append(row); scrollLog(); then?.(); return; }
    const dots = el('span', 'dots');
    dots.setAttribute('aria-label', d.typing);
    dots.append(el('i'), el('i'), el('i'));
    bubble.append(dots);
    row.append(bubble);
    log.append(row);
    scrollLog();
    avatar?.classList.add('is-typing');
    timer = setTimeout(() => {
      bubble.textContent = text;
      avatar?.classList.remove('is-typing');
      scrollLog();
      then?.();
    }, 500 + Math.random() * 400);
  };
  const ask = (n) => {
    const [question, options] = d.questions[n];
    progress.textContent = d.progress.replace('{n}', String(n + 1));
    say(question, () => {
      chips.innerHTML = '';
      chips.setAttribute('aria-label', question);
      options.forEach(([value, label]) => {
        const b = el('button', 'chip', label);
        b.type = 'button';
        b.addEventListener('click', () => answer(n, value, label));
        chips.append(b);
      });
      if (started) chips.firstChild.focus({ preventScroll: true });
    });
  };
  const answer = (n, value, label) => {
    started = true;
    chips.innerHTML = '';
    log.append(el('p', 'bubble bubble--me', label));
    scrollLog();
    answers[n] = value;
    if (n < d.questions.length - 1) ask(n + 1);
    else result();
  };
  const result = () => {
    const pkg = pickPackage(answers[0], answers[1]);
    progress.textContent = '';
    say(d[answers[2]], () => {
      const card = el('div', 'chat__card');
      card.tabIndex = -1;
      const name = el('p', 'chat__pkg', d.names[pkg]);
      const price = el('p', 'chat__price', d.prices[pkg]);
      const line = el('p', 'chat__line', d.lines[pkg]);
      const go = el('a', 'btn btn--primary btn--sm', d.link);
      go.href = `#pkg-${pkg}`;
      const mail = el('a', 'btn btn--ghost btn--sm', d.ask);
      mail.href = mailtoHref(d.mail, d.subject + d.names[pkg], '');
      const again = el('button', 'chat__restart', d.restart);
      again.type = 'button';
      again.addEventListener('click', restart);
      const actions = el('div', 'chat__actions');
      actions.append(go, mail, again);
      card.append(name, price, line, actions);
      log.append(card);
      scrollLog();
      card.focus({ preventScroll: true });
    });
  };
  const restart = () => {
    clearTimeout(timer);
    answers = [];
    log.innerHTML = '';
    chips.innerHTML = '';
    say(d.hello, () => ask(0));
  };
  // Starts when the chat first comes into view (so the dots are seen), at once without IntersectionObserver.
  if (!('IntersectionObserver' in window)) { restart(); return; }
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); restart(); } }, { threshold: 0.3 });
  io.observe(chat);
}
