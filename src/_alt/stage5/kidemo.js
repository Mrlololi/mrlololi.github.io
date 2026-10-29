// Stage 4, KI demo «Von der verärgerten Kundenmail zum fertigen Entwurf». The HTML is example 1,
// finished. This file loads all 20 examples (JSON), builds the mini inbox (5 tabs x 4, counter,
// «Nächstes Beispiel», «Zufall»), turns highlights and legend items into buttons (popover «Warum
// markiert?», Escape closes), switches the tone sentence by sentence, and plays an example:
// Lesen (words type in) -> Erkennen (marks) -> Entwerfen (draft). Example 1 plays on every entry,
// the others on click. «Freigeben» and «Bearbeiten» always work: mid-play they skip to the end first.
import { scene } from './loops.js';

const TONES = ['sie', 'du', 'locker'];

export async function init({ reduceMotion }) {
  const demo = document.querySelector('.kidemo');
  if (!demo) return;
  const L = JSON.parse(demo.dataset.labels);
  const $ = (sel) => demo.querySelector(sel);
  const text = $('.kidemo__text');
  const pop = $('.kipop');
  const steps = [...demo.querySelectorAll('.kisteps__step')];
  const sender = $('.kidemo__sender');
  const subject = $('.kidemo__subject');
  const system = $('.kidemo__system span');
  const approve = $('.kidemo__approve');
  const edit = $('.kidemo__edit');
  const sent = $('.kidemo__sent');
  const sentTpl = sent.textContent;
  const labels = { approve: approve.textContent, edit: edit.textContent };
  const tone = toneTabs($('.tone'), L.tones, reduceMotion);

  let data = null;
  let current = 0;
  const seen = new Set([0]);
  let timers = [];
  let editing = null;

  /* ---------- popover ---------- */
  let opener = null;
  const closePop = (focusBack = true) => {
    if (pop.hidden) return;
    pop.hidden = true;
    opener?.setAttribute('aria-expanded', 'false');
    if (focusBack) opener?.focus();
    opener = null;
  };
  const openPop = (btn, mark) => {
    if (opener === btn) { closePop(); return; }
    closePop(false);
    opener = btn;
    btn.setAttribute('aria-expanded', 'true');
    pop.innerHTML = '';
    const head = el('p', 'kipop__head', [el('span', '', L.why), el('button', 'kipop__close', L.close)]);
    head.lastChild.type = 'button';
    head.lastChild.addEventListener('click', () => closePop());
    const dl = el('dl', '', [el('dt', '', L.legend[mark.type]), el('dd', '', mark.reason), el('dt', '', L.draftDoes), el('dd', '', mark.action)]);
    pop.append(head, dl);
    pop.setAttribute('aria-label', L.why);
    // Just below the highlight, inside the mail card.
    const box = pop.parentElement.getBoundingClientRect();
    const r = btn.getBoundingClientRect();
    pop.style.top = `${r.bottom - box.top + 8}px`;
    pop.hidden = false;
    head.lastChild.focus();
  };
  pop.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); closePop(); } });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !pop.hidden) closePop(); });
  document.addEventListener('click', (e) => { if (!pop.hidden && !pop.contains(e.target) && e.target !== opener) closePop(false); });

  /* ---------- the current example ---------- */
  const marksOf = () => (data ? data.examples[current].marks : null);
  // Highlights become buttons (keyboard reachable) that open the popover.
  const wireMarks = () => {
    for (const mk of [...text.querySelectorAll('mark.hl')]) {
      const i = Number(mk.dataset.mark);
      const own = { type: mk.className.match(/hl--(\w+)/)[1], reason: mk.dataset.reason, action: mk.dataset.action };
      const b = el('button', mk.className, mk.textContent);
      b.type = 'button';
      b.dataset.mark = String(i);
      b.setAttribute('aria-expanded', 'false');
      b.setAttribute('aria-haspopup', 'dialog');
      b.addEventListener('click', (e) => { e.stopPropagation(); openPop(b, marksOf()?.[i] || own); });
      mk.replaceWith(b);
    }
  };
  wireMarks(); // example 1 carries its reasons in data attributes, so it works before the JSON arrives

  // Legend: hovering or pressing an item pulses the matching highlights.
  for (const li of demo.querySelectorAll('.kilegend__item')) {
    const type = li.className.match(/kilegend__item--(\w+)/)[1];
    const b = el('button', 'kilegend__btn', [li.firstElementChild]);
    b.type = 'button';
    const pulse = () => text.querySelectorAll(`.hl--${type}`).forEach((h) => { h.classList.remove('is-pulse'); void h.offsetWidth; h.classList.add('is-pulse'); });
    b.addEventListener('click', pulse);
    b.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') pulse(); });
    li.append(b);
  }

  const render = (i) => {
    const x = data.examples[i];
    closePop(false);
    finishEdit(false);
    unapprove();
    sender.textContent = x.from;
    subject.textContent = x.subject;
    text.innerHTML = '';
    let rest = x.body;
    x.marks.forEach((m, k) => {
      const at = rest.indexOf(m.text);
      text.append(...lines(rest.slice(0, at)));
      const mk = el('mark', `hl hl--${m.type}`, m.text);
      mk.dataset.mark = String(k);
      text.append(mk);
      rest = rest.slice(at + m.text.length);
    });
    text.append(...lines(rest));
    wireMarks();
    tone.set(TONES.map((k) => x.drafts[k]));
    system.textContent = x.system;
    sent.textContent = sentTpl.replace(/Anna/g, x.from.split(' ')[0]);
  };

  /* ---------- playing ---------- */
  const at = (ms, fn) => timers.push(setTimeout(fn, ms));
  const setStep = (k) => steps.forEach((s, j) => { s.classList.toggle('is-active', j === k); s.classList.toggle('is-done', j < k); });
  const skip = () => {
    if (!demo.classList.contains('is-playing') || demo.classList.contains('is-done')) return;
    timers.forEach(clearTimeout);
    timers = [];
    demo.querySelectorAll('.kidemo__text .w, .kidemo__text .hl').forEach((e) => e.classList.add('is-on'));
    demo.classList.remove('is-drafting');
    demo.classList.add('is-done');
    setStep(2);
  };
  const play = () => {
    if (reduceMotion.matches) { setStep(2); return; }
    timers.forEach(clearTimeout);
    timers = [];
    demo.classList.remove('is-done', 'is-drafting');
    demo.classList.add('is-playing');
    const words = splitWords(text);
    const marks = [...text.querySelectorAll('.hl')];
    [...words, ...marks].forEach((e) => e.classList.remove('is-on'));
    setStep(0);
    const step = Math.max(18, Math.min(45, 2000 / words.length));
    words.forEach((w, k) => at(k * step, () => w.classList.add('is-on')));
    let t = words.length * step + 250;
    at(t, () => setStep(1));
    marks.forEach((mk, k) => at(t + k * 300, () => mk.classList.add('is-on')));
    t += marks.length * 300 + 300;
    at(t, () => { setStep(2); demo.classList.add('is-drafting'); });
    at(t + 1100, () => { demo.classList.remove('is-drafting'); demo.classList.add('is-done'); });
  };
  reduceMotion.addEventListener('change', () => { if (reduceMotion.matches) skip(); });

  /* ---------- approve and edit: always usable ---------- */
  const finishEdit = (keep) => {
    if (!editing) return;
    const { area, p } = editing;
    if (keep) p.textContent = area.value;
    area.replaceWith(p);
    editing = null;
    edit.textContent = labels.edit;
  };
  function unapprove() {
    approve.removeAttribute('aria-disabled');
    approve.textContent = labels.approve;
    sent.hidden = true;
  }
  approve.addEventListener('click', () => {
    skip();
    if (approve.getAttribute('aria-disabled') === 'true') return;
    finishEdit(true);
    approve.setAttribute('aria-disabled', 'true'); // stays focusable, unlike disabled
    approve.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12.5l4.2 4.2L19 7"/></svg> ';
    approve.append(approve.dataset.done);
    sent.hidden = false;
  });
  edit.addEventListener('click', () => {
    skip();
    if (editing) { finishEdit(true); edit.focus(); return; }
    const p = tone.activeText();
    const area = document.createElement('textarea');
    area.className = 'tone__edit';
    area.value = p.textContent;
    area.setAttribute('aria-label', edit.dataset.label);
    p.replaceWith(area);
    editing = { area, p };
    edit.textContent = edit.dataset.done;
    unapprove(); // an edited reply needs a new approval
    area.focus();
  });
  tone.onChange(() => { finishEdit(false); unapprove(); });

  // Example 1 plays on every entry (until the visitor picks another one).
  scene(demo.querySelector('.kidemo__grid'), { enter: () => { if (current === 0) play(); }, leave: skip, threshold: 0.4 });

  /* ---------- the 20 examples ---------- */
  try {
    data = await (await fetch(demo.dataset.src)).json();
  } catch {
    return; // the details list stays
  }
  const box = demo.querySelector('.kibox');
  const tabs = el('div', 'kitabs');
  tabs.setAttribute('role', 'tablist');
  tabs.setAttribute('aria-label', L.inbox);
  // The tab panel holds the list (a list itself cannot be a tabpanel).
  const panel = el('div', 'kinbox-panel');
  panel.id = 'ki-inbox';
  panel.setAttribute('role', 'tabpanel');
  const list = el('ul', 'kinbox');
  list.setAttribute('role', 'list');
  panel.append(list);
  const count = el('span', 'kinav__count');
  count.setAttribute('aria-live', 'polite');
  const next = el('button', '', L.next);
  const random = el('button', '', L.random);
  next.type = 'button';
  random.type = 'button';
  const nav = el('div', 'kinav', [count, next, random]);
  let tab = 0;
  const tabBtns = data.tabs.map((name, k) => {
    const b = el('button', 'kitab', name);
    b.type = 'button';
    b.id = `ki-tab-${k + 1}`;
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-controls', 'ki-inbox');
    b.addEventListener('click', () => showTab(k));
    b.addEventListener('keydown', (e) => {
      const to = { ArrowRight: k + 1, ArrowLeft: k - 1, Home: 0, End: data.tabs.length - 1 }[e.key];
      if (to === undefined) return;
      e.preventDefault();
      const n = (to + data.tabs.length) % data.tabs.length;
      showTab(n);
      tabBtns[n].focus();
    });
    tabs.append(b);
    return b;
  });
  const showTab = (k) => {
    tab = k;
    tabBtns.forEach((b, j) => { b.setAttribute('aria-selected', String(j === k)); b.tabIndex = j === k ? 0 : -1; });
    panel.setAttribute('aria-labelledby', tabBtns[k].id);
    list.innerHTML = '';
    data.examples.forEach((x, i) => {
      if (x.tab !== k) return;
      const b = el('button', `kinbox__btn${seen.has(i) ? '' : ' is-unread'}`, [el('span', 'kinbox__from', x.from), el('span', 'kinbox__subject', x.title)]);
      b.type = 'button';
      if (!seen.has(i)) b.append(el('span', 'sr-only', `, ${L.unread}`));
      if (i === current) b.setAttribute('aria-current', 'true');
      b.addEventListener('click', () => choose(i));
      list.append(el('li', '', [b]));
    });
  };
  const choose = (i, focusList = false) => {
    current = i;
    seen.add(i);
    render(i);
    count.textContent = L.counter.replace('{n}', String(i + 1)).replace('{total}', String(data.examples.length));
    showTab(data.examples[i].tab);
    if (focusList) list.querySelector('[aria-current="true"]')?.focus();
    play();
  };
  next.addEventListener('click', () => choose((current + 1) % data.examples.length));
  random.addEventListener('click', () => {
    let i = current;
    while (i === current) i = Math.floor(Math.random() * data.examples.length);
    choose(i);
  });
  box.append(tabs, panel, nav);
  demo.classList.add('has-data');
  count.textContent = L.counter.replace('{n}', '1').replace('{total}', String(data.examples.length));
  showTab(0);
}

/* ---------- helpers ---------- */
function el(tag, cls, kids) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (typeof kids === 'string') e.textContent = kids;
  else if (kids) e.append(...kids);
  return e;
}
// Text with its line breaks as <br>.
function lines(s) {
  const out = [];
  s.split('\n').forEach((part, i) => { if (i) out.push(document.createElement('br')); if (part) out.push(document.createTextNode(part)); });
  return out;
}
// Words become spans (marks keep theirs inside), so the mail can type in; done once per render.
function splitWords(text) {
  if (!text.querySelector('.w')) {
    for (const node of [...text.childNodes]) {
      const host = node.nodeType === 3 ? node : node.matches?.('.hl') ? node.firstChild : null;
      if (!host) continue;
      const frag = document.createDocumentFragment();
      for (const part of host.textContent.split(/(\s+)/)) {
        if (!part) continue;
        if (/^\s+$/.test(part)) { frag.append(part); continue; }
        frag.append(el('span', 'w', part));
      }
      if (node.nodeType === 3) node.replaceWith(frag);
      else { node.textContent = ''; node.append(frag); }
    }
  }
  return [...text.querySelectorAll('.w')];
}

// The three tones as a segmented tablist; switching crossfades the reply sentence by sentence.
function toneTabs(tone, names, reduceMotion) {
  const panels = [...tone.querySelectorAll('.tone__panel')];
  const list = el('div', 'tone__tabs');
  list.setAttribute('role', 'tablist');
  list.setAttribute('aria-label', tone.dataset.label);
  let active = 0;
  let listeners = [];
  const tabs = panels.map((p, i) => {
    const tab = el('button', 'tone__tab', names[i]);
    tab.type = 'button';
    tab.id = `tone-tab-${i + 1}`;
    p.id = `tone-panel-${i + 1}`;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', p.id);
    p.setAttribute('role', 'tabpanel');
    p.setAttribute('aria-labelledby', tab.id);
    list.append(tab);
    return tab;
  });
  const sentences = (p) => {
    const txt = p.textContent;
    p.textContent = '';
    txt.split(/(?<=[.!?])\s+/).forEach((s, k) => { if (k) p.append(' '); p.append(el('span', 'sent', s)); });
  };
  const show = (i, animate) => {
    const prev = active;
    active = i;
    tabs.forEach((tab, k) => { tab.setAttribute('aria-selected', String(k === i)); tab.tabIndex = k === i ? 0 : -1; });
    panels.forEach((p, k) => p.classList.toggle('is-active', k === i));
    if (animate && prev !== i && !reduceMotion.matches) {
      const p = panels[i].querySelector('.tone__text');
      if (!p) return;
      sentences(p);
      const parts = [...p.querySelectorAll('.sent')];
      parts.forEach((s) => s.classList.add('is-out'));
      parts.forEach((s, k) => setTimeout(() => s.classList.remove('is-out'), 40 + k * 120));
    }
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => { listeners.forEach((f) => f()); show(i, true); });
    tab.addEventListener('keydown', (e) => {
      const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
      if (to === undefined) return;
      e.preventDefault();
      const n = (to + tabs.length) % tabs.length;
      listeners.forEach((f) => f());
      show(n, true);
      tabs[n].focus();
    });
  });
  const wrap = el('div', 'tone__panels', panels);
  tone.append(list, wrap);
  tone.classList.add('is-tabs');
  show(0, false);
  return {
    set: (texts) => panels.forEach((p, k) => { const t = p.querySelector('.tone__text') || p.querySelector('textarea'); if (t) t.textContent = texts[k]; }),
    activeText: () => panels[active].querySelector('.tone__text'),
    onChange: (f) => { listeners.push(f); },
  };
}
