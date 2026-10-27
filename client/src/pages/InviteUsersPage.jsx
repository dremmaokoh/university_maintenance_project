import { useState } from 'react';
import Layout from '../components/Layout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import * as inviteApi from '../api/inviteApi.js';

export default function InviteUsersPage() {
  const { token } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('officer');
  const [error, setError] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setInviteLink('');
    setSubmitting(true);
    try {
      const res = await inviteApi.createInvite(token, { fullName, email, role });
      const link = `${window.location.origin}/invite/${res.data.inviteToken}`;
      setInviteLink(link);
      setFullName('');
      setEmail('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(inviteLink);
  }

  return (
    <Layout title="Invite team member">
      <form className="card form-card" onSubmit={handleSubmit}>
        <p className="muted">
          Send admin or maintenance officer access. Copy the link and share it (email is not sent yet).
        </p>
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
          Role
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="officer">Maintenance officer</option>
            <option value="admin">Administrator</option>
          </select>
        </label>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Creating invite…' : 'Generate invite link'}
        </button>
      </form>

      {inviteLink && (
        <div className="card invite-result">
          <h2>Invite link ready</h2>
          <p className="invite-url">{inviteLink}</p>
          <button type="button" className="btn btn-secondary" onClick={copyLink}>
            Copy link
          </button>
        </div>
      )}
    </Layout>
  );
}
