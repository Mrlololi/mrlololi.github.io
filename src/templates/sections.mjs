import { esc } from './util.mjs';

export function processSteps(t) {
  const steps = t.process.steps
    .map(
      (s, i) => `<li class="step">
<span class="step__n" aria-hidden="true">${i + 1}</span>
<h3 class="step__title">${esc(s.title)}</h3>
<p>${esc(s.text)}</p>
</li>`
    )
    .join('\n');
  return `<section class="section process" id="process" aria-labelledby="process-title">
<div class="wrap">
<div class="section__head">
<h2 id="process-title">${esc(t.process.h2)}</h2>
</div>
<ol class="steps" role="list">
${steps}
</ol>
</div>
</section>`;
}

export function about(t, config) {
  return `<section class="section about" id="about" aria-labelledby="about-title">
<div class="wrap about__grid">
<picture class="about__photo">
<source type="image/avif" srcset="/assets/img/portrait-260.avif 260w, /assets/img/portrait-410.avif 410w" sizes="260px">
<source type="image/webp" srcset="/assets/img/portrait-260.webp 260w, /assets/img/portrait-410.webp 410w" sizes="260px">
<img src="/assets/img/portrait-260.jpg" srcset="/assets/img/portrait-260.jpg 260w, /assets/img/portrait-410.jpg 410w" sizes="260px" width="260" height="325" loading="lazy" decoding="async" alt="${esc(t.about.photoAlt)}">
</picture>
<div class="about__text">
<h2 id="about-title">${esc(t.about.h2)}</h2>
${t.about.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('\n')}
<p class="about__tools small">${esc(t.about.tools)}</p>
<p class="about__project"><a href="${esc(config.geoapp_url)}">${esc(t.about.geoapp)}</a></p>
</div>
</div>
</section>`;
}

export function faq(t) {
  const items = t.faq.items
    .map(
      (f) => `<details class="faq__item">
<summary>${esc(f.q)}</summary>
<p>${esc(f.a)}</p>
</details>`
    )
    .join('\n');
  return `<section class="section faq" id="faq" aria-labelledby="faq-title">
<div class="wrap faq__grid">
<h2 id="faq-title">${esc(t.faq.h2)}</h2>
<div class="faq__list">
${items}
</div>
</div>
</section>`;
}

export function contact(t, config) {
  const mailto = `mailto:${config.contact_email}?subject=${t.contact.subject}`;
  const booking = config.booking_url
    ? `<a class="btn btn--ghost" href="${esc(config.booking_url)}" rel="noopener">${esc(t.contact.booking)}</a>`
    : '';
  return `<section class="section contact" id="contact" aria-labelledby="contact-title">
<div class="wrap">
<h2 class="contact__title" id="contact-title">${esc(t.contact.h2)}</h2>
<p class="lead">${esc(t.contact.text)}</p>
<div class="contact__actions">
<a class="btn btn--primary" href="${esc(mailto)}">${esc(t.contact.mail)}</a>
${booking}
</div>
<ul class="contact__links" role="list">
<li><a href="${esc(mailto)}">${esc(config.contact_email)}</a></li>
<li><a class="ext" href="${esc(config.linkedin)}" rel="noopener">${esc(t.contact.linkedin)}</a></li>
<li><a class="ext" href="${esc(config.malt)}" rel="noopener">${esc(t.contact.malt)}</a></li>
</ul>
</div>
</section>`;
}
