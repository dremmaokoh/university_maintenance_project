import FieldLabel from '../FieldLabel.jsx';

export default function AuthTextField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  error,
  icon,
  autoComplete,
  name,
  required = true,
  inputMode
}) {
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="login-field">
      <FieldLabel className="login-field__label" htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      <div className="login-field__control">
        {icon}
        <input
          id={id}
          name={name}
          className={`login-field__input${error ? ' login-field__input--invalid' : ''}`}
          type={type}
          value={value}
          onChange={onChange}
          required={required}
          autoComplete={autoComplete}
          inputMode={inputMode}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
        />
      </div>
      {error && (
        <p className="login-field__error" id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
