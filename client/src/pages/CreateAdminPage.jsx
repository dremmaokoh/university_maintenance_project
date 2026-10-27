import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as authApi from '../api/authApi.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function CreateAdminPage() {
  const { setupAdmin, user } = useAuth();
  const navigate = useNavigate();
  const [setupAvailable, setSetupAvailable] = useState(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
      return;
    }
    authApi
      .getSetupAvailable()
      .then((res) => setSetupAvailable(res.data.setupAvailable))
      .catch(() => setSetupAvailable(false));
  }, [user, navigate]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await setupAdmin(fullName, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (setupAvailable === null) {
    return <p className="muted center-page">Loading…</p>;
  }

  if (!setupAvailable) {
    return (
      <div className="auth-page">
        <div className="card form-card">
          <h1>Administrator setup closed</h1>
          <p className="muted">An administrator already exists. Log in or ask for an invite link.</p>
          <Link className="btn btn-primary" to="/login">Go to login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <form className="card form-card" onSubmit={handleSubmit}>
        <h1>Create administrator</h1>
        <p className="muted">Set up the first admin account for your university.</p>
        {error && <p className="error">{error}</p>}
        <label>
          Full name
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </label>
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
            minLength={8}
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Creating…' : 'Create admin account'}
        </button>
        <p className="muted"><Link to="/">Back to home</Link></p>
      </form>
    </div>
  );
}
