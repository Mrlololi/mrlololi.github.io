import { esc, quoted, accent, extLink } from './util.mjs';

function quote(t, q) {
  const langAttr = q.lang !== t.lang ? ` lang="${q.lang}"` : '';
  const translation = q.translation
    ? `\n<p class="quote__translation">${esc(t.ui.translation)} ${esc(quoted(q.translation, t.lang))}</p>`
    : '';
  return `<figure class="quote">
<blockquote${langAttr}><p>${esc(quoted(q.text, q.lang))}</p></blockquote>${translation}
<figcaption>${esc(q.source)}</figcaption>
</figure>`;
}

// Case study with real, documented numbers only: rendered when config.case_study is set.
function study(t, s) {
  const tiles = (s.tiles || []).map((x) => `<li><span class="study__value">${esc(x.value)}</span><span class="study__label">${esc(x.label)}</span></li>`).join('');
  return `<article class="study">
<h3>${esc(t.refs.study.title)}</h3>
<div class="study__cols">
<div><p class="study__label">${esc(t.refs.study.before)}</p><p>${esc(s.before)}</p></div>
<div><p class="study__label">${esc(t.refs.study.after)}</p><p>${esc(s.after)}</p></div>
</div>
<ul class="study__tiles" role="list">${tiles}</ul>
</article>`;
}

// Stage 6/6b: the course creator first (tools, the honest line, the video), alexandrafry.ch with its
// long screenshot scrolling inside the browser frame, the shop work. Stage 6d: the three quotes are
// back in the fanned stack (Fry pink, Ditoma blue, CMX white with «Frühere Tätigkeit»); it opens as
// soon as it enters the window and is fully spread by the time its centre is at 60 % (sections.js).
// Referenz Claudia (25.11.2026): a first-screen shot (1440 x 900 source, 16:10) in the browser frame.
export const shotFrame = (name, domain, alt, sizes = '(min-width: 800px) 34rem, 100vw') => `<div class="browser"><div class="browser__bar" aria-hidden="true"><i></i><i></i><i></i><span>${esc(domain)}</span></div>
<picture>
<source type="image/avif" srcset="/assets/img/${name}-640.avif 640w, /assets/img/${name}-1280.avif 1280w" sizes="${sizes}">
<source type="image/webp" srcset="/assets/img/${name}-640.webp 640w, /assets/img/${name}-1280.webp 1280w" sizes="${sizes}">
<img src="/assets/img/${name}-640.jpg" srcset="/assets/img/${name}-640.jpg 640w, /assets/img/${name}-1280.jpg 1280w" sizes="${sizes}" width="640" height="400" loading="lazy" decoding="async" alt="${esc(alt)}">
</picture>
</div>`;
// Her quote with her round photo (Holzwand, 56 px) in the caption.
export const claudiaQuote = (t, c, q, cls = '') => {
  const langAttr = q.lang !== t.lang ? ` lang="${q.lang}"` : '';
  const translation = q.translation ? `\n<p class="quote__translation">${esc(t.ui.translation)} ${esc(quoted(q.translation, t.lang))}</p>` : '';
  return `<figure class="quote quote--claudia${cls ? ` ${cls}` : ''}">
<blockquote${langAttr}><p>${esc(quoted(q.text, q.lang))}</p></blockquote>${translation}
<figcaption><picture><source type="image/avif" srcset="/assets/img/claudia-photo-56.avif 1x, /assets/img/claudia-photo-112.avif 2x"><source type="image/webp" srcset="/assets/img/claudia-photo-56.webp 1x, /assets/img/claudia-photo-112.webp 2x"><img class="quote__photo" src="/assets/img/claudia-photo-56.jpg" srcset="/assets/img/claudia-photo-112.jpg 2x" width="56" height="56" loading="lazy" decoding="async" alt=""></picture><span>${esc(q.source)}</span></figcaption>
</figure>`;
};
const claudiaLogo = (c) => `<picture class="ref__logo"><source type="image/avif" srcset="/assets/img/claudia-logo-135.avif 1x, /assets/img/claudia-logo-270.avif 2x"><source type="image/webp" srcset="/assets/img/claudia-logo-135.webp 1x, /assets/img/claudia-logo-270.webp 2x"><img src="/assets/img/claudia-logo-135.png" srcset="/assets/img/claudia-logo-270.png 2x" width="135" height="48" loading="lazy" decoding="async" alt="${esc(c.logoAlt)}"></picture>`;

export function references(t, config) {
  const r = t.refs;
  const L = t.s6.refs.labels;
  const B = t.s6.b.refs;
  const shot = `<div class="browser"><div class="browser__bar" aria-hidden="true"><i></i><i></i><i></i><span>${esc(r.case1.domain)}</span></div>
<div class="browser__view">
<picture class="case__shot">
<source type="image/avif" srcset="/assets/img/case-alexandrafry-long-640.avif 640w, /assets/img/case-alexandrafry-long-1280.avif 1280w" sizes="(min-width: 800px) 34rem, 100vw">
<source type="image/webp" srcset="/assets/img/case-alexandrafry-long-640.webp 640w, /assets/img/case-alexandrafry-long-1280.webp 1280w" sizes="(min-width: 800px) 34rem, 100vw">
<img src="/assets/img/case-alexandrafry-long-640.jpg" srcset="/assets/img/case-alexandrafry-long-640.jpg 640w, /assets/img/case-alexandrafry-long-1280.jpg 1280w" sizes="(min-width: 800px) 34rem, 100vw" width="640" height="1067" loading="lazy" decoding="async" alt="${esc(t.ui.caseImageAlt)}">
</picture>
</div>
</div>`;
  const cards = [
    // Referenz Claudia (25.11.2026): her offer as the tag, her logo, the link on its own line, the tools, her start page,
    // her quote with her photo, «Zusammenarbeit 2026.».
    `<li class="ref card ref--course ref--claudia"><div class="ref__head"><span class="label label--lav">${esc(r.case2.tag)}</span>${claudiaLogo(r.case2)}</div>
<h3>${esc(r.case2.title)}</h3>
${extLink(config.case2_url, esc(r.case2.domain), t, { cls: 'ref__site' })}
<p>${esc(r.case2.text)}</p>
<ul class="ref__tools" role="list">${r.case2.tools.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
${shotFrame('claudia-startseite', r.case2.domain, r.case2.shotAlt)}
${claudiaQuote(t, r.case2, r.case2.quote)}
<p class="ref__honest">${esc(r.case2.honest)}</p></li>`,
    `<li class="ref card ref--site"><span class="label label--pink">${esc(L.site)}</span>
<h3>${esc(r.case1.title)}</h3>
${extLink(config.case1_url, esc(r.case1.domain), t, { cls: 'ref__site' })}
${shot}
<p>${esc(r.case1.text)}</p></li>`,
    `<li class="ref card ref--shop"><span class="label label--blue">${esc(L.shop)}</span>
<h3>${esc(r.case3.title)}</h3>
<p>${esc(r.case3.text)}</p></li>`,
  ];
  // Stage 6f: the quotes by relevance; on EN the English one first. A course client's quote takes the
  // first place once a real text exists (r.courseQuote, none yet). They fan out once (sections.js).
  const qcards = [
    r.courseQuote ? `<li class="qcard qcard--lav">${quote(t, r.courseQuote)}</li>` : '',
    `<li class="qcard qcard--pink">${quote(t, r.case1.quote)}</li>`,
    `<li class="qcard qcard--blue">${quote(t, r.case3.quote)}</li>`,
    `<li class="qcard qcard--pist"><span class="label label--peach">${esc(L.earlier)}</span>${quote(t, r.quote4)}<p class="ref__line">${esc(B.earlierLine)}</p></li>`,
  ].filter(Boolean);
  if (t.lang === 'en') qcards.unshift(qcards.splice(qcards.length - 1, 1)[0]);
  return `<section class="section refs bg-pist edge" id="references" aria-labelledby="refs-title">
<div class="wrap">
<div class="section__head">
<h2 id="refs-title" data-enter="lines">${accent(r.h2)}</h2>
<p class="small refs__note">${esc(t.s6.refs.note)}</p>
</div>
<ul class="refs__list" role="list" data-enter="stagger">
${cards.join('\n')}
</ul>
<ul class="qcards" role="list" aria-label="${esc(t.s4.refs.quotes)}">
${qcards.join('\n')}
</ul>
${config.case_study ? study(t, config.case_study) : ''}
</div>
</section>`;
}

// R5 «Zum Ausprobieren» (docs/PROMPT_R5_Zum_Ausprobieren_2026-11-25.md): three clickable cards in a row on desktop
// (stacked on phones), each with a static preview in the existing CSS browser frame. «Weitere Projekte» below.
export function projects(t, config) {
  const p = t.s6.projects;
  const sizes = '(min-width: 900px) 22rem, 92vw';
  const card = (it) => {
    const href = it.external ? `${config.projects_url}${it.path}` : it.href;
    const ext = it.external ? ` target="_blank" rel="noopener"` : '';
    const sr = it.external ? `<span class="sr-only"> ${esc(t.ui.newTab)}</span>` : '';
    const pic = `<div class="browser"><div class="browser__bar" aria-hidden="true"><i></i><i></i><i></i><span>${esc(it.bar)}</span></div><div class="browser__view"><picture><source type="image/avif" srcset="/assets/img/${it.img}-400.avif 400w, /assets/img/${it.img}-800.avif 800w" sizes="${sizes}"><source type="image/webp" srcset="/assets/img/${it.img}-400.webp 400w, /assets/img/${it.img}-800.webp 800w" sizes="${sizes}"><img src="/assets/img/${it.img}-400.jpg" srcset="/assets/img/${it.img}-400.jpg 400w, /assets/img/${it.img}-800.jpg 800w" sizes="${sizes}" width="${it.w}" height="${it.h}" loading="lazy" decoding="async" alt="${esc(it.alt)}"></picture></div></div>`;
    return `<li class="proj proj--try"><a class="proj__link proj__link--try card" href="${esc(href)}"${ext}>
${pic}
<span class="proj__name">${esc(it.name)}</span>
<span class="proj__shows">${esc(it.text)}</span>${sr}
</a></li>`;
  };
  return `<section class="section projects bg-lav edge" id="projects" aria-labelledby="projects-title">
<div class="wrap">
<div class="projects__head">
<div><h2 id="projects-title" data-enter="lines">${accent(p.h2)}</h2>
<p class="projects__line">${esc(p.line)}</p></div>
</div>
<ul class="projs projs--try" role="list" data-enter="stagger">
${p.tryItems.map(card).join('\n')}
</ul>
<p class="projects__all projects__all--below">${extLink(config.projects_url, esc(p.all), t)}</p>
</div>
</section>`;
}
