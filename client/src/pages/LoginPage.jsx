import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import AuthTextField from '../components/auth/AuthTextField.jsx';
import AuthPasswordField from '../components/auth/AuthPasswordField.jsx';
import { EnvelopeIcon } from '../components/auth/AuthIcons.jsx';
import '../styles/login.css';

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const { showError } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [accounts, setAccounts] = useState(null);
  const [formError, setFormError] = useState('');

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
    setFormError('');
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
      const message = err.message || 'Sign-in failed. Check your email and password.';
      setFormError(message);
      showError(message);
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
          {formError && (
            <p className="login-form-error" role="alert">
              {formError}
            </p>
          )}

          <AuthTextField
            id="login-email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<EnvelopeIcon />}
            autoComplete="email"
          />

          <AuthPasswordField
            id="login-password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            minLength={0}
          />

          <div className="login-forgot">
            <Link to="/login/forgot">Forgot password?</Link>
          </div>

          {!accounts && (
            <button
              type="submit"
              className={`login-submit${submitting ? ' login-submit--busy' : ''}`}
              disabled={submitting}
              aria-busy={submitting}
            >
              {submitting && <span className="login-submit__spinner" aria-hidden="true" />}
              {submitting ? 'Logging in…' : 'Log in'}
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
          Staff and students use your institution&apos;s link
        </p>
      </div>
    </div>
  );
}
