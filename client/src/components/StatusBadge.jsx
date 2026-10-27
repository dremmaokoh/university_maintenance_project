const LABELS = {
  pending: 'Pending',
  assigned: 'Assigned',
  in_progress: 'In progress',
  completed: 'Completed'
};

export default function StatusBadge({ status }) {
  return <span className={`status-badge status-${status}`}>{LABELS[status] || status}</span>;
}
