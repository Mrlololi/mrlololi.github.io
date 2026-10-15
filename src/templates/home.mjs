import { esc } from './util.mjs';

export function home(t, config) {
  return `<section class="hero" aria-labelledby="hero-title">
<h1 id="hero-title">${esc(t.hero.h1)}</h1>
</section>`;
}
