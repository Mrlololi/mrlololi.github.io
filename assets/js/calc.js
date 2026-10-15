// KI-Rechner maths. Pure functions: used by the page and by the build (static result).
const WEEKS_PER_MONTH = 4.33;
const DRAFT_SAVES = 0.7; // a reviewed draft saves 70 % of the time per standard reply

export function calcSavings({ emailsPerWeek, minutesPerReply, sharePercent, hourlyRate }) {
  const hoursPerMonth = emailsPerWeek * WEEKS_PER_MONTH * (sharePercent / 100) * (minutesPerReply / 60);
  const savedHours = hoursPerMonth * DRAFT_SAVES;
  return { hoursPerMonth, savedHours, savedEur: savedHours * hourlyRate };
}

export function formatResult({ hoursPerMonth, savedHours, savedEur }, locale) {
  const hours = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  const euros = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  return {
    h: hours.format(Math.round(hoursPerMonth * 10) / 10),
    savedH: hours.format(Math.round(savedHours * 10) / 10),
    savedEur: euros.format(Math.round(savedEur)),
  };
}

// Reads a field value without trusting it: empty or junk -> 0, comma decimals allowed, clamped.
export function toNumber(raw, { min, max }) {
  const n = Number(String(raw).trim().replace(',', '.'));
  if (!Number.isFinite(n)) return 0;
  return Math.min(max, Math.max(min, n));
}
