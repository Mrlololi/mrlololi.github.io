// Stage 4, Kontakt: the brief builder fills a live e-mail preview and the «E-Mail öffnen» link
// (mailto with subject and body; nothing is sent or stored by the site). After a click on any mailto
// in the contact block a thank-you note with Live waving appears under it (role="status") and stays.
// Stage 6: under the button the address stays visible and «Text kopieren» copies the brief (when the
// clipboard is not available, the text appears in a read-only field). The bubble no longer types.
// The Graz time ticks each minute.
import { briefMail, mailtoHref } from './pure.js';

export function init() {
  const section = document.getElementById('contact');
  if (!section) return;
  builder(section);
  thanks(section);
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
    sentenceOpen: brief.dataset.sentenceOpen,
    viaOpen: brief.dataset.viaOpen,
    lower: 'lower' in brief.dataset,
  };
  const update = () => {
    const choices = Object.fromEntries(selects.map((s) => [s.name, s.value]));
    const m = briefMail(c, choices);
    body.textContent = '';
    m.body.split('\n').forEach((line, i) => { if (i) body.append(document.createElement('br')); body.append(line); });
    open.href = mailtoHref(open.dataset.mail, m.subject, m.body);
    brief.dataset.copy = `${m.subject}\n\n${m.body}`;
  };
  selects.forEach((s) => s.addEventListener('change', update));
  update();
  copier(section, brief);
}

// «Text kopieren»: the subject and the brief to the clipboard; fallback a read-only textarea.
function copier(section, brief) {
  const button = section.querySelector('.contact__copy');
  const manual = section.querySelector('.contact__manual');
  if (!button || !manual) return;
  const label = button.textContent;
  button.hidden = false;
  // The address has its own small copy button.
  const mailButton = section.querySelector('.contact__copymail');
  if (mailButton) {
    const mailLabel = mailButton.textContent;
    mailButton.hidden = false;
    mailButton.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(mailButton.dataset.mail);
        mailButton.textContent = mailButton.dataset.done;
        setTimeout(() => { mailButton.textContent = mailLabel; }, 2500);
      } catch {
        const r = document.createRange();
        r.selectNodeContents(mailButton.previousElementSibling.querySelector('a'));
        getSelection().removeAllRanges();
        getSelection().addRange(r);
      }
    });
  }
  let back = 0;
  button.addEventListener('click', async () => {
    const text = brief.dataset.copy;
    try {
      await navigator.clipboard.writeText(text);
      clearTimeout(back);
      button.textContent = button.dataset.done;
      back = setTimeout(() => { button.textContent = label; }, 2500);
    } catch {
      const area = manual.querySelector('textarea');
      area.value = text;
      manual.hidden = false;
      area.focus();
      area.select();
    }
  });
}

function thanks(section) {
  const box = section.querySelector('.contact__thanks');
  const tpl = document.getElementById('contact-thanks');
  if (!box || !tpl) return;
  section.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="mailto:"]');
    if (!a || box.firstElementChild) return;
    box.append(tpl.content.cloneNode(true));
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
