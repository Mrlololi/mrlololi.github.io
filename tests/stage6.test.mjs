// Stage 6 «Klarer und kürzer» (docs/PROMPT_Stage6_Klarer_2026-10-29.md, v2): the static checks
// of section 5. Browser checks (layout gate, reduced motion, no JS, autoplay rule): stage6-browser.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pages } from '../src/build.mjs';
import { notFound } from '../src/templates/legal.mjs';
import config from '../src/config.json' with { type: 'json' };
import de from '../src/content/de.mjs';
import en from '../src/content/en.mjs';

const all = pages(config, { live: {} });
const byFile = Object.fromEntries(all.map((p) => [p.file, p.html]));
const deHome = byFile['index.html'];
const enHome = byFile['en/index.html'];
const css = ['components', 'main'].map((f) => readFileSync(new URL(`../assets/css/${f}.css`, import.meta.url), 'utf8')).join('\n');
const main = (h) => h.slice(h.indexOf('<main'), h.indexOf('</main>'));
const text = (h) => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const ldOf = (h) => JSON.parse(h.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);

test('home: no KI demo, no finder, no slider, no run log; block order as in the brief', () => {
  for (const h of [deHome, enHome]) {
    assert.ok(!/id="ki-demo"|class="kidemo|id="ki-rechner"/.test(h), 'KI demo and calculator only on the KI page');
    assert.ok(!/id="finder"|class="chat\b/.test(h), 'no finder section');
    assert.ok(!/class="ba\b|class="run\b|id="signup"|class="marquee|class="ribbon|class="trows|class="notdo"/.test(h), 'removed blocks stay removed');
  }
  const order = ['hero-title', 'tools-title', 'id="problems"', 'id="video"', 'id="services"', 'id="process"', 'id="references"', 'id="projects"', 'id="about"', 'id="faq"', 'id="contact"'];
  const at = order.map((k) => deHome.indexOf(k));
  assert.ok(at.every((x, i) => x > 0 && (i === 0 || x > at[i - 1])), `order ${at}`);
  assert.ok(enHome.indexOf('id="path"') > enHome.indexOf('id="problems"') && enHome.indexOf('id="path"') < enHome.indexOf('id="services"'));
});

test('hero: eyebrow, H1, one primary button, prices as a text link, micro line, one trust line, static tools', () => {
  const hero = deHome.slice(deHome.indexOf('<section class="hero'), deHome.indexOf('</section>'));
  assert.match(hero, /<p class="hero__eyebrow">Für Online-Kursanbieter:innen im DACH-Raum<\/p>/);
  assert.equal((hero.match(/class="btn /g) || []).length, 1, 'one button');
  assert.match(hero, /<a class="text-link" href="#pricing">Preise ansehen<\/a>/);
  // Stage 6b: the micro line right under the button, then the prices link; no «seit 2026» in the hero.
  assert.match(hero, /<a class="btn btn--primary" href="#contact">Kostenloses Erstgespräch<\/a>\n<p class="hero__micro small">20 Minuten · Antwort in 2 Werktagen<\/p>\n<a class="text-link" href="#pricing">Preise ansehen<\/a>/);
  for (const h of [deHome, enHome]) assert.ok(!/seit 2026|since 2026/.test(h.slice(h.indexOf('<section class="hero'), h.indexOf('</section>'))), 'no «seit 2026» in the hero');
  assert.match(hero, /keine Anmeldung verloren geht\. Feste Preise ab 190\u00a0€\./);
  assert.match(hero, /Hallo, ich bin Iva/);
  assert.match(deHome, /<ul class="tools__list" role="list">(<li>[^<]+<\/li>){10}<\/ul>/);
  assert.ok(!/data-magnet|data-wave|data-tilt/.test(deHome), 'no magnet, letter wave or tilt');
});

test('nav: Leistungen, Projekte, Über mich, Kontakt (EN alike)', () => {
  assert.deepEqual(de.nav.map((n) => n.label), ['Leistungen', 'Projekte', 'Über mich', 'Kontakt']);
  assert.deepEqual(en.nav.map((n) => n.label), ['Services', 'Projects', 'About', 'Contact']);
  assert.match(deHome, /<li><a href="#projects">Projekte<\/a><\/li>/);
  assert.match(deHome, /<section class="section projects[^"]*" id="projects"/);
});

test('video: only on the DE home and /launch-technik/, preload none, two sources, neither with src', () => {
  const withVideo = all.filter((p) => p.html.includes('data-video')).map((p) => p.file).sort();
  assert.deepEqual(withVideo, ['index.html', 'launch-technik/index.html']);
  for (const f of withVideo) {
    const h = byFile[f];
    const vids = h.match(/<video\b[^>]*>/g);
    assert.equal(vids.length, 2, f);
    for (const v of vids) {
      assert.match(v, /preload="none"/);
      assert.match(v, /\bcontrols\b/);
      assert.match(v, /\bplaysinline\b/);
      assert.match(v, /\bmuted\b/);
      assert.ok(!/\sautoplay\b/.test(v), 'no autoplay');
      assert.ok(!/\ssrc=/.test(v), 'src only from the script');
      assert.match(v, /data-src="\/assets\/video\/anmeldung-(16x9|9x16)\.mp4"/);
    }
    assert.equal((h.match(/<button class="vid__chip chip" type="button" data-t="[\d.]+" aria-label="Video ab \d:\d\d abspielen: [^"]+">/g) || []).length, 5);
    assert.match(h, /aria-label="Video ab 0:04 abspielen: Warteschlange">[\s\S]*?<span class="vid__time">0:04<\/span> Warteschlange<\/button>/);
    for (const scene of de.s6.b.scenes) assert.ok(h.includes(scene.replace(/«/g, '«')), scene);
    assert.match(h, /<summary>Text des Videos<\/summary>/);
    for (const line of de.s6.video.lines) assert.ok(h.includes(line.replace('&', '&amp;')), line);
    assert.ok(!/youtube|vimeo/i.test(h));
  }
  assert.match(deHome, /50 Sekunden ansehen/);
  for (const f of ['anmeldung-16x9.mp4', 'anmeldung-9x16.mp4']) {
    const size = readFileSync(new URL(`../assets/video/${f}`, import.meta.url)).length;
    assert.ok(size <= 6 * 1024 * 1024, `${f}: ${size}`);
  }
  for (const f of ['anmeldung-16x9.webp', 'anmeldung-9x16.webp']) assert.ok(readFileSync(new URL(`../assets/video/${f}`, import.meta.url)).length <= 150 * 1024, f);
});

test('VideoObject on the DE home and /launch-technik/: every required field', () => {
  for (const f of ['index.html', 'launch-technik/index.html']) {
    const v = ldOf(byFile[f])['@graph'].find((n) => n['@type'] === 'VideoObject');
    assert.ok(v, f);
    assert.equal(v.name, 'Der Weg einer Anmeldung');
    assert.ok(v.description.length > 50);
    assert.equal(v.uploadDate, '2026-10-29');
    assert.equal(v.duration, 'PT50S');
    assert.equal(v.inLanguage, 'de');
    assert.equal(v.contentUrl, 'https://mrlololi.com/assets/video/anmeldung-16x9.mp4');
    assert.ok(v.thumbnailUrl.every((u) => u.startsWith('https://mrlololi.com/assets/video/')));
  }
  assert.ok(!ldOf(enHome)['@graph'].some((n) => n['@type'] === 'VideoObject'));
});

test('problem cards: solved HTML, card 3 never says «fehlgeschlagen» there, links to the package cards', () => {
  const cards = deHome.match(/<li class="pc card">[\s\S]*?<\/li>\n(?=<li class="pc|<\/ul>)/g);
  assert.equal(cards.length, 3);
  // Stage 6b: each end frame keeps the quiet «before» next to the «after».
  assert.match(cards[0], /<span class="fd-was">45\/47<\/span>[\s\S]*<span class="sig__n">47<\/span>\/47/);
  assert.match(cards[1], /<span class="spam__ghost fd-was">[\s\S]*spam__ok/);
  assert.match(cards[2], /<span class="fd-was rate__was">[\s\S]*Rate 2 fehlgeschlagen<\/span>[\s\S]*Rate 2 bezahlt/);
  assert.ok(!/Kartenzahlung fehlgeschlagen/.test(text(cards[2])), 'the big red chip only in the start frame');
  assert.match(cards[0], /<span class="sig__n">47<\/span>\/47/);
  for (const [i, c] of cards.entries()) {
    assert.match(c, /<button class="replay btn btn--secondary btn--sm" type="button" hidden>/);
    assert.match(c, new RegExp(`<a class="pc__link" href="#pkg-${de.problems.items[i].pkg}">`));
  }
  assert.equal(de.problems.intro, 'Typische Stellen, an denen Launches haken.');
});

test('prices: chooser, three main cards with at most four bullets, more services as rows, promise, small print', () => {
  const s = deHome.slice(deHome.indexOf('id="services"'), deHome.indexOf('id="process"'));
  assert.match(s, /<nav class="chooser card"/);
  assert.equal((s.match(/<li><a class="chooser__row" href="#pkg-(quick|check|launch|website|ki)">/g) || []).length, 5);
  const cards = s.match(/<li class="item item--(\w+) card card--lift" id="pkg-\1">[\s\S]*?<\/li>\n(?=<li class="item|<\/ul>)/g);
  assert.deepEqual(cards.map((c) => c.match(/item--(\w+)/)[1]), ['quick', 'check', 'launch']);
  for (const c of cards) {
    const n = (c.match(/<ul class="item__bullets"[\s\S]*?<\/ul>/)[0].match(/<li>/g) || []).length;
    assert.ok(n >= 1 && n <= 4, `${n} bullets`);
    assert.ok(/item--check/.test(c) || /<a class="item__more" href="\/[^"]+\/">Mehr zu/.test(c));
    assert.match(c, /class="btn btn--sm btn--primary item__cta" href="mailto:/);
  }
  assert.match(cards[1], /Empfohlener Start/);
  assert.ok(!/item__more/.test(cards[1]), 'Technik-Check without «Mehr …»');
  assert.match(s, /Mehr zu KI-Antwortentwürfen/);
  assert.match(s, /<p class="notdo-line">Was ich nicht mache: Werbetexte, Werbeanzeigen und laufenden Kundensupport\./);
  assert.match(s, /30-Tage-Zusage: Läuft ein von mir gebauter Ablauf in den ersten 30 Tagen nach Übergabe/);
  assert.deepEqual([...s.matchAll(/<li class="row card" id="pkg-(\w+)">/g)].map((m) => m[1]), ['website', 'ki', 'support']);
  assert.match(s, /<p class="promise">[\s\S]*?30-Tage-Zusage/);
  assert.match(s, /Kleinunternehmer gemäß § 6 Abs\. 1 Z 27 UStG/);
  assert.ok(!/Garantie/.test(text(s)));
});

test('process right under the prices, then the CTA strip; references with their quotes and the note', () => {
  assert.ok(deHome.indexOf('id="process"') - deHome.indexOf('id="services"') > 0);
  const process = deHome.slice(deHome.indexOf('id="process"'), deHome.indexOf('id="references"'));
  assert.match(process, /<div class="ctastrip">\n<p class="ctastrip__text">Nicht sicher, was passt\? 20 Minuten, kostenlos\. Ich sage ehrlich, ob ich helfen kann\.<\/p>/);
  const refs = deHome.slice(deHome.indexOf('id="references"'), deHome.indexOf('id="projects"'));
  const cards = refs.match(/<li class="ref card ref--(\w+)">/g).map((c) => c.match(/ref--(\w+)/)[1]);
  assert.deepEqual(cards, ['course', 'site', 'shop', 'earlier']);
  assert.match(refs, /ref--site">[\s\S]*Alexandra Fry[\s\S]*?<\/li>\n<li class="ref card ref--shop">[\s\S]*Ditoma GmbH[\s\S]*?<\/li>\n<li class="ref card ref--earlier">[\s\S]*CMX Solutions/);
  assert.match(refs, /Zitate aus schriftlichen Referenzen, Original auf Anfrage\./);
  assert.match(refs, /class="ctastrip"/);
});

test('projects: four cards, one link each (no nested links), 4:3 screenshots, KI first', () => {
  const p = deHome.slice(deHome.indexOf('id="projects"'), deHome.indexOf('id="about"'));
  const cards = p.match(/<li class="proj">[\s\S]*?<\/li>/g);
  assert.equal(cards.length, 2, 'Stage 6b: two cards, GeoAPP and KittyCats as one line');
  assert.match(p, /Außerdem: <a[^>]*>GeoAPP[\s\S]*KittyCats/);
  assert.match(cards[0], /KI im Kundenservice/);
  for (const c of cards) {
    assert.equal((c.match(/<a /g) || []).length, 1, 'one link per card');
    assert.match(c, /width="400" height="300"/);
    assert.match(c, /Was es zeigt:/);
  }
  assert.match(p, /Selbst gebaut, keine Kundenarbeit\./);
  assert.match(p, /Alle Webprojekte/);
});

test('about: two paragraphs, photo, four-point timeline; no tool rows, no projects link', () => {
  const a = deHome.slice(deHome.indexOf('id="about"'), deHome.indexOf('id="faq"'));
  assert.equal((a.match(/<p data-enter="lines">/g) || []).length, 2);
  assert.equal((a.match(/<li class="path__stop">/g) || []).length, 4);
  assert.ok(!/trow|about__project/.test(a));
});

test('FAQ: every question visible, no inner scroll box, the reading Logik at 40 px', () => {
  const f = deHome.slice(deHome.indexOf('id="faq"'), deHome.indexOf('id="contact"'));
  assert.equal((f.match(/<details class="faq__item"/g) || []).length, 8);
  assert.match(f, /Sind Sie am Launch-Tag erreichbar\?/);
  assert.match(readFileSync(new URL('../assets/js/faq.js', import.meta.url), 'utf8'), /const BEAT = 350;/);
  assert.ok(!/faqbox|faq__chat/.test(f));
  assert.ok(!/\.faq__list[^{]*\{[^}]*overflow/.test(css), 'no scroll container');
  assert.match(f, /<template id="faq-reader">/);
  assert.match(css, /\.faq__logik \{ width: 2\.5rem;/);
});

test('contact: the address stays visible under «E-Mail öffnen», «Text kopieren» with a read-only fallback', () => {
  const c = deHome.slice(deHome.indexOf('id="contact"'));
  assert.match(c, /<div class="contact__fallback">\n<p class="small">Öffnet sich nichts\? Schreiben Sie an <a href="mailto:hello@mrlololi\.com[^"]*">hello@mrlololi\.com<\/a><\/p>/);
  // Stage 6b: «Text kopieren» next to «E-Mail öffnen», the address with its own button; the mail starts «Hallo Iva, ich».
  assert.match(c, /E-Mail öffnen<\/a>\n<button class="btn btn--secondary contact__copy" type="button" hidden data-done="Text kopiert">Text kopieren<\/button>/);
  assert.match(c, /class="btn btn--secondary btn--sm contact__copymail"[^>]*>Adresse kopieren<\/button>/);
  assert.match(c, /<p class="brief__body">Hallo Iva,<br><br>ich verkaufe/);
  assert.match(c, /<textarea readonly rows="6"><\/textarea>/);
});

test('404: one page, noindex, both languages, link cards to home, five services, projects, contact', () => {
  const h = byFile['404.html'];
  assert.match(h, /<meta name="robots" content="noindex">/);
  assert.match(h, /<h1>Hier ist die Leitung unterbrochen\.<\/h1>/);
  assert.match(h, /Diese Seite gibt es nicht \(mehr\)\. Kein Problem, hier geht es weiter:/);
  assert.match(h, /<section class="nf__in nf__alt" lang="en"[^>]*>\n<h2 id="nf-alt">The line is broken here\.<\/h2>/);
  for (const t of [de, en]) {
    const hrefs = [t.paths.home, ...t.services.pages.map((p) => p.path), `${t.paths.home}#projects`, `${t.paths.home}#contact`];
    for (const href of hrefs) assert.ok(h.includes(`<a class="nf__card card" href="${href}">`), href);
  }
  assert.ok(!h.includes('/ratgeber/'), 'Ratgeber only when live');
  assert.ok(notFound(de, en, { ratgeber: true }).includes('href="/ratgeber/"'), 'Ratgeber once live');
});

test('KI page: three examples, steps as buttons, tone and approve, background collapsed, calculator bars', () => {
  const h = byFile['ki-antwortentwuerfe/index.html'];
  const data = JSON.parse(h.match(/data-examples="([^"]+)"/)[1].replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'));
  assert.equal(data.length, 3);
  assert.match(h, /Links die Kundenmail, rechts der Entwurf\. Ihr Team prüft und gibt frei\./);
  assert.equal((h.match(/<button class="kisteps__btn chip" type="button" data-step="\d"/g) || []).length, 3);
  assert.match(h, /data-step="2" aria-current="step"/);
  assert.match(h, /<button class="kidemo__other btn btn--secondary btn--sm" type="button">Anderes Beispiel<\/button>/);
  assert.equal((h.match(/<button class="kitone chip"/g) || []).length, 3);
  assert.match(h, /<details class="kidemo__bg">\n<summary>Was im Hintergrund passiert<\/summary>/);
  assert.ok(!/kilegend|kipop|Bearbeiten/.test(h), 'no legend row, no popover, one demo button');
  assert.match(h, /<strong data-out="h">31,2<\/strong>/);
  assert.match(h, /<strong data-out="draftH">9,4<\/strong>/);
  assert.match(h, /Ersparnis: <strong data-out="savedH">21,8<\/strong> h \/ <strong data-out="savedEur">546<\/strong> € pro Monat/);
  assert.match(css, /\.bar__fill \{[^}]*transition: transform 0\.25s/);
  const linked = pages(config, { live: { kiPortfolio: true } }).find((p) => p.file === 'ki-antwortentwuerfe/index.html').html;
  assert.ok(linked.includes('Alle 20 Beispiele'));
});

test('motion budget: no scale or 3D hover on cards, hover only on real pointers, no permanent will-change', () => {
  assert.ok(!/will-change/.test(css));
  assert.ok(!/preserve-3d|perspective\(|rotate[XY]\(/.test(css));
  assert.ok(!/:hover[^{]*\{[^}]*scale\(/.test(css), 'no scale on hover');
  for (const m of css.matchAll(/translateY\((-?\d+(?:\.\d+)?)px\)/g)) assert.ok(Number.isInteger(Number(m[1])), m[0]);
  assert.match(css, /--lift: -2px;/);
  // Shared design file (Stage 7: Webprojekte takes it over).
  const comp = readFileSync(new URL('../assets/css/components.css', import.meta.url), 'utf8');
  for (const sel of [':root {', '.btn {', '.btn--primary', '.btn--secondary', '.chip {', '.btn--sm', '.label {', '.card, .instrument {', '.replay {']) assert.ok(comp.includes(sel), sel);
  // Stage 6b: no other pill styles of their own in main.css.
  for (const old of ['.vid__chip {', '.kitone {', '.kisteps__btn {', '.kidemo__other {', '.contact__copy {']) assert.ok(!css.includes(`\n${old} min-height`) && !new RegExp(`\\n\\${old.replace(' {', '')} \\{ (display: inline-flex; )?(align-items: center; gap: var\\(--space-2\\); )?min-height`).test(css), old);
});

test('copy: no long dashes or emoji in the Stage 6 strings; claims stay true', () => {
  for (const t of [de, en]) {
    const s = JSON.stringify(t.s6);
    assert.ok(!/[–—]/.test(s));
    assert.ok(!/(?![©®™])\p{Extended_Pictographic}/u.test(s));
  }
  assert.ok(!/immer wieder/.test(main(deHome)), 'no «immer wieder» on the home page');
});
