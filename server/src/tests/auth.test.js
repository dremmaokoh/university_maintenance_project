const { before, after, beforeEach, describe, test } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const {
  TEST_PASSWORD,
  startTestApp,
  stopTestApp,
  clearDatabase,
  createOrganisationFixture,
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

describe('authentication', () => {
  test('creates an organisation admin and returns a token', async () => {
    const response = await request(getApp()).post('/api/auth/setup-admin').send({
      organisationName: 'Riverside Campus',
      fullName: 'Ada Admin',
      email: 'admin@campus.edu',
      password: TEST_PASSWORD
    });

    assert.equal(response.status, 201);
    assert.equal(response.body.success, true);
    assert.equal(response.body.data.user.role, 'admin');
    assert.ok(response.body.data.token);
    assert.ok(response.body.data.user.organisation.slug);
  });

  test('rejects invalid login credentials', async () => {
    await createOrganisationFixture();

    const unknown = await request(getApp()).post('/api/auth/login').send({
      email: 'nobody@test.edu',
      password: TEST_PASSWORD
    });
    assert.equal(unknown.status, 401);

    const badPassword = await request(getApp()).post('/api/auth/login').send({
      email: 'admin@test.edu',
      password: 'wrong-password'
    });
    assert.equal(badPassword.status, 401);
    assert.match(badPassword.body.message, /password/i);
  });

  test('logs in with valid credentials', async () => {
    await createOrganisationFixture();
    const response = await request(getApp()).post('/api/auth/login').send({
      email: 'admin@test.edu',
      password: TEST_PASSWORD
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.data.user.email, 'admin@test.edu');
    assert.ok(response.body.data.token);
  });

  test('registers a student on the organisation link', async () => {
    const fixture = await createOrganisationFixture();
    const response = await request(getApp()).post('/api/auth/register').send({
      orgSlug: fixture.slug,
      fullName: 'Riley Requester',
      email: 'riley@test.edu',
      password: TEST_PASSWORD,
      memberType: 'staff'
    });

    assert.equal(response.status, 201);
    assert.equal(response.body.data.user.role, 'student');
    assert.equal(response.body.data.user.memberType, 'staff');
  });

  test('rejects short passwords on register', async () => {
    const fixture = await createOrganisationFixture();
    const response = await request(getApp()).post('/api/auth/register').send({
      orgSlug: fixture.slug,
      fullName: 'Short Pass',
      email: 'short@test.edu',
      password: '123',
      memberType: 'student'
    });

    assert.equal(response.status, 400);
    assert.equal(response.body.success, false);
  });

  test('rejects duplicate student email in the same organisation', async () => {
    const fixture = await createOrganisationFixture();
    const response = await request(getApp()).post('/api/auth/register').send({
      orgSlug: fixture.slug,
      fullName: 'Sam Clone',
      email: 'student@test.edu',
      password: TEST_PASSWORD,
      memberType: 'student'
    });

    assert.equal(response.status, 409);
  });
});
