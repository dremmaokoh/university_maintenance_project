import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { memberTypeLabel } from '../utils/memberTypeLabel.js';
import {
  IconCategories,
  IconNewRequest,
  IconOverview,
  IconRequests,
  IconTeam
} from './admin/NavIcons.jsx';

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    const main = document.querySelector('.dashboard-main');
    if (main) {
      main.scrollTop = 0;
    }
    setNavOpen(false);
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

  const homePath =
    user?.role === 'student' || user?.role === 'officer' ? '/requests' : '/dashboard';

  const nav = [];
  if (user?.role === 'student') {
    nav.push({ to: '/requests', label: 'My Requests', end: true, icon: IconRequests });
    nav.push({ to: '/requests/new', label: 'New Request', icon: IconNewRequest });
  } else if (user?.role === 'officer') {
    nav.push({ to: '/requests', label: 'My Work', end: true, icon: IconOverview });
    nav.push({ to: '/categories', label: 'Categories', icon: IconCategories });
  } else {
    nav.push({ to: '/dashboard', label: 'Overview', end: true, icon: IconOverview });
  }

  if (user?.role === 'admin') {
    nav.push({ to: '/requests', label: 'All requests', icon: IconRequests });
    nav.push({ to: '/categories', label: 'Categories', icon: IconCategories });
    nav.push({ to: '/admin/invites', label: 'Team & Access', icon: IconTeam });
  }

  return (
    <div className={`dashboard-shell dashboard-shell--admin${navOpen ? ' sidebar-open' : ''}`}>
      {navOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close navigation menu"
          onClick={() => setNavOpen(false)}
        />
      )}

      <aside className="dashboard-sidebar" aria-label="Main navigation">
        <div className="sidebar-brand">
          <Link to={homePath} className="sidebar-logo-link" onClick={() => setNavOpen(false)}>
            <p className="sidebar-logo sidebar-logo--admin">Resolva</p>
          </Link>
          <p className="sidebar-tagline sidebar-tagline--admin">
            University maintenance &amp; service requests
          </p>
          <p className="sidebar-org sidebar-org--admin">{orgName}</p>
        </div>
        <nav className="sidebar-nav">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setNavOpen(false)}
                className={({ isActive }) =>
                  isActive
                    ? 'sidebar-link sidebar-link--admin sidebar-link-active'
                    : 'sidebar-link sidebar-link--admin'
                }
              >
                <Icon />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <p className="sidebar-user sidebar-user--admin">
            {user?.fullName}
            <span className="sidebar-user-role">
              {' '}
              ·{' '}
              {user?.role === 'student'
                ? memberTypeLabel(user.memberType)
                : user?.role}
            </span>
          </p>
          <button type="button" className="btn btn-secondary btn-block" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </aside>

      <div className="dashboard-main page-enter">
        <div className="sidebar-mobile-bar">
          <button type="button" className="sidebar-toggle" onClick={() => setNavOpen(true)}>
            Menu
          </button>
          <span className="sidebar-mobile-brand">Resolva</span>
        </div>
        <div className="dashboard-content">{children}</div>
      </div>
    </div>
  );
}
