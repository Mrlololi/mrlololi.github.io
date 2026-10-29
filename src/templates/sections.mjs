import { esc, accent, extLink, fill } from './util.mjs';
import { mascotScene } from './mascots.mjs';
import { ctaStrip } from './pricing.mjs';
import { briefMail } from '../../assets/js/pure.js';
import { MASCOTS, mascotSvg } from '../../assets/js/mascot-art.js';

// Small pictograms for the four steps (assets/js/sections.js animates each once the line reaches it).
const ICONS = {
  cal: '<rect x="5" y="8" width="30" height="26" rx="4"/><path d="M5 15h30M13 5v6M27 5v6"/><path class="pi pi--tick" d="M14 24l4 4 8-8"/>',
  offer: '<path d="M10 5h15l7 7v23H10z"/><path d="M25 5v7h7"/><path class="pi pi--l1" d="M15 19h12"/><path class="pi pi--l2" d="M15 24h12"/><path class="pi pi--l3" d="M15 29h7"/>',
  blocks: '<rect x="6" y="24" width="12" height="10" rx="2"/><rect x="21" y="24" width="12" height="10" rx="2"/><rect class="pi pi--drop" x="13" y="10" width="13" height="10" rx="2"/>',
  key: '<g class="pi pi--key"><circle cx="13" cy="20" r="6"/><path d="M19 20h15M29 20v5M33 20v4"/></g>',
};
const ICON_KEYS = ['cal', 'offer', 'blocks', 'key'];

// «So arbeiten wir zusammen»: the four steps on one line, static (Stage 6: moved up under the prices,
// text unchanged), closed by the «Nicht sicher, was passt?» strip.
export function processSteps(t) {
  const steps = t.process.steps
    .map(
      (s, i) => `<li class="step">
<span class="step__n" aria-hidden="true">${i + 1}</span>
<svg class="step__icon step__icon--${ICON_KEYS[i]}" viewBox="0 0 40 40" aria-hidden="true" focusable="false">${ICONS[ICON_KEYS[i]]}</svg>
<h3 class="step__title">${esc(s.title)}</h3>
<p>${esc(s.text)}</p>
</li>`
    )
    .join('\n');
  return `<section class="section process bg-blue edge" id="process" aria-labelledby="process-title">
<div class="wrap">
<div class="section__head">
<h2 id="process-title" data-enter="lines">${accent(t.process.h2)}</h2>
</div>
<div class="steps-wrap">
<span class="steps__line" aria-hidden="true"><span></span></span>
<ol class="steps" role="list">
${steps}
</ol>
</div>
${ctaStrip(t)}
</div>
</section>`;
}

// «Logik, Lösung, Live: so arbeite ich.»: the first two letters of the three words in their ink.
function brandLine(text) {
  const cls = ['tl-pink', 'tl-blue', 'tl-pist'];
  let w = 0;
  return esc(text).replace(/\p{L}+/gu, (word) => (w < 3 ? `<span class="${cls[w++]}">${word.slice(0, 2)}</span>${word.slice(2)}` : word));
}

// Stage 6: two short paragraphs, the photo and the four-point timeline (no tool rows, no projects link).
export function about(t) {
  const s = t.s4.about;
  return `<section class="section about bg-peach edge" id="about" aria-labelledby="about-title">
<div class="wrap about__grid">
<div class="about__photo">
<span class="about__blob" aria-hidden="true"></span>
<div class="about__mask">
<picture>
<source type="image/avif" srcset="/assets/img/about-340.avif 340w, /assets/img/about-680.avif 680w" sizes="(min-width: 800px) 21rem, 80vw">
<source type="image/webp" srcset="/assets/img/about-340.webp 340w, /assets/img/about-680.webp 680w" sizes="(min-width: 800px) 21rem, 80vw">
<img src="/assets/img/about-340.jpg" srcset="/assets/img/about-340.jpg 340w, /assets/img/about-680.jpg 680w" sizes="(min-width: 800px) 21rem, 80vw" width="340" height="425" loading="lazy" decoding="async" alt="${esc(t.about.photoAlt)}">
</picture>
</div>
</div>
<div class="about__text">
<h2 id="about-title" data-enter="lines">${accent(t.about.h2)}</h2>
<p class="about__line">${brandLine(s.line)}</p>
${t.about.paragraphs.map((p) => `<p data-enter="lines">${esc(p)}</p>`).join('\n')}
<ol class="path" role="list" aria-label="${esc(t.about.pathLabel)}">
${t.about.path.map((stop, i) => `<li class="path__stop"><span class="path__label">${esc(stop)}</span><p class="path__story" id="path-story-${i + 1}">${esc(s.stories[i])}</p></li>`).join('\n')}
</ol>
</div>
</div>
</section>`;
}

// FAQ (Stage 6): all questions visible as <details>, no inner scroll box. On the first open of a
// question Logik (40 px, the only mascot that small) reads it for half a second, then the answer
// fades in (assets/js/faq.js); its height is reserved, so nothing jumps. Reopening is instant.
export function faq(t) {
  const s = t.s4.faq;
  const items = t.faq.items
    .map(
      (f, i) => `<details class="faq__item" id="faq-${i + 1}">
<summary>${esc(f.q)}</summary>
<div class="faq__a"><p>${esc(f.a)}</p></div>
</details>`
    )
    .join('\n');
  const reader = mascotSvg(0, 'think', `class="mascot mascot--${MASCOTS[0].key} faq__logik" data-base="think" focusable="false"`, '-faq');
  return `<section class="section faq bg-lav edge" id="faq" aria-labelledby="faq-title">
<div class="wrap faq__grid">
<div class="faq__side">
<h2 id="faq-title">${accent(t.faq.h2)}</h2>
<p class="faq__intro">${esc(s.intro)}</p>
<a class="faq__more" href="#contact">${esc(s.missing)}</a>
</div>
<div class="faq__list">
${items}
</div>
<template id="faq-reader"><span class="faq__reading" aria-hidden="true">${reader}<span class="faq__dots"><i></i><i></i><i></i></span></span></template>
</div>
</section>`;
}

// Kontakt (Stage 4). Left: a fill-in brief («Ich verkaufe [..] über [..]. Es hakt bei [..]. Start: [..].»)
// with a live preview of the e-mail; «E-Mail öffnen» opens the visitor's mail program, nothing is
// sent from the site. Right: Iva's photo with a speech bubble, reply time, Graz time, LinkedIn and
// Malt. After a mailto click a thank-you note with Live waving appears (assets/js/contact.js).
export function contact(t, config) {
  const c = t.s4.contact;
  const email = config.contact_email;
  const subjectOnly = `mailto:${email}?subject=${t.contact.subject}`;
  const first = Object.fromEntries(Object.entries(c.fields).map(([k, [, opts]]) => [k, opts[0]]));
  const mail = briefMail(c, first);
  const select = (key) => {
    const [label, opts] = c.fields[key];
    return `<label class="sr-only" for="brief-${key}">${esc(label)}</label><select class="brief__select" id="brief-${key}" name="${key}">${opts.map((o) => `<option>${esc(o)}</option>`).join('')}</select>`;
  };
  const sentence = fill(esc(c.sentence), Object.fromEntries(Object.keys(c.fields).map((k) => [k, select(k)])));
  const booking = config.booking_url ? `<a class="btn btn--ghost" href="${esc(config.booking_url)}" rel="noopener">${esc(t.contact.booking)}</a>` : '';
  const thanks = `<div class="thanks">${mascotScene('contact', [[2, 'wave']])}<div class="thanks__text"><p>${esc(c.thanks)}</p></div></div>`;
  return `<section class="section contact bg-pink edge" id="contact" aria-labelledby="contact-title">
<div class="wrap contact__grid">
<div class="contact__main">
<h2 class="contact__title" id="contact-title">${accent(t.contact.h2)}</h2>
<p class="lead">${esc(t.contact.text)}</p>
<p class="contact__free">${esc(t.contact.free)}</p>
<div class="brief" role="group" aria-labelledby="brief-label" data-sentence="${esc(c.sentence)}" data-sentence-open="${esc(c.sentenceOpen)}" data-via-open="${esc(c.viaOpen)}"${c.lower ? ' data-lower' : ''} data-greeting="${esc(c.greeting)}" data-closing="${esc(c.closing)}">
<p class="brief__label" id="brief-label">${esc(c.builderLabel)}</p>
<p class="brief__sentence">${sentence}</p>
<div class="brief__preview">
<p class="brief__preview-title">${esc(c.preview)}</p>
<p class="brief__meta"><span>${esc(c.to)}:</span> ${esc(email)}<br><span>${esc(c.subjectLabel)}:</span> ${esc(mail.subject)}</p>
<p class="brief__body">${esc(mail.body).replace(/\n/g, '<br>')}</p>
</div>
<p class="brief__note small">${esc(c.note)}</p>
</div>
<div class="contact__actions">
<a class="btn btn--primary brief__open" href="${esc(subjectOnly)}" data-mail="${esc(email)}" data-subject="${esc(c.subject)}">${esc(c.open)}</a>
<button class="btn btn--secondary contact__copy" type="button" hidden data-done="${esc(t.s6.contact.copied)}">${esc(t.s6.contact.copy)}</button>
${booking}
</div>
<div class="contact__fallback">
<p class="small">${fill(esc(t.s6.contact.fallback), { email: `<a href="${esc(subjectOnly)}">${esc(email)}</a>` })}</p>
<button class="btn btn--secondary btn--sm contact__copymail" type="button" hidden data-mail="${esc(email)}" data-done="${esc(t.s6.contact.copied)}">${esc(t.s6.b.copyMail)}</button>
<label class="contact__manual" hidden><span class="small">${esc(t.s6.contact.manual)}</span><textarea readonly rows="6"></textarea></label>
</div>
<div class="contact__thanks" role="status"></div>
<template id="contact-thanks">${thanks}</template>
</div>
<div class="contact__side">
<div class="contact__card">
<div class="contact__who"><picture><source type="image/avif" srcset="/assets/img/avatar-44.avif 1x, /assets/img/avatar-88.avif 2x"><source type="image/webp" srcset="/assets/img/avatar-44.webp 1x, /assets/img/avatar-88.webp 2x"><img src="/assets/img/avatar-44.jpg" srcset="/assets/img/avatar-88.jpg 2x" width="64" height="64" loading="lazy" decoding="async" alt="${esc(c.photoAlt)}"></picture>
<p class="contact__bubble" data-text="${esc(c.bubble)}">${esc(c.bubble)}</p></div>
<p class="contact__reply">${esc(c.reply)}</p>
<p class="contact__time-row"><time class="contact__time" hidden data-label="${esc(c.time)}" data-locale="${t.locale}"></time></p>
<ul class="contact__links" role="list">
<li><a href="${esc(subjectOnly)}">${esc(email)}</a></li>
<li>${extLink(config.linkedin, esc(t.contact.linkedin), t)}</li>
<li>${extLink(config.malt, esc(t.contact.malt), t)}</li>
</ul>
</div>
</div>
</div>
</section>`;
}

