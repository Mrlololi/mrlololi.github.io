import { esc, seconds } from './util.mjs';
import { loopButton } from './hero.mjs';
import { firstName } from '../../assets/js/pure.js';

// Stage 6e: the run-log demo comes back behind «Ablauf selbst ausprobieren» under the video. Its
// markup waits in a <template> (inert: nothing renders or loads), its CSS and JS load on the first
// click (assets/js/runlog.js). Iva's fixes to the Stage 4 version: the three steps are buttons that
// jump to their step (a 3-step bar on phones), replay and pause buttons of 44 px, one pane in focus
// (the others step back by their background, never by text opacity), the log only once (no toasts
// in the course pane), no small mascots, text at least 13 px. 30.10.2026: the open button reads
// «Schließen» while open; a note says the run is slowed down (really 2,3 s); «Nochmal von vorn».
const runNode = '<span class="run__node" aria-hidden="true"><svg viewBox="0 0 20 20" focusable="false"><circle class="run__idle" cx="10" cy="10" r="9"/><circle class="run__done" cx="10" cy="10" r="9"/><path class="run__check" d="M5.6 10.3l2.9 2.9 5.9-6.4"/></svg></span>';
const lockIcon = '<svg class="course__lock" viewBox="0 0 24 28" aria-hidden="true" focusable="false"><path class="course__shackle" d="M7 13V8a5 5 0 0 1 10 0"/><rect x="3" y="12" width="18" height="14" rx="4"/></svg>';

function formPane(t) {
  const f = t.story.form;
  const [[nameLabel, name], [mailLabel, mail]] = f.fields;
  return `<form class="story__form" method="dialog" novalidate>
<p class="story__card-title">${esc(f.title)}</p>
<div class="story__field"><label for="story-name">${esc(nameLabel)}</label><input id="story-name" name="name" type="text" value="${esc(name)}" autocomplete="off"></div>
<div class="story__field"><label for="story-email">${esc(mailLabel)}</label><input id="story-email" name="email" type="email" value="${esc(mail)}" autocomplete="off" aria-describedby="story-email-error"><p class="story__error" id="story-email-error" hidden>${esc(f.error)}</p></div>
<button class="btn btn--primary btn--sm" type="submit">${esc(f.button)}</button>
<p class="story__note">${esc(f.note)}</p>
</form>`;
}

function flowPane(t) {
  return `<ol class="canvas" role="list">${t.s4.story.nodes.map(([kind, name], i) => `<li class="anode anode--${i + 1}"><span class="anode__kind">${esc(kind)}</span><span class="anode__name">${esc(name)}</span></li>`).join('')}</ol>`;
}

function phonePane(t, first) {
  const st = t.s4.story;
  return `<div class="phone"><p class="phone__bar">${esc(st.phone)}</p><ul class="phone__mails" role="list">${st.mails.map(([subject, text], i) => `<li class="pmail pmail--${i + 1}"><span class="pmail__from">${esc(st.tool)}</span><span class="pmail__subject">${esc(subject).replace('{first}', `<span class="js-first">${esc(first)}</span>`)}</span><span class="pmail__text">${esc(text)}</span></li>`).join('')}</ul></div>`;
}

function coursePane(t) {
  const st = t.s4.story;
  return `<div class="course">
<p class="course__state">${lockIcon}<span class="course__locked">${esc(st.locked)}</span><span class="course__open">${esc(st.unlocked)}</span></p>
<p class="course__name">${esc(st.course)}</p>
<p class="course__module">${esc(st.module)}</p>
</div>`;
}

export function runlog(t) {
  const s = t.story;
  const st = t.s4.story;
  const first = firstName(s.form.fields[0][1]);
  const bodies = [formPane(t), flowPane(t), phonePane(t, first), coursePane(t)];
  const kinds = ['form', 'flow', 'phone', 'course'];
  const stepOf = [0, 1, 1, 2];
  const panes = st.panes.map((title, i) => `<div class="pane pane--${kinds[i]}" data-step="${stepOf[i]}"><p class="pane__title">${esc(title)}</p>${bodies[i]}</div>`).join('\n');
  const log = t.run.steps.map((x) => `<li class="run__step" data-seconds="${x.seconds}">${runNode}<span class="run__text">${esc(x.text)}</span><span class="run__time">${seconds(x.seconds, t.locale)}</span></li>`).join('');
  return `<div class="runlog__wrap">
<p class="runlog__open-row"><button class="btn btn--secondary runlog__open" type="button" aria-expanded="false" aria-controls="runlog" data-close="${esc(t.s6.e.close)}">${esc(t.s6.e.open)}</button></p>
<div class="runlog-slot" id="runlog" hidden></div>
<template id="runlog-tpl"><div class="runlog demo" data-demo="runlog">
<ol class="runlog__steps" role="list" aria-label="${esc(s.label)}">${s.steps.map((title, i) => `<li><button class="chip runlog__step" type="button" data-step="${i}"${i === 2 ? ' aria-current="step"' : ''}><span class="runlog__n" aria-hidden="true">${i + 1}</span><span class="runlog__label">${esc(title)}</span><span class="runlog__short" aria-hidden="true">${esc(t.s6.e.short[i])}</span></button></li>`).join('')}</ol>
<div class="screen" role="group" aria-label="${esc(st.screen)}">
<div class="screen__bar"><span class="screen__dots" aria-hidden="true"><i></i><i></i><i></i></span><span class="screen__title">${esc(t.run.title)}</span><span class="label">${esc(s.runLabel)}</span></div>
<div class="screen__panes">
${panes}
</div>
<figure class="run"><figcaption class="run__bar">${esc(st.log)}</figcaption><ol class="run__steps" role="list">${log}</ol><p class="run__summary">${esc(t.run.summary)}</p></figure>
</div>
<div class="runlog__ctl"><p class="runlog__slow">${esc(t.s6.e.slow)}</p><button class="btn btn--secondary btn--sm runlog__replay" type="button">${esc(t.s6.e.again)}</button>${loopButton(t, 'runlog')}</div>
<p class="sr-only runlog__status" role="status" aria-live="polite"></p>
</div></template>
</div>`;
}
