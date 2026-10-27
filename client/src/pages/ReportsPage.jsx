import { useEffect, useState } from 'react';
import Layout from '../components/Layout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { apiRequest } from '../api/client.js';

export default function ReportsPage() {
  const { token } = useAuth();
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest('/reports/summary', { token })
      .then((res) => setSummary(res.data))
      .catch((err) => setError(err.message));
  }, [token]);

  return (
    <Layout title="Reports">
      {error && <p className="error">{error}</p>}
      {!summary && !error && <p className="muted">Loading summary…</p>}
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
    </Layout>
  );
}
