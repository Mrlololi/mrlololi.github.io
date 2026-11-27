import { esc, accent, absUrl, extLink, quoted, keepHyphenated, note } from './util.mjs';
import { shotFrame, claudiaQuote } from './references.mjs';
import { kiDemo, calculator } from './ki.mjs';
import { videoFigure, videoLd } from './video.mjs';
import { contactForm } from './sections.mjs';

// Stage 5 (28.10.2026): one light template for the five service pages (DE and EN). No mascots here:
// the pages show prices and must stay fast (Lighthouse mobile >= 95). Stage 6: the KI page carries
// the one KI demo and the calculator, the German launch page the video under the promise; their
// scripts load only when they come near (main.js).

export const packagesOf = (t) => Object.fromEntries(t.pricing.groups.flatMap((g) => g.items).map((it) => [it.id, it]));

// «Focus phrase | mrlololi», or explicit s.title when H1 would pass 60 characters.
export const serviceTitle = (s) => (s.title || (`${s.h1} | mrlololi`.length <= 60 ? `${s.h1} | mrlololi` : s.h1));

// Stage 6f: «Anfragen» leads to the form with the package preselected (assets/js/contact.js reads ?paket=).
const ask = (t, it) => `${t.paths.home}?paket=${it.id}#contact`;
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
      ...(s.key === 'launch' && t.s6.video ? { subjectOf: { '@id': videoLd(t, config)['@id'] } } : {}),
    },
    ...(s.key === 'launch' && t.s6.video ? [videoLd(t, config)] : []),
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
    // Referenz Claudia (25.11.2026): the named case on /launch-technik/, the short card on /activecampaign-einrichten/.
    const c = t.refs.case2;
    const head = `<h3>${esc(c.title)}</h3>
${extLink(config.case2_url, esc(c.domain), t, { cls: 'ref__site' })}`;
    if (s.key === 'launch') {
      return `<article class="svc-case svc-case--claudia">
${head}
<p>${esc(c.text)}</p>
<h4>${esc(c.changesTitle)}</h4>
<ul class="svc-list">${c.changes.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
${claudiaQuote(t, c, c.longQuote)}
<div class="claudia-shots">
${c.shots.map(([n, alt]) => shotFrame(n, c.domain, alt, '(min-width: 800px) 20rem, 100vw')).join('\n')}
</div>
<p class="ref__honest">${esc(c.honest)}</p>
</article>`;
    }
    return `<article class="svc-card svc-card--claudia">
${head}
<ul class="ref__tools" role="list">${c.tools.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
${claudiaQuote(t, c, c.acQuote)}
<p class="ref__honest">${esc(c.honest)}</p>
</article>`;
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
<h3>${esc(c1.title)}</h3>
${extLink(config.case1_url, esc(c1.domain), t, { cls: 'ref__site' })}
<p>${esc(c1.text)}</p>
${quote(t, c1.quote)}
</article>`;
  }
  if (s.example === 'spam') return `${s.exampleText ? `<p class="svc-text">${esc(s.exampleText)}</p>\n` : ''}<figure class="svc-figure">${spamSvg(t)}</figure>`;
  if (s.example === 'ki') return `${kiDemo(t, config, { live })}
${calculator(t)}`;
  return '';
}

const section = (id, bg, title, body) => `<section class="svc-sec ${bg} edge" aria-labelledby="svc-${id}">
<div class="wrap svc-sec__in">
<h2 id="svc-${id}" data-enter="lines">${esc(title)}</h2>
${body}
</div>
</section>`;

// R2 (December release): one door to the Technik-Check before «So läuft es ab». launch: the check block with
// the report and a local «Technik-Check anfragen»; spam and ActiveCampaign: Quick-Fix first, then the Technik-Check
// with the report; KI and website: one text link to the report. EN: the same, the report marked as German.
function door(t, config, s) {
  const D = t.services.ui.door;
  const report = config.check_report_url;
  if (!s.door || !report) return '';
  const link = (text) => `<a class="text-link" href="${esc(report)}">${esc(text)}</a>`;
  const body = s.door === 'check'
    ? `<p><strong>${esc(D.check[0])}</strong> ${esc(D.check[1])}</p>
<p class="svc-door__links">${link(D.report)}<a class="text-link" href="${esc(`${s.path}?paket=check#svc-form`)}">${esc(D.checkAsk)}</a></p>`
    : s.door === 'quickcheck'
      ? `<p>${esc(D.quick)}</p>
<p>${esc(D.several)}</p>
<p class="svc-door__links">${link(D.report)}</p>`
      : `<p class="svc-door__links">${link(D.reportShort)}</p>`;
  return `<div class="svc-sec svc-door-sec bg-blue"><div class="wrap svc-sec__in"><div class="svc-door${s.door === 'link' ? ' svc-door--link' : ''}">
${body}
</div></div></div>`;
}

export function servicePage(t, config, s, { live = {} } = {}) {
  const L = t.services.ui;
  const pk = packagesOf(t);
  const pkgs = s.packages.map((id) => pk[id]);
  const list = s.does ?? pkgs[0].bullets;
  const text = [...(s.doesText ?? []), ...(!s.does || s.withSummary ? pkgs.map((it) => it.summary) : [])];
  const cards = pkgs.map((it) => `<li class="svc-pkg">
<h3 class="svc-pkg__name">${esc(it.name)}</h3>
<p class="svc-pkg__price">${esc(it.price)}</p>
${it.extra ? `<p class="item__extra"><strong>${esc(it.extra.label)}</strong>, ${esc(it.extra.text)}</p>` : ''}${it.id === 'check' ? `
<p class="item__referral small">${esc([t.s4.starter.checkCredit, note(config, 'credit_winter', t.lang)].filter(Boolean).join(' '))}</p>` : ''}
<a class="btn btn--sm btn--primary" href="${esc(`${s.path}?paket=${it.id}#svc-form`)}">${esc(t.pricing.cta)}<span class="sr-only">: ${esc(it.name)}</span></a>
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
<p><a class="btn btn--primary" href="#svc-form">${esc(t.pricing.cta)}<span class="sr-only">: ${esc(pkgs[0].name)}</span></a></p>
</div>
</section>
${s.key === 'launch' && t.s6.video ? `<section class="svc-sec svc-video bg-pist edge" aria-labelledby="svc-video">
<div class="wrap svc-sec__in">
<h2 id="svc-video" data-enter="lines">${accent(t.s6.video.h2)}</h2>
<p class="svc-text">${esc(t.s6.video.text)}</p>
${videoFigure(t)}
</div>
</section>` : ''}
${section('problem', 'bg-pink', L.problem, `<p class="svc-text">${s.problem.map(esc).join(' ')}</p>${s.explain && !s.explain.place ? `
<aside class="svc-explain" aria-labelledby="svc-explain">
<h3 id="svc-explain">${esc(s.explain.title)}</h3>
<p>${esc(s.explain.text)}${s.explain.note ? ` ${esc(note(config, s.explain.note, t.lang))}` : ''}</p>
</aside>` : ''}`)}
${section('does', 'bg-blue', L.does, `<ul class="svc-list">${list.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
${text.map((p) => `<p class="svc-text">${esc(p)}</p>`).join('\n')}${s.need ? `\n<p class="svc-text svc-need"><strong>${esc(s.need[0])}</strong> ${esc(s.need[1])}</p>` : ''}
<ul class="svc-pkgs" role="list">
${cards}
</ul>${s.explain?.place === 'does' ? `
<aside class="svc-explain svc-facts" aria-labelledby="svc-explain">
<h3 id="svc-explain">${esc(s.explain.title)}</h3>
<ul class="svc-facts__list" role="list">${s.explain.parts.map(([label, x]) => `<li><strong>${esc(label)}:</strong> ${esc(x)}</li>`).join('')}</ul>${note(config, s.explain.note, t.lang) ? `
<p class="svc-facts__note">${esc(note(config, s.explain.note, t.lang))}</p>` : ''}
</aside>` : ''}`)}
${door(t, config, s)}
${section('steps', 'bg-pist', L.steps, `<ol class="svc-steps" role="list">
${steps}
</ol>${s.testLink && t.qualitaet && live.qualitaet ? `
<p class="svc-testlink"><a class="text-link" href="${t.qualitaet.path}">${esc(s.testLink)}</a></p>` : ''}`)}
${ex ? section('example', 'bg-lav', L.example, ex) : ''}
${section('faq', 'bg-peach', L.faq, `<div class="svc-faq">
${faq}
</div>`)}
<section class="svc-sec bg-pink edge" id="svc-contact" aria-labelledby="svc-related">
<div class="wrap svc-sec__in">
<h2 id="svc-related" data-enter="lines">${esc(L.related)}</h2>
<ul class="svc-rels" role="list">
${related}
</ul>
<div class="svc-contact">
<h2 class="svc-contact__title">${accent(t.contact.h2)}</h2>
<p class="lead">${esc(t.contact.text)} ${esc(t.contact.free)}</p>
<div class="svc-form" id="svc-form">${note(config, 'availability', t.lang) ? `
<p class="contact__when">${esc(note(config, 'availability', t.lang))}</p>` : ''}
${contactForm(t, config, { page: s.path, paket: pkgs[0].id, compact: true })}
</div>
<ul class="svc-links" role="list">
<li><a class="text-link" href="${esc(subjectOnly)}">${esc(config.contact_email)}</a></li>
<li>${extLink(config.linkedin, esc(t.contact.linkedin), t, { me: true })}</li>
<li>${extLink(config.malt, esc(t.contact.malt), t, { me: true })}</li>
</ul>
</div>
</div>
</section>`;
}
