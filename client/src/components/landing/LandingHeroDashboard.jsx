const STATS = [
  { label: 'Total', value: '128' },
  { label: 'Pending', value: '24', tone: 'pending' },
  { label: 'In progress', value: '18', tone: 'progress' },
  { label: 'Completed', value: '86', tone: 'done' }
];

const ROWS = [
  { title: 'Lecture hall projector', location: 'Hall A', status: 'in progress' },
  { title: 'Hostel leak, Block B', location: 'Block B', status: 'assigned' },
  { title: 'Library chair repair', location: 'Main library', status: 'completed' }
];

const ACTIVITY = [
  {
    label: 'Request assigned',
    title: 'Electrical fault · Science Block',
    meta: 'Assigned to Facilities Team'
  },
  {
    label: 'Request resolved',
    title: 'Library lighting',
    meta: 'Completed today'
  }
];

function StatusPill({ status }) {
  const slug = status.replace(/\s+/g, '-');
  return <span className={`lp-preview-badge lp-preview-badge-${slug}`}>{status}</span>;
}

export default function LandingHeroDashboard() {
  return (
    <div className="lp-hero-visual" aria-hidden="true">
      <div className="lp-hero-blob" />
      <div className="lp-preview lp-preview-hero">
        <div className="lp-preview-top">
          <p className="lp-preview-title">Dashboard</p>
          <span className="lp-preview-pill">Preview</span>
        </div>
        <div className="lp-preview-stats">
          {STATS.map((stat) => (
            <div key={stat.label} className={`lp-preview-stat${stat.tone ? ` lp-preview-stat-${stat.tone}` : ''}`}>
              <span className="lp-preview-stat-label">{stat.label}</span>
              <strong>{stat.value}</strong>
            </div>
          ))}
        </div>
        <div className="lp-preview-table-wrap">
          <table className="lp-preview-table">
            <thead>
              <tr>
                <th>Request</th>
                <th>Location</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.title}>
                  <td>{row.title}</td>
                  <td>{row.location}</td>
                  <td><StatusPill status={row.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="lp-preview-activity">
          {ACTIVITY.map((item) => (
            <div key={item.label} className="lp-activity-item">
              <p className="lp-activity-label">{item.label}</p>
              <p className="lp-activity-title">{item.title}</p>
              <p className="lp-activity-meta">{item.meta}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
