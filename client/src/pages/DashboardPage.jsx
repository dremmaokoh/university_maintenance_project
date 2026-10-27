import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import OrgStudentLinks from '../components/OrgStudentLinks.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import * as dashboardApi from '../api/dashboardApi.js';

export default function DashboardPage() {
  const { token, user } = useAuth();
  const { showError } = useToast();
  const [overview, setOverview] = useState(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    dashboardApi
      .getDashboardOverview(token)
      .then((res) => {
        setOverview(res.data);
        setLoadFailed(false);
      })
      .catch((err) => {
        setLoadFailed(true);
        showError(err.message);
      });
  }, [token, showError]);

  const stats = overview?.stats;

  return (
    <DashboardLayout title="Dashboard">
      {user?.role === 'admin' && (
        <OrgStudentLinks slug={user.organisation?.slug} />
      )}

      {stats && (
        <div className="stats-grid">
          <Link to="/requests" className="stat-card-link">
            <article className="card stat-card">
              <p className="stat-label">Total requests</p>
              <p className="stat-value">{stats.total}</p>
            </article>
          </Link>
          <Link to="/requests?status=pending" className="stat-card-link">
            <article className="card stat-card">
              <p className="stat-label">Pending</p>
              <p className="stat-value stat-pending">{stats.pending}</p>
            </article>
          </Link>
          <Link to="/requests?status=in_progress" className="stat-card-link">
            <article className="card stat-card">
              <p className="stat-label">In progress</p>
              <p className="stat-value stat-progress">{stats.inProgress}</p>
            </article>
          </Link>
          <Link to="/requests?status=completed" className="stat-card-link">
            <article className="card stat-card">
              <p className="stat-label">Completed</p>
              <p className="stat-value stat-done">{stats.completed}</p>
            </article>
          </Link>
        </div>
      )}

      <section className="card table-card">
        <div className="table-header">
          <h2>Recent requests</h2>
          <Link to="/requests">View all</Link>
        </div>
        {!overview && !loadFailed && <LoadingSpinner layout="section" />}
        {overview?.recentRequests?.length === 0 && (
          <p className="muted">No requests yet.</p>
        )}
        {overview?.recentRequests?.length > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Location</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {overview.recentRequests.map((item) => (
                <tr key={item.id} className="table-row-hover">
                  <td>
                    <Link to={`/requests/${item.id}`}>{item.title}</Link>
                  </td>
                  <td>{item.location}</td>
                  <td><StatusBadge status={item.status} /></td>
                  <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </DashboardLayout>
  );
}
