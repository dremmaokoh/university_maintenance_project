import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout.jsx';
import PageHeader from '../components/admin/PageHeader.jsx';
import EmptyState from '../components/admin/EmptyState.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import SimplePieChart from '../components/SimplePieChart.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { memberTypeLabel } from '../utils/memberTypeLabel.js';
import * as dashboardApi from '../api/dashboardApi.js';
import * as reportApi from '../api/reportApi.js';
import * as requestApi from '../api/requestApi.js';
const ATTENTION_STATUSES = new Set(['pending', 'assigned']);

export default function DashboardPage() {
  const { token, user } = useAuth();
  const { showError } = useToast();
  const [overview, setOverview] = useState(null);
  const [reportSummary, setReportSummary] = useState(null);
  const [attentionItems, setAttentionItems] = useState([]);
  const [loadFailed, setLoadFailed] = useState(false);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    let cancelled = false;

    dashboardApi
      .getDashboardOverview(token)
      .then((res) => {
        if (!cancelled) {
          setOverview(res.data);
          setLoadFailed(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadFailed(true);
          showError(err.message);
        }
      });

    if (isAdmin) {
      reportApi
        .getReportSummary(token)
        .then((res) => {
          if (!cancelled) {
            setReportSummary(res.data);
          }
        })
        .catch((err) => {
          if (!cancelled) {
            showError(err.message);
          }
        });

      requestApi
        .listRequests(token, { page: 1, limit: 30 })
        .then((res) => {
          if (!cancelled) {
            const items = res.data.items.filter((item) => ATTENTION_STATUSES.has(item.status));
            setAttentionItems(items.slice(0, 6));
          }
        })
        .catch(() => {
          if (!cancelled) {
            setAttentionItems([]);
          }
        });
    }

    return () => {
      cancelled = true;
    };
  }, [token, showError, isAdmin]);

  const stats = overview?.stats;

  const dashboardDescription = useMemo(() => {
    if (isAdmin) {
      return 'Monitor maintenance activity, prioritise open work, and keep your institution moving.';
    }
    if (user?.role === 'officer') {
      return 'Your assigned jobs and progress at a glance.';
    }
    return 'Track your maintenance requests and submit new issues when needed.';
  }, [isAdmin, user?.role]);

  const greetingName = user?.fullName?.split(' ')[0];

  return (
    <DashboardLayout>
      <PageHeader
        title={greetingName ? `Overview, ${greetingName}` : 'Overview'}
        description={dashboardDescription}
      />

      {!overview && !loadFailed && <LoadingSpinner layout="section" label="Loading dashboard…" />}

      {stats && (
        <div className="admin-kpi-grid">
          <Link to="/requests" className="kpi-card kpi-card--total">
            <p className="kpi-card__label">Total requests</p>
            <p className="kpi-card__value">{stats.total}</p>
            <span className="kpi-card__accent" aria-hidden="true" />
          </Link>
          <Link to="/requests?status=pending" className="kpi-card kpi-card--pending">
            <p className="kpi-card__label">Pending</p>
            <p className="kpi-card__value">{stats.pending}</p>
            <span className="kpi-card__accent" aria-hidden="true" />
          </Link>
          <Link to="/requests?status=in_progress" className="kpi-card kpi-card--progress">
            <p className="kpi-card__label">In progress</p>
            <p className="kpi-card__value">{stats.inProgress}</p>
            <span className="kpi-card__accent" aria-hidden="true" />
          </Link>
          <Link to="/requests?status=completed" className="kpi-card kpi-card--done">
            <p className="kpi-card__label">Completed</p>
            <p className="kpi-card__value">{stats.completed}</p>
            <span className="kpi-card__accent" aria-hidden="true" />
          </Link>
        </div>
      )}

      {isAdmin && (
        <section className="card table-card">
          <div className="table-header">
            <div>
              <h2 className="admin-section__title">Needs attention</h2>
              <p className="admin-section__lead">Pending and assigned requests that may need action.</p>
            </div>
            <Link to="/requests?status=pending">View pending</Link>
          </div>
          {attentionItems.length === 0 && (
            <EmptyState
              title="Nothing urgent right now"
              message="New submissions and unassigned work will appear here."
            />
          )}
          {attentionItems.length > 0 && (
            <div className="table-scroll">
              <table className="data-table data-table--comfortable">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Location</th>
                    <th>Category</th>
                    <th>Requester</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {attentionItems.map((item) => (
                    <tr key={item.id} className="table-row-hover">
                      <td>
                        <Link className="data-table__title-link" to={`/requests/${item.id}`}>
                          {item.title}
                        </Link>
                      </td>
                      <td>{item.location}</td>
                      <td>{item.category?.name || '—'}</td>
                      <td>
                        {item.requester?.fullName || '—'}
                        {item.requester?.memberType
                          ? ` (${memberTypeLabel(item.requester.memberType)})`
                          : ''}
                      </td>
                      <td><StatusBadge status={item.status} /></td>
                      <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                      <td>
                        <Link to={`/requests/${item.id}`}>View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {isAdmin && (
        <section className="card table-card">
          <div className="table-header">
            <div>
              <h2 className="admin-section__title">Recent requests</h2>
              <p className="admin-section__lead">Latest activity in your organisation.</p>
            </div>
            <Link to="/requests">View all</Link>
          </div>
          {overview?.recentRequests?.length === 0 && (
            <EmptyState title="No requests yet" message="New maintenance requests will show up here." />
          )}
          {overview?.recentRequests?.length > 0 && (
            <div className="table-scroll">
              <table className="data-table data-table--comfortable">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Location</th>
                    {isAdmin && <th>Category</th>}
                    {isAdmin && <th>Requester</th>}
                    <th>Status</th>
                    <th>Date</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {overview.recentRequests.map((item) => (
                    <tr key={item.id} className="table-row-hover">
                      <td>
                        <Link className="data-table__title-link" to={`/requests/${item.id}`}>
                          {item.title}
                        </Link>
                      </td>
                      <td>{item.location}</td>
                      {isAdmin && <td>{item.category?.name || '—'}</td>}
                      {isAdmin && (
                        <td>
                          {item.requester?.fullName || '—'}
                          {item.requester?.memberType
                            ? ` (${memberTypeLabel(item.requester.memberType)})`
                            : ''}
                        </td>
                      )}
                      <td><StatusBadge status={item.status} /></td>
                      <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                      <td>
                        <Link to={`/requests/${item.id}`}>View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {isAdmin && (
        <section className="card dashboard-charts-card">
          <div className="table-header">
            <div>
              <h2 className="admin-section__title">Request breakdown</h2>
              <p className="admin-section__lead">
                Distribution by status and category. Export detailed lists from{' '}
                <Link to="/requests">All requests</Link>.
              </p>
            </div>
          </div>
          {!reportSummary && !loadFailed && <LoadingSpinner layout="section" label="Loading charts…" />}
          {reportSummary && (
            <div className="grid-two pie-charts-grid">
              <SimplePieChart
                title="By status"
                rows={reportSummary.byStatus}
                labelKey="status"
                valueKey="count"
              />
              <SimplePieChart
                title="By category"
                rows={reportSummary.byCategory}
                labelKey="category"
                valueKey="count"
              />
            </div>
          )}
        </section>
      )}

    </DashboardLayout>
  );
}
