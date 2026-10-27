import { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { apiRequest } from '../api/client.js';

export default function ReportsPage() {
  const { token } = useAuth();
  const { showError } = useToast();
  const [summary, setSummary] = useState(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    apiRequest('/reports/summary', { token })
      .then((res) => {
        setSummary(res.data);
        setLoadFailed(false);
      })
      .catch((err) => {
        setLoadFailed(true);
        showError(err.message);
      });
  }, [token, showError]);

  return (
    <DashboardLayout title="Reports">
      {!summary && !loadFailed && <LoadingSpinner layout="section" label="Loading summary…" />}
      {summary && (
        <>
          <p className="card">Total requests: <strong>{summary.total}</strong></p>
          <div className="grid-two">
            <section className="card">
              <h2>By status</h2>
              <ul>
                {summary.byStatus.map((row) => (
                  <li key={row.status}>{row.status}: {row.count}</li>
                ))}
              </ul>
            </section>
            <section className="card">
              <h2>By category</h2>
              <ul>
                {summary.byCategory.map((row) => (
                  <li key={row.category}>{row.category}: {row.count}</li>
                ))}
              </ul>
            </section>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
