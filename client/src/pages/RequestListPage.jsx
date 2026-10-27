import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import * as requestApi from '../api/requestApi.js';
import * as categoryApi from '../api/categoryApi.js';

const STATUS_OPTIONS = ['', 'pending', 'assigned', 'in_progress', 'completed'];

export default function RequestListPage() {
  const { token, user } = useAuth();
  const { showError } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState({ items: [], page: 1, totalPages: 1 });
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(() => searchParams.get('status') || '');
  const [category, setCategory] = useState(() => searchParams.get('category') || '');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const nextStatus = searchParams.get('status') || '';
    const nextCategory = searchParams.get('category') || '';
    setStatus(nextStatus);
    setCategory(nextCategory);
    setPage(1);
  }, [searchParams]);

  useEffect(() => {
    categoryApi.listCategories(token).then((res) => setCategories(res.data)).catch(() => {});
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    requestApi
      .listRequests(token, { page, search, status, category })
      .then((res) => {
        if (!cancelled) {
          setData(res.data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          showError(err.message);
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
  }, [token, page, search, status, category]);

  const title =
    user.role === 'admin'
      ? 'All requests'
      : user.role === 'officer'
        ? 'Assigned requests'
        : 'My requests';

  const showRequester = user.role === 'admin' || user.role === 'officer';

  return (
    <DashboardLayout title={title}>
      <div className="card filters filters-wide">
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
            const next = e.target.value;
            setPage(1);
            setStatus(next);
            const params = new URLSearchParams(searchParams);
            if (next) {
              params.set('status', next);
            } else {
              params.delete('status');
            }
            setSearchParams(params, { replace: true });
          }}
        >
          {STATUS_OPTIONS.map((value) => (
            <option key={value || 'all'} value={value}>
              {value ? value.replace('_', ' ') : 'All statuses'}
            </option>
          ))}
        </select>
        <select
          value={category}
          onChange={(e) => {
            setPage(1);
            setCategory(e.target.value);
          }}
        >
          <option value="">All categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {loading && <LoadingSpinner layout="section" label="Loading requests…" />}

      {!loading && data.items.length === 0 && (
        <p className="muted">No requests found.</p>
      )}

      {!loading && data.items.length > 0 && (
        <section className="card table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Location</th>
                <th>Category</th>
                {showRequester && <th>Requester</th>}
                <th>Status</th>
                <th>Time to fix</th>
                <th>Rating</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <tr key={item.id} className="table-row-hover">
                  <td>
                    <Link to={`/requests/${item.id}`}>{item.title}</Link>
                  </td>
                  <td>{item.location}</td>
                  <td>{item.category?.name || '—'}</td>
                  {showRequester && <td>{item.requester?.fullName || '—'}</td>}
                  <td><StatusBadge status={item.status} /></td>
                  <td>{item.resolutionDuration || '—'}</td>
                  <td>
                    {item.officerRating != null ? `${item.officerRating} ★` : '—'}
                  </td>
                  <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

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
    </DashboardLayout>
  );
}
