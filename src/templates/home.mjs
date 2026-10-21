import { hero, signup } from './hero.mjs';
import { problems } from './problems.mjs';
import { pricing } from './pricing.mjs';
import { tools, finder } from './demos.mjs';
import { references } from './references.mjs';
import { processSteps, about, faq, contact } from './sections.mjs';

// Section order per brief section 4.
export function home(t, config) {
  return [
    hero(t),
    tools(t),
    problems(t),
    signup(t),
    pricing(t),
    finder(t),
    processSteps(t),
    references(t, config),
    about(t, config),
    faq(t),
    contact(t, config),
  ].join('\n');
}
