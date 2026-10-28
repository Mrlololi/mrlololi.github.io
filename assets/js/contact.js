// Stage 4, Kontakt: the brief builder fills a live e-mail preview and the «E-Mail öffnen» link
// (mailto with subject and body; nothing is sent or stored by the site). After a click on any mailto
// in the contact block a thank-you note with Live waving appears under it (role="status") and stays.
// Iva's bubble types its sentence on entry; the Graz time ticks each minute.
import { scene } from './loops.js';
import { briefMail, mailtoHref } from './pure.js';

export function init({ reduceMotion }) {
  const section = document.getElementById('contact');
  if (!section) return;
  builder(section);
  thanks(section);
  bubble(section, reduceMotion);
  clock(section);
}

function builder(section) {
  const brief = section.querySelector('.brief');
  const open = section.querySelector('.brief__open');
  if (!brief || !open) return;
  const selects = [...brief.querySelectorAll('.brief__select')];
  const body = brief.querySelector('.brief__body');
  // The sentence and the e-mail frame in the page's language (data attributes from the build).
  const c = {
    sentence: brief.dataset.sentence,
    subject: open.dataset.subject,
    greeting: brief.dataset.greeting,
    closing: brief.dataset.closing,
  };
  const update = () => {
    const choices = Object.fromEntries(selects.map((s) => [s.name, s.value]));
    const m = briefMail(c, choices);
    body.textContent = '';
    m.body.split('\n').forEach((line, i) => { if (i) body.append(document.createElement('br')); body.append(line); });
    open.href = mailtoHref(open.dataset.mail, m.subject, m.body);
  };
  selects.forEach((s) => s.addEventListener('change', update));
  update();
}

function thanks(section) {
  const box = section.querySelector('.contact__thanks');
  const tpl = document.getElementById('contact-thanks');
  if (!box || !tpl) return;
  section.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="mailto:"]');
    if (!a || box.firstElementChild) return;
    box.append(tpl.content.cloneNode(true));
    const copy = box.querySelector('.thanks__copy');
    copy.addEventListener('click', async () => {
      const mail = box.querySelector('.thanks__mail').textContent;
      try { await navigator.clipboard.writeText(mail); } catch {
        // Older browsers: select the address so it can be copied by hand.
        const r = document.createRange();
        r.selectNodeContents(box.querySelector('.thanks__mail'));
        getSelection().removeAllRanges();
        getSelection().addRange(r);
      }
      copy.textContent = copy.dataset.done;
    });
  });
}

// «Erzählen Sie mir, was hakt.» types itself each time the card comes into view.
function bubble(section, reduceMotion) {
  const p = section.querySelector('.contact__bubble');
  if (!p || reduceMotion.matches) return;
  const full = p.dataset.text;
  let timer;
  scene(p, {
    enter: () => {
      clearInterval(timer);
      let n = 0;
      p.textContent = '';
      timer = setInterval(() => { n += 1; p.textContent = full.slice(0, n); if (n >= full.length) clearInterval(timer); }, 45);
    },
    leave: () => { clearInterval(timer); p.textContent = full; },
    threshold: 0.8,
  });
}

function clock(section) {
  const time = section.querySelector('.contact__time');
  if (!time) return;
  const fmt = new Intl.DateTimeFormat(time.dataset.locale, { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Vienna' });
  const tick = () => {
    const now = new Date();
    time.dateTime = now.toISOString();
    time.textContent = time.dataset.label.replace('{time}', fmt.format(now));
  };
  tick();
  time.hidden = false;
  setInterval(tick, 30000);
}
