const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const request = require('supertest');

test('health endpoint returns success', async () => {
  const app = express();
  app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'API is running.' });
  });

  const response = await request(app).get('/api/health');
  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
});
