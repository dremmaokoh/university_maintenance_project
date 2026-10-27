import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FieldLabel from '../components/FieldLabel.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import * as authApi from '../api/authApi.js';

export default function CreateAdminPage() {
  const { setupAdmin, user } = useAuth();
  const { showError, showSuccess } = useToast();
  const navigate = useNavigate();
  const [organisationName, setOrganisationName] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const check = await authApi.canCreateOrganisation(email);
      if (!check.data.canCreate) {
        showError('This email has already been used to create an organisation. Kindly log in.');
        setSubmitting(false);
        return;
      }
      await setupAdmin(organisationName, fullName, email, password);
      showSuccess('Organisation created.');
      navigate('/dashboard');
    } catch (err) {
      showError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="card form-card page-enter" onSubmit={handleSubmit}>
        <p className="brand-title">Resolva</p>
        <h1>Create your organisation</h1>
        <p className="muted">Register as the first administrator for your institution.</p>
        <label>
          <FieldLabel required>Organisation name</FieldLabel>
          <input
            value={organisationName}
            onChange={(e) => setOrganisationName(e.target.value)}
            required
            placeholder="e.g. Valley State University"
          />
        </label>
        <label>
          <FieldLabel required>Your full name</FieldLabel>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </label>
        <label>
          <FieldLabel required>Work email</FieldLabel>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          <FieldLabel required>Password</FieldLabel>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Creating…' : 'Create organisation'}
        </button>
        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}
