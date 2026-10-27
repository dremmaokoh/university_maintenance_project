import { useState } from 'react';
import { useToast } from '../../context/ToastContext.jsx';

export default function CopyLinkField({
  label,
  hint,
  value,
  copySuccessMessage = 'Link copied.',
  copyButtonLabel = 'Copy',
  compact = false,
  showInlineSuccess = false
}) {
  const { showSuccess, showError } = useToast();
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState('');

  if (!value) {
    return null;
  }

  async function copy() {
    setCopyError('');
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      showSuccess(copySuccessMessage);
    } catch {
      setCopyError('Could not copy to clipboard. Select the link and copy it manually.');
      showError('Could not copy to clipboard.');
    }
  }

  return (
    <div className={compact ? 'copy-link-field copy-link-field--compact' : 'copy-link-field'}>
      {label && <span className="copy-link-field__label">{label}</span>}
      {hint && <p className="copy-link-field__hint">{hint}</p>}
      <div className="copy-link-field__row">
        <input className="copy-link-field__input" readOnly value={value} aria-label={label || 'Shareable link'} />
        <button type="button" className="btn btn-secondary" onClick={copy}>
          {copied ? 'Copied' : copyButtonLabel}
        </button>
      </div>
      {showInlineSuccess && copied && (
        <p className="copy-link-field__success" role="status">{copySuccessMessage}</p>
      )}
      {copyError && (
        <p className="login-field__error" role="alert">{copyError}</p>
      )}
    </div>
  );
}
