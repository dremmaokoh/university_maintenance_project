import { memberTypeLabel } from './memberTypeLabel.js';

function csvCell(value) {
  const text = String(value ?? '');
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function formatJoinedDate(iso) {
  if (!iso) {
    return '';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toISOString().slice(0, 10);
}

function downloadCsv(lines, filename) {
  const blob = new Blob([`${lines.join('\n')}\n`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function todayFilenameStem() {
  return new Date().toISOString().slice(0, 10);
}

export function downloadOrgMembersCsv(items) {
  const headers = ['Full name', 'Email address', 'User type', 'Account status', 'Date joined'];
  const lines = [headers.map(csvCell).join(',')];

  items.forEach((item) => {
    const row = [
      item.fullName,
      item.email,
      memberTypeLabel(item.memberType),
      item.accountStatusLabel || (item.isActive ? 'Active' : 'Inactive'),
      formatJoinedDate(item.createdAt)
    ];
    lines.push(row.map(csvCell).join(','));
  });

  downloadCsv(lines, `resolva-people-${todayFilenameStem()}.csv`);
}

export function downloadTeamMembersCsv(items) {
  const headers = ['Full name', 'Email address', 'Role', 'Job title', 'Account status', 'Date joined'];
  const lines = [headers.map(csvCell).join(',')];

  items.forEach((item) => {
    const role =
      item.roleLabel ||
      (item.role === 'admin'
        ? 'Administrator'
        : item.role === 'officer'
          ? 'Maintenance officer'
          : item.role);
    const status =
      item.accountStatusLabel ||
      (item.isActive && item.accountStatus === 'active' ? 'Active' : 'Inactive');
    const row = [
      item.fullName,
      item.email,
      role,
      item.jobTitle || '',
      status,
      formatJoinedDate(item.createdAt)
    ];
    lines.push(row.map(csvCell).join(','));
  });

  downloadCsv(lines, `resolva-team-${todayFilenameStem()}.csv`);
}
