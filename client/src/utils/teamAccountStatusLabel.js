export function teamAccountStatusLabel(member) {
  if (!member?.isActive) {
    return 'Inactive';
  }
  if (member.accountStatus === 'pending') {
    return 'Pending invite';
  }
  return 'Active';
}
