// Stage 4 behaviour in a browser: replay on re-entry, reduced motion, no JS, keyboard and Escape,
// phone tabs, first-name parsing, mailto composition, the thank-you note, docking.
// Usage: node src/qa/stage4.mjs   (exit code 1 on failure; screenshots in qa/shots/stage4)
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium, repoRoot, qaDir } from './browsers.mjs';
import { startServer } from './serve.mjs';
import { warm } from './warm.mjs';

const shots = path.join(qaDir, 'shots', 'stage4');
const wait = (page, ms) => page.waitForTimeout(ms);
const center = (page, sel) => page.$eval(sel, (el) => el.scrollIntoView({ block: 'center' }));
const away = (page) => page.evaluate(() => scrollTo(0, 0));

export async function checkStage4(browser, base) {
  await mkdir(shots, { recursive: true });
  const results = [];
  const check = (name, pass, details = '') => results.push({ name, pass: Boolean(pass), details: typeof details === 'string' ? details : JSON.stringify(details) });

  /* ---------- desktop, motion ---------- */
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await ctx.grantPermissions(['clipboard-read', 'clipboard-write']);
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.goto(base + '/', { waitUntil: 'load' });
    await page.waitForFunction(() => window.ScrollTrigger, null, { timeout: 10000 });
    await warm(page);

    // Docking: the radius scrubs from 1 to 0 as a section reaches the top.
    await page.$eval('#process', (el) => scrollTo(0, el.getBoundingClientRect().top + scrollY - innerHeight * 0.5));
    await wait(page, 300);
    const half = await page.$eval('#process', (el) => Number(getComputedStyle(el).getPropertyValue('--dock')));
    check('docking: the radius is part-way while the section climbs', half > 0.2 && half < 0.8, String(half));

    // Problem cards: «broken» on every entry, then fixed.
    await center(page, '.fixdemo--signup');
    await wait(page, 400);
    const first = await page.$eval('.fixdemo--signup', (f) => f.dataset.state);
    await wait(page, 5200);
    const done = await page.$eval('.fixdemo--signup', (f) => ({ state: f.dataset.state, n: f.querySelector('.sig__n').textContent }));
    await away(page);
    await wait(page, 500);
    await center(page, '.fixdemo--signup');
    await wait(page, 400);
    const again = await page.$eval('.fixdemo--signup', (f) => f.dataset.state);
    check('problem card: plays broken -> fixed (47/47) and again on re-entry', first === 'broken' && done.state === 'fixed' && done.n === '47' && again === 'broken', { first, done, again });
    await page.click('.fixdemo--spam .fixdemo__play');
    const btn = await page.$eval('.fixdemo--spam', (f) => ({ state: f.dataset.state, label: f.querySelector('.fixdemo__play').textContent }));
    check('problem card: «Lösung ansehen» replays it and becomes «Nochmal ansehen»', btn.state === 'broken' && btn.label === 'Nochmal ansehen', btn);

    // Story: plays on entry; never shown finished when you come back (the Stage 3 bug).
    await center(page, '.screen');
    await wait(page, 700);
    const mid = await page.$$eval('.run__step', (s) => s.filter((x) => x.classList.contains('is-on')).length);
    await wait(page, 4000);
    const end = await page.evaluate(() => ({ on: document.querySelectorAll('.run__step.is-on').length, running: document.querySelector('.screen').classList.contains('is-running') }));
    await away(page);
    await wait(page, 500);
    await center(page, '.screen');
    await wait(page, 500);
    const back = await page.$$eval('.run__step', (s) => s.filter((x) => x.classList.contains('is-on')).length);
    check('story: plays on entry, ends complete, starts again on re-entry', mid < 6 && end.on === 6 && !end.running && back < 6, { mid, end, back });
    const pause = await page.evaluate(() => { const b = document.querySelector('.screen > .loop-btn'); return { inFrame: Boolean(b.closest('.screen')), visible: !b.hidden }; });
    await page.click('.screen > .loop-btn');
    const p1 = await page.$$eval('.run__step.is-on', (s) => s.length);
    await wait(page, 900);
    const p2 = await page.$$eval('.run__step.is-on', (s) => s.length);
    await page.click('.screen > .loop-btn');
    check('story: the pause button sits in the frame and holds the run', pause.inFrame && pause.visible && p1 === p2, { pause, p1, p2 });
    await wait(page, 4000);

    // First name from the form: «Ann» stays «Ann», «Anna K.» becomes «Anna».
    const names = [];
    for (const typed of ['Ann', 'Anna K.']) {
      await page.fill('#story-name', typed);
      await page.fill('#story-email', 'ann@example.com');
      await page.click('.story__form button[type="submit"]');
      await wait(page, 100);
      names.push(await page.$eval('.pmail__subject .js-first', (e) => e.textContent));
    }
    check('story: first name «Ann» -> «Ann», «Anna K.» -> «Anna»', names.join() === 'Ann,Anna', names);
    await page.fill('#story-email', 'kein-at');
    await page.click('.story__form button[type="submit"]');
    const bad = await page.evaluate(() => ({ error: !document.getElementById('story-email-error').hidden, focus: document.activeElement.id }));
    check('story: a bad e-mail shows the inline error and keeps focus', bad.error && bad.focus === 'story-email', bad);
    await page.fill('#story-email', 'anna@example.com');
    await page.fill('#story-name', 'Anna K.');

    // KI: highlight popover (keyboard, Escape), legend pulse, approve mid-play, 20 examples.
    await center(page, '.kidemo__grid');
    await wait(page, 600);
    const playing = await page.$eval('.kidemo', (d) => d.classList.contains('is-playing') && !d.classList.contains('is-done'));
    await page.click('.kidemo__approve');
    const approved = await page.evaluate(() => ({ done: document.querySelector('.kidemo').classList.contains('is-done'), text: document.querySelector('.kidemo__approve').textContent.trim(), sent: !document.querySelector('.kidemo__sent').hidden }));
    check('KI: «Freigeben» works mid-animation (skips to the end, then approves)', playing && approved.done && approved.text === 'Freigegeben' && approved.sent, { playing, approved });
    await page.focus('.kidemo__text button.hl');
    await page.keyboard.press('Enter');
    const pop = await page.evaluate(() => ({ open: !document.querySelector('.kipop').hidden, focus: document.activeElement.className, text: document.querySelector('.kipop').textContent }));
    await page.keyboard.press('Escape');
    const closed = await page.evaluate(() => ({ hidden: document.querySelector('.kipop').hidden, back: document.activeElement.matches('.kidemo__text button.hl'), expanded: document.activeElement.getAttribute('aria-expanded') }));
    check('KI: a highlight opens «Warum markiert?» by keyboard; Escape closes and returns focus', pop.open && pop.focus === 'kipop__close' && pop.text.includes('Warum markiert?') && closed.hidden && closed.back && closed.expanded === 'false', { pop, closed });
    await page.click('.kilegend__item--fehlt .kilegend__btn');
    check('KI: a legend item pulses its highlights', await page.$$eval('.kidemo__text .hl--fehlt.is-pulse', (e) => e.length > 0));
    await page.click('.kinav button:nth-of-type(1)');
    await wait(page, 200);
    const next = await page.evaluate(() => ({ count: document.querySelector('.kinav__count').textContent, from: document.querySelector('.kidemo__sender').textContent, approve: document.querySelector('.kidemo__approve').textContent }));
    check('KI: «Nächstes Beispiel» shows 2 / 20 and resets the approval', next.count === '2 / 20' && next.from !== 'Anna K.' && next.approve === 'Freigeben', next);
    await page.focus('.kitab[aria-selected="true"]');
    await page.keyboard.press('End');
    const tab = await page.evaluate(() => ({ sel: document.querySelector('.kitab[aria-selected="true"]').textContent, items: document.querySelectorAll('.kinbox__btn').length }));
    check('KI: the five inbox tabs work with the keyboard (End), four mails each', tab.sel === 'Kurs & Zertifikat' && tab.items === 4, tab);
    await page.focus('#tone-tab-1');
    await page.keyboard.press('ArrowRight');
    await wait(page, 500);
    const tone = await page.evaluate(() => ({ focus: document.activeElement.id, sents: document.querySelectorAll('.tone__panel.is-active .sent').length }));
    check('KI: tone tabs by arrow keys, the reply crossfades sentence by sentence', tone.focus === 'tone-tab-2' && tone.sents >= 2, tone);

    // Chat finder: three chips, then the package card with Anfragen as a mailto.
    await center(page, '.chat');
    await page.waitForSelector('.chat .chip', { timeout: 6000 });
    for (const value of ['Etwas funktioniert nicht', 'Ja, ziemlich genau', 'In den nächsten 2 Wochen']) {
      await page.click(`.chat .chip:text-is("${value}")`);
      await wait(page, 100);
      await page.waitForSelector('.chat .chip, .chat__card', { timeout: 6000 });
    }
    await page.waitForSelector('.chat__card', { timeout: 6000 });
    const card = await page.evaluate(() => ({ name: document.querySelector('.chat__pkg').textContent, go: document.querySelector('.chat__card a').getAttribute('href'), mail: document.querySelectorAll('.chat__card a')[1].getAttribute('href'), me: document.querySelectorAll('.bubble--me').length }));
    check('chat finder: three answers as bubbles, then the Quick-Fix card with «Anfragen» mailto', card.name === 'Quick-Fix' && card.go === '#pkg-quick' && card.mail.startsWith('mailto:hello@mrlololi.com?subject=Anfrage%3A%20Quick-Fix') && card.me === 3, card);

    // Betreuung: the switch rolls to 10 h = 450 €.
    await center(page, '.meter');
    await wait(page, 2400);
    await page.click('.meter__opt[data-h="10"]');
    await wait(page, 800);
    const meter = await page.$eval('.meter__total', (p) => p.textContent);
    check('Betreuung: the 10 h switch rolls to 450 €', meter === '10 h = 450 €', meter);

    // About: a timeline dot opens its story.
    await center(page, '.path');
    await page.click('.path__btn >> nth=0');
    const story = await page.evaluate(() => ({ open: !document.getElementById('path-story-1').hidden, others: [2, 3, 4].every((i) => document.getElementById(`path-story-${i}`).hidden) }));
    check('about: a timeline stop opens its two-line story', story.open && story.others, story);

    // FAQ: equal columns of one height; an «Auch gefragt» chip opens that question.
    await center(page, '.faqbox');
    await page.click('.faq__item:nth-child(2) summary');
    await wait(page, 900);
    const box = await page.evaluate(() => { const b = document.querySelector('.faqbox'); const [l, r] = [b.querySelector('.faqbox__side'), b.querySelector('.faq__chat')]; return { chat: b.classList.contains('is-chat'), same: Math.abs(l.offsetHeight - r.offsetHeight) <= 2, also: document.querySelectorAll('.faq__chip').length }; });
    await page.click('.faq__chip >> nth=0');
    await wait(page, 900);
    const opened = await page.evaluate(() => [...document.querySelectorAll('.faq__item')].filter((d) => d.open).map((d) => d.querySelector('summary').textContent));
    check('FAQ: one box with two equal columns, «Auch gefragt» chips open their question', box.chat && box.same && box.also >= 2 && opened.length === 1 && opened[0] !== 'Arbeiten Sie auch remote?', { box, opened });

    // Contact: the brief fills the preview and the mailto; the note appears only after the click.
    await center(page, '.brief');
    await page.selectOption('#brief-issue', 'Anmeldungen');
    const brief = await page.evaluate(() => ({ preview: document.querySelector('.brief__body').textContent, href: document.querySelector('.brief__open').getAttribute('href'), note: document.querySelector('.contact__thanks').children.length }));
    check('contact: the brief updates the preview and the mailto body', brief.preview.includes('Es hakt bei Anmeldungen') && brief.href.includes('&body=Hallo%20Iva%2C%0D%0A%0D%0AIch%20verkaufe') && brief.href.includes('Anmeldungen') && brief.note === 0, brief);
    await page.$eval('.brief__open', (a) => a.addEventListener('click', (e) => e.preventDefault(), { once: true }));
    await page.click('.brief__open');
    await page.click('.thanks__copy');
    await wait(page, 300);
    const thanks = await page.evaluate(async () => ({ text: document.querySelector('.contact__thanks').textContent, role: document.querySelector('.contact__thanks').getAttribute('role'), mascot: Boolean(document.querySelector('.contact__thanks [data-scene="contact"]')), copy: document.querySelector('.thanks__copy').textContent, clip: await navigator.clipboard.readText().catch(() => '') }));
    check('contact: after the click a status note with Live waving; «Kopieren» copies the address', thanks.role === 'status' && thanks.text.includes('Danke! Sobald Ihre Mail da ist') && thanks.mascot && thanks.copy === 'Kopiert' && thanks.clip === 'hello@mrlololi.com', thanks);
    const time = await page.$eval('.contact__time', (t) => ({ hidden: t.hidden, text: t.textContent }));
    check('contact: Graz local time shown', !time.hidden && /^Ortszeit Graz: \d\d:\d\d$/.test(time.text), time);

    check('stage 4 desktop: no console errors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }

  /* ---------- phone: no pins, story panes as tabs that follow the run ---------- */
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(base + '/', { waitUntil: 'load' });
    await page.waitForFunction(() => window.ScrollTrigger, null, { timeout: 10000 });
    await warm(page);
    const pins = await page.$$eval('.pin-spacer', (p) => p.length);
    await center(page, '.screen');
    await wait(page, 300);
    const seen = new Set();
    for (let i = 0; i < 12; i++) { seen.add(await page.$eval('.screen__tab[aria-selected="true"]', (t) => t.id)); await wait(page, 350); }
    await page.focus('.screen__tab[aria-selected="true"]');
    await page.keyboard.press('Home');
    const home = await page.evaluate(() => ({ focus: document.activeElement.id, shown: document.querySelector('.pane.is-shown').id }));
    await page.screenshot({ path: path.join(shots, 'story-390.png') });
    check('phone: no pins; story panes are tabs that follow the run; Home selects the form', pins === 0 && seen.size >= 3 && home.focus === 'story-tab-1' && home.shown === 'story-pane-1', { pins, seen: [...seen], home });
    const fan = await page.$eval('.qcards', (el) => getComputedStyle(el).overflowX);
    check('phone: quote cards are a horizontal scroll-snap row', fan === 'auto', fan);
    await page.close();
  }

  /* ---------- reduced motion: final states, no pins, no auto-play ---------- */
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    await page.goto(base + '/', { waitUntil: 'load' });
    await wait(page, 2500);
    await warm(page);
    await center(page, '.screen');
    await wait(page, 600);
    const r = await page.evaluate(() => ({
      pins: document.querySelectorAll('.pin-spacer').length,
      run: document.querySelectorAll('.run__step.is-on').length === 0 && !document.querySelector('.screen').classList.contains('is-off'),
      cards: [...document.querySelectorAll('.fixdemo')].every((f) => f.dataset.state === 'fixed'),
      dock: getComputedStyle(document.querySelector('#process')).getPropertyValue('--dock') === '',
      kidemo: !document.querySelector('.kidemo').classList.contains('is-playing'),
      line: getComputedStyle(document.querySelector('.steps-wrap')).getPropertyValue('--draw') === '',
      splits: document.querySelectorAll('[data-enter] .line, [data-enter] div[style*="overflow"]').length,
    }));
    check('reduced motion: no pins, no docking scrub, no splits; story, cards, KI and line show their final state', r.pins === 0 && r.run && r.cards && r.dock && r.kidemo && r.line && r.splits === 0, r);
    await page.click('.fixdemo--rate .fixdemo__play');
    const toggled = await page.$eval('.fixdemo--rate', (f) => f.dataset.state);
    check('reduced motion: «Lösung ansehen» switches states without movement', toggled === 'broken', toggled);
    await page.close();
  }

  /* ---------- no JS ---------- */
  {
    const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(base + '/', { waitUntil: 'load' });
    const n = await page.evaluate(() => ({
      brief: getComputedStyle(document.querySelector('.brief')).display === 'none',
      mail: document.querySelector('.brief__open').getAttribute('href').startsWith('mailto:hello@mrlololi.com?subject='),
      chat: getComputedStyle(document.querySelector('.chat')).display === 'none',
      list: getComputedStyle(document.querySelector('.finder__static')).display !== 'none',
      kimore: document.querySelectorAll('.kimore__item').length === 19,
      stories: [...document.querySelectorAll('.path__story')].every((p) => getComputedStyle(p).display !== 'none'),
      fixButtons: [...document.querySelectorAll('.fixdemo__play')].every((b) => getComputedStyle(b).display === 'none'),
      meterSwitch: getComputedStyle(document.querySelector('.meter__switch')).display === 'none',
      thanks: document.querySelector('.contact__thanks').children.length === 0,
    }));
    check('no JS: mail link works, builder/chat/switches hidden, KI list of 19, timeline stories shown', Object.values(n).every(Boolean), n);
    await ctx.close();
  }
  return results;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = await startServer({ root: repoRoot });
  const browser = await chromium.launch();
  const results = await checkStage4(browser, server.url);
  await browser.close();
  await server.close();
  for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}${r.pass ? '' : `  -> ${r.details}`}`);
  process.exit(results.every((r) => r.pass) ? 0 : 1);
}
