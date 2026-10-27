import { apiRequest } from './client.js';

export function listOfficers(token) {
  return apiRequest('/users/officers', { token });
}

export function listTeamMembers(token) {
  return apiRequest('/users', { token });
}

export function updateTeamMember(token, userId, body) {
  return apiRequest(`/users/${userId}`, { method: 'PATCH', token, body });
}

export function getTeamMemberProfile(token, userId) {
  return apiRequest(`/users/${userId}/profile`, { token });
}

export function getTeamStats(token) {
  return apiRequest('/users/team/stats', { token });
}

export function getOrgMemberStats(token) {
  return apiRequest('/users/members/stats', { token });
}

export function exportTeamMembers(token) {
  return apiRequest('/users/team/export', { token });
}

export function listOrgMembers(token, query = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  });
  const qs = params.toString();
  return apiRequest(`/users/members${qs ? `?${qs}` : ''}`, { token });
}

export function exportOrgMembers(token, query = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  });
  const qs = params.toString();
  return apiRequest(`/users/members/export${qs ? `?${qs}` : ''}`, { token });
}
