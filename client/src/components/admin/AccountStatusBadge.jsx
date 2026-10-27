const STATUS_CLASS = {
  Active: 'team-status team-status--active',
  Inactive: 'team-status team-status--disabled',
  'Pending invite': 'team-status team-status--pending'
};

export default function AccountStatusBadge({ label }) {
  const className = STATUS_CLASS[label] || 'team-status team-status--disabled';
  return <span className={className}>{label}</span>;
}
