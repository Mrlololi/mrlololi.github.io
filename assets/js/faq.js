// FAQ, Stage 6d (the chat panel is back, Iva 29.10.2026). Wide screens (960 px and up): the list of
// questions on the left, all visible; the chosen one appears on the right as a bubble, Logik (40 px)
// types with three dots for about 0.8 s, then Iva's answer (F1 photo) fades in with «Auch gefragt»
// chips and the way to the contact. The answers stay in the <details> (the chat is a visual copy,
// hidden from screen readers). Phones: the accordion, with the same typing beat on the first open
// of a question; its answer keeps its place, so nothing jumps. Reduced motion: instant.
const TYPE = 800;

export function init({ reduceMotion }) {
  const box = document.querySelector('.faqbox');
  const list = box?.querySelector('.faq__list');
  const tpl = document.getElementById('faq-reader');
  if (!box || !list || !tpl) return;
  const items = [...list.querySelectorAll('.faq__item')];
  const related = JSON.parse(box.dataset.related);
  const more = box.querySelector('.faq__more');
  const wide = matchMedia('(min-width: 960px)');
  const el = (tag, cls, text) => { const e = document.createElement(tag); e.className = cls; if (text != null) e.textContent = text; return e; };
  const reader = () => tpl.content.firstElementChild.cloneNode(true);

  /* ---------- wide: the chat panel ---------- */
  const chat = el('div', 'faq__chat');
  chat.setAttribute('aria-hidden', 'true');
  box.append(chat);
  let timer = 0;
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
      row.append(img, el('p', 'bubble bubble--iva', item.querySelector('.faq__a p').textContent));
      const also = el('div', 'faq__also');
      also.append(el('p', 'faq__also-title', box.dataset.also));
      const chips = el('div', 'faq__also-list');
      for (const k of related[i] || []) {
        // The chips repeat questions from the list; the list stays the keyboard way in.
        const c = el('button', 'chip faq__chip', items[k].querySelector('summary').textContent);
        c.type = 'button';
        c.tabIndex = -1;
        c.addEventListener('click', () => { items[k].open = true; });
        chips.append(c);
      }
      also.append(chips);
      const link = el('a', 'bubble bubble--link', more.textContent);
      link.href = more.getAttribute('href');
      link.tabIndex = -1;
      chat.append(row, also, link);
    };
    if (reduceMotion.matches) { answer(); return; }
    const typing = el('div', 'bubble bubble--typing');
    typing.append(reader());
    chat.append(typing);
    timer = setTimeout(answer, TYPE);
  };

  /* ---------- phones: the typing beat inside the accordion ---------- */
  const seen = new Set();
  const beat = (item) => {
    if (seen.has(item) || reduceMotion.matches) return;
    seen.add(item);
    const a = item.querySelector('.faq__a');
    const r = reader();
    a.prepend(r);
    item.classList.add('is-reading');
    setTimeout(() => { item.classList.remove('is-reading'); r.querySelector('.faq__dots')?.remove(); }, TYPE);
  };

  items.forEach((d, i) => d.addEventListener('toggle', () => {
    if (!d.open) return;
    if (box.classList.contains('is-chat')) {
      items.forEach((o) => { if (o !== d) o.open = false; });
      say(i);
    } else beat(d);
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
}
