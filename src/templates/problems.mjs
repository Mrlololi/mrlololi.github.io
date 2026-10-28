import { esc, accent, fill } from './util.mjs';
import { beforeAfter } from './demos.mjs';
import { mascotScene } from './mascots.mjs';

// Stage 4: each problem card is a mini-demo of its fix. The HTML shows the fixed state (no JS,
// reduced motion); assets/js/fixdemos.js plays «broken, then fixed» on entry and on the button.
const envelope = '<svg viewBox="0 0 40 28" focusable="false"><rect x="1.5" y="1.5" width="37" height="25" rx="4"/><path d="M3 4l17 12L37 4"/></svg>';
const tick = '<svg class="tick" viewBox="0 0 16 16" focusable="false"><circle cx="8" cy="8" r="7.5"/><path d="M4.6 8.3l2.2 2.2 4.6-5"/></svg>';
const lock = '<svg class="lock" viewBox="0 0 24 28" focusable="false"><path class="lock__shackle" d="M7 13V8a5 5 0 0 1 10 0"/><rect x="3" y="12" width="18" height="14" rx="4"/></svg>';

function signupArt(d) {
  const dots = [0, 1, 2, 3, 4, 5].map((i) => `<span class="sig__lane${i === 1 || i === 4 ? ' sig__lane--lost' : ''}" style="--i:${i}"><span class="sig__dot"></span></span>`).join('');
  return `<div class="sig">
<span class="sig__box">${esc(d.from)}</span>
<span class="sig__pipe"><span class="sig__gap"></span><span class="sig__track">${dots}</span><span class="sig__retry">${esc(d.retry)}</span></span>
<span class="sig__box sig__box--to">${esc(d.to)}</span>
</div>
<p class="sig__count">${fill(esc(d.count), { n: '<span class="sig__n">47</span>' })}</p>`;
}

function spamArt(d) {
  return `<div class="spam">
<span class="spam__folder spam__folder--inbox">${esc(d.inbox)}</span>
<span class="spam__folder spam__folder--spam">${esc(d.spam)}</span>
<span class="spam__slot"><span class="spam__mail">${envelope}</span></span>
</div>
<ul class="spam__badges" role="list">${d.badges.map((b) => `<li class="spam__badge">${tick}<span>${esc(b)}</span></li>`).join('')}</ul>`;
}

function rateArt(d) {
  return `<div class="rate">
<span class="rate__card"><span class="rate__x" aria-hidden="true"></span>${esc(d.failed)}</span>
<span class="rate__lock">${lock}<span class="rate__lock-text">${esc(d.open)}</span></span>
</div>
<ol class="rate__steps" role="list">${d.steps.map((s, i) => `<li class="rate__step rate__step--${i + 1}">${tick}<span>${esc(s)}</span></li>`).join('')}</ol>`;
}

const ART = { signup: signupArt, spam: spamArt, rate: rateArt };
const KINDS = ['signup', 'spam', 'rate'];

// Lösung pulls the mail out of spam while Logik ticks the records and Live cheers; on the other two
// cards Lösung alone appears once the fix has run.
function cardScene(kind) {
  if (kind === 'spam') return mascotScene('problems', [[0, 'think', 'mscene__logik'], [1, 'idle', 'mscene__loesung'], [2, 'joy', 'mscene__live']], 'mscene--trio', 'problems-spam');
  return mascotScene('problems', [[1, 'joy', 'mscene__loesung']], 'mscene--solo', `problems-${kind}`);
}

export function problems(t) {
  const names = Object.fromEntries(t.pricing.groups.flatMap((g) => g.items).map((it) => [it.id, it.name]));
  const fd = t.s4.fixDemo;
  const cards = t.problems.items
    .map((item, i) => {
      const kind = KINDS[i];
      return `<li class="pc">
<div class="pc__problem"><span class="label label--pink">${esc(t.ui.problem)}</span>
<h3 class="pc__title">${esc(item.problem)}</h3></div>
<figure class="fixdemo fixdemo--${kind}" data-state="fixed">
<div class="fixdemo__art" aria-hidden="true">
${ART[kind](fd[kind])}
${cardScene(kind)}
</div>
<figcaption class="sr-only">${esc(fd[kind].alt)}</figcaption>
<button class="fixdemo__play" type="button" data-again="${esc(fd.again)}">${esc(fd.show)}</button>
</figure>
<div class="pc__fix"><span class="label label--pist">${esc(t.ui.fix)}</span>
<p>${esc(item.fix)}</p>
<a class="pc__link" href="#pkg-${item.pkg}">${esc(t.ui.matching)} ${esc(names[item.pkg])}</a></div>
</li>`;
    })
    .join('\n');

  return `<section class="section problems bg-blue edge" id="problems" aria-labelledby="problems-title">
<div class="wrap">
<div class="section__head">
<h2 id="problems-title" data-enter="lines">${accent(t.problems.h2)}</h2>
<p class="lead" data-enter="lines">${esc(t.problems.intro)}</p>
</div>
${beforeAfter(t)}
<ul class="pcs" role="list" data-enter="stagger">
${cards}
</ul>
</div>
</section>`;
}
