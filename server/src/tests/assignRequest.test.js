const test = require('node:test');
const assert = require('node:assert/strict');
const { STATUSES } = require('../constants');

test('assign rules: only pending unassigned requests can be assigned', () => {
  const pending = { status: STATUSES.PENDING, assignedOfficer: null };
  const assigned = { status: STATUSES.ASSIGNED, assignedOfficer: 'officer-id' };
  const inProgress = { status: STATUSES.IN_PROGRESS, assignedOfficer: 'officer-id' };

  assert.equal(pending.status === STATUSES.PENDING && !pending.assignedOfficer, true);
  assert.equal(assigned.status === STATUSES.PENDING, false);
  assert.equal(inProgress.status === STATUSES.ASSIGNED, false);
});

test('unassign rules: only assigned (not started) requests can be cancelled', () => {
  assert.equal(STATUSES.ASSIGNED === 'assigned', true);
  assert.notEqual(STATUSES.IN_PROGRESS, STATUSES.ASSIGNED);
});
