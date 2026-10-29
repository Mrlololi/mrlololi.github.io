// Stage 6, the calculator on /ki-antwortentwuerfe/: four inputs, two bars (by hand, with drafts,
// hours per month) that follow them with transform: scaleX over 250 ms (CSS), and the saving that
// counts up once per change. No ticker. One sentence for screen readers after typing stops.
import { calcSavings, formatResult, toNumber } from './calc.js';

export function init({ reduceMotion, locale }) {
  const form = document.getElementById('ki-rechner');
  if (!form) return;
  const fmtLocale = form.dataset.locale || locale;
  const out = (name) => form.querySelector(`[data-out="${name}"]`);
  const fills = [...form.querySelectorAll('.bar__fill')];
  const live = document.getElementById('calc-live');
  const field = (name) => form.elements[name];
  const read = () => {
    const v = (name) => toNumber(field(name).value, { min: Number(field(name).min), max: Number(field(name).max) });
    return calcSavings({ emailsPerWeek: v('emails'), minutesPerReply: v('minutes'), sharePercent: v('share'), hourlyRate: v('rate') });
  };
  const text = (r) => {
    const f = formatResult(r, fmtLocale);
    const draft = formatResult({ hoursPerMonth: r.hoursPerMonth - r.savedHours, savedHours: 0, savedEur: 0 }, fmtLocale).h;
    return { ...f, draftH: draft };
  };
  let shown = read();
  let raf = 0;
  let liveTimer = 0;
  // The bars: by hand is always the full bar (the scale is the larger of the two, so 0 stays 0).
  const bars = (r) => {
    const k = r.hoursPerMonth ? (r.hoursPerMonth - r.savedHours) / r.hoursPerMonth : 0;
    fills[0].style.transform = `scaleX(${r.hoursPerMonth ? 1 : 0})`;
    fills[1].style.transform = `scaleX(${k.toFixed(3)})`;
  };
  const write = (r) => {
    const f = text(r);
    out('h').textContent = f.h;
    out('draftH').textContent = f.draftH;
    out('savedH').textContent = f.savedH;
    out('savedEur').textContent = f.savedEur;
  };
  form.addEventListener('submit', (e) => e.preventDefault());
  form.addEventListener('input', () => {
    const target = read();
    bars(target);
    cancelAnimationFrame(raf);
    if (reduceMotion.matches) { shown = target; write(target); } else {
      // The saving counts up from where it stands (400 ms); the hours follow at once.
      const from = { ...shown };
      const t0 = performance.now();
      const step = (now) => {
        const k = Math.min(1, (now - t0) / 400);
        const e = 1 - (1 - k) ** 3;
        shown = { hoursPerMonth: target.hoursPerMonth, savedHours: from.savedHours + (target.savedHours - from.savedHours) * e, savedEur: from.savedEur + (target.savedEur - from.savedEur) * e };
        write(shown);
        if (k < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }
    clearTimeout(liveTimer);
    liveTimer = setTimeout(() => {
      const f = text(target);
      live.textContent = `${form.querySelector('.bar--hand .bar__label').textContent}: ${f.h} h. ${form.querySelector('.bar--draft .bar__label').textContent}: ${f.draftH} h. ${form.querySelector('.calc__saving').textContent.replace(/\s+/g, ' ').trim()}`;
    }, 500);
  });
}
