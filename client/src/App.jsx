import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { useAuth } from './context/AuthContext.jsx';
import WelcomePage from './pages/WelcomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import StudentRegisterPage from './pages/StudentRegisterPage.jsx';
import CreateAdminPage from './pages/CreateAdminPage.jsx';
import InviteAcceptPage from './pages/InviteAcceptPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import RequestListPage from './pages/RequestListPage.jsx';
import RequestDetailPage from './pages/RequestDetailPage.jsx';
import CreateRequestPage from './pages/CreateRequestPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import InviteUsersPage from './pages/InviteUsersPage.jsx';

function DashboardRoute() {
  const { user, loading } = useAuth();
  if (loading) {
    return <p className="muted center-page">Loading…</p>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <DashboardPage />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/student/register" element={<StudentRegisterPage />} />
      <Route path="/register" element={<Navigate to="/student/register" replace />} />
      <Route path="/admin/register" element={<CreateAdminPage />} />
      <Route path="/invite/:token" element={<InviteAcceptPage />} />
      <Route path="/dashboard" element={<DashboardRoute />} />
      <Route
        path="/requests"
        element={
          <ProtectedRoute>
            <RequestListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/requests/new"
        element={
          <ProtectedRoute roles={['student']}>
            <CreateRequestPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/requests/:id"
        element={
          <ProtectedRoute>
            <RequestDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute roles={['admin']}>
            <ReportsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/invites"
        element={
          <ProtectedRoute roles={['admin']}>
            <InviteUsersPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
