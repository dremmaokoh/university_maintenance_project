import { apiRequest } from './client.js';

export function getDashboardOverview(token) {
  return apiRequest('/dashboard/overview', { token });
}
