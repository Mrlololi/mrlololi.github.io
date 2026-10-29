import { esc, accent, fill } from './util.mjs';
import { mascotScene } from './mascots.mjs';
import { replayButton } from './hero.mjs';

// Stage 6: each problem card is a mini-demo of its fix that ends looking solved. The HTML is the
// solved frame (no JS, reduced motion); assets/js/fixdemos.js resets a card to «broken» while it is
// off-screen and plays it forward on entry (loops.js decides when). Same art height on all three.
// Stage 6b: the end frame keeps the problem it solved as a small, quiet «before» (.fd-was) next to
// the «after» that carries the focus, so the card never reads «everything was fine».
const envelope = '<svg viewBox="0 0 40 28" focusable="false"><rect x="1.5" y="1.5" width="37" height="25" rx="4"/><path d="M3 4l17 12L37 4"/></svg>';
const tick = '<svg class="tick" viewBox="0 0 16 16" focusable="false"><circle cx="8" cy="8" r="7.5"/><path d="M4.6 8.3l2.2 2.2 4.6-5"/></svg>';
const cross = '<svg class="cross" viewBox="0 0 16 16" focusable="false"><circle cx="8" cy="8" r="7.5"/><path d="M5.5 5.5l5 5M10.5 5.5l-5 5"/></svg>';
const lock = '<svg class="lock" viewBox="0 0 24 28" focusable="false"><path class="lock__shackle" d="M7 13V8a5 5 0 0 1 10 0"/><rect x="3" y="12" width="18" height="14" rx="4"/></svg>';

// «{n}/47 angekommen»: the number big, the word next to it.
const count = (text) => {
  const [num, ...rest] = text.split(' ');
  return `<span class="sig__num">${fill(esc(num), { n: '<span class="sig__n">47</span>' })}</span> <span class="sig__word">${esc(rest.join(' '))}</span>`;
};

function signupArt(d, s6) {
  const b = s6.b.before;
  const dots = [0, 1, 2, 3, 4, 5].map((i) => `<span class="sig__lane${i === 1 || i === 4 ? ' sig__lane--lost' : ''}" style="--i:${i}"><span class="sig__dot"></span></span>`).join('');
  return `<div class="sig">
<span class="sig__box">${esc(d.from)}</span>
<span class="sig__pipe"><span class="sig__fill"></span><span class="sig__gap"></span><span class="sig__track">${dots}</span></span>
<span class="sig__box sig__box--to">${esc(d.to)}</span>
<span class="sig__retry">${esc(d.retry)}</span>
</div>
<p class="sig__count"><span class="fd-was">${esc(b.signup)}</span><span class="fd-to" aria-hidden="true">→</span>${tick}${count(d.count)}</p>`;
}

function spamArt(d, s6) {
  return `<div class="spam">
<span class="spam__folder spam__folder--inbox"><span class="spam__name">${esc(d.inbox)}</span></span>
<span class="spam__folder spam__folder--spam"><span class="spam__ghost fd-was">${envelope}</span><span class="spam__name">${esc(d.spam)}</span></span>
<span class="spam__slot"><span class="spam__mail">${envelope}<span class="spam__ok">${tick}</span></span><span class="spam__arrived">${esc(s6.fixDemo.inboxOk)}</span></span>
</div>
<ul class="spam__badges" role="list">${d.badges.map((b) => `<li class="spam__badge">${tick}<span>${esc(b)}</span></li>`).join('')}</ul>`;
}

// The big red chip exists only in the start frame (its words come from CSS); the solved frame
// shows «Rate 2 fehlgeschlagen» small and quiet before the green «Rate 2 bezahlt».
function rateArt(d, s6) {
  return `<div class="rate">
<span class="fd-was rate__was">${cross}${esc(s6.b.before.rate)}</span><span class="fd-to" aria-hidden="true">→</span>
<span class="rate__card"><span class="rate__bad">${cross}<span class="rate__failed" data-text="${esc(d.failed)}"></span></span><span class="rate__good">${tick}${esc(s6.fixDemo.paid)}</span></span>
<span class="rate__lock">${lock}<span class="rate__lock-text">${esc(d.open)}</span></span>
</div>
<ol class="rate__steps" role="list">${d.steps.map((s, i) => `<li class="rate__step rate__step--${i + 1}">${tick}<span>${esc(s)}</span></li>`).join('')}</ol>`;
}

const ART = { signup: signupArt, spam: spamArt, rate: rateArt };
const KINDS = ['signup', 'spam', 'rate'];

// Casting (fixed site-wide): Logik is the problem and the thinking, Lösung the fix, Live the result.
// Cards 1 and 2: Logik (worried while broken, calm when solved); card 3: Lösung. Live joins only in
// the solved frame, with a small star twinkle. Both stand next to the result, 56 px.
function cardScene(kind) {
  const lead = kind === 'rate' ? [1, 'joy', 'mscene__lead'] : [0, 'idle', 'mscene__lead'];
  return mascotScene('problems', [lead, [2, 'joy', 'mscene__live']], 'mscene--pair', `problems-${kind}`);
}

export function problems(t) {
  const names = Object.fromEntries(t.pricing.groups.flatMap((g) => g.items).map((it) => [it.id, it.name]));
  const fd = t.s4.fixDemo;
  const cards = t.problems.items
    .map((item, i) => {
      const kind = KINDS[i];
      return `<li class="pc card">
<div class="pc__problem"><span class="label label--pink">${esc(t.ui.problem)}</span>
<h3 class="pc__title">${esc(item.problem)}</h3></div>
<figure class="fixdemo fixdemo--${kind} demo" data-demo="fix-${kind}">
<div class="fixdemo__art" aria-hidden="true">
${ART[kind](fd[kind], t.s6)}
${cardScene(kind)}
</div>
<figcaption class="sr-only">${esc(fd[kind].alt)}</figcaption>
${replayButton(t)}
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
<p class="lead">${esc(t.problems.intro)}</p>
</div>
<ul class="pcs" role="list" data-demo="problems">
${cards}
</ul>
</div>
</section>`;
}
