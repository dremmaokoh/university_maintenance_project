import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StudentRegisterPage from './StudentRegisterPage.jsx';
import { renderWithProviders } from '../test/renderWithProviders.jsx';
import * as organisationApi from '../api/organisationApi.js';

vi.mock('../api/organisationApi.js', () => ({
  getOrganisationBySlug: vi.fn()
}));

describe('StudentRegisterPage', () => {
  beforeEach(() => {
    organisationApi.getOrganisationBySlug.mockResolvedValue({
      data: { id: 'org-1', name: 'Test University', slug: 'test-university' }
    });
  });

  it('shows validation messages for empty and invalid fields', async () => {
    const user = userEvent.setup();
    const registerStudent = vi.fn();

    renderWithProviders(<StudentRegisterPage />, {
      user: null,
      route: '/o/test-university/register',
      path: '/o/:orgSlug/register',
      auth: { registerStudent }
    });

    expect(await screen.findByText(/Registering with Test University/i)).toBeInTheDocument();

    await user.clear(screen.getByLabelText(/full name/i));
    await user.clear(screen.getByLabelText(/email/i));
    await user.clear(screen.getByLabelText(/password/i, { selector: 'input' }));
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText('Full name is required.')).toBeInTheDocument();
    expect(screen.getByText('Email is required.')).toBeInTheDocument();
    expect(screen.getByText('Password is required.')).toBeInTheDocument();
    expect(registerStudent).not.toHaveBeenCalled();
  });

  it('rejects a short password before calling the API', async () => {
    const user = userEvent.setup();
    const registerStudent = vi.fn();

    renderWithProviders(<StudentRegisterPage />, {
      user: null,
      route: '/o/test-university/register',
      path: '/o/:orgSlug/register',
      auth: { registerStudent }
    });

    await screen.findByText(/Registering with Test University/i);
    await user.type(screen.getByLabelText(/full name/i), 'Sam Student');
    await user.type(screen.getByLabelText(/email/i), 'sam@test.edu');
    await user.type(screen.getByLabelText(/password/i, { selector: 'input' }), 'short');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText('Password must be at least 8 characters.')).toBeInTheDocument();
    expect(registerStudent).not.toHaveBeenCalled();
  });

  it('submits a valid registration', async () => {
    const user = userEvent.setup();
    const registerStudent = vi.fn().mockResolvedValue({ role: 'student' });

    renderWithProviders(<StudentRegisterPage />, {
      user: null,
      route: '/o/test-university/register',
      path: '/o/:orgSlug/register',
      auth: { registerStudent }
    });

    await screen.findByText(/Registering with Test University/i);
    await user.type(screen.getByLabelText(/full name/i), 'Sam Student');
    await user.type(screen.getByLabelText(/email/i), 'sam@test.edu');
    await user.type(screen.getByLabelText(/password/i, { selector: 'input' }), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(registerStudent).toHaveBeenCalledWith(
      'test-university',
      'Sam Student',
      'sam@test.edu',
      'password123',
      'student'
    );
  });
});
