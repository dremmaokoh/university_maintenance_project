import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import LoadingSpinner from './components/LoadingSpinner.jsx';
import { useAuth } from './context/AuthContext.jsx';
import WelcomePage from './pages/WelcomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import StudentRegisterPage from './pages/StudentRegisterPage.jsx';
import OrgLoginPage from './pages/OrgLoginPage.jsx';
import CreateAdminPage from './pages/CreateAdminPage.jsx';
import InviteAcceptPage from './pages/InviteAcceptPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import RequestListPage from './pages/RequestListPage.jsx';
import RequestDetailPage from './pages/RequestDetailPage.jsx';
import CreateRequestPage from './pages/CreateRequestPage.jsx';
import InviteUsersPage from './pages/InviteUsersPage.jsx';
import CategoriesPage from './pages/CategoriesPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';

function DashboardRoute() {
  const { user, loading } = useAuth();
  if (loading) {
    return <LoadingSpinner layout="page" />;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role === 'student' || user.role === 'officer') {
    return <Navigate to="/requests" replace />;
  }
  return <DashboardPage />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/login/forgot" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      <Route path="/o/:orgSlug/register" element={<StudentRegisterPage />} />
      <Route path="/o/:orgSlug/login" element={<OrgLoginPage />} />
      <Route path="/o/:orgSlug/login/forgot" element={<ForgotPasswordPage />} />
      <Route path="/student/register" element={<Navigate to="/" replace />} />
      <Route path="/register" element={<Navigate to="/" replace />} />
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
        path="/categories"
        element={
          <ProtectedRoute roles={['admin', 'officer']}>
            <CategoriesPage />
          </ProtectedRoute>
        }
      />
      <Route path="/reports" element={<Navigate to="/dashboard" replace />} />
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
