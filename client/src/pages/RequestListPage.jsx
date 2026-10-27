import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout.jsx';
import PageHeader from '../components/admin/PageHeader.jsx';
import EmptyState from '../components/admin/EmptyState.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { memberTypeLabel } from '../utils/memberTypeLabel.js';
import { formatDisplayDate } from '../utils/formatDisplayDate.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import * as requestApi from '../api/requestApi.js';
import * as categoryApi from '../api/categoryApi.js';
import * as dashboardApi from '../api/dashboardApi.js';
import { downloadRequestsCsv } from '../utils/downloadRequestsCsv.js';

const STATUS_OPTIONS = ['', 'pending', 'assigned', 'in_progress', 'completed'];

export default function RequestListPage() {
  const { token, user } = useAuth();
  const { showError, showSuccess } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState({ items: [], page: 1, totalPages: 1 });
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(() => searchParams.get('status') || '');
  const [category, setCategory] = useState(() => searchParams.get('category') || '');
  const [order, setOrder] = useState(() => searchParams.get('order') || 'desc');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [studentStats, setStudentStats] = useState(null);
  const [officerStats, setOfficerStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const isStudent = user.role === 'student';
  const isOfficer = user.role === 'officer';
  const canExportCsv = user.role === 'admin' || isOfficer;
  const isAdmin = user.role === 'admin';

  const pageTitle = isAdmin
    ? 'All requests'
    : isOfficer
      ? 'My Work'
      : 'My Requests';
  const pageDescription = isStudent
    ? 'Submit maintenance issues and track their progress in one place.'
    : isOfficer
      ? 'Manage your assigned maintenance jobs, track progress, and review completed work.'
      : 'Search, filter, and manage maintenance requests across your institution.';

  useEffect(() => {
    const nextStatus = searchParams.get('status') || '';
    const nextCategory = searchParams.get('category') || '';
    const nextOrder = searchParams.get('order') || 'desc';
    setStatus(nextStatus);
    setCategory(nextCategory);
    setOrder(nextOrder);
    setPage(1);
  }, [searchParams]);

  useEffect(() => {
    categoryApi.listCategories(token).then((res) => setCategories(res.data)).catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!isStudent) {
      return;
    }
    setStatsLoading(true);
    dashboardApi
      .getDashboardOverview(token)
      .then((res) => setStudentStats(res.data.stats))
      .catch((err) => showError(err.message))
      .finally(() => setStatsLoading(false));
  }, [token, isStudent, showError]);

  useEffect(() => {
    if (!isOfficer) {
      return;
    }
    setStatsLoading(true);
    requestApi
      .getOfficerWorkStats(token)
      .then((res) => setOfficerStats(res.data))
      .catch((err) => showError(err.message))
      .finally(() => setStatsLoading(false));
  }, [token, isOfficer, showError]);

  const loadRequests = useCallback(() => {
    setLoading(true);
    setListError(null);
    return requestApi
      .listRequests(token, { page, search, status, category, order })
      .then((res) => setData(res.data))
      .catch((err) => {
        setListError(err.message);
        showError(err.message);
      })
      .finally(() => setLoading(false));
  }, [token, page, search, status, category, order, showError]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const showRequester = isAdmin || isOfficer;
  const hasActiveFilters = Boolean(search || status || category || order !== 'desc');

  function applyStatusFilter(nextStatus) {
    setPage(1);
    setStatus(nextStatus);
    const params = new URLSearchParams(searchParams);
    if (nextStatus) {
      params.set('status', nextStatus);
    } else {
      params.delete('status');
    }
    setSearchParams(params, { replace: true });
  }

  function clearFilters() {
    setSearch('');
    setStatus('');
    setCategory('');
    setOrder('desc');
    setPage(1);
    setSearchParams({}, { replace: true });
  }

  async function handleExportCsv() {
    setExporting(true);
    try {
      const res = await requestApi.exportRequests(token, { search, status, category, order });
      downloadRequestsCsv(res.data.items, {
        role: user.role,
        organisationName: user.organisation?.name
      });
      showSuccess('CSV downloaded.');
    } catch (err) {
      showError(err.message);
    } finally {
      setExporting(false);
    }
  }

  function kpiCardClass(suffix, active) {
    return `kpi-card kpi-card--filter kpi-card--${suffix}${active ? ' kpi-card--active' : ''}`;
  }

  const emptyMessage = hasActiveFilters
    ? 'No requests match your search or filters.'
    : isStudent
      ? 'You have not submitted any maintenance requests yet.'
      : isOfficer
        ? "You don't have any assigned requests yet."
        : 'There are no requests to show yet.';

  return (
    <DashboardLayout>
      <PageHeader
        title={pageTitle}
        description={pageDescription}
        actions={
          isStudent ? (
            <Link to="/requests/new" className="btn btn-primary">
              + New Request
            </Link>
          ) : canExportCsv ? (
            <button
              type="button"
              className="btn btn-primary"
              disabled={exporting || loading}
              onClick={handleExportCsv}
            >
              {exporting ? 'Exporting…' : 'Download CSV'}
            </button>
          ) : null
        }
      />

      {isStudent && (
        <>
          {statsLoading && <LoadingSpinner layout="section" label="Loading summary…" />}
          {!statsLoading && studentStats && (
            <div className="admin-kpi-grid">
              <button
                type="button"
                className={kpiCardClass('total', !status)}
                onClick={() => applyStatusFilter('')}
              >
                <p className="kpi-card__label">Total Requests</p>
                <p className="kpi-card__value">{studentStats.total}</p>
                <span className="kpi-card__accent" aria-hidden="true" />
              </button>
              <button
                type="button"
                className={kpiCardClass('pending', status === 'pending')}
                onClick={() => applyStatusFilter('pending')}
              >
                <p className="kpi-card__label">Pending</p>
                <p className="kpi-card__value">{studentStats.pending}</p>
                <span className="kpi-card__accent" aria-hidden="true" />
              </button>
              <button
                type="button"
                className={kpiCardClass('progress', status === 'in_progress')}
                onClick={() => applyStatusFilter('in_progress')}
              >
                <p className="kpi-card__label">In Progress</p>
                <p className="kpi-card__value">{studentStats.inProgress}</p>
                <span className="kpi-card__accent" aria-hidden="true" />
              </button>
              <button
                type="button"
                className={kpiCardClass('done', status === 'completed')}
                onClick={() => applyStatusFilter('completed')}
              >
                <p className="kpi-card__label">Completed</p>
                <p className="kpi-card__value">{studentStats.completed}</p>
                <span className="kpi-card__accent" aria-hidden="true" />
              </button>
            </div>
          )}
        </>
      )}

      {isOfficer && (
        <>
          {statsLoading && <LoadingSpinner layout="section" label="Loading summary…" />}
          {!statsLoading && officerStats && (
            <div className="admin-kpi-grid">
              <button
                type="button"
                className={kpiCardClass('total', !status)}
                onClick={() => applyStatusFilter('')}
              >
                <p className="kpi-card__label">Total Assigned</p>
                <p className="kpi-card__value">{officerStats.total}</p>
                <span className="kpi-card__accent" aria-hidden="true" />
              </button>
              <button
                type="button"
                className={kpiCardClass('pending', status === 'assigned')}
                onClick={() => applyStatusFilter('assigned')}
              >
                <p className="kpi-card__label">Pending</p>
                <p className="kpi-card__value">{officerStats.pending}</p>
                <span className="kpi-card__accent" aria-hidden="true" />
              </button>
              <button
                type="button"
                className={kpiCardClass('progress', status === 'in_progress')}
                onClick={() => applyStatusFilter('in_progress')}
              >
                <p className="kpi-card__label">In Progress</p>
                <p className="kpi-card__value">{officerStats.inProgress}</p>
                <span className="kpi-card__accent" aria-hidden="true" />
              </button>
              <button
                type="button"
                className={kpiCardClass('done', status === 'completed')}
                onClick={() => applyStatusFilter('completed')}
              >
                <p className="kpi-card__label">Completed</p>
                <p className="kpi-card__value">{officerStats.completed}</p>
                <span className="kpi-card__accent" aria-hidden="true" />
              </button>
            </div>
          )}
        </>
      )}

      {(isStudent || isOfficer) && (
        <div className="student-requests-section">
          <h2 className="admin-section__title">
            {isStudent ? 'All My Requests' : 'My Assigned Requests'}
          </h2>
          <p className="admin-section__lead">
            {isStudent
              ? 'Search and filter your maintenance requests.'
              : 'Search and filter jobs assigned to you.'}
          </p>
        </div>
      )}

      <div className="card filter-toolbar">
        <input
          type="search"
          placeholder="Search title, description, location"
          value={search}
          aria-label="Search requests"
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
        <select
          value={status}
          aria-label="Filter by status"
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
          aria-label="Filter by category"
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
        <select
          value={order}
          aria-label="Sort requests"
          onChange={(e) => {
            const next = e.target.value;
            setPage(1);
            setOrder(next);
            const params = new URLSearchParams(searchParams);
            if (next && next !== 'desc') {
              params.set('order', next);
            } else {
              params.delete('order');
            }
            setSearchParams(params, { replace: true });
          }}
        >
          <option value="desc">Newest first</option>
          <option value="asc">Oldest first</option>
        </select>
        {hasActiveFilters && (
          <button type="button" className="btn btn-secondary" onClick={clearFilters}>
            Clear filters
          </button>
        )}
      </div>

      {loading && <LoadingSpinner layout="section" label="Loading requests…" />}

      {!loading && listError && (
        <EmptyState
          title="Could not load requests"
          message={listError}
          action={
            <button type="button" className="btn btn-secondary" onClick={loadRequests}>
              Try again
            </button>
          }
        />
      )}

      {!loading && !listError && data.items.length === 0 && (
        <EmptyState
          title="No requests found"
          message={emptyMessage}
          action={
            hasActiveFilters ? (
              <button type="button" className="btn btn-secondary" onClick={clearFilters}>
                Clear filters
              </button>
            ) : isStudent ? (
              <Link to="/requests/new" className="btn btn-primary">
                + New Request
              </Link>
            ) : null
          }
        />
      )}

      {!loading && !listError && data.items.length > 0 && (
        <section className="card table-card">
          <div className="table-scroll">
            <table className="data-table data-table--comfortable">
              <thead>
                <tr>
                  <th>{isStudent ? 'Request' : 'Request Title'}</th>
                  <th>Location</th>
                  <th>Category</th>
                  {showRequester && <th>Requester</th>}
                  <th>Status</th>
                  <th>
                    {isOfficer ? 'Date Assigned' : isStudent ? 'Date Submitted' : 'Date'}
                  </th>
                  <th>Time to Fix</th>
                  <th>Rating</th>
                  {(isStudent || isOfficer) && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => (
                  <tr key={item.id} className="table-row-hover">
                    <td>
                      {isStudent ? (
                        item.title
                      ) : (
                        <Link className="data-table__title-link" to={`/requests/${item.id}`}>
                          {item.title}
                        </Link>
                      )}
                    </td>
                    <td>{item.location}</td>
                    <td>{item.category?.name || '—'}</td>
                    {showRequester && (
                      <td>
                        {item.requester?.fullName || '—'}
                        {item.requester?.memberType
                          ? ` (${memberTypeLabel(item.requester.memberType)})`
                          : ''}
                      </td>
                    )}
                    <td><StatusBadge status={item.status} /></td>
                    <td>
                      {formatDisplayDate(isOfficer ? item.assignedAt : item.createdAt)}
                    </td>
                    <td>{item.resolutionDuration || '—'}</td>
                    <td>
                      {item.officerRating != null ? `${item.officerRating} ★` : '—'}
                    </td>
                    {(isStudent || isOfficer) && (
                      <td>
                        <Link to={`/requests/${item.id}`}>View</Link>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {!loading && !listError && data.totalPages > 1 && (
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
      )}
    </DashboardLayout>
  );
}
