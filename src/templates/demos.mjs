import { esc } from './util.mjs';
import { loopButton } from './hero.mjs';

// «Ich arbeite mit»: text pills (no logos). The second list is the marquee's seamless copy.
export function tools(t) {
  const pills = t.tools.items.map((name) => `<li>${esc(name)}</li>`).join('');
  return `<section class="tools" aria-labelledby="tools-title">
<div class="wrap tools__in">
<p class="tools__label" id="tools-title">${esc(t.tools.label)}</p>
<div class="marquee">
<div class="marquee__track">
<ul class="marquee__list" role="list">${pills}</ul>
<ul class="marquee__list" role="list" aria-hidden="true">${pills}</ul>
</div>
</div>
${loopButton(t)}
</div>
</section>`;
}
