import { useState } from 'react';
import FieldLabel from '../FieldLabel.jsx';
import { LockIcon, PasswordVisibilityIcon } from './AuthIcons.jsx';

export default function AuthPasswordField({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  autoComplete = 'current-password',
  required = true,
  minLength
}) {
  const resolvedMinLength = minLength === undefined ? 8 : minLength;
  const [showPassword, setShowPassword] = useState(false);
  const errorId = error ? `${id}-error` : undefined;
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <div className="login-field">
      <FieldLabel className="login-field__label" htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      <div className="login-field__control">
        <LockIcon />
        <input
          id={id}
          className={`login-field__input login-field__input--password${error ? ' login-field__input--invalid' : ''}`}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          required={required}
          minLength={resolvedMinLength > 0 ? resolvedMinLength : undefined}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={[errorId, hintId].filter(Boolean).join(' ') || undefined}
        />
        <button
          type="button"
          className="login-field__toggle"
          onClick={() => setShowPassword((v) => !v)}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          aria-pressed={showPassword}
        >
          <PasswordVisibilityIcon passwordVisible={showPassword} />
        </button>
      </div>
      {hint && !error && (
        <p className="login-field__hint" id={hintId}>
          {hint}
        </p>
      )}
      {error && (
        <p className="login-field__error" id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
