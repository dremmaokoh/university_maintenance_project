import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import * as authApi from '../api/authApi.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function WelcomePage() {
  const { user, loading } = useAuth();
  const [setupAvailable, setSetupAvailable] = useState(false);

  useEffect(() => {
    authApi
      .getSetupAvailable()
      .then((res) => setSetupAvailable(res.data.setupAvailable))
      .catch(() => setSetupAvailable(false));
  }, []);

  if (loading) {
    return <p className="muted center-page">Loading…</p>;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="welcome-page">
      <div className="welcome-hero card">
        <p className="brand">University Maintenance</p>
        <h1>Service Request System</h1>
        <p className="muted">
          Submit maintenance requests, assign officers, and track progress in one place.
        </p>
        <div className="welcome-actions">
          <Link className="btn btn-primary" to="/student/register">Student sign up</Link>
          <Link className="btn btn-secondary" to="/login">Log in</Link>
        </div>
        {setupAvailable && (
          <p className="welcome-setup">
            First time here?{' '}
            <Link to="/admin/register">Create administrator account</Link>
          </p>
        )}
      </div>
    </div>
  );
}
