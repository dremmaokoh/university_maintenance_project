const { before, after, beforeEach, describe, test } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const User = require('../models/User');
const {
  startTestApp,
  stopTestApp,
  clearDatabase,
  createOrganisationFixture,
  authHeader,
  getApp
} = require('./helpers/testApp');

before(async () => {
  await startTestApp();
}, { timeout: 120000 });

after(async () => {
  await stopTestApp();
});

beforeEach(async () => {
  await clearDatabase();
});

describe('team invitations', () => {
  test('requires a job title when inviting a maintenance officer', async () => {
    const fixture = await createOrganisationFixture();
    const response = await request(getApp())
      .post('/api/invites')
      .set(authHeader(fixture.admin.token))
      .send({
        fullName: 'New Officer',
        email: 'new.officer@test.edu',
        role: 'officer'
      });

    assert.equal(response.status, 400);
    assert.equal(response.body.errors[0].message, 'Job title is required for maintenance officers.');
  });

  test('stores the job title when an officer invitation is created', async () => {
    const fixture = await createOrganisationFixture();
    const response = await request(getApp())
      .post('/api/invites')
      .set(authHeader(fixture.admin.token))
      .send({
        fullName: 'New Officer',
        email: 'new.officer@test.edu',
        role: 'officer',
        jobTitle: '  Plumber  '
      });

    assert.equal(response.status, 201);
    assert.equal(response.body.data.user.jobTitle, 'Plumber');
    assert.equal(response.body.data.user.role, 'officer');

    const stored = await User.findOne({ email: 'new.officer@test.edu' });
    assert.equal(stored.jobTitle, 'Plumber');
    assert.equal(stored.accountStatus, 'pending');
  });

  test('allows an administrator invitation without a job title', async () => {
    const fixture = await createOrganisationFixture();
    const response = await request(getApp())
      .post('/api/invites')
      .set(authHeader(fixture.admin.token))
      .send({
        fullName: 'Second Admin',
        email: 'second.admin@test.edu',
        role: 'admin'
      });

    assert.equal(response.status, 201);
    assert.equal(response.body.data.user.role, 'admin');
    assert.equal(response.body.data.user.jobTitle, null);
  });
});
