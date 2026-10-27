import { useState } from 'react';
import { useToast } from '../context/ToastContext.jsx';

export default function OrgStudentLinks({ slug }) {
  const { showSuccess } = useToast();
  const [copied, setCopied] = useState(false);

  if (!slug) {
    return null;
  }

  const registerUrl = `${window.location.origin}/o/${slug}/register`;

  async function copy() {
    await navigator.clipboard.writeText(registerUrl);
    setCopied(true);
    showSuccess('Student link copied.');
  }

  return (
    <div className="card org-links-card">
      <h2>Student link</h2>
      <p className="muted">
        Share this one link. Students sign up there, and anyone who already has an account can log in from the same page.
      </p>
      <label>
        Sign up and log in
        <div className="link-row">
          <input readOnly value={registerUrl} />
          <button type="button" className="btn btn-secondary" onClick={copy}>
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </label>
    </div>
  );
}
