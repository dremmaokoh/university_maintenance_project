import { useEffect, useState } from 'react';
import FieldLabel from '../components/FieldLabel.jsx';
import { Link, useNavigate, useParams } from 'react-router-dom';
import * as authApi from '../api/authApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const { setSession } = useAuth();
  const { showError, showSuccess } = useToast();
  const navigate = useNavigate();
  const [preview, setPreview] = useState(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    authApi
      .getPasswordResetPreview(token)
      .then((res) => setPreview(res.data))
      .catch((err) => showError(err.message || 'Invalid reset link.'))
      .finally(() => setLoading(false));
  }, [token, showError]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const res = await authApi.completePasswordReset(token, password);
      setSession(res.data.token, res.data.user);
      showSuccess('Password saved.');
      navigate('/dashboard');
    } catch (err) {
      showError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <LoadingSpinner layout="page" />;
  }

  if (!preview) {
    return (
      <div className="auth-page">
        <div className="card form-card">
          <p className="muted">This reset link is invalid or has expired.</p>
          <Link to="/login">Go to log in</Link>
        </div>
      </div>
    );
  }

  const loginPath = preview.organisation?.slug
    ? `/o/${preview.organisation.slug}/login`
    : '/login';

  return (
    <div className="auth-page">
      <form className="card form-card page-enter" onSubmit={handleSubmit}>
        <h1>Set a new password</h1>
        <p className="muted">
          {preview.fullName} · {preview.email}
          {preview.organisation ? ` · ${preview.organisation.name}` : ''}
        </p>
        <label>
          <FieldLabel required>New password</FieldLabel>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save password'}
        </button>
        <p className="auth-switch">
          <Link to={loginPath}>Back to log in</Link>
        </p>
      </form>
    </div>
  );
}
