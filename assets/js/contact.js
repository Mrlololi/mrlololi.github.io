// Stage 4, Kontakt: the brief builder fills a live e-mail preview and the «E-Mail öffnen» link
// (mailto with subject and body). After a click on any mailto in the contact block a thank-you note
// with Live waving appears under it (role="status") and stays.
// Stage 6: «Text kopieren» copies the brief (when the clipboard is not available, the text appears in
// a read-only field). The Graz time ticks each minute.
// Kontaktformular 30.10.2026: «Anfrage senden» posts the brief, name, e-mail, optional text and
// consent as JSON to the Make scenario (form data-endpoint), with keepalive and a 10 s timeout. On
// success the form gives way to a panel with Live; on failure the form stays filled and the mailto
// actions appear. No cookies, no other request.
import { briefMail, mailtoHref } from './pure.js';

const TIMEOUT = 10000;

export function init() {
  const section = document.getElementById('contact');
  if (!section) return;
  builder(section);
  form(section);
  thanks(section);
  bubble(section);
  clock(section);
}

// «Erzählen Sie mir, was hakt.» types itself each time the card comes into view (Stage 6d: back).
function bubble(section) {
  const p = section.querySelector('.contact__bubble');
  if (!p || matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  const full = p.dataset.text;
  let timer = 0;
  let inView = false;
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting === inView) return;
    inView = e.isIntersecting;
    clearInterval(timer);
    if (!inView) { p.textContent = full; return; }
    let n = 0;
    p.textContent = '';
    timer = setInterval(() => { n += 1; p.textContent = full.slice(0, n); if (n >= full.length) clearInterval(timer); }, 45);
  }, { threshold: 0.8 }).observe(p);
}

// The four choices with the payload's field names.
const PAYLOAD_KEYS = { what: 'was', via: 'plattform', issue: 'problem', start: 'start' };

function builder(section) {
  const brief = section.querySelector('.brief');
  const open = section.querySelector('.brief__open');
  if (!brief || !open) return;
  const selects = [...brief.querySelectorAll('.brief__select')];
  const body = brief.querySelector('.brief__body');
  const name = section.querySelector('#cf-name');
  const text = section.querySelector('#cf-text');
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
    // The optional text goes before the closing, the name under it (preview and mailto alike).
    let mailBody = m.body;
    const extra = text?.value.trim();
    if (extra) mailBody = mailBody.replace(`\n\n${c.closing}`, `\n\n${extra}\n\n${c.closing}`);
    const who = name?.value.trim();
    if (who) mailBody += `\n${who}`;
    body.textContent = '';
    mailBody.split('\n').forEach((line, i) => { if (i) body.append(document.createElement('br')); body.append(line); });
    open.href = mailtoHref(open.dataset.mail, m.subject, mailBody);
    brief.dataset.copy = `${m.subject}\n\n${mailBody}`;
  };
  selects.forEach((s) => s.addEventListener('change', update));
  name?.addEventListener('input', update);
  text?.addEventListener('input', update);
  update();
  copier(section, brief);
}

function form(section) {
  const f = section.querySelector('.contact__form');
  const done = section.querySelector('.contact__done');
  if (!f || !done || !f.dataset.endpoint) return;
  const send = f.querySelector('.contact__send');
  const alt = f.querySelector('.contact__alt');
  const failed = f.querySelector('.contact__failed');
  const label = send.textContent;
  const fields = { name: f.elements.name, email: f.elements.email, consent: f.elements.consent };

  // elapsed_ms counts from the moment the form first came into view.
  let seen = 0;
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { seen = performance.now(); io.disconnect(); }
    });
    io.observe(f);
  } else seen = performance.now();

  const message = (key) => {
    const el = fields[key];
    if (key === 'consent') return el.checked ? '' : f.dataset.errConsent;
    const v = el.value.trim();
    if (key === 'name') return v ? '' : f.dataset.errName;
    if (!v) return f.dataset.errEmail;
    return el.validity.typeMismatch || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? f.dataset.errEmailbad : '';
  };
  const show = (key) => {
    const el = fields[key];
    const err = f.querySelector(`#cf-${key}-err`);
    const msg = message(key);
    if (msg) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid');
    err.textContent = msg;
    err.hidden = !msg;
    return !msg;
  };
  // Messages appear after the first attempt (or when leaving a field) and clear as soon as it is right.
  let tried = false;
  for (const [key, el] of Object.entries(fields)) {
    el.addEventListener(key === 'consent' ? 'change' : 'input', () => { if (tried || el.hasAttribute('aria-invalid')) show(key); });
    if (key !== 'consent') el.addEventListener('blur', () => { if (el.value.trim()) show(key); });
  }

  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (send.disabled) return;
    tried = true;
    const bad = Object.keys(fields).filter((key) => !show(key));
    if (bad.length) { fields[bad[0]].focus(); return; }
    const payload = {
      name: fields.name.value.trim(),
      email: fields.email.value.trim(),
      ...Object.fromEntries([...f.querySelectorAll('.brief__select')].map((s) => [PAYLOAD_KEYS[s.name], s.value])),
      text: f.elements.text.value.trim(),
      consent: fields.consent.checked,
      website: f.elements.website.value,
      elapsed_ms: Math.round(performance.now() - (seen || performance.now())),
      lang: f.dataset.lang,
      page: location.href,
    };
    send.disabled = true;
    send.textContent = f.dataset.sending;
    f.setAttribute('aria-busy', 'true');
    const ok = await post(f.dataset.endpoint, payload);
    f.removeAttribute('aria-busy');
    send.disabled = false;
    send.textContent = label;
    if (ok) {
      done.querySelector('.contact__done-text').textContent = done.dataset.text.replace('{name}', payload.name);
      f.hidden = true;
      done.hidden = false;
      done.focus();
      section.dispatchEvent(new CustomEvent('contact:sent'));
    } else {
      alt.classList.add('is-open');
      failed.hidden = false;
      failed.focus();
    }
  });
}

// One POST with keepalive; a browser that refuses keepalive for this request gets it once without.
async function post(url, payload) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT);
  const opts = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), credentials: 'omit', keepalive: true, signal: ctl.signal };
  try {
    let res;
    try {
      res = await fetch(url, opts);
    } catch (err) {
      if (ctl.signal.aborted || err?.name !== 'TypeError') throw err;
      res = await fetch(url, { ...opts, keepalive: false });
    }
    return res.status === 200;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
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
