import { esc, fill, formatDate } from './util.mjs';

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

// One 404.html serves both languages: German first, the English line below it.
// Stage 5: both lists of service pages, so a wrong link still leads somewhere useful.
const serviceList = (t) => `<ul class="doc__links" role="list">
${t.services.pages.map((p) => `<li><a href="${p.path}">${esc(p.h1)}</a></li>`).join('\n')}
</ul>`;

export function notFound(t, alt) {
  return `<article class="doc">
<h1>${esc(t.notFound.h1)}</h1>
<p class="lead">${esc(t.notFound.text)}</p>
<p><a class="btn btn--primary" href="${t.paths.home}">${esc(t.notFound.link)}</a></p>
<section aria-labelledby="nf-services">
<h2 id="nf-services">${esc(t.services.ui.notFound)}</h2>
${serviceList(t)}
</section>
<p class="doc__alt" lang="${alt.lang}">${esc(alt.notFound.h1)} ${esc(alt.notFound.text)} <a href="${alt.paths.home}">${esc(alt.notFound.link)}</a></p>
<section lang="${alt.lang}" aria-labelledby="nf-services-alt">
<h2 id="nf-services-alt">${esc(alt.services.ui.notFound)}</h2>
${serviceList(alt)}
</section>
</article>`;
}
