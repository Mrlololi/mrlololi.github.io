import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcSavings, formatResult, toNumber } from '../assets/js/calc.js';

const defaults = { emailsPerWeek: 120, minutesPerReply: 6, sharePercent: 60, hourlyRate: 25 };
const near = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;

test('defaults give 31.2 h/month, 21.8 h saved, about 546 €', () => {
  const r = calcSavings(defaults);
  assert.ok(near(r.hoursPerMonth, 120 * 4.33 * 0.6 * 6 / 60), `got ${r.hoursPerMonth}`);
  assert.ok(near(r.savedHours, r.hoursPerMonth * 0.7));
  assert.ok(near(r.savedEur, r.savedHours * 25));
});

test('German formatting: one decimal for hours, whole euros', () => {
  assert.deepEqual(formatResult(calcSavings(defaults), 'de-AT'), { h: '31,2', savedH: '21,8', savedEur: '546' });
});

test('English formatting', () => {
  assert.deepEqual(formatResult(calcSavings(defaults), 'en-GB'), { h: '31.2', savedH: '21.8', savedEur: '546' });
});

test('large values get thousands separators per locale', () => {
  const r = calcSavings({ emailsPerWeek: 5000, minutesPerReply: 60, sharePercent: 100, hourlyRate: 300 });
  assert.equal(formatResult(r, 'en-GB').savedEur, new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 }).format(Math.round(r.savedEur)));
  assert.ok(formatResult(r, 'en-GB').savedEur.includes(','));
});

test('zero input gives zeros, never NaN', () => {
  const r = calcSavings({ emailsPerWeek: 0, minutesPerReply: 6, sharePercent: 60, hourlyRate: 25 });
  assert.deepEqual(formatResult(r, 'de-AT'), { h: '0', savedH: '0', savedEur: '0' });
});

test('toNumber: empty and junk become 0', () => {
  assert.equal(toNumber('', { min: 0, max: 100 }), 0);
  assert.equal(toNumber('abc', { min: 0, max: 100 }), 0);
});

test('toNumber: clamps to min and max', () => {
  assert.equal(toNumber('-5', { min: 0, max: 100 }), 0);
  assert.equal(toNumber('99999', { min: 0, max: 5000 }), 5000);
});

test('toNumber: accepts a decimal comma', () => {
  assert.equal(toNumber('6,5', { min: 0, max: 120 }), 6.5);
  assert.equal(toNumber(' 7.5 ', { min: 0, max: 120 }), 7.5);
});
