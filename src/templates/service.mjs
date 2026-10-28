import { esc, accent, absUrl, extLink, quoted, keepHyphenated } from './util.mjs';

// Stage 5 (28.10.2026): one light template for the five service pages (DE and EN). No mascots and
// no demo scripts here: the pages show prices and must stay fast (Lighthouse mobile >= 95).

export const packagesOf = (t) => Object.fromEntries(t.pricing.groups.flatMap((g) => g.items).map((it) => [it.id, it]));

// «Focus phrase | mrlololi», or the focus phrase alone when the suffix would pass 60 characters.
export const serviceTitle = (s) => (`${s.h1} | mrlololi`.length <= 60 ? `${s.h1} | mrlololi` : s.h1);

const mailto = (t, config, it) => `mailto:${config.contact_email}?subject=${encodeURIComponent(t.pricing.subjectPrefix + it.name)}`;
const amount = (price) => Number(price.replace(/[^\d]/g, ''));

// «ab 1.190 €» becomes a minPrice, «45 € pro Stunde» a price per hour, «190 € fix» a plain price.
function offer(t, it, url) {
  const base = { '@type': 'Offer', name: it.name, url, priceCurrency: 'EUR' };
  if (/^(ab|from) /.test(it.price)) return { ...base, priceSpecification: { '@type': 'PriceSpecification', minPrice: amount(it.price), priceCurrency: 'EUR' } };
  if (it.id === 'support') return { ...base, priceSpecification: { '@type': 'UnitPriceSpecification', price: amount(it.price), priceCurrency: 'EUR', unitCode: 'HUR', unitText: it.price } };
  return { ...base, price: amount(it.price) };
}

export function serviceLd(t, config, s) {
  const url = absUrl(config, s.path);
  const pk = packagesOf(t);
  const offers = s.packages.map((id) => offer(t, pk[id], url));
  const L = t.services.ui;
  return [
    {
      '@type': 'Service',
      '@id': `${url}#service`,
      name: s.h1,
      serviceType: s.short,
      description: s.description,
      url,
      inLanguage: t.lang,
      provider: { '@id': absUrl(config, '/#business') },
      areaServed: ['AT', 'DE', 'CH'].map((name) => ({ '@type': 'Country', name })),
      offers: offers.length === 1 ? offers[0] : offers,
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: L.home, item: absUrl(config, t.paths.home) },
        { '@type': 'ListItem', position: 2, name: L.services, item: absUrl(config, `${t.paths.home}#services`) },
        { '@type': 'ListItem', position: 3, name: s.short, item: url },
      ],
    },
  ];
}

const sep = '<span class="crumbs__sep" aria-hidden="true">›</span>';
function crumbs(t, s) {
  const L = t.services.ui;
  return `<nav class="crumbs" aria-label="${esc(L.crumbs)}">
<ol role="list">
<li><a href="${t.paths.home}">${esc(L.home)}</a></li>
<li>${sep}<a href="${t.paths.home}#services">${esc(L.services)}</a></li>
<li>${sep}<span aria-current="page">${esc(s.short)}</span></li>
</ol>
</nav>`;
}

const priceChip = (it) => `<p class="svc-price"><span class="label label--pist">${esc(it.name)}</span> <span class="svc-price__value">${esc(it.price)}</span></p>`;

// Decorative copy of the problem-card mini-demo as one static picture: the mail sits in the inbox,
// the three records are ticked. It carries its own text alternative.
function spamSvg(t) {
  const d = t.s4.fixDemo.spam;
  const tick = (x, y) => `<circle cx="${x}" cy="${y}" r="9" fill="#4E8A3E"/><path d="M${x - 4.5} ${y + 0.3}l3 3 5.6-6.2" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`;
  const badges = d.badges.map((b, i) => {
    const x = 6 + i * 104;
    return `<rect x="${x}" y="124" width="96" height="36" rx="8" fill="#fff" stroke="#D6D3DC"/>${tick(x + 20, 142)}<text x="${x + 36}" y="147" font-size="15" font-weight="700" fill="#2B2A33">${esc(b)}</text>`;
  }).join('');
  return `<svg class="svc-spam" viewBox="0 0 320 166" role="img" aria-label="${esc(t.services.ui.spamAlt)}" focusable="false">
<rect x="1" y="1" width="156" height="108" rx="14" fill="#fff" stroke="#D6D3DC"/>
<rect x="163" y="1" width="156" height="108" rx="14" fill="#FBE7EC" stroke="#D6D3DC"/>
<text x="79" y="96" text-anchor="middle" font-size="14" fill="#4A4753">${esc(d.inbox)}</text>
<text x="241" y="96" text-anchor="middle" font-size="14" fill="#8A2F45">${esc(d.spam)}</text>
<path d="M226 52C206 26 168 24 128 38" fill="none" stroke="#8A2F45" stroke-width="2" stroke-dasharray="4 5" stroke-linecap="round"/>
<path d="M136 31l-9 7 10 4" fill="none" stroke="#8A2F45" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<g transform="translate(54 24)"><rect x="1.5" y="1.5" width="48" height="34" rx="5" fill="#fff" stroke="#2B2A33" stroke-width="2.5"/><path d="M4 5l21.5 15L47 5" fill="none" stroke="#2B2A33" stroke-width="2.5" stroke-linejoin="round"/></g>
${tick(106, 26)}
${badges}
</svg>`;
}

function quote(t, q) {
  const langAttr = q.lang !== t.lang ? ` lang="${q.lang}"` : '';
  const translation = q.translation ? `\n<p class="quote__translation">${esc(t.ui.translation)} ${esc(quoted(q.translation, t.lang))}</p>` : '';
  return `<figure class="quote">
<blockquote${langAttr}><p>${esc(quoted(q.text, q.lang))}</p></blockquote>${translation}
<figcaption>${esc(q.source)}</figcaption>
</figure>`;
}

function example(t, config, s, live) {
  const L = t.services.ui;
  if (s.example === 'case2') {
    return `<article class="svc-card"><h3>${esc(t.refs.case2.title)}</h3><p>${esc(t.refs.case2.text)}</p></article>`;
  }
  if (s.example === 'case1') {
    const c1 = t.refs.case1;
    return `<article class="svc-case">
<div class="browser"><div class="browser__bar" aria-hidden="true"><i></i><i></i><i></i><span>${esc(c1.domain)}</span></div>
<picture>
<source type="image/avif" srcset="/assets/img/case-alexandrafry-640.avif 640w, /assets/img/case-alexandrafry-1280.avif 1280w" sizes="(min-width: 800px) 40rem, 100vw">
<source type="image/webp" srcset="/assets/img/case-alexandrafry-640.webp 640w, /assets/img/case-alexandrafry-1280.webp 1280w" sizes="(min-width: 800px) 40rem, 100vw">
<img src="/assets/img/case-alexandrafry-640.jpg" srcset="/assets/img/case-alexandrafry-640.jpg 640w, /assets/img/case-alexandrafry-1280.jpg 1280w" sizes="(min-width: 800px) 40rem, 100vw" width="640" height="400" loading="lazy" decoding="async" alt="${esc(t.ui.caseImageAlt)}">
</picture>
</div>
<h3>${extLink(config.case1_url, esc(c1.domain), t)}${esc(c1.titleRest)}</h3>
<p>${esc(c1.text)}</p>
${quote(t, c1.quote)}
</article>`;
  }
  if (s.example === 'spam') return `<figure class="svc-figure">${spamSvg(t)}</figure>`;
  if (s.example === 'ki') {
    const portfolio = live.kiPortfolio ? `\n<li>${extLink(config.ki_portfolio_url, esc(L.kiPortfolio), t)}</li>` : '';
    return `<p>${esc(L.kiDemoText)}</p>
<ul class="svc-links" role="list">
<li><a class="text-link" href="${t.paths.home}#ki-demo">${esc(L.kiDemo)}</a></li>${portfolio}
</ul>`;
  }
  return '';
}

const section = (id, bg, title, body) => `<section class="svc-sec ${bg} edge" aria-labelledby="svc-${id}">
<div class="wrap svc-sec__in">
<h2 id="svc-${id}">${esc(title)}</h2>
${body}
</div>
</section>`;

export function servicePage(t, config, s, { live = {} } = {}) {
  const L = t.services.ui;
  const pk = packagesOf(t);
  const pkgs = s.packages.map((id) => pk[id]);
  const list = s.does ?? pkgs[0].bullets;
  const text = [...(s.doesText ?? []), ...(!s.does || s.withSummary ? pkgs.map((it) => it.summary) : [])];
  const cards = pkgs.map((it) => `<li class="svc-pkg">
<h3 class="svc-pkg__name">${esc(it.name)}</h3>
<p class="svc-pkg__price">${esc(it.price)}</p>
${it.extra ? `<p class="item__extra"><strong>${esc(it.extra.label)}</strong>, ${esc(it.extra.text)}</p>` : ''}
<a class="btn btn--sm btn--primary" href="${esc(mailto(t, config, it))}">${esc(t.pricing.cta)}<span class="sr-only">: ${esc(it.name)}</span></a>
</li>`).join('\n');
  const steps = s.steps.map(([title, line], i) => `<li class="svc-step"><span class="svc-step__n" aria-hidden="true">${i + 1}</span><h3>${esc(title)}</h3><p>${esc(line)}</p></li>`).join('\n');
  const faq = s.faq.map(([q, a]) => `<details class="faq__item svc-faq__item">
<summary>${esc(q)}</summary>
<p>${esc(a)}</p>
</details>`).join('\n');
  const related = s.related.map((k) => t.services.pages.find((p) => p.key === k)).map((p) => `<li><a class="svc-rel" href="${p.path}">${esc(p.h1)}</a></li>`).join('\n');
  const ex = example(t, config, s, live);
  const subjectOnly = `mailto:${config.contact_email}?subject=${t.contact.subject}`;

  return `<section class="svc-hero bg-hero">
<div class="wrap svc-hero__in">
${crumbs(t, s)}
<h1>${keepHyphenated(s.h1)}</h1>
<p class="lead">${esc(s.promise)}</p>
<div class="svc-prices">
${pkgs.map(priceChip).join('\n')}
</div>
<p><a class="btn btn--primary" href="${esc(mailto(t, config, pkgs[0]))}">${esc(t.pricing.cta)}<span class="sr-only">: ${esc(pkgs[0].name)}</span></a></p>
</div>
</section>
${section('problem', 'bg-pink', L.problem, `<p class="svc-text">${s.problem.map(esc).join(' ')}</p>`)}
${section('does', 'bg-blue', L.does, `<ul class="svc-list">${list.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
${text.map((p) => `<p class="svc-text">${esc(p)}</p>`).join('\n')}
<ul class="svc-pkgs" role="list">
${cards}
</ul>`)}
${section('steps', 'bg-pist', L.steps, `<ol class="svc-steps" role="list">
${steps}
</ol>`)}
${ex ? section('example', 'bg-lav', L.example, ex) : ''}
${section('faq', 'bg-peach', L.faq, `<div class="svc-faq">
${faq}
</div>`)}
<section class="svc-sec bg-pink edge" id="svc-contact" aria-labelledby="svc-related">
<div class="wrap svc-sec__in">
<h2 id="svc-related">${esc(L.related)}</h2>
<ul class="svc-rels" role="list">
${related}
</ul>
<div class="svc-contact">
<h2 class="svc-contact__title">${accent(t.contact.h2)}</h2>
<p class="lead">${esc(t.contact.text)} ${esc(t.contact.free)}</p>
<p class="svc-contact__actions"><a class="btn btn--primary" href="${esc(subjectOnly)}">${esc(t.contact.mail)}</a></p>
<ul class="svc-links" role="list">
<li><a class="text-link" href="${esc(subjectOnly)}">${esc(config.contact_email)}</a></li>
<li>${extLink(config.linkedin, esc(t.contact.linkedin), t)}</li>
<li>${extLink(config.malt, esc(t.contact.malt), t)}</li>
</ul>
</div>
</div>
</section>`;
}
