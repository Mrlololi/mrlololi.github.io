import { esc, quoted, accent } from './util.mjs';

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

export function references(t, config) {
  const c1 = t.refs.case1;
  return `<section class="section refs" id="references" aria-labelledby="refs-title">
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
<h3><a class="ext" href="${esc(config.case1_url)}" rel="noopener">${esc(c1.domain)}</a>${esc(c1.titleRest)}</h3>
<p>${esc(c1.text)}</p>
${quote(t, c1.quote)}
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
${quote(t, t.refs.case3.quote)}
</article>
</div>
${quote(t, t.refs.quote4, ' quote--big')}
</div>
</section>`;
}
