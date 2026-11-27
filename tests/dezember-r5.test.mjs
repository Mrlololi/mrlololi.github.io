// R5 «Zum Ausprobieren» (docs/PROMPT_R5_Zum_Ausprobieren_2026-11-25.md): three clickable cards on home DE/EN.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import config from '../src/config.json' with { type: 'json' };
import de from '../src/content/de.mjs';
import { pages } from '../src/build.mjs';
import { scan } from '../src/qa/wortfilter.mjs';

const by = Object.fromEntries(pages(config, { articles: [] }).map((p) => [p.file, p.html]));

test('R5 home DE and EN: heading, subline with Beispieldaten, three clickable cards in order, browser previews, Weitere Projekte', () => {
  const deP = by['index.html'].slice(by['index.html'].indexOf('id="projects"'), by['index.html'].indexOf('id="faq"'));
  const enP = by['en/index.html'].slice(by['en/index.html'].indexOf('id="projects"'), by['en/index.html'].indexOf('id="faq"'));

  assert.ok(deP.includes('Zum <em class="accent">Ausprobieren</em>'));
  assert.ok(deP.includes('Drei Dinge, die Sie selbst ansehen können. Alle mit Beispieldaten.'));
  assert.ok(enP.includes('Try it <em class="accent">yourself</em>'));
  assert.ok(enP.includes('Three things you can look at yourself. All with sample data.'));

  const cards = deP.match(/<li class="proj proj--try">[\s\S]*?<\/li>/g) || [];
  assert.equal(cards.length, 3);
  assert.ok(cards[0].includes('href="/werkzeuge/ein-kauf/"') && cards[0].includes('preview-ein-kauf-400.jpg') && cards[0].includes('Ein Kauf: Was, wenn ein Teil fehlt?'));
  assert.ok(cards[1].includes('href="/musterbericht/technik-check/"') && cards[1].includes('preview-musterbericht-400.jpg') && cards[1].includes('So sieht ein Technik-Check aus'));
  assert.ok(cards[2].includes('ki-kundenservice/') && cards[2].includes('project-ki-400.jpg') && cards[2].includes('KI im Kundenservice'));
  assert.ok(deP.includes('href="https://mrlololi.com/Webprojekte/"') && deP.includes('>Weitere Projekte<'));

  const enCards = enP.match(/<li class="proj proj--try">[\s\S]*?<\/li>/g) || [];
  assert.equal(enCards.length, 3);
  for (const c of enCards) assert.ok(c.includes('(in German)'), 'EN cards mark German targets');
});

test('R5 Wortfilter: clean on DE and EN home', () => {
  const hits = scan([{ page: '/', html: by['index.html'] }, { page: '/en/', html: by['en/index.html'] }], de);
  assert.deepEqual(hits, []);
});
