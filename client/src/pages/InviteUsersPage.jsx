import { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout.jsx';
import OrgStudentLinks from '../components/OrgStudentLinks.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import * as inviteApi from '../api/inviteApi.js';
import * as userApi from '../api/userApi.js';

function teamStatusLabel(member) {
  if (!member.isActive) {
    return 'Disabled';
  }
  if (member.accountStatus === 'pending') {
    return 'Pending invite';
  }
  return 'Active';
}

function roleLabel(role) {
  if (role === 'admin') {
    return 'Administrator';
  }
  if (role === 'officer') {
    return 'Maintenance officer';
  }
  return role;
}

export default function InviteUsersPage() {
  const { token, user } = useAuth();
  const { showError, showSuccess } = useToast();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('officer');
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [team, setTeam] = useState([]);
  const [teamLoading, setTeamLoading] = useState(true);
  const [teamActionId, setTeamActionId] = useState(null);

  function loadTeam() {
    setTeamLoading(true);
    userApi
      .listTeamMembers(token)
      .then((res) => setTeam(res.data))
      .catch((err) => showError(err.message))
      .finally(() => setTeamLoading(false));
  }

  useEffect(() => {
    loadTeam();
  }, [token]);

  async function handleSubmit(event) {
    event.preventDefault();
    setInviteLink('');
    setSubmitting(true);
    try {
      const res = await inviteApi.createInvite(token, { fullName, email, role });
      const link = `${window.location.origin}/invite/${res.data.inviteToken}`;
      setInviteLink(link);
      setCopied(false);
      setFullName('');
      setEmail('');
      loadTeam();
    } catch (err) {
      showError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    showSuccess('Invite link copied.');
  }

  async function toggleMemberActive(member) {
    const nextActive = !member.isActive;
    setTeamActionId(member.id);
    try {
      await userApi.updateTeamMember(token, member.id, { isActive: nextActive });
      loadTeam();
      showSuccess(nextActive ? 'Team member enabled.' : 'Team member disabled.');
    } catch (err) {
      showError(err.message);
    } finally {
      setTeamActionId(null);
    }
  }

  return (
    <DashboardLayout title="Team & student links">
      <OrgStudentLinks slug={user?.organisation?.slug} />

      <section className="card table-card">
        <h2>Your team</h2>
        <p className="muted">
          Administrators and maintenance officers in your organisation. Disabled accounts cannot sign in.
        </p>
        {teamLoading && <LoadingSpinner layout="section" label="Loading team…" />}
        {!teamLoading && team.length === 0 && <p className="muted">No team members yet.</p>}
        {!teamLoading && team.length > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Rating</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {team.map((member) => {
                const status = teamStatusLabel(member);
                const isSelf = member.id === user?.id;
                const canToggle = member.accountStatus !== 'pending' && !isSelf;
                return (
                  <tr key={member.id}>
                    <td>{member.fullName}</td>
                    <td>{member.email}</td>
                    <td>{roleLabel(member.role)}</td>
                    <td>
                      <span
                        className={
                          status === 'Active'
                            ? 'team-status team-status--active'
                            : status === 'Disabled'
                              ? 'team-status team-status--disabled'
                              : 'team-status team-status--pending'
                        }
                      >
                        {status}
                      </span>
                    </td>
                    <td>
                      {member.role === 'officer' && member.ratingCount > 0
                        ? `${member.averageRating} ★ (${member.ratingCount})`
                        : member.role === 'officer'
                          ? '—'
                          : '—'}
                    </td>
                    <td>
                      {canToggle && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          disabled={teamActionId === member.id}
                          onClick={() => toggleMemberActive(member)}
                        >
                          {teamActionId === member.id
                            ? 'Saving…'
                            : member.isActive
                              ? 'Disable'
                              : 'Enable'}
                        </button>
                      )}
                      {isSelf && <span className="muted">You</span>}
                      {member.accountStatus === 'pending' && (
                        <span className="muted">Awaiting signup</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      <form className="card form-card" onSubmit={handleSubmit}>
        <h2>Invite admin or officer</h2>
        <p className="muted">Copy the invite link and share it with your colleague.</p>
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
          <h2>Staff invite link</h2>
          <p className="invite-url">{inviteLink}</p>
          <button type="button" className="btn btn-secondary" onClick={copyLink}>
            {copied ? 'Copied' : 'Copy link'}
          </button>
        </div>
      )}
    </DashboardLayout>
  );
}
