// Stage 5 (28.10.2026): SEO. Entity (Person #iva), five service pages in DE and EN, the Ratgeber
// template (unpublished while config.ratgeber_live is false), sitemap and robots.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pages, build, sitemap } from '../src/build.mjs';
import { robots } from '../src/templates/seo.mjs';
import { parseArticle } from '../src/ratgeber.mjs';
import { checkSeo } from '../src/qa/seo.mjs';
import config from '../src/config.json' with { type: 'json' };
import de from '../src/content/de.mjs';
import en from '../src/content/en.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://mrlololi.com';
const all = pages(config);
const byFile = Object.fromEntries(all.map((p) => [p.file, p.html]));
const fileOf = (p) => `${p.slice(1)}index.html`;
const SERVICES = [...de.services.pages, ...en.services.pages].map((s) => ({ ...s, file: fileOf(s.path), t: de.services.pages.includes(s) ? de : en }));
const PATHS = {
  de: ['/launch-technik/', '/e-mails-landen-im-spam/', '/activecampaign-einrichten/', '/ki-antwortentwuerfe/', '/website-one-pager/'],
  en: ['/en/course-launch-tech/', '/en/emails-going-to-spam/', '/en/activecampaign-setup/', '/en/ai-reply-drafts/', '/en/one-page-website/'],
};
const tag = (h, re) => (h.match(re) || [])[1];
const titleOf = (h) => tag(h, /<title>([^<]*)<\/title>/);
const descOf = (h) => tag(h, /<meta name="description" content="([^"]*)">/);
const unesc = (s) => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const ld = (h) => [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap((m) => JSON.parse(m[1])['@graph']);
const items = (t) => Object.fromEntries(t.pricing.groups.flatMap((g) => g.items).map((it) => [it.id, it]));

const SAMPLE = parseArticle(`---
title: Beispielartikel nur für Tests
description: Platzhalter, wird nie veröffentlicht.
slug: beispiel
datePublished: 2026-11-02
dateModified: 2026-11-05
package: spam
---
Einleitung mit Platzhaltertext.

## Erster Abschnitt

Platzhalter für den ersten Abschnitt mit **fettem** Wort und einem [Link](/launch-technik/).

## Zweiter Abschnitt

- Punkt eins
- Punkt zwei
`);

/* ---------- 1. Entity: Iva as a Person node on every page ---------- */
test('every page carries #business and #iva, identical on all pages', () => {
  let first;
  for (const { file, html } of all) {
    const graph = ld(html);
    const biz = graph.find((n) => n['@id'] === `${SITE}/#business`);
    const iva = graph.find((n) => n['@id'] === `${SITE}/#iva`);
    assert.ok(biz && iva, `${file}: #business or #iva missing`);
    assert.equal(biz['@type'], 'ProfessionalService');
    assert.deepEqual(biz.founder, { '@id': `${SITE}/#iva` });
    first ??= { biz, iva };
    assert.deepEqual(biz, first.biz, `${file}: #business differs`);
    assert.deepEqual(iva, first.iva, `${file}: #iva differs`);
  }
  const iva = first.iva;
  assert.equal(iva['@type'], 'Person');
  assert.equal(iva.name, 'Iva Tsatskrialashvili');
  assert.equal(iva.jobTitle, 'Marketing Automation Engineer');
  assert.deepEqual(iva.knowsAbout, ['ActiveCampaign', 'Zapier', 'Make', 'Leadpages', 'Stripe', 'E-Mail-Zustellbarkeit', 'Marketing-Automation']);
  assert.deepEqual(iva.address, { '@type': 'PostalAddress', addressLocality: 'Graz', addressCountry: 'AT' });
  assert.equal(iva.image, `${SITE}/assets/img/about-680.jpg`);
  assert.ok(existsSync(path.join(root, 'assets/img/about-680.jpg')));
  assert.equal(iva.url, `${SITE}/`);
  assert.deepEqual(iva.sameAs, [config.linkedin, config.malt, 'https://github.com/Mrlololi', 'https://www.instagram.com/mrlololi/']);
});

test('Über mich starts with the full name and pronouns', () => {
  assert.match(de.about.paragraphs[0], /^Ich bin Iva Tsatskrialashvili \(er\/ihm\) und lebe in Graz\. Ich habe Informationstechnologie/);
  assert.match(en.about.paragraphs[0], /^I'm Iva Tsatskrialashvili \(he\/him\) and I live in Graz\. I studied information technology/);
  assert.match(byFile['index.html'], /<p data-enter="lines">Ich bin Iva Tsatskrialashvili \(er\/ihm\) und lebe in Graz\./);
  assert.match(byFile['en/index.html'], /<p data-enter="lines">I&#39;m Iva Tsatskrialashvili \(he\/him\)|<p data-enter="lines">I'm Iva Tsatskrialashvili \(he\/him\)/);
});

/* ---------- 2. Ten service pages ---------- */
test('the ten service pages exist at the brief\'s URLs', () => {
  assert.deepEqual(de.services.pages.map((s) => s.path), PATHS.de);
  assert.deepEqual(en.services.pages.map((s) => s.path), PATHS.en);
  for (const p of [...PATHS.de, ...PATHS.en]) assert.ok(byFile[fileOf(p)], p);
});

test('service pages: unique title (<= 60, «Focus phrase | mrlololi») and description (<= 155), one H1 with the focus phrase', () => {
  const titles = new Set();
  const descs = new Set();
  for (const s of SERVICES) {
    const h = byFile[s.file];
    const title = unesc(titleOf(h));
    const desc = unesc(descOf(h));
    assert.ok(title.length <= 60, `${s.path}: title ${title.length} chars`);
    assert.ok(desc.length <= 155 && desc.length >= 70, `${s.path}: description ${desc.length} chars`);
    assert.ok(title === `${s.h1} | mrlololi` || (title === s.h1 && `${s.h1} | mrlololi`.length > 60), `${s.path}: title pattern`);
    titles.add(title);
    descs.add(desc);
    assert.equal((h.match(/<h1[\s>]/g) || []).length, 1, `${s.path}: one h1`);
    assert.equal(unesc(tag(h, /<h1[^>]*>([\s\S]*?)<\/h1>/).replace(/<[^>]+>/g, '')), s.h1);
  }
  assert.equal(titles.size, 10);
  assert.equal(descs.size, 10);
  assert.equal(de.services.pages.find((s) => s.key === 'launch').h1, 'Launch-Technik für Online-Kurse');
  assert.equal(de.services.pages.find((s) => s.key === 'spam').h1, 'E-Mails landen im Spam? SPF, DKIM und DMARC einrichten');
  assert.equal(de.services.pages.find((s) => s.key === 'activecampaign').h1, 'ActiveCampaign einrichten und betreuen');
  assert.equal(de.services.pages.find((s) => s.key === 'ki').h1, 'KI-Antwortentwürfe für Ihren Kundenservice');
  assert.equal(de.services.pages.find((s) => s.key === 'website').h1, 'Website als One-Pager mit Leadpages oder Wix');
});

test('canonical and reciprocal hreflang pairs, checked over a real build output', async () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'mrl-seo-'));
  try {
    await build({ outDir: dir, probe: false, quiet: true });
    const r = await checkSeo(dir, SITE);
    assert.deepEqual(r.problems, []);
    assert.equal(r.indexable, 16, '6 earlier pages + 10 service pages');
    assert.ok(!existsSync(path.join(dir, 'ratgeber')), 'no /ratgeber/ in the output while the flag is false');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('service pages: Service JSON-LD with provider, area and EUR offer; BreadcrumbList', () => {
  for (const s of SERVICES) {
    const graph = ld(byFile[s.file]);
    const svc = graph.find((n) => n['@type'] === 'Service');
    assert.ok(svc, `${s.path}: Service missing`);
    assert.deepEqual(svc.provider, { '@id': `${SITE}/#business` });
    assert.deepEqual(svc.areaServed.map((a) => a.name), ['AT', 'DE', 'CH']);
    assert.equal(svc.url, SITE + s.path);
    const offers = [].concat(svc.offers);
    const pk = items(s.t);
    assert.equal(offers.length, s.packages.length);
    offers.forEach((o, i) => {
      const it = pk[s.packages[i]];
      assert.equal(o['@type'], 'Offer');
      assert.equal(o.priceCurrency, 'EUR');
      const n = Number(it.price.replace(/[^\d]/g, ''));
      if (/^(ab|from) /.test(it.price)) assert.equal(o.priceSpecification.minPrice, n, `${s.path} minPrice`);
      else assert.equal(o.price ?? o.priceSpecification.price, n, `${s.path} price`);
    });
    const crumbs = graph.find((n) => n['@type'] === 'BreadcrumbList');
    assert.deepEqual(crumbs.itemListElement.map((c) => c.position), [1, 2, 3]);
    assert.equal(crumbs.itemListElement[0].item, SITE + s.t.paths.home);
    assert.equal(crumbs.itemListElement[1].item, `${SITE}${s.t.paths.home}#services`);
    assert.equal(crumbs.itemListElement[2].item, SITE + s.path);
    assert.ok(!byFile[s.file].includes('FAQPage'), 'no new FAQPage markup');
    assert.ok(!/AggregateRating|"Review"/.test(byFile[s.file]), 'no rating or review markup');
  }
});

test('service pages: visible breadcrumb «Startseite › Leistungen › …»', () => {
  for (const s of SERVICES) {
    const h = byFile[s.file];
    const nav = tag(h, /(<nav class="crumbs"[\s\S]*?<\/nav>)/);
    assert.ok(nav, s.path);
    const text = nav.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const [home, services] = s.t.lang === 'de' ? ['Startseite', 'Leistungen'] : ['Home', 'Services'];
    assert.equal(unesc(text), `${home} › ${services} › ${s.short}`);
    assert.match(nav, new RegExp(`href="${s.t.paths.home}#services"`));
    assert.match(nav, /aria-current="page"/);
  }
});

test('prices on the service pages equal the home page', () => {
  for (const s of SERVICES) {
    const h = byFile[s.file];
    const home = byFile[fileOf(s.t.paths.home)];
    const pk = items(s.t);
    for (const id of s.packages) {
      const price = pk[id].price;
      assert.ok(home.includes(`<p class="item__price">${price}</p>`), `home shows ${price}`);
      assert.ok(h.includes(`<span class="svc-price__value">${price}</span>`), `${s.path} shows ${price}`);
    }
    // No other euro amount than the ones on the home page.
    const homeAmounts = new Set(home.replace(/<[^>]+>/g, ' ').match(/€\s?\d+(?:[.,]\d+)*|\d+(?:[.,]\d+)*\s?€/g));
    const main = h.slice(h.indexOf('<main'), h.indexOf('</main>')).replace(/<[^>]+>/g, ' ');
    for (const a of main.match(/€\s?\d+(?:[.,]\d+)*|\d+(?:[.,]\d+)*\s?€/g) || []) assert.ok(homeAmounts.has(a), `${s.path}: ${a} not on the home page`);
  }
});

test('service pages: mailto «Anfragen» with the package subject, as on the home page', () => {
  for (const s of SERVICES) {
    const it = items(s.t)[s.packages[0]];
    const href = `mailto:${config.contact_email}?subject=${encodeURIComponent(s.t.pricing.subjectPrefix + it.name)}`;
    assert.ok(byFile[s.file].includes(`href="${href}"`), s.path);
  }
});

test('service pages: no mascots', () => {
  for (const s of SERVICES) {
    const h = byFile[s.file];
    assert.ok(!/class="[^"]*\b(mascot|mscene|footer-mascots|trio)/.test(h), `${s.path}: mascot markup`);
    assert.ok(!h.includes('mascot-art.js') && !h.includes('/mascots.js'), `${s.path}: mascot module`);
  }
});

test('service pages: structure (problem, what I do, steps, example, 3 to 5 FAQ, related, contact)', () => {
  for (const s of SERVICES) {
    const h = byFile[s.file];
    const L = s.t.services.ui;
    for (const head of [L.problem, L.does, L.steps, L.faq, L.related]) assert.ok(h.includes(`>${head}</h2>`), `${s.path}: ${head}`);
    assert.equal((h.match(/<li class="svc-step">/g) || []).length, 4, `${s.path}: 4 steps`);
    const faq = (h.match(/<details class="faq__item/g) || []).length;
    assert.ok(faq >= 3 && faq <= 5, `${s.path}: ${faq} FAQ items`);
    assert.equal(s.related.length, 2);
    for (const k of s.related) {
      const target = s.t.services.pages.find((p) => p.key === k);
      assert.ok(target && k !== s.key);
      assert.ok(h.includes(`href="${target.path}"`), `${s.path} -> ${target.path}`);
    }
    assert.match(h, /<section class="[^"]*" id="svc-contact"/);
  }
  const by = (t, k) => byFile[fileOf(t.services.pages.find((p) => p.key === k).path)];
  assert.ok(by(de, 'website').includes('alexandrafry.ch'));
  assert.ok(by(en, 'website').includes('alexandrafry.ch'));
  assert.ok(by(de, 'launch').includes(de.refs.case2.text));
  assert.ok(by(en, 'launch').includes(en.refs.case2.text));
  assert.match(by(de, 'spam'), /<svg class="svc-spam"[^>]*role="img"/);
  assert.ok(by(de, 'ki').includes('href="/#ki-demo"'));
  assert.ok(by(en, 'ki').includes('href="/en/#ki-demo"'));
  assert.match(byFile['index.html'], /<section class="kidemo" id="ki-demo"/);
  // The portfolio demo link appears only when the URL answered 200 at build time.
  assert.ok(!by(de, 'ki').includes(config.ki_portfolio_url));
  const live = pages(config, { live: { kiPortfolio: true } });
  assert.ok(live.find((p) => p.file === 'ki-antwortentwuerfe/index.html').html.includes(`href="${config.ki_portfolio_url}"`));
  // ActiveCampaign page names the three countries once.
  const ac = by(de, 'activecampaign').replace(/<[^>]+>/g, ' ');
  assert.equal((ac.match(/Österreich, Deutschland und der Schweiz/g) || []).length, 1);
});

test('service pages: own OG image, canonical, hreflang and x-default (DE)', () => {
  for (const s of SERVICES) {
    const h = byFile[s.file];
    const other = (s.t === de ? en : de).services.pages.find((p) => p.key === s.key);
    const [dePath, enPath] = s.t === de ? [s.path, other.path] : [other.path, s.path];
    assert.ok(h.includes(`<link rel="canonical" href="${SITE}${s.path}">`));
    assert.ok(h.includes(`<link rel="alternate" hreflang="de" href="${SITE}${dePath}">`));
    assert.ok(h.includes(`<link rel="alternate" hreflang="en" href="${SITE}${enPath}">`));
    assert.ok(h.includes(`<link rel="alternate" hreflang="x-default" href="${SITE}${dePath}">`));
    const og = tag(h, /<meta property="og:image" content="([^"]+)">/);
    assert.equal(og, `${SITE}/assets/og/${s.t.lang}-${s.key}.png`);
    assert.ok(existsSync(path.join(root, og.replace(SITE, ''))), `${og} missing (run node src/tools/og.mjs)`);
  }
});

/* ---------- Home page links ---------- */
test('home: each package card links «Mehr zu …» to its page; problem links stay on the packages', () => {
  for (const t of [de, en]) {
    const h = byFile[fileOf(t.paths.home)];
    for (const [id, key] of Object.entries(t.services.byPackage)) {
      const p = t.services.pages.find((x) => x.key === key);
      const card = tag(h, new RegExp(`(<li class="item item--${id}"[\\s\\S]*?</li>\\n(?=<li|</ul>))`));
      assert.ok(card, `${t.lang} ${id}`);
      assert.ok(card.includes(`<a class="item__more" href="${p.path}">${t.services.ui.more} ${p.short}</a>`), `${t.lang} ${id}`);
    }
    for (const item of t.problems.items) assert.ok(h.includes(`<a class="pc__link" href="#pkg-${item.pkg}">`));
    assert.equal(unesc(titleOf(h)), t.meta.title, 'home title stays');
  }
  assert.deepEqual(Object.keys(de.services.byPackage).sort(), ['check', 'ki', 'launch', 'quick', 'support', 'website']);
});

test('footer: a «Leistungen» column with the five pages on every page', () => {
  for (const { file, html } of all) {
    const t = html.includes('<html lang="en"') ? en : de;
    const col = tag(html, /(<nav class="site-footer__services"[\s\S]*?<\/nav>)/);
    assert.ok(col, file);
    assert.ok(col.includes(`>${t.services.ui.services}<`), file);
    for (const p of t.services.pages) assert.ok(col.includes(`href="${p.path}"`), `${file}: ${p.path}`);
  }
});

/* ---------- 3. Ratgeber ---------- */
test('Ratgeber: absent from output, sitemap and navigation while ratgeber_live is false', () => {
  assert.equal(config.ratgeber_live, false);
  const off = pages(config, { articles: [SAMPLE] });
  assert.ok(!off.some((p) => p.file.startsWith('ratgeber/')));
  assert.ok(!off.some((p) => p.html.includes('href="/ratgeber/')));
  assert.ok(!sitemap(config, [SAMPLE]).includes('/ratgeber/'));
});

test('Ratgeber template (flag on, sample article only in this test): index, article, BlogPosting', () => {
  const cfg = { ...config, ratgeber_live: true };
  const on = pages(cfg, { articles: [SAMPLE] });
  const index = on.find((p) => p.file === 'ratgeber/index.html').html;
  const art = on.find((p) => p.file === 'ratgeber/beispiel/index.html').html;
  assert.match(index, /<html lang="de"/);
  assert.ok(index.includes('href="/ratgeber/beispiel/"'));
  for (const h of [index, art]) {
    assert.ok(!/<link rel="alternate" hreflang/.test(h), 'DE only, no EN alternates');
    assert.equal((h.match(/<h1[\s>]/g) || []).length, 1);
  }
  assert.match(art, /<h1[^>]*>Beispielartikel nur für Tests<\/h1>/);
  assert.match(art, /<time datetime="2026-11-02">02\.11\.2026<\/time>/);
  assert.match(art, /von <a href="\/#about">Iva Tsatskrialashvili<\/a>/);
  assert.match(art, /1 Min\. Lesezeit/);
  assert.match(art, /<nav class="toc"[\s\S]*href="#erster-abschnitt"[\s\S]*href="#zweiter-abschnitt"/);
  assert.match(art, /<h2 id="erster-abschnitt">Erster Abschnitt<\/h2>/);
  assert.match(art, /<strong>fettem<\/strong>/);
  assert.match(art, /class="ratgeber-cta"[\s\S]*href="\/e-mails-landen-im-spam\/"/);
  assert.match(art, />Weiterlesen</);
  const post = ld(art).find((n) => n['@type'] === 'BlogPosting');
  assert.deepEqual(post.author, { '@id': `${SITE}/#iva` });
  assert.equal(post.datePublished, '2026-11-02');
  assert.equal(post.dateModified, '2026-11-05');
  assert.ok(on.some((p) => p.html.includes('href="/ratgeber/"')), 'linked once live');
  const xml = sitemap(cfg, [SAMPLE]);
  assert.ok(xml.includes(`<loc>${SITE}/ratgeber/</loc>`));
  assert.ok(xml.includes(`<loc>${SITE}/ratgeber/beispiel/</loc>`));
});

test('Ratgeber: no articles are written yet', async () => {
  const { loadArticles } = await import('../src/ratgeber.mjs');
  assert.deepEqual(loadArticles(), []);
});

/* ---------- 4. Sitemap and robots ---------- */
test('sitemap contains exactly the live pages, with lastmod from page_dates', () => {
  const xml = sitemap(config);
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).sort();
  const live = all
    .filter((p) => !p.html.includes('<meta name="robots" content="noindex">'))
    .map((p) => tag(p.html, /<link rel="canonical" href="([^"]+)">/))
    .sort();
  assert.deepEqual(locs, live);
  assert.equal(locs.length, 16);
  for (const k of ['launch', 'spam', 'activecampaign', 'ki', 'website']) assert.equal(config.page_dates[k], '2026-10-28', k);
  assert.match(xml, new RegExp(`<loc>${SITE}/en/course-launch-tech/</loc>\\s*<lastmod>2026-10-28</lastmod>\\s*<xhtml:link rel="alternate" hreflang="de" href="${SITE}/launch-technik/"/>`));
});

test('robots.txt names the Webprojekte sitemap only when it answered 200', () => {
  assert.ok(!robots(config).includes('Webprojekte'));
  assert.match(robots(config, { webprojekteSitemap: true }), /^Sitemap: https:\/\/mrlololi\.com\/Webprojekte\/sitemap\.xml$/m);
});

/* ---------- 5. Internal links and small fixes ---------- */
test('404 links to the five service pages', () => {
  const h = byFile['404.html'];
  for (const p of [...de.services.pages, ...en.services.pages]) assert.ok(h.includes(`href="${p.path}"`), p.path);
});

test('every page: exactly one H1, heading levels never skip, every img has alt', () => {
  for (const { file, html } of all) {
    const main = html.replace(/<template[\s\S]*?<\/template>/g, '');
    const levels = [...main.matchAll(/<h([1-6])[\s>]/g)].map((m) => Number(m[1]));
    assert.equal(levels.filter((l) => l === 1).length, 1, `${file}: one h1`);
    assert.equal(levels[0], 1, `${file}: starts with h1`);
    for (let i = 1; i < levels.length; i++) assert.ok(levels[i] <= levels[i - 1] + 1, `${file}: h${levels[i - 1]} -> h${levels[i]}`);
    for (const img of main.match(/<img\b[^>]*>/g) || []) assert.match(img, /\balt="[^"]*"/, `${file}: ${img.slice(0, 80)}`);
  }
});

test('«Leistungen» in the header of subpages goes to /#services', () => {
  for (const s of SERVICES) {
    const header = tag(byFile[s.file], /(<header[\s\S]*?<\/header>)/);
    assert.ok(header.includes(`<a href="${s.t.paths.home}#services">${s.t.nav[0].label}</a>`), s.path);
  }
  assert.ok(byFile['impressum/index.html'].includes('<a href="/#services">Leistungen</a>'));
});

/* ---------- Rules ---------- */
test('service copy: no long dashes, no emoji, no «Partner», «Sie» in German', () => {
  const EMOJI = /(?![©®™])\p{Extended_Pictographic}/u;
  for (const s of SERVICES) {
    const text = byFile[s.file].replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');
    assert.ok(!/[–—]/.test(text), `${s.path}: long dash`);
    assert.ok(!EMOJI.test(text), `${s.path}: emoji`);
    assert.ok(!/\bPartner\b/.test(text), `${s.path}: «Partner»`);
    if (s.t === de) assert.ok(!/\b(du|dich|dein|deine|dir)\b/.test(text.replace(/<[^>]+>/g, ' ')), `${s.path}: du-Form`);
  }
});
