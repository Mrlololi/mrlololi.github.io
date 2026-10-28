import { esc, quoted, accent, extLink } from './util.mjs';

function quote(t, q, extraClass = '') {
  const langAttr = q.lang !== t.lang ? ` lang="${q.lang}"` : '';
  const translation = q.translation
    ? `\n<p class="quote__translation">${esc(t.ui.translation)} ${esc(quoted(q.translation, t.lang))}</p>`
    : '';
  return `<figure class="quote${extraClass}">
<blockquote${langAttr}><p>${esc(quoted(q.text, q.lang))}</p></blockquote>${translation}
<figcaption>${esc(q.source)}</figcaption>
</figure>`;
}

// Stage 4: the long screenshot scrolls inside a browser frame that grows from 0.94 to 1 (sections.js);
// the three quote cards start stacked and fan out to their tilts with the scroll.

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

export function references(t, config) {
  const c1 = t.refs.case1;
  return `<section class="section refs bg-pist edge" id="references" aria-labelledby="refs-title">
<div class="wrap">
<div class="section__head">
<h2 id="refs-title" data-enter="lines">${accent(t.refs.h2)}</h2>
</div>
<article class="case case--feature">
<div class="browser"><div class="browser__bar" aria-hidden="true"><i></i><i></i><i></i><span>${esc(c1.domain)}</span></div>
<div class="browser__view">
<picture class="case__shot">
<source type="image/avif" srcset="/assets/img/case-alexandrafry-long-640.avif 640w, /assets/img/case-alexandrafry-long-1280.avif 1280w" sizes="(min-width: 960px) 40rem, 100vw">
<source type="image/webp" srcset="/assets/img/case-alexandrafry-long-640.webp 640w, /assets/img/case-alexandrafry-long-1280.webp 1280w" sizes="(min-width: 960px) 40rem, 100vw">
<img src="/assets/img/case-alexandrafry-long-640.jpg" srcset="/assets/img/case-alexandrafry-long-640.jpg 640w, /assets/img/case-alexandrafry-long-1280.jpg 1280w" sizes="(min-width: 960px) 40rem, 100vw" width="640" height="1067" loading="lazy" decoding="async" alt="${esc(t.ui.caseImageAlt)}">
</picture>
</div>
</div>
<div class="case__body">
<h3>${extLink(config.case1_url, esc(c1.domain), t)}${esc(c1.titleRest)}</h3>
<p>${esc(c1.text)}</p>
</div>
</article>
<div class="cases" data-enter="stagger">
<article class="case">
<h3>${esc(t.refs.case2.title)}</h3>
<p>${esc(t.refs.case2.text)}</p>
</article>
<article class="case">
<h3>${esc(t.refs.case3.title)}</h3>
<p>${esc(t.refs.case3.text)}</p>
</article>
</div>
${config.case_study ? study(t, config.case_study) : ''}
<ul class="qcards" role="list" tabindex="0" aria-label="${esc(t.s4.refs.quotes)}">
<li class="qcard qcard--pink">${quote(t, c1.quote)}</li>
<li class="qcard qcard--blue">${quote(t, t.refs.case3.quote)}</li>
<li class="qcard qcard--pist">${quote(t, t.refs.quote4)}</li>
</ul>
</div>
</section>`;
}
