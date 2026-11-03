import { describe, it, expect } from 'vitest';
import { commentAuthorRoleLabel } from './commentAuthorLabel.js';

describe('commentAuthorRoleLabel', () => {
  it('labels a staff requester as Staff', () => {
    expect(
      commentAuthorRoleLabel({ fullName: 'Tolu Okoh', role: 'student', memberType: 'staff' })
    ).toBe('Staff');
    expect(commentAuthorRoleLabel({ role: 'staff' })).toBe('Staff');
    expect(commentAuthorRoleLabel({ role: 'staff', memberType: 'Staff' })).toBe('Staff');
  });

  it('labels a student requester as Student', () => {
    expect(commentAuthorRoleLabel({ role: 'student', memberType: 'student' })).toBe('Student');
    expect(commentAuthorRoleLabel({ role: 'student', memberType: 'Student' })).toBe('Student');
  });

  it('keeps officer and administrator role text', () => {
    expect(commentAuthorRoleLabel({ role: 'officer', memberType: 'student' })).toBe('officer');
    expect(commentAuthorRoleLabel({ role: 'admin' })).toBe('admin');
  });

  it('does not invent Student when member type is missing', () => {
    expect(commentAuthorRoleLabel({ role: 'student' })).toBe('');
    expect(commentAuthorRoleLabel(null)).toBe('');
  });
});
