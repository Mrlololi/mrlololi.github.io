import { esc, fill, formatDate } from './util.mjs';
import { mascotSvg } from '../../assets/js/mascot-art.js';
import { loopButton } from './hero.mjs';

const mail = (config) => `<a href="mailto:${esc(config.contact_email)}">${esc(config.contact_email)}</a>`;

// Legal 29.10.2026: the phone is the second contact under § 5 ECG and appears only in the Impressum.
const phone = (L, config) => config.phone
  ? `<br>\n${esc(L.phoneLabel)}: <a href="tel:${config.phone.replace(/[^+\d]/g, '')}">${esc(config.phone)}</a>`
  : '';

function facts(rows, config) {
  return rows
    .filter(([, value]) => value !== '{uid}' || config.uid)
    .map(([label, value]) => `<dt>${esc(label)}</dt>\n<dd>${value === '{uid}' ? esc(config.uid) : esc(value)}</dd>`)
    .join('\n');
}

export function impressum(t, config) {
  const L = t.legalPage;
  return `<article class="doc">
<h1>${esc(L.h1)}</h1>
<section>
<address>${L.address.map(esc).join('<br>')}<br>
${esc(L.emailLabel)}: ${mail(config)}${phone(L, config)}</address>
</section>
<section>
<dl>
${facts(L.facts, config)}
</dl>
</section>
<section aria-labelledby="disclosure">
<h2 id="disclosure">${esc(L.disclosureTitle)}</h2>
<dl>
${facts(L.disclosure, config)}
</dl>
</section>
<section aria-labelledby="links">
<h2 id="links">${esc(L.linksTitle)}</h2>
<p>${esc(L.links)}</p>
</section>
</article>`;
}

export function privacy(t, config, { date }) {
  const P = t.privacyPage;
  const sections = P.sections
    .filter((s) => s.key !== 'booking' || config.booking_url)
    .map((s) => {
      // {email} becomes a mailto link; everything else is escaped text.
      let text = fill(esc(s.text), { email: mail(config) });
      if (s.dpf && config.github_dpf_verified) text += ` ${esc(s.dpf)}`;
      return `<section>
<h2>${esc(s.title)}</h2>
<p>${text}</p>
</section>`;
    })
    .join('\n');
  return `<article class="doc">
<h1>${esc(P.h1)}</h1>
${sections}
<p class="small">${esc(t.ui.lastUpdated)}: ${formatDate(date, t.locale)}</p>
</article>`;
}

// Stage 6: one 404.html for both languages (German first, English below), noindex (layout).
// The scene: Logik looks at a flow line broken between two nodes, Lösung walks in and snaps it
// together once, Live waves; then everything rests. The HTML is the repaired still (no JS, reduced
// motion); assets/js/notfound.js plays it once from the broken frame. Hovering or focusing a link
// card sends one pulse along the repaired line.
// A mascot nested in the scene's SVG at x (66 units wide, about 56 px at a 340 px wide scene).
const nfMascot = (i, emo, cls, x) => `<g class="nf__m nf__m--${cls}">${mascotSvg(i, emo, `class="mascot" data-base="${emo}" x="${x}" y="78" width="66" height="68"`, '-404')}</g>`;

function nfScene(t) {
  const [a, b] = t.s6.notFound.nodes;
  return `<div class="nf__scene demo" data-demo="404" aria-hidden="true">
<svg class="nf__line" viewBox="0 0 400 150" focusable="false">
<path class="nf__wire nf__wire--a" d="M138 40H186"/><path class="nf__wire nf__wire--b" d="M214 40H262"/>
<path class="nf__fixed" pathLength="1" d="M138 40H262"/>
<path class="nf__pulse" pathLength="100" d="M138 40H262"/>
<g class="nf__node nf__node--a"><rect x="8" y="20" width="130" height="40" rx="14"/><text x="73" y="45" text-anchor="middle">${esc(a)}</text></g>
<g class="nf__node nf__node--b"><rect x="262" y="20" width="130" height="40" rx="14"/><text x="327" y="45" text-anchor="middle">${esc(b)}</text></g>
${nfMascot(0, 'think', 'logik', 150)}${nfMascot(1, 'joy', 'loesung', 214)}${nfMascot(2, 'wave', 'live', 300)}
</svg>
</div>`;
}

function nfLinks(t, ratgeber) {
  const n = t.s6.notFound;
  const links = [
    [t.paths.home, n.home],
    ...t.services.pages.map((p) => [p.path, p.short]),
    ...(ratgeber && t.ratgeber ? [[t.ratgeber.path, t.ratgeber.h1]] : []),
    [`${t.paths.home}#projects`, n.projects],
    [`${t.paths.home}#contact`, n.contact],
  ];
  return `<ul class="nf__links" role="list" aria-label="${esc(n.label)}">
${links.map(([href, label]) => `<li><a class="nf__card card" href="${href}">${esc(label)}</a></li>`).join('\n')}
</ul>`;
}

export function notFound(t, alt, { ratgeber = false } = {}) {
  return `<article class="nf">
<div class="nf__in">
${nfScene(t)}
<p class="nf__caption">${esc(t.s6.b.repaired)}</p>
<p class="nf__ctl">${loopButton(t, 'notFound')}</p>
<h1>${esc(t.s6.notFound.h1)}</h1>
<p class="lead">${esc(t.s6.notFound.lead)}</p>
${nfLinks(t, ratgeber)}
</div>
<section class="nf__in nf__alt" lang="${alt.lang}" aria-labelledby="nf-alt">
<h2 id="nf-alt">${esc(alt.s6.notFound.h1)}</h2>
<p class="lead">${esc(alt.s6.notFound.lead)}</p>
${nfLinks(alt, false)}
</section>
</article>`;
}
