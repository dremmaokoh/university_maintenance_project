import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from './LoginPage.jsx';
import { renderWithProviders } from '../test/renderWithProviders.jsx';

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows an error when sign-in fails', async () => {
    const user = userEvent.setup();
    const login = vi.fn().mockRejectedValue(new Error('Incorrect password.'));

    renderWithProviders(<LoginPage />, {
      user: null,
      auth: { login }
    });

    await user.type(screen.getByLabelText(/email/i), 'admin@test.edu');
    await user.type(screen.getByLabelText(/password/i, { selector: 'input' }), 'wrong-password');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByText((_, element) => (
      element?.classList?.contains('login-form-error')
      && element.textContent === 'Incorrect password.'
    ))).toBeInTheDocument();
    expect(login).toHaveBeenCalled();
  });

  it('disables the submit button while logging in', async () => {
    const user = userEvent.setup();
    let resolveLogin;
    const login = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveLogin = resolve;
        })
    );

    renderWithProviders(<LoginPage />, {
      user: null,
      auth: { login }
    });

    await user.type(screen.getByLabelText(/email/i), 'admin@test.edu');
    await user.type(screen.getByLabelText(/password/i, { selector: 'input' }), 'password123');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(screen.getByRole('button', { name: /logging in/i })).toBeDisabled();
    resolveLogin({ user: { role: 'admin' }, token: 't' });
    await waitFor(() => {
      expect(login).toHaveBeenCalled();
    });
  });
});
