import { esc, fill } from './util.mjs';
import { icon } from '../../assets/js/kit/icons.mjs';
import { mascotScene } from './mascots.mjs';

// Stage 6f (4.11.2026): the run-log is the second tab of the video frame («Video | Schritt für Schritt»,
// EN «Overview | Step by step»). One purchase in six steps: order form, payment, invoice, tag, access,
// welcome mail. A first-name field (prefilled «Anna») and «Anmelden» start it; without an action it
// starts by itself after 4 s (assets/js/runlog.js). Forward only, one step at a time with its log line.
// The HTML is the end frame (every step done), for no JS and reduced motion. Its CSS and JS load when
// the tab first opens (main.js). Nothing is sent, no e-mail address is asked for.
// Stage 7b (design system 2.1, 3.6, 5.4): the run-log tells its steps as a picture story.
// - Rail: six nodes above the stage, each a 44 px white disc with the step's icon (24 px, line only);
//   the current node has an ink ring, a done node a small check badge; a dot («Anna») travels along it.
//   The rail is aria-hidden: the lists carry the meaning.
// - Stage: one picture card per step (card card--pic) in the same grid cell at every width; its
//   .card__media holds the step's 48 px picto with its tone, inline, so its m part can move.
// - Live (kit mascot group, 56 px box reserved) pops out on step 6.
// - Protocol: each line leads with the step's icon (20 px); a done line shows the check glyph with it.
export const RUNLOG_ICONS = ['form', 'card', 'receipt', 'tag', 'unlock', 'mail-star'];

// Werkzeug «Ein Kauf» (variant 'kauf'): the same run-log in its end frame, without the start form, the
// controls and the conductor (no loop on that page); each protocol line carries its break states («fehlt»,
// «kommt nicht an») and the break icon (cross, drawn once), shown by assets/js/werkzeug-ein-kauf.js.
export function runlog(t, { variant = '', ids = [], kauf = null } = {}) {
  const k = variant === 'kauf';
  const r = t.s6.r;
  const name = esc(r.name);
  const line = (s) => esc(s).replace(/\{name\}/g, `<span class="rl__name">${name}</span>`);
  const total = r.steps.length;
  // Iva 13.11.2026 (DOM ceiling): the disc is the node itself, the check badge and the protocol check are CSS.
  // R6 (25.11.2026): on /werkzeuge/ein-kauf/ each rail icon is a real button (44 px target, aria-pressed) toggling that step.
  const rail = RUNLOG_ICONS.map((id, i) => k
    ? `<li class="rl__node is-done" data-i="${i}" data-id="${ids[i]}"><button class="rl__nodebtn" type="button" aria-pressed="false" data-step="${ids[i]}" aria-label="${esc(kauf.switchOff)}: ${esc(kauf.titles[i])}">${icon(id, { size: 24 })}</button></li>`
    : `<li class="rl__node is-done" data-i="${i}">${icon(id, { size: 24 })}</li>`).join('');
  const steps = r.steps.map(([title, text], i) => `<li class="rl__step card card--pic ${i === total - 1 ? 'is-current' : 'is-done'}" data-i="${i}"><span class="card__media">${icon(RUNLOG_ICONS[i], { size: 48, inline: true })}</span><span class="rl__title card__title">${esc(title)}</span><span class="rl__line card__text">${line(text)}</span></li>`).join('');
  const log = r.log.map((x, i) => `<li class="rl__log is-on" data-i="${i}"${k ? ` data-id="${ids[i]}"` : ''}>${icon(RUNLOG_ICONS[i], { size: 20 })}${k ? icon('cross', { size: 20, inline: true }) : ''}<span>${esc(x)}</span>${k ? `<span class="rl__fehlt">${esc(kauf.fehlt)}</span><span class="rl__kommt">${esc(kauf.kommtNicht)}</span>` : ''}</li>`).join('');
  const start = k ? '' : `<form class="rl__start" novalidate>
<p class="rl__head">${esc(r.title)}</p>
<div class="rl__field"><label for="rl-name">${esc(r.nameLabel)}</label><input id="rl-name" name="first" type="text" value="${name}" maxlength="40" autocomplete="off"></div>
<button class="btn btn--primary btn--sm rl__go" type="submit">${esc(r.start)}</button>
<p class="rl__note">${esc(r.note)}</p>
</form>
`;
  return `<div class="rl${k ? ' rl--kauf' : ' demo'} is-end"${k ? '' : ' data-demo="runlog"'} data-step="${total - 1}" data-total="${total}" data-step-of="${esc(r.stepOf)}">
${start}<div class="rl__stage">
<p class="rl__count" aria-hidden="true">${esc(fill(r.stepOf, { n: total, total }))}</p>
<div class="rl__railbox"${k ? '' : ' aria-hidden="true"'}><ol class="rl__rail" role="list">${rail}</ol><span class="rl__car" aria-hidden="true"><span class="rl__dot"></span></span></div>
<div class="rl__scene">
<ol class="rl__steps" role="list">${steps}</ol>
${mascotScene('runlog', [[2, 'joy']], 'rl__live', 'runlog')}
</div>
</div>
<figure class="rl__protocol"><figcaption class="rl__bar">${esc(r.logTitle)}</figcaption><ol class="rl__logs" role="list">${log}</ol><p class="rl__summary"${k ? ` data-intact="${esc(t.run.summary)}" data-off="${esc(kauf.summaryOff)}"` : ''}>${esc(t.run.summary)}</p></figure>
${k ? '' : `<div class="rl__ctl">
<p class="rl__slow">${esc(t.s6.e.slow)}</p>
<button class="btn btn--secondary btn--sm rl__back" type="button">${esc(r.back)}</button>
<button class="btn btn--secondary btn--sm rl__next" type="button">${esc(r.next)}</button>
<button class="btn btn--secondary btn--sm rl__again" type="button">${esc(r.again)}</button>
<button class="btn btn--secondary btn--sm rl__pause" type="button" aria-pressed="false" data-pause-label="${esc(t.s6.c.pause)}" data-play-label="${esc(t.s6.c.play)}" hidden>${esc(t.s6.c.pause)}<span class="sr-only">: ${esc(t.s6.c.names.runlog)}</span></button>
</div>
<p class="sr-only rl__status" role="status" aria-live="polite"></p>
`}</div>`;
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
