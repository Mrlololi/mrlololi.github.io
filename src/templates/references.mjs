import { esc, quoted, accent, extLink } from './util.mjs';
import { ctaStrip } from './pricing.mjs';

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
    `<li class="ref card ref--course"><span class="label label--lav">${esc(L.course)}</span>
<h3>${esc(r.case2.title)}</h3>
<p>${esc(r.case2.text)}</p>
<ul class="ref__tools" role="list">${B.tools.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
<p class="ref__honest">${esc(B.honest)}</p>
<a class="text-link" href="${t.s6.video ? '#video' : '#path'}">${esc(B.video)}</a></li>`,
    `<li class="ref card ref--site"><span class="label label--pink">${esc(L.site)}</span>
<h3>${extLink(config.case1_url, esc(r.case1.domain), t)}${esc(r.case1.titleRest)}</h3>
${shot}
<p>${esc(r.case1.text)}</p></li>`,
    `<li class="ref card ref--shop"><span class="label label--blue">${esc(L.shop)}</span>
<h3>${esc(r.case3.title)}</h3>
<p>${esc(r.case3.text)}</p></li>`,
  ];
  return `<section class="section refs bg-pist edge" id="references" aria-labelledby="refs-title">
<div class="wrap">
<div class="section__head">
<h2 id="refs-title" data-enter="lines">${accent(r.h2)}</h2>
<p class="small refs__note">${esc(t.s6.refs.note)}</p>
</div>
<ul class="refs__list" role="list" data-enter="stagger">
${cards.join('\n')}
</ul>
<ul class="qcards" role="list" tabindex="0" aria-label="${esc(t.s4.refs.quotes)}">
<li class="qcard qcard--pink">${quote(t, r.case1.quote)}</li>
<li class="qcard qcard--blue">${quote(t, r.case3.quote)}</li>
<li class="qcard qcard--pist"><span class="label label--peach">${esc(L.earlier)}</span>${quote(t, r.quote4)}<p class="ref__line">${esc(B.earlierLine)}</p></li>
</ul>
${config.case_study ? study(t, config.case_study) : ''}
${ctaStrip(t)}
</div>
</section>`;
}

// Stage 6, «Eigene Projekte»: a compact row. Each card is one link (no links inside it) with a 4:3
// screenshot and one «Was es zeigt» line; «Alle Webprojekte» leads to the overview. Webprojekte
// links open in a new tab and say so (as everywhere since the Fixes of 21.10.2026).
export function projects(t, config) {
  const p = t.s6.projects;
  const also = p.more.map((it) => extLink(`${config.projects_url}${it.path}`, esc(it.name), t)).join(` ${esc(t.s6.b.projects.and)} `);
  const cards = p.items.map((it) => `<li class="proj">
<a class="proj__link card" href="${config.projects_url}${it.path}" target="_blank" rel="noopener">
<picture><source type="image/avif" srcset="/assets/img/project-${it.key}-400.avif 400w, /assets/img/project-${it.key}-800.avif 800w" sizes="(min-width: 960px) 16rem, (min-width: 560px) 45vw, 90vw"><source type="image/webp" srcset="/assets/img/project-${it.key}-400.webp 400w, /assets/img/project-${it.key}-800.webp 800w" sizes="(min-width: 960px) 16rem, (min-width: 560px) 45vw, 90vw"><img src="/assets/img/project-${it.key}-400.jpg" srcset="/assets/img/project-${it.key}-400.jpg 400w, /assets/img/project-${it.key}-800.jpg 800w" sizes="(min-width: 960px) 16rem, (min-width: 560px) 45vw, 90vw" width="400" height="300" loading="lazy" decoding="async" alt=""></picture>
<span class="proj__name">${esc(it.name)}</span>
<span class="proj__shows"><span class="proj__label">${esc(p.shows)}</span> ${esc(it.shows)}</span><span class="sr-only"> ${esc(t.ui.newTab)}</span>
</a>
</li>`).join('\n');
  return `<section class="section projects bg-lav edge" id="projects" aria-labelledby="projects-title">
<div class="wrap">
<div class="projects__head">
<div><h2 id="projects-title">${accent(p.h2)}</h2>
<p class="projects__line">${esc(p.line)}</p></div>
<p class="projects__all">${extLink(config.projects_url, esc(p.all), t)}</p>
</div>
<ul class="projs" role="list">
${cards}
</ul>
<p class="projects__also">${esc(t.s6.b.projects.also)} ${also}</p>
</div>
</section>`;
}
