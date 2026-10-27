import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import * as requestApi from '../api/requestApi.js';
import * as userApi from '../api/userApi.js';

const NEXT_STATUS = {
  assigned: 'in_progress',
  in_progress: 'completed'
};

export default function RequestDetailPage() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const [request, setRequest] = useState(null);
  const [history, setHistory] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [officerId, setOfficerId] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [reqRes, histRes] = await Promise.all([
        requestApi.getRequest(token, id),
        requestApi.getRequestHistory(token, id)
      ]);
      setRequest(reqRes.data);
      setHistory(histRes.data);
    } catch (err) {
      setError(err.message);
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

  async function handleAssign(event) {
    event.preventDefault();
    if (!officerId) {
      return;
    }
    setError('');
    try {
      const res = await requestApi.assignRequest(token, id, officerId);
      setRequest(res.data);
      const histRes = await requestApi.getRequestHistory(token, id);
      setHistory(histRes.data);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleStatusUpdate() {
    const next = NEXT_STATUS[request.status];
    if (!next) {
      return;
    }
    setError('');
    try {
      const res = await requestApi.updateRequestStatus(token, id, { status: next, note });
      setRequest(res.data);
      setNote('');
      const histRes = await requestApi.getRequestHistory(token, id);
      setHistory(histRes.data);
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) {
    return (
      <Layout title="Request details">
        <p className="muted">Loading…</p>
      </Layout>
    );
  }

  if (!request) {
    return (
      <Layout title="Request details">
        <p className="error">{error || 'Request not found.'}</p>
        <Link to="/requests">Back to list</Link>
      </Layout>
    );
  }

  const canAssign = user.role === 'admin' && request.status === 'pending';
  const canUpdateStatus =
    user.role === 'officer' && NEXT_STATUS[request.status] && request.assignedOfficer?.id === user.id;

  return (
    <Layout title={request.title}>
      <p><Link to="/requests">← Back to list</Link></p>
      {error && <p className="error">{error}</p>}

      <article className="card">
        <div className="detail-row">
          <StatusBadge status={request.status} />
          <span className="muted">{request.category?.name}</span>
        </div>
        <p><strong>Location:</strong> {request.location}</p>
        <p>{request.description}</p>
        <p className="muted">
          Requester: {request.requester?.fullName} · Officer:{' '}
          {request.assignedOfficer?.fullName || 'Not assigned'}
        </p>
      </article>

      {canAssign && (
        <form className="card form-card" onSubmit={handleAssign}>
          <h2>Assign officer</h2>
          <select value={officerId} onChange={(e) => setOfficerId(e.target.value)} required>
            <option value="">Select officer</option>
            {officers.map((officer) => (
              <option key={officer.id} value={officer.id}>{officer.fullName}</option>
            ))}
          </select>
          <button type="submit" className="btn btn-primary">Assign</button>
        </form>
      )}

      {canUpdateStatus && (
        <div className="card form-card">
          <h2>Update progress</h2>
          <label>
            Note (optional)
            <input value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
          <button type="button" className="btn btn-primary" onClick={handleStatusUpdate}>
            Mark as {NEXT_STATUS[request.status].replace('_', ' ')}
          </button>
        </div>
      )}

      <section className="card">
        <h2>Status history</h2>
        <ul className="history-list">
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
    </Layout>
  );
}
