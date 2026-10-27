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
