import { useEffect, useState } from 'react';
import FieldLabel from '../FieldLabel.jsx';
import Modal from './Modal.jsx';
import CopyLinkField from './CopyLinkField.jsx';
import * as inviteApi from '../../api/inviteApi.js';
import { buildAppUrl } from '../../utils/appUrl.js';

export default function InviteTeamMemberModal({ isOpen, onClose, token, onInviteCreated }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('officer');
  const [jobTitle, setJobTitle] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (isOpen) {
      return;
    }
    setFullName('');
    setEmail('');
    setRole('officer');
    setJobTitle('');
    setInviteLink('');
    setFormError('');
    setSubmitting(false);
  }, [isOpen]);

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');
    setInviteLink('');
    setSubmitting(true);
    try {
      const payload = {
        fullName: fullName.trim(),
        email: email.trim(),
        role
      };
      const trimmedJobTitle = jobTitle.trim();
      if (role === 'officer') {
        payload.jobTitle = trimmedJobTitle;
      } else if (trimmedJobTitle) {
        payload.jobTitle = trimmedJobTitle;
      }
      const res = await inviteApi.createInvite(token, payload);
      const link = buildAppUrl(`/invite/${res.data.inviteToken}`);
      setInviteLink(link);
      setFullName('');
      setEmail('');
      onInviteCreated?.();
    } catch (err) {
      setFormError(err.message || 'Could not create the invitation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const showForm = !inviteLink;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      preventClose={submitting}
      title="Invite a team member"
      description="Generate an invitation link for an administrator or maintenance officer."
      footer={
        showForm ? (
          <div className="app-modal__footer-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button
              type="submit"
              form="invite-team-form"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Generating…' : 'Generate invitation link'}
            </button>
          </div>
        ) : (
          <div className="app-modal__footer-actions">
            <button type="button" className="btn btn-primary" onClick={onClose}>
              Close
            </button>
          </div>
        )
      }
    >
      {formError && (
        <p className="login-form-error" role="alert">
          {formError}
        </p>
      )}

      {showForm && (
        <form id="invite-team-form" className="app-modal__form" onSubmit={handleSubmit}>
          <label>
            <FieldLabel required>Full name</FieldLabel>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={submitting}
              autoComplete="name"
            />
          </label>
          <label>
            <FieldLabel required>Email address</FieldLabel>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={submitting}
              autoComplete="email"
            />
          </label>
          <label>
            <FieldLabel required>Role</FieldLabel>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={submitting}
              required
            >
              <option value="officer">Maintenance officer</option>
              <option value="admin">Administrator</option>
            </select>
          </label>
          <label>
            <FieldLabel required={role === 'officer'}>Job title</FieldLabel>
            <input
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              required={role === 'officer'}
              disabled={submitting}
              placeholder={
                role === 'officer'
                  ? 'e.g. Electrician, HVAC technician'
                  : 'e.g. Facilities manager (optional)'
              }
              maxLength={80}
            />
            <p className="app-modal__note muted">
              {role === 'officer'
                ? 'Required for maintenance officers. Helps assign the right person to each request.'
                : 'Optional for administrators. Shown on the team directory when set.'}
            </p>
          </label>
          <p className="app-modal__note muted">
            A one-time link is created for you to share manually. No email is sent automatically.
          </p>
        </form>
      )}

      {!showForm && (
        <div className="app-modal__result">
          <p className="app-modal__note muted">
            Share this link with the person you invited. It expires after the configured period.
          </p>
          <CopyLinkField
            label="Invitation link"
            value={inviteLink}
            copyButtonLabel="Copy link"
            copySuccessMessage="Invite link copied."
            showInlineSuccess
          />
        </div>
      )}
    </Modal>
  );
}
