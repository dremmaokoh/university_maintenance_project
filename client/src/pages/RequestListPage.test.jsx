import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import RequestListPage from './RequestListPage.jsx';
import { renderWithProviders, sampleUser } from '../test/renderWithProviders.jsx';
import * as requestApi from '../api/requestApi.js';
import * as categoryApi from '../api/categoryApi.js';
import * as dashboardApi from '../api/dashboardApi.js';

vi.mock('../api/requestApi.js', () => ({
  listRequests: vi.fn(),
  exportRequests: vi.fn(),
  getOfficerWorkStats: vi.fn()
}));

vi.mock('../api/categoryApi.js', () => ({
  listCategories: vi.fn()
}));

vi.mock('../api/dashboardApi.js', () => ({
  getDashboardOverview: vi.fn()
}));

const sampleRequest = {
  id: 'req-1',
  title: 'Broken projector',
  location: 'Hall A',
  status: 'pending',
  category: { id: 'cat-1', name: 'Electrical' },
  requester: { fullName: 'Sam Student', memberType: 'student' },
  createdAt: '2026-10-01T10:00:00.000Z',
  resolutionDuration: null,
  officerRating: null
};

describe('RequestListPage', () => {
  beforeEach(() => {
    categoryApi.listCategories.mockResolvedValue({ data: [] });
    dashboardApi.getDashboardOverview.mockResolvedValue({
      data: { stats: { total: 1, pending: 1, inProgress: 0, completed: 0 } }
    });
    requestApi.getOfficerWorkStats.mockResolvedValue({
      data: { total: 1, pending: 1, inProgress: 0, completed: 0 }
    });
  });

  it('shows a loading state then the student request list', async () => {
    requestApi.listRequests.mockResolvedValue({
      data: { items: [sampleRequest], page: 1, totalPages: 1, total: 1 }
    });

    renderWithProviders(<RequestListPage />, {
      user: sampleUser({ role: 'student' }),
      route: '/requests'
    });

    expect(screen.getByText('Loading requests…')).toBeInTheDocument();
    expect(await screen.findByText('Broken projector')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /\+ new request/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'My Requests' })).toBeInTheDocument();
  });

  it('shows an error state when the list fails to load', async () => {
    requestApi.listRequests.mockRejectedValue(new Error('Network down'));

    renderWithProviders(<RequestListPage />, {
      user: sampleUser({ role: 'student' }),
      route: '/requests'
    });

    expect(await screen.findByText('Could not load requests')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('uses officer copy and hides the new-request action', async () => {
    requestApi.listRequests.mockResolvedValue({
      data: { items: [sampleRequest], page: 1, totalPages: 1, total: 1 }
    });

    renderWithProviders(<RequestListPage />, {
      user: sampleUser({ role: 'officer', fullName: 'Olivia Officer' }),
      route: '/requests'
    });

    expect(await screen.findByRole('heading', { name: 'My Work' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /\+ new request/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /download csv/i })).toBeInTheDocument();
  });
});
