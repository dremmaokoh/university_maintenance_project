import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateRequestPage from './CreateRequestPage.jsx';
import { renderWithProviders } from '../test/renderWithProviders.jsx';
import * as categoryApi from '../api/categoryApi.js';
import * as requestApi from '../api/requestApi.js';

vi.mock('../api/categoryApi.js', () => ({
  listCategories: vi.fn()
}));

vi.mock('../api/requestApi.js', () => ({
  createRequest: vi.fn()
}));

describe('CreateRequestPage', () => {
  beforeEach(() => {
    categoryApi.listCategories.mockResolvedValue({
      data: [{ id: 'cat-1', name: 'Electrical' }]
    });
    requestApi.createRequest.mockResolvedValue({
      data: { id: 'req-1', title: 'Broken projector' }
    });
  });

  it('submits a new request and disables the button while sending', async () => {
    const user = userEvent.setup();
    let resolveCreate;
    requestApi.createRequest.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCreate = resolve;
        })
    );

    renderWithProviders(<CreateRequestPage />, { route: '/requests/new' });

    await screen.findByRole('option', { name: 'Electrical' });
    await user.type(screen.getByLabelText(/request title/i), 'Broken projector');
    await user.selectOptions(screen.getByLabelText(/category/i), 'cat-1');
    await user.type(
      screen.getByLabelText(/description/i),
      'The projector in the lecture hall will not turn on.'
    );
    await user.type(screen.getByLabelText(/location/i), 'Block B, Room 204');

    fireEvent.click(screen.getByRole('button', { name: /submit request/i }));
    expect(screen.getByRole('button', { name: /submitting/i })).toBeDisabled();

    resolveCreate({ data: { id: 'req-1' } });
    await Promise.resolve();

    expect(requestApi.createRequest).toHaveBeenCalled();
    const [, payload] = requestApi.createRequest.mock.calls[0];
    expect(payload).toMatchObject({
      title: 'Broken projector',
      location: 'Block B, Room 204',
      categoryId: 'cat-1'
    });
  });

  it('shows an API error if submission fails', async () => {
    const user = userEvent.setup();
    requestApi.createRequest.mockRejectedValue(new Error('Could not save request.'));

    renderWithProviders(<CreateRequestPage />, { route: '/requests/new' });
    await screen.findByRole('option', { name: 'Electrical' });

    await user.type(screen.getByLabelText(/request title/i), 'Broken projector');
    await user.selectOptions(screen.getByLabelText(/category/i), 'cat-1');
    await user.type(screen.getByLabelText(/description/i), 'Needs repair.');
    await user.type(screen.getByLabelText(/location/i), 'Lab 3');
    await user.click(screen.getByRole('button', { name: /submit request/i }));

    expect(await screen.findByText('Could not save request.')).toBeInTheDocument();
  });
});
