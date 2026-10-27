import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import AuthTextField from '../components/auth/AuthTextField.jsx';
import AuthPasswordField from '../components/auth/AuthPasswordField.jsx';
import { EnvelopeIcon } from '../components/auth/AuthIcons.jsx';
import * as organisationApi from '../api/organisationApi.js';
import '../styles/login.css';

export default function OrgLoginPage() {
  const { orgSlug } = useParams();
  const { login, user } = useAuth();
  const { showError } = useToast();
  const navigate = useNavigate();
  const [org, setOrg] = useState(null);
  const [orgLoading, setOrgLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    setOrgLoading(true);
    organisationApi
      .getOrganisationBySlug(orgSlug)
      .then((res) => setOrg(res.data))
      .catch(() => {
        setOrg(null);
        showError('Invalid organisation link.');
      })
      .finally(() => setOrgLoading(false));
  }, [orgSlug, showError]);

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await login({ email, password, orgSlug });
      navigate('/dashboard');
    } catch (err) {
      const message = err.message || 'Sign-in failed. Check your email and password.';
      setFormError(message);
      showError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (orgLoading) {
    return <LoadingSpinner layout="page" />;
  }

  if (!org) {
    return (
      <div className="login-page">
        <div className="login-page__backdrop" aria-hidden="true" />
        <div className="login-card page-enter">
          <p className="login-card__brand">Resolva</p>
          <p className="login-form-error">This organisation link is not valid.</p>
          <p className="login-auth-switch">
            <Link to="/">Go home</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-page__backdrop" aria-hidden="true" />

      <div className="login-card page-enter">
        <p className="login-card__brand">Resolva</p>
        <p className="login-card__eyebrow">Staff &amp; Students sign in</p>
        <h1 className="login-card__title">Log in</h1>
        <p className="login-card__subtitle">
          Welcome back. Sign in to manage and track maintenance requests.
        </p>
        <p className="login-institution">Signing in to {org.name}</p>

        <form onSubmit={handleSubmit}>
          {formError && (
            <p className="login-form-error" role="alert">
              {formError}
            </p>
          )}

          <AuthTextField
            id="org-login-email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<EnvelopeIcon />}
            autoComplete="email"
          />

          <AuthPasswordField
            id="org-login-password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            minLength={0}
          />

          <div className="login-forgot">
            <Link to={`/o/${orgSlug}/login/forgot`}>Forgot password?</Link>
          </div>

          <button
            type="submit"
            className={`login-submit${submitting ? ' login-submit--busy' : ''}`}
            disabled={submitting}
            aria-busy={submitting}
          >
            {submitting && <span className="login-submit__spinner" aria-hidden="true" />}
            {submitting ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <div className="login-auth-links">
          <p className="login-auth-switch">
            New here? <Link to={`/o/${orgSlug}/register`}>Create account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
