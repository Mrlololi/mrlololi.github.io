// December release R3 «Home und Ein Kauf» (docs/PROMPT_Dezember_Eine_Tuer_2026-11-24.md): the teaser card instead
// of the embedded run-log, Language Starter and GeoAPP only on /Webprojekte/, the course reference without tools and
// video link, Ein Kauf labels and switches, the spam example. The problem card headlines wait (see the report).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import config from '../src/config.json' with { type: 'json' };
import de from '../src/content/de.mjs';
import { pages } from '../src/build.mjs';
import { scan, RULES } from '../src/qa/wortfilter.mjs';

const by = Object.fromEntries(pages(config, { articles: [] }).map((p) => [p.file, p.html]));
const home = by['index.html'];

test('1. home: one teaser card (tool and report) instead of the run-log; no Language Starter, no GeoAPP; KI demo stays', () => {
  assert.ok(home.includes('<div class="rl-teaser card">\n<p><a class="text-link" href="/werkzeuge/ein-kauf/">Was passiert, wenn ein Schritt fehlt? Selbst ausprobieren</a></p>\n<p><a class="text-link" href="/musterbericht/technik-check/">So sieht ein Technik-Bericht aus</a></p>\n</div>'));
  for (const h of [home, by['en/index.html']]) {
    assert.ok(!h.includes('<li class="rl__step') && !h.includes('class="vtabs'));
    const p = h.slice(h.indexOf('id="projects"'), h.indexOf('id="faq"'));
    assert.ok(!/Language Starter|GeoAPP/.test(p));
    assert.ok(p.includes('href="https://mrlololi.com/Webprojekte/"'), '«Weitere Projekte» to /Webprojekte/');
    assert.ok(p.includes('ki-kundenservice/'), 'the KI project stays');
  }
  assert.ok(by['ki-antwortentwuerfe/index.html'].includes('id="ki-demo"'), 'the KI demo stays');
});

test('2. reference «Online-Kursanbieterin, 2026»: no video link, no tool names (home and service pages)', () => {
  const card = home.match(/<li class="ref card ref--course">[\s\S]*?<\/li>/)[0];
  assert.ok(card.includes('<h3>Launch-Technik für eine Online-Kursanbieterin, 2026</h3>\n<p>Anmeldung, E-Mail-Abläufe, Zahlung und Kurszugang.</p>'));
  assert.ok(!/ActiveCampaign|Zapier|Leadpages|Quaderno|Zoom|Ablauf im Video ansehen/.test(card));
  for (const f of ['launch-technik/index.html', 'activecampaign-einrichten/index.html']) {
    const c = by[f].match(/<article class="svc-card"><h3>Launch-Technik für eine Online-Kursanbieterin, 2026<\/h3><p>([^<]+)<\/p><\/article>/);
    assert.equal(c?.[1], 'Anmeldung, E-Mail-Abläufe, Zahlung und Kurszugang.', f);
  }
  assert.ok(by['index.html'].includes('2026 auch für eine Online-Kursanbieterin'), 'the About line stays');
});

test('3. Ein Kauf: the label on top and at the end, the short tag per panel, step names on the switches, title and meta', () => {
  const e = by['werkzeuge/ein-kauf/index.html'];
  const L = de.einKauf.label;
  assert.ok(e.includes(`<p class="ek-label">${L}</p>`) && e.includes(`<p class="ek-label ek-label--end">${L}</p>`));
  assert.equal(e.split(L).length - 1, 2);
  assert.equal((e.match(/<p class="ek-panel__label"><span class="label label--lav">Beispiel<\/span><\/p>/g) || []).length, 6);
  assert.equal((e.match(/<figcaption class="label label--peach">erfundene Nachricht<\/figcaption>/g) || []).length, 6);
  assert.ok(e.includes('<span class="ek-switch__nr" aria-hidden="true">1</span><span class="sr-only">Schritt ausschalten: </span><span class="ek-switch__text">Bestellformular</span><span class="ek-switch__off" aria-hidden="true">aus</span>'));
  assert.ok(e.includes('<title>Testkauf vor dem Launch: Was passiert, wenn ein Schritt fehlt? | mrlololi</title>'));
  assert.ok(e.includes('<h1 id="ek-h">Ein Kauf: Was, wenn ein Teil fehlt?</h1>'), 'H1 unchanged');
});

test('3. Wortfilter: the short tag counts only with the full label on the page', () => {
  assert.equal(RULES.labels.beispielTag, 'Beispiel');
  const e = by['werkzeuge/ein-kauf/index.html'];
  assert.deepEqual(scan([{ page: '/werkzeuge/ein-kauf/', html: e }], de).filter((h) => h.kind === 'label'), []);
  // Every full label off the page (also «(vereinfachtes Beispiel)» in the run-log summary lines).
  const noLabel = e.replace(/vereinfachtes Beispiel|fiktives Beispiel/gi, 'Ohne Hinweis');
  assert.ok(scan([{ page: '/werkzeuge/ein-kauf/', html: noLabel }], de).some((h) => h.kind === 'label'), 'without the page label the tag alone fails');
});

test('5. spam page: the invented example from the Musterbericht (no duration) and «Was ich von Ihnen brauche»', () => {
  const s = by['e-mails-landen-im-spam/index.html'];
  assert.ok(s.includes('<p class="svc-text">Erfundenes Beispiel aus dem Musterbericht: Die Bestätigungsmail landete bei GMX im Spam, bei Gmail im Posteingang. Ursache: zwei SPF-Einträge und kein DMARC.</p>'));
  assert.ok(s.includes('<p class="svc-text svc-need"><strong>Was ich von Ihnen brauche:</strong> Zugang zu Ihrem Domain-Anbieter und die Absenderadresse.</p>'));
  assert.ok(by['en/emails-going-to-spam/index.html'].includes('What I need from you:'));
});
