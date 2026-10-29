import { hero, tools } from './hero.mjs';
import { problems } from './problems.mjs';
import { videoBlock, stepStrip } from './video.mjs';
import { pricing } from './pricing.mjs';
import { references, projects } from './references.mjs';
import { processSteps, about, faq, contact } from './sections.mjs';

// Stage 6 order: one message per block, one main action (the free first call). Block 3 is the
// video on the German page; the English page shows the four steps until its video exists.
export function home(t, config) {
  return [
    hero(t),
    tools(t),
    problems(t),
    t.s6.video ? videoBlock(t) : stepStrip(t),
    pricing(t, config),
    processSteps(t),
    references(t, config),
    projects(t, config),
    about(t, config),
    faq(t),
    contact(t, config),
  ].join('\n');
}
