import { useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function DashboardLayout({ title, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

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

  const orgName = user?.organisation?.name || 'Organisation';

  const nav = [];
  nav.push({ to: '/dashboard', label: 'Dashboard' });

  if (user?.role === 'student') {
    nav.push({ to: '/requests/new', label: 'New request' });
    nav.push({ to: '/requests', label: 'My requests' });
  } else if (user?.role === 'officer') {
    nav.push({ to: '/requests', label: 'Assigned requests' });
    nav.push({ to: '/categories', label: 'Categories' });
  } else if (user?.role === 'admin') {
    nav.push({ to: '/requests', label: 'All requests' });
    nav.push({ to: '/categories', label: 'Categories' });
    nav.push({ to: '/admin/invites', label: 'Team & links' });
    nav.push({ to: '/reports', label: 'Reports' });
  }

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <Link to="/dashboard" className="sidebar-logo-link">
            <p className="sidebar-logo">Resolva</p>
          </Link>
          <p className="sidebar-tagline">University Maintenance and Service Request System</p>
          <p className="sidebar-org">{orgName}</p>
        </div>
        <nav className="sidebar-nav">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              className={({ isActive }) =>
                isActive ? 'sidebar-link sidebar-link-active' : 'sidebar-link'
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <p className="sidebar-user">{user?.fullName}</p>
          <button type="button" className="btn btn-secondary btn-block" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </aside>
      <div className="dashboard-main page-enter">
        <header className="dashboard-topbar">
          <h1>{title}</h1>
          <span className="role-pill">{user?.role}</span>
        </header>
        <div className="dashboard-content">{children}</div>
      </div>
    </div>
  );
}
