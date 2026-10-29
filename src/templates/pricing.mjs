import { esc, accent } from './util.mjs';
import { loopButton } from './hero.mjs';

// Stage 6: «Leistungen und Preise» in one glance. On top the five «Welches Paket passt?» lines as
// jump links (the target card gets a short ring, CSS :target). Three main cards (name, price, one
// calm picture of the solved state, one sentence, at most four bullets, «Mehr zu …», «Anfragen»),
// then «Weitere Leistungen» as plain rows, the 30-day promise as one line, the tax line as small print.
const check = '<svg class="viz-check" viewBox="0 0 16 16" focusable="false"><circle cx="8" cy="8" r="7.5"/><path d="M4.6 8.3l2.2 2.2 4.6-5"/></svg>';
const MAIN = ['quick', 'check', 'launch'];
const MORE = ['website', 'ki', 'support'];

// Pictures of the solved state (HTML = end frame). Stage 6d: they move again, one after the other
// (assets/js/prices.js through loops.js): the checkout gets fixed, a lens ticks the list, the four
// tools come out of the launch, blocks drop into the One-Pager, the KI draft types itself, the
// 30-day strip ticks; then rest and again while the prices are on screen.
const VIZ = {
  quick: (t) => {
    const q = t.s4.starter.quick;
    return `<div class="viz viz--quick" aria-hidden="true">
<p class="mini-co__title">${esc(q.title)}</p>
<p class="mini-co__row"><span class="mini-co__line"></span><span class="mini-co__state"><span class="mini-co__bad">${esc(q.broken)}</span><span class="mini-co__ok">${check}${esc(q.fixed)}</span></span></p>
<p class="mini-co__pay">${esc(q.pay)}</p>
</div>`;
  },
  check: (t) => `<div class="viz viz--check" aria-hidden="true"><ul class="scan" role="list">${t.s4.starter.check.map((l, i) => `<li style="--i:${i}">${esc(l)}</li>`).join('')}</ul><span class="scan__lens"></span></div>`,
  launch: (t) => {
    const h = t.s4.projects.hub;
    return `<div class="viz viz--hub" aria-hidden="true">
<span class="hub__centre">${esc(h.centre)}</span>
${h.parts.map((p, i) => `<span class="hub__sat hub__sat--${i + 1}">${esc(p)}</span>`).join('')}
</div>`;
  },
  website: (t) => {
    const w = t.s4.projects.site;
    return `<div class="viz viz--site" aria-hidden="true"><div class="mini-browser"><p class="mini-browser__bar"><i></i><i></i><i></i><span>${esc(w.url)}</span></p><div class="mini-browser__page">${w.blocks.map((b, i) => `<span class="blk blk--${i + 1}">${esc(b)}</span>`).join('')}</div></div></div>`;
  },
  ki: (t) => {
    const c = t.s4.projects.chat;
    return `<div class="viz viz--chat" aria-hidden="true"><p class="tchat__q">${esc(c.q)}</p><p class="tchat__a"><span class="tchat__tag">${esc(c.tag)}</span><span class="tchat__text">${esc(c.a)}</span></p></div>`;
  },
};

const mailto = (t, email, it) => `mailto:${email}?subject=${encodeURIComponent(t.pricing.subjectPrefix + it.name)}`;
const pageFor = (t, id) => t.services.pages.find((p) => p.key === t.services.byPackage[id]);
// Stage 6b: Technik-Check and Betreuung get no «Mehr …» link (the card says enough, and their
// page is about ActiveCampaign); the others in the right case («Mehr zu KI-Antwortentwürfen»).
const NO_MORE = new Set(['check', 'support']);
const moreLink = (t, id, cls) => {
  const page = pageFor(t, id);
  return NO_MORE.has(id) || !page ? '' : `<a class="${cls}" href="${page.path}">${esc(page.moreLabel ?? `${t.services.ui.more} ${page.short}`)}</a>`;
};

function card(t, it, email) {
  const c = t.s6.pricing.cards[it.id];
  const badge = it.id === 'check' ? `<span class="label label--lav item__badge">${esc(t.s4.starter.recommended)}</span>` : '';
  return `<li class="item item--${it.id} card card--lift" id="pkg-${it.id}">
<div class="item__head">${badge}<h3 class="item__name">${esc(it.name)}</h3>
<p class="item__price">${esc(it.price)}</p></div>
${VIZ[it.id](t)}
<p class="item__line">${esc(c.line)}</p>
<ul class="item__bullets" role="list">${c.bullets.map((b) => `<li>${check}<span>${esc(b)}</span></li>`).join('')}</ul>
<div class="item__actions">
${moreLink(t, it.id, 'item__more')}
<a class="btn btn--sm btn--primary item__cta" href="${mailto(t, email, it)}">${esc(t.pricing.cta)}<span class="sr-only">: ${esc(it.name)}</span></a>
</div>
</li>`;
}

function row(t, it, email) {
  const ki = t.services.pages.find((p) => p.key === 'ki');
  // Stage 6e: a visible secondary button with a small mail icon, to the demo on the KI page.
  const example = it.id === 'ki' ? `<a class="btn btn--secondary btn--sm row__example" href="${ki.path}#ki-demo"><svg class="row__icon" viewBox="0 0 24 18" aria-hidden="true" focusable="false"><rect x="1.5" y="1.5" width="21" height="15" rx="3"/><path d="M3 3.5l9 7 9-7"/></svg>${esc(t.s6.b.example)}</a>` : '';
  return `<li class="row card${VIZ[it.id] ? ' row--viz' : ''}" id="pkg-${it.id}">
${VIZ[it.id] ? VIZ[it.id](t) : ''}
<div class="row__text"><h4 class="row__name">${esc(it.name)}</h4><p class="row__line">${esc(t.s6.pricing.rows[it.id])}</p></div>
<p class="row__price">${esc(it.price)}</p>
<p class="row__links">${moreLink(t, it.id, 'row__more')}${example}</p>
<a class="btn btn--secondary btn--sm row__ask" href="${mailto(t, email, it)}">${esc(t.pricing.cta)}<span class="sr-only">: ${esc(it.name)}</span></a>
</li>`;
}

export function pricing(t, config) {
  const p = t.s6.pricing;
  const items = Object.fromEntries(t.pricing.groups.flatMap((g) => g.items).map((it) => [it.id, it]));
  const chooser = t.finder.static.map(([text, id]) => `<li><a class="chooser__row" href="#pkg-${id}"><span>${esc(text)}</span><span class="chooser__to"><span aria-hidden="true">→</span> <strong>${esc(items[id].name)}</strong></span></a></li>`).join('\n');
  return `<section class="section services bg-pink edge" id="services" aria-labelledby="services-title">
<div class="wrap">
<div class="section__head">
<h2 id="services-title" data-enter="lines">${accent(t.pricing.h2)}</h2>
<p class="lead">${esc(p.intro)}</p>
</div>
<div class="tariff" id="pricing" data-demo="prices">
<nav class="chooser card" aria-labelledby="chooser-title">
<p class="chooser__title" id="chooser-title">${esc(p.chooser)}</p>
<ul class="chooser__list" role="list">
${chooser}
</ul>
</nav>
<ul class="pkgs" role="list">
${MAIN.map((id) => card(t, items[id], config.contact_email)).join('\n')}
</ul>
<div class="promise">${check}<p>${esc(p.promise)}</p>
<ol class="days" role="list" aria-hidden="true">${t.s6.c.days.map((d) => `<li>${esc(d)}</li>`).join('')}</ol>
</div>
<p class="tariff__ctl">${loopButton(t, 'prices')}</p>
<div class="more">
<h3 class="more__title">${esc(p.more)}</h3>
<ul class="rows" role="list">
${MORE.map((id) => row(t, items[id], config.contact_email)).join('\n')}
</ul>
</div>
<p class="notdo-line">${esc(t.s6.b.notDo)}</p>
<p class="small tariff__tax">${esc(t.pricing.smallPrint)}</p>
</div>
</div>
</section>`;
}

// «Nicht sicher, was passt?» strip: closes «So arbeiten wir zusammen» and the references.
export function ctaStrip(t) {
  return `<div class="ctastrip">
<p class="ctastrip__text">${esc(t.s6.cta.text)}</p>
<a class="btn btn--primary" href="#contact">${esc(t.s6.cta.button)}</a>
</div>`;
}
