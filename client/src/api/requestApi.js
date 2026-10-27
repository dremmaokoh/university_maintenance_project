import { apiBlobRequest, apiFormRequest, apiRequest } from './client.js';

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

export function exportRequests(token, params = {}) {
  return apiRequest(`/requests/export${queryString(params)}`, { token });
}

export function getOfficerWorkStats(token) {
  return apiRequest('/requests/work/stats', { token });
}

export function getRequest(token, id) {
  return apiRequest(`/requests/${id}`, { token });
}

export function createRequest(token, body, evidenceFile) {
  if (evidenceFile) {
    const form = new FormData();
    form.append('title', body.title);
    form.append('description', body.description);
    form.append('location', body.location);
    form.append('categoryId', body.categoryId);
    form.append('evidence', evidenceFile);
    return apiFormRequest('/requests', { method: 'POST', token, body: form });
  }
  return apiRequest('/requests', { method: 'POST', token, body });
}

export function fetchRequestEvidence(token, id) {
  return apiBlobRequest(`/requests/${id}/evidence`, { token });
}

export function assignRequest(token, id, officerId) {
  return apiRequest(`/requests/${id}/assign`, {
    method: 'POST',
    token,
    body: { officerId }
  });
}

export function unassignRequest(token, id) {
  return apiRequest(`/requests/${id}/unassign`, { method: 'POST', token });
}

export function updateRequestStatus(token, id, body) {
  return apiRequest(`/requests/${id}/status`, { method: 'PATCH', token, body });
}

export function getRequestHistory(token, id) {
  return apiRequest(`/requests/${id}/history`, { token });
}

export function listRequestComments(token, id) {
  return apiRequest(`/requests/${id}/comments`, { token });
}

export function addRequestComment(token, id, body) {
  return apiRequest(`/requests/${id}/comments`, {
    method: 'POST',
    token,
    body: { body }
  });
}

export function rateRequest(token, id, stars) {
  return apiRequest(`/requests/${id}/rating`, {
    method: 'POST',
    token,
    body: { stars }
  });
}
