// Stage 3 guard: «If it looks like a button, it works. If it does not work, it does not look like a button.»
// Fails when a non-control has cursor:pointer, a :hover transform/shadow or a button look; when a visible
// real button does nothing on click; when an in-page link points nowhere; when aria-hidden content
// contains something that looks like a button.  Usage: node src/qa/clickable.mjs
import { pathToFileURL } from 'node:url';
import { chromium, repoRoot } from './browsers.mjs';
import { startServer } from './serve.mjs';

const REAL = 'a[href], button, input, label, summary, select, textarea, [role="tab"]';

// Runs inside the page: everything that pretends to be a control without being one.
const AUDIT = (REAL) => {
  const visible = (el) => {
    if (el.closest('[hidden], [inert]')) return false;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0;
  };
  const isReal = (el) => el.matches(REAL) || Boolean(el.closest(REAL));
  const whitelisted = (el) => el.matches('.label') || Boolean(el.closest('.marquee__list'));
  const name = (el) => `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.classList.length ? '.' + [...el.classList].join('.') : ''}`;
  const looksLikeButton = (el) => {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const rad = cs.borderTopLeftRadius;
    const radius = rad.includes('%') ? 9999 : parseFloat(rad) || 0;
    const border = parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== 'none';
    const fill = cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent';
    const bold = Number(cs.fontWeight) >= 600;
    return (radius >= 999 || (radius >= 16 && (border || fill))) && bold && r.width < 400 && r.height < 72;
  };
  const problems = [];
  for (const el of document.querySelectorAll('body *')) {
    if (!visible(el) || whitelisted(el)) continue;
    if (el.closest('svg') && el.tagName.toLowerCase() !== 'svg') continue;
    const real = isReal(el);
    const hiddenTree = Boolean(el.closest('[aria-hidden="true"]'));
    if (!real && getComputedStyle(el).cursor === 'pointer') problems.push(`pointer on a non-control: ${name(el)}`);
    if (looksLikeButton(el) && (!real || hiddenTree)) problems.push(`${hiddenTree ? 'button look inside aria-hidden' : 'button look on a non-control'}: ${name(el)}`);
  }
  // :hover rules that move or shadow something: only real controls (or a card covered by its link).
  for (const sheet of document.styleSheets) {
    const walk = (rules) => {
      for (const rule of rules) {
        if (rule.cssRules && !rule.selectorText) { walk(rule.cssRules); continue; }
        if (!rule.selectorText || !rule.selectorText.includes(':hover')) continue;
        if (!rule.style.transform && !rule.style.boxShadow) continue;
        for (const part of rule.selectorText.split(',')) {
          if (!part.includes(':hover')) continue;
          const base = part.replace(/:hover/g, '').trim();
          let els = [];
          try { els = [...document.querySelectorAll(base)]; } catch { continue; }
          for (const el of els) {
            const target = el;
            const owner = target.matches(REAL) || target.querySelector('a.item__cta');
            if (!owner && visible(target)) problems.push(`hover effect on a non-control: ${name(target)} (${part.trim()})`);
          }
        }
      }
    };
    try { walk(sheet.cssRules); } catch { /* cross-origin sheets: none on this site */ }
  }
  // In-page links must land somewhere.
  for (const a of document.querySelectorAll('a[href^="#"]')) {
    const id = decodeURIComponent(a.getAttribute('href').slice(1));
    if (id && !document.getElementById(id)) problems.push(`link to a missing target: ${a.getAttribute('href')}`);
  }
  return [...new Set(problems)];
};

// Runs inside the page: click every visible button once and watch for any effect.
const CLICK_ALL = async () => {
  const visible = (el) => !el.closest('[hidden], [inert]') && el.getBoundingClientRect().width > 0 && getComputedStyle(el).visibility !== 'hidden';
  const dead = [];
  const buttons = [...document.querySelectorAll('button')].filter(visible);
  for (const b of buttons) {
    if (!visible(b)) continue; // an earlier click may have hidden it
    let changed = false;
    const mo = new MutationObserver(() => { changed = true; });
    mo.observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true });
    const before = { focus: document.activeElement, x: scrollX, y: scrollY };
    b.click();
    await new Promise((r) => setTimeout(r, 120));
    mo.disconnect();
    if (!changed && document.activeElement === before.focus && scrollX === before.x && scrollY === before.y) {
      dead.push((b.className || b.id || b.textContent.trim()).toString().slice(0, 60));
    }
  }
  return { count: buttons.length, dead };
};

export async function checkClickable(browser, base) {
  const results = [];
  const check = (name, pass, details = '') => results.push({ name, pass: Boolean(pass), details });
  for (const path of ['/', '/en/']) {
    for (const width of [360, 1280]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.goto(base + path, { waitUntil: 'load' });
      await page.waitForTimeout(1800); // main.js has wired every control
      const problems = await page.evaluate(AUDIT, REAL);
      check(`clickable ${path} @${width}: only real controls look or behave like controls`, problems.length === 0, problems.join('\n'));
      const { count, dead } = await page.evaluate(CLICK_ALL);
      check(`clickable ${path} @${width}: all ${count} visible buttons do something`, dead.length === 0, dead.join(', '));
      await page.close();
    }
  }
  return results;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = await startServer({ root: repoRoot });
  const browser = await chromium.launch();
  const results = await checkClickable(browser, server.url);
  await browser.close();
  await server.close();
  for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}${r.pass ? '' : `\n${r.details}`}`);
  process.exit(results.every((r) => r.pass) ? 0 : 1);
}
