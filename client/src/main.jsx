import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import InactivityLogout from './components/InactivityLogout.jsx';
import './index.css';
import './styles/admin.css';
import './styles/request-form.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <ToastProvider>
        <AuthProvider>
          <InactivityLogout />
          <App />
        </AuthProvider>
      </ToastProvider>
    </HashRouter>
  </StrictMode>
);
