import { esc, seconds, accent, headline } from './util.mjs';
import { heroMascots } from './mascots.mjs';

// One status node of the run log: idle (grey), wait (amber), done (green) + check.
// Default CSS shows the finished state; main.js rewinds it when the log comes into view.
const runNode = `<span class="run__node" aria-hidden="true"><svg viewBox="0 0 20 20" focusable="false"><circle class="run__idle" cx="10" cy="10" r="9"/><circle class="run__wait" cx="10" cy="10" r="9"/><circle class="run__done" cx="10" cy="10" r="9"/><path class="run__check" pathLength="1" d="M5.6 10.3l2.9 2.9 5.9-6.4"/></svg></span>`;
const runLink = `<svg class="run__link" aria-hidden="true" focusable="false" viewBox="0 0 2 10" preserveAspectRatio="none"><path pathLength="1" d="M1 0V10"/></svg>`;

// Small pill that pauses a looping demo; shown and wired by assets/js/loops.js.
// Small round icon button (pause / play) with a visible tooltip; WCAG 2.2.2 wants it for long loops.
export const loopButton = (t) => `<button class="loop-btn" type="button" hidden aria-label="${esc(t.ui.pause)}" data-pause="${esc(t.ui.pause)}" data-play="${esc(t.ui.play)}"><svg class="loop-btn__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path class="loop-btn__pause" d="M9 6v12M15 6v12"/><path class="loop-btn__play" d="M9 6.5v11l9-5.5z"/></svg><span class="loop-btn__tip" aria-hidden="true">${esc(t.ui.pause)}</span></button>`;

// Ribbon: the run's steps flowing along two soft arcs, one above and one below the diagram
// card (each SVG is pinned to its edge, so the card's height never matters). SMIL moves the
// text; it starts only from JS (begin="indefinite"), so without JS or with reduced motion it rests.
const RIBBON = { top: 'M-60 70C120 10 380 30 600 52', bottom: 'M-60 34C150 92 380 18 600 62' };
function ribbonSvg(text) {
  const words = esc(`${text} ${text} ${text}`);
  return Object.entries(RIBBON)
    .map(([edge, d], i) => `<svg class="ribbon ribbon--${edge}" viewBox="0 0 540 100" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false"><defs><path id="ribbon-${edge}" d="${d}"/></defs><text class="ribbon__text"><textPath href="#ribbon-${edge}">${words}<animate attributeName="startOffset" from="0" to="0" dur="${i ? 46 : 40}s" begin="indefinite" repeatCount="indefinite"/></textPath></text></svg>`)
    .join('\n');
}

// Hero diagram: four nodes on a zigzag, three wires. CSS plays it once (pulses travel the
// wires, nodes light up with a check); the static state is all nodes lit.
const NODES = [[8, 22], [176, 112], [8, 200], [176, 288]];
const WIRES = ['M86 62C86 100 254 82 254 112', 'M254 152C254 190 86 170 86 200', 'M86 240C86 278 254 258 254 288'];
function flowSvg(nodes) {
  const wires = WIRES.map((d) => `<path class="hf__wire" d="${d}"/>`).join('');
  const pulses = WIRES.map((d, i) => `<path class="hf__pulse hf__pulse--${i + 1}" pathLength="100" d="${d}"/>`).join('');
  const boxes = nodes
    .map((label, i) => {
      const [x, y] = NODES[i];
      return `<g class="hf__node hf__node--${i + 1}"><rect x="${x}" y="${y}" width="156" height="40" rx="14"/><text x="${x + 14}" y="${y + 25}">${esc(label)}</text><g class="hf__check"><circle cx="${x + 138}" cy="${y + 20}" r="9"/><path d="M${x + 134} ${y + 20.5}l2.8 2.8 5.2-5.6"/></g></g>`;
    })
    .join('');
  return `<svg class="hf" viewBox="0 0 340 340" aria-hidden="true" focusable="false">${wires}${pulses}${boxes}</svg>`;
}

export function hero(t) {
  return `<section class="hero bg-hero" aria-labelledby="hero-title">
<div class="wrap hero__grid">
<div class="hero__text">
<h1 id="hero-title">${headline(t.hero.h1)}</h1>
<p class="hero__lead lead">${esc(t.hero.lead)}</p>
<div class="hero__ctas">
<a class="btn btn--primary" href="#contact">${esc(t.hero.primary)}</a>
<a class="text-link" href="#pricing">${esc(t.hero.secondary)}</a>
</div>
<p class="hero__proof">${esc(t.hero.proof)}</p>
<p class="hero__small small">${esc(t.hero.small)}</p>
</div>
<div class="hero__visual">
${ribbonSvg(t.hero.ribbon)}
<figure class="hero__flow" aria-label="${esc(t.hero.flow.label)}">
<a class="hero__chip" href="#about"><picture><source type="image/avif" srcset="/assets/img/avatar-44.avif 1x, /assets/img/avatar-88.avif 2x"><source type="image/webp" srcset="/assets/img/avatar-44.webp 1x, /assets/img/avatar-88.webp 2x"><img src="/assets/img/avatar-44.jpg" srcset="/assets/img/avatar-88.jpg 2x" width="44" height="44" loading="lazy" decoding="async" alt=""></picture>${esc(t.hero.flow.chip)}</a>
<div class="hf-wrap">
${flowSvg(t.hero.flow.nodes)}
${t.hero.flow.nodes.map((n, i) => `<button class="hf__btn hf__btn--${i + 1}" type="button" aria-expanded="false" aria-controls="hf-line-${i + 1}">${esc(n)}</button>`).join('')}
${heroMascots(t)}
</div>
<ul class="hf__lines" role="list">${t.hero.flow.lines.map((l, i) => `<li id="hf-line-${i + 1}">${esc(l)}</li>`).join('')}</ul>
${loopButton(t)}
</figure>
</div>
</div>
</section>`;
}

// «Was passiert, wenn sich jemand anmeldet»: a 3-step story. Without JS the three panels
// stand one under the other; assets/js/demos.js turns the step list into tabs, and on wide
// screens with motion allowed pins the story and moves through the steps with the scroll.
function runLog(t) {
  const steps = t.run.steps
    .map(
      (s, i) => `<li class="run__step" data-seconds="${s.seconds}">
${runNode}
<span class="run__text">${esc(s.text)}</span>
<span class="run__time">${seconds(s.seconds, t.locale)}</span>
${i < t.run.steps.length - 1 ? runLink : ''}
</li>`
    )
    .join('\n');
  return `<figure class="run instrument" aria-labelledby="run-title">
<figcaption class="run__bar"><span class="run__title" id="run-title">${esc(t.run.title)}</span><span class="label">${esc(t.story.runLabel)}</span></figcaption>
<ol class="run__steps" role="list">
${steps}
</ol>
<div class="run__foot">
<p class="run__summary">${esc(t.run.summary)}</p>
<button class="run__replay" type="button" hidden>${esc(t.run.replay)}</button>
</div>
<p class="sr-only" id="run-status" role="status" aria-live="polite"></p>
</figure>`;
}

// A real local form: nothing is sent (method "dialog" does nothing outside a dialog, also
// without JS); demos.js checks the e-mail, then plays steps 2 and 3 with the typed name.
function formCard(t) {
  const f = t.story.form;
  const [[nameLabel, name], [mailLabel, mail]] = f.fields;
  return `<div class="story__card">
<form class="story__form" method="dialog" novalidate>
<p class="story__card-title">${esc(f.title)}<span class="label">${esc(t.ui.example)}</span></p>
<div class="story__field"><label for="story-name">${esc(nameLabel)}</label><input id="story-name" name="name" type="text" value="${esc(name)}" autocomplete="off"></div>
<div class="story__field"><label for="story-email">${esc(mailLabel)}</label><input id="story-email" name="email" type="email" value="${esc(mail)}" autocomplete="off" aria-describedby="story-email-error"><p class="story__error" id="story-email-error" hidden>${esc(f.error)}</p></div>
<button class="btn btn--primary" type="submit">${esc(f.button)}</button>
<p class="story__note small">${esc(f.note)}</p>
</form>
</div>`;
}

function welcomeCard(t) {
  const w = t.story.welcome;
  return `<div class="story__card story__welcome">
<p class="story__card-title">${esc(w.subject).replace('{first}', `<span class="js-first">${esc(t.story.form.fields[0][1].split(' ')[0])}</span>`)}<span class="label">${esc(t.ui.example)}</span></p>
<p>${esc(w.text)}</p>
<p class="story__access">${esc(w.access)}</p>
</div>
<div class="toasts">
${loopButton(t)}
<ul class="toasts__list" role="list">${t.story.toasts.map((x) => `<li class="toast">${esc(x).replace('{name}', `<span class="js-name">${esc(t.story.form.fields[0][1])}</span>`)}</li>`).join('')}</ul>
</div>`;
}

export function signup(t) {
  const s = t.story;
  const bodies = [formCard(t), runLog(t), welcomeCard(t)];
  const panels = s.steps
    .map((title, i) => `<div class="story__panel" id="story-panel-${i + 1}">
<h3 class="story__title">${esc(title)}</h3>
${bodies[i]}
</div>`)
    .join('\n');
  return `<section class="section signup bg-pist edge" id="signup" aria-labelledby="signup-title">
<div class="wrap">
<div class="section__head">
<h2 id="signup-title">${accent(t.run.h2)}</h2>
</div>
<div class="story">
<div class="story__nav">
<span class="story__progress" aria-hidden="true"><span></span></span>
<ol class="story__steps" role="list" aria-label="${esc(s.label)}">
${s.steps.map((title, i) => `<li class="story__step"><span class="story__n" aria-hidden="true">${i + 1}</span>${esc(title)}</li>`).join('\n')}
</ol>
</div>
<div class="story__panels">
${panels}
</div>
</div>
</div>
</section>`;
}
