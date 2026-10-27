import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import * as authApi from '../api/authApi.js';
import * as organisationApi from '../api/organisationApi.js';
import { useToast } from '../context/ToastContext.jsx';
import AuthTextField from '../components/auth/AuthTextField.jsx';
import { EnvelopeIcon } from '../components/auth/AuthIcons.jsx';
import '../styles/login.css';

export default function ForgotPasswordPage() {
  const { orgSlug } = useParams();
  const { showError, showSuccess } = useToast();
  const [orgName, setOrgName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resetLink, setResetLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [accounts, setAccounts] = useState(null);
  const [formError, setFormError] = useState('');
  const [fieldError, setFieldError] = useState('');

  useEffect(() => {
    if (!orgSlug) {
      return;
    }
    organisationApi
      .getOrganisationBySlug(orgSlug)
      .then((res) => setOrgName(res.data.name))
      .catch(() => setOrgName(''));
  }, [orgSlug]);

  const loginPath = orgSlug ? `/o/${orgSlug}/login` : '/login';
  const isOrgFlow = Boolean(orgSlug);

  async function handleSubmit(event) {
    event.preventDefault();
    setResetLink('');
    setCopied(false);
    setAccounts(null);
    setFormError('');
    setFieldError('');

    if (!email.trim()) {
      setFieldError('Email is required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await authApi.forgotPassword({
        email: email.trim(),
        orgSlug: orgSlug || undefined
      });
      if (res.data.requiresAccountChoice) {
        setAccounts(res.data.accounts);
        setSubmitting(false);
        return;
      }
      const link = `${window.location.origin}${res.data.resetPath}`;
      setResetLink(link);
      showSuccess('Reset link ready. Copy it below to continue.');
    } catch (err) {
      const message = err.message || 'Could not start password reset. Please try again.';
      setFormError(message);
      showError(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function chooseAccount(userId) {
    setSubmitting(true);
    setFormError('');
    try {
      const res = await authApi.forgotPassword({ email: email.trim(), userId });
      const link = `${window.location.origin}${res.data.resetPath}`;
      setResetLink(link);
      setAccounts(null);
      showSuccess('Reset link ready. Copy it below to continue.');
    } catch (err) {
      const message = err.message || 'Could not start password reset. Please try again.';
      setFormError(message);
      showError(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(resetLink);
    setCopied(true);
    showSuccess('Reset link copied.');
  }

  const subtitle = isOrgFlow
    ? 'Enter your email and we will generate a secure link to set a new password.'
    : 'Enter your work email to generate a secure reset link for your administrator or staff account.';

  return (
    <div className="login-page">
      <div className="login-page__backdrop" aria-hidden="true" />

      <div className="login-card page-enter">
        <p className="login-card__brand">Resolva</p>
        <p className="login-card__eyebrow">Account recovery</p>
        <h1 className="login-card__title">Forgot password</h1>
        <p className="login-card__subtitle">{subtitle}</p>

        {isOrgFlow && orgName && (
          <p className="login-institution">Resetting password for {orgName}</p>
        )}

        {!resetLink && (
          <form onSubmit={handleSubmit} noValidate>
            {formError && (
              <p className="login-form-error" role="alert">
                {formError}
              </p>
            )}

            <AuthTextField
              id="forgot-email"
              label="Email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFieldError('');
              }}
              error={fieldError}
              icon={<EnvelopeIcon />}
              autoComplete="email"
            />

            {!accounts && (
              <button
                type="submit"
                className={`login-submit${submitting ? ' login-submit--busy' : ''}`}
                disabled={submitting}
                aria-busy={submitting}
              >
                {submitting && <span className="login-submit__spinner" aria-hidden="true" />}
                {submitting ? 'Working…' : 'Get reset link'}
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
        )}

        {resetLink && (
          <div className="login-reset-panel">
            <h2 className="login-reset-panel__title">Password reset link</h2>
            <p className="login-field__hint">
              Copy this link and open it in your browser. It expires in 24 hours.
            </p>
            <p className="login-reset-panel__url">{resetLink}</p>
            <button
              type="button"
              className="login-submit login-reset-panel__copy"
              onClick={copyLink}
            >
              {copied ? 'Copied' : 'Copy link'}
            </button>
          </div>
        )}

        <p className="login-auth-switch">
          <Link to={loginPath}>Back to log in</Link>
        </p>
      </div>
    </div>
  );
}
