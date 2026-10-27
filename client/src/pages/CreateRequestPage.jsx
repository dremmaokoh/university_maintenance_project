import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout.jsx';
import PageHeader from '../components/admin/PageHeader.jsx';
import EvidenceUploadField from '../components/EvidenceUploadField.jsx';
import FieldLabel from '../components/FieldLabel.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import * as categoryApi from '../api/categoryApi.js';
import * as requestApi from '../api/requestApi.js';

const MAX_EVIDENCE_BYTES = 5 * 1024 * 1024;

export default function CreateRequestPage() {
  const { token } = useAuth();
  const { showError, showSuccess } = useToast();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    categoryApi.listCategories(token).then((res) => setCategories(res.data));
  }, [token]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (evidenceFile && evidenceFile.size > MAX_EVIDENCE_BYTES) {
      showError('File is too large. Maximum size is 5 MB.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await requestApi.createRequest(
        token,
        {
          title,
          description,
          location,
          categoryId
        },
        evidenceFile
      );
      showSuccess('Request submitted.');
      navigate(`/requests/${res.data.id}`);
    } catch (err) {
      showError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="request-form-page">
        <Link to="/requests" className="request-form-back">
          ← Back to My Requests
        </Link>
        <PageHeader
          title="New Maintenance Request"
          description="Tell us what needs fixing, where the issue is, and how we can help."
        />

        <div className="request-form-layout">
          <form className="card request-form-card" onSubmit={handleSubmit}>
            <div className="request-form-section">
              <h2 className="request-form-section__title">Issue details</h2>
              <div className="form-field">
                <FieldLabel htmlFor="request-title" required>Request title</FieldLabel>
                <input
                  id="request-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Projector not working in Lecture Hall A"
                  required
                />
              </div>
              <div className="form-field">
                <FieldLabel htmlFor="request-category" required>Category</FieldLabel>
                <select
                  id="request-category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                >
                  <option value="">Select an issue category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <FieldLabel htmlFor="request-description" required>Description</FieldLabel>
                <textarea
                  id="request-description"
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the problem, when it started, and any details that may help resolve it."
                  required
                />
              </div>
            </div>

            <div className="request-form-section">
              <h2 className="request-form-section__title">Location</h2>
              <div className="form-field">
                <FieldLabel htmlFor="request-location" required>Location</FieldLabel>
                <input
                  id="request-location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Block B, Room 204"
                  required
                />
                <p className="request-form-helper muted">
                  Provide a specific location so the maintenance team can find the issue.
                </p>
              </div>
            </div>

            <div className="request-form-section">
              <FieldLabel optional>Evidence</FieldLabel>
              <EvidenceUploadField
                file={evidenceFile}
                onError={showError}
                onFileChange={setEvidenceFile}
              />
            </div>

            <div className="request-form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={submitting}
                onClick={() => navigate('/requests')}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit Request'}
              </button>
            </div>
          </form>

          <aside className="request-form-aside" aria-label="Submission tips">
            <h2 className="request-form-aside__title">Before you submit</h2>
            <ul>
              <li>Describe the problem clearly.</li>
              <li>Provide the exact location.</li>
              <li>Attach a photo if it helps explain the issue.</li>
            </ul>
            <p className="request-form-aside__note">
              Once submitted, you can track your request and follow status updates from My Requests.
            </p>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}
