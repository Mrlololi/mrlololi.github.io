// Editorial & Motion Upgrade (27.11.2026): regression tests for every bugfix and visual upgrade:
// 1) is-fading NEVER hides headings, prices, cards or outer .demo containers
// 2) Dual hero client quotes (Claudia Witticke + Alexandra Fry with circular portraits)
// 3) Symmetric references: Claudia & Alexandra both have scrolling previews, tool marquees, quotes with portraits; shop spans full width
// 4) Out-of-place "Support-Teams von innen" line removed (DE & EN)
// 5) KI card uses 400x250 (16:10) full-UI screenshot matching Ein Kauf and Musterbericht
// 6) Centered pricing small-print container (.tariff__foot)
// 7) Floating sticky CTA pill (.float-cta[data-float-cta]) on DE & EN home
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const de = read('index.html');
const en = read('en/index.html');
const css = read('assets/css/main.css');

test('disappearing-block bug fixed: .is-fading never sets opacity:0 on outer .demo / [data-demo] containers', () => {
  assert.ok(!/\.demo\.is-fading\s*,\s*\[data-demo\]\.is-fading\s*\{[^}]*opacity:\s*0/.test(css), 'outer .demo must never fade to opacity: 0');
  assert.match(css, /\.more\.is-fading\s+\.viz/, 'only .viz inside .more fades');
  assert.match(css, /\.pkgs-wrap\.is-fading\s+:is\(\.viz,\s*\.days\)/, 'only .viz and .days inside .pkgs-wrap fade');
});

test('hero has balanced dual client quotes (Claudia Witticke + Alexandra Fry with circular portraits)', () => {
  for (const [label, html] of [['DE', de], ['EN', en]]) {
    const hero = html.slice(html.indexOf('<section class="hero'), html.indexOf('</section>'));
    assert.match(hero, /class="wrap hero__quotes"/, `${label}: hero__quotes row present`);
    assert.ok(hero.includes('claudia-photo-56.jpg'), `${label}: Claudia circular photo in hero`);
    assert.ok(hero.includes('alexandra-photo-56.jpg'), `${label}: Alexandra circular photo in hero`);
    assert.ok(hero.includes('Claudia Witticke'), `${label}: Claudia quote in hero`);
    assert.ok(hero.includes('Alexandra Fry'), `${label}: Alexandra quote in hero`);
  }
});

test('references: Claudia and Alexandra are symmetric with scrolling previews, tool marquees and portrait quotes; Support-Teams line gone', () => {
  for (const [label, html] of [['DE', de], ['EN', en]]) {
    const refs = html.slice(html.indexOf('id="references"'), html.indexOf('id="about"'));
    assert.equal((refs.match(/class="ref card [^"]*ref--scroll"/g) || []).length, 2, `${label}: both Claudia and Alexandra scroll`);
    assert.equal((refs.match(/class="ref__marquee"/g) || []).length, 2, `${label}: both Claudia and Alexandra have tool marquees`);
    assert.ok(refs.includes('case-claudia-long-640.jpg'), `${label}: Claudia long scrolling screenshot`);
    assert.ok(refs.includes('case-alexandrafry-long-640.jpg'), `${label}: Alexandra long scrolling screenshot`);
    assert.ok(refs.includes('alexandra-photo-56.jpg'), `${label}: Alexandra portrait in reference card`);
    assert.ok(!html.includes('Support-Teams von innen'), `${label}: DE Support-Teams line removed`);
    assert.ok(!html.includes('support teams from the inside'), `${label}: EN support teams line removed`);
  }
});

test('Zum Ausprobieren KI card uses 400x250 16:10 full-UI preview; pricing small-print centered in .tariff__foot; floating CTA present', () => {
  for (const [label, html] of [['DE', de], ['EN', en]]) {
    assert.match(html, /project-ki-400\.jpg"[^>]*width="400" height="250"/, `${label}: KI preview 400x250`);
    assert.match(html, /<div class="tariff__foot">[\s\S]*class="notdo-line"[\s\S]*class="small tariff__tax"[\s\S]*class="tariff__b2b"/, `${label}: centered tariff__foot`);
    assert.match(html, /<a class="float-cta btn btn--primary btn--sm" href="#contact" data-float-cta hidden>/, `${label}: floating sticky CTA`);
  }
});
