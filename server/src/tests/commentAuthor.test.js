const test = require('node:test');
const assert = require('node:assert/strict');
const { buildAuthorSnapshot, presentCommentAuthor } = require('../utils/commentAuthor');
const { ROLES } = require('../constants');

test('requester comments store staff or student member type', () => {
  assert.deepEqual(
    buildAuthorSnapshot({
      fullName: 'Tolu Okoh',
      role: ROLES.STUDENT,
      memberType: 'staff'
    }),
    { fullName: 'Tolu Okoh', role: ROLES.STUDENT, memberType: 'staff' }
  );
  assert.equal(
    buildAuthorSnapshot({ fullName: 'Sam Student', role: ROLES.STUDENT, memberType: 'student' })
      .memberType,
    'student'
  );
});

test('officer and admin snapshots keep their role and omit member type', () => {
  assert.deepEqual(
    buildAuthorSnapshot({
      fullName: 'Olivia Officer',
      role: ROLES.OFFICER,
      memberType: 'student'
    }),
    { fullName: 'Olivia Officer', role: ROLES.OFFICER }
  );
  assert.equal(
    buildAuthorSnapshot({ fullName: 'Ada Admin', role: ROLES.ADMIN, memberType: 'staff' }).memberType,
    undefined
  );
});

test('comments saved without member type use the resolved user record', () => {
  const author = presentCommentAuthor({
    author: { id: 'user-1', fullName: 'Tolu Okoh', role: ROLES.STUDENT, memberType: 'staff' }
  });
  assert.equal(author.role, ROLES.STUDENT);
  assert.equal(author.memberType, 'staff');
});

test('stored member type is preferred over a later user record', () => {
  const author = presentCommentAuthor({
    authorSnapshot: { fullName: 'Tolu Okoh', role: ROLES.STUDENT, memberType: 'staff' },
    author: { id: 'user-1', fullName: 'Tolu Okoh', role: ROLES.STUDENT, memberType: 'student' }
  });
  assert.equal(author.memberType, 'staff');
});

test('unresolved comments are not labelled as student', () => {
  assert.equal(presentCommentAuthor({ author: null }), null);
  const author = presentCommentAuthor({
    author: null,
    authorSnapshot: { fullName: 'Former User', role: ROLES.STUDENT }
  });
  assert.equal(author.memberType, undefined);
  assert.equal(author.role, ROLES.STUDENT);
});

test('officer comments keep the officer role label', () => {
  const author = presentCommentAuthor({
    authorSnapshot: { fullName: 'Olivia Officer', role: ROLES.OFFICER },
    author: {
      id: 'off-1',
      fullName: 'Olivia Officer',
      role: ROLES.OFFICER,
      memberType: 'student'
    }
  });
  assert.equal(author.role, ROLES.OFFICER);
  assert.equal(author.memberType, undefined);
});
