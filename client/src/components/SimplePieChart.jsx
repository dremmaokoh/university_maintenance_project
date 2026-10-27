/** Common dashboard palette: blue, green, orange, amber, then extras for more slices */
const CHART_PALETTE = [
  '#2563eb',
  '#16a34a',
  '#f97316',
  '#eab308',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
  '#64748b'
];

const STATUS_COLORS = {
  pending: '#eab308',
  assigned: '#2563eb',
  in_progress: '#f97316',
  completed: '#16a34a'
};

function sliceColor(label, index, labelKey) {
  const key = String(label || '').toLowerCase();
  if (labelKey === 'status' && STATUS_COLORS[key]) {
    return STATUS_COLORS[key];
  }
  return CHART_PALETTE[index % CHART_PALETTE.length];
}

function formatLabel(label) {
  return String(label || 'Unknown').replace(/_/g, ' ');
}

export default function SimplePieChart({ title, rows, valueKey = 'count', labelKey = 'label' }) {
  const slices = (rows || [])
    .map((row, index) => ({
      label: row[labelKey] ?? row.status ?? row.category,
      value: Number(row[valueKey]) || 0,
      color: sliceColor(row[labelKey] ?? row.status ?? row.category, index, labelKey)
    }))
    .filter((slice) => slice.value > 0);

  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const size = 160;
  const radius = size / 2;
  const center = radius;

  let cumulative = 0;
  const paths = slices.map((slice) => {
    const startAngle = (cumulative / total) * Math.PI * 2 - Math.PI / 2;
    cumulative += slice.value;
    const endAngle = (cumulative / total) * Math.PI * 2 - Math.PI / 2;
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    const x1 = center + radius * Math.cos(startAngle);
    const y1 = center + radius * Math.sin(startAngle);
    const x2 = center + radius * Math.cos(endAngle);
    const y2 = center + radius * Math.sin(endAngle);
    const d = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    return { ...slice, d };
  });

  return (
    <section className="pie-chart-card">
      <h3>{title}</h3>
      {total === 0 && <p className="muted">No data yet.</p>}
      {total > 0 && (
        <div className="pie-chart-layout">
          <svg
            className="pie-chart-svg"
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            role="img"
            aria-label={title}
          >
            {paths.map((slice) => (
              <path key={slice.label} d={slice.d} fill={slice.color} />
            ))}
          </svg>
          <ul className="pie-chart-legend">
            {slices.map((slice) => (
              <li key={slice.label}>
                <span className="pie-swatch" style={{ backgroundColor: slice.color }} />
                <span>{formatLabel(slice.label)}</span>
                <strong>{slice.value}</strong>
                <span className="muted">
                  ({Math.round((slice.value / total) * 100)}%)
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
