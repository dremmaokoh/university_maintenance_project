import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import * as organisationApi from '../api/organisationApi.js';

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
    setSubmitting(true);
    try {
      await login({ email, password, orgSlug });
      navigate('/dashboard');
    } catch (err) {
      showError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (orgLoading) {
    return <LoadingSpinner layout="page" />;
  }

  if (!org) {
    return (
      <div className="auth-page">
        <div className="card form-card">
          <p className="muted">This organisation link is not valid.</p>
          <Link to="/">Go home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <form className="card form-card page-enter" onSubmit={handleSubmit}>
        <p className="brand-title">Resolva</p>
        <h1>Student log in</h1>
        <p className="muted">{org.name}</p>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
        <p className="auth-switch">
          <Link to={`/o/${orgSlug}/login/forgot`}>Forgot password?</Link>
        </p>
        <p className="muted">
          New student? <Link to={`/o/${orgSlug}/register`}>Sign up</Link>
        </p>
      </form>
    </div>
  );
}
