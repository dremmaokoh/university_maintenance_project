import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Layout({ title, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    const slug = user?.organisation?.slug;
    const isStudent = user?.role === 'student';
    logout();
    if (isStudent && slug) {
      navigate(`/o/${slug}/login`);
      return;
    }
    navigate('/login');
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="brand">University Maintenance</p>
          <h1>{title}</h1>
        </div>
        <div className="header-actions">
          <span className="user-pill">{user?.fullName} ({user?.role})</span>
          <button type="button" className="btn btn-secondary" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>
      <nav className="app-nav">
        <Link to="/dashboard">Dashboard</Link>
        {user?.role === 'student' && (
          <>
            <Link to="/requests/new">New request</Link>
            <Link to="/requests">My requests</Link>
          </>
        )}
        {user?.role === 'officer' && <Link to="/requests">Assigned requests</Link>}
        {user?.role === 'admin' && (
          <>
            <Link to="/requests">All requests</Link>
            <Link to="/admin/invites">Invite users</Link>
            <Link to="/reports">Reports</Link>
          </>
        )}
      </nav>
      <main className="app-main">{children}</main>
    </div>
  );
}
