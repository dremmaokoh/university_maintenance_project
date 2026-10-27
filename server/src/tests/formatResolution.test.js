const test = require('node:test');
const assert = require('node:assert/strict');
const { formatResolutionDuration } = require('../utils/formatResolution');

test('formatResolutionDuration returns minutes under one hour', () => {
  const created = new Date('2026-01-01T10:00:00Z');
  const completed = new Date('2026-01-01T10:18:00Z');
  assert.equal(formatResolutionDuration(created, completed), '18m');
});

test('formatResolutionDuration returns hours and minutes before one day', () => {
  const created = new Date('2026-01-01T10:00:00Z');
  const completed = new Date('2026-01-01T15:00:00Z');
  assert.equal(formatResolutionDuration(created, completed), '5h');

  const withMinutes = new Date('2026-01-01T11:23:00Z');
  assert.equal(formatResolutionDuration(created, withMinutes), '1h 23m');
});

test('formatResolutionDuration returns days at 24h and beyond', () => {
  const created = new Date('2026-01-01T10:00:00Z');
  const oneDay = new Date('2026-01-02T10:00:00Z');
  const twoDays = new Date('2026-01-03T10:00:00Z');
  assert.equal(formatResolutionDuration(created, oneDay), '1 day');
  assert.equal(formatResolutionDuration(created, twoDays), '2 days');
});

test('formatResolutionDuration returns null without completion', () => {
  assert.equal(formatResolutionDuration(new Date(), null), null);
});
