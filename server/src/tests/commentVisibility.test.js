const test = require('node:test');
const assert = require('node:assert/strict');
const { isVisibleToRequester, filterCommentsForUser } = require('../utils/commentVisibility');
const { ROLES } = require('../constants');

test('staff comment with @student is visible to requester', () => {
  assert.equal(isVisibleToRequester('Please check @student', ROLES.OFFICER), true);
  assert.equal(isVisibleToRequester('Internal note', ROLES.ADMIN), false);
});

test('student comments are filtered for requester', () => {
  const comments = [
    {
      id: '1',
      body: 'Hi',
      visibleToRequester: false,
      author: { id: 'stu1', fullName: 'Stu', role: ROLES.STUDENT }
    },
    {
      id: '2',
      body: '@student update',
      visibleToRequester: true,
      author: { id: 'off1', fullName: 'Off', role: ROLES.OFFICER }
    },
    {
      id: '3',
      body: 'staff only',
      visibleToRequester: false,
      author: { id: 'adm1', fullName: 'Adm', role: ROLES.ADMIN }
    }
  ];

  const student = { id: 'stu1', role: ROLES.STUDENT };
  const visible = filterCommentsForUser(comments, student, 'stu1');
  assert.equal(visible.length, 2);
  assert.equal(visible.some((c) => c.id === '3'), false);
});
