import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import * as authApi from '../api/authApi.js';
import * as organisationApi from '../api/organisationApi.js';
import { useToast } from '../context/ToastContext.jsx';

export default function ForgotPasswordPage() {
  const { orgSlug } = useParams();
  const { showError, showSuccess } = useToast();
  const [orgName, setOrgName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resetLink, setResetLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [accounts, setAccounts] = useState(null);

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

  async function handleSubmit(event) {
    event.preventDefault();
    setResetLink('');
    setCopied(false);
    setAccounts(null);
    setSubmitting(true);
    try {
      const res = await authApi.forgotPassword({
        email,
        orgSlug: orgSlug || undefined
      });
      if (res.data.requiresAccountChoice) {
        setAccounts(res.data.accounts);
        setSubmitting(false);
        return;
      }
      const link = `${window.location.origin}${res.data.resetPath}`;
      setResetLink(link);
    } catch (err) {
      showError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function chooseAccount(userId) {
    setSubmitting(true);
    try {
      const res = await authApi.forgotPassword({ email, userId });
      const link = `${window.location.origin}${res.data.resetPath}`;
      setResetLink(link);
      setAccounts(null);
    } catch (err) {
      showError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(resetLink);
    setCopied(true);
    showSuccess('Reset link copied.');
  }

  return (
    <div className="auth-page">
      <form className="card form-card page-enter" onSubmit={handleSubmit}>
        <p className="brand-title">Resolva</p>
        <h1>Forgot password</h1>
        <p className="muted">
          {orgSlug
            ? orgName
              ? `Reset your password for ${orgName}.`
              : 'Reset your student account password.'
            : 'Reset your administrator or staff password.'}
        </p>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </label>
        {!accounts && !resetLink && (
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Working…' : 'Get reset link'}
          </button>
        )}
        {accounts && (
          <div className="account-choices">
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
        <p className="auth-switch">
          <Link to={loginPath}>Back to log in</Link>
        </p>
      </form>

      {resetLink && (
        <div className="card form-card invite-result">
          <h2>Password reset link</h2>
          <p className="muted">Copy this link and open it in your browser. It expires in 24 hours.</p>
          <p className="invite-url">{resetLink}</p>
          <button type="button" className="btn btn-secondary" onClick={copyLink}>
            {copied ? 'Copied' : 'Copy link'}
          </button>
          <p className="auth-switch">
            <Link to={loginPath}>Back to log in</Link>
          </p>
        </div>
      )}
    </div>
  );
}
