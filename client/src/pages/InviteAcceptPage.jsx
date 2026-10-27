import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import * as inviteApi from '../api/inviteApi.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function InviteAcceptPage() {
  const { token: inviteToken } = useParams();
  const { setSession } = useAuth();
  const navigate = useNavigate();
  const [preview, setPreview] = useState(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    inviteApi
      .getInvitePreview(inviteToken)
      .then((res) => setPreview(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [inviteToken]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await inviteApi.acceptInvite(inviteToken, password);
      setSession(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="muted center-page">Loading invite…</p>;
  }

  if (!preview) {
    return (
      <div className="auth-page">
        <div className="card form-card">
          <p className="error">{error || 'Invalid invite.'}</p>
          <Link to="/login">Go to login</Link>
        </div>
      </div>
    );
  }

  const roleLabel = preview.role === 'admin' ? 'Administrator' : 'Maintenance officer';

  return (
    <div className="auth-page">
      <form className="card form-card" onSubmit={handleSubmit}>
        <h1>Set your password</h1>
        <p className="muted">
          {preview.fullName} · {preview.email} · {roleLabel}
        </p>
        {error && <p className="error">{error}</p>}
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : 'Activate account'}
        </button>
      </form>
    </div>
  );
}
