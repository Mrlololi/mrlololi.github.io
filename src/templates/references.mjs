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
<h2 id="refs-title">${accent(t.refs.h2)}</h2>
</div>
<article class="case case--feature">
<picture class="case__shot">
<source type="image/avif" srcset="/assets/img/case-alexandrafry-640.avif 640w, /assets/img/case-alexandrafry-1280.avif 1280w" sizes="(min-width: 960px) 40rem, 100vw">
<source type="image/webp" srcset="/assets/img/case-alexandrafry-640.webp 640w, /assets/img/case-alexandrafry-1280.webp 1280w" sizes="(min-width: 960px) 40rem, 100vw">
<img src="/assets/img/case-alexandrafry-640.jpg" srcset="/assets/img/case-alexandrafry-640.jpg 640w, /assets/img/case-alexandrafry-1280.jpg 1280w" sizes="(min-width: 960px) 40rem, 100vw" width="640" height="400" loading="lazy" decoding="async" alt="${esc(t.ui.caseImageAlt)}">
</picture>
<div class="case__body">
<h3>${extLink(config.case1_url, esc(c1.domain), t)}${esc(c1.titleRest)}</h3>
<p>${esc(c1.text)}</p>
</div>
</article>
<div class="cases">
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
<ul class="qcards" role="list">
<li class="qcard qcard--pink">${quote(t, c1.quote)}</li>
<li class="qcard qcard--blue">${quote(t, t.refs.case3.quote)}</li>
<li class="qcard qcard--pist">${quote(t, t.refs.quote4)}</li>
</ul>
</div>
</section>`;
}
