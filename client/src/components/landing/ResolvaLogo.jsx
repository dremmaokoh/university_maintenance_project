export default function ResolvaLogo({ compact = false }) {
  return (
    <div className={`resolva-logo${compact ? ' resolva-logo-compact' : ''}`}>
      <span className="resolva-logo-mark" aria-hidden="true">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="8" fill="var(--color-primary)" />
          <path
            d="M9 22V10h3.2l4.1 7.2V10H19v12h-3.1l-4.2-7.4V22H9zm10.5 0V10h3v12h-3z"
            fill="#fff"
          />
        </svg>
      </span>
      <span className="resolva-logo-text">Resolva</span>
    </div>
  );
}
