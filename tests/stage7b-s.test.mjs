// Stage 7b-S «Sichtbarkeit» (docs/PROMPT_Stage7b_S_Sichtbarkeit_2026-11-13.md): one identity, clean
// Webprojekte URLs, form sources, referral and estimate lines, IndexNow, client names. The rendered-HTML
// check of the Webprojekte pages (JS on, DE and EN locale) is tests/stage7b-s-browser.test.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import config from '../src/config.json' with { type: 'json' };
import de from '../src/content/de.mjs';
import en from '../src/content/en.mjs';
import { pages } from '../src/build.mjs';
import { sitemap, robots } from '../src/templates/seo.mjs';
import { payload } from '../src/tools/indexnow.mjs';

const built = pages(config, { articles: [] });
const by = Object.fromEntries(built.map((p) => [p.file, p.html]));
const WP = new URL('../../../webprojekte/site/', import.meta.url);
const wp = (p) => readFileSync(new URL(p, WP), 'utf8');
const ld = (h) => [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap((m) => { const j = JSON.parse(m[1]); return j['@graph'] || [j]; });
const ID_DE = 'Iva Tsatskrialashvili (er/ihm), online als mrlololi, ist selbstständiger Techniker für Marketing-Automation in Graz. Er richtet für Anbieterinnen und Anbieter von Online-Kursen im DACH-Raum die Technik hinter dem Launch ein und testet sie, bevor die Kundschaft kommt.';

test('1. Webprojekte sitemap: five clean URLs, no «?» in any <loc> of either sitemap', () => {
  const x = wp('sitemap.xml');
  const locs = [...x.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.deepEqual(locs, ['https://mrlololi.com/Webprojekte/', 'https://mrlololi.com/Webprojekte/geoapp/', 'https://mrlololi.com/Webprojekte/language-starter/', 'https://mrlololi.com/Webprojekte/language-starter/trainer/', 'https://mrlololi.com/Webprojekte/ki-kundenservice/']);
  assert.ok(![...x.matchAll(/href="([^"]+)"/g)].some((m) => m[1].includes('?')), 'no alternate to a parameter URL');
  assert.ok(![...sitemap(config).matchAll(/<loc>([^<]+)<\/loc>/g)].some((m) => m[1].includes('?')));
});

test('1. Webprojekte: no JavaScript sets canonical, title, description, og:url or hreflang', () => {
  for (const f of ['assets/js/landing.js', 'geoapp/js/app.js', 'language-starter/js/app.js', 'index.html', 'language-starter/trainer/index.html', '404.html']) {
    // Code only: tags and comments out (a comment may name what the code must not do).
    const s = wp(f).replace(/<link [^>]*>|<meta [^>]*>/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    assert.ok(!/document\.title\s*=|link\[rel="canonical"\]|meta\[name="description"\]|og:url|setAttribute\('hreflang'/.test(s), f);
  }
  // Without ?lang and without a stored choice the hub and the trainer stay German.
  for (const f of ['index.html', 'language-starter/trainer/index.html']) assert.match(wp(f), /if \(lang !== 'de' && lang !== 'en'\) lang = 'de';/, f);
});

test('2. one Person node: same @id on both sites, gender, pronouns, alternateName, description in the page language', () => {
  const pde = ld(by['index.html']).find((n) => n['@type'] === 'Person');
  const pen = ld(by['en/index.html']).find((n) => n['@type'] === 'Person');
  const pwp = ld(wp('index.html')).find((n) => n['@type'] === 'Person');
  for (const p of [pde, pen, pwp]) {
    assert.equal(p['@id'], 'https://mrlololi.com/#iva');
    assert.equal(p.gender, 'Male');
    assert.equal(p.alternateName, 'mrlololi');
    assert.equal(p.image, 'https://mrlololi.com/assets/img/about-680.jpg');
    assert.deepEqual(p.knowsAbout, pde.knowsAbout);
    assert.deepEqual(p.sameAs, [config.linkedin, config.malt, config.github, config.instagram]);
  }
  assert.equal(pde.pronouns, 'er/ihm'); assert.equal(pde.jobTitle, 'Techniker für Marketing-Automation'); assert.equal(pde.description, ID_DE);
  assert.equal(pen.pronouns, 'he/him'); assert.equal(pen.jobTitle, 'Marketing Automation Technician'); assert.equal(pen.description, en.identity);
  assert.deepEqual({ ...pwp }, { ...pde }, 'the Webprojekte node equals the German one');
  for (const h of Object.values(by)) assert.ok(!/"@type":"(FAQPage|AggregateRating|Review)"/.test(h));
});

test('3. identity line in every footer, home title with the full name, Impressum owner line', () => {
  for (const [f, h] of Object.entries(by)) {
    const lang = h.match(/<html lang="([a-z]+)"/)[1];
    assert.ok(h.includes(`<p class="site-footer__who">${lang === 'en' ? en.identity : de.identity}</p>`), f);
  }
  assert.equal(de.identity, ID_DE);
  assert.match(by['index.html'], /<title>Launch-Technik für Online-Kurse \| Iva Tsatskrialashvili, Graz<\/title>/);
  assert.ok(de.meta.description.includes('Iva Tsatskrialashvili (er/ihm).') && de.meta.description.length <= 160, de.meta.description.length);
  assert.ok(en.meta.description.includes('Iva Tsatskrialashvili (he/him).') && en.meta.description.length <= 160);
  assert.match(by['impressum/index.html'], /<\/address>\n<p class="doc__owner">Inhaber: Iva Tsatskrialashvili \(er\/ihm\)<\/p>/);
  // «Werbeagentur» only on the Impressum page (trade-law lines and its meta description, see the report).
  const where = Object.entries(by).filter(([, h]) => h.includes('Werbeagentur')).map(([f]) => f);
  assert.deepEqual(where, ['impressum/index.html']);
  // rel="me" on Iva's own profiles.
  assert.ok(by['index.html'].includes(`href="${config.linkedin}" target="_blank" rel="me noopener"`));
});

test('4. form sources in the new order (DE and EN), the letter option still preselected by ?quelle=brief…', () => {
  assert.deepEqual(de.s4.contact.form.gefundenOptions, ['Google-Suche', 'KI-Assistent (ChatGPT, Perplexity, Gemini)', 'LinkedIn', 'Malt', 'Empfehlung', 'Instagram', 'Brief per Post', 'Google Maps', 'Sonstiges']);
  assert.deepEqual(en.s4.contact.form.gefundenOptions, ['Google search', 'AI assistant (ChatGPT, Perplexity, Gemini)', 'LinkedIn', 'Malt', 'Referral', 'Instagram', 'Letter by post', 'Google Maps', 'Other']);
  assert.ok(by['index.html'].includes('<option data-letter>Brief per Post</option>'));
  assert.ok(by['index.html'].includes("if(q.indexOf('brief')===0){var o=[].find.call(f.elements.gefunden.options,function(x){return x.hasAttribute('data-letter')});if(o)o.selected=true;}"));
});

test('5. referral line under the Technik-Check (home and /activecampaign-einrichten/), estimate before hourly work', () => {
  const ref = 'Auf Empfehlung einer Kundin: Der Technik-Check wird 60 statt 30 Tage voll auf Ihr Projekt angerechnet.';
  for (const f of ['index.html', 'activecampaign-einrichten/index.html']) assert.ok(by[f].includes(`<p class="item__referral small">${ref}</p>`), f);
  assert.ok(by['en/index.html'].includes('Referred by a client: the Technik-Check is credited in full against your project for 60 instead of 30 days.'));
  const short = 'Arbeit nach Stunden beginne ich erst, wenn Sie meine Schätzung der Stundenzahl kennen.';
  const long = 'Arbeit nach Stunden beginne ich erst, wenn Sie meine Schätzung der Stundenzahl kennen; wird es mehr, frage ich vorher.';
  assert.ok(de.pricing.groups[2].items[0].summary.endsWith(long));
  assert.ok(de.pricing.hourly.endsWith(short) && de.s6.pricing.rows.support.endsWith(short));
  assert.ok(de.services.pages.find((p) => p.key === 'activecampaign').faq.some(([, a]) => a.endsWith(`Die Rechnung kommt am Monatsende. ${short}`)));
});

test('6. IndexNow: key in config, key file at both roots, a server-to-server payload; robots.txt blocks no AI or search bot', () => {
  const k = config.indexnow_key;
  assert.match(k, /^[0-9a-f]{32}$/);
  assert.equal(readFileSync(new URL(`../${k}.txt`, import.meta.url), 'utf8'), k);
  assert.ok(existsSync(new URL(`${k}.txt`, WP)) && wp(`${k}.txt`).trim() === k);
  assert.deepEqual(payload(['https://mrlololi.com/']), { host: 'mrlololi.com', key: k, keyLocation: `https://mrlololi.com/${k}.txt`, urlList: ['https://mrlololi.com/'] });
  assert.throws(() => payload(['https://example.com/']));
  const r = robots(config);
  for (const bot of ['OAI-SearchBot', 'PerplexityBot', 'ClaudeBot', 'Google-Extended', 'Bingbot']) assert.ok(!r.includes(bot), bot);
  assert.match(r, /User-agent: \*\nAllow: \//);
});

test('7. internal links: the home body links all five service pages', () => {
  const body = (h) => h.slice(h.indexOf('<main'), h.indexOf('</main>'));
  for (const p of de.services.pages) assert.ok(body(by['index.html']).includes(`href="${p.path}"`), p.path);
  assert.ok(body(by['en/index.html']).includes('href="/en/one-page-website/"'));
});

test('8. client names: no anonymous wording left outside the hidden study title', () => {
  for (const [f, h] of Object.entries(by)) {
    for (const w of ['Name nicht genannt', 'name not disclosed', 'eine Online-Kursanbieterin', 'an online course creator']) assert.ok(!h.includes(w), `${f}: ${w}`);
  }
  assert.ok(by['index.html'].includes(`<h3><a class="ext" href="${config.case2_url}" target="_blank" rel="noopener">claudiawitticke.com`));
  assert.ok(by['index.html'].includes(', Launch-Technik für die Online-Nähkurse von Claudia Witticke, seit April 2026</h3>'));
  assert.ok(by['index.html'].includes('seit 2026 auch für die Online-Kursanbieterin Claudia Witticke.'));
  assert.equal(de.refs.study.title, 'Fallbeispiel: Online-Kursanbieterin');
});
