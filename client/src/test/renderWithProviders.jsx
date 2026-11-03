import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render } from '@testing-library/react';
import { AuthContext } from '../context/AuthContext.jsx';
import { ToastProvider } from '../context/ToastContext.jsx';

export function sampleUser(overrides = {}) {
  return {
    id: 'user-1',
    fullName: 'Sam Student',
    email: 'student@test.edu',
    role: 'student',
    memberType: 'student',
    organisationId: 'org-1',
    organisation: { id: 'org-1', name: 'Test University', slug: 'test-university' },
    ...overrides
  };
}

export function renderWithProviders(
  ui,
  {
    user = sampleUser(),
    token = 'test-token',
    route = '/',
    path,
    auth = {},
    ...renderOptions
  } = {}
) {
  const authValue = {
    token,
    user,
    loading: false,
    login: async () => ({}),
    logout: () => {},
    registerStudent: async () => user,
    setSession: () => {},
    ...auth
  };

  function Wrapper({ children }) {
    const routed = path ? (
      <Routes>
        <Route path={path} element={children} />
      </Routes>
    ) : (
      children
    );

    return (
      <MemoryRouter initialEntries={[route]}>
        <ToastProvider>
          <AuthContext.Provider value={authValue}>{routed}</AuthContext.Provider>
        </ToastProvider>
      </MemoryRouter>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    authValue
  };
}
