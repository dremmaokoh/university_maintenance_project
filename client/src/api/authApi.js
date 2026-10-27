import { apiRequest } from './client.js';

export function canCreateOrganisation(email) {
  const qs = email ? `?email=${encodeURIComponent(email)}` : '';
  return apiRequest(`/auth/can-create-organisation${qs}`);
}

export function setupAdmin(payload) {
  return apiRequest('/auth/setup-admin', { method: 'POST', body: payload });
}

export function registerStudent(payload) {
  return apiRequest('/auth/register', { method: 'POST', body: payload });
}

export function login(payload) {
  return apiRequest('/auth/login', { method: 'POST', body: payload });
}

export function getMe(token) {
  return apiRequest('/auth/me', { token });
}

export function forgotPassword(payload) {
  return apiRequest('/auth/forgot-password', { method: 'POST', body: payload });
}

export function getPasswordResetPreview(token) {
  return apiRequest(`/auth/reset-password/${token}`);
}

export function completePasswordReset(token, password) {
  return apiRequest(`/auth/reset-password/${token}`, {
    method: 'POST',
    body: { password }
  });
}
