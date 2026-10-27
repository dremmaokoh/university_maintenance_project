import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import * as requestApi from '../api/requestApi.js';

const STATUS_OPTIONS = ['', 'pending', 'assigned', 'in_progress', 'completed'];

export default function RequestListPage() {
  const { token, user } = useAuth();
  const [data, setData] = useState({ items: [], page: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    requestApi
      .listRequests(token, { page, search, status })
      .then((res) => {
        if (!cancelled) {
          setData(res.data);
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
  }, [token, page, search, status]);

  const title =
    user.role === 'admin'
      ? 'All requests'
      : user.role === 'officer'
        ? 'Assigned requests'
        : 'My requests';

  return (
    <Layout title={title}>
      <div className="card filters">
        <input
          type="search"
          placeholder="Search title, description, location"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
        >
          {STATUS_OPTIONS.map((value) => (
            <option key={value || 'all'} value={value}>
              {value ? value.replace('_', ' ') : 'All statuses'}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="error">{error}</p>}
      {loading && <p className="muted">Loading requests…</p>}

      {!loading && data.items.length === 0 && (
        <p className="muted">No requests found.</p>
      )}

      <ul className="request-list">
        {data.items.map((item) => (
          <li key={item.id} className="card request-item">
            <div>
              <Link to={`/requests/${item.id}`}>
                <strong>{item.title}</strong>
              </Link>
              <p className="muted">{item.location} · {item.category?.name}</p>
            </div>
            <StatusBadge status={item.status} />
          </li>
        ))}
      </ul>

      <div className="pagination">
        <button
          type="button"
          className="btn btn-secondary"
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
        >
          Previous
        </button>
        <span className="muted">Page {data.page} of {data.totalPages}</span>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={page >= data.totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>
    </Layout>
  );
}
