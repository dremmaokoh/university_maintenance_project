import { apiRequest } from './client.js';

export function createInvite(token, body) {
  return apiRequest('/invites', { method: 'POST', token, body });
}

export function getInvitePreview(inviteToken) {
  return apiRequest(`/invites/${inviteToken}`);
}

export function acceptInvite(inviteToken, password) {
  return apiRequest(`/invites/${inviteToken}/accept`, {
    method: 'POST',
    body: { password }
  });
}
