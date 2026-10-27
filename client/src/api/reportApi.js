import { apiRequest } from './client.js';

export function getReportSummary(token) {
  return apiRequest('/reports/summary', { token });
}
