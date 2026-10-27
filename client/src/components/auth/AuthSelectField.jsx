import FieldLabel from '../FieldLabel.jsx';

export default function AuthSelectField({
  id,
  label,
  value,
  onChange,
  error,
  children,
  required = true
}) {
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="login-field">
      <FieldLabel className="login-field__label" htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      <div className="login-field__control login-field__control--select">
        <select
          id={id}
          className={`login-field__select${error ? ' login-field__input--invalid' : ''}`}
          value={value}
          onChange={onChange}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
        >
          {children}
        </select>
      </div>
      {error && (
        <p className="login-field__error" id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
