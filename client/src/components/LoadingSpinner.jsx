/**
 * Brand loading indicator — purple cyclic spinner.
 * @param {'page' | 'section' | 'inline'} layout — page: full viewport; section: block in content; inline: row with optional label
 * @param {string} [label] — optional text under/beside spinner (omit for spinner-only)
 * @param {'md' | 'sm'} [size]
 */
export default function LoadingSpinner({
  layout = 'section',
  label,
  size = 'md'
}) {
  const rootClass = [
    'loading-state',
    layout === 'page' ? 'loading-state--page' : '',
    layout === 'inline' ? 'loading-state--inline' : ''
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClass} role="status" aria-live="polite" aria-busy="true">
      <span
        className={`brand-spinner brand-spinner--${size}`}
        aria-hidden="true"
      />
      {label ? <span className="loading-state__label">{label}</span> : null}
      {!label ? <span className="visually-hidden">Loading</span> : null}
    </div>
  );
}
