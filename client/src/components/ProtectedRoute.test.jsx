import { describe, it, expect } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { screen } from '@testing-library/react';
import ProtectedRoute from './ProtectedRoute.jsx';
import { renderWithProviders, sampleUser } from '../test/renderWithProviders.jsx';

function AppShell() {
  return (
    <Routes>
      <Route path="/login" element={<p>Login screen</p>} />
      <Route path="/" element={<p>Home screen</p>} />
      <Route
        path="/requests/new"
        element={
          <ProtectedRoute roles={['student']}>
            <p>New request screen</p>
          </ProtectedRoute>
        }
      />
      <Route
        path="/requests"
        element={
          <ProtectedRoute>
            <p>Request list screen</p>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

describe('ProtectedRoute', () => {
  it('sends guests to login', async () => {
    renderWithProviders(<AppShell />, {
      user: null,
      route: '/requests'
    });

    expect(await screen.findByText('Login screen')).toBeInTheDocument();
  });

  it('lets an authenticated student open their requests', async () => {
    renderWithProviders(<AppShell />, {
      user: sampleUser({ role: 'student' }),
      route: '/requests'
    });

    expect(await screen.findByText('Request list screen')).toBeInTheDocument();
  });

  it('blocks officers from the student-only new request page', async () => {
    renderWithProviders(<AppShell />, {
      user: sampleUser({ role: 'officer' }),
      route: '/requests/new'
    });

    expect(await screen.findByText('Home screen')).toBeInTheDocument();
  });
});
