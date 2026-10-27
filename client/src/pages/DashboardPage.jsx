import { Link } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <Layout title="Dashboard">
      <div className="card">
        <p>Welcome, {user.fullName}.</p>
        {user.role === 'student' && (
          <p>Submit a maintenance issue or track your open requests from the navigation.</p>
        )}
        {user.role === 'officer' && (
          <p>View jobs assigned to you and update their status.</p>
        )}
        {user.role === 'admin' && (
          <p>Review requests, invite officers or admins, assign work, and view reports.</p>
        )}
        <div className="dashboard-actions">
          <Link className="btn btn-primary" to="/requests">Go to requests</Link>
          {user.role === 'admin' && (
            <Link className="btn btn-secondary" to="/admin/invites">Invite team member</Link>
          )}
        </div>
      </div>
    </Layout>
  );
}
