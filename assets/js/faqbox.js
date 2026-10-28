// Stage 4, FAQ: on wide screens one box of fixed height with two equal columns. Left: the questions
// (scrolling inside). Right: the chosen question as a bubble, Iva's answer, «Auch gefragt» with 2-3
// related questions as chips, and «Frage nicht dabei? → Schreiben Sie mir» to the contact. The
// answers stay in the <details> (the chat is a visual copy, hidden from screen readers). Phones:
// the accordion. Logik thinks next to the heading for a moment when it comes into view.
import { scene } from './loops.js';

export function init({ reduceMotion }) {
  const box = document.querySelector('.faqbox');
  if (!box) return;
  const list = box.querySelector('.faq__list');
  const items = [...list.querySelectorAll('.faq__item')];
  const related = JSON.parse(box.dataset.related);
  const more = box.querySelector('.faq__more');
  const chat = document.createElement('div');
  chat.className = 'faq__chat';
  chat.setAttribute('aria-hidden', 'true');
  box.append(chat);
  const wide = matchMedia('(min-width: 960px)');
  let timer;
  const el = (tag, cls, text) => { const e = document.createElement(tag); e.className = cls; if (text != null) e.textContent = text; return e; };
  // Pick a question (from the list or an «Auch gefragt» chip): open its details, close the others.
  const pick = (i) => { items[i].open = true; };
  const say = (i) => {
    const item = items[i];
    clearTimeout(timer);
    chat.textContent = '';
    chat.append(el('p', 'bubble bubble--visitor', item.querySelector('summary').textContent));
    const answer = () => {
      chat.querySelector('.bubble--typing')?.remove();
      const row = el('div', 'bubble-row');
      const img = new Image(36, 36);
      img.src = box.dataset.photo;
      img.alt = '';
      img.className = 'bubble__photo';
      row.append(img, el('p', 'bubble bubble--iva', item.querySelector('p').textContent));
      const also = el('div', 'faq__also');
      also.append(el('p', 'faq__also-title', box.dataset.also));
      const chips = el('div', 'faq__also-list');
      for (const k of related[i]) {
        // The chips repeat questions from the list; the list stays the keyboard way in (aria-hidden copy).
        const c = el('button', 'faq__chip', items[k].querySelector('summary').textContent);
        c.type = 'button';
        c.tabIndex = -1;
        c.addEventListener('click', () => pick(k));
        chips.append(c);
      }
      also.append(chips);
      const link = el('a', 'bubble bubble--link', more.textContent);
      link.href = more.getAttribute('href');
      link.tabIndex = -1;
      chat.append(row, also, link);
    };
    if (reduceMotion.matches) { answer(); return; }
    chat.append(el('p', 'bubble bubble--typing', box.dataset.typing));
    timer = setTimeout(answer, 700);
  };
  items.forEach((d, i) => d.addEventListener('toggle', () => {
    if (!box.classList.contains('is-chat') || !d.open) return;
    items.forEach((o) => { if (o !== d) o.open = false; });
    say(i);
  }));
  const apply = () => {
    box.classList.toggle('is-chat', wide.matches);
    if (wide.matches) {
      const open = items.findIndex((x) => x.open);
      if (open < 0) items[0].open = true; else say(open);
    }
  };
  wide.addEventListener('change', apply);
  apply();

  // Logik next to the heading: a short think-and-tilt when the heading enters.
  const logik = box.querySelector('.mscene--faq .mascot');
  if (logik?.animate) {
    scene(box.querySelector('h2'), {
      enter: () => logik.animate([{ transform: 'none' }, { transform: 'rotate(-8deg) translateY(-3px)' }, { transform: 'rotate(4deg)' }, { transform: 'none' }], { duration: 1400, easing: 'ease-in-out' }),
      threshold: 0.6,
    });
  }
}
