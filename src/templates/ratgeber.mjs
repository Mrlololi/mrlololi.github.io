import { esc, fill, absUrl, formatDate } from './util.mjs';
import { packagesOf } from './service.mjs';

// Stage 5: Ratgeber (DE only). Built only with config.ratgeber_live: true and at least one article.

const day = (iso) => new Date(`${iso}T12:00:00Z`);
const time = (t, iso) => `<time datetime="${iso}">${formatDate(day(iso), t.locale)}</time>`;
const minutes = (t, a) => esc(fill(t.ratgeber.readingTime, { n: a.minutes }));

export function ratgeberIndex(t, articles) {
  const R = t.ratgeber;
  const list = articles.map((a) => `<li class="ratgeber-teaser">
<h2><a href="${R.path}${a.slug}/">${esc(a.title)}</a></h2>
<p>${esc(a.description)}</p>
<p class="small">${time(t, a.datePublished)} · ${minutes(t, a)}</p>
</li>`).join('\n');
  return `<article class="doc ratgeber">
<h1>${esc(R.h1)}</h1>
<p class="lead">${esc(R.intro)}</p>
<ul class="ratgeber-list" role="list">
${list}
</ul>
</article>`;
}

function cta(t, config, key) {
  const s = t.services.pages.find((p) => p.key === key);
  if (!s) return '';
  const it = packagesOf(t)[s.packages[0]];
  return `<aside class="ratgeber-cta" aria-labelledby="ratgeber-cta-title">
<span class="label label--pist">${esc(t.ratgeber.cta)}</span>
<h2 id="ratgeber-cta-title">${esc(s.h1)}</h2>
<p>${esc(s.promise)}</p>
<p class="svc-price"><span class="label label--lav">${esc(it.name)}</span> <span class="svc-price__value">${esc(it.price)}</span></p>
<p class="ratgeber-cta__actions"><a class="btn btn--primary" href="${s.path}">${esc(t.services.ui.more)} ${esc(s.short)}</a> <a class="text-link" href="mailto:${config.contact_email}?subject=${encodeURIComponent(t.pricing.subjectPrefix + it.name)}">${esc(t.pricing.cta)}<span class="sr-only">: ${esc(it.name)}</span></a></p>
</aside>`;
}

export function ratgeberArticle(t, config, a, articles) {
  const R = t.ratgeber;
  const others = articles.filter((x) => x.slug !== a.slug).slice(0, 3);
  const modified = a.dateModified !== a.datePublished ? ` · ${esc(R.modified)} ${time(t, a.dateModified)}` : '';
  const toc = a.toc.length
    ? `<nav class="toc" aria-labelledby="toc-title">
<h2 id="toc-title">${esc(R.toc)}</h2>
<ol>${a.toc.map((h) => `<li><a href="#${h.id}">${esc(h.text)}</a></li>`).join('')}</ol>
</nav>`
    : '';
  return `<article class="doc ratgeber">
<header class="ratgeber__head">
<h1>${esc(a.title)}</h1>
<p class="ratgeber__meta small">${time(t, a.datePublished)}${modified} · ${esc(R.by)} <a href="${t.paths.home}#about">Iva Tsatskrialashvili</a> · ${minutes(t, a)}</p>
</header>
${toc}
<div class="ratgeber__body">
${a.html}
</div>
${cta(t, config, a.package)}
<nav class="ratgeber-more" aria-labelledby="ratgeber-more-title">
<h2 id="ratgeber-more-title">${esc(R.more)}</h2>
<ul role="list">
${others.map((x) => `<li><a href="${R.path}${x.slug}/">${esc(x.title)}</a></li>`).join('\n')}
<li><a href="${R.path}">${esc(R.all)}</a></li>
</ul>
</nav>
</article>`;
}

export function blogPostingLd(config, a) {
  const url = absUrl(config, `/ratgeber/${a.slug}/`);
  return {
    '@type': 'BlogPosting',
    '@id': `${url}#post`,
    headline: a.title,
    description: a.description,
    url,
    mainEntityOfPage: url,
    inLanguage: 'de',
    datePublished: a.datePublished,
    dateModified: a.dateModified,
    author: { '@id': absUrl(config, '/#iva') },
    publisher: { '@id': absUrl(config, '/#business') },
  };
}
