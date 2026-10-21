// Behaviour checks for the Stage 2 demos: motion, reduced motion, no JS, keyboard, mobile.
// Usage: node src/qa/demos.mjs   (exit code 1 on failure; screenshots in qa/shots/demos)
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium, repoRoot, qaDir } from './browsers.mjs';
import { startServer } from './serve.mjs';

const shots = path.join(qaDir, 'shots', 'demos');
const ribbonOffset = (page) => page.$eval('.ribbon textPath', (tp) => tp.startOffset.animVal.value);
const marqueeX = (page) => page.$eval('.marquee__track', (el) => new DOMMatrix(getComputedStyle(el).transform).m41);

export async function checkDemos(browser, base) {
  await mkdir(shots, { recursive: true });
  const results = [];
  const check = (name, pass, details = '') => results.push({ name, pass: Boolean(pass), details });

  // Motion allowed, desktop.
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.goto(base + '/', { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    const r1 = await ribbonOffset(page);
    await page.waitForTimeout(1200);
    const r2 = await ribbonOffset(page);
    check('ribbon: text flows along the curve', r1 !== r2, `${r1} -> ${r2}`);
    await page.click('.hero .loop-btn');
    const p1 = await ribbonOffset(page);
    await page.waitForTimeout(800);
    const p2 = await ribbonOffset(page);
    const label = await page.$eval('.hero .loop-btn', (b) => b.textContent);
    check('ribbon: pause button stops it and offers «fortsetzen»', p1 === p2 && label === 'Animation fortsetzen', `${p1} -> ${p2}, "${label}"`);
    await page.click('.hero .loop-btn');

    await page.$eval('.tools', (el) => el.scrollIntoView({ block: 'center' }));
    await page.mouse.move(5, 5);
    const m1 = await marqueeX(page);
    await page.waitForTimeout(1000);
    const m2 = await marqueeX(page);
    check('marquee: moves while in view', m1 !== m2, `${m1} -> ${m2}`);
    await page.hover('.marquee');
    const h1 = await marqueeX(page);
    await page.waitForTimeout(600);
    const h2 = await marqueeX(page);
    check('marquee: hover pauses it', h1 === h2, `${h1} -> ${h2}`);
    await page.mouse.move(5, 5);
    await page.$eval('#faq', (el) => el.scrollIntoView());
    await page.waitForTimeout(400);
    const off = await page.$eval('.marquee', (el) => el.classList.contains('is-running'));
    check('marquee: stops off-screen', !off);
    await page.focus('.ba__range');
    for (let i = 0; i < 10; i++) await page.keyboard.press('ArrowRight');
    const pos = await page.$eval('.ba__stage', (el) => el.style.getPropertyValue('--pos'));
    const clip = await page.$eval('.ba__side--after', (el) => getComputedStyle(el).clipPath);
    check('before/after: arrow keys move the divider and the clip', pos === '60%' && clip.includes('60%'), `${pos} | ${clip}`);
    // Story: pinned on wide screens, the scroll moves through the three steps.
    const active = () => page.$$eval('.story__panel', (ps) => ps.findIndex((p) => p.classList.contains('is-active')));
    const pinned = await page.$eval('.story', (el) => el.classList.contains('is-pinned'));
    const stStart = await page.$eval('.story', (el) => el.getBoundingClientRect().top + scrollY + el.offsetHeight / 2 - innerHeight / 2);
    const states = [];
    for (const f of [0.1, 0.5, 0.9]) {
      await page.evaluate((y) => window.scrollTo(0, y), stStart + 900 * 1.5 * f);
      await page.waitForTimeout(350);
      states.push(await active());
    }
    check('story: pinned at 1280 and the scroll walks through steps 1, 2, 3', pinned && states.join() === '0,1,2', `pinned ${pinned}, ${states}`);
    await page.waitForTimeout(800);
    const live = await page.$eval('.toasts', (el) => el.classList.contains('is-live'));
    const shownToasts = await page.$$eval('.toast.is-in', (ts) => ts.length);
    check('toasts: stack plays while step 3 is shown', live && shownToasts >= 1, `live ${live}, ${shownToasts} in`);
    await page.click('.toasts .loop-btn');
    const pausedLive = await page.$eval('.toasts', (el) => el.classList.contains('is-live'));
    check('toasts: pause button stops the loop and shows all four', !pausedLive && (await page.$$eval('.toast', (ts) => ts.every((t) => getComputedStyle(t).opacity === '1'))));
    await page.click('.toasts .loop-btn');
    await page.focus('#story-tab-3');
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(350);
    check('story: arrow keys on the tabs move to the previous step', (await active()) === 1 && (await page.evaluate(() => document.activeElement.id)) === 'story-tab-2');
    // KI block: plays once in view, ends finished, «Nochmal» replays; tones by arrow keys.
    await page.$eval('.kidemo', (el) => el.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(1200);
    const mid = await page.$eval('.kidemo', (el) => ({ playing: el.classList.contains('is-playing'), done: el.classList.contains('is-done') }));
    await page.waitForTimeout(4200);
    const end = await page.$eval('.kidemo', (el) => ({ done: el.classList.contains('is-done'), replay: !el.querySelector('.kidemo__replay').hidden, chips: el.querySelectorAll('.chips .label.is-on').length }));
    check('KI demo: plays once in view and ends with the draft (under 5 s)', mid.playing && !mid.done && end.done && end.replay && end.chips === 4, JSON.stringify({ mid, end }));
    await page.click('.kidemo__replay');
    await page.waitForTimeout(300);
    check('KI demo: «Nochmal» replays it', await page.$eval('.kidemo', (el) => !el.classList.contains('is-done')));
    await page.focus('#tone-tab-1');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    const tone = await page.evaluate(() => ({ focus: document.activeElement.id, shown: document.querySelector('.tone__panel.is-active .tone__text').textContent.slice(0, 9) }));
    check('tone switcher: arrow keys choose «locker»', tone.focus === 'tone-tab-3' && tone.shown === 'Hi Anna! ', JSON.stringify(tone));
    // 6 vs 1: moves while in view, pause button stops it.
    await page.$eval('.speed', (el) => el.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(700);
    const sp1 = await page.$eval('.speed__card--slow', (el) => el.style.getPropertyValue('--p'));
    await page.waitForTimeout(700);
    const sp2 = await page.$eval('.speed__card--slow', (el) => el.style.getPropertyValue('--p'));
    await page.click('.speed .loop-btn');
    const sp3 = await page.$eval('.speed__card--slow', (el) => el.style.getPropertyValue('--p'));
    check('6 vs 1: lines run while in view, the pause button stops them', sp1 !== sp2 && sp3 === '', `${sp1} -> ${sp2} -> "${sp3}"`);
    // Package finder: every answer path ends on the right package; restart clears it.
    const expected = { broken: { yes: 'quick', no: 'check' }, launch: { yes: 'launch', no: 'check' }, website: { yes: 'website', no: 'check' }, inbox: { yes: 'ki', no: 'check' } };
    const wrong = [];
    for (const [topic, byKnows] of Object.entries(expected)) {
      for (const [knows, pkg] of Object.entries(byKnows)) {
        await page.click(`.finder__q[data-q="1"] [data-value="${topic}"]`);
        await page.click(`.finder__q[data-q="2"] [data-value="${knows}"]`);
        await page.click(`.finder__q[data-q="3"] [data-value="${knows === 'yes' ? 'soon' : 'later'}"]`);
        const href = await page.$eval('.finder__result a', (a) => a.getAttribute('href'));
        if (href !== `#pkg-${pkg}`) wrong.push(`${topic}+${knows} -> ${href}`);
      }
    }
    await page.click('.finder__restart');
    const cleared = await page.$eval('.finder__app', (app) => app.querySelector('.finder__result').textContent === '' && app.querySelector('[data-q="2"]').hidden);
    check('finder: all 8 answer paths pick the package from the brief, restart clears', wrong.length === 0 && cleared, wrong.join(', '));
    // Quote cards tilt on wide screens; FAQ shows the chosen question as a chat.
    const tilt = await page.$eval('.qcard--pink', (el) => getComputedStyle(el).transform);
    check('quote cards: tilted at 1280 with motion', tilt !== 'none', tilt);
    await page.$eval('#faq', (el) => el.scrollIntoView({ block: 'start' }));
    await page.click('.faq__item:nth-child(3) summary');
    await page.waitForTimeout(200);
    const typing = await page.$eval('.faq__chat', (c) => ({ q: c.querySelector('.bubble--visitor')?.textContent, typing: Boolean(c.querySelector('.bubble--typing')) }));
    await page.waitForTimeout(1000);
    const chat = await page.evaluate(() => ({
      answer: document.querySelector('.faq__chat .bubble--iva')?.textContent,
      expected: document.querySelector('.faq__item:nth-child(3) p').textContent,
      open: [...document.querySelectorAll('.faq__item')].map((d) => d.open).join(),
      hidden: document.querySelector('.faq__chat').getAttribute('aria-hidden'),
    }));
    check('FAQ chat: question bubble, «tippt…», then the answer; one item open; chat hidden from screen readers',
      typing.q === 'Wie schnell können Sie starten?' && typing.typing && chat.answer === chat.expected && chat.open === 'false,false,true,false,false,false,false' && chat.hidden === 'true',
      JSON.stringify({ typing, chat }));
    check('demos: no console errors', errors.length === 0, errors.join(' | '));
    await page.close();
  }

  // Phone: tabs, no pin; resize back to desktop pins again without horizontal scroll.
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(base + '/', { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    await page.$eval('.story', (el) => el.scrollIntoView({ block: 'start' }));
    const pinned = await page.$eval('.story', (el) => el.classList.contains('is-pinned'));
    await page.click('#story-tab-3');
    await page.waitForTimeout(400);
    const third = await page.$eval('#story-panel-3', (p) => p.classList.contains('is-active') && getComputedStyle(p).visibility === 'visible');
    await page.screenshot({ path: path.join(shots, 'story-390.png') });
    check('story 390: tabs, no pin, tab 3 shows step 3', !pinned && third, JSON.stringify({ pinned, third }));
    const phone = await page.evaluate(() => ({
      tilt: getComputedStyle(document.querySelector('.qcard--pink')).transform,
      chat: getComputedStyle(document.querySelector('.faq__chat')).display,
    }));
    await page.$eval('.faq__item summary', (s) => s.click());
    const answerShown = await page.$eval('.faq__item p', (p) => p.getBoundingClientRect().height > 20 && getComputedStyle(p).position !== 'absolute');
    check('390: quote cards straight, no chat, FAQ answers open inline', phone.tilt === 'none' && phone.chat === 'none' && answerShown, JSON.stringify({ ...phone, answerShown }));
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.waitForTimeout(800);
    const wide = await page.evaluate(() => ({ pinned: document.querySelector('.story').classList.contains('is-pinned'), overflow: document.documentElement.scrollWidth - innerWidth }));
    check('story: resize 390 -> 1280 pins again, no horizontal scroll', wide.pinned && wide.overflow <= 0, JSON.stringify(wide));
    await page.close();
  }

  // Stage 3: the things that look clickable work (desktop and phone).
  for (const width of [1280, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto(base + '/', { waitUntil: 'load' });
    await page.waitForTimeout(1600);
    // Flow nodes: one line at a time.
    await page.click('.hf__btn--3');
    const flow = await page.evaluate(() => ({
      expanded: [...document.querySelectorAll('.hf__btn')].map((b) => b.getAttribute('aria-expanded')).join(),
      line: [...document.querySelectorAll('.hf__lines li')].filter((li) => getComputedStyle(li).display !== 'none').map((li) => li.textContent),
    }));
    check(`${width}: flow node «Zahlung» shows its one line`, flow.expanded === 'false,false,true,false' && flow.line.length === 1 && flow.line[0].startsWith('Zahlung oder Rate'), JSON.stringify(flow));
    // Story form: a bad e-mail shows the inline error, a good one plays the story with the typed name.
    await page.$eval('.story', (el) => el.scrollIntoView({ block: 'center' }));
    await page.click('#story-tab-1');
    await page.waitForTimeout(400);
    await page.fill('#story-email', 'kein-at-zeichen');
    await page.click('.story__form button[type="submit"]');
    const bad = await page.evaluate(() => ({ error: !document.getElementById('story-email-error').hidden, invalid: document.getElementById('story-email').getAttribute('aria-invalid'), focus: document.activeElement.id }));
    check(`${width}: story form shows the e-mail error inline and keeps focus`, bad.error && bad.invalid === 'true' && bad.focus === 'story-email', JSON.stringify(bad));
    await page.fill('#story-name', 'Maria Muster');
    await page.fill('#story-email', 'maria@example.com');
    const url = page.url();
    await page.click('.story__form button[type="submit"]');
    await page.waitForTimeout(600);
    const step2 = await page.$$eval('.story__panel', (ps) => ps.findIndex((p) => p.classList.contains('is-active')));
    await page.waitForTimeout(3000);
    const after = await page.evaluate(() => ({
      step: [...document.querySelectorAll('.story__panel')].findIndex((p) => p.classList.contains('is-active')),
      first: document.querySelector('.js-first').textContent,
      toast: document.querySelector('.js-name').textContent,
    }));
    check(`${width}: story form plays step 2, then step 3 with «Maria»; nothing in the URL`, step2 === 1 && after.step === 2 && after.first === 'Maria' && after.toast === 'Maria Muster' && page.url() === url, JSON.stringify({ step2, ...after, url: page.url() }));
    // KI buttons: approve, edit, reset by tone switch.
    await page.$eval('.kidemo', (el) => el.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(5200);
    await page.click('.kidemo__approve');
    const approved = await page.evaluate(() => ({ text: document.querySelector('.kidemo__approve').textContent.trim(), dis: document.querySelector('.kidemo__approve').getAttribute('aria-disabled'), sent: !document.querySelector('.kidemo__sent').hidden }));
    await page.click('.kidemo__edit');
    const editing = await page.evaluate(() => ({ area: document.activeElement.tagName, btn: document.querySelector('.kidemo__edit').textContent }));
    await page.click('#tone-tab-2');
    const reset = await page.evaluate(() => ({ area: Boolean(document.querySelector('.tone__edit')), approve: document.querySelector('.kidemo__approve').textContent, edit: document.querySelector('.kidemo__edit').textContent }));
    check(`${width}: «Freigeben» / «Bearbeiten» work and a tone switch resets them`,
      approved.text === 'Freigegeben' && approved.dis === 'true' && approved.sent && editing.area === 'TEXTAREA' && editing.btn === 'Fertig' && !reset.area && reset.approve === 'Freigeben' && reset.edit === 'Bearbeiten',
      JSON.stringify({ approved, editing, reset }));
    // Before/after: dragging the picture moves the divider.
    await page.$eval('.ba__stage', (el) => el.scrollIntoView({ block: 'center' }));
    const box = await page.$eval('.ba__stage', (el) => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
    await page.mouse.move(box.x + box.w * 0.5, box.y + box.h / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.w * 0.2, box.y + box.h / 2, { steps: 5 });
    await page.mouse.up();
    const pos = await page.$eval('.ba__range', (r) => Number(r.value));
    check(`${width}: dragging the before/after picture moves the divider`, pos >= 15 && pos <= 25, String(pos));
    // Finder: with JS only the questions, not the static list.
    check(`${width}: finder shows questions only (static list hidden with JS)`, await page.$eval('.finder__static', (el) => getComputedStyle(el).display === 'none'));
    await page.close();
  }

  // Slow web fonts (1.5 s): the hero must not reflow when they arrive.
  for (const p of ['/', '/en/']) {
    const page = await browser.newPage({ viewport: { width: 412, height: 823 }, deviceScaleFactor: 2 });
    await page.addInitScript(() => {
      window.__cls = 0;
      new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (!e.hadRecentInput) window.__cls += e.value; })).observe({ type: 'layout-shift', buffered: true });
    });
    await page.route('**/*.woff2', async (route) => { await new Promise((r) => setTimeout(r, 1500)); await route.continue(); });
    await page.goto(base + p, { waitUntil: 'load' });
    await page.waitForTimeout(2500);
    const cls = await page.evaluate(() => window.__cls);
    check(`slow fonts ${p}: CLS under 0.05 while fonts arrive late (${cls.toFixed(3)})`, cls < 0.05, cls.toFixed(3));
    await page.close();
  }

  // Reduced motion: nothing loops, no pause buttons needed.
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    await page.goto(base + '/', { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    const r = await ribbonOffset(page);
    const wrapped = await page.$eval('.marquee__list[aria-hidden="true"]', (el) => getComputedStyle(el).display === 'none');
    const buttons = await page.$$eval('.loop-btn', (bs) => bs.every((b) => b.hidden));
    check('reduced motion: ribbon rests, marquee is a static list, no pause buttons', r === 0 && wrapped && buttons, JSON.stringify({ r, wrapped, buttons }));
    const rm = await page.evaluate(() => ({
      pinned: document.querySelector('.story').classList.contains('is-pinned'),
      tabs: document.querySelector('.story').classList.contains('is-tabs'),
      toasts: [...document.querySelectorAll('.toast')].every((t) => getComputedStyle(t).opacity === '1'),
    }));
    check('reduced motion: story uses tabs without pin, all toasts listed', !rm.pinned && rm.tabs && rm.toasts, JSON.stringify(rm));
    await page.$eval('.kidemo', (el) => el.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(600);
    const kr = await page.evaluate(() => ({
      playing: document.querySelector('.kidemo').classList.contains('is-playing'),
      draft: getComputedStyle(document.querySelector('.tone')).opacity === '1',
      speed: getComputedStyle(document.querySelector('.speed__text')).whiteSpace !== 'nowrap',
    }));
    check('reduced motion: KI demo shows the finished draft, 6 vs 1 shows full text', !kr.playing && kr.draft && kr.speed, JSON.stringify(kr));
    check('reduced motion: quote cards straight', (await page.$eval('.qcard--pink', (el) => getComputedStyle(el).transform)) === 'none');
    await page.close();
  }

  // No JS: final states, static lists.
  {
    const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.goto(base + '/', { waitUntil: 'load' });
    await page.waitForTimeout(1200);
    const r = await ribbonOffset(page);
    const s = await page.evaluate(() => ({
      copyHidden: getComputedStyle(document.querySelector('.marquee__list[aria-hidden="true"]')).display === 'none',
      wraps: getComputedStyle(document.querySelector('.marquee__list')).flexWrap === 'wrap',
      buttons: [...document.querySelectorAll('.loop-btn')].every((b) => getComputedStyle(b).display === 'none'),
      baBoth: [...document.querySelectorAll('.ba__side')].every((el) => getComputedStyle(el).clipPath === 'none' && el.getBoundingClientRect().height > 100),
      baNoRange: getComputedStyle(document.querySelector('.ba__control')).display === 'none',
      storyStacked: [...document.querySelectorAll('.story__panel')].every((p) => getComputedStyle(p).visibility === 'visible' && p.getBoundingClientRect().height > 50),
      toasts: document.querySelectorAll('.toast').length === 4,
      finderList: getComputedStyle(document.querySelector('.finder__static')).display !== 'none' && getComputedStyle(document.querySelector('.finder__app')).display === 'none',
      tones: [...document.querySelectorAll('.tone__panel')].filter((p) => getComputedStyle(p).visibility === 'visible').length === 3,
      marks: getComputedStyle(document.querySelector('.hl')).backgroundColor !== 'rgba(0, 0, 0, 0)',
    }));
    check('no JS: ribbon rests, tools wrap, no pause buttons, before/after side by side, story stacked, all tones and marks shown, finder as a list', r === 0 && Object.values(s).every(Boolean), JSON.stringify({ r, ...s }));
    await page.screenshot({ path: path.join(shots, 'nojs-390.png'), fullPage: true });
    await ctx.close();
  }
  return results;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = await startServer({ root: repoRoot });
  const browser = await chromium.launch();
  const results = await checkDemos(browser, server.url);
  await browser.close();
  await server.close();
  for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}${r.pass ? '' : `  -> ${r.details}`}`);
  process.exit(results.every((r) => r.pass) ? 0 : 1);
}
