import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import * as organisationApi from '../api/organisationApi.js';

export default function StudentRegisterPage() {
  const { orgSlug } = useParams();
  const { registerStudent } = useAuth();
  const { showError } = useToast();
  const navigate = useNavigate();
  const [org, setOrg] = useState(null);
  const [orgLoading, setOrgLoading] = useState(true);
  const [fullName, setFullName] = useState('');
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

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await registerStudent(orgSlug, fullName, email, password);
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
      <form className="card form-card page-enter" onSubmit={handleSubmit} autoComplete="off">
        <p className="brand-title">Resolva</p>
        <h1>Student sign up</h1>
        <p className="muted">{org.name}</p>
        <p className="muted">
          New student? Create your account below. Already signed up? Log in.
        </p>
        <label>
          Full name
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            autoComplete="name"
            name="fullName"
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            name="email"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            name="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            readOnly
            onFocus={(event) => event.target.removeAttribute('readonly')}
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
        <p className="auth-switch">
          Already signed up? <Link to={`/o/${orgSlug}/login`}>Log in</Link>
        </p>
      </form>
    </div>
  );
}
