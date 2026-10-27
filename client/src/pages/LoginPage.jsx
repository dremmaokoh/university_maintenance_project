import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import '../styles/login.css';

function EnvelopeIcon() {
  return (
    <svg className="login-field__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 6h16v12H4V6zm0 0 8 6 8-6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="login-field__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M8 11V8a4 4 0 1 1 8 0v3"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function EyeIcon({ hidden }) {
  if (hidden) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path
        d="M10.6 10.6A3 3 0 0 0 12 15a3 3 0 0 0 2.4-4.4M6.2 6.2C4.2 7.6 2.7 9.5 2 12c0 0 3.5 7 10 7 2.1 0 3.9-.6 5.4-1.5M17.8 17.8C19.8 16.4 21.3 14.5 22 12"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const { showError } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [accounts, setAccounts] = useState(null);

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  if (loading) {
    return <LoadingSpinner layout="page" />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setAccounts(null);
    setSubmitting(true);
    try {
      const result = await login({ email, password });
      if (result.requiresAccountChoice) {
        setAccounts(result.accounts);
        setSubmitting(false);
        return;
      }
      navigate('/dashboard');
    } catch (err) {
      showError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function chooseAccount(userId) {
    setSubmitting(true);
    try {
      await login({ email, password, userId });
      navigate('/dashboard');
    } catch (err) {
      showError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-page__backdrop" aria-hidden="true" />

      <div className="login-card page-enter">
        <p className="login-card__brand">Resolva</p>
        <h1 className="login-card__title">Log in</h1>
        <p className="login-card__subtitle">Welcome back! Sign in to your account.</p>

        <form onSubmit={handleSubmit}>
          <div className="login-field">
            <span className="login-field__label" id="login-email-label">Email</span>
            <div className="login-field__control">
              <EnvelopeIcon />
              <input
                id="login-email"
                className="login-field__input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                aria-labelledby="login-email-label"
              />
            </div>
          </div>

          <div className="login-field">
            <span className="login-field__label" id="login-password-label">Password</span>
            <div className="login-field__control">
              <LockIcon />
              <input
                id="login-password"
                className="login-field__input login-field__input--password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                aria-labelledby="login-password-label"
              />
              <button
                type="button"
                className="login-field__toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <EyeIcon hidden={!showPassword} />
              </button>
            </div>
          </div>

          <div className="login-forgot">
            <Link to="/login/forgot">Forgot password?</Link>
          </div>

          {!accounts && (
            <button type="submit" className="login-submit" disabled={submitting}>
              {submitting ? 'Logging in…' : 'Log in →'}
            </button>
          )}

          {accounts && (
            <div className="login-account-choices">
              <p className="muted">Choose your organisation:</p>
              {accounts.map((account) => (
                <button
                  key={account.userId}
                  type="button"
                  className="btn btn-secondary btn-block account-choice"
                  disabled={submitting}
                  onClick={() => chooseAccount(account.userId)}
                >
                  {account.organisationName} — {account.role}
                </button>
              ))}
            </div>
          )}
        </form>

        <div className="login-divider" aria-hidden="true">or</div>

        <p className="login-footer">
          <Link to="/">Home</Link>
          {' · '}
          Students use your institution&apos;s link
        </p>
      </div>
    </div>
  );
}
