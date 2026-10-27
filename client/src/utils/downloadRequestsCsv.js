import { memberTypeLabel } from './memberTypeLabel.js';

function csvCell(value) {
  let text = String(value ?? '');
  if (/^[=+\-@]/.test(text)) {
    text = `'${text}`;
  }
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function formatCsvDate(iso) {
  if (!iso) {
    return '';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toISOString().slice(0, 10);
}

export function downloadRequestsCsv(items, { role, organisationName = 'organisation' } = {}) {
  const includeRequester = role === 'admin' || role === 'officer';
  const isOfficer = role === 'officer';

  const headers = isOfficer
    ? [
        'Title',
        'Location',
        'Category',
        'Requester',
        'Requester type',
        'Status',
        'Date assigned',
        'Date completed',
        'Time to fix',
        'Rating'
      ]
    : [
        'Title',
        'Location',
        'Category',
        ...(includeRequester ? ['Requester', 'Requester type'] : []),
        'Status',
        'Officer',
        'Time to resolve',
        'Rating',
        'Created'
      ];

  const lines = [headers.map(csvCell).join(',')];

  items.forEach((item) => {
    const completedAt =
      item.completedAt ||
      (item.status === 'completed' ? item.updatedAt : null);

    const row = isOfficer
      ? [
          item.title,
          item.location,
          item.category?.name || '',
          item.requester?.fullName || '',
          item.requester?.memberType ? memberTypeLabel(item.requester.memberType) : '',
          item.status,
          formatCsvDate(item.assignedAt),
          formatCsvDate(completedAt),
          item.resolutionDuration || '',
          item.officerRating != null ? item.officerRating : ''
        ]
      : [
          item.title,
          item.location,
          item.category?.name || '',
          ...(includeRequester
            ? [
                item.requester?.fullName || '',
                item.requester?.memberType ? memberTypeLabel(item.requester.memberType) : ''
              ]
            : []),
          item.status,
          item.assignedOfficer?.fullName || '',
          item.resolutionDuration || '',
          item.officerRating != null ? item.officerRating : '',
          item.createdAt ? new Date(item.createdAt).toISOString() : ''
        ];
    lines.push(row.map(csvCell).join(','));
  });

  const blob = new Blob([`${lines.join('\n')}\n`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const safeOrg = organisationName.replace(/[^\w-]+/g, '_').slice(0, 30);
  const scope = role === 'officer' ? 'my-work' : role === 'admin' ? 'all-requests' : 'assigned-requests';
  anchor.href = url;
  anchor.download = `resolva-${scope}-${safeOrg || 'export'}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}
