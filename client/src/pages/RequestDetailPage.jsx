import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout.jsx';
import FieldLabel from '../components/FieldLabel.jsx';
import PageHeader from '../components/admin/PageHeader.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import CommentComposer from '../components/CommentComposer.jsx';
import StarRating from '../components/StarRating.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import RequestEvidence from '../components/RequestEvidence.jsx';
import { memberTypeLabel } from '../utils/memberTypeLabel.js';
import { officerDisplayLabel } from '../utils/officerDisplayLabel.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import * as requestApi from '../api/requestApi.js';
import * as userApi from '../api/userApi.js';

const NEXT_STATUS = {
  assigned: 'in_progress',
  in_progress: 'completed'
};

const STATUS_ACTION_LABEL = {
  in_progress: 'Mark in progress',
  completed: 'Mark completed'
};

function sameUserId(a, b) {
  if (!a || !b) {
    return false;
  }
  return String(a) === String(b);
}

export default function RequestDetailPage() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const { showError, showSuccess } = useToast();
  const [request, setRequest] = useState(null);
  const [history, setHistory] = useState([]);
  const [comments, setComments] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [officerId, setOfficerId] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [commentBody, setCommentBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [ratingStars, setRatingStars] = useState(0);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [unassignSubmitting, setUnassignSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [reqRes, histRes, commentsRes] = await Promise.all([
        requestApi.getRequest(token, id),
        requestApi.getRequestHistory(token, id),
        requestApi.listRequestComments(token, id)
      ]);
      setRequest(reqRes.data);
      setHistory(histRes.data);
      setComments(commentsRes.data);
    } catch (err) {
      setRequest(null);
      showError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [token, id]);

  useEffect(() => {
    if (user.role !== 'admin') {
      return;
    }
    userApi.listOfficers(token).then((res) => setOfficers(res.data));
  }, [token, user.role]);

  async function refreshAfterAssignmentChange(reqData) {
    setRequest(reqData);
    const [histRes, commentsRes] = await Promise.all([
      requestApi.getRequestHistory(token, id),
      requestApi.listRequestComments(token, id)
    ]);
    setHistory(histRes.data);
    setComments(commentsRes.data);
  }

  async function handleAssign(event) {
    event.preventDefault();
    if (!officerId || assignSubmitting) {
      return;
    }
    setAssignSubmitting(true);
    try {
      const res = await requestApi.assignRequest(token, id, officerId);
      await refreshAfterAssignmentChange(res.data);
      showSuccess('Officer assigned.');
    } catch (err) {
      showError(err.message);
    } finally {
      setAssignSubmitting(false);
    }
  }

  async function handleUnassign() {
    if (unassignSubmitting) {
      return;
    }
    setUnassignSubmitting(true);
    try {
      const res = await requestApi.unassignRequest(token, id);
      setOfficerId('');
      await refreshAfterAssignmentChange(res.data);
      showSuccess('Assignment cancelled. You can assign another officer.');
    } catch (err) {
      showError(err.message);
    } finally {
      setUnassignSubmitting(false);
    }
  }

  async function handleStatusUpdate() {
    const next = NEXT_STATUS[request.status];
    if (!next) {
      return;
    }
    setStatusSubmitting(true);
    try {
      const res = await requestApi.updateRequestStatus(token, id, {
        status: next,
        note: statusNote
      });
      setRequest(res.data);
      setStatusNote('');
      const histRes = await requestApi.getRequestHistory(token, id);
      setHistory(histRes.data);
      showSuccess('Status updated.');
    } catch (err) {
      showError(err.message);
    } finally {
      setStatusSubmitting(false);
    }
  }

  async function handleSubmitRating() {
    if (!ratingStars) {
      return;
    }
    setRatingSubmitting(true);
    try {
      const res = await requestApi.rateRequest(token, id, ratingStars);
      setRequest(res.data);
      setRatingStars(0);
      showSuccess('Thank you for your rating.');
    } catch (err) {
      showError(err.message);
    } finally {
      setRatingSubmitting(false);
    }
  }

  async function handleAddComment() {
    if (!commentBody.trim()) {
      return;
    }
    setCommentSubmitting(true);
    try {
      const res = await requestApi.addRequestComment(token, id, commentBody.trim());
      setComments((prev) => [...prev, res.data]);
      setCommentBody('');
      showSuccess('Comment posted.');
    } catch (err) {
      showError(err.message);
    } finally {
      setCommentSubmitting(false);
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingSpinner layout="section" />
      </DashboardLayout>
    );
  }

  if (!request) {
    return (
      <DashboardLayout>
        <p className="muted">Request not found.</p>
        <Link to="/requests">
          {user.role === 'student'
            ? 'Back to My Requests'
            : user.role === 'officer'
              ? 'Back to My Work'
              : 'Back to list'}
        </Link>
      </DashboardLayout>
    );
  }

  const officerIdOnRequest = request.assignedOfficer?.id;
  const isAssignedOfficer = user.role === 'officer' && sameUserId(officerIdOnRequest, user.id);
  const isRequester = user.role === 'student' && sameUserId(request.requester?.id, user.id);

  const canAssign =
    user.role === 'admin' &&
    request.status === 'pending' &&
    !request.assignedOfficer;
  const canUnassign =
    user.role === 'admin' &&
    request.status === 'assigned' &&
    request.assignedOfficer;
  const nextStatus = NEXT_STATUS[request.status];
  const canUpdateStatus = isAssignedOfficer && Boolean(nextStatus);
  const canComment = user.role === 'admin' || isAssignedOfficer || isRequester;
  const isStaff = user.role === 'admin' || user.role === 'officer';
  const canRateOfficer =
    isRequester &&
    request.status === 'completed' &&
    request.assignedOfficer &&
    request.officerRating == null;
  const showRating =
    request.status === 'completed' &&
    request.assignedOfficer &&
    request.officerRating != null;

  return (
    <DashboardLayout>
      <PageHeader title={request.title} description={`${request.location} · ${request.category?.name || 'Uncategorised'}`} />
      <p>
        <Link to="/requests">
          {user.role === 'student'
            ? '← Back to My Requests'
            : user.role === 'officer'
              ? '← Back to My Work'
              : '← Back to list'}
        </Link>
      </p>
      <article className="card">
        <div className="detail-row">
          <StatusBadge status={request.status} />
          <span className="muted">{request.category?.name}</span>
        </div>
        <p><strong>Location:</strong> {request.location}</p>
        <p>{request.description}</p>
        <p className="muted">
          Requester: {request.requester?.fullName}
          {request.requester?.memberType
            ? ` (${memberTypeLabel(request.requester.memberType)})`
            : ''}{' '}
          · Officer:{' '}
          {request.assignedOfficer
            ? officerDisplayLabel(request.assignedOfficer)
            : 'Not assigned'}
        </p>
        {request.resolutionDuration && (
          <p className="muted">
            <strong>Time to resolve:</strong> {request.resolutionDuration}
          </p>
        )}
        {showRating && (
          <p className="request-rating-display">
            <strong>Officer rating:</strong>{' '}
            <StarRating value={request.officerRating} readOnly label="Officer rating" />
          </p>
        )}
      </article>

      <RequestEvidence token={token} requestId={request.id} evidence={request.evidence} />

      {canRateOfficer && (
        <section className="card form-card rating-card">
          <h2>Rate your maintenance officer</h2>
          <p className="muted">
            How was your experience with {request.assignedOfficer.fullName}? You can submit one
            rating after completion.
          </p>
          <StarRating value={ratingStars} onChange={setRatingStars} label="Select star rating" />
          <button
            type="button"
            className="btn btn-primary"
            disabled={!ratingStars || ratingSubmitting}
            onClick={handleSubmitRating}
          >
            {ratingSubmitting ? 'Submitting…' : 'Submit rating'}
          </button>
        </section>
      )}

      {canUnassign && (
        <div className="card form-card">
          <h2>Assigned officer</h2>
          <p className="muted">
            <strong>{officerDisplayLabel(request.assignedOfficer)}</strong> is assigned to this request. Cancel
            the assignment to choose a different officer.
          </p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleUnassign}
            disabled={unassignSubmitting}
          >
            {unassignSubmitting ? 'Cancelling…' : 'Cancel assignment'}
          </button>
        </div>
      )}

      {canAssign && (
        <form className="card form-card" onSubmit={handleAssign}>
          <h2>Assign officer</h2>
          <p className="muted">Only one officer can be assigned at a time.</p>
          <FieldLabel htmlFor="assign-officer" required>Maintenance officer</FieldLabel>
          <select
            id="assign-officer"
            value={officerId}
            onChange={(e) => setOfficerId(e.target.value)}
            required
          >
            <option value="">Select officer</option>
            {officers.map((officer) => (
              <option key={officer.id} value={officer.id}>
                {officerDisplayLabel(officer)}
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn-primary" disabled={assignSubmitting}>
            {assignSubmitting ? 'Assigning…' : 'Assign'}
          </button>
        </form>
      )}

      {canUpdateStatus && (
        <div className="card form-card">
          <h2>Update status</h2>
          <p className="muted">
            Move this job to <strong>{nextStatus.replace('_', ' ')}</strong>. Status updates are
            visible to the requester and administrators.
          </p>
          <label>
            <FieldLabel optional>Progress note</FieldLabel>
            <input
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              placeholder="e.g. Parts ordered, work started today"
            />
          </label>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleStatusUpdate}
            disabled={statusSubmitting}
          >
            {statusSubmitting ? 'Saving…' : STATUS_ACTION_LABEL[nextStatus]}
          </button>
        </div>
      )}

      <section className="card">
        <h2>Status history</h2>
        <p className="muted section-lead">Visible to the requester, maintenance officer, and administrators.</p>
        <ul className="history-list">
          {history.length === 0 && <li className="muted">No status changes yet.</li>}
          {history.map((item) => (
            <li key={item.id}>
              <StatusBadge status={item.status} />
              <span>{item.note || '—'}</span>
              <span className="muted">
                {item.actor?.fullName} · {new Date(item.createdAt).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card form-card">
        <h2>Comments</h2>
        {canComment ? (
          <CommentComposer
            value={commentBody}
            onChange={setCommentBody}
            onSubmit={handleAddComment}
            submitting={commentSubmitting}
            role={user.role}
            requesterFullName={request.requester?.fullName}
          />
        ) : (
          <p className="muted">You cannot add comments on this request.</p>
        )}

        <ul className="comment-list">
          {comments.length === 0 && <li className="muted">No comments yet.</li>}
          {comments.map((item) => (
            <li key={item.id} className="comment-item">
              <p className="comment-body">{item.body}</p>
              <p className="muted comment-meta">
                {item.author?.fullName}
                {item.author?.role ? ` (${item.author.role})` : ''}
                · {new Date(item.createdAt).toLocaleString()}
                {isStaff && item.visibleToRequester && (
                  <span className="comment-badge">Shared with requester</span>
                )}
                {isStaff && !item.visibleToRequester && item.author?.role !== 'student' && (
                  <span className="comment-badge staff-only">Staff only</span>
                )}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </DashboardLayout>
  );
}
