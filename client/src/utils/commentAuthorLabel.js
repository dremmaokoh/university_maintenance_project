import { memberTypeLabel } from './memberTypeLabel.js';

function normalized(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export function commentAuthorRoleLabel(author) {
  if (!author) {
    return '';
  }

  const role = normalized(author.role);
  const memberType = normalized(author.memberType);

  if (role && role !== 'student' && role !== 'staff') {
    return author.role;
  }

  if (role === 'staff' || memberType === 'staff') {
    return memberTypeLabel('staff');
  }

  if (memberType === 'student') {
    return memberTypeLabel('student');
  }

  return '';
}
