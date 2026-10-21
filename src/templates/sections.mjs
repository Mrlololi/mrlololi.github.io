import { esc, accent, extLink } from './util.mjs';

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
  return `<section class="section process bg-blue edge" id="process" aria-labelledby="process-title">
<div class="wrap">
<div class="section__head">
<h2 id="process-title">${accent(t.process.h2)}</h2>
</div>
<ol class="steps" role="list">
${steps}
</ol>
</div>
</section>`;
}

export function about(t, config) {
  return `<section class="section about bg-peach edge" id="about" aria-labelledby="about-title">
<div class="wrap about__grid">
<div class="about__photo">
<picture>
<source type="image/avif" srcset="/assets/img/about-340.avif 340w, /assets/img/about-680.avif 680w" sizes="(min-width: 800px) 21rem, 80vw">
<source type="image/webp" srcset="/assets/img/about-340.webp 340w, /assets/img/about-680.webp 680w" sizes="(min-width: 800px) 21rem, 80vw">
<img src="/assets/img/about-340.jpg" srcset="/assets/img/about-340.jpg 340w, /assets/img/about-680.jpg 680w" sizes="(min-width: 800px) 21rem, 80vw" width="340" height="425" loading="lazy" decoding="async" alt="${esc(t.about.photoAlt)}">
</picture>
</div>
<div class="about__text">
<h2 id="about-title">${accent(t.about.h2)}</h2>
${t.about.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('\n')}
<ol class="path" role="list" aria-label="${esc(t.about.pathLabel)}">
${t.about.path.map((stop) => `<li class="path__stop">${esc(stop)}</li>`).join('\n')}
</ol>
<p class="about__tools small">${esc(t.about.tools)}</p>
<p class="about__project">${extLink(config.projects_url, esc(t.about.projects), t)}</p>
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
  return `<section class="section faq bg-lav edge" id="faq" aria-labelledby="faq-title">
<div class="wrap faq__grid">
<h2 id="faq-title">${accent(t.faq.h2)}</h2>
<div class="faq__list" data-typing="${esc(t.faq.typing)}" data-photo="/assets/img/avatar-88.webp">
${items}
</div>
</div>
</section>`;
}

export function notDo(t) {
  return `<aside class="notdo bg-peach">
<div class="wrap">
<p class="notdo__text"><strong>${esc(t.notdo.label)}</strong> ${esc(t.notdo.text)}</p>
</div>
</aside>`;
}

export function contact(t, config) {
  const mailto = `mailto:${config.contact_email}?subject=${t.contact.subject}`;
  const booking = config.booking_url
    ? `<a class="btn btn--ghost" href="${esc(config.booking_url)}" rel="noopener">${esc(t.contact.booking)}</a>`
    : '';
  return `<section class="section contact bg-pink edge" id="contact" aria-labelledby="contact-title">
<div class="wrap">
<h2 class="contact__title" id="contact-title">${accent(t.contact.h2)}</h2>
<p class="lead">${esc(t.contact.text)}</p>
<p class="contact__free">${esc(t.contact.free)}</p>
<div class="contact__actions">
<a class="btn btn--primary" href="${esc(mailto)}">${esc(t.contact.mail)}</a>
${booking}
</div>
<ul class="contact__links" role="list">
<li><a href="${esc(mailto)}">${esc(config.contact_email)}</a></li>
<li>${extLink(config.linkedin, esc(t.contact.linkedin), t)}</li>
<li>${extLink(config.malt, esc(t.contact.malt), t)}</li>
</ul>
</div>
</section>`;
}
