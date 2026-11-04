import { esc, fill } from './util.mjs';

// Stage 6f (4.11.2026): the run-log is the second tab of the video frame («Video | Schritt für Schritt»,
// EN «Overview | Step by step»). One purchase in six steps: order form, payment, invoice, tag, access,
// welcome mail. A first-name field (prefilled «Anna») and «Anmelden» start it; without an action it
// starts by itself after 4 s (assets/js/runlog.js). Forward only, one step at a time with its log line.
// The HTML is the end frame (every step done), for no JS and reduced motion. Its CSS and JS load when
// the tab first opens (main.js). Nothing is sent, no e-mail address is asked for.
const check = '<svg class="rl__check" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><circle cx="10" cy="10" r="9"/><path d="M5.6 10.3l2.9 2.9 5.9-6.4"/></svg>';

export function runlog(t) {
  const r = t.s6.r;
  const name = esc(r.name);
  const line = (s) => esc(s).replace(/\{name\}/g, `<span class="rl__name">${name}</span>`);
  const total = r.steps.length;
  const steps = r.steps.map(([title, text], i) => `<li class="rl__step ${i === total - 1 ? 'is-current' : 'is-done'}" data-i="${i}"><span class="rl__n" aria-hidden="true">${i + 1}</span><span class="rl__title">${esc(title)}</span><span class="rl__line">${line(text)}</span></li>`).join('');
  const log = r.log.map((x, i) => `<li class="rl__log is-on" data-i="${i}">${check}<span>${esc(x)}</span></li>`).join('');
  return `<div class="rl demo is-end" data-demo="runlog" data-step="${total - 1}" data-total="${total}" data-step-of="${esc(r.stepOf)}">
<form class="rl__start" novalidate>
<p class="rl__head">${esc(r.title)}</p>
<div class="rl__field"><label for="rl-name">${esc(r.nameLabel)}</label><input id="rl-name" name="first" type="text" value="${name}" maxlength="40" autocomplete="off"></div>
<button class="btn btn--primary btn--sm rl__go" type="submit">${esc(r.start)}</button>
<p class="rl__note">${esc(r.note)}</p>
</form>
<div class="rl__stage">
<p class="rl__count" aria-hidden="true">${esc(fill(r.stepOf, { n: total, total }))}</p>
<ol class="rl__steps" role="list">${steps}</ol>
</div>
<figure class="rl__protocol"><figcaption class="rl__bar">${esc(r.logTitle)}</figcaption><ol class="rl__logs" role="list">${log}</ol><p class="rl__summary">${esc(t.run.summary)}</p></figure>
<div class="rl__ctl">
<p class="rl__slow">${esc(t.s6.e.slow)}</p>
<button class="btn btn--secondary btn--sm rl__back" type="button">${esc(r.back)}</button>
<button class="btn btn--secondary btn--sm rl__next" type="button">${esc(r.next)}</button>
<button class="btn btn--secondary btn--sm rl__again" type="button">${esc(r.again)}</button>
<button class="btn btn--secondary btn--sm rl__pause" type="button" aria-pressed="false" data-pause-label="${esc(t.s6.c.pause)}" data-play-label="${esc(t.s6.c.play)}" hidden>${esc(t.s6.c.pause)}<span class="sr-only">: ${esc(t.s6.c.names.runlog)}</span></button>
</div>
<p class="sr-only rl__status" role="status" aria-live="polite"></p>
</div>`;
}

// The frame with its two tabs. first: the video figure (DE) or the four-step strip (EN).
export function viewTabs(t, first) {
  const r = t.s6.r;
  return `<div class="vtabs">
<div class="vtabs__list" role="tablist" aria-label="${esc(r.tabsLabel)}">
<button class="vtabs__tab" type="button" role="tab" id="vtab-1" aria-controls="vpanel-1" aria-selected="true">${esc(r.tabs[0])}</button>
<button class="vtabs__tab" type="button" role="tab" id="vtab-2" aria-controls="vpanel-2" aria-selected="false" tabindex="-1" aria-describedby="vtab-2-desc">${esc(r.tabs[1])}</button>
<span class="sr-only" id="vtab-2-desc">${esc(r.describe)}</span>
</div>
<div class="vtabs__panel" role="tabpanel" id="vpanel-1" aria-labelledby="vtab-1">
${first}
</div>
<div class="vtabs__panel vtabs__panel--rl" role="tabpanel" id="vpanel-2" aria-labelledby="vtab-2">
${runlog(t)}
</div>
</div>`;
}
