export default function TeamAccessStatsGrid({ items }) {
  return (
    <div className="admin-kpi-grid admin-kpi-grid--five team-access-kpi" aria-label="Summary">
      {items.map((item) => (
        <div key={item.label} className="kpi-card kpi-card--static">
          <p className="kpi-card__label">{item.label}</p>
          <p className="kpi-card__value">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
