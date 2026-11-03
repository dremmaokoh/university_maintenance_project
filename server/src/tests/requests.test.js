const { before, after, beforeEach, describe, test } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const request = require('supertest');
const {
  authHeader,
  startTestApp,
  stopTestApp,
  clearDatabase,
  createOrganisationFixture,
  createRequestAsStudent,
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

async function submitSampleRequest(fixture, title = 'Broken projector') {
  const response = await createRequestAsStudent(fixture.student.token, {
    title,
    description: 'The projector in the lecture hall will not turn on.',
    location: 'Block B, Room 204',
    categoryId: fixture.categoryId
  });
  assert.equal(response.status, 201, JSON.stringify(response.body));
  return response.body.data;
}

describe('service requests', () => {
  test('requires a token to list requests', async () => {
    const response = await request(getApp()).get('/api/requests');
    assert.equal(response.status, 401);
  });

  test('rejects invalid request payloads', async () => {
    const fixture = await createOrganisationFixture();
    const response = await createRequestAsStudent(fixture.student.token, {
      title: '',
      description: '',
      location: '',
      categoryId: 'not-an-id'
    });
    assert.equal(response.status, 400);
  });

  test('students create and list only their own requests', async () => {
    const fixture = await createOrganisationFixture();
    const created = await submitSampleRequest(fixture);
    assert.equal(created.status, 'pending');
    assert.equal(created.title, 'Broken projector');

    const list = await request(getApp())
      .get('/api/requests')
      .set(authHeader(fixture.student.token));
    assert.equal(list.status, 200);
    assert.equal(list.body.data.total, 1);
    assert.equal(list.body.data.items[0].id, created.id);
  });

  test('students cannot view another student request', async () => {
    const fixture = await createOrganisationFixture();
    const created = await submitSampleRequest(fixture);

    const other = await request(getApp()).post('/api/auth/register').send({
      orgSlug: fixture.slug,
      fullName: 'Other Student',
      email: 'other@test.edu',
      password: 'password123',
      memberType: 'student'
    });
    assert.equal(other.status, 201);

    const response = await request(getApp())
      .get(`/api/requests/${created.id}`)
      .set(authHeader(other.body.data.token));
    assert.equal(response.status, 403);
  });

  test('admins can assign requests and officers can update status', async () => {
    const fixture = await createOrganisationFixture();
    const created = await submitSampleRequest(fixture);

    const officerList = await request(getApp())
      .get('/api/requests')
      .set(authHeader(fixture.officer.token));
    assert.equal(officerList.body.data.total, 0);

    const assigned = await request(getApp())
      .post(`/api/requests/${created.id}/assign`)
      .set(authHeader(fixture.admin.token))
      .send({ officerId: fixture.officer.user.id });
    assert.equal(assigned.status, 200);
    assert.equal(assigned.body.data.status, 'assigned');
    assert.equal(assigned.body.data.assignedOfficer.id, fixture.officer.user.id);

    const officerNow = await request(getApp())
      .get('/api/requests')
      .set(authHeader(fixture.officer.token));
    assert.equal(officerNow.body.data.total, 1);

    const inProgress = await request(getApp())
      .patch(`/api/requests/${created.id}/status`)
      .set(authHeader(fixture.officer.token))
      .send({ status: 'in_progress', note: 'On site' });
    assert.equal(inProgress.status, 200);
    assert.equal(inProgress.body.data.status, 'in_progress');

    const completed = await request(getApp())
      .patch(`/api/requests/${created.id}/status`)
      .set(authHeader(fixture.officer.token))
      .send({ status: 'completed' });
    assert.equal(completed.status, 200);
    assert.equal(completed.body.data.status, 'completed');
  });

  test('rejects illegal status transitions', async () => {
    const fixture = await createOrganisationFixture();
    const created = await submitSampleRequest(fixture);

    const skip = await request(getApp())
      .patch(`/api/requests/${created.id}/status`)
      .set(authHeader(fixture.admin.token))
      .send({ status: 'completed' });
    assert.equal(skip.status, 400);
  });

  test('officers cannot assign requests', async () => {
    const fixture = await createOrganisationFixture();
    const created = await submitSampleRequest(fixture);

    const response = await request(getApp())
      .post(`/api/requests/${created.id}/assign`)
      .set(authHeader(fixture.officer.token))
      .send({ officerId: fixture.officer.user.id });
    assert.equal(response.status, 403);
  });

  test('officers cannot view unassigned requests', async () => {
    const fixture = await createOrganisationFixture();
    const created = await submitSampleRequest(fixture);

    const response = await request(getApp())
      .get(`/api/requests/${created.id}`)
      .set(authHeader(fixture.officer.token));
    assert.equal(response.status, 403);
  });

  test('admins cannot submit student requests', async () => {
    const fixture = await createOrganisationFixture();
    const response = await request(getApp())
      .post('/api/requests')
      .set(authHeader(fixture.admin.token))
      .send({
        title: 'Admin should not create this',
        description: 'Role check',
        location: 'Office',
        categoryId: fixture.categoryId
      });
    assert.equal(response.status, 403);
  });

  test('returns 404 for a missing request', async () => {
    const fixture = await createOrganisationFixture();
    const missingId = new mongoose.Types.ObjectId();
    const response = await request(getApp())
      .get(`/api/requests/${missingId}`)
      .set(authHeader(fixture.admin.token));
    assert.equal(response.status, 404);
  });
});
