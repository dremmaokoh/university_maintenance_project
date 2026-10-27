import { useCallback, useEffect, useState } from 'react';
import Modal from './Modal.jsx';
import AccountStatusBadge from './AccountStatusBadge.jsx';
import StarRating from '../StarRating.jsx';
import LoadingSpinner from '../LoadingSpinner.jsx';
import FieldLabel from '../FieldLabel.jsx';
import { formatDisplayDate } from '../../utils/formatDisplayDate.js';
import { teamAccountStatusLabel } from '../../utils/teamAccountStatusLabel.js';
import { personInitials } from '../../utils/personInitials.js';
import * as userApi from '../../api/userApi.js';

function profileAriaLabel(profile) {
  if (!profile?.fullName) {
    return 'Team member profile';
  }
  return `${profile.fullName}, ${profile.roleLabel || 'team member'} profile`;
}

function roleLabelFromRole(role) {
  if (role === 'admin') {
    return 'Administrator';
  }
  if (role === 'officer') {
    return 'Maintenance officer';
  }
  return role;
}

export default function TeamMemberProfileModal({
  isOpen,
  onClose,
  token,
  memberId,
  currentUserId,
  onMemberUpdated
}) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [editFullName, setEditFullName] = useState('');
  const [editRole, setEditRole] = useState('officer');
  const [editJobTitle, setEditJobTitle] = useState('');

  const loadProfile = useCallback(() => {
    if (!memberId) {
      return Promise.resolve();
    }
    setLoading(true);
    setError(null);
    return userApi
      .getTeamMemberProfile(token, memberId)
      .then((res) => {
        setProfile(res.data);
      })
      .catch((err) => {
        setError(err.message);
        setProfile(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [memberId, token]);

  useEffect(() => {
    if (!isOpen || !memberId) {
      setProfile(null);
      setError(null);
      setEditing(false);
      setFormError('');
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    userApi
      .getTeamMemberProfile(token, memberId)
      .then((res) => {
        if (!cancelled) {
          setProfile(res.data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, memberId, token]);

  useEffect(() => {
    if (!profile || !editing) {
      return;
    }
    setEditFullName(profile.fullName || '');
    setEditRole(profile.role === 'admin' ? 'admin' : 'officer');
    setEditJobTitle(profile.jobTitle || '');
    setFormError('');
  }, [profile, editing]);

  const isSelf = profile && currentUserId && profile.id === currentUserId;
  const statusLabel = profile ? teamAccountStatusLabel(profile) : null;
  const isOfficer = profile?.role === 'officer';
  const ratingCount = profile?.ratingCount ?? 0;
  const averageRating = profile?.averageRating ?? null;
  const completedCount = profile?.performance?.completedCount ?? 0;
  const averageResolutionTime = profile?.performance?.averageResolutionTime ?? null;

  function startEditing() {
    setEditing(true);
    setFormError('');
  }

  function cancelEditing() {
    setEditing(false);
    setFormError('');
  }

  async function handleSave(event) {
    event.preventDefault();
    if (!profile || saving) {
      return;
    }

    const trimmedName = editFullName.trim();
    const trimmedJobTitle = editJobTitle.trim();

    if (!trimmedName) {
      setFormError('Full name is required.');
      return;
    }
    if (editRole === 'officer' && !trimmedJobTitle) {
      setFormError('Job title is required for maintenance officers.');
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      const body = {
        fullName: trimmedName,
        jobTitle: editRole === 'officer' ? trimmedJobTitle : trimmedJobTitle || null
      };
      if (!isSelf && editRole !== profile.role) {
        body.role = editRole;
      }
      await userApi.updateTeamMember(token, profile.id, body);
      await loadProfile();
      setEditing(false);
      onMemberUpdated?.();
    } catch (err) {
      setFormError(err.message || 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  }

  const headerName = editing ? editFullName.trim() || profile?.fullName : profile?.fullName;
  const headerRoleLabel = editing
    ? roleLabelFromRole(editRole)
    : profile?.roleLabel;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel={profileAriaLabel(profile)}
      panelClassName="app-modal__panel app-modal__panel--profile"
      preventClose={saving}
      headerSlot={(titleId) => {
        if (loading && !profile) {
          return (
            <h2 id={titleId} className="team-profile-modal__title team-profile-modal__title--loading">
              Team member
            </h2>
          );
        }
        if (!profile) {
          return (
            <h2 id={titleId} className="team-profile-modal__title">
              Team member
            </h2>
          );
        }
        return (
          <div className="team-profile-modal__header">
            <div className="team-profile-modal__identity">
              <div className="team-profile-modal__avatar" aria-hidden="true">
                {personInitials(headerName)}
              </div>
              <div className="team-profile-modal__heading">
                <h2 id={titleId} className="team-profile-modal__title">
                  {headerName}
                </h2>
                <p className="team-profile-modal__subtitle">{headerRoleLabel}</p>
              </div>
            </div>
          </div>
        );
      }}
      headerActions={
        profile && !loading && !error ? (
          editing ? (
            <button
              type="button"
              className="btn btn-sm btn-secondary team-profile-modal__header-action"
              onClick={cancelEditing}
              disabled={saving}
            >
              Back
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-sm btn-secondary team-profile-modal__header-action"
              onClick={startEditing}
            >
              Edit
            </button>
          )
        ) : null
      }
    >
      {loading && <LoadingSpinner layout="section" label="Loading profile…" />}
      {error && <p className="login-form-error" role="alert">{error}</p>}
      {!loading && !error && profile && (
        <div className="team-profile-modal">
          <section className="team-profile-modal__section" aria-labelledby="team-profile-account-heading">
            <h3 id="team-profile-account-heading" className="team-profile-modal__section-title">
              Contact and account
            </h3>

            {editing ? (
              <form className="team-profile-modal__edit-form" onSubmit={handleSave}>
                {formError && (
                  <p className="login-form-error" role="alert">{formError}</p>
                )}
                <label>
                  <FieldLabel required>Full name</FieldLabel>
                  <input
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    required
                    disabled={saving}
                    autoComplete="name"
                    maxLength={120}
                  />
                </label>
                <label>
                  <FieldLabel required>Role</FieldLabel>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    disabled={saving || isSelf}
                    required
                  >
                    <option value="officer">Maintenance officer</option>
                    <option value="admin">Administrator</option>
                  </select>
                  {isSelf && (
                    <p className="app-modal__note muted">You cannot change your own role.</p>
                  )}
                </label>
                <label>
                  <FieldLabel required={editRole === 'officer'}>Job title</FieldLabel>
                  <input
                    value={editJobTitle}
                    onChange={(e) => setEditJobTitle(e.target.value)}
                    required={editRole === 'officer'}
                    disabled={saving}
                    placeholder={
                      editRole === 'officer'
                        ? 'e.g. Electrician, HVAC technician'
                        : 'e.g. Facilities manager (optional)'
                    }
                    maxLength={80}
                  />
                </label>
                <p className="app-modal__note muted">
                  Email, account status, and date joined cannot be changed here.
                </p>
                <div className="team-profile-modal__edit-actions">
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              </form>
            ) : (
              <dl className="team-profile-modal__fields">
                <div className="team-profile-modal__field">
                  <dt>Full name</dt>
                  <dd>{profile.fullName}</dd>
                </div>
                <div className="team-profile-modal__field">
                  <dt>Email address</dt>
                  <dd>
                    <a href={`mailto:${profile.email}`} className="team-profile-modal__email-link">
                      {profile.email}
                    </a>
                  </dd>
                </div>
                <div className="team-profile-modal__field">
                  <dt>Role</dt>
                  <dd>{profile.roleLabel}</dd>
                </div>
                <div className="team-profile-modal__field">
                  <dt>Job title</dt>
                  <dd>{profile.jobTitle || '—'}</dd>
                </div>
                <div className="team-profile-modal__field">
                  <dt>Account status</dt>
                  <dd>
                    <AccountStatusBadge label={statusLabel} />
                  </dd>
                </div>
                <div className="team-profile-modal__field">
                  <dt>Date joined</dt>
                  <dd>{formatDisplayDate(profile.createdAt)}</dd>
                </div>
              </dl>
            )}
          </section>

          {isOfficer && !editing && (
            <section
              className="team-profile-modal__section team-profile-modal__section--performance"
              aria-labelledby="team-profile-performance-heading"
            >
              <h3 id="team-profile-performance-heading" className="team-profile-modal__section-title">
                Performance
              </h3>
              <div className="team-profile-modal__metrics">
                <div className="team-profile-modal__metric">
                  <p className="team-profile-modal__metric-label">Average rating</p>
                  {ratingCount > 0 && averageRating != null ? (
                    <div className="team-profile-modal__metric-value">
                      <p className="team-profile-modal__metric-primary">
                        {averageRating} <span className="team-profile-modal__metric-unit">out of 5</span>
                      </p>
                      <StarRating
                        value={averageRating}
                        readOnly
                        label={`Average rating ${averageRating} out of 5`}
                      />
                    </div>
                  ) : (
                    <p className="team-profile-modal__metric-value team-profile-modal__metric-empty">
                      — <span className="team-profile-modal__metric-hint">No ratings yet</span>
                    </p>
                  )}
                </div>
                <div className="team-profile-modal__metric">
                  <p className="team-profile-modal__metric-label">Number of ratings</p>
                  <p className="team-profile-modal__metric-value">
                    {ratingCount > 0 ? ratingCount : '—'}
                  </p>
                </div>
                <div className="team-profile-modal__metric">
                  <p className="team-profile-modal__metric-label">Tickets completed</p>
                  <p className="team-profile-modal__metric-value">{completedCount}</p>
                </div>
                <div className="team-profile-modal__metric">
                  <p className="team-profile-modal__metric-label">Average resolution time</p>
                  <p className="team-profile-modal__metric-value">
                    {averageResolutionTime || '—'}
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>
      )}
    </Modal>
  );
}
