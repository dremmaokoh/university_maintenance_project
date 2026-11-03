const { before, after, test } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { startTestApp, stopTestApp, getApp } = require('./helpers/testApp');

before(async () => {
  await startTestApp();
}, { timeout: 120000 });

after(async () => {
  await stopTestApp();
});

test('GET /api/health returns success from the real app', async () => {
  const response = await request(getApp()).get('/api/health');
  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.message, 'API is running.');
  assert.ok(response.body.database);
});
