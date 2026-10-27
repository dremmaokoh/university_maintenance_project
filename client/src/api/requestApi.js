import { apiRequest } from './client.js';

function queryString(params) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, value);
    }
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export function listRequests(token, params = {}) {
  return apiRequest(`/requests${queryString(params)}`, { token });
}

export function getRequest(token, id) {
  return apiRequest(`/requests/${id}`, { token });
}

export function createRequest(token, body) {
  return apiRequest('/requests', { method: 'POST', token, body });
}

export function assignRequest(token, id, officerId) {
  return apiRequest(`/requests/${id}/assign`, {
    method: 'POST',
    token,
    body: { officerId }
  });
}

export function updateRequestStatus(token, id, body) {
  return apiRequest(`/requests/${id}/status`, { method: 'PATCH', token, body });
}

export function getRequestHistory(token, id) {
  return apiRequest(`/requests/${id}/history`, { token });
}
